// Pruebas del motor de cookies: casos fijos del plan e invariantes sobre escenarios aleatorios.
const M = require('./motor.js');
let fallos = 0;
const ok = (c, m) => { if (!c) { fallos++; console.error('FALLO: ' + m); } };
const dec = (r, k) => r.visitas[k].pasos.map(p => p.decision).join(' ');

// Ejemplo de clase: tienda con id=1678 (30 días), visitas a 0, +7 días (cerrado) y +30 días (cerrado)
const clase = { sitios: [{ host: 'www.tienda.es', usaCookies: true, nombre: 'id', valor: '1678', maxAge: 2592000, objetos: [{ nombre: 'logo.png', host: 'www.tienda.es' }, { nombre: 'foto.jpg', host: 'www.tienda.es' }] }],
  almacenInicial: [], visitas: [{ sitio: 'www.tienda.es', t: 0, cerrado: false }, { sitio: 'www.tienda.es', t: 604800, cerrado: true }, { sitio: 'www.tienda.es', t: 2592000, cerrado: true }] };
ok(M.validar(clase).length === 0, 'clase válido');
let r = M.simular(clase);
ok(dec(r, 0) === 'nueva envia envia', 'clase v1: ' + dec(r, 0));
ok(r.visitas[0].pasos[0].setCookie === 'id=1678; Max-Age=2592000' && r.visitas[0].pasos[1].cookie === 'id=1678', 'clase v1 cabeceras');
ok(dec(r, 1) === 'envia envia envia' && r.visitas[1].pasos[0].cookie === 'id=1678', 'clase v2 (una semana después): ' + dec(r, 1));
ok(dec(r, 2) === 'nueva envia envia' && r.visitas[2].pasos[0].setCookie.startsWith('id=1679') && r.visitas[2].pasos[1].cookie === 'id=1679', 'clase v3 caducada → id nuevo: ' + dec(r, 2));
ok(r.visitas[2].borradas.length === 1 && r.visitas[2].borradas[0].motivo === 'caducada' && r.visitas[2].pasos[0].motivo === 'caducada', 'clase v3 borrada por caducidad');
ok(r.visitas[1].almacenAntes[0].edad === 604800, 'edad en v2');
ok(r.visitas[0].conCookie === 2 && r.visitas[0].setCookies === 1 && r.visitas[0].mensajes === 6, 'clase v1 cuentas');

// Figura 2.10 de Kurose: ebay en el almacén, amazon asigna 1678; una semana después
const diap8 = { sitios: [{ host: 'www.amazon.com', usaCookies: true, nombre: 'id', valor: '1678', maxAge: 31536000, objetos: [{ nombre: 'logo.png', host: 'www.amazon.com' }] }],
  almacenInicial: [{ host: 'www.ebay.com', nombre: 'id', valor: '8734' }], visitas: [{ sitio: 'www.amazon.com', t: 0, cerrado: false }, { sitio: 'www.amazon.com', t: 604800, cerrado: true }] };
r = M.simular(diap8);
ok(dec(r, 0) === 'nueva envia' && dec(r, 1) === 'envia envia', 'diap8: ' + dec(r, 0) + ' / ' + dec(r, 1));
ok(r.visitas[1].almacenAntes.some(c => c.host === 'www.ebay.com' && c.valor === '8734'), 'diap8: ebay sigue en el almacén tras cerrar');
ok(r.visitas.every(v => v.pasos.every(p => !p.cookie || !p.cookie.includes('8734'))), 'diap8: la cookie de ebay nunca sale');

// Terceros: periodico y tienda sin cookies incluyen un anuncio de ads.ejemplo.net (uid=4411)
const terceros = { sitios: [
  { host: 'www.periodico.es', usaCookies: false, nombre: '', valor: '', maxAge: null, objetos: [{ nombre: 'portada.jpg', host: 'www.periodico.es' }, { nombre: 'anuncio.gif', host: 'ads.ejemplo.net' }] },
  { host: 'www.tienda.es', usaCookies: false, nombre: '', valor: '', maxAge: null, objetos: [{ nombre: 'anuncio.gif', host: 'ads.ejemplo.net' }] },
  { host: 'ads.ejemplo.net', usaCookies: true, nombre: 'uid', valor: '4411', maxAge: 31536000, objetos: [] }],
  almacenInicial: [], visitas: [{ sitio: 'www.periodico.es', t: 0, cerrado: false }, { sitio: 'www.tienda.es', t: 3600, cerrado: true }, { sitio: 'www.periodico.es', t: 86400, cerrado: true }] };
ok(M.validar(terceros).length === 0, 'terceros válido');
r = M.simular(terceros);
ok(dec(r, 0) === 'ninguna ninguna nueva' && dec(r, 1) === 'ninguna envia' && dec(r, 2) === 'ninguna ninguna envia', 'terceros: ' + [0, 1, 2].map(k => dec(r, k)).join(' / '));
ok(r.visitas[1].pasos[1].tercero && r.visitas[1].pasos[1].cookie === 'uid=4411', 'terceros: la misma cookie desde tienda');
const con = r.visitas[2].conocido['ads.ejemplo.net'];
ok(con.length === 1 && con[0].vistas.map(v => v.pagina).join(',') === 'www.periodico.es,www.tienda.es,www.periodico.es', 'terceros: ads sabe desde qué páginas');
ok(!('www.periodico.es' in r.visitas[2].conocido), 'terceros: los sitios sin cookies no saben nada');

// Cookie de sesión (sin Max-Age): sobrevive si no se cierra el navegador, muere al cerrarlo
const sesion = { sitios: [{ host: 'www.uah.es', usaCookies: true, nombre: 'sesion', valor: 'a1', maxAge: null, objetos: [{ nombre: 'logo.png', host: 'www.uah.es' }] }],
  almacenInicial: [], visitas: [{ sitio: 'www.uah.es', t: 0, cerrado: false }, { sitio: 'www.uah.es', t: 600, cerrado: false }, { sitio: 'www.uah.es', t: 3600, cerrado: true }] };
r = M.simular(sesion);
ok(dec(r, 0) === 'nueva envia' && dec(r, 1) === 'envia envia' && dec(r, 2) === 'nueva envia', 'sesión: ' + [0, 1, 2].map(k => dec(r, k)).join(' / '));
ok(r.visitas[0].pasos[0].setCookie === 'sesion=a1' && r.visitas[2].pasos[0].setCookie === 'sesion=a1-2', 'sesión: sin Max-Age y valor nuevo');
ok(r.visitas[2].borradas[0].motivo === 'cierre' && r.visitas[2].pasos[0].motivo === 'cierre', 'sesión: borrada al cerrar');

// Max-Age = 0: caduca al instante (en la visita siguiente ya no está)
r = M.simular({ sitios: [{ host: 'a', usaCookies: true, nombre: 'id', valor: '1', maxAge: 0, objetos: [] }], almacenInicial: [], visitas: [{ sitio: 'a', t: 0 }, { sitio: 'a', t: 0 }] });
ok(dec(r, 1) === 'nueva' && r.visitas[1].pasos[0].valor === '2', 'Max-Age 0');

// validación
ok(M.validar({ sitios: [{ host: 'a', usaCookies: true, nombre: '', valor: '', maxAge: null, objetos: [] }], visitas: [{ sitio: 'a', t: 0 }] }).length === 1, 'validar: cookie sin nombre');
ok(M.validar({ sitios: [{ host: 'a', usaCookies: false, objetos: [{ nombre: 'x', host: 'b' }] }], visitas: [{ sitio: 'a', t: 0 }] }).length === 1, 'validar: objeto de sitio inexistente');
ok(M.validar({ sitios: [{ host: 'a', usaCookies: false, objetos: [] }], visitas: [{ sitio: 'z', t: 0 }] }).length === 1, 'validar: visita a sitio inexistente');

// invariantes sobre escenarios aleatorios
let seed = 11; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 3000; i++) {
  const esc = M.aleatorio(rnd);
  ok(M.validar(esc).length === 0, 'escenario aleatorio inválido: ' + M.validar(esc).join(' '));
  const res = M.simular(esc);
  const sitios = Object.fromEntries(esc.sitios.map(s => [s.host, s]));
  const vistos = {};
  res.visitas.forEach((v, k) => {
    ok(v.mensajes === 2 * v.pasos.length, 'cuenta de mensajes');
    ok(v.almacenAntes.every(c => c.persistente || c.maxAge === null || c.edad < c.maxAge), 'cookie caducada en el almacén');
    if (v.cerrado) ok(v.almacenAntes.every(c => c.persistente || c.maxAge !== null), 'cookie de sesión tras cerrar');
    for (const p of v.pasos) {
      ok(!(p.cookie && p.setCookie), 'Cookie y Set-Cookie en el mismo intercambio');
      if (p.setCookie) ok(sitios[p.host].usaCookies, 'Set-Cookie de un sitio sin cookies');
      if (p.cookie) { const c = v.almacenAntes.find(x => x.host === p.host) || v.almacenDespues.find(x => x.host === p.host); ok(c && p.cookie === `${c.nombre}=${c.valor}`, 'Cookie distinta de la del almacén'); }
      if (p.decision === 'nueva') ok(v.almacenDespues.some(c => c.host === p.host && c.valor === p.valor), 'nueva sin fila después');
      if (p.decision === 'ninguna') ok(!sitios[p.host].usaCookies, 'ninguna en un sitio con cookies');
      if (!vistos[p.host] && sitios[p.host].usaCookies && !esc.almacenInicial.some(c => c.host === p.host)) ok(p.decision === 'nueva', 'primera petición a un sitio con cookies sin Set-Cookie');
      vistos[p.host] = true;
      ok(p.tercero === (p.host !== v.sitio), 'marca de tercero');
    }
  });
}
console.log(fallos ? `${fallos} fallos` : 'motor: todas las comprobaciones pasan');
process.exit(fallos ? 1 : 0);
