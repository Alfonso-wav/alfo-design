# Manifiesto de diseño

La ley que rige cualquier interfaz que construya en cualquier proyecto. Destila cinco fuentes y
resuelve sus choques; cada skill de este repo la aplica a su trozo del trabajo.

| Fuente | Qué aporta | Skill aquí |
| --- | --- | --- |
| **Taste Skill** (Leonxlnx) | Dirección de arte, anti-slop, inspector en navegador real, crítica sobre capturas | `taste-frontend`, `taste-redesign` |
| **Vercel Web Interface Guidelines** | Reglas de oficio: accesibilidad, foco, formularios, rendimiento, estados | `interface-review` |
| **Awesome DESIGN.md** (VoltAgent) | Sistema de diseño como un Markdown: tokens + reglas + do/don't. 84 marcas de referencia | `design-md` |
| **Image to Code** (Taste Skill) | Extraer de una imagen tipografía, espaciado, color y componentes, y construir sin derivar | `image-to-code` |
| **Playwright CLI** (Microsoft) | Abrir, capturar, medir e interactuar en un navegador real, desde la terminal | `playwright-cli`, `visual-qa` |

---

## 0. Precedencia

Cuando dos reglas chocan gana la de arriba:

1. **Lo que el usuario pide en esta conversación.**
2. **El `DESIGN.md` del proyecto** (raíz del repo). Si existe, manda sobre este manifiesto en todo lo
   visual: colores, tipos, radios, líneas. Si una regla del proyecto contradice una de aquí (por
   ejemplo "separar con líneas rectas" frente a "sin filetes finos"), gana el proyecto, sin discutir.
3. **Las memorias/preferencias guardadas de ese proyecto.**
4. **Este manifiesto.**
5. Los defaults del framework o de la librería de componentes. Nunca se aceptan sin decidir.

Sin `DESIGN.md` en un proyecto con UI, el primer paso es crearlo (skill `design-md`).

## 1. Dos superficies, dos códigos

No todo es una landing. Antes de nada, clasificar lo que se construye:

| | **Escaparate** (marketing, landing, portfolio, one-pager, producto público) | **Herramienta** (app, dashboard, panel, editor, formulario, TUI web) |
| --- | --- | --- |
| Objetivo | Convencer. Que se recuerde. | Que se use rápido y sin errores, mil veces. |
| Manda | Taste Skill (dirección, idea, imagen, motion) | Vercel Guidelines + `DESIGN.md` (densidad, estados, consistencia) |
| Tipografía | 2–3 tamaños visibles, uno enorme | Escala compacta, 12–16 px de cuerpo, cifras tabulares |
| Imagen | Real y grande, mínimo 4 fotos/archivo | Solo la interfaz y los datos. Nada decorativo |
| Motion | Capa obligatoria (≥ 8 elementos que se mueven) | Solo feedback y transiciones de estado, < 200 ms |
| Líneas | Prohibidos filetes y cajas de 1 px | Permitidas en tablas, formularios y separación de paneles |
| Gate | `taste-frontend` (`lint.mjs` + `inspect.mjs`) | `interface-review` + `visual-qa` |

Ambas superficies comparten todo lo demás de este manifiesto.

## 2. Principios

1. **Decidir, no promediar.** Un modelo sin dirección produce la media de todas las webs que ha visto:
   titular centrado, etiquetita encima, tres tarjetas con icono, degradado suave. Cada elección visual
   tiene que tener una razón que se pueda decir en una frase. Si la razón es "es lo normal", está mal.
2. **La idea sale del sujeto.** Antes de diseñar, inventario de 8–12 cosas que solo tiene este cliente
   o este producto (nombre, lugar, números, restricciones, rituales, objetos impresos de su mundo).
   Frase obligatoria: *"En esta página, [algo del sujeto] se convierte en [el recurso visual]"*. Test del
   competidor: si la frase sirve igual para el competidor, no es una idea.
3. **El sistema antes que la pantalla.** Tokens primero (`DESIGN.md` → variables CSS), luego
   componentes, luego páginas. Ningún color, tamaño, radio o sombra literal fuera de los tokens.
4. **Contenido completo.** Una sección delgada pierde siempre contra una más rica. Menú entero con
   precios, cada plan con lo que incluye, estados vacíos diseñados. Nunca se inventa prueba social:
   ni clientes, ni testimonios, ni logos, ni estadísticas de negocio.
5. **Lo que no se mide no se cumple.** Cada regla de aquí tiene un comprobador: lint, inspector, review
   `file:line` o captura. Se mira lo que se ha hecho en un navegador real antes de darlo por bueno.
6. **Accesible por construcción.** HTML semántico antes que ARIA, foco visible siempre, movimiento
   reducido respetado, zoom nunca bloqueado. No es una fase final.

## 3. Leyes del oficio

### Tipografía
- Una familia es lo normal; dos es el límite. Monoespaciada solo en código y datos tabulares reales.
- Display: tracking −0.02 a −0.05 em, interlineado 0.85–1.05. Texto: 16–20 px (app: 13–16 px),
  interlineado 1.45–1.6, 45–75 caracteres por línea.
- Máximo cinco tamaños por pantalla. Relación titular/cuerpo alta en escaparate (≥ 4×).
- **Titulares en dos líneas o menos a cualquier ancho.** Recortar palabras antes que bajar tamaño.
- `text-wrap: balance` en titulares, `pretty` en párrafos. `font-variant-numeric: tabular-nums` en
  cifras que se comparan.
- Alineado a la izquierda por defecto. Centrado como mucho en un momento por página.
- Tipografía correcta: `…` no `...`, comillas tipográficas, espacios duros en `10 MB` y `⌘ K`.

### Color
- Un fondo, una tinta, un acento. El acento va en la acción principal y como mucho otra cosa.
- Texto corrido en la tinta plena. Gris solo para lo secundario. Contraste AA mínimo (4.5:1 texto).
- Superficies separadas por un escalón de tono, no por sombra.
- Tema oscuro diseñado, no invertido: `color-scheme: dark` y `<meta name="theme-color">` acorde.
- Prohibida la paleta de asistente: fondo crema con terracota, violetas e índigos por defecto.

### Espacio y layout
- Una retícula, un par de márgenes (16–32 px), en todas partes. Texto alineado a 2–3 ejes en toda la
  página.
- El hueco entre secciones es claramente mayor que cualquier hueco interno (escaparate: 120–220 px).
- Secciones vecinas no comparten composición. Nada de rejillas de tarjetas idénticas.
- Flex/grid, nunca medir con JS para maquetar. `min-w-0` en hijos flex con texto. Sin scroll horizontal.
- El móvil es su propia composición, no el escritorio apilado. Áreas táctiles ≥ 44 px. Safe areas.

### Forma
- Radio decidido una vez por proyecto: **cuadrado** o **pastilla completa**. El "suave" de 9–16 px es
  el default de las webs flojas.
- Sombra solo en lo que flota de verdad (menú, diálogo, popover). Nada de glows.
- Sin degradados (salvo un velo neutro bajo texto sobre foto), sin glassmorphism, sin blobs, sin
  emoji como iconos, sin navegación flotante en pastilla.

### Imagen
- Una imagen dominante vale más que seis pequeñas. Mismo ratio y tratamiento en toda la página.
- Orden de preferencia: propia del proyecto → generada → archivo abierto con crédito → dibujada en
  código desde el sujeto → solo tipo y color. Nunca un placeholder gris ni una foto ajena presentada
  como del cliente.
- `<img>` con `width`/`height`, `loading="lazy"` bajo el pliegue, `fetchpriority="high"` en el héroe,
  `alt` siempre (vacío si es decorativa).

### Motion
- Solo `transform` y `opacity`. Nunca `transition: all`. `transform-origin` correcto.
- Todo movimiento tiene variante `prefers-reduced-motion` que conserva el contenido.
- Interrumpible. Nada que esconda contenido si el script falla.
- Escaparate: un movimiento firma, entradas escalonadas 60–90 ms, feedback en cada control.
  Herramienta: 120–200 ms, ease-out, solo para comunicar cambio de estado.

### Componentes e interacción
- `<button>` para acciones, `<a>` para navegar. Nunca `<div onClick>`.
- Cada control: estados reposo, hover, active, focus-visible, disabled, loading. Hover/focus suben
  contraste.
- Botones con verbo concreto ("Guardar clave API", no "Continuar"). Uno primario por vista.
- Navegación: marca, 3–5 enlaces, una acción. El footer es un cierre diseñado, no un sitemap.
- La URL refleja el estado (filtros, pestañas, paginación). Acciones destructivas con confirmación o
  deshacer.

### Formularios
- `<label>` siempre, `autocomplete`, `name`, `type` e `inputmode` correctos. Nunca bloquear pegar.
- Errores en línea junto al campo; al enviar, foco al primer error. El botón de envío no se desactiva
  antes de que empiece la petición.
- Placeholder con ejemplo y terminado en `…`.

### Copy
- **Sentence case en todo** (es la norma en español; se descarta el Title Case de Vercel).
- Voz activa, segunda persona. Cifras como números: "8 despliegues".
- Errores con la solución, no solo el problema. Estados de carga con `…`: "Guardando…".
- Fechas y números con `Intl.*`, nunca formatos a mano.

## 4. Lista negra (tells de IA)

Fallan el gate en escaparate; en herramienta, cada uno necesita una razón escrita:

- Etiqueta pequeña sobre el titular ("eyebrow"), chip "Nuevo ·", pastilla encima del H1.
- Numeración índice decorativa: 01 / 02 / 03, (001), "Paso 2".
- Mayúsculas pequeñas con tracking como etiqueta.
- Monoespaciada como adorno.
- Filetes, retículas visibles, cruces de corte, cajas de 1 px vacías.
- Tarjetas con icono arriba en fila de tres. Tarjetas dentro de tarjetas dentro de tarjetas.
- Palabra destacada en el titular (cursiva, serif, color o subrayado).
- Dashboards falsos de barras grises, mockups de "producto" inventados.
- Héroe centrado de tres líneas + subtítulo + dos botones + degradado.
- Lorem ipsum, "Bienvenido a…", "Soluciones innovadoras", "Lleva tu X al siguiente nivel".

Registro completo y fechado: `skills/taste-frontend/references/tells.md`.

## 5. El flujo

Todo trabajo visual sigue este bucle. Las skills son los pasos:

```
 brief ──► 1. LEER        proyecto, marca, assets reales, superficie (§1)
           2. SISTEMA     DESIGN.md existe? si no → design-md (desde marca, desde imagen, o desde cero)
           3. DIRECCIÓN   escaparate → taste-frontend draw · desde imagen → image-to-code
           4. CONSTRUIR   tokens → componentes → pantallas, con contenido completo
           5. GATE        escaparate: taste lint + inspect · herramienta: interface-review
           6. MIRAR       visual-qa: capturas 1440 / 768 / 390, claro y oscuro, estados
           7. ARREGLAR    los 3 peores problemas → volver a 5. Máx. 3 rondas
           8. INFORMAR    qué se decidió, qué se midió, qué falta. Nunca un check no ejecutado
```

## 6. Definición de terminado

Una interfaz está terminada cuando:

- [ ] Existe `DESIGN.md` y todo valor visual del código sale de sus tokens.
- [ ] Gate en verde: cero `FAIL` del inspector / cero hallazgos de `interface-review` sin justificar.
- [ ] Capturas revisadas a 1440, 768 y 390 px, en claro y oscuro si el proyecto tiene ambos.
- [ ] Sin scroll horizontal, sin texto cortado, ningún titular en más de dos líneas.
- [ ] Navegable solo con teclado, foco siempre visible, `prefers-reduced-motion` probado.
- [ ] Estados vacío, cargando, error y contenido largo vistos en pantalla, no solo en código.
- [ ] Contenido real o de muestra marcado como tal en el informe. Ninguna prueba social inventada.
- [ ] Créditos de toda imagen ajena en la página y en el informe.
