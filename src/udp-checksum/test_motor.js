// Pruebas del motor del checksum UDP: casos del deck y del libro, la trama 1 de dns-udp.pcap (GP31, solo
// aquí), errores de uno y dos bits, relleno, tamaños y 10 000 casos aleatorios contra otra implementación.
const M = require('./motor.js');
let fallos = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.error('FALLO: ' + m); } };
const b = s => parseInt(s, 2);

// Kurose §3.3.2 (s.29)
const K = [b('0110011001100000'), b('0101010101010101'), b('1000111100001100')];
let s = M.sumaC1(K);
ok(M.bin16(s.suma) === '0100101011000010', 'Kurose suma ' + M.bin16(s.suma));
ok(M.bin16(M.checksum(K)) === '1011010100111101', 'Kurose checksum ' + M.bin16(M.checksum(K)));
ok(M.hex16(M.checksum(K)) === 'B53D', 'Kurose checksum hex');
ok(s.pasos.length === 2 && s.pasos[0].acarreo === 0 && M.bin16(s.pasos[0].resultado) === '1011101110110101', 'Kurose suma parcial 1');
ok(s.pasos[1].acarreo === 1 && M.bin17(s.pasos[1].bruto) === '10100101011000001' && s.pasos[1].vuelta && M.bin16(s.pasos[1].vuelta.base) === '0100101011000001', 'Kurose acarreo que da la vuelta');
ok(M.verifica([...K, M.checksum(K)]).suma === 0xffff && M.verifica([...K, M.checksum(K)]).ok, 'Kurose receptor FFFF');
ok(M.verificaRecalculo(K, 0xB53D).ok && M.verificaRecalculo(K, 0xB53C).ok === false, 'Kurose recalcular y comparar');

// Actividad A4 (s.32–33): solo en el test, no en la interfaz
const A4 = [0x8A3C, 0x6F1E, 0xB247];
s = M.sumaC1(A4);
ok(M.hex16(s.pasos[0].resultado) === 'F95A' && s.pasos[1].bruto === 0x1ABA1 && M.hex16(s.suma) === 'ABA2', 'A4 sumas parciales');
ok(M.hex16(M.checksum(A4)) === '545D' && M.bin16(M.checksum(A4)) === '0101010001011101', 'A4 checksum 545D');
ok(M.hex16(M.verifica([...A4, 0x545D]).suma) === 'FFFF', 'A4 receptor FFFF');
// c) dos bits que se compensan (8A3E, 6F1C): no se detecta; d) un bit (B246): se detecta con FFFE
ok(M.verifica([0x8A3E, 0x6F1C, 0xB247, 0x545D]).ok === true, 'A4 c) error compensado no detectado');
const d = M.verifica([0x8A3C, 0x6F1E, 0xB246, 0x545D]);
ok(d.ok === false && M.hex16(d.suma) === 'FFFE', 'A4 d) un bit detectado: ' + M.hex16(d.suma));
// bitsQueSeCompensan encuentra un par válido y la suma no cambia
const par = M.bitsQueSeCompensan(K);
ok(par && par[0][1] === par[1][1], 'par en la misma columna');
const Kf = K.slice(); par.forEach(([i, j]) => { Kf[i] ^= 1 << j; });
ok(M.sumaC1(Kf).suma === M.sumaC1(K).suma && M.verifica([...Kf, M.checksum(K)]).ok, 'el par se compensa');

// Relleno de un número impar de bytes
let pb = M.palabrasDeBytes([0x12, 0x34, 0x56]);
ok(pb.relleno && pb.palabras.length === 2 && pb.palabras[1] === 0x5600, 'relleno con byte 0');
pb = M.palabrasDeBytes([0x12, 0x34]);
ok(!pb.relleno && pb.palabras[0] === 0x1234, 'sin relleno');
ok(M.palabrasDeBytes([]).palabras.length === 0, 'cero bytes');
ok(M.checksum(M.palabrasDeBytes([0xAB]).palabras) === M.checksum([0xAB00]), 'relleno = byte bajo a 0');

// GP31, dns-udp.pcap trama 1 (solo en el test): checksum correcto 0xba78 reconstruido con la pseudocabecera.
// En la captura el campo vale 0xb669 (offloading); con el campo a 0 y la pseudocabecera sale 0xba78.
const udp1 = Buffer.from('adaa003500270000bb6e010000010000000000000377777706676f6f676c650265730000010001', 'hex');
ok(udp1.length === 39 && ((udp1[4] << 8) | udp1[5]) === 39, 'trama 1: Longitud UDP 39 (impar)');
const ph = M.pseudocabecera('10.0.2.15', '172.31.254.2', udp1.length);
ok(ph && ph.bytes.length === 12 && ph.bytes[8] === 0 && ph.bytes[9] === 17 && ph.bytes[11] === 39, 'pseudocabecera de 12 B');
const pw = M.palabrasDeBytes([...ph.bytes, ...udp1]);
ok(pw.relleno, 'trama 1 necesita relleno');
ok(M.checksum(pw.palabras) === 0xba78, 'trama 1 checksum 0x' + M.checksum(pw.palabras).toString(16));
const conCs = Buffer.from(udp1); conCs[6] = 0xba; conCs[7] = 0x78;
ok(M.verifica(M.palabrasDeBytes([...ph.bytes, ...conCs]).palabras).ok, 'trama 1 receptor FFFF');
conCs[7] = 0x69; conCs[6] = 0xb6;
ok(!M.verifica(M.palabrasDeBytes([...ph.bytes, ...conCs]).palabras).ok, 'trama 1 con 0xb669 no verifica');

// Lectura de palabras
ok(M.leerPalabra('B53D') === 0xB53D && M.leerPalabra('0xb53d') === 0xB53D && M.leerPalabra('1011010100111101') === 0xB53D, 'leer hex y bin');
ok(M.leerPalabra('0b101') === 5 && M.leerPalabra('1010') === 0x1010 && M.leerPalabra('1011 0101 0011 1101') === 0xB53D, 'leer formas cortas');
ok(M.leerPalabra('12345') === null && M.leerPalabra('xyz') === null && M.leerPalabra('') === null, 'leer inválidas');

// Tamaños (V3)
ok(M.longitudUDP(0) === 8 && M.longitudUDP(31) === 39 && M.longitudUDP(3000) === 3008 && M.longitudUDP(65527) === 65535 && M.longitudUDP(65528) === null, 'longitudUDP');
ok(M.cargaDeLongitud(39) === 31 && M.cargaDeLongitud(7) === null && M.cargaDeLongitud(65536) === null, 'cargaDeLongitud');
ok(M.cabeEnIPv4(65507) && !M.cabeEnIPv4(65508) && M.TAM.maxCarga === 65527 && M.TAM.maxCargaIPv4 === 65507, 'límites IPv4');
ok(M.cabeceraUDP(9157, 6428, 39).join(',') === [0x23, 0xC5, 0x19, 0x1C, 0, 39, 0, 0].join(','), 'cabecera UDP en bytes');
ok(M.pseudocabecera('1.2.3', '1.2.3.4', 8) === null && M.pseudocabecera('1.2.3.256', '1.2.3.4', 8) === null, 'pseudocabecera inválida');

// Independiente: suma entera de todas las palabras y plegado del acarreo al final
function independiente(ws) { let t = 0; for (const w of ws) t += w; while (t > 0xffff) t = (t & 0xffff) + Math.floor(t / 0x10000); return t; }
const rng = M.rngSemilla(20261017);
let un = 0, dos = 0;
for (let caso = 0; caso < 10000; caso++) {
  const k = 2 + Math.floor(rng() * 5);
  const ws = Array.from({ length: k }, () => Math.floor(rng() * 0x10000));
  const r = M.sumaC1(ws);
  // si todas son 0 la suma es 0000; si no, el plegado da lo mismo (con 0000 ≡ FFFF solo si todas son 0)
  if (r.suma !== independiente(ws)) { ok(false, 'aleatorio ' + ws.map(M.hex16)); break; }
  // traza coherente: los bits de cada columna reconstruyen el resultado de 17 bits
  for (const p of r.pasos) {
    const v = p.columnas.reduce((a, c) => a | (c.bit << c.j), 0) | (p.columnas[15].cout << 16);
    if (v !== p.bruto || p.acarreo !== p.columnas[15].cout || (p.vuelta && p.vuelta.columnas.at(-1).cout)) { ok(false, 'traza ' + ws.map(M.hex16)); break; }
  }
  const cs = M.checksum(ws);
  if (!M.verifica([...ws, cs]).ok) { ok(false, 'receptor FFFF ' + ws.map(M.hex16)); break; }
  if (!M.verificaRecalculo(ws, cs).ok) { ok(false, 'recalcular ' + ws.map(M.hex16)); break; }
  // error de un bit en cualquier palabra (checksum incluido): siempre se detecta
  const rec = [...ws, cs];
  const i = Math.floor(rng() * rec.length), j = Math.floor(rng() * 16);
  const e = rec.slice(); e[i] ^= 1 << j;
  if (M.verifica(e).ok || M.verificaRecalculo(e.slice(0, -1), e.at(-1)).ok) { ok(false, `un bit no detectado ${rec.map(M.hex16)} i=${i} j=${j}`); break; }
  un++;
  // dos bits que se compensan: nunca se detectan
  const pr = M.bitsQueSeCompensan(ws);
  if (pr) { const f = rec.slice(); pr.forEach(([a, c]) => { f[a] ^= 1 << c; }); if (!M.verifica(f).ok) { ok(false, 'compensado detectado'); break; } dos++; }
}
ok(un === 10000 && dos > 9000, `aleatorios: ${un} de un bit, ${dos} compensados`);
// error de un bit exhaustivo sobre Kurose y A4
for (const ws of [K, A4]) {
  const rec = [...ws, M.checksum(ws)];
  let det = 0;
  rec.forEach((w, i) => { for (let j = 0; j < 16; j++) { const e = rec.slice(); e[i] ^= 1 << j; if (!M.verifica(e).ok) det++; } });
  ok(det === rec.length * 16, 'un bit exhaustivo ' + det);
}
// ejercicios aleatorios: con acarreo que da la vuelta y sin valores reservados
const r2 = M.rngSemilla(7);
for (let t = 0; t < 500; t++) {
  const ws = M.aleatorio(r2, 3), sm = M.sumaC1(ws);
  if (!sm.pasos.some(p => p.acarreo) || ws.some(w => M.RESERVADOS.has(w)) || M.RESERVADOS.has(M.checksum(ws))) { ok(false, 'aleatorio reservado ' + ws.map(M.hex16)); break; }
}

console.log(fallos ? `${fallos} de ${n} pruebas fallan` : `OK: ${n} pruebas (10 000 aleatorias contra una implementación independiente)`);
process.exit(fallos ? 1 : 0);
