(() => {
  const { THREE, chars } = window.__bn; const S = window.__ICON || 1024;
  const C = chars.dad; const par = C.root.parent, pp = C.root.position.clone(), rr = C.root.rotation.clone(), vis = C.root.visible;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(S, S); r.setPixelRatio(1);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2; r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  // soft studio env: warm from the front-right, cool from behind
  const es = new THREE.Scene(); es.background = new THREE.Color(0x30343c);
  const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(es, .04).texture; sc.environmentIntensity = .5;
  sc.add(new THREE.HemisphereLight(0xfff0e0, 0x203040, 1.1));
  const key = new THREE.DirectionalLight(0xffe0bc, 3.2); key.position.set(4, 6, 7); sc.add(key);
  const rim = new THREE.DirectionalLight(0x7fe8ff, 4.2); rim.position.set(-6, 4, -5); sc.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffc08a, 2.0); rim2.position.set(6, 2, -5); sc.add(rim2);
  C.root.visible = true; C.state = 'idle'; C.wave = false; C.look = 0; C.emo = null; sc.add(C.root); C.root.position.set(0, 0, 0); C.root.rotation.set(0, window.__RY ?? -.12, 0);
  C.neck.rotation.y = 0; for (const a of C.arms) a.rotation.set(0, 0, a.userData.s * .22); for (const l of C.legs) l.rotation.set(0, 0, 0); C.body.rotation.set(0, 0, 0); C.body.position.y = .92 * C.k;
  const furs = []; C.root.traverse(o => { if (o.isInstancedMesh && o.material.userData.U) { const U = o.material.userData.U; furs.push([o, U, U.uLen.value, o.count, U.uShells.value]); U.uLen.value *= (window.__FL || .55); o.count = 18; U.uShells.value = 18; } }); C.head.rotation.x = -.06; for (const e of C.eyes) e.scale.y = 1.12;
  const cam = new THREE.PerspectiveCamera(window.__FOV || 19, 1, .1, 100); const hy = (window.__HY || 3.05) * C.k;
  cam.position.set(window.__CX ?? 1.3, hy + .9, 11.5); cam.lookAt(0, hy, 0); r.render(sc, cam);
  // compose: a deep blue-black field, a warm glow behind the head, a faint cyan ring like the machine's field
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  let g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#16222e'); g.addColorStop(1, '#07090c'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  g = x.createRadialGradient(S * .5, S * .42, 0, S * .5, S * .42, S * .62); g.addColorStop(0, 'rgba(255,190,120,.55)'); g.addColorStop(.45, 'rgba(255,150,90,.16)'); g.addColorStop(1, 'rgba(255,150,90,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(110,246,238,.28)'; x.lineWidth = S * .012; x.beginPath(); x.arc(S * .5, S * .44, S * .36, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = 'rgba(110,246,238,.10)'; x.lineWidth = S * .05; x.beginPath(); x.arc(S * .5, S * .44, S * .36, 0, Math.PI * 2); x.stroke(); x.restore();
  // a soft shadow under the figure, then the figure
  x.save(); x.filter = `blur(${S * .02}px) brightness(0)`; x.globalAlpha = .5; x.drawImage(r.domElement, 0, S * .015); x.restore();
  x.drawImage(r.domElement, 0, 0);
  // vignette
  g = x.createRadialGradient(S * .5, S * .5, S * .35, S * .5, S * .5, S * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (const [o, U, l, n, sh] of furs) { U.uLen.value = l; o.count = n; U.uShells.value = sh; } par.add(C.root); C.root.position.copy(pp); C.root.rotation.copy(rr); C.root.visible = vis; pm.dispose(); r.dispose();
  return cv.toDataURL('image/png');
})()
