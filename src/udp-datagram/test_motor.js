// Pruebas de lo que udp-datagram usa del motor de udp-checksum (tamaños, campos y pseudocabecera) y de que
// la página no contiene valores del laboratorio GP31 ni del banco B2.
const fs = require('fs');
const path = require('path');
const M = require('../udp-checksum/motor.js');
let fallos = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.error('FALLO: ' + m); } };

// Tamaños de la s.27
ok(M.TAM.cabUDP === 8 && M.TAM.maxLongitud === 65535 && M.TAM.maxCarga === 65527 && M.TAM.maxCargaIPv4 === 65507, 'límites');
ok(M.longitudUDP(0) === 8 && M.longitudUDP(3000) === 3008 && M.longitudUDP(65527) === 65535 && M.longitudUDP(65528) === null && M.longitudUDP(-1) === null && M.longitudUDP(1.5) === null, 'longitudUDP');
ok(M.cargaDeLongitud(39) === 31 && M.cargaDeLongitud(8) === 0 && M.cargaDeLongitud(7) === null, 'cargaDeLongitud (pregunta de la s.27)');
ok(M.cabeEnIPv4(0) && M.cabeEnIPv4(65507) && !M.cabeEnIPv4(65508) && !M.cabeEnIPv4(65527), 'cabe en IPv4');
for (let c = 0; c <= M.TAM.maxCarga; c += 97) if (M.cargaDeLongitud(M.longitudUDP(c)) !== c) { ok(false, 'ida y vuelta ' + c); break; }
// Campos en filas de 32 bits: 4 campos de 16 bits, 8 B en 2 filas
ok(M.CAMPOS_UDP.length === 4 && M.CAMPOS_UDP.every(c => c.bits === 16) && M.CAMPOS_UDP.reduce((a, c) => a + c.bits, 0) === 64, 'cabecera de 8 B');
ok(M.CAMPOS_UDP.map(c => `${c.fila}:${c.desde}`).join(' ') === '0:0 0:16 1:0 1:16', 'posición de los campos');
// Pseudocabecera del ejemplo (A → C, direcciones de documentación RFC 5737)
const ph = M.pseudocabecera('203.0.113.7', '198.51.100.20', 3008);
ok(ph.bytes.length === 12, '12 B');
ok(ph.bytes.map(b => b.toString(16).padStart(2, '0')).join('') === 'cb007107c63364140011' + '0bc0', 'bytes de la pseudocabecera ' + ph.bytes);
ok(ph.campos.map(c => c.id).join(',') === 'ipo,ipd,cero,proto,lon' && ph.campos.reduce((a, c) => a + c.bytes.length, 0) === 12, 'campos 4+4+1+1+2');
ok(M.pseudocabecera('203.0.113.7', '198.51.100.20', 8, 6).bytes[9] === 6, 'protocolo TCP = 6');
ok(M.cabeceraUDP(9157, 6428, 3008).length === 8, 'cabecera UDP de 8 B');

// La página no usa valores de GP31 ni del banco B2
const app = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const PROHIBIDOS = ['192.168.1.10', '192.168.1.20', '192.168.1.30', '10.0.2.15', '172.31.254.2', '10.0.0.5', '50123', '8888', '41000', '50200', '9999', '44458', 'e112', '780d', 'b669', 'ba78', '8A3C', '6F1E', 'B247', '545D'];
for (const p of PROHIBIDOS) ok(!app.toLowerCase().includes(p.toLowerCase()), 'valor prohibido en app.html: ' + p);

console.log(fallos ? `${fallos} de ${n} pruebas fallan` : `OK: ${n} pruebas`);
process.exit(fallos ? 1 : 0);
