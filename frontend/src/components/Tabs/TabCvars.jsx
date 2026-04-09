import React, { useState, useRef } from 'react';

const TabCvars = ({ addToast }) => {
  const [groups, setGroups] = useState([]);
  const [note, setNote] = useState('Click Refresh to parse Cvar .cfg files');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({});

  // Raw CFG mode: { [plugin]: { open: bool, content: string, loading: bool, editing: bool, draft: string } }
  const [rawState, setRawState] = useState({});

  const fetchCvars = async () => {
    setLoading(true);
    setNote('Parsing .cfg files...');

    try {
      const response = await fetch('/api/cvars');
      const data = await response.json();

      if (data.error || !Array.isArray(data.cvars) || data.cvars.length === 0) {
        setGroups([]);
        setValues({});
        setNote(data.error || '0 config files found');
        return;
      }

      const normalized = data.cvars.map((group) => ({
        plugin: group.plugin,
        cvars: Array.isArray(group.cvars) ? group.cvars : []
      }));

      const initValues = {};
      normalized.forEach((group) => {
        group.cvars.forEach((cvar) => {
          initValues[cvar.name] = cvar.value ?? '';
        });
      });

      setGroups(normalized);
      setValues(initValues);
      setNote(`Found cvars for ${normalized.length} configs`);
    } catch {
      setGroups([]);
      setValues({});
      setNote('Network error');
    } finally {
      setLoading(false);
    }
  };

  const saveCvar = async (cvarName) => {
    const value = values[cvarName] ?? '';
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar ${cvarName} "${value}"` })
      });

      const data = await response.json();
      if (data.ok || data.success || !data.error) {
        addToast(`Saved ${cvarName}`, 'success');
      } else {
        addToast(data.error || `Failed to save ${cvarName}`, 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  // ---- Raw CFG helpers ----
  const openRaw = async (plugin) => {
    setRawState((prev) => ({
      ...prev,
      [plugin]: { open: true, content: '', loading: true, editing: false, draft: '' }
    }));
    try {
      const res = await fetch(`/api/cvars/raw?plugin=${encodeURIComponent(plugin)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRawState((prev) => ({
        ...prev,
        [plugin]: { open: true, content: data.content, loading: false, editing: false, draft: data.content }
      }));
    } catch (e) {
      addToast(`Failed to load ${plugin}.cfg: ${e.message}`, 'error');
      setRawState((prev) => ({ ...prev, [plugin]: { open: false, content: '', loading: false, editing: false, draft: '' } }));
    }
  };

  const closeRaw = (plugin) => {
    setRawState((prev) => ({ ...prev, [plugin]: { ...prev[plugin], open: false, editing: false } }));
  };

  const copyRaw = (plugin) => {
    const content = rawState[plugin]?.content ?? '';
    navigator.clipboard.writeText(content).then(() => {
      addToast(`Copied ${plugin}.cfg to clipboard`, 'success');
    }).catch(() => {
      addToast('Copy failed — check browser permissions', 'error');
    });
  };

  const startEdit = (plugin) => {
    setRawState((prev) => ({
      ...prev,
      [plugin]: { ...prev[plugin], editing: true, draft: prev[plugin]?.content ?? '' }
    }));
  };

  const cancelEdit = (plugin) => {
    setRawState((prev) => ({ ...prev, [plugin]: { ...prev[plugin], editing: false } }));
  };

  const saveRaw = async (plugin) => {
    const draft = rawState[plugin]?.draft ?? '';
    try {
      const res = await fetch('/api/cvars/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin, content: draft })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Save failed');
      setRawState((prev) => ({
        ...prev,
        [plugin]: { ...prev[plugin], content: draft, editing: false }
      }));
      addToast(`Saved ${plugin}.cfg`, 'success');
    } catch (e) {
      addToast(`Save failed: ${e.message}`, 'error');
    }
  };

  // ---- Filter ----
  const q = search.trim().toLowerCase();
  const filteredGroups = groups
    .map((group) => {
      const cvars = group.cvars.filter((cvar) => {
        if (!q) return true;
        const hay = `${cvar.name || ''} ${cvar.desc || ''}`.toLowerCase();
        return hay.includes(q);
      });
      return { ...group, cvars };
    })
    .filter((group) => group.cvars.length > 0);

  return (
    <div className="plugins-panel">
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)', flex: 1, minWidth: 200 }}>{loading ? 'Loading...' : note}</div>
        <input
          type="text"
          className="cvars-search-input"
          placeholder="Search Cvars by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }} onClick={fetchCvars}>
          ↻ Refresh
        </button>
      </div>

      <div className="plugins-list" style={{ padding: 16 }}>
        {!loading && groups.length === 0 ? (
          <div className="empty-state">
            <div className="big">⚙️</div>
            <p>Click Refresh to view Cvars from config files</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="empty-state">
            <div className="big">🔎</div>
            <p>No Cvars matched your search</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const raw = rawState[group.plugin] || {};
            return (
              <details key={group.plugin} className="cvar-group" open>
                <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📦 {group.plugin}.cfg</span>
                  {/* Raw CFG toggle button inside summary */}
                  <span
                    title={raw.open ? 'Close raw CFG view' : 'View / Edit raw .cfg file'}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (raw.open) {
                        closeRaw(group.plugin);
                      } else {
                        openRaw(group.plugin);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      padding: '3px 9px',
                      borderRadius: 5,
                      background: raw.open ? 'rgba(91,200,245,0.2)' : 'rgba(91,200,245,0.09)',
                      color: 'var(--blue)',
                      border: '1px solid rgba(91,200,245,0.25)',
                      fontFamily: 'inherit',
                      transition: 'background 0.2s',
                      marginLeft: 8,
                      flexShrink: 0,
                      userSelect: 'none'
                    }}
                  >
                    {raw.open ? '✕ Close CFG' : '📄 Raw CFG'}
                  </span>
                </summary>

                {/* Raw CFG panel */}
                {raw.open && (
                  <div style={{
                    margin: '0 0 0 0',
                    borderBottom: '1px solid var(--border)',
                    background: '#090b10',
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden'
                  }}>
                    {/* Raw toolbar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      background: 'rgba(91,200,245,0.05)',
                      borderBottom: '1px solid rgba(91,200,245,0.12)'
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                        {raw.loading ? 'Loading...' : `left4dead2/cfg/sourcemod/${group.plugin}.cfg`}
                      </span>
                      {!raw.loading && !raw.editing && (
                        <>
                          <button
                            className="btn btn-ghost"
                            style={{ width: 'auto', margin: 0, padding: '4px 10px', fontSize: 11 }}
                            onClick={() => copyRaw(group.plugin)}
                          >
                            📋 Copy
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ width: 'auto', margin: 0, padding: '4px 10px', fontSize: 11 }}
                            onClick={() => startEdit(group.plugin)}
                          >
                            ✏️ Edit
                          </button>
                        </>
                      )}
                      {raw.editing && (
                        <>
                          <button
                            className="btn btn-primary"
                            style={{ width: 'auto', margin: 0, padding: '4px 12px', fontSize: 11 }}
                            onClick={() => saveRaw(group.plugin)}
                          >
                            💾 Save
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ width: 'auto', margin: 0, padding: '4px 10px', fontSize: 11 }}
                            onClick={() => cancelEdit(group.plugin)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>

                    {/* Content area */}
                    {raw.loading ? (
                      <div style={{ padding: 20, color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                        Loading {group.plugin}.cfg...
                      </div>
                    ) : raw.editing ? (
                      <textarea
                        value={raw.draft}
                        onChange={(e) => setRawState((prev) => ({
                          ...prev,
                          [group.plugin]: { ...prev[group.plugin], draft: e.target.value }
                        }))}
                        spellCheck={false}
                        style={{
                          width: '100%',
                          minHeight: 260,
                          background: '#090b10',
                          color: '#a8c0e0',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 12.5,
                          lineHeight: 1.7,
                          padding: '14px 16px',
                          border: 'none',
                          outline: 'none',
                          resize: 'vertical',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <pre style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12.5,
                        lineHeight: 1.7,
                        color: '#a8c0e0',
                        padding: '14px 16px',
                        margin: 0,
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: 320,
                        whiteSpace: 'pre'
                      }}>
                        {raw.content}
                      </pre>
                    )}
                  </div>
                )}

                {/* Regular form editor */}
                <div className="cvar-group-body">
                  {group.cvars.map((cvar) => (
                    <div key={`${group.plugin}-${cvar.name}`} className="cvar-item">
                      <div style={{ paddingRight: 20, flex: 1 }}>
                        <div className="cvar-name">{cvar.name}</div>
                        <div className="cvar-desc">{cvar.desc || 'No description available'}</div>
                      </div>
                      <div className="cvar-controls">
                        <input
                          type="text"
                          value={values[cvar.name] ?? ''}
                          onChange={(e) => setValues((prev) => ({ ...prev, [cvar.name]: e.target.value }))}
                        />
                        <button className="btn btn-primary cvar-save-btn" onClick={() => saveCvar(cvar.name)}>
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TabCvars;
