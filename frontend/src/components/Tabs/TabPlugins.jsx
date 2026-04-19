import React, { useMemo, useState } from 'react';

const TabPlugins = ({ setPluginCount, addToast }) => {
  const [plugins, setPlugins] = useState([]);
  const [errors, setErrors] = useState([]);
  const [note, setNote] = useState('Click Refresh to fetch plugin list');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);

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

  const reloadPlugins = async () => {
    setReloading(true);
    setNote('Reloading plugins on server...');

    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'sm plugins refresh' })
      });
      const data = await response.json();

      if (data?.error) {
        addToast?.(data.error || 'Failed to reload plugins', 'error');
        setNote(`Reload failed: ${data.error}`);
        return;
      }

      addToast?.('Reloaded plugins successfully', 'success');
      await fetchPlugins();
    } catch {
      addToast?.('Network error', 'error');
      setNote('Reload failed: network error');
    } finally {
      setReloading(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredPlugins = useMemo(() => {
    if (!query) return plugins;
    return plugins.filter((plugin) => (plugin.name || '').toLowerCase().includes(query));
  }, [plugins, query]);

  return (
    <div className="plugins-panel">
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)', flex: 1, minWidth: 200 }}>
          {loading ? 'Loading...' : reloading ? 'Reloading...' : note}
        </div>
        <input
          type="text"
          className="cvars-search-input"
          placeholder="Search plugins by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }}
          onClick={reloadPlugins}
          disabled={loading || reloading}
        >
          ↻ Reload Plugins
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }}
          onClick={fetchPlugins}
          disabled={loading || reloading}
        >
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
        ) : !loading && filteredPlugins.length === 0 ? (
          <div className="empty-state">
            <div className="big">🔎</div>
            <p>No plugins matched your search</p>
          </div>
        ) : (
          filteredPlugins.map((plugin) => (
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
