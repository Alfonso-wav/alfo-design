---
name: image-to-code
description: Convierte una imagen de diseño (captura, mockup, Figma exportado, foto de boceto, o un diseño generado por una herramienta de imagen) en frontend fiel y responsive. Mide la paleta real de la imagen y su escala, extrae texto, tipografía, espaciado y componentes a una hoja de extracción, la vuelca a DESIGN.md, construye sin derivar a lo genérico y compara captura contra referencia lado a lado en navegador real hasta que coincidan. Úsala cuando el usuario pase una imagen y diga "hazlo así", "replica esto", "pásalo a código", "que quede igual que el mockup", o cuando un diseño generado por IA deba convertirse en web.
---

# Image to code

La imagen es la especificación. El objetivo no es "inspirado en", es **la misma interfaz, traducida a
código real**. Basado en el Image to Code de Taste Skill (copia íntegra en
`references/upstream-image-first.md`, léela si vas a *generar* tú las imágenes primero) y sujeto al
manifiesto (`../design-manifesto/MANIFESTO.md`).

Requiere `playwright-cli` global. Scripts: `scripts/palette.mjs` (esta skill),
`../visual-qa/scripts/qa.mjs`, `../design-md/scripts/design.mjs`.

## 1. Medir antes de mirar

```bash
node <skill>/scripts/palette.mjs ref.png --width 1440            # paleta completa + escala px→CSS
node <skill>/scripts/palette.mjs ref.png --region 0,0,1440,800   # solo el héroe
node <skill>/scripts/palette.mjs ref.png --region 120,640,180,56 --k 3   # un botón: su fill exacto
```

- `--width` es el ancho CSS al que se dibujó el diseño. Una captura retina de 2880 px a 1440 → escala
  2.00: **divide toda medida en píxeles por la escala**.
- Los centros de cluster son medias; para fijar un rol exacto, muestrea una región plana de ese rol.
- Si no conoces el ancho de diseño, asume 1440 para escritorio y 390 para móvil y dilo.

## 2. Hoja de extracción

Mira la imagen con Read (y recortes ampliados si hace falta) y escribe en tus notas, sección por
sección, de arriba abajo:

| Aspecto | Qué anotar |
| --- | --- |
| **Texto** | Todo el texto legible, literal: nav, titular, subtítulo, CTAs, títulos, etiquetas, footer. Ilegible → `[?]`, nunca inventado como si fuera del original. |
| **Tipografía** | Serif/sans/display, peso, tamaño medido en CSS px (altura de mayúscula ≈ 0.7 × font-size), interlineado, tracking, nº de líneas y dónde rompe cada titular, alineación. Familia libre más parecida. |
| **Espaciado** | Márgenes laterales, ancho máximo, columnas, hueco titular→subtítulo→botón, padding interno, hueco entre secciones. Redondea a la escala de 4/8 px más cercana. |
| **Color** | Rol de cada hex medido: canvas, surfaces, ink, ink-muted, primary, on-primary, bordes. |
| **Componentes** | Botones (forma, radio, relleno/contorno, padding), inputs, tarjetas, nav, iconos (trazo, tamaño), imágenes (ratio, recorte, tratamiento), sombras y líneas reales. |
| **Layout** | Retícula, orden de secciones, qué es full-bleed, qué está contenido. |
| **Lo no visible** | Hover, foco, estados, móvil si solo hay escritorio: se deducen del lenguaje visible y se marcan como deducidos. |

## 3. Volcar a DESIGN.md

Con la hoja, crea o actualiza `DESIGN.md` siguiendo la skill `design-md` (origen C) y genera los tokens
CSS con `design.mjs tokens`. Ejecuta `design.mjs check`: un contraste que falla en el original se
**anota** en Known Gaps y se propone el ajuste mínimo; no se corrige en silencio.

## 4. Construir sin derivar

- Orden: tokens → layout de cada sección a escritorio → móvil → componentes → estados.
- **Copiar, no mejorar.** Mismo orden de secciones, mismo ritmo de espacios, misma relación
  texto/imagen, misma tipografía. La deriva a plantilla genérica es el fallo nº 1: no comprimas
  espacios generosos, no cambies una sección distintiva por una fila de tarjetas, no añadas cajas
  dentro de cajas ni chips/etiquetas que no están en la imagen.
- Ambigüedad, en este orden: lenguaje visual visible → lógica de layout y espacio → familia de
  componentes → nivel de pulido → solo entonces la opción más fácil de implementar que sea fiel.
- Imágenes del diseño que no tienes: hueco con el mismo ratio y tono medio medido, marcado en el
  informe. Nunca un placeholder gris genérico si el tono se puede medir.
- Choque con el manifiesto (el mockup lleva un eyebrow o un degradado): **la imagen manda** si el
  usuario pidió fidelidad; se lista en el informe como "diferencias con el manifiesto".
- Accesibilidad no es negociable aunque la imagen no la muestre: semántica, foco visible, alt, labels.

## 5. Comparar en navegador real

```bash
node ../visual-qa/scripts/qa.mjs <url|index.html> --reference ref.png --widths 1440,390 --schemes light
```

Abre `compare-1440.png` (referencia a la izquierda, build a la derecha) y recorre:
1. Siluetas: ¿mismos bloques, mismas alturas relativas, mismo orden?
2. Tipografía: ¿mismos saltos de línea en titulares? Ajusta tamaño/medida hasta que rompa igual.
3. Espacios: ¿mismos huecos verticales? Compara sección a sección.
4. Color: si algo difiere, `palette.mjs --region` sobre la misma zona del build y del original.
5. Detalle: radios, pesos, iconos.

Lista las diferencias por impacto, arregla las 3 mayores, repite. Máximo 4 rondas. Además, cero FAIL en
los checks automáticos de `qa.mjs`.

## 6. Informe

Fidelidad lograda y diferencias que quedan (con captura), medidas deducidas vs medidas, textos `[?]`,
imágenes pendientes, diferencias con el manifiesto mantenidas por fidelidad, y qué se dedujo para
móvil/estados que la imagen no mostraba.
