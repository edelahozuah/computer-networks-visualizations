#!/bin/sh
# Builds dist/index.html (a complete document, bilingual ES/EN toggle) from app.html.
# The published files ../../01-introduction/delay-diagram.{es,en}.html are derived
# from this build with the language fixed and the language switch removed.
cd "$(dirname "$0")" && mkdir -p dist
{ printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'; cat app.html; printf '\n</body>\n</html>\n'; } > dist/index.html
echo "dist/index.html generated"
