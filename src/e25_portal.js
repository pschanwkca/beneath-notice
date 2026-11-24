// =====================================================================
//  THE PREP AREA — inside the shrink machine's field
//  Every game starts here (single player and online): a floating platform in a swirling tunnel of
//  light, a pad for each player, a couple of blocks to try climbing on, and the exit — a copy of the
//  machine's ring. Stand in the glowing circle in front of it (online: everybody) and the ring pulls
//  you through: you tumble out of the real machine onto the lab workbench.
//  Online, the prologue then carries on through the basement (no one is home tonight) and up the wall
//  into the kitchen, where the online story picks up.
// =====================================================================
const PO = V3(-1700, -300, -1700);
zoneDef('portal', { floor: PO.y, off: PO, core: [[PO.x - 240, PO.x + 240, PO.y - 150, PO.y + 230, PO.z - 240, PO.z + 320]], env: 'portal' });
const PORT = { mats: null, pads: [], debris: [], out: 0, outSeen: 0, cd: 0, rdy: 0, tot: 0, late: false, pend: 0, flare: 0, lastN: -1, tagSig: '' };
const PR_R = 10;
const prC = () => V3(0, 0, 26).add(PO);                 // the ready circle, in front of the exit
const PR_ANG = [-.13, .13, -.39, .39, -.65, .65, -.91, .91];
function prPad(i) { const a = PR_ANG[i % 8], r = i >= 8 ? 27 : 34; return V3(Math.sin(a) * r, 0, 10 - Math.cos(a) * r).add(PO); }   // 9th/10th: a step inside the ring
const PR_TIP = TOUCH ? '按「表情」掣' : '按住 T';
const PORTAL_Q = [{ t: '走出縮小機', s: `這裡是縮小機的場域裡面。可以先試試走、跳、爬上箱子和用表情（${PR_TIP}）——準備好就站上出口前面的光圈` }];
const MP_PRO = [
  { t: '準備區', s: `可以先試試走、跳、攀爬和用表情（${PR_TIP}）。全部玩家站上出口前面的光圈，就會一齊出發` },
  { t: '離開工作枱', s: '找路下到地面。地庫今日沒有人，可以放心探索' },
  { t: '去牆腳的裂縫', s: '前拍檔在地庫另一邊的牆腳等你們——擋路的紙箱已經被推開了' },
  { t: '跟前拍檔進入牆裡面', s: '沿牆腳的洞走進去' },
  { t: '沿牆身爬上廚房', s: '沿水泥牆中間往上爬，累了就橫移到兩邊的木架上休息；最頂的缺口就是廚房的老鼠洞' }
];
const PRO = { on: false, used: false, gk: false, cps: null };

LEVELS.portal = {
  chapter: '序章', title: '縮小機裡面', env: 'portal', envI: .45, fog: [0x061a22, .0019], expo: 1.0,
  dust: { N: 1300, box: [-70, 70, 0, 80, -60, 70], beamFrac: 0, door: false },
  build: buildPortal,
  cps: [[0, 0, -22]],
  quests: PORTAL_Q,
  spawn() { portalSpawn(); },
  npc() { }, detect(dt) { meter = Math.max(0, meter - dt); }, update(dt) { lvT += dt; }, win() { },
  marker() { const c = prC(); return leader && Math.hypot(leader.pos.x - c.x, leader.pos.z - c.z) < PR_R ? null : c.add(V3(0, 2, 0)); },
  reset() { }, eyeText: () => '準備區', hint: () => ''
};

// ---------- building it ----------
function portalFloorTex() {
  const [c, x] = cnv(1024, 1024), [g, y] = cnv(1024, 1024), C = 512;
  const gr = x.createRadialGradient(C, C, 60, C, C, 512); gr.addColorStop(0, '#3a464c'); gr.addColorStop(.7, '#242d32'); gr.addColorStop(1, '#151b1f'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
  y.fillStyle = '#000'; y.fillRect(0, 0, 1024, 1024);
  // brushed rings and plate seams
  for (let r = 40; r < 512; r += 6) { x.strokeStyle = `rgba(255,255,255,${.012 + rnd() * .02})`; x.lineWidth = 1; x.beginPath(); x.arc(C, C, r, 0, 7); x.stroke(); }
  for (const r of [130, 250, 330, 420, 492]) { x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 4; x.beginPath(); x.arc(C, C, r, 0, 7); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 1.5; x.beginPath(); x.arc(C, C, r + 3, 0, 7); x.stroke(); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(C + Math.cos(a) * 250, C + Math.sin(a) * 250); x.lineTo(C + Math.cos(a) * 492, C + Math.sin(a) * 492); x.stroke(); }
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; x.fillStyle = '#5a666c'; x.beginPath(); x.arc(C + Math.cos(a) * 470, C + Math.sin(a) * 470, 5, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.arc(C + Math.cos(a) * 470 + 1.5, C + Math.sin(a) * 470 + 1.5, 2, 0, 7); x.fill(); }
  // the glowing circuit: two rings and a few traces
  y.lineCap = 'round';
  for (const [r, w, a] of [[330, 3, .9], [420, 2, .55], [136, 2.5, .7]]) { y.strokeStyle = `rgba(111,246,238,${a})`; y.lineWidth = w; y.beginPath(); y.arc(C, C, r, 0, 7); y.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .13; y.strokeStyle = 'rgba(111,246,238,.6)'; y.lineWidth = 2; y.beginPath(); y.moveTo(C + Math.cos(a) * 140, C + Math.sin(a) * 140); y.lineTo(C + Math.cos(a) * 240, C + Math.sin(a) * 240); y.lineTo(C + Math.cos(a + .06) * 300, C + Math.sin(a + .06) * 300); y.lineTo(C + Math.cos(a + .06) * 326, C + Math.sin(a + .06) * 326); y.stroke(); y.fillStyle = 'rgba(150,255,250,.9)'; y.beginPath(); y.arc(C + Math.cos(a) * 240, C + Math.sin(a) * 240, 4, 0, 7); y.fill(); }
  const t = new THREE.CanvasTexture(c), e = new THREE.CanvasTexture(g); t.colorSpace = e.colorSpace = THREE.SRGBColorSpace; t.anisotropy = e.anisotropy = 8; return [t, e];
}
const FIELD_FS = `uniform float uT,uK; varying vec2 vUv; void main(){ vec2 p=vUv-0.5; float r=length(p)*2.0; float a=atan(p.y,p.x);
  float sw=sin(a*5.0+r*14.0-uT*4.0)*0.5+0.5; float s2=sin(a*3.0-r*9.0+uT*2.3)*0.5+0.5; float ir=clamp(1.0-r,0.0,1.0);
  float v=pow(clamp(sw*s2,0.0,1.0),2.0)*ir+pow(ir,5.0)*0.9+smoothstep(0.82,1.0,r)*0.8;
  vec3 col=mix(vec3(0.22,0.95,0.9),vec3(1.0),pow(ir,4.0)*0.7);
  gl_FragColor=vec4(max(col*v*1.25*uK, vec3(0.0)), 1.0); }`;
function buildPortal() {
  const M = MAT; const P = PORT; P.pads = []; P.debris = [];
  LV.add(new THREE.HemisphereLight(0x4a8a98, 0x0c1216, .55));
  // the tunnel of light all round (brighter toward the exit end)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(160, 160, 760, 72, 1, true), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uT; varying vec2 vUv; void main(){ float a=vUv.x*6.2831853, z=vUv.y;
      float sw=sin(a*3.0+z*46.0-uT*1.7)*.5+.5, s2=sin(a*7.0-z*80.0+uT*2.6)*.5+.5, s3=sin(a*13.0+z*120.0-uT*3.3)*.5+.5;
      float streak=pow(sw,7.0)*.85+pow(s2,12.0)*.55+pow(s3,20.0)*.4; float tw=smoothstep(.05,1.0,z);
      vec3 col=vec3(.008,.03,.042)+vec3(.08,.6,.58)*streak*(.14+.66*tw)+vec3(.85,1.0,1.0)*pow(tw,7.0)*.3+vec3(.28,.12,.04)*pow(1.0-tw,3.0)*streak*.22;
      gl_FragColor=vec4(col,1.0); }`
  }));
  tube.rotation.x = Math.PI / 2; tube.position.set(0, 10, 70); LV.add(tube); P.tube = tube;
  const endW = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .75, .75) })); endW.position.set(0, 10, 448); endW.rotation.y = Math.PI; LV.add(endW);
  const endD = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshBasicMaterial({ color: 0x020507 })); endD.position.set(0, 10, -308); LV.add(endD);
  // the platform
  const [ft, fe] = portalFloorTex();
  const top = new THREE.MeshStandardMaterial({ map: ft, emissive: 0xffffff, emissiveMap: fe, emissiveIntensity: 1.05, metalness: .75, roughness: .42 });
  cyl(0, 0, 50, -6, 0, [M.dsteel, top, M.dsteel], { seg: 120 });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(50, 9, 44, 72, 1, true), M.dsteel); funnel.position.set(0, -28, 0); LV.add(funnel);
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, 1.5, 1.45) });
  for (const [r, y, t] of [[38, -17, .5], [24, -32, .45], [50, -6.2, .35]]) { const tr = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 120), glowM); tr.rotation.x = Math.PI / 2; tr.position.y = y; LV.add(tr); }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(50, 1.1, 12, 160), M.copper); rim.rotation.x = Math.PI / 2; rim.position.y = 0; LV.add(rim);
  // a low railing with a glowing strip, and an invisible wall just outside it (you can't fall off)
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < .3) continue; cyl(Math.cos(a) * 47.5, Math.sin(a) * 47.5, .45, 0, 4.6, M.steel, { col: false, seg: 10 }); }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(47.5, .38, 8, 160), M.steel); rail.rotation.x = Math.PI / 2; rail.position.y = 4.6; LV.add(rail);
  const strip = new THREE.Mesh(new THREE.TorusGeometry(47.5, .16, 6, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(.22, 1.05, 1) })); strip.rotation.x = Math.PI / 2; strip.position.y = 2.3; LV.add(strip);
  for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2, x = Math.cos(a) * 49.5, z = Math.sin(a) * 49.5; cols.push({ t: 'b', x0: x - 3.8, x1: x + 3.8, y0: 0, y1: 18, z0: z - 3.8, z1: z + 3.8, slick: true, noRay: true, noCam: true }); }
  // the pads everyone starts on
  const padM = new THREE.MeshStandardMaterial({ color: 0x1c2428, metalness: .8, roughness: .35 });
  for (let i = 0; i < 8; i++) {
    const p = prPad(i).sub(PO); const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4, .5, 6), padM); base.position.set(p.x, .25, p.z); base.receiveShadow = true; LV.add(base);
    const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, 1.3, 1.25), transparent: true, opacity: .9 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.2, 6), gm); ring.rotation.x = -Math.PI / 2; ring.rotation.z = Math.PI / 6; ring.position.set(p.x, .53, p.z); LV.add(ring);
    P.pads.push({ p: prPad(i), gm });
  }
  // the ready circle
  const cm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uP: { value: 0 }, uOn: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uT,uP,uOn; varying vec2 vUv; void main(){ vec2 p=vUv-0.5; float r=length(p)*2.0; float a=atan(p.y,p.x)/6.2831853+0.5;
      float edge=smoothstep(.86,.9,r)*(1.0-smoothstep(.97,1.0,r)); float dash=step(.5,fract(a*36.0-uT*.6));
      float fill=step(a,uP)*edge; float inner=(1.0-smoothstep(.0,.88,r))*.16*(.6+.4*sin(uT*3.0)) + smoothstep(.6,.86,r)*(1.0-smoothstep(.86,.88,r))*.25;
      vec3 cy=vec3(.3,1.5,1.45), am=vec3(1.9,1.25,.45);
      vec3 col=cy*edge*(.35+.65*dash)*(.6+.4*uOn)+am*fill*1.4+cy*inner*(.5+uOn);
      gl_FragColor=vec4(col,1.0); }` });
  const circ = new THREE.Mesh(new THREE.CircleGeometry(PR_R, 64), cm); circ.rotation.x = -Math.PI / 2; circ.position.set(0, .06, 26); LV.add(circ); P.circle = cm;
  // the exit: a copy of the machine's ring
  const ex = { x: 0, y: 20.5, z: 40 };
  const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 2, 24, 96), M.dsteel); ring.position.set(ex.x, ex.y, ex.z); ring.castShadow = true; LV.add(ring);
  for (let a = 0; a < 16; a++) { const t = new THREE.Mesh(new THREE.TorusGeometry(2.4, .62, 10, 24), M.copper); const an = a / 16 * Math.PI * 2; t.position.set(ex.x + Math.cos(an) * 19, ex.y + Math.sin(an) * 19, ex.z); t.rotation.y = Math.PI / 2; t.rotation.x = an; t.castShadow = true; LV.add(t); }
  box(-24, -19.5, 0, 14, 38, 42, M.dsteel); box(19.5, 24, 0, 14, 38, 42, M.dsteel);
  cols.push({ t: 'b', x0: -19, x1: 19, y0: 0, y1: 40, z0: 39.2, z1: 40.8, slick: true, noCam: true });
  const field = new THREE.Mesh(new THREE.CircleGeometry(17.2, 64), new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: .7 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`, fragmentShader: FIELD_FS }));
  field.position.set(ex.x, ex.y, ex.z); LVFX.add(field); P.field = field;
  // chevrons on the floor: this way out
  { const [c, x] = cnv(128, 128); x.strokeStyle = '#fff'; x.lineWidth = 16; x.lineCap = x.lineJoin = 'round'; x.beginPath(); x.moveTo(24, 40); x.lineTo(64, 84); x.lineTo(104, 40); x.stroke();
    const tx = new THREE.CanvasTexture(c); const cmM = new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(.3, 1.4, 1.35), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const z of [-2, 5.5, 13]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), cmM); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI; m.position.set(0, .07, z); LV.add(m); } }
  // things to try: climb the crates, hop onto the giant button battery, scale the cotton reel
  box(-42, -30, 0, 6.5, -8, 4, M.dsteel); box(-40, -32, 6.5, 14, -6, 2, M.copper);
  cyl(33, 0, 8, 0, 3, M.steel, { seg: 48 }); { const plus = new THREE.Mesh(new THREE.BoxGeometry(5, .2, 1.2), M.black); plus.position.set(33, 3.05, 0); LV.add(plus); const p2 = plus.clone(); p2.rotation.y = Math.PI / 2; LV.add(p2); }
  cyl(36, 14, 4.4, 0, 1.4, M.oak); cyl(36, 14, 3, 1.4, 13, new THREE.MeshStandardMaterial({ color: 0xd8584a, roughness: .9 })); cyl(36, 14, 4.4, 13, 14.4, M.oak);
  // bits of the lab caught in the field, drifting past
  const dm = (g, m, x, y, z, sp) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = false; LV.add(o); P.debris.push({ o, y, sp, ph: rnd() * 6 }); return o; };
  { const pts = [[0, -18, 0], [0, 14, 0], [5, 19, 0], [10, 14, 0], [10, -14, 0], [5.5, -18, 0], [1.5, -14, 0], [1.5, 10, 0], [5.5, 13, 0], [8.5, 10, 0], [8.5, -8, 0]].map(p => V3(...p));
    dm(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2), 120, .9, 10), M.steel, -86, 34, 30, .5); }
  { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 70, 6), new THREE.MeshStandardMaterial({ color: 0xf0c02e, roughness: .55 })); g.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10, 6), new THREE.MeshStandardMaterial({ color: 0xe2b58a, roughness: .8 })); tip.position.y = 40; g.add(tip);
    const lead = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.6, 6), M.black); lead.position.y = 43.2; g.add(lead);
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 5, 12), M.steel); fer.position.y = -37; g.add(fer); const er = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 5, 12), new THREE.MeshStandardMaterial({ color: 0xe88a92, roughness: .9 })); er.position.y = -42; g.add(er);
    g.position.set(96, 46, -24); g.rotation.set(.5, 0, 1.1); LV.add(g); P.debris.push({ o: g, y: 46, sp: .25, ph: 1 }); }
  dm(new THREE.CylinderGeometry(15, 15, 2.2, 56), M.brass, 74, -34, 96, .4).rotation.set(1.1, .3, 0);
  { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 22, 16), M.steel); g.add(sh); const hd = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 2.4, 6), M.steel); hd.position.y = 12; g.add(hd);
    for (let i = 0; i < 9; i++) { const th = new THREE.Mesh(new THREE.TorusGeometry(1.7, .35, 6, 16), M.steel); th.rotation.x = Math.PI / 2; th.position.y = -9 + i * 2.1; g.add(th); }
    g.position.set(-96, -18, -58); g.rotation.set(.9, 0, .5); LV.add(g); P.debris.push({ o: g, y: -18, sp: .6, ph: 2 }); }
  dm(new THREE.CylinderGeometry(11, 11, 3.2, 48), M.steel, -62, 62, -96, .35).rotation.set(.4, 0, .8);
  // lights
  spotL(0xd8fbff, 68000, V3(26, 140, -36), V3(0, 0, 4), .5, .6, 2048, 60, 320);
  pointL(0x7ff8f0, 2400, 0, 20, 33); pointL(0xffcf9a, 1500, 0, 30, -26); pointL(0x4fe8e0, 1800, 0, -26, 0); pointL(0x9ff0ff, 800, -40, 18, 10); pointL(0xffd6a8, 1300, 0, 11, -6);   // a warm light on the faces of whoever stands in line (the online room)
}

// ---------- starting here ----------
// a stable spot number for each player: the same on every machine, whatever order the party list happens to be in
// (by character, not by the party list: a client can run this before it knows the whole party)
function slotOf(C) { const i = IDS.indexOf(C.id); return i < 0 ? Math.max(0, party.indexOf(C)) : i; }
function portalSpawn() {
  placeStart(); unstkReset();   // the lab as it should be when you come out (bench, the old partner by the crack…)
  party.forEach(C => { const p = prPad(slotOf(C)); C.pos.copy(p); C.yaw = Math.atan2(PO.x - p.x, PO.z + 40 - p.z); C.state = 'idle'; C.wave = false; C.lieK = 0; C.root.visible = true; C.vel.set(0, 0, 0); C.ptw = null; C.lastTrail = C.pos.clone(); C.disp = C.pos.clone(); C.queue = []; });
  leader = NET.on && NET.my && chars[NET.my] ? chars[NET.my] : chars.dad; trail = [];
  PORT.cd = 0; PORT.pend = 0; PORT.flare = 0; PORT.lastN = -1; PORT.late = !!NET.late; PORT.outSeen = PORT.late ? null : PORT.out; PORT.tagSig = '';
  setQuest(quest);
  if (NET.on) {
    PROTO = Math.max(PROTO, 1); momReset(); ZONES.kitchen.prepped = false; LEVELS.kitchen.prep(); PORT.resumed = false; if (NET.resume) mpApplySave(NET.resume);
    // nobody's home in the basement tonight: the box has already been pushed off the crack
    if (crackBox && !NET.client) { crackBox.cx = BO.x - 262; crackBox.cz = BO.z + 198; applyResize(crackBox); }
    chars.gecko.wave = true;
  } else { momReset(); mom.timer = 70; mom.visits = 0; mom.said = {}; }
  cam.yaw = Math.PI; cam.pitch = .2;
}
function proStart() {
  PRO.on = true; PRO.used = true; PRO.gk = false;
  PRO.cps = [prPad(0).toArray(), ...LEVELS.basement.cps, ...LEVELS.wall.cps].map(p => Array.isArray(p) ? p : [p.x, p.y, p.z]);
}

// ---------- through the ring: out of the real machine on the workbench ----------
function portalOut() {
  PORT.pend = .34; PORT.flare = 1;
  const f = $('pflash'); if (f) { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 420); }
  tone(220, 1400, .5, .06, 'sine'); tone(330, 1800, .45, .035, 'triangle'); SND.swish();
}
const EXIT_SX = [0, -3.5, 3.5, -6, 6, -1.8, 1.8, 0], EXIT_LX = [0, -6, 6, -11, 11, -3, 3, -8], EXIT_LZ = [21, 22, 22, 23, 23, 29, 29, 30];
function portalLand() {
  if (NET.on && NET.resume && !PORT.resumed) { PORT.resumed = true; portalResumeLand(NET.resume); return; }
  const mx = machine.x, mz = machine.z, my = machine.y - 22;   // the machine's ring stands on the bench
  enterZone('basement', true); LP.snap = true; unstkReset();
  party.forEach(C => {
    if (!mine(C)) return; const i = slotOf(C), k = i % 8;
    const dx = i >= 8 ? 2.4 : 0, from = V3(mx + EXIT_SX[k] + dx, my + 7.4, mz - .6), to = V3(mx + EXIT_LX[k] + dx, my, mz + EXIT_LZ[k] + (i >= 8 ? 4 : 0));
    C.ptw = { from, to, t: -i * .14, dur: .62 }; C.pos.copy(from); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.tumble = 0; C.yaw = 0; C.queue = []; if (C.disp) C.disp.copy(C.pos);
  });
  trail = []; cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z); cam.curD = cam.dist; cam.yaw = .55; cam.pitch = .22;
  if (machine.field) machine.flare = 1.6;
  if (!NET.on) { STATE = 'intro'; introT = 0; $('hud').classList.add('cine'); }
  else if (!NET.client) { setQuest(1); setTimeout(() => sayW('爸爸', '……這就是實驗室的工作枱？我們真的縮小了。大家跟緊，先下到地面。', '#f5f0e6', 4), 1500); }
}
function portalTick(dt) {
  if (!WORLD) return;
  // the hop out of the machine (runs during the single player cut-scene too)
  for (const C of party) {
    const w = C.ptw; if (!w) continue; w.t += dt;
    if (w.t < 0) { C.pos.copy(w.from); C.root.visible = false; C.state = 'idle'; if (C.disp) C.disp.copy(C.pos); continue; }
    C.root.visible = true; const k = Math.min(1, w.t / w.dur);
    C.pos.lerpVectors(w.from, w.to, k); C.pos.y += Math.sin(k * Math.PI) * 3.4; C.state = 'air'; C.yaw = 0; C.vel.set(0, 0, 0); C.grounded = false; C.tumble = k < .55 ? .3 : 0;
    if (k >= 1) { C.ptw = null; C.pos.copy(w.to); C.grounded = true; C.state = 'idle'; C.squash = .55; C.tumble = 0; SND.land(.45); C.lastTrail = C.pos.clone(); C.queue = []; if (C === leader) { trail = []; } }
    if (C.disp) C.disp.copy(C.pos);
  }
  if (PORT.pend > 0) { PORT.pend -= dt; if (PORT.pend <= 0) portalLand(); }
  if (machine.field) { machine.flare = Math.max(0, (machine.flare || 0) - dt * 1.1); machine.field.material.uniforms.uK.value = 1 + machine.flare * 2.2; }
  const Z = ZONES.portal; if (!Z || !Z.near) { portalTag(false); return; }
  // the place itself
  const P = PORT; P.tube.material.uniforms.uT.value = T; P.field.material.uniforms.uT.value = T * 1.3; P.circle.uniforms.uT.value = T;
  for (const d of P.debris) { d.o.rotation.y += dt * d.sp * .5; d.o.rotation.x += dt * d.sp * .2; d.o.position.y = PO.y + d.y + Math.sin(T * .5 + d.ph) * 4; }
  if (LEVEL !== 'portal' || STATE !== 'play') { portalTag(false); return; }
  // fell off somehow? back onto a pad
  party.forEach(C => { if (mine(C) && !C.ptw && C.pos.y < PO.y - 50) { C.pos.copy(prPad(slotOf(C))).add(V3(0, 2, 0)); C.vel.set(0, 0, 0); C.grounded = false; if (C.disp) C.disp.copy(C.pos); if (C === leader) { trail = []; cam.tgt.copy(C.pos); } } });
  // who's standing in the circle
  const c = prC(), on = C => Math.hypot(C.pos.x - c.x, C.pos.z - c.z) < PR_R && Math.abs(C.pos.y - c.y) < 8;
  const need = NET.on ? 2.4 : .5;
  if (!NET.client) {
    const who = NET.on ? playerChars().filter(C => !C.frozen) : [leader];
    P.rdy = who.filter(on).length; P.tot = who.length;
    const was = P.cd;
    if (P.tot && P.rdy === P.tot) { P.cd += dt; if (NET.on && Math.floor(was / .8) !== Math.floor(P.cd / .8)) tone(660 + Math.floor(P.cd / .8) * 160, 0, .09, .05, 'sine'); if (P.cd >= need) { P.cd = 0; P.out++; P.outSeen = P.out; portalOut(); } }
    else P.cd = 0;
  }
  if (P.rdy !== P.lastN) { if (P.rdy > P.lastN && P.lastN >= 0) tone(520 + P.rdy * 60, 0, .08, .04, 'triangle'); P.lastN = P.rdy; }
  for (let i = 0; i < P.pads.length; i++) { const pd = P.pads[i], C = party.find(q => slotOf(q) % 8 === i); const occ = C && Math.hypot(C.pos.x - pd.p.x, C.pos.z - pd.p.z) < 3.6; pd.gm.opacity = occ ? 1 : i < party.length ? .7 : .25; }
  P.circle.uniforms.uP.value = P.cd / need; P.circle.uniforms.uOn.value = damp(P.circle.uniforms.uOn.value, P.rdy ? 1 : 0, 6, dt);
  P.field.material.uniforms.uK.value = .62 + (P.tot ? P.rdy / P.tot : 0) * .45 + P.cd / need * 1.4;
  portalTag(true);
}
// the label over the exit
function portalTag(show) {
  const el = $('xtag'); if (!el) return;
  if (!show || PAUSED) { if (!el.hidden) el.hidden = true; return; }
  const p = V3(0, 45, 40).add(PO); p.project(camera); const vis = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
  el.hidden = !vis; if (!vis) return;
  el.style.transform = `translate(${((p.x * .5 + .5) * innerWidth).toFixed(1)}px, ${((-p.y * .5 + .5) * innerHeight).toFixed(1)}px) translate(-50%, -100%)`;
  const P = PORT, need = NET.on ? 2.4 : .5, left = Math.max(0, Math.ceil((need - P.cd) / .8));
  const sig = [P.rdy, P.tot, P.cd > 0 ? left : -1, NET.on].join('|'); if (sig === P.tagSig) return; P.tagSig = sig;
  const pips = NET.on ? `<span class="pips">${Array.from({ length: P.tot }, (_, i) => `<i class="${i < P.rdy ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const sub = P.cd > 0 ? (NET.on ? `${left} 秒後出發` : '出發！') : NET.on ? `${P.rdy} / ${P.tot} 準備好` : '站上光圈就出發';
  el.innerHTML = `<b>出口</b>${pips}<small>${sub}</small>`; el.classList.toggle('go', P.cd > 0);
}

// ---------- online prologue: basement → wall → kitchen ----------
function proMarker() {
  if (quest === 0) return LEVEL === 'portal' ? LEVELS.portal.marker() : null;
  if (quest === 2) return V3(-300, 7, 150).add(BO); if (quest === 3) return V3(70, 6, 15).add(HO); if (quest === 4) return STATIC.hubTop || null; return null;
}
function proGecko() {
  PRO.gk = true; const g = chars.gecko; g.wave = false;
  npcWalk(g, [V3(-318, 0, 150).add(BO), V3(-345, 0, 150).add(BO), V3(70, 4, 15).add(HO), V3(30, 4, 8).add(HO), V3(-22, 4, -6).add(HO)], 13, () => { g.yaw = .9; });
}
function mpProTick(dt) {
  if (!NET.on || !PRO.on || !WORLD) return;
  if (quest >= 3 && !PRO.gk) proGecko();
  if (NET.client || STATE !== 'play') return;
  const P = playerChars().filter(C => !C.frozen); if (!P.length) return;
  const crack = C => Math.hypot(C.pos.x - (BO.x - 300), C.pos.z - (BO.z + 150));
  if (quest === 1 && P.some(C => C.grounded && C.pos.y < BO.y + 2 && inZone(ZONES.basement, C.pos.x, C.pos.y, C.pos.z))) { setQuest(2); toastW('下到地面了！去地庫另一邊的牆腳', 2.6); }
  if (quest === 2 && P.some(C => crack(C) < 24 && C.pos.y < BO.y + 4)) { setQuest(3); sayW('前拍檔', '教授？……真的是你？快進來，牆裡面比較安全。', '#b7d38a', 4); }
  if (quest === 3 && P.some(C => inZone(ZONES.wall, C.pos.x, C.pos.y, C.pos.z))) setQuest(4);
  if (P.some(C => inZone(ZONES.kitchen, C.pos.x, C.pos.y, C.pos.z))) proEnd();
}
function proEnd() {
  PRO.on = false; QUESTS = MP_QUESTS; LEVELS.kitchen.quests = MP_QUESTS; CPS = MP_CPS; cp = 0; setQuest(0);
  chapterBanner('第一章', '晚飯時間的廚房'); nsend({ t: 'ban', a: '第一章', b: '晚飯時間的廚房' });
}
function proSend(w) { w.pro = [PRO.on ? 1 : 0, PORT.rdy, PORT.tot, Math.round(PORT.cd * 10), PORT.out]; }
function proRecv(w) {
  const a = w.pro; if (!a) return;
  PORT.rdy = a[1]; PORT.tot = a[2]; PORT.cd = a[3] / 10;
  if (PRO.on && !a[0]) { PRO.on = false; QUESTS = MP_QUESTS; LEVELS.kitchen.quests = MP_QUESTS; CPS = MP_CPS; setQuest(w.q); }
  else if (!PRO.on && a[0]) { PRO.on = true; QUESTS = MP_PRO; CPS = PRO.cps || CPS; setQuest(w.q); }
  if (PORT.outSeen === null) { PORT.outSeen = a[4]; if (a[4] > 0 && leader && inZone(ZONES.portal, leader.pos.x, leader.pos.y, leader.pos.z)) portalOut(); }
  else if (a[4] > PORT.outSeen) { PORT.outSeen = a[4]; portalOut(); }
}
// dev / tests: skip the online prologue (everyone to the kitchen mouse hole, the online story starts)
function proSkip() {
  const P = [[-288, 0, -100], [-294, 0, -96], [-294, 0, -104], [-300, 0, -92], [-300, 0, -108], [-282, 0, -94], [-282, 0, -106], [-276, 0, -100]];
  party.forEach(C => { if (!mine(C)) return; C.ptw = null; C.pos.set(...P[slotOf(C) % 8]); C.vel.set(0, 0, 0); C.grounded = false; C.queue = []; if (C.disp) C.disp.copy(C.pos); });
  PORT.pend = 0; trail = []; if (leader) cam.tgt.copy(leader.pos); LP.snap = true; if (STATE === 'intro') STATE = 'play';
  if (!NET.client && PRO.on) proEnd();
}
