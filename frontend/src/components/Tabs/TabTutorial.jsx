import React, { useState } from 'react';

const TutorialMultiSlot = ({ addToast }) => {
  const [playerCount, setPlayerCount] = useState(8);

  const applyPlayerCount = async () => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar l4d_multislots_min_survivors ${playerCount}; sm_cvar l4d_multislots_max_survivors ${playerCount}; sm_cvar l4d_multislots_spawn_survivors_roundstart 1; sm_cvar survivor_limit ${playerCount}` })
      });
      addToast(`Đã thiết lập số lượng người chơi thành ${playerCount}`, 'success');
    } catch {
      addToast('Lỗi khi thiết lập', 'error');
    }
  };

  const applyBotGive = async () => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar l4d_multislots_alive_bot_time 0` })
      });
      addToast(`Đã áp dụng: Bot sống cho người chơi mới vào giữa chừng`, 'success');
    } catch {
      addToast('Lỗi', 'error');
    }
  };

  return (
    <div className="tutorial-content">
      <h2>MultiSlots (Chơi Nhóm Nhiều Người)</h2>
      <p>
        Mặc định game chỉ cho phép 4 người chơi. Plugin này phá vỡ giới hạn đó, tự động sinh ra các bot (máy) vào slot trống để lúc nào cũng đủ số người bạn mong muốn.
      </p>

      <div className="card-panel">
        <h3>1. Thiết lập nhanh số lượng người chơi</h3>
        <p>Chọn tổng số người chơi/bot lúc nào cũng có mặt trên bản đồ.</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <input 
            type="number" 
            className="cvars-search-input" 
            style={{ width: '100px', margin: 0 }} 
            value={playerCount} 
            onChange={e => setPlayerCount(e.target.value)} 
          />
          <button className="btn btn-primary" onClick={applyPlayerCount}>Áp dụng số lượng</button>
        </div>
        <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
          Mẹo: Chọn 8 để có 8 người cùng đi map. Bot sẽ tự động lấp vào nếu không đủ người thật.
        </p>
      </div>

      <div className="card-panel" style={{ marginTop: '20px' }}>
        <h3>2. Tự động cấp Bot Sống cho người vào muộn</h3>
        <p>Bình thường nếu vào muộn giữa màn, người chơi bị bắt làm "người chết". Hãy bấm nút dưới đây để thay đổi: Vừa vào là có ngay thân xác Bot còn sống để chơi tiếp.</p>
        <button className="btn btn-ghost" style={{ marginTop: '10px' }} onClick={applyBotGive}>
          Bật tính năng Bot Sống
        </button>
      </div>
    </div>
  );
};

const TutorialInfectedBots = ({ addToast }) => {
  const [timeMin, setTimeMin] = useState(20);
  const [timeMax, setTimeMax] = useState(30);
  const [specialLimit, setSpecialLimit] = useState(6);

  const applySpawntime = async () => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar spawn_time_min ${timeMin}; sm_cvar spawn_time_max ${timeMax}` })
      });
      addToast(`Đã cập nhật thời gian hồi sinh Đặc nhiệm: ${timeMin}s - ${timeMax}s`, 'success');
    } catch {
      addToast('Lỗi', 'error');
    }
  };

  const applySpecialLimit = async () => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar max_specials ${specialLimit}` })
      });
      addToast(`Đã thiết lập tổng giới hạn đặc nhiệm xuất hiện cùng lúc là ${specialLimit}`, 'success');
    } catch {
      addToast('Lỗi', 'error');
    }
  };

  const enableHumanInfected = async () => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `sm_cvar coop_versus_enable 1` })
      });
      addToast(`Đã cho phép người chơi tham gia làm Zombie! (Gõ !ji trong chat)`, 'success');
    } catch {
      addToast('Lỗi', 'error');
    }
  };

  return (
    <div className="tutorial-content">
      <h2>InfectedBots (Đặc Nhiệm Bất Tận)</h2>
      <p>
        Bỏ qua giới hạn sinh quái của game. Phù hợp nếu bạn muốn tạo chế độ "Khó cày cuốc" với số lượng đặc nhiệm đông đảo, tự động sinh ra liên tục.
      </p>

      <div className="card-panel">
        <h3>1. Thời gian hồi sinh của Đặc nhiệm</h3>
        <p>Quái vật đặc biệt sẽ tự động hồi sinh mỗi khoản thời gian (tính bằng giây). Thời gian càng ngắn, cường độ vây ráp càng cao.</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block', color: 'var(--muted)' }}>Tối thiểu (s)</label>
            <input type="number" className="cvars-search-input" style={{ width: '80px', margin: 0 }} value={timeMin} onChange={e => setTimeMin(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block', color: 'var(--muted)' }}>Tối đa (s)</label>
            <input type="number" className="cvars-search-input" style={{ width: '80px', margin: 0 }} value={timeMax} onChange={e => setTimeMax(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={applySpawntime}>Cập nhật thời gian</button>
        </div>
      </div>

      <div className="card-panel" style={{ marginTop: '20px' }}>
        <h3>2. Giới hạn số lượng Đặc nhiệm cùng lúc</h3>
        <p>Cùng một lúc trên bãi chiến trường sẽ có tổng cộng bao nhiêu quái đặc biệt. Chú ý: Đừng để quá cao khiến máy chủ giật lag (10 - 15 là hợp lí).</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <input type="number" className="cvars-search-input" style={{ width: '100px', margin: 0 }} value={specialLimit} onChange={e => setSpecialLimit(e.target.value)} />
          <button className="btn btn-ghost" onClick={applySpecialLimit}>Cập nhật giới hạn</button>
        </div>
      </div>
      
      <div className="card-panel" style={{ marginTop: '20px' }}>
        <h3>3. Cho phép người chơi nhập vai làm Zombie</h3>
        <p>Thay vì chỉ được làm phe Sống Sót, bạn có thể cho phép người thật nhập vai làm quái đặc nhiệm để trêu đùa bạn bè. (Trong game nhớ bật chat bấm lệnh <b>!ji</b> để di chuyển phe, <b>!js</b> để quay lại phe người, <b>!zss</b> để tự sát làm con khác).</p>
        <button className="btn btn-success" style={{ marginTop: '10px', background: 'var(--accent)', color: 'black' }} onClick={enableHumanInfected}>
          Kích Hoạt Nhập Vai Zombie
        </button>
      </div>
    </div>
  );
};

const TabTutorial = ({ addToast }) => {
  const [activePage, setActivePage] = useState('multislot');

  const pages = [
    { id: 'multislot', title: 'MultiSlots (Tăng Số Người)' },
    { id: 'infectedbots', title: 'InfectedBots (Quái Đặc Nhiệm)' }
  ];

  return (
    <div className="plugins-panel" style={{ display: 'flex', flexDirection: 'row', minHeight: '600px', background: 'var(--bg-card)' }}>
      {/* Sidebar for tutorials */}
      <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', padding: '16px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Danh sách Hướng Dẫn
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pages.map(p => (
             <button 
                key={p.id}
                onClick={() => setActivePage(p.id)}
                className={`btn ${activePage === p.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textAlign: 'left', margin: 0, padding: '10px 14px', justifyContent: 'flex-start' }}
              >
                {p.title}
             </button>
          ))}
        </div>
        <p style={{ marginTop: '30px', fontSize: '13px', color: 'var(--muted)' }}>
          * Thiết kế hỗ trợ sẵn cho người dùng không có nhu cầu đào sâu kĩ thuật. Các thiết lập sẽ được đẩy trực tiếp lên server để có tác dụng ngay lập tức!
        </p>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {activePage === 'multislot' && <TutorialMultiSlot addToast={addToast} />}
        {activePage === 'infectedbots' && <TutorialInfectedBots addToast={addToast} />}
      </div>
    </div>
  );
};

export default TabTutorial;
