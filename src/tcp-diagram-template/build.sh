#!/bin/sh
# Derives the published files ../../03-transport-layer/tcp-diagram-template.{es,en}.html from the
# bilingual source app.html (texts as ⟦español‖english⟧) and checks that their scripts parse.
cd "$(dirname "$0")" || exit 1
python3 publicar.py app.html ../../03-transport-layer/tcp-diagram-template || exit 1
for f in ../../03-transport-layer/tcp-diagram-template.es.html ../../03-transport-layer/tcp-diagram-template.en.html; do
  awk '/<script>/{s=1;next}/<\/script>/{s=0}s' "$f" |
    node -e "new Function(require('fs').readFileSync(0, 'utf8'))" || { echo "$f: script does not parse"; exit 1; }
done
