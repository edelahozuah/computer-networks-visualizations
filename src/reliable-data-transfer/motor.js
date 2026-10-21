// Motor de la transferencia de datos fiable (Kurose y Ross §3.4): parada y espera (rdt3.0, bit alternante),
// Retroceder N (GBN) y Repetición selectiva (SR), con simulación de sucesos discretos.
// El emisor y el receptor trabajan solo con números de secuencia módulo 2^k, como en un protocolo real; el
// motor sabe además qué dato de la aplicación lleva cada paquete y así detecta cuándo el receptor entrega un
// duplicado como si fuera nuevo (ventana demasiado grande para el espacio de números de secuencia).
// Unidad de tiempo: L/R, el tiempo de transmisión de un paquete de datos. Los ACK son pequeños: su tiempo de
// transmisión es despreciable y viajan por el sentido contrario, que no comparten con los datos.
const MotorRDT = (() => {
  'use strict';

  const PROTOS = ['saw', 'gbn', 'sr'];
  const INCIDENCIAS = ['perdido', 'corrupto', 'retrasado'];
  const RETRASO = 3;                 // lo que se retrasa un paquete o un ACK «retrasado», en L/R
  const LIMITE = { sucesos: 4000, t: 3000 };

  // Ventana máxima correcta para k bits: GBN 2^k − 1; SR 2^(k−1); parada y espera 1 (con k = 1).
  const ventanaMax = (proto, k) => proto === 'saw' ? 1 : proto === 'gbn' ? 2 ** k - 1 : 2 ** (k - 1);
  const toPorDefecto = tp => 2 * tp + 2;   // RTT + L/R + 1: lo justo para que no venza antes del ACK

  function normalizar(c) {
    const proto = PROTOS.includes(c.proto) ? c.proto : 'gbn';
    const ent = (v, a, b, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : d; };
    const k = proto === 'saw' ? 1 : ent(c.k, 1, 4, 3);
    const S = 2 ** k;
    const N = proto === 'saw' ? 1 : ent(c.N, 1, S, Math.min(4, S));   // hasta S: más allá ni siquiera son distintos
    const tp = ent(c.tp, 1, 8, 3);
    const to = ent(c.to, 1, 40, toPorDefecto(tp));
    const n = ent(c.n, 1, 16, 8);
    const inc = {};
    for (const [q, v] of Object.entries(c.inc || {})) if (INCIDENCIAS.includes(v) && /^(d\d+\.\d+|a\.d\d+\.\d+)$/.test(q)) inc[q] = v;
    return { proto, k, S, N, tp, to, n, inc };
  }

  function simular(cfg0) {
    const c = normalizar(cfg0);
    const { proto, S, N, tp, to, n, inc } = c;
    const tx = [];        // transmisiones: datos y ACK
    const log = [];       // sucesos, en orden de tiempo
    const fotos = [];     // estado de emisor y receptor tras cada suceso
    const timers = [];    // tramos de temporizador: { abs, t0, t1, vence }
    const cola = [];
    let orden = 0, nsuc = 0;
    const evento = (t, prio, tipo, d) => cola.push({ t, prio, ord: orden++, tipo, ...d });
    const anota = (t, tipo, d) => log.push({ t, ord: orden++, tipo, ...d });

    // ---------------------------------------------------------------- emisor
    const E = { base: 0, next: 0, libre: 0, intentos: Array(n).fill(0), conf: Array(n).fill(false), timer: null, timersSR: {}, fin: null };
    const R = { r: 0, buf: {}, entregados: [] };     // r: nº de secuencia esperado (GBN) o base de la ventana (SR)
    let idTimer = 0;

    function transmite(i, ahora, re) {
      const t0 = Math.max(ahora, E.libre);
      E.libre = t0 + 1;
      const intento = ++E.intentos[i];
      const clave = `d${i}.${intento}`;
      const estado = inc[clave] || 'ok';
      const t1 = t0 + 1 + tp + (estado === 'retrasado' ? RETRASO : 0);
      const d = { id: tx.length, tipo: 'd', clave, abs: i, seq: i % S, intento, re, t0, t1, estado };
      tx.push(d);
      anota(t0, 'envia', { tx: d.id, abs: i, seq: d.seq, re, intento });
      if (estado === 'perdido') { d.tPerdida = t0 + 0.5 + tp / 2; anota(d.tPerdida, 'pierde', { tx: d.id }); }
      else evento(t1, 1, 'llega', { tx: d.id });
      return d;
    }
    function arrancaTimer(abs, t0) {
      const tm = { id: ++idTimer, abs, t0, t1: null, vence: false };
      timers.push(tm);
      evento(t0 + to, 2, 'timeout', { timer: tm.id });
      return tm;
    }
    const paraTimer = (tm, t, vence = false) => { if (tm && tm.t1 === null) { tm.t1 = t; tm.vence = vence; } };
    function llena(ahora) {
      while (E.next < n && E.next < E.base + N) {
        const d = transmite(E.next, ahora, false);
        if (proto === 'sr') E.timersSR[E.next] = arrancaTimer(E.next, d.t0);
        else if (!E.timer) E.timer = arrancaTimer(E.base, d.t0);
        E.next++;
      }
    }
    // El emisor solo ve el nº de secuencia del ACK: busca el paquete de su ventana que lo lleva (como mucho uno,
    // porque la ventana no pasa de S).
    const enVentana = a => { for (let j = E.base; j < E.next; j++) if (j % S === a) return j; return null; };

    function ackLlega(ev) {
      const a = tx[ev.tx];
      if (a.estado === 'corrupto') return anota(ev.t, 'ack', { tx: a.id, seq: a.seq, accion: 'corrupto', base: E.base });
      const j = enVentana(a.seq);
      if (j === null || (proto === 'sr' && E.conf[j])) return anota(ev.t, 'ack', { tx: a.id, seq: a.seq, accion: 'dup', base: E.base });
      if (proto === 'sr') {
        E.conf[j] = true; paraTimer(E.timersSR[j], ev.t); delete E.timersSR[j];
        const antes = E.base;
        while (E.base < n && E.conf[E.base]) E.base++;
        anota(ev.t, 'ack', { tx: a.id, seq: a.seq, accion: E.base > antes ? 'avanza' : 'marca', abs: j, base: E.base, antes });
      } else {
        const antes = E.base;
        for (let x = E.base; x <= j; x++) E.conf[x] = true;
        E.base = j + 1;
        paraTimer(E.timer, ev.t); E.timer = null;
        if (E.base < E.next) E.timer = arrancaTimer(E.base, ev.t);
        // si el receptor aún no tiene el dato j, el emisor ha confundido un ACK duplicado con uno nuevo (N > 2^k − 1)
        anota(ev.t, 'ack', { tx: a.id, seq: a.seq, accion: 'avanza', abs: j, base: E.base, antes, acum: j - antes + 1, confunde: j >= R.entregados.length });
      }
      if (E.base >= n && E.fin === null) E.fin = ev.t;
      llena(ev.t);
    }
    function timeout(ev) {
      const tm = timers.find(x => x.id === ev.timer);
      if (!tm || tm.t1 !== null) return;          // ya parado o reiniciado
      paraTimer(tm, ev.t, true);
      // el suceso del timeout se anota antes que los envíos que provoca
      if (proto === 'sr') {
        anota(ev.t, 'timeout', { abs: tm.abs, seq: tm.abs % S, reenvia: [tm.abs], pendientes: E.next - E.base });
        const d = transmite(tm.abs, ev.t, true);
        E.timersSR[tm.abs] = arrancaTimer(tm.abs, d.t0);
      } else {
        const re = [];
        for (let i = E.base; i < E.next; i++) re.push(i);
        anota(ev.t, 'timeout', { abs: E.base, seq: E.base % S, reenvia: re, pendientes: re.length });
        E.timer = arrancaTimer(E.base, ev.t);
        re.forEach(i => transmite(i, ev.t, true));
      }
    }

    // ---------------------------------------------------------------- receptor
    function enviaAck(a, ahora, dtx) {
      const clave = `a.${dtx.clave}`;
      const estado = inc[clave] || 'ok';
      const t1 = ahora + tp + (estado === 'retrasado' ? RETRASO : 0);
      const k = { id: tx.length, tipo: 'a', clave, seq: a, t0: ahora, t1, estado, de: dtx.id };
      tx.push(k);
      if (estado === 'perdido') { k.tPerdida = ahora + tp / 2; anota(k.tPerdida, 'pierde', { tx: k.id }); }
      else evento(t1, 0, 'ackLlega', { tx: k.id });
      return k;
    }
    function entrega(p, t, lista) {
      R.entregados.push(p);
      lista.push({ dato: p, bien: p === R.entregados.length - 1 });
    }
    function llega(ev) {
      const d = tx[ev.tx], x = d.seq, t = ev.t;
      const out = { tx: d.id, abs: d.abs, seq: x, corrupto: d.estado === 'corrupto', entregados: [] };
      if (proto !== 'sr') {
        if (!out.corrupto && x === R.r) {
          entrega(d.abs, t, out.entregados);
          out.accion = 'entrega'; out.ack = x; R.r = (R.r + 1) % S;
        } else {
          out.accion = 'descarta-ack'; out.ack = (R.r - 1 + S) % S;
          out.duplicado = !out.corrupto && d.abs < R.entregados.length;
        }
      } else if (out.corrupto) {
        out.accion = 'ignora'; out.ack = null;
      } else {
        const dist = (x - R.r + S) % S, atras = (R.r - x + S) % S;
        if (dist < N) {
          if (x in R.buf) out.accion = 'reack';
          else {
            R.buf[x] = d.abs;
            out.accion = dist === 0 ? 'entrega' : 'almacena';
            // ¿es el dato que el receptor cree que es? (si no, la ventana es demasiado grande)
            out.esperado = R.entregados.length + dist;
            out.confunde = d.abs !== out.esperado;
            while (R.r in R.buf) { const p = R.buf[R.r]; delete R.buf[R.r]; entrega(p, t, out.entregados); R.r = (R.r + 1) % S; }
          }
          out.ack = x;
        } else if (atras >= 1 && atras <= N) { out.accion = 'reack'; out.ack = x; }
        else { out.accion = 'ignora'; out.ack = null; }
      }
      if (out.ack !== null && out.ack !== undefined) out.acktx = enviaAck(out.ack, t, d).id;
      out.mal = out.entregados.some(e => !e.bien);
      anota(t, 'llega', out);
    }

    // ---------------------------------------------------------------- bucle
    const foto = t => fotos.push({
      t, base: E.base, next: Math.min(E.next, n), conf: E.conf.slice(),
      r: R.r, entregados: R.entregados.length, buf: Object.entries(R.buf).map(([s, p]) => ({ seq: +s, dato: p }))
    });
    foto(0);
    llena(0);
    foto(0);
    let limite = false;
    while (cola.length) {
      cola.sort((a, b) => a.t - b.t || a.prio - b.prio || a.ord - b.ord);
      const ev = cola.shift();
      if (++nsuc > LIMITE.sucesos || ev.t > LIMITE.t) { limite = true; break; }
      if (ev.tipo === 'ackLlega') ackLlega(ev);
      else if (ev.tipo === 'llega') llega(ev);
      else if (ev.tipo === 'timeout') timeout(ev);
      foto(ev.t);
    }
    log.sort((a, b) => a.t - b.t || a.ord - b.ord);
    const tFin = E.fin ?? (log.length ? log.at(-1).t : 0);
    timers.forEach(tm => { if (tm.t1 === null) tm.t1 = tFin; });
    const datos = tx.filter(x => x.tipo === 'd');
    const errores = R.entregados.map((p, i) => p === i ? null : { pos: i, dato: p }).filter(Boolean);
    const faltan = [];
    for (let i = 0; i < n; i++) if (!R.entregados.includes(i)) faltan.push(i);
    // ¿Ha desordenado el canal algo? (un paquete o un ACK enviado después llega antes): los protocolos de §3.4
    // suponen que el canal no desordena; con desorden y números de secuencia reutilizados pueden fallar.
    const desorden = tipo => { const v = tx.filter(x => x.tipo === tipo && x.estado !== 'perdido'); return v.some((x, i) => v.slice(i + 1).some(y => y.t1 < x.t1)); };
    const reordena = desorden('d') || desorden('a');
    const tUltimo = Math.max(tFin, ...tx.map(x => x.estado === 'perdido' ? x.tPerdida : x.t1), ...log.map(x => x.t));
    return {
      cfg: c, tx, log, fotos, timers, limite, reordena,
      fin: E.fin, tFin, tUltimo,
      entregados: R.entregados, errores, faltan,
      correcto: !limite && E.fin !== null && !errores.length && !faltan.length && R.entregados.length === n,
      cuenta: {
        datos: datos.length, retrans: datos.filter(x => x.re).length,
        acks: tx.length - datos.length, timeouts: timers.filter(x => x.vence).length,
        // utilización del emisor (Kurose): fracción del tiempo que el emisor está transmitiendo
        U: E.fin ? datos.filter(x => x.t0 < E.fin).length / E.fin : 0,
        Uutil: E.fin ? n / E.fin : 0
      }
    };
  }

  // Estado (foto) en el instante t: la última con tiempo ≤ t.
  function fotoEn(sim, t) {
    let f = sim.fotos[0];
    for (const x of sim.fotos) { if (x.t <= t + 1e-9) f = x; else break; }
    return f;
  }

  // Pasos para navegar: instantes distintos con algún suceso.
  const instantes = sim => [...new Set(sim.log.map(x => +x.t.toFixed(6)))].sort((a, b) => a - b);

  // Sucesos sobre los que se pregunta en el modo predicción y su respuesta correcta.
  const preguntables = sim => sim.log.filter(x => x.tipo === 'llega' || x.tipo === 'timeout');
  function respuesta(sim, s) {
    if (s.tipo === 'timeout') return s.reenvia.length > 1 ? ['todos'] : ['uno', 'todos'];
    return [s.accion];
  }

  // Utilización con procesamiento en cadena: U = min(1, N·(L/R) / (RTT + L/R)) (Kurose §3.4.2).
  function utilizacion(Lbytes, Rbps, RTTs, N) {
    const tt = Lbytes * 8 / Rbps;
    const U = Math.min(1, N * tt / (RTTs + tt));
    return { tt, U, caudal: U * Rbps, Nsat: Math.ceil((RTTs + tt) / tt) };
  }

  // ------------------------------------------------------------ escenarios
  // Los de Kurose y Ross (8.ª ed.): Fig. 3.16 (rdt3.0), 3.18–3.19 (rendimiento), 3.22 (GBN), 3.26 (SR) y 3.27
  // (dilema de SR).
  const ESCENARIOS = {
    'saw-ok':     { proto: 'saw', n: 4, tp: 3, inc: {}, titulo: { es: 'Parada y espera sin pérdidas', en: 'Stop-and-wait without losses' }, nota: { es: 'rdt3.0 (bit alternante): un paquete, su ACK, el siguiente. El canal está casi siempre parado: U = (L/R)/(RTT + L/R). Fig. 3.16a.', en: 'rdt3.0 (alternating bit): one packet, its ACK, the next one. The channel is idle most of the time: U = (L/R)/(RTT + L/R). Fig. 3.16a.' } },
    'saw-pkt':    { proto: 'saw', n: 3, tp: 3, inc: { 'd1.1': 'perdido' }, titulo: { es: 'Parada y espera: se pierde un paquete', en: 'Stop-and-wait: a packet is lost' }, nota: { es: 'Se pierde pkt1: no llega ACK, vence el temporizador y el emisor lo retransmite. Fig. 3.16b.', en: 'pkt1 is lost: no ACK arrives, the timer expires and the sender retransmits it. Fig. 3.16b.' } },
    'saw-ack':    { proto: 'saw', n: 3, tp: 3, inc: { 'a.d1.1': 'perdido' }, titulo: { es: 'Parada y espera: se pierde un ACK', en: 'Stop-and-wait: an ACK is lost' }, nota: { es: 'Se pierde ACK1: el emisor retransmite pkt1 y el receptor recibe un duplicado; gracias al nº de secuencia lo descarta y repite ACK1. Fig. 3.16c.', en: 'ACK1 is lost: the sender retransmits pkt1 and the receiver gets a duplicate; thanks to the sequence number it discards it and repeats ACK1. Fig. 3.16c.' } },
    'saw-prem':   { proto: 'saw', n: 3, tp: 3, inc: { 'a.d1.1': 'retrasado' }, titulo: { es: 'Parada y espera: temporizador prematuro', en: 'Stop-and-wait: premature timeout' }, nota: { es: 'ACK1 se retrasa y el temporizador vence antes de que llegue: pkt1 se envía dos veces y llegan dos ACK1; el segundo se ignora. Fig. 3.16d.', en: 'ACK1 is delayed and the timer expires before it arrives: pkt1 is sent twice and two ACK1 arrive; the second one is ignored. Fig. 3.16d.' } },
    'cadena':     { proto: 'gbn', n: 9, N: 3, k: 3, tp: 3, inc: {}, titulo: { es: 'Procesamiento en cadena sin pérdidas', en: 'Pipelining without losses' }, nota: { es: 'Con N = 3 paquetes sin confirmar a la vez, la utilización se multiplica por 3 mientras N·(L/R) < RTT + L/R. Prueba con N = 7: el emisor ya no para. Fig. 3.18–3.19.', en: 'With N = 3 unacknowledged packets at once, utilization triples while N·(L/R) < RTT + L/R. Try N = 7: the sender never stops. Fig. 3.18–3.19.' } },
    'gbn-pkt':    { proto: 'gbn', n: 8, N: 4, k: 3, tp: 3, inc: { 'd2.1': 'perdido' }, titulo: { es: 'GBN: se pierde pkt2', en: 'GBN: pkt2 is lost' }, nota: { es: 'N = 4. El receptor descarta pkt3, pkt4 y pkt5 (llegan fuera de orden) y repite ACK1. Al vencer el temporizador, el emisor reenvía pkt2 y todos los siguientes. Fig. 3.22.', en: 'N = 4. The receiver discards pkt3, pkt4 and pkt5 (out of order) and repeats ACK1. When the timer expires, the sender resends pkt2 and all the following ones. Fig. 3.22.' } },
    'gbn-ack':    { proto: 'gbn', n: 6, N: 4, k: 3, tp: 3, inc: { 'a.d1.1': 'perdido' }, titulo: { es: 'GBN: se pierde un ACK', en: 'GBN: an ACK is lost' }, nota: { es: 'Se pierde ACK1, pero ACK2 llega antes del timeout: como es acumulativo, confirma pkt1 y pkt2. No hay retransmisión.', en: 'ACK1 is lost, but ACK2 arrives before the timeout: as it is cumulative, it acknowledges pkt1 and pkt2. There is no retransmission.' } },
    'sr-pkt':     { proto: 'sr', n: 8, N: 4, k: 3, tp: 3, inc: { 'd2.1': 'perdido' }, titulo: { es: 'SR: se pierde pkt2', en: 'SR: pkt2 is lost' }, nota: { es: 'N = 4. El receptor guarda pkt3, pkt4 y pkt5 en su búfer y los confirma uno a uno. Solo vence el temporizador de pkt2 y solo se reenvía pkt2. Fig. 3.26.', en: 'N = 4. The receiver buffers pkt3, pkt4 and pkt5 and acknowledges each one. Only pkt2’s timer expires and only pkt2 is resent. Fig. 3.26.' } },
    'sr-dilema':  { proto: 'sr', n: 6, N: 3, k: 2, tp: 3, inc: { 'a.d0.1': 'perdido', 'a.d1.1': 'perdido', 'a.d2.1': 'perdido' }, titulo: { es: 'SR: ventana demasiado grande', en: 'SR: window too large' }, nota: { es: 'Nº de secuencia 0–3 (k = 2) y N = 3 > 2^k/2. Se pierden los tres ACK: el pkt0 retransmitido cae en la ventana nueva del receptor y lo toma por un dato nuevo. Fig. 3.27a.', en: 'Sequence numbers 0–3 (k = 2) and N = 3 > 2^k/2. The three ACKs are lost: the retransmitted pkt0 falls in the receiver’s new window and is taken for new data. Fig. 3.27a.' } },
    'gbn-max':    { proto: 'gbn', n: 6, N: 4, k: 2, tp: 3, inc: { 'd0.1': 'perdido' }, titulo: { es: 'GBN: ventana demasiado grande', en: 'GBN: window too large' }, nota: { es: 'Nº de secuencia 0–3 (k = 2) y N = 4 > 2^k − 1. Se pierde pkt0 y el receptor repite el ACK «del anterior», ACK3, que el emisor confunde con el de pkt3: da todo por confirmado.', en: 'Sequence numbers 0–3 (k = 2) and N = 4 > 2^k − 1. pkt0 is lost and the receiver repeats the ACK “of the previous one”, ACK3, which the sender mistakes for pkt3’s: it takes everything as acknowledged.' } }
  };

  // ------------------------------------------------------------ ejercicios
  function rng(semilla) {
    let s = (semilla >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function generar(semilla) {
    const r = rng(semilla), ent = (a, b) => a + Math.floor(r() * (b - a + 1));
    const proto = ['saw', 'gbn', 'sr', 'gbn', 'sr'][ent(0, 4)];
    const N = proto === 'saw' ? 1 : ent(3, 4), n = proto === 'saw' ? ent(3, 4) : ent(6, 8), tp = ent(2, 3);
    const inc = {}, nInc = proto === 'saw' ? 1 : ent(1, 2);
    const usados = new Set();
    while (Object.keys(inc).length < nInc) {
      const i = ent(0, n - 2);
      if (usados.has(i)) continue;
      usados.add(i);
      const tipo = ['perdido', 'perdido', 'corrupto', 'ack'][ent(0, 3)];
      if (tipo === 'ack') inc[`a.d${i}.1`] = 'perdido'; else inc[`d${i}.1`] = tipo;
    }
    return { proto, n, N, k: 3, tp, inc, semilla };
  }

  return { PROTOS, INCIDENCIAS, RETRASO, ventanaMax, toPorDefecto, normalizar, simular, fotoEn, instantes, preguntables, respuesta, utilizacion, ESCENARIOS, rng, generar };
})();
if (typeof module !== 'undefined') module.exports = MotorRDT;
