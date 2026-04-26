import React, { useEffect, useMemo, useState } from 'react';

const Sidebar = ({ addToast }) => {
  const [selectedMap, setSelectedMap] = useState('c2m1_highway');
  const [maxPlayers, setMaxPlayers] = useState(32);
  const [addons, setAddons] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [serverInfo, setServerInfo] = useState({
    sv_contact: '',
    sv_tags: '',
    sv_search_key: '',
    sv_gametypes: '',
    sv_region: 4,
    l4d_current_mode: '',
    z_difficulty: 'Normal',
    friendly_fire: '1',
    sv_consistency: '0'
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  const customMapOptions = useMemo(() => {
    const options = [];
    addons.forEach((addon) => {
      if (Array.isArray(addon.maps) && addon.maps.length > 0) {
        const addonLabel = addon.displayName || addon.name;
        addon.maps.slice().sort().forEach((map) => {
          options.push({ value: map, label: `${map} (${addonLabel})` });
        });
      }
    });
    return options;
  }, [addons]);

  useEffect(() => {
    fetchAddons();
    fetchServerCfg();
  }, []);

  const fetchAddons = async () => {
    try {
      const res = await fetch('/api/addons');
      const data = await res.json();
      setAddons(data.addons || []);
    } catch {
      setAddons([]);
    }
  };

  const fetchServerCfg = async () => {
    try {
      const res = await fetch('/api/servercfg');
      const data = await res.json();
      if (data.config) {
        setServerInfo(prev => ({ ...prev, ...data.config }));
      }
    } catch { }
  };

  const fetchLiveConfig = async () => {
    setLoadingLive(true);
    try {
      const liveRes = await fetch('/api/servercfg/live');
      const liveData = await liveRes.json();
      if (liveData.config && Object.keys(liveData.config).length > 0) {
        setServerInfo(prev => ({ ...prev, ...liveData.config }));
        addToast('Synced live values from server!', 'success');
      } else {
        addToast('No live values returned (server may be offline)', 'error');
      }
    } catch {
      addToast('Failed to sync from server', 'error');
    }
    setLoadingLive(false);
  };

  const apiPost = async (path, body, successMessage) => {
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.ok || data.success || !data.error) {
        addToast(successMessage, 'success');
      } else {
        addToast(data.error || 'Request failed', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  const applyMap = async () => {
    if (!selectedMap) return;
    setLoadingMap(true);
    await apiPost('/api/map', { map: selectedMap }, `Changing map to ${selectedMap}`);
    setLoadingMap(false);
  };

  const applyMaxPlayers = async () => {
    const count = Number(maxPlayers);
    if (!Number.isFinite(count) || count < 1 || count > 32) {
      addToast('Max players must be between 1 and 32', 'error');
      return;
    }
    setLoadingPlayers(true);
    await apiPost('/api/maxplayers', { count }, `Set max players to ${count}`);
    setLoadingPlayers(false);
  };

  const runQuickAction = async (command, label) => {
    await apiPost('/api/command', { command }, `Executed: ${label}`);
  };

  const handleServerInfoChange = (key, val) => {
    setServerInfo(prev => ({ ...prev, [key]: val }));
  };

  const applyServerInfo = async () => {
    setLoadingConfig(true);
    await apiPost('/api/servercfg', { config: serverInfo }, 'Server info updated successfully!');
    setLoadingConfig(false);
  };

  return (
    <aside className="sidebar-container">
      <div className="card">
        <div className="card-header">
          <div className="card-icon orange">🗺️</div>
          <h2>Map Selection</h2>
        </div>
        <div className="card-body">
          <label htmlFor="mapSelect">Campaign Map</label>
          <select id="mapSelect" value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)}>
            <optgroup label="▸ Dead Center">
              <option value="c1m1_hotel">c1m1 – The Hotel</option>
              <option value="c1m2_streets">c1m2 – The Streets</option>
              <option value="c1m3_mall">c1m3 – The Mall</option>
              <option value="c1m4_atrium">c1m4 – The Atrium</option>
            </optgroup>
            <optgroup label="▸ Dark Carnival">
              <option value="c2m1_highway">c2m1 – The Highway</option>
              <option value="c2m2_fairgrounds">c2m2 – The Fairgrounds</option>
              <option value="c2m3_coaster">c2m3 – The Coaster</option>
              <option value="c2m4_barns">c2m4 – The Barns</option>
              <option value="c2m5_concert">c2m5 – The Concert</option>
            </optgroup>
            <optgroup label="▸ Swamp Fever">
              <option value="c3m1_plankcountry">c3m1 – Plank Country</option>
              <option value="c3m2_swamp">c3m2 – The Swamp</option>
              <option value="c3m3_shantytown">c3m3 – Shantytown</option>
              <option value="c3m4_plantation">c3m4 – The Plantation</option>
            </optgroup>
            <optgroup label="▸ Hard Rain">
              <option value="c4m1_milltown_a">c4m1 – The Milltown</option>
              <option value="c4m2_sugarmill_a">c4m2 – The Sugar Mill</option>
              <option value="c4m3_sugarmill_b">c4m3 – Mill Escape</option>
              <option value="c4m4_milltown_b">c4m4 – Return to Town</option>
              <option value="c4m5_milltown_escape">c4m5 – Town Escape</option>
            </optgroup>
            <optgroup label="▸ The Parish">
              <option value="c5m1_waterfront">c5m1 – The Waterfront</option>
              <option value="c5m2_park">c5m2 – The Park</option>
              <option value="c5m3_cemetery">c5m3 – The Cemetery</option>
              <option value="c5m4_quarter">c5m4 – The Quarter</option>
              <option value="c5m5_bridge">c5m5 – The Bridge</option>
            </optgroup>
            <optgroup label="▸ The Passing">
              <option value="c6m1_riverbank">c6m1 – The Riverbank</option>
              <option value="c6m2_bedlam">c6m2 – The Bedlam</option>
              <option value="c6m3_port">c6m3 – The Port</option>
            </optgroup>
            <optgroup label="▸ The Sacrifice">
              <option value="c7m1_docks">c7m1 – The Docks</option>
              <option value="c7m2_barge">c7m2 – The Barge</option>
              <option value="c7m3_port">c7m3 – Port Finale</option>
            </optgroup>
            <optgroup label="▸ No Mercy">
              <option value="c8m1_apartment">c8m1 – The Apartments</option>
              <option value="c8m2_subway">c8m2 – The Subway</option>
              <option value="c8m3_sewers">c8m3 – The Sewer</option>
              <option value="c8m4_interior">c8m4 – The Hospital</option>
              <option value="c8m5_rooftop">c8m5 – Rooftop Finale</option>
            </optgroup>
            <optgroup label="▸ Custom Maps (Workshop)">
              {customMapOptions.length === 0 ? (
                <option disabled>No custom maps found</option>
              ) : (
                customMapOptions.map((opt) => (
                  <option key={`${opt.value}-${opt.label}`} value={opt.value}>{opt.label}</option>
                ))
              )}
            </optgroup>
          </select>
          <button className="btn btn-primary" onClick={applyMap} disabled={loadingMap}>
            {loadingMap ? '⏳ Changing...' : '🗺 Change Level'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-icon blue">👥</div>
          <h2>Player Limit</h2>
        </div>
        <div className="card-body">
          <label htmlFor="maxPlayersInput">Max Players (1–32)</label>
          <div className="input-row">
            <input
              id="maxPlayersInput"
              type="number"
              min="1"
              max="32"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
            <button className="btn btn-primary" onClick={applyMaxPlayers} disabled={loadingPlayers}>
              {loadingPlayers ? '...' : 'Set'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-icon green">⚙️</div>
          <h2>Server Config</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label>Contact Name / Admin</label>
              <input type="text" value={serverInfo.sv_contact || ''} onChange={e => handleServerInfoChange('sv_contact', e.target.value)} />
            </div>
            <div>
              <label>Tags</label>
              <input type="text" value={serverInfo.sv_tags || ''} onChange={e => handleServerInfoChange('sv_tags', e.target.value)} />
            </div>
            <div>
              <label>Search Key</label>
              <input type="text" value={serverInfo.sv_search_key || ''} onChange={e => handleServerInfoChange('sv_search_key', e.target.value)} />
            </div>
            <div>
              <label>Game Types (e.g., coop, realism)</label>
              <input type="text" value={serverInfo.sv_gametypes || ''} onChange={e => handleServerInfoChange('sv_gametypes', e.target.value)} />
            </div>
            <div>
              <label>Server Region (4 = Asia)</label>
              <input type="number" min="0" max="255" value={serverInfo.sv_region || ''} onChange={e => handleServerInfoChange('sv_region', e.target.value)} />
            </div>
            <div>
              <label>Server Name Override</label>
              <input type="text" value={serverInfo.l4d_current_mode || ''} onChange={e => handleServerInfoChange('l4d_current_mode', e.target.value)} />
            </div>
            <div>
              <label>Difficulty</label>
              <select value={serverInfo.z_difficulty || 'Normal'} onChange={e => handleServerInfoChange('z_difficulty', e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
                <option value="Hard">Hard</option>
                <option value="Impossible">Impossible (Expert)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="checkbox" id="ff_toggle" checked={serverInfo.friendly_fire === '1'} onChange={e => handleServerInfoChange('friendly_fire', e.target.checked ? '1' : '0')} style={{ width: 'auto', marginBottom: 0 }} />
              <label htmlFor="ff_toggle" style={{ margin: 0, cursor: 'pointer' }}>Enable Friendly Fire</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="checkbox" id="cons_toggle" checked={serverInfo.sv_consistency === '1'} onChange={e => handleServerInfoChange('sv_consistency', e.target.checked ? '1' : '0')} style={{ width: 'auto', marginBottom: 0 }} />
              <label htmlFor="cons_toggle" style={{ margin: 0, cursor: 'pointer' }}>Enforce File Consistency</label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={fetchLiveConfig} disabled={loadingLive} title="Query live cvar values from the running game server">
                {loadingLive ? '⏳ Syncing...' : '🔄 Sync from Server'}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={applyServerInfo} disabled={loadingConfig}>
                {loadingConfig ? 'Saving...' : '💾 Apply Config'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};


export default Sidebar;
