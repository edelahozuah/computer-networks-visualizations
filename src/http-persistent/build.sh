#!/bin/sh
# Runs the engine tests and builds dist/index.html (a complete document, bilingual
# ES/EN toggle) by inserting motor.js at the /*@@MOTOR@@*/ marker of app.html.
# The published files ../../02-application-layer/http/http-persistent.{es,en}.html
# are derived from this build with the language fixed and the switch removed.
cd "$(dirname "$0")" && mkdir -p dist
node test_motor.js || exit 1
awk 'FNR==NR { motor = motor $0 "\n"; next } /\/\*@@MOTOR@@\*\// { printf "%s", motor; next } { print }' motor.js app.html > dist/app.html
{ printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'; cat dist/app.html; printf '\n</body>\n</html>\n'; } > dist/index.html
echo "dist/index.html generated"
