# SPARQ Studio — плагин Claude Desktop для дизайна в стиле SPARQ

Claude сам собирает в Figma **презентации** (1920×1080) и **карусели карточек для Telegram** (1080²) в стиле SPARQ, проверяет их на ошибки вёрстки и текста, читает ваши комментарии в Figma и исправляет. Дизайн-система — токены, стили, иконки, компоненты карточек, движок слайдов, генераторы графиков — запечатана внутри плагина: новый файл Figma готовится одной командой.

## Установка (5 минут, один раз)

1. **Node.js 18+** — nodejs.org → LTS → установить.
2. **Figma Desktop** — figma.com/downloads (браузерная версия не подходит).
3. **Плагин в Claude Desktop** (вкладка Code), в поле ввода:
   ```
   /plugin marketplace add <github-владелец>/sparq-design-kit
   /plugin install sparq-studio@sparq
   ```
   Перезапустить Claude Desktop.
4. Написать Claude: **«/sparq-studio:setup»** — он проведёт по оставшимся шагам: импорт моста «SPARQ Studio Bridge» в Figma (Plugins → Development → Import plugin from manifest → `~/.sparq-studio/bridge/manifest.json`) и подготовку файла.
5. *(по желанию)* Токен Figma для чтения комментариев: Figma → Settings → Security → Personal access tokens → сохранить в файл `~/.sparq-studio/figma-token`.

## Как работать

- Открыть файл в Figma Desktop → **Plugins → Development → SPARQ Studio Bridge** (в каждом файле, с которым работаете).
- В Claude:
  - `/sparq-studio:status` — что открыто и что установлено;
  - `/sparq-studio:deck путь/к/ТЗ.md` — собрать презентацию;
  - `/sparq-studio:cards путь/к/посту.md` — собрать карусель;
  - `/sparq-studio:comments` — прочитать ваши комментарии в Figma и исправить;
  - `/sparq-studio:review` — проверка свежим взглядом и вычитка;
  - `/sparq-studio:export pdf` — выгрузка.
- Можно и без команд, обычными словами: «сделай презентацию по этому ТЗ», «поправь слайд 6», «вычитай тексты».

Примеры: в файле Figma **SPARQ.2 framework** страницы «SPARQ · система 1:1 (всё здесь)» (карточки) и «SPARQ · презентации 16:9» (каталог блоков и живая презентация).

## Что внутри

| часть | где | что |
|---|---|---|
| плагин | `plugins/sparq-studio/` | скиллы (старт, презентации, карточки, редактура, уроки правок), команды, три агента-проверяющих, хук старта |
| MCP-сервер | `plugins/sparq-studio/server/` | форк [figma-console-mcp](https://github.com/southleft/figma-console-mcp) (MIT) + инструменты `sparq_*`, собран в один файл |
| мост для Figma | `plugins/sparq-studio/server/figma-desktop-bridge/` | плагин Figma «SPARQ Studio Bridge» |
| дизайн-система | `plugins/sparq-studio/design/` | токены, иконки, библиотека 292 компонентов карточек, рантайм (движок слайдов, генераторы, проверки) |
| исходники | `mcp/`, `design/`, `tools/` | для разработчиков: `docs/ARCHITECTURE.md`, `docs/MAINTAINING.md` |
