// Build step: concatenates the game's source files for the <script type="module"> and wraps every
// player-facing Chinese string so it can be shown in English:  '中文' → TR('中文'),  `中文${x}` → TRT`中文${x}`.
// TR / TRT (src/i18n.js) return the string itself in Chinese, or its English from src/i18n_en.js.
// Usage: node tools/i18n_wrap.mjs src/a.js src/b.js … > out.js        (--list prints strings with no English yet)
import * as acorn from './vendor/acorn.mjs'; import * as walk from './vendor/acorn-walk.mjs'; import fs from 'fs';
const CJK = /[㐀-鿿]/;
const args = process.argv.slice(2), list = args[0] === '--list'; const files = list ? args.slice(1) : args;
let dict = null; if (list) { const src = fs.readFileSync('src/i18n_en.js', 'utf8'); dict = { EN: JSON.parse(src.match(/const I18N_EN = (\{[\s\S]*?\});\n/)[1]), ENT: JSON.parse(src.match(/const I18N_ENT = (\{[\s\S]*?\});\n/)[1]) }; }
const missing = new Set(); let out = '';
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  if (f.endsWith('i18n.js') || f.endsWith('i18n_en.js')) { out += code + '\n'; continue; }
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
  const ins = [];   // [pos, text]
  walk.fullAncestor(ast, (n, st, anc) => {
    const p = anc[anc.length - 2];
    if (n.type === 'Literal' && typeof n.value === 'string' && CJK.test(n.value)) {
      if (p && ((p.type === 'Property' && p.key === n && !p.computed) || p.type === 'ImportDeclaration' || p.type === 'ExportNamedDeclaration')) return;
      ins.push([n.start, 'TR('], [n.end, ')']); if (list && !(n.value in dict.EN)) missing.add(n.value);
    } else if (n.type === 'TemplateLiteral' && n.quasis.some(q => CJK.test(q.value.cooked))) {
      if (p && p.type === 'TaggedTemplateExpression') return;
      ins.push([n.start, 'TRT']);
      if (list) { const k = n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? `{${i}}` : '')).join(''); if (!(k in dict.ENT)) missing.add(k); }
    }
  });
  ins.sort((a, b) => b[0] - a[0]); let s = code; for (const [pos, t] of ins) s = s.slice(0, pos) + t + s.slice(pos);
  out += s + '\n';
}
if (list) { for (const m of missing) console.log(m); console.error(missing.size + ' strings without English'); } else process.stdout.write(out);
