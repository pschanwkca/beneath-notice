
// =====================================================================
//  CHARACTER ROSTER & UNLOCKS
//  The four leads are always available online. Origin Dynamics staff are unlocked by playing the
//  single-player story on this device; locked ones show as a black silhouette with a "?".
//  阿蝠 and 阿龜 are met in chapters 3 and 4 and join the single-player team there.
//  More characters arrive with later chapters (shown as "?" placeholders).
// =====================================================================
const ROSTER = [
  { id: 'dad' }, { id: 'sq' }, { id: 'bear' }, { id: 'cham' },
  { id: 'hog', key: 'prologue', how: '完成序章（地庫實驗室）' },
  { id: 'rab', key: 'ch1', how: '完成第一章（把核心帶回牆腳）' },
  { id: 'coon', key: 'ch2', how: '完成第二章（客廳的電池）' },
  { id: 'frog', key: 'bat6', how: '單人模式集齊全部鈕扣電池' },
  { id: 'bat', key: 'bat', how: '單人第三章：在車房找到阿蝠' },
  { id: 'tort', key: 'tort', how: '單人第四章：在陳伯的後園找到阿龜' },
  { id: 'f1', future: true, how: '第五章：馬路（製作中）' },
  { id: 'f2', future: true, how: '第六章：公園（製作中）' },
  { id: 'f3', future: true, how: '第七章（製作中）' }
];
const UNL = (() => { try { return JSON.parse(localStorage.getItem('bn_unlock_v1') || '{}') || {}; } catch (e) { return {}; } })();
function isUnlocked(id) { const r = ROSTER.find(q => q.id === id); return !!r && !r.future && (!r.key || !!UNL[r.key]); }
function unlockedCount() { return ROSTER.filter(r => isUnlocked(r.id)).length; }
// single player progress unlocks characters for online games
function unlockKey(key) {
  if (NET.on || UNL[key] || TEST.on) return; UNL[key] = 1;
  try { localStorage.setItem('bn_unlock_v1', JSON.stringify(UNL)); } catch (e) { }
  for (const r of ROSTER) if (r.key === key) UNLQ.push(r.id);
  if (!UNLQ.busy) { UNLQ.busy = true; setTimeout(nextUnlock, WC.banner > 0 ? WC.banner * 1000 + 400 : 300); }
}
const UNLQ = [];
function nextUnlock() {
  const id = UNLQ.shift(); const el = $('unl'); if (!id || !el) { UNLQ.busy = false; return; } UNLQ.busy = true; const S = SP[id];
  el.innerHTML = `<div class="ph">${PORTRAITS[id] ? `<img alt="" src="${PORTRAITS[id]}">` : ''}</div><div><small>新角色解鎖</small><b style="color:${S.col}">${S.name}<span>${S.role}</span></b><em>${S.abil} · 多人模式可以揀</em></div>`;
  el.classList.add('on'); SND.pick(); setTimeout(() => { el.classList.remove('on'); setTimeout(nextUnlock, 700); }, 4600);
}
// a dark animal silhouette for characters nobody has seen yet
const SIL_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#07090c" d="M18 13c5 0 8 4 8 8 2-1 4-1 6-1s4 0 6 1c0-4 3-8 8-8 5 0 8 4 8 9 0 4-2 7-5 8 2 3 3 6 3 10 0 10-9 17-20 17S12 50 12 40c0-4 1-7 3-10-3-1-5-4-5-8 0-5 3-9 8-9z"/></svg>`;
function rosterCard(r, opts = {}) {
  const open = isUnlocked(r.id), S = SP[r.id];
  if (open) return `<div class="rc"><div class="ph">${PORTRAITS[r.id] ? `<img alt="" src="${PORTRAITS[r.id]}">` : ''}</div><b style="color:${S.col}">${S.name}</b><small>${S.role}</small><em>${S.abil}</em><p>${S.desc}</p></div>`;
  const pic = r.future ? SIL_SVG : PORTRAITS[r.id] ? `<img class="sil" alt="" src="${PORTRAITS[r.id]}">` : SIL_SVG;
  return `<div class="rc lock"><div class="ph">${pic}<i>?</i></div><b>？？？</b><p>${r.how}</p></div>`;
}
function openRoster() {
  $('rosterN').textContent = `已解鎖 ${unlockedCount()} / ${ROSTER.length}`;
  $('rosterGrid').innerHTML = ROSTER.map(r => rosterCard(r)).join('');
  $('roster').hidden = false;
}
$('goRoster').addEventListener('click', () => { audioInit(); openRoster(); });
$('rosterClose').addEventListener('click', () => { $('roster').hidden = true; });

// ---------- settings (kept on this device) ----------
const SET = Object.assign({ sens: 1, vol: 1, inv: false }, (() => { try { return JSON.parse(localStorage.getItem('bn_set_v1') || '{}') || {}; } catch (e) { return {}; } })());
function saveSet() { try { localStorage.setItem('bn_set_v1', JSON.stringify(SET)); } catch (e) { } }
$('setSens').value = SET.sens; $('setVol').value = SET.vol; $('setInv').checked = !!SET.inv;
$('setSens').addEventListener('input', e => { SET.sens = +e.target.value; saveSet(); });
$('setVol').addEventListener('input', e => { SET.vol = +e.target.value; if (AU.out) AU.out.gain.value = .85 * SET.vol; saveSet(); });
$('setInv').addEventListener('change', e => { SET.inv = e.target.checked; saveSet(); });

// ---------- pause menu ----------
function pauseRefresh() {
  const D = LEVELS[LEVEL]; const where = NET.on ? '多人 · ' : '';
  $('pauseLoc').textContent = STATE === 'title' || !D ? '' : `${where}${D.chapter} · ${D.title}`;
  $('pauseTip').textContent = NET.on ? '多人遊戲不會暫停，其他人還在玩。按「繼續」回到遊戲。' : TOUCH ? '按「繼續」回到遊戲。' : '按「繼續」回到遊戲，滑鼠會再次鎖定來轉視角。';
  $('pauseRosterN').textContent = `已解鎖 ${unlockedCount()} / ${ROSTER.length}`;
  $('pauseTitle').hidden = NET.on; $('pauseTitle').classList.remove('warn'); $('pauseTitleS').textContent = '進度會由章節開頭重新開始'; pauseTitleArm = 0;
  $('pauseCp').querySelector('small').textContent = NET.on ? '卡住了？只會把你自己送回存檔點' : '卡住了？由最近的存檔點再來';
  testPauseRefresh();
}
let pauseTitleArm = 0;
$('pauseRoster').addEventListener('click', () => openRoster());
$('pauseHelp').addEventListener('click', () => openHelp());
$('helpClose').addEventListener('click', () => { $('help').hidden = true; });
$('pauseCp').addEventListener('click', () => {
  if (STATE !== 'play' || !CPS) return;
  if (NET.on) { const L = leader; if (!L || L.frozen) return; const p = CPS[cp] || CPS[0]; L.pos.set(p[0] + IDS.indexOf(L.id) * 3, p[1], p[2]); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.on = null; L.hop = null; trail = []; L.lastTrail.copy(L.pos); cam.tgt.copy(L.pos); }
  else respawn();
  resume(); toast('回到存檔點', 2);
});
$('pauseTitle').addEventListener('click', () => {
  if (pauseTitleArm && performance.now() - pauseTitleArm < 3500) { location.href = location.pathname + location.search.replace(/[?&]room=[^&]*/, ''); return; }
  pauseTitleArm = performance.now(); $('pauseTitle').classList.add('warn'); $('pauseTitleS').textContent = '再按一次確認返回主畫面';
  setTimeout(() => { if (pauseTitleArm && performance.now() - pauseTitleArm >= 3400) { $('pauseTitle').classList.remove('warn'); $('pauseTitleS').textContent = '進度會由章節開頭重新開始'; pauseTitleArm = 0; } }, 3600);
});
// controls + what each character in the party can do
function openHelp() {
  const K = TOUCH ? [['移動', '左邊拖動搖桿'], ['視角', '右邊拖動'], ['跳／攀爬時跳開', '「跳」'], ['攀爬', '推搖桿撞向牆壁'], ['潛行', '「潛行」'], ['疊羅漢', '「疊」'], ['換角色', '「換人」或點頭像'], ['角色能力', '右下角的能力按鈕'], ['救隊友', '「復活」用 Prototype']]
    : [['移動', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>'], ['視角', '滑鼠'], ['跑', '<kbd>Shift</kbd>'], ['潛行', '<kbd>C</kbd>'], ['跳／攀爬時跳開', '<kbd>Space</kbd>'], ['攀爬', '走向牆壁按住 <kbd>W</kbd>'], ['換角色', NET.on ? '多人模式不能換' : '<kbd>Tab</kbd> 或數字鍵'], ['角色能力', '左鍵／右鍵'], ['疊羅漢', '<kbd>F</kbd>（只疊最近的隊友）'], ['用 Prototype 救隊友', '<kbd>R</kbd>'], ['阿蛙搞電器', '<kbd>E</kbd>'], ['隱藏介面', '<kbd>H</kbd>'], ['暫停選單', '<kbd>Esc</kbd>']];
  $('helpKeys').innerHTML = K.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('');
  const who = (party.length ? IDS.filter(id => party.includes(chars[id])) : CORE);
  $('helpAbil').innerHTML = who.map(id => { const S = SP[id]; return `<div>${PORTRAITS[id] ? `<img alt="" src="${PORTRAITS[id]}">` : ''}<span><b style="color:${S.col}">${S.name} · ${S.abil}</b><small>${S.desc}</small></span></div>`; }).join('');
  $('help').hidden = false;
}

// ---------- chapter list (title screen) ----------
const CHAPS = [
  { n: '序章', t: '地庫實驗室', d: '縮小實驗失控。由工作枱爬到地上，找出路。', go: () => startGame(0) },
  { n: '第一章', t: '牆內與廚房', d: '穿過牆內的老鼠洞，避開太太、女兒和貓，從雪櫃底拿回核心。', go: () => startGame(1) },
  { n: '第二章', t: '客廳', d: '核心的光越來越弱。打開往客廳的門，拿遙控器的電池。', key: 'ch1', lock: '完成第一章解鎖', go: () => startChapter2() },
  { n: '第三章', t: '車房', d: 'Origin Dynamics 的人在搜車房。修好機座，從狗門逃出去。', key: 'ch2', lock: '完成第二章解鎖', go: () => startChapter('garage') },
  { n: '第四章', t: '後園與鄰居家', d: '穿過圍欄、避開陳伯的狗，到陽光房找控制晶片。', key: 'ch3', lock: '完成第三章解鎖', go: () => startChapter('yard') },
  { n: '第五章', t: '馬路', d: '製作中', future: true }
];
function startChapter(name, opt) { $('start').hidden = true; $('chaps').hidden = true; playT = 0; fails = 0; requestLock(); return loadLevel(name, opt); }
// chapter two starts in the kitchen, with the core already back at the mouse hole
function startChapter2() {
  return startChapter('kitchen', { chapter: '第二章', title: '客廳', after() {
    KS.coreGot = true; KS.carried = false; KS.coreDrop = null; KS.home = true; KS.ch2 = true; KS.core.position.set(-306, 1.6, -100);
    QUESTS = SP_Q2; setQuest(0); setTimeout(() => chapterBanner('第二章', '客廳'), 900);
  } });
}
function openChapters() {
  const L = $('chapsList'); L.innerHTML = '';
  for (const c of CHAPS) {
    const real = !c.future && (!c.key || !!UNL[c.key]), open = !c.future && (real || TEST.on); const b = document.createElement('button');
    b.className = 'ch' + (open ? '' : ' lock') + (open && !real ? ' tst' : ''); b.disabled = !open;
    b.innerHTML = `<small>${c.n}${open && !real ? '<i>測試</i>' : ''}</small><b>${c.t}</b><em>${open ? c.d : c.future ? '製作中' : c.lock}</em>`;
    if (open) b.addEventListener('click', () => { $('chaps').hidden = true; audioInit(); c.go(); });
    L.appendChild(b);
  }
  $('chapsN').textContent = TEST.on ? '測試模式：全部章節開放，進度不會儲存' : `${CHAPS.filter(c => !c.future && (!c.key || UNL[c.key])).length} / ${CHAPS.filter(c => !c.future).length} 已解鎖`; $('testOn').checked = TEST.on;
  $('chaps').hidden = false;
}
$('goCh').addEventListener('click', () => { audioInit(); openChapters(); });
$('chapsClose').addEventListener('click', () => { $('chaps').hidden = true; });
