#!/bin/bash
set -e
cd "$(dirname "$0")"
{
cat src/head.html
cat <<'X'
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
<script>window.addEventListener('error',function(e){var el=document.getElementById('err');if(el)el.textContent+='\n'+(e.message||'')+' @'+(e.filename||'').split('/').pop()+':'+(e.lineno||'');});</script>
<script>
X
cat vendor/trystero.iife.js
cat <<'X'
</script>
<script type="module">
X
cat src/a_core.js src/e8_world.js src/b_lore.js src/c_world.js src/d_chars.js src/e_game.js src/e2_team.js src/e3_toy.js src/e4_size.js src/e5_chars.js src/e9_crew.js src/e10_roster.js src/e6_kitchen2.js src/e7_living.js src/f_levels.js src/e11_garage.js src/e12_yard.js src/e13_newcrew.js src/e14_test.js src/e15_road.js src/g_net.js src/z_boot.js
cat <<'X'
</script>
</body>
</html>
X
} > index.html
wc -c index.html
