#!/bin/sh
# Regenerates thumbnails/<id>.jpg (720 × 458 px) from the Spanish file of each
# visualization with headless Chrome and macOS `sips`. Pass ids to limit it.
#   scripts/thumbnails.sh                 # all
#   scripts/thumbnails.sh dns-names       # one
# Set CHROME to the browser binary if it is not Google Chrome on macOS.
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
tmp=$(mktemp -d)
python3 - "$@" <<'PY' | while read -r id file; do
import sys, yaml
cat = yaml.safe_load(open("catalog.yml", encoding="utf-8"))
only = set(sys.argv[1:])
for v in cat["visualizations"]:
    if not only or v["id"] in only:
        print(v["id"], v["files"]["es"])
PY
  "$CHROME" --headless=new --hide-scrollbars --window-size=1440,916 --virtual-time-budget=4000 \
    --screenshot="$tmp/$id.png" "file://$PWD/$file" 2>/dev/null
  sips -s format jpeg -s formatOptions 85 -Z 720 "$tmp/$id.png" --out "thumbnails/$id.jpg" >/dev/null
  echo "thumbnails/$id.jpg"
done
rm -rf "$tmp"
