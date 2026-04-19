import React, { useEffect, useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import TabConsole from './components/Tabs/TabConsole';
import TabPlugins from './components/Tabs/TabPlugins';
import TabCvars from './components/Tabs/TabCvars';
import TabAddons from './components/Tabs/TabAddons';
import TabDeveloper from './components/Tabs/TabDeveloper';
import TabMainConfigurations from './components/Tabs/TabMainConfigurations';
import ToastContainer from './components/Common/ToastContainer';

const App = () => {
  const [activeTab, setActiveTab] = useState('console');
  const [pluginCount, setPluginCount] = useState(null);
  const [status, setStatus] = useState({
    running: false,
    map: '—',
    players: 0,
    maxPlayers: 0
  });
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const pollStatus = async () => {
    try {
      const [sRes, iRes] = await Promise.all([fetch('/api/status'), fetch('/api/serverinfo')]);
      const s = await sRes.json();
      const info = await iRes.json();
      setStatus({
        running: !!s.running,
        map: info.map || '—',
        players: Number(info.players || 0),
        maxPlayers: Number(info.maxPlayers || 0)
      });
    } catch {
      // keep previous status when polling fails
    }
  };

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <Header status={status} />

      <main className="main-grid">
        <Sidebar addToast={addToast} />

        <div className="right-panel">
          <div className="tabs-header">
            <TabBtn id="console" label="Live Console" icon="🖥️" active={activeTab} onClick={setActiveTab} />
            <TabBtn
              id="plugins"
              label="Plugins"
              icon="🧩"
              active={activeTab}
              onClick={setActiveTab}
              badge={pluginCount === null ? '—' : pluginCount}
            />
            <TabBtn id="cvars" label="Cvars" icon="⚙️" active={activeTab} onClick={setActiveTab} />
            <TabBtn id="addons" label="Custom Maps" icon="📦" active={activeTab} onClick={setActiveTab} />
            <TabBtn id="main-configurations" label="Main Configurations" icon="📖" active={activeTab} onClick={setActiveTab} />
            <TabBtn id="developer" label="Developer" icon="🛠️" active={activeTab} onClick={setActiveTab} />
          </div>

          <div className="tab-content">
            {activeTab === 'console' && <TabConsole addToast={addToast} />}
            {activeTab === 'plugins' && <TabPlugins setPluginCount={setPluginCount} addToast={addToast} />}
            {activeTab === 'cvars' && <TabCvars addToast={addToast} />}
            {activeTab === 'addons' && <TabAddons addToast={addToast} />}
            {activeTab === 'main-configurations' && <TabMainConfigurations addToast={addToast} />}
            {activeTab === 'developer' && <TabDeveloper addToast={addToast} />}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
};

const TabBtn = ({ id, label, icon, active, onClick, badge }) => (
  <button className={`tab-btn ${active === id ? 'active' : ''}`} onClick={() => onClick(id)}>
    {icon} {label}
    {badge !== undefined && <span className="tab-badge">{badge}</span>}
  </button>
);

export default App;
