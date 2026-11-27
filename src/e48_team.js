// =====================================================================
//  LOST TEAMMATES (online) — where everyone is, and calling them over
//  · every other player gets a tag: their face, their name, where they are (後花園, 閣樓, 地庫…) and
//    how far. Far off but in view, it floats over their head; off screen, it sits on the screen's
//    edge with an arrow pointing the way. Close by and in view (same place), it's gone.
//  · G (phone: 集合) calls the team over: a chime, a wave and a flare on you, and your tag pulses on
//    everyone's screen for a while, wherever they are. No teleporting: they find their own way to you.
//  (window.__TT = true shows the tags for the AI teammates in single player — for testing the look)
// =====================================================================
const TT = { el: {}, call: {}, cd: 0, v: null };
const TT_CALL = 9;   // seconds a call keeps your tag lit for the others

// where in the world a point is, the way a player would say it
function ttPlace(p) {
  const Z = zoneAt(p); if (!Z) return '';
  switch (Z.id) {
    case 'basement': return '地庫';
    case 'wall': return '牆身入面';
    case 'garage': return '車房';
    case 'yard': return '後園';
    case 'road': return '馬路';
    case 'park': return '公園';
    case 'school': return '學校';
    case 'garden': return p.y > 250 ? '斜屋頂' : p.z > 262 ? '前院' : p.x < -330 ? '屋側' : '後花園';
    case 'roof': { const t = rfTopAt(p.x, p.z); if (t > -1e8 && p.y >= t - 2) return '屋頂'; if (p.y > 516 && p.y < 540 && (p.z < -290 || p.z > 290)) return '坑渠'; return p.x > 912 ? '車房閣樓' : '閣樓'; }
    case 'kitchen': {
      if (p.x < -312) return '牆身入面';
      if (p.z < -262 && p.y < 250) return '屋後';
      return ROOM_NAME[roomOf(p.x, p.z, p.y)] || '屋入面';
    }
  }
  const D = LEVELS[Z.id]; return D && D.room || '';
}
function ttOthers() {
  // (not by root.visible: the game hides anyone right in front of the camera)
  if (NET.on) return party.filter(C => NET.slots[C.id] && !mine(C) && C.pos.y > -800);
  return window.__TT ? party.filter(C => C !== leader && C.pos.y > -800) : [];
}
function ttEl(C) {
  let e = TT.el[C.id]; if (e) return e;
  e = document.createElement('div'); e.className = 'tt'; e.style.setProperty('--tc', C.S.col || '#f4bb72');
  e.innerHTML = `<i class="ta"><b></b></i><span class="tp">${PORTRAITS[C.id] ? `<img alt="" src="${PORTRAITS[C.id]}">` : ''}</span><span class="tx"><b>${C.S.name}</b><small></small></span>`;
  $('tt').appendChild(e); TT.el[C.id] = e; e._sm = e.querySelector('small'); e._ta = e.querySelector('.ta'); e._last = ''; return e;
}
function teamTick(dt) {
  TT.cd -= dt; for (const id in TT.call) if ((TT.call[id] -= dt) <= 0) delete TT.call[id];
  if (NET.on && (pressed.KeyG || pressed.GCall) && STATE === 'play' && !GHOST.on) teamCall();
  const L = leader, show = (STATE === 'play' || STATE === 'fail') && L && !CINE.on;
  const list = show ? ttOthers() : [], seen = new Set();
  const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2;
  const mL = TOUCH ? 92 : 70, mR = TOUCH ? 92 : 70, mT = TOUCH ? 96 : 120, mB = TOUCH ? 150 : 170;
  const myZ = zoneAt(L ? L.pos : V3()), q = $('quest'), qr = q && q.offsetParent ? q.getBoundingClientRect() : null, placed = [];
  for (const C of list) {
    const d = L.pos.distanceTo(C.pos), calling = TT.call[C.id] > 0, Zc = zoneAt(C.pos);
    const v = (TT.v || (TT.v = V3())).set(C.pos.x, C.pos.y + C.h * 1.25, C.pos.z).project(camera), behind = v.z > 1;
    const onScr = !behind && Math.abs(v.x) < .9 && Math.abs(v.y) < .86;
    if (!calling && Zc === myZ && (d < 250 || (onScr && d < 450))) continue;   // (right beside you, or close and in view: no tag)
    seen.add(C.id); const e = ttEl(C);
    let x, y, edge = !onScr;
    if (!edge) { x = (v.x * .5 + .5) * W; y = (-v.y * .5 + .5) * H - 30; }
    else {
      // off screen: along the line from the middle toward them, stopped at an inset frame
      let dx = v.x * W / 2, dy = -v.y * H / 2; if (behind) { dx = -dx; dy = -dy; if (Math.abs(dy) < H * .1) dy = H * .4; }
      if (Math.hypot(dx, dy) < 1) dy = 1;
      const tx = dx > 0 ? (W / 2 - mR) / dx : dx < 0 ? (W / 2 - mL) / -dx : 1e9, ty = dy > 0 ? (H / 2 - mB) / dy : dy < 0 ? (H / 2 - mT) / -dy : 1e9, t = Math.min(tx, ty);
      x = cx + dx * t; y = cy + dy * t; e._ta.style.transform = `rotate(${Math.atan2(dy, dx).toFixed(3)}rad)`;
    }
    if (qr && x < qr.right + 40 && y < qr.bottom + 30) y = qr.bottom + 30;   // (never on top of the quest card)
    for (const p of placed) if (Math.abs(p[0] - x) < 120 && Math.abs(p[1] - y) < 40) y = p[1] + (y >= p[1] ? 42 : -42);   // (two tags in one spot: stack them)
    placed.push([x, y]);
    // (anchored on the face: on the right edge the words go to its left; over a head, the tag is centred)
    const flip = edge && x > cx, k = TOUCH ? 34 : 40, sh = edge ? (flip ? `translateX(calc(-100% + ${k}px))` : '') : `translateX(calc(-50% + ${k / 2}px))`;
    e.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${sh}`;
    e.classList.toggle('edge', edge); e.classList.toggle('flip', flip); e.classList.toggle('call', calling); e.classList.toggle('toy', !!C.frozen);
    const where = C.frozen ? '變咗玩具' : ttPlace(C.pos), txt = calling ? '叫你過去集合！' : `${where}${where ? ' · ' : ''}${(d / 100).toFixed(d < 1000 ? 1 : 0)} m`;
    if (txt !== e._last) { e._sm.textContent = txt; e._last = txt; }
    e.classList.add('on');
  }
  for (const id in TT.el) if (!seen.has(id)) TT.el[id].classList.remove('on');
}
// G: call everyone over
function teamCall() {
  if (TT.cd > 0 || !leader || leader.frozen) return; TT.cd = 4;
  teamCallFx(leader.id, true); nsend({ t: 'call', id: leader.id });
}
function teamCallFx(id, own) {
  const C = chars[id]; if (!C) return; if (!own) TT.call[id] = TT_CALL;
  const d = camera.position.distanceTo(C.pos), vol = own ? 1 : clamp(1 - d / 2400, .4, 1);
  tone(784, 988, .14, .05 * vol, 'triangle'); setTimeout(() => tone(988, 1319, .16, .045 * vol, 'triangle'), 130); setTimeout(() => tone(1319, 1319, .34, .035 * vol, 'sine'), 280);
  if (C.root.visible) { emoShow(C, 'wave'); for (let i = 0; i < 26; i++) emit(V3(C.pos.x, C.pos.y + C.h * .7, C.pos.z), V3(R(-16, 16), R(14, 42), R(-16, 16)), new THREE.Color(2, 1.45, .55), R(.2, .45), R(.5, 1.1), -10, 1); }
  toast(own ? '叫咗隊友過嚟集合' : `${C.S.name}：嚟呢度集合！`, own ? 1.8 : 2.8);
}
