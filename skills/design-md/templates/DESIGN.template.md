---
version: 1
name: <proyecto>
description: "<Una frase que un diseñador entendería sin ver nada: fondo, tinta, acento con su hex, carácter tipográfico, cómo se separan las superficies, qué tipo de imagen lleva y qué NO hace nunca.>"
surface: <escaparate | herramienta>

colors:
  canvas: "#______"        # fondo principal
  surface-1: "#______"     # escalón de tono 1 (paneles, tarjetas)
  surface-2: "#______"     # escalón de tono 2
  ink: "#______"           # texto corrido, tinta plena
  ink-muted: "#______"     # texto secundario
  primary: "#______"       # el único acento: acción principal
  on-primary: "#______"    # texto sobre primary (≥ 4.5:1)
  primary-hover: "#______"
  hairline: "#______"      # solo herramienta: tablas y formularios
  semantic-success: "#______"
  semantic-warning: "#______"
  semantic-danger: "#______"

typography:
  display:
    fontFamily: <Familia>
    fontSize: 72px
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: -0.03em
  headline:
    fontFamily: <Familia>
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  body:
    fontFamily: <Familia>
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  small:
    fontFamily: <Familia>
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  button:
    fontFamily: <Familia>
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 160px

rounded:
  none: 0px      # elegir UNO de los dos estilos y borrar el otro
  pill: 9999px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 14px 22px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 14px 22px
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 12px 14px
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 24px
---

# <Proyecto> — sistema de diseño

> Generado con la skill `design-md`. Manda sobre el manifiesto en todo lo visual (precedencia §0).

## Overview

<Dos o tres párrafos. Qué es el producto, para quién, qué sensación debe dejar. La **idea**:
"En esta interfaz, [algo del sujeto] se convierte en [recurso visual]". Superficie: escaparate o
herramienta, y qué implica.>

## Colors

### Brand & Accent
- **primary** `#______` — dónde aparece (acción principal y, como mucho, una cosa más).

### Surface
- **canvas** → **surface-1** → **surface-2**: escalones de tono; así se separan las superficies.

### Text
- **ink** para todo texto corrido. **ink-muted** solo para notas secundarias.

### Semantic
- success / warning / danger: solo para estado, nunca decorativos.

### Dark mode
<Diseñado, no invertido. Lista de tokens que cambian. `color-scheme` y `theme-color`.>

## Typography

### Font Family
<Familia(s), de dónde se carga, fallback. Máximo dos; monoespaciada solo para código/datos.>

### Hierarchy
| Rol | Tamaño | Peso | Interlineado | Tracking | Uso |
| --- | --- | --- | --- | --- | --- |
| display | | | | | |
| headline | | | | | |
| body | | | | | |
| small | | | | | |

### Principles
- Titulares en dos líneas o menos a cualquier ancho.
- Sentence case en todo.
- `tabular-nums` en cifras comparables.

## Layout

### Spacing System
<Escala de spacing y cuándo se usa cada paso.>

### Grid & Container
<Columnas, márgenes laterales (16–32 px), ancho máximo, ejes de alineación del texto.>

### Whitespace Philosophy
<Hueco entre secciones vs dentro de secciones. Una sola pausa vacía por página como mucho.>

## Elevation & Depth
<Por defecto plano. Qué flota de verdad (menú, diálogo) y con qué sombra.>

## Shapes
<Radio elegido (cuadrado o pastilla) y por qué. Ratios de imagen.>

## Imagery
<Qué imágenes reales existen, tratamiento común, crédito. Qué hacer donde no hay imagen.>

## Motion
<Duraciones, easing, movimiento firma (escaparate), variante reduced-motion.>

## Components

### Buttons
<Primario, secundario, terciario. Estados: hover, active, focus-visible, disabled, loading.>

### Inputs & Forms
<Label, ayuda, error en línea, foco.>

### Navigation
<Marca, 3–5 enlaces, una acción.>

### <Componentes propios del producto>

## Do's and Don'ts

### Do
- 

### Don't
- (Copiar aquí las prohibiciones del manifiesto §4 que más tienten en este proyecto.)

## Responsive Behavior

### Breakpoints
| Nombre | Ancho | Qué cambia |
| --- | --- | --- |
| phone | 390 | |
| tablet | 768 | |
| desktop | 1440 | |

### Touch Targets
Mínimo 44 × 44 px.

### Collapsing Strategy
<Cómo se recompone el móvil: no es el escritorio apilado.>

## Iteration Guide
<Cómo añadir un componente nuevo sin romper el sistema. Qué token tocar para cada cambio típico.>

## Known Gaps
<Lo que aún no está decidido.>
