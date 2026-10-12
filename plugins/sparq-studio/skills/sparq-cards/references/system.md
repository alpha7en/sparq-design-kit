# Система карточек SPARQ 1:1

## Компоненты
| набор | что | свойства |
|---|---|---|
| `sparq/card/title` | 9 обложек: typo · dark (серия автора), typo-circuit · dark (explain), typo · red (дайджест), rubric-number · dark (рубрики), photo-full / photo-window · dark (новость с фото), person · dark (персона), duo · dark (интервью), sci-plate · light (научный рисунок) | title, series / subtitle / issue, name, regalia; фото — слой `photo` |
| `sparq/card/body` | 25 тел (kind × tone) | title, counter `|n/N⟩`, text, source (скрыт), number (hero), who/role (quote), bubble; графики «график XL/L/M/SW/SN» |
| `sparq/bg` | 23 фона | dark-ring, dark-orbit, dark-crosshair, dark-dots, dark-wires, dark-haze, dark-gradient, dark-circuit, dark-ticks, glass-orb, glass-bolt, light-paper, light-frost, light-grid, red, red-deep, cover-* … |
| `sparq/rubric`, `sparq/tag`, `sparq/series`, `sparq/topic`, `sparq/country`, `sparq/status`, `sparq/meta` | плашки и теги шапки | label |
| `sparq/chart/*` | 16 типов графиков по размерам слотов | — |
| `sparq/icon/*` | одобренные иконки | — |
Точные имена — `sparq_catalog {what:"cards"}`.

## Какую карточку взять (норма слов)
| содержание | kind · tone | слов |
|---|---|---|
| вход, мало текста | text-s · dark | ≤ 40 |
| основной текст | text-m · dark / glass | 41–85 |
| пауза в ритме | text-m · light | ≤ 85, 1–2 на карусель |
| длинный авторский | text-l · dark | 86–150 |
| текст + простой график | graphic-M | ≤ 50 |
| текст + сложный график | graphic-L | ≤ 35 |
| вертикальные данные | graphic-SW / SN | ≤ 35 / ≤ 50 |
| главный график поста | graphic-XL · dark / red | лид ≤ 9 |
| одна цифра решает | hero · dark / red | ≤ 30 |
| позиция, слова | quote · glass / light | ≤ 45 |
| вывод, «кому подойдёт» | bubble | 7–41 |
| 3–5 механизмов | list · dark / light | ≤ 60 |
| кейс страны/компании | case | ≤ 70 |
| две модели рядом | two-sections | 2 × ≤ 35 |
| сравнение позиций | table | ≤ 30 |
| не влезло | continue | ≤ 85 |
| итог / финал | final-figures / final-tail · red | ≤ 60 |
Обложка: тема шире 936 px → следующий тир заголовка (cover-l → cover-m → cover-s), не переносить слово. Заголовки карточек — строчными, 1–3 слова, без точки, имя явления, а не рубрикатор.

## Ритм и фоны
- Фон под содержание, шапка под фон. Декор держит ≥ 48 px от шапки (рубрика + знак, y 72–128), заголовка, текста, стекла, графика.
- Текст сверху, низ свободен → dark-ring / orbit / crosshair / dots / wires. Контент до низа → dark-haze / gradient / circuit / ticks. Стекло → glass-orb / glass-bolt. Обложка → cover-*.
- ≤ 2 одинаковых фона подряд; 1–2 светлых; ≤ 1 красной; хотя бы одна стеклянная и одна светлая в карусели; плоские тёмные — не больше двух подряд.
- Обложка новости — с изображением предмета; типографская — для серий и explain. Чужие логотипы как есть не вставлять.
- Не все карточки по 50+ слов: 1–2 лёгкие (цитата, одно число, простая схема), лучше на 2–3 позиции.
- Один герой на карточку; неон ≤ 2 элементов и никогда на тексте; знак — только на обложке, на остальных — счётчик.

## Шаблоны каруселей (основа, не клетка)
| шаблон | последовательность (kind · фон · график) |
|---|---|
| аналитика рынка | title typo · cover-ring → text-m · dark-haze → graphic-L · dark-haze · barH L → graphic-SW · dark-haze · donut/timeline SW → hero · red → graphic-XL · dark-ticks · sankey/line/barV XL → final-figures · dark-ring |
| кейсы стран | title typo · cover-ring → text-s · dark-ring → case · dark-haze (кикер «кейс · страна») → case · dark-circuit → table · dark-haze → final-tail · red |
| explain | title typo-circuit · cover-circuit → text-m light · light-paper (определение) → two-sections · dark-ticks → list · dark-circuit (3–5 применений с иконками) → bubble · dark-haze → final-tail · red |
| персона | title person · cover-circuit → text-m · dark-haze → quote light · light-paper → graphic-L · dark-ticks · timeline L → final-tail · red |
Карточки добавлять, убирать и менять под блоки брифа.

## Проверка
`O.lint()` (в ответе `sparq_cards`) ловит: декор под контентом, текст < 64 px от края, кегль < 28, наезды и зазоры < 12, текст на тексте, текст у края стекла, перенос внутри слова. Ложные: «+» в узле блок-схемы, цифры в ярусах пирамиды. Контраст на градиентах считать по таблице: белый на #CC0000 — 5.9 (коротко); ink на красном — запрещено; frost-500 на светлом — запрещено для текста.

## Ловушки Figma (проверено)
- Текстовые свойства набора в инстансе = значение по умолчанию → тексты задавать явно.
- В инстанс нельзя вставить слой → для графика по данным карточку отсоединяют (`O.chart` делает сам); после `detachInstance()` фон `bg` теряет ABSOLUTE — вернуть `bg.layoutPositioning='ABSOLUTE'; bg.x=0; bg.y=0`.
- Прозрачность заливки с переменной — присваивать дважды; стили — через `set…StyleIdAsync`.
- У JetBrains Mono нет SemiBold — жирное только в Onest/Unbounded.
- Декор фона-инстанса нельзя двигать — только visible/opacity; сдвиг — после detach фона.
- Пилюли и плашки с подписью — фреймы с автолейаутом, не прямоугольник + текст.
- Экспорт целой карусели одним вызовом слишком тяжёл — по одной карточке.
- Id узлов между сессиями меняются — искать по именам.
