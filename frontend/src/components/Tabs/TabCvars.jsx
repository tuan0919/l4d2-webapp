import React, { useState } from 'react';

const TabCvars = ({ addToast }) => {
  const [groups, setGroups] = useState([]);
  const [note, setNote] = useState('Click Refresh to parse Cvar .cfg files');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({});

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
          filteredGroups.map((group) => (
            <details key={group.plugin} className="cvar-group" open>
              <summary>📦 {group.plugin}.cfg</summary>
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
          ))
        )}
      </div>
    </div>
  );
};

export default TabCvars;
