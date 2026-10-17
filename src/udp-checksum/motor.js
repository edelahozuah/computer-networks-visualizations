// Motor del checksum UDP (RFC 768, RFC 1071; Kurose y Ross §3.3.2) y de los tamaños del datagrama UDP.
// Suma en complemento a 1 de palabras de 16 bits: se suman de dos en dos; el acarreo que sale por la
// izquierda (el bit 17) da la vuelta y se suma por la derecha; al final se invierten todos los bits.
// Lo usan dos visualizaciones: udp-checksum (la suma paso a paso) y udp-datagram (tamaños, campos y
// pseudocabecera; esta no calcula el checksum con pseudocabecera, que es trabajo del laboratorio).
const MotorUDP = (() => {
  'use strict';
  const M16 = 0xffff;

  // ------------------------------------------------------------ formato
  const hex16 = w => (w & M16).toString(16).toUpperCase().padStart(4, '0');
  const bin16 = w => (w & M16).toString(2).padStart(16, '0');
  const bin17 = w => (w & 0x1ffff).toString(2).padStart(17, '0');
  const bit = (w, j) => (w >> j) & 1;

  // Lee una palabra escrita en hexadecimal (1 a 4 cifras, con o sin 0x) o en binario (16 cifras, o con 0b).
  // Cuatro cifras como «1010» se leen en hexadecimal; el binario necesita las 16 cifras o el prefijo 0b.
  function leerPalabra(txt) {
    const t = String(txt ?? '').trim().replace(/[\s_]/g, '');
    if (/^[01]{16}$/.test(t)) return parseInt(t, 2);
    if (/^0b[01]{1,16}$/i.test(t)) return parseInt(t.slice(2), 2);
    if (/^(0x)?[0-9a-f]{1,4}$/i.test(t)) return parseInt(t.replace(/^0x/i, ''), 16);
    return null;
  }

  // ------------------------------------------------------------ suma en complemento a 1
  // Suma de dos palabras columna a columna (bit 0 = el de la derecha). Devuelve cada columna con sus bits,
  // el acarreo que entra y el que sale; el resultado de 17 bits; el acarreo final (bit 17) y su vuelta.
  function sumar2(a, b) {
    a &= M16; b &= M16;
    const columnas = [];
    let c = 0;
    for (let j = 0; j < 16; j++) {
      const x = bit(a, j), y = bit(b, j), s = x + y + c;
      columnas.push({ j, a: x, b: y, cin: c, bit: s & 1, cout: s >> 1 });
      c = s >> 1;
    }
    const bruto = a + b;                       // hasta 17 bits
    const acarreo = bruto >> 16;               // el bit 17
    const r = { a, b, columnas, bruto, acarreo, resultado: bruto & M16, vuelta: null };
    if (acarreo) {
      // (bruto & FFFF) ≤ FFFE, así que al sumar el 1 no sale otro acarreo por la izquierda
      const base = bruto & M16;
      r.vuelta = { base, columnas: sumar2(base, 1).columnas, resultado: base + 1 };
      r.resultado = base + 1;
    }
    return r;
  }

  // Suma en complemento a 1 de una lista de palabras, con la traza: una suma parcial por cada palabra a partir
  // de la segunda (pasos[k] suma la palabra k+1 a lo acumulado).
  function sumaC1(palabras) {
    const ps = palabras.map(w => w & M16);
    if (!ps.length) return { suma: 0, pasos: [] };
    let acc = ps[0];
    const pasos = [];
    for (let i = 1; i < ps.length; i++) {
      const p = sumar2(acc, ps[i]);
      p.i = i;
      pasos.push(p);
      acc = p.resultado;
    }
    return { suma: acc, pasos };
  }

  const complemento = w => ~w & M16;
  const checksum = palabras => complemento(sumaC1(palabras).suma);

  // Receptor, forma de Kurose: suma todas las palabras, el checksum incluido; sin error sale FFFF.
  function verifica(palabrasConChecksum) {
    const suma = sumaC1(palabrasConChecksum).suma;
    return { suma, ok: suma === M16 };
  }
  // Receptor, forma de la s.31: pone el campo a 0, recalcula y compara con el checksum recibido.
  function verificaRecalculo(datos, recibido) {
    const calculado = checksum([...datos, 0]);
    return { calculado, recibido: recibido & M16, ok: calculado === (recibido & M16) };
  }

  // Bytes → palabras de 16 bits (el primer byte es el de más peso). Con un número impar de bytes se añade un
  // byte de relleno a 0 al final, que solo existe para el cálculo: no se transmite.
  function palabrasDeBytes(bytes) {
    const b = Array.from(bytes, x => x & 0xff);
    const relleno = b.length % 2 === 1;
    if (relleno) b.push(0);
    const palabras = [];
    for (let i = 0; i < b.length; i += 2) palabras.push((b[i] << 8) | b[i + 1]);
    return { palabras, relleno };
  }
  const bytesDePalabras = palabras => palabras.flatMap(w => [(w >> 8) & 0xff, w & 0xff]);

  // ------------------------------------------------------------ ejercicios aleatorios
  // Valores que no salen nunca en los ejercicios: los de la actividad A4 (s.32–33, se hace en papel) y los de
  // la captura y los bancos del laboratorio GP31.
  const RESERVADOS = new Set([0x8A3C, 0x6F1E, 0xB247, 0xE112, 0x780D, 0xB669, 0xBA78]);
  function rngSemilla(semilla) {          // mulberry32
    let a = semilla >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // n palabras al azar con al menos un acarreo que da la vuelta (así se ve el bit 17) y sin valores reservados.
  function aleatorio(rng, n = 3) {
    rng = rng || Math.random;
    for (let intento = 0; intento < 1000; intento++) {
      const ps = Array.from({ length: n }, () => Math.floor(rng() * 0x10000));
      const s = sumaC1(ps);
      if (!s.pasos.some(p => p.acarreo)) continue;
      if (ps.some(w => RESERVADOS.has(w)) || RESERVADOS.has(s.suma) || RESERVADOS.has(complemento(s.suma))) continue;
      if (new Set(ps).size < n || ps.some(w => w === 0)) continue;
      return ps;
    }
    return [0x4E21, 0xC3B7, 0x9A05].slice(0, n);
  }

  // Dos bits que se compensan: en la misma columna, un 0 → 1 en una palabra y un 1 → 0 en otra (+2^j y −2^j).
  // La suma no cambia, así que el receptor no detecta el error. Devuelve [[i, j], [k, j]] o null.
  function bitsQueSeCompensan(palabras, bloqueados) {
    bloqueados = bloqueados || (() => false);
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < palabras.length; i++)
        for (let k = 0; k < palabras.length; k++)
          if (i !== k && bit(palabras[i], j) === 0 && bit(palabras[k], j) === 1 && !bloqueados(i, j) && !bloqueados(k, j))
            return i < k ? [[i, j], [k, j]] : [[k, j], [i, j]];
    return null;
  }

  // ------------------------------------------------------------ tamaños y campos del datagrama UDP (V3)
  const TAM = { cabUDP: 8, maxLongitud: 65535, maxCarga: 65535 - 8, cabIPv4: 20, maxCargaIPv4: 65535 - 20 - 8, pseudo: 12, protoUDP: 17, protoTCP: 6 };
  const entero = x => Number.isInteger(x);
  // Longitud UDP = cabecera (8 B) + datos; null si la carga no cabe en el campo de 16 bits.
  const longitudUDP = carga => (entero(carga) && carga >= 0 && carga <= TAM.maxCarga ? carga + TAM.cabUDP : null);
  const cargaDeLongitud = L => (entero(L) && L >= TAM.cabUDP && L <= TAM.maxLongitud ? L - TAM.cabUDP : null);
  // ¿Cabe en un único datagrama IPv4 (cabecera de 20 B, Longitud total ≤ 65 535)?
  const cabeEnIPv4 = carga => entero(carga) && carga >= 0 && carga + TAM.cabUDP + TAM.cabIPv4 <= TAM.maxLongitud;
  // Campos de la cabecera UDP en filas de 32 bits: fila, bit inicial y número de bits.
  const CAMPOS_UDP = [
    { id: 'po', fila: 0, desde: 0, bits: 16 }, { id: 'pd', fila: 0, desde: 16, bits: 16 },
    { id: 'lon', fila: 1, desde: 0, bits: 16 }, { id: 'cs', fila: 1, desde: 16, bits: 16 }
  ];
  function ipBytes(ip) {
    const m = String(ip).trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    const b = m.slice(1).map(Number);
    return b.every(x => x <= 255) ? b : null;
  }
  // Pseudocabecera IPv4 (12 B): IP origen (4), IP destino (4), 0x00 (1), Protocolo (1), Longitud UDP (2).
  // No se transmite: cada extremo la reconstruye con los datos de la cabecera IP y la Longitud UDP.
  function pseudocabecera(ipO, ipD, longitud, protocolo = TAM.protoUDP) {
    const o = ipBytes(ipO), d = ipBytes(ipD);
    if (!o || !d || !entero(longitud) || longitud < 0 || longitud > M16) return null;
    const bytes = [...o, ...d, 0, protocolo & 0xff, (longitud >> 8) & 0xff, longitud & 0xff];
    return {
      bytes,
      campos: [
        { id: 'ipo', bytes: bytes.slice(0, 4) }, { id: 'ipd', bytes: bytes.slice(4, 8) },
        { id: 'cero', bytes: [0] }, { id: 'proto', bytes: [protocolo & 0xff] }, { id: 'lon', bytes: bytes.slice(10, 12) }
      ]
    };
  }
  // Los 8 B de la cabecera UDP (el checksum, el que se indique; 0 = no calculado en IPv4).
  const cabeceraUDP = (po, pd, longitud, cs = 0) => [po >> 8, po & 0xff, pd >> 8, pd & 0xff, longitud >> 8, longitud & 0xff, cs >> 8, cs & 0xff].map(x => x & 0xff);

  return {
    hex16, bin16, bin17, bit, leerPalabra, sumar2, sumaC1, complemento, checksum, verifica, verificaRecalculo,
    palabrasDeBytes, bytesDePalabras, RESERVADOS, rngSemilla, aleatorio, bitsQueSeCompensan,
    TAM, longitudUDP, cargaDeLongitud, cabeEnIPv4, CAMPOS_UDP, ipBytes, pseudocabecera, cabeceraUDP
  };
})();
if (typeof module !== 'undefined') module.exports = MotorUDP;
