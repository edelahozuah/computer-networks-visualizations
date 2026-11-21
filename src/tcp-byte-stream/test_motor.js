// Pruebas del motor de tcp-byte-stream: lo extrae de app.html (sin DOM solo se define el motor)
// y comprueba las trazas de los nueve escenarios contra el modelo de clase.
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const m = { exports: {} };
new Function('module', html.match(/<script>([\s\S]*)<\/script>/)[1])(m);
const { simular, ESCENARIOS, BASE } = m.exports;

const correr = (id, cambios) => {
  const e = ESCENARIOS.find(x => x.id === id);
  const c = Object.assign({}, BASE, e.c, cambios || {});
  c.lee = Object.assign({}, c.lee, { octetos: c.lee.octetos * c.mss });   // la interfaz lo pide en segmentos
  return simular(c);
};
const deA = (s) => s.log.filter(l => l.de === 'A'), deB = (s) => s.log.filter(l => l.de === 'B');
const vcs = (s) => s.log.filter(l => l.vcTras).map(l => l.vcTras.es + ' ' + l.modoTras);
let n = 0;
const caso = (nombre, f) => { f(); n++; };

caso('todos los escenarios terminan y respetan los invariantes', () => {
  for (const e of ESCENARIOS) {
    const s = correr(e.id), u = s.pasos[s.pasos.length - 1];
    assert.strictEqual(u.actor, 'fin', e.id + ' no termina');
    assert.strictEqual(u.A.base, s.FIN, e.id); assert.strictEqual(u.B.leido, s.FIN, e.id);
    for (const p of s.pasos) {
      assert(p.A.base <= p.A.sig && p.B.leido <= p.B.esp && p.B.w >= 0, e.id + ' tic ' + p.t);
      if (!e.c.cc) assert(p.A.sig <= p.A.ef, e.id + ': envía más allá de la ventana');
      assert(p.texto.es && p.texto.en, e.id + ': paso sin texto');
    }
    const porTic = {};                                  // un segmento por lado y tic
    for (const l of s.log) { const k = l.de + l.t; assert(!porTic[k], e.id + ': dos segmentos en ' + k); porTic[k] = 1; }
  }
});
caso('sin incidencias: ACK retardado y acumulativo cada dos segmentos, W constante', () => {
  const s = correr('normal');
  assert.deepStrictEqual(deB(s).slice(0, 3).map(l => [l.t, l.an, l.w]), [[3, 1152, 256], [5, 1280, 256], [7, 1408, 256]]);
  assert(deA(s).every(l => !l.retx));
});
caso('aplicación lenta: W baja a 0 y B avisa cuando vuelve a haber sitio', () => {
  const s = correr('flujo'), b = deB(s);
  assert.deepStrictEqual(b.slice(0, 3).map(l => [l.t, l.an, l.w, l.causa]), [[3, 1152, 128, 'acumulativo'], [5, 1280, 0, 'acumulativo'], [9, 1280, 128, 'ventana']]);
  assert(!deA(s).some(l => l.t > 4 && l.t < 10), 'A envía con la ventana cerrada');
});
caso('pérdida con un solo ACK duplicado: retransmite al vencer el temporizador', () => {
  const s = correr('rto'), r = deA(s).filter(l => l.retx);
  assert.deepStrictEqual(r.map(l => [l.t, l.sn, l.retx]), [[11, 1280, 'rto']]);
  assert.deepStrictEqual(deB(s).slice(-1).map(l => [l.an, l.w, l.causa]), [[1408, 256, 'relleno']]);
});
caso('tres ACK duplicados: retransmisión rápida; W descuenta lo guardado (convenio) o no', () => {
  const s = correr('rapida');
  assert.deepStrictEqual(deB(s).filter(l => l.causa === 'duplicado').map(l => [l.t, l.an, l.w]), [[5, 1152, 192], [6, 1152, 128], [7, 1152, 64]]);
  assert.deepStrictEqual(deA(s).filter(l => l.retx).map(l => [l.t, l.sn, l.retx]), [[8, 1152, 'rapida']]);
  assert(s.pasos.every(p => p.A.borde >= 1280), 'el borde derecho retrocede');
  const r = correr('rapida', { convenio: false });
  assert(deB(r).filter(l => l.causa === 'duplicado').every(l => l.w === 256));
});
caso('ACK perdido: lo cubre el acumulativo siguiente, sin retransmisiones', () => {
  const s = correr('ack');
  assert.strictEqual(deB(s).filter(l => l.perdido).length, 1);
  assert(deA(s).every(l => !l.retx));
});
caso('arranque lento hasta el umbral y evitación de la congestión con N + c/N', () => {
  assert.deepStrictEqual(vcs(correr('al')).slice(0, 6), ['2 AL', '4 EC', '4 + 2/4 EC', '5 EC', '5 + 2/5 EC', '5 + 4/5 EC']);
});
caso('mín{VC, VR}: la VC crece pero nunca hay más de VR octetos en vuelo', () => {
  const s = correr('min');
  assert(s.pasos.every(p => p.A.sig - p.A.base <= 128));
  assert(s.pasos.some(p => p.A.vc >= 8));
});
caso('recuperación rápida: umbral = VC/2, VC = umbral + 3, +1 por duplicado, VC = umbral al salir', () => {
  const s = correr('rr');
  assert.deepStrictEqual(vcs(s).slice(0, 3), ['6 RR', '7 RR', '3 EC']);
  assert(s.pasos.some(p => p.A.modo === 'RR' && p.A.umbral === 3));
});
caso('vencimiento con congestión: umbral = VC/2, VC = 1, AL y cruce del umbral por tramos', () => {
  const s = correr('rtocc');
  assert.deepStrictEqual(vcs(s).slice(0, 3), ['3 AL', '1 AL', '3 EC']);
  assert(s.pasos.some(p => p.A.umbral === 1.5));
});
console.log(`tcp-byte-stream: ${n} casos OK`);
