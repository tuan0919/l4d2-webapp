import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_UPLOAD_TARGETS = [
  {
    label: 'Server plugin binary (.smx)',
    value: 'game:left4dead2/addons/sourcemod/plugins/'
  },
  {
    label: 'Server plugin source (.sp)',
    value: 'game:left4dead2/addons/sourcemod/scripting/'
  },
  {
    label: 'Server cfg (.cfg)',
    value: 'game:left4dead2/cfg/sourcemod/'
  },
  {
    label: 'Webapp frontend source',
    value: 'webapp:frontend/src/'
  },
  {
    label: 'Webapp backend source',
    value: 'webapp:'
  }
];

const LOG_REFRESH_INTERVAL_MS = 2000;

const classifyLogLine = (line) => {
  if (/error|exception|failed|panic/i.test(line)) return 'err';
  if (/warn|warning/i.test(line)) return 'warn';
  if (/\[SM\]|\[SourceMod\]|script error/i.test(line)) return 'sm';
  if (/L \d+\/\d+\/\d+|loaded|listening|running/i.test(line)) return 'info';
  return '';
};

const formatBytes = (bytes) => `${Math.max(0, Number(bytes || 0) / 1024).toFixed(1)} KB`;

const TabDeveloper = ({ addToast }) => {
  const [logs, setLogs] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(250);
  const [logLines, setLogLines] = useState([]);
  const [logMeta, setLogMeta] = useState(null);
  const [note, setNote] = useState('Loading developer tools...');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [roots, setRoots] = useState([]);
  const [selectedBrowseTarget, setSelectedBrowseTarget] = useState('');
  const [browseData, setBrowseData] = useState(null);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(DEFAULT_UPLOAD_TARGETS[0].value);
  const [customTarget, setCustomTarget] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const logBoxRef = useRef(null);

  const effectiveUploadTarget = (customTarget.trim() || uploadTarget).trim();

  const selectedLog = useMemo(
    () => logs.find((entry) => entry.target === selectedTarget) || null,
    [logs, selectedTarget]
  );

  const selectedRoot = useMemo(() => {
    if (!browseData?.rootKey) return null;
    return roots.find((entry) => entry.key === browseData.rootKey) || null;
  }, [browseData, roots]);

  const fetchRoots = async () => {
    try {
      const response = await fetch('/api/dev/roots');
      const data = await response.json();
      const nextRoots = Array.isArray(data.roots) ? data.roots : [];
      setRoots(nextRoots);

      if (nextRoots.length > 0) {
        setSelectedBrowseTarget((prev) => {
          if (prev) return prev;
          return nextRoots[0].browseTarget || '';
        });
      }
    } catch {
      setRoots([]);
      addToast('Failed to load server folder roots', 'error');
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setNote('Scanning available log files...');

    try {
      const response = await fetch('/api/dev/logs');
      const data = await response.json();
      const list = Array.isArray(data.logs) ? data.logs : [];

      setLogs(list);

      if (list.length === 0) {
        setSelectedTarget('');
        setLogLines([]);
        setLogMeta(null);
        setNote('No readable log files found');
        return;
      }

      setSelectedTarget((prev) => {
        if (prev && list.some((entry) => entry.target === prev)) {
          return prev;
        }
        return list[0].target;
      });

      setNote(`Found ${list.length} log file${list.length !== 1 ? 's' : ''}`);
    } catch {
      setLogs([]);
      setSelectedTarget('');
      setLogLines([]);
      setLogMeta(null);
      setNote('Failed to load developer logs');
      addToast('Failed to load developer logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchLogContent = async (targetOverride) => {
    const target = targetOverride || selectedTarget;
    if (!target) return;

    setLoadingContent(true);

    try {
      const params = new URLSearchParams({
        target,
        limit: String(limit)
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/dev/logs/content?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to read log content');
      }

      const lines = Array.isArray(data.lines) ? data.lines : [];
      setLogLines(lines.map((text, index) => ({ id: `${index}-${text}`, text, kind: classifyLogLine(text) })));
      setLogMeta({
        target: data.target,
        relativePath: data.relativePath,
        totalMatches: Number(data.totalMatches || 0),
        modified: data.modified,
        size: Number(data.size || 0)
      });
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setLogLines([]);
      setLogMeta(null);
      addToast(error.message || 'Failed to read log content', 'error');
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchDirectory = async (targetOverride) => {
    const target = targetOverride || selectedBrowseTarget;
    if (!target) return;

    setLoadingBrowse(true);

    try {
      const params = new URLSearchParams({ target });
      const response = await fetch(`/api/dev/browse?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to browse directory');
      }

      setBrowseData(data);
      setSelectedBrowseTarget(data.target || target);
    } catch (error) {
      setBrowseData(null);
      addToast(error.message || 'Failed to browse directory', 'error');
    } finally {
      setLoadingBrowse(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRoots();
  }, []);

  useEffect(() => {
    if (selectedTarget) {
      fetchLogContent(selectedTarget);
    }
  }, [selectedTarget]);

  useEffect(() => {
    if (!selectedBrowseTarget) return;
    fetchDirectory(selectedBrowseTarget);
  }, [selectedBrowseTarget]);

  useEffect(() => {
    if (!selectedTarget || !liveMode) return undefined;

    const timer = window.setInterval(() => {
      fetchLogContent(selectedTarget);
    }, LOG_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [selectedTarget, liveMode, limit, search]);

  useEffect(() => {
    if (!autoScroll) return;
    const box = logBoxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [logLines, autoScroll]);

  const refreshCurrentLog = async () => {
    await fetchLogContent(selectedTarget);
  };

  const browseToRoot = (target) => {
    setSelectedBrowseTarget(target);
  };

  const applyBrowserTarget = (target) => {
    setCustomTarget(target);
    addToast(`Target selected: ${target}`, 'info');
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      addToast('Choose a file to upload first', 'error');
      return;
    }

    if (!effectiveUploadTarget) {
      addToast('Target path is required', 'error');
      return;
    }

    setUploading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunkSize = 0x8000;

      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
      }

      let target = effectiveUploadTarget;
      if (target.endsWith('/')) {
        target += selectedFile.name;
      }

      const response = await fetch('/api/dev/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          fileName: selectedFile.name,
          contentBase64: btoa(binary)
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Upload failed');
      }

      addToast(`Uploaded ${selectedFile.name} → ${data.relativePath}`, 'success');
      setSelectedFile(null);
      if (selectedBrowseTarget) {
        fetchDirectory(selectedBrowseTarget);
      }
    } catch (error) {
      addToast(error.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="plugins-panel">
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)', flex: 1, minWidth: 240 }}>
          {loadingLogs ? 'Loading...' : note}
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }}
          onClick={fetchLogs}
          disabled={loadingLogs}
        >
          ↻ Reload Logs
        </button>
      </div>

      <div className="dev-grid">
        <section className="dev-section">
          <div className="dev-section-header">
            <div>
              <h2>Log Inspector</h2>
              <p>Read server logs with live polling, horizontal scrolling, and a resizable viewer for long lines.</p>
            </div>
          </div>

          <div className="dev-controls-grid">
            <div>
              <label htmlFor="dev-log-target">Log file</label>
              <select id="dev-log-target" value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)}>
                {logs.length === 0 ? (
                  <option value="">No logs found</option>
                ) : (
                  logs.map((entry) => (
                    <option key={entry.target} value={entry.target}>
                      {entry.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="dev-log-search">Search text</label>
              <input
                id="dev-log-search"
                type="text"
                placeholder="error, warning, plugin name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="dev-log-limit">Max lines</label>
              <input
                id="dev-log-limit"
                type="number"
                min="20"
                max="2000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="dev-inline-actions">
            <button className="btn btn-primary" style={{ width: 'auto', margin: 0 }} onClick={refreshCurrentLog} disabled={!selectedTarget || loadingContent}>
              {loadingContent ? 'Loading...' : '📄 Read Log'}
            </button>
            <button className="btn btn-ghost" style={{ width: 'auto', margin: 0 }} onClick={() => setLiveMode((prev) => !prev)}>
              {liveMode ? '⏸ Live refresh: ON' : '▶ Live refresh: OFF'}
            </button>
            <button className="btn btn-ghost" style={{ width: 'auto', margin: 0 }} onClick={() => setAutoScroll((prev) => !prev)}>
              {autoScroll ? '⬇ Auto-scroll: ON' : '⬇ Auto-scroll: OFF'}
            </button>
          </div>

          {selectedLog && (
            <div className="dev-meta-box">
              <div><strong>Selected:</strong> {selectedLog.relativePath}</div>
              <div><strong>Size:</strong> {formatBytes(selectedLog.size)}</div>
              <div><strong>Live refresh:</strong> every {LOG_REFRESH_INTERVAL_MS / 1000}s</div>
            </div>
          )}

          {logMeta && (
            <div className="dev-meta-box secondary dev-meta-grid">
              <div><strong>Matches:</strong> {logMeta.totalMatches}</div>
              <div><strong>Updated:</strong> {logMeta.modified ? new Date(logMeta.modified).toLocaleString() : '—'}</div>
              <div><strong>Last fetch:</strong> {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</div>
              <div><strong>Viewer mode:</strong> Resize bottom-right corner to expand</div>
            </div>
          )}

          <div className="dev-log-shell">
            <div className="console-box dev-console-box dev-console-scrollable" ref={logBoxRef}>
              {logLines.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 20px' }}>
                  <div className="big">🧪</div>
                  <p>{loadingContent ? 'Reading log file...' : 'Select a log and click Read Log'}</p>
                </div>
              ) : (
                logLines.map((line) => (
                  <span key={line.id} className={`console-line ${line.kind}`}>
                    {line.text}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="dev-section">
          <div className="dev-section-header">
            <div>
              <h2>Replace File on Server</h2>
              <p>Browse real server folders first, then choose an exact destination path before uploading. Existing files are backed up to <code>.bak</code>.</p>
            </div>
          </div>

          <div className="dev-controls-grid single-column">
            <div>
              <label htmlFor="dev-upload-target-select">Common target folder</label>
              <select
                id="dev-upload-target-select"
                value={uploadTarget}
                onChange={(e) => setUploadTarget(e.target.value)}
              >
                {DEFAULT_UPLOAD_TARGETS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dev-upload-custom-target">Custom target path</label>
              <input
                id="dev-upload-custom-target"
                type="text"
                placeholder="game:left4dead2/addons/sourcemod/plugins/my_plugin.smx"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="dev-upload-file">Local file</label>
              <input
                id="dev-upload-file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="dev-meta-box dev-meta-grid">
            <div><strong>Effective target:</strong> {effectiveUploadTarget || '—'}</div>
            <div><strong>Selected file:</strong> {selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : '—'}</div>
          </div>

          <div className="dev-browser-header">
            <div>
              <strong>Folder browser</strong>
              <span>{selectedRoot ? `${selectedRoot.label} • ${selectedRoot.absoluteRoot}` : 'Loading roots...'}</span>
            </div>
            <div className="dev-browser-actions">
              {roots.map((root) => (
                <button
                  key={root.key}
                  className="btn btn-ghost"
                  style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                  onClick={() => browseToRoot(root.browseTarget)}
                >
                  {root.key}
                </button>
              ))}
              <button
                className="btn btn-ghost"
                style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                onClick={() => fetchDirectory(selectedBrowseTarget)}
                disabled={!selectedBrowseTarget || loadingBrowse}
              >
                ↻ Refresh Tree
              </button>
            </div>
          </div>

          {browseData && (
            <div className="dev-meta-box secondary dev-meta-grid">
              <div><strong>Current folder:</strong> {browseData.target}</div>
              <div><strong>Server path:</strong> {browseData.absolutePath}</div>
              <div><strong>Entries shown:</strong> {Array.isArray(browseData.entries) ? browseData.entries.length : 0}</div>
              <div><strong>Use this folder:</strong> click “Use folder” to prefill upload target</div>
            </div>
          )}

          <div className="dev-file-browser">
            <div className="dev-browser-toolbar">
              <button
                className="btn btn-ghost"
                style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                onClick={() => browseData?.parentTarget && setSelectedBrowseTarget(browseData.parentTarget)}
                disabled={!browseData?.parentTarget || loadingBrowse}
              >
                ↑ Up
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                onClick={() => browseData?.target && applyBrowserTarget(browseData.target)}
                disabled={!browseData?.target}
              >
                Use folder
              </button>
            </div>

            <div className="dev-browser-list">
              {!browseData ? (
                <div className="empty-state" style={{ padding: '28px 20px' }}>
                  <div className="big">🗂️</div>
                  <p>{loadingBrowse ? 'Loading folder structure...' : 'Choose a root to inspect the server file structure'}</p>
                </div>
              ) : browseData.entries?.length ? (
                browseData.entries.map((entry) => (
                  <div key={entry.target} className="dev-browser-item">
                    <div className="dev-browser-item-main">
                      <div className="dev-browser-item-name">
                        <span className={`dev-entry-badge ${entry.type}`}>{entry.type === 'dir' ? 'DIR' : 'FILE'}</span>
                        <span>{entry.name}</span>
                      </div>
                      <div className="dev-browser-item-meta">
                        <span>{entry.relativePath}</span>
                        <span>{entry.type === 'file' ? formatBytes(entry.size) : 'Folder'}</span>
                      </div>
                    </div>
                    <div className="dev-browser-item-actions">
                      {entry.type === 'dir' ? (
                        <button
                          className="btn btn-ghost"
                          style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                          onClick={() => setSelectedBrowseTarget(entry.target)}
                        >
                          Open
                        </button>
                      ) : null}
                      <button
                        className="btn btn-ghost"
                        style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
                        onClick={() => applyBrowserTarget(entry.target)}
                      >
                        Use {entry.type === 'dir' ? 'folder' : 'file'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '28px 20px' }}>
                  <div className="big">📁</div>
                  <p>This folder is empty</p>
                </div>
              )}
            </div>
          </div>

          <div className="dev-inline-actions">
            <button className="btn btn-primary" style={{ width: 'auto', margin: 0 }} onClick={uploadFile} disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading...' : '⬆ Upload & Replace'}
            </button>
          </div>

          <div className="dev-help-box">
            <div>Allowed roots:</div>
            <ul>
              <li><code>game:</code> → server runtime root defined by <code>L4D2_DIR</code></li>
              <li><code>webapp:</code> → dashboard runtime folder on the server</li>
            </ul>
            <p>If the target ends with <code>/</code>, the selected filename is appended automatically.</p>
            <p>Recommended flow: browse a folder → click <code>Use folder</code> or <code>Use file</code> → upload local file.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TabDeveloper;
