// Solo para las pruebas (no se publica): valores del laboratorio GP31, del banco B2 y de la actividad A4 que no
// pueden aparecer en las fuentes ni en los ficheros publicados de udp-checksum y udp-datagram.
const fs = require('fs');
const path = require('path');
const HEX = ['e112', '780d', 'b669', 'ba78', '7a0d', '6570', '8a3c', '6f1e', 'b247', '545d', 'aba2'];
const TEXTO = ['gp31', '192.168.1.', '10.0.2.15', '172.31.254.2'];
const NUM = ['44458', '50123', '8888'];
const RE = [...HEX.map(h => [h, new RegExp(`\\b(0x)?${h}\\b`, 'i')]), ...NUM.map(n => [n, new RegExp(`\\b${n}\\b`)]),
  ...TEXTO.map(t => [t, new RegExp(t.replace(/\./g, '\\.'), 'i')])];
// Devuelve [[fichero, valor], …] con lo que encuentre en los ficheros que existan.
function escanear(ficheros) {
  const malos = [];
  for (const f of ficheros) {
    if (!fs.existsSync(f)) continue;
    const t = fs.readFileSync(f, 'utf8');
    for (const [v, re] of RE) if (re.test(t)) malos.push([path.relative(process.cwd(), f), v]);
  }
  return malos;
}
module.exports = { escanear };
