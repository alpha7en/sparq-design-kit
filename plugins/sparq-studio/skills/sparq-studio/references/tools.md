# Инструменты (MCP-сервер `sparq`)

| инструмент | когда |
|---|---|
| `sparq_status` | начало работы, «что открыто», после пауз; путь к манифесту моста |
| `sparq_use_file {fileKey}` | выбрать и закрепить файл |
| `sparq_setup_file {kit}` | поставить/обновить набор `deck` / `cards` в файл |
| `sparq_deck_config` | общие настройки колоды: total, counter, logo (SVG), voice, page |
| `sparq_slides {slides[]}` | собрать/пересобрать слайды из DSL; сам проверяет и ловит ручные правки |
| `sparq_cards {slug, cards[]}` | собрать карточки карусели |
| `sparq_audit {keys?|nodeIds?}` | перепроверить без пересборки |
| `sparq_text_lint {texts[]}` | редакторская проверка черновика (без Figma) |
| `sparq_comments` | комментарии пользователя, привязанные к слайдам/карточкам |
| `sparq_export {outDir, format}` | PNG/JPG/PDF в папку; размер PDF |
| `sparq_run {code, kit}` | свой код с загруженным рантаймом (K, D или O) — свободный режим |
| `sparq_catalog {what}` | списки иконок, компонентов карточек, генераторов графиков (без Figma) |

Из исходного figma-console оставлены: `figma_capture_screenshot` (смотреть результат), `figma_execute` (крайний случай), `figma_get_selection` (что выделил пользователь), `figma_post_comment`/`figma_delete_comment` (ответить в Figma), `figma_list_slides`/`figma_skip_slide`/`figma_reorder_slides`/`figma_focus_slide` (Slides), `figma_set_image_fill`, `figma_navigate`/`figma_list_open_files`/`figma_get_status`/`figma_reconnect`/`figma_diagnose` (связь).
Полный набор старых инструментов — переменная окружения `SPARQ_TOOLSET=full` (только для разработчиков).
