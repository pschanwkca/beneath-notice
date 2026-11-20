// =====================================================================
//  TEST MODE — for trying any chapter without playing up to it
//  · turned on from the chapter list on the title screen (or ?test in the address)
//  · every chapter can be started; nothing you unlock while testing is saved
//  · the pause menu gets test tools: jump to key spots in the world, never get seen,
//    endless stamina, and bring the whole cast into the single-player team
// =====================================================================
const TEST = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('bn_test_v1') || '{}'); } catch (e) { } if (/[?&]test\b/.test(location.search)) s.on = true; return { on: !!s.on, nodet: !!s.nodet, stam: !!s.stam }; })();
function testSave() { try { localStorage.setItem('bn_test_v1', JSON.stringify(TEST)); } catch (e) { } }
function testApply() {
  window.__NODET = TEST.on && TEST.nodet;
  $('testChip').textContent = '測試模式' + (TEST.on && TEST.nodet ? ' · 不會被發現' : '') + (TEST.on && TEST.stam ? ' · 無限體力' : '');
}
// key spots, grouped by chapter (world coordinates; the hub and basement sit at an offset)
const WARPS = [
  ['序章', '地庫・工作枱', () => V3(BO.x + CPS_B[0][0], BO.y + CPS_B[0][1], BO.z + CPS_B[0][2]), 0],
  ['序章', '地庫・老鼠洞', () => V3(BO.x - 282, BO.y, BO.z + 226), Math.PI / 2],
  ['第一章', '牆內', () => V3(HO.x + 60, HO.y + 4, HO.z + 15), Math.PI / 2],
  ['第一章', '廚房・老鼠洞', () => V3(-286, 0, -100), -Math.PI / 2],
  ['第一章', '雪櫃前（核心）', () => V3(191, 0, -150), 0],
  ['第二章', '客廳門口', () => V3(300, 0, -10), -Math.PI / 2],
  ['第二章', '遙控器旁', () => V3(LIV.remote.cx - 30, 0, LIV.remote.cz + 20), 0],
  ['第二章', '通風口', () => V3(880, 0, -200), -Math.PI / 2],
  ['第三章', '車房・風管出口', () => V3(978, GY, -196), -Math.PI / 2],
  ['第三章', '工作枱上', () => V3(1300, GS.benchY, -205), Math.PI],
  ['第三章', '狗門', () => V3(1430, GY, 105), -Math.PI / 2],
  ['第四章', '後園', () => V3(1480, GY, 105), -Math.PI / 2],
  ['第四章', '圍欄爛板', () => V3(2085, GY, 109), -Math.PI / 2],
  ['第四章', '陽光房', () => V3(2600, DECK, 100), -Math.PI / 2],
  ['第四章', '書枱（晶片）', () => V3(2716, YS.chipP.y, 140), Math.PI]
];
function testWarp(w) {
  if (NET.on || !WORLD || (STATE !== 'play' && STATE !== 'fail')) return;
  const p = w[2](); stkClear(); toyUnfreezeAll();
  const fx = -Math.sin(w[3]), fz = -Math.cos(w[3]);
  party.forEach((C, i) => {
    const b = i ? -1.2 - Math.floor((i - 1) / 2) * 1.6 : 0, s = i ? (i % 2 ? -1 : 1) * 3 : 0;
    C.pos.set(p.x + fx * b * 3 - fz * s, p.y, p.z + fz * b * 3 + fx * s); C.vel.set(0, 0, 0);
    C.climbing = false; C.mantle = null; C.roost = null; C.shell = false; C.hop = null; C.tumble = 0; C.grounded = true; C.crouch = false;
    C.state = 'idle'; C.queue = []; C.qst = 'idle'; C.yaw = w[3] + Math.PI; if (C.disp) C.disp.copy(C.pos); C.lastTrail = C.pos.clone(); C.offK = 0;
  });
  trail = []; meter = 0; cam.yaw = w[3]; cam.pitch = .14; cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z); cam.curD = cam.dist;
  if (STATE === 'fail') STATE = 'play';
  resume(); toast(`測試：跳到「${w[1]}」`, 2.2);
}
// everyone in the cast joins the single-player team, standing round the leader
function testAll() {
  if (NET.on || STATE !== 'play') return; const L = leader; let n = 0;
  for (const id of IDS) {
    const K = chars[id]; if (party.includes(K)) continue; n++;
    const a = n * 1.1; K.pos.set(L.pos.x + Math.sin(a) * 6, L.pos.y, L.pos.z + Math.cos(a) * 6); K.yaw = L.yaw; K.state = 'idle'; K.shell = false; K.roost = null;
    if (id === 'bat') NC.batT = 99; if (id === 'tort') NC.tortT = 99;
    crewJoin(id, true);
  }
  toast(n ? `測試：${n} 隻角色加入隊伍（按數字鍵或點頭像切換）` : '全部角色已經在隊伍裡', 3);
}
function testTick() {
  const chip = TEST.on && !NET.on && STATE !== 'title'; if ($('testChip').hidden === chip) $('testChip').hidden = !chip;
  if (!TEST.on || NET.on) return;
  if (TEST.stam) for (const C of party) C.stamina = C.stamMax || 100;
}
function testPauseRefresh() {
  const show = TEST.on && !NET.on && !!WORLD && STATE !== 'title'; $('pauseTest').hidden = !show; if (!show) return;
  $('tNodet').checked = TEST.nodet; $('tStam').checked = TEST.stam;
  const box = $('testWarps'); if (box.childElementCount) return;
  let g = '';
  for (const w of WARPS) {
    if (w[0] !== g) { g = w[0]; const h = document.createElement('div'); h.className = 'grp'; h.textContent = g; box.appendChild(h); }
    const b = document.createElement('button'); b.className = 'ghost'; b.textContent = w[1]; b.addEventListener('click', () => testWarp(w)); box.appendChild(b);
  }
}
$('testOn').addEventListener('change', e => { TEST.on = e.target.checked; testSave(); testApply(); openChapters(); });
$('tNodet').addEventListener('change', e => { TEST.nodet = e.target.checked; testSave(); testApply(); });
$('tStam').addEventListener('change', e => { TEST.stam = e.target.checked; testSave(); testApply(); });
$('tAll').addEventListener('click', () => { testAll(); });
testApply();
