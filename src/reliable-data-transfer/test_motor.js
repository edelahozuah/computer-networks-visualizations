// Pruebas del motor de transferencia fiable: rdt2.0, rdt2.1 y rdt2.2 (§3.4.1), figuras de Kurose y Ross (3.16,
// 3.22, 3.26, 3.27), utilización del ejemplo del libro, límites de la ventana y escenarios aleatorios (3000 con
// ventana correcta y 1500 de rdt2.x con errores de bits), en los que el receptor tiene que entregar todos los
// datos, una vez y en orden, sea cual sea la incidencia.
const M = require('./motor.js');
let fallos = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.error('FALLO: ' + m); } };
const sim = id => M.simular(M.ESCENARIOS[id]);
const tipos = (s, t) => s.log.filter(x => x.tipo === t);
const envios = s => tipos(s, 'envia').map(x => (x.re ? 'r' : '') + x.abs).join(' ');

// ---------------------------------------------------------------- rdt2.x: solo errores de bits, sin temporizador
let s = sim('rdt20-nak');
ok(s.correcto && envios(s) === '0 1 r1 2' && !s.timers.length, 'rdt20-nak: ' + envios(s));
ok(tipos(s, 'llega').find(x => x.corrupto).accion === 'nak' && tipos(s, 'ack').some(x => x.accion === 'nak' && x.retransmite), 'rdt20-nak: NAK y retransmisión');
s = sim('rdt20-ack');
ok(!s.correcto && s.entregados.join() === '0,0,1,2' && envios(s) === '0 r0 1 2', 'rdt20-ack: entrega d0 dos veces → ' + s.entregados);
ok(tipos(s, 'ack')[0].accion === 'corrupto' && tipos(s, 'ack')[0].retransmite && tipos(s, 'llega')[1].mal, 'rdt20-ack: ACK ilegible → retransmite → duplicado entregado');
s = sim('rdt21-ack');
ok(s.correcto && envios(s) === '0 r0 1 2', 'rdt21-ack: ' + envios(s));
ok(tipos(s, 'llega')[1].accion === 'reack' && tipos(s, 'llega')[1].ackEtq === 'ACK', 'rdt21-ack: duplicado → descarta y reenvía ACK');
s = M.simular({ proto: 'rdt21', n: 3, tp: 2, inc: { 'd1.1': 'corrupto' } });
ok(s.correcto && tipos(s, 'llega').find(x => x.corrupto).ackEtq === 'NAK', 'rdt21: paquete corrupto → NAK');
s = sim('rdt22-pkt');
ok(s.correcto && envios(s) === '0 1 r1 2', 'rdt22-pkt: ' + envios(s));
ok(tipos(s, 'llega').find(x => x.corrupto).ackEtq === 'ACK0' && tipos(s, 'ack').find(x => x.retransmite).accion === 'dup', 'rdt22-pkt: ACK0 duplicado ≡ NAK');
ok(!s.tx.some(x => x.nak), 'rdt22: nunca envía NAK');
const c2 = M.normalizar({ proto: 'rdt22', N: 4, k: 3, inc: { 'd0.1': 'perdido', 'd1.1': 'corrupto', 'a.d1.1': 'retrasado' } });
ok(c2.N === 1 && c2.k === 1 && Object.keys(c2.inc).join() === 'd1.1', 'normalizar rdt2.x: solo errores de bits');
ok(M.respuesta(s, tipos(s, 'ack').find(x => x.retransmite)).join() === 'retransmite' && M.preguntables(s).some(x => x.tipo === 'ack'), 'predicción en rdt2.x: respuestas del emisor');
ok(!M.preguntables(sim('saw-ok')).some(x => x.tipo === 'ack'), 'predicción en rdt3.0: sin preguntas sobre ACK');

// ---------------------------------------------------------------- parada y espera (rdt3.0, Fig. 3.16)
s = sim('saw-ok');
ok(s.correcto && s.cuenta.datos === 4 && s.cuenta.retrans === 0 && s.fin === 4 * 7, 'saw-ok: 4 ciclos de RTT + L/R = 7 → ' + s.fin);
ok(Math.abs(s.cuenta.U - 1 / 7) < 1e-9, 'saw-ok: U = (L/R)/(RTT + L/R) = 1/7');
ok(s.tx.filter(x => x.tipo === 'd').map(x => x.seq).join('') === '0101', 'saw: bit alternante 0101');
s = sim('saw-pkt');
ok(s.correcto && envios(s) === '0 1 r1 2' && s.cuenta.timeouts === 1, 'saw-pkt: ' + envios(s));
s = sim('saw-ack');
ok(s.correcto && envios(s) === '0 1 r1 2', 'saw-ack: ' + envios(s));
let dup = tipos(s, 'llega').find(x => x.tx === s.tx.find(t => t.tipo === 'd' && t.abs === 1 && t.re).id);
ok(dup && dup.accion === 'descarta-ack' && dup.duplicado && dup.ack === 1, 'saw-ack: el duplicado se descarta y se repite ACK1');
s = sim('saw-prem');
ok(s.correcto && envios(s) === '0 1 r1 2', 'saw-prem: ' + envios(s));
ok(tipos(s, 'ack').filter(x => x.seq === 1).map(x => x.accion).join(',') === 'avanza,dup', 'saw-prem: el segundo ACK1 se ignora');

// ---------------------------------------------------------------- cadena (Fig. 3.18–3.19)
s = sim('cadena');
ok(s.correcto && s.cuenta.retrans === 0, 'cadena sin pérdidas');
const sw = M.simular({ ...M.ESCENARIOS.cadena, N: 1 });
ok(s.fin < sw.fin, `cadena N=3 (${s.fin}) más rápida que N=1 (${sw.fin})`);
const lleno = M.simular({ ...M.ESCENARIOS.cadena, N: 7 });   // N·(L/R) ≥ RTT + L/R = 7
const t0s = lleno.tx.filter(x => x.tipo === 'd').map(x => x.t0);
ok(lleno.correcto && t0s.every((t, i) => t === i), 'N = 7 con RTT + L/R = 7: el emisor no para nunca ' + t0s);

// ---------------------------------------------------------------- GBN (Fig. 3.22)
s = sim('gbn-pkt');
ok(s.correcto && envios(s) === '0 1 2 3 4 5 r2 r3 r4 r5 6 7', 'gbn-pkt: ' + envios(s));
const ll = tipos(s, 'llega');
ok(ll.filter(x => [3, 4, 5].includes(x.abs) && !s.tx[x.tx].re).every(x => x.accion === 'descarta-ack' && x.ack === 1), 'gbn-pkt: pkt3–5 se descartan con ACK1');
ok(tipos(s, 'timeout').length === 1 && tipos(s, 'timeout')[0].reenvia.join() === '2,3,4,5', 'gbn-pkt: el timeout reenvía 2–5');
ok(tipos(s, 'ack').filter(x => x.accion === 'dup').length === 3, 'gbn-pkt: tres ACK1 duplicados');
s = sim('gbn-ack');
ok(s.correcto && s.cuenta.retrans === 0, 'gbn-ack: sin retransmisiones');
ok(tipos(s, 'ack').some(x => x.seq === 2 && x.acum === 2), 'gbn-ack: ACK2 confirma pkt1 y pkt2 (acumulativo)');
// corrupción en GBN: se detecta y se repite el último ACK
s = M.simular({ proto: 'gbn', n: 5, N: 3, k: 3, tp: 2, inc: { 'd1.1': 'corrupto' } });
ok(s.correcto && tipos(s, 'llega').find(x => x.corrupto).accion === 'descarta-ack', 'gbn: paquete corrupto → descarta y repite ACK');

// ---------------------------------------------------------------- SR (Fig. 3.26)
s = sim('sr-pkt');
ok(s.correcto && envios(s) === '0 1 2 3 4 5 r2 6 7', 'sr-pkt: ' + envios(s));
ok(tipos(s, 'llega').filter(x => [3, 4, 5].includes(x.abs)).every(x => x.accion === 'almacena' && x.ack === x.seq), 'sr-pkt: 3–5 al búfer con su propio ACK');
const re2 = tipos(s, 'llega').find(x => x.abs === 2);
ok(re2.accion === 'entrega' && re2.entregados.map(e => e.dato).join() === '2,3,4,5', 'sr-pkt: pkt2 libera 2,3,4,5');
ok(tipos(s, 'timeout').length === 1 && tipos(s, 'timeout')[0].reenvia.join() === '2', 'sr-pkt: solo se reenvía pkt2');
s = M.simular({ proto: 'sr', n: 5, N: 3, k: 3, tp: 2, inc: { 'd1.1': 'corrupto' } });
ok(s.correcto && tipos(s, 'llega').find(x => x.corrupto).accion === 'ignora', 'sr: paquete corrupto → se descarta sin ACK');
// ACK perdido en SR: el reenvío llega por debajo de la ventana y se vuelve a confirmar
s = M.simular({ proto: 'sr', n: 6, N: 3, k: 3, tp: 3, inc: { 'a.d0.1': 'perdido' } });
ok(s.correcto && tipos(s, 'llega').some(x => x.abs === 0 && x.accion === 'reack'), 'sr: duplicado por debajo de la ventana → reack');

// ---------------------------------------------------------------- ventanas demasiado grandes (Fig. 3.27)
s = sim('sr-dilema');
ok(!s.correcto && s.errores.length > 0 && tipos(s, 'llega').some(x => x.abs === 0 && x.confunde), 'sr-dilema: el pkt0 viejo se toma por nuevo');
ok(!M.simular({ ...M.ESCENARIOS['sr-dilema'], N: 2 }).errores.length, 'sr con N = 2^k/2: correcto');
s = sim('gbn-max');
ok(!s.correcto && s.faltan.length > 0, 'gbn-max: N = 2^k da por confirmados datos perdidos');
ok(tipos(s, 'ack').some(x => x.confunde) && !tipos(sim('gbn-pkt'), 'ack').some(x => x.confunde), 'gbn-max: ACK confundido marcado');
ok(M.simular({ ...M.ESCENARIOS['gbn-max'], N: 3 }).correcto, 'gbn con N = 2^k − 1: correcto');
ok(M.ventanaMax('gbn', 3) === 7 && M.ventanaMax('sr', 3) === 4 && M.ventanaMax('saw', 1) === 1, 'ventanaMax');

// ---------------------------------------------------------------- utilización (Kurose: L = 1000 B, R = 1 Gbit/s, RTT = 30 ms)
const u = M.utilizacion(1000, 1e9, 0.030, 1);
ok(Math.abs(u.tt - 8e-6) < 1e-15 && Math.abs(u.U - 0.008 / 30.008) < 1e-12, 'U Kurose = 0,00027');
ok(Math.round(u.caudal / 1000) === 267, 'caudal 267 kbit/s ' + u.caudal);
ok(Math.abs(M.utilizacion(1000, 1e9, 0.030, 3).U - 3 * u.U) < 1e-12 && M.utilizacion(1000, 1e9, 0.030, 5000).U === 1, 'U con N: ×N y con tope 1');
ok(u.Nsat === 3751, 'N para llenar el canal: ' + u.Nsat);

// ---------------------------------------------------------------- normalización y temporizador
const c = M.normalizar({ proto: 'saw', N: 5, k: 3, n: 99, tp: 0, inc: { 'd1.1': 'perdido', 'x': 'perdido', 'd2.1': 'raro' } });
ok(c.N === 1 && c.k === 1 && c.n === 16 && c.tp === 1 && Object.keys(c.inc).join() === 'd1.1', 'normalizar');
s = M.simular({ proto: 'gbn', n: 4, N: 2, k: 3, tp: 3, to: 3 });   // to < RTT + L/R: timeouts prematuros, pero termina bien
ok(s.correcto && s.cuenta.timeouts > 0 && s.cuenta.retrans > 0, 'timeout prematuro: retransmisiones innecesarias pero entrega correcta');
ok(M.instantes(sim('saw-ok')).length > 4 && M.fotoEn(sim('gbn-pkt'), 16).base === 2, 'instantes y fotos');
ok(M.respuesta(s, { tipo: 'timeout', reenvia: [1] }).includes('uno') && M.respuesta(s, { tipo: 'timeout', reenvia: [1, 2] }).join() === 'todos', 'respuesta timeout');

// ---------------------------------------------------------------- aleatorios con ventana correcta
const r = M.rng(2026);
let probados = 0, desordenados = 0, fallaDesorden = 0;
for (let t = 0; t < 3000; t++) {
  const proto = ['saw', 'gbn', 'sr'][t % 3];
  const k = proto === 'saw' ? 1 : 2 + Math.floor(r() * 2);
  const N = proto === 'saw' ? 1 : 1 + Math.floor(r() * M.ventanaMax(proto, k));
  const nn = 3 + Math.floor(r() * 8), tp = 1 + Math.floor(r() * 4);
  const to = r() < 0.2 ? 1 + Math.floor(r() * (2 * tp + 1)) : M.toPorDefecto(tp) + Math.floor(r() * 3);
  const inc = {};
  for (let i = 0; i < nn; i++) for (let a = 1; a <= 2; a++) {
    if (r() < 0.2) inc[`d${i}.${a}`] = M.INCIDENCIAS[Math.floor(r() * 3)];
    if (r() < 0.2) inc[`a.d${i}.${a}`] = M.INCIDENCIAS[Math.floor(r() * 3)];
  }
  const cfg = { proto, k, N, n: nn, tp, to, inc };
  const x = M.simular(cfg);
  if (x.reordena) { desordenados++; if (!x.correcto) fallaDesorden++; continue; }   // fuera del modelo de §3.4
  if (!x.correcto) { ok(false, 'aleatorio incorrecto ' + JSON.stringify(cfg) + ' entregados ' + x.entregados); break; }
  // el emisor nunca tiene más de N paquetes sin confirmar ni el canal dos paquetes a la vez
  const d = x.tx.filter(y => y.tipo === 'd');
  if (d.some((y, i) => i && y.t0 < d[i - 1].t0 + 1)) { ok(false, 'solape en el canal ' + JSON.stringify(cfg)); break; }
  if (x.fotos.some(f => f.next - f.base > x.cfg.N)) { ok(false, 'ventana excedida ' + JSON.stringify(cfg)); break; }
  probados++;
}
ok(probados + desordenados === 3000 && probados > 2000, `aleatorios: ${probados} sin desorden, ${desordenados} con desorden`);
ok(fallaDesorden > 0, 'hay casos con desorden en los que el protocolo falla: ' + fallaDesorden);
// rdt2.x con errores de bits aleatorios en paquetes y respuestas: rdt2.1 y rdt2.2 siempre entregan bien;
// rdt2.0 también, salvo que se corrompa algún ACK/NAK.
let fallos20 = 0;
for (let t = 0; t < 1500; t++) {
  const proto = ['rdt20', 'rdt21', 'rdt22'][t % 3];
  const nn = 2 + Math.floor(r() * 6), inc = {};
  for (let i = 0; i < nn; i++) for (let a = 1; a <= 3; a++) {
    if (r() < 0.25) inc[`d${i}.${a}`] = 'corrupto';
    if (r() < 0.25) inc[`a.d${i}.${a}`] = 'corrupto';
  }
  const x = M.simular({ proto, n: nn, tp: 1 + Math.floor(r() * 4), inc });
  const ackMal = x.tx.some(y => y.tipo === 'a' && y.estado === 'corrupto');
  if (proto === 'rdt20' && ackMal) { if (!x.correcto) fallos20++; continue; }
  if (!x.correcto || x.timers.length) { ok(false, 'rdt2.x aleatorio incorrecto ' + JSON.stringify({ proto, nn, inc }) + ' entregados ' + x.entregados); break; }
}
ok(fallos20 > 0, 'rdt2.0 con ACK/NAK corruptos entrega duplicados: ' + fallos20);
// el caso que encontró la prueba: un pkt0 retransmitido y retrasado llega tras pkt1 y se entrega como pkt2
s = M.simular({ proto: 'saw', n: 6, tp: 3, to: 9, inc: { 'a.d0.1': 'retrasado', 'd0.2': 'retrasado', 'a.d2.2': 'perdido', 'a.d4.1': 'retrasado', 'a.d5.2': 'perdido' } });
ok(s.reordena && s.errores.length, 'bit alternante con canal que desordena: entrega errónea');
ok(!sim('saw-prem').reordena && !sim('gbn-pkt').reordena, 'los escenarios del libro no desordenan');

console.log(fallos ? `${fallos} de ${n} pruebas fallan` : `OK: ${n} pruebas (4500 escenarios aleatorios)`);
process.exit(fallos ? 1 : 0);
