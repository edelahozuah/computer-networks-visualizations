// Motor de demultiplexación de la capa de transporte (GG31, AR1, s.12–21 del deck).
// Modelo didáctico:
//  - UDP: el socket se identifica SOLO por el destino (IP_D, PD). Todos los segmentos que llegan al mismo
//    puerto de C entran por el mismo socket, vengan de donde vengan.
//  - TCP: el socket de conexión se identifica por los cuatro valores (IP_O, PO, IP_D, PD). El servidor tiene
//    un socket de bienvenida por puerto en escucha; un segmento con una 4-tupla que no tiene socket llega al de
//    bienvenida, que crea un socket de conexión nuevo (el establecimiento de la conexión, SYN, es de GG32).
//  - El protocolo (6 = TCP, 17 = UDP, campo Protocolo de la cabecera IP) forma parte de la dirección:
//    443/TCP y 443/UDP son sockets distintos (s.21).
//  - Si no hay socket para el destino, el segmento se rechaza (nadie escucha en ese puerto).
// Las direcciones IP se nombran con letras (A, B, C, D), como en el deck.
const MotorDemux = (() => {
  'use strict';

  const PROTO = { tcp: 6, udp: 17 };
  const RANGOS = { iana: { min: 49152, max: 65535 }, linux: { min: 32768, max: 60999 } };
  // Valores de la práctica GP31 y de su banco de preguntas: no se usan nunca en la visualización.
  const PROHIBIDOS = {
    puertos: [50123, 8888, 41000, 50200, 9999, 44458, 9000],
    ips: ['192.168.1.10', '192.168.1.20', '192.168.1.30', '10.0.2.15', '172.31.254.2', '10.0.0.5']
  };
  // Puertos del deck: no se reparten como efímeros en los ejercicios aleatorios, para no confundir.
  const DECK = [9157, 9156, 6428, 5775, 80, 443];

  // ---------------------------------------------------------------- aleatorio con semilla (mulberry32)
  function rng(semilla) {
    let a = (Number(semilla) >>> 0) || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Puerto efímero elegido por el SO en el rango dado ('iana' 49152–65535 o 'linux' 32768–60999),
  // distinto de los ya usados y de los prohibidos.
  function efimero(r, rango = 'iana', usados = []) {
    const R = RANGOS[rango] || RANGOS.iana;
    const evitar = new Set([...usados, ...PROHIBIDOS.puertos, ...DECK]);
    for (let i = 0; i < 1000; i++) {
      const p = R.min + Math.floor(r() * (R.max - R.min + 1));
      if (!evitar.has(p)) return p;
    }
    throw new Error('sin puertos efímeros libres');
  }

  // ---------------------------------------------------------------- sockets
  // tabla: { ip, modelo ('uno-a-uno' | 'uno-a-varios' | 'eventos'), sockets: [socket], n (contador de ids),
  //          nProc (siguiente nº de proceso), nHilo }
  // socket: { id, proto, tipo ('udp' | 'bienvenida' | 'conexion'), ip, puerto, ipR, puertoR, proceso, hilo, entregados }
  const copia = o => JSON.parse(JSON.stringify(o));

  function tablaInicial(servidor) {
    const t = { ip: servidor.ip, modelo: servidor.modelo || 'uno-a-uno', sockets: [], n: 0, nProc: servidor.primerProceso || 4, nHilo: 1 };
    for (const e of servidor.escucha) {
      t.n++;
      t.sockets.push({ id: 's' + t.n, proto: e.proto, tipo: e.proto === 'udp' ? 'udp' : 'bienvenida', ip: servidor.ip, puerto: e.puerto, ipR: null, puertoR: null, proceso: e.proceso, hilo: null, entregados: 0 });
    }
    return t;
  }

  // ¿A qué socket va el segmento? Devuelve
  //   { tipo: 'socket', socket }                       → hay un socket que encaja
  //   { tipo: 'nuevo', bienvenida, socket }            → TCP: el socket de bienvenida crea uno de conexión
  //   { tipo: 'rechazado', motivo ('ip' | 'puerto') }  → no es para este host o nadie escucha en ese puerto
  // proto: el del segmento salvo que se indique otro.
  function demux(tabla, seg, proto = seg.proto) {
    if (seg.ipD !== tabla.ip) return { tipo: 'rechazado', motivo: 'ip' };
    if (proto === 'udp') {
      const s = tabla.sockets.find(x => x.proto === 'udp' && x.ip === seg.ipD && x.puerto === seg.pd);
      return s ? { tipo: 'socket', socket: s } : { tipo: 'rechazado', motivo: 'puerto' };
    }
    const c = tabla.sockets.find(x => x.proto === 'tcp' && x.tipo === 'conexion' && x.ip === seg.ipD && x.puerto === seg.pd && x.ipR === seg.ipO && x.puertoR === seg.po);
    if (c) return { tipo: 'socket', socket: c };
    const w = tabla.sockets.find(x => x.proto === 'tcp' && x.tipo === 'bienvenida' && x.ip === seg.ipD && x.puerto === seg.pd);
    if (!w) return { tipo: 'rechazado', motivo: 'puerto' };
    let proceso, hilo = null;
    if (tabla.modelo === 'uno-a-uno') proceso = 'P' + tabla.nProc;
    else { proceso = w.proceso; if (tabla.modelo === 'uno-a-varios') hilo = tabla.nHilo; }
    const socket = { id: 's' + (tabla.n + 1), proto: 'tcp', tipo: 'conexion', ip: seg.ipD, puerto: seg.pd, ipR: seg.ipO, puertoR: seg.po, proceso, hilo, entregados: 0 };
    return { tipo: 'nuevo', bienvenida: w, socket };
  }

  // Aplica la llegada del segmento: devuelve { tabla (nueva), resultado, destino (id del socket que recibe los datos o null) }
  function aplicar(tabla, seg) {
    const t = copia(tabla);
    const r = demux(t, seg);
    let destino = null;
    if (r.tipo === 'socket') { r.socket.entregados++; destino = r.socket.id; }
    else if (r.tipo === 'nuevo') {
      t.n++; r.socket.entregados = 1; t.sockets.push(r.socket); destino = r.socket.id;
      if (t.modelo === 'uno-a-uno') t.nProc++; else if (t.modelo === 'uno-a-varios') t.nHilo++;
    }
    return { tabla: t, resultado: copia(r), destino };
  }

  // La respuesta sale del socket del servidor con IPs y puertos intercambiados.
  const responder = seg => ({ ...seg, ipO: seg.ipD, po: seg.pd, ipD: seg.ipO, pd: seg.po });

  const contar = tabla => {
    const c = { total: tabla.sockets.length, udp: 0, bienvenida: 0, conexion: 0, procesos: new Set(tabla.sockets.map(s => s.proceso)).size };
    for (const s of tabla.sockets) c[s.tipo]++;
    return c;
  };

  // Recorre el escenario: { pasos: [{ seg, resultado, destino, antes, despues }], final, cuenta }
  function simular(esc) {
    let t = tablaInicial(esc.servidor);
    const pasos = [];
    for (const seg of esc.segmentos) {
      const a = aplicar(t, seg);
      pasos.push({ seg, resultado: a.resultado, destino: a.destino, antes: t, despues: a.tabla });
      t = a.tabla;
    }
    return { pasos, inicial: tablaInicial(esc.servidor), final: t, cuenta: contar(t) };
  }

  // El mismo escenario con todo en un protocolo (interruptor UDP / TCP). No se aplica a los mixtos.
  function conProto(esc, proto) {
    const e = copia(esc);
    e.servidor.escucha = e.servidor.escucha.map(x => ({ ...x, proto }));
    const vistos = new Set();
    e.servidor.escucha = e.servidor.escucha.filter(x => { const k = x.puerto; if (vistos.has(k)) return false; vistos.add(k); return true; });
    e.segmentos = e.segmentos.map(s => ({ ...s, proto }));
    e.proto = proto;
    return e;
  }
  const esMixto = esc => new Set(esc.servidor.escucha.map(x => x.proto)).size > 1 || new Set(esc.segmentos.map(s => s.proto)).size > 1;

  // ---------------------------------------------------------------- escenarios del deck
  const seg = (proto, ipO, po, ipD, pd, extra = {}) => ({ proto, ipO, po, ipD, pd, ...extra });
  const ESCENARIOS = {
    s14: {
      id: 's14', slide: 14, proto: 'udp',
      titulo: { es: 'UDP: dos clientes, un socket (s.14)', en: 'UDP: two clients, one socket (s.14)' },
      nota: { es: 'A (proceso P2) y B (P1) envían al puerto 6428 de C. C tiene un solo proceso, P3, con un socket UDP.', en: 'A (process P2) and B (P1) send to port 6428 of C. C has a single process, P3, with one UDP socket.' },
      clientes: [{ ip: 'A' }, { ip: 'B' }],
      servidor: { ip: 'C', modelo: 'uno-a-uno', escucha: [{ proto: 'udp', puerto: 6428, proceso: 'P3' }] },
      segmentos: [seg('udp', 'A', 9157, 'C', 6428, { proc: 'P2' }), seg('udp', 'B', 5775, 'C', 6428, { proc: 'P1' })]
    },
    s19: {
      id: 's19', slide: 19, proto: 'tcp',
      titulo: { es: 'TCP «uno a uno» (s.19)', en: 'TCP “one to one” (s.19)' },
      nota: { es: 'A:9157, B:9157 y B:5775 se conectan al puerto 80 de C. Un proceso por conexión (P4, P5, P6). Las dos primeras tienen el mismo PO, pero distinta IP_O. El último segmento repite la 4-tupla de A (HTTP persistente).', en: 'A:9157, B:9157 and B:5775 connect to port 80 of C. One process per connection (P4, P5, P6). The first two have the same source port but a different source IP. The last segment repeats A’s 4-tuple (persistent HTTP).' },
      clientes: [{ ip: 'A' }, { ip: 'B' }],
      servidor: { ip: 'C', modelo: 'uno-a-uno', primerProceso: 4, escucha: [{ proto: 'tcp', puerto: 80, proceso: 'P0' }] },
      segmentos: [seg('tcp', 'A', 9157, 'C', 80, { proc: 'P1' }), seg('tcp', 'B', 9157, 'C', 80, { proc: 'P2' }), seg('tcp', 'B', 5775, 'C', 80, { proc: 'P3' }), seg('tcp', 'A', 9157, 'C', 80, { proc: 'P1' })]
    },
    s20: {
      id: 's20', slide: 20, proto: 'tcp',
      titulo: { es: 'TCP «uno a varios» (s.20)', en: 'TCP “one to many” (s.20)' },
      nota: { es: 'Las conexiones de la s.20 (A:9157, B:9156, B:5775 al puerto 80 de C), pero un solo proceso P4 con un hilo por conexión. La demultiplexación no cambia: un socket por conexión.', en: 'The connections of s.20 (A:9157, B:9156, B:5775 to port 80 of C), but a single process P4 with one thread per connection. Demultiplexing does not change: one socket per connection.' },
      clientes: [{ ip: 'A' }, { ip: 'B' }],
      servidor: { ip: 'C', modelo: 'uno-a-varios', escucha: [{ proto: 'tcp', puerto: 80, proceso: 'P4' }] },
      segmentos: [seg('tcp', 'A', 9157, 'C', 80, { proc: 'P1' }), seg('tcp', 'B', 9156, 'C', 80, { proc: 'P2' }), seg('tcp', 'B', 5775, 'C', 80, { proc: 'P3' })]
    },
    web: {
      id: 'web', slide: 17, proto: 'tcp',
      titulo: { es: 'Servidor web hoy (s.17)', en: 'Web server today (s.17)' },
      nota: { es: 'Un servidor por eventos (como nginx): un solo proceso atiende todos los sockets en el 443. A usa HTTP/2: una sola conexión con C para todas sus pestañas y peticiones. B usa HTTP/1.1 y abre dos conexiones en paralelo, con dos puertos efímeros.', en: 'An event-driven server (like nginx): a single process serves every socket on 443. A uses HTTP/2: a single connection to C for all its tabs and requests. B uses HTTP/1.1 and opens two parallel connections, with two ephemeral ports.' },
      clientes: [{ ip: 'A' }, { ip: 'B' }],
      servidor: { ip: 'C', modelo: 'eventos', escucha: [{ proto: 'tcp', puerto: 443, proceso: 'P4' }] },
      segmentos: [
        seg('tcp', 'A', 51734, 'C', 443, { proc: 'P1', etq: { es: 'pestaña 1', en: 'tab 1' } }),
        seg('tcp', 'B', 62210, 'C', 443, { proc: 'P2' }),
        seg('tcp', 'A', 51734, 'C', 443, { proc: 'P1', etq: { es: 'pestaña 2', en: 'tab 2' } }),
        seg('tcp', 'B', 62211, 'C', 443, { proc: 'P2' }),
        seg('tcp', 'A', 51734, 'C', 443, { proc: 'P1', etq: { es: 'pestaña 1', en: 'tab 1' } })]
    },
    s21: {
      id: 's21', slide: 21, proto: 'mixto',
      titulo: { es: '443/TCP y 443/UDP a la vez (s.21)', en: '443/TCP and 443/UDP at once (s.21)' },
      nota: { es: 'C atiende HTTPS sobre TCP y HTTP/3 (QUIC) sobre UDP en el mismo puerto 443. El campo Protocolo de la cabecera IP (6 o 17) decide primero a qué protocolo de transporte va el segmento.', en: 'C serves HTTPS over TCP and HTTP/3 (QUIC) over UDP on the same port 443. The Protocol field of the IP header (6 or 17) decides first which transport protocol the segment goes to.' },
      clientes: [{ ip: 'A' }, { ip: 'B' }],
      servidor: { ip: 'C', modelo: 'eventos', escucha: [{ proto: 'tcp', puerto: 443, proceso: 'P4' }, { proto: 'udp', puerto: 443, proceso: 'P5' }] },
      segmentos: [seg('tcp', 'A', 51734, 'C', 443, { proc: 'P1' }), seg('udp', 'B', 58120, 'C', 443, { proc: 'P2' }), seg('udp', 'A', 51734, 'C', 443, { proc: 'P1' }), seg('tcp', 'B', 58120, 'C', 443, { proc: 'P2' })]
    }
  };

  // ---------------------------------------------------------------- ejercicios aleatorios
  // opts: { proto ('udp' | 'tcp' | null = cualquiera), rango ('iana' | 'linux') }
  function generar(semilla, opts = {}) {
    const r = rng(semilla);
    const el = a => a[Math.floor(r() * a.length)];
    const proto = opts.proto || (r() < 0.5 ? 'udp' : 'tcp');
    const rango = opts.rango || 'iana';
    const POR = proto === 'udp' ? [53, 123, 6428, 443] : [80, 443, 22, 6428];
    const SIN = [5000, 8080, 25, 110].filter(p => !POR.includes(p));
    const nEsc = r() < 0.3 ? 2 : 1;
    const puertos = [];
    while (puertos.length < nEsc) { const p = el(POR); if (!puertos.includes(p)) puertos.push(p); }
    const modelo = proto === 'tcp' ? el(['uno-a-uno', 'uno-a-varios', 'eventos']) : 'uno-a-uno';
    const escucha = puertos.map((p, i) => ({ proto, puerto: p, proceso: modelo === 'uno-a-uno' && proto === 'tcp' ? 'P0' : 'P' + (4 + i) }));
    const ips = r() < 0.5 ? ['A', 'B', 'D'] : ['A', 'B'];
    // puertos origen: cada cliente 1–2; a veces el mismo número en dos clientes (la trampa de la s.19)
    const usados = [];
    const origenes = [];
    ips.forEach((ip, i) => {
      const n = r() < 0.4 ? 2 : 1;
      for (let j = 0; j < n; j++) {
        let po;
        if (i > 0 && j === 0 && r() < 0.5) po = origenes[0].po;
        else { po = efimero(r, rango, usados); usados.push(po); }
        origenes.push({ ip, po });
      }
    });
    const nSeg = 4 + Math.floor(r() * 3);
    const segmentos = [];
    let rechazos = 0;
    for (let k = 0; k < nSeg; k++) {
      // con cierta frecuencia se repite un origen ya usado, para que haya segmentos que van a un socket existente
      const libres = origenes.filter(o => !segmentos.some(s => s.ipO === o.ip && s.po === o.po));
      const o = k > 0 && (r() < 0.3 || !libres.length) ? el(origenes.filter(o => !libres.includes(o))) : el(libres.length ? libres : origenes);
      let pd = el(puertos);
      if (rechazos === 0 && k > 0 && r() < 0.12) { pd = el(SIN); rechazos++; }
      segmentos.push(seg(proto, o.ip, o.po, 'C', pd));
    }
    return {
      id: 'practica', semilla: Number(semilla) >>> 0, proto, rango,
      titulo: { es: 'Ejercicio ' + (Number(semilla) >>> 0), en: 'Exercise ' + (Number(semilla) >>> 0) },
      nota: { es: '', en: '' },
      clientes: ips.map(ip => ({ ip })),
      servidor: { ip: 'C', modelo, escucha },
      segmentos
    };
  }

  // Añade un segmento desde un cliente con un puerto efímero nuevo, al primer puerto en escucha de C.
  function nuevoCliente(esc, r, rango = 'iana', ip = null) {
    const e = copia(esc);
    const usados = e.segmentos.map(s => s.po);
    const ips = e.clientes.map(c => c.ip);
    if (!ip) ip = ips.length < 3 ? 'D' : ips[Math.floor(r() * ips.length)];
    if (!ips.includes(ip)) e.clientes.push({ ip });
    const dest = e.servidor.escucha[0];
    e.segmentos.push(seg(dest.proto, ip, efimero(r, rango, usados), e.servidor.ip, dest.puerto, { nuevo: true }));
    return e;
  }

  return { PROTO, RANGOS, PROHIBIDOS, DECK, ESCENARIOS, rng, efimero, tablaInicial, demux, aplicar, responder, contar, simular, conProto, esMixto, generar, nuevoCliente };
})();
if (typeof module !== 'undefined') module.exports = MotorDemux;
