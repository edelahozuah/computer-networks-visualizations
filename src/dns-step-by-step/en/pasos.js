// Scenes and narration (English version of src/pasos.js: same code, translated text).
// 1600 × 900 canvas: header down to y = 90, footer from y = 812.
// Each step: acto, titulo, msg (footer, supports **bold**), escena() → elements, vuelos (optional),
// notas (narration paragraphs), pregunta (to the class, optional), ojo (caveats, optional).

const ACTOS = {
  I: 'IP addresses tie you down',
  II: 'Names',
  III: 'What your computer sees',
  IV: 'Behind the curtain',
  V: 'Recursive and iterative',
  VI: 'How to draw it',
};

function marco(p, i, n) {
  return [
    S('cab-acto', 60, 0, txt(`Act ${p.acto} · ${ACTOS[p.acto]}`, { y: 36, size: 17, anchor: 'start', cls: 'acto', weight: 600 })),
    S('cab-tit', 60, 0, txt(p.titulo, { y: 74, size: 32, anchor: 'start', cls: 'tit', weight: 700 })),
    S('cab-n', 1540, 0, txt(`${i + 1} / ${n}`, { y: 36, size: 17, anchor: 'end', cls: 'ns' })),
    S('pie', 0, 0, `<foreignObject x="60" y="814" width="1480" height="80"><div xmlns="http://www.w3.org/1999/xhtml" class="pie">${pieHTML(p.msg)}</div></foreignObject>`),
  ];
}

const tenue = (els, op = 0.18) => els.map(e => ({ ...e, op }));

// ───────────── Acts I and II: the network map ─────────────

const SRV = { A: [420, 545], B: [1180, 545] };
const IP_SRV = { A: '203.0.113.10', B: '198.51.100.7' };
const REFS = [
  { id: 'ref1', x: 60, y: 110, t: 'Link on a customer’s website', ip: 'http://203.0.113.10/', n: 'http://www.mycompany.es/' },
  { id: 'ref2', x: 60, y: 250, t: 'Poster with a QR code', ip: 'http://203.0.113.10/', n: 'http://www.mycompany.es/' },
  { id: 'ref3', x: 1190, y: 110, t: 'Mobile app already installed', ip: 'server = 203.0.113.10', n: 'server = www.mycompany.es' },
  { id: 'ref4', x: 1190, y: 250, t: 'A partner’s configuration', ip: 'api = 203.0.113.10', n: 'api = www.mycompany.es' },
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
    r.push(S(id, x, 670, nodo('Host', ip, { w: 180, h: 62, size: 18 })));
  }
  if (o.refs === 'rota') r.push(S('fantasma', ...SRV.A, caja(230, 70, { cls: 'fantasma' }) + txt('nobody here anymore', { y: 7, size: 18, cls: 'c-mal' })));
  r.push(S('srv', ...SRV[srv], nodo('MyCompany’s app', IP_SRV[srv], { w: 230, cls: 'srv' })));
  if (o.zoom) {
    r.push(S('zoom-linea', 0, 0, linea(650, 560, 537, 548, 'guia')));
    r.push(S('zoom', 800, 560, caja(280, 160, { cls: 'tarjeta destacada', rx: 10 }) +
      `<text y="-12" font-size="36" text-anchor="middle" class="mono"><tspan class="c-ip" font-weight="600">203.0.113</tspan><tspan>.10</tspan></text>` +
      txt('203.0.113 → the network', { y: 26, size: 17, cls: 'c-ip' }) +
      txt('(assigned by the ISP)', { y: 47, size: 16, cls: 'c-ip' }) +
      txt('.10 → the host', { y: 70, size: 17, cls: 'ns' })));
  }
  if (o.tabla) {
    r.push(S('tabla', 800, 0, txt('What a router knows:', { y: 192, size: 17, cls: 'ns' }) +
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
    r.push(S('nombre', 800, 455, nodo('www.mycompany.es', 'managed by MyCompany', { w: 260, cls: 'nombre', subMono: false, size: 21 })));
    r.push(S('fn-' + srv, 0, 0, srv === 'A' ? flecha(700, 490, 540, 532, 'nombre', { fin: 2 }) : flecha(900, 490, 1060, 532, 'nombre', { fin: 2 })));
    r.push(S('rr', 800, 528, txt(`www  A  ${IP_SRV[srv]}`, { size: 17, cls: 'mono c-nombre' }), { d: o.dRR || 0 }));
  }
  if (o.ttl) {
    r.push(S('ttl', 650, 585, tarjeta(['Moving = changing 1 record.', 'Caches see the change when', 'the TTL expires (e.g. 300 s).'], { w: 300, size: 18, cls: 'nombre' }), { d: 700 }));
  }
  return r;
}

// ───────────── Act II: HOSTS.TXT and the trees ─────────────

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
    txt('HOSTS.TXT', { y: -100, size: 24, weight: 700, cls: 'mono' }) + txt('at the SRI NIC', { y: -74, size: 16, cls: 'ns' });
  filas.forEach((f, i) => { s += txt(f, { y: -38 + i * 24, size: 11, cls: 'mono ns' }); });
  if (grande) s += txt('… thousands of lines', { y: 80, size: 17, cls: 'c-mal', weight: 600 });
  return [S('hosts-txt', 800, 450, s), ...hosts(grande ? 26 : 10, grande ? 10 : 15)];
}

const ARBOL = [
  { id: 'raiz', x: 800, y: 140, t: '.', p: null },
  { id: 'es', x: 420, y: 240, t: 'es', p: 'raiz' },
  { id: 'com', x: 800, y: 240, t: 'com', p: 'raiz' },
  { id: 'org', x: 1180, y: 240, t: 'org', p: 'raiz' },
  { id: 'uah', x: 200, y: 340, t: 'uah.es', p: 'es' },
  { id: 'rediris', x: 440, y: 340, t: 'rediris.es', p: 'es' },
  { id: 'miempresa', x: 650, y: 340, t: 'mycompany.es', p: 'es' },
  { id: 'ejemplo', x: 880, y: 340, t: 'example.com', p: 'com' },
  { id: 'wikipedia', x: 1180, y: 340, t: 'wikipedia.org', p: 'org' },
  { id: 'www-uah', x: 140, y: 435, t: 'www', p: 'uah' },
  { id: 'aut-uah', x: 260, y: 435, t: 'aut', p: 'uah' },
  { id: 'www-rediris', x: 440, y: 435, t: 'www', p: 'rediris' },
  { id: 'www-mi', x: 590, y: 435, t: 'www', p: 'miempresa' },
  { id: 'correo-mi', x: 710, y: 435, t: 'mail', p: 'miempresa' },
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
  { id: 'z-mi', x: 545, y: 312, w: 215, h: 175, t: 'MyCompany' },
  { id: 'z-ej', x: 790, y: 312, w: 180, h: 175, t: 'another company' },
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
  r.push(S('et-nombres', 60, 0, txt('Name tree', { y: 150, size: 20, anchor: 'start', cls: 'c-nombre', weight: 700 }) +
    txt('who manages it', { y: 176, size: 17, anchor: 'start', cls: 'c-nombre' })));
  r.push(S('et-red', 60, 0, txt('Address tree', { y: 560, size: 20, anchor: 'start', cls: 'c-ip', weight: 700 }) +
    txt('where it is', { y: 586, size: 17, anchor: 'start', cls: 'c-ip' }), { d: 300 }));
  return r;
}

// ───────────── Act III: the end system ─────────────

function equipo(o = {}) {
  const r = [
    S('pc-marco', 0, 0, `<rect x="100" y="110" width="540" height="650" rx="16" class="equipo"/>` +
      txt('Your computer · pc.aut.uah.es · 10.0.0.5', { x: 370, y: 146, size: 19, weight: 600 })),
    S('capa-app', 370, 230, nodo('Browser', 'wants to open www.rediris.es', { w: 440, subMono: false })),
    S('capa-f1', 0, 0, flecha(370, 265, 370, 333, 'neutro', { fin: 2 })),
    S('capa-gai', 370, 370, nodo('getaddrinfo("www.rediris.es")', '', { w: 440, mono: true, size: 20 })),
    S('capa-f2', 0, 0, flecha(370, 394, 370, 472, 'neutro', { fin: 2 })),
    S('capa-stub', 370, 510, nodo('OS resolver (stub)', 'checks its cache and /etc/hosts', { w: 440, subMono: false })),
    S('capa-dhcp', 370, 0, txt('The local resolver’s IP came from DHCP:', { y: 596, size: 17, cls: 'ns' }) +
      txt('the university’s, your ISP’s, your home router or a public one', { y: 620, size: 15, cls: 'ns' })),
    S('caja-local', 1180, 450, caja(380, 180, { cls: 'cajanegra', rx: 12 }) + txt('Local resolver', { y: -22, size: 28, weight: 700, cls: 'nt' }) +
      txt('10.0.0.1', { y: 14, size: 20, cls: 'mono ns' }) + txt('what does it do inside?', { y: 56, size: 18, cls: 'ns' })),
    S('p3', 0, 0, flecha(590, 490, 990, 490, 'rec', { fin: 2 }) + txt('A? www.rediris.es', { x: 790, y: 478, size: 18, cls: 'mono halo' }), { d: o.dP || 0 }),
  ];
  if (o.respuesta) r.push(S('r3', 0, 0, flecha(990, 530, 590, 530, 'rec', { fin: 2 }) + txt('A www.rediris.es = 130.206.13.20', { x: 790, y: 558, size: 18, cls: 'mono c-bien halo' }), { d: 900 }));
  r.push(S('reloj3-' + (o.respuesta ? 'ok' : 'espera'), 370, 0, o.respuesta ? txt('✓ answer received', { y: 700, size: 20, cls: 'c-bien', weight: 600 })
    : txt('⏳ waiting for the answer…', { y: 700, size: 20, cls: 'c-rec', weight: 600 }), { d: o.respuesta ? 900 : 0 }));
  if (o.respuesta) {
    r.push(S('resumen3', 720, 610, tarjeta([
      { t: 'What your computer sees:', weight: 600 },
      '• one question and one answer, to the local resolver',
      '• no root, no TLD, no authoritative: it has no idea they exist',
      '• in the meantime, it waits',
    ], { w: 700, size: 20 }), { d: 1100 }));
  }
  return r;
}

// ───────────── Acts IV and V: map + sequence diagram ─────────────

const M = { C: [130, 470], L: [400, 470], R: [140, 200], T: [400, 140], A: [650, 200], C2: [130, 650] };
const LV = { C: 880, L: 1050, R: 1210, T: 1360, A: 1510 };
const LV_TIT = { C: 'Client', L: 'Local resolver', R: 'Root', T: 'TLD .es', A: 'Authoritative' };
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
  r.push(S('mn-C', ...M.C, nodo('Your computer', '10.0.0.5', { w: 200 })));
  r.push(S('mn-L', ...M.L, nodo('Local resolver', '10.0.0.1', { w: 210, cls: 'local' })));
  r.push(S('mn-R', ...M.R, nodo('Root', '198.41.0.4', { w: 210 })));
  r.push(S('mn-T', ...M.T, nodo('TLD .es', '194.69.254.1', { w: 210 })));
  r.push(S('mn-A', ...M.A, nodo('Authoritative rediris.es', '130.206.1.2', { w: 270, size: 19 })));
  if (o.pc2) r.push(S('mn-C2', ...M.C2, nodo('Another computer', '10.0.0.9', { w: 200 })));
  if (o.reloj) r.push(S('reloj-' + o.reloj, 130, 0, o.reloj === 'ok' ? txt('✓ answer', { y: 528, size: 17, cls: 'c-bien', weight: 600 })
    : txt('⏳ waiting…', { y: 528, size: 17, cls: 'c-rec', weight: 600 }), { d: o.dReloj || 0 }));
  if (o.acierto) r.push(S('acierto', 400, 0, txt(o.acierto, { y: 420, size: 17, cls: 'c-bien halo', weight: 600 }), { d: o.dAcierto || 0 }));
  // Local resolver cache: fixed background + one line per entry, so each one appears at its own time
  r.push(S('cache', 270, 560, `<rect width="490" height="200" rx="8" class="tarjeta"/>` +
    txt('Local resolver cache', { x: 14, y: 28, size: 17, anchor: 'start', weight: 600 }) +
    txt('root hints: a.root-servers.net 198.41.0.4', { x: 14, y: 56, size: 15, anchor: 'start', cls: 'mono ns' })));
  const ent = ['es. NS a.nic.es · a.nic.es A 194.69.254.1', 'rediris.es NS sun.rediris.es · A 130.206.1.2', 'www.rediris.es A 130.206.13.20'];
  (o.cache || []).forEach((d, k) => { if (d !== null) r.push(S('ce' + k, 284, 650 + k * 30, txt(ent[k], { anchor: 'start', size: 15, cls: 'mono c-cache' }), { d })); });
  if (o.etiquetas) {
    r.push(S('et-mapa', 0, 0, txt('recursive', { x: 262, y: 530, size: 16, cls: 'c-rec halo', weight: 700 }) +
      txt('iterative', { x: 470, y: 415, size: 16, cls: 'c-ite halo', weight: 700, anchor: 'start' })));
  }
  return r;
}

const det = (clave, lineas, cls, d) => ({ clave, lineas, cls, d });

function bandas() {
  return [
    S('banda-rec', 0, 0, `<rect x="845" y="${yMsg(1) - 32}" width="240" height="46" rx="8" class="banda rec"/>` +
      `<rect x="845" y="${yMsg(8) - 32}" width="240" height="46" rx="8" class="banda rec"/>` +
      txt('recursive', { x: 965, y: yMsg(1) + 28, size: 16, cls: 'c-rec halo', weight: 700 }) +
      txt('recursive', { x: 965, y: yMsg(8) + 28, size: 16, cls: 'c-rec halo', weight: 700 })),
    S('banda-ite', 0, 0, `<rect x="1020" y="${yMsg(2) - 32}" width="560" height="${yMsg(7) - yMsg(2) + 46}" rx="8" class="banda ite"/>` +
      txt('iterative', { x: 1572, y: yMsg(2) - 40, size: 16, cls: 'c-ite halo', weight: 700, anchor: 'end' })),
  ];
}

// Map without arrows of its own in the counterfactual: five nodes in a row
const FILA = { C: 170, L: 490, R: 810, T: 1130, A: 1450 };
const FILA_SUB = { C: '10.0.0.5', L: '10.0.0.1', R: '198.41.0.4', T: '194.69.254.1', A: '130.206.1.2' };
const FILA_TIT = { C: 'Your computer', L: 'Local resolver', R: 'Root', T: 'TLD .es', A: 'Authoritative' };

// ───────────── The steps ─────────────

const PASOS = [
  // ── Act I ──
  {
    acto: 'I', titulo: 'Every host has an IP address',
    msg: 'An IP address has two parts: **the network** (assigned by your ISP) and **the host**. Routers only know networks: the IP says **where** you are.',
    escena: () => mapaRed({ zoom: true, tabla: true }),
  },
  {
    acto: 'I', titulo: 'MyCompany publishes its app',
    msg: 'The IP address ends up **written down in places you don’t control**.',
    escena: () => mapaRed({ refs: 'ip' }),
  },
  {
    acto: 'I', titulo: 'MyCompany moves',
    msg: 'When you move, **your IP address changes**, and everything that had it written down **breaks**.',
    escena: () => mapaRed({ refs: 'rota', srv: 'B' }),
  },
  {
    acto: 'I', titulo: 'The problem',
    msg: 'We need an identifier that **doesn’t depend on the place**… and that **we manage ourselves**.',
    escena: () => [...tenue(mapaRed({ refs: 'rota', srv: 'B' })),
      S('lema1', 800, 450, caja(980, 190, { cls: 'tarjeta destacada', rx: 14 }) +
        txt('An IP address says where you are,', { y: -18, size: 44, weight: 700, cls: 'nt' }) +
        txt('not who you are.', { y: 40, size: 44, weight: 700, cls: 'c-ip' }))],
  },
  // ── Act II ──
  {
    acto: 'II', titulo: 'A name in between',
    msg: 'What gets published is **a name**, and the name points to the IP address. **You manage the name.**',
    escena: () => mapaRed({ refs: 'nombre', nombre: true }),
  },
  {
    acto: 'II', titulo: 'The same move, with names',
    msg: 'Moving = **changing one record**. Everything published keeps working (as soon as the **TTL** expires).',
    escena: () => mapaRed({ refs: 'nombre', nombre: true, srv: 'B', ttl: true }),
  },
  {
    acto: 'II', titulo: 'Where does the table live?',
    msg: 'First solution: **one central table** (HOSTS.TXT) that everyone downloads. With thousands of hosts, **it doesn’t scale**.',
    escena: () => [
      ...hostsTxt(true),
      S('hist', 60, 140, tarjeta([{ t: 'ARPANET, until 1983', weight: 600 }, 'A single file with every', 'host, maintained by hand', 'at the SRI NIC.', { t: 'Today: /etc/hosts', mono: true, cls: 'ns' }], { w: 330, size: 19 })),
      S('problemas', 1150, 140, tarjeta([
        { t: 'Problems', weight: 700, cls: 'c-mal' },
        '• Everyone downloads the whole',
        '  file, over and over',
        '• Every change goes through the NIC',
        '• Names must be unique',
        '  worldwide: clashes',
        '• A single administrator',
      ], { w: 390, size: 19, cls: 'rota' }), { d: 900 }),
      S('solucion', 1150, 560, tarjeta([{ t: '1983: Mockapetris proposes', weight: 600 }, 'the DNS (RFC 882/883)'], { w: 390, size: 19, cls: 'nombre' }), { d: 1500 }),
    ],
  },
  {
    acto: 'II', titulo: 'Split the table along the name',
    msg: 'Names form **a tree**. Each organization **manages its own piece (zone)** and hands out parts of it further down.',
    escena: () => arbol({ zonas: true }),
  },
  {
    acto: 'II', titulo: 'Two trees that don’t match',
    msg: '**Two trees that don’t match:** the name tree says **who manages it**; the address tree, **where it is**.',
    escena: () => [...arbol({ zonas: true }), ...arbolRed()],
  },
  {
    acto: 'II', titulo: 'Higher up, they only know whom to ask',
    msg: 'Higher up, they only know **whom to ask**; the data is further down. A **distributed, hierarchical and delegated** database.',
    escena: () => [
      ...arbol({ zonas: true, camino: true }),
      S('del-raiz', 960, 104, tarjeta([{ t: 'The root only knows:', size: 16, cls: 'ns' }, { t: 'NS es → a.nic.es', mono: true, cls: 'c-ref' }], { w: 300, size: 18, cls: 'ref' }), { d: 0 }),
      S('del-es', 40, 186, tarjeta([{ t: 'Red.es (zone es) only knows:', size: 16, cls: 'ns' }, { t: 'NS rediris.es → sun.rediris.es', mono: true, cls: 'c-ref' }], { w: 330, size: 16, cls: 'ref' }), { d: 500 }),
      S('del-red', 330, 510, tarjeta([{ t: 'RedIRIS (authoritative) has the data:', size: 16, cls: 'ns' }, { t: 'www.rediris.es A 130.206.13.20', mono: true, cls: 'c-bien' }], { w: 380, size: 18, cls: 'ok' }), { d: 1000 }),
    ],
  },
  // ── Act III ──
  {
    acto: 'III', titulo: 'What your computer does',
    msg: 'For your computer, the DNS is **an errand** handed to the local resolver… **and waiting**. Like leaving paperwork with an agency.',
    escena: () => equipo({ dP: 900 }),
    vuelos: [V([590, 490], [990, 490], 'A? www.rediris.es', 'rec')],
  },
  {
    acto: 'III', titulo: 'One question, one answer',
    msg: 'Your computer **knows nothing about the tree**: it asks one question and waits for **the final answer**.',
    escena: () => equipo({ respuesta: true }),
    vuelos: [V([990, 530], [590, 530], 'A = 130.206.13.20', 'bien')],
  },
  {
    acto: 'III', titulo: 'What do you think happens inside?',
    msg: '**Make a prediction before you look.** Now let’s check it, message by message.',
    escena: () => [...tenue(equipo({ respuesta: true }), 0.12),
      S('predice', 290, 190, tarjeta([
        { t: 'Before opening the box: what do you think?', weight: 700, size: 30 },
        '1. Whom does your computer talk to in order to resolve www.rediris.es?',
        '2. Who talks to the root? What does the root reply?',
        '3. With nothing cached, how many messages are needed?',
        '4. Is the answer your computer receives sent by RedIRIS?',
      ], { w: 1020, size: 26, lh: 52, pad: 26, cls: 'destacada' }))],
  },
  // ── Act IV ──
  {
    acto: 'IV', titulo: 'Opening the box',
    msg: 'The local resolver starts **with nothing in its cache**: it only knows the IP addresses of **the root servers**.',
    escena: () => [...mapaRes({ cache: [] }), ...secuencia(0)],
  },
  {
    acto: 'IV', titulo: 'Message 1: your computer asks',
    msg: '**1** · Your computer asks **the local resolver** (and sits there waiting).',
    escena: () => [...mapaRes({ cache: [], reloj: 'espera', detalle: det(1, ['Message 1 · from your computer to the local resolver', { t: 'Question: www.rediris.es, type A (RD=1)', mono: true }], '', 900) }), ...secuencia(1, { 1: 900 })],
    vuelos: [V(M.C, M.L, 'A? www.rediris.es', 'rec')],
  },
  {
    acto: 'IV', titulo: 'Messages 2 and 3: the root',
    msg: '**2–3** · The root doesn’t know the answer: it returns a **referral**, “ask the .es servers.”',
    escena: () => [...mapaRes({ cache: [1950], reloj: 'espera', detalle: det(2, [{ t: 'Message 3 · referral from the root', weight: 600, cls: 'c-ref' }, 'I don’t know www.rediris.es. Ask the es servers:', { t: 'es. NS a.nic.es  +  a.nic.es A 194.69.254.1', mono: true }], 'ref', 1950) }), ...secuencia(3, { 2: 900, 3: 1950 })],
    vuelos: [V(M.L, M.R, 'A? www.rediris.es', 'ite'), V(M.R, M.L, 'NS es → a.nic.es', 'ref', 1050)],
  },
  {
    acto: 'IV', titulo: 'Messages 4 and 5: the .es TLD',
    msg: '**4–5** · The .es TLD doesn’t know either: another **referral**, which also carries the server’s IP address (**glue**).',
    escena: () => [...mapaRes({ cache: [0, 1950], reloj: 'espera', detalle: det(3, [{ t: 'Message 5 · referral from the .es TLD', weight: 600, cls: 'c-ref' }, 'Ask the rediris.es servers:', { t: 'rediris.es NS sun.rediris.es  +  A 130.206.1.2', mono: true }], 'ref', 1950) }), ...secuencia(5, { 4: 900, 5: 1950 })],
    vuelos: [V(M.L, M.T, 'A? www.rediris.es', 'ite'), V(M.T, M.L, 'NS rediris.es → sun…', 'ref', 1050)],
  },
  {
    acto: 'IV', titulo: 'Messages 6 and 7: the authoritative server',
    msg: '**6–7** · The **authoritative** server for rediris.es does know: an answer with **AA=1**.',
    escena: () => [...mapaRes({ cache: [0, 0, 1950], reloj: 'espera', detalle: det(4, [{ t: 'Message 7 · authoritative answer (AA=1)', weight: 600, cls: 'c-bien' }, { t: 'www.rediris.es A 130.206.13.20', mono: true }], 'ok', 1950) }), ...secuencia(7, { 6: 900, 7: 1950 })],
    vuelos: [V(M.L, M.A, 'A? www.rediris.es', 'ite'), V(M.A, M.L, 'A = 130.206.13.20', 'bien', 1050)],
  },
  {
    acto: 'IV', titulo: 'Message 8: the answer to your computer',
    msg: '**8** · The local resolver answers your computer with **a new message** and **caches everything**.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], reloj: 'ok', dReloj: 900, detalle: det(5, [{ t: 'Message 8 · from the local resolver to your computer (new message)', weight: 600, cls: 'c-bien' }, { t: 'www.rediris.es A 130.206.13.20  (AA=0, RA=1)', mono: true }], 'ok', 900) }), ...secuencia(8, { 8: 900 })],
    vuelos: [V(M.L, M.C, 'A = 130.206.13.20', 'bien')],
  },
  {
    acto: 'IV', titulo: 'Another computer asks the same thing',
    msg: 'Second time around: the local resolver answers **from its cache**. Two messages instead of eight.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], pc2: true, acierto: '✓ cached', dAcierto: 900 }),
      ...vidas({ tenues: ['R', 'T', 'A'] }),
      msgSpec('c1', { n: 1, de: 'C', a: 'L', q: 'A? www.rediris.es (RD=1)', tipo: 'rec', clase: 'preg' }, yMsg(1), 900),
      msgSpec('c2', { n: 2, de: 'L', a: 'C', q: 'A www.rediris.es = … (from cache)', tipo: 'rec', clase: 'resp' }, yMsg(2), 1950)],
    vuelos: [V(M.C2, M.L, 'A? www.rediris.es', 'rec'), V(M.L, M.C2, 'A = 130.206.13.20', 'bien', 1050)],
  },
  {
    acto: 'IV', titulo: 'Another name in the same zone',
    msg: 'Another name under rediris.es: it already knows who manages it, so **no root and no TLD**.',
    escena: () => [...mapaRes({ cache: [0, 0, 0], pc2: true }),
      ...vidas({ tenues: ['R', 'T'] }),
      msgSpec('p1', { n: 1, de: 'C', a: 'L', q: 'A? eventos.rediris.es', tipo: 'rec', clase: 'preg' }, yMsg(1), 900),
      msgSpec('p2', { n: 2, de: 'L', a: 'A', q: 'A? eventos.rediris.es', tipo: 'ite', clase: 'preg' }, yMsg(2), 1950),
      msgSpec('p3', { n: 3, de: 'A', a: 'L', q: 'A eventos.rediris.es = … (AA=1)', tipo: 'ite', clase: 'resp' }, yMsg(3), 3000),
      msgSpec('p4', { n: 4, de: 'L', a: 'C', q: 'A eventos.rediris.es = …', tipo: 'rec', clase: 'resp' }, yMsg(4), 4050)],
    vuelos: [V(M.C2, M.L, 'A? eventos.rediris.es', 'rec'), V(M.L, M.A, 'A? eventos.rediris.es', 'ite', 1050),
      V(M.A, M.L, 'A …', 'bien', 2100), V(M.L, M.C2, 'A …', 'bien', 3150)],
  },
  // ── Act V ──
  {
    acto: 'V', titulo: 'Recursive or iterative?',
    msg: '**Recursive / iterative** describes **each query‑response pair**, not the whole resolution.',
    escena: () => [...bandas(), ...mapaRes({ cache: [0, 0, 0], reloj: 'ok', etiquetas: true }), ...secuencia(8),
      S('kurose', 840, 738, tarjeta([{ t: 'Kurose: Fig. 2.21 is this; 2.22 (all recursive) is what doesn’t happen.', weight: 600 }], { w: 740, size: 18, pad: 12 }), { d: 600 })],
  },
  {
    acto: 'V', titulo: 'What each one commits to',
    msg: 'Recursive: “**do it for me**.” Iterative: “**tell me what you know**.”',
    escena: () => [...bandas(), ...secuencia(8),
      S('comp-rec', 40, 120, tarjeta([
        { t: 'Recursive: “do it and bring me the result”', weight: 700, cls: 'c-rec' },
        '• The client asks for it: RD=1 bit (recursion desired)',
        '• The server says whether it offers it: RA=1 in the reply',
        '• It must return the final answer… or an error',
        '• Meanwhile, it keeps the state and waits',
      ], { w: 750, size: 20, cls: 'rec' })),
      S('comp-ite', 40, 420, tarjeta([
        { t: 'Iterative: “tell me what you know”', weight: 700, cls: 'c-ite' },
        '• Root, TLD and authoritative servers only work this way (RA=0)',
        '• If it is authoritative for the name: the answer',
        '• If not: a referral, “ask these ones” (NS + IP)',
        '• It replies and forgets: it keeps no state',
      ], { w: 750, size: 20, cls: 'ite' }), { d: 500 })],
  },
  {
    acto: 'V', titulo: 'What if everything were recursive?',
    msg: 'All recursive? The root would have to keep the state of **millions** of queries at once: **it doesn’t scale**.',
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
      r.push(S('kurose22', 800, 0, txt('Kurose’s Fig. 2.22: NOT how it works today', { y: 150, size: 24, weight: 700, cls: 'c-mal' })));
      r.push(S('sobrecarga', 560, 560, tarjeta([
        { t: 'Every link in the chain waits for the next.', weight: 600 },
        'The root would have to keep the state of',
        'every query on the Internet at once.',
        { t: '→ That’s why root and TLD servers don’t recurse.', weight: 700, cls: 'c-mal' },
      ], { w: 480, size: 20, cls: 'rota' }), { d: 5600 }));
      return r;
    },
    vuelos: ['C', 'L', 'R', 'T'].map((k, i, a) => V([FILA[k], 360], [FILA[['L', 'R', 'T', 'A'][i]], 360], '?', 'rec', 650 * i, 600))
      .concat(['A', 'T', 'R', 'L'].map((k, i) => V([FILA[k], 360], [FILA[['T', 'R', 'L', 'C'][i]], 360], 'A', 'bien', 650 * (i + 4), 600))),
  },
  {
    acto: 'V', titulo: 'What if everything were iterative?',
    msg: 'All iterative? Without a local resolver **there is no shared cache**: each computer walks the tree on its own.',
    escena: () => {
      const r = [], pcs = [[200, 220], [200, 430], [200, 640]], srv = [[1000, 220, 'Root'], [1000, 430, 'TLD .es'], [1000, 640, 'Authoritative']];
      let lin = '';
      for (const p of pcs) for (const s of srv) lin += flecha(p[0] + 100, p[1], s[0] - 110, s[1], 'ite', { fino: true, fin: 3 });
      r.push(S('it-lineas', 0, 0, lin));
      pcs.forEach((p, i) => r.push(S('it-pc' + i, ...p, nodo('Computer ' + (i + 1), 'with root hints', { w: 200, subMono: false }))));
      srv.forEach((s, i) => r.push(S('it-s' + i, s[0], s[1], nodo(s[2], '', { w: 220 }))));
      r.push(S('it-card', 1170, 160, tarjeta([
        { t: 'Without a local resolver:', weight: 700, cls: 'c-ite' },
        '• every computer needs the',
        '  root hints and walks the tree',
        '• no shared cache: the same',
        '  question, repeated by',
        '  every computer',
        '• more traffic to root and TLD',
        '• more waiting for every user',
      ], { w: 390, size: 19, cls: 'ite' }), { d: 1500 }));
      return r;
    },
    vuelos: [0, 1, 2].flatMap(i => {
      const p = [200, [220, 430, 640][i]], t0 = i * 250;
      return [[1000, 220], [1000, 430], [1000, 640]].flatMap((s, j) => [V(p, s, '?', 'ite', t0 + j * 900, 420), V(s, p, j < 2 ? 'ref.' : 'A', j < 2 ? 'ref' : 'bien', t0 + j * 900 + 450, 420)]);
    }),
  },
  {
    acto: 'V', titulo: 'Back to the agency',
    msg: 'The mix is the design: **recursive up to the local resolver, iterative from there on**.',
    escena: () => {
      const filas = [
        [['You → the agency', '“Get me the certificate; I’ll wait”'], ['Your computer → local resolver', 'recursive query (RD=1)'], 'rec'],
        [['Agency → counter 1', '“Not here; go to the .es counter”'], ['Local resolver → root', 'iterative query → referral'], 'ite'],
        [['Agency → last counter', '“Here you go”'], ['Local resolver → authoritative', 'authoritative answer (AA=1)'], 'ite'],
        [['The agency’s files', 'no waiting in line next time'], ['Local resolver cache', 'valid while the TTL lasts'], ''],
        [['You never set foot at a counter', ''], ['Your computer never talks to the root', ''], ''],
      ];
      const r = [S('g-cab', 0, 0, txt('At the agency', { x: 60, y: 140, size: 20, anchor: 'start', weight: 700, cls: 'ns' }) +
        txt('In the DNS', { x: 840, y: 140, size: 20, anchor: 'start', weight: 700, cls: 'ns' }))];
      filas.forEach(([a, b, cls], i) => {
        const y = 160 + i * 124, la = a[1] ? [{ t: a[0], weight: 600 }, a[1]] : [{ t: a[0], weight: 600 }], lb = b[1] ? [{ t: b[0], weight: 600 }, b[1]] : [{ t: b[0], weight: 600 }];
        r.push(S('g-a' + i, 60, y, tarjeta(la, { w: 700, size: 21, cls }), { d: i * 500 }));
        r.push(S('g-b' + i, 840, y, tarjeta(lb, { w: 700, size: 21, cls }), { d: i * 500 + 250 }));
        r.push(S('g-eq' + i, 800, 0, txt('≈', { y: y + 42, size: 30, cls: 'ns' }), { d: i * 500 + 250 }));
      });
      return r;
    },
  },
  // ── Act VI ──
  {
    acto: 'VI', titulo: 'One resolution, message by message',
    msg: 'For each message: **from whom to whom, query or response, and which sections it carries**.',
    escena: () => {
      const X = { C: 200, L: 500, R: 800, T: 1100, A: 1400 };
      const cab = { C: ['Client', '10.0.0.5'], L: ['Local resolver', '10.0.0.1'], R: ['Root', '198.41.0.4'], T: ['TLD .es', '194.69.254.1'], A: ['Authoritative', '130.206.1.2'] };
      const r = Object.keys(X).map(k => S('g6-' + k, X[k], 0, linea(0, 165, 0, 795, 'vida') +
        caja(200, 62, { cls: 'nodo cab-vida' }).replace(`y="-31"`, `y="100"`) + txt(cab[k][0], { y: 126, size: 19, weight: 600, cls: 'nt' }) + txt(cab[k][1], { y: 150, size: 16, cls: 'mono ns' })));
      const msgs = [
        ['C', 'L', '1 · to 10.0.0.1 · query (QR=0, RD=1)', 'Question: www.rediris.es A', 'rec', 'preg'],
        ['L', 'R', '2 · to 198.41.0.4 · query', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['R', 'L', '3 · to 10.0.0.1 · response (QR=1): referral', 'Authority: es NS a.nic.es · Additional: a.nic.es A 194.69.254.1', 'ite', 'ref'],
        ['L', 'T', '4 · to 194.69.254.1 · query', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['T', 'L', '5 · to 10.0.0.1 · response: referral', 'Authority: rediris.es NS sun.rediris.es · Additional: sun.rediris.es A 130.206.1.2', 'ite', 'ref'],
        ['L', 'A', '6 · to 130.206.1.2 · query', 'Question: www.rediris.es A', 'ite', 'preg'],
        ['A', 'L', '7 · to 10.0.0.1 · response (AA=1)', 'Answer: www.rediris.es A 130.206.13.20', 'ite', 'resp'],
        ['L', 'C', '8 · to 10.0.0.5 · response (AA=0, RA=1)', 'Answer: www.rediris.es A 130.206.13.20', 'rec', 'resp'],
      ];
      msgs.forEach(([de, a, l1, l2, tipo, clase], i) => {
        const y = 222 + i * 78, cx = (X[de] + X[a]) / 2;
        r.push(S('g6m' + i, 0, 0, flecha(X[de], y, X[a], y, tipo, { fin: 2 }) +
          txt(l1, { x: cx, y: y - 30, size: 16, cls: 'halo c-' + clase, weight: 600 }) +
          txt(l2, { x: cx, y: y - 9, size: 14, cls: 'halo mono ns' }), { d: 350 * i }));
      });
      return r;
    },
  },
];
