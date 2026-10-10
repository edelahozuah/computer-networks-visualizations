#!/bin/sh
# Runs the step tests and builds dist/index.html (Spanish) by inserting dibujo.js + pasos.js + motor.js at the /*@@JS@@*/
# marker of app.html. build_en.sh does the same for the English version.
# The published files ../../02-application-layer/dns/dns-step-by-step.{es,en}.html
# are these builds.
cd "$(dirname "$0")" && mkdir -p dist
node test_pasos.js || exit 1
cat dibujo.js pasos.js motor.js > dist/.js.tmp
awk 'FNR==NR { js = js $0 "\n"; next } /\/\*@@JS@@\*\// { printf "%s", js; next } { print }' dist/.js.tmp app.html > dist/app.html
rm -f dist/.js.tmp
# Complete document: the fragment's <title>, <link> and <style> go in <head>; the rest in <body>.
{ printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'; awk '{ print } /^<\/style>$/ && !done { print "</head>"; print "<body>"; done = 1 }' dist/app.html; printf '\n</body>\n</html>\n'; } > dist/index.html
echo "dist/index.html generated"
