# Slide DSL — справочник (sparq_slides)

Слайд 1920×1080 описывается JSON. Движок сам ставит шапку, сетку (поля 96, ширина контента 1728), стили, автолейаут и типографику (неразрывные пробелы, тире, «ёлочки» не трогает). Пиши только смысл и структуру.

## Слайд
```json
{"key":"S05", "n":5, "theme":"dark|light", "title":"…", "lead":"подзаголовок", "foot":"источники",
 "aside":{блок справа от заголовка}, "chapter":"метка главы", "fill":false, "gap":28,
 "layout":"content|cover|chapter", "body":[блоки сверху вниз]}
```
- `key` обязателен и стабилен: повторная сборка с тем же ключом заменяет слайд.
- `n` — номер для счётчика `|n/N⟩` (N задаёт `sparq_deck_config total`).
- `foot` — источники, 10 pt, прижаты к низу; контент обязан закончиться выше.
- `aside` — легенда/бейдж/чипы на уровне заголовка (заголовок сам сужается).
- `fill:true` — растянуть самый высокий блок до низа (карточки ряда вырастают; `field`/`spacer` с `grow` забирают место). Использовать, когда снизу пусто > 170 px.
- `leadStyle`, `titleStyle` — сменить стиль (`body-s` для длинного подзаголовка).

### Макеты
- `cover`: `kicker`, `title`, `titleSize`, `subtitle`, `meta:[{k,v}]`, `illus:"circuit|bloch|none"`, `mark:false`.
- `chapter`: `chapterN`, `title`, `lead`, `items:[…]` («в главе»), `illus`.
- `content` (по умолчанию): шапка + `title` + `body`.

## Текст и цвет
Во всех текстах `**жирное**` — полужирный фрагмент. Стили: `lead` 32 · `body` 30 · `body-s` 28 · `body-xs` 28 · `heading-s` 30 · `heading` 36 · `title-s` 44 · `label`/`note` (моно 22/20, только служебное). Цвет: `primary` (по умолч.) · `secondary` · `muted` · `accent` · `deep`.

## Блоки (`"type"`)
**Компоновка**
- `row` `{items, gap:48, align:"top|center|bottom", equal:true, grid:true}` — ряд. Ширина ребёнка: `w` в px, `"40%"`, `"hug"`, иначе поровну. Карточки ряда выравниваются по высоте; ряд из `col` выравнивает k-й элемент колонок между собой.
- `col` `{items, gap:24}` — колонка.
- `card` `{variant:"raised|inverse|outline|dashed|plain", title, icon, kicker, titleSize:"s|m|l", items, pad, gap, rail:true}` — карточка. `inverse` — главная плашка слайда (светлая на тёмном, тёмная на светлом), не больше одной на слайд. `rail` — красная линия сверху.
- `strip` `{items:[блоки]}` — полоса ячеек с линией сверху (итог, «вход/выход»).
- `spacer` `{h, grow}` · `rule` `{strong}` · `field` `{h, grow}` — тихий узор интерференции для свободной зоны.

**Текст и списки**
- `text` `{text, style, color, align}` · `kicker` `{text}` (надзаголовок капсом моно) · `heading` `{text, size:"s|m|l", icon}`.
- `list` `{items, marker:"icon|ket|num|dot|arrow|check|none", size:"body|body-s|body-xs", pad:16, dividers:true, strongTop, grow, iconSize:36, markerColor}`; пункт — строка или `{text, icon, sub}`.
- `compare` `{items:[{from, to}]}` — «было → наш ответ» (серое → белое жирное со стрелкой).
- `banner` `{text, variant:"rail|card", style}` — одна главная мысль на всю ширину.
- `quote` `{text, who}` · `chips` `{items, hot:[i]}` · `badge` `{text, hot}`.

**Цифры и инфографика**
- `kpi` `{value, caption, size:"xl|l|m|s", color, icon, viz}`; `viz`:
  - `{type:"stack", parts:[{v, label, color}], w}` — доли одной полосой;
  - `{type:"people", of:5, hit:1}` — «1 из 5»;
  - `{type:"donut", pct, size:96}` — кольцо слева от числа;
  - `{type:"icon", icon, size}` — кольцо с иконкой слева;
  - `{type:"scale", of:9, at:3, w}` — шкала (УГТ, уровни);
  - `{type:"bar", pct, w}` — полоса прогресса.
- `kpis` `{items:[kpi], dir:"row|col", dividers, grow, pad:20}` (pad — вертикальный отступ ячеек в колонке) — ряд/столбец цифр.
- `scale` `{of, at, w, caption}` · `donut` `{pct, size}`.
- `bars` `{items:[{label, v, display, accent}], suffix, barW, labelW}` — горизонтальные бары с подписями.
- `funnel` `{items:[{v, label, accent}], barW, pad}` — воронка (число | полоса над подписью).
- `table` `{cols:[{label, sub, w}], rows:[[ячейки]], highlight:i, size, pad:8}`; ячейка — строка или `{mark:"full|half|none", text}`; `highlight` — колонка-герой (наш продукт) тёмной заливкой. `legend` `{items:[{mark,text}]}` — для `aside`.
- `steps` `{items:[{title, text, icon, core}], arrows:true}` — конвейер карточек со стрелками; `core` — ядро (шире, инверсное).
- `timeline` `{items:[{date, title, icon, now, items:[…]}], phases:[…]}` — дорожная карта.

**Навигация и источники** (длинные отчёты)
- `toc` `{items:[{n, title, sub, pages, current}], grow, size, numW}` — хаб/оглавление: `|n⟩` · название · подпись · страницы; `current:true` подсвечивает текущую главу (на слайде-входе в главу).
- `sources` `{items:[строки], cols:2, start:1, size:"body-xs|note"}` — нумерованный список источников в колонках (слайд «Источники»; линтер его не трогает, пустота снизу не считается ошибкой).

**Люди и картинки** (пути к локальным файлам — сервер сам встроит; ≤ 300 КБ JPEG)
- `image` `{src, frame:"browser|plain|round", w, h|ratio, crop:[x,y,w,h], title, text}` — скриншот в рамке браузера, `crop` в пикселях исходника (вырезать фрагмент, а не уменьшать весь экран).
- `people` `{items:[{photo, name, role, text}], photo:176}` — команда.
- `contact` `{items:[{photo, name, role, lines:[{icon, text}]}]}` — контакты.

## Иконки
Линейные, один набор. Основные (интерфейс Arena): qubit bloch gate cnot circuit measure entangle lock shield clock calendar university contest people question doc growth ban chip noise key ket superposition wave atom lab energy cloud globe video certificate search check x play bell sliders plus trophy user mail filter terminal code book info home pencil eye flame bars download upload. Отраслевые (`q-…`): q-bloch q-photon q-atom q-entanglement q-lock-pqc q-key q-qkd q-fiber q-trusted-node q-node q-magnetometer q-lab q-money q-factory q-hackathon q-cart q-truck q-warehouse q-store q-server q-calendar и др. Полный список — `sparq_catalog {what:"icons"}`.

## Ответ сборки
`{key, id, words, issues[], lint[]}`:
- `overflow` — урезать текст или разбить слайд (кегль не уменьшать);
- `empty bottom` — `fill:true`, `pad` побольше, визуальный блок;
- `layout: TEXT×TEXT / TIGHT / TOUCH / MIDWORD / OUT-OF-SLIDE / GAP<PAD` — наезд, впритык, касание линии, перенос внутри слова, выход за слайд, зазор меньше внутреннего отступа;
- `lint` — редакторские замечания (см. скилл sparq-editor);
- `skipped … manualEdits` — пользователь правил слайд руками: перенести его правки в спецификацию и собрать с `force:true`.
