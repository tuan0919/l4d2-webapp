import React, { useMemo, useState, useRef } from 'react';

const TabAddons = ({ addToast, onAddonsUpdated }) => {
  const [addons, setAddons] = useState([]);
  const [note, setNote] = useState('Installed Addons (.vpk)');
  const [workshopUrl, setWorkshopUrl] = useState('');
  const fileInputRef = useRef(null);
  const [installing, setInstalling] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStatus, setProgressStatus] = useState('Connecting to SteamCMD...');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressSuccess, setProgressSuccess] = useState(false);
  const [progressError, setProgressError] = useState(false);

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
    const url = workshopUrl.trim();
    if (!url) {
      addToast('Please enter a workshop URL', 'error');
      return;
    }

    setInstalling(true);
    setProgressVisible(true);
    setProgressStatus('Connecting...');
    setProgressPercent(0);
    setProgressSuccess(false);
    setProgressError(false);

    try {
      const response = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.body) {
        throw new Error('No streaming body');
      }

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

            if (event === 'error') {
              addToast(parsed.message || 'Workshop install failed', 'error');
              setProgressStatus(`Error: ${parsed.message || 'Unknown error'}`);
              setProgressError(true);
              setInstalling(false);
            }

            if (event === 'success') {
              addToast(parsed.message || 'Workshop map installed', 'success');
              setProgressStatus('Installed!');
              setProgressPercent(100);
              setProgressSuccess(true);
              setInstalling(false);
              setWorkshopUrl('');
              fetchAddons();

              setTimeout(() => {
                setProgressVisible(false);
                setProgressSuccess(false);
                setProgressError(false);
              }, 3000);
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch {
      addToast('Streaming connection lost', 'error');
      setProgressStatus('Error: Streaming connection lost');
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

    const formData = new FormData();
    formData.append('addonFile', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/addons/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgressPercent(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        addToast(`Uploaded ${file.name}`, 'success');
        setProgressStatus(`Upload of ${file.name} complete!`);
        setProgressPercent(100);
        setProgressSuccess(true);
        fetchAddons();
      } else {
        let errorMsg = 'Upload failed';
        try { errorMsg = JSON.parse(xhr.responseText)?.error || errorMsg; } catch (e) {}
        addToast(errorMsg, 'error');
        setProgressStatus(`Error: ${errorMsg}`);
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
      setProgressStatus('Error: Upload connection failed');
      setProgressError(true);
      setInstalling(false);
    };

    xhr.send(formData);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="plugins-panel">
      <div className="addons-install-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Option 1: Install from Workshop</h2>
          <div className="input-row">
            <input
              type="text"
              placeholder="Paste Steam Workshop URL here..."
              value={workshopUrl}
              onChange={(e) => setWorkshopUrl(e.target.value)}
              disabled={installing}
            />
            <button className="btn btn-primary" style={{ width: 120, margin: 0 }} onClick={installWorkshop} disabled={installing}>
              {installing ? 'Running...' : '📥 Install'}
            </button>
          </div>
        </div>

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

        {progressVisible && (
          <div className="workshop-progress" style={{
            marginTop: '8px', padding: '14px',
            background: 'rgba(0,0,0,0.25)', borderRadius: '8px',
            border: progressError ? '1px solid var(--red)' : progressSuccess ? '1px solid var(--green)' : '1px solid var(--border-color)'
          }}>
            <div className="workshop-progress-header" style={{ marginBottom: '8px' }}>
              <span className="workshop-status" style={{ fontWeight: 500 }}>{progressStatus}</span>
              <span className="workshop-pct">{Math.round(progressPercent)}%</span>
            </div>
            <div className="hp-bar-bg" style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="hp-bar-fill"
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  borderRadius: 5,
                  background: progressError ? 'var(--red)' : progressSuccess ? 'var(--green)' : 'var(--blue)',
                  transition: 'width 0.2s ease, background 0.3s'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="plugins-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{note}</div>
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }} onClick={fetchAddons}>
          ↻ Refresh
        </button>
      </div>

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
