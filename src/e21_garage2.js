// =====================================================================
//  PHASE 2 — the garage comes alive, and the ceiling duct reaches it
//  · the duct from the kitchen hood carries on past the bathroom fan, over the living room and into
//    the garage's ceiling: a grille right above the metal shelving (where the security camera sits).
//    The camera's power cable runs from the shelf up through the grille — climb it to get back into
//    the duct: a quick way between the house and the garage in both directions
//  · switches here: the fuse box (garage lights), the camera's power strip (on the top shelf), the
//    old radio on the workbench (plays an old tune; covers small noises)
//  · the Origin Dynamics man gets a brain like the family's: he picks what to search next (shelf,
//    car, bench, bins, the dog flap, the camera, a radio call to his office — when he's looking at
//    his phone he isn't looking at you), deals with the switches you flip, and grows suspicious:
//    0 routine · 1 wary · 2 suspicious (sharper eyes, radios it in) · 3 searching (fast, sweeping)
// =====================================================================
const AGB = { sus: 0, stage: 0, quiet: 0, last: [], act: null, rx: null, search: 0, eye: 1 };

// ---------- the duct's last stretch, the grille, the cable, the switches ----------
function buildGarageDuct(M) {
  const D = new THREE.MeshStandardMaterial({ map: kitchenMats().steel.map, color: 0xc4cacd, metalness: .5, roughness: .48 });
  box(906, 912, 270, 275, 108, 132, D);                                            // a little step up onto the garage ceiling
  box(906, 950, 270, 300, 106, 108, D); box(906, 950, 270, 300, 132, 134, D); box(946, 950, 290, 300, 108, 132, D); box(904, 950, 298, 300, 106, 134, D);   // (its bottom peeled away: the way in from the garage attic)
  box(878, 906, 270, 294, 134, 136, D); box(904, 906, 270, 294, 132, 136, D);
  // the grille (no collider: you drop through it onto the top shelf)
  const gm = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: .8, roughness: .35 });
  for (let i = 0; i < 6; i++) box(925 + i * 3.6, 926.2 + i * 3.6, 268.6, 270, 108.5, 131.5, gm, { col: false, cast: false });
  box(922, 948, 268.4, 270, 106.5, 108.5, gm, { col: false }); box(922, 948, 268.4, 270, 131.5, 133.5, gm, { col: false });
  // the camera's power: a strip on the top shelf, a cable up to the ceiling outlet through the grille
  box(930, 950, 222, 225, 136, 142, MAT.white);
  const led = mesh(new THREE.BoxGeometry(2.6, 1, 2.6), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff4a2a, emissiveIntensity: 2.2 }), 947.5, 225.6, 139, { cast: false }); GS.stripLed = led;
  box(929, 932, 222, 282, 128, 131, MAT.black);                                     // the cable: climbable, up into the duct
  tubeM([[935, 223, 139], [942, 224, 132], [946, 223, 128]], .7, MAT.black, 20);
  pointL(0xdfe8ff, 40, 930, 288, 120);
  // the fuse box on the north wall, by the vent (a stack of boxes helps you up)
  const fb = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: .6, roughness: .45 });
  box(936, 972, 96, 150, -260, -252, fb); box(940, 968, 100, 146, -252, -251.6, new THREE.MeshStandardMaterial({ color: 0x6a7074, metalness: .5, roughness: .5 }), { col: false });
  for (let i = 0; i < 4; i++) box(944 + i * 6, 948 + i * 6, 118, 128, -251.6, -250, i === 0 ? new THREE.MeshStandardMaterial({ color: 0x1a1a1a }) : MAT.white, { col: false });
  GS.fuseLever = mesh(new THREE.BoxGeometry(3, 6, 2), new THREE.MeshStandardMaterial({ color: 0xd83a2a, roughness: .5 }), 946, 123, -249.4);
  box(938, 970, 150, 152, -262, -250, fb, { col: false });
  // radio glow (on when playing)
  GS.radioGlow = mesh(new THREE.PlaneGeometry(24, 12), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb050, emissiveIntensity: 0 }), 1287, GS.benchY + 13, -227.2, { cast: false }); GS.radioGlow.rotation.y = 0;
  hxAdd({ id: 'gpanel', lv: 'garage', name: '車房電箱', kind: 'light', p: V3(946, 123, -249), on: true, r: 10, verb: ['拉掣：車房熄燈', '推返個掣：車房開燈'] });
  hxAdd({ id: 'gstrip', lv: 'garage', name: '監視鏡頭的拖板', kind: 'power', p: V3(947, 226, 139), on: true, r: 9, verb: ['關掉監視鏡頭的電', '開返監視鏡頭的電'] });
  hxAdd({ id: 'radio', lv: 'garage', name: '舊收音機', kind: 'radio', p: V3(1306, GS.benchY + 11.5, -226), on: false, r: 10, verb: ['關收音機', '開收音機'] });
}
function camPowered() { const s = HX.id.gstrip; return !s || s.on; }
// garage lights follow the fuse box (kept dark every frame while it's off)
function garageLights() {
  const g = HX.id.gpanel; if (!g || !GS.tubeAL) return;
  if (!g.on) { GS.tubeAL.intensity = 0; GS.tubeBL.intensity = 0; GS.tubeCL.intensity = 0; }
  else { if (GS.tubeAL.intensity === 0 && !inDark(V3(1180, 0, -60))) GS.tubeAL.intensity = 230000; if (GS.tubeCL.intensity === 0 && !inDark(V3(1020, 0, 120))) GS.tubeCL.intensity = 52000; }
  for (const m of GS.tubeMeshes || []) m.material.emissiveIntensity = g.on ? 3 : .05;
  if (GS.fuseLever) GS.fuseLever.position.y = g.on ? 125 : 119;
  if (GS.stripLed) GS.stripLed.material.emissiveIntensity = camPowered() ? 2.2 : 0;
  if (GS.radioGlow) GS.radioGlow.material.emissiveIntensity = HX.id.radio && HX.id.radio.on ? 1.2 + Math.sin(T * 3) * .1 : 0;
}

// ---------- the radio: an old tune through a small speaker ----------
const RADIO = { bus: null, next: 0, step: 0, timer: 0 }, RADIO2 = { bus: null, next: 0, step: 0 };
const RADIO_TUNE = [[76, 2], [74, 1], [72, 1], [69, 2], [72, 2], [74, 3], [0, 1], [76, 1], [79, 1], [81, 2], [79, 1], [76, 1], [74, 4], [72, 2], [74, 1], [76, 1], [72, 2], [69, 2], [67, 3], [0, 1], [69, 1], [72, 1], [74, 2], [76, 2], [72, 4]];
function radioInit(Rd = RADIO) {
  const C = AU.ctx; if (!C || Rd.bus) return; const RADIO = Rd;
  RADIO.bus = C.createGain(); RADIO.bus.gain.value = 0; const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .8;
  const ws = C.createWaveShaper(); const cv = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 2.2); } ws.curve = cv;
  RADIO.in = C.createGain(); RADIO.in.connect(ws); ws.connect(bp); bp.connect(RADIO.bus); RADIO.bus.connect(AU.out);
  const hiss = C.createBufferSource(); hiss.buffer = AU.noise; hiss.loop = true; const hf = C.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 3500; const hg = C.createGain(); hg.gain.value = .05; hiss.connect(hf); hf.connect(hg); hg.connect(RADIO.bus); hiss.start();
}
// Cantonese-opera-ish phrase for 陳伯's radio (original; pentatonic, with a woodblock)
const RADIO_TUNE2 = [[69, 2], [72, 1], [74, 1], [76, 3], [74, 1], [72, 2], [69, 2], [67, 2], [69, 1], [72, 1], [69, 4], [0, 2], [76, 1], [79, 1], [76, 2], [74, 2], [72, 1], [74, 1], [69, 4]];
function radioTick() { radioRun(RADIO, HX.id.radio, RADIO_TUNE, 'garage', .3); radioRun(RADIO2, HX.id.oradio, RADIO_TUNE2, 'yard', .26); }
function radioRun(RADIO, o, TUNE, lv, beat) {
  const C = AU.ctx; if (!C || !o) return; if (!RADIO.bus) radioInit(RADIO); if (!RADIO.bus) return;
  const L = leader, d = L ? L.pos.distanceTo(o.p) : 999, v = o.on && (LEVEL === lv || d < 700) ? .55 * Math.pow(clamp(1 - d / 650, 0, 1), 1.3) : 0;
  RADIO.bus.gain.setTargetAtTime(v, C.currentTime, .15);
  if (!o.on || !BANK.piano.length) { RADIO.next = 0; return; }
  if (RADIO.next < C.currentTime) RADIO.next = C.currentTime + .05;
  while (RADIO.next < C.currentTime + .4) {
    const [m, len] = TUNE[RADIO.step % TUNE.length]; RADIO.step++;
    if (lv === 'yard') { if (m) playWind('clar', m, RADIO.next, len * beat * .95, .12, RADIO.in); if (RADIO.step % 2) playPerc('tick', RADIO.next, .06, RADIO.in); }
    else { if (m) { playS('cel', m, RADIO.next, .35, len * beat * .9, RADIO.in); playS('piano', m - 12, RADIO.next, .18, len * beat, RADIO.in); }
    if (RADIO.step % 4 === 1) playS('bass', [45, 43, 41, 40][Math.floor(RADIO.step / 8) % 4], RADIO.next, .35, beat * 2, RADIO.in); }
    RADIO.next += len * beat;
  }
}

// ---------- the man's brain ----------
const AG_ACTS = [
  { k: 'shelf', x: 1000, z: -140, stop: [4, 7], look: [950, 120, 140], line: '教授的東西……會不會藏在這些箱裡？' },
  { k: 'car', x: 1000, z: 236, stop: [3, 5], look: [1150, 60, 160], line: '車裡面也查過了。' },
  { k: 'bench', x: 1300, z: -176, stop: [4, 7], look: [1300, GY + 90, -240], line: '這張工作枱……他以前一定在這裡做實驗。' },
  { k: 'bins', x: 1320, z: 228, stop: [3, 5], look: [1380, 40, 262], line: '垃圾桶……甚麼都沒有。' },
  { k: 'door', x: 1396, z: 105, stop: [3, 4], look: [1455, 4, 105], line: '這個狗門……教授有養狗嗎？' },
  { k: 'cam', x: 1010, z: 120, stop: [3, 4], look: [950, 228, 125], line: '鏡頭還在拍吧……' },
  { k: 'phone', here: true, stop: [6, 9], phone: true, line: ['（對講機）這裡還是沒有發現。', '（對講機）收到，我再找找。', '（對講機）教授的車還在，人卻不見了……', '（對講機）甚麼？今晚要找到？'] }
];
function agentSayB(t, d = 3) { if (!t) return; if (AGB.sayT && T - AGB.sayT < 2.5) return; AGB.sayT = T; sayW('Origin Dynamics 職員', t, '#9fb3c8', d); }
function agentChoose(H) {
  // put right whatever's wrong first: the lights, the camera, the radio
  const chores = [];
  if (HX.id.gpanel && !HX.id.gpanel.on) chores.push({ x: 992, z: -232, sw: 'gpanel', on: true, line: '又跳掣？……' });
  if (HX.id.gstrip && !HX.id.gstrip.on) chores.push({ x: 1002, z: 140, sw: 'gstrip', on: true, line: '（看手機）鏡頭斷線了？' });
  if (HX.id.radio && HX.id.radio.on) chores.push({ x: 1292, z: -176, sw: 'radio', on: false, line: '誰開了收音機？' });
  if (chores.length) { AGB.act = { ...chores[0], fix: true }; return; }
  if (AGB.search > 0) { const sp = [[1000, -140], [1000, 236], [1300, -176], [1320, 228], [1396, 105], [1010, 120]]; const [x, z] = sp[(rnd() * sp.length) | 0]; AGB.act = { x, z, stop: [2.2, 3.2], look: [x + R(-60, 60), 8, z + R(-60, 60)], low: true }; return; }
  const opts = AG_ACTS.filter(a => !AGB.last.includes(a.k)); const a = opts[(rnd() * opts.length) | 0];
  AGB.last.unshift(a.k); if (AGB.last.length > 2) AGB.last.pop();
  AGB.act = { ...a, x: a.here ? H.pos.x : a.x, z: a.here ? H.pos.z : a.z };
}
function agentIncident(id, on) {
  if (NET.client) return;
  const add = { gpanel: .6, gstrip: .6, radio: .45 }[id] || .3; agentSus(add, null);
  if (TAKE.job) return;
  const H = GS.agent; AGB.act = null; GS.mode = 'patrol'; agentChoose(H);   // drop what he's doing and deal with it
  if (id === 'gpanel' && !on) agentSayB('嗯？停電了？');
}
function agentSus(v, p, why) {
  AGB.sus = humanSus(v, why || '有古怪'); AGB.quiet = 0;
  const st = AGB.sus >= 3 ? 3 : AGB.sus >= 2 ? 2 : AGB.sus >= 1 ? 1 : 0;
  if (st > AGB.stage) { AGB.stage = st;
    if (st === 2) setTimeout(() => agentSayB('（對講機）這間屋有古怪……好像有東西在動。'), 1800);
    if (st === 3) { AGB.search = 32; setTimeout(() => agentSayB('出來！我知道你在這裡！', 3), 800); } }
}
function agentBrainTick(dt) {
  AGB.quiet += dt; if (AGB.quiet > 16 && AGB.sus > 0) { AGB.sus = Math.max(0, AGB.sus - dt / 35); AGB.stage = Math.min(AGB.stage, Math.floor(AGB.sus)); }
  if (AGB.search > 0) { AGB.search -= dt; if (AGB.search <= 0) { AGB.sus = Math.min(AGB.sus, 2.2); agentSayB('（對講機）……可能是我看錯了。'); } }
  AGB.eye = 1 + AGB.sus * .14;
}
// one step of the brain while he isn't tracking something he saw or heard (replaces the fixed round)
function agentBrain(H, walkTo, dt) {
  const P = H.pos; if (!AGB.act) agentChoose(H); const A = AGB.act; const sp = AGB.search > 0 ? 78 : A.fix ? 66 : 52;
  if (!A.arrived) {
    if (walkTo(A.x, A.z, sp)) { A.arrived = true; A.t = A.sw ? .7 : R(...A.stop); if (A.line && (A.fix || rnd() < .55)) agentSayB(Array.isArray(A.line) ? A.line[(rnd() * A.line.length) | 0] : A.line); }
    const fx = Math.sin(H.yaw), fz = Math.cos(H.yaw); H.aimT.set(P.x + fx * 150 + Math.sin(T * (AGB.search ? 2.4 : .8)) * (AGB.search ? 90 : 40), GY, P.z + fz * 150 + Math.cos(T * .7) * 30);
    return;
  }
  A.t -= dt;
  if (A.sw) { const o = HX.id[A.sw]; H.yaw = angDamp(H.yaw, Math.atan2(o.p.x - P.x, o.p.z - P.z), 5, dt); H.aimT.copy(o.p); if (A.t < .35 && !A.fired) { A.fired = 1; hxSet(o, A.on, 'agent'); } }
  else if (A.phone) { H.aimT.set(P.x + Math.sin(H.yaw) * 30, GY + 40, P.z + Math.cos(H.yaw) * 30); }   // eyes on his phone, torch at his feet
  else { const la = V3(...A.look); H.yaw = angDamp(H.yaw, Math.atan2(la.x - P.x, la.z - P.z), 2.5, dt); const s = Math.sin(T * 1.1) * 34; H.aimT.set(la.x + s, A.low ? GY + 4 + Math.sin(T * 2) * 6 : la.y, la.z + Math.cos(T * .9) * 20); }
  if (A.t <= 0) AGB.act = null;
}

// =====================================================================
//  陳伯 next door: still in his armchair, but no longer just reading and glancing up.
//  He reads, looks out, sips his tea, dozes off (eyes shut — your chance), and listens to Cantonese
//  opera on his little radio with his eyes closed. Switch his lamp off and the dim room sends him to
//  sleep; switch his radio on and he settles in to listen — switch it off mid-song and he wakes up
//  wondering. Our garden tap turns the lawn sprinkler off.
// =====================================================================
const OLDB = { sus: 0, quiet: 0, eye: 1, stage: 0 };
function buildYardSwitches(X0) {
  // the garden tap on our house wall, where the hose starts
  box(X0, X0 + 3, GY + 40, GY + 48, -124, -116, MAT.dsteel || MAT.white); const tp = mesh(new THREE.TorusGeometry(2.6, .7, 8, 16), new THREE.MeshStandardMaterial({ color: 0xc83a2a, roughness: .5 }), X0 + 4, GY + 47, -120); tp.rotation.y = Math.PI / 2; YS.tapH = tp;
  hxAdd({ id: 'otap', lv: 'yard', name: '後園水龍頭', kind: 'tap', p: V3(X0 + 4, GY + 46, -120), on: true, r: 10, verb: ['關水龍頭（灑水器停）', '開水龍頭（灑水器轉）'] });
  // 陳伯's lamp (a foot switch on its cord) and his little radio on the side table
  box(2686, 2694, DECK, DECK + 2, -8, -2, MAT.black);
  hxAdd({ id: 'olamp', lv: 'yard', name: '陳伯的落地燈', kind: 'lamp', p: V3(2690, DECK + 2, -5), on: true, r: 8, verb: ['熄陳伯的燈', '開陳伯的燈'] });
  const rm = new THREE.MeshPhysicalMaterial({ color: 0xb8322e, roughness: .35, clearcoat: .6 });
  box(2608, 2624, DECK + 53, DECK + 63, 106, 114, rm); box(2610, 2622, DECK + 55, DECK + 61, 105.6, 106, new THREE.MeshStandardMaterial({ color: 0xd8c08a }), { col: false });
  YS.radioGlow = mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb050, emissiveIntensity: 0 }), 2616, DECK + 58, 105.5, { cast: false }); YS.radioGlow.rotation.y = Math.PI;
  hxAdd({ id: 'oradio', lv: 'yard', name: '陳伯的收音機', kind: 'radio', p: V3(2616, DECK + 63, 110), on: false, r: 9, verb: ['關收音機', '開收音機（粵曲）'] });
}
function oldIncident(id, on) {
  if (NET.client) return; const O = YS.old; if (!O) return;
  if (id === 'olamp' && !on) { oldSus(.35); oldSay('……燈泡又壞了？算了。'); }
  if (id === 'olamp' && on && (O.mode === 'doze')) { O.mode = 'alert'; O.t = 3; O.look.set(2690, 20, -5); oldSay('嗯？誰開的燈？'); oldSus(.4); }
  if (id === 'oradio' && on) { oldSus(.15); O.mode = 'listen'; O.t = 999; oldSay('哦？……收音機自己開了？好，聽一下粵曲。'); }
  if (id === 'oradio' && !on && O.mode === 'listen') { O.mode = 'alert'; O.t = 4; O.look.set(2616, 60, 110); oldSay('咦？怎麼停了？'); oldSus(.45); }
}
function oldSay(t) { if (OLDB.sayT && T - OLDB.sayT < 3) return; OLDB.sayT = T; sayW('陳伯', t, '#c8b8a0', 2.8); }
function oldSus(v, why) { OLDB.sus = humanSus(v, why || '有古怪'); OLDB.quiet = 0; const st = Math.floor(Math.min(3, OLDB.sus)); if (st > OLDB.stage) { OLDB.stage = st; if (st === 2) oldSay('……是不是有小偷？'); if (st === 3) { oldSay('出來！我報警了！'); } } }
// choose what to do next (runs on the host)
function oldChoose(O) {
  const lampOn = !HX.id.olamp || HX.id.olamp.on, radioOn = HX.id.oradio && HX.id.oradio.on;
  if (radioOn) { O.mode = 'listen'; O.t = 999; return; }
  const w = [['read', .4], ['look', .25 + OLDB.sus * .2], ['tea', .16], ['doze', lampOn ? .1 : .7]].filter(([k]) => k !== O.last);
  let s = w.reduce((a, b) => a + b[1], 0) * rnd(); let k = w[0][0]; for (const [kk, v] of w) { s -= v; if (s <= 0) { k = kk; break; } }
  O.last = k; O.mode = k; O.t = k === 'read' ? R(8, 14) : k === 'look' ? R(3.5, 5) : k === 'tea' ? R(3, 4.5) : R(10, 18);
  if (k === 'look') O.look.set(R(2380, 2540), R(-10, 30), R(-40, 200));
  if (k === 'doze' && rnd() < .5) oldSay(lampOn ? '……好睏……' : '……暗暗的，好睏……');
}
// he's still the same seated man; this decides where he's looking and whether his eyes are open
function oldBrain(dt) {
  const O = YS.old; if (!O) return; const H = O.H;
  if (!NET.client) {
    O.t -= dt; OLDB.quiet += dt; if (OLDB.quiet > 18 && OLDB.sus > 0) { OLDB.sus = Math.max(0, OLDB.sus - dt / 35); OLDB.stage = Math.min(OLDB.stage, Math.floor(OLDB.sus)); }
    OLDB.eye = 1 + OLDB.sus * .15;
    if (O.mode === 'listen' && !(HX.id.oradio && HX.id.oradio.on)) { O.mode = 'alert'; O.t = 3; }
    if (O.t <= 0) oldChoose(O);
    if (O.mode === 'look' && OLDB.sus >= 2) O.look.x += Math.sin(T * 1.6) * 60 * dt;
  }
  const open = O.mode === 'look' || O.mode === 'alert' ? 1 : O.mode === 'tea' ? .45 : 0;
  O.lookK = damp(O.lookK, open, 3, dt);
  O.dozeK = damp(O.dozeK || 0, O.mode === 'doze' || O.mode === 'listen' ? 1 : 0, 2, dt);
  H.paper.visible = O.mode !== 'tea' && O.mode !== 'listen';
  H.paper.position.y = lerp(lerp(52, 22, O.lookK), 14, O.dozeK); H.paper.rotation.x = lerp(lerp(-.2, -1.2, O.lookK), -1.4, O.dozeK);
  H.root.updateMatrixWorld(true); const hp = V3(); H.head.getWorldPosition(hp); const ad = V3().subVectors(O.look, hp); const yr0 = Math.atan2(ad.x, ad.z) - H.yaw; const yr = Math.atan2(Math.sin(yr0), Math.cos(yr0)); const pitch = Math.atan2(-ad.y, Math.hypot(ad.x, ad.z));
  const sway = O.mode === 'listen' ? Math.sin(T * 2.2) * .18 : 0;
  H.head.rotation.y = damp(H.head.rotation.y, clamp(yr, -.9, .9) * O.lookK + sway, 3, dt);
  H.head.rotation.x = damp(H.head.rotation.x, lerp(lerp(.55, clamp(pitch * .6, -.3, .5), O.lookK), .75 + Math.sin(T * .9) * .05, O.dozeK), 3, dt);
  const tea = O.mode === 'tea' ? Math.max(0, Math.sin((O.t || 0) * 2)) : 0;
  for (const A of H.arms) { A.sh.rotation.x = lerp(lerp(-1.1, -.5, O.lookK), -.35, O.dozeK); A.sh.rotation.z = A.s * -.25; A.el.rotation.x = lerp(lerp(-.9, -.6, O.lookK), -.4, O.dozeK); }
  if (tea) { const A = H.arms[1]; A.sh.rotation.x = -1.3 - tea * .5; A.el.rotation.x = -1.6; }
  if (O.dozeK > .7 && YS.near && rnd() < dt * .8) emit(V3(hp.x - 4, hp.y + 14, hp.z), V3(R(-2, 2), R(5, 8), R(-2, 2)), new THREE.Color(1.4, 1.4, 1.6), R(.3, .5), R(1.6, 2.2), -2, 0);
  if (YS.radioGlow) YS.radioGlow.material.emissiveIntensity = HX.id.oradio && HX.id.oradio.on ? 1.2 : 0;
  if (YS.tapH) YS.tapH.rotation.x = HX.id.otap && HX.id.otap.on ? 0 : Math.PI / 2;
}
