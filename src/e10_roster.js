
// =====================================================================
//  CHARACTER ROSTER & UNLOCKS
//  The four leads are always available online. Origin Dynamics staff are unlocked by playing the
//  single-player story on this device; locked ones show as a black silhouette with a "?".
//  More characters arrive with later chapters (shown as "?" placeholders).
// =====================================================================
const ROSTER = [
  { id: 'dad' }, { id: 'sq' }, { id: 'bear' }, { id: 'cham' },
  { id: 'hog', key: 'prologue', how: '完成序章（地庫實驗室）' },
  { id: 'rab', key: 'ch1', how: '完成第一章（把核心帶回牆腳）' },
  { id: 'coon', key: 'ch2', how: '完成第二章（客廳的電池）' },
  { id: 'frog', key: 'bat6', how: '單人模式集齊 6 粒鈕扣電池' },
  { id: 'f1', future: true, how: '第三章：車房（製作中）' },
  { id: 'f2', future: true, how: '第四章：鄰居家（製作中）' },
  { id: 'f3', future: true, how: '第五章：馬路（製作中）' },
  { id: 'f4', future: true, how: '第六章：公園（製作中）' }
];
const UNL = (() => { try { return JSON.parse(localStorage.getItem('bn_unlock_v1') || '{}') || {}; } catch (e) { return {}; } })();
function isUnlocked(id) { const r = ROSTER.find(q => q.id === id); return !!r && !r.future && (!r.key || !!UNL[r.key]); }
function unlockedCount() { return ROSTER.filter(r => isUnlocked(r.id)).length; }
// single player progress unlocks characters for online games
function unlockKey(key) {
  if (NET.on || UNL[key]) return; UNL[key] = 1;
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
