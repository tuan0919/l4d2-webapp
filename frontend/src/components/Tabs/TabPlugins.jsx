import React, { useState } from 'react';

const TabPlugins = ({ setPluginCount }) => {
  const [plugins, setPlugins] = useState([]);
  const [errors, setErrors] = useState([]);
  const [note, setNote] = useState('Click Refresh to fetch plugin list');
  const [loading, setLoading] = useState(false);

  const fetchPlugins = async () => {
    setLoading(true);
    setNote('Fetching from server...');
    try {
      const response = await fetch('/api/plugins');
      const data = await response.json();
      const list = data.plugins || [];
      const errs = data.errors || [];

      setPlugins(list);
      setErrors(errs);
      if (typeof setPluginCount === 'function') setPluginCount(list.length);

      if (data.error && list.length === 0) {
        setNote(`Error: ${data.error}`);
        return;
      }

      if (list.length === 0 && errs.length === 0) {
        setNote('No plugins found (server may still be loading)');
      } else {
        setNote(`${list.length} plugin${list.length !== 1 ? 's' : ''} loaded`);
      }
    } catch {
      setPlugins([]);
      setErrors([]);
      if (typeof setPluginCount === 'function') setPluginCount(null);
      setNote('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plugins-panel">
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{loading ? 'Loading...' : note}</div>
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }} onClick={fetchPlugins}>
          ↻ Refresh
        </button>
      </div>

      <div className="plugins-list">
        {errors.length > 0 && (
          <div
            style={{
              background: 'rgba(255,85,85,0.08)',
              border: '1px solid rgba(255,85,85,0.2)',
              borderLeft: '3px solid var(--red)',
              padding: '12px 16px',
              marginBottom: 12
            }}
          >
            <h3 style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ Failed Plugins ({errors.length})
            </h3>
            <ul
              style={{
                color: 'var(--text)',
                fontSize: 11,
                marginLeft: 20,
                fontFamily: 'JetBrains Mono, monospace',
                opacity: 0.9,
                lineHeight: 1.5
              }}
            >
              {errors.map((err, idx) => (
                <li key={`${err}-${idx}`} style={{ marginBottom: 4 }}>
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && plugins.length === 0 ? (
          <div className="empty-state">
            <div className="big">🧩</div>
            <p>Click Refresh to load plugins from server</p>
          </div>
        ) : (
          plugins.map((plugin) => (
            <div className="plugin-item" key={`${plugin.index}-${plugin.name}`}>
              <div className="plugin-index">{plugin.index}</div>
              <div className="plugin-info">
                <div className="plugin-name">{plugin.name}</div>
                <div className="plugin-meta">by {plugin.author}</div>
              </div>
              <span className="plugin-version">v{plugin.version}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TabPlugins;
