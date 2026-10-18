---
name: design-md
description: Crea, adapta o valida el DESIGN.md de un proyecto — el sistema de diseño en un Markdown (tokens YAML de color, tipografía, espaciado, radios y componentes + reglas en prosa) que cualquier agente lee antes de tocar la UI. Incluye una biblioteca de 84 DESIGN.md de marcas reales (Linear, Stripe, Vercel, Apple, Notion, Spotify, Supabase…) de awesome-design-md, conversión de tokens a variables CSS, validación (contraste, familias, radios, referencias) y detección de colores fuera de la paleta en el código. Úsala cuando un proyecto con UI no tenga DESIGN.md, cuando el usuario quiera que algo "se parezca a" una marca, cuando haya que fijar o cambiar colores/tipos/tokens, o para auditar que el código respeta el sistema.
---

# DESIGN.md

`DESIGN.md` en la raíz del proyecto es la fuente única de verdad visual (precedencia §0 del manifiesto,
`../design-manifesto/MANIFESTO.md`). Formato de Google Stitch, el mismo que la biblioteca: frontmatter
YAML con tokens + secciones en prosa.

Herramienta: `node <skill>/scripts/design.mjs` (Node 18+, sin dependencias).

```bash
node <skill>/scripts/design.mjs list [--q dark]          # biblioteca de marcas, filtrable
node <skill>/scripts/design.mjs show stripe              # ruta del DESIGN.md de la marca
node <skill>/scripts/design.mjs check DESIGN.md          # valida: secciones, refs, contraste, familias, radios
node <skill>/scripts/design.mjs tokens DESIGN.md --out src/styles/tokens.css
node <skill>/scripts/design.mjs drift DESIGN.md src/     # colores literales fuera de la paleta (file:line)
```

## Crear uno

Elige el origen y sigue sus pasos; termina siempre en **Cerrar**.

### A. Desde el proyecto existente
1. Inventario del código: variables CSS, config de Tailwind/tema, fuentes cargadas, colores literales
   (`drift` contra un DESIGN.md vacío los lista todos), radios, sombras.
2. Agrupa en roles (canvas, surface-n, ink, ink-muted, primary, on-primary, semantic-*). Colores casi
   iguales se funden en uno. Lo que no tiene rol, se elimina.
3. Rellena `templates/DESIGN.template.md` con lo que hay, y en **Known Gaps** lo que choca con el manifiesto.

### B. Desde una marca de la biblioteca ("que parezca Linear")
1. `list --q <palabra>` y lee el DESIGN.md de 1–3 candidatas enteras (descripción, do/don't).
2. Toma la **estructura** (proporciones de color, escala tipográfica, densidad, radios, tratamiento de
   superficies), no la identidad: otro acento, otro nombre, nunca su logo ni sus fuentes propietarias
   (usa el sustituto libre que la propia ficha sugiere en "Font Substitutes").
3. Pasa el resultado por el manifiesto: lo que la marca hace y el manifiesto prohíbe (p. ej. radios
   suaves, eyebrows) se conserva solo si el usuario quiere fidelidad; si no, se corrige y se anota.

### C. Desde una imagen
Usa la skill `image-to-code` (pasos 1–3): mide la paleta con su `palette.mjs` y vuelca aquí.

### D. Desde cero
1. Superficie (escaparate/herramienta) e idea del sujeto (manifiesto §2).
2. Escaparate: deja que `taste-frontend` reparta dirección (`draw.mjs`) y copia su tipo y paleta a tokens.
   Herramienta: elige una marca de referencia de densidad parecida (B) o define una escala compacta.
3. Un acento. Un radio (cuadrado o pastilla). Una o dos familias.

## Cerrar

1. `check DESIGN.md` → cero FAIL. Cada WARN se corrige o se justifica en **Known Gaps**.
2. `tokens DESIGN.md --out <ruta de estilos>` y conecta el CSS generado (o mapea a `tailwind.config` /
   tema del framework con los mismos nombres). A partir de aquí ningún valor visual literal en componentes.
3. Modo oscuro: si el producto lo tiene, segundo bloque de colores en la sección **Dark mode** y en el
   CSS bajo `@media (prefers-color-scheme: dark)` + atributo `[data-theme=dark]`.
4. `drift DESIGN.md src/` en cada revisión: un color fuera de paleta o se convierte en token o se elimina.

## Reglas

- Nombres de rol, no de color: `primary`, no `blue-500`.
- Cada componente del frontmatter referencia tokens (`"{colors.primary}"`), nunca literales.
- Las secciones obligatorias que valida `check`: Overview, Colors, Typography, Layout, Components,
  Do's and Don'ts, Responsive Behavior. Imagery y Motion son obligatorias en escaparate.
- Si el usuario impone una regla visual de proyecto (p. ej. "esquinas cuadradas", "separar con líneas
  rectas"), va a **Do's and Don'ts** literalmente: así sobrevive a cualquier sesión futura.
- La biblioteca son análisis de terceros, no sistemas oficiales de esas empresas.
