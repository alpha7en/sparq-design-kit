#!/usr/bin/env bash
# SPARQ Studio · full build: sealed design bundles → MCP fork → single-file server → plugin folder.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/plugins/sparq-studio"

node "$ROOT/tools/build-design.mjs"

cd "$ROOT/mcp"
npx tsc -p tsconfig.local.json
npx esbuild dist/local.js --bundle --platform=node --format=esm --target=node18 \
  --outfile="$PLUGIN/server/sparq-mcp.mjs" --log-level=warning \
  --banner:js="import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);"

# bridge plugin for Figma (renamed so it can live next to the upstream one)
rm -rf "$PLUGIN/server/figma-desktop-bridge"
cp -R "$ROOT/mcp/figma-desktop-bridge" "$PLUGIN/server/figma-desktop-bridge"
node -e '
const f=process.argv[1]; const m=require(f);
m.name="SPARQ Studio Bridge"; m.id="sparq-studio-bridge";
require("fs").writeFileSync(f, JSON.stringify(m,null,2));
' "$PLUGIN/server/figma-desktop-bridge/manifest.json"
VERSION="$(node -p "require('$ROOT/plugins/sparq-studio/.claude-plugin/plugin.json').version")"
printf '{"name":"sparq-studio-mcp","version":"%s","type":"module","private":true}\n' "$VERSION" > "$PLUGIN/server/package.json"

# sealed design assets (no raw sources)
rm -rf "$PLUGIN/design"
mkdir -p "$PLUGIN/design"
for d in tokens icons library runtime catalog; do cp -R "$ROOT/design/$d" "$PLUGIN/design/$d"; done

echo "built $(du -sh "$PLUGIN" | cut -f1) → $PLUGIN"
