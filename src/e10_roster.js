
// =====================================================================
//  CHARACTER ROSTER & UNLOCKS
//  The four leads are always available online. Origin Dynamics staff are unlocked by playing the
//  single-player story on this device; locked ones show as a black silhouette with a "?".
//  阿蝠 and 阿龜 are met in chapters 3 and 4 and join the single-player team there.
//  More characters arrive with later chapters (shown as "?" placeholders).
// =====================================================================
const ROSTER = [
  { id: 'dad' }, { id: 'sq' }, { id: 'bear' }, { id: 'cham' },
  // mp: free to pick online from the start (online play takes up to 8 players, so 8 characters are always open)
  { id: 'hog', key: 'prologue', how: '第一章：離開地庫實驗室', mp: true },
  { id: 'rab', key: 'ch1', how: '完成第一章（把核心帶回牆腳）', mp: true },
  { id: 'coon', key: 'ch2', how: '第一章：拿到客廳的電池', mp: true },
  { id: 'frog', key: 'bat6', how: '單人模式集齊全部鈕扣電池' },
  { id: 'bat', key: 'bat', how: '單人第一章：在車房找到阿蝠', mp: true },
  { id: 'tort', key: 'tort', how: '單人第二章：在陳伯的後園找到阿龜' },
  { id: 'mole', key: 'mole', how: '單人第四章：在公園的沙池找到阿鼴' },
  { id: 'f2', future: true, how: '第六章：屋頂（製作中）' },
  { id: 'f3', future: true, how: '第七章（製作中）' }
];
const UNL = (() => { try { return JSON.parse(localStorage.getItem('bn_unlock_v1') || '{}') || {}; } catch (e) { return {}; } })();
function isUnlocked(id) { const r = ROSTER.find(q => q.id === id); return !!r && !r.future && (!r.key || !!UNL[r.key]); }
function canPickMP(id) { const r = ROSTER.find(q => q.id === id); return isUnlocked(id) || !!(r && r.mp); }
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
  $('roster').hidden = false; if (!$('pause').hidden) $('pause').classList.add('covered');
}
$('goRoster').addEventListener('click', () => { audioInit(); openRoster(); });
$('rosterClose').addEventListener('click', () => subClose('roster'));
// sub-panels (chapters, characters, help): the corner ×, tapping outside the panel, or Esc closes them;
// while one is open over the pause menu, the pause card steps aside so the two don't show through each other
function subClose(id) { $(id).hidden = true; if (['roster', 'help'].every(k => $(k).hidden)) $('pause').classList.remove('covered'); }
document.querySelectorAll('.xclose').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); subClose(b.dataset.close); }));
for (const id of ['chaps', 'roster', 'help']) $(id).addEventListener('click', e => { if (e.target === $(id)) subClose(id); });
addEventListener('keydown', e => { if (e.code !== 'Escape') return; for (const id of ['help', 'roster', 'chaps']) if (!$(id).hidden) { subClose(id); e.stopImmediatePropagation(); return; } }, true);

// ---------- settings (kept on this device) ----------
const SET = Object.assign({ sens: 1, vol: 1, mus: .6, inv: false }, (() => { try { return JSON.parse(localStorage.getItem('bn_set_v1') || '{}') || {}; } catch (e) { return {}; } })());
function saveSet() { try { localStorage.setItem('bn_set_v1', JSON.stringify(SET)); } catch (e) { } }
$('setSens').value = SET.sens; $('setVol').value = SET.vol; $('setMus').value = SET.mus; $('setInv').checked = !!SET.inv;
$('setSens').addEventListener('input', e => { SET.sens = +e.target.value; saveSet(); });
$('setVol').addEventListener('input', e => { SET.vol = +e.target.value; if (AU.out) AU.out.gain.value = .85 * SET.vol; saveSet(); });
$('setMus').addEventListener('input', e => { SET.mus = +e.target.value; saveSet(); });
$('setInv').addEventListener('change', e => { SET.inv = e.target.checked; saveSet(); });

// ---------- pause menu ----------
function pauseRefresh() {
  const D = LEVELS[LEVEL]; const where = NET.on ? '多人 · ' : '';
  $('pauseLoc').textContent = STATE === 'title' || !D ? '' : `${where}${D.chapter} · ${D.title}`;
  $('pauseTip').textContent = NET.on ? '多人遊戲不會暫停，其他人還在玩。按「繼續」回到遊戲。' : TOUCH ? '按「繼續」回到遊戲。' : '按「繼續」回到遊戲，滑鼠會再次鎖定來轉視角。';
  $('pauseRosterN').textContent = `已解鎖 ${unlockedCount()} / ${ROSTER.length}`;
  $('pauseTitle').hidden = NET.on; $('pauseTitle').classList.remove('warn'); $('pauseTitleS').textContent = '進度會由章節開頭重新開始'; pauseTitleArm = 0;
  $('pauseCp').querySelector('small').textContent = NET.on ? '卡住了？只會把你自己送回存檔點' : '卡住了？由最近的存檔點再來';
  testPauseRefresh(); unPauseRefresh();
}
let pauseTitleArm = 0;
$('pauseRoster').addEventListener('click', () => openRoster());
$('pauseHelp').addEventListener('click', () => openHelp());
$('helpClose').addEventListener('click', () => subClose('help'));
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
  const K = TOUCH ? [['移動', '左邊拖動搖桿'], ['視角', '右邊拖動'], ['跳／攀爬時跳開', '「跳」'], ['攀爬', '推搖桿撞向牆壁'], ['潛行', '「潛行」'], ['疊羅漢', '「疊」'], ['換角色', '「換人」或點頭像'], ['角色能力', '右下角的能力按鈕'], ['救隊友', '「復活」用 Prototype'], ['卡住了', '暫停選單「我卡住了」']]
    : [['移動', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>'], ['視角', '滑鼠'], ['跑', '<kbd>Shift</kbd>'], ['潛行', '<kbd>C</kbd>'], ['跳／攀爬時跳開', '<kbd>Space</kbd>'], ['攀爬', '走向牆壁按住 <kbd>W</kbd>'], ['換角色', NET.on ? '多人模式不能換' : '<kbd>Tab</kbd> 或數字鍵'], ['角色能力', '左鍵／右鍵'], ['疊羅漢', '<kbd>F</kbd>（只疊最近的隊友）'], ['用 Prototype 救隊友', '<kbd>R</kbd>'], ['阿蛙搞電器', '<kbd>E</kbd>'], ['隱藏介面', '<kbd>H</kbd>'], ['暫停選單', '<kbd>Esc</kbd>'], ['卡住了', '長按 <kbd>K</kbd>']];
  // online: no switching characters; Tab / ← → watch a teammate while you're a toy
  const KK = NET.on ? [...K.filter(r => r[0] !== '換角色'), ['變成玩具時看隊友', TOUCH ? '「‹ ›」' : '<kbd>Tab</kbd> 或 <kbd>←</kbd><kbd>→</kbd>']] : K;
  $('helpKeys').innerHTML = KK.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('');
  const who = (party.length ? IDS.filter(id => party.includes(chars[id])) : CORE);
  $('helpAbil').innerHTML = who.map(id => { const S = SP[id]; return `<div>${PORTRAITS[id] ? `<img alt="" src="${PORTRAITS[id]}">` : ''}<span><b style="color:${S.col}">${S.name} · ${S.abil}</b><small>${S.desc}</small></span></div>`; }).join('');
  $('help').hidden = false; if (!$('pause').hidden) $('pause').classList.add('covered');
}

// ---------- chapter list (title screen) ----------
const CHAPS = [
  { n: '第一章', t: '屋企', d: '縮小實驗失控。由地庫爬出去，穿過牆內、廚房、客廳同車房，避開太太、女兒、貓同 Origin Dynamics 的人。', go: () => startGame(0),
    starts: [{ t: '地庫', go: () => startGame(0) }, { t: '牆內與廚房', go: () => startGame(1) }, { t: '客廳', key: 'ch1', go: () => startChapter2() }, { t: '車房', key: 'ch2', go: () => startChapter('garage') }] },
  { n: '第二章', t: '後園與鄰居家', d: '穿過圍欄、避開陳伯的狗，到陽光房找控制晶片。', key: 'ch3', lock: '完成第一章解鎖', go: () => startChapter('yard') },
  { n: '第三章', t: '馬路', d: '從陳伯的前閘鑽出去，按過路燈，避開車輪，走到對面的公園。', key: 'ch4', lock: '完成第二章解鎖', go: () => startChapter('road') },
  { n: '第四章', t: '公園', d: '陽光下的楓林公園。避開狗、跑步的人和滑板少年，在滑梯塔頂用陽光替晶片充電。', key: 'ch5', lock: '完成第三章解鎖', go: () => startChapter('park') },
  { n: '第五章', t: '學校', d: '楓林小學。趁小息溜進課室，在女兒的儲物格找出備份密碼。', key: 'ch6', lock: '完成第四章解鎖', go: () => startChapter('school') },
  { n: '第六章', t: '屋頂', d: '製作中', future: true },
  { n: '第七章', t: 'Origin Dynamics', d: '製作中', future: true }
];
function startChapter(name, opt) { $('start').hidden = true; $('chaps').hidden = true; playT = 0; fails = 0; requestLock(); return loadLevel(name, opt); }
// chapter two starts in the kitchen, with the core already back at the mouse hole
function startChapter2() {
  return startChapter('kitchen', { chapter: '第一章', title: '屋企', after() {
    KS.coreGot = true; KS.carried = false; KS.coreDrop = null; KS.home = true; KS.ch2 = true; KS.core.position.set(-306, 1.6, -100);
    QUESTS = SP_Q2; setQuest(0); setTimeout(() => roomBanner('客廳'), 900);
  } });
}
function openChapters() {
  const L = $('chapsList'); L.innerHTML = '';
  for (const c of CHAPS) {
    const real = !c.future && (!c.key || !!UNL[c.key]), open = !c.future && (real || TEST.on); const b = document.createElement('button');
    b.className = 'ch' + (open ? '' : ' lock') + (open && !real ? ' tst' : ''); b.disabled = !open;
    b.innerHTML = `<small>${c.n}${open && !real ? '<i>測試</i>' : ''}</small><b>${c.t}</b><em>${open ? c.d : c.future ? '製作中' : c.lock}</em>`;
    if (open) b.addEventListener('click', () => { $('chaps').hidden = true; audioInit(); c.go(); });
    // a long chapter can be started part-way through: the rooms you've reached
    if (open && c.starts) { const row = document.createElement('span'); row.className = 'chst'; row.innerHTML = `<i>由呢度開始</i>`;
      for (const st of c.starts) { const ok = !st.key || UNL[st.key] || TEST.on, x = document.createElement('span'); x.className = 'chs' + (ok ? '' : ' lock'); x.textContent = st.t; x.setAttribute('role', 'button');
        if (ok) x.addEventListener('click', e => { e.stopPropagation(); $('chaps').hidden = true; audioInit(); st.go(); }); row.appendChild(x); }
      b.appendChild(row); }
    L.appendChild(b);
  }
  $('chapsN').textContent = TEST.on ? '測試模式：全部章節開放，進度不會儲存' : `${CHAPS.filter(c => !c.future && (!c.key || UNL[c.key])).length} / ${CHAPS.filter(c => !c.future).length} 已解鎖`; $('testOn').checked = TEST.on;
  $('chaps').hidden = false;
}
$('goCh').addEventListener('click', () => { audioInit(); openChapters(); });
$('chapsClose').addEventListener('click', () => subClose('chaps'));
