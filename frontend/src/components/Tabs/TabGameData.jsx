import React, { useEffect, useMemo, useState } from 'react';

const ROOT_LABEL = 'left4dead2/cfg';

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

const TabGameData = ({ addToast }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState('Loading config tree...');
  const [loadingList, setLoadingList] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorValue, setEditorValue] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = !!selectedFile && editorValue !== selectedFile.content;

  const breadcrumbs = useMemo(() => {
    const parts = currentPath ? currentPath.split('/').filter(Boolean) : [];
    return [
      { label: ROOT_LABEL, path: '' },
      ...parts.map((segment, index) => ({
        label: segment,
        path: parts.slice(0, index + 1).join('/')
      }))
    ];
  }, [currentPath]);

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
      setNote(`Browsing ${data.rootLabel || ROOT_LABEL}${data.relativePath ? `/${data.relativePath}` : ''} • ${list.length} item(s)`);
    } catch (error) {
      setEntries([]);
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
    } catch (error) {
      addToast(error.message || 'Failed to load file', 'error');
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    loadDirectory('');
  }, []);

  const confirmDiscard = () => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard them?');
  };

  const openDirectory = async (relativePath) => {
    if (!confirmDiscard()) return;
    setSelectedFile(null);
    setEditorValue('');
    await loadDirectory(relativePath);
  };

  const openFile = async (entry) => {
    if (!entry.editable) {
      addToast('Only .cfg files can be opened in GameData', 'info');
      return;
    }

    if (!confirmDiscard()) return;
    await loadFile(entry.relativePath);
  };

  const refreshCurrent = async () => {
    if (!confirmDiscard()) return;
    await loadDirectory(currentPath);
    if (selectedFile?.relativePath) {
      await loadFile(selectedFile.relativePath);
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

      setSelectedFile((prev) => prev ? { ...prev, content: editorValue, modified: data.modified, size: data.size } : prev);
      addToast(`Saved ${selectedFile.relativePath}`, 'success');
      await loadDirectory(currentPath);
    } catch (error) {
      addToast(error.message || 'Failed to save file', 'error');
    } finally {
      setSaving(false);
    }
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

      <div className="gamedata-layout">
        <section className="gamedata-browser">
          <div className="gamedata-browser-header">
            <div>
              <h2>Config Browser</h2>
              <p>Navigate inside <code>{ROOT_LABEL}</code> and open any <code>.cfg</code> file to edit directly.</p>
            </div>
          </div>

          <div className="gamedata-breadcrumbs">
            {breadcrumbs.map((crumb) => (
              <button
                key={crumb.path || '__root__'}
                type="button"
                className={`gamedata-crumb ${crumb.path === currentPath ? 'active' : ''}`}
                onClick={() => openDirectory(crumb.path)}
              >
                {crumb.label}
              </button>
            ))}
          </div>

          <div className="gamedata-list">
            {currentPath && (
              <button type="button" className="gamedata-entry gamedata-entry-parent" onClick={() => openDirectory(currentPath.split('/').slice(0, -1).join('/'))}>
                <span className="gamedata-entry-icon">..</span>
                <span className="gamedata-entry-main">
                  <strong>Parent directory</strong>
                  <small>Go up one level</small>
                </span>
              </button>
            )}

            {!loadingList && entries.length === 0 ? (
              <div className="empty-state">
                <div className="big">📁</div>
                <p>No files or folders found in this directory</p>
              </div>
            ) : (
              entries.map((entry) => {
                const isSelected = selectedFile?.relativePath === entry.relativePath;
                return (
                  <button
                    key={`${entry.type}-${entry.relativePath}`}
                    type="button"
                    className={`gamedata-entry ${isSelected ? 'active' : ''}`}
                    onClick={() => (entry.type === 'dir' ? openDirectory(entry.relativePath) : openFile(entry))}
                  >
                    <span className="gamedata-entry-icon">{entry.type === 'dir' ? 'DIR' : entry.editable ? 'CFG' : 'FILE'}</span>
                    <span className="gamedata-entry-main">
                      <strong>{entry.name}</strong>
                      <small>
                        {entry.type === 'dir'
                          ? 'Directory'
                          : entry.editable
                            ? `${formatBytes(entry.size)} • editable`
                            : `${formatBytes(entry.size)} • view only in browser list`}
                      </small>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="gamedata-editor-panel">
          <div className="gamedata-editor-header">
            <div>
              <h2>{selectedFile ? selectedFile.relativePath : 'Select a .cfg file'}</h2>
              <p>
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • Updated ${formatTime(selectedFile.modified)}`
                  : 'Only .cfg files can be opened and saved from this tab.'}
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
              <div className="big">🗂️</div>
              <p>Choose a config file from the left panel to start editing</p>
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
