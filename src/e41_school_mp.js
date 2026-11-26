// =====================================================================
//  第七章 · 學校 — online (第六章（多人）)
//  Out of the park's back gate the shared objective list carries straight on into the school.
//  The host runs the school day (the bell, the doors, the class, the teacher, the guard, her) and
//  sends it ~10 times a second; everyone else draws it from that. The three films play on every
//  machine at once (each player can skip their own); the host decides when they start and what
//  happens after.
// =====================================================================
const MP_SCHOOL_Q = [
  { t: '全隊過馬路，到學校門口', s: '走斑馬線。保安伯伯就在閘門旁邊的崗亭裡' },
  { t: '全隊從閘門底下鑽進學校', s: '閘門底有一條縫。保安伯伯看報紙的時候最安全' },
  { t: '穿過操場，去教學大樓', s: '上課時間，大門關着' },
  { t: '趁小息，全隊從大門溜進走廊', s: '大門開着。坑渠蓋下面可以一路走到大門前（有三個缺口）；有蓋操場的柱和長椅擋得一擋' },
  { t: '躲在走廊，等同學回課室', s: '三年甲班鎖着門。鐘聲一響，同學排隊回課室——後門會開一陣，跟着進去。儲物櫃底下可以躲' },
  { t: '找女兒的儲物格', s: '課室後面，22 號，貼着小老鼠貼紙的那一格。老師轉身寫黑板時最安全；書枱底下也可以躲' },
  { t: '全隊從後面的窗口離開', s: '窗口底部開了一條縫。爬上窗邊的書架，所有玩家都要出去' }
];
const MPQ_SCHOOL = MP_QUESTS.length;   // MP quest index of the first school quest
MP_QUESTS.push(...MP_SCHOOL_Q);
const SC_FILMS = { recess: FILM_RECESS, essay: FILM_ESSAY, end: FILM_END };

// ---------- films for everyone ----------
// alone: just play it. Online (host): everyone plays it, then the host's own copy decides what comes next.
function scFilm(F) {
  if (NET.on && NET.host) nsend({ t: 'film', id: F.id });
  filmPlay(F);
}
function scFilmRecv(id) {
  const F = SC_FILMS[id]; if (!F || !WORLD || CINE.on || STATE === 'loading' || STATE === 'title' || STATE === 'end') return;
  SC.films[id] = 1; filmPlay(F);
}

// ---------- the host: the shared objectives ----------
function mpSchoolStart() { scReset(); SC.yardT0 = null; }
function mpSchoolObjectives(P) {
  const q = quest - MPQ_SCHOOL; if (q < 0 || q > 6) return;
  // carrying on from a save past the first break: the day has to be going already
  if (q >= 3 && !SC.films.recess) { SC.films.recess = 1; if (!SC.cycle) SC.cycle = 1; if (q <= 4 && SC.phase === 'class') scBell('out'); }
  if (q >= 6) SC.films.essay = 1;
  if (q === 0 && P.every(C => C.pos.z > 4186)) { setQuest(MPQ_SCHOOL + 1); toastW('全隊到了學校門口！', 2.4); }
  if (q <= 1 && P.every(C => C.pos.z > 4330)) { setQuest(MPQ_SCHOOL + 2); SC.yardT0 = T; toastW('全隊進了學校！', 2.4); }
  if (q === 2) { if (SC.yardT0 == null) SC.yardT0 = T; if (!SC.films.recess && (P.some(C => C.pos.z > 4440) || T - SC.yardT0 > 7)) { SC.films.recess = 1; scFilm(FILM_RECESS); } }
  if (q === 3 && P.every(C => inCorr(C.pos) || inClass(C.pos))) { setQuest(MPQ_SCHOOL + 4); toastW('全隊進了走廊！', 2.4); if (SC.phase === 'recess' && SC.pt < 60) SC.pt = 60; }   // (once you're all in, the bell isn't far off)
  if (q >= 2 && q <= 4 && SC.films.recess && P.some(C => inClass(C.pos))) { setQuest(MPQ_SCHOOL + 5); if (!P.every(C => inClass(C.pos))) toastW('有人入了三年甲班！其他人：下次後門開就跟入去', 3.2); }
  if (q === 5 && !SC.films.essay && P.some(atCubby)) { SC.films.essay = 1; scFilm(FILM_ESSAY); }
  if (q === 6 && !SC.films.end && P.every(C => C.pos.z > SC_WIN.z + 30 && C.pos.y < GY + 30)) { SC.films.end = 1; scFilm(FILM_END); }
  if (q >= 3 && SC.phase === 'recess' && SC.pt > 70 && !SC.said['in' + SC.cycle] && (q <= 4 || P.some(C => inCorr(C.pos)))) { SC.said['in' + SC.cycle] = 1; toastW('小息快完了——同學很快會排隊回課室', 3); }
}
function mpSchoolMarker() {
  const q = quest - MPQ_SCHOOL, p = leader.pos;
  if (q === 0) return p.z > 4186 ? null : V3(2060, GY + 4, 4200);
  if (q === 1) return p.z > 4330 ? null : V3(2060, GY + 4, 4310);
  if (q === 2) return V3(2060, GY + 4, 4560);
  if (q === 3) return inCorr(p) ? null : V3(2060, GY + 4, 5012);
  if (q === 4) return inClass(p) ? null : V3(2425, GY + 4, 5186);
  if (q === 5) return inClass(p) ? V3(SC.cubby.x0 + 6, GY + 14, SC_CUBBY.z) : V3(2425, GY + 4, 5186);
  if (q === 6) return p.z > SC_WIN.z + 30 ? null : inClass(p) ? V3(2410, GY + 98, 5826) : V3(2425, GY + 4, 5186);
  return null;
}

// ---------- the host tells everyone about the school day ----------
const SCK_M = ['seat', 'path', 'tag', 'ball', 'chat', 'hop', 'chase', 'alert'], SCT_M = ['write', 'face', 'path', 'duty', 'alert'], SCG_M = ['news', 'look', 'tea', 'alert'];
function schoolNetOut(w) {
  if (!SC.kids.length || !SC.tch || !SC.grd || !playerChars().some(C => C.pos.z > 3500)) return;   // (only once someone's on the school side of the park)
  const r1 = v => Math.round(v * 10) / 10, r = Math.round, B = SC.ball.m.position, D = SC.doors;
  const a = [SC_PH.indexOf(SC.phase), r1(SC.pt), SC.cycle, D.main ? D.main.want : 0, D.back ? D.back.want : 0, r1(B.x), r1(B.y), r1(B.z)];
  for (const k of SC.kids) { const H = k.H; a.push(r1(H.pos.x), r1(H.pos.z), +H.yaw.toFixed(2), Math.max(0, SCK_M.indexOf(k.mode)), (k.sit ? 1 : 0) | (k.glance > 0 ? 2 : 0), r(H.aimT.x), r(H.aimT.y), r(H.aimT.z)); }
  { const S = SC.tch, H = S.H; a.push(r1(H.pos.x), r1(H.pos.z), +H.yaw.toFixed(2), Math.max(0, SCT_M.indexOf(S.mode)), r(H.aimT.x), r(H.aimT.y), r(H.aimT.z)); }
  { const G = SC.grd; a.push(Math.max(0, SCG_M.indexOf(G.mode)), r(G.look.x), r(G.look.y), r(G.look.z)); }
  w.sc = a;
}
function schoolNetIn(w) { if (w.sc) SC.net = w.sc; }
// …and everyone else draws it (not during a film: the film runs the school itself)
function schoolNetNPC(dt) {
  const a = SC.net; if (!a || !SC.kids.length || !SC.tch) return;
  const ph = SC_PH[a[0]] || 'class';
  if (ph !== SC.phase) { if ((ph === 'out' || ph === 'in') && ZONES.school && ZONES.school.near) scBellSound(); SC.phase = ph; }
  SC.pt = a[1]; SC.cycle = a[2];
  const D = SC.doors; if (D.main) D.main.want = a[3]; if (D.back) D.back.want = a[4]; scDoorsTick(dt);
  if (!ZONES.school || !ZONES.school.near) return;
  const e = 1 - Math.exp(-10 * dt), B = SC.ball.m; const bx = B.position.x, bz = B.position.z;
  if (Math.hypot(a[5] - bx, a[7] - bz) > 200) B.position.set(a[5], a[6], a[7]); else B.position.lerp(V3(a[5], a[6], a[7]), e);
  if (Math.hypot(B.position.x - bx, B.position.z - bz) > .05) B.rotation.x += dt * 9;
  let i = 8; for (const k of SC.kids) { scKidNet(k, a, i, dt); i += 8; }
  scTeacherNet(a, i, dt); i += 7;
  { const G = SC.grd; G.mode = SCG_M[a[i]] || 'news'; G.look.set(a[i + 1], a[i + 2], a[i + 3]); G.t = 99; scGuardTick(dt); }
  if (KID.root) KID.root.visible = true;   // (she's at school: her place and pose come with the family's snapshot)
  scDecoTick(dt);
}
function scNetMove(H, x, z, yaw, dt) {
  const ox = H.pos.x, oz = H.pos.z, e = 1 - Math.exp(-10 * dt);
  if (Math.hypot(x - ox, z - oz) > 90) { H.pos.x = x; H.pos.z = z; } else { H.pos.x += (x - ox) * e; H.pos.z += (z - oz) * e; }
  H.pos.y = GY; H.yaw = angDamp(H.yaw, yaw, 10, dt);
  return Math.hypot(H.pos.x - ox, H.pos.z - oz);
}
function scKidNet(k, a, i, dt) {
  const H = k.H; k.mode = SCK_M[a[i + 3]] || 'seat'; const sit = a[i + 4] & 1; k.glance = a[i + 4] & 2 ? 1 : 0;
  H.aimT.set(a[i + 5], a[i + 6], a[i + 7]);
  if (sit) scSit(k, dt);
  else {
    const moveD = scNetMove(H, a[i], a[i + 1], a[i + 2], dt), run = k.mode === 'tag' || k.mode === 'chase';
    H.pelvis.position.y = H.dim.pelN; humanAnim(H, moveD > .02 ? moveD : 0, dt, run ? 1 : 0);
    if (k.mode === 'hop') H.root.position.y = GY + Math.abs(Math.sin(T * 6 + k.i)) * 6;
    // running kids don't look down: they trip over whoever's in the way (yours, on your machine)
    if (run && STATE === 'play') for (const C of party) if (mine(C) && !C.frozen && C.pos.y < GY + 10 && Math.hypot(C.pos.x - H.pos.x, C.pos.z - H.pos.z) < 10) knock(C, V3(H.pos.x - Math.sin(H.yaw) * 16, GY, H.pos.z - Math.cos(H.yaw) * 16), C === leader ? '差點被同學踩到！' : null);
  }
  H.aim.lerp(H.aimT, 1 - Math.exp(-4 * dt)); humanAimArm(H, 0, dt);
  if (k.mode === 'seat') H.chest.rotation.y = damp(H.chest.rotation.y, k.glance > 0 ? (k.i % 2 ? .7 : -.7) : 0, 5, dt);
}
function scTeacherNet(a, i, dt) {
  const S = SC.tch, H = S.H; S.mode = SCT_M[a[i + 3]] || 'face'; H.aimT.set(a[i + 4], a[i + 5], a[i + 6]);
  const moveD = scNetMove(H, a[i], a[i + 1], a[i + 2], dt);
  H.pelvis.position.y = H.dim.pelN; humanAnim(H, moveD > .02 ? moveD : 0, dt);
  H.aim.lerp(H.aimT, 1 - Math.exp(-3.5 * dt)); humanAimArm(H, 0, dt);
  S.chalk.visible = S.mode === 'write';
  if (S.mode === 'write') { const A = H.arms[0]; A.sh.rotation.set(-2.2 + Math.sin(T * 3) * .1, -.2, 0); A.el.rotation.x = -.5 + Math.sin(T * 7) * .15; }
}
