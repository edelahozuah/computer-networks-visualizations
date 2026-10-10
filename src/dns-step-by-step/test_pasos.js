// Comprueba todas las escenas (ids únicos, sin NaN/undefined, vuelos válidos) y genera el guion de narración.
const fs = require('fs');
const src = ['dibujo.js', 'pasos.js'].map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('\n');
const { PASOS, ACTOS, marco } = new Function(src + '\nreturn { PASOS, ACTOS, marco };')();
let errores = 0;
const mal = m => { console.error('✗ ' + m); errores++; };
PASOS.forEach((p, i) => {
  const els = [...marco(p, i, PASOS.length), ...p.escena()], ids = new Set();
  for (const e of els) {
    if (ids.has(e.id)) mal(`paso ${i + 1}: id repetido ${e.id}`);
    ids.add(e.id);
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) mal(`paso ${i + 1}: posición no numérica en ${e.id}`);
    if (/NaN|undefined|Infinity/.test(e.html)) mal(`paso ${i + 1}: NaN/undefined en ${e.id}`);
  }
  for (const v of p.vuelos || []) if (![...v.de, ...v.a, v.t, v.dur].every(Number.isFinite)) mal(`paso ${i + 1}: vuelo inválido`);
  if (!p.titulo || !p.msg) mal(`paso ${i + 1}: faltan textos`);
});
if (errores) { console.error(errores + ' errores'); process.exit(1); }
console.log(`${PASOS.length} pasos correctos`);
