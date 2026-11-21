#!/bin/sh
# Tests the engine, derives the published files ../../03-transport-layer/tcp-byte-stream.{es,en}.html
# from the bilingual source app.html (fixed texts as ⟦español‖english⟧, language as @@LANG@@) and
# checks that their scripts parse.
cd "$(dirname "$0")" || exit 1
node test_motor.js || exit 1
python3 publicar.py app.html ../../03-transport-layer/tcp-byte-stream || exit 1
for f in ../../03-transport-layer/tcp-byte-stream.es.html ../../03-transport-layer/tcp-byte-stream.en.html; do
  awk '/<script>/{s=1;next}/<\/script>/{s=0}s' "$f" |
    node -e "new Function(require('fs').readFileSync(0, 'utf8'))" || { echo "$f: script does not parse"; exit 1; }
done
