---
name: design-manifesto
description: Punto de entrada para cualquier trabajo visual en cualquier proyecto. Carga el manifiesto de diseño (precedencias, leyes de tipografía/color/espacio/motion, lista negra de tells de IA, definición de terminado), clasifica el trabajo como escaparate o herramienta y encadena las skills del repo en orden — design-md, taste-frontend, image-to-code, interface-review, visual-qa. Úsala siempre que vayas a construir, rediseñar, pulir o revisar una interfaz web (landing, app, dashboard, componente, página), cuando el usuario diga que algo se ve genérico, feo, "hecho por IA" o pida mejorar el diseño, y antes de dar por terminada cualquier UI.
---

# Manifiesto de diseño — orquestador

Lee `MANIFESTO.md` (en esta carpeta) entero la primera vez en la sesión. Es la ley; esta skill solo dice
en qué orden aplicarla. Las skills hermanas están en `../<nombre>/`.

## 1. Situarse (1 minuto, sin preguntar salvo bloqueo)

- ¿Hay `DESIGN.md` en la raíz del proyecto? Léelo: manda sobre el manifiesto (§0).
- ¿Hay memorias o reglas de diseño de este proyecto (CLAUDE.md, memoria)? También mandan.
- **Superficie** (§1): escaparate o herramienta. Escríbela en una línea. Si es mixta (landing + app),
  cada parte con su código.
- **Entrada**: brief en texto, imagen/captura de referencia, marca existente, o una UI ya hecha que
  mejorar.

## 2. Encadenar

| Situación | Ruta |
| --- | --- |
| Proyecto sin `DESIGN.md` | `design-md` primero. Siempre. |
| Escaparate nuevo desde un brief | `design-md` → `taste-frontend` (draw → construir → `lint.mjs` + `inspect.mjs` → mirar) → `visual-qa` |
| Hay una imagen, mockup o captura que imitar | `image-to-code` (extrae → `DESIGN.md` → construye → `visual-qa --reference`) |
| "Que se parezca a Linear/Stripe/…" | `design-md` desde la marca de la biblioteca, adaptada (nunca copiar logo ni nombre) |
| App, dashboard, panel, formulario | `design-md` → construir → `interface-review` → `visual-qa` |
| Mejorar una UI existente | `visual-qa` + `interface-review` (+ `taste-frontend` `lint`/`inspect` si es escaparate) para diagnosticar → `taste-redesign` para el plan → arreglar → volver a medir |
| Solo revisar | `interface-review` + `visual-qa`, informe `file:line` y capturas. No tocar código salvo que lo pidan. |
| Un componente suelto | Respetar el sistema existente; `interface-review` del archivo y `visual-qa` de la página que lo contiene. |

Pruebas en navegador: siempre con `playwright-cli` (skill `playwright-cli`), nunca suponiendo.

## 3. Cerrar

Antes de decir "listo", recorre la **definición de terminado** (§6 del manifiesto) y en el informe:

- superficie, dirección/idea, y de qué `DESIGN.md` salen los tokens;
- qué gates se ejecutaron y su resultado literal (FAIL/WARN restantes con su justificación);
- qué capturas se miraron y los tres problemas que se arreglaron por ronda;
- contenido de muestra a sustituir y créditos de imágenes ajenas;
- lo que no se pudo comprobar, dicho tal cual.

## Requisitos

Node 22+ y Chrome/Edge para `taste-frontend`; `playwright-cli` global
(`npm install -g @playwright/cli@latest`) para `visual-qa` e `image-to-code`. Si falta algo, dilo en
el informe y usa la mejor alternativa disponible; nunca declares un check que no se ejecutó.
