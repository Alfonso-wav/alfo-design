---
name: visual-qa
description: QA visual en navegador real con playwright-cli. Abre la página (URL o archivo local, que sirve con un servidor efímero), captura a 1440/768/390 px en claro y oscuro, mide overflow horizontal, titulares de más de dos líneas, contraste de texto, texto diminuto, imágenes sin tamaño o alt, controles sin nombre, áreas táctiles pequeñas, foco de teclado visible, contenido oculto con prefers-reduced-motion y errores de consola, y opcionalmente compone una comparación lado a lado con una imagen de referencia. Úsala para "pruébalo", "míralo en el navegador", "haz capturas", "¿se ve bien en móvil?", tras cualquier cambio visual y antes de dar por terminada una UI.
---

# Visual QA

Pasar un lint no significa que se vea bien. Esta skill abre la página de verdad, la mide y te obliga a
mirarla. Usa `playwright-cli` (skill `../playwright-cli/` para todos sus comandos).

## 1. Ejecutar

```bash
node <skill>/scripts/qa.mjs <url | ruta/index.html | carpeta> [--out .visual-qa] \
  [--widths 1440,768,390] [--schemes light,dark] [--reference diseño.png] [--wait 600]
```

- Archivos locales: se sirven por HTTP en un puerto efímero (`file://` está bloqueado en playwright-cli).
- Apps con dev server (Vite, Next…): arráncalo en background y pasa la URL.
- Proyecto sin modo oscuro: `--schemes light`.
- Rutas autenticadas: `playwright-cli -s=vqa state-load auth.json` no persiste entre ejecuciones del
  script; para eso, haz la sesión a mano con `playwright-cli` (ver §3).

Salida: `FAIL`/`WARN` agrupados con dónde se vieron, rutas de capturas, `report.json`. Exit 1 si hay FAIL.

## 2. Mirar (obligatorio)

Abre **cada** captura listada con Read. Para cada una, escribe en notas:
- jerarquía: ¿lo más importante es lo más grande? ¿se entiende en 3 segundos?
- ritmo: huecos entre secciones vs internos; alineaciones a 2–3 ejes;
- móvil (390): ¿composición propia o escritorio apilado? ¿algo cortado, apretado, solapado?
- oscuro: ¿diseñado o invertido? ¿contraste, imágenes, bordes?
- `focus.png`: ¿se ve dónde está el foco?
- `reduced-motion.png`: ¿está todo el contenido?
- tells de la lista negra del manifiesto (`../design-manifesto/MANIFESTO.md` §4).

Si un problema se ve en la captura, es real, diga lo que diga el código. Arregla los 3 peores, vuelve a
ejecutar, vuelve a mirar. Máximo 3 rondas.

## 3. Más allá del script: interacción

Para flujos (menús, modales, formularios, estados de error/vacío/carga) usa `playwright-cli` a mano:

```bash
playwright-cli -s=flow open http://localhost:5173
playwright-cli -s=flow snapshot                       # refs e1, e2… de los elementos
playwright-cli -s=flow click e12                      # abrir menú / modal
playwright-cli -s=flow screenshot --filename=.visual-qa/menu-open.png
playwright-cli -s=flow fill e20 "no-es-un-email" --submit
playwright-cli -s=flow screenshot --filename=.visual-qa/form-error.png
playwright-cli -s=flow press Escape                   # ¿cierra el modal? ¿vuelve el foco?
playwright-cli -s=flow route "**/api/**" --status=500 # estado de error de la API
playwright-cli -s=flow resize 390 844
playwright-cli -s=flow close
```

Comprueba siempre: vacío, cargando, error, contenido muy largo, y el camino con solo teclado.

## 4. Informe

Resultado literal del script (FAIL/WARN restantes con su justificación), capturas revisadas, los
problemas visuales que viste y arreglaste por ronda, y lo que no se pudo probar.
