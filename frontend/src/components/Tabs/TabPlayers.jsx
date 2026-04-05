import React, { useEffect, useState } from 'react';

const WEAPON_MAP = {
  rifle: ['🔫', 'Rifle'],
  rifle_ak47: ['🔫', 'AK-47'],
  rifle_desert: ['🔫', 'Desert Rifle'],
  rifle_m60: ['🔫', 'M60'],
  rifle_sg552: ['🔫', 'SG552'],
  hunting_rifle: ['🎯', 'Hunting Rifle'],
  sniper_military: ['🎯', 'Mil.Sniper'],
  sniper_scout: ['🎯', 'Scout'],
  sniper_awp: ['🎯', 'AWP'],
  autoshotgun: ['💥', 'Auto SG'],
  shotgun_chrome: ['💥', 'Chrome SG'],
  shotgun_spas: ['💥', 'SPAS'],
  pumpshotgun: ['💥', 'Pump SG'],
  smg: ['🔫', 'SMG'],
  smg_silenced: ['🔫', 'Silenced SMG'],
  smg_mp5: ['🔫', 'MP5'],
  grenade_launcher: ['💣', 'GL'],
  pistol: ['🔫', 'Pistol'],
  pistol_magnum: ['🔫', 'Magnum'],
  chainsaw: ['⚙️', 'Chainsaw'],
  baseball_bat: ['🏏', 'Bat'],
  cricket_bat: ['🏏', 'Cricket Bat'],
  crowbar: ['🔧', 'Crowbar'],
  electric_guitar: ['🎸', 'Guitar'],
  fireaxe: ['🪓', 'Fire Axe'],
  frying_pan: ['🍳', 'Frying Pan'],
  golfclub: ['⛳', 'Golf Club'],
  katana: ['🗡️', 'Katana'],
  knife: ['🔪', 'Knife'],
  machete: ['🔪', 'Machete'],
  pitchfork: ['🍴', 'Pitchfork'],
  shovel: ['⛏️', 'Shovel'],
  tonfa: ['🥢', 'Tonfa'],
  pipe_bomb: ['💣', 'Pipebomb'],
  molotov: ['🔥', 'Molotov'],
  vomitjar: ['🍺', 'Bile Bomb'],
  first_aid_kit: ['🩹', 'Medkit'],
  defibrillator: ['⚡', 'Defib'],
  pain_pills: ['💊', 'Pills'],
  adrenaline: ['💉', 'Adrenaline'],
  upgradepack_explosive: ['💥', 'Explosive Ammo'],
  upgradepack_incendiary: ['🔥', 'Incendiary Ammo']
};

const MODEL_MAP = {
  gambler: ['🃏', 'Nick'],
  mechanic: ['🔧', 'Ellis'],
  coach: ['🏈', 'Coach'],
  producer: ['📺', 'Rochelle'],
  namvet: ['🎖️', 'Bill'],
  teenangst: ['🧥', 'Zoey'],
  biker: ['🏍️', 'Francis'],
  manager: ['💼', 'Louis']
};

const weaponDisplay = (wepId) => {
  if (!wepId || wepId === 'null') return ['⬜', '—'];
  return WEAPON_MAP[wepId] || ['🔫', wepId.replace(/_/g, ' ')];
};

const modelDisplay = (model) => MODEL_MAP[model] || ['👤', model || 'Unknown'];

const escapeSingleQuotes = (text) => String(text || '').replace(/'/g, "\\'");

const TabPlayers = ({ addToast }) => {
  const [players, setPlayers] = useState([]);
  const [source, setSource] = useState('plugin');
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data.players || []);
      setSource(data.source || 'plugin');
    } catch {
      setPlayers([]);
      setSource('plugin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  const kickPlayer = async (name) => {
    if (!window.confirm(`Kick player "${name}"?`)) return;
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_kick ${name}` })
      });
      const data = await response.json();
      if (data.ok || data.success || !data.error) {
        addToast(`Kicked ${name}`, 'success');
        setTimeout(fetchPlayers, 1200);
      } else {
        addToast(data.error || `Failed to kick ${name}`, 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  const sourceLabel =
    source === 'plugin'
      ? '⚡ SourceMod plugin · auto-refresh 5s'
      : '📡 A2S query (plugin not loaded)';

  return (
    <div className="players-panel">
      <div className="players-toolbar">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{loading ? 'Loading survivors...' : sourceLabel}</div>
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 13px', fontSize: 12 }} onClick={fetchPlayers}>
          ↻ Refresh
        </button>
      </div>

      <div className="players-grid">
        {!loading && players.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="big">🏝️</div>
            <p>No survivors currently in server</p>
          </div>
        )}

        {source === 'plugin' &&
          players.map((p) => {
            const [emoji, survivorName] = modelDisplay(p.model);
            const hpPct = Math.min(100, Number(p.hp || 0));
            const tempHp = Number(p.tempHp || 0);
            const tmpPct = Math.min(100 - hpPct, tempHp);
            const hpColor = hpPct > 60 ? '#3ddc84' : hpPct > 30 ? '#f1c40f' : '#ff5555';
            const slots = [p.slot0, p.slot1, p.slot2, p.slot3, p.slot4];
            const slotLabels = ['Primary', 'Secondary', 'Throwable', 'Medical', 'Booster'];

            return (
              <div key={`${p.name}-${p.model}-${p.bot ? 'bot' : 'human'}`} className={`surv-card ${p.alive ? '' : 'dead'}`}>
                <div className="surv-header">
                  <div className="surv-avatar">{p.bot ? '🤖' : emoji}</div>
                  <div className="surv-info">
                    <div className="surv-name">{p.name}</div>
                    <div className="surv-model">
                      {survivorName}{' '}
                      {p.bot ? <span style={{ color: 'var(--yellow)', fontWeight: 700, marginLeft: 4 }}>BOT</span> : null}
                    </div>
                  </div>

                  {!p.alive ? <span className="surv-status-dead">💀 DEAD</span> : null}
                  {!p.bot ? (
                    <button className="btn-kick" onClick={() => kickPlayer(escapeSingleQuotes(p.name))}>
                      Kick
                    </button>
                  ) : null}
                </div>

                {p.alive ? (
                  <div className="hp-section">
                    <div className="hp-label">
                      <span>HP</span>
                      <span>
                        {Number(p.hp || 0)} + {tempHp} temp
                      </span>
                    </div>
                    <div className="hp-bar-bg">
                      <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpColor }}></div>
                    </div>
                    {tempHp > 0 ? (
                      <div className="hp-bar-bg" style={{ marginTop: 3 }}>
                        <div className="hp-temp-fill" style={{ width: `${tmpPct}%` }}></div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="inv-grid">
                  {slots.map((slot, index) => {
                    const [icon, label] = weaponDisplay(slot);
                    const hasItem = slot && slot !== 'null';
                    return (
                      <div key={`${p.name}-slot-${index}`} className={`inv-slot ${hasItem ? 'has-item' : ''}`}>
                        <span className="slot-icon">{icon}</span>
                        <span className="slot-name">{hasItem ? label : slotLabels[index]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {source !== 'plugin' && players.length > 0 && (
          <div style={{ gridColumn: '1/-1', padding: '8px 0' }}>
            {players.map((p, idx) => {
              const initial = (p.name || '?')[0].toUpperCase();
              const duration = Number(p.duration || 0);
              return (
                <div
                  key={`${p.name}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div className="surv-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1 }}>{p.name}</div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{Math.floor(duration / 60)}m</span>
                  <button className="btn-kick" onClick={() => kickPlayer(escapeSingleQuotes(p.name))}>
                    Kick
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabPlayers;
