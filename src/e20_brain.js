// =====================================================================
//  THE FAMILY'S BRAINS — Mom and the daughter, in the kitchen · living room · bathroom
//  · each has needs that grow over time (cook, wash up, the fridge, sit down, the bathroom, tidy the
//    living room / homework, a snack, the cat, the TV …) and picks what to do next by how much she
//    wants it, with a little randomness and never the same thing twice running — no fixed loop
//  · they walk a small map of the rooms (doors, the sofa, the toilet …) and use the house like you do:
//    the hood goes on when Mom cooks, the tap runs while she washes up, the bathroom light goes on
//    (and the door shuts) when someone's in there — and the daughter sometimes forgets the light
//  · they notice what you change — lights out, a tap left running, the hood, a flush nobody did,
//    the TV, the lamp — go and deal with it, and grow suspicious when it keeps happening:
//      0 calm · 1 "the house feels odd" · 2 uneasy (sharper eyes, re-checks the places where odd
//      things happened) · 3 searching (Mom asks the daughter to help look) — cooling down when
//      things stay quiet
//  · they talk to each other; lines are only shown to players near enough to hear them
//  Runs on the host (or single player); clients get positions and poses in the world snapshot.
// =====================================================================
const HB = { sus: 0, quiet: 0, stage: 0, search: 0, inc: [], mem: [], eye: 1, m: null, k: null, said: {}, glT: 0, kidForgot: 0, lastSay: {} };
const NAVN = {}, NAVE = {};
function navN(id, x, z, y = 0) { NAVN[id] = { id, x, z, y }; NAVE[id] = []; }
function navL(a, b, gate) { NAVE[a].push({ to: b, gate }); NAVE[b].push({ to: a, gate }); }
[['stove', 34, -128], ['sink', -100, -127], ['fridge', 176, -88], ['mtable', -90, 12], ['kmid', 0, -40], ['keast', 225, -40], ['bathK', 267, -160], ['kswitch', 284, -84], ['bswitch', 284, -198],
 ['livK', 268, -10], ['ksouth', 40, 186], ['kidstand', -90, 192], ['catspot', 152, -92],
 ['livL', 345, -10], ['lmid', 520, -20], ['llamp', 600, -12], ['lsofa', 672, 10], ['ltv', 842, 76],
 ['toys', 212, 120], ['counter', -30, -122],
 ['bathIn', 262, -270], ['bmid', 296, -350], ['toiletStand', 400, -390], ['bsink', 215, -410],
 // upstairs: the stairs behind the living room, the landing and hall, the daughter's bedroom (y 300)
 ['lstair', 788, -196], ['stairBot', 788, -258], ['stairTop', 788, -484, 300], ['hallN', 864, -484, 300], ['hallS', 864, -262, 300],
 ['uswitch', 852, -205, 300], ['umid', 640, -40, 300], ['udesk', 495, -112, 300], ['ushelf', 702, -176, 300], ['ubed', 448, 112, 300], ['unight', 478, 178, 300], ['uwin', 620, 168, 300], ['uward', 826, 92, 300]].forEach(n => navN(...n));
for (const [a, b] of [['stove', 'kmid'], ['sink', 'kmid'], ['stove', 'sink'], ['fridge', 'kmid'], ['fridge', 'keast'], ['mtable', 'kmid'], ['kmid', 'keast'], ['keast', 'bathK'], ['keast', 'kswitch'], ['keast', 'livK'],
  ['livK', 'kswitch'], ['kswitch', 'bswitch'], ['bswitch', 'bathK'], ['kmid', 'ksouth'], ['keast', 'ksouth'], ['ksouth', 'kidstand'], ['catspot', 'kmid'], ['catspot', 'fridge'], ['catspot', 'keast'],
  ['livL', 'lmid'], ['lmid', 'llamp'], ['llamp', 'lsofa'], ['lmid', 'lsofa'], ['lsofa', 'ltv'], ['bathK', 'bathIn'], ['bathIn', 'bmid'], ['bmid', 'toiletStand'], ['bmid', 'bsink'], ['bathIn', 'bsink'], ['toys', 'keast'], ['toys', 'ksouth'], ['counter', 'kmid'], ['counter', 'sink'], ['counter', 'stove'],
  ['lstair', 'lmid'], ['lstair', 'ltv'], ['lstair', 'stairBot'], ['stairBot', 'stairTop'], ['stairTop', 'hallN'], ['hallN', 'hallS'], ['hallS', 'uswitch'], ['uswitch', 'umid'], ['uswitch', 'ushelf'], ['uswitch', 'uward'],
  ['umid', 'udesk'], ['umid', 'ushelf'], ['umid', 'ubed'], ['umid', 'uwin'], ['umid', 'uward'], ['umid', 'unight'], ['ubed', 'unight'], ['unight', 'uwin'], ['udesk', 'ubed']]) navL(a, b);
navL('livK', 'livL', () => LIV.open);
function roomOf(x, z, y = 0) { if (x > 740 && z < -244) return 's'; if (y > 200 && x > 300 && z > -244) return 'u'; return z < -236 ? 'b' : x > 306 ? 'l' : 'k'; }
const ROOM_NAME = { k: '廚房', l: '客廳', b: '廁所', s: '樓梯', u: '樓上房間' };
function navNearest(x, z, y = 0) { const r = roomOf(x, z, y); let best = null, bd = 1e9; for (const id in NAVN) { const n = NAVN[id]; if (roomOf(n.x, n.z, n.y) !== r) continue; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = id; } } return best; }
function navPath(from, to) {
  if (!from || !to) return null; if (from === to) return [to];
  const dist = { [from]: 0 }, prev = {}, open = new Set([from]);
  while (open.size) {
    let u = null, ud = 1e9; for (const n of open) if (dist[n] < ud) { ud = dist[n]; u = n; } open.delete(u); if (u === to) break;
    for (const e of NAVE[u]) { if (e.gate && !e.gate()) continue; const nd = ud + Math.hypot(NAVN[u].x - NAVN[e.to].x, NAVN[u].z - NAVN[e.to].z); if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; open.add(e.to); } }
  }
  if (dist[to] === undefined) return null; const p = [to]; let c = to; while (prev[c] && prev[c] !== from) { c = prev[c]; p.unshift(c); } p.unshift(from); return p;
}
const SEATS = {
  mtable: { x: -90, z: 12, yaw: 0, k: 'table', stand: 'mtable' },
  kid: { x: -90, z: 157, yaw: Math.PI, k: 'homework', y: 50, stand: 'kidstand' },
  toilet: { x: 400, z: -430, yaw: 0, k: 'toilet', y: 46, stand: 'toiletStand' },
  sofa: { x: 622, z: 112, yaw: Math.PI / 2, k: 'sofa', y: 50, stand: 'lsofa' },
  sofaM: { x: 622, z: 168, yaw: Math.PI / 2, k: 'sofa', y: 50, stand: 'lsofa' },
  udesk: { x: 495, z: -151, yaw: Math.PI, k: 'homework', y: 45, stand: 'udesk' },
  ubed: { x: 410, z: 118, yaw: Math.PI / 2, k: 'sofa', y: 48, stand: 'ubed' }
};
const MCOL = '#f4bb72', KCOL = '#e8a0c0';
function mkAgent(who) { return { who, q: [], cur: null, act: '', last: ['', '', ''], need: {}, react: 0, seat: null, after: null, idle: 0 }; }
function agentPos(A) { return A.who === 'mom' ? mom.pos : KID.pos; }
function agentRoom(A) { const P = agentPos(A); return roomOf(P.x, P.z, P.y); }
function brainSay(who, text, dur = 2.6) {
  const A = who === 'mom' ? HB.m : HB.k; if (!A) return; const k = who; if (HB.lastSay[k] && T - HB.lastSay[k] < 2.2) return; HB.lastSay[k] = T;
  const P = agentPos(A), name = who === 'mom' ? '太太' : '女兒', col = who === 'mom' ? MCOL : KCOL;
  if (NET.on) nsend({ t: 'bsay', n: name, x: text, c: col, d: dur, p: [P.x, P.z] });
  brainSayShow(name, text, col, dur, P.x, P.z);
}
function brainSayShow(n, x, c, d, px, pz) { if (window.__subs) window.__subs.push(n + '：' + x); const L = leader; if (L && Math.hypot(L.pos.x - px, L.pos.z - pz) > 760) return; say(n, x, c, d); }

// ---------- what they do ----------
const pick = a => a[(rnd() * a.length) | 0];
function bathSteps(who) {
  const kid = who === 'kid', S = [];
  if (kid) S.push({ say: pick(['我去一下廁所。', '媽，我去廁所～']) });
  S.push({ go: 'bswitch' }, { sw: 'blight', on: true }, { go: 'bathIn' }, { door: 'close' }, { go: 'toiletStand' }, { sit: 'toilet' }, { wait: R(9, 14), pose: 'toilet' }, { stand: 1 }, { sw: 'flush' },
    { go: 'bsink' }, { wait: 3.2, km: ['act', 'sink'], pose: 'wash', at: [215, 80, -460] }, { go: 'bathIn' }, { door: 'open' }, { go: 'bswitch' });
  if (kid && rnd() < .4) S.push({ fn: () => { HB.kidForgot = T; } }); else S.push({ sw: 'blight', on: false });
  return S;
}
const ACTS = {
  mom: {
    cook: { rate: 1 / 42, w: 1.1, steps: () => [{ go: 'stove' }, { sw: 'hood', on: true }, { wait: R(12, 20), km: ['act', 'stove'], at: [22, 96, -178], line: 'stove' }, ...(rnd() < .5 ? [{ sw: 'hood', on: false }] : [])] },
    wash: { rate: 1 / 62, w: 1, steps: () => [{ go: 'sink' }, { sw: 'tap', on: true }, { wait: R(7, 11), km: ['act', 'sink'], at: [-100, 72, -192], line: 'sink' }, { sw: 'tap', on: false }] },
    fridge: { rate: 1 / 95, w: .9, steps: () => [{ go: 'fridge' }, { wait: 2.8, km: ['fopen', 'fridge'], at: [191, 96, -186], line: 'fridge' }] },
    sit: { rate: 1 / 65, w: .95, ok: () => HB.k && HB.k.act === 'homework', steps: () => [{ go: 'mtable' }, { sit: 'mtable' }, { wait: R(9, 15), pose: 'table', line: 'table' }, { stand: 1 }] },
    bath: { rate: 1 / 170, w: 1.25, ok: () => !bathBusy(), steps: () => bathSteps('mom') },
    tidy: { rate: 1 / 80, w: .85, ok: () => LIV.open, steps: () => [{ go: 'llamp' }, { look: 3.5, at: [600, 70, 110] }, { go: 'lsofa' }, { sit: 'sofaM' }, { wait: R(6, 10), pose: 'sofa', at: [880, 96, 120] }, { stand: 1 }] },
    checkKid: { rate: 1 / 95, w: .75, ok: () => HB.k && agentRoom(HB.k) !== 'b', steps: () => [{ near: 'kid' }, { say: pick(['功課做完沒有？', '囡囡，記得喝水。', '早點做完功課，早點睡。']) }, { wait: 2.6, lookKid: 1, reply: pick(['快做完了……', '知道了～', '嗯。']) }] },
    phone: { rate: 1 / 75, w: 1, steps: () => [{ go: 'counter' }, { wait: R(7, 11), km: ['act', 'phone'], at: [-30, 60, -150], phone: 1, say2: pick(['……還是打不通。', '研究所說他今天沒有上班……', '再等一下，他會回來的。', '那間公司又打電話來了……']) }] },
    window: { rate: 1 / 120, w: .9, steps: () => [{ go: 'sink' }, { wait: R(5, 8), km: ['act', 'idle'], at: [-100, 150, -300], say2: pick(['……你到底去了哪裡。', '下雨了……他有帶傘嗎？']) }] },
    wipe: { rate: 1 / 85, w: .85, steps: () => [{ go: 'mtable' }, { wait: R(5, 8), km: ['act', 'sink'], at: [-120, 76, 80] }] },
    toys: { rate: 1 / 110, w: .8, steps: () => [{ go: 'toys' }, { look: R(4, 6), at: [250, 10, 120], low: true }, { say: pick(['又亂放玩具……', '這些玩具還是他買的。']) }] },
    recheck: { rate: 0, util: () => HB.sus >= 1.2 && HB.mem.length ? HB.sus * .4 : -1, steps: () => { const m = pick(HB.mem); const fy = m.p.y > 200 ? UPS.y : 0; return [{ say: pick(['剛才那邊……', '我再看看。', '好像是這裡……']) }, { go: navNearest(m.p.x, m.p.z, m.p.y) }, { look: 3 + HB.sus, at: [m.p.x, Math.min(m.p.y, fy + 60), m.p.z], low: HB.sus >= 2 }]; } },
    laundry: { rate: 1 / 150, w: .9, ok: () => LIV.open && !(HB.k && agentRoom(HB.k) === 'u'), steps: () => [{ go: 'uswitch' }, { sw: 'ulight', on: true }, { go: 'uward' }, { wait: R(6, 9), km: ['act', 'sink'], at: [880, 420, 92], say2: pick(['校服又要洗了……', '……他的外套還掛在這裡。']) }, { go: 'ubed' }, { look: R(3, 4.5), at: [380, 330, 150], low: true }, { go: 'uwin' }, { wait: R(4, 6), km: ['act', 'idle'], at: [620, 420, 400], say2: pick(['小熊還在窗口等……', '……你快點回來吧。']) }, { go: 'uswitch' }, { sw: 'ulight', on: false }] }
  },
  kid: {
    homework: { base: .55, repeat: true, steps: () => [{ go: 'kidstand' }, { sit: 'kid' }, { wait: R(14, 26), pose: 'homework' }] },
    bath: { rate: 1 / 115, w: 1.25, ok: () => !bathBusy(), steps: () => bathSteps('kid') },
    snack: { rate: 1 / 100, w: .9, steps: () => [{ say: '媽，有沒有雪糕？', reply: '吃完飯才吃！' }, { go: 'fridge' }, { wait: 3, km: ['fopen', 'fridge'], pose: 'fridge', at: [191, 96, -186] }, { say: '……那喝牛奶好了。' }] },
    toys: { rate: 1 / 90, w: .85, steps: () => [{ go: 'toys' }, { wait: R(5, 8), pose: 'pet', at: [250, 10, 120] }, { say: pick(['這個留給爸爸玩。', '小熊，你也想爸爸嗎？']) }] },
    askMom: { rate: 1 / 130, w: 1, ok: () => HB.m && agentRoom(HB.m) !== 'b' && HB.m.react < 2, steps: () => [{ near: 'mom' }, { say: pick(['媽，爸爸甚麼時候回來？', '媽，爸爸今天會打電話來嗎？']), reply: pick(['……很快就回來了。', '……他很忙，乖。']) }, { wait: 3, pose: 'stand', lookMom: 1 }] },
    cat: { rate: 1 / 80, w: .8, steps: () => [{ say: '小橘～過來～' }, { go: 'catspot' }, { wait: R(4, 7), pose: 'pet', lookCat: 1 }] },
    tv: { rate: 1 / 58, w: 1.15, ok: () => LIV.open, steps: () => [{ ask: 1 }, { go: 'lsofa' }, { sit: 'sofa' }, { sw: 'tv', on: true }, { wait: R(20, 34), pose: 'sofa', at: [888, 96, 120] }, { tvEnd: 1 }, { stand: 1 }] },
    room: { rate: 1 / 105, w: 1.05, ok: () => LIV.open, steps: () => roomSteps() }
  }
};
function bathBusy() { for (const A of [HB.m, HB.k]) if (A && A.act === 'bath' && agentRoom(A) === 'b') return true; return false; }

// ---------- reacting to what players do ----------
function brainIncident(id, o, on, by) {
  if (NET.client || !HB.m) return;
  const add = { klight: .55, tap: .55, hood: .35, blight: .35, flush: .8, tv: .3, lamp: .4, ulight: .3, udesk: .25, ustar: .3, umusic: .45 }[id] || .3;
  const rep = HB.inc.filter(i => i.id === id && T - i.t < 60).length;
  brainSus(add * (1 + rep * .6), o.p);
  HB.inc.push({ id, t: T, p: o.p.clone() }); if (HB.inc.length > 20) HB.inc.shift();
  const M = HB.m, K = HB.k, mr = agentRoom(M), kr = K ? agentRoom(K) : '';
  const look = [{ look: 1.5 + HB.sus * .8, at: [o.p.x, (o.p.y > 200 ? UPS.y : 0) + 40, o.p.z], low: HB.sus >= 2 }];
  if (id === 'klight' && !on) {
    react(M, 3, [{ say: pick(HB.sus > 1.5 ? ['又熄燈？誰在玩開關？', '這燈今天是怎麼了……'] : ['咦？燈怎麼熄了？', '跳掣了？']) }, { go: 'kswitch' }, { sw: 'klight', on: true }, ...look]);
    if (K && kr === 'k') setTimeout(() => brainSay('kid', '媽！好黑呀！'), 900);
  } else if (id === 'tap' && on) react(M, 3, [{ say: pick(['誰開了水龍頭？', '水龍頭怎麼開着……']) }, { go: 'sink' }, { sw: 'tap', on: false }, ...look]);
  else if (id === 'hood') {
    if (!on && M.act === 'cook') react(M, 3, [{ say: '抽油煙機怎麼停了？' }, { go: 'stove' }, { sw: 'hood', on: true }]);
    else if (on && M.act !== 'cook') later(M, [{ go: 'stove' }, { sw: 'hood', on: false }, { say: '咦？誰開了抽油煙機？' }]);
  } else if (id === 'blight') {
    const inside = bathOccupant();
    if (!on && inside) { if (inside === K) { brainSay('kid', '媽！廁所的燈熄了！好黑呀！'); react(M, 3, [{ go: 'bswitch' }, { sw: 'blight', on: true }, { say: '……開關壞了嗎？' }]); } }
    else if (on && !inside) later(M, [{ say: '廁所燈怎麼開着……' }, { go: 'bswitch' }, { sw: 'blight', on: false }, ...(HB.sus >= 1 ? [{ go: 'bathIn' }, { look: 3, at: [330, 40, -380] }] : [])]);
  } else if (id === 'flush' && !bathOccupant()) {
    react(M, 3, [{ say: pick(['誰在廁所？', '剛才誰沖廁所了？']) }, { go: 'bathIn' }, { look: 3 + HB.sus, at: [400, 30, -420], low: HB.sus >= 1.5 }, { say: '……沒有人？' }]);
    if (K && K.act !== 'bath') setTimeout(() => brainSay('kid', '不是我呀！'), 1600);
  } else if (id === 'tv') {
    if (on && K && K.act === 'homework') { brainSay('kid', '咦？電視自己開了？'); if (mr !== 'l' && rnd() < .55) { setTimeout(() => brainSay('mom', '功課做完才看電視！'), 1400); later(M, [{ go: 'ltv' }, { sw: 'tv', on: false }]); } else react(K, 2, ACTS.kid.tv.steps().slice(1), 'tv'); }
    else if (on && (!K || K.act !== 'tv')) later(M, [{ go: 'ltv' }, { sw: 'tv', on: false }, { say: '誰開的電視……' }]);
    else if (!on && K && K.act === 'tv') react(K, 3, [{ say: '怎麼熄了？我在看呀！' }, { stand: 1 }, { go: 'ltv' }, { sw: 'tv', on: true }, { go: 'lsofa' }, { sit: 'sofa' }, { wait: R(10, 18), pose: 'sofa', at: [888, 96, 120] }, { stand: 1 }], 'tv');
  } else if (id === 'lamp' && !on) {
    const who = K && kr === 'l' ? K : M, st = [{ say: who === K ? '盞燈怎麼熄了……' : '燈泡壞了？' }, { go: 'llamp' }, { sw: 'lamp', on: true }];
    if (who === M && mr !== 'l') later(M, st); else react(who, 2, st);
  } else upIncident(id, o, on, M, K, mr, kr, look);
}
// a noise somewhere (something knocked over, a pebble …)
function brainHear(p, loud = 1) {
  if (NET.client || !HB.m) return; const M = HB.m;
  if (HX.id.hood && HX.id.hood.on && roomOf(p.x, p.z, p.y) === 'k' && (loud < .7 || rnd() < .4)) return;   // the hood drowns small noises out
  if (M.react >= 3 || (M.act === 'bath' && M.seat)) return;
  brainSus(.3, p); const n = navNearest(p.x, p.z, p.y);
  react(M, 2, [{ say: pick(['什麼聲音？', '咦？', '誰？']) }, { go: n }, { look: 2.8 + HB.sus * .7, at: [p.x, Math.max(p.y, 10), p.z], low: HB.sus >= 1.5 }, { fn: () => brainSay('mom', CAT.pos && CAT.pos.distanceTo(p) < 90 ? '小橘，又是你？' : pick(['……奇怪。', '是我聽錯了嗎……'])) }]);
}
// they caught a glimpse of someone
function brainGlimpse(p) { if (NET.client || !HB.m || T - HB.glT < 4) return; HB.glT = T; brainSus(.28, p); }
function brainSus(v, p) {
  HB.sus = Math.min(3.4, HB.sus + v); HB.quiet = 0; if (p) { HB.mem.push({ p: p.clone(), t: T }); if (HB.mem.length > 6) HB.mem.shift(); }
  const st = HB.sus >= 3 ? 3 : HB.sus >= 2 ? 2 : HB.sus >= 1 ? 1 : 0;
  if (st > HB.stage) {
    HB.stage = st;
    if (st === 1) setTimeout(() => brainSay('mom', '今天家裡怪怪的……', 2.8), 2500);
    if (st === 2) setTimeout(() => brainSay('mom', '好像有東西在家裡跑來跑去……', 3), 2500);
    if (st === 3 && !HB.search) brainSearch();
  }
}
function brainSearch() {
  HB.search = 38; const M = HB.m, K = HB.k;
  setTimeout(() => brainSay('mom', '囡囡，過來幫媽媽找找——家裡好像有老鼠！', 3.2), 600);
  setTimeout(() => brainSay('kid', '老鼠？！好恐怖……', 2.4), 3600);
  const spots = () => { const s = HB.mem.slice(-4).map(m => m.p); for (const id of ['stove', 'fridge', 'kmid', 'bathK', 'lsofa']) if (s.length < 5) s.push(V3(NAVN[id].x, 20, NAVN[id].z)); return s.sort(() => rnd() - .5).slice(0, 4); };
  const steps = sp => sp.flatMap(p => { const n = navNearest(p.x, p.z, p.y); return n ? [{ go: n }, { look: 3.2, at: [p.x, (p.y > 200 ? UPS.y : 0) + 8, p.z], low: true }] : []; });
  react(M, 4, steps(spots()), 'search');
  if (K && agentRoom(K) !== 'b') react(K, 4, steps(spots()), 'search');
}
// interrupt what she's doing (tidying up after herself first) — or queue it if she can't stop right now
function react(A, pri, steps, act = 'react') {
  if (!A) return;
  if (A.react >= pri || (A.act === 'bath' && agentRoom(A) === 'b' && A.act !== act)) { later(A, steps); return; }
  const pre = [];
  if (A.who === 'mom' && A.act === 'wash' && HX.id.tap && HX.id.tap.on) pre.push({ sw: 'tap', on: false });
  if (A.seat) pre.push({ stand: 1 });
  A.q = [...pre, ...steps]; A.cur = null; A.react = pri; A.act = act;
}
function later(A, steps) { if (!A) return; (A.pend = A.pend || []).push(steps); if (A.pend.length > 3) A.pend.shift(); }
// before choosing what to do next: put right anything in the house that's not as it should be
function brainChores(A) {
  const H = HX.id; if (!H.klight) return null; const r = agentRoom(A), seesK = r === 'k' || (r === 'l' && LIV.open), K = HB.k;
  if (A.who === 'kid') { if (r === 'l' && !H.lamp.on) return [{ go: 'llamp' }, { sw: 'lamp', on: true }]; if (r === 'u' && H.umusic.on) return [{ go: 'ushelf' }, { sw: 'umusic', on: false }]; return null; }
  const kidUp = K && agentRoom(K) === 'u';
  if (LIV.open && H.umusic && H.umusic.on && !kidUp) return [{ say: pick(['樓上的音樂盒怎麼響着……', '咦？音樂盒？']) }, { go: 'ushelf' }, { sw: 'umusic', on: false }];
  if (r === 'u' && !kidUp) { if (H.udesk.on) return [{ go: 'udesk' }, { sw: 'udesk', on: false }]; if (H.ustar.on) return [{ say: '囡囡又忘了關星星燈。' }, { go: 'unight' }, { sw: 'ustar', on: false }]; if (H.ulight.on) return [{ go: 'uswitch' }, { sw: 'ulight', on: false }]; }
  if (!H.klight.on && seesK) return [{ say: pick(['燈怎麼又熄了……', '咦？']) }, { go: 'kswitch' }, { sw: 'klight', on: true }];
  if (H.tap.on && r === 'k') return [{ say: '水龍頭怎麼還開着！' }, { go: 'sink' }, { sw: 'tap', on: false }];
  if (H.blight.on && !bathOccupant() && r === 'k') { const kid = HB.kidForgot && T - HB.kidForgot < 90; HB.kidForgot = 0; return [{ say: kid ? '囡囡！廁所燈又沒關！' : '……誰沒關廁所燈？', reply: kid ? '對不起～' : undefined }, { go: 'bswitch' }, { sw: 'blight', on: false }]; }
  if (LIV.open && !H.lamp.on && (r === 'l' || rnd() < .3)) return [{ go: 'llamp' }, { sw: 'lamp', on: true }];
  if (LIV.open && H.tv.on && (!K || K.act !== 'tv') && (r === 'l' || rnd() < .35)) return [{ go: 'ltv' }, { sw: 'tv', on: false }, { say: '沒人看就關電視。' }];
  if (H.hood.on && r === 'k' && rnd() < .5) return [{ go: 'stove' }, { sw: 'hood', on: false }];
  return null;
}

// ---------- running the steps ----------
const _bv = V3();
function walkA(A, x, z, sp, dt) {
  const P = agentPos(A), dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz), st = sp * dt;
  if (d < st + .5) { P.x = x; P.z = z; return [true, d]; }
  P.x += dx / d * st; P.z += dz / d * st; setYaw(A, Math.atan2(dx, dz), 5, dt);
  if (A.who === 'mom') mom.aimT.set(P.x + dx / d * 150, P.y, P.z + dz / d * 150); else KID.lookP.set(P.x + dx / d * 120, P.y + 40, P.z + dz / d * 120);
  return [false, st];
}
function setYaw(A, y, k, dt) { if (A.who === 'mom') mom.yaw = angDamp(mom.yaw, y, k, dt); else KID.byaw = angDamp(KID.byaw, y, k, dt); }
function lookAt(A, p) { if (A.who === 'mom') mom.aimT.copy(p); else KID.lookP.copy(p); }
function setPose(A, pose, km) { if (A.who === 'mom') { if (km) { KM.mode = km[0]; KM.pt = km[1]; } } else KID.pose = pose; }
function brainStep(A, dt) {
  let moveD = 0; const P = agentPos(A);
  if (!A.cur) A.cur = A.q.shift() || null;
  const s = A.cur;
  if (!s) { brainChoose(A); return 0; }
  const done = () => { A.cur = null; };
  if (s.go !== undefined) {
    if (!s.path) { s.path = navPath(navNearest(P.x, P.z, P.y), s.go); if (!s.path) { done(); return 0; } }
    const n = NAVN[s.path[0]]; const sp = A.who === 'mom' ? (A.react >= 2 ? 96 : 76) : (A.react >= 2 ? 72 : 56);
    const [ok, d] = walkA(A, n.x, n.z, sp, dt); moveD = d; setPose(A, 'walk', ['goto', s.go]);
    if (ok) { s.path.shift(); if (!s.path.length) done(); }
  } else if (s.near) {
    const T2 = s.near === 'kid' ? HB.k : HB.m; const tp = agentPos(T2); if (!s.path) s.path = navPath(navNearest(P.x, P.z, P.y), navNearest(tp.x, tp.z, tp.y)) || [];
    if (s.path.length) { const n = NAVN[s.path[0]]; const [ok, d] = walkA(A, n.x, n.z, 76, dt); moveD = d; setPose(A, 'walk', ['goto', 'near']); if (ok) s.path.shift(); } else done();
  } else if (s.sit) {
    const S = SEATS[s.sit]; if (!s.from) { s.from = P.clone(); s.k = 0; }
    s.k = Math.min(1, s.k + dt / .7); P.x = lerp(s.from.x, S.x, s.k); P.z = lerp(s.from.z, S.z, s.k); setYaw(A, S.yaw, 8, dt); A.seat = S;
    setPose(A, S.k === 'homework' ? 'homework' : S.k, ['act', S.k === 'homework' ? 'table' : S.k]); if (A.who === 'kid') KID.seatY = S.y || 50;
    if (s.k >= 1) done();
  } else if (s.stand) {
    const S = A.seat; if (!S) { done(); return 0; } const st = NAVN[S.stand]; if (!s.from) { s.from = P.clone(); s.k = 0; }
    s.k = Math.min(1, s.k + dt / .6); P.x = lerp(s.from.x, st.x, s.k); P.z = lerp(s.from.z, st.z, s.k); setPose(A, 'stand', ['goto', 'stand']);
    if (s.k >= 1) { A.seat = null; done(); }
  } else if (s.wait !== undefined || s.look !== undefined) {
    const t = s.wait ?? s.look; s.tl = (s.tl ?? t) - dt;
    if (s.look !== undefined) {
      const a = s.at ? V3(...s.at) : P.clone().add(V3(Math.sin(A.who === 'mom' ? mom.yaw : KID.byaw) * 100, 40, Math.cos(A.who === 'mom' ? mom.yaw : KID.byaw) * 100));
      const sw = Math.sin(T * 1.3) * 45; const lp = V3(a.x + Math.cos(T * .7) * sw, s.low ? Math.max(0, a.y - 30 + Math.sin(T * 2) * 8) : a.y, a.z + Math.sin(T * .9) * sw);
      lookAt(A, lp); setYaw(A, Math.atan2(a.x - P.x, a.z - P.z), 2.4, dt); setPose(A, 'look', ['look', 'look']);
    } else {
      // doing something in place
      setPose(A, s.pose || 'stand', s.km || ['act', s.pose || 'stand']);
      if (s.at) { const a = V3(...s.at); lookAt(A, a); if (!A.seat) setYaw(A, Math.atan2(a.x - P.x, a.z - P.z), 4, dt); }
      if (s.lookKid && HB.k) { const kp = KID.head.getWorldPosition(_bv); lookAt(A, kp.clone()); setYaw(A, Math.atan2(kp.x - P.x, kp.z - P.z), 3, dt); }
      if (s.lookMom) { const mp = mom.head.getWorldPosition(_bv); lookAt(A, mp.clone()); setYaw(A, Math.atan2(mp.x - P.x, mp.z - P.z), 3, dt); }
      if (A.who === 'mom') { mom.phone.visible = !!s.phone; if (mom.lens) mom.lens.visible = false; }
      if (!s.say2Done && s.say2 && s.tl < (s.wait ?? 0) - 2) { s.say2Done = 1; if (!HB.said[s.say2]) { HB.said[s.say2] = 1; brainSay(A.who, s.say2, 3.2); } }
      if (s.lookCat && CAT.pos) { lookAt(A, V3(CAT.pos.x, 4, CAT.pos.z)); setYaw(A, Math.atan2(CAT.pos.x - P.x, CAT.pos.z - P.z), 3, dt); }
      if (s.km && s.km[0] === 'fopen') HB.fridgeHold = .3;
      if (!s.lineDone && s.line && A.who === 'mom') { s.lineDone = 1; momLineK(s.line); }
      if (!s.replyDone && s.reply && s.tl < t - .9) { s.replyDone = 1; brainSay(A.who === 'mom' ? 'kid' : 'mom', s.reply); }
    }
    if (s.tl <= 0) done();
  } else if (s.sw) {
    const o = HX.id[s.sw]; if (!o) { done(); return 0; }
    if (s.sw !== 'flush' && o.on === s.on && !s.t) { done(); return 0; }
    if (!s.t && (Math.abs(o.p.y - P.y) > 200 || Math.hypot(o.p.x - P.x, o.p.z - P.z) > 300)) { done(); return 0; }
    s.t = (s.t || 0) + dt; lookAt(A, o.p); setYaw(A, Math.atan2(o.p.x - P.x, o.p.z - P.z), 6, dt); setPose(A, 'press', ['press', s.sw]);
    if (s.t > .45 && !s.fired) { s.fired = 1; hxSet(o, s.sw === 'flush' ? true : s.on, A.who); }
    if (s.t > .8) done();
  } else if (s.say) { brainSay(A.who, s.say); if (s.reply) { const r = s.reply; setTimeout(() => brainSay(A.who === 'mom' ? 'kid' : 'mom', r), 1500); } done(); }
  else if (s.door) { HX.bd.tgt = s.door === 'close' ? 0 : 1.35; done(); }
  else if (s.fn) { s.fn(); done(); }
  else if (s.ask) {
    // the daughter asks to watch TV; Mom may say no
    const M = HB.m; if (M && agentRoom(M) === 'k' && M.react < 2 && rnd() < .5) { brainSay('kid', '媽，我可以看一會兒電視嗎？'); setTimeout(() => brainSay('mom', '功課做完才可以！'), 1500); A.q = [{ wait: 1.6, pose: A.seat ? 'homework' : 'stand' }]; A.need.tv = .2; A.act = 'homework'; } else brainSay('kid', pick(['我休息一下～', '看一會兒就好……']));
    done();
  } else if (s.tvEnd) { if (rnd() < .6) hxSet(HX.id.tv, false, 'kid'); if (HB.m && agentRoom(HB.m) === 'k') { brainSay('mom', '囡囡，回來做功課！'); setTimeout(() => brainSay('kid', '知道了……'), 1400); } done(); }
  else done();
  return moveD;
}
function brainChoose(A) {
  if (A.react === 4) { HB.search = 0; }
  A.react = 0;
  if (A.pend && A.pend.length) { A.q = A.pend.shift(); A.act = 'react'; A.react = 1; if (A.seat) A.q.unshift({ stand: 1 }); return; }
  if (!HB.search) { const c = brainChores(A); if (c) { A.q = A.seat ? [{ stand: 1 }, ...c] : c; A.act = 'chore'; A.react = 1; return; } }
  if (A.who === 'mom' && mom.phone) mom.phone.visible = false;
  const L = ACTS[A.who]; let best = null, bu = -1;
  for (const k in L) {
    const D = L[k]; if (k === A.last[0] && !D.repeat) continue; if (D.ok && !D.ok()) continue;
    let u = D.util ? D.util() : D.base !== undefined ? D.base - (A.need.bored || 0) * .25 : (A.need[k] || 0) * D.w; if (u < 0) continue;
    u += rnd() * .3 - (k === A.last[1] ? .3 : 0) - (k === A.last[2] ? .15 : 0); if (u > bu) { bu = u; best = k; }
  }
  if (!best) best = A.who === 'mom' ? 'cook' : 'homework';
  A.last = [best, A.last[0], A.last[1]]; A.act = best; A.need[best] = 0; if (best === 'tv' || best === 'cat') A.need.bored = 0;
  let steps = L[best].steps();
  // already sitting where this starts (homework → homework): skip walking there
  if (A.seat && steps[1] && steps[1].sit && SEATS[steps[1].sit] === A.seat) steps = steps.slice(2);
  else if (A.seat) steps.splice(steps[0] && steps[0].ask ? 1 : 0, 0, { stand: 1 });
  A.q = steps; A.cur = null;
}
function brainNeeds(A, dt) {
  for (const k in ACTS[A.who]) { const D = ACTS[A.who][k]; if (!D.rate || k === A.act) continue; A.need[k] = Math.min(1.6, (A.need[k] || 0) + D.rate * dt); }
  if (A.who === 'kid' && A.act === 'homework') A.need.bored = Math.min(1.5, (A.need.bored || 0) + dt / 50);
}
// set up when the kitchen is prepared (dinner: Mom at the stove, the daughter doing homework)
function brainReset() {
  HB.sus = 0; HB.stage = 0; HB.search = 0; HB.inc = []; HB.mem = []; HB.quiet = 0; HB.kidForgot = 0; HB.lastSay = {};
  const M = HB.m = mkAgent('mom'); M.act = 'cook'; M.last = ['cook', '', '']; M.q = [{ wait: 10, km: ['act', 'stove'], at: [22, 96, -178] }];
  M.need = { wash: .3, fridge: .4, sit: .2, bath: R(0, .4), tidy: .2, checkKid: .1, phone: .45, window: .1, wipe: .15, toys: .1 };
  const K = HB.k = mkAgent('kid'); K.act = 'homework'; K.last = ['homework', '', '']; K.seat = SEATS.kid; K.q = [{ wait: R(12, 18), pose: 'homework' }];
  K.need = { bath: R(.1, .5), snack: R(.2, .5), cat: R(.2, .6), tv: .3, bored: .3, toys: .3, askMom: .25 };
  KID.pos = KID.root.position; KID.fy = 0; mom.fy = 0; KID.byaw = Math.PI; KID.pose = 'homework'; KID.seatY = 50; KID.sitK = 1; KID.lookP = V3(-90, 76, 112);
  HX.bd.tgt = 1.35; HB.eye = 1;
}
function brainMom(dt) { if (!HB.m) brainReset(); brainNeeds(HB.m, dt); return brainStep(HB.m, dt); }
function brainKid(dt) { if (!HB.k) brainReset(); brainNeeds(HB.k, dt); return brainStep(HB.k, dt); }
// once a frame on the host: cool down, keep the fridge door open while someone's at it
function brainTick(dt) {
  if (!HB.m) return;
  HB.quiet += dt; if (HB.quiet > 18 && HB.sus > 0) { HB.sus = Math.max(0, HB.sus - dt / 40); if (HB.sus < HB.stage - .6) { if (HB.stage >= 2 && HB.sus < 1.4) brainSay('mom', '……算了，大概是我太累了。', 2.6); HB.stage = Math.floor(HB.sus); } }
  if (HB.search > 0) { HB.search -= dt; if (HB.search <= 0) { HB.sus = Math.min(HB.sus, 2.2); HB.stage = 2; brainSay('mom', '找不到……先吃飯吧。', 2.6); } }
  HB.eye = 1 + HB.sus * .13;
}
function bathOccupant() { for (const A of [HB.m, HB.k]) if (A && agentRoom(A) === 'b' && A.act === 'bath') return A; return null; }
// what the "eye" panel says: where they are and how suspicious
const ACT_LABEL = { room: '回房間', laundry: '執女兒房', chore: '執手尾', phone: '打電話', window: '望出窗', wipe: '抹枱', toys: '執玩具', askMom: '問媽媽', cook: '煮飯', wash: '洗碗', fridge: '開雪櫃', sit: '坐低', bath: '用廁所', tidy: '執屋', checkKid: '睇女', recheck: '四處查看', lightOff: '關燈', react: '查看', search: '搜屋', homework: '做功課', snack: '搵嘢食', cat: '逗貓', tv: '睇電視' };
function brainEyeText() {
  if (meter > .3) return '她們在看這邊！快躲進影子裡';
  if (HB.search > 0 || HB.netSearch) return '她們在搜屋！先躲好';
  const s = NET.client ? (HB.netSus || 0) : HB.sus;
  const where = (A, n) => { const P = A === 'm' ? mom.pos : KID.root.position; return `${n}在${ROOM_NAME[roomOf(P.x, P.z, P.y)]}`; };
  const pre = s >= 2 ? '太太起了疑心 · ' : s >= 1 ? '太太覺得家裡怪怪的 · ' : '';
  return pre + where('m', '太太') + ' · ' + where('k', '女兒');
}
// network: the daughter's body and the household mood
function brainNet() { return [+HB.sus.toFixed(2), HB.search > 0 ? 1 : 0, +AGB.sus.toFixed(2) + (AGB.search > 0 ? 10 : 0)]; }
function brainNetRecv(b) { HB.netSus = b[0]; HB.netSearch = !!b[1]; if (b[2] !== undefined) AGB.netSus = b[2] >= 10 ? 3 : b[2]; }

// the daughter's body: sitting, standing, walking, reaching, crouching to the cat
function kidBody(dt, moveD) {
  const H = KID, pose = H.pose || 'homework', sitting = pose === 'homework' || pose === 'toilet' || pose === 'sofa';
  { const RP = H.root.position; RP.y = H.fy = humanFloor(RP.x, RP.z, H.fy || 0); }
  H.sitK = damp(H.sitK ?? 1, sitting ? 1 : 0, 6, dt); const sk = H.sitK;
  const prev = H.ph || 0; H.ph = prev + moveD / 30 * Math.PI; const walking = moveD > 0; H.amp = damp(H.amp || 0, walking ? 1 : 0, 9, dt); const a = H.amp;
  const crouch = pose === 'pet' ? 1 : 0; H.crK = damp(H.crK || 0, crouch, 5, dt);
  H.pelvis.position.y = lerp(lerp(61 + Math.abs(Math.cos(H.ph)) * 1.4 * a, 40, H.crK), H.seatY || 50, sk);
  for (const L of H.legs) {
    const sw = Math.sin(H.ph) * L.s * .55 * a;
    L.hip.rotation.x = lerp(lerp(-sw, -1.2, H.crK), -1.45, sk);
    L.knee.rotation.x = lerp(lerp(.05 + Math.max(0, Math.cos(H.ph) * L.s) * .85 * a, 2.1, H.crK), pose === 'homework' ? 1.5 + Math.sin(T * 2.2 + L.s * 1.6) * .25 : 1.45, sk);
  }
  H.chest.rotation.x = damp(H.chest.rotation.x, pose === 'homework' ? .22 : pose === 'pet' ? .55 : pose === 'fridge' || pose === 'wash' ? .25 : sitting ? .08 : .04 + a * .05, 6, dt);
  const A0 = H.arms[0], A1 = H.arms[1]; const set = (A, x, y, e) => { A.sh.rotation.x = damp(A.sh.rotation.x, x, 8, dt); A.sh.rotation.y = damp(A.sh.rotation.y, y, 8, dt); A.el.rotation.x = damp(A.el.rotation.x, e, 8, dt); };
  if (pose === 'homework') { A1.sh.rotation.set(-.95 + Math.sin(T * 6) * .03, .3, 0); A1.el.rotation.x = -.9 + Math.sin(T * 9) * .04; A0.sh.rotation.set(-1, -.3, 0); A0.el.rotation.x = -.8; }
  else if (pose === 'press') { set(A1, -1.25, .1, -.3); set(A0, .05, 0, -.2); }
  else if (pose === 'pet') { set(A1, -1.1 + Math.sin(T * 5) * .15, .2, -.3); set(A0, -.9, -.2, -.3); }
  else if (pose === 'fridge' || pose === 'wash') { set(A1, -1.2, .15, -.4); set(A0, pose === 'wash' ? -1.2 : -.3, -.15, -.4); }
  else if (pose === 'sofa' || pose === 'toilet') { set(A1, -.6, .2, -.9); set(A0, -.6, -.2, -.9); }
  else { const s = Math.sin(H.ph) * .45 * a; set(A0, s, 0, -.3); set(A1, -s, 0, -.3); }
  if (H.pen) H.pen.visible = pose === 'homework';
  H.root.rotation.y = H.byaw ?? Math.PI;
  // footsteps: lighter than Mom's, still enough to flatten a tiny person
  if (walking && Math.floor(prev / Math.PI) !== Math.floor(H.ph / Math.PI) && leader) {
    const P = H.root.position, d = Math.hypot(leader.pos.x - P.x, leader.pos.z - P.z);
    SND.thud(clamp(.75 - d / 420, .04, .6)); cam.shake = Math.max(cam.shake, clamp(1 - d / 160, 0, 1) * .45);
    if (STATE === 'play' && d < 11 && leader.pos.y - P.y < 6 && leader.pos.y - P.y > -3 && mine(leader)) knock(leader, P.clone(), '差點被女兒踩到！');
  }
}
// what clients get: head + body + pose
const KPOSE = ['homework', 'stand', 'walk', 'toilet', 'sofa', 'press', 'pet', 'fridge', 'wash'];
function kidNet() { const P = KID.root.position; return [+KID.yaw.toFixed(3), +KID.pitch.toFixed(3), +P.x.toFixed(1), +P.z.toFixed(1), +(KID.byaw ?? Math.PI).toFixed(3), Math.max(0, KPOSE.indexOf(KID.pose)), +(KID.seatY || 50).toFixed(1), +(KID.fy || 0).toFixed(1)]; }
function kidNetApply(dt) {
  const w = NET.npc; if (!w || !w.k || w.k.length < 7) return 0; const k = w.k, P = KID.root.position, ox = P.x, oz = P.z;
  const dx = k[2] - P.x, dz = k[3] - P.z; if (dx * dx + dz * dz > 3600) { P.x = k[2]; P.z = k[3]; } else { const f = 1 - Math.exp(-8 * dt); P.x += dx * f; P.z += dz * f; }
  KID.byaw = angDamp(KID.byaw ?? Math.PI, k[4], 8, dt); KID.pose = KPOSE[k[5]] || 'homework'; KID.seatY = k[6]; if (k[7] !== undefined) KID.fy = k[7];
  return Math.hypot(P.x - ox, P.z - oz) > .05 && KID.pose === 'walk' ? Math.hypot(P.x - ox, P.z - oz) : 0;
}
