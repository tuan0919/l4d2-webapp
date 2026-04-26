import React, { useMemo, useState, useRef } from 'react';

const isMapAddon = (addon) => addon?.type === 'map' || (Array.isArray(addon?.maps) && addon.maps.length > 0);

const getAddonTitle = (addon) => addon?.displayName || addon?.title || addon?.name || 'Unknown addon';

const formatAddonSize = (size) => `${(Number(size || 0) / (1024 * 1024)).toFixed(2)} MB`;

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${Math.round(value)} B`;
};

const TabAddons = ({ addToast, onAddonsUpdated }) => {
  const [addons, setAddons] = useState([]);
  const [note, setNote] = useState('Workshop Addons (.vpk)');
  const [activeFilter, setActiveFilter] = useState('all');
  const [workshopInput, setWorkshopInput] = useState('');
  const fileInputRef = useRef(null);
  const [installing, setInstalling] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressDetail, setProgressDetail] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressSuccess, setProgressSuccess] = useState(false);
  const [progressError, setProgressError] = useState(false);
  // New: resolved items list + current item being downloaded
  const [resolvedItems, setResolvedItems] = useState([]); // [{ id, title }]
  const [currentItem, setCurrentItem] = useState(null);   // { index, total, id, title }
  const [discoveredMaps, setDiscoveredMaps] = useState([]); // BSP names found after install

  const sortedAddons = useMemo(() => addons.slice().sort((a, b) => {
    const typeDiff = Number(isMapAddon(b)) - Number(isMapAddon(a));
    if (typeDiff !== 0) return typeDiff;
    return getAddonTitle(a).localeCompare(getAddonTitle(b));
  }), [addons]);

  const addonStats = useMemo(() => {
    const maps = addons.filter(isMapAddon).length;
    return { total: addons.length, maps, mods: addons.length - maps };
  }, [addons]);

  const visibleAddons = useMemo(() => sortedAddons.filter((addon) => {
    if (activeFilter === 'maps') return isMapAddon(addon);
    if (activeFilter === 'mods') return !isMapAddon(addon);
    return true;
  }), [activeFilter, sortedAddons]);

  const filterOptions = [
    { id: 'all', label: 'All', count: addonStats.total },
    { id: 'maps', label: 'Maps', count: addonStats.maps },
    { id: 'mods', label: 'Mods', count: addonStats.mods }
  ];

  const fetchAddons = async () => {
    setNote('Loading...');
    try {
      const response = await fetch('/api/addons');
      const data = await response.json();
      const list = data.addons || [];
      setAddons(list);
      const mapCount = list.filter(isMapAddon).length;
      setNote(`${list.length} Workshop Addon(s) Installed • ${mapCount} map(s) • ${list.length - mapCount} mod(s)`);
      if (typeof onAddonsUpdated === 'function') onAddonsUpdated(list);
    } catch {
      setAddons([]);
      setNote('Error loading addons');
      if (typeof onAddonsUpdated === 'function') onAddonsUpdated([]);
    }
  };

  const changeMap = async (map) => {
    try {
      const response = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ map })
      });
      const data = await response.json();
      if (data.ok || data.success || !data.error) addToast(`Changing map to ${map}`, 'success');
      else addToast(data.error || `Failed to change map to ${map}`, 'error');
    } catch {
      addToast('Network error', 'error');
    }
  };

  const deleteAddon = async (name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    try {
      const response = await fetch(`/api/addons/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success || data.ok || !data.error) {
        addToast(`Deleted ${name}`, 'success');
        fetchAddons();
      } else {
        addToast(`Failed to delete: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  const installWorkshop = async () => {
    const lines = workshopInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      addToast('Please enter at least one workshop URL or ID', 'error');
      return;
    }

    setInstalling(true);
    setProgressVisible(true);
    setProgressStatus('Connecting...');
    setProgressPercent(0);
    setProgressDetail(null);
    setProgressSuccess(false);
    setProgressError(false);
    setResolvedItems([]);
    setCurrentItem(null);
    setDiscoveredMaps([]);

    try {
      const response = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: lines })
      });

      if (!response.body) throw new Error('No streaming body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let event = 'message';
          let data = '';

          chunk.split('\n').forEach((line) => {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            if (line.startsWith('data: ')) data = line.slice(6).trim();
          });

          if (data) {
            const parsed = JSON.parse(data);

            if (event === 'status') {
              setProgressStatus(parsed.message || 'Working...');
            }

            if (event === 'progress') {
              const nextPercent = Number(parsed.percent);
              if (Number.isFinite(nextPercent)) setProgressPercent(nextPercent);
              setProgressDetail({
                phase: parsed.phase || 'download',
                downloadedBytes: parsed.downloadedBytes,
                totalBytes: parsed.totalBytes
              });

              if (parsed.message) {
                const hasBytes = Number(parsed.downloadedBytes) > 0 && Number(parsed.totalBytes) > 0;
                const byteText = hasBytes
                  ? ` (${formatBytes(parsed.downloadedBytes)} / ${formatBytes(parsed.totalBytes)})`
                  : '';
                setProgressStatus(`${parsed.message}${byteText}`);
              }
            }

            // New: list of resolved items (with titles)
            if (event === 'resolved') {
              setResolvedItems(parsed.items || []);
            }

            // New: current item being downloaded
            if (event === 'item') {
              setCurrentItem({
                index: parsed.index,
                total: parsed.total,
                id: parsed.id,
                title: parsed.title,
                fileSize: parsed.fileSize
              });
              setProgressDetail(parsed.fileSize ? { phase: 'download', downloadedBytes: 0, totalBytes: parsed.fileSize } : null);
              setProgressPercent(0);
            }

            if (event === 'error') {
              addToast(parsed.message || 'Workshop install failed', 'error');
              setProgressStatus(`❌ ${parsed.message || 'Unknown error'}`);
              setProgressError(true);
              setInstalling(false);
            }

            if (event === 'success') {
              const detectedMaps = parsed.maps || [];
              addToast(parsed.message || 'Workshop addon(s) installed', 'success');
              setProgressStatus(`✅ ${parsed.message || 'Done!'}`);
              setProgressPercent(100);
              setProgressDetail(null);
              setProgressSuccess(true);
              setInstalling(false);
              setWorkshopInput('');
              setCurrentItem(null);
              setDiscoveredMaps(detectedMaps);
              fetchAddons();

              if (detectedMaps.length === 0) {
                setTimeout(() => {
                  setProgressVisible(false);
                  setProgressSuccess(false);
                  setProgressError(false);
                  setResolvedItems([]);
                  setDiscoveredMaps([]);
                }, 5000);
              }
              // If maps detected, keep progress box open so user can click changelevel
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch {
      addToast('Streaming connection lost', 'error');
      setProgressStatus('❌ Streaming connection lost');
      setProgressDetail(null);
      setProgressError(true);
      setInstalling(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setInstalling(true);
    setProgressVisible(true);
    setProgressStatus(`Uploading ${file.name}...`);
    setProgressPercent(0);
    setProgressDetail(null);
    setProgressSuccess(false);
    setProgressError(false);
    setResolvedItems([]);
    setCurrentItem(null);
    setDiscoveredMaps([]);

    const formData = new FormData();
    formData.append('addonFile', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/addons/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgressPercent((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        addToast(`Uploaded ${file.name}`, 'success');
        setProgressStatus(`✅ Upload of ${file.name} complete!`);
        setProgressPercent(100);
        setProgressDetail(null);
        setProgressSuccess(true);
        fetchAddons();
      } else {
        let errorMsg = 'Upload failed';
        try { errorMsg = JSON.parse(xhr.responseText)?.error || errorMsg; } catch (e) {}
        addToast(errorMsg, 'error');
        setProgressStatus(`❌ ${errorMsg}`);
        setProgressDetail(null);
        setProgressError(true);
      }
      setInstalling(false);
      setTimeout(() => {
        if (xhr.status === 200) {
          setProgressVisible(false);
          setProgressSuccess(false);
        }
      }, 5000);
    };

    xhr.onerror = () => {
      addToast('Upload network error', 'error');
      setProgressStatus('❌ Upload connection failed');
      setProgressDetail(null);
      setProgressError(true);
      setInstalling(false);
    };

    xhr.send(formData);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Progress border color
  const progressBorderColor = progressError
    ? '1px solid var(--red)'
    : progressSuccess
    ? '1px solid var(--green)'
    : '1px solid var(--border-color)';

  // --- Overall progress when downloading multiple items
  const overallPercent = currentItem && currentItem.total > 1
    ? ((currentItem.index / currentItem.total) * 100) + (progressPercent / currentItem.total)
    : progressPercent;

  const progressDetailText = progressDetail && Number(progressDetail.downloadedBytes) > 0 && Number(progressDetail.totalBytes) > 0
    ? `${formatBytes(progressDetail.downloadedBytes)} / ${formatBytes(progressDetail.totalBytes)}`
    : '';

  return (
    <div className="plugins-panel">
      <div className="addons-install-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Option 1: Workshop */}
        <div>
          <h2 style={{ marginBottom: '4px' }}>Install Workshop Addons</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            Paste one or more Workshop item URLs / IDs (one per line). Required items are not detected automatically;
            paste each required item as a separate line when needed.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <textarea
              rows={3}
              placeholder={`https://steamcommunity.com/sharedfiles/filedetails/?id=123456789\n2345678901\nhttps://steamcommunity.com/sharedfiles/filedetails/?id=3456789012`}
              value={workshopInput}
              onChange={(e) => setWorkshopInput(e.target.value)}
              disabled={installing}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.6,
                outline: 'none'
              }}
            />
            <button
              className="btn btn-primary"
              style={{ width: 120, margin: 0, flexShrink: 0, alignSelf: 'flex-end', height: 38 }}
              onClick={installWorkshop}
              disabled={installing}
            >
              {installing ? '⏳ Running...' : '📥 Install'}
            </button>
          </div>
        </div>

        {/* Option 2: Direct upload */}
        <div>
          <h2 style={{ marginBottom: '8px' }}>Manual .vpk Upload</h2>
          <div className="input-row">
            <input
              type="file"
              accept=".vpk"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={installing}
              style={{
                flex: 1, padding: '8px',
                border: '1px dashed var(--border-color)',
                borderRadius: '6px', background: 'rgba(0,0,0,0.15)',
                color: 'var(--text-color)', cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* Progress box */}
        {progressVisible && (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '8px',
            border: progressBorderColor,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>

            {/* Current item label */}
            {currentItem && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: 'rgba(91,200,245,0.15)',
                  color: 'var(--blue)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5
                }}>
                  {currentItem.total > 1 ? `${currentItem.index + 1} / ${currentItem.total}` : 'ITEM'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentItem.title}
                </span>
              </div>
            )}

            {/* Status + percent */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)', flex: 1, paddingRight: 8, opacity: 0.9, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {progressStatus}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                {Math.round(progressPercent)}%
              </span>
            </div>

            {/* Per-item progress bar */}
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: 3,
                background: progressError ? 'var(--red)' : progressSuccess ? 'var(--green)' : 'var(--blue)',
                transition: 'width 0.2s ease, background 0.3s'
              }} />
            </div>

            {progressDetailText && (
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>Downloaded bytes</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{progressDetailText}</span>
              </div>
            )}

            {/* Overall progress bar (only when multiple items) */}
            {currentItem && currentItem.total > 1 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  Overall: {currentItem.index + 1} of {currentItem.total} items
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{
                    width: `${Math.min(overallPercent, 100)}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: 'rgba(91,200,245,0.5)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Resolved items list */}
            {resolvedItems.length > 0 && (
              <div style={{
                marginTop: 2,
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Queue ({resolvedItems.length} item{resolvedItems.length !== 1 ? 's' : ''})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                  {resolvedItems.map((item, i) => {
                    const isDone = currentItem && i < currentItem.index;
                    const isActive = currentItem && i === currentItem.index;
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          opacity: isDone ? 0.45 : 1,
                          color: isActive ? 'var(--blue)' : 'var(--text-color)'
                        }}
                      >
                        <span style={{ flexShrink: 0, width: 16, textAlign: 'center' }}>
                          {isDone ? '✓' : isActive ? '▶' : '○'}
                        </span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: 10, flexShrink: 0 }}>
                          {item.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discovered map names — changelevel buttons */}
            {discoveredMaps.length > 0 && progressSuccess && (
              <div style={{
                marginTop: 2,
                padding: '10px 12px',
                background: 'rgba(0,200,100,0.07)',
                borderRadius: 6,
                border: '1px solid rgba(0,200,100,0.2)'
              }}>
                <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  🗺️ Maps detected — click to changelevel:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {discoveredMaps.map(map => (
                    <button
                      key={map}
                      className="btn btn-ghost"
                      style={{
                        width: 'auto', margin: 0, padding: '5px 12px',
                        fontSize: 12, fontWeight: 600,
                        borderColor: 'rgba(0,200,100,0.4)',
                        color: 'var(--green)'
                      }}
                      onClick={() => {
                        changeMap(map);
                        addToast(`Changing level to ${map}...`, 'info');
                        setTimeout(() => {
                          setProgressVisible(false);
                          setProgressSuccess(false);
                          setResolvedItems([]);
                          setDiscoveredMaps([]);
                        }, 1500);
                      }}
                    >
                      ▶ {map}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  Tip: Start with the first map in the campaign (e.g., <code style={{fontSize:11}}>c1m1_*</code> pattern).
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="plugins-toolbar workshop-addons-toolbar">
        <div className="workshop-addons-summary">
          <div className="workshop-addons-note">{note}</div>
          <div className="workshop-addons-subnote">Maps expose changelevel shortcuts. Mods are tracked separately from campaign maps.</div>
        </div>
        <div className="workshop-addons-actions">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              className={`addon-filter-btn ${activeFilter === option.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(option.id)}
              type="button"
            >
              {option.label} <span>{option.count}</span>
            </button>
          ))}
          <button className="btn btn-ghost addon-refresh-btn" onClick={fetchAddons}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Addons list */}
      <div className="plugins-list workshop-addons-list">
        {sortedAddons.length === 0 ? (
          <div className="empty-state">
            <div className="big">📦</div>
            <p>Click Refresh to load Workshop addons</p>
          </div>
        ) : visibleAddons.length === 0 ? (
          <div className="empty-state">
            <div className="big">--</div>
            <p>No addons match this filter</p>
          </div>
        ) : (
          visibleAddons.map((addon) => {
            const mapAddon = isMapAddon(addon);
            const maps = Array.isArray(addon.maps) ? addon.maps.slice().sort() : [];
            const title = getAddonTitle(addon);
            return (
              <div key={addon.name} className={`workshop-addon-card ${mapAddon ? 'is-map' : 'is-mod'}`}>
                <div className="workshop-addon-main">
                  <div className="workshop-addon-kind" aria-hidden="true">
                    {mapAddon ? 'MAP' : 'MOD'}
                  </div>
                  <div className="workshop-addon-info">
                    <div className="workshop-addon-title-row">
                      <h3>{title}</h3>
                      <span className={`workshop-addon-badge ${mapAddon ? 'map' : 'mod'}`}>
                        {mapAddon ? 'Custom Map' : 'Addon Mod'}
                      </span>
                    </div>
                    <div className="workshop-addon-meta">
                      <span>{formatAddonSize(addon.size)}</span>
                      <span>Modified {addon.modified ? new Date(addon.modified).toLocaleDateString() : '—'}</span>
                      {addon.workshopId && <span>Workshop ID {addon.workshopId}</span>}
                    </div>
                    <div className="workshop-addon-file">
                      File: <code>{addon.name}</code>
                    </div>
                  </div>
                  <button
                    className="btn-kick workshop-addon-delete"
                    onClick={() => deleteAddon(addon.name)}
                  >
                    Delete
                  </button>
                </div>

                {mapAddon ? (
                  <div className="workshop-addon-maps">
                    <div className="workshop-addon-section-label">Maps inside this addon</div>
                    <div className="workshop-addon-map-list">
                      {maps.map((map) => (
                        <button
                          key={`${addon.name}-${map}`}
                          className="btn btn-ghost workshop-addon-map-btn"
                          onClick={() => changeMap(map)}
                        >
                          ▶ {map}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="workshop-addon-no-maps">
                    Gameplay/content addon. No map files detected, so it is not shown in the campaign map selector.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TabAddons;
