import React from 'react';

const Header = ({ status }) => (
  <header>
    <div className="logo">
      <div className="logo-icon">🧟</div>
      L4D2 Admin Dashboard
    </div>
    <div className="header-right">
      {(status.map && status.map !== '—') && (
        <div className="server-info" id="serverInfo">
          <span>Map: <strong>{status.map}</strong></span>
          <span>Players: <strong>{status.players}/{status.maxPlayers}</strong></span>
        </div>
      )}
      <div className="status-badge">
        <div className={`status-dot ${status.running ? 'online' : 'offline'}`}></div>
        <span>{status.running ? 'Server Online' : 'Server Offline'}</span>
      </div>
    </div>
  </header>
);

export default Header;
