#!/bin/sh
# Runs the step tests and builds dist/index.html (Spanish, with speaker notes and
# presenter window) by inserting dibujo.js + pasos.js + motor.js at the /*@@JS@@*/
# marker of app.html. build_en.sh does the same for the English version.
# The published files ../../02-application-layer/dns/dns-step-by-step.{es,en}.html
# are derived from these builds without the notes and presenter window.
cd "$(dirname "$0")" && mkdir -p dist
node test_pasos.js || exit 1
cat dibujo.js pasos.js motor.js > dist/.js.tmp
awk 'FNR==NR { js = js $0 "\n"; next } /\/\*@@JS@@\*\// { printf "%s", js; next } { print }' dist/.js.tmp app.html > dist/app.html
rm -f dist/.js.tmp
{ printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'; cat dist/app.html; printf '\n</body>\n</html>\n'; } > dist/index.html
echo "dist/index.html generated"
