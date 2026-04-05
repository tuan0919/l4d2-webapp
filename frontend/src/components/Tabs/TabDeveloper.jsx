import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  const [smartFormat, setSmartFormat] = useState(true);
  const [controlsCollapsed, setControlsCollapsed] = useState(true);

  const logBoxRef = useRef(null);

  const selectedLog = useMemo(
    () => logs.find((entry) => entry.target === selectedTarget) || null,
    [logs, selectedTarget]
  );

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

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (selectedTarget) {
      fetchLogContent(selectedTarget);
    }
  }, [selectedTarget]);

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

  const viewerSummary = useMemo(() => {
    if (!selectedLog) {
      return 'Pick a log file to inspect server output';
    }

    const segments = [selectedLog.relativePath];

    if (logMeta?.totalMatches) {
      segments.push(`${logMeta.totalMatches} match${logMeta.totalMatches !== 1 ? 'es' : ''}`);
    }

    segments.push(`Last ${Number(limit) || 0} lines`);

    if (search.trim()) {
      segments.push(`Filter: "${search.trim()}"`);
    }

    return segments.join(' • ');
  }, [selectedLog, logMeta, limit, search]);

  const renderSmartLogs = () => {
    if (logLines.length === 0) return null;

    const elements = [];
    let currentErrorBlock = null;

    for (let i = 0; i < logLines.length; i++) {
        const line = logLines[i];
        const text = line.text;
        
        // Detect start of an SM error
        if (text.includes('[SM] Exception reported:') || text.includes('[SM] Plugin encountered error')) {
            if (currentErrorBlock) elements.push(currentErrorBlock);
            
            let blaming = '';
            // Look ahead for "Blaming:"
            for (let j = i + 1; j < Math.min(i + 14, logLines.length); j++) {
                if (logLines[j].text.includes('[SM] Blaming:')) {
                    blaming = logLines[j].text.split('Blaming:')[1].trim();
                    break;
                }
            }
            
            currentErrorBlock = {
                type: 'error-block',
                blame: blaming,
                lines: [line]
            };
        } 
        else if (currentErrorBlock && text.includes('[SM]') && (text.includes('Call stack trace') || text.includes('['))) {
            currentErrorBlock.lines.push(line);
        }
        else if (currentErrorBlock && text.match(/^L \d+\/\d+\/\d+ - \d+:\d+:\d+:/) && !text.includes('[SM]')) {
             elements.push(currentErrorBlock);
             currentErrorBlock = null;
             elements.push({ type: 'normal', line });
        }
        else if (currentErrorBlock) {
             currentErrorBlock.lines.push(line);
             if (currentErrorBlock.lines.length > 25) {
                 elements.push(currentErrorBlock);
                 currentErrorBlock = null;
             }
        }
        else {
            elements.push({ type: 'normal', line });
        }
    }
    if (currentErrorBlock) elements.push(currentErrorBlock);

    return elements.map((item, idx) => {
        if (item.type === 'normal') {
            return <span key={item.line.id} className={`console-line ${item.line.kind}`}>{item.line.text}</span>;
        } else {
            return (
                <div key={`err-${idx}`} className="sm-error-block">
                    <div className="sm-error-header">
                       <span style={{fontSize: '16px'}}>🚨</span>
                       <strong>{item.blame ? `Plugin Error: ${item.blame}` : 'SourceMod Exception'}</strong>
                    </div>
                    <div className="sm-error-body">
                       {item.lines.map(l => <span key={l.id} className={`console-line ${l.kind}`}>{l.text}</span>)}
                    </div>
                </div>
            );
        }
    });
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
          <div className="dev-section-header dev-section-header-collapsible">
            <div>
              <h2>Log Inspector</h2>
              <p>Read server logs with live polling, horizontal scrolling, and smart SourceMod error parsing.</p>
            </div>
            <div className="dev-header-actions">
              <button className="btn btn-primary dev-action-btn" onClick={refreshCurrentLog} disabled={!selectedTarget || loadingContent}>
                {loadingContent ? 'Loading...' : '📄 Read Log'}
              </button>
              <button
                className="btn btn-ghost dev-action-btn"
                onClick={() => setControlsCollapsed((prev) => !prev)}
                aria-expanded={!controlsCollapsed}
              >
                {controlsCollapsed ? '▾ Show controls' : '▴ Hide controls'}
              </button>
            </div>
          </div>

          <div className="dev-summary-strip">
            <div className="dev-summary-main">
              <strong>{viewerSummary}</strong>
              <span>
                {loadingContent
                  ? 'Refreshing log output...'
                  : `Live ${liveMode ? 'ON' : 'OFF'} • Auto-scroll ${autoScroll ? 'ON' : 'OFF'} • Smart parsing ${smartFormat ? 'ON' : 'OFF'}`}
              </span>
            </div>
            <div className="dev-summary-actions">
              <button className="btn btn-ghost dev-chip-btn" onClick={() => setLiveMode((prev) => !prev)}>
                {liveMode ? '⏸ Live ON' : '▶ Live OFF'}
              </button>
              <button className="btn btn-ghost dev-chip-btn" onClick={() => setAutoScroll((prev) => !prev)}>
                {autoScroll ? '⬇ Auto ON' : '⬇ Auto OFF'}
              </button>
              <button className="btn btn-ghost dev-chip-btn" onClick={() => setSmartFormat((prev) => !prev)}>
                {smartFormat ? '✨ Smart ON' : '✨ Smart OFF'}
              </button>
            </div>
          </div>

          {!controlsCollapsed && (
            <>
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
                <button className="btn btn-ghost dev-action-btn" onClick={fetchLogs} disabled={loadingLogs}>
                  ↻ Reload Logs
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
                  <div><strong>Viewer mode:</strong> Collapsed controls leave more room for the log reader</div>
                </div>
              )}
            </>
          )}

          <div className="dev-log-shell">
            <div className="console-box dev-console-box dev-console-scrollable" ref={logBoxRef}>
              {logLines.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 20px' }}>
                  <div className="big">🧪</div>
                  <p>{loadingContent ? 'Reading log file...' : 'Select a log and click Read Log'}</p>
                </div>
              ) : smartFormat ? (
                renderSmartLogs()
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
      </div>
    </div>
  );
};

export default TabDeveloper;
