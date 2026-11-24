// ---------- connection log (pause menu → 複製連線紀錄) ----------
// Online games break in ways that can't be seen from outside, so every machine keeps a short diary:
// who joined or dropped, how good each link is, frame rate, rescues and errors. One tap copies it as
// plain text that a player can paste into a chat and send in.
const NLOG = { t0: performance.now(), lines: [], fps: 0, sumT: 0, mode: '', lv: '', peer: {} };
const NLOG_BUILD = '__BUILD__';
function nlog(s) {
  const d = new Date(), p2 = n => String(n).padStart(2, '0');   // the clock time, so "it broke around 9:30" can be matched
  NLOG.lines.push(`${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}  ${s}`); if (NLOG.lines.length > 500) NLOG.lines.splice(0, NLOG.lines.length - 500);
}
const nlId = id => id ? (nameOf(id) || '?') + '·' + String(id).slice(0, 4) : '-';
const nlChar = id => { const k = IDS.find(c => NET.slots[c] === id); return k ? chars[k].S.name : '未揀'; };
window.addEventListener('error', e => nlog('錯誤：' + (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '')));
window.addEventListener('unhandledrejection', e => nlog('錯誤（promise）：' + String(e.reason && (e.reason.message || e.reason)).slice(0, 160)));
document.addEventListener('visibilitychange', () => { if (NET.on || NET.code) nlog(document.hidden ? '畫面收埋（轉咗 app／分頁）' : '畫面返嚟'); });
addEventListener('online', () => nlog('網絡：連返'));
addEventListener('offline', () => nlog('網絡：斷咗'));

// how each link actually goes: direct on the same network, or across the internet (STUN)
async function nlLinkKind(pc) {
  try {
    const st = await pc.getStats(); let pair = null; const loc = {};
    st.forEach(r => { if (r.type === 'local-candidate') loc[r.id] = r; if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected)) pair = r; });
    if (!pair) return pc.connectionState || '?';
    const c = loc[pair.localCandidateId] || {}, rtt = pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) + 'ms' : '';
    return ({ host: '同一網絡', srflx: '經互聯網', prflx: '經互聯網', relay: '中轉' })[c.candidateType] + (c.protocol ? '/' + c.protocol : '') + (rtt ? ' ' + rtt : '');
  } catch (e) { return '?'; }
}
// every 20 s while online: one line per teammate
async function nlSummary() {
  const T = NET.tx; if (!T) return;
  const pcs = T.peers ? T.peers() : {}, now = performance.now(), parts = [];
  for (const id of NET.peers) {
    let ping = ''; try { if (T.ping) ping = Math.round(await Promise.race([T.ping(id), new Promise(r => setTimeout(() => r(NaN), 3000))])) + 'ms'; } catch (e) { ping = '失敗'; }
    const kind = pcs[id] ? await nlLinkKind(pcs[id]) : '', heard = NLOG.peer[id] ? ((now - NLOG.peer[id]) / 1000).toFixed(1) + 's' : '從未';
    parts.push(`${nlId(id)}（${nlChar(id)}）ping ${ping || '-'} · ${kind || '-'} · 最後訊息 ${heard}`);
  }
  nlog(`狀態：${Math.round(NLOG.fps)} fps · ${LEVEL || '-'} · ${parts.length ? parts.join(' ｜ ') : '冇隊友'}`);
}
function netLogTick(dt) {
  if (!NET.tx) return;
  if (LEVEL && LEVEL !== NLOG.lv && STATE === 'play') { NLOG.lv = LEVEL; nlog('去咗：' + LEVEL + '（任務 ' + quest + '）'); }
  const m = $('netbar') && !$('netbar').hidden ? $('netbar').dataset.m : ''; if (m !== NLOG.mode) { NLOG.mode = m; nlog(m === 'lost' ? '同房主斷咗線' : m === 'weak' ? '網絡唔穩定（3 秒冇收到房主訊息）' : '網絡回復正常'); }
  NLOG.sumT += dt; if (NLOG.sumT > 20) { NLOG.sumT = 0; nlSummary(); }
}
function netLogText() {
  const sz = innerWidth + '×' + innerHeight + ' @' + (devicePixelRatio || 1).toFixed(1), ua = navigator.userAgent.replace(/Mozilla\/5\.0 |AppleWebKit\/[\d.]+ |\(KHTML, like Gecko\) /g, '');
  const head = [
    'BENEATH NOTICE 連線紀錄',
    `版本 ${NLOG_BUILD} · ${new Date().toLocaleString('zh-HK')}`,
    `房號 ${NET.code || '-'} · ${NET.host ? '房主' : '玩家'} · 我：${myName() || '-'}（${NET.me ? nlChar(NET.me) : '-'}）`,
    `${TOUCH ? '手機／平板' : '電腦'} · ${sz} · 畫質 ${QUAL} · ${Math.round(NLOG.fps)} fps · ${navigator.onLine ? '有網絡' : '冇網絡'}`,
    ua,
    '隊友：' + (NET.peers.length ? NET.peers.map(id => `${nlId(id)}（${nlChar(id)}）`).join('、') : '冇'),
    '—— 紀錄 ——'
  ];
  return head.concat(NLOG.lines.slice(-300)).join('\n');
}
function netLogCopy(btn, label) {
  const t = netLogText();
  const done = ok => { btn.textContent = ok ? '已複製，貼畀開發者' : '複製唔到'; setTimeout(() => { btn.textContent = label; }, 2200); };
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); done(ok); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => done(true), fallback); else fallback();
}
$('pauseLog').addEventListener('click', e => netLogCopy(e.currentTarget, '複製連線紀錄'));
