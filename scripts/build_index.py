#!/usr/bin/env python3
"""Generates index.html (the catalogue page, works locally and on GitHub Pages) and
the table in README.md between the markers <!-- catalog:start --> / <!-- catalog:end -->,
from catalog.yml.

Usage: python3 scripts/build_index.py           # writes both files
       python3 scripts/build_index.py --check   # exit 1 if they are out of date
"""
import html as H
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
e = lambda s: H.escape(str(s), quote=True)


def grouped(cat):
    """[(topic, [(collection or None, [viz, ...]), ...]), ...] in catalogue order."""
    out = []
    for t in cat["topics"]:
        groups, order = {}, []
        for v in cat["visualizations"]:
            if v["topic"] != t["number"]:
                continue
            c = v.get("collection")
            if c not in groups:
                groups[c] = []
                order.append(c)
            groups[c].append(v)
        out.append((t, [(c, groups[c]) for c in order]))
    return out


def context(v, lang):
    if v.get("label"):
        return v["label"][lang]
    return ("Sesión " if lang == "es" else "Session ") + str(v["session"])


def page(cat):
    course = cat["course"]
    parts = [f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Interactive visualizations for computer networks courses</title>
<meta name="description" content="Self-contained interactive HTML visualizations for teaching computer networks: delays, layers, queueing, DNS and HTTP. Spanish and English. CC BY-SA 4.0.">
<style>
:root{{--bg:#EEF0F2;--surface:#FFFFFF;--ink:#1B2129;--muted:#5E6873;--line:#D5DAE0;--accent:#1D66A8;--accent-2:#B5541F;
--f-disp:"Archivo","Helvetica Neue",Arial,sans-serif;--f-body:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--f-mono:ui-monospace,Menlo,Consolas,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#11151A;--surface:#1A2027;--ink:#E6E9ED;--muted:#9AA4AF;--line:#2E3740;--accent:#5DA9EC;--accent-2:#E27B45}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#11151A;--surface:#1A2027;--ink:#E6E9ED;--muted:#9AA4AF;--line:#2E3740;--accent:#5DA9EC;--accent-2:#E27B45}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 var(--f-body);padding:0 16px 48px}}
.wrap{{max-width:1120px;margin:0 auto}}
header{{border-top:6px solid var(--accent-2);padding:24px 0 8px}}
h1{{font:800 clamp(24px,3.4vw,34px)/1.1 var(--f-disp);margin:0 0 8px;letter-spacing:-.01em;text-wrap:balance}}
.lead{{color:var(--muted);max-width:70ch;margin:0 0 6px}}
.meta{{font-size:14px;color:var(--muted)}} .meta a{{color:var(--accent)}}
h2{{font:700 22px/1.2 var(--f-disp);margin:40px 0 4px}} h2 small{{font-weight:500;color:var(--muted)}}
h3{{font:600 17px/1.3 var(--f-disp);margin:28px 0 4px}}
.desc{{color:var(--muted);margin:0 0 12px;max-width:80ch;font-size:15px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin-top:14px}}
.card{{background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}}
.card img{{display:block;width:100%;aspect-ratio:720/458;object-fit:cover;object-position:top;border-bottom:1px solid var(--line);background:var(--bg)}}
.card .body{{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}}
.card .ctx{{font:500 12px/1 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.card h4{{margin:0;font:600 16px/1.3 var(--f-body)}} .card h4 span{{display:block;font-weight:400;color:var(--muted);font-size:14px}}
.card p{{margin:0;font-size:14px;color:var(--muted);flex:1}}
.links{{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}}
.links a{{text-decoration:none;font-size:14px;font-weight:600;color:var(--accent);border:1px solid var(--line);border-radius:6px;padding:5px 10px}}
.links a:hover,.links a:focus-visible{{border-color:var(--accent)}}
footer{{margin-top:48px;border-top:1px solid var(--line);padding-top:14px;font-size:14px;color:var(--muted)}} footer a{{color:var(--accent)}}
</style>
</head>
<body>
<div class="wrap">
<header>
<h1>Interactive visualizations for computer networks courses</h1>
<p class="lead">Self-contained HTML visualizations for teaching computer networks at undergraduate level. Each one is a single file with no dependencies that works offline, in Spanish (ES) and English (EN). Developed for <a href="{e(course['url']['en'])}">{e(course['en'])}</a> ({e(course['es'])}) at the {e(course['institution']['en'])}.</p>
<p class="meta"><a href="https://github.com/edelahozuah/computer-networks-visualizations">Source and catalogue on GitHub</a> · License <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license">CC BY-SA 4.0</a> · Enrique de la Hoz, Luis de la Cruz Piris and Sandra Machado Zurita, {e(course['institution']['en'])}</p>
</header>
<main>
"""]
    for t, groups in grouped(cat):
        parts.append(f'<h2 id="topic-{t["number"]}">Topic {t["number"]}: {e(t["title"]["en"])} <small>· {e(t["title"]["es"])}</small></h2>')
        for c, vs in groups:
            if c:
                col = cat["collections"][c]
                parts.append(f'<h3 id="{e(c)}">{e(col["title"]["en"])} <small style="font-weight:400;color:var(--muted)">· {e(col["title"]["es"])}</small></h3>')
                if col.get("description"):
                    parts.append(f'<p class="desc">{e(col["description"]["en"])}</p>')
            parts.append('<div class="grid">')
            for v in vs:
                parts.append(
                    f'<article class="card" id="{e(v["id"])}">'
                    f'<a href="{e(v["files"]["en"])}"><img src="{e(v["thumbnail"])}" alt="" loading="lazy"></a>'
                    f'<div class="body"><div class="ctx">{e(context(v, "en"))}</div>'
                    f'<h4>{e(v["title"]["en"])}<span lang="es">{e(v["title"]["es"])}</span></h4>'
                    f'<p>{e(v["description"]["en"])}</p>'
                    f'<div class="links"><a href="{e(v["files"]["en"])}" hreflang="en">English</a>'
                    f'<a href="{e(v["files"]["es"])}" hreflang="es" lang="es">Español</a></div></div></article>')
            parts.append("</div>")
    parts.append("""</main>
<footer>
<p>Problems and figures referenced in the visualizations are from Kurose &amp; Ross, <em>Computer Networking: A Top-Down Approach</em>. The visualizations themselves are original work licensed under CC BY-SA 4.0: reuse, adapt and share them, crediting the author and keeping the same license.</p>
<p>To cite or get a persistent DOI, see <a href="https://github.com/edelahozuah/computer-networks-visualizations#citing">the README</a>.</p>
</footer>
</div>
</body>
</html>
""")
    return "\n".join(parts)


def readme_table(cat):
    rows = ["| Topic | Visualization | Context | Files |", "|---|---|---|---|"]
    for t, groups in grouped(cat):
        for c, vs in groups:
            for v in vs:
                where = f'{t["number"]}' + (f' · {cat["collections"][c]["title"]["en"]}' if c else "")
                files = f'[EN]({v["files"]["en"]}) · [ES]({v["files"]["es"]})'
                if v.get("source"):
                    files += f' · [source]({v["source"]}/)'
                rows.append(f'| {where} | **{v["title"]["en"]}**<br>{v["title"]["es"]} | {context(v, "en")} | {files} |')
    return "\n".join(rows)


def main():
    check = "--check" in sys.argv
    cat = yaml.safe_load((ROOT / "catalog.yml").read_text(encoding="utf-8"))
    idx = page(cat)
    readme_path = ROOT / "README.md"
    readme = readme_path.read_text(encoding="utf-8")
    a, b = "<!-- catalog:start -->", "<!-- catalog:end -->"
    i, j = readme.index(a) + len(a), readme.index(b)
    new_readme = readme[:i] + "\n" + readme_table(cat) + "\n" + readme[j:]
    stale = []
    if (ROOT / "index.html").read_text(encoding="utf-8") != idx if (ROOT / "index.html").exists() else True:
        stale.append("index.html")
    if new_readme != readme:
        stale.append("README.md")
    if check:
        if stale:
            print("out of date:", ", ".join(stale), "- run scripts/build_index.py")
            sys.exit(1)
        print("index.html and README.md are up to date")
        return
    (ROOT / "index.html").write_text(idx, encoding="utf-8")
    readme_path.write_text(new_readme, encoding="utf-8")
    print("written:", ", ".join(stale) if stale else "nothing changed")


if __name__ == "__main__":
    main()
