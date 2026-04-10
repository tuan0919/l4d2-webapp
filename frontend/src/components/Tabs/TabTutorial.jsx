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

  .tut-cvar-panel { border-top: 1px solid var(--border); background: #090b10; overflow: hidden; border-radius: 0 0 12px 12px; margin-top: -1px; }
  .tut-cvar-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(91,200,245,0.05); border-bottom: 1px solid rgba(91,200,245,0.12); }
  .tut-cvar-toolbar span { font-size: 11px; color: var(--muted); flex: 1; font-family: 'JetBrains Mono', monospace; }
  .tut-cvar-toolbar .tut-btn { padding: 4px 10px; font-size: 11px; margin: 0; width: auto; }
  .tut-cvar-pre { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; color: #a8c0e0; padding: 14px 16px; margin: 0; overflow: auto; max-height: 50vh; white-space: pre; }
  .tut-cvar-textarea { width: 100%; min-height: 300px; max-height: 50vh; background: #090b10; color: #a8c0e0; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; padding: 14px 16px; border: none; outline: none; resize: vertical; display: block; }
  .tut-btn-cvar-view { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid rgba(91,200,245,0.3); background: rgba(91,200,245,0.08); color: var(--blue); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .tut-btn-cvar-view:hover { background: rgba(91,200,245,0.15); border-color: rgba(91,200,245,0.5); }
  .tut-btn-cvar-view.active { background: rgba(91,200,245,0.2); border-color: var(--blue); }
`;

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

const NotifierDIConfig = [
  { cvar: 'tuan_notifier_di_enable', type: 'toggle', label: 'Bật DI Notifier', desc: 'Bật/tắt thông báo Death/Incap.' },
  { cvar: 'l4d2_redannounce_announce_elite_si_kill', type: 'toggle', label: 'Elite SI Tag', desc: 'Hiện chữ Elite trong thông báo kill SI (chat đỏ).' },
  { cvar: 'tuan_notifier_di_notify_incap_other', type: 'toggle', label: 'Incap Other', desc: 'Thông báo khi bị ai đó bắn gục.' },
  { cvar: 'tuan_notifier_di_notify_kill_other', type: 'toggle', label: 'Kill Other', desc: 'Thông báo khi giết ai đó.' },
  { cvar: 'tuan_notifier_di_notify_killed_by_unknown', type: 'toggle', label: 'Killed By Unknown', desc: 'Thông báo khi chết do môi trường.' },
  { cvar: 'tuan_notifier_di_notify_incapped_by_unknown', type: 'toggle', label: 'Incapped By Unknown', desc: 'Thông báo khi gục do môi trường.' }
];

const NotifierBWConfig = [
  { cvar: 'tuan_notifier_bw_enable', type: 'toggle', label: 'Bật B&W Notifier', desc: 'Bật/tắt thông báo trắng đen.' },
  { cvar: 'tuan_notifier_bw_notify_healed_other', type: 'toggle', label: 'Heal Other', desc: 'Thông báo khi cứu thương người B&W.' },
  { cvar: 'tuan_notifier_bw_notify_go_bnw', type: 'toggle', label: 'Go B&W', desc: 'Thông báo khi một người rơi vào B&W.' },
  { cvar: 'tuan_notifier_bw_notify_revived_other', type: 'toggle', label: 'Revive Other', desc: 'Thông báo khi gọi người khác dậy.' }
];

const NotifierThrowableConfig = [
  { cvar: 'l4d_throwable_announcer_enable', type: 'toggle', label: 'Bật Throwable', desc: 'Bật/tắt thông báo ném lựu đạn.' },
  { cvar: 'l4d_throwable_announcer_team', type: 'number', label: 'Team', desc: '1=Surv, 2=Inf, 4=Spec. (Ví dụ 3 là Surv+Inf)' },
  { cvar: 'l4d_throwable_announcer_self', type: 'toggle', label: 'Self Notify', desc: 'Thông báo cho bản thân.' },
  { cvar: 'l4d_throwable_announcer_fake_throw', type: 'number', label: 'Fake Throw Delay', desc: 'Delay để bỏ qua fake throw (s).' },
  { cvar: 'l4d_throwable_announcer_molotov', type: 'toggle', label: 'Molotov', desc: 'Thông báo ném Molotov.' },
  { cvar: 'l4d_throwable_announcer_pipebomb', type: 'toggle', label: 'Pipebomb', desc: 'Thông báo ném Pipebomb.' },
  { cvar: 'l4d_throwable_announcer_vomitjar', type: 'toggle', label: 'Vomitjar', desc: 'Thông báo ném Bile/Boomer Vomit.' }
];

const NotifierExplosionConfig = [
  { cvar: 'l4d_explosion_announcer_enable', type: 'toggle', label: 'Bật Explosion', desc: 'Bật/tắt thông báo bắn nổ.' },
  { cvar: 'l4d_explosion_announcer_team', type: 'number', label: 'Team', desc: '1=Surv, 2=Inf, 4=Spec.' },
  { cvar: 'l4d_explosion_announcer_spam_protection', type: 'number', label: 'Spam Protection (s)', desc: 'Thời gian delay chống spam chat.' },
  { cvar: 'l4d_explosion_announcer_self', type: 'toggle', label: 'Self Notify', desc: 'Thông báo cho bản thân.' },
  { cvar: 'l4d_explosion_announcer_gascan', type: 'toggle', label: 'Gascan', desc: 'Thông báo nổ bình xăng.' },
  { cvar: 'l4d_explosion_announcer_propanecanister', type: 'toggle', label: 'Propane', desc: 'Thông báo nổ bình gas.' },
  { cvar: 'l4d_explosion_announcer_oxygentank', type: 'toggle', label: 'Oxygen', desc: 'Thông báo nổ bình oxy.' },
  { cvar: 'l4d_explosion_announcer_fireworkscrate', type: 'toggle', label: 'Fireworks', desc: 'Thông báo nổ pháo hoa.' },
  { cvar: 'l4d_explosion_announcer_fuelbarrel', type: 'toggle', label: 'Fuel Barrel', desc: 'Thông báo nổ thùng dầu lớn.' }
];

const EliteSIRewardConfig = [
  { cvar: 'l4d_hp_rewards_si', type: 'toggle', label: 'Bật thưởng Elite SI', desc: 'Bật/tắt thưởng khi hạ Elite Special Infected.' },
  { cvar: 'l4d_hp_rewards_tank', type: 'toggle', label: 'Bật thưởng Tank', desc: 'Bật/tắt thưởng khi hạ Tank.' },
  { cvar: 'l4d_hp_rewards_witch', type: 'toggle', label: 'Bật thưởng Witch', desc: 'Bật/tắt thưởng khi hạ Witch.' },
  { cvar: 'l4d_hp_rewards_max', type: 'number', label: 'Giới hạn HP tối đa', desc: 'Ngưỡng HP thật + HP tạm sau khi cộng thưởng.' },

  { cvar: 'l4d_hp_rewards_smoker', type: 'number', label: 'Smoker Reward', desc: 'HP thưởng khi hạ Elite Smoker.' },
  { cvar: 'l4d_hp_rewards_boomer', type: 'number', label: 'Boomer Reward', desc: 'HP thưởng khi hạ Elite Boomer.' },
  { cvar: 'l4d_hp_rewards_hunter', type: 'number', label: 'Hunter Reward', desc: 'HP thưởng khi hạ Elite Hunter.' },
  { cvar: 'l4d_hp_rewards_spitter', type: 'number', label: 'Spitter Reward', desc: 'HP thưởng khi hạ Elite Spitter.' },
  { cvar: 'l4d_hp_rewards_jockey', type: 'number', label: 'Jockey Reward', desc: 'HP thưởng khi hạ Elite Jockey.' },
  { cvar: 'l4d_hp_rewards_charger', type: 'number', label: 'Charger Reward', desc: 'HP thưởng khi hạ Elite Charger.' },

  { cvar: 'l4d_hp_rewards_headshot_bonus', type: 'toggle', label: 'Headshot Bonus', desc: 'Nhân thưởng nếu kết liễu bằng headshot.' },
  { cvar: 'l4d_hp_rewards_headshot_mult', type: 'number', label: 'Headshot Multiplier', desc: 'Hệ số nhân thưởng khi headshot (ví dụ 2.0).' },

  { cvar: 'l4d_hp_rewards_scale_difficulty', type: 'toggle', label: 'Scale theo độ khó', desc: 'Bật nhân thưởng theo z_difficulty hiện tại.' },
  { cvar: 'l4d_hp_rewards_diff_easy', type: 'number', label: 'Easy Multiplier', desc: 'Hệ số thưởng khi độ khó easy.' },
  { cvar: 'l4d_hp_rewards_diff_normal', type: 'number', label: 'Normal Multiplier', desc: 'Hệ số thưởng khi độ khó normal.' },
  { cvar: 'l4d_hp_rewards_diff_hard', type: 'number', label: 'Hard/Advanced Multiplier', desc: 'Hệ số thưởng khi độ khó hard/advanced.' },
  { cvar: 'l4d_hp_rewards_diff_expert', type: 'number', label: 'Expert Multiplier', desc: 'Hệ số thưởng khi độ khó impossible/expert.' },

  { cvar: 'l4d_hp_rewards_tank_mode', type: 'radio', label: 'Tank Reward Mode', desc: 'Cách phát thưởng khi hạ Tank.', options: [{ v: '0', n: 'Chỉ attacker' }, { v: '1', n: 'Toàn team sống' }] },
  { cvar: 'l4d_hp_rewards_tank_amount', type: 'number', label: 'Tank Reward Amount', desc: 'Lượng thưởng cơ bản khi hạ Tank.' },
  { cvar: 'l4d_hp_rewards_witch_mode', type: 'radio', label: 'Witch Reward Mode', desc: 'Cách phát thưởng khi hạ Witch.', options: [{ v: '0', n: 'Chỉ attacker' }, { v: '1', n: 'Toàn team sống' }] },
  { cvar: 'l4d_hp_rewards_witch_amount', type: 'number', label: 'Witch Reward Amount', desc: 'Lượng thưởng cơ bản khi hạ Witch.' },

  { cvar: 'l4d_hp_rewards_elite_chance', type: 'number', label: 'Elite Spawn Chance (%)', desc: 'Tỷ lệ SI thường trở thành Elite.' },
  { cvar: 'l4d_hp_rewards_elite_hp_mult', type: 'number', label: 'Elite HP Multiplier', desc: 'Hệ số buff máu cho Elite SI.' },
  { cvar: 'l4d_hp_rewards_elite_fire', type: 'number', label: 'Elite Self-Ignite Chance (%)', desc: 'Tỷ lệ Elite tự bốc cháy. Chỉ loại này mới kháng lửa.' }
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

// Reusable "View as Cvar" panel component
const CvarViewPanel = ({ configList, values, onApply, addToast, label }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const generateText = () => {
    const lines = [];
    lines.push(`// ${label}`);
    configList.forEach((item) => {
      const val = values[item.cvar] !== undefined ? String(values[item.cvar]) : '';
      if (item.desc) lines.push(`// ${item.desc}`);
      lines.push(`sm_cvar ${item.cvar} "${val}"`);
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
        <span>{label} — raw cvar format</span>
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

const TabTutorial = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('multislots');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Cvar view panel open state per sub-tab
  const [cvarViewOpen, setCvarViewOpen] = useState({});
  const toggleCvarView = (key) => setCvarViewOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const applyCvarText = (newValues) => setValues((prev) => ({ ...prev, ...newValues }));

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
        addToast(`Lưu Data Config (${selectedBlock}) thành công! Plugin đã được reload.`, 'success');
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
          <button className={`tut-tab-btn ${activeTab === 'gundamage' ? 'active' : ''}`} onClick={() => setActiveTab('gundamage')}>Gun Damage</button>
          <button className={`tut-tab-btn ${activeTab === 'eliteReward' ? 'active' : ''}`} onClick={() => setActiveTab('eliteReward')}>Elite SI Reward</button>
          <button className={`tut-tab-btn ${activeTab === 'notifier' ? 'active' : ''}`} onClick={() => setActiveTab('notifier')}>Notifier (Chat)</button>
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
               <button className={`tut-btn-cvar-view${cvarViewOpen.multislots ? ' active' : ''}`} onClick={() => toggleCvarView('multislots')}>
                 {cvarViewOpen.multislots ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load CVARs</button>
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(MultiSlotsConfig)}>Save (CVARs)</button>
            </div>
            {cvarViewOpen.multislots && (
              <CvarViewPanel configList={MultiSlotsConfig} values={values} onApply={applyCvarText} addToast={addToast} label="MultiSlots" />
            )}
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
                 <button className={`tut-btn-cvar-view${cvarViewOpen.infectedbots ? ' active' : ''}`} onClick={() => toggleCvarView('infectedbots')}>
                   {cvarViewOpen.infectedbots ? 'Close Cvar View' : 'View as Cvar'}
                 </button>
                 <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(InfectedBotsCvarsConfig)}>Save (CVARs)</button>
              </div>
              {cvarViewOpen.infectedbots && (
                <CvarViewPanel configList={InfectedBotsCvarsConfig} values={values} onApply={applyCvarText} addToast={addToast} label="InfectedBots CVARs" />
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

        {activeTab === 'gundamage' && (
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
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(GunDamageConfig)}>Save All</button>
            </div>

            {cvarViewOpen.gundamage && (
              <CvarViewPanel configList={GunDamageConfig} values={values} onApply={applyCvarText} addToast={addToast} label="Gun Damage" />
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
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(GunDamageConfig)}>Save (Write to CFG)</button>
            </div>
          </div>
        )}

        {activeTab === 'eliteReward' && (
          <div className="tut-card">
            <div className="tut-header">
               <h2>Elite SI Reward</h2>
               <p>Tinh chỉnh phần thưởng theo từng SI, scale theo độ khó và cấu hình thưởng riêng cho Tank/Witch.</p>
            </div>

            <div className="tut-actions" style={{ marginBottom: 16, marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
               <button className={`tut-btn-cvar-view${cvarViewOpen.eliteReward ? ' active' : ''}`} onClick={() => toggleCvarView('eliteReward')}>
                 {cvarViewOpen.eliteReward ? 'Close Cvar View' : 'View as Cvar'}
               </button>
               <button className="tut-btn tut-btn-refresh" onClick={fetchCvars}>Load Cvars</button>
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(EliteSIRewardConfig)}>Save All</button>
            </div>

            {cvarViewOpen.eliteReward && (
              <CvarViewPanel configList={EliteSIRewardConfig} values={values} onApply={applyCvarText} addToast={addToast} label="Elite SI Reward" />
            )}

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Rewards & Limits</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {EliteSIRewardConfig.slice(0, 10).map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Headshot & Difficulty Scaling</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {EliteSIRewardConfig.slice(10, 17).map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Tank / Witch Modes</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {EliteSIRewardConfig.slice(17, 21).map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Elite Spawn Traits</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {EliteSIRewardConfig.slice(21).map(renderCvarField)}
            </div>

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig(EliteSIRewardConfig)}>Save All (Elite SI Reward)</button>
            </div>
          </div>
        )}

        {activeTab === 'notifier' && (
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
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig([...NotifierDIConfig, ...NotifierBWConfig, ...NotifierThrowableConfig, ...NotifierExplosionConfig])}>Save All</button>
            </div>

            {cvarViewOpen.notifier && (
              <CvarViewPanel configList={[...NotifierDIConfig, ...NotifierBWConfig, ...NotifierThrowableConfig, ...NotifierExplosionConfig]} values={values} onApply={applyCvarText} addToast={addToast} label="Notifier" />
            )}

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Death & Incap</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierDIConfig.map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Black & White</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierBWConfig.map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Throwable Announcer</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierThrowableConfig.map(renderCvarField)}
            </div>

            <div className="tut-section-title" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Explosion Announcer</div>
            <div className="tut-form-grid" style={{ marginBottom: 24 }}>
               {NotifierExplosionConfig.map(renderCvarField)}
            </div>

            <div className="tut-actions" style={{ marginTop: 32 }}>
               <button className="tut-btn tut-btn-save" onClick={() => saveCvarConfig([...NotifierDIConfig, ...NotifierBWConfig, ...NotifierThrowableConfig, ...NotifierExplosionConfig])}>Save All (Notifier)</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TabTutorial;
