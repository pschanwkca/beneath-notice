(() => {
  // the home-screen icon, made like the big game icons: the professor's face filling the frame, a bold
  // sunset behind him (the roof at sunset, as on the title screen), a rim of sun on his fur, the city small below
  const { THREE, chars, RoomEnvironment } = window.__bn; const S = window.__ICON || 1024;
  const C = chars.dad; const par = C.root.parent, pp = C.root.position.clone(), rr = C.root.rotation.clone(), vis = C.root.visible;
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); pr.setSize(S, S); pr.setPixelRatio(1);
  pr.toneMapping = THREE.ACESFilmicToneMapping; pr.toneMappingExposure = 1.2; pr.setClearColor(0x000000, 0); pr.outputColorSpace = THREE.SRGBColorSpace;
  const ps = new THREE.Scene(); const pm = new THREE.PMREMGenerator(pr); ps.environment = pm.fromScene(new RoomEnvironment(), .04).texture; ps.environmentIntensity = .5;
  ps.add(new THREE.HemisphereLight(0xffe8f0, 0x3a2a50, .9));
  const key = new THREE.DirectionalLight(0xfff0e0, 2.2); key.position.set(-2, 3, 8); ps.add(key);                  // soft front light: the face reads
  const sun = new THREE.DirectionalLight(0xff9a4a, 11); sun.position.set(4, 2.2, -6); ps.add(sun);                    // the low sun behind his right shoulder: an orange rim
  const sky = new THREE.DirectionalLight(0x8a7cff, 3.2); sky.position.set(-6, 4, -3); ps.add(sky);                    // lavender rim on the other side
  C.root.visible = true; for (const t of C.tail) t.visible = false; C.state = 'idle'; C.wave = false; C.look = 0; C.emo = null; ps.add(C.root); C.root.position.set(0, 0, 0); C.root.rotation.set(0, window.__RY ?? -.32, 0);
  C.neck.rotation.set(0, window.__NY ?? .1, window.__NZ ?? .1); C.head.rotation.x = -.12; for (const a of C.arms) a.rotation.set(0, 0, a.userData.s * .22); for (const l of C.legs) l.rotation.set(0, 0, 0); C.body.rotation.set(0, 0, 0); C.body.position.y = .92 * C.k; for (const e of C.eyes) e.scale.y = 1.12;
  const furs = []; C.root.traverse(o => { if (o.isInstancedMesh && o.material.userData.U) { const U = o.material.userData.U; furs.push([o, U, U.uLen.value, o.count, U.uShells.value]); U.uLen.value *= (window.__FL || .55); o.count = 18; U.uShells.value = 18; } });
  const hy = 3.6 * C.k, pc = new THREE.PerspectiveCamera(window.__FOV || 25, 1, .1, 100);
  pc.position.set(.7 * C.k, hy - .35 * C.k, 7.6 * C.k); pc.lookAt(0, hy + (window.__LY ?? .05) * C.k, 0); pr.render(ps, pc);
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  // the sky: violet at the top through rose to a hot orange low down
  let g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#3a2468'); g.addColorStop(.38, '#8a3a86'); g.addColorStop(.66, '#e2607a'); g.addColorStop(.86, '#ff9a52'); g.addColorStop(1, '#ffc46a'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  // the sun's glow behind him, upper right
  g = x.createRadialGradient(S * .86, S * .56, 0, S * .86, S * .56, S * .6); g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(.12, 'rgba(255,190,110,.65)'); g.addColorStop(.45, 'rgba(255,120,90,.18)'); g.addColorStop(1, 'rgba(255,120,90,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  // the city, small and far, along the bottom (lights coming on)
  let px = -10; const rows = [];
  while (px < S + 10) { const w = S * (.025 + Math.random() * .05), h = S * (.05 + Math.random() * .13) * (Math.abs(px / S - .5) < .3 ? 1.25 : .9); rows.push([px, w, h]); px += w * (.7 + Math.random() * .5); }
  for (const [tx, w, h] of rows) { x.fillStyle = '#2a1838'; x.fillRect(tx, S - h, w, h); for (let wy = S - h + S * .012; wy < S; wy += S * .014) for (let wx = tx + S * .006; wx < tx + w - S * .006; wx += S * .011) if (Math.random() < .22) { x.fillStyle = 'rgba(255,214,150,.9)'; x.fillRect(wx, wy, S * .005, S * .005); } }
  // him, big
  const z = window.__ZK || 1.0, w = S * z; x.drawImage(pr.domElement, S * (window.__OX ?? 0) + (S - w) / 2, S * (window.__OY ?? .02) + (S - w) / 2, w, w);
  // a little lift at the top and a soft vignette
  g = x.createRadialGradient(S * .5, S * .5, S * .42, S * .5, S * .5, S * .78); g.addColorStop(0, 'rgba(20,8,30,0)'); g.addColorStop(1, 'rgba(20,8,30,.35)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (const [o, U, l, n, sh] of furs) { U.uLen.value = l; o.count = n; U.uShells.value = sh; }
  for (const t of C.tail) t.visible = true; C.neck.rotation.set(0, 0, 0); par.add(C.root); C.root.position.copy(pp); C.root.rotation.copy(rr); C.root.visible = vis; pm.dispose(); pr.dispose();
  return cv.toDataURL('image/png');
})()
