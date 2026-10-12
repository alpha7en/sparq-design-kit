# SPARQ Studio — плагин Claude Desktop для дизайна в стиле SPARQ

Claude сам собирает в Figma **презентации** (1920×1080) и **карусели карточек для Telegram** (1080²) в стиле SPARQ, проверяет их на ошибки вёрстки и текста, читает ваши комментарии в Figma и исправляет. Дизайн-система — токены, стили, иконки, компоненты карточек, движок слайдов, генераторы графиков — запечатана внутри плагина: новый файл Figma готовится одной командой.

## Установка (≈ 10 минут, один раз на компьютер)

**Нужно заранее**
- **Claude Desktop**, вкладка **Code** (плагины работают там).
- **Node.js 18+**: nodejs.org → кнопка LTS → установить.
- **Figma Desktop** (не браузер): figma.com/downloads.
- **Доступ к репозиторию** `alpha7en/sparq-design-kit` (он закрытый): попросите владельца добавить вас в GitHub → Settings → Collaborators; вход в GitHub на компьютере — см. шаг 1.

**Шаг 1. Вход в GitHub (только для закрытого репозитория).** В Claude Desktop → Code напишите: «выполни `gh auth login`» (если `gh` нет — «установи GitHub CLI через brew и выполни `gh auth login`») и пройдите вход в браузере.

**Шаг 2. Плагин.** Там же, в Claude Desktop → Code, напишите Claude:
> Установи плагин SPARQ Studio: выполни `claude plugin marketplace add alpha7en/sparq-design-kit`, затем `claude plugin install sparq-studio@sparq`.

(То же самое можно сделать в Терминале, если установлен Claude Code CLI.) Затем **полностью перезапустите Claude Desktop** (⌘Q и открыть заново).

**Шаг 3. Мост в Figma.** Напишите Claude: **«/sparq-studio:setup»** — он проведёт по шагам. Суть: Figma Desktop → **Plugins → Development → Import plugin from manifest…** → файл `~/.sparq-studio/bridge/manifest.json` (в окне выбора файла нажмите ⌘⇧G и вставьте путь `~/.sparq-studio/bridge`). Плагин называется **SPARQ Studio Bridge**.

**Шаг 4 (по желанию). Комментарии Figma.** Figma → Settings → Security → Personal access tokens → создать (File content: read, Comments: read) → сохранить токен одной строкой в файл `~/.sparq-studio/figma-token`. Токен не вставлять в чат.

**Проверка:** напишите «/sparq-studio:status» — Claude скажет, подключён ли мост и какие файлы Figma открыты.

**Обновление:** «выполни `claude plugin update sparq-studio@sparq`» → перезапуск Claude Desktop.

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
| исходники | `mcp/`, `design/`, `tools/` | для разработчиков: `docs/ARCHITECTURE.md`, `docs/MAINTAINING.md`, состояние по ТЗ — `docs/STATUS.md` |
