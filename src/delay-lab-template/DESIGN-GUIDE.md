# Guía de diseño · Visualizaciones de retardos (AR1, S1.2)

## Propósito y público
Piezas interactivas para apoyar los problemas P6, P25, P26, P27 y P28 (Kurose) en el laboratorio de
Arquitectura de Redes 1. Se usan proyectadas en clase y en Blackboard para estudio individual.
Idioma: castellano. Un único fichero HTML por pieza, sin dependencias externas ni red.

## El elemento memorable: la tubería a escala
El enlace se dibuja como una tubería horizontal con una regla de distancia debajo. El paquete es un
objeto con longitud física (vp·L/R metros) que se vierte desde A durante d_trans mientras su cabeza
avanza a vp. Todo lo demás (controles, diagrama, lecturas) es sobrio y secundario.

## Paleta (validada CVD y contraste en claro y oscuro)
| rol | claro | oscuro | uso |
|---|---|---|---|
| --packet | #e0602c | #d95926 | bits de datos, cuerpo del paquete |
| --head | #2a78d6 | #3987e5 | primer bit (cabeza), botón principal |
| --tail | #4a3aa7 | #9085e9 | último bit (cola) |
| --ack | #159c6b | #199e70 | reconocimientos |
| --ink / --ink-2 | #14213d / #5b6478 | #eef1f6 / #aab3c2 | texto principal / secundario |
| --surface / --panel | #f4f6f9 / #ffffff | #16191f / #1f242d | fondo / paneles |
El color nunca va solo: cabeza y cola llevan etiqueta de texto; los ACK, trazo discontinuo.

## Tipografía y texto
Familia del sistema (funciona sin red), 18 px de base para proyección, numerales tabulares.
Frase en minúscula, sin mayúsculas sostenidas, sin etiquetas decorativas. Números en formato
español (coma decimal) mediante RT.fmt. Unidades: s/ms/µs, m/km, bits/kbit/Mbit, bps/kbps/Mbps/Gbps.

## Estructura de página (obligatoria)
1. Cabecera: título, subtítulo con el problema que apoya, botones «Modo predicción» y «Tema».
2. Escenario (todo el ancho): SVG de la tubería + leyenda + línea de tiempo + botones de instantes clave.
3. Fila inferior: panel «Parámetros» (presets con los valores exactos del enunciado, deslizadores,
   lecturas numéricas) y panel «Diagrama espacio-tiempo» (o el panel específico de la pieza).

## Reglas de interacción
- Reproducir/pausar (espacio), frotar (deslizador y flechas), Inicio/Fin, teclas 1–9 para instantes clave.
- Cámara lenta siempre visible en pantalla («cámara lenta ×N»). Nunca ocultar que el tiempo está escalado.
- Presets = los datos exactos del enunciado. Las lecturas deben coincidir con las soluciones:
  P6g 536 km · P25 80 ms, 160 000 bits, 125 m · P26 12,5 bps · P27 80 000 000 bits, 0,25 m · P28 0,48 s vs 3,6 s.
- Modo predicción: oculta lecturas (se muestran «?») hasta pulsar «Revelar valores».
- Escala: cuando los bits no se puedan dibujar uno a uno (>~2000 en pantalla), el segmento se dibuja
  como relleno continuo y se ofrece una lupa que amplía un tramo y muestra bits individuales.

## Accesibilidad
Controles con etiqueta, foco visible, SVG con role="img" y aria-label descriptivo, un resumen textual
del estado actual en un párrafo (aria-live="polite") para lectores de pantalla, respeto de
prefers-reduced-motion (sin autoplay), contraste ≥ 3:1 en marcas y ≥ 4,5:1 en texto.

## Cómo reutilizar la plantilla
Copiar íntegros el bloque <style> y el objeto RT del <script> de plantilla.html. No cambiar tokens ni
nombres de clase. RT ofrece: fmt, initChrome, Clock, svg, scale, ticks, drawLink, drawSpaceTime, log.
