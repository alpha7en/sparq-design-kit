---
name: sparq-cards
description: This skill should be used when the user asks to make Telegram cards or a carousel in the SPARQ style — «карточки», «карусель», «пост», «обложка поста», «сверстай пост», «график для карточки» — or to adapt, fix or export SPARQ 1:1 cards in Figma, including choosing card kinds, backgrounds and charts from the SPARQ card system.
---

# SPARQ · карусели карточек 1080²

Система карточек — компоненты страницы «SPARQ · система 1:1 (всё здесь)» (обложки, тела, 23 фона, теги, 16 типов графиков, иконки) и команды `ops`. В новый файл всё ставит `sparq_setup_file {kit:"cards"}`; дальше карточки собираются инструментом `sparq_cards` по спецификациям. Формат — только квадрат 1080², экспорт ×1.69 = 1824². Стиль — лёгкий красный неон + лёгкое стекло.

## Порядок работы
1. `sparq_status` → файл (дизайн-файл, не Slides) с установленным `cards`; нет — `sparq_setup_file {kit:"cards"}`.
2. **Вход:** тексты карточек (post.md/бриф) и данные. Текст автора не переписывать; не влезает → следующий kind (S→M→L) или `continue`, кегль не уменьшать.
3. **Разметка:** на каждую карточку — роль, число слов, есть ли данные и какой вопрос они отвечают. Шаблон карусели — `references/system.md` §Шаблоны.
4. **Карточка:** kind/tone по таблице норм (`references/system.md`), фон по правилам ритма, график — по `references/charts.md` (сначала «нужна ли графика вообще»).
5. **Сборка:** `sparq_cards {slug, date, cards:[spec…]}` по 3–4 карточки за вызов. Ответ содержит `lint` (`bad` = 0 — цель).
6. **Глазами:** `figma_capture_screenshot` ряда «карусель» scale 0.5, затем сомнительные карточки по одной; уменьшение до ~390 px — читается ли без усилия.
7. **Вычитка** — скилл `sparq-editor` (профиль `post`).
8. **Экспорт:** `sparq_export {nodeIds:[…], format:"png", scale:1.69, outDir}` по карточкам.

## Spec карточки
```json
{"kind":"graphic-L","tone":"dark","bg":"dark-haze",
 "props":{"title":"госбюджеты","counter":"|2/6⟩","text":"…"},
 "bold":["$55 млрд"], "rubric":"рынок квантов", "kicker":"кейс · ЕС",
 "chart":{"type":"barH","size":"L","data":{"data":[{"label":"Китай","value":15.3,"accent":1}],"pre":"$"}},
 "texts":{"item-title":"…"}, "photo":"путь/к/фото.jpg"}
```
Обложки: `props:{title, series}` (typo), `{title, subtitle}` (typo-circuit), `{name, regalia}` (person), `{title, issue}` (rubric-number). Hero: `number`. Quote: `text, who, role`. Bubble: `bubble`. Источник (`source`) на карточку не ставим (только если сам источник — смысл карточки).

## Режимы
- **A · сборка** (по умолчанию): готовые kind/tone, тексты свойствами, графики генератором.
- **B · адаптация**: `sparq_run {kit:"cards"}` с `O` — сдвинуть/скрыть декор фона, сменить фон (`O.bg`), тир заголовка, перестроить зону графика (`node.detachInstance()` при необходимости, после detach вернуть `bg` в ABSOLUTE).
- **C · свободный**: `O.blank(name, bg)` и рисование из токенов (`O.K`, `O.L`, генераторы `O.C.G.*`). Тот же стиль, поля 72, зазоры ≥ 16, `O.lint()` = 0.
Помечать в отчёте «адаптировано»/«нарисовано заново» и почему.

## Ресурсы
- `references/system.md` — компоненты, нормы слов, ритм и фоны, шаблоны каруселей, ловушки Figma.
- `references/charts.md` — какая инфографика когда, правила честности, генераторы и форматы данных.
- `sparq_catalog {what:"cards"}` — точные имена вариантов и свойств из библиотеки (без Figma).
