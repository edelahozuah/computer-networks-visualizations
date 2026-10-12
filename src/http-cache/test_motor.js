// Comprueba el motor con los casos del plan y con invariantes sobre escenarios aleatorios: node test_motor.js
const M = require('./motor.js');
let fallos = 0;
const ok = (cond, msg) => { if (!cond) { fallos++; console.log('FALLO:', msg); } };

// Caso de clase (actividad A5 de GG23): index 300 s, logo 86400 s, foto no-cache; +600 s con foto modificada; +100 s sin cambios
const clase = { objetos: [
  { nombre: 'index.html', kb: 10, politica: 'max-age', maxAge: 300 },
  { nombre: 'logo.png', kb: 50, politica: 'max-age', maxAge: 86400 },
  { nombre: 'foto.png', kb: 200, politica: 'no-cache', maxAge: 0 }],
  visitas: [{ t: 0, modificados: [] }, { t: 600, modificados: ['foto.png'] }, { t: 100, modificados: [] }] };
const r = M.simular(clase);
const d = (k) => r.visitas[k].pasos.map(p => p.decision).join(' ');
ok(d(0) === 'get200 get200 get200', 'visita 1: ' + d(0));
ok(d(1) === 'getc304 cache getc200', 'visita 2: ' + d(1));
ok(d(2) === 'cache cache getc304', 'visita 3: ' + d(2));
ok(r.visitas[1].kb === 200 && r.visitas[1].mensajes === 4, 'visita 2: bytes/mensajes ' + r.visitas[1].kb + '/' + r.visitas[1].mensajes);
ok(r.visitas[0].kb === 260 && r.visitas[0].mensajes === 6, 'visita 1: bytes/mensajes');
ok(r.visitas[1].pasos[0].edad === 600 && r.visitas[2].pasos[0].edad === 100, 'edades del index');

// no-store y sin frescura: nunca en caché; no-cache: siempre revalida
const ns = { objetos: [{ nombre: 'a', kb: 1, politica: 'no-store', maxAge: 0 }, { nombre: 'b', kb: 1, politica: 'sin', maxAge: 0 }, { nombre: 'c', kb: 1, politica: 'no-cache', maxAge: 0 }],
  visitas: [{ t: 0 }, { t: 0 }, { t: 99999 }] };
const rs = M.simular(ns);
ok(rs.visitas[1].pasos[0].decision === 'get200' && rs.visitas[2].pasos[1].decision === 'get200', 'no-store / sin: GET normal siempre');
ok(rs.visitas[1].pasos[2].decision === 'getc304' && rs.visitas[2].pasos[2].decision === 'getc304', 'no-cache: condicional aunque t = 0');
ok(!('a' in rs.visitas[2].cacheDespues) && !('b' in rs.visitas[2].cacheDespues), 'no-store y sin no se guardan');

// max-age = 0: caduca al instante
const m0 = M.simular({ objetos: [{ nombre: 'x', kb: 1, politica: 'max-age', maxAge: 0 }], visitas: [{ t: 0 }, { t: 0 }] });
ok(m0.visitas[1].pasos[0].decision === 'getc304', 'max-age 0 revalida');

// invariantes sobre escenarios aleatorios
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 3000; i++) {
  const esc = M.aleatorio(rnd);
  ok(M.validar(esc).length === 0, 'escenario aleatorio inválido');
  const res = M.simular(esc);
  res.visitas.forEach((v, k) => {
    for (const p of v.pasos) {
      const o = esc.objetos.find(x => x.nombre === p.nombre);
      if (p.peticion === 'getc') ok(p.enCache, 'condicional sin copia');
      if (p.respuesta === '304') ok(p.vCopia === p.vServidor, '304 a objeto modificado');
      if (p.decision === 'getc200') ok(p.vCopia !== p.vServidor, '200 a un condicional sin cambio');
      if (p.decision === 'cache') ok(o.politica === 'max-age' && p.edad < o.maxAge, 'servido de caché sin estar fresco');
      if (o.politica === 'no-store' || o.politica === 'sin') ok(p.decision === 'get200' && !(p.nombre in v.cacheDespues), 'no-store/sin en caché');
      if (k === 0) ok(p.decision === 'get200', 'primera visita sin GET normal');
    }
    ok(v.mensajes === 2 * v.pasos.filter(p => p.peticion).length, 'cuenta de mensajes');
  });
}
console.log(fallos ? `${fallos} fallos` : 'motor: todas las comprobaciones pasan');
process.exit(fallos ? 1 : 0);
