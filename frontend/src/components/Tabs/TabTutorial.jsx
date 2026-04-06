import React, { useState, useEffect } from 'react';

// Custom CSS for premium looks embedded in the component
const styles = `
  .tut-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; background: transparent; }
  .tut-container { flex: 1; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 24px; padding: 24px 24px 60px 24px; color: var(--text); min-height: 0; }
  .tut-container::after { content: ""; display: block; height: 40px; flex-shrink: 0; }
  .tut-header { margin-bottom: 12px; }
  .tut-header h2 { font-size: 26px; font-weight: 700; background: linear-gradient(90deg, #fff, #a8b4c8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .tut-header p { color: var(--muted); font-size: 14px; margin-top: 6px; }
  
  .tut-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; flex-shrink: 0; }
  .tut-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); }
  .tut-card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(180deg, var(--accent), var(--accent2)); opacity: 0.8; }
  
  .tut-section-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  
  .tut-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 10px; }
  .tut-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
  
  .tut-label { font-size: 13px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
  .tut-desc { font-size: 11px; color: var(--muted); line-height: 1.4; flex: 1; }
  
  .tut-switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
  .tut-switch input { opacity: 0; width: 0; height: 0; }
  .tut-switch-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #2a2e3a; transition: .3s; border-radius: 20px; }
  .tut-switch-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #fff; transition: .3s; border-radius: 50%; }
  .tut-switch input:checked + .tut-switch-slider { background-color: var(--green); }
  .tut-switch input:checked + .tut-switch-slider:before { transform: translateX(16px); }
  
  .tut-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 8px 12px; font-size: 13px; transition: all 0.2s; }
  .tut-input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 2px rgba(232,83,42,0.2); }
  
  .tut-radio-group { display: flex; gap: 12px; font-size: 12px; align-items: center; flex-wrap: wrap; }
  .tut-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  
  .tut-checkbox-group { display: flex; flex-direction: column; gap: 6px; }
  .tut-checkbox { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; }
  
  .tut-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); margin-bottom: 40px; }
  .tut-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .tut-btn-save { background: linear-gradient(135deg, var(--green), #2db969); color: #000; }
  .tut-btn-save:hover { box-shadow: 0 0 12px rgba(61,220,132,0.4); transform: translateY(-1px); }
  .tut-btn-refresh { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .tut-btn-refresh:hover { border-color: var(--text); }
  
  .tut-tabs-nav { margin-bottom: 20px; display: flex; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .tut-tab-btn { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--muted); transition: all 0.2s; }
  .tut-tab-btn.active { color: var(--text); background: rgba(255,255,255,0.05); border-color: var(--border); }
  .tut-tab-btn:hover:not(.active) { color: #fff; }

  .tut-toolbar { display: flex; gap: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px; align-items: center; }
  .tut-toolbar-label { font-size: 13px; font-weight: 600; color: #a8b4c8; margin-right: 8px; }
`;

const MultiSlotsConfig = [
  { cvar: 'l4d_multislots_max_survivors', type: 'number', label: 'Max Survivors', desc: 'Số lượng Survivors tối đa cho phép trên server.' },
  { cvar: 'l4d_multislots_min_survivors', type: 'number', label: 'Min Survivors', desc: 'Số lượng Survivors tối thiểu lúc nào cũng có mặt.' },
  { cvar: 'l4d_multislots_spawn_survivors_roundstart', type: 'toggle', label: 'Spawn round start', desc: 'Tự động tạo đủ lượng bot khi bắt đầu round.' },
  { cvar: 'l4d_multislots_alive_bot_time', type: 'select', label: 'Bot State for Late Joiners', desc: 'Cấp bot sống hay chết cho người vào sau.', 
    options: [{v:'0', n:'Luôn cấp Bot Sống'}, {v:'20', n:'Bot Chết nếu ra khỏi map quá 20s'}] },
  { cvar: 'l4d_multislots_no_second_free_spawn', type: 'radio', label: 'Second Free Spawn', desc: 'Trạng thái khi đổi team lần 2 trong cùng 1 round.', 
    options: [{v:'0', n:'Free'}, {v:'1', n:'Dead (Sau khi rời start)'}, {v:'2', n:'Always Dead'}] },
  { cvar: 'l4d_multislots_firstweapon', type: 'select', label: 'First Weapon', desc: 'Vũ khí chính khi spawn bot.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Auto-Shotgun'}, {v:'3', n:'M16'}, {v:'4', n:'SCAR'}, {v:'5', n:'AK47'}, {v:'19', n:'Random T2'}, {v:'20', n:'Random T3'}] },
  { cvar: 'l4d_multislots_saferoom_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Saferoom)', desc: 'Sinh thêm túi cứu thương ở saferoom.' },
  { cvar: 'l4d_multislots_finale_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Finale)', desc: 'Sinh thêm túi cứu thương ở vòng chung kết.' },
  { cvar: 'l4d_multislots_respawnhp', type: 'number', label: 'Respawn HP', desc: 'Số máu cơ bản khi mới spawn.' },
];

const InfectedBotsCvarsConfig = [
  { cvar: 'l4d_infectedbots_allow', type: 'toggle', label: 'Enable Plugin', desc: 'Kích hoạt plugin InfectedBots.' },
  { cvar: 'coop_versus_enable', type: 'toggle', label: 'Playable SI', desc: 'Cho phép người chơi tham gia phe Zombie trong Coop/Survival (!ji).' },
  { cvar: 'l4d_infectedbots_sm_zss_disable_gamemode', type: 'multi-checkbox', label: 'Disable !zss (Suicide)', desc: 'Cấm phe Zombie dùng lệnh !zss tự sát.', 
    options: [{v: 1, n: 'Coop/Realism'}, {v: 2, n: 'Versus/Scavenge'}, {v: 4, n: 'Survival'}] }
];

const InfectedBotsDataConfig = [
  { key: 'max_specials', type: 'number', label: 'Max Specials', desc: 'Tổng số SI xuất hiện cùng lúc.' },
  { key: 'smoker_limit', type: 'number', label: 'Smoker Limit', desc: 'Tối đa Smoker.' },
  { key: 'boomer_limit', type: 'number', label: 'Boomer Limit', desc: 'Tối đa Boomer.' },
  { key: 'hunter_limit', type: 'number', label: 'Hunter Limit', desc: 'Tối đa Hunter.' },
  { key: 'spitter_limit', type: 'number', label: 'Spitter Limit', desc: 'Tối đa Spitter.' },
  { key: 'jockey_limit', type: 'number', label: 'Jockey Limit', desc: 'Tối đa Jockey.' },
  { key: 'charger_limit', type: 'number', label: 'Charger Limit', desc: 'Tối đa Charger.' },
  { key: 'tank_limit', type: 'number', label: 'Tank Limit', desc: 'Số Tank tối đa.' },
  { key: 'tank_health', type: 'number', label: 'Tank Health', desc: 'Máu cơ bản của Tank.' },
  { key: 'witch_max_limit', type: 'number', label: 'Witch Limit', desc: 'Số Witch tối đa.' },
  { key: 'spawn_time_min', type: 'number', label: 'Min Spawn Time', desc: 'Thời gian chờ nhỏ nhất (giây).' },
  { key: 'spawn_time_max', type: 'number', label: 'Max Spawn Time', desc: 'Thời gian chờ lớn nhất (giây).' }
];

const parseBlockData = (content, blockName) => {
  if (!content) return {};
  const blockRegex = new RegExp(`"([^"]*\\b${blockName}\\b[^"]*)"\\s*\\{[^}]+\\}`, 'i');
  const match = content.match(blockRegex);
  if (!match) return {};
  const lines = match[0].split('\n');
  const values = {};
  for (const line of lines) {
    const m = line.match(/"([^"]+)"\s+"([^"]*)"/);
    if (m) values[m[1]] = m[2];
  }
  return values;
};

const updateBlockData = (content, blockName, newValues) => {
  const blockRegex = new RegExp(`("([^"]*\\b${blockName}\\b[^"]*)"\\s*\\{)([^}]+)(\\})`, 'i');
  return content.replace(blockRegex, (match, open, blockRealName, body, close) => {
    let newBody = body;
    for (const key of Object.keys(newValues)) {
       const valStr = newValues[key];
       const keyRegex = new RegExp(`("${key}"\\s+)"([^"]*)"`, 'i');
       if (keyRegex.test(newBody)) {
         newBody = newBody.replace(keyRegex, `$1"${valStr}"`);
       } else {
         newBody += `\n            "${key}"      "${valStr}"`;
       }
    }
    return open + newBody + close;
  });
};

const TabTutorial = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('multislots');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  // InfectedBots Data states
  const [dataFiles, setDataFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('coop.cfg');
  const [selectedBlock, setSelectedBlock] = useState('default');
  const [dataContent, setDataContent] = useState('');
  const [dataValues, setDataValues] = useState({});

  useEffect(() => {
    fetchCvars();
  }, []);

  useEffect(() => {
    if (activeTab === 'infectedbots') {
      fetchDataFiles();
      fetchDataContent(selectedFile);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'infectedbots' && selectedFile) {
      fetchDataContent(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (dataContent) {
      setDataValues(parseBlockData(dataContent, selectedBlock));
    }
  }, [dataContent, selectedBlock]);

  const fetchCvars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cvars');
      const data = await res.json();
      const currentValues = {};
      if (data.cvars) {
        data.cvars.forEach(g => {
           g.cvars.forEach(item => {
             currentValues[item.name] = item.value;
           });
        });
      }
      setValues(prev => ({ ...prev, ...currentValues }));
    } catch { } finally { setLoading(false); }
  };

  const fetchDataFiles = async () => {
    try {
      const res = await fetch('/api/data/files?plugin=l4dinfectedbots');
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setDataFiles(data.files);
        if (!data.files.includes(selectedFile)) setSelectedFile(data.files[0]);
      }
    } catch {}
  };

  const fetchDataContent = async (file) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/read?plugin=l4dinfectedbots&file=${file}`);
      const data = await res.json();
      if (data.content) setDataContent(data.content);
    } catch {} finally { setLoading(false); }
  };

  // Shared generic handlers
  const handleUpdate = (cvar, val) => setValues(prev => ({ ...prev, [cvar]: val }));
  const handleDataUpdate = (key, val) => setDataValues(prev => ({ ...prev, [key]: val }));

  const handleMultiCheckbox = (cvar, val, isChecked) => {
    const current = parseInt(values[cvar] || 0, 10);
    const newVal = isChecked ? (current | val) : (current & ~val);
    setValues(prev => ({ ...prev, [cvar]: newVal.toString() }));
  };
  const isMultiCheckboxChecked = (cvar, val) => ((parseInt(values[cvar] || 0, 10) & val) !== 0);

  const saveCvarConfig = async (configList) => {
    const payload = {};
    configList.forEach(item => {
       payload[item.cvar] = values[item.cvar] !== undefined ? String(values[item.cvar]) : '';
    });
    try {
      setLoading(true);
      const res = await fetch('/api/cvars/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cvars: payload }) });
      if (res.ok) {
        addToast('Lưu CVARs vào file config thành công!', 'success');
      } else {
        addToast('Lỗi khi lưu CVARs.', 'error');
      }
      fetchCvars();
    } catch { addToast('Lỗi khi lưu CVARs.', 'error'); } finally { setLoading(false); }
  };

  const saveDataConfig = async () => {
    if (!dataContent) return;
    const newContent = updateBlockData(dataContent, selectedBlock, dataValues);
    try {
      setLoading(true);
      const res = await fetch('/api/data/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin: 'l4dinfectedbots', file: selectedFile, content: newContent })
      });
      if (res.ok) {
        addToast(`Lưu Data Config (${selectedBlock}) thành công!`, 'success');
        fetchDataContent(selectedFile); // Refresh
      } else {
        addToast('Lỗi khi lưu Data config.', 'error');
      }
    } catch { addToast('Error writing Data', 'error'); } finally { setLoading(false); }
  };

  const renderCvarField = (item) => {
    const val = values[item.cvar] !== undefined ? values[item.cvar] : '';
    return (
      <div className="tut-item" key={item.cvar}>
        <div className="tut-label">
           {item.label}
           {item.type === 'toggle' && (
             <label className="tut-switch">
               <input type="checkbox" checked={String(val) === '1'} onChange={e => handleUpdate(item.cvar, e.target.checked ? '1' : '0')} />
               <span className="tut-switch-slider"></span>
             </label>
           )}
        </div>
        <div className="tut-desc">{item.desc}</div>
        {item.type === 'number' && <input type="number" className="tut-input" value={val} onChange={e => handleUpdate(item.cvar, e.target.value)} style={{ marginTop: 8 }} />}
        {item.type === 'select' && (
           <select className="tut-input" value={val} onChange={e => handleUpdate(item.cvar, e.target.value)} style={{ marginTop: 8 }}>
              {item.options.map(o => <option key={o.v} value={o.v}>{o.n}</option>)}
           </select>
        )}
        {item.type === 'radio' && (
           <div className="tut-radio-group" style={{ marginTop: 8 }}>
             {item.options.map(o => <label className="tut-radio" key={o.v}><input type="radio" value={o.v} checked={String(val) === String(o.v)} onChange={e => handleUpdate(item.cvar, e.target.value)} />{o.n}</label>)}
           </div>
        )}
        {item.type === 'multi-checkbox' && (
           <div className="tut-checkbox-group" style={{ marginTop: 8 }}>
             {item.options.map(o => <label className="tut-checkbox" key={o.v}><input type="checkbox" checked={isMultiCheckboxChecked(item.cvar, o.v)} onChange={e => handleMultiCheckbox(item.cvar, o.v, e.target.checked)} />{o.n}</label>)}
           </div>
        )}
      </div>
    );
  };

  const renderDataField = (item) => {
    const val = dataValues[item.key] !== undefined ? dataValues[item.key] : '';
    return (
      <div className="tut-item" key={item.key}>
        <div className="tut-label">{item.label}</div>
        <div className="tut-desc">{item.desc}</div>
        <input type="number" step="any" className="tut-input" value={val} onChange={e => handleDataUpdate(item.key, e.target.value)} style={{ marginTop: 8 }} />
      </div>
    );
  };

  return (
    <div className="tut-wrapper">
      <style>{styles}</style>
      <div className="tut-container">
        
        <div className="tut-tabs-nav">
          <button className={`tut-tab-btn ${activeTab === 'multislots' ? 'active' : ''}`} onClick={() => setActiveTab('multislots')}>MultiSlots</button>
          <button className={`tut-tab-btn ${activeTab === 'infectedbots' ? 'active' : ''}`} onClick={() => setActiveTab('infectedbots')}>InfectedBots</button>
        </div>

        {activeTab === 'multislots' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>MultiSlots Configuration</h2>
               <p>Quản lý số lượng Survivors (bao gồm bot) tham gia bản đồ.</p>
            </div>
            <div className="tut-form-grid">
               {MultiSlotsConfig.map(renderCvarField)}
            </div>
            <div className="tut-actions">
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>🔄 Load CVARs</button>
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(MultiSlotsConfig)}>💾 Áp Dụng (CVARs)</button>
            </div>
          </div>
        )}

        {activeTab === 'infectedbots' && (
          <>
            {/* Cvars Section */}
            <div className="tut-card" style={{ marginBottom: 24 }}>
              <div className="tut-header">
                 <h2 style={{ fontSize: '20px' }}>InfectedBots: Global CVARs</h2>
                 <p>Các lệnh `sm_cvar` cấu hình chế độ, tính năng chung.</p>
              </div>
              <div className="tut-form-grid">
                 {InfectedBotsCvarsConfig.map(renderCvarField)}
              </div>
              <div className="tut-actions" style={{ marginTop: 12 }}>
                 <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(InfectedBotsCvarsConfig)}>💾 Áp Dụng (CVARs)</button>
              </div>
            </div>

            {/* Data Settings Section */}
            <div className="tut-card">
              <div className="tut-header">
                 <h2>InfectedBots: Data Configurations</h2>
                 <p>Kiểm soát giới hạn Tank, Witch, quái đặc biệt chi tiết dựa theo số người chơi. (Lưu trực tiếp vào file .cfg)</p>
              </div>
              
              <div className="tut-toolbar">
                 <div>
                   <span className="tut-toolbar-label">Chế độ (File):</span>
                   <select className="tut-input" value={selectedFile} onChange={e => setSelectedFile(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
                     {dataFiles.map(f => <option key={f} value={f}>{f}</option>)}
                   </select>
                 </div>
                 <div>
                   <span className="tut-toolbar-label">Mốc người chơi (Block):</span>
                   <select className="tut-input" value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
                     <option value="default">Default (Mặc định)</option>
                     {[...Array(10)].map((_, i) => <option key={i+1} value={String(i+1)}>{i+1} Người chơi</option>)}
                   </select>
                 </div>
              </div>

              {!dataContent && !loading && <p style={{ color: 'var(--muted)' }}>Không đọc được file data.</p>}
              
              {dataContent && (
                <>
                  <div className="tut-section-title">Chỉnh sửa cho "{selectedBlock}"</div>
                  <div className="tut-form-grid">
                     {InfectedBotsDataConfig.map(renderDataField)}
                  </div>
                  <div className="tut-actions">
                     <button className="tut-btn tut-btn-refresh" onClick={() => fetchDataContent(selectedFile)}>🔄 Nạp Lại File</button>
                     <button className="tut-btn tut-btn-save" onClick={saveDataConfig}>💾 Ghi Đè Data Config</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TabTutorial;
