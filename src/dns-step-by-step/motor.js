// Motor: render por diferencias sobre el SVG, vuelos de mensajes y navegación.

const SVGNS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);

// ───────────── Render por diferencias ─────────────
const vivos = new Map();

function render(specs, instantaneo) {
  const capa = $('dns-capa'), vistos = new Set();
  let prev = null;
  for (const sp of specs) {
    if (vistos.has(sp.id)) console.warn('[dns] id repetido', sp.id);
    vistos.add(sp.id);
    let el = vivos.get(sp.id), nuevo = false;
    if (!el) {
      el = document.createElementNS(SVGNS, 'g');
      el.dataset.id = sp.id;
      vivos.set(sp.id, el);
      nuevo = true;
    }
    if (el._html !== sp.html) { el.innerHTML = sp.html; el._html = sp.html; }
    el.setAttribute('class', 'el ' + sp.cls);
    const tr = `translate(${sp.x}px, ${sp.y}px)`;
    const ref = prev ? prev.nextSibling : capa.firstChild;
    if (ref !== el) capa.insertBefore(el, ref);
    if (nuevo) {
      el.style.transition = 'none';
      el.style.opacity = 0;
      el.style.transform = tr;
      el.getBoundingClientRect();
      el.style.transition = '';
      el.style.transitionDelay = instantaneo ? '0ms' : sp.d + 'ms';
    } else {
      el.style.transitionDelay = '0ms';
      el.style.transform = tr;
    }
    el.style.opacity = sp.op;
    prev = el;
  }
  for (const [id, el] of vivos) {
    if (vistos.has(id)) continue;
    vivos.delete(id);
    el.style.transitionDelay = '0ms';
    el.style.opacity = 0;
    setTimeout(() => el.remove(), 450);
  }
}

// ───────────── Vuelos ─────────────
let generacion = 0, temporizadores = [];

function cancelarVuelos() {
  generacion++;
  temporizadores.forEach(clearTimeout);
  temporizadores = [];
  $('dns-vuelos').innerHTML = '';
}

function volar(v) {
  const gen = generacion;
  temporizadores.push(setTimeout(() => {
    if (gen !== generacion) return;
    const g = document.createElementNS(SVGNS, 'g');
    const w = anchoTexto(v.etiqueta, 16, true) + 22;
    g.innerHTML = `<rect x="${-w / 2}" y="-16" width="${w}" height="32" rx="16" class="sobre ${v.cls}"/>` + txt(v.etiqueta, { y: 6, size: 16, cls: 'mono sobre-t' });
    $('dns-vuelos').appendChild(g);
    const t0 = performance.now();
    const paso = ahora => {
      if (gen !== generacion) return;
      let k = Math.min(1, (ahora - t0) / v.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      g.setAttribute('transform', `translate(${v.de[0] + (v.a[0] - v.de[0]) * e},${v.de[1] + (v.a[1] - v.de[1]) * e})`);
      if (k < 1) requestAnimationFrame(paso);
      else temporizadores.push(setTimeout(() => g.remove(), 150));
    };
    requestAnimationFrame(paso);
  }, v.t));
}

// ───────────── Navegación ─────────────
let actual = -1;

function construir(i) {
  return [...marco(PASOS[i], i, PASOS.length), ...PASOS[i].escena()];
}

function ir(i, animar) {
  i = Math.max(0, Math.min(PASOS.length - 1, i));
  cancelarVuelos();
  render(construir(i), !animar);
  if (animar) (PASOS[i].vuelos || []).forEach(volar);
  actual = i;
  try { history.replaceState(null, '', '#p' + (i + 1)); } catch (e) { /* sin historial (incrustado) */ }
  pintarControles();
}

const siguiente = () => { if (actual < PASOS.length - 1) ir(actual + 1, true); };
const anterior = () => ir(actual - 1, false);

function repetir() {
  if (actual <= 0) return ir(actual, true);
  const i = actual;
  render(construir(i - 1), true);
  setTimeout(() => ir(i, true), 350);
}

function pintarControles() {
  $('dns-cont').textContent = `${actual + 1} / ${PASOS.length}`;
  $('dns-indice').value = String(actual);
}

// ───────────── Teclado y botones ─────────────
function alternarTema() {
  const r = document.documentElement, t = r.getAttribute('data-theme');
  const nuevo = t === 'light' ? 'dark' : t === 'dark' ? null : 'light';
  if (nuevo) r.setAttribute('data-theme', nuevo); else r.removeAttribute('data-theme');
  $('dns-btema').textContent = 'Tema: ' + (nuevo === 'light' ? 'claro' : nuevo === 'dark' ? 'oscuro' : 'auto');
}

function pantallaCompleta() {
  const e = $('dns-escenario');
  if (document.fullscreenElement) document.exitFullscreen(); else if (e.requestFullscreen) e.requestFullscreen();
}

function teclado(accion) {
  return ev => {
    if (ev.target && /^(SELECT|INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { ev.preventDefault(); accion('sig'); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { ev.preventDefault(); accion('ant'); }
    else if (k === 'r' || k === 'R') accion('rep');
    else if (k === 'Home') accion('ini');
    else if (k === 'End') accion('fin');
    else if (k === 'f' || k === 'F') accion('fs');
  };
}

function iniciar() {
  const sel = $('dns-indice');
  let actoPrevio = '';
  PASOS.forEach((p, i) => {
    if (p.acto !== actoPrevio) {
      const og = document.createElement('optgroup');
      og.label = `Acto ${p.acto} · ${ACTOS[p.acto]}`;
      sel.appendChild(og);
      actoPrevio = p.acto;
    }
    const op = document.createElement('option');
    op.value = String(i);
    op.textContent = `${i + 1}. ${p.titulo}`;
    sel.lastChild.appendChild(op);
  });
  sel.onchange = () => { ir(+sel.value, false); sel.blur(); };
  $('dns-ant').onclick = anterior;
  $('dns-sig').onclick = siguiente;
  $('dns-rep').onclick = repetir;
  $('dns-bfs').onclick = pantallaCompleta;
  $('dns-btema').onclick = alternarTema;
  $('dns-lienzo').addEventListener('click', siguiente);
  document.addEventListener('keydown', teclado(a => ({
    sig: siguiente, ant: anterior, rep: repetir,
    ini: () => ir(0, false), fin: () => ir(PASOS.length - 1, false),
    fs: pantallaCompleta,
  })[a]()));
  const m = /^#p(\d+)$/.exec(location.hash);
  ir(m ? +m[1] - 1 : 0, false);
}

iniciar();
