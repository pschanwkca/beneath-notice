// =====================================================================
//  第七章 · 學校 — the story: quests, the three films, the way in and out
//  · the street and the gate (lesson time: the playground's empty, the guard reads his paper)
//  · the bell: break! (film: the class pours out — and spots 跳跳, who ends up hiding in the drain)
//  · in through the open doors while everyone's out; wait in the corridor for the class to go back in
//  · 3A: her cubby (22) at the back (film: her essay "My Dad" pinned above it; the notebook, and the
//    backup password inside its cover — her birthday)
//  · out of the window at the back (film: meanwhile at home the core goes dark, and Origin Dynamics
//    finds the ex-partner at the mouse hole). End of chapter seven.
// =====================================================================
const SC_Q = [
  { t: '過馬路，到學校門口', s: '走斑馬線。保安伯伯就在閘門旁邊的崗亭裡' },
  { t: '從閘門底下鑽進學校', s: '閘門底有一條縫。保安伯伯看報紙的時候最安全' },
  { t: '穿過操場，去教學大樓', s: '上課時間，大門關着' },
  { t: '趁小息，從大門溜進走廊', s: '大門開着。坑渠蓋下面可以一路走到大門前（有三個缺口）；有蓋操場的柱和長椅擋得一擋' },
  { t: '躲在走廊，等同學回課室', s: '三年甲班鎖着門。鐘聲一響，同學排隊回課室——後門會開一陣。儲物櫃底下可以躲' },
  { t: '找女兒的儲物格', s: '課室後面，22 號，貼着小老鼠貼紙的那一格。老師轉身寫黑板時最安全；書枱底下也可以躲' },
  { t: '從後面的窗口離開', s: '窗口底部開了一條縫。爬上窗邊的書架' }
];
const inClass = p => p.x > SC_CLASS.x0 && p.x < SC_CLASS.x1 && p.z > SC_CLASS.z0 + 4 && p.z < SC_CLASS.z1;
const inCorr = p => p.x > SC_CORR.x0 && p.x < SC_CORR.x1 && p.z > SC_CORR.z0 && p.z < SC_CORR.z1 + 8;
const atCubby = C => Math.abs(C.pos.x - (SC.cubby.x0 + 20)) < 26 && Math.abs(C.pos.z - SC_CUBBY.z) < 44 && C.pos.y > GY + 4 && C.pos.y < GY + 40;

function scReset() {
  SC.phase = 'class'; SC.pt = 0; SC.cycle = 0; SC.backHold = 0; SC.films = {}; SC.gotBook = false;
  for (const k of SC.kids) { k.mode = 'seat'; k.wait = 0; k.glance = 0; k.v = 110; k.H.root.visible = true; k.H.pos.set(k.seat.x - 4, GY, k.seat.z); }
  const S = SC.tch; if (S) { S.mode = 'face'; S.wait = 0; S.t = R(4, 7); S.walked = 0; S.H.pos.set(1748, GY, 5500); S.H.yaw = Math.PI / 2; }
  SC.her = { mode: 'seat', path: null, pi: 0, wait: 0 };
  for (const d of [SC.doors.main, SC.doors.back]) if (d) { d.open = d.want = 0; }
  if (SC.bookLid) SC.bookLid.rotation.z = 0;
}
// the quest number in the chapter's own terms (online, the school's quests sit at the end of one long shared list)
function scQ() { return NET.on ? quest - MPQ_SCHOOL : quest; }
function scJoin(id) {
  const K = chars[id]; if (!K || party.includes(K) || NET.on) return;
  const L = leader; K.pos.set(L.pos.x + R(-12, 12), L.pos.y, L.pos.z - R(6, 14)); K.yaw = L.yaw; crewJoin(id, true); if (K.disp) K.disp.copy(K.pos);
}

LEVELS.school = {
  chapter: '第七章', title: '學校', mpChapter: '第六章（多人）', env: 'park', envI: 1, fog: [0xbcd0e2, .00012], expo: .95, bloom: [.3, 2.4],
  dust: { N: 500, box: [1716, 2500, GY, GY + 300, 5196, 5820], beamFrac: 0, door: false },
  get toys() { return NET.on; },   // alone, being seen ends the try; online, teammates can shake you awake
  npcNear: true, build: buildSchool,
  cps: [[2060, GY, 3800], [2060, GY, 4345], [1020, SC_DRAIN.y, 4875], [2380, GY, 5040], [2470, GY, 5240], [2400, GY + 91, 5810]],
  quests: SC_Q,
  spawn() {
    if (!NET.on) { crewJoin('bat', true); crewJoin('tort', true); } spawnSP(this.cps[0], Math.PI, 5);
    if (!NET.on) { scJoin('mole'); scJoin('rab'); }
    if (!GS.latch) GS.latch = true; if (!LIV.ventOpen) { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; }
    YS.chip = true; if (YS.chipM) { YS.chipM.visible = false; YS.chipHalo.visible = false; } PK.chipGot = true; PK.charged = true;
    scReset();
  },
  enter(prev, again) {
    if (!again && !NET.on && prev === 'park' && STATE === 'play') unlockKey('ch6');
    if (again || NET.on) return;
    if (prev === 'park') { scReset(); scJoin('rab'); }
    setTimeout(() => say('爸爸', '楓林小學……她就在裡面。我把備份密碼藏在她的筆記簿裡——要拿回來。', '#f5f0e6', 4.4), 1400);
  },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'frozen' || STATE === 'end') scNPC(dt); },
  detect: detectSchool, hear: scHear, seen: scSeen,
  update(dt) {
    lvT += dt; if (NET.on) return; const L = leader, p = L.pos;
    if (quest === 0 && p.z > 4186) setQuest(1);
    if (quest <= 1 && p.z > 4330) setQuest(2);
    if (quest === 2) { SC.yardT = (SC.yardT || 0) + dt; if ((p.z > 4440 || SC.yardT > 7) && !SC.films.recess) { SC.films.recess = 1; scFilm(FILM_RECESS); } }
    if (quest === 3 && inCorr(p)) { setQuest(4); if (SC.phase === 'recess' && SC.pt < 60) SC.pt = 60; }   // once you're in, the bell isn't far off (no long wait)
    if (quest >= 2 && quest <= 4 && inClass(p) && SC.films.recess) setQuest(5);
    if (quest === 5 && atCubby(L) && !SC.films.essay) { SC.films.essay = 1; scFilm(FILM_ESSAY); }
    if (quest === 6 && p.z > SC_WIN.z + 30 && p.y < GY + 30 && !SC.films.end) { SC.films.end = 1; scFilm(FILM_END); }
    // the next break comes round; tell them when the class is about to go back in
    if (SC.phase === 'recess' && SC.pt > 70 && !SC.said['in' + SC.cycle] && quest <= 4) { SC.said['in' + SC.cycle] = 1; toast('小息快完了——同學很快會排隊回課室', 3); }
  },
  win() { },
  marker() {
    if (NET.on) return mpMarker(); const L = leader;
    if (quest === 0) return V3(2060, GY + 4, 4200); if (quest === 1) return V3(2060, GY + 4, 4310); if (quest === 2) return V3(2060, GY + 4, 4560);
    if (quest === 3) return V3(2060, GY + 4, 5012); if (quest === 4) return V3(2425, GY + 4, 5186);
    if (quest === 5) return V3(SC.cubby.x0 + 6, GY + 14, SC_CUBBY.z); if (quest === 6) return V3(2410, GY + 98, 5826); return null;
  },
  reset() { },
  eyeText: () => meter > .3 ? '被看見了！' : SC.phase === 'recess' || SC.phase === 'out' ? '小息：同學和老師都在操場' : SC.phase === 'in' ? '同學排隊回課室' : inClass(leader.pos) ? (SC.tch && SC.tch.mode === 'write' ? '老師在寫黑板——同學仍然看得到前面' : '老師面向全班') : (SC.grd && SC.grd.mode === 'news' ? '保安伯伯在看報紙' : '上課時間'),
  hint(L) {
    const h = scHidden(L.pos);
    if (h <= 0) return '坑渠蓋下面——沒有人看得見你';
    if (h < .1) return '儲物櫃底下——很難被看見';
    if (h < .25) return '矮樹叢裡面——很難被看見';
    if (h < .5) return '書枱底下——比較難被看見';
    const q = scQ(), wait = q === 4 || (NET.on && q >= 5 && inCorr(L.pos));   // (online, whoever missed the line waits in the corridor for the next one)
    if (wait && SC.phase === 'class') return `三年甲班的門鎖着——等下一個小息（約 ${Math.max(0, Math.ceil(100 - SC.pt))} 秒）`;
    if (wait && SC.phase === 'recess') return `小息還有 ${Math.max(0, Math.ceil(80 - SC.pt))} 秒`;
    if (wait && SC.phase === 'in' && SC.doors.back && SC.doors.back.open > .5) return '後門開着——跟着同學進去！';
    if (NET.on && q >= 5 && inCorr(L.pos) && SC.phase === 'out' && SC.doors.back && SC.doors.back.open > .5) return '後門開着——等同學走晒，閃入去！';
    return '';
  },
  onSwitch() { }
};
// after the first break, lessons are shorter (less waiting about)
function scClassLen() { return SC.cycle > 0 ? 100 : 9999; }

// =====================================================================
//  films
// =====================================================================
function scPut(id, x, y, z, yaw, st = 'idle', spd = 0) { const C = chars[id]; if (!C) return; C.pos.set(x, y, z); if (C.disp) C.disp.copy(C.pos); C.yaw = yaw; C.state = st; C.spd = spd; C.root.visible = true; C.vel.set(0, 0, 0); }
function scHideCrew(keep) { const S = {}; for (const C of party) { S[C.id] = [C.pos.clone(), C.yaw, C.root.visible, C.state]; if (!keep.includes(C.id)) C.root.visible = false; } return S; }
function scShowCrew(S) { for (const C of party) { const s = S[C.id]; if (!s) continue; C.pos.copy(s[0]); if (C.disp) C.disp.copy(C.pos); C.yaw = s[1]; C.root.visible = s[2]; C.state = 'idle'; C.spd = 0; } }
function scWhistle() { tone(2900, 2700, .25, .07, 'square'); tone(2900, 3100, .4, .06, 'square', .3); }

// ---- break: the class bursts out, spots 跳跳, chases him round the court; he dives into the drain ----
const RAB_RUN = [[2150, 4640], [2330, 4700], [2210, 4790], [2410, 4830], [2240, 4850], [2062, 4860], [2062, 4876]];
const FILM_RECESS = { id: 'recess', len: 16, mus: .6,
  begin() { SC.fs = scHideCrew(['rab']); SC.rp = 0; scPut('rab', RAB_RUN[0][0], GY, RAB_RUN[0][1], 0); scBell('out'); for (const k of SC.kids) { k.wait = .15 + k.i * .2; k.v = 230; } if (SC.her) SC.her.wait = 3; },
  end() {
    scShowCrew(SC.fs);
    if (NET.on && !party.includes(chars.rab)) { const C = chars.rab; C.root.visible = false; C.pos.set(0, -900, 0); }   // (online and nobody plays him: he stays down there, out of sight)
    else { scPut('rab', 2062, SC_DRAIN.y, 4875, Math.PI); chars.rab.queue = []; }
    // everyone where break puts them
    for (const k of SC.kids) { k.mode = k.play[0]; k.wait = 0; k.v = 110; k.path = null; k.H.pos.set(k.play[1] + R(-10, 10), GY, k.play[2] + R(-10, 10)); }
    const S = SC.tch; S.mode = 'duty'; S.wait = 0; S.H.pos.set(1700, GY, 4940); S.t = 2;
    const H = SC.her; H.mode = 'bench'; H.wait = 0; SC.phase = 'recess'; SC.pt = 0; SC.doors.main.want = 1;
    if (!NET.client) setQuest(NET.on ? MPQ_SCHOOL + 3 : 3); setTimeout(() => { if (STATE === 'play') say('爸爸', '跳跳躲進了坑渠……好。大門開着——趁現在。', '#f5f0e6', 3.4); }, 900);
  },
  shots: [
    { t0: 0, fov: 40, set() { }, run(u, dt) { scNPC(dt); const k = sstep(0, 5.5, u); return [V3(2010, GY + 26, 4700).lerp(V3(2030, GY + 30, 4740), k), V3(2060, GY + 90, 5000), V3(2060, GY + 60, 4990)]; } },
    { t0: 5.5, fov: 42, set() { const ch = [0, 2, 4, 1]; ch.forEach((i, j) => { const k = SC.kids[i]; k.mode = 'chase'; k.wait = 0; k.v = 128 + j * 9; k.H.pos.set(2150 + (j - 1.5) * 60, GY, 4500 - j * 25); }); SC.camR = null; },
      run(u, dt) { scRabRun(u, dt); scNPC(dt); const C = chars.rab; SC.kids.forEach(k => { if (k.mode === 'chase') k.tgt.set(C.pos.x + Math.sin(k.i * 2.1) * 55, GY, C.pos.z - 40 + Math.cos(k.i * 1.7) * 30); });
        // a low tracking shot at his height: him in front, their legs thundering after him
        const want = C.pos.clone().add(V3(-40, 12, 30)); SC.camR = SC.camR ? SC.camR.lerp(want, 1 - Math.exp(-5 * dt)) : want;
        return [SC.camR.clone(), V3(C.pos.x + 4, GY + 12, C.pos.z - 20), C.pos.clone()]; } },
    { t0: 10, fov: 34, set() { }, run(u, dt) { scRabRun(u + 4.5, dt); scNPC(dt); for (const k of SC.kids) if (k.mode === 'chase') k.tgt.set(2062 + Math.sin(k.i * 2.1) * 34, GY, 4836 - Math.abs(Math.cos(k.i * 1.7)) * 20);
        const k = sstep(0, 3.5, u); return [V3(2136, GY + 16, 4806).lerp(V3(2128, GY + 14, 4816), k), V3(2062, GY - 4, 4872), V3(2062, GY, 4872)]; } },
    { t0: 13.5, fov: 36, set() { scPut('rab', 2062, SC_DRAIN.y, 4875, Math.PI / 2); }, run(u, dt) { scNPC(dt); const C = chars.rab; C.state = 'idle'; C.yaw = angDamp(C.yaw, Math.PI / 2 + Math.sin(u * 3) * .4, 4, dt);
        return [V3(2092, SC_DRAIN.y + 4.5, 4875), V3(2062, SC_DRAIN.y + 3, 4875), V3(2062, SC_DRAIN.y + 3, 4875)]; } }
  ],
  ev: [
    [6.2, () => cineSay(SC.kids[0].name, '嘩！你哋睇！有隻袋鼠仔識跳㗎！', SC.kids[0].col, 2.6)],
    [8.6, () => cineSay(SC.kids[1].name, '捉住佢！捉住佢！', SC.kids[1].col, 1.8)],
    [11.6, () => cineSay(SC.kids[2].name, '……咦？唔見咗嘅？', SC.kids[2].col, 2)],
    [12.4, () => { scWhistle(); cineSay('陳老師', '喂！唔好圍住個坑渠！去玩啦！', '#b8d0b0', 2.4); }],
    [14.2, () => cineSay('跳跳', '（好細聲）……好險。', '#e8b080', 1.8)]
  ]
};
// 跳跳's zig-zag: hop, hop, swerve — and down into the gap in the grating
function scRabRun(u, dt) {
  const C = chars.rab, n = RAB_RUN.length - 1, f = clamp(u / 5.6, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
  const a = RAB_RUN[i], b = RAB_RUN[i + 1]; const x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
  const into = i >= n - 1 ? t : 0, y = into > 0 ? lerp(GY, SC_DRAIN.y, sstep(.3, 1, into)) : GY + Math.abs(Math.sin(u * 9)) * 7;
  C.pos.set(x, y, z); if (C.disp) C.disp.copy(C.pos); C.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); C.state = 'run'; C.spd = 60; C.root.visible = true; C.grounded = true;
}

// ---- her cubby: the essay above it, her at her desk, the notebook and the password ----
const FILM_ESSAY = { id: 'essay', len: 29, mus: .35,
  begin() { SC.fs = scHideCrew(['dad']); scPut('dad', SC.cubby.x0 - 8, GY, SC_CUBBY.z, Math.PI / 2); },
  end() { scShowCrew(SC.fs); if (!NET.on) { const L = leader; L.pos.set(SC.cubby.x0 - 10, GY, SC_CUBBY.z); L.yaw = -Math.PI / 2; } SC.gotBook = true; if (SC.bookLid) SC.bookLid.rotation.z = 0; if (SC.her) SC.her.lookOut = false;
    if (!NET.client) setQuest(NET.on ? MPQ_SCHOOL + 6 : 6); setTimeout(() => { if (STATE === 'play') toast(NET.on ? '密碼記住了。全隊從後面的窗口離開——窗邊的書架可以爬上去' : '密碼記住了。從後面的窗口離開——窗邊的書架可以爬上去', 3.4); }, 700); },
  shots: [
    { t0: 0, fov: 44, set() { }, run(u, dt) { scNPC(dt); const D = chars.dad; D.yaw = angDamp(D.yaw, Math.PI / 2, 4, dt); const k = sstep(.6, 5, u);
        return [V3(2382, GY + 3, 5574).lerp(V3(2388, GY + 4, 5568), k), V3(2440, GY + lerp(7, 90, k), 5542), V3(2432, GY + 4, 5540)]; } },
    { t0: 5, fov: 30, set() { }, run(u, dt) { scNPC(dt); const E = SC.essay.position, k = sstep(0, 10, u), y = lerp(E.y + 9, E.y - 7, k);
        return [V3(E.x - 25, y, E.z - 1.5), V3(E.x, y - .5, E.z), V3(E.x, y, E.z)]; } },
    { t0: 15, fov: 32, set() { if (SC.her) SC.her.lookOut = true; }, run(u, dt) { scNPC(dt); const P = KID.root.position, k = sstep(0, 5.5, u);
        return [V3(P.x - 40, GY + 80, P.z + 88).lerp(V3(P.x - 34, GY + 82, P.z + 80), k), V3(P.x - 2, GY + 84, P.z), V3(P.x, GY + 90, P.z)]; } },
    { t0: 20.5, fov: 36, set() { if (SC.her) SC.her.lookOut = false; }, run(u, dt) { scNPC(dt); const B = SC.book.position; if (SC.bookLid) SC.bookLid.rotation.z = -Math.PI * .985 * sstep(1, 2.6, u);
        const k = sstep(0, 8, u), c = V3(B.x + 1, B.y + 1, B.z - 8.5); return [V3(B.x - 20, B.y + 15, B.z - 7.5).lerp(V3(B.x - 16, B.y + 14, B.z - 8), k), c, c]; } }
  ],
  ev: [
    [1.2, () => cineSay('爸爸', '二十二號……是她的位置。', '#f5f0e6', 2.8)],
    [12.6, () => cineSay('爸爸', '（輕聲）……「我每天都留一碗飯給他。」', '#f5f0e6', 2.6)],
    [16.4, () => cineSay('爸爸', '……對不起。爸爸答應你，很快就回來。', '#f5f0e6', 3.4)],
    [23.4, () => cineSay('爸爸', '0718……她的生日。', '#f5f0e6', 2)],
    [25.6, () => cineSay('爸爸', '我把備份密碼藏在她的筆記簿裡——誰也不會想到。', '#f5f0e6', 3.2)]
  ]
};

// ---- out of the window; meanwhile, at home ----
let SC_AGENT = null;
function scBuildAgent() {
  if (SC_AGENT) return SC_AGENT;
  const coverall = new THREE.MeshPhysicalMaterial({ color: 0x59636e, roughness: .85, sheen: .4, sheenColor: 0x9aa4b0 });
  const H = buildHuman({ pants: coverall, top: coverall, skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: .5 }), cap: new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: .7 }), badge: crewMats().badge, hair: 0x241a14 });
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 16, 14), MAT.dsteel); torch.position.set(0, -26, 6); torch.rotation.x = 1.3; H.arms[1].el.add(torch);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2e0).multiplyScalar(8) })); lens.position.set(0, 8.4, 0); torch.add(lens);
  // the beam (no real light: a soft additive cone and the bright patch it throws)
  const beam = new THREE.Mesh(new THREE.ConeGeometry(26, 120, 24, 1, true).translate(0, -60, 0), new THREE.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, 8, 0); torch.add(beam);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(22, 32), new THREE.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; scene.add(pool);
  H.root.visible = false; pool.visible = false; SC_AGENT = { H, beam, pool }; return SC_AGENT;
}
const SC_HOLE = V3(-306, 1.6, -100);   // the mouse hole in the kitchen wall, where the core waits with the ex-partner
const FILM_END = { id: 'end', len: 34, mus: .3,
  black: t => t < .8 ? 1 - sstep(0, .8, t) : t < 6 ? 0 : t < 6.6 ? sstep(6, 6.6, t) : t < 8.2 ? 1 : t < 9 ? 1 - sstep(8.2, 9, t) : t < 23.4 ? 0 : t < 23.8 ? sstep(23.4, 23.8, t) : t < 26.4 ? 1 : t < 27.2 ? 1 - sstep(26.4, 27.2, t) : t > 33 ? sstep(33, 34, t) : 0,
  begin() {
    const A = scBuildAgent(); SC.fs = null;
    // the crew lands in the grass under the window
    const P = [[2400, 5872], [2384, 5866], [2416, 5864], [2372, 5882], [2428, 5880], [2392, 5890], [2412, 5894], [2440, 5872]];
    party.forEach((C, i) => scPut(C.id, P[i % 8][0], GY, P[i % 8][1], Math.PI + R(-.4, .4)));
    SC.endSave = { core: KS.core.position.clone(), coreVis: KS.core.visible, coreI: KS.coreLight.intensity, gk: chars.gecko.root.visible, gp: chars.gecko.pos.clone(), gy: chars.gecko.yaw };
    KS.core.visible = true; KS.core.position.copy(SC_HOLE);
    scPut('gecko', SC_HOLE.x + 7, 0, SC_HOLE.z - 9, -.64);
    A.H.pos.set(-196, 0, -100); A.H.yaw = -Math.PI / 2; A.H.root.visible = false;
  },
  end() {
    const A = SC_AGENT; A.H.root.visible = false; A.pool.visible = false;
    KS.core.position.copy(SC.endSave.core); KS.core.visible = SC.endSave.coreVis; KS.coreLight.intensity = 0; chars.gecko.root.visible = false;   // (she's gone; the core is dark)
    KS.coreDark = true;
    if (NET.on) { END_TXT = ['第六章（多人）· 完', '學校', '備份密碼找到了。可是家裡的核心熄了，前拍檔也被 Origin Dynamics 帶走。（下一章：Origin Dynamics，製作中）']; if (NET.host) nsend({ t: 'end', e: END_TXT }); }
    else { unlockKey('ch7'); END_TXT = ['第七章 · 完', '學校', '備份密碼找到了。可是家裡的核心熄了，前拍檔也被 Origin Dynamics 帶走。（第八章：Origin Dynamics，製作中）']; }
    STATE = 'end'; endT = 2.6; const ov = $('cine'); ov.hidden = true;
  },
  shots: [
    { t0: 0, fov: 38, set() { }, run(u, dt) { scNPC(dt); const D = chars.dad; D.yaw = angDamp(D.yaw, Math.PI + .3, 3, dt); const k = sstep(0, 6, u);
        return [V3(2452, GY + 6, 5934).lerp(V3(2446, GY + 7, 5926), k), V3(2405, GY + 4 + k * 10, 5862), V3(2400, GY + 5, 5876)]; } },
    { t0: 6.6, fov: 38, set() { }, run(u, dt) { return [V3(2446, GY + 7, 5926), V3(2405, GY + 14, 5862), null]; } },
    { t0: 8.2, fov: 34, set() { }, run(u, dt) { const g = chars.gecko; g.state = 'idle'; g.yaw = angDamp(g.yaw, -.64, 3, dt);
        const fl = u < 1.2 ? 1 : u < 4.2 ? (Math.sin(u * 37) > .1 ? 1 : .15) * (1 - (u - 1.2) / 3.4) : 0; KS.coreLight.intensity = 80 * fl; if (KS.core.children[0] && KS.core.children[0].material) KS.core.children[0].material.emissiveIntensity = .2 + 2.2 * fl;
        if (u > 4.6) g.yaw = angDamp(g.yaw, -1.4, 2, dt);
        const k = sstep(0, 7.8, u); return [V3(-262, 7, -84).lerp(V3(-270, 6, -88), k), V3(-304, 3, -102), V3(-302, 3, -104)]; } },
    { t0: 16, fov: 52, set() { const A = SC_AGENT; A.H.root.visible = true; A.pool.visible = true; },
      run(u, dt) { const A = SC_AGENT, H = A.H, g = chars.gecko;
        const k = sstep(0, 2.6, u); H.pos.set(lerp(-196, -244, k), 0, -100); H.yaw = -Math.PI / 2; H.pelvis.position.y = H.dim.pelN; humanAnim(H, k < 1 ? 50 * dt : 0, dt);
        const bend = sstep(2.6, 4, u), reach = sstep(4.2, 6.6, u); H.chest.rotation.x = .08 + .75 * bend;
        const A0 = H.arms[0], A1 = H.arms[1]; A1.sh.rotation.set(-.9 - .4 * bend, .1, 0); A1.el.rotation.x = -.4; A0.sh.rotation.set(lerp(-.1, -1.45, reach), -.15, 0); A0.el.rotation.x = lerp(-.3, -.05, reach); A0.grip = lerp(.4, .1, reach);
        H.aimT.set(-300, 4, -104); H.aim.lerp(H.aimT, 1 - Math.exp(-4 * dt)); humanAimArm(H, 0, dt);
        A.pool.position.set(-298 + Math.sin(u * 2) * 4, .3, -104 + Math.cos(u * 1.6) * 4); A.pool.visible = u > 1.2;
        g.yaw = angDamp(g.yaw, -1.5, 3, dt); if (u > 4.8) { g.pos.x = lerp(SC_HOLE.x + 7, SC_HOLE.x + 3, sstep(4.8, 6.4, u)); if (g.disp) g.disp.copy(g.pos); g.state = 'walk'; g.spd = 6; }
        const kk = sstep(0, 7.4, u); return [V3(-297, 2.5, -118).lerp(V3(-297, 2.8, -113), kk), V3(-248, 118 - kk * 4, -100), V3(-248, 110, -100)]; } },
    { t0: 23.8, fov: 52, set() { }, run(u, dt) { return [V3(-297, 2.8, -113), V3(-248, 114, -100), null]; } },
    { t0: 26.4, fov: 34, set() { const A = SC_AGENT; A.H.root.visible = false; A.pool.visible = false; chars.gecko.root.visible = false; KS.coreLight.intensity = 0; },
      run(u, dt) { scNPC(dt); const D = chars.dad; D.yaw = angDamp(D.yaw, Math.PI * .5 + .2, 2, dt); const k = sstep(0, 7, u);
        return [V3(2380, GY + 7, 5862).lerp(V3(2384, GY + 8, 5866), k), V3(2400, GY + 5, 5874), V3(2400, GY + 5, 5874)]; } }
  ],
  ev: [
    [1.4, () => cineSay('爸爸', '密碼有了。回家，重新啟動那部機器——', '#f5f0e6', 3.4)],
    [6.9, () => cineSay('', '（同一時間，家裡）', '#f5f0e6', 1.5)],
    [13.1, () => cineSay('前拍檔', '……核心？不……不要熄……', '#b7d38a', 2.6)],
    [17.6, () => { nz(.18, 300, 1, .2); setTimeout(() => nz(.18, 280, 1, .2), 520); }],
    [19.2, () => cineSay('Origin Dynamics 職員', '找到你了。', '#9fb3c8', 2.2)],
    [24.6, () => { tone(180, 140, .5, .12, 'sawtooth'); nz(.5, 2200, 1.6, .08); setTimeout(() => tone(220, 200, .12, .1, 'square'), 520); }],
    [27.6, () => cineSay('爸爸', '……核心的訊號，斷了。', '#f5f0e6', 2.8)],
    [30.6, () => cineSay('助手', '教授……家裡出事了。', '#e8c9a8', 2.6)]
  ]
};
