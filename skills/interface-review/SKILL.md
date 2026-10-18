---
name: interface-review
description: Revisión de código UI contra las Vercel Web Interface Guidelines (accesibilidad, foco, formularios, animación, tipografía, contenido, imágenes, rendimiento, navegación y estado, táctil, safe areas, tema oscuro, i18n, hidratación) más las reglas del manifiesto de diseño, con hallazgos en formato file:line. Úsala para "revisa mi UI", "audita accesibilidad", "revisa el UX", antes de dar por terminada una app, dashboard o formulario, y en cualquier PR que toque componentes, estilos o markup.
argument-hint: <archivo, carpeta o glob>
---

# Interface review

Revisa archivos de UI y reporta incumplimientos, terso y accionable.

## Reglas

1. `vercel-rules.md` (en esta carpeta) — las Web Interface Guidelines de Vercel, copia local fijada por
   `scripts/sync-upstream.sh`. Si hay red y el usuario quiere la última versión, puedes comparar con
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`.
2. **Ajustes del manifiesto** (`../design-manifesto/MANIFESTO.md`), que ganan a Vercel donde chocan:
   - Copy: **sentence case**, no Title Case (español). Marca Title Case en botones y titulares.
   - Además de lo de Vercel, marca: radios en la banda 9–16 px si `DESIGN.md` no los fija;
     colores/tamaños/sombras literales fuera de tokens; `box-shadow` en elementos en reposo;
     gradientes decorativos; eyebrows y numeración índice (01/02/03); monoespaciada fuera de código;
     emoji como iconos; `<div>` dentro de `<div>` con borde dentro de tarjeta (cards-in-cards).
   - Si el proyecto tiene `DESIGN.md`, cualquier contradicción con él es un hallazgo, citando la regla.

## Proceso

1. Archivos: el argumento, o los cambiados (`git diff --name-only` + no rastreados) filtrando
   `.tsx .jsx .vue .svelte .astro .html .css .scss`. Si no hay nada que revisar, pregunta qué.
2. Lee `DESIGN.md` del proyecto si existe.
3. Lee cada archivo entero y contrástalo con todas las secciones de reglas. No muestrees.
4. Si hay `DESIGN.md`, ejecuta `node ../design-md/scripts/design.mjs drift DESIGN.md <archivos>` e
   incorpora sus líneas.
5. Lo que no se puede ver en el código (contraste real, foco tapado, overflow) se comprueba con
   `visual-qa`; dilo en el informe en vez de suponerlo.

## Salida

Agrupado por archivo, `file:line` (clicable), una línea por hallazgo, sin preámbulo:

```text
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:55 - transition: all → transition: transform, opacity
src/Button.tsx:61 - "Guardar Cambios" → sentence case "Guardar cambios"

## src/Card.tsx

✓ pass
```

Explicación solo cuando el arreglo no es obvio. Al final, una línea: `N hallazgos en M archivos`.
Si el usuario pide arreglarlos, arregla y vuelve a revisar los mismos archivos.
