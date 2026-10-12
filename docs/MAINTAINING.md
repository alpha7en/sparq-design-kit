# Сопровождение

## Сборка
```bash
bash tools/build-plugin.sh
```
Делает: ассеты из `design/_source` → компиляция форка (`mcp/`) → один файл `plugins/sparq-studio/server/sparq-mcp.mjs` (esbuild) → копия моста (переименован в «SPARQ Studio Bridge») → копия `design/` в плагин. Результат коммитится: пользователю сборка не нужна.

Проверка: `claude plugin validate plugins/sparq-studio` и `claude plugin validate .`.

## Выпуск версии
1. Поднять `version` в `plugins/sparq-studio/.claude-plugin/plugin.json` и `KIT_VERSION` в `mcp/src/sparq/assets.ts` (одинаково).
2. `bash tools/build-plugin.sh`, коммит, тег (`claude plugin tag plugins/sparq-studio`), пуш.
3. Коллеги: `/plugin update sparq-studio@sparq` → перезапуск → в рабочих файлах `sparq_setup_file` (для карточек с `replaceLibrary:true`, если менялись компоненты).

## Обновить дизайн из Figma
Запустить сервер с `SPARQ_MAINT=1` (например, локальный `.mcp.json` разработчика) — появится `sparq_maint_export`:
- компоненты карточек: `{what:"cards-library", fileKey:<SPARQ.2>, out:"design/library/cards.json"}`;
- токены карточек: `{what:"cards-tokens", …, out:"design/_source/cards/tokens/raw.json"}` → разложить в `variables.json` и `*-styles.json` (формат см. `tools/build-design.mjs`);
- токены презентаций: `{what:"deck-tokens", …}` аналогично в `design/_source/deck/`.
Потом `bash tools/build-plugin.sh`.

## Где что менять
| что | файл |
|---|---|
| блоки и макеты слайдов | `design/runtime/deck/dsl.js` + описание в `skills/sparq-deck/references/dsl.md` |
| низкоуровневые хелперы | `design/runtime/deck/kit.js` |
| проверки вёрстки | `design/runtime/common/audit.js` |
| редакторские правила линтера | `mcp/src/sparq/textlint.ts` + `skills/sparq-editor` |
| инструменты MCP | `mcp/src/sparq/tools.ts` |
| какие инструменты figma-console оставить | `UPSTREAM_KEEP` в `mcp/src/sparq/tools.ts` |
| система карточек | `design/runtime/cards/*` (копия кода из SPARQ.2), снимок `design/library/cards.json` |

## Обновить форк figma-console-mcp
`mcp/UPSTREAM.md` — от какого коммита форк. Изменения относительно оригинала: `src/sparq/*`, правки в `src/local.ts` (фильтр инструментов, регистрация, имя и инструкции сервера, папка моста `~/.sparq-studio/bridge`, без accessibility-инструментов), `src/core/resolve-package-root.ts`, `src/core/identity.ts`. При обновлении перенести эти места.

## Тест без Claude
`node tools/dev/harness.mjs plugins/sparq-studio/server/sparq-mcp.mjs plugins/sparq-studio/design` — сервер на WebSocket 9229, вызовы инструментов через HTTP (`curl -X POST localhost:9301 -d '{"name":"sparq_status"}'`); мост Figma подключается к нему сам.
