// Motor de cookies HTTP: qué cabeceras de estado lleva cada mensaje de cada visita.
// Modelo didáctico de GG23 (AR1), el mismo que SEC_HTTP_ESTADO de la web de ejercicios (Practica_Web
// docs/18): el almacén de cookies del navegador tiene una fila por sitio; el servidor que usa cookies pone
// Set-Cookie solo en la respuesta a una petición que llega sin su cookie; desde entonces toda petición a ese
// sitio lleva Cookie, también en visitas posteriores y también desde páginas de otros sitios (terceros).
// Una cookie muere al caducar (Max-Age) o, si no tiene Max-Age, al cerrar el navegador.
const MotorCookies = (() => {
  'use strict';

  // esc: { sitios: [{ host, usaCookies, nombre, valor, maxAge (s; null = de sesión), objetos: [{ nombre, host }] }],
  //        almacenInicial: [{ host, nombre, valor }]   (cookies que el navegador ya tenía; no caducan en el escenario)
  //        visitas: [{ sitio (host), t (s desde la anterior), cerrado (el navegador se cerró entre medias) }] }
  // Devuelve { visitas: [{ k, t, tAbs, sitio, cerrado, borradas, pasos, almacenAntes, almacenDespues, conCookie,
  //            setCookies, mensajes, conocido }] }
  function simular(esc) {
    const sitios = {};
    for (const s of esc.sitios) sitios[s.host] = s;
    const siguiente = {};                       // host → próximo valor que asignará el servidor
    for (const s of esc.sitios) siguiente[s.host] = String(s.valor ?? '');
    const conocido = {};                        // host → [{ valor, vistas: [{ k, pagina, objeto }] }]
    for (const s of esc.sitios) if (s.usaCookies) conocido[s.host] = [];
    let almacen = (esc.almacenInicial || []).map(c => ({ host: c.host, nombre: c.nombre, valor: String(c.valor), recibidoEn: 0, maxAge: null, persistente: true, desde: 0 }));
    const motivo = {};                          // host → por qué no hay cookie suya ('nunca' | 'caducada' | 'cierre')
    let tAbs = 0;
    const visitas = [];
    esc.visitas.forEach((vis, k) => {
      tAbs += k === 0 ? 0 : Math.max(0, vis.t || 0);
      const cerrado = k > 0 && !!vis.cerrado;
      // 1. limpieza del almacén al empezar la visita
      const borradas = [];
      almacen = almacen.filter(c => {
        if (c.persistente) return true;
        if (c.maxAge === null) { if (cerrado) { borradas.push({ ...c, motivo: 'cierre' }); motivo[c.host] = 'cierre'; return false; } return true; }
        if (tAbs - c.recibidoEn >= c.maxAge) { borradas.push({ ...c, motivo: 'caducada' }); motivo[c.host] = 'caducada'; return false; }
        return true;
      });
      const almacenAntes = copia(almacen, tAbs);
      // 2. peticiones de la visita: la página y después sus objetos, en orden
      const sitio = sitios[vis.sitio];
      const peticiones = [{ nombre: 'index.html', host: vis.sitio }, ...(sitio.objetos || []).map(o => ({ nombre: o.nombre, host: o.host }))];
      const pasos = [];
      let conCookie = 0, setCookies = 0;
      for (const pet of peticiones) {
        const servidor = sitios[pet.host];
        const fila = almacen.find(c => c.host === pet.host);
        const tercero = pet.host !== vis.sitio;
        const paso = { nombre: pet.nombre, host: pet.host, tercero, pagina: vis.sitio, usaCookies: !!servidor.usaCookies, edad: fila ? tAbs - fila.recibidoEn : null };
        if (fila) {
          paso.cookie = `${fila.nombre}=${fila.valor}`; paso.valor = fila.valor; paso.setCookie = null; paso.decision = 'envia'; paso.motivo = fila.persistente ? 'inicial' : 'guardada';
          conCookie++;
          if (servidor.usaCookies) anotar(conocido, pet.host, fila.valor, k, vis.sitio, pet.nombre);
        } else {
          paso.cookie = null; paso.motivo = motivo[pet.host] || 'nunca';
          if (servidor.usaCookies) {
            const valor = siguiente[pet.host];
            siguiente[pet.host] = incrementar(valor);
            paso.setCookie = `${servidor.nombre}=${valor}` + (servidor.maxAge === null ? '' : `; Max-Age=${servidor.maxAge}`);
            paso.valor = valor; paso.decision = 'nueva'; paso.maxAge = servidor.maxAge;
            almacen.push({ host: pet.host, nombre: servidor.nombre, valor, recibidoEn: tAbs, maxAge: servidor.maxAge, persistente: false, desde: k });
            delete motivo[pet.host];
            setCookies++;
            anotar(conocido, pet.host, valor, k, vis.sitio, pet.nombre);
          } else { paso.setCookie = null; paso.decision = 'ninguna'; }
        }
        pasos.push(paso);
      }
      visitas.push({ k, t: k === 0 ? 0 : vis.t, tAbs, sitio: vis.sitio, cerrado, borradas, pasos, almacenAntes, almacenDespues: copia(almacen, tAbs), conCookie, setCookies, mensajes: 2 * pasos.length, conocido: copiaConocido(conocido) });
    });
    return { visitas };
  }

  function anotar(conocido, host, valor, k, pagina, objeto) {
    let e = conocido[host].find(x => x.valor === valor);
    if (!e) { e = { valor, vistas: [] }; conocido[host].push(e); }
    e.vistas.push({ k, pagina, objeto });
  }
  function incrementar(v) { return /^\d+$/.test(v) ? String(Number(v) + 1) : v + '-2'; }
  function copia(a, tAbs) { return a.map(c => ({ ...c, edad: c.persistente ? null : tAbs - c.recibidoEn })); }
  function copiaConocido(c) { const o = {}; for (const h in c) o[h] = c[h].map(e => ({ valor: e.valor, vistas: e.vistas.map(v => ({ ...v })) })); return o; }

  // Comprobación del escenario; devuelve una lista de errores (vacía si es válido)
  function validar(esc, L = (es) => es) {
    const err = [];
    if (!esc || !Array.isArray(esc.sitios) || !esc.sitios.length) { err.push(L('Hace falta al menos un sitio.', 'At least one site is needed.')); return err; }
    const hosts = new Set();
    esc.sitios.forEach((s, i) => {
      const h = String(s.host || '').trim();
      if (!h) err.push(L(`El sitio ${i + 1} no tiene nombre.`, `Site ${i + 1} has no name.`));
      else if (hosts.has(h)) err.push(L(`Sitio repetido: ${h}.`, `Duplicate site: ${h}.`));
      hosts.add(h);
      if (s.usaCookies) {
        if (!String(s.nombre || '').trim() || !String(s.valor ?? '').trim()) err.push(L(`${h || i + 1}: la cookie necesita nombre y valor.`, `${h || i + 1}: the cookie needs a name and a value.`));
        if (s.maxAge !== null && !(s.maxAge >= 0)) err.push(L(`${h || i + 1}: Max-Age debe ser un número mayor o igual que 0, o vacío.`, `${h || i + 1}: Max-Age must be a number greater than or equal to 0, or empty.`));
      }
      const nombres = new Set();
      (s.objetos || []).forEach((o, j) => {
        if (!String(o.nombre || '').trim()) err.push(L(`${h || i + 1}: el objeto ${j + 1} no tiene nombre.`, `${h || i + 1}: object ${j + 1} has no name.`));
        else if (nombres.has(o.nombre)) err.push(L(`${h || i + 1}: objeto repetido ${o.nombre}.`, `${h || i + 1}: duplicate object ${o.nombre}.`));
        nombres.add(o.nombre);
      });
    });
    esc.sitios.forEach(s => (s.objetos || []).forEach(o => { if (!hosts.has(o.host)) err.push(L(`${s.host}: el objeto ${o.nombre} apunta a un sitio que no existe (${o.host}).`, `${s.host}: object ${o.nombre} points to a site that does not exist (${o.host}).`)); }));
    const ini = new Set();
    (esc.almacenInicial || []).forEach((c, i) => {
      if (!String(c.host || '').trim() || !String(c.nombre || '').trim() || !String(c.valor ?? '').trim()) err.push(L(`Cookie inicial ${i + 1}: hacen falta sitio, nombre y valor.`, `Initial cookie ${i + 1}: site, name and value are needed.`));
      else if (ini.has(c.host)) err.push(L(`Cookie inicial repetida para ${c.host}.`, `Duplicate initial cookie for ${c.host}.`));
      ini.add(c.host);
    });
    if (!Array.isArray(esc.visitas) || !esc.visitas.length) err.push(L('Hace falta al menos una visita.', 'At least one visit is needed.'));
    else esc.visitas.forEach((v, k) => {
      if (!hosts.has(v.sitio)) err.push(L(`Visita ${k + 1}: el sitio no existe.`, `Visit ${k + 1}: the site does not exist.`));
      if (k > 0 && !(v.t >= 0)) err.push(L(`Visita ${k + 1}: el tiempo desde la anterior debe ser mayor o igual que 0.`, `Visit ${k + 1}: the time since the previous one must be greater than or equal to 0.`));
    });
    return err;
  }

  // Escenario aleatorio para practicar (rnd: función que devuelve [0, 1))
  function aleatorio(rnd = Math.random) {
    const el = a => a[Math.floor(rnd() * a.length)];
    const tipo = el(['simple', 'sesion', 'terceros', 'dos']);
    const hostA = el(['www.tienda.es', 'www.periodico.es', 'www.uah.es', 'www.viajes.com']);
    const hostB = el(['www.foro.net', 'www.recetas.org', 'www.musica.io']);
    const ads = 'ads.ejemplo.net';
    const DUR = [3600, 86400, 604800, 2592000];
    const SEP = [600, 3600, 86400, 604800, 2592000];
    const valor = String(1000 + Math.floor(rnd() * 9000));
    const objs = (h, n) => ['logo.png', 'foto.jpg', 'estilo.css'].slice(0, n).map(nombre => ({ nombre, host: h }));
    const sitios = [], visitas = [];
    if (tipo === 'simple' || tipo === 'dos') {
      sitios.push({ host: hostA, usaCookies: true, nombre: 'id', valor, maxAge: el(DUR), objetos: objs(hostA, 1 + Math.floor(rnd() * 2)) });
      if (tipo === 'dos') sitios.push({ host: hostB, usaCookies: rnd() < 0.5, nombre: 'sid', valor: incrementar(valor), maxAge: el(DUR), objetos: objs(hostB, 1) });
      const n = 2 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) visitas.push({ sitio: tipo === 'dos' && k === 1 ? hostB : hostA, t: k ? el(SEP) : 0, cerrado: k ? rnd() < 0.7 : false });
    } else if (tipo === 'sesion') {
      sitios.push({ host: hostA, usaCookies: true, nombre: 'sesion', valor, maxAge: null, objetos: objs(hostA, 2) });
      visitas.push({ sitio: hostA, t: 0, cerrado: false }, { sitio: hostA, t: el([300, 600, 3600]), cerrado: rnd() < 0.5 }, { sitio: hostA, t: el(SEP), cerrado: rnd() < 0.6 });
    } else {
      sitios.push({ host: hostA, usaCookies: rnd() < 0.4, nombre: 'id', valor, maxAge: 2592000, objetos: [...objs(hostA, 1), { nombre: 'anuncio.gif', host: ads }] });
      sitios.push({ host: hostB, usaCookies: false, nombre: 'id', valor: '1', maxAge: null, objetos: [{ nombre: 'banner.gif', host: ads }] });
      sitios.push({ host: ads, usaCookies: true, nombre: 'uid', valor: incrementar(valor), maxAge: 31536000, objetos: [] });
      visitas.push({ sitio: hostA, t: 0, cerrado: false }, { sitio: hostB, t: el(SEP), cerrado: rnd() < 0.5 });
      if (rnd() < 0.5) visitas.push({ sitio: hostA, t: el(SEP), cerrado: true });
    }
    const almacenInicial = rnd() < 0.3 ? [{ host: 'www.ebay.com', nombre: 'id', valor: '8734' }] : [];
    return { sitios, almacenInicial, visitas };
  }

  return { simular, validar, aleatorio, DECISIONES: ['ninguna', 'nueva', 'envia'] };
})();
if (typeof module !== 'undefined') module.exports = MotorCookies;
