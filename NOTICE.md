# Сторонний код и благодарности

**figma-console-mcp** — https://github.com/southleft/figma-console-mcp
MIT License, Copyright (c) 2025 Figma Console MCP Contributors (полный текст — `LICENSE-figma-console-mcp`).
SPARQ Studio содержит форк этого проекта (коммит 7f0d8bfe, v1.40.9): сервер в `mcp/` и собранный `plugins/sparq-studio/server/sparq-mcp.mjs`, а также плагин-мост Figma (`figma-desktop-bridge`, переименован в «SPARQ Studio Bridge»). Наши изменения перечислены в `mcp/UPSTREAM.md` и `docs/MAINTAINING.md`. Проект не связан с авторами figma-console-mcp и не одобрен ими.

Собранный сервер также включает npm-зависимости figma-console-mcp (в т. ч. @modelcontextprotocol/sdk, ws, zod, pdf-lib) под их собственными открытыми лицензиями (MIT и совместимыми).

Шрифты Unbounded, Onest, JetBrains Mono (SIL OFL) в репозиторий не входят — Figma подгружает их сама. Знак и бренд SPARQ принадлежат команде SPARQ.
