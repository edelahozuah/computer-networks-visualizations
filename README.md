# Interactive visualizations for computer networks courses

*Visualizaciones interactivas para asignaturas de redes de computadores · [versión en español](#español)*

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Catalogue](https://img.shields.io/badge/catalogue-GitHub_Pages-1D66A8)](https://edelahozuah.github.io/computer-networks-visualizations/)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23285664.svg)](https://doi.org/10.5281/zenodo.23285664)

Self-contained, interactive HTML visualizations for teaching computer networks
at undergraduate level. Each one is **a single HTML file with no dependencies**:
it works offline, from a USB stick, uploaded to an LMS such as Blackboard or
Moodle, or embedded in a website. Every visualization exists in **Spanish and
English**, with the same functionality.

They were developed for the course *Arquitectura de Redes I* (Network
Architecture I) at the University of Alcalá, Spain, following the structure and
problem sets of Kurose & Ross, *Computer Networking: A Top-Down Approach*, and
are in use on [edelahozuah.github.io](https://edelahozuah.github.io/docencia/ar1/).

**Browse them:** <https://edelahozuah.github.io/computer-networks-visualizations/>

## Catalogue

<!-- catalog:start -->
| Topic | Visualization | Context | Files |
|---|---|---|---|
| 1 | **Line coding and bit time**<br>Codificación de línea y tiempo de bit | Session 1.1 | [EN](01-introduction/bit-time-line-coding.en.html) · [ES](01-introduction/bit-time-line-coding.es.html) |
| 1 | **Transmission and propagation delay: space-time diagram**<br>Retardos de transmisión y propagación: diagrama espacio-tiempo | Session 1.1 | [EN](01-introduction/space-time-diagram.en.html) · [ES](01-introduction/space-time-diagram.es.html) |
| 1 | **Logical vs real communication**<br>Comunicación lógica y comunicación real | Session 1.2 | [EN](01-introduction/logical-vs-real-communication.en.html) · [ES](01-introduction/logical-vs-real-communication.es.html) |
| 1 | **Queueing and packet drops in a router**<br>Colas y descartes en un router | Session 1.3 | [EN](01-introduction/router-queueing-and-drops.en.html) · [ES](01-introduction/router-queueing-and-drops.es.html) |
| 1 | **Delay diagram**<br>Diagrama de retardos | Session 1.3 | [EN](01-introduction/delay-diagram.en.html) · [ES](01-introduction/delay-diagram.es.html) · [source](src/delay-diagram/) |
| 1 · Delay lab | **Anatomy of delay**<br>Anatomía del retardo | Lab 1.2, problem P6 | [EN](01-introduction/delay-lab/01-anatomy-of-delay.en.html) · [ES](01-introduction/delay-lab/01-anatomy-of-delay.es.html) |
| 1 · Delay lab | **The pipe and the width of a bit**<br>La tubería y el ancho de un bit | Lab 1.2, problems P25 to P27 | [EN](01-introduction/delay-lab/02-pipe-and-bit-width.en.html) · [ES](01-introduction/delay-lab/02-pipe-and-bit-width.es.html) |
| 1 · Delay lab | **Continuous transmission vs. stop-and-wait**<br>Envío continuo frente a parada y espera | Lab 1.2, problem P28 | [EN](01-introduction/delay-lab/03-continuous-vs-stop-and-wait.en.html) · [ES](01-introduction/delay-lab/03-continuous-vs-stop-and-wait.es.html) |
| 2 · DNS | **Anatomy of a name: from labels to the tree**<br>Anatomía de un nombre: de las etiquetas al árbol | Session 2.1 | [EN](02-application-layer/dns/dns-names.en.html) · [ES](02-application-layer/dns/dns-names.es.html) |
| 2 · DNS | **DNS zone delegation**<br>Delegación de zonas: ceder una rama del árbol | Session 2.1 | [EN](02-application-layer/dns/dns-zone-delegation.en.html) · [ES](02-application-layer/dns/dns-zone-delegation.es.html) |
| 2 · DNS | **DNS queries: iterative and recursive**<br>Consultas DNS: iterativa y recursiva | Session 2.1 | [EN](02-application-layer/dns/dns-queries.en.html) · [ES](02-application-layer/dns/dns-queries.es.html) |
| 2 · DNS | **DNS queries: you decide who is recursive**<br>Consultas DNS: decide tú quién es recursivo | Session 2.1 | [EN](02-application-layer/dns/dns-queries-mixed.en.html) · [ES](02-application-layer/dns/dns-queries-mixed.es.html) |
| 2 · DNS | **DNS step by step**<br>DNS paso a paso | Session 2.2 | [EN](02-application-layer/dns/dns-step-by-step.en.html) · [ES](02-application-layer/dns/dns-step-by-step.es.html) · [source](src/dns-step-by-step/) |
| 2 · HTTP | **Persistent HTTP: without and with pipelining**<br>HTTP persistente: sin y con canalización | Session 2.2 | [EN](02-application-layer/http/http-persistent.en.html) · [ES](02-application-layer/http/http-persistent.es.html) · [source](src/http-persistent/) |
<!-- catalog:end -->

Each visualization has a thumbnail in `thumbnails/` and an entry in
[`catalog.yml`](catalog.yml) with its title, one-line description, a summary
paragraph, the concepts it teaches and the formulas it uses, in both languages.

## Using the visualizations

- **In class or at home:** open the HTML file in any modern browser. Nothing is
  installed and no network access is needed (only the web fonts are fetched when
  online; system fonts are used otherwise).
- **In an LMS:** upload the file as a content item, or link to the copy on
  GitHub Pages, e.g.
  `https://edelahozuah.github.io/computer-networks-visualizations/02-application-layer/dns/dns-queries.en.html`.
- **On your own website:** copy the files you need. The pages have a neutral
  design with light and dark modes; a site can add its own header and metadata
  around them (see how [edelahozuah.github.io does it](https://github.com/edelahozuah/edelahozuah.github.io/blob/master/scripts/estilo_visualizaciones.py)).
- **Keyboard:** most pieces support the space bar to play or pause, the arrow
  keys to step, and a theme switch between light and dark.

## Repository layout

```
01-introduction/            topic 1: delays, layers, packet switching
  delay-lab/                three pieces for the delay problem set
02-application-layer/       topic 2: DNS and HTTP
  dns/  http/
<id>.es.html, <id>.en.html  the two language versions of each visualization
catalog.yml                 the catalogue: metadata of every visualization
index.html                  catalogue page (generated, do not edit)
thumbnails/                 720 px thumbnails (one per visualization)
src/                        modular source of the larger pieces (see below)
scripts/                    check.py, build_index.py, thumbnails.sh
```

### Sources and builds

Most visualizations are written directly as a single HTML file. Three of them
are larger and are developed from modular sources in `src/`, each with a
`build.sh` that runs its tests and assembles a complete document in `dist/`:

| Source | Builds | Published as |
|---|---|---|
| `src/delay-diagram/` | bilingual editor with ES/EN switch | `01-introduction/delay-diagram.{es,en}.html` |
| `src/http-persistent/` | bilingual, engine `motor.js` tested by `test_motor.js` | `02-application-layer/http/http-persistent.{es,en}.html` |
| `src/dns-step-by-step/` | Spanish and English (`build_en.sh`); steps and scenes in `pasos.js`, tested by `test_pasos.js` | `02-application-layer/dns/dns-step-by-step.{es,en}.html` |

The published files of the first two are derived from those builds with the
language fixed and the language switch removed; those of DNS step by step are
the builds themselves.
`src/delay-lab-template/` holds the template and design guide the delay lab
pieces share (common CSS and the `RT` helper object).

### Adding a visualization

1. Write a self-contained HTML file per language, named `<id>.es.html` and
   `<id>.en.html`, under the topic directory. Set `<html lang>`, `<title>` and
   the viewport meta; load nothing external except, optionally, Google Fonts.
2. Add its entry to `catalog.yml` (the fields are documented at the top of the
   file) and a thumbnail: `scripts/thumbnails.sh <id>`.
3. Run `python3 scripts/check.py` and `python3 scripts/build_index.py`.
   The CI workflow runs both and the source builds on every push.

## Citing

If you use these materials in teaching or research, please cite them. Every
release is archived on Zenodo with its own DOI; the concept DOI
[10.5281/zenodo.23285664](https://doi.org/10.5281/zenodo.23285664) always
resolves to the latest version. `CITATION.cff` has the metadata GitHub and
Zenodo read.

> de la Hoz, E., de la Cruz Piris, L., & Machado Zurita, S. (2026). *Interactive visualizations for computer networks
> courses* (Version 0.1.0) [Computer software]. University of Alcalá.
> https://doi.org/10.5281/zenodo.23285664

## License

[CC BY-SA 4.0](LICENSE). You may reuse, adapt and redistribute the
visualizations, including commercially, as long as you credit the author and
share derivatives under the same license.

Authors: Enrique de la Hoz, Luis de la Cruz Piris and Sandra Machado Zurita
(Departamento de Automática, Universidad de Alcalá). The problems and figures the pieces
refer to belong to Kurose & Ross's textbook and are only referenced.

---

## Español

Visualizaciones interactivas, autocontenidas, para la enseñanza de redes de
computadores en el grado. Cada una es **un único fichero HTML sin
dependencias**: funciona sin conexión, desde una memoria USB, subida a
Blackboard o Moodle, o incrustada en una web. Todas existen **en español y en
inglés**, con la misma funcionalidad.

Se desarrollaron para *Arquitectura de Redes I* en la Universidad de Alcalá,
siguiendo la estructura y los problemas de Kurose y Ross, *Redes de
computadoras: un enfoque descendente*, y se usan en
[edelahozuah.github.io](https://edelahozuah.github.io/docencia/ar1/).

- **Catálogo navegable:** <https://edelahozuah.github.io/computer-networks-visualizations/>
- **Para usarlas** basta abrir el fichero HTML en el navegador, subirlo a la
  plataforma docente o enlazar la copia de GitHub Pages.
- **Metadatos** de cada visualización (título, resumen, conceptos y fórmulas,
  en los dos idiomas) en [`catalog.yml`](catalog.yml).
- **Fuentes modulares** del diagrama de retardos, HTTP persistente y DNS paso a
  paso en `src/`, con sus scripts de construcción y pruebas.
- **Para añadir una visualización:** un fichero por idioma (`<id>.es.html`,
  `<id>.en.html`), su entrada en `catalog.yml`, la miniatura con
  `scripts/thumbnails.sh`, y `scripts/check.py` y `scripts/build_index.py`.
- **Cita y DOI:** véase [Citing](#citing). Cada versión se archiva en Zenodo;
  el DOI de concepto es [10.5281/zenodo.23285664](https://doi.org/10.5281/zenodo.23285664).
- **Licencia:** [CC BY-SA 4.0](LICENSE). Reutiliza, adapta y comparte citando
  al autor y manteniendo la licencia.
