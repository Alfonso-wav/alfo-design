# design_skills

Conglomerado de skills para que cualquier proyecto tenga mejor diseño. Un manifiesto como ley y ocho
skills que lo aplican: dirección de arte, sistema de diseño, revisión, imagen a código y QA en
navegador real.

**Empieza por [`skills/design-manifesto/MANIFESTO.md`](skills/design-manifesto/MANIFESTO.md).**

## Skills

| Skill | Para qué | Origen |
| --- | --- | --- |
| `design-manifesto` | Entrada: carga el manifiesto, clasifica escaparate/herramienta y encadena el resto | propia |
| `design-md` | Crear/validar el `DESIGN.md` del proyecto; 84 marcas de referencia; tokens → CSS; deriva de color | propia + [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) |
| `design-taste-frontend` (`skills/taste-frontend`) | Dirección de arte anti-slop para escaparates, `lint.mjs` + `inspect.mjs` | [Taste Skill](https://github.com/Leonxlnx/taste-skill) (vendorizada) |
| `redesign-existing-projects` (`skills/taste-redesign`) | Auditar y subir de nivel una UI existente | Taste Skill (vendorizada) |
| `interface-review` | Revisión `file:line` contra Web Interface Guidelines + ajustes del manifiesto | propia + [Vercel](https://github.com/vercel-labs/web-interface-guidelines) |
| `image-to-code` | Imagen/mockup → paleta medida → `DESIGN.md` → código → comparación lado a lado | propia + Image to Code de Taste Skill |
| `visual-qa` | Capturas 1440/768/390 claro/oscuro + medidas automáticas + foco + reduced-motion | propia, sobre Playwright CLI |
| `playwright-cli` | Referencia completa de comandos del navegador | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) (vendorizada) |

## Instalar

Requisitos: Node 22+, Chrome o Edge, y Playwright CLI:

```bash
npm install -g @playwright/cli@latest
```

Como plugin de Claude Code (todas las skills, en todos los proyectos):

```
/plugin marketplace add Alfonso-wav/alfo-design
/plugin install alfo-design@alfo-design
```

Para actualizar tras cambios en el repo: `/plugin marketplace update alfo-design`.

## Scripts

```bash
node skills/design-md/scripts/design.mjs list|show|tokens|check|drift …
node skills/image-to-code/scripts/palette.mjs ref.png [--width 1440] [--region x,y,w,h]
node skills/visual-qa/scripts/qa.mjs <url|archivo|carpeta> [--reference ref.png]
node skills/taste-frontend/scripts/{draw,lint,inspect,assets}.mjs …
```

`examples/smoke/` tiene una página con fallos plantados (`bad.html`) y una limpia (`good.html`) para
comprobar que los gates siguen funcionando:

```bash
node skills/visual-qa/scripts/qa.mjs examples/smoke/bad.html   # debe dar FAILs (exit 1)
node skills/visual-qa/scripts/qa.mjs examples/smoke/good.html  # 0 FAIL
node skills/taste-frontend/scripts/lint.mjs examples/smoke/bad.html
```

## Actualizar las fuentes

Lo vendorizado no se edita a mano:

```bash
bash scripts/sync-upstream.sh
```

Commits y licencias en [`third_party/`](third_party/UPSTREAM.md). Taste Skill, Web Interface
Guidelines y awesome-design-md son MIT; Playwright CLI, Apache-2.0.
