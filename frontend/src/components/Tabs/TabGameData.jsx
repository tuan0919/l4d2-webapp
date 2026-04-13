import React, { useEffect, useMemo, useState } from 'react';

const ROOT_LABEL = 'l4d2-sourcemod/addons/sourcemod/data';

const formatBytes = (bytes) => {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};

const formatTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const getParentPath = (value) => value.split('/').filter(Boolean).slice(0, -1).join('/');

const TabGameData = ({ addToast }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedEntryPath, setSelectedEntryPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorValue, setEditorValue] = useState('');
  const [note, setNote] = useState('Loading GameData...');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = !!selectedFile && editorValue !== selectedFile.content;

  const breadcrumbs = useMemo(() => {
    const parts = currentPath ? currentPath.split('/').filter(Boolean) : [];
    return [
      { label: 'data', path: '' },
      ...parts.map((segment, index) => ({
        label: segment,
        path: parts.slice(0, index + 1).join('/')
      }))
    ];
  }, [currentPath]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.relativePath === selectedEntryPath) || null,
    [entries, selectedEntryPath]
  );

  const confirmDiscard = () => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard them?');
  };

  const loadDirectory = async (nextPath = currentPath) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (nextPath) params.set('path', nextPath);

      const response = await fetch(`/api/gamedata/browse?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to browse GameData');
      }

      const list = Array.isArray(data.entries) ? data.entries : [];
      setCurrentPath(data.relativePath || '');
      setEntries(list);
      setSelectedEntryPath('');
      setNote(`Explorer: ${data.rootLabel || ROOT_LABEL}${data.relativePath ? `/${data.relativePath}` : ''} • ${list.length} item(s)`);
    } catch (error) {
      setEntries([]);
      setSelectedEntryPath('');
      setNote(error.message || 'Failed to browse GameData');
      addToast(error.message || 'Failed to browse GameData', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const loadFile = async (relativePath) => {
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/gamedata/file?path=${encodeURIComponent(relativePath)}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to load file');
      }

      setSelectedFile(data);
      setEditorValue(data.content || '');
      setSelectedEntryPath(relativePath);
      addToast(`Opened ${data.relativePath}`, 'info');
    } catch (error) {
      addToast(error.message || 'Failed to load file', 'error');
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    loadDirectory('');
  }, []);

  const openDirectory = async (relativePath) => {
    if (!confirmDiscard()) return;
    setSelectedFile(null);
    setEditorValue('');
    await loadDirectory(relativePath);
  };

  const openSelectedEntry = async (entry) => {
    if (!entry) return;
    if (entry.type === 'dir') {
      await openDirectory(entry.relativePath);
      return;
    }

    if (!entry.editable) {
      addToast('Only .cfg files can be opened in GameData', 'info');
      return;
    }

    if (!confirmDiscard()) return;
    await loadFile(entry.relativePath);
  };

  const handleEntryClick = (entry) => {
    setSelectedEntryPath(entry.relativePath);
  };

  const handleEntryDoubleClick = async (entry) => {
    setSelectedEntryPath(entry.relativePath);
    await openSelectedEntry(entry);
  };

  const handleRowKeyDown = async (event, entry) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleEntryDoubleClick(entry);
    }
  };

  const refreshCurrent = async () => {
    if (!confirmDiscard()) return;
    const reopenPath = selectedFile?.relativePath || '';
    await loadDirectory(currentPath);
    if (reopenPath) {
      await loadFile(reopenPath);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/gamedata/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.relativePath, content: editorValue })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to save file');
      }

      setSelectedFile((prev) => prev ? {
        ...prev,
        content: editorValue,
        modified: data.modified,
        size: data.size
      } : prev);
      addToast(`Saved ${selectedFile.relativePath}`, 'success');
      await loadDirectory(currentPath);
      setSelectedEntryPath(selectedFile.relativePath);
    } catch (error) {
      addToast(error.message || 'Failed to save file', 'error');
    } finally {
      setSaving(false);
    }
  };

  const goUp = async () => {
    if (!currentPath) return;
    await openDirectory(getParentPath(currentPath));
  };

  return (
    <div className="plugins-panel">
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)', flex: 1, minWidth: 240 }}>
          {loadingList ? 'Loading...' : note}
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }}
          onClick={refreshCurrent}
          disabled={loadingList || loadingFile || saving}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="gamedata-layout gamedata-layout-explorer">
        <section className="gamedata-explorer-panel">
          <div className="gamedata-explorer-topbar">
            <div className="gamedata-topbar-actions">
              <button
                type="button"
                className="gamedata-nav-btn"
                onClick={goUp}
                disabled={!currentPath || loadingList}
                title="Up"
              >
                ↑
              </button>
              <button
                type="button"
                className="gamedata-nav-btn"
                onClick={refreshCurrent}
                disabled={loadingList || loadingFile || saving}
                title="Refresh"
              >
                ↻
              </button>
            </div>

            <div className="gamedata-addressbar" title={`${ROOT_LABEL}${currentPath ? `/${currentPath}` : ''}`}>
              {breadcrumbs.map((crumb) => (
                <button
                  key={crumb.path || '__root__'}
                  type="button"
                  className={`gamedata-address-segment ${crumb.path === currentPath ? 'active' : ''}`}
                  onClick={() => openDirectory(crumb.path)}
                >
                  {crumb.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gamedata-explorer-body">
            <div className="gamedata-grid-header">
              <span>Name</span>
              <span>Type</span>
              <span>Modified</span>
              <span>Size</span>
            </div>

            <div className="gamedata-grid-list" role="listbox" aria-label="GameData Explorer">
              {currentPath && (
                <button
                  type="button"
                  className={`gamedata-grid-row gamedata-grid-row-parent ${selectedEntryPath === '__parent__' ? 'selected' : ''}`}
                  onClick={() => setSelectedEntryPath('__parent__')}
                  onDoubleClick={goUp}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      goUp();
                    }
                  }}
                >
                  <span className="gamedata-grid-name">
                    <span className="gamedata-grid-icon folder">DIR</span>
                    <span>..</span>
                  </span>
                  <span>Parent folder</span>
                  <span> </span>
                  <span> </span>
                </button>
              )}

              {!loadingList && entries.length === 0 ? (
                <div className="empty-state">
                  <div className="big">🗂️</div>
                  <p>Folder is empty</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const isSelected = selectedEntryPath === entry.relativePath;
                  const typeLabel = entry.type === 'dir' ? 'Folder' : entry.editable ? 'CFG File' : 'File';
                  return (
                    <button
                      key={`${entry.type}-${entry.relativePath}`}
                      type="button"
                      className={`gamedata-grid-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleEntryClick(entry)}
                      onDoubleClick={() => handleEntryDoubleClick(entry)}
                      onKeyDown={(event) => handleRowKeyDown(event, entry)}
                    >
                      <span className="gamedata-grid-name">
                        <span className={`gamedata-grid-icon ${entry.type === 'dir' ? 'folder' : entry.editable ? 'cfg' : 'file'}`}>
                          {entry.type === 'dir' ? 'DIR' : entry.editable ? 'CFG' : 'FILE'}
                        </span>
                        <span>{entry.name}</span>
                      </span>
                      <span>{typeLabel}</span>
                      <span>{formatTime(entry.modified)}</span>
                      <span>{entry.type === 'dir' ? '—' : formatBytes(entry.size)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="gamedata-statusbar">
            <span>{entries.length} item(s)</span>
            <span>{selectedEntry ? selectedEntry.name : 'No selection'}</span>
          </div>
        </section>

        <section className="gamedata-editor-panel">
          <div className="gamedata-editor-header">
            <div>
              <h2>{selectedFile ? selectedFile.relativePath : 'Preview / Editor'}</h2>
              <p>
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • Updated ${formatTime(selectedFile.modified)}`
                  : 'Double-click a .cfg file to open it. Double-click a folder to enter it.'}
              </p>
            </div>

            {selectedFile && (
              <div className="gamedata-editor-actions">
                <button
                  className="btn btn-ghost"
                  style={{ width: 'auto', margin: 0, padding: '8px 12px', fontSize: 12 }}
                  onClick={() => {
                    setEditorValue(selectedFile.content || '');
                    addToast('Reverted unsaved changes', 'info');
                  }}
                  disabled={!isDirty || saving}
                >
                  Reset
                </button>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', margin: 0, padding: '8px 12px', fontSize: 12 }}
                  onClick={saveFile}
                  disabled={!isDirty || saving || loadingFile}
                >
                  {saving ? 'Saving...' : 'Save file'}
                </button>
              </div>
            )}
          </div>

          {!selectedFile ? (
            <div className="empty-state gamedata-empty-editor">
              <div className="big">🪟</div>
              <p>Single-click để chọn, double-click để mở file hoặc vào thư mục</p>
            </div>
          ) : loadingFile ? (
            <div className="empty-state gamedata-empty-editor">
              <div className="big">⏳</div>
              <p>Loading file content...</p>
            </div>
          ) : (
            <>
              <div className="gamedata-editor-meta">
                <span>{selectedFile.rootLabel || ROOT_LABEL}</span>
                <span>{isDirty ? 'Unsaved changes' : 'Saved'}</span>
              </div>
              <textarea
                className="gamedata-editor"
                spellCheck={false}
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default TabGameData;
