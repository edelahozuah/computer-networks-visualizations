// Primitivas de dibujo: devuelven cadenas SVG (sin DOM), para poder probarlas en node.
// Un «elemento» de escena es S(id, x, y, html): un <g> con ese id, desplazado a (x, y).
// Si dos pasos consecutivos comparten id, el motor lo desplaza en vez de redibujarlo.

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function S(id, x, y, html, o = {}) {
  return { id, x, y, html, cls: o.cls || '', d: o.d || 0, op: o.op ?? 1 };
}

// Ancho aproximado de un texto (para dimensionar cajas)
const anchoTexto = (s, size, mono) => String(s).length * size * (mono ? 0.61 : 0.54);

function txt(s, o = {}) {
  const w = o.weight ? ` font-weight="${o.weight}"` : '';
  return `<text x="${o.x || 0}" y="${o.y || 0}" font-size="${o.size || 22}" text-anchor="${o.anchor || 'middle'}" class="${o.cls || ''}"${w}>${o.raw ? s : esc(s)}</text>`;
}

function caja(w, h, o = {}) {
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${o.rx ?? 8}" class="${o.cls || 'caja'}"/>`;
}

// Nodo centrado en (0, 0): título y, opcionalmente, subtítulo (monoespaciado salvo subMono:false)
function nodo(titulo, sub, o = {}) {
  const size = o.size || 22, subMono = o.subMono !== false;
  const w = o.w || Math.max(anchoTexto(titulo, size, o.mono), sub ? anchoTexto(sub, 17, subMono) : 0) + 36;
  const h = o.h || (sub ? 70 : 48);
  return caja(w, h, { cls: 'nodo ' + (o.cls || '') }) +
    txt(titulo, { y: sub ? -5 : 8, size, cls: 'nt' + (o.mono ? ' mono' : ''), weight: o.mono ? 500 : 600 }) +
    (sub ? txt(sub, { y: 22, size: 17, cls: (subMono ? 'mono ' : '') + 'ns' }) : '');
}

// Tarjeta con la esquina superior izquierda en (0, 0). Líneas: texto o {t, cls, mono, size, weight}
function tarjeta(lineas, o = {}) {
  const size = o.size || 20, lh = o.lh || Math.round(size * 1.45), pad = o.pad ?? 14;
  const L = lineas.map(l => (typeof l === 'string' ? { t: l } : l));
  const w = o.w || Math.max(...L.map(l => anchoTexto(l.t, l.size || size, l.mono))) + 2 * pad;
  const h = pad + size * 1.1 + (L.length - 1) * lh + pad;
  let s = `<rect width="${w}" height="${h}" rx="8" class="tarjeta ${o.cls || ''}"/>`;
  L.forEach((l, i) => {
    s += txt(l.t, { x: pad, y: pad + size * 0.85 + i * lh, size: l.size || size, anchor: 'start', cls: (l.mono ? 'mono ' : '') + (l.cls || ''), weight: l.weight });
  });
  return s;
}

// Flecha recta; ini/fin acortan los extremos (px)
function flecha(x1, y1, x2, y2, cls = 'neutro', o = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, a = o.ini || 0, b = o.fin || 0;
  const p = [x1 + dx * a / L, y1 + dy * a / L, x2 - dx * b / L, y2 - dy * b / L].map(v => +v.toFixed(1));
  const punta = o.sinPunta ? '' : ` marker-end="url(#dnsm-${cls})"`;
  return `<line x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}" class="fl ${cls}${o.dash ? ' dash' : ''}${o.fino ? ' fino' : ''}"${punta}/>`;
}

// Arco cuadrático (para la cadena del contrafactual recursivo)
function arco(x1, y1, x2, y2, alto, cls) {
  const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - alto;
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" class="fl ${cls}" fill="none" marker-end="url(#dnsm-${cls})"/>`;
}

function linea(x1, y1, x2, y2, cls) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
}

// Mensaje en vuelo: de [x,y] a [x,y], con etiqueta; t = inicio (ms), dur = duración (ms)
const V = (de, a, etiqueta, cls, t = 0, dur = 900) => ({ de, a, etiqueta, cls, t, dur });

// Texto con **negrita** → HTML (para el pie)
const pieHTML = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
