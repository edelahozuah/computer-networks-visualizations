// Escenas y narración. Lienzo de 1600 × 900: cabecera hasta y = 90, pie desde y = 812.
// Cada paso: acto, titulo, msg (pie, admite **negrita**), escena() → elementos, vuelos (opcional),
// notas (párrafos de narración), pregunta (al aula, opcional), ojo (precisiones, opcional).

const ACTOS = {
  I: 'Las IP atan',
  II: 'Los nombres',
  III: 'Lo que ve tu equipo',
  IV: 'Detrás del telón',
  V: 'Recursiva e iterativa',
  VI: 'Así se dibuja',
};

function marco(p, i, n) {
  return [
    S('cab-acto', 60, 0, txt(`Acto ${p.acto} · ${ACTOS[p.acto]}`, { y: 36, size: 17, anchor: 'start', cls: 'acto', weight: 600 })),
    S('cab-tit', 60, 0, txt(p.titulo, { y: 74, size: 32, anchor: 'start', cls: 'tit', weight: 700 })),
    S('cab-n', 1540, 0, txt(`${i + 1} / ${n}`, { y: 36, size: 17, anchor: 'end', cls: 'ns' })),
    S('pie', 0, 0, `<foreignObject x="60" y="814" width="1480" height="80"><div xmlns="http://www.w3.org/1999/xhtml" class="pie">${pieHTML(p.msg)}</div></foreignObject>`),
  ];
}

const tenue = (els, op = 0.18) => els.map(e => ({ ...e, op }));

// ───────────── Actos I y II: el mapa de red ─────────────

const SRV = { A: [420, 545], B: [1180, 545] };
const IP_SRV = { A: '203.0.113.10', B: '198.51.100.7' };
const REFS = [
  { id: 'ref1', x: 60, y: 110, t: 'Enlace en la web de un cliente', ip: 'http://203.0.113.10/', n: 'http://www.miempresa.es/' },
  { id: 'ref2', x: 60, y: 250, t: 'Cartel con código QR', ip: 'http://203.0.113.10/', n: 'http://www.miempresa.es/' },
  { id: 'ref3', x: 1190, y: 110, t: 'App móvil ya instalada', ip: 'servidor = 203.0.113.10', n: 'servidor = www.miempresa.es' },
  { id: 'ref4', x: 1190, y: 250, t: 'Configuración de un socio', ip: 'api = 203.0.113.10', n: 'api = www.miempresa.es' },
];

function mapaRed(o = {}) {
  const srv = o.srv || 'A', r = [];
  if (o.refs) {
    let html = '';
    for (const f of REFS) {
      const izq = f.x < 800, x1 = izq ? f.x + 350 : f.x, y1 = f.y + 38;
      let x2, y2, cls;
      if (o.refs === 'nombre') { x2 = izq ? 670 : 930; y2 = 455; cls = 'nombre'; }
      else { x2 = izq ? 305 : 535; y2 = 545; cls = o.refs === 'rota' ? 'mal' : 'ip'; }
      html += flecha(x1, y1, x2, y2, cls, { dash: true, fino: true, fin: 4 });
    }
    r.push(S('ref-enlaces-' + o.refs, 0, 0, html));
  }
  r.push(S('nube', 0, 0, `<ellipse cx="800" cy="215" rx="300" ry="100" class="nube"/>` + txt('Internet', { x: 800, y: 150, size: 20, cls: 'ns' })));
  r.push(S('enlaces-red', 0, 0, linea(650, 285, 950, 285, 'enlace') + linea(650, 285, 470, 400, 'enlace') + linea(950, 285, 1130, 400, 'enlace')));
  r.push(S('r1', 650, 285, `<circle r="22" class="router"/>` + txt('R', { y: 7, size: 18, weight: 600 })));
  r.push(S('r2', 950, 285, `<circle r="22" class="router"/>` + txt('R', { y: 7, size: 18, weight: 600 })));
  for (const [id, x, nombre, pref] of [['ispA', 110, 'ISP A', '203.0.113.x'], ['ispB', 950, 'ISP B', '198.51.100.x']]) {
    r.push(S(id, 0, 0, `<rect x="${x}" y="400" width="540" height="340" rx="14" class="isp"/>` +
      txt(nombre, { x: x + 20, y: 432, anchor: 'start', size: 22, weight: 700, cls: 'c-ip' }) +
      txt(pref, { x: x + 20, y: 460, anchor: 'start', size: 19, cls: 'mono c-ip' })));
  }
  for (const [id, x, ip] of [['hA1', 220, '203.0.113.25'], ['hA2', 500, '203.0.113.40'], ['hB1', 1060, '198.51.100.40'], ['hB2', 1340, '198.51.100.41']]) {
    r.push(S(id, x, 670, nodo('Equipo', ip, { w: 180, h: 62, size: 18 })));
  }
  if (o.refs === 'rota') r.push(S('fantasma', ...SRV.A, caja(230, 70, { cls: 'fantasma' }) + txt('aquí ya no hay nadie', { y: 7, size: 18, cls: 'c-mal' })));
  r.push(S('srv', ...SRV[srv], nodo('App de MiEmpresa', IP_SRV[srv], { w: 230, cls: 'srv' })));
  if (o.zoom) {
    r.push(S('zoom-linea', 0, 0, linea(650, 560, 537, 548, 'guia')));
    r.push(S('zoom', 800, 560, caja(280, 160, { cls: 'tarjeta destacada', rx: 10 }) +
      `<text y="-12" font-size="36" text-anchor="middle" class="mono"><tspan class="c-ip" font-weight="600">203.0.113</tspan><tspan>.10</tspan></text>` +
      txt('203.0.113 → la red', { y: 26, size: 17, cls: 'c-ip' }) +
      txt('(la asigna el ISP)', { y: 47, size: 16, cls: 'c-ip' }) +
      txt('.10 → el equipo', { y: 70, size: 17, cls: 'ns' })));
  }
  if (o.tabla) {
    r.push(S('tabla', 800, 0, txt('Lo que sabe un router:', { y: 192, size: 17, cls: 'ns' }) +
      txt('203.0.113.x  → ISP A', { y: 224, size: 20, cls: 'mono c-ip' }) +
      txt('198.51.100.x → ISP B', { y: 252, size: 20, cls: 'mono c-ip' })));
  }
  if (o.refs) {
    for (const f of REFS) {
      const val = o.refs === 'nombre' ? f.n : f.ip;
      const cls = { ip: 'ip', rota: 'rota', nombre: 'nombre' }[o.refs];
      r.push(S(f.id, f.x, f.y, tarjeta([
        { t: (o.refs === 'rota' ? '✗ ' : '') + f.t, size: 19, weight: 600, cls: o.refs === 'rota' ? 'c-mal' : '' },
        { t: val, mono: true, size: 18, cls: 'c-' + (cls === 'rota' ? 'mal' : cls) },
      ], { w: 350, cls })));
    }
  }
  if (o.nombre) {
    r.push(S('nombre', 800, 455, nodo('www.miempresa.es', 'lo administra MiEmpresa', { w: 260, cls: 'nombre', subMono: false, size: 21 })));
    r.push(S('fn-' + srv, 0, 0, srv === 'A' ? flecha(700, 490, 540, 532, 'nombre', { fin: 2 }) : flecha(900, 490, 1060, 532, 'nombre', { fin: 2 })));
    r.push(S('rr', 800, 528, txt(`www  A  ${IP_SRV[srv]}`, { size: 17, cls: 'mono c-nombre' }), { d: o.dRR || 0 }));
  }
  if (o.ttl) {
    r.push(S('ttl', 650, 585, tarjeta(['Mudanza = cambiar 1 registro.', 'Las cachés lo ven cuando', 'caduca el TTL (p. ej. 300 s).'], { w: 300, size: 18, cls: 'nombre' }), { d: 700 }));
  }
  return r;
}

// ───────────── Acto II: HOSTS.TXT y los árboles ─────────────

function hosts(n, r0) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + 2 * Math.PI * k / n, x = 800 + 300 * Math.cos(a), y = 450 + 250 * Math.sin(a);
    out.push(S('host-' + k, 0, 0,
      flecha(800 + 120 * Math.cos(a), 450 + 140 * Math.sin(a), x, y, 'neutro', { fino: true, fin: r0 + 4 }) +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r0}" class="host"/>`, { d: k < 10 ? 0 : 40 * (k - 10) }));
  }
  return out;
}

function hostsTxt(grande) {
  const filas = ['HOST : 10.0.0.73 : SRI-NIC', 'HOST : 10.3.0.11 : MIT-AI', 'HOST : 10.1.0.13 : UCLA', 'HOST : 10.2.0.52 : …'];
  let s = `<rect x="-115" y="-135" width="230" height="270" rx="6" class="fichero"/>` +
    txt('HOSTS.TXT', { y: -100, size: 24, weight: 700, cls: 'mono' }) + txt('en el NIC del SRI', { y: -74, size: 16, cls: 'ns' });
  filas.forEach((f, i) => { s += txt(f, { y: -38 + i * 24, size: 11, cls: 'mono ns' }); });
  if (grande) s += txt('… miles de líneas', { y: 80, size: 17, cls: 'c-mal', weight: 600 });
  return [S('hosts-txt', 800, 450, s), ...hosts(grande ? 26 : 10, grande ? 10 : 15)];
}

const ARBOL = [
  { id: 'raiz', x: 800, y: 140, t: '.', p: null },
  { id: 'es', x: 420, y: 240, t: 'es', p: 'raiz' },
  { id: 'com', x: 800, y: 240, t: 'com', p: 'raiz' },
  { id: 'org', x: 1180, y: 240, t: 'org', p: 'raiz' },
  { id: 'uah', x: 200, y: 340, t: 'uah.es', p: 'es' },
  { id: 'rediris', x: 440, y: 340, t: 'rediris.es', p: 'es' },
  { id: 'miempresa', x: 650, y: 340, t: 'miempresa.es', p: 'es' },
  { id: 'ejemplo', x: 880, y: 340, t: 'ejemplo.com', p: 'com' },
  { id: 'wikipedia', x: 1180, y: 340, t: 'wikipedia.org', p: 'org' },
  { id: 'www-uah', x: 140, y: 435, t: 'www', p: 'uah' },
  { id: 'aut-uah', x: 260, y: 435, t: 'aut', p: 'uah' },
  { id: 'www-rediris', x: 440, y: 435, t: 'www', p: 'rediris' },
  { id: 'www-mi', x: 590, y: 435, t: 'www', p: 'miempresa' },
  { id: 'correo-mi', x: 710, y: 435, t: 'correo', p: 'miempresa' },
  { id: 'www-ej', x: 880, y: 435, t: 'www', p: 'ejemplo' },
  { id: 'www-wiki', x: 1180, y: 435, t: 'www', p: 'wikipedia' },
];
const ZONAS = [
  { id: 'z-raiz', x: 745, y: 112, w: 110, h: 56, t: 'IANA', lado: true },
  { id: 'z-es', x: 375, y: 212, w: 90, h: 56, t: 'Red.es', lado: true },
  { id: 'z-com', x: 745, y: 212, w: 110, h: 56, t: 'Verisign', lado: true },
  { id: 'z-org', x: 1125, y: 212, w: 110, h: 56, t: 'PIR', lado: true },
  { id: 'z-uah', x: 80, y: 312, w: 240, h: 175, t: 'UAH' },
  { id: 'z-rediris', x: 355, y: 312, w: 170, h: 175, t: 'RedIRIS' },
  { id: 'z-mi', x: 545, y: 312, w: 215, h: 175, t: 'MiEmpresa' },
  { id: 'z-ej', x: 790, y: 312, w: 180, h: 175, t: 'otra empresa' },
  { id: 'z-wiki', x: 1080, y: 312, w: 200, h: 175, t: 'Wikimedia' },
];
const posA = id => ARBOL.find(n => n.id === id);

function arbol(o = {}) {
  const r = [];
  if (o.zonas) {
    for (const z of ZONAS) {
      r.push(S(z.id, 0, 0, `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="12" class="zona"/>` +
        (z.lado ? txt(z.t, { x: z.x + z.w + 8, y: z.y + 34, size: 15, anchor: 'start', cls: 'c-nombre', weight: 600 })
          : txt(z.t, { x: z.x + z.w / 2, y: z.y + z.h - 10, size: 15, cls: 'c-nombre', weight: 600 }))));
    }
  }
  let ramas = '';
  for (const n of ARBOL) if (n.p) { const p = posA(n.p); ramas += linea(p.x, p.y + 22, n.x, n.y - 22, 'rama'); }
  r.push(S('ramas', 0, 0, ramas));
  if (o.camino) {
    const c = ['raiz', 'es', 'rediris', 'www-rediris'].map(posA);
    let s = '';
    for (let k = 1; k < c.length; k++) s += linea(c[k - 1].x, c[k - 1].y + 22, c[k].x, c[k].y - 22, 'camino');
    r.push(S('camino', 0, 0, s));
  }
  for (const n of ARBOL) {
    const w = n.t === '.' ? 56 : anchoTexto(n.t, 20, true) + 30;
    r.push(S('a-' + n.id, n.x, n.y, caja(w, 44, { cls: 'nodo nombre', rx: 22 }) + txt(n.t, { y: n.t === '.' ? 12 : 7, size: n.t === '.' ? 34 : 20, cls: 'mono nt', weight: 600 })));
  }
  return r;
}

const RED = [
  { id: 'n-int', x: 800, y: 530, t: 'Internet', p: null },
  { id: 'n-ispa', x: 380, y: 625, t: 'ISP A', sub: '203.0.113.x', p: 'n-int' },
  { id: 'n-ispb', x: 800, y: 625, t: 'ISP B', sub: '198.51.100.x', p: 'n-int' },
  { id: 'n-red', x: 1220, y: 625, t: 'RedIRIS', sub: '130.206.x.x', p: 'n-int' },
  { id: 'n-h1', x: 280, y: 745, t: '203.0.113.80', p: 'n-ispa', hoja: 'www-ej' },
  { id: 'n-h2', x: 480, y: 745, t: '203.0.113.25', p: 'n-ispa', hoja: 'correo-mi' },
  { id: 'n-h3', x: 800, y: 745, t: '198.51.100.7', p: 'n-ispb', hoja: 'www-mi' },
  { id: 'n-h4', x: 1220, y: 745, t: '130.206.13.20', p: 'n-red', hoja: 'www-rediris' },
];

function arbolRed() {
  const r = [], pos = id => RED.find(n => n.id === id);
  let ramas = '', cruces = '';
  for (const n of RED) {
    if (n.p) { const p = pos(n.p); ramas += linea(p.x, p.y + (p.sub ? 35 : 22), n.x, n.y - (n.sub ? 35 : 22), 'rama-ip'); }
    if (n.hoja) { const h = posA(n.hoja); cruces += flecha(h.x, h.y + 22, n.x, n.y - 22, 'nombre', { dash: true, fino: true, fin: 3 }); }
  }
  r.push(S('red-ramas', 0, 0, ramas));
  for (const n of RED) {
    r.push(S(n.id, n.x, n.y, n.sub ? nodo(n.t, n.sub, { w: 220, cls: 'ip' })
      : caja(anchoTexto(n.t, 18, !!n.hoja) + 30, 44, { cls: 'nodo ip' }) + txt(n.t, { y: 6, size: 18, cls: (n.hoja ? 'mono ' : '') + 'nt', weight: 600 }), { d: 300 }));
  }
  r.push(S('cruces', 0, 0, cruces, { d: 900 }));
  r.push(S('et-nombres', 60, 0, txt('Árbol de nombres', { y: 150, size: 20, anchor: 'start', cls: 'c-nombre', weight: 700 }) +
    txt('quién lo administra', { y: 176, size: 17, anchor: 'start', cls: 'c-nombre' })));
  r.push(S('et-red', 60, 0, txt('Árbol de direcciones', { y: 560, size: 20, anchor: 'start', cls: 'c-ip', weight: 700 }) +
    txt('dónde está', { y: 586, size: 17, anchor: 'start', cls: 'c-ip' }), { d: 300 }));
  return r;
}

// ───────────── Acto III: el sistema final ─────────────

function equipo(o = {}) {
  const r = [
    S('pc-marco', 0, 0, `<rect x="100" y="110" width="540" height="650" rx="16" class="equipo"/>` +
      txt('Tu equipo · pc.aut.uah.es · 10.0.0.5', { x: 370, y: 146, size: 19, weight: 600 })),
    S('capa-app', 370, 230, nodo('Navegador', 'quiere abrir www.rediris.es', { w: 440, subMono: false })),
    S('capa-f1', 0, 0, flecha(370, 265, 370, 333, 'neutro', { fin: 2 })),
    S('capa-gai', 370, 370, nodo('getaddrinfo("www.rediris.es")', '', { w: 440, mono: true, size: 20 })),
    S('capa-f2', 0, 0, flecha(370, 394, 370, 472, 'neutro', { fin: 2 })),
    S('capa-stub', 370, 510, nodo('Resolutor del SO (stub)', 'mira su caché y /etc/hosts', { w: 440, subMono: false })),
    S('capa-dhcp', 370, 0, txt('La IP del resolutor local la dio DHCP:', { y: 596, size: 17, cls: 'ns' }) +
      txt('el de la UAH, tu operador, el router de casa o uno público', { y: 620, size: 15, cls: 'ns' })),
    S('caja-local', 1180, 450, caja(380, 180, { cls: 'cajanegra', rx: 12 }) + txt('Resolutor local', { y: -22, size: 28, weight: 700, cls: 'nt' }) +
      txt('10.0.0.1', { y: 14, size: 20, cls: 'mono ns' }) + txt('¿qué hace por dentro?', { y: 56, size: 18, cls: 'ns' })),
    S('p3', 0, 0, flecha(590, 490, 990, 490, 'rec', { fin: 2 }) + txt('A? www.rediris.es', { x: 790, y: 478, size: 18, cls: 'mono halo' }), { d: o.dP || 0 }),
  ];
  if (o.respuesta) r.push(S('r3', 0, 0, flecha(990, 530, 590, 530, 'rec', { fin: 2 }) + txt('A www.rediris.es = 130.206.13.20', { x: 790, y: 558, size: 18, cls: 'mono c-bien halo' }), { d: 900 }));
  r.push(S('reloj3-' + (o.respuesta ? 'ok' : 'espera'), 370, 0, o.respuesta ? txt('✓ respuesta recibida', { y: 700, size: 20, cls: 'c-bien', weight: 600 })
    : txt('⏳ esperando la respuesta…', { y: 700, size: 20, cls: 'c-rec', weight: 600 }), { d: o.respuesta ? 900 : 0 }));
  if (o.respuesta) {
    r.push(S('resumen3', 720, 610, tarjeta([
      { t: 'Lo que ve tu equipo:', weight: 600 },
      '• una pregunta y una respuesta, al resolutor local',
      '• ni raíz, ni TLD, ni autoritativo: no sabe que existen',
      '• mientras tanto, espera',
    ], { w: 700, size: 20 }), { d: 1100 }));
  }
  return r;
}

// ───────────── Actos IV y V: mapa + diagrama de secuencia ─────────────

const M = { C: [130, 470], L: [400, 470], R: [140, 200], T: [400, 140], A: [650, 200], C2: [130, 650] };
const LV = { C: 880, L: 1050, R: 1210, T: 1360, A: 1510 };
const LV_TIT = { C: 'Cliente', L: 'Resolutor local', R: 'Raíz', T: 'TLD .es', A: 'Autoritativo' };
const MSG = [
  { n: 1, de: 'C', a: 'L', q: 'A? www.rediris.es (RD=1)', tipo: 'rec', clase: 'preg' },
  { n: 2, de: 'L', a: 'R', q: 'A? www.rediris.es', tipo: 'ite', clase: 'preg' },
  { n: 3, de: 'R', a: 'L', q: 'NS es → a.nic.es', tipo: 'ite', clase: 'ref' },
  { n: 4, de: 'L', a: 'T', q: 'A? www.rediris.es', tipo: 'ite', clase: 'preg' },
  { n: 5, de: 'T', a: 'L', q: 'NS rediris.es → sun.rediris.es', tipo: 'ite', clase: 'ref' },
  { n: 6, de: 'L', a: 'A', q: 'A? www.rediris.es', tipo: 'ite', clase: 'preg' },
  { n: 7, de: 'A', a: 'L', q: 'A www.rediris.es = 130.206.13.20 (AA=1)', tipo: 'ite', clase: 'resp' },
  { n: 8, de: 'L', a: 'C', q: 'A www.rediris.es = 130.206.13.20', tipo: 'rec', clase: 'resp' },
];
const yMsg = n => 200 + (n - 1) * 70;

function vidas(o = {}) {
  return Object.keys(LV).map(k => S('lv-' + k, LV[k], 0,
    linea(0, 150, 0, 790, 'vida') + caja(146, 40, { cls: 'nodo cab-vida' }).replace(`y="-20"`, `y="105"`) +
    txt(LV_TIT[k], { y: 131, size: 16, weight: 600, cls: 'nt' }), { op: o.tenues && o.tenues.includes(k) ? 0.3 : 1 }));
}

function msgSpec(id, m, y, d) {
  const x1 = LV[m.de], x2 = LV[m.a];
  return S(id, 0, 0, flecha(x1, y, x2, y, m.tipo, { fin: 2 }) +
    txt(`${m.n} · ${m.q}`, { x: (x1 + x2) / 2, y: y - 10, size: 16, cls: 'halo c-' + m.clase, weight: 500 }), { d });
}

function secuencia(hasta, ret = {}) {
  return [...vidas(), ...MSG.filter(m => m.n <= hasta).map(m => msgSpec('m-' + m.n, m, yMsg(m.n), ret[m.n] || 0))];
}

function mapaRes(o = {}) {
  const r = [];
  let enl = linea(...M.C, ...M.L, 'enlace rec-suave');
  for (const k of ['R', 'T', 'A']) enl += linea(...M.L, ...M[k], 'enlace ite-suave');
  if (o.pc2) enl += linea(...M.C2, ...M.L, 'enlace rec-suave');
  r.push(S('mapa-enlaces', 0, 0, enl));
  if (o.detalle) r.push(S('detalle-' + o.detalle.clave, 30, 285, tarjeta(o.detalle.lineas, { w: 750, size: 19, cls: o.detalle.cls }), { d: o.detalle.d || 0 }));
  r.push(S('mn-C', ...M.C, nodo('Tu equipo', '10.0.0.5', { w: 200 })));
  r.push(S('mn-L', ...M.L, nodo('Resolutor local', '10.0.0.1', { w: 210, cls: 'local' })));
  r.push(S('mn-R', ...M.R, nodo('Raíz', '198.41.0.4', { w: 210 })));
  r.push(S('mn-T', ...M.T, nodo('TLD .es', '194.69.254.1', { w: 210 })));
  r.push(S('mn-A', ...M.A, nodo('Autoritativo rediris.es', '130.206.1.2', { w: 270, size: 19 })));
  if (o.pc2) r.push(S('mn-C2', ...M.C2, nodo('Otro equipo', '10.0.0.9', { w: 200 })));
  if (o.reloj) r.push(S('reloj-' + o.reloj, 130, 0, o.reloj === 'ok' ? txt('✓ respuesta', { y: 528, size: 17, cls: 'c-bien', weight: 600 })
    : txt('⏳ esperando…', { y: 528, size: 17, cls: 'c-rec', weight: 600 }), { d: o.dReloj || 0 }));
  if (o.acierto) r.push(S('acierto', 400, 0, txt(o.acierto, { y: 420, size: 17, cls: 'c-bien halo', weight: 600 }), { d: o.dAcierto || 0 }));
  // Caché del resolutor local: fondo fijo + una línea por entrada, para que cada una aparezca a su tiempo
  r.push(S('cache', 270, 560, `<rect width="490" height="200" rx="8" class="tarjeta"/>` +
    txt('Caché del resolutor local', { x: 14, y: 28, size: 17, anchor: 'start', weight: 600 }) +
    txt('pistas raíz: a.root-servers.net 198.41.0.4', { x: 14, y: 56, size: 15, anchor: 'start', cls: 'mono ns' })));
  const ent = ['es. NS a.nic.es · a.nic.es A 194.69.254.1', 'rediris.es NS sun.rediris.es · A 130.206.1.2', 'www.rediris.es A 130.206.13.20'];
  (o.cache || []).forEach((d, k) => { if (d !== null) r.push(S('ce' + k, 284, 650 + k * 30, txt(ent[k], { anchor: 'start', size: 15, cls: 'mono c-cache' }), { d })); });
  if (o.etiquetas) {
    r.push(S('et-mapa', 0, 0, txt('recursiva', { x: 262, y: 530, size: 16, cls: 'c-rec halo', weight: 700 }) +
      txt('iterativas', { x: 470, y: 415, size: 16, cls: 'c-ite halo', weight: 700, anchor: 'start' })));
  }
  return r;
}

const det = (clave, lineas, cls, d) => ({ clave, lineas, cls, d });

function bandas() {
  return [
    S('banda-rec', 0, 0, `<rect x="845" y="${yMsg(1) - 32}" width="240" height="46" rx="8" class="banda rec"/>` +
      `<rect x="845" y="${yMsg(8) - 32}" width="240" height="46" rx="8" class="banda rec"/>` +
      txt('recursiva', { x: 965, y: yMsg(1) + 28, size: 16, cls: 'c-rec halo', weight: 700 }) +
      txt('recursiva', { x: 965, y: yMsg(8) + 28, size: 16, cls: 'c-rec halo', weight: 700 })),
    S('banda-ite', 0, 0, `<rect x="1020" y="${yMsg(2) - 32}" width="560" height="${yMsg(7) - yMsg(2) + 46}" rx="8" class="banda ite"/>` +
      txt('iterativas', { x: 1572, y: yMsg(2) - 40, size: 16, cls: 'c-ite halo', weight: 700, anchor: 'end' })),
  ];
}

// Mapa sin flechas propias en el contrafactual: cinco nodos en fila
const FILA = { C: 170, L: 490, R: 810, T: 1130, A: 1450 };
const FILA_SUB = { C: '10.0.0.5', L: '10.0.0.1', R: '198.41.0.4', T: '194.69.254.1', A: '130.206.1.2' };
const FILA_TIT = { C: 'Tu equipo', L: 'Resolutor local', R: 'Raíz', T: 'TLD .es', A: 'Autoritativo' };

// ───────────── Los pasos ─────────────

const PASOS = [
  // ── Acto I ──
  {
    acto: 'I', titulo: 'Cada equipo tiene una dirección IP',
    msg: 'La IP tiene dos partes: **la red** (te la asigna el ISP) y **el equipo**. Los routers solo conocen redes: la IP dice **dónde** estás.',
    escena: () => mapaRed({ zoom: true, tabla: true }),
    notas: [
      'Todo equipo conectado a Internet (en rigor, cada interfaz) tiene una dirección IP. Pero la IP no es un número de serie cualquiera: tiene estructura.',
      'La primera parte identifica la red. Esa parte no la elegís: os la asigna quien os da conectividad, vuestro proveedor (ISP). La última identifica al equipo dentro de esa red.',
      'Y los routers de Internet no tienen una línea por cada equipo del mundo, sino una por red: «todo lo que empiece por 203.0.113 va hacia el ISP A». Como una dirección postal: el cartero sabe hacia dónde están las calles, no cada portal. Sirve para llegar porque dice dónde estás, y por eso mismo está atada al sitio.',
    ],
    pregunta: '¿Quién ha elegido la IP que tiene ahora mismo vuestro portátil? (Nadie de vosotros: os la ha dado la red, por DHCP, de su bloque.)',
    ojo: 'Prefijos, máscaras y tablas de rutas son del tema de red: aquí solo la idea de «calle y número». No abrir NAT ni direcciones privadas. Las IP del dibujo son de documentación (RFC 5737).',
  },
  {
    acto: 'I', titulo: 'MiEmpresa publica su aplicación',
    msg: 'La IP acaba **apuntada en sitios que no controlas**.',
    escena: () => mapaRed({ refs: 'ip' }),
    notas: [
      'MiEmpresa monta su aplicación en un servidor del ISP A, con la IP 203.0.113.10, y la da a conocer: un enlace en la web de un cliente, un cartel con un QR, una app que ya está instalada en miles de móviles, la configuración de un socio.',
      'Fijaos en un detalle: ninguno de esos sitios es de MiEmpresa.',
    ],
  },
  {
    acto: 'I', titulo: 'MiEmpresa se muda',
    msg: 'Al mudarte **cambia la IP**, y todo lo que la tenía apuntada **se rompe**.',
    escena: () => mapaRed({ refs: 'rota', srv: 'B' }),
    notas: [
      'MiEmpresa cambia de proveedor, o se lleva la aplicación a la nube. En la red nueva, la IP tiene que ser de la red nueva: 198.51.100.7. No es una decisión: si se quedase con la vieja, los routers seguirían llevando los paquetes al ISP A.',
      'Y todo lo publicado apunta a un sitio donde ya no hay nadie.',
    ],
    pregunta: '¿Cuántos de esos cuatro sitios puede arreglar MiEmpresa por sí misma?',
  },
  {
    acto: 'I', titulo: 'El problema',
    msg: 'Necesitamos un identificador que **no dependa del sitio**… y que **administremos nosotros**.',
    escena: () => [...tenue(mapaRed({ refs: 'rota', srv: 'B' })),
      S('lema1', 800, 450, caja(980, 190, { cls: 'tarjeta destacada', rx: 14 }) +
        txt('La IP dice dónde estás,', { y: -18, size: 44, weight: 700, cls: 'nt' }) +
        txt('no quién eres.', { y: 40, size: 44, weight: 700, cls: 'c-ip' }))],
    notas: [
      'Resumen del acto: la IP es una dirección, no un DNI. Sirve para llegar, pero te ata a la red en la que estás, y muchas veces ni siquiera la eliges.',
      'Lo que nos falta es un identificador que siga valiendo aunque te mudes, y que sea tuyo: que lo cambies tú sin pedir permiso a nadie.',
    ],
  },
  // ── Acto II ──
  {
    acto: 'II', titulo: 'Un nombre entre medias',
    msg: 'Se publica **un nombre**, y el nombre apunta a la IP. **El nombre lo administras tú.**',
    escena: () => mapaRed({ refs: 'nombre', nombre: true }),
    notas: [
      'La solución clásica en informática: un nivel de indirección. Lo que se publica ya no es la IP, es www.miempresa.es. Y el nombre apunta a la IP.',
      'La clave es de quién es cada cosa: la IP es del ISP; el nombre es de MiEmpresa, que lo administra.',
    ],
  },
  {
    acto: 'II', titulo: 'La misma mudanza, con nombres',
    msg: 'Mudarse = **cambiar un registro**. Lo publicado sigue funcionando (en cuanto caduca el **TTL**).',
    escena: () => mapaRed({ refs: 'nombre', nombre: true, srv: 'B', ttl: true }),
    notas: [
      'Repetimos la mudanza. Ahora solo cambia la flecha: un registro en la tabla de MiEmpresa. Todo lo publicado sigue en verde.',
      'Un matiz que volverá: quien haya preguntado hace poco tiene la respuesta guardada y, hasta que caduque (el TTL), seguirá yendo a la IP vieja. Por eso, antes de una mudanza, se baja el TTL y se deja el servidor viejo encendido un rato.',
    ],
  },
  {
    acto: 'II', titulo: '¿Dónde vive la tabla?',
    msg: 'Primera solución: **una tabla central** (HOSTS.TXT) que todos descargan. Con miles de equipos, **no escala**.',
    escena: () => [
      ...hostsTxt(true),
      S('hist', 60, 140, tarjeta([{ t: 'ARPANET, hasta 1983', weight: 600 }, 'Un único fichero con todos', 'los equipos. Lo mantenía', 'a mano el NIC del SRI.', { t: 'Hoy: /etc/hosts', mono: true, cls: 'ns' }], { w: 330, size: 19 })),
      S('problemas', 1150, 140, tarjeta([
        { t: 'Problemas', weight: 700, cls: 'c-mal' },
        '• Todos descargan el fichero',
        '  entero, cada poco',
        '• Cada cambio pasa por el NIC',
        '• Nombres únicos en todo el',
        '  mundo: choques',
        '• Un único administrador',
      ], { w: 390, size: 19, cls: 'rota' }), { d: 900 }),
      S('solucion', 1150, 560, tarjeta([{ t: '1983: Mockapetris propone', weight: 600 }, 'el DNS (RFC 882/883)'], { w: 390, size: 19, cls: 'nombre' }), { d: 1500 }),
    ],
    notas: [
      '¿Dónde vive esa tabla? La primera solución fue la obvia: un fichero. En ARPANET había un único HOSTS.TXT con todos los equipos. Lo mantenía a mano el NIC del SRI: los cambios se le mandaban por correo y todo el mundo se descargaba el fichero cada cierto tiempo. Vuestro /etc/hosts es su descendiente directo.',
      'Funcionaba con cientos de equipos. Con miles, no: el fichero crece, cada cambio tiene que pasar por una sola oficina, todo el mundo se descarga el fichero entero aunque solo haya cambiado una línea, y los nombres tienen que ser únicos en todo el mundo, así que chocan.',
      'En 1983 Paul Mockapetris propone el DNS (RFC 882 y 883; los vigentes son los RFC 1034 y 1035, de 1987).',
    ],
  },
  {
    acto: 'II', titulo: 'Trocear la tabla siguiendo el nombre',
    msg: 'Los nombres forman **un árbol**. Cada organización **administra su trozo (zona)** y lo reparte hacia abajo.',
    escena: () => arbol({ zonas: true }),
    notas: [
      'La idea: trocear la tabla usando el propio nombre. Los nombres forman un árbol que se lee de derecha a izquierda: la raíz, los dominios de primer nivel (es, com, org) y, debajo, los de cada organización.',
      'Cada trozo (una zona) lo administra su dueño: la UAH los nombres de uah.es, RedIRIS los de rediris.es. Dentro de su zona, cada uno crea lo que quiera sin pedir permiso a nadie. Y el de arriba solo tiene que saber a quién ha delegado cada rama.',
    ],
    ojo: 'Zona y dominio no son lo mismo (una organización puede delegar un subdominio en otra), pero aquí basta con «su trozo».',
  },
  {
    acto: 'II', titulo: 'Dos árboles que no coinciden',
    msg: '**Dos árboles que no coinciden:** el de nombres dice **quién administra**; el de direcciones, **dónde está**.',
    escena: () => [...arbol({ zonas: true }), ...arbolRed()],
    notas: [
      'Este es el dibujo clave. Arriba, el árbol de nombres: refleja quién administra. Abajo, el árbol de direcciones: refleja dónde está cada equipo en la red.',
      'Las flechas se cruzan: los dos nombres de miempresa.es están en proveedores distintos; ejemplo.com, que es otra organización, está en el ISP A. Estar juntos en el árbol de nombres no dice nada de dónde estás en la red. Por eso los nombres te liberan… y por eso resolver un nombre obliga a ir saltando por la red.',
    ],
    pregunta: '¿Podría www.uah.es estar alojado en un servidor de otro país? (Sí; el nombre seguiría siendo de la UAH.)',
  },
  {
    acto: 'II', titulo: 'Arriba solo saben a quién preguntar',
    msg: 'Arriba solo saben **a quién preguntar**; el dato está abajo. Una base de datos **distribuida, jerárquica y delegada**.',
    escena: () => [
      ...arbol({ zonas: true, camino: true }),
      S('del-raiz', 960, 104, tarjeta([{ t: 'La raíz solo sabe:', size: 16, cls: 'ns' }, { t: 'NS es → a.nic.es', mono: true, cls: 'c-ref' }], { w: 300, size: 18, cls: 'ref' }), { d: 0 }),
      S('del-es', 40, 186, tarjeta([{ t: 'Red.es (zona es) solo sabe:', size: 16, cls: 'ns' }, { t: 'NS rediris.es → sun.rediris.es', mono: true, cls: 'c-ref' }], { w: 330, size: 16, cls: 'ref' }), { d: 500 }),
      S('del-red', 330, 510, tarjeta([{ t: 'RedIRIS (autoritativo) tiene el dato:', size: 16, cls: 'ns' }, { t: 'www.rediris.es A 130.206.13.20', mono: true, cls: 'c-bien' }], { w: 380, size: 18, cls: 'ok' }), { d: 1000 }),
    ],
    notas: [
      'Seguimos un camino: www.rediris.es. La raíz no sabe la IP: solo sabe quién lleva es. Los de es tampoco: solo saben quién lleva rediris.es. Y RedIRIS, el servidor autoritativo de su zona, tiene el dato.',
      'Eso es el DNS: una base de datos gigantesca hecha a trozos. Distribuida (cada trozo en sus servidores), jerárquica (sigue el árbol) y delegada (cada trozo lo mantiene su dueño).',
    ],
  },
  // ── Acto III ──
  {
    acto: 'III', titulo: 'Lo que hace tu equipo',
    msg: 'Para tu equipo, el DNS es **un encargo** al resolutor local… **y esperar**. Como dejar un trámite en una gestoría.',
    escena: () => equipo({ dP: 900 }),
    vuelos: [V([590, 490], [990, 490], 'A? www.rediris.es', 'rec')],
    notas: [
      'Ahora, desde el punto de vista de vuestro equipo. El navegador no habla DNS: llama a una función del sistema, getaddrinfo(). El resolutor del sistema operativo (el stub) mira primero su caché y /etc/hosts; si no está ahí, manda una pregunta al resolutor local, cuya IP le dio DHCP al conectarse.',
      'Una pregunta: «www.rediris.es, tipo A». Y se queda esperando.',
      'Pensad en una gestoría: le dejáis el encargo, «tráigame este certificado», y esperáis. Cómo lo consiga es cosa suya. Volveremos a ella.',
    ],
    ojo: 'Si alguien mira su configuración en casa verá 192.168.1.1 (el router, que reenvía al resolutor de su operador) o 8.8.8.8 / 1.1.1.1 (públicos): todos hacen el papel de resolutor local. Los navegadores con DoH activado se saltan el resolutor del sistema; para las demos, desactivado.',
  },
  {
    acto: 'III', titulo: 'Una pregunta, una respuesta',
    msg: 'Tu equipo **no sabe nada del árbol**: hace una pregunta y espera **la respuesta final**.',
    escena: () => equipo({ respuesta: true }),
    vuelos: [V([990, 530], [590, 530], 'A = 130.206.13.20', 'bien')],
    notas: [
      'Llega la respuesta: la IP. Para vuestro equipo, eso es todo el DNS: una pregunta, una respuesta. No sabe que existen la raíz, los TLD ni los autoritativos.',
      'Pero el resolutor local tampoco tenía el dato: no es de rediris.es. Entonces, ¿de dónde lo ha sacado?',
    ],
    pregunta: '¿Qué ha pasado dentro de la caja mientras esperabais?',
  },
  {
    acto: 'III', titulo: '¿Qué creéis que pasa dentro?',
    msg: '**Predecid antes de mirar.** Ahora lo comprobamos mensaje a mensaje.',
    escena: () => [...tenue(equipo({ respuesta: true }), 0.12),
      S('predice', 290, 190, tarjeta([
        { t: 'Antes de abrir la caja: ¿qué creéis?', weight: 700, size: 30 },
        '1. ¿Con quién habla tu equipo para resolver www.rediris.es?',
        '2. ¿Quién habla con la raíz? ¿Qué le contesta la raíz?',
        '3. Sin nada en caché, ¿cuántos mensajes hacen falta?',
        '4. La respuesta que recibe tu equipo, ¿la envía RedIRIS?',
      ], { w: 1020, size: 26, lh: 52, pad: 26, cls: 'destacada' }))],
    notas: [
      'Votación rápida (Wooclap o mano alzada) y no corregir todavía: el Acto IV lo hace solo. Lo importante es que cada uno se comprometa con una respuesta.',
      'Respuestas erróneas típicas: «mi equipo pregunta a la raíz»; «la raíz le pasa la pregunta al TLD, y este al autoritativo» (el modelo de la Fig. 2.22 de Kurose); «la respuesta me llega de RedIRIS».',
      'Las buenas, para tenerlas a mano: 1, solo con el resolutor local; 2, el resolutor local, y la raíz contesta con una referencia; 3, ocho; 4, no: la envía el resolutor local, en un mensaje nuevo.',
    ],
  },
  // ── Acto IV ──
  {
    acto: 'IV', titulo: 'Abrimos la caja',
    msg: 'El resolutor local empieza **sin nada en caché**: solo conoce las IP de **los servidores raíz**.',
    escena: () => [...mapaRes({ cache: [] }), ...secuencia(0)],
    notas: [
      'Abrimos la caja. A la izquierda, quién habla con quién en la red; a la derecha, el mismo intercambio como diagrama de secuencia: el tiempo corre hacia abajo.',
      'Supongamos que el resolutor local acaba de arrancar: caché vacía. Lo único que conoce de fábrica son las IP de los servidores raíz (las «pistas raíz», un fichero que viene con el software).',
    ],
    ojo: 'Hay 13 nombres de servidor raíz (a.root-servers.net … m.root-servers.net), pero más de mil máquinas repartidas por el mundo con anycast. «La raíz» no es un ordenador.',
  },
  {
    acto: 'IV', titulo: 'Mensaje 1: tu equipo pregunta',
    msg: '**1** · Tu equipo pregunta **al resolutor local** (y se queda esperando).',
    escena: () => [...mapaRes({ cache: [], reloj: 'espera', detalle: det(1, ['Mensaje 1 · de tu equipo al resolutor local', { t: 'Pregunta: www.rediris.es, tipo A (RD=1)', mono: true }], '', 900) }), ...secuencia(1, { 1: 900 })],
    vuelos: [V(M.C, M.L, 'A? www.rediris.es', 'rec')],
    notas: [
      'El mensaje 1 es el que ya conocéis: vuestro equipo pregunta al resolutor local. Lleva un bit, RD, que significa «hazlo tú por mí». Fijaos en el reloj: vuestro equipo no hace nada más hasta que le contesten.',
    ],
  },
  {
    acto: 'IV', titulo: 'Mensajes 2 y 3: la raíz',
    msg: '**2–3** · La raíz no sabe la respuesta: devuelve una **referencia**, «pregunta a los de .es».',
    escena: () => [...mapaRes({ cache: [1950], reloj: 'espera', detalle: det(2, [{ t: 'Mensaje 3 · referencia de la raíz', weight: 600, cls: 'c-ref' }, 'No sé www.rediris.es. Pregunta a los de es:', { t: 'es. NS a.nic.es  +  a.nic.es A 194.69.254.1', mono: true }], 'ref', 1950) }), ...secuencia(3, { 2: 900, 3: 1950 })],
    vuelos: [V(M.L, M.R, 'A? www.rediris.es', 'ite'), V(M.R, M.L, 'NS es → a.nic.es', 'ref', 1050)],
    notas: [
      'El resolutor local pregunta a un servidor raíz exactamente lo mismo: www.rediris.es, tipo A.',
      'La raíz no tiene el dato, y no va a buscarlo. Contesta con lo que sabe: «no lo sé, pero los de es son estos, y estas son sus IP». Eso es una referencia: una respuesta que no responde, que te manda a otro sitio. Es la gestoría en la primera ventanilla: «esto no es aquí, vaya a aquella». Y el resolutor local la guarda en caché.',
    ],
    ojo: 'Los resolutores modernos solo preguntan a la raíz por «es.» (minimización de QNAME, RFC 9156). En Kurose y en la web de ejercicios se usa el modelo clásico: el nombre completo.',
  },
  {
    acto: 'IV', titulo: 'Mensajes 4 y 5: el TLD .es',
    msg: '**4–5** · El TLD .es tampoco lo sabe: otra **referencia**, que trae también la IP del servidor (**pegamento**).',
    escena: () => [...mapaRes({ cache: [0, 1950], reloj: 'espera', detalle: det(3, [{ t: 'Mensaje 5 · referencia del TLD .es', weight: 600, cls: 'c-ref' }, 'Pregunta a los de rediris.es:', { t: 'rediris.es NS sun.rediris.es  +  A 130.206.1.2', mono: true }], 'ref', 1950) }), ...secuencia(5, { 4: 900, 5: 1950 })],
    vuelos: [V(M.L, M.T, 'A? www.rediris.es', 'ite'), V(M.T, M.L, 'NS rediris.es → sun…', 'ref', 1050)],
    notas: [
      'Mismo patrón con el servidor de es: misma pregunta, otra referencia, «pregúntale a sun.rediris.es».',
      'Fijaos en un problema: para preguntar a sun.rediris.es necesito su IP… y su nombre está dentro de rediris.es, que es justo lo que intento resolver. Huevo y gallina. Por eso la referencia trae también la IP del servidor de nombres: se llama pegamento (glue).',
    ],
    pregunta: '¿Qué pasaría si el TLD diese el nombre sun.rediris.es pero no su IP?',
  },
  {
    acto: 'IV', titulo: 'Mensajes 6 y 7: el autoritativo',
    msg: '**6–7** · El **autoritativo** de rediris.es sí lo sabe: respuesta con **AA=1**.',
    escena: () => [...mapaRes({ cache: [0, 0, 1950], reloj: 'espera', detalle: det(4, [{ t: 'Mensaje 7 · respuesta autoritativa (AA=1)', weight: 600, cls: 'c-bien' }, { t: 'www.rediris.es A 130.206.13.20', mono: true }], 'ok', 1950) }), ...secuencia(7, { 6: 900, 7: 1950 })],
    vuelos: [V(M.L, M.A, 'A? www.rediris.es', 'ite'), V(M.A, M.L, 'A = 130.206.13.20', 'bien', 1050)],
    notas: [
      'Tercera vez la misma pregunta, ahora al servidor autoritativo de rediris.es. Este sí tiene el dato, porque es el trozo de la base de datos que mantiene RedIRIS. Responde y marca AA=1: «respuesta con autoridad».',
    ],
  },
  {
    acto: 'IV', titulo: 'Mensaje 8: la respuesta a tu equipo',
    msg: '**8** · El resolutor local responde a tu equipo con **un mensaje nuevo** y **lo guarda todo en caché**.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], reloj: 'ok', dReloj: 900, detalle: det(5, [{ t: 'Mensaje 8 · del resolutor local a tu equipo (mensaje nuevo)', weight: 600, cls: 'c-bien' }, { t: 'www.rediris.es A 130.206.13.20  (AA=0, RA=1)', mono: true }], 'ok', 900) }), ...secuencia(8, { 8: 900 })],
    vuelos: [V(M.L, M.C, 'A = 130.206.13.20', 'bien')],
    notas: [
      'El resolutor local contesta a vuestro equipo. Ojo: es un mensaje nuevo, de 10.0.0.1 a 10.0.0.5, con el mismo identificador que la pregunta 1. No es «el mensaje 7 que sigue su camino».',
      'Lleva AA=0, porque el resolutor local no es autoridad para rediris.es: lo sabe de oídas. Y todo lo aprendido queda en su caché, cada dato con su TTL.',
      'Ocho mensajes. Vuestro equipo ha visto dos.',
    ],
  },
  {
    acto: 'IV', titulo: 'Otro equipo pregunta lo mismo',
    msg: 'Segunda vez: el resolutor local responde **desde su caché**. Dos mensajes en vez de ocho.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], pc2: true, acierto: '✓ en caché', dAcierto: 900 }),
      ...vidas({ tenues: ['R', 'T', 'A'] }),
      msgSpec('c1', { n: 1, de: 'C', a: 'L', q: 'A? www.rediris.es (RD=1)', tipo: 'rec', clase: 'preg' }, yMsg(1), 900),
      msgSpec('c2', { n: 2, de: 'L', a: 'C', q: 'A www.rediris.es = … (de la caché)', tipo: 'rec', clase: 'resp' }, yMsg(2), 1950)],
    vuelos: [V(M.C2, M.L, 'A? www.rediris.es', 'rec'), V(M.L, M.C2, 'A = 130.206.13.20', 'bien', 1050)],
    notas: [
      'Ahora otro equipo de la misma red pregunta lo mismo. El resolutor local lo tiene en caché y contesta directamente: dos mensajes.',
      'Esa es la gran ventaja de que haya un resolutor local compartido: lo que averigua para uno, lo aprovechan todos, mientras no caduque el TTL.',
    ],
  },
  {
    acto: 'IV', titulo: 'Otro nombre de la misma zona',
    msg: 'Otro nombre de rediris.es: ya sabe quién lo administra, así que **ni raíz ni TLD**.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], pc2: true }),
      ...vidas({ tenues: ['R', 'T'] }),
      msgSpec('p1', { n: 1, de: 'C', a: 'L', q: 'A? eventos.rediris.es', tipo: 'rec', clase: 'preg' }, yMsg(1), 900),
      msgSpec('p2', { n: 2, de: 'L', a: 'A', q: 'A? eventos.rediris.es', tipo: 'ite', clase: 'preg' }, yMsg(2), 1950),
      msgSpec('p3', { n: 3, de: 'A', a: 'L', q: 'A eventos.rediris.es = … (AA=1)', tipo: 'ite', clase: 'resp' }, yMsg(3), 3000),
      msgSpec('p4', { n: 4, de: 'L', a: 'C', q: 'A eventos.rediris.es = …', tipo: 'rec', clase: 'resp' }, yMsg(4), 4050)],
    vuelos: [V(M.C2, M.L, 'A? eventos.rediris.es', 'rec'), V(M.L, M.A, 'A? eventos.rediris.es', 'ite', 1050),
      V(M.A, M.L, 'A …', 'bien', 2100), V(M.L, M.C2, 'A …', 'bien', 3150)],
    notas: [
      'Y si preguntan por otro nombre de rediris.es, el resolutor local no lo tiene, pero sí tiene en caché quién es el autoritativo de rediris.es. Va directo: ni raíz ni TLD.',
      'Por eso, aunque todo cuelga de la raíz, los servidores raíz reciben muchas menos preguntas de las que uno imagina: las cachés hacen casi todo el trabajo.',
    ],
    ojo: 'eventos.rediris.es es un nombre ilustrativo; no importa si existe.',
  },
  // ── Acto V ──
  {
    acto: 'V', titulo: '¿Recursiva o iterativa?',
    msg: '**Recursiva / iterativa** se dice de **cada pareja pregunta‑respuesta**, no de la resolución entera.',
    escena: () => [...bandas(), ...mapaRes({ cache: [0, 0, 0], reloj: 'ok', etiquetas: true }), ...secuencia(8),
      S('kurose', 840, 738, tarjeta([{ t: 'Kurose: la Fig. 2.21 es esto; la 2.22 (todo recursivo) es lo que no pasa.', weight: 600 }], { w: 740, size: 18, pad: 12 }), { d: 600 })],
    notas: [
      'Ahora sí, los nombres. Lo que más lía es preguntar «¿esta resolución es recursiva o iterativa?». Es la pregunta equivocada: cada resolución tiene de las dos.',
      'La pareja 1–8, entre vuestro equipo y el resolutor local, es recursiva: «hazlo tú y tráeme el resultado». Las parejas 2–3, 4–5 y 6–7, entre el resolutor local y los demás, son iterativas: «dime lo que sepas». Los colores llevan así desde el principio.',
      'Y aquí está el origen de muchas dudas: en el libro hay dos figuras, la 2.21 y la 2.22, y parecen dos formas alternativas de resolver. No lo son: la 2.21 es lo que pasa; la 2.22 es lo que no pasa, y enseguida vemos por qué.',
    ],
  },
  {
    acto: 'V', titulo: 'Qué compromete cada una',
    msg: 'Recursiva: «**hazlo tú**». Iterativa: «**dime lo que sepas**».',
    escena: () => [...bandas(), ...secuencia(8),
      S('comp-rec', 40, 120, tarjeta([
        { t: 'Recursiva: «hazlo tú y tráeme el resultado»', weight: 700, cls: 'c-rec' },
        '• La pide el cliente: bit RD=1 (recursion desired)',
        '• El servidor dice si la ofrece: RA=1 en la respuesta',
        '• Tiene que devolver la respuesta final… o un error',
        '• Mientras tanto, guarda el estado y espera',
      ], { w: 750, size: 20, cls: 'rec' })),
      S('comp-ite', 40, 420, tarjeta([
        { t: 'Iterativa: «dime lo que sepas»', weight: 700, cls: 'c-ite' },
        '• Raíz, TLD y autoritativos solo atienden así (RA=0)',
        '• Si tiene autoridad sobre el nombre: la respuesta',
        '• Si no: una referencia, «pregunta a estos» (NS + IP)',
        '• Contesta y olvida: no guarda estado',
      ], { w: 750, size: 20, cls: 'ite' }), { d: 500 })],
    notas: [
      'Lo que cambia es el compromiso de quien contesta. En una consulta recursiva, el servidor se compromete a traer la respuesta final o un error; nunca te contesta «pregunta a otro». Lo pide el cliente con el bit RD y el servidor dice si lo concede con RA.',
      'En una iterativa, el servidor contesta con lo que sabe en ese momento: el dato, si es suyo, o una referencia. Y se olvida.',
    ],
    pregunta: '¿Quién decide que una consulta sea recursiva? (La pide el cliente con RD; el servidor la concede o no, RA.)',
  },
  {
    acto: 'V', titulo: '¿Y si todo fuese recursivo?',
    msg: '¿Todo recursivo? La raíz guardaría el estado de **millones** de consultas a la vez: **no escala**.',
    escena: () => {
      const r = [];
      for (const k of Object.keys(FILA)) r.push(S('f-' + k, FILA[k], 360, nodo(FILA_TIT[k], FILA_SUB[k], { w: 230, cls: k === 'L' ? 'local' : '' })));
      const ks = Object.keys(FILA);
      for (let i = 0; i < 4; i++) {
        r.push(S('fi-' + i, 0, 0, arco(FILA[ks[i]] + 40, 325, FILA[ks[i + 1]] - 40, 325, 70, 'rec') +
          txt(String(i + 1), { x: (FILA[ks[i]] + FILA[ks[i + 1]]) / 2, y: 272, size: 18, weight: 700, cls: 'c-rec' }), { d: 650 * (i + 1) }));
        r.push(S('fv-' + i, 0, 0, arco(FILA[ks[4 - i]] - 40, 395, FILA[ks[3 - i]] + 40, 395, -70, 'rec') +
          txt(String(i + 5), { x: (FILA[ks[4 - i]] + FILA[ks[3 - i]]) / 2, y: 462, size: 18, weight: 700, cls: 'c-rec' }), { d: 650 * (i + 5) }));
      }
      r.push(S('kurose22', 800, 0, txt('Fig. 2.22 de Kurose: así NO funciona hoy', { y: 150, size: 24, weight: 700, cls: 'c-mal' })));
      r.push(S('sobrecarga', 560, 560, tarjeta([
        { t: 'Cada eslabón espera al siguiente.', weight: 600 },
        'La raíz tendría que guardar el estado de',
        'todas las consultas de Internet a la vez.',
        { t: '→ Por eso raíz y TLD no hacen recursión.', weight: 700, cls: 'c-mal' },
      ], { w: 480, size: 20, cls: 'rota' }), { d: 5600 }));
      return r;
    },
    vuelos: ['C', 'L', 'R', 'T'].map((k, i, a) => V([FILA[k], 360], [FILA[['L', 'R', 'T', 'A'][i]], 360], '?', 'rec', 650 * i, 600))
      .concat(['A', 'T', 'R', 'L'].map((k, i) => V([FILA[k], 360], [FILA[['T', 'R', 'L', 'C'][i]], 360], 'A', 'bien', 650 * (i + 4), 600))),
    notas: [
      'Hagamos el experimento mental: ¿y si todos fuesen recursivos? Vuestro equipo pide al resolutor local que lo haga; el resolutor local pide a la raíz que lo haga; la raíz al TLD; el TLD al autoritativo. Y la respuesta vuelve deshaciendo la cadena.',
      'Funcionaría, pero cada eslabón tiene que esperar y recordar quién le preguntó. La raíz tendría pendientes, a la vez, las consultas de todo Internet. Por eso los servidores raíz y TLD no ofrecen recursión.',
    ],
    ojo: 'Es la consulta recursiva pura de Kurose (Fig. 2.22 en la edición que se usa en clase): en el libro está como contraste; los raíz y los TLD no recurren.',
  },
  {
    acto: 'V', titulo: '¿Y si todo fuese iterativo?',
    msg: '¿Todo iterativo? Sin resolutor local **no hay caché compartida**: cada equipo recorre el árbol solo.',
    escena: () => {
      const r = [], pcs = [[200, 220], [200, 430], [200, 640]], srv = [[1000, 220, 'Raíz'], [1000, 430, 'TLD .es'], [1000, 640, 'Autoritativo']];
      let lin = '';
      for (const p of pcs) for (const s of srv) lin += flecha(p[0] + 100, p[1], s[0] - 110, s[1], 'ite', { fino: true, fin: 3 });
      r.push(S('it-lineas', 0, 0, lin));
      pcs.forEach((p, i) => r.push(S('it-pc' + i, ...p, nodo('Equipo ' + (i + 1), 'con pistas raíz', { w: 200, subMono: false }))));
      srv.forEach((s, i) => r.push(S('it-s' + i, s[0], s[1], nodo(s[2], '', { w: 220 }))));
      r.push(S('it-card', 1170, 160, tarjeta([
        { t: 'Sin resolutor local:', weight: 700, cls: 'c-ite' },
        '• cada equipo necesita las',
        '  pistas raíz y recorre el árbol',
        '• no hay caché compartida: la',
        '  misma pregunta, repetida por',
        '  cada equipo',
        '• más tráfico hacia raíz y TLD',
        '• más espera para cada usuario',
      ], { w: 390, size: 19, cls: 'ite' }), { d: 1500 }));
      return r;
    },
    vuelos: [0, 1, 2].flatMap(i => {
      const p = [200, [220, 430, 640][i]], t0 = i * 250;
      return [[1000, 220], [1000, 430], [1000, 640]].flatMap((s, j) => [V(p, s, '?', 'ite', t0 + j * 900, 420), V(s, p, j < 2 ? 'ref.' : 'A', j < 2 ? 'ref' : 'bien', t0 + j * 900 + 450, 420)]);
    }),
    notas: [
      'Al revés: ¿y si todo fuese iterativo, sin resolutor local? Cada equipo tendría las pistas raíz y recorrería el árbol él solo.',
      'Funcionaría también, pero cada equipo repetiría el mismo trabajo: no hay una caché compartida que aproveche lo que averiguó el de al lado. Más tráfico hacia la raíz y los TLD y más espera para cada usuario.',
      'Conclusión: la mezcla no es un lío, es el diseño. Recursiva donde conviene descargar al equipo y compartir la caché; iterativa donde el servidor no puede permitirse guardar estado.',
    ],
  },
  {
    acto: 'V', titulo: 'Volvemos a la gestoría',
    msg: 'La mezcla es el diseño: **recursiva hasta el resolutor local, iterativa a partir de él**.',
    escena: () => {
      const filas = [
        [['Tú → la gestoría', '«Tráeme el certificado; espero»'], ['Tu equipo → resolutor local', 'consulta recursiva (RD=1)'], 'rec'],
        [['Gestoría → ventanilla 1', '«Aquí no; vaya a la de .es»'], ['Resolutor local → raíz', 'consulta iterativa → referencia'], 'ite'],
        [['Gestoría → última ventanilla', '«Aquí lo tiene»'], ['Resolutor local → autoritativo', 'respuesta con autoridad (AA=1)'], 'ite'],
        [['Archivo de la gestoría', 'la próxima vez no hace cola'], ['Caché del resolutor local', 'válida mientras dure el TTL'], ''],
        [['Tú nunca pisas una ventanilla', ''], ['Tu equipo nunca habla con la raíz', ''], ''],
      ];
      const r = [S('g-cab', 0, 0, txt('En la gestoría', { x: 60, y: 140, size: 20, anchor: 'start', weight: 700, cls: 'ns' }) +
        txt('En el DNS', { x: 840, y: 140, size: 20, anchor: 'start', weight: 700, cls: 'ns' }))];
      filas.forEach(([a, b, cls], i) => {
        const y = 160 + i * 124, la = a[1] ? [{ t: a[0], weight: 600 }, a[1]] : [{ t: a[0], weight: 600 }], lb = b[1] ? [{ t: b[0], weight: 600 }, b[1]] : [{ t: b[0], weight: 600 }];
        r.push(S('g-a' + i, 60, y, tarjeta(la, { w: 700, size: 21, cls }), { d: i * 500 }));
        r.push(S('g-b' + i, 840, y, tarjeta(lb, { w: 700, size: 21, cls }), { d: i * 500 + 250 }));
        r.push(S('g-eq' + i, 800, 0, txt('≈', { y: y + 42, size: 30, cls: 'ns' }), { d: i * 500 + 250 }));
      });
      return r;
    },
    notas: [
      'Volvemos a la gestoría del principio, ahora con todas las piezas. Vosotros le encargáis un trámite a la gestoría y esperáis: eso es una consulta recursiva. La gestoría va de ventanilla en ventanilla y en cada una le dicen «esto no es aquí, vaya a aquella»: consultas iterativas y referencias. En la última ventanilla le dan el papel. La gestoría archiva lo que aprende para la próxima vez: la caché.',
      'Y vosotros no pisáis ninguna ventanilla, igual que vuestro equipo nunca habla con la raíz.',
    ],
  },
  // ── Acto VI ──
  {
    acto: 'VI', titulo: 'Una resolución, mensaje a mensaje',
    msg: 'Para cada mensaje: **de quién a quién, consulta o respuesta, y qué secciones lleva**.',
    escena: () => {
      const X = { C: 200, L: 500, R: 800, T: 1100, A: 1400 };
      const cab = { C: ['Cliente', '10.0.0.5'], L: ['Resolutor local', '10.0.0.1'], R: ['Raíz', '198.41.0.4'], T: ['TLD .es', '194.69.254.1'], A: ['Autoritativo', '130.206.1.2'] };
      const r = Object.keys(X).map(k => S('g6-' + k, X[k], 0, linea(0, 165, 0, 795, 'vida') +
        caja(200, 62, { cls: 'nodo cab-vida' }).replace(`y="-31"`, `y="100"`) + txt(cab[k][0], { y: 126, size: 19, weight: 600, cls: 'nt' }) + txt(cab[k][1], { y: 150, size: 16, cls: 'mono ns' })));
      const msgs = [
        ['C', 'L', '1 · a 10.0.0.1 · consulta (QR=0, RD=1)', 'Question: www.rediris.es A', 'rec', 'preg'],
        ['L', 'R', '2 · a 198.41.0.4 · consulta', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['R', 'L', '3 · a 10.0.0.1 · respuesta (QR=1): referencia', 'Authority: es NS a.nic.es · Additional: a.nic.es A 194.69.254.1', 'ite', 'ref'],
        ['L', 'T', '4 · a 194.69.254.1 · consulta', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['T', 'L', '5 · a 10.0.0.1 · respuesta: referencia', 'Authority: rediris.es NS sun.rediris.es · Additional: sun.rediris.es A 130.206.1.2', 'ite', 'ref'],
        ['L', 'A', '6 · a 130.206.1.2 · consulta', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['A', 'L', '7 · a 10.0.0.1 · respuesta (AA=1)', 'Answer: www.rediris.es A 130.206.13.20', 'ite', 'resp'],
        ['L', 'C', '8 · a 10.0.0.5 · respuesta (AA=0, RA=1)', 'Answer: www.rediris.es A 130.206.13.20', 'rec', 'resp'],
      ];
      msgs.forEach(([de, a, l1, l2, tipo, clase], i) => {
        const y = 222 + i * 78, cx = (X[de] + X[a]) / 2;
        r.push(S('g6m' + i, 0, 0, flecha(X[de], y, X[a], y, tipo, { fin: 2 }) +
          txt(l1, { x: cx, y: y - 30, size: 16, cls: 'halo c-' + clase, weight: 600 }) +
          txt(l2, { x: cx, y: y - 9, size: 14, cls: 'halo mono ns' }), { d: 350 * i }));
      });
      return r;
    },
    notas: [
      'Y así queda dibujado, como lo practica la web de ejercicios: cada mensaje con su origen y su destino (y la IP de destino), si es consulta o respuesta, y qué lleva en cada sección.',
      'Fijaos en el patrón de las respuestas: una referencia lleva la sección Answer vacía, NS en Authority y el pegamento en Additional; la respuesta final lleva el dato en Answer. Quedaos con estos tres tipos de respuesta y sabréis leer cualquier resolución.',
    ],
    ojo: 'El mensaje 1 lo envía 10.0.0.5 y el 8 va a 10.0.0.5: comprobar que se entiende que el 8 es un mensaje distinto del 7. Las secciones (Question, Answer, Authority, Additional) se explican despacio en GG22.',
  },
];
