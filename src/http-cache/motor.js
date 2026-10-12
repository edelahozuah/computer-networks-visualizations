// Motor de la caché del navegador: qué hace el navegador con cada objeto en cada visita.
// Modelo didáctico de GG23 (AR1): frescura explícita por objeto (max-age, no-cache, no-store o sin
// información), Last-Modified en toda respuesta 200, GET condicional con If-Modified-Since.
// Las visitas son instantáneas: solo importa qué mensajes salen y qué responde el servidor.
const MotorCache = (() => {
  'use strict';

  // Políticas de frescura que puede llevar un objeto
  const POLITICAS = ['max-age', 'no-cache', 'no-store', 'sin'];

  // esc: { objetos: [{ nombre, kb, politica, maxAge }], visitas: [{ t, modificados: [nombre] }] }
  // Devuelve { visitas: [{ tAbs, pasos: [...], cacheAntes, cacheDespues, mensajes, kb, kbTotal }] }
  function simular(esc) {
    const objetos = esc.objetos;
    const servidor = {};               // versión actual de cada objeto en el servidor
    for (const o of objetos) servidor[o.nombre] = 1;
    let cache = {};                    // nombre → { v, recibidoEn, maxAge, politica }
    let tAbs = 0;
    const visitas = [];
    esc.visitas.forEach((vis, k) => {
      tAbs += k === 0 ? 0 : Math.max(0, vis.t || 0);
      for (const n of vis.modificados || []) if (n in servidor) servidor[n] += 1;
      const cacheAntes = copia(cache);
      const pasos = [];
      let mensajes = 0, kb = 0, kbTotal = 0;
      for (const o of objetos) {
        kbTotal += o.kb;
        const c = cache[o.nombre];
        const vServ = servidor[o.nombre];
        const paso = { nombre: o.nombre, kb: o.kb, politica: o.politica, maxAge: o.maxAge, vServidor: vServ };
        if (!c) {
          // 1. no está en caché → GET normal → 200
          paso.enCache = false; paso.fresca = null; paso.edad = null;
          paso.peticion = 'get'; paso.respuesta = '200'; paso.vRecibida = vServ;
          paso.decision = 'get200';
          mensajes += 2; kb += o.kb;
          if (o.politica === 'max-age' || o.politica === 'no-cache') cache[o.nombre] = { v: vServ, recibidoEn: tAbs, maxAge: o.maxAge, politica: o.politica };
          paso.guardada = o.politica === 'max-age' || o.politica === 'no-cache';
        } else {
          paso.enCache = true; paso.vCopia = c.v; paso.edad = tAbs - c.recibidoEn;
          const fresca = c.politica === 'max-age' && paso.edad < c.maxAge;
          paso.fresca = fresca;
          if (fresca) {
            // 2. fresca → se sirve de la caché, ningún mensaje
            paso.peticion = null; paso.respuesta = null; paso.decision = 'cache';
            paso.guardada = true;
          } else {
            // 3. no fresca → GET condicional
            paso.peticion = 'getc';
            if (c.v === vServ) {
              paso.respuesta = '304'; paso.decision = 'getc304';
              c.recibidoEn = tAbs;           // vuelve a ser fresca otro max-age
              mensajes += 2;
            } else {
              paso.respuesta = '200'; paso.decision = 'getc200'; paso.vRecibida = vServ;
              cache[o.nombre] = { v: vServ, recibidoEn: tAbs, maxAge: c.maxAge, politica: c.politica };
              mensajes += 2; kb += o.kb;
            }
            paso.guardada = true;
          }
        }
        pasos.push(paso);
      }
      visitas.push({ k, t: k === 0 ? 0 : vis.t, tAbs, modificados: (vis.modificados || []).filter(n => n in servidor), pasos, cacheAntes, cacheDespues: copia(cache), mensajes, kb, kbTotal });
    });
    return { visitas };
  }

  function copia(c) { const o = {}; for (const k in c) o[k] = { ...c[k] }; return o; }

  // Comprobación del escenario; devuelve una lista de errores (vacía si es válido)
  function validar(esc, L = (es) => es) {
    const err = [];
    if (!esc || !Array.isArray(esc.objetos) || !esc.objetos.length) { err.push(L('Hace falta al menos un objeto (la página).', 'At least one object (the page) is needed.')); return err; }
    const nombres = new Set();
    esc.objetos.forEach((o, i) => {
      if (!o.nombre || !String(o.nombre).trim()) err.push(L(`El objeto ${i + 1} no tiene nombre.`, `Object ${i + 1} has no name.`));
      else if (nombres.has(o.nombre)) err.push(L(`Nombre repetido: ${o.nombre}.`, `Duplicate name: ${o.nombre}.`));
      nombres.add(o.nombre);
      if (!(o.kb > 0)) err.push(L(`${o.nombre || i + 1}: el tamaño debe ser mayor que 0.`, `${o.nombre || i + 1}: the size must be greater than 0.`));
      if (!POLITICAS.includes(o.politica)) err.push(L(`${o.nombre || i + 1}: política desconocida.`, `${o.nombre || i + 1}: unknown policy.`));
      if (o.politica === 'max-age' && !(o.maxAge >= 0)) err.push(L(`${o.nombre || i + 1}: max-age debe ser un número mayor o igual que 0.`, `${o.nombre || i + 1}: max-age must be a number greater than or equal to 0.`));
    });
    if (!Array.isArray(esc.visitas) || !esc.visitas.length) err.push(L('Hace falta al menos una visita.', 'At least one visit is needed.'));
    else esc.visitas.forEach((v, k) => { if (k > 0 && !(v.t >= 0)) err.push(L(`Visita ${k + 1}: el tiempo desde la anterior debe ser mayor o igual que 0.`, `Visit ${k + 1}: the time since the previous one must be greater than or equal to 0.`)); });
    return err;
  }

  // Escenario aleatorio para practicar (azar inyectable para las pruebas)
  function aleatorio(rnd = Math.random) {
    const r = a => a[Math.floor(rnd() * a.length)];
    const imgs = ['logo.png', 'foto.jpg', 'banner.png', 'mapa.svg', 'estilo.css', 'app.js', 'portada.jpg', 'icono.png'];
    const n = r([2, 3, 3, 4]);
    const elegidas = [];
    while (elegidas.length < n) { const x = r(imgs); if (!elegidas.includes(x)) elegidas.push(x); }
    const pol = () => { const p = r(['max-age', 'max-age', 'max-age', 'no-cache', 'no-store', 'sin']); return { politica: p, maxAge: p === 'max-age' ? r([60, 300, 600, 3600, 86400]) : 0 }; };
    const objetos = [{ nombre: 'index.html', kb: r([2, 5, 10]), ...pol() }, ...elegidas.map(nm => ({ nombre: nm, kb: r([20, 50, 100, 200]), ...pol() }))];
    const t2 = r([30, 120, 600, 1800, 7200, 172800]);
    const mod = () => objetos.filter(() => rnd() < 0.35).map(o => o.nombre);
    const visitas = [{ t: 0, modificados: [] }, { t: t2, modificados: mod() }];
    if (rnd() < 0.5) visitas.push({ t: r([10, 300, 3600, 86400]), modificados: mod() });
    return { objetos, visitas };
  }

  return { simular, validar, aleatorio, POLITICAS };
})();
if (typeof module !== 'undefined') module.exports = MotorCache;
