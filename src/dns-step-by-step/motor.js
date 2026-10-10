// Motor: render por diferencias sobre el SVG, vuelos de mensajes, navegación, notas y presentador.

const SVGNS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const modoPresentador = new URLSearchParams(location.search).get('modo') === 'presentador';

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
let actual = -1, ventanaPresentador = null;

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
  pintarNotas($('dns-notas'), i);
  avisarPresentador();
}

const siguiente = () => { if (actual < PASOS.length - 1) ir(actual + 1, true); };
const anterior = () => ir(actual - 1, false);

function repetir() {
  if (actual <= 0) return ir(actual, true);
  const i = actual;
  render(construir(i - 1), true);
  setTimeout(() => ir(i, true), 350);
}

// ───────────── Notas ─────────────
function htmlNotas(i) {
  const p = PASOS[i], sig = PASOS[i + 1];
  let h = `<p class="n-cab">Paso ${i + 1} / ${PASOS.length} · Acto ${p.acto} · <b>${esc(p.titulo)}</b></p>`;
  h += p.notas.map(t => `<p>${esc(t)}</p>`).join('');
  if (p.pregunta) h += `<p class="n-preg"><b>Pregunta al aula.</b> ${esc(p.pregunta)}</p>`;
  if (p.ojo) h += `<p class="n-ojo"><b>Ojo.</b> ${esc(p.ojo)}</p>`;
  h += `<p class="n-sig">Siguiente: ${sig ? esc(sig.titulo) : '— fin —'}</p>`;
  return h;
}

function pintarNotas(el, i) { if (el) el.innerHTML = htmlNotas(i); }

function pintarControles() {
  $('dns-cont').textContent = `${actual + 1} / ${PASOS.length}`;
  $('dns-indice').value = String(actual);
}

// ───────────── Ventana del presentador (postMessage entre ventanas) ─────────────
function avisarPresentador() {
  if (ventanaPresentador && !ventanaPresentador.closed) ventanaPresentador.postMessage({ dns: 'paso', i: actual }, '*');
}

function abrirPresentador() {
  const url = location.href.split('#')[0].split('?')[0] + '?modo=presentador';
  ventanaPresentador = window.open(url, 'dnsPresentador', 'width=900,height=720');
}

window.addEventListener('message', ev => {
  const d = ev.data;
  if (!d || typeof d !== 'object' || !d.dns) return;
  if (modoPresentador) {
    if (d.dns === 'paso') { pintarNotas($('dns-notas-pres'), d.i); $('dns-pres-cont').textContent = `${d.i + 1} / ${PASOS.length}`; }
  } else {
    if (d.dns === 'hola') { ventanaPresentador = ev.source; avisarPresentador(); }
    if (d.dns === 'sig') siguiente();
    if (d.dns === 'ant') anterior();
    if (d.dns === 'rep') repetir();
  }
});

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
    else if (k === 'n' || k === 'N') accion('notas');
    else if (k === 'f' || k === 'F') accion('fs');
    else if (k === 'p' || k === 'P') accion('pres');
  };
}

function iniciar() {
  if (modoPresentador) {
    $('dns-app').hidden = true;
    $('dns-pres').hidden = false;
    document.title = 'Presentador · DNS';
    const enviar = a => window.opener && window.opener.postMessage({ dns: a }, '*');
    $('dns-pres-ant').onclick = () => enviar('ant');
    $('dns-pres-sig').onclick = () => enviar('sig');
    $('dns-pres-rep').onclick = () => enviar('rep');
    document.addEventListener('keydown', teclado(a => { if (['sig', 'ant', 'rep'].includes(a)) enviar(a); }));
    if (window.opener) enviar('hola'); else $('dns-notas-pres').textContent = 'Abre esta ventana con la tecla P desde la animación.';
    return;
  }
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
  $('dns-bnotas').onclick = () => { $('dns-notas').hidden = !$('dns-notas').hidden; };
  $('dns-bpres').onclick = abrirPresentador;
  $('dns-bfs').onclick = pantallaCompleta;
  $('dns-btema').onclick = alternarTema;
  $('dns-lienzo').addEventListener('click', siguiente);
  document.addEventListener('keydown', teclado(a => ({
    sig: siguiente, ant: anterior, rep: repetir,
    ini: () => ir(0, false), fin: () => ir(PASOS.length - 1, false),
    notas: () => { $('dns-notas').hidden = !$('dns-notas').hidden; },
    fs: pantallaCompleta, pres: abrirPresentador,
  })[a]()));
  const m = /^#p(\d+)$/.exec(location.hash);
  ir(m ? +m[1] - 1 : 0, false);
}

iniciar();
