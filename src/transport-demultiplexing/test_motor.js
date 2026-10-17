// Pruebas del motor de demultiplexación: escenarios del deck e invariantes sobre escenarios aleatorios.
const M = require('./motor.js');
let fallos = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.error('FALLO: ' + m); } };
// Valores de GP31 (práctica y banco de preguntas): no pueden salir nunca en la visualización.
const PROHIBIDOS = { puertos: [50123, 8888, 41000, 50200, 9999, 44458, 9000], ips: ['192.168.1.10', '192.168.1.20', '192.168.1.30', '10.0.2.15', '172.31.254.2', '10.0.0.5'] };
const t4 = s => `${s.ipO}|${s.po}|${s.ipD}|${s.pd}`;

// --- s.14, UDP: A:9157 y B:5775 al 6428 de C → un único socket
let r = M.simular(M.ESCENARIOS.s14);
ok(r.cuenta.total === 1 && r.cuenta.udp === 1, 's14: un socket');
ok(r.pasos.every(p => p.resultado.tipo === 'socket') && r.pasos[0].destino === r.pasos[1].destino, 's14: los dos al mismo socket');
ok(r.final.sockets[0].entregados === 2, 's14: dos entregas');

// --- s.19, TCP «uno a uno»: A:9157, B:9157, B:5775 → 80; repite A:9157
r = M.simular(M.ESCENARIOS.s19);
ok(r.pasos.map(p => p.resultado.tipo).join(' ') === 'nuevo nuevo nuevo socket', 's19 decisiones: ' + r.pasos.map(p => p.resultado.tipo).join(' '));
ok(r.cuenta.total === 4 && r.cuenta.bienvenida === 1 && r.cuenta.conexion === 3, 's19: 1 bienvenida + 3 conexión');
ok(r.pasos[0].destino !== r.pasos[1].destino, 's19: mismo PO 9157 desde A y B → sockets distintos');
ok(r.pasos[3].destino === r.pasos[0].destino, 's19: misma 4-tupla → mismo socket');
ok(r.final.sockets.filter(s => s.tipo === 'conexion').map(s => s.proceso).join(',') === 'P4,P5,P6', 's19: procesos P4, P5, P6');
ok(r.pasos[0].resultado.bienvenida.puerto === 80, 's19: llega por el socket de bienvenida');
// y en UDP (interruptor): un socket
r = M.simular(M.conProto(M.ESCENARIOS.s19, 'udp'));
ok(r.cuenta.total === 1 && r.pasos.every(p => p.destino === r.pasos[0].destino), 's19 en UDP: un socket');

// --- s.20, «uno a varios»: mismos sockets, un proceso con hilos
r = M.simular(M.ESCENARIOS.s20);
ok(r.cuenta.total === 4 && r.cuenta.procesos === 1, 's20: 4 sockets, 1 proceso');
ok(r.final.sockets.filter(s => s.tipo === 'conexion').map(s => s.hilo).join(',') === '1,2,3', 's20: hilos 1, 2, 3');

// --- servidor web hoy: HTTP/2 de A reutiliza su conexión; B abre dos
r = M.simular(M.ESCENARIOS.web);
ok(r.cuenta.total === 4 && r.cuenta.conexion === 3 && r.cuenta.procesos === 1, 'web: 1 + 3 sockets, 1 proceso');
ok(r.pasos[0].destino === r.pasos[2].destino && r.pasos[2].destino === r.pasos[4].destino, 'web: pestañas de A por la misma conexión');

// --- s.21: 443/TCP y 443/UDP son sockets distintos
r = M.simular(M.ESCENARIOS.s21);
ok(M.esMixto(M.ESCENARIOS.s21) && !M.esMixto(M.ESCENARIOS.s19), 'esMixto');
ok(r.pasos[1].destino !== r.pasos[3].destino, 's21: B:58120 por UDP y por TCP → sockets distintos');
ok(r.pasos[1].destino === r.pasos[2].destino, 's21: UDP de A y de B al mismo socket');
ok(r.cuenta.total === 4 && r.cuenta.udp === 1 && r.cuenta.bienvenida === 1 && r.cuenta.conexion === 2, 's21: 1 UDP + 1 bienvenida + 2 conexión');

// --- rechazados
const t0 = M.tablaInicial({ ip: 'C', escucha: [{ proto: 'udp', puerto: 53, proceso: 'P4' }, { proto: 'tcp', puerto: 80, proceso: 'P5' }] });
ok(M.demux(t0, { proto: 'udp', ipO: 'A', po: 50001, ipD: 'C', pd: 80 }).tipo === 'rechazado', 'UDP a un puerto solo TCP → rechazado');
ok(M.demux(t0, { proto: 'tcp', ipO: 'A', po: 50001, ipD: 'C', pd: 53 }).tipo === 'rechazado', 'TCP a un puerto solo UDP → rechazado');
ok(M.demux(t0, { proto: 'udp', ipO: 'A', po: 50001, ipD: 'B', pd: 53 }).motivo === 'ip', 'otra IP_D → rechazado por IP');
ok(M.demux(t0, { proto: 'tcp', ipO: 'A', po: 50001, ipD: 'C', pd: 80 }, 'udp').tipo === 'rechazado', 'proto explícito en demux');

// --- responder: intercambia IPs y puertos; la respuesta de la respuesta es la petición
const p = { proto: 'udp', ipO: 'A', po: 9157, ipD: 'C', pd: 6428 };
const q = M.responder(p);
ok(q.ipO === 'C' && q.po === 6428 && q.ipD === 'A' && q.pd === 9157 && q.proto === 'udp', 'responder intercambia');
ok(JSON.stringify(M.responder(q)) === JSON.stringify(p), 'responder es involutiva');

// --- efímeros dentro de su rango, sin valores prohibidos
for (const rango of ['iana', 'linux']) {
  const R = M.RANGOS[rango], g = M.rng(7);
  let dentro = true, prohib = false;
  for (let i = 0; i < 20000; i++) { const e = M.efimero(g, rango); if (e < R.min || e > R.max) dentro = false; if (PROHIBIDOS.puertos.includes(e) || M.DECK.includes(e)) prohib = true; }
  ok(dentro, `efímeros ${rango} en [${R.min}, ${R.max}]`);
  ok(!prohib, `efímeros ${rango} sin prohibidos`);
}
ok(M.RANGOS.iana.min === 49152 && M.RANGOS.iana.max === 65535 && M.RANGOS.linux.min === 32768 && M.RANGOS.linux.max === 60999, 'rangos');
{ const g = M.rng(3), u = [M.efimero(g)]; for (let i = 0; i < 50; i++) u.push(M.efimero(g, 'iana', u)); ok(new Set(u).size === u.length, 'efímero evita los usados'); }

// --- generador con semilla: determinista; invariantes de la 2-tupla y la 4-tupla
ok(JSON.stringify(M.generar(42)) === JSON.stringify(M.generar(42)), 'generar determinista');
ok(JSON.stringify(M.generar(42)) !== JSON.stringify(M.generar(43)), 'semillas distintas, ejercicios distintos');
const prohibidos = new RegExp('(' + [...PROHIBIDOS.ips.map(x => x.replace(/\./g, '\\.')), ...PROHIBIDOS.puertos.map(x => '\\b' + x + '\\b')].join('|') + ')');
let malos = 0, rechazosVistos = 0, nuevosVistos = 0, reusoVistos = 0, mismoPO = 0;
for (let s = 1; s <= 3000; s++) {
  for (const proto of ['udp', 'tcp']) {
    const rango = s % 2 ? 'iana' : 'linux';
    const e = M.generar(s, { proto, rango });
    const R = M.RANGOS[rango];
    if (e.segmentos.length < 4 || e.segmentos.length > 6) { malos++; continue; }
    if (prohibidos.test(JSON.stringify(e))) { malos++; console.error('prohibido en', s, proto); }
    if (e.segmentos.some(x => x.po < R.min || x.po > R.max)) malos++;
    const res = M.simular(e);
    const aceptados = res.pasos.filter(x => x.resultado.tipo !== 'rechazado');
    rechazosVistos += res.pasos.length - aceptados.length;
    // demux coherente: misma clave → mismo socket; claves distintas → sockets distintos
    const clave = x => proto === 'udp' ? `${x.seg.ipD}|${x.seg.pd}` : t4(x.seg);
    const porClave = {};
    for (const x of aceptados) { const k = clave(x); if (k in porClave && porClave[k] !== x.destino) malos++; porClave[k] = x.destino; }
    if (new Set(Object.values(porClave)).size !== Object.keys(porClave).length) malos++;
    const nEsc = e.servidor.escucha.length;
    if (proto === 'udp') {
      // un socket por puerto, y nada más, por muchos clientes que haya
      if (res.cuenta.total !== nEsc || res.pasos.some(x => x.resultado.tipo === 'nuevo')) malos++;
    } else {
      const tuplas = new Set(aceptados.map(x => t4(x.seg)));
      if (res.cuenta.total !== nEsc + tuplas.size || res.cuenta.bienvenida !== nEsc) malos++;
      nuevosVistos += res.pasos.filter(x => x.resultado.tipo === 'nuevo').length;
      reusoVistos += res.pasos.filter(x => x.resultado.tipo === 'socket').length;
      const pos = {}; for (const x of e.segmentos) (pos[x.po] = pos[x.po] || new Set()).add(x.ipO);
      if (Object.values(pos).some(v => v.size > 1)) mismoPO++;
      if (e.servidor.modelo === 'uno-a-uno') { const pr = res.final.sockets.filter(x => x.tipo === 'conexion').map(x => x.proceso); if (new Set(pr).size !== pr.length) malos++; }
      else if (res.cuenta.procesos !== nEsc) malos++;
    }
    // responder inverso para todos
    if (e.segmentos.some(x => t4(M.responder(M.responder(x))) !== t4(x))) malos++;
  }
}
ok(malos === 0, `invariantes en 6000 ejercicios aleatorios (${malos} fallos)`);
ok(rechazosVistos > 0 && nuevosVistos > 0 && reusoVistos > 0 && mismoPO > 0, `variedad: rechazados ${rechazosVistos}, nuevos ${nuevosVistos}, reutilizados ${reusoVistos}, mismo PO en dos IP ${mismoPO}`);

ok(PROHIBIDOS.puertos.every(M.reservado), 'los puertos de GP31 están reservados (efímeros y semillas)');
{ let mal = 0; for (let s = 1; s <= 3000; s++) { const e = M.generar(s); const d = {}; for (const x of e.segmentos) { const k = x.ipO + '|' + x.po; if (k in d && d[k] !== x.pd) mal++; d[k] = x.pd; } } ok(mal === 0, 'un (IP, PO) no va a dos PD distintos'); }
{ const t = M.tablaInicial({ ip: 'C', modelo: 'uno-a-varios', escucha: [{ proto: 'tcp', puerto: 80, proceso: 'P4' }, { proto: 'tcp', puerto: 443, proceso: 'P5' }] });
  let a = M.aplicar(t, { proto: 'tcp', ipO: 'A', po: 51001, ipD: 'C', pd: 80 }).tabla; a = M.aplicar(a, { proto: 'tcp', ipO: 'A', po: 51002, ipD: 'C', pd: 443 }).tabla; a = M.aplicar(a, { proto: 'tcp', ipO: 'B', po: 51003, ipD: 'C', pd: 80 }).tabla;
  ok(a.sockets.filter(s => s.tipo === 'conexion').map(s => s.proceso + ':' + s.hilo).join(',') === 'P4:1,P5:1,P4:2', 'hilos numerados por proceso'); }
// --- presets sin valores prohibidos
ok(!prohibidos.test(JSON.stringify(M.ESCENARIOS)), 'escenarios del deck sin valores de GP31');

// --- nuevo cliente: puerto efímero en el rango elegido y D como tercer cliente
{ const g = M.rng(11); let e = M.nuevoCliente(M.ESCENARIOS.s19, g, 'linux');
  const u = e.segmentos.at(-1);
  ok(u.ipO === 'D' && u.pd === 80 && u.po >= 32768 && u.po <= 60999, 'nuevo cliente D con efímero Linux');
  e = M.nuevoCliente(e, g, 'iana'); const v = e.segmentos.at(-1);
  ok(v.po >= 49152 && e.clientes.length === 3, 'nuevo cliente IANA, sin cuarto host');
  ok(M.simular(e).cuenta.conexion === 5, 'nuevo cliente: dos conexiones más'); }

console.log(fallos ? `${fallos} de ${n} pruebas fallan` : `OK: ${n} pruebas del motor de demultiplexación`);
process.exit(fallos ? 1 : 0);
