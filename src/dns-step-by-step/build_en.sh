#!/bin/sh
# Versión inglesa: genera app_en.html e index_en.html con en/app.html y en/pasos.js
# (same dibujo.js and motor.js; the interface strings of motor.js are translated here).
cd "$(dirname "$0")" && mkdir -p dist
node -e "
const fs = require('fs');
const src = ['dibujo.js', 'en/pasos.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const { PASOS } = new Function(src + '\nreturn { PASOS };')();
PASOS.forEach((p, i) => { [...p.escena()].forEach(e => { if (/NaN|undefined/.test(e.html)) { console.error('paso ' + (i + 1) + ': ' + e.id); process.exit(1); } }); });
" || exit 1
perl -pe '
s/Paso \$\{i \+ 1\}/Step \${i + 1}/;
s/ · Acto \$\{p\.acto\}/ · Act \${p.acto}/;
s/'\''Tema: '\'' \+ \(nuevo === '\''light'\'' \? '\''claro'\'' : nuevo === '\''dark'\'' \? '\''oscuro'\''/'\''Theme: '\'' + (nuevo === '\''light'\'' ? '\''light'\'' : nuevo === '\''dark'\'' ? '\''dark'\''/;
s/og\.label = `Acto /og.label = `Act /;
' motor.js > dist/.motor_en.tmp
cat dibujo.js en/pasos.js dist/.motor_en.tmp > dist/.js.tmp
awk 'FNR==NR { js = js $0 "\n"; next } /\/\*@@JS@@\*\// { printf "%s", js; next } { print }' dist/.js.tmp en/app.html > dist/app_en.html
rm -f dist/.js.tmp dist/.motor_en.tmp
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'; awk '{ print } /^<\/style>$/ && !done { print "</head>"; print "<body>"; done = 1 }' dist/app_en.html; printf '\n</body>\n</html>\n'; } > dist/index_en.html
echo "dist/index_en.html generated"
