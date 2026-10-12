#!/usr/bin/env python3
"""Deriva los dos ficheros publicados (ES y EN) de dist/app.html: fija el idioma, quita el
conmutador ES/EN y, en la copia inglesa, hornea los textos de data-en / data-en-html / data-en-aria.
Uso: python3 publicar.py dist/app.html ../../02-application-layer/http/http-cache"""
import html, re, sys
from pathlib import Path

src, dest = Path(sys.argv[1]), sys.argv[2]
app = src.read_text(encoding="utf-8")
TITULO = {"es": "Caché del navegador: ¿caché o servidor?", "en": "Browser cache: cache or server?"}

def comun(t, lang):
    t = re.sub(r"<!--@@IDIOMA@@-->.*?<!--@@/IDIOMA@@-->", "", t, flags=re.S)
    t = re.sub(r"/\*@@IDIOMA@@\*/.*?/\*@@/IDIOMA@@\*/", "", t, flags=re.S)
    t = t.replace("/*@@IDIOMA-FIJO@@*/", f"estado.vista.idioma = '{lang}';  // idioma fijo en cada copia")
    t = re.sub(r"<title>[^<]*</title>", f"<title>{TITULO[lang]}</title>", t, count=1)
    return t

def hornear_en(t):
    # texto: <tag … data-en="X" …>…</tag> → <tag …>X</tag> (el contenido ES no anida la misma etiqueta)
    t = re.sub(r'<(\w+)([^<>]*?)\s+data-en="([^"]*)"([^<>]*)>(.*?)</\1>',
               lambda m: f'<{m.group(1)}{m.group(2)}{m.group(4)}>{m.group(3)}</{m.group(1)}>', t, flags=re.S)
    # html: <h1 … data-en-html="X">…</h1>
    t = re.sub(r'<(h1[^<>]*?)\s+data-en-html="([^"]*)"([^<>]*)>.*?</h1>', lambda m: f'<{m.group(1)}{m.group(3)}>{html.unescape(m.group(2))}</h1>', t, flags=re.S)
    # aria: aria-label="ES" data-en-aria="X"
    t = re.sub(r'aria-label="[^"]*"\s+data-en-aria="([^"]*)"', r'aria-label="\1"', t)
    return t

for lang in ("es", "en"):
    t = comun(app, lang)
    if lang == "en":
        t = hornear_en(t)
        resto = [l for l in t.split("\n") if re.search(r'data-en(-html|-aria)?="', l)]
        assert not resto, "quedan textos sin hornear: " + resto[0][:120]
    doc = (f'<!doctype html>\n<html lang="{lang}">\n<head>\n<meta charset="utf-8">\n'
           f'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n{t}\n</body>\n</html>\n')
    # el <title> y el <style> van en <head>; el resto en <body>
    doc = doc.replace("</style>\n\n<div class=\"envoltura\">", "</style>\n</head>\n<body>\n\n<div class=\"envoltura\">", 1)
    assert doc.count("<body>") == 1 and doc.count("</head>") == 1, "estructura inesperada"
    Path(f"{dest}.{lang}.html").write_text(doc, encoding="utf-8")
    print(f"{dest}.{lang}.html")
