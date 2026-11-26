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
node tools/i18n_wrap.mjs src/i18n_en.js src/i18n.js src/a_core.js src/e8_world.js src/b_lore.js src/c_world.js src/d_chars.js src/e35_human.js src/e36_real.js src/e_game.js src/e2_team.js src/e3_toy.js src/e4_size.js src/e5_chars.js src/e9_crew.js src/e10_roster.js src/e6_kitchen2.js src/e7_living.js src/f_levels.js src/e11_garage.js src/e12_yard.js src/e13_newcrew.js src/e14_test.js src/e15_road.js src/e16_takers.js src/e17_music.js src/e19_house.js src/e20_brain.js src/e21_garage2.js src/e22_upstairs.js src/g_net.js src/e18_voice.js src/e23_emotes.js src/e24_title.js src/e25_portal.js src/e26_watch.js src/e27_unstuck.js src/e28_lobby.js src/e29_netlog.js src/e30_park.js src/e31_mole.js src/e32_shell.js src/e33_solid.js src/e34_roo.js src/e37_cine.js src/e38_school.js src/e39_school2.js src/e40_school3.js src/e41_school_mp.js src/z_boot.js
cat <<'X'
</script>
</body>
</html>
X
} > index.html
sed -i "s/__BUILD__/$(date -u +%Y%m%d-%H%M)/" index.html
# 超寫實版: the same build with the realistic renderer switched on
sed 's#<script type="importmap">#<script>window.__REAL=1</script><script type="importmap">#' index.html > real.html
wc -c index.html real.html
