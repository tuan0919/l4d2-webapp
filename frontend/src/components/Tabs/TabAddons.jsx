import React, { useMemo, useState, useRef } from 'react';

const TabAddons = ({ addToast, onAddonsUpdated }) => {
  const [addons, setAddons] = useState([]);
  const [note, setNote] = useState('Installed Addons (.vpk)');
  const [workshopInput, setWorkshopInput] = useState('');
  const fileInputRef = useRef(null);
  const [installing, setInstalling] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressSuccess, setProgressSuccess] = useState(false);
  const [progressError, setProgressError] = useState(false);
  // New: resolved items list + current item being downloaded
  const [resolvedItems, setResolvedItems] = useState([]); // [{ id, title }]
  const [currentItem, setCurrentItem] = useState(null);   // { index, total, id, title }

  const sortedAddons = useMemo(() => addons.slice(), [addons]);

  const fetchAddons = async () => {
    setNote('Loading...');
    try {
      const response = await fetch('/api/addons');
      const data = await response.json();
      const list = data.addons || [];
      setAddons(list);
      setNote(`${list.length} Custom Map(s) Installed`);
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
    setProgressSuccess(false);
    setProgressError(false);
    setResolvedItems([]);
    setCurrentItem(null);

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
              setProgressStatus(parsed.log || parsed.message || 'Working...');
            }

            if (event === 'progress') {
              setProgressPercent(Number(parsed.percent || 0));
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
                title: parsed.title
              });
              setProgressPercent(0);
            }

            if (event === 'error') {
              addToast(parsed.message || 'Workshop install failed', 'error');
              setProgressStatus(`❌ ${parsed.message || 'Unknown error'}`);
              setProgressError(true);
              setInstalling(false);
            }

            if (event === 'success') {
              addToast(parsed.message || 'Workshop map(s) installed', 'success');
              setProgressStatus(`✅ ${parsed.message || 'Done!'}`);
              setProgressPercent(100);
              setProgressSuccess(true);
              setInstalling(false);
              setWorkshopInput('');
              setCurrentItem(null);
              fetchAddons();
              setTimeout(() => {
                setProgressVisible(false);
                setProgressSuccess(false);
                setProgressError(false);
                setResolvedItems([]);
              }, 4000);
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch {
      addToast('Streaming connection lost', 'error');
      setProgressStatus('❌ Streaming connection lost');
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
    setProgressSuccess(false);
    setProgressError(false);
    setResolvedItems([]);
    setCurrentItem(null);

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
        setProgressSuccess(true);
        fetchAddons();
      } else {
        let errorMsg = 'Upload failed';
        try { errorMsg = JSON.parse(xhr.responseText)?.error || errorMsg; } catch (e) {}
        addToast(errorMsg, 'error');
        setProgressStatus(`❌ ${errorMsg}`);
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

  return (
    <div className="plugins-panel">
      <div className="addons-install-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Option 1: Workshop */}
        <div>
          <h2 style={{ marginBottom: '4px' }}>Option 1: Install from Workshop</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            Paste one or more Workshop URLs / IDs (one per line). Supports single maps, multi-part maps, and collections.
            Dependencies are resolved automatically.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <textarea
              rows={3}
              placeholder={`https://steamcommunity.com/sharedfiles/filedetails/?id=123456789\n2345678901\nhttps://steamcommunity.com/workshop/filedetails/?id=3456789012`}
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
          <h2 style={{ marginBottom: '8px' }}>Option 2: Direct .vpk Upload</h2>
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
            {currentItem && currentItem.total > 1 && (
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
                  {currentItem.index + 1} / {currentItem.total}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentItem.title}
                </span>
              </div>
            )}

            {/* Status + percent */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)', flex: 1, paddingRight: 8, opacity: 0.9 }}>
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
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{note}</div>
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }} onClick={fetchAddons}>
          ↻ Refresh
        </button>
      </div>

      {/* Addons list */}
      <div className="plugins-list" style={{ padding: 0 }}>
        {sortedAddons.length === 0 ? (
          <div className="empty-state">
            <div className="big">📦</div>
            <p>Click Refresh to load custom maps</p>
          </div>
        ) : (
          sortedAddons.map((addon) => (
            <div key={addon.name} className="plugin-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="plugin-index"
                  style={{
                    fontSize: 16,
                    background: 'rgba(91,200,245,0.12)',
                    color: 'var(--blue)',
                    borderRadius: 6,
                    width: 36,
                    height: 36
                  }}
                >
                  📦
                </div>
                <div className="plugin-info" style={{ marginLeft: 4, flex: 1 }}>
                  <div className="plugin-name" style={{ fontWeight: 600 }}>{addon.name}</div>
                  <div className="plugin-meta">
                    {(Number(addon.size || 0) / (1024 * 1024)).toFixed(2)} MB • Modified{' '}
                    {addon.modified ? new Date(addon.modified).toLocaleDateString() : '—'}
                  </div>
                </div>
                <button
                  className="btn-kick"
                  style={{ padding: '6px 14px', width: 'auto' }}
                  onClick={() => deleteAddon(addon.name)}
                >
                  Delete
                </button>
              </div>

              {Array.isArray(addon.maps) && addon.maps.length > 0 ? (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {addon.maps
                    .slice()
                    .sort()
                    .map((map) => (
                      <button
                        key={`${addon.name}-${map}`}
                        className="btn btn-ghost"
                        style={{ width: 'auto', margin: 0, padding: '4px 10px', fontSize: 11, borderColor: 'rgba(91,200,245,0.3)' }}
                        onClick={() => changeMap(map)}
                      >
                        ▶ {map}
                      </button>
                    ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.7 }}>
                  No .bsp files detected inside this VPK
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TabAddons;
