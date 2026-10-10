// Comprueba el motor contra las fórmulas cerradas en una batería de casos aleatorios: node test_motor.js
const M = require('./motor.js');
let fallos = 0, n = 0;
const r = a => a[Math.floor(Math.random() * a.length)];
for (let k = 0; k < 5000; k++) {
  const N = r([0, 1, 2, 3, 5, 8]);
  const igual = Math.random() < 0.5, L = r([800, 8e4, 4e5, 8e6]);
  const p = { R: r([1e5, 1e6, 1e7, 1e8]), dp: r([0, 1e-4, 5e-3, 0.025, 0.1]), bits: Array.from({ length: N }, () => igual ? L : r([800, 8e4, 4e5, 8e6])),
    htmlBits: r([8e3, 8e4]), tcp: Math.random() < .5, html: Math.random() < .5, tproc: r([0, 0, 1e-3, 0.02]), canal: Math.random() < .5 };
  const s = M.simular(p), f = M.formula(p); n++;
  if (Math.abs(s.T - f) > 1e-9 * Math.max(1, f)) { fallos++; if (fallos < 5) console.log('FALLO', p, s.T, f); }
  // invariantes: el servidor no transmite dos cosas a la vez y el orden es FIFO
  const tx = s.segs.filter(x => x.X !== undefined).sort((a, b) => a.inicio - b.inicio);
  for (let i = 1; i < tx.length; i++) if (tx[i].inicio < tx[i - 1].finTx - 1e-12) { fallos++; console.log('SOLAPE', p); break; }
}
// caso de la slide 17: T = RTT + N(RTT + X)
const s17 = M.simular({ R: 1e7, dp: 0.025, bits: [4e5, 4e5, 4e5, 4e5], htmlBits: 0, tcp: true, html: false, tproc: 0, canal: false });
console.log('slide 17 (RTT=50ms, X=40ms, N=4):', (s17.T * 1e3).toFixed(3), 'ms (esperado 410)');
const s18 = M.simular({ R: 1e7, dp: 0.025, bits: [4e5, 4e5, 4e5, 4e5], htmlBits: 0, tcp: true, html: false, tproc: 0, canal: true });
console.log('canalización:', (s18.T * 1e3).toFixed(3), 'ms (esperado 260), huecos sin/con:', s17.huecos.length, s18.huecos.length);
console.log(`${n} casos, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
