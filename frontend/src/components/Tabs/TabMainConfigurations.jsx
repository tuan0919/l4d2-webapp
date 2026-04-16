import React, { useState, useEffect, useRef } from 'react';
import cvarFileMap from './mainConfigurationsCvarFileMap.json';
import MainConfigLoadingOverlay from './mainConfigurations/MainConfigLoadingOverlay';
import MainConfigCvarField from './mainConfigurations/MainConfigCvarField';
import MainConfigDataField from './mainConfigurations/MainConfigDataField';
import MainConfigCvarReviewDialog from './mainConfigurations/MainConfigCvarReviewDialog';
import MainConfigDataReviewDialog from './mainConfigurations/MainConfigDataReviewDialog';

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

  .tut-content-area { position: relative; min-height: 240px; }
  .tut-loading-overlay { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(5, 8, 15, 0.62); backdrop-filter: blur(2px); border-radius: 14px; }
  .tut-loading-card { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: linear-gradient(180deg, rgba(20,26,40,0.95) 0%, rgba(11,15,25,0.96) 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
  .tut-loading-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(168,180,200,0.35); border-top-color: var(--blue); border-right-color: var(--accent); animation: tut-spin 0.9s linear infinite; }
  .tut-loading-text { color: #dbe7f7; font-size: 12px; letter-spacing: 0.2px; }
  .tut-loading-subtext { color: #98acc5; font-size: 11px; margin-top: 2px; }
  @keyframes tut-spin { to { transform: rotate(360deg); } }

  .tut-toolbar { display: flex; gap: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px; align-items: center; }
  .tut-toolbar-label { font-size: 13px; font-weight: 600; color: #a8b4c8; margin-right: 8px; }

  .tut-cvar-panel { border-top: 1px solid var(--border); background: #090b10; overflow: hidden; border-radius: 0 0 12px 12px; margin-top: -1px; }
  .tut-cvar-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(91,200,245,0.05); border-bottom: 1px solid rgba(91,200,245,0.12); }
  .tut-cvar-toolbar span { font-size: 11px; color: var(--muted); flex: 1; font-family: 'JetBrains Mono', monospace; }
  .tut-cvar-toolbar .tut-btn { padding: 4px 10px; font-size: 11px; margin: 0; width: auto; }
  .tut-cvar-pre { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; color: #a8c0e0; padding: 14px 16px; margin: 0; overflow: auto; max-height: 50vh; white-space: pre; }
  .tut-cvar-textarea { width: 100%; min-height: 300px; max-height: 50vh; background: #090b10; color: #a8c0e0; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; padding: 14px 16px; border: none; outline: none; resize: vertical; display: block; }
  .tut-btn-cvar-view { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid rgba(91,200,245,0.3); background: rgba(91,200,245,0.08); color: var(--blue); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .tut-btn-cvar-view:hover { background: rgba(91,200,245,0.15); border-color: rgba(91,200,245,0.5); }
  .tut-btn-cvar-view.active { background: rgba(91,200,245,0.2); border-color: var(--blue); }

  .tut-review-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 16, 0.75); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 16px; }
  .tut-review-dialog { width: min(980px, 100%); max-height: 84vh; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 14px; background: linear-gradient(180deg, #131825 0%, #0c1019 100%); box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55); overflow: hidden; }
  .tut-review-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .tut-review-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0; }
  .tut-review-subtitle { margin-top: 6px; font-size: 12px; color: #9fb0c9; }
  .tut-review-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(91,200,245,0.35); background: rgba(91,200,245,0.12); color: var(--blue); font-size: 11px; font-weight: 600; }
  .tut-review-body { padding: 10px 20px 16px; overflow: auto; }
  .tut-review-diff { border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; background: #0b1220; }
  .tut-review-file { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(148, 163, 184, 0.08); font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #7dd3fc; }
  .tut-review-file-badge { color: #cbd5e1; font-size: 11px; border: 1px solid rgba(148,163,184,0.35); border-radius: 999px; padding: 2px 8px; }
  .tut-review-lines { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .tut-review-line { display: grid; grid-template-columns: 56px 56px 28px 1fr; align-items: stretch; }
  .tut-review-line + .tut-review-line { border-top: 1px solid rgba(255,255,255,0.04); }
  .tut-review-line-old { background: rgba(248, 113, 113, 0.11); }
  .tut-review-line-new { background: rgba(74, 222, 128, 0.13); }
  .tut-review-ln { color: #94a3b8; text-align: right; padding: 6px 10px 6px 0; border-right: 1px solid rgba(255,255,255,0.06); user-select: none; }
  .tut-review-sign { text-align: center; padding: 6px 0; border-right: 1px solid rgba(255,255,255,0.06); font-weight: 700; }
  .tut-review-line-old .tut-review-sign { color: #fca5a5; }
  .tut-review-line-new .tut-review-sign { color: #86efac; }
  .tut-review-code { padding: 6px 10px; color: #e2e8f0; word-break: break-word; white-space: pre-wrap; }
  .tut-review-meta { color: #93c5fd; margin-left: 8px; }
  .tut-review-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px 18px; border-top: 1px solid rgba(255,255,255,0.08); }
  .tut-review-actions .tut-btn { margin: 0; }
`;

const MAIN_CONFIGURATION_TABS = [
  { id: 'multislots', label: 'MultiSlots' },
  { id: 'infectedbots', label: 'InfectedBots' },
  { id: 'incappedWeapons', label: 'Incapped Weapons' },
  { id: 'gundamage', label: 'Gun Damage' },
  { id: 'eliteReward', label: 'Elite SI Reward' },
  { id: 'notifier', label: 'Notifier (Chat)' }
];

const WEAPONS = [
  { id: 'ak47', name: 'AK-47' },
  { id: 'autoshotgun', name: 'Auto Shotgun' },
  { id: 'awp', name: 'AWP Sniper' },
  { id: 'chromeshotgun', name: 'Chrome Shotgun' },
  { id: 'grenadelauncher', name: 'Grenade Launcher' },
  { id: 'huntingrifle', name: 'Hunting Rifle' },
  { id: 'm60', name: 'M60' },
  { id: 'magnum', name: 'Magnum / Desert Eagle' },
  { id: 'militarysniper', name: 'Military Sniper' },
  { id: 'mp5', name: 'MP5' },
  { id: 'pistol', name: 'Pistol' },
  { id: 'pumpshotgun', name: 'Pump Shotgun' },
  { id: 'rifle', name: 'M16 Rifle' },
  { id: 'rifledesert', name: 'Desert Rifle (SCAR)' },
  { id: 'scout', name: 'Scout Sniper' },
  { id: 'sg552', name: 'SG552' },
  { id: 'smg', name: 'SMG (Uzi)' },
  { id: 'smgsilenced', name: 'Silenced SMG (Mac-10)' },
  { id: 'spasshotgun', name: 'SPAS Shotgun' },
];

const TARGETS = [
  { id: 'SI_multi', name: 'Special Infected' },
  { id: 'common_multi', name: 'Common Infected' },
  { id: 'tank_multi', name: 'Tank' },
  { id: 'witch_multi', name: 'Witch' }
];

const GunDamageConfig = [
  { cvar: 'l4d_gun_damage_modify_enable', type: 'toggle', label: 'Bật Plugin (Enable)', desc: 'Tính năng chỉnh sát thương.' }
];

WEAPONS.forEach(w => {
  TARGETS.forEach(t => {
     GunDamageConfig.push({
        cvar: `l4d_${w.id}_damage_${t.id}`,
        type: 'number',
        label: `${t.name}`,
        desc: `0: Xoá ST, -1: Mặc định`
     });
  });
});

const MultiSlotsConfig = [
  { cvar: 'l4d_multislots_max_survivors', type: 'number', label: 'Max Survivors', desc: 'Số lượng Survivors tối đa cho phép trên server.' },
  { cvar: 'l4d_multislots_min_survivors', type: 'number', label: 'Min Survivors', desc: 'Số lượng Survivors tối thiểu lúc nào cũng có mặt.' },
  { cvar: 'l4d_multislots_bot_items_delete', type: 'toggle', label: 'Xóa đồ của bot', desc: 'Xóa vật phẩm của bot sinh tồn khi bị kick do dư bot.' },
  { cvar: 'l4d_multislots_spawn_survivors_roundstart', type: 'toggle', label: 'Spawn round start', desc: 'Tự động tạo đủ lượng bot khi bắt đầu round.' },
  { cvar: 'l4d_multislots_alive_bot_time', type: 'number', label: 'Alive Bot Time (s)', desc: 'Cấp bot sống hay chết. Người vào sau sẽ chết nếu rời Start quá X giây (0: Luôn cấp bot sống).' },
  { cvar: 'l4d_multislots_spec_message_interval', type: 'number', label: 'Thông báo Spec', desc: 'Khoảng thời gian nhắc nhở Spec tham gia team (0: Tắt).' },
  { cvar: 'l4d_multislots_respawnhp', type: 'number', label: 'Respawn HP', desc: 'Số máu thực tế (HP cơ bản) khi 5+ player spawn.' },
  { cvar: 'l4d_multislots_respawnbuffhp', type: 'number', label: 'Respawn Buff HP', desc: 'Số máu tạm thời (Buffer HP) khi 5+ player spawn.' },
  { cvar: 'l4d_multislots_firstweapon', type: 'select', label: 'Slot 1: First Weapon', desc: 'Vũ khí chính khi spawn bot.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Auto-Shotgun'}, {v:'2', n:'SPAS'}, {v:'3', n:'M16'}, {v:'4', n:'SCAR'}, {v:'5', n:'AK47'}, {v:'6', n:'SG552'}, {v:'7', n:'Mil Sniper'}, {v:'8', n:'AWP'}, {v:'9', n:'Scout'}, {v:'10', n:'Hunt Rif'}, {v:'11', n:'M60'}, {v:'12', n:'Grenade Launcher'}, {v:'13', n:'SMG'}, {v:'14', n:'Sil SMG'}, {v:'15', n:'MP5'}, {v:'16', n:'Pump Shot'}, {v:'17', n:'Chrome Shot'}, {v:'18', n:'Random T1'}, {v:'19', n:'Random T2'}, {v:'20', n:'Random T3'}] },
  { cvar: 'l4d_multislots_secondweapon', type: 'select', label: 'Slot 2: Second Weapon', desc: 'Vũ khí phụ cho bot/người mới.', 
    options: [{v:'0', n:'Only Pistol'}, {v:'1', n:'Dual Pistol'}, {v:'2', n:'Magnum'}, {v:'3', n:'Chainsaw'}, {v:'4', n:'Melee from map'}, {v:'5', n:'Random'}] },
  { cvar: 'l4d_multislots_thirdweapon', type: 'select', label: 'Slot 3: Ném', desc: 'Bom/Mìn.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Molotov'}, {v:'2', n:'Pipe Bomb'}, {v:'3', n:'Bile Jar'}, {v:'4', n:'Random'}] },
  { cvar: 'l4d_multislots_forthweapon', type: 'select', label: 'Slot 4: Cứu Thương', desc: 'Túi/Sốc điện.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Medkit'}, {v:'2', n:'Defib'}, {v:'3', n:'Incendiary Pack'}, {v:'4', n:'Explosive Pack'}, {v:'5', n:'Random'}] },
  { cvar: 'l4d_multislots_fifthweapon', type: 'select', label: 'Slot 5: Thuốc', desc: 'Thuốc.', 
    options: [{v:'0', n:'None'}, {v:'1', n:'Pills'}, {v:'2', n:'Adrenaline'}, {v:'3', n:'Random'}] },
  { cvar: 'l4d_multislots_saferoom_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Saferoom)', desc: 'Sinh thêm túi cứu thương ở saferoom tương ứng với số người.' },
  { cvar: 'l4d_multislots_finale_extra_first_aid', type: 'toggle', label: 'Extra Medkits (Finale)', desc: 'Sinh thêm túi cứu thương ở vòng chung kết.' },
  { cvar: 'l4d_multislots_no_second_free_spawn', type: 'radio', label: 'Second Free Spawn', desc: 'Khi chuyển team lần 2 hoặc out ra vào lại cùng 1 ván.', 
    options: [{v:'0', n:'Lấy hồi sinh Free'}, {v:'1', n:'Chết (Ngoài Safe)'}, {v:'2', n:'Luôn Chết'}] },
  { cvar: 'l4d_multislots_dead_bot_method', type: 'radio', label: 'Cách Sinh Bot Chết', desc: 'Cách người vào trễ hoặc bot nhận án tử.', 
    options: [{v:'0', n:'Spawn & Tự sát'}, {v:'1', n:'Spawn trong tủ cứu'}] },
  { cvar: 'l4d_multislots_free_spawn_crash_player', type: 'toggle', label: 'Vào Lại Do Crash', desc: 'Người chơi crash xong join lại sẽ không bị tước súng.' },
  { cvar: 'l4d_multislots_respawn_invincibletime', type: 'number', label: 'Thời Gian Bất Tử (s)', desc: 'Thời gian bất tử sau khi spawn ngoài Safe Zone (0: Tắt).' },
  { cvar: 'l4d_multislots_join_command_block', type: 'toggle', label: 'Chặn lệnh Join (!js)', desc: 'Không cho người dùng tự ấn lệnh join.' },
  { cvar: 'l4d_multislots_versus_command_balance', type: 'toggle', label: 'Auto Balance (Versus)', desc: 'Bật kiểm tra team balance ở Versus.' },
  { cvar: 'l4d_multislots_versus_teams_unbalance_limit', type: 'number', label: 'Unbalance Limit', desc: 'Chênh lệch 2 bên để kích hoạt ép cân bằng.' },
];

const InfectedBotsCvarsConfig = [
  { cvar: 'l4d_infectedbots_allow', type: 'toggle', label: 'Enable Plugin', desc: 'Kích hoạt plugin InfectedBots.' },
  { cvar: 'l4d_infectedbots_sm_zss_disable_gamemode', type: 'multi-checkbox', label: 'Disable !zss (Suicide)', desc: 'Cấm phe Zombie dùng lệnh !zss tự sát.', 
     options: [{v: 1, n: 'Coop/Realism'}, {v: 2, n: 'Versus/Scavenge'}, {v: 4, n: 'Survival'}] }
];

const InfectedBotsDataConfig = [
  { key: 'coop_versus_enable', type: 'toggle', label: 'Playable SI', desc: 'Cho phép người chơi tham gia phe Zombie trong mode đang chọn (!ji).' },
  { key: 'coop_versus_human_limit', type: 'number', label: 'Max Human SI', desc: 'Số lượng người chơi tối đa phe Infected trong coop_versus.' },
  { key: 'max_specials', type: 'number', label: 'Max Specials', desc: 'Tổng số SI xuất hiện cùng lúc.' },
  { key: 'smoker_limit', type: 'number', label: 'Smoker Limit', desc: 'Tối đa Smoker.' },
  { key: 'boomer_limit', type: 'number', label: 'Boomer Limit', desc: 'Tối đa Boomer.' },
  { key: 'hunter_limit', type: 'number', label: 'Hunter Limit', desc: 'Tối đa Hunter.' },
  { key: 'spitter_limit', type: 'number', label: 'Spitter Limit', desc: 'Tối đa Spitter.' },
  { key: 'jockey_limit', type: 'number', label: 'Jockey Limit', desc: 'Tối đa Jockey.' },
  { key: 'charger_limit', type: 'number', label: 'Charger Limit', desc: 'Tối đa Charger.' },
  { key: 'tank_limit', type: 'number', label: 'Tank Limit', desc: 'Số Tank tối đa.' },
  { key: 'tank_spawn_probability', type: 'number', label: 'Tank Spawn Probability (%)', desc: 'Tỷ lệ spawn Tank theo block hiện tại.' },
  { key: 'tank_health', type: 'number', label: 'Tank Health', desc: 'Máu cơ bản của Tank.' },
  { key: 'tank_spawn_final', type: 'toggle', label: 'Tank Spawn Finale', desc: 'Cho phép Tank spawn ở map finale.' },
  { key: 'witch_max_limit', type: 'number', label: 'Witch Limit', desc: 'Số Witch tối đa.' },
  { key: 'witch_spawn_time_min', type: 'number', label: 'Min Witch Spawn Time', desc: 'Thời gian chờ nhỏ nhất để spawn Witch (giây).' },
  { key: 'witch_spawn_time_max', type: 'number', label: 'Max Witch Spawn Time', desc: 'Thời gian chờ lớn nhất để spawn Witch (giây).' },
  { key: 'life', type: 'number', label: 'SI Life Time', desc: 'Thời gian SI tồn tại trước khi tự despawn.' },
  { key: 'spawn_time_min', type: 'number', label: 'Min Spawn Time', desc: 'Thời gian chờ nhỏ nhất (giây).' },
  { key: 'spawn_time_max', type: 'number', label: 'Max Spawn Time', desc: 'Thời gian chờ lớn nhất (giây).' }
];

const NotifierCoreDisplayConfig = [
  { cvar: 'tuan_notify_core_screen_hud_notification', type: 'toggle', label: 'Screen hud notification', desc: 'Hiển thị thông báo lên HUD trên màn hình.' },
  { cvar: 'tuan_notify_core_kill_feed', type: 'toggle', label: 'Kill feed HUD', desc: 'Hiển thị kill feed bên phải khi bật Screen HUD.' }
];

const RedAnnounceConfig = [
  { cvar: 'l4d2_redannounce_enable', type: 'toggle', label: 'Chat notification', desc: 'Bật/tắt thông báo Death/Incap qua plugin Tuan_l4d2_death_incap_red.' },
  { cvar: 'l4d2_redannounce_announce_elite_si_kill', type: 'toggle', label: 'Elite SI Tag (chat)', desc: 'Hiện tag Elite trong thông báo survivor kill SI của chat đỏ.' }
];

const CvarDefaultValues = {
  l4d2_redannounce_enable: '1',
  l4d2_elite_si_core_spawn_cooldown: '20.0',
  l4d2_elite_si_core_spawn_announce: '1',
  l4d2_elite_si_core_smoker_force_subtype: '0',
  l4d2_elite_si_core_boomer_force_subtype: '0',
  l4d2_elite_si_hardsi_director_enable: '1',
  l4d2_elite_si_hardsi_director_assault_interval: '2.0',
  l4d2_elite_si_hardsi_smoker_enable: '1',
  l4d2_elite_si_hardsi_boomer_enable: '1',
  l4d2_elite_si_hardsi_boomer_bhop: '1',
  l4d2_elite_si_hardsi_hunter_enable: '1',
  l4d2_elite_si_hardsi_hunter_fast_pounce_distance: '1000',
  l4d2_elite_si_hardsi_hunter_pounce_vertical_limit: '7.0',
  l4d2_elite_si_hardsi_hunter_aim_offset_sensitivity: '30.0',
  l4d2_elite_si_hardsi_hunter_straight_pounce_distance: '200',
  l4d2_elite_si_hardsi_hunter_leap_away_block_enable: '1',
  l4d2_elite_si_hardsi_spitter_enable: '1',
  l4d2_elite_si_hardsi_spitter_bhop: '1',
  l4d2_elite_si_hardsi_jockey_enable: '1',
  l4d2_elite_si_hardsi_jockey_hop_distance: '500',
  l4d2_elite_si_hardsi_charger_enable: '1',
  l4d2_elite_si_hardsi_charger_bhop: '1',
  l4d2_elite_si_hardsi_charger_charge_distance: '300',
  l4d2_elite_si_hardsi_charger_health_threshold: '300',
  l4d2_elite_si_hardsi_charger_aim_offset_sensitivity: '22.5',
  l4d2_elite_si_hardsi_tank_enable: '1',
  l4d2_elite_si_hardsi_tank_bhop: '1',
  l4d2_elite_si_hardsi_tank_allow_rock: '1',
  l4d2_elite_si_hardsi_tank_smart_rock_enable: '1',
  l4d2_elite_si_hardsi_tank_smart_rock_range: '1200.0',
  l4d2_elite_si_hardsi_tank_smart_rock_aim_offset: '22.5',
  l4d2_elite_smoker_noxious_warning_hint_enable: '1',
  l4d2_elite_smoker_noxious_warning_hint_cooldown: '1.8',
  l4d2_elite_smoker_noxious_warning_hint_color: '255 120 60',
  l4d2_elite_smoker_noxious_smoke_screen_hint_enable: '1',
  l4d2_elite_smoker_noxious_asphyxiation_enable: '1',
  l4d2_elite_smoker_noxious_asphyxiation_damage: '5',
  l4d2_elite_smoker_noxious_asphyxiation_frequency: '1.0',
  l4d2_elite_smoker_noxious_asphyxiation_range: '300.0',
  l4d2_elite_smoker_noxious_collapsed_lung_enable: '1',
  l4d2_elite_smoker_noxious_collapsed_lung_chance: '100',
  l4d2_elite_smoker_noxious_collapsed_lung_damage: '1',
  l4d2_elite_smoker_noxious_collapsed_lung_duration: '5',
  l4d2_elite_smoker_noxious_methane_blast_enable: '1',
  l4d2_elite_smoker_noxious_methane_blast_inner_damage: '15',
  l4d2_elite_smoker_noxious_methane_blast_outer_damage: '5',
  l4d2_elite_smoker_noxious_methane_blast_inner_range: '75.0',
  l4d2_elite_smoker_noxious_methane_blast_outer_range: '150.0',
  l4d2_elite_smoker_noxious_methane_blast_inner_push: '450.0',
  l4d2_elite_smoker_noxious_methane_blast_outer_push: '220.0',
  l4d2_elite_smoker_noxious_methane_leak_enable: '1',
  l4d2_elite_smoker_noxious_methane_leak_cooldown: '60.0',
  l4d2_elite_smoker_noxious_methane_leak_damage: '5',
  l4d2_elite_smoker_noxious_methane_leak_duration: '10.0',
  l4d2_elite_smoker_noxious_methane_leak_period: '2.0',
  l4d2_elite_smoker_noxious_methane_leak_radius: '100.0',
  l4d2_elite_smoker_noxious_methane_strike_enable: '1',
  l4d2_elite_smoker_noxious_moon_walk_enable: '1',
  l4d2_elite_smoker_noxious_moon_walk_speed: '1.25',
  l4d2_elite_smoker_noxious_restrained_hostage_enable: '1',
  l4d2_elite_smoker_noxious_restrained_hostage_scale: '0.5',
  l4d2_elite_smoker_noxious_restrained_hostage_damage: '3',
  l4d2_elite_smoker_noxious_smoke_screen_enable: '1',
  l4d2_elite_smoker_noxious_smoke_screen_chance: '20',
  l4d2_elite_smoker_noxious_tongue_strip_enable: '1',
  l4d2_elite_smoker_noxious_tongue_strip_chance: '50',
  l4d2_elite_smoker_noxious_tongue_whip_enable: '1',
  l4d2_elite_smoker_noxious_tongue_whip_damage: '10',
  l4d2_elite_smoker_noxious_tongue_whip_range: '500.0',
  l4d2_elite_smoker_noxious_tongue_whip_push: '300.0',
  l4d2_elite_smoker_noxious_void_pocket_enable: '1',
  l4d2_elite_smoker_noxious_void_pocket_cooldown: '5.0',
  l4d2_elite_smoker_noxious_void_pocket_chance: '35',
  l4d2_elite_smoker_noxious_void_pocket_range: '200.0',
  l4d2_elite_smoker_noxious_void_pocket_pull: '350.0',
  l4d2_elite_smoker_noxious_void_pocket_damage: '0',
  l4d2_elite_boomer_nauseating_think_interval: '0.2',
  l4d2_elite_boomer_nauseating_bile_belly_enable: '1',
  l4d2_elite_boomer_nauseating_bile_belly_damage_scale: '0.5',
  l4d2_elite_boomer_nauseating_bile_blast_enable: '1',
  l4d2_elite_boomer_nauseating_bile_blast_inner_push: '200.0',
  l4d2_elite_boomer_nauseating_bile_blast_outer_push: '100.0',
  l4d2_elite_boomer_nauseating_bile_blast_inner_damage: '15',
  l4d2_elite_boomer_nauseating_bile_blast_outer_damage: '5',
  l4d2_elite_boomer_nauseating_bile_blast_inner_range: '250.0',
  l4d2_elite_boomer_nauseating_bile_blast_outer_range: '400.0',
  l4d2_elite_boomer_nauseating_bile_feet_enable: '1',
  l4d2_elite_boomer_nauseating_bile_feet_speed: '1.5',
  l4d2_elite_boomer_nauseating_bile_feet_clear_vomit_fatigue: '1',
  l4d2_elite_boomer_nauseating_bile_mask_enable: '1',
  l4d2_elite_boomer_nauseating_bile_mask_mode: '1',
  l4d2_elite_boomer_nauseating_bile_mask_amount: '200',
  l4d2_elite_boomer_nauseating_bile_mask_duration: '10.0',
  l4d2_elite_boomer_nauseating_bile_pimple_enable: '1',
  l4d2_elite_boomer_nauseating_bile_pimple_chance: '5',
  l4d2_elite_boomer_nauseating_bile_pimple_damage: '10',
  l4d2_elite_boomer_nauseating_bile_pimple_range: '500.0',
  l4d2_elite_boomer_nauseating_bile_pimple_period: '0.5',
  l4d2_elite_boomer_nauseating_bile_shower_enable: '1',
  l4d2_elite_boomer_nauseating_bile_shower_cooldown: '10.0',
  l4d2_elite_boomer_nauseating_bile_swipe_enable: '1',
  l4d2_elite_boomer_nauseating_bile_swipe_chance: '100',
  l4d2_elite_boomer_nauseating_bile_swipe_damage: '1',
  l4d2_elite_boomer_nauseating_bile_swipe_duration: '10',
  l4d2_elite_boomer_nauseating_bile_throw_enable: '1',
  l4d2_elite_boomer_nauseating_bile_throw_cooldown: '8.0',
  l4d2_elite_boomer_nauseating_bile_throw_damage: '10',
  l4d2_elite_boomer_nauseating_bile_throw_range: '700.0',
  l4d2_elite_boomer_nauseating_bile_throw_vision_dot: '0.73',
  l4d2_elite_boomer_nauseating_explosive_diarrhea_enable: '1',
  l4d2_elite_boomer_nauseating_explosive_diarrhea_range: '100.0',
  l4d2_elite_boomer_nauseating_explosive_diarrhea_rear_dot: '0.73',
  l4d2_elite_boomer_nauseating_flatulence_enable: '1',
  l4d2_elite_boomer_nauseating_flatulence_bile_chance: '20',
  l4d2_elite_boomer_nauseating_flatulence_cooldown: '60.0',
  l4d2_elite_boomer_nauseating_flatulence_damage: '5',
  l4d2_elite_boomer_nauseating_flatulence_duration: '10.0',
  l4d2_elite_boomer_nauseating_flatulence_period: '2.0',
  l4d2_elite_boomer_nauseating_flatulence_radius: '100.0'
};

const getNormalizedCvarValue = (cvar, rawValue) => {
  const text = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();
  if (text !== '') {
    return text;
  }

  if (Object.prototype.hasOwnProperty.call(CvarDefaultValues, cvar)) {
    return CvarDefaultValues[cvar];
  }

  return '';
};

const NotifierEventConfig = [
  { cvar: 'tuan_notify_member_evt_enable', type: 'toggle', label: 'Bật Events member', desc: 'Bật/tắt module thông báo sự kiện phụ.' },
  { cvar: 'tuan_notify_member_evt_notify_healed_other', type: 'toggle', label: 'Heal Other', desc: 'Thông báo khi cứu thương người B&W.' },
  { cvar: 'tuan_notify_member_evt_notify_go_bnw', type: 'toggle', label: 'Go B&W', desc: 'Thông báo khi một người rơi vào B&W.' },
  { cvar: 'tuan_notify_member_evt_notify_revived_other', type: 'toggle', label: 'Revive Other', desc: 'Thông báo khi gọi người khác dậy.' },
  { cvar: 'tuan_notify_member_evt_notify_self_revived', type: 'toggle', label: 'Self Revive', desc: 'Thông báo khi tự đứng dậy.' },
  { cvar: 'tuan_notify_member_evt_notify_throw_molotov', type: 'toggle', label: 'Throw Molotov', desc: 'Thông báo khi ném Molotov.' },
  { cvar: 'tuan_notify_member_evt_notify_throw_pipebomb', type: 'toggle', label: 'Throw Pipebomb', desc: 'Thông báo khi ném Pipebomb.' },
  { cvar: 'tuan_notify_member_evt_notify_throw_vomitjar', type: 'toggle', label: 'Throw Vomitjar', desc: 'Thông báo khi ném Bile.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_gascan', type: 'toggle', label: 'Explode Gascan', desc: 'Thông báo nổ bình xăng.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_fuel_barrel', type: 'toggle', label: 'Explode Fuel Barrel', desc: 'Thông báo nổ thùng dầu.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_propanecanister', type: 'toggle', label: 'Explode Propane', desc: 'Thông báo nổ bình gas.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_oxygentank', type: 'toggle', label: 'Explode Oxygen', desc: 'Thông báo nổ bình oxy.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_barricade_gascan', type: 'toggle', label: 'Explode Barricade', desc: 'Thông báo nổ barricade gascan.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_gas_pump', type: 'toggle', label: 'Explode Gas Pump', desc: 'Thông báo nổ trụ xăng.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_fireworks_crate', type: 'toggle', label: 'Explode Fireworks', desc: 'Thông báo nổ thùng pháo hoa.' },
  { cvar: 'tuan_notify_member_evt_notify_explode_oil_drum', type: 'toggle', label: 'Explode Oil Drum', desc: 'Thông báo nổ thùng dầu custom.' },
  { cvar: 'tuan_notify_member_evt_notify_gear_give', type: 'toggle', label: 'Gear Give', desc: 'Thông báo khi đưa đồ đồng đội.' },
  { cvar: 'tuan_notify_member_evt_notify_gear_grab', type: 'toggle', label: 'Gear Grab', desc: 'Thông báo khi lấy đồ từ đồng đội.' },
  { cvar: 'tuan_notify_member_evt_notify_gear_swap', type: 'toggle', label: 'Gear Swap', desc: 'Thông báo khi đổi đồ với đồng đội.' }
];

const IncappedModesOptions = [
  { v: 'coop', n: 'Coop' },
  { v: 'realism', n: 'Realism' },
  { v: 'versus', n: 'Versus' },
  { v: 'scavenge', n: 'Scavenge' },
  { v: 'survival', n: 'Survival' }
];

const IncappedRestrictedWeaponOptions = [
  { v: '2', n: 'SMG (Uzi)', aliases: ['smg'] },
  { v: '3', n: 'Pump Shotgun', aliases: ['pumpshotgun'] },
  { v: '4', n: 'Auto Shotgun', aliases: ['autoshotgun'] },
  { v: '5', n: 'M16 Rifle', aliases: ['rifle'] },
  { v: '6', n: 'Hunting Rifle', aliases: ['huntingrifle'] },
  { v: '7', n: 'Silenced SMG (Mac-10)', aliases: ['smgsilenced'] },
  { v: '8', n: 'Chrome Shotgun', aliases: ['chromeshotgun'] },
  { v: '9', n: 'Desert Rifle (SCAR)', aliases: ['rifledesert'] },
  { v: '10', n: 'Military Sniper', aliases: ['militarysniper'] },
  { v: '11', n: 'SPAS Shotgun', aliases: ['spasshotgun'] },
  { v: '12', n: 'First Aid Kit', aliases: ['medkit'] },
  { v: '13', n: 'Molotov' },
  { v: '14', n: 'Pipe Bomb' },
  { v: '15', n: 'Pain Pills' },
  { v: '19', n: 'Melee' },
  { v: '20', n: 'Chainsaw' },
  { v: '21', n: 'Grenade Launcher', aliases: ['grenadelauncher'] },
  { v: '23', n: 'Adrenaline' },
  { v: '24', n: 'Defibrillator', aliases: ['defib'] },
  { v: '25', n: 'Vomitjar' },
  { v: '26', n: 'AK-47', aliases: ['ak47'] },
  { v: '30', n: 'Incendiary Ammo Pack', aliases: ['upgradepack_incendiary'] },
  { v: '31', n: 'Explosive Ammo Pack', aliases: ['upgradepack_explosive'] },
  { v: '33', n: 'MP5', aliases: ['mp5'] },
  { v: '34', n: 'SG552', aliases: ['sg552'] },
  { v: '35', n: 'AWP Sniper', aliases: ['awp'] },
  { v: '36', n: 'Scout Sniper', aliases: ['scout'] },
  { v: '37', n: 'M60', aliases: ['m60'] }
];

const IncappedWeaponsConfig = [
  { cvar: 'l4d_incapped_weapons_allow', type: 'toggle', label: 'Enable Plugin', desc: '0=Off, 1=On.' },
  { cvar: 'l4d_incapped_weapons_modes', type: 'csv-checkbox', label: 'Modes On', desc: 'Chọn mode bật plugin. Bỏ trống = tất cả mode.', options: IncappedModesOptions, preserveUnknownCsv: true },
  { cvar: 'l4d_incapped_weapons_modes_off', type: 'csv-checkbox', label: 'Modes Off', desc: 'Chọn mode tắt plugin. Bỏ trống = không mode nào bị tắt.', options: IncappedModesOptions, preserveUnknownCsv: true },
  { cvar: 'l4d_incapped_weapons_modes_tog', type: 'number', label: 'Modes Toggle Mask', desc: 'Bitmask mode: 0=All, 1=Coop, 2=Survival, 4=Versus, 8=Scavenge.' },
  { cvar: 'l4d_incapped_weapons_delay_adren', type: 'number', label: 'Adren Revive Delay (s)', desc: 'Thời gian chờ self-revive sau khi dùng adrenaline (0=Off).' },
  { cvar: 'l4d_incapped_weapons_delay_pills', type: 'number', label: 'Pills Revive Delay (s)', desc: 'Thời gian chờ self-revive sau khi dùng pills (0=Off).' },
  { cvar: 'l4d_incapped_weapons_delay_text', type: 'radio', label: 'Delay Text', desc: 'Hiển thị countdown khi revive delay.', options: [{ v: '0', n: 'Off' }, { v: '1', n: 'Chat' }, { v: '2', n: 'Hint' }] },
  { cvar: 'l4d_incapped_weapons_friendly', type: 'number', label: 'Friendly Fire Scale', desc: 'Hệ số damage lên survivor khác khi đang incapped.' },
  { cvar: 'l4d_incapped_weapons_heal_adren', type: 'number', label: 'Adren Heal Amount', desc: '-1=Revive, 0=Off, số dương = hồi máu khi incapped.' },
  { cvar: 'l4d_incapped_weapons_heal_pills', type: 'number', label: 'Pills Heal Amount', desc: '-1=Revive, 0=Off, số dương = hồi máu khi incapped.' },
  { cvar: 'l4d_incapped_weapons_heal_revive', type: 'radio', label: 'Revive Into B&W', desc: 'Áp trạng thái đen trắng khi revive bằng item.', options: [{ v: '0', n: 'Off' }, { v: '1', n: 'Pills' }, { v: '2', n: 'Adren' }, { v: '3', n: 'Both' }] },
  { cvar: 'l4d_incapped_weapons_heal_text', type: 'radio', label: 'Heal Hint Text', desc: 'Gợi ý có thể dùng pills/adrenaline khi đang incapped.', options: [{ v: '0', n: 'Off' }, { v: '1', n: 'Chat' }, { v: '2', n: 'Hint' }] },
  { cvar: 'l4d_incapped_weapons_health', type: 'number', label: 'Revive Main Health', desc: 'Máu thật sau self-revive.' },
  { cvar: 'l4d_incapped_weapons_melee', type: 'toggle', label: 'Melee Friendly Fire', desc: 'L4D2: Cho phép melee từ survivor incapped gây damage lên survivor khác.' },
  { cvar: 'l4d_incapped_weapons_pistol', type: 'toggle', label: 'Give Pistol On Incap', desc: 'L4D2: 0=không cấp pistol, 1=cấp pistol mặc định game.' },
  { cvar: 'l4d_incapped_weapons_restrict', type: 'csv-checkbox', label: 'Restricted Weapon IDs', desc: 'Tick để chặn weapon khi đang incapped.', options: IncappedRestrictedWeaponOptions, preserveUnknownCsv: true },
  { cvar: 'l4d_incapped_weapons_revive', type: 'radio', label: 'Revive Animation Mode', desc: 'Cơ chế animation khi self-revive.', options: [{ v: '0', n: 'Off' }, { v: '1', n: 'Interruptible' }, { v: '2', n: 'Restart On Damage' }, { v: '3', n: 'No Interrupt' }, { v: '4', n: 'Godmode' }] },
  { cvar: 'l4d_incapped_weapons_throw', type: 'toggle', label: 'Allow Throw Animation', desc: '0=Chặn đứng dậy khi ném lựu đạn, 1=Cho phép animation ném.' }
];

const EliteSIRewardConfig = [
  { cvar: 'l4d2_elite_si_core_enable', type: 'toggle', label: 'Bật hệ Elite Core', desc: 'Bật/tắt hệ gán Elite SI và subtype.' },
  { cvar: 'l4d2_elite_reward_enable', type: 'toggle', label: 'Bật hệ Reward', desc: 'Bật/tắt toàn bộ hệ thưởng Temp HP.' },

  { cvar: 'l4d2_elite_reward_si_enable', type: 'toggle', label: 'Bật thưởng SI', desc: 'Bật/tắt thưởng khi hạ SI (elite và normal nếu có bật normal reward).' },
  { cvar: 'l4d2_elite_reward_normal_si_enable', type: 'toggle', label: 'Bật thưởng Normal SI', desc: 'Cho phép SI thường (không elite) cũng nhận reward Temp HP khi bị hạ.' },
  { cvar: 'l4d2_elite_reward_tank_enable', type: 'toggle', label: 'Bật thưởng Tank', desc: 'Bật/tắt thưởng khi hạ Tank.' },
  { cvar: 'l4d2_elite_reward_witch_enable', type: 'toggle', label: 'Bật thưởng Witch', desc: 'Bật/tắt thưởng khi hạ Witch.' },
  { cvar: 'l4d2_elite_reward_temp_hp_limit', type: 'number', label: 'Giới hạn HP tối đa', desc: 'Ngưỡng HP thật + HP tạm sau khi cộng thưởng.' },

  { cvar: 'l4d2_elite_reward_smoker', type: 'number', label: 'Smoker Reward', desc: 'HP thưởng khi hạ Elite Smoker.' },
  { cvar: 'l4d2_elite_reward_boomer', type: 'number', label: 'Boomer Reward', desc: 'HP thưởng khi hạ Elite Boomer.' },
  { cvar: 'l4d2_elite_reward_hunter', type: 'number', label: 'Hunter Reward', desc: 'HP thưởng khi hạ Elite Hunter.' },
  { cvar: 'l4d2_elite_reward_spitter', type: 'number', label: 'Spitter Reward', desc: 'HP thưởng khi hạ Elite Spitter.' },
  { cvar: 'l4d2_elite_reward_jockey', type: 'number', label: 'Jockey Reward', desc: 'HP thưởng khi hạ Elite Jockey.' },
  { cvar: 'l4d2_elite_reward_charger', type: 'number', label: 'Charger Reward', desc: 'HP thưởng khi hạ Elite Charger.' },
  { cvar: 'l4d2_elite_reward_normal_si_amount', type: 'number', label: 'Normal SI Reward', desc: 'HP thưởng khi hạ SI thường (không elite). Chỉ dùng khi bật Normal SI Reward.' },

  { cvar: 'l4d2_elite_reward_headshot_bonus_enable', type: 'toggle', label: 'Headshot Bonus', desc: 'Nhân thưởng nếu kết liễu bằng headshot.' },
  { cvar: 'l4d2_elite_reward_headshot_bonus_multiplier', type: 'number', label: 'Headshot Multiplier', desc: 'Hệ số nhân thưởng khi headshot (ví dụ 2.0).' },

  { cvar: 'l4d2_elite_reward_scale_by_difficulty', type: 'toggle', label: 'Scale theo độ khó', desc: 'Bật nhân thưởng theo z_difficulty hiện tại.' },
  { cvar: 'l4d2_elite_reward_diff_easy', type: 'number', label: 'Easy Multiplier', desc: 'Hệ số thưởng khi độ khó easy.' },
  { cvar: 'l4d2_elite_reward_diff_normal', type: 'number', label: 'Normal Multiplier', desc: 'Hệ số thưởng khi độ khó normal.' },
  { cvar: 'l4d2_elite_reward_diff_hard', type: 'number', label: 'Hard/Advanced Multiplier', desc: 'Hệ số thưởng khi độ khó hard/advanced.' },
  { cvar: 'l4d2_elite_reward_diff_expert', type: 'number', label: 'Expert Multiplier', desc: 'Hệ số thưởng khi độ khó impossible/expert.' },

  { cvar: 'l4d2_elite_reward_tank_mode', type: 'radio', label: 'Tank Reward Mode', desc: 'Cách phát thưởng khi hạ Tank.', options: [{ v: '0', n: 'Chỉ attacker' }, { v: '1', n: 'Toàn team sống' }] },
  { cvar: 'l4d2_elite_reward_tank_amount', type: 'number', label: 'Tank Reward Amount', desc: 'Lượng thưởng cơ bản khi hạ Tank.' },
  { cvar: 'l4d2_elite_reward_witch_mode', type: 'radio', label: 'Witch Reward Mode', desc: 'Cách phát thưởng khi hạ Witch.', options: [{ v: '0', n: 'Chỉ attacker' }, { v: '1', n: 'Toàn team sống' }] },
  { cvar: 'l4d2_elite_reward_witch_amount', type: 'number', label: 'Witch Reward Amount', desc: 'Lượng thưởng cơ bản khi hạ Witch.' },
  { cvar: 'l4d2_elite_reward_show_hint', type: 'toggle', label: 'Hiện Hint Reward', desc: 'Bật/tắt instructor hint khi nhận thưởng.' },
  { cvar: 'l4d2_elite_reward_hint_color_normal_si', type: 'text', label: 'Hint Color Normal SI', desc: 'Màu hint khi hạ normal SI, định dạng: R G B (mặc định 255 255 255).' },
  { cvar: 'l4d2_elite_reward_hint_color_elite_si', type: 'text', label: 'Hint Color Elite SI', desc: 'Màu hint khi hạ elite SI, định dạng: R G B (mặc định 255 255 0).' },

  { cvar: 'l4d2_elite_si_core_spawn_chance', type: 'number', label: 'Elite Spawn Chance (%)', desc: 'Tỷ lệ SI thường trở thành Elite. Roll này áp cho SI thường, không phải Tank.' },
  { cvar: 'l4d2_elite_si_core_spawn_cooldown', type: 'number', label: 'Elite Spawn Cooldown (s)', desc: 'Khoảng nghỉ tối thiểu giữa 2 lần spawn Elite thành công. Mặc định 20 giây.' },
  { cvar: 'l4d2_elite_si_core_hp_multiplier', type: 'number', label: 'Elite HP Multiplier', desc: 'Hệ số buff máu cho Elite SI.' },
  { cvar: 'l4d2_elite_si_core_fire_ignite_chance', type: 'number', label: 'Elite Self-Ignite Chance (%)', desc: 'Tỷ lệ Elite tự bốc cháy. Chỉ Elite tự cháy mới kháng damage lửa.' },
  { cvar: 'l4d2_elite_si_core_spitter_ability_subtype_chance', type: 'number', label: 'Spitter AbilityMovement Chance (%)', desc: 'Nếu Spitter đã roll thành Elite, đây là tỷ lệ nó thuộc chủng AbilityMovement thay vì HardSI.' },
  { cvar: 'l4d2_elite_si_core_charger_steering_subtype_chance', type: 'number', label: 'ChargerSteering Chance (%)', desc: 'Nếu Charger đã roll thành Elite, đây là tỷ lệ nó thuộc chủng ChargerSteering thay vì nhánh khác.' },
  { cvar: 'l4d2_elite_si_core_charger_action_subtype_chance', type: 'number', label: 'ChargerAction Chance (%)', desc: 'Nếu Charger đã roll thành Elite, đây là tỷ lệ nó thuộc chủng ChargerAction.' },

  { cvar: 'l4d2_elite_si_hardsi_director_enable', type: 'toggle', label: 'HardSI Director Enable', desc: 'Bật/tắt module director cho Abnormal Behavior (chỉ chạy nhịp nb_assault, không exec cfg dùng chung).' },
  { cvar: 'l4d2_elite_si_hardsi_director_assault_interval', type: 'number', label: 'HardSI Director Assault Interval', desc: 'Tần suất chạy nb_assault (giây). 0 = tắt.' },

  { cvar: 'l4d2_elite_si_hardsi_smoker_enable', type: 'toggle', label: 'Smoker HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Smoker elite.' },

  { cvar: 'l4d2_elite_si_hardsi_boomer_enable', type: 'toggle', label: 'Boomer HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Boomer elite.' },
  { cvar: 'l4d2_elite_si_hardsi_boomer_bhop', type: 'toggle', label: 'Boomer HardSI Bhop', desc: 'Bật/tắt bhop pressure cho Boomer HardSI.' },

  { cvar: 'l4d2_elite_si_hardsi_hunter_enable', type: 'toggle', label: 'Hunter HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Hunter elite.' },
  { cvar: 'l4d2_elite_si_hardsi_hunter_fast_pounce_distance', type: 'number', label: 'Hunter HardSI Fast Pounce Distance', desc: 'Khoảng cách kích hoạt fast pounce.' },
  { cvar: 'l4d2_elite_si_hardsi_hunter_pounce_vertical_limit', type: 'number', label: 'Hunter HardSI Pounce Vertical Limit', desc: 'Giới hạn góc đứng khi pounce.' },
  { cvar: 'l4d2_elite_si_hardsi_hunter_aim_offset_sensitivity', type: 'number', label: 'Hunter HardSI Aim Offset', desc: 'Độ nhạy lệch góc aim để ép đổi hướng pounce.' },
  { cvar: 'l4d2_elite_si_hardsi_hunter_straight_pounce_distance', type: 'number', label: 'Hunter HardSI Straight Pounce Distance', desc: 'Khoảng cách giữ pounce thẳng.' },
  { cvar: 'l4d2_elite_si_hardsi_hunter_leap_away_block_enable', type: 'toggle', label: 'Hunter HardSI LeapAway Block', desc: 'Chặn leap-away assault behavior theo logic AI_HardSI.' },

  { cvar: 'l4d2_elite_si_hardsi_spitter_enable', type: 'toggle', label: 'Spitter HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Spitter elite.' },
  { cvar: 'l4d2_elite_si_hardsi_spitter_bhop', type: 'toggle', label: 'Spitter HardSI Bhop', desc: 'Bật/tắt bhop pressure cho Spitter HardSI.' },

  { cvar: 'l4d2_elite_si_hardsi_jockey_enable', type: 'toggle', label: 'Jockey HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Jockey elite.' },
  { cvar: 'l4d2_elite_si_hardsi_jockey_hop_distance', type: 'number', label: 'Jockey HardSI Hop Distance', desc: 'Khoảng cách kích hoạt hop pressure.' },

  { cvar: 'l4d2_elite_si_hardsi_charger_enable', type: 'toggle', label: 'Charger HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Charger elite.' },
  { cvar: 'l4d2_elite_si_hardsi_charger_bhop', type: 'toggle', label: 'Charger HardSI Bhop', desc: 'Bật/tắt bhop pressure cho Charger HardSI.' },
  { cvar: 'l4d2_elite_si_hardsi_charger_charge_distance', type: 'number', label: 'Charger HardSI Charge Distance', desc: 'Khoảng cách ưu tiên chuẩn bị charge.' },
  { cvar: 'l4d2_elite_si_hardsi_charger_health_threshold', type: 'number', label: 'Charger HardSI Health Threshold', desc: 'Ngưỡng HP ép charge.' },
  { cvar: 'l4d2_elite_si_hardsi_charger_aim_offset_sensitivity', type: 'number', label: 'Charger HardSI Aim Offset', desc: 'Độ nhạy retarget khi mục tiêu đang nhìn charger.' },

  { cvar: 'l4d2_elite_si_hardsi_tank_enable', type: 'toggle', label: 'Tank HardSI Enable', desc: 'Bật/tắt Abnormal Behavior cho Tank elite.' },
  { cvar: 'l4d2_elite_si_hardsi_tank_bhop', type: 'toggle', label: 'Tank HardSI Bhop', desc: 'Bật/tắt bhop pressure cho Tank HardSI.' },
  { cvar: 'l4d2_elite_si_hardsi_tank_allow_rock', type: 'toggle', label: 'Tank HardSI Allow Rock', desc: 'Cho phép/tắt ném đá của Tank HardSI.' },
  { cvar: 'l4d2_elite_si_hardsi_tank_smart_rock_enable', type: 'toggle', label: 'Tank HardSI Smart Rock', desc: 'Bật/tắt smart rock target adjustment.' },
  { cvar: 'l4d2_elite_si_hardsi_tank_smart_rock_range', type: 'number', label: 'Tank HardSI Smart Rock Range', desc: 'Bán kính tìm mục tiêu cho smart rock.' },
  { cvar: 'l4d2_elite_si_hardsi_tank_smart_rock_aim_offset', type: 'number', label: 'Tank HardSI Smart Rock Aim Offset', desc: 'Ngưỡng góc aim để quyết định retarget smart rock.' },

  { cvar: 'l4d2_elite_si_core_spawn_announce', type: 'toggle', label: 'Chat Spawn Announce', desc: 'Bật/tắt thông báo Elite spawn trong chat (không đẩy HUD script).' },
  { cvar: 'l4d2_redannounce_announce_elite_si_kill', type: 'toggle', label: 'Elite Type In Kill Message', desc: 'Hiện tên loại elite cụ thể trong kill/incap message thay vì chỉ "Elite SI".' },
  { cvar: 'l4d2_elite_si_core_smoker_force_subtype', type: 'number', label: 'Force Smoker Subtype (test)', desc: '0=random, 5-15 ép type để test nhanh từng kỹ năng noxious.' },
  { cvar: 'l4d2_elite_si_core_boomer_force_subtype', type: 'number', label: 'Force Boomer Subtype (test)', desc: '0=random, 16-25 ép type để test nhanh từng kỹ năng nauseating.' },

  { cvar: 'l4d2_elite_smoker_noxious_warning_hint_enable', type: 'toggle', label: 'Warning Hint Enable', desc: 'Hiện instructor warning khi survivor ăn noxious damage.' },
  { cvar: 'l4d2_elite_smoker_noxious_warning_hint_cooldown', type: 'number', label: 'Warning Hint Cooldown', desc: 'Khoảng nghỉ giữa các warning hint trên cùng người chơi.' },
  { cvar: 'l4d2_elite_smoker_noxious_warning_hint_color', type: 'text', label: 'Warning Hint Color', desc: 'Màu hint cảnh báo noxious, định dạng: R G B.' },
  { cvar: 'l4d2_elite_smoker_noxious_smoke_screen_hint_enable', type: 'toggle', label: 'Smoke Screen Hint', desc: 'Hiện hint cho attacker khi Smoke Screen làm miss hit.' },

  { cvar: 'l4d2_elite_smoker_noxious_asphyxiation_enable', type: 'toggle', label: 'Asphyxiation Enable', desc: 'Bật/tắt subtype Asphyxiation.' },
  { cvar: 'l4d2_elite_smoker_noxious_asphyxiation_damage', type: 'number', label: 'Asphyxiation Damage', desc: 'Damage mỗi tick của Asphyxiation.' },
  { cvar: 'l4d2_elite_smoker_noxious_asphyxiation_frequency', type: 'number', label: 'Asphyxiation Frequency', desc: 'Chu kỳ gây damage Asphyxiation (giây).' },
  { cvar: 'l4d2_elite_smoker_noxious_asphyxiation_range', type: 'number', label: 'Asphyxiation Range', desc: 'Bán kính tác dụng Asphyxiation.' },

  { cvar: 'l4d2_elite_smoker_noxious_collapsed_lung_enable', type: 'toggle', label: 'Collapsed Lung Enable', desc: 'Bật/tắt subtype Collapsed Lung.' },
  { cvar: 'l4d2_elite_smoker_noxious_collapsed_lung_chance', type: 'number', label: 'Collapsed Lung Chance', desc: 'Tỷ lệ áp dụng sau tongue release (%).' },
  { cvar: 'l4d2_elite_smoker_noxious_collapsed_lung_damage', type: 'number', label: 'Collapsed Lung Damage', desc: 'Damage mỗi giây của Collapsed Lung.' },
  { cvar: 'l4d2_elite_smoker_noxious_collapsed_lung_duration', type: 'number', label: 'Collapsed Lung Duration', desc: 'Thời gian kéo dài Collapsed Lung (giây).' },

  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_enable', type: 'toggle', label: 'Methane Blast Enable', desc: 'Bật/tắt subtype Methane Blast.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_inner_damage', type: 'number', label: 'Methane Blast Inner Damage', desc: 'Damage vùng trong.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_outer_damage', type: 'number', label: 'Methane Blast Outer Damage', desc: 'Damage vùng ngoài.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_inner_range', type: 'number', label: 'Methane Blast Inner Range', desc: 'Bán kính vùng trong.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_outer_range', type: 'number', label: 'Methane Blast Outer Range', desc: 'Bán kính vùng ngoài.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_inner_push', type: 'number', label: 'Methane Blast Inner Push', desc: 'Lực đẩy vùng trong.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_blast_outer_push', type: 'number', label: 'Methane Blast Outer Push', desc: 'Lực đẩy vùng ngoài.' },

  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_enable', type: 'toggle', label: 'Methane Leak Enable', desc: 'Bật/tắt subtype Methane Leak.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_cooldown', type: 'number', label: 'Methane Leak Cooldown', desc: 'Thời gian chờ giữa mỗi lần thả cloud.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_damage', type: 'number', label: 'Methane Leak Damage', desc: 'Damage mỗi tick trong cloud.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_duration', type: 'number', label: 'Methane Leak Duration', desc: 'Thời gian cloud tồn tại.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_period', type: 'number', label: 'Methane Leak Period', desc: 'Chu kỳ tick damage cloud.' },
  { cvar: 'l4d2_elite_smoker_noxious_methane_leak_radius', type: 'number', label: 'Methane Leak Radius', desc: 'Bán kính cloud.' },

  { cvar: 'l4d2_elite_smoker_noxious_methane_strike_enable', type: 'toggle', label: 'Methane Strike Enable', desc: 'Bật/tắt subtype Methane Strike.' },
  { cvar: 'l4d2_elite_smoker_noxious_moon_walk_enable', type: 'toggle', label: 'Moon Walk Enable', desc: 'Bật/tắt subtype Moon Walk.' },
  { cvar: 'l4d2_elite_smoker_noxious_moon_walk_speed', type: 'number', label: 'Moon Walk Speed', desc: 'Multiplier tốc độ khi đang choke.' },

  { cvar: 'l4d2_elite_smoker_noxious_restrained_hostage_enable', type: 'toggle', label: 'Restrained Hostage Enable', desc: 'Bật/tắt subtype Restrained Hostage.' },
  { cvar: 'l4d2_elite_smoker_noxious_restrained_hostage_scale', type: 'number', label: 'Restrained Hostage Scale', desc: 'Tỷ lệ giảm damage vào smoker khi đang choke.' },
  { cvar: 'l4d2_elite_smoker_noxious_restrained_hostage_damage', type: 'number', label: 'Restrained Hostage Damage', desc: 'Damage chuyển sang hostage mỗi hit.' },

  { cvar: 'l4d2_elite_smoker_noxious_smoke_screen_enable', type: 'toggle', label: 'Smoke Screen Enable', desc: 'Bật/tắt subtype Smoke Screen.' },
  { cvar: 'l4d2_elite_smoker_noxious_smoke_screen_chance', type: 'number', label: 'Smoke Screen Chance', desc: 'Tỷ lệ né damage vào smoker (%).' },

  { cvar: 'l4d2_elite_smoker_noxious_tongue_strip_enable', type: 'toggle', label: 'Tongue Strip Enable', desc: 'Bật/tắt subtype Tongue Strip.' },
  { cvar: 'l4d2_elite_smoker_noxious_tongue_strip_chance', type: 'number', label: 'Tongue Strip Chance', desc: 'Tỷ lệ làm rơi item khi tongue grab (%).' },

  { cvar: 'l4d2_elite_smoker_noxious_tongue_whip_enable', type: 'toggle', label: 'Tongue Whip Enable', desc: 'Bật/tắt subtype Tongue Whip.' },
  { cvar: 'l4d2_elite_smoker_noxious_tongue_whip_damage', type: 'number', label: 'Tongue Whip Damage', desc: 'Damage shockwave Tongue Whip.' },
  { cvar: 'l4d2_elite_smoker_noxious_tongue_whip_range', type: 'number', label: 'Tongue Whip Range', desc: 'Bán kính Tongue Whip.' },
  { cvar: 'l4d2_elite_smoker_noxious_tongue_whip_push', type: 'number', label: 'Tongue Whip Push', desc: 'Lực đẩy Tongue Whip.' },

  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_enable', type: 'toggle', label: 'Void Pocket Enable', desc: 'Bật/tắt subtype Void Pocket.' },
  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_cooldown', type: 'number', label: 'Void Pocket Cooldown', desc: 'Thời gian chờ giữa các lần kéo.' },
  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_chance', type: 'number', label: 'Void Pocket Chance', desc: 'Tỷ lệ cast mỗi lần think (%).' },
  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_range', type: 'number', label: 'Void Pocket Range', desc: 'Bán kính hút mục tiêu.' },
  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_pull', type: 'number', label: 'Void Pocket Pull', desc: 'Lực hút của Void Pocket.' },
  { cvar: 'l4d2_elite_smoker_noxious_void_pocket_damage', type: 'number', label: 'Void Pocket Damage', desc: 'Damage bổ sung mỗi nạn nhân bị hút.' },

  { cvar: 'l4d2_elite_boomer_nauseating_think_interval', type: 'number', label: 'Nauseating Think Interval', desc: 'Chu kỳ xử lý main-think cho module boomer nauseating.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_belly_enable', type: 'toggle', label: 'Bile Belly Enable', desc: 'Bật/tắt subtype Bile Belly.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_belly_damage_scale', type: 'number', label: 'Bile Belly Damage Scale', desc: 'Hệ số damage nhận vào của Boomer Bile Belly.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_enable', type: 'toggle', label: 'Bile Blast Enable', desc: 'Bật/tắt subtype Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_inner_push', type: 'number', label: 'Bile Blast Inner Push', desc: 'Lực đẩy vùng trong của Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_outer_push', type: 'number', label: 'Bile Blast Outer Push', desc: 'Lực đẩy vùng ngoài của Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_inner_damage', type: 'number', label: 'Bile Blast Inner Damage', desc: 'Damage vùng trong của Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_outer_damage', type: 'number', label: 'Bile Blast Outer Damage', desc: 'Damage vùng ngoài của Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_inner_range', type: 'number', label: 'Bile Blast Inner Range', desc: 'Bán kính vùng trong của Bile Blast.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_blast_outer_range', type: 'number', label: 'Bile Blast Outer Range', desc: 'Bán kính vùng ngoài của Bile Blast.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_feet_enable', type: 'toggle', label: 'Bile Feet Enable', desc: 'Bật/tắt subtype Bile Feet.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_feet_speed', type: 'number', label: 'Bile Feet Speed', desc: 'Tốc độ di chuyển multiplier của Bile Feet.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_feet_clear_vomit_fatigue', type: 'toggle', label: 'Bile Feet Clear Vomit Fatigue', desc: 'Có force z_vomit_fatigue về 0 khi Bile Feet hoạt động hay không.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_mask_enable', type: 'toggle', label: 'Bile Mask Enable', desc: 'Bật/tắt subtype Bile Mask.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_mask_mode', type: 'radio', label: 'Bile Mask Mode', desc: 'Cách reset HUD mask sau khi bị bôi bile.', options: [{ v: '0', n: 'Fixed duration' }, { v: '1', n: 'Until bile dry' }] },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_mask_amount', type: 'number', label: 'Bile Mask Amount', desc: 'Mức che HUD (0-255).' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_mask_duration', type: 'number', label: 'Bile Mask Duration', desc: 'Thời lượng che HUD khi mode = Fixed duration.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_pimple_enable', type: 'toggle', label: 'Bile Pimple Enable', desc: 'Bật/tắt subtype Bile Pimple.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_pimple_chance', type: 'number', label: 'Bile Pimple Chance', desc: 'Tỷ lệ proc mỗi tick trên survivor trong vùng (%).' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_pimple_damage', type: 'number', label: 'Bile Pimple Damage', desc: 'Damage mỗi lần proc Bile Pimple.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_pimple_range', type: 'number', label: 'Bile Pimple Range', desc: 'Bán kính kiểm tra mục tiêu của Bile Pimple.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_pimple_period', type: 'number', label: 'Bile Pimple Period', desc: 'Khoảng thời gian giữa các tick Bile Pimple.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_shower_enable', type: 'toggle', label: 'Bile Shower Enable', desc: 'Bật/tắt subtype Bile Shower.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_shower_cooldown', type: 'number', label: 'Bile Shower Cooldown', desc: 'Cooldown giữa các lần gọi thêm mob sau khi vomit.' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_swipe_enable', type: 'toggle', label: 'Bile Swipe Enable', desc: 'Bật/tắt subtype Bile Swipe.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_swipe_chance', type: 'number', label: 'Bile Swipe Chance', desc: 'Tỷ lệ apply DoT khi boomer claw trúng survivor (%).' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_swipe_damage', type: 'number', label: 'Bile Swipe Damage', desc: 'Damage mỗi giây của DoT Bile Swipe.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_swipe_duration', type: 'number', label: 'Bile Swipe Duration', desc: 'Thời gian DoT Bile Swipe kéo dài (giây).' },

  { cvar: 'l4d2_elite_boomer_nauseating_bile_throw_enable', type: 'toggle', label: 'Bile Throw Enable', desc: 'Bật/tắt subtype Bile Throw.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_throw_cooldown', type: 'number', label: 'Bile Throw Cooldown', desc: 'Cooldown của Bile Throw khi boomer bấm chuột phải.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_throw_damage', type: 'number', label: 'Bile Throw Damage', desc: 'Damage khi Bile Throw trúng mục tiêu.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_throw_range', type: 'number', label: 'Bile Throw Range', desc: 'Tầm kiểm tra mục tiêu của Bile Throw.' },
  { cvar: 'l4d2_elite_boomer_nauseating_bile_throw_vision_dot', type: 'number', label: 'Bile Throw Vision Dot', desc: 'Độ mở cone nhìn của Bile Throw (-1 đến 1).' },

  { cvar: 'l4d2_elite_boomer_nauseating_explosive_diarrhea_enable', type: 'toggle', label: 'Explosive Diarrhea Enable', desc: 'Bật/tắt subtype Explosive Diarrhea.' },
  { cvar: 'l4d2_elite_boomer_nauseating_explosive_diarrhea_range', type: 'number', label: 'Explosive Diarrhea Range', desc: 'Tầm phía sau boomer bị ảnh hưởng khi vomit.' },
  { cvar: 'l4d2_elite_boomer_nauseating_explosive_diarrhea_rear_dot', type: 'number', label: 'Explosive Diarrhea Rear Dot', desc: 'Độ mở reverse cone cho Explosive Diarrhea (-1 đến 1).' },

  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_enable', type: 'toggle', label: 'Flatulence Enable', desc: 'Bật/tắt subtype Flatulence.' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_bile_chance', type: 'number', label: 'Flatulence Bile Chance', desc: 'Tỷ lệ bôi bile mỗi tick cloud Flatulence (%).' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_cooldown', type: 'number', label: 'Flatulence Cooldown', desc: 'Thời gian giữa 2 lần xả cloud Flatulence.' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_damage', type: 'number', label: 'Flatulence Damage', desc: 'Damage mỗi tick cloud Flatulence.' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_duration', type: 'number', label: 'Flatulence Duration', desc: 'Thời gian tồn tại của cloud Flatulence.' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_period', type: 'number', label: 'Flatulence Period', desc: 'Khoảng tick damage của cloud Flatulence.' },
  { cvar: 'l4d2_elite_boomer_nauseating_flatulence_radius', type: 'number', label: 'Flatulence Radius', desc: 'Bán kính cloud Flatulence.' }
];

const EliteSICoreGeneralConfig = [
  'l4d2_elite_si_core_enable',
  'l4d2_elite_reward_enable',
  'l4d2_elite_reward_si_enable',
  'l4d2_elite_reward_normal_si_enable',
  'l4d2_elite_reward_witch_enable',
  'l4d2_elite_reward_temp_hp_limit',
  'l4d2_elite_reward_normal_si_amount',
  'l4d2_elite_reward_headshot_bonus_enable',
  'l4d2_elite_reward_headshot_bonus_multiplier',
  'l4d2_elite_reward_scale_by_difficulty',
  'l4d2_elite_reward_diff_easy',
  'l4d2_elite_reward_diff_normal',
  'l4d2_elite_reward_diff_hard',
  'l4d2_elite_reward_diff_expert',
  'l4d2_elite_reward_witch_mode',
  'l4d2_elite_reward_witch_amount',
  'l4d2_elite_reward_show_hint',
  'l4d2_elite_reward_hint_color_normal_si',
  'l4d2_elite_reward_hint_color_elite_si',
  'l4d2_elite_si_core_spawn_chance',
  'l4d2_elite_si_core_spawn_cooldown',
  'l4d2_elite_si_core_hp_multiplier',
  'l4d2_elite_si_core_fire_ignite_chance',
  'l4d2_elite_si_hardsi_director_enable',
  'l4d2_elite_si_hardsi_director_assault_interval',
  'l4d2_elite_si_core_spawn_announce',
  'l4d2_redannounce_announce_elite_si_kill',
  'l4d2_elite_si_core_smoker_force_subtype',
  'l4d2_elite_si_core_boomer_force_subtype'
];

const EliteSITypeRewardMap = [
  { key: 'smoker', label: 'Smoker Reward', rewardCvar: 'l4d2_elite_reward_smoker' },
  { key: 'boomer', label: 'Boomer Reward', rewardCvar: 'l4d2_elite_reward_boomer' },
  { key: 'hunter', label: 'Hunter Reward', rewardCvar: 'l4d2_elite_reward_hunter' },
  { key: 'spitter', label: 'Spitter Reward', rewardCvar: 'l4d2_elite_reward_spitter' },
  { key: 'jockey', label: 'Jockey Reward', rewardCvar: 'l4d2_elite_reward_jockey' },
  { key: 'charger', label: 'Charger Reward', rewardCvar: 'l4d2_elite_reward_charger' },
  { key: 'tank', label: 'Tank Reward', rewardCvar: null }
];

const EliteSITypeSections = {
  smoker: [
    {
      id: 'smoker-hardsi',
      title: 'Smoker - Abnormal Behavior',
      cvars: ['l4d2_elite_si_hardsi_smoker_enable']
    },
    {
      id: 'smoker-common',
      title: 'Smoker Noxious - Common Settings',
      cvars: [
        'l4d2_elite_smoker_noxious_warning_hint_enable',
        'l4d2_elite_smoker_noxious_warning_hint_cooldown',
        'l4d2_elite_smoker_noxious_warning_hint_color',
        'l4d2_elite_smoker_noxious_smoke_screen_hint_enable'
      ]
    },
    {
      id: 'smoker-asphyxiation',
      title: 'Smoker Noxious - Asphyxiation',
      cvars: [
        'l4d2_elite_smoker_noxious_asphyxiation_enable',
        'l4d2_elite_smoker_noxious_asphyxiation_damage',
        'l4d2_elite_smoker_noxious_asphyxiation_frequency',
        'l4d2_elite_smoker_noxious_asphyxiation_range'
      ]
    },
    {
      id: 'smoker-collapsed-lung',
      title: 'Smoker Noxious - Collapsed Lung',
      cvars: [
        'l4d2_elite_smoker_noxious_collapsed_lung_enable',
        'l4d2_elite_smoker_noxious_collapsed_lung_chance',
        'l4d2_elite_smoker_noxious_collapsed_lung_damage',
        'l4d2_elite_smoker_noxious_collapsed_lung_duration'
      ]
    },
    {
      id: 'smoker-methane-blast',
      title: 'Smoker Noxious - Methane Blast',
      cvars: [
        'l4d2_elite_smoker_noxious_methane_blast_enable',
        'l4d2_elite_smoker_noxious_methane_blast_inner_damage',
        'l4d2_elite_smoker_noxious_methane_blast_outer_damage',
        'l4d2_elite_smoker_noxious_methane_blast_inner_range',
        'l4d2_elite_smoker_noxious_methane_blast_outer_range',
        'l4d2_elite_smoker_noxious_methane_blast_inner_push',
        'l4d2_elite_smoker_noxious_methane_blast_outer_push'
      ]
    },
    {
      id: 'smoker-methane-leak',
      title: 'Smoker Noxious - Methane Leak',
      cvars: [
        'l4d2_elite_smoker_noxious_methane_leak_enable',
        'l4d2_elite_smoker_noxious_methane_leak_cooldown',
        'l4d2_elite_smoker_noxious_methane_leak_damage',
        'l4d2_elite_smoker_noxious_methane_leak_duration',
        'l4d2_elite_smoker_noxious_methane_leak_period',
        'l4d2_elite_smoker_noxious_methane_leak_radius'
      ]
    },
    {
      id: 'smoker-methane-strike',
      title: 'Smoker Noxious - Methane Strike',
      cvars: ['l4d2_elite_smoker_noxious_methane_strike_enable']
    },
    {
      id: 'smoker-moon-walk',
      title: 'Smoker Noxious - Moon Walk',
      cvars: [
        'l4d2_elite_smoker_noxious_moon_walk_enable',
        'l4d2_elite_smoker_noxious_moon_walk_speed'
      ]
    },
    {
      id: 'smoker-restrained-hostage',
      title: 'Smoker Noxious - Restrained Hostage',
      cvars: [
        'l4d2_elite_smoker_noxious_restrained_hostage_enable',
        'l4d2_elite_smoker_noxious_restrained_hostage_scale',
        'l4d2_elite_smoker_noxious_restrained_hostage_damage'
      ]
    },
    {
      id: 'smoker-smoke-screen',
      title: 'Smoker Noxious - Smoke Screen',
      cvars: [
        'l4d2_elite_smoker_noxious_smoke_screen_enable',
        'l4d2_elite_smoker_noxious_smoke_screen_chance'
      ]
    },
    {
      id: 'smoker-tongue-strip',
      title: 'Smoker Noxious - Tongue Strip',
      cvars: [
        'l4d2_elite_smoker_noxious_tongue_strip_enable',
        'l4d2_elite_smoker_noxious_tongue_strip_chance'
      ]
    },
    {
      id: 'smoker-tongue-whip',
      title: 'Smoker Noxious - Tongue Whip',
      cvars: [
        'l4d2_elite_smoker_noxious_tongue_whip_enable',
        'l4d2_elite_smoker_noxious_tongue_whip_damage',
        'l4d2_elite_smoker_noxious_tongue_whip_range',
        'l4d2_elite_smoker_noxious_tongue_whip_push'
      ]
    },
    {
      id: 'smoker-void-pocket',
      title: 'Smoker Noxious - Void Pocket',
      cvars: [
        'l4d2_elite_smoker_noxious_void_pocket_enable',
        'l4d2_elite_smoker_noxious_void_pocket_cooldown',
        'l4d2_elite_smoker_noxious_void_pocket_chance',
        'l4d2_elite_smoker_noxious_void_pocket_range',
        'l4d2_elite_smoker_noxious_void_pocket_pull',
        'l4d2_elite_smoker_noxious_void_pocket_damage'
      ]
    }
  ],
  boomer: [
    {
      id: 'boomer-hardsi',
      title: 'Boomer - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_boomer_enable',
        'l4d2_elite_si_hardsi_boomer_bhop'
      ]
    },
    {
      id: 'boomer-nauseating-common',
      title: 'Boomer Nauseating - Common Settings',
      cvars: [
        'l4d2_elite_boomer_nauseating_think_interval'
      ]
    },
    {
      id: 'boomer-bile-belly',
      title: 'Boomer Nauseating - Bile Belly',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_belly_enable',
        'l4d2_elite_boomer_nauseating_bile_belly_damage_scale'
      ]
    },
    {
      id: 'boomer-bile-blast',
      title: 'Boomer Nauseating - Bile Blast',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_blast_enable',
        'l4d2_elite_boomer_nauseating_bile_blast_inner_push',
        'l4d2_elite_boomer_nauseating_bile_blast_outer_push',
        'l4d2_elite_boomer_nauseating_bile_blast_inner_damage',
        'l4d2_elite_boomer_nauseating_bile_blast_outer_damage',
        'l4d2_elite_boomer_nauseating_bile_blast_inner_range',
        'l4d2_elite_boomer_nauseating_bile_blast_outer_range'
      ]
    },
    {
      id: 'boomer-bile-feet',
      title: 'Boomer Nauseating - Bile Feet',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_feet_enable',
        'l4d2_elite_boomer_nauseating_bile_feet_speed',
        'l4d2_elite_boomer_nauseating_bile_feet_clear_vomit_fatigue'
      ]
    },
    {
      id: 'boomer-bile-mask',
      title: 'Boomer Nauseating - Bile Mask',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_mask_enable',
        'l4d2_elite_boomer_nauseating_bile_mask_mode',
        'l4d2_elite_boomer_nauseating_bile_mask_amount',
        'l4d2_elite_boomer_nauseating_bile_mask_duration'
      ]
    },
    {
      id: 'boomer-bile-pimple',
      title: 'Boomer Nauseating - Bile Pimple',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_pimple_enable',
        'l4d2_elite_boomer_nauseating_bile_pimple_chance',
        'l4d2_elite_boomer_nauseating_bile_pimple_damage',
        'l4d2_elite_boomer_nauseating_bile_pimple_range',
        'l4d2_elite_boomer_nauseating_bile_pimple_period'
      ]
    },
    {
      id: 'boomer-bile-shower',
      title: 'Boomer Nauseating - Bile Shower',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_shower_enable',
        'l4d2_elite_boomer_nauseating_bile_shower_cooldown'
      ]
    },
    {
      id: 'boomer-bile-swipe',
      title: 'Boomer Nauseating - Bile Swipe',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_swipe_enable',
        'l4d2_elite_boomer_nauseating_bile_swipe_chance',
        'l4d2_elite_boomer_nauseating_bile_swipe_damage',
        'l4d2_elite_boomer_nauseating_bile_swipe_duration'
      ]
    },
    {
      id: 'boomer-bile-throw',
      title: 'Boomer Nauseating - Bile Throw',
      cvars: [
        'l4d2_elite_boomer_nauseating_bile_throw_enable',
        'l4d2_elite_boomer_nauseating_bile_throw_cooldown',
        'l4d2_elite_boomer_nauseating_bile_throw_damage',
        'l4d2_elite_boomer_nauseating_bile_throw_range',
        'l4d2_elite_boomer_nauseating_bile_throw_vision_dot'
      ]
    },
    {
      id: 'boomer-explosive-diarrhea',
      title: 'Boomer Nauseating - Explosive Diarrhea',
      cvars: [
        'l4d2_elite_boomer_nauseating_explosive_diarrhea_enable',
        'l4d2_elite_boomer_nauseating_explosive_diarrhea_range',
        'l4d2_elite_boomer_nauseating_explosive_diarrhea_rear_dot'
      ]
    },
    {
      id: 'boomer-flatulence',
      title: 'Boomer Nauseating - Flatulence',
      cvars: [
        'l4d2_elite_boomer_nauseating_flatulence_enable',
        'l4d2_elite_boomer_nauseating_flatulence_bile_chance',
        'l4d2_elite_boomer_nauseating_flatulence_cooldown',
        'l4d2_elite_boomer_nauseating_flatulence_damage',
        'l4d2_elite_boomer_nauseating_flatulence_duration',
        'l4d2_elite_boomer_nauseating_flatulence_period',
        'l4d2_elite_boomer_nauseating_flatulence_radius'
      ]
    }
  ],
  hunter: [
    {
      id: 'hunter-hardsi',
      title: 'Hunter - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_hunter_enable',
        'l4d2_elite_si_hardsi_hunter_fast_pounce_distance',
        'l4d2_elite_si_hardsi_hunter_pounce_vertical_limit',
        'l4d2_elite_si_hardsi_hunter_aim_offset_sensitivity',
        'l4d2_elite_si_hardsi_hunter_straight_pounce_distance',
        'l4d2_elite_si_hardsi_hunter_leap_away_block_enable'
      ]
    }
  ],
  spitter: [
    {
      id: 'spitter-hardsi',
      title: 'Spitter - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_spitter_enable',
        'l4d2_elite_si_hardsi_spitter_bhop'
      ]
    },
    {
      id: 'spitter-subtype',
      title: 'Spitter Elite Subtype Roll',
      cvars: ['l4d2_elite_si_core_spitter_ability_subtype_chance']
    }
  ],
  jockey: [
    {
      id: 'jockey-hardsi',
      title: 'Jockey - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_jockey_enable',
        'l4d2_elite_si_hardsi_jockey_hop_distance'
      ]
    }
  ],
  charger: [
    {
      id: 'charger-hardsi',
      title: 'Charger - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_charger_enable',
        'l4d2_elite_si_hardsi_charger_bhop',
        'l4d2_elite_si_hardsi_charger_charge_distance',
        'l4d2_elite_si_hardsi_charger_health_threshold',
        'l4d2_elite_si_hardsi_charger_aim_offset_sensitivity'
      ]
    },
    {
      id: 'charger-subtype',
      title: 'Charger Elite Subtype Roll',
      cvars: [
        'l4d2_elite_si_core_charger_steering_subtype_chance',
        'l4d2_elite_si_core_charger_action_subtype_chance'
      ]
    }
  ],
  tank: [
    {
      id: 'tank-reward',
      title: 'Tank Reward',
      cvars: [
        'l4d2_elite_reward_tank_enable',
        'l4d2_elite_reward_tank_mode',
        'l4d2_elite_reward_tank_amount'
      ]
    },
    {
      id: 'tank-hardsi',
      title: 'Tank - Abnormal Behavior',
      cvars: [
        'l4d2_elite_si_hardsi_tank_enable',
        'l4d2_elite_si_hardsi_tank_bhop',
        'l4d2_elite_si_hardsi_tank_allow_rock',
        'l4d2_elite_si_hardsi_tank_smart_rock_enable',
        'l4d2_elite_si_hardsi_tank_smart_rock_range',
        'l4d2_elite_si_hardsi_tank_smart_rock_aim_offset'
      ]
    }
  ]
};

const getEliteConfigItem = (cvar) => EliteSIRewardConfig.find((item) => item.cvar === cvar);

const getCvarSourcePath = (cvar) => cvarFileMap[cvar] || '';

// Reusable "View as Cvar" panel component
const CvarViewPanel = ({ configList, values, onApply, addToast, label, getSourcePath }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const sourcePaths = [...new Set(configList.map((item) => getSourcePath(item.cvar)).filter(Boolean))];

  const generateText = () => {
    const lines = [];
    lines.push(`// ${label}`);

    sourcePaths.forEach((sourcePath, sourceIndex) => {
      if (sourcePaths.length > 1) {
        lines.push(`// File: ${sourcePath}`);
      }

      configList.filter((item) => getSourcePath(item.cvar) === sourcePath).forEach((item) => {
        const val = getNormalizedCvarValue(item.cvar, values[item.cvar]);
        if (item.desc) lines.push(`// ${item.desc}`);
        lines.push(`sm_cvar ${item.cvar} "${val}"`);
      });

      if (sourceIndex !== sourcePaths.length - 1) {
        lines.push('');
      }
    });

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = editing ? draft : generateText();
    navigator.clipboard.writeText(text).then(() => {
      addToast(`Copied ${label} cvars to clipboard`, 'success');
    }).catch(() => {
      addToast('Copy failed', 'error');
    });
  };

  const handleEdit = () => {
    setDraft(generateText());
    setEditing(true);
  };

  const handleApply = () => {
    const newValues = {};
    draft.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;
      const smCvarMatch = trimmed.match(/^sm_cvar\s+([^\s]+)\s+"(.*)"$/i);
      if (smCvarMatch) {
        newValues[smCvarMatch[1]] = smCvarMatch[2];
        return;
      }

      const directMatch = trimmed.match(/^([^\s]+)\s+"(.*)"$/);
      if (directMatch) newValues[directMatch[1]] = directMatch[2];
    });
    onApply(newValues);
    setEditing(false);
    addToast('Cvar values updated from text — click Save to apply to server', 'success');
  };

  return (
    <div className="tut-cvar-panel">
      <div className="tut-cvar-toolbar">
        <span>{label} — raw cvar format{sourcePaths.length > 0 ? ` — ${sourcePaths.join(', ')}` : ''}</span>
        {!editing ? (
          <>
            <button className="tut-btn tut-btn-refresh" onClick={handleCopy}>Copy</button>
            <button className="tut-btn tut-btn-refresh" onClick={handleEdit}>Edit</button>
          </>
        ) : (
          <>
            <button className="tut-btn tut-btn-save" onClick={handleApply}>Apply</button>
            <button className="tut-btn tut-btn-refresh" onClick={handleCopy}>Copy</button>
            <button className="tut-btn tut-btn-refresh" onClick={() => setEditing(false)}>Cancel</button>
          </>
        )}
      </div>
      {editing ? (
        <textarea
          className="tut-cvar-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <pre className="tut-cvar-pre">{generateText()}</pre>
      )}
    </div>
  );
};

const TabMainConfigurations = ({ addToast }) => {
  const [activeSubTab, setActiveSubTab] = useState('multislots');
  const [values, setValues] = useState({});
  const [serverValues, setServerValues] = useState({});
  const [loadingState, setLoadingState] = useState({
    active: false,
    title: 'Đang tải dữ liệu...',
    description: 'Vui lòng đợi trong giây lát.'
  });
  const loadingCountRef = useRef(0);
  const [reviewDialog, setReviewDialog] = useState({ open: false, sectionLabel: '', changes: [], payload: {} });

  // Cvar view panel open state per sub-tab
  const [cvarViewOpen, setCvarViewOpen] = useState({});
  const toggleCvarView = (key) => setCvarViewOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const applyCvarText = (newValues) => setValues((prev) => ({ ...prev, ...newValues }));
  const [eliteTypeFilter, setEliteTypeFilter] = useState('smoker');
  const eliteRewardSaveConfig = EliteSIRewardConfig;

  // InfectedBots Data states
  const [dataFiles, setDataFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('coop.cfg');
  const [selectedBlock, setSelectedBlock] = useState('default');
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [dataValues, setDataValues] = useState({});
  const [serverDataValues, setServerDataValues] = useState({});
  const [dataReloadOnSave, setDataReloadOnSave] = useState(true);
  const [dataReviewDialog, setDataReviewDialog] = useState({ open: false, changes: [], payload: null });

  const beginLoading = (title, description) => {
    loadingCountRef.current += 1;
    setLoadingState({ active: true, title, description });
  };

  const endLoading = () => {
    loadingCountRef.current = Math.max(loadingCountRef.current - 1, 0);
    if (loadingCountRef.current === 0) {
      setLoadingState((prev) => ({ ...prev, active: false }));
    }
  };

  const withLoading = async (context, action) => {
    beginLoading(context.title, context.description);
    try {
      return await action();
    } finally {
      endLoading();
    }
  };

  useEffect(() => {
    fetchCvars();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'infectedbots') {
      fetchDataFiles();
      fetchDataBlocks(selectedFile);
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'infectedbots' && selectedFile) {
      fetchDataBlocks(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (activeSubTab === 'infectedbots' && selectedFile && selectedBlock) {
      fetchDataBlockValues(selectedFile, selectedBlock);
    }
  }, [activeSubTab, selectedFile, selectedBlock]);

  const fetchCvars = async () => {
    return withLoading(
      {
        title: 'Đang tải CVAR...',
        description: 'Đang đồng bộ giá trị mới nhất từ máy chủ.'
      },
      async () => {
        try {
          const res = await fetch('/api/cvars');
          const data = await res.json();
          const currentValues = {};
          if (data.cvars) {
            data.cvars.forEach(g => {
               g.cvars.forEach(item => {
                 currentValues[item.name] = getNormalizedCvarValue(item.name, item.value);
               });
            });
          }
          setValues(prev => ({ ...prev, ...currentValues }));
          setServerValues(prev => ({ ...prev, ...currentValues }));
        } catch { }
      }
    );
  };

  const fetchDataFiles = async () => {
    try {
      const res = await fetch('/api/data/files?plugin=l4dinfectedbots');
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setDataFiles(data.files);
        if (!data.files.includes(selectedFile)) {
          setSelectedFile(data.files[0]);
        }
      } else {
        setDataFiles([]);
        setAvailableBlocks([]);
        setDataValues({});
        setServerDataValues({});
      }
    } catch {}
  };

  const fetchDataBlocks = async (file) => {
    return withLoading(
      {
        title: 'Đang tải danh sách block...',
        description: 'Đang đọc các mốc người chơi trong file dữ liệu.'
      },
      async () => {
        try {
          const res = await fetch(`/api/data/blocks?plugin=l4dinfectedbots&file=${encodeURIComponent(file)}`);
          const data = await res.json();
          const blocks = Array.isArray(data.blocks) ? data.blocks : [];
          setAvailableBlocks(blocks);

          if (blocks.length === 0) {
            setSelectedBlock('default');
            setDataValues({});
            setServerDataValues({});
          } else if (!blocks.includes(selectedBlock)) {
            setSelectedBlock(blocks[0]);
          }
        } catch {}
      }
    );
  };

  const fetchDataBlockValues = async (file, block) => {
    return withLoading(
      {
        title: 'Đang tải block dữ liệu...',
        description: `Đang đọc cấu hình cho block "${block}".`
      },
      async () => {
        try {
          const res = await fetch(`/api/data/block-values?plugin=l4dinfectedbots&file=${encodeURIComponent(file)}&block=${encodeURIComponent(block)}`);
          const data = await res.json();
          if (res.ok && data.values && typeof data.values === 'object') {
            setDataValues(data.values);
            setServerDataValues(data.values);
          } else {
            setDataValues({});
            setServerDataValues({});
          }
        } catch {
          setDataValues({});
          setServerDataValues({});
        }
      }
    );
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

  const openReviewDialog = (configList, sectionLabel) => {
    const payload = {};
    const changes = [];

    configList.forEach(item => {
      const cvar = item.cvar;
      const nextValue = getNormalizedCvarValue(cvar, values[cvar]);
      const prevValue = getNormalizedCvarValue(cvar, serverValues[cvar]);
      payload[cvar] = nextValue;

      if (nextValue !== prevValue) {
        changes.push({
          cvar,
          sourcePath: getCvarSourcePath(cvar),
          oldValue: prevValue,
          newValue: nextValue
        });
      }
    });

    if (changes.length === 0) {
      addToast('Không có thay đổi để lưu.', 'info');
      return;
    }

    setReviewDialog({ open: true, sectionLabel, changes, payload });
  };

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, sectionLabel: '', changes: [], payload: {} });
  };

  const confirmSaveCvarConfig = async () => {
    return withLoading(
      {
        title: 'Đang lưu CVAR...',
        description: 'Đang ghi thay đổi vào file cấu hình máy chủ.'
      },
      async () => {
        try {
          const res = await fetch('/api/cvars/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cvars: reviewDialog.payload }) });
          if (res.ok) {
            setServerValues(prev => ({ ...prev, ...reviewDialog.payload }));
            addToast(`Đã lưu ${reviewDialog.changes.length} thay đổi CVAR.`, 'success');
            closeReviewDialog();
          } else {
            addToast('Lỗi khi lưu CVARs.', 'error');
          }
          await fetchCvars();
        } catch { addToast('Lỗi khi lưu CVARs.', 'error'); }
      }
    );
  };

  const openDataReviewDialog = () => {
    const changes = [];
    const payload = {};

    InfectedBotsDataConfig.forEach((item) => {
      const key = item.key;
      const newValue = dataValues[key] !== undefined ? String(dataValues[key]) : '';
      const oldValue = serverDataValues[key] !== undefined ? String(serverDataValues[key]) : '';
      if (newValue === oldValue) return;

      changes.push({ key, oldValue, newValue });
      payload[key] = newValue;
    });

    if (changes.length === 0) {
       addToast('Không có thay đổi Data để lưu.', 'info');
      return;
    }

    setDataReviewDialog({
      open: true,
      changes,
      payload: {
        plugin: 'l4dinfectedbots',
        file: selectedFile,
        block: selectedBlock,
        changes: payload,
        reload: dataReloadOnSave
      }
    });
  };

  const closeDataReviewDialog = () => {
    setDataReviewDialog({ open: false, changes: [], payload: null });
  };

  const confirmSaveDataConfig = async () => {
    if (!dataReviewDialog.payload) return;
    return withLoading(
      {
        title: 'Đang lưu dữ liệu block...',
        description: `Đang patch block "${selectedBlock}" vào file ${selectedFile}.`
      },
      async () => {
        try {
          const res = await fetch('/api/data/patch-block', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataReviewDialog.payload)
          });
          const data = await res.json();
          if (res.ok) {
            if (data.changed) {
              setServerDataValues((prev) => ({ ...prev, ...dataReviewDialog.payload.changes }));
              const reloadText = data.reloaded ? 'Plugin đã được load/reload.' : 'Không reload plugin.';
              const pathInfo = data.pluginPathUsed ? ` (đã dùng đường dẫn ${data.pluginPathUsed})` : '';
              addToast(`Đã lưu ${data.changedKeys?.length || 0} key Data (${selectedBlock}). ${reloadText}${pathInfo}`, 'success');
            } else {
              addToast(data.message || 'Không có thay đổi nào được áp dụng.', 'info');
            }
            closeDataReviewDialog();
            await fetchDataBlockValues(selectedFile, selectedBlock);
          } else {
             const pathInfo = data.pluginPathTried ? ` (đã thử ${data.pluginPathTried})` : '';
             addToast((data.error || 'Lỗi khi lưu Data config.') + pathInfo, 'error');
          }
        } catch {
          addToast('Lỗi khi ghi Data', 'error');
        }
      }
    );
  };

  const renderCvarField = (item) => {
    const val = getNormalizedCvarValue(item.cvar, values[item.cvar]);
    const sourcePath = getCvarSourcePath(item.cvar);
    return (
      <MainConfigCvarField
        key={item.cvar}
        item={item}
        value={val}
        sourcePath={sourcePath}
        onUpdate={handleUpdate}
        onMultiCheckbox={handleMultiCheckbox}
        isMultiCheckboxChecked={isMultiCheckboxChecked}
      />
    );
  };

  const renderDataField = (item) => {
    const val = dataValues[item.key] !== undefined ? dataValues[item.key] : '';
    return (
      <MainConfigDataField key={item.key} item={item} value={val} onUpdate={handleDataUpdate} />
    );
  };

  return (
    <div className="tut-wrapper">
      <style>{styles}</style>
      <div className="tut-container">
        
        <div className="tut-header" style={{ marginBottom: 0 }}>
          <h2>Main Configurations</h2>
          <p>Trung tam chinh sua CVAR va Data block cho cac plugin quan trong.</p>
        </div>

        <div className="tut-tabs-nav">
          {MAIN_CONFIGURATION_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tut-tab-btn ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tut-content-area">
          <MainConfigLoadingOverlay
            active={loadingState.active}
            title={loadingState.title}
            description={loadingState.description}
          />

        {activeSubTab === 'multislots' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>MultiSlots Configuration</h2>
               <p>Quản lý số lượng Survivors (bao gồm bot) tham gia bản đồ.</p>
            </div>
            <div className="tut-form-grid">
               {MultiSlotsConfig.map(renderCvarField)}
            </div>
            <div className="tut-actions">
               <button className={`tut-btn-cvar-view${cvarViewOpen.multislots ? ' active' : ''}`} onClick={() => toggleCvarView('multislots')}>
                 {cvarViewOpen.multislots ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load CVARs</button>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(MultiSlotsConfig, 'MultiSlots')}>Save (CVARs)</button>
            </div>
            {cvarViewOpen.multislots && (
               <CvarViewPanel configList={MultiSlotsConfig} values={values} onApply={applyCvarText} addToast={addToast} label="MultiSlots" getSourcePath={getCvarSourcePath} />
            )}
          </div>
        )}

        {activeSubTab === 'infectedbots' && (
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
                 <button className={`tut-btn-cvar-view${cvarViewOpen.infectedbots ? ' active' : ''}`} onClick={() => toggleCvarView('infectedbots')}>
                   {cvarViewOpen.infectedbots ? 'Close Cvar View' : 'View as Cvar'}
                 </button>
                 <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(InfectedBotsCvarsConfig, 'InfectedBots CVARs')}>Save (CVARs)</button>
              </div>
              {cvarViewOpen.infectedbots && (
                 <CvarViewPanel configList={InfectedBotsCvarsConfig} values={values} onApply={applyCvarText} addToast={addToast} label="InfectedBots CVARs" getSourcePath={getCvarSourcePath} />
              )}
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
                      {availableBlocks.map((block) => (
                        <option key={block} value={block}>
                           {block === 'default' ? 'Default (Mặc định)' : `${block} Người chơi`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="tut-checkbox" style={{ marginLeft: 'auto' }}>
                    <input type="checkbox" checked={dataReloadOnSave} onChange={(e) => setDataReloadOnSave(e.target.checked)} />
                     Reload plugin sau khi lưu
                 </label>
              </div>

              {!loadingState.active && availableBlocks.length === 0 && <p style={{ color: 'var(--muted)' }}>Không tìm thấy block nào trong file data.</p>}
              
              {availableBlocks.length > 0 && (
                <>
                  <div className="tut-section-title">Chỉnh sửa cho "{selectedBlock}"</div>
                  <div className="tut-form-grid">
                     {InfectedBotsDataConfig.map(renderDataField)}
                  </div>
                  <div className="tut-actions">
                     <button className="tut-btn tut-btn-refresh" onClick={() => fetchDataBlockValues(selectedFile, selectedBlock)}>Nạp lại block</button>
                     <button className="tut-btn tut-btn-save" onClick={openDataReviewDialog}>Lưu dữ liệu (review)</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {activeSubTab === 'gundamage' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>Gun Damage Modify</h2>
               <p>Điều chỉnh hệ số sát thương cho từng loại súng lên từng mục tiêu cụ thể. Giá trị 1.0 (nhân 1) là giữ nguyên.</p>
            </div>

            <div className="tut-actions" style={{ marginBottom: 16, marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
               <button className={`tut-btn-cvar-view${cvarViewOpen.gundamage ? ' active' : ''}`} onClick={() => toggleCvarView('gundamage')}>
                 {cvarViewOpen.gundamage ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load Data</button>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(GunDamageConfig, 'Gun Damage')}>Save All</button>
            </div>

            {cvarViewOpen.gundamage && (
               <CvarViewPanel configList={GunDamageConfig} values={values} onApply={applyCvarText} addToast={addToast} label="Gun Damage" getSourcePath={getCvarSourcePath} />
            )}

            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {renderCvarField(GunDamageConfig[0])}
            </div>

            {WEAPONS.map(w => (
              <div key={w.id} style={{ marginTop: 24 }}>
                <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Súng: <span style={{ color: 'var(--accent)' }}>{w.name}</span></div>
                <div className="tut-form-grid">
                  {TARGETS.map(t => {
                     const item = GunDamageConfig.find(c => c.cvar === `l4d_${w.id}_damage_${t.id}`);
                     return renderCvarField(item);
                  })}
                </div>
              </div>
            ))}

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(GunDamageConfig, 'Gun Damage')}>Save (Write to CFG)</button>
            </div>
          </div>
        )}

        {activeSubTab === 'incappedWeapons' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>Incapped Weapons</h2>
               <p>Cấu hình dùng vũ khí khi ngã gục, self-revive bằng pills/adrenaline và các giới hạn đi kèm.</p>
            </div>

            <div className="tut-actions" style={{ marginBottom: 16, marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
               <button className={`tut-btn-cvar-view${cvarViewOpen.incappedWeapons ? ' active' : ''}`} onClick={() => toggleCvarView('incappedWeapons')}>
                 {cvarViewOpen.incappedWeapons ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load Cvars</button>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(IncappedWeaponsConfig, 'Incapped Weapons')}>Save All</button>
            </div>

            {cvarViewOpen.incappedWeapons && (
               <CvarViewPanel configList={IncappedWeaponsConfig} values={values} onApply={applyCvarText} addToast={addToast} label="Incapped Weapons" getSourcePath={getCvarSourcePath} />
            )}

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>General</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
              {IncappedWeaponsConfig.slice(0, 4).map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Self Revive & Healing</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
              {IncappedWeaponsConfig.slice(4, 13).map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Weapon Rules & Animation</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
              {IncappedWeaponsConfig.slice(13).map(renderCvarField)}
            </div>

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(IncappedWeaponsConfig, 'Incapped Weapons')}>Save All (Incapped Weapons)</button>
            </div>
          </div>
        )}

        {activeSubTab === 'eliteReward' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>Elite SI Reward + Noxious/Nauseating</h2>
               <p>Điều chỉnh reward Elite SI, cooldown spawn elite, roll subtype và cấu hình kỹ năng theo từng loại Elite SI.</p>
            </div>

            <div className="tut-actions" style={{ marginBottom: 16, marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
               <button className={`tut-btn-cvar-view${cvarViewOpen.eliteReward ? ' active' : ''}`} onClick={() => toggleCvarView('eliteReward')}>
                 {cvarViewOpen.eliteReward ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load Cvars</button>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(eliteRewardSaveConfig, 'Elite SI Reward')}>Save All</button>
            </div>

            {cvarViewOpen.eliteReward && (
               <CvarViewPanel configList={eliteRewardSaveConfig} values={values} onApply={applyCvarText} addToast={addToast} label="Elite SI Reward" getSourcePath={getCvarSourcePath} />
            )}

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>General Elite Reward & Core</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {EliteSICoreGeneralConfig.map((cvar) => renderCvarField(getEliteConfigItem(cvar)))}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Elite Type Filter</div>
            <div className="tut-toolbar" style={{ marginBottom: 24 }}>
              <div>
                <span className="tut-toolbar-label">SI Type:</span>
                <select className="tut-input" value={eliteTypeFilter} onChange={(e) => setEliteTypeFilter(e.target.value)} style={{ width: 'auto', display: 'inline-block' }}>
                  {EliteSITypeRewardMap.map((entry) => (
                    <option key={entry.key} value={entry.key}>{entry.label.replace(' Reward', '')}</option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const rewardEntry = EliteSITypeRewardMap.find((entry) => entry.key === eliteTypeFilter);
              const rewardItem = rewardEntry && rewardEntry.rewardCvar ? getEliteConfigItem(rewardEntry.rewardCvar) : null;
              const sections = EliteSITypeSections[eliteTypeFilter] || [];

              return (
                <>
                  {rewardItem && (
                    <>
                      <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{rewardEntry.label}</div>
                      <div className="tut-form-grid" style={{ marginBottom: 24 }}>
                        {renderCvarField(rewardItem)}
                      </div>
                    </>
                  )}

                  {sections.length === 0 && (
                    <p style={{ marginTop: 0, marginBottom: 24, color: 'rgba(255,255,255,0.72)' }}>
                      SI này hiện không có section ability riêng trong hệ elite mới. Chỉ dùng reward theo type + các cấu hình chung ở trên.
                    </p>
                  )}

                  {sections.map((section) => (
                    <div key={section.id}>
                      <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{section.title}</div>
                      <div className="tut-form-grid" style={{ marginBottom: 24 }}>
                        {section.cvars.map((cvar) => renderCvarField(getEliteConfigItem(cvar)))}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog(eliteRewardSaveConfig, 'Elite SI Reward')}>Save All (Elite SI Reward)</button>
            </div>
          </div>
        )}

        {activeSubTab === 'notifier' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>Tuan's Event Notifier</h2>
               <p>Hệ thống thông báo cho Death/Incap, Black & White, Ném lựu đạn và Bắn nổ thùng.</p>
            </div>

            <div className="tut-actions" style={{ marginBottom: 16, marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
               <button className={`tut-btn-cvar-view${cvarViewOpen.notifier ? ' active' : ''}`} onClick={() => toggleCvarView('notifier')}>
                 {cvarViewOpen.notifier ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load Cvars</button>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog([...NotifierCoreDisplayConfig, ...RedAnnounceConfig, ...NotifierEventConfig], 'Notifier')}>Save All</button>
            </div>

            {cvarViewOpen.notifier && (
               <CvarViewPanel configList={[...NotifierCoreDisplayConfig, ...RedAnnounceConfig, ...NotifierEventConfig]} values={values} onApply={applyCvarText} addToast={addToast} label="Notifier" getSourcePath={getCvarSourcePath} />
              )}

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Display</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierCoreDisplayConfig.map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Death & Incap</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {RedAnnounceConfig.map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Events (BW / Throwable / Explosion / Gear)</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierEventConfig.map(renderCvarField)}
            </div>

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => openReviewDialog([...NotifierCoreDisplayConfig, ...RedAnnounceConfig, ...NotifierEventConfig], 'Notifier')}>Save All (Notifier)</button>
            </div>
          </div>
        )}
        </div>

      </div>
      <MainConfigCvarReviewDialog reviewDialog={reviewDialog} onClose={closeReviewDialog} onConfirm={confirmSaveCvarConfig} />
      <MainConfigDataReviewDialog
        dataReviewDialog={dataReviewDialog}
        selectedFile={selectedFile}
        selectedBlock={selectedBlock}
        onClose={closeDataReviewDialog}
        onConfirm={confirmSaveDataConfig}
      />
    </div>
  );
};

export default TabMainConfigurations;
