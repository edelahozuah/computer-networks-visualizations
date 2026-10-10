#!/usr/bin/env python3
"""Checks catalog.yml and the HTML files against each other.

- every visualization has id, topic, title/description/summary/concepts in es and en,
  two existing files, a thumbnail and (if given) a source directory;
- every file is a self-contained HTML document: <title>, matching lang attribute,
  no external scripts or stylesheets except Google Fonts, no leftovers of a site's
  styling (the web that embeds them adds its own bar and metadata on its copy);
- every HTML file under the topic directories is listed in the catalogue;
- CITATION.cff and .zenodo.json parse.

Exit code 1 if anything fails. Usage: python3 scripts/check.py
"""
import json, re, sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
FONTS = ("https://fonts.googleapis.com", "https://fonts.gstatic.com")
errors = []
err = lambda m: errors.append(m)


def check_html(path, lang):
    html = path.read_text(encoding="utf-8")
    rel = path.relative_to(ROOT)
    if not re.match(r"\s*<!doctype html>", html, re.I):
        err(f"{rel}: missing <!doctype html>")
    m = re.search(r'<html[^>]*\blang="([^"]+)"', html)
    if not m:
        err(f"{rel}: <html> has no lang attribute")
    elif m.group(1).split("-")[0] != lang:
        err(f"{rel}: lang is {m.group(1)}, expected {lang}")
    if not re.search(r"<title>[^<]+</title>", html):
        err(f"{rel}: missing <title>")
    if not re.search(r'<meta\s+name="viewport"', html):
        err(f"{rel}: missing viewport meta")
    for tag, attr in (("script", "src"), ("link", "href"), ("iframe", "src")):
        for url in re.findall(rf'<{tag}\b[^>]*\b{attr}="([^"]+)"', html):
            if url.startswith(("http://", "https://", "//")) and not url.startswith(FONTS):
                err(f"{rel}: external {tag} {url}")
    for marker in ("estilo-sitio", "barra-sitio", "acerca-sitio", "goatcounter"):
        if marker in html:
            err(f"{rel}: contains site-specific block '{marker}'")


def main():
    cat = yaml.safe_load((ROOT / "catalog.yml").read_text(encoding="utf-8"))
    topics = {t["number"]: t for t in cat["topics"]}
    colls = cat.get("collections", {})
    ids, listed = set(), set()
    for v in cat["visualizations"]:
        i = v.get("id", "?")
        if i in ids:
            err(f"{i}: duplicate id")
        ids.add(i)
        if v.get("topic") not in topics:
            err(f"{i}: unknown topic {v.get('topic')}")
        c = v.get("collection")
        if c and (c not in colls or colls[c].get("topic") != v.get("topic")):
            err(f"{i}: collection {c} missing or in another topic")
        if not v.get("session") and not v.get("label"):
            err(f"{i}: needs session or label")
        for key in ("title", "description", "summary", "concepts"):
            val = v.get(key) or {}
            for lang in ("es", "en"):
                if not val.get(lang):
                    err(f"{i}: missing {key}.{lang}")
        if v.get("formulas") and set(v["formulas"]) != {"es", "en"}:
            err(f"{i}: formulas need es and en")
        for lang in ("es", "en"):
            f = (v.get("files") or {}).get(lang)
            if not f:
                err(f"{i}: missing files.{lang}")
                continue
            listed.add(f)
            p = ROOT / f
            if not p.is_file():
                err(f"{i}: file not found {f}")
                continue
            if not f.endswith(f"/{i}.{lang}.html"):
                err(f"{i}: file {f} should be named <dir>/{i}.{lang}.html")
            if not f.startswith(topics[v["topic"]]["dir"] + "/") if v.get("topic") in topics else False:
                err(f"{i}: file {f} is not under {topics[v['topic']]['dir']}/")
            check_html(p, lang)
        th = v.get("thumbnail")
        if not th or not (ROOT / th).is_file():
            err(f"{i}: thumbnail missing ({th})")
        src = v.get("source")
        if src and not (ROOT / src).is_dir():
            err(f"{i}: source directory not found {src}")
    for t in topics.values():
        for p in sorted((ROOT / t["dir"]).rglob("*.html")):
            if str(p.relative_to(ROOT)) not in listed:
                err(f"{p.relative_to(ROOT)}: not in catalog.yml")
    try:
        json.loads((ROOT / ".zenodo.json").read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f".zenodo.json: {e}")
    try:
        cff = yaml.safe_load((ROOT / "CITATION.cff").read_text(encoding="utf-8"))
        assert cff["cff-version"] and cff["title"] and cff["authors"]
    except Exception as e:  # noqa: BLE001
        err(f"CITATION.cff: {e}")
    n = len(cat["visualizations"])
    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s) in {n} visualizations")
        sys.exit(1)
    print(f"OK: {n} visualizations, {len(listed)} HTML files")


if __name__ == "__main__":
    main()
