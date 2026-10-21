#!/bin/sh
# Runs the engine tests, builds dist/index.html (bilingual ES/EN toggle) by inserting motor.js at the
# /*@@MOTOR@@*/ marker of app.html, and derives the published files
# ../../03-transport-layer/reliable-data-transfer.{es,en}.html with the language fixed (publicar.py).
cd "$(dirname "$0")" && mkdir -p dist ../../03-transport-layer
node test_motor.js || exit 1
awk 'FNR==NR { motor = motor $0 "\n"; next } /\/\*@@MOTOR@@\*\// { printf "%s", motor; next } { print }' motor.js app.html > dist/app.html
{ printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'; cat dist/app.html; printf '\n</body>\n</html>\n'; } > dist/index.html
python3 publicar.py dist/app.html ../../03-transport-layer/reliable-data-transfer || exit 1
echo "dist/index.html generated"
