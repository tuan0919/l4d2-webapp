import React, { useEffect, useMemo, useRef, useState } from 'react';

const ROOT_LABEL = 'l4d2-sourcemod/addons/sourcemod/data';
const EXPLORER_WINDOW_ID = 'explorer';
const TASKBAR_HEIGHT = 58;

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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createWindowState = (id, file, zIndex) => ({
  id,
  type: 'editor',
  title: file.name,
  filePath: file.relativePath,
  rootLabel: file.rootLabel || ROOT_LABEL,
  content: file.content || '',
  draft: file.content || '',
  modified: file.modified,
  size: file.size,
  minimized: false,
  maximized: false,
  zIndex,
  x: 120 + (zIndex % 4) * 28,
  y: 90 + (zIndex % 4) * 24,
  width: 720,
  height: 520
});

const TabGameData = ({ addToast }) => {
  const desktopRef = useRef(null);
  const dragRef = useRef(null);

  const [note, setNote] = useState('Loading GameData...');
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedEntryPath, setSelectedEntryPath] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [savingWindowId, setSavingWindowId] = useState('');
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(EXPLORER_WINDOW_ID);
  const [nextZIndex, setNextZIndex] = useState(3);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.relativePath === selectedEntryPath) || null,
    [entries, selectedEntryPath]
  );

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

  const windowsById = useMemo(() => {
    const map = new Map();
    windows.forEach((win) => map.set(win.id, win));
    return map;
  }, [windows]);

  const anyDirtyWindow = windows.some((win) => win.draft !== win.content);

  const confirmDiscard = (message = 'You have unsaved changes. Discard them?') => {
    if (!anyDirtyWindow) return true;
    return window.confirm(message);
  };

  const bumpWindow = (windowId) => {
    if (!windowId) return;
    const z = nextZIndex + 1;
    setNextZIndex(z);
    setActiveWindowId(windowId);
    setWindows((prev) => prev.map((win) => (win.id === windowId ? { ...win, zIndex: z } : win)));
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

      const existing = windows.find((win) => win.filePath === data.relativePath);
      if (existing) {
        setWindows((prev) => prev.map((win) => (
          win.id === existing.id
            ? {
                ...win,
                title: data.relativePath.split('/').pop(),
                rootLabel: data.rootLabel || ROOT_LABEL,
                content: data.content || '',
                draft: win.draft === win.content ? (data.content || '') : win.draft,
                modified: data.modified,
                size: data.size,
                minimized: false
              }
            : win
        )));
        bumpWindow(existing.id);
        addToast(`Focused ${data.relativePath}`, 'info');
        return;
      }

      const windowId = `editor:${data.relativePath}`;
      const z = nextZIndex + 1;
      setNextZIndex(z);
      setWindows((prev) => [...prev, createWindowState(windowId, {
        name: data.relativePath.split('/').pop(),
        relativePath: data.relativePath,
        rootLabel: data.rootLabel,
        content: data.content,
        modified: data.modified,
        size: data.size
      }, z)]);
      setActiveWindowId(windowId);
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

  useEffect(() => {
    const handleMouseMove = (event) => {
      const drag = dragRef.current;
      const desktop = desktopRef.current;
      if (!drag || !desktop) return;

      const bounds = desktop.getBoundingClientRect();
      const nextX = clamp(event.clientX - bounds.left - drag.offsetX, 12, Math.max(12, bounds.width - drag.width - 12));
      const nextY = clamp(event.clientY - bounds.top - drag.offsetY, 12, Math.max(12, bounds.height - drag.height - TASKBAR_HEIGHT - 12));

      setWindows((prev) => prev.map((win) => (
        win.id === drag.windowId && !win.maximized ? { ...win, x: nextX, y: nextY } : win
      )));
    };

    const stopDrag = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, []);

  const openDirectory = async (relativePath) => {
    if (!confirmDiscard('You have unsaved editor changes. Discard them and change folder?')) return;
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

    await loadFile(entry.relativePath);
  };

  const handleEntryClick = (entry) => {
    setSelectedEntryPath(entry.relativePath);
    setActiveWindowId(EXPLORER_WINDOW_ID);
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
    if (!confirmDiscard('You have unsaved editor changes. Discard them and refresh?')) return;
    await loadDirectory(currentPath);
  };

  const updateWindow = (windowId, updater) => {
    setWindows((prev) => prev.map((win) => (win.id === windowId ? updater(win) : win)));
  };

  const closeWindow = (windowId) => {
    const target = windowsById.get(windowId);
    if (!target) return;
    if (target.draft !== target.content && !window.confirm(`Close ${target.title} without saving?`)) {
      return;
    }
    setWindows((prev) => prev.filter((win) => win.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(EXPLORER_WINDOW_ID);
    }
  };

  const minimizeWindow = (windowId) => {
    updateWindow(windowId, (win) => ({ ...win, minimized: true }));
    if (activeWindowId === windowId) {
      setActiveWindowId(EXPLORER_WINDOW_ID);
    }
  };

  const toggleMaximizeWindow = (windowId) => {
    bumpWindow(windowId);
    updateWindow(windowId, (win) => ({ ...win, minimized: false, maximized: !win.maximized }));
  };

  const restoreWindow = (windowId) => {
    bumpWindow(windowId);
    updateWindow(windowId, (win) => ({ ...win, minimized: false }));
  };

  const saveWindow = async (windowId) => {
    const target = windowsById.get(windowId);
    if (!target) return;

    setSavingWindowId(windowId);
    try {
      const response = await fetch('/api/gamedata/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: target.filePath, content: target.draft })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to save file');
      }

      updateWindow(windowId, (win) => ({
        ...win,
        content: win.draft,
        modified: data.modified,
        size: data.size
      }));
      addToast(`Saved ${target.filePath}`, 'success');
      await loadDirectory(currentPath);
      setSelectedEntryPath(target.filePath);
    } catch (error) {
      addToast(error.message || 'Failed to save file', 'error');
    } finally {
      setSavingWindowId('');
    }
  };

  const startDrag = (event, windowId) => {
    const target = windowsById.get(windowId);
    if (!target || target.maximized) return;
    const desktop = desktopRef.current;
    if (!desktop) return;

    const bounds = desktop.getBoundingClientRect();
    dragRef.current = {
      windowId,
      offsetX: event.clientX - bounds.left - target.x,
      offsetY: event.clientY - bounds.top - target.y,
      width: target.width,
      height: target.height
    };
    bumpWindow(windowId);
  };

  const goUp = async () => {
    if (!currentPath) return;
    await openDirectory(getParentPath(currentPath));
  };

  const visibleWindows = windows.filter((win) => !win.minimized).sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="gamedata-shell">
      <div className="gamedata-desktop" ref={desktopRef}>
        <div className="gamedata-desktop-caption">
          <strong>GameData Workspace</strong>
          <span>{loadingList ? 'Loading...' : note}</span>
        </div>

        <section className={`gamedata-window gamedata-window-explorer ${activeWindowId === EXPLORER_WINDOW_ID ? 'active' : ''}`}>
          <div className="gamedata-window-titlebar" onMouseDown={() => setActiveWindowId(EXPLORER_WINDOW_ID)}>
            <div className="gamedata-window-title">
              <span className="gamedata-window-badge explorer">EXP</span>
              <span>File Explorer</span>
            </div>
            <div className="gamedata-window-controls">
              <button type="button" className="gamedata-window-btn" onClick={goUp} disabled={!currentPath || loadingList}>↑</button>
              <button type="button" className="gamedata-window-btn" onClick={refreshCurrent} disabled={loadingList || loadingFile || !!savingWindowId}>↻</button>
            </div>
          </div>

          <div className="gamedata-window-toolbar">
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
                <div className="empty-state gamedata-empty-grid">
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
            <span>{selectedEntry ? selectedEntry.name : 'Single-click select, double-click open'}</span>
          </div>
        </section>

        {visibleWindows.map((win) => {
          const isActive = activeWindowId === win.id;
          const isSaving = savingWindowId === win.id;
          const dirty = win.draft !== win.content;
          const style = win.maximized
            ? { zIndex: win.zIndex, inset: '10px 10px 70px 10px' }
            : { zIndex: win.zIndex, left: win.x, top: win.y, width: win.width, height: win.height };

          return (
            <section
              key={win.id}
              className={`gamedata-window gamedata-window-editor ${isActive ? 'active' : ''} ${win.maximized ? 'maximized' : ''}`}
              style={style}
              onMouseDown={() => bumpWindow(win.id)}
            >
              <div className="gamedata-window-titlebar" onMouseDown={(event) => startDrag(event, win.id)}>
                <div className="gamedata-window-title">
                  <span className="gamedata-window-badge cfg">CFG</span>
                  <span>{win.title}</span>
                  {dirty && <span className="gamedata-window-dirty">Unsaved</span>}
                </div>

                <div className="gamedata-window-controls">
                  <button type="button" className="gamedata-window-btn" onClick={(event) => { event.stopPropagation(); minimizeWindow(win.id); }}>_</button>
                  <button type="button" className="gamedata-window-btn" onClick={(event) => { event.stopPropagation(); toggleMaximizeWindow(win.id); }}>{win.maximized ? '▢' : '□'}</button>
                  <button type="button" className="gamedata-window-btn close" onClick={(event) => { event.stopPropagation(); closeWindow(win.id); }}>×</button>
                </div>
              </div>

              <div className="gamedata-editor-header gamedata-editor-header-window">
                <div>
                  <h2>{win.filePath}</h2>
                  <p>{formatBytes(win.size)} • Updated {formatTime(win.modified)}</p>
                </div>
                <div className="gamedata-editor-actions">
                  <button
                    className="btn btn-ghost"
                    style={{ width: 'auto', margin: 0, padding: '8px 12px', fontSize: 12 }}
                    onClick={() => updateWindow(win.id, (current) => ({ ...current, draft: current.content }))}
                    disabled={!dirty || isSaving}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ width: 'auto', margin: 0, padding: '8px 12px', fontSize: 12 }}
                    onClick={() => saveWindow(win.id)}
                    disabled={!dirty || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save file'}
                  </button>
                </div>
              </div>

              <div className="gamedata-editor-meta">
                <span>{win.rootLabel}</span>
                <span>{dirty ? 'Unsaved changes' : 'Saved'}</span>
              </div>

              <textarea
                className="gamedata-editor"
                spellCheck={false}
                value={win.draft}
                onChange={(event) => updateWindow(win.id, (current) => ({ ...current, draft: event.target.value }))}
              />
            </section>
          );
        })}
      </div>

      <div className="gamedata-taskbar">
        <button
          type="button"
          className={`gamedata-taskbar-item ${activeWindowId === EXPLORER_WINDOW_ID ? 'active' : ''}`}
          onClick={() => setActiveWindowId(EXPLORER_WINDOW_ID)}
        >
          <span className="gamedata-taskbar-badge explorer">EXP</span>
          <span>Explorer</span>
        </button>

        {windows.map((win) => {
          const dirty = win.draft !== win.content;
          return (
            <button
              key={win.id}
              type="button"
              className={`gamedata-taskbar-item ${activeWindowId === win.id && !win.minimized ? 'active' : ''}`}
              onClick={() => (win.minimized ? restoreWindow(win.id) : bumpWindow(win.id))}
            >
              <span className="gamedata-taskbar-badge cfg">CFG</span>
              <span>{win.title}</span>
              {dirty && <span className="gamedata-taskbar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabGameData;
