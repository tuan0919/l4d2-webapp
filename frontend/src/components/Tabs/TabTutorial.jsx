import React, { useState, useEffect } from 'react';

// Custom CSS for premium looks embedded in the component
const styles = `
  .tut-container { display: flex; flex-direction: column; gap: 24px; padding: 24px; color: var(--text); }
  .tut-header { margin-bottom: 12px; }
  .tut-header h2 { font-size: 26px; font-weight: 700; background: linear-gradient(90deg, #fff, #a8b4c8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .tut-header p { color: var(--muted); font-size: 14px; margin-top: 6px; }
  
  .tut-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
  .tut-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); }
  .tut-card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(180deg, var(--accent), var(--accent2)); opacity: 0.8; }
  
  .tut-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
  .tut-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
  
  .tut-label { font-size: 13px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
  .tut-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }
  
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
  
  .tut-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
  .tut-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .tut-btn-save { background: linear-gradient(135deg, var(--green), #2db969); color: #000; }
  .tut-btn-save:hover { box-shadow: 0 0 12px rgba(61,220,132,0.4); transform: translateY(-1px); }
  .tut-btn-refresh { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .tut-btn-refresh:hover { border-color: var(--text); }
  
  .tut-tabs-nav { margin-bottom: 20px; display: flex; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .tut-tab-btn { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--muted); transition: all 0.2s; }
  .tut-tab-btn.active { color: var(--text); background: rgba(255,255,255,0.05); border-color: var(--border); }
  .tut-tab-btn:hover:not(.active) { color: #fff; }
`;

const MultiSlotsConfig = [
  { cvar: 'l4d_multislots_max_survivors', type: 'number', label: 'Max Survivors', desc: 'Số lượng Survivors tối đa cho phép trên server (bao gồm cả bot).' },
  { cvar: 'l4d_multislots_min_survivors', type: 'number', label: 'Min Survivors', desc: 'Số lượng Survivors tối thiểu lúc nào cũng có mặt.' },
  { cvar: 'l4d_multislots_spawn_survivors_roundstart', type: 'toggle', label: 'Spawn round start', desc: 'Tự động tạo đủ lượng bot khi bắt đầu round.' },
  { cvar: 'l4d_multislots_alive_bot_time', type: 'select', label: 'Bot State for Late Joiners', desc: 'Cấp bot sống hay chết cho người vào sau.', 
    options: [{v:'0', n:'Luôn cấp Bot Sống'}, {v:'20', n:'Bot Chết nếu ra khỏi map quá 20s'}] },
  { cvar: 'l4d_multislots_no_second_free_spawn', type: 'radio', label: 'Second Free Spawn', desc: 'Trạng thái khi đổi team lần 2 trong cùng 1 round.', 
    options: [{v:'0', n:'Free (Luôn Sống)'}, {v:'1', n:'Dead (Sau khi rời start)'}, {v:'2', n:'Always Dead'}] },
  { cvar: 'l4d_multislots_firstweapon', type: 'select', label: 'First Weapon', desc: 'Vũ khí chính khi spawn bot.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Auto-Shotgun'}, {v:'3', n:'M16'}, {v:'4', n:'SCAR'}, {v:'5', n:'AK47'}, {v:'19', n:'Random T2'}, {v:'20', n:'Random T3'}] },
  { cvar: 'l4d_multislots_saferoom_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Saferoom)', desc: 'Sinh thêm túi cứu thương ở saferoom.' },
  { cvar: 'l4d_multislots_finale_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Finale)', desc: 'Sinh thêm túi cứu thương ở vòng chung kết (Finale).' },
  { cvar: 'l4d_multislots_respawnhp', type: 'number', label: 'Respawn HP', desc: 'Số máu cơ bản khi mới spawn.' },
];

const InfectedBotsConfig = [
  { cvar: 'l4d_infectedbots_allow', type: 'toggle', label: 'Enable Plugin', desc: 'Kích hoạt plugin InfectedBots.' },
  { cvar: 'coop_versus_enable', type: 'toggle', label: 'Playable SI', desc: 'Cho phép người chơi tham gia phe Zombie trong Coop/Survival (!ji).' },
  { cvar: 'spawn_time_min', type: 'number', label: 'Min Spawn Time', desc: 'Thời gian chờ nhỏ nhất rớt quái (giây).' },
  { cvar: 'spawn_time_max', type: 'number', label: 'Max Spawn Time', desc: 'Thời gian chờ lớn nhất rớt quái (giây).' },
  { cvar: 'max_specials', type: 'number', label: 'Max Specials', desc: 'Tổng số SI (Special Infected) xuất hiện cùng lúc.' },
  { cvar: 'tank_limit', type: 'number', label: 'Tank Limit', desc: 'Số Tank tối đa.' },
  { cvar: 'witch_max_limit', type: 'number', label: 'Witch Limit', desc: 'Số Witch tối đa.' },
  { cvar: 'smoker_limit', type: 'number', label: 'Smoker Limit', desc: 'Tối đa Smoker.' },
  { cvar: 'boomer_limit', type: 'number', label: 'Boomer Limit', desc: 'Tối đa Boomer.' },
  { cvar: 'hunter_limit', type: 'number', label: 'Hunter Limit', desc: 'Tối đa Hunter.' },
  { cvar: 'spitter_limit', type: 'number', label: 'Spitter Limit', desc: 'Tối đa Spitter.' },
  { cvar: 'jockey_limit', type: 'number', label: 'Jockey Limit', desc: 'Tối đa Jockey.' },
  { cvar: 'charger_limit', type: 'number', label: 'Charger Limit', desc: 'Tối đa Charger.' },
  { cvar: 'l4d_infectedbots_sm_zss_disable_gamemode', type: 'multi-checkbox', label: 'Disable !zss (Suicide)', desc: 'Cấm phe Zombie dùng lệnh !zss tự sát.', 
    options: [{v: 1, n: 'Coop/Realism'}, {v: 2, n: 'Versus/Scavenge'}, {v: 4, n: 'Survival'}] }
];

const TabTutorial = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('multislots');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize defaults if not fetched
  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cvars');
      const data = await res.json();
      const currentValues = {};
      if (data.cvars) {
        data.cvars.forEach(group => {
           group.cvars.forEach(item => {
             currentValues[item.name] = item.value;
           });
        });
      }
      // Populate undefined values with defaults for UI
      setValues(prev => ({ ...prev, ...currentValues }));
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (cvar, val) => {
    setValues(prev => ({ ...prev, [cvar]: val }));
  };

  const handleMultiCheckbox = (cvar, val, isChecked) => {
    const current = parseInt(values[cvar] || 0, 10);
    const newVal = isChecked ? (current | val) : (current & ~val);
    setValues(prev => ({ ...prev, [cvar]: newVal.toString() }));
  };

  const isMultiCheckboxChecked = (cvar, val) => {
    const current = parseInt(values[cvar] || 0, 10);
    return (current & val) !== 0;
  };

  const saveConfig = async (configList) => {
    const cmds = configList.map(item => {
       const v = values[item.cvar] !== undefined ? values[item.cvar] : '';
       return \`sm_cvar \${item.cvar} "\${v}"\`;
    }).join('; ');
    
    try {
      setLoading(true);
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmds })
      });
      addToast('Saved successfully!', 'success');
    } catch {
      addToast('Error saving configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (item) => {
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
        
        {item.type === 'number' && (
           <input type="number" className="tut-input" value={val} onChange={e => handleUpdate(item.cvar, e.target.value)} style={{ marginTop: 8 }} />
        )}
        
        {item.type === 'text' && (
           <input type="text" className="tut-input" value={val} onChange={e => handleUpdate(item.cvar, e.target.value)} style={{ marginTop: 8 }} />
        )}
        
        {item.type === 'select' && (
           <select className="tut-input" value={val} onChange={e => handleUpdate(item.cvar, e.target.value)} style={{ marginTop: 8 }}>
              {item.options.map(opt => <option key={opt.v} value={opt.v}>{opt.n}</option>)}
           </select>
        )}
        
        {item.type === 'radio' && (
           <div className="tut-radio-group" style={{ marginTop: 8 }}>
             {item.options.map(opt => (
               <label className="tut-radio" key={opt.v}>
                 <input type="radio" value={opt.v} checked={String(val) === String(opt.v)} onChange={e => handleUpdate(item.cvar, e.target.value)} />
                 {opt.n}
               </label>
             ))}
           </div>
        )}

        {item.type === 'multi-checkbox' && (
           <div className="tut-checkbox-group" style={{ marginTop: 8 }}>
             {item.options.map(opt => (
               <label className="tut-checkbox" key={opt.v}>
                 <input type="checkbox" checked={isMultiCheckboxChecked(item.cvar, opt.v)} onChange={e => handleMultiCheckbox(item.cvar, opt.v, e.target.checked)} />
                 {opt.n}
               </label>
             ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tut-container">
        
        <div className="tut-tabs-nav">
          <button className={\`tut-tab-btn \${activeTab === 'multislots' ? 'active' : ''}\`} onClick={() => setActiveTab('multislots')}>MultiSlots Settings</button>
          <button className={\`tut-tab-btn \${activeTab === 'infectedbots' ? 'active' : ''}\`} onClick={() => setActiveTab('infectedbots')}>InfectedBots Settings</button>
        </div>

        {activeTab === 'multislots' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>MultiSlots Configuration</h2>
               <p>Quản lý số lượng Survivors (bao gồm cả bot) tham gia bản đồ.</p>
            </div>
            
            <div className="tut-form-grid">
               {MultiSlotsConfig.map(renderField)}
            </div>
            
            <div className="tut-actions">
               <button className="tut-btn tut-btn-refresh" onClick={fetchValues}>🔄 Load Current</button>
               <button className="tut-btn tut-btn-save" onClick={() => saveConfig(MultiSlotsConfig)}>💾 Áp Dụng Ngay</button>
            </div>
          </div>
        )}

        {activeTab === 'infectedbots' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>InfectedBots Configuration</h2>
               <p>Thiết lập giới hạn các Special Infected và tính năng nhập vai phe Zombie.</p>
            </div>
            
            <div className="tut-form-grid">
               {InfectedBotsConfig.map(renderField)}
            </div>
            
            <div className="tut-actions">
               <button className="tut-btn tut-btn-refresh" onClick={fetchValues}>🔄 Load Current</button>
               <button className="tut-btn tut-btn-save" onClick={() => saveConfig(InfectedBotsConfig)}>💾 Áp Dụng Ngay</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default TabTutorial;
