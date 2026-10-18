#!/usr/bin/env bash
# Re-vendors the upstream skills this repo is built on.
# Usage: scripts/sync-upstream.sh [workdir]
# Clones each upstream shallowly into workdir (default: a temp dir), copies the
# parts we use into skills/ and third_party/, and records the commit in third_party/UPSTREAM.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${1:-$(mktemp -d)}"
mkdir -p "$WORK"

clone() { # repo dir
  if [ -d "$WORK/$2/.git" ]; then git -C "$WORK/$2" pull -q --ff-only; else git clone -q --depth 1 "https://github.com/$1.git" "$WORK/$2"; fi
  git -C "$WORK/$2" rev-parse --short HEAD
}

TASTE=$(clone Leonxlnx/taste-skill taste)
VWIG=$(clone vercel-labs/web-interface-guidelines vwig)
VSKL=$(clone vercel-labs/agent-skills vskills)
AWES=$(clone VoltAgent/awesome-design-md awesome)
PWCL=$(clone microsoft/playwright-cli pwcli)

S="$ROOT/skills"
T="$ROOT/third_party"
mkdir -p "$S" "$T"

# Taste Skill v2 (art direction + inspector) and its redesign skill — copied whole.
rm -rf "$S/taste-frontend" "$S/taste-redesign"
cp -r "$WORK/taste/skills/taste-skill" "$S/taste-frontend"
cp -r "$WORK/taste/skills/redesign-skill" "$S/taste-redesign"
cp "$WORK/taste/LICENSE" "$T/LICENSE.taste-skill"

# Image to Code (Taste Skill) — kept as a reference inside our own image-to-code skill.
mkdir -p "$S/image-to-code/references"
cp "$WORK/taste/skills/image-to-code-skill/SKILL.md" "$S/image-to-code/references/upstream-image-first.md"

# Vercel Web Interface Guidelines — rules file used offline by interface-review.
mkdir -p "$S/interface-review"
cp "$WORK/vwig/command.md" "$S/interface-review/vercel-rules.md"
cp "$WORK/vwig/LICENSE" "$T/LICENSE.vercel-web-interface-guidelines"

# Awesome DESIGN.md — the brand library used by design-md.
rm -rf "$S/design-md/brands"
mkdir -p "$S/design-md/brands"
for d in "$WORK/awesome/design-md"/*/; do
  b=$(basename "$d")
  [ -f "$d/DESIGN.md" ] && cp "$d/DESIGN.md" "$S/design-md/brands/$b.md"
done
cp "$WORK/awesome/LICENSE" "$T/LICENSE.awesome-design-md"

# Playwright CLI skill — copied whole.
rm -rf "$S/playwright-cli"
cp -r "$WORK/pwcli/skills/playwright-cli" "$S/playwright-cli"
cp "$WORK/pwcli/LICENSE" "$T/LICENSE.playwright-cli"

cat > "$T/UPSTREAM.md" <<EOF
# Upstream

Vendored by \`scripts/sync-upstream.sh\` on $(date +%Y-%m-%d). Do not edit vendored files by hand; re-run the script.

| Source | Commit | License | Lands in |
| --- | --- | --- | --- |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | \`$TASTE\` | MIT | \`skills/taste-frontend/\`, \`skills/taste-redesign/\`, \`skills/image-to-code/references/upstream-image-first.md\` |
| [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | \`$VWIG\` | MIT | \`skills/interface-review/vercel-rules.md\` |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | \`$VSKL\` | MIT | (reference only: web-design-guidelines skill shape) |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | \`$AWES\` | MIT | \`skills/design-md/brands/\` |
| [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | \`$PWCL\` | Apache-2.0 | \`skills/playwright-cli/\` |
EOF

echo "synced into $ROOT (work dir: $WORK)"
