// Motor de tiempos: HTTP/1.1 persistente sin y con canalización sobre un único enlace cliente–servidor.
// Todo en segundos y bits. Peticiones y segmentos de control con tamaño despreciable (d_trans = 0).
const MotorHTTP = (() => {
  'use strict';

  // p: { R, dp, bits: [L_1..L_N], htmlBits, tcp, html, tproc, canal }
  function simular(p) {
    const { R, dp, tproc = 0 } = p;
    const segs = [];   // mensajes que se dibujan
    const filas = [];  // una por objeto (y HTML): instantes para la tabla
    const llaves = []; // tramos que se acotan en el lado del cliente
    let t = 0;

    const ctrl = (de, etq, inicio) => {
      const s = { tipo: 'ctrl', de, etq, inicio, finTx: inicio, primerBit: inicio + dp, llegada: inicio + dp };
      segs.push(s); return s;
    };
    const get = (etq, inicio, obj) => {
      const s = { tipo: 'get', de: 'C', etq, obj, inicio, finTx: inicio, primerBit: inicio + dp, llegada: inicio + dp };
      segs.push(s); return s;
    };
    const resp = (tipo, etq, obj, inicio, bits) => {
      const X = bits / R;
      const s = { tipo, de: 'S', etq, obj, bits, X, inicio, finTx: inicio + X, primerBit: inicio + dp, llegada: inicio + X + dp };
      segs.push(s); return s;
    };

    let ackPendiente = false;
    if (p.tcp) {
      ctrl('C', 'SYN', 0);
      ctrl('S', 'SYN+ACK', dp);
      t = 2 * dp;
      llaves.push({ clase: 'rtt', etq: 'RTT', desde: 0, hasta: t, fase: 'tcp' });
      ackPendiente = true; // el ACK viaja con la primera petición (3.er segmento)
    }
    const conAck = etq => (ackPendiente ? (ackPendiente = false, 'ACK + ' + etq) : etq);

    let finEnlace = 0; // el servidor no puede empezar a transmitir antes de terminar lo anterior
    if (p.html) {
      const g = get(conAck('GET html'), t, 'html');
      const r = resp('html', 'HTML', 'html', Math.max(g.llegada + tproc, finEnlace), p.htmlBits);
      finEnlace = r.finTx;
      filas.push({ obj: 'html', get: g.inicio, txIni: r.inicio, txFin: r.finTx, rx: r.llegada, X: r.X });
      llaves.push({ clase: 'rtt', etq: tproc > 0 ? 'RTT + t_proc' : 'RTT', desde: t, hasta: r.primerBit, fase: 'html' });
      llaves.push({ clase: 'x', etq: 'X_html', desde: r.primerBit, hasta: r.llegada, fase: 'html' });
      t = r.llegada;
    }

    const N = p.bits.length;
    const inicioObjetos = t;
    if (!p.canal) {
      for (let i = 0; i < N; i++) {
        const g = get(conAck('GET ' + (i + 1)), t, i);
        const r = resp('obj', String(i + 1), i, Math.max(g.llegada + tproc, finEnlace), p.bits[i]);
        finEnlace = r.finTx;
        filas.push({ obj: i, get: g.inicio, txIni: r.inicio, txFin: r.finTx, rx: r.llegada, X: r.X });
        llaves.push({ clase: 'rtt', etq: tproc > 0 ? 'RTT + t_proc' : 'RTT', desde: t, hasta: r.primerBit, obj: i });
        llaves.push({ clase: 'x', etq: 'X' + (i + 1), desde: r.primerBit, hasta: r.llegada, obj: i });
        t = r.llegada;
      }
    } else {
      const gs = [];
      for (let i = 0; i < N; i++) gs.push(get(i === 0 ? conAck('GET ' + (i + 1)) : 'GET ' + (i + 1), t, i));
      let primer = null;
      for (let i = 0; i < N; i++) {
        const r = resp('obj', String(i + 1), i, Math.max(gs[i].llegada + tproc, finEnlace), p.bits[i]);
        finEnlace = r.finTx;
        filas.push({ obj: i, get: gs[i].inicio, txIni: r.inicio, txFin: r.finTx, rx: r.llegada, X: r.X });
        if (i === 0) { primer = r; llaves.push({ clase: 'rtt', etq: tproc > 0 ? 'RTT + t_proc' : 'RTT', desde: t, hasta: r.primerBit, obj: i }); }
        llaves.push({ clase: 'x', etq: 'X' + (i + 1), desde: r.llegada - r.X, hasta: r.llegada, obj: i });
      }
      t = N ? filas[filas.length - 1].rx : t;
    }

    // Huecos en los que el enlace servidor→cliente está parado mientras quedan objetos por enviar
    const huecos = [];
    const tx = filas.filter(f => f.obj !== 'html');
    for (let i = 1; i < tx.length; i++) if (tx[i].txIni - tx[i - 1].txFin > 1e-12) huecos.push({ desde: tx[i - 1].txFin, hasta: tx[i].txIni });

    const ocupado = segs.filter(s => s.X).reduce((a, s) => a + s.X, 0);
    return { segs, filas, llaves, huecos, T: t, inicioObjetos, ocupado, uso: t > 0 ? ocupado / t : 0 };
  }

  // Fórmula cerrada equivalente a la simulación (para comprobar el motor y mostrarla al estudiante)
  function formula(p) {
    const RTT = 2 * p.dp, tp = p.tproc || 0, X = p.bits.map(b => b / p.R);
    const sumX = X.reduce((a, b) => a + b, 0), N = X.length;
    let T = 0;
    if (p.tcp) T += RTT;
    if (p.html) T += RTT + tp + p.htmlBits / p.R;
    if (!N) return T;
    T += p.canal ? RTT + tp + sumX : N * (RTT + tp) + sumX;
    return T;
  }

  return { simular, formula };
})();
if (typeof module !== 'undefined') module.exports = MotorHTTP;
