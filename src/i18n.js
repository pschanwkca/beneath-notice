// =====================================================================
//  Language: 中文 (default) or English.  ?lang=en / ?lang=zh in the address, or the button on the title
//  screen (remembered).  The build wraps every Chinese string in the code: TR('…') and TRT`…${x}…`.
// =====================================================================
const LANG = (() => {
  let l = null;
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'zh') { l = q; localStorage.setItem('bn_lang', q); } } catch (e) { }
  if (!l) try { l = localStorage.getItem('bn_lang'); } catch (e) { }
  return l === 'en' ? 'en' : 'zh';
})();
const LANG_EN = LANG === 'en';
function TR(s) { if (!LANG_EN) return s; const t = I18N_EN[s]; return t === undefined ? s : t; }
function TRT(strs, ...vals) {
  if (LANG_EN) { let k = ''; for (let i = 0; i < strs.length; i++) k += strs[i] + (i < vals.length ? '{' + i + '}' : ''); const t = I18N_ENT[k]; if (t !== undefined) return t.replace(/\{(\d+)\}/g, (m, i) => vals[+i]); }
  let s = ''; for (let i = 0; i < strs.length; i++) s += strs[i] + (i < vals.length ? vals[i] : ''); return s;
}
// the page's own words (the HTML shell): swapped once at start
function i18nPage() {
  document.documentElement.lang = LANG_EN ? 'en' : 'zh-Hant';
  const btn = document.getElementById('goLang'); if (btn) { btn.textContent = LANG_EN ? '中文' : 'English'; btn.title = LANG_EN ? '轉做中文' : 'Play in English'; btn.onclick = () => { try { localStorage.setItem('bn_lang', LANG_EN ? 'zh' : 'en'); } catch (e) { } const u = new URL(location.href); u.searchParams.set('lang', LANG_EN ? 'zh' : 'en'); location.href = u.toString(); }; }
  if (!LANG_EN) return;
  document.title = 'BENEATH NOTICE';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const raw = n.nodeValue, t = raw.trim(); if (!t || !/[㐀-鿿]/.test(t)) continue; const e = I18N_EN[t]; if (e !== undefined) n.nodeValue = raw.replace(t, e); }
  for (const el of document.querySelectorAll('[title],[aria-label],[placeholder],[alt]')) for (const a of ['title', 'aria-label', 'placeholder', 'alt']) { const v = el.getAttribute(a); if (v && I18N_EN[v.trim()] !== undefined) el.setAttribute(a, I18N_EN[v.trim()]); }
  document.body.classList.add('lang-en');
}
i18nPage();
