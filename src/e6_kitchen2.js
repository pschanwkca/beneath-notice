
// =====================================================================
//  KITCHEN, second pass
//  - routes up to the worktops (appliance cords hanging to floor sockets)
//  - places to hide: bread basket, paper-towel roll, recycling bin, school bag,
//    big potted plant, a tablecloth hanging off the dining table
//  - block steps up to the toy box
//  - resizable things are marked with a thin outline (only while Dad, who has the gun, is active)
// =====================================================================
// ---------- outline (inverted hull, constant width on screen) ----------
const OUTLINE = {};
function outlineMat(color, op, thick) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: op }, uT: { value: thick }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) } },
    vertexShader: `uniform float uT; uniform vec2 uRes;
      void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 d = normalize(normalMatrix * (length(position) > 1e-5 ? normalize(position) : normal));
        vec2 o = normalize((projectionMatrix * vec4(d, 0.0)).xy + 1e-6);
        c.xy += o * uT * c.w * 2.0 / uRes; gl_Position = c; }`,
    fragmentShader: `uniform vec3 uC; uniform float uO; void main(){ gl_FragColor = vec4(uC, uO); }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false
  });
}
function outlineInit() { if (OUTLINE.dim) return; OUTLINE.dim = outlineMat(0x9ff6ef, .55, 1.6); OUTLINE.aim = outlineMat(0xc8fffb, 1, 3.2); }
function addOutline(r) {
  outlineInit(); r.hulls = [];
  r.mesh.traverse(o => { if (!o.isMesh || o.userData.hull) return; const h = new THREE.Mesh(o.geometry, OUTLINE.dim); h.userData.hull = true; h.castShadow = false; h.receiveShadow = false; h.renderOrder = 2; h.visible = false; h.raycast = () => { }; o.add(h); r.hulls.push(h); });
}
function updOutlines() {
  if (!OUTLINE.dim) return; const show = leader && leader.id === 'dad' && STATE === 'play' && !leader.frozen;
  OUTLINE.dim.uniforms.uRes.value.set(innerWidth, innerHeight); OUTLINE.aim.uniforms.uRes.value.set(innerWidth, innerHeight);
  OUTLINE.aim.uniforms.uO.value = .75 + Math.sin(T * 8) * .25;
  for (const r of resizables) {
    if (!r.hulls) addOutline(r);
    const near = show && !r.gone && Math.hypot(r.cx - leader.pos.x, r.cz - leader.pos.z) < 320; const aimed = aimRes && aimRes.r === r;
    for (const h of r.hulls) { h.visible = near || r.pulse > 0; h.material = aimed || r.pulse > 0 ? OUTLINE.aim : OUTLINE.dim; }
  }
}

// ---------- more household things become resizable (and pushable) ----------
function propsKitchen2(K) {
  const RG = (W, H, D, fn, mats, x, z, y0, mn, mx, name, rot) => resGroup(cmGroup(W, H, D, fn, mats, rot || 0), x, z, y0, W, H, D, mn, mx, name, true);
  // cutting board with carrot slices
  RG(42, 1.8, 33, ({ part }) => { part(new THREE.BoxGeometry(42, 1.8, 33), K.wood, 0, 0, 0); for (let i = 0; i < 6; i++) part(new THREE.CylinderGeometry(1.4, 1.4, .5, 14), K.carrot, R(-14, 12), 1.1, R(-9, 9)); }, [K.wood], -27, -188.5, 90, .3, 4, '砧板');
  // dinner plate with cookies, glass of milk
  RG(20, 1, 20, ({ part }) => { part(new THREE.CylinderGeometry(10, 9, 1, 40), MAT.white, 0, 0, 0); for (const [x, z] of [[-6, 2], [5, -5]]) part(new THREE.CylinderGeometry(2.6, 2.6, .8, 16), K.cookie, x, .9, z); }, [MAT.white], -150, 88, 76, .3, 4, '碟');
  RG(7.2, 12, 7.2, ({ part }) => { part(new THREE.CylinderGeometry(3.6, 3.4, 12, 24), K.milkGlass, 0, 0, 0); }, [K.milkGlass], -112, 100, 76, .3, 6, '牛奶杯');
  // things inside the fridge
  RG(12, 22, 12, ({ part }) => { part(new THREE.BoxGeometry(12, 22, 12), K.milk, 0, 0, 0); }, [K.milk], 166, -200, 48, .3, 4, '牛奶盒');
  RG(10, 18, 12, ({ part }) => { part(new THREE.BoxGeometry(10, 18, 12), K.juice, 0, 0, 0); }, [K.juice], 181, -204, 48, .3, 4, '果汁');
  // under the sink: detergent bottle and a cardboard box
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x3aa0d8, roughness: .3, clearcoat: .8 });
  RG(8.4, 22, 8.4, ({ part }) => { part(new THREE.CylinderGeometry(4.2, 4.2, 18, 20), blue, 0, -2, 0); part(new THREE.CylinderGeometry(1.4, 1.4, 4, 12), MAT.white, 0, 9, 0); }, [blue], -122, -190, 13, .3, 3, '洗潔精');
  RG(16, 11, 14, ({ part }) => { part(new THREE.BoxGeometry(16, 11, 14), MAT.cardB, 0, 0, 0); }, [MAT.cardB], -74, -199, 13, .3, 3, '紙盒');
  // cat cushion, potted herb on the window sill
  const cg = cmGroup(44, 4, 38, ({ part }) => { part(new THREE.CylinderGeometry(22, 22, 4, 40), K.cushion, 0, 0, 0).scale.z = .85; }, [K.cushion]);
  const cr = resGroup(cg, 190, -112, 0, 44, 4, 38, .5, 3, '貓墊', true); cr.c.small = true;
  const herb = furMat({ color: 0x5f9a3a, len: 1.6, den: .9, droop: -.4, clump: .6, rimK: .1, root: .5 });
  RG(12, 21, 12, ({ part, fur }) => { part(new THREE.CylinderGeometry(5, 4.4, 9, 20), MAT.paintRed, 0, -6, 0); fur(new THREE.SphereGeometry(6, 24, 16), herb, 0, 4, 0); }, [MAT.paintRed], -120, -216, 110, .4, 3, '香草盆栽');
  // kettle on the left worktop (its cord is a way up)
  const kt = new THREE.MeshPhysicalMaterial({ color: 0xd8dde2, metalness: .9, roughness: .22 });
  RG(18, 22, 14, ({ part }) => { part(new THREE.CylinderGeometry(7, 8, 18, 28), kt, 0, -2, 0); part(new THREE.CylinderGeometry(4, 7, 3, 28), kt, 0, 8.5, 0); part(new THREE.TorusGeometry(5, 1, 8, 20, Math.PI), MAT.black, -4, 4, 0, { r: [0, 0, Math.PI / 2 + .3] }); part(new THREE.CylinderGeometry(.8, 1.4, 7, 10), kt, 8, 0, 0, { r: [0, 0, -1] }); }, [kt], -186, -204, 90, .3, 3, '電熱水壺');
}
// cords: hanging from the worktop edge to a floor socket — climbable all the way up
function cordRoute(x0, ztop, xs, zs) {
  const cm = new THREE.MeshStandardMaterial({ color: 0xece8e0, roughness: .6 });
  tubeM([[x0 - 10, 90.6, ztop], [x0, 90.6, ztop + 18], [x0, 90.6, -157.2], [x0, 86, -156.4], [x0 + .3, 46, -156.2], [x0 + 1, 8, -155.8], [x0 + 5, 1.2, -150], [xs, 1.2, zs]], .75, cm, 90);
  box(xs - 6, xs + 6, 0, 2.2, zs - 3, zs + 3, MAT.white, { col: true });
  for (const s of [-1, 1]) box(xs + s * 2.4 - .4, xs + s * 2.4 + .4, 2.2, 2.6, zs - 1, zs + 1, MAT.black, { col: false });
  cols.push({ t: 'b', x0: x0 - 1.1, x1: x0 + 1.1, y0: 0, y1: 90, z0: -157.6, z1: -155.2 });
}
function hideSpotsKitchen(K) {
  // bread basket on the left worktop: low wicker walls you can hide behind
  const wick = new THREE.MeshStandardMaterial({ color: 0xa8743e, roughness: .95, map: K.wood.map || null });
  const bx = -232, bz = -196; box(bx - 15, bx + 15, 90, 90.8, bz - 10, bz + 10, wick); box(bx - 15, bx + 15, 90.8, 101, bz - 10, bz - 9, wick); box(bx - 15, bx + 15, 90.8, 101, bz + 9, bz + 10, wick); box(bx - 15, bx - 14, 90.8, 101, bz - 9, bz + 9, wick); box(bx + 14, bx + 15, 90.8, 101, bz - 9, bz + 9, wick);
  const bun = mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshStandardMaterial({ color: 0xc98a45, roughness: .7 }), bx - 6, 94, bz + 2); bun.scale.set(1.4, .7, 1); cols.push({ t: 'c', x: bx - 6, z: bz + 2, r: 5.5, y0: 90.8, y1: 97.5 });
  // paper-towel roll in a holder
  cyl(-48, -214, 5.8, 90, 116, new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: .95 }), { seg: 28 }); cyl(-48, -214, 7, 90, 91.2, MAT.dsteel, { seg: 24 }); cyl(-48, -214, .6, 116, 120, MAT.dsteel, { col: false });
  // recycling bin beside the right cabinets
  const rb = new THREE.MeshPhysicalMaterial({ color: 0x2f6fb5, roughness: .45, clearcoat: .4 }); box(108, 132, 0, 26, -152, -134, rb); box(107, 133, 26, 27.5, -153, -133, rb, { col: false });
  // school bag by the dining table (climbable, a good look-out)
  const bag = new THREE.MeshPhysicalMaterial({ color: 0x8a5ad0, roughness: .8, sheen: .6 }); box(-266, -236, 0, 32, 70, 86, bag); box(-264, -238, 18, 30, 86, 88, new THREE.MeshPhysicalMaterial({ color: 0xf2c94c, roughness: .6 }));
  for (const s of [-1, 1]) tubeM([[-251 + s * 8, 32, 70.5], [-251 + s * 8, 26, 66], [-251 + s * 8, 6, 67]], .9, MAT.black, 20);
  // big potted plant in the corner
  cyl(-276, 192, 15, 0, 30, new THREE.MeshPhysicalMaterial({ color: 0xc46a3a, roughness: .75 }), { seg: 32 });
  const leaf = furMat({ color: 0x3f7a33, len: 3.2, den: .45, droop: -.2, clump: .7, rimK: .12, root: .45 });
  for (const [x, y, z, r] of [[-276, 52, 192, 20], [-262, 64, 182, 13], [-290, 60, 204, 14]]) { const m = furMesh(new THREE.SphereGeometry(r, 28, 18), leaf); m.position.set(x, y, z); LV.add(m); }
  cols.push({ t: 'c', x: -276, z: 192, r: 20, y0: 32, y1: 70, noRay: false });
  // tablecloth hanging off the side of the dining table: shade underneath, hidden from the kitchen
  const cloth = new THREE.MeshPhysicalMaterial({ color: 0xeee5d4, roughness: .9, sheen: .6, side: THREE.DoubleSide });
  box(-45.8, -44.6, 46, 76, 42, 128, cloth);
  // block steps up to the toy box (pushable and resizable too)
  const bc = ['#e0507a', '#3c78c8', '#f2c94c', '#5bbf6a'].map((col, i) => { const [cv, cx] = cnv(128, 128); cx.fillStyle = '#e9d6b4'; cx.fillRect(0, 0, 128, 128); cx.font = '900 92px "Fredoka",sans-serif'; cx.textAlign = 'center'; cx.fillStyle = col; cx.fillText('DEFG'[i], 64, 98); return new THREE.MeshStandardMaterial({ map: tex(cv), roughness: .7 }); });
  [[207, 7], [214.6, 14], [222.1, 21]].forEach(([x, h], i) => resGroup(cmGroup(7.4, h, 9, ({ part }) => { part(new THREE.BoxGeometry(7.4, h, 9), bc[i], 0, 0, 0); }, [bc[i]]), x, 118, 0, 7.4, h, 9, .4, 3, '積木', true));
}
