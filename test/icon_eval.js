(() => {
  // the home-screen icon: the professor's portrait exactly as the game draws it in the party bar
  // (same camera, turn, lights and studio reflections), in the same round frame with the amber ring
  const { THREE, chars, RoomEnvironment } = window.__bn; const S = window.__ICON || 1024;
  const C = chars.dad; const par = C.root.parent, pp = C.root.position.clone(), rr = C.root.rotation.clone(), vis = C.root.visible;
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); pr.setSize(S, S); pr.setPixelRatio(1);
  pr.toneMapping = THREE.ACESFilmicToneMapping; pr.toneMappingExposure = 1.15; pr.setClearColor(0x000000, 0);
  const ps = new THREE.Scene(); const pm = new THREE.PMREMGenerator(pr); ps.environment = pm.fromScene(new RoomEnvironment(), .04).texture; ps.environmentIntensity = .55;
  const key = new THREE.DirectionalLight(0xffe2c0, 2.4); key.position.set(3, 5, 6); ps.add(key); const rim = new THREE.DirectionalLight(0x9fc6ff, 2.6); rim.position.set(-4, 3, -5); ps.add(rim);
  const pc = new THREE.PerspectiveCamera(24, 1, .1, 100);
  C.root.visible = true; C.state = 'idle'; C.wave = false; C.look = 0; C.emo = null; ps.add(C.root); C.root.position.set(0, 0, 0); C.root.rotation.set(0, -.35, 0);
  C.neck.rotation.y = 0; for (const a of C.arms) a.rotation.set(0, 0, a.userData.s * .22); for (const l of C.legs) l.rotation.set(0, 0, 0); C.body.rotation.set(0, 0, 0); C.body.position.y = .92 * C.k; for (const e of C.eyes) e.scale.y = 1.12;
  const furs = []; C.root.traverse(o => { if (o.isInstancedMesh && o.material.userData.U) { const U = o.material.userData.U; furs.push([o, U, U.uLen.value, o.count, U.uShells.value]); U.uLen.value *= (window.__FL || .8); o.count = 18; U.uShells.value = 18; } });
  const hy = 3.55 * C.k; pc.position.set(1.4 * C.k, hy + .5 * C.k, 9 * C.k); pc.lookAt(0, hy - .1 * C.k, 0); pr.render(ps, pc);
  // the frame (as in the party bar): a navy disc lit from above, an amber ring with a soft glow, on the dark game background
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  x.fillStyle = '#0b0e13'; x.fillRect(0, 0, S, S);
  let g = x.createRadialGradient(S * .5, S * .45, 0, S * .5, S * .5, S * .72); g.addColorStop(0, 'rgba(244,187,114,.10)'); g.addColorStop(1, 'rgba(244,187,114,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  const cx = S / 2, cy = S / 2, R = S * (window.__RR || .40), ring = S * .028;
  x.save(); x.beginPath(); x.arc(cx, cy, R + ring * 2.2, 0, 7); x.fillStyle = 'rgba(244,187,114,.08)'; x.fill(); x.restore();
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
  g = x.createRadialGradient(cx, cy - R * .3, 0, cx, cy, R * 1.05); g.addColorStop(0, '#2b3442'); g.addColorStop(1, '#121820'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  const w = 2 * R * (window.__ZK || 1.0);   // the portrait fills the circle, as the 160 px image fills the 64 px frame
  x.drawImage(pr.domElement, cx - w / 2, cy - w / 2 + (window.__DY || 0) * S, w, w); x.restore();
  x.beginPath(); x.arc(cx, cy, R + ring / 2, 0, 7); x.lineWidth = ring; x.strokeStyle = '#f4bb72'; x.stroke();
  for (const [o, U, l, n, sh] of furs) { U.uLen.value = l; o.count = n; U.uShells.value = sh; }
  par.add(C.root); C.root.position.copy(pp); C.root.rotation.copy(rr); C.root.visible = vis; pm.dispose(); pr.dispose();
  return cv.toDataURL('image/png');
})()
