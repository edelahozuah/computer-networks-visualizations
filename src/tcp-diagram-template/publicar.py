#!/usr/bin/env python3
"""Deriva los dos ficheros publicados (ES y EN) de app.html. Los textos van como ⟦español‖english⟧
y el idioma del documento como @@LANG@@; cada copia se queda con su idioma.
Uso: python3 publicar.py app.html ../../03-transport-layer/tcp-diagram-template"""
import re, sys
from pathlib import Path

src, dest = Path(sys.argv[1]), sys.argv[2]
app = src.read_text(encoding="utf-8")
PAR = re.compile(r"⟦(.*?)‖(.*?)⟧", re.S)

for n, lang in enumerate(("es", "en")):
    t = PAR.sub(lambda m: m.group(n + 1), app).replace("@@LANG@@", lang)
    for marca in ("⟦", "‖", "⟧", "@@"):
        assert marca not in t, f"{lang}: queda un marcador {marca!r} sin resolver"
    Path(f"{dest}.{lang}.html").write_text(t, encoding="utf-8")
    print(f"{dest}.{lang}.html")
