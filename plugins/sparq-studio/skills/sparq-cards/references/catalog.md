# Каталог системы карточек 1:1

Справочник: что есть и как это назвать в спецификации. Правила — в `SKILL.md`. Точные имена из библиотеки — `sparq_catalog {what:"cards"}` и `{what:"card-icons"}`.

## Виды карточек
**Обложки** (`sparq/card/title`): `typo` (серия, explain, аналитика) · `typo` с `tone:"red"` (дайджест) · `typo-circuit` (explain с подзаголовком) · `rubric-number` (выпуск рубрики) · `photo-full`, `photo-window` (новость с фото) · `person` (персона) · `duo` (интервью, два фото) · `sci-plate` (научный рисунок, светлая).

**Тела** (`sparq/card/body`): `text-s/m/l` · `text-m` с `tone:"light"` (пауза в ритме) · `graphic-M/L/XL/SW/SN` (XL и hero бывают `tone:"red"`) · `hero` · `quote` (`tone:"light"`) · `bubble` · `list` (`dark`/`light`) · `case` · `two-sections` · `table` · `continue` · `final-figures` · `final-tail` (`tone:"red"`).

## Поля спецификации
| поле | где | что |
|---|---|---|
| `kind`, `tone` | все | вид и тон; тон по умолчанию `dark` |
| `props` | все | `title`, `counter` (`|n/N⟩`), `text`; у hero — `number`; у обложек — `series` / `subtitle` / `issue` |
| `texts` | все | тексты слоёв по имени: quote — `text, who, role`; person — `name, regalia`; bubble — `text#2`; two-sections — `text#2` и подзаголовки |
| `items` | `list` | до 4 пунктов `{icon, title, note}` |
| `chart` | `graphic-*` | `{type, size, data}` — `references/charts.md` |
| `rubric`, `kicker` | обложки, case | метка формата («explain», «рынок квантов»), надзаголовок кейса («кейс · ЕС») |
| `bg` | только обложки | см. ниже; на остальных фон подбирается сам |
| `photo` | photo-*, person, duo | путь к файлу на диске |
| `bold` | все | фрагменты для выделения (проще — `**…**` в тексте) |

## Обложки
| `bg` | образ | когда |
|---|---|---|
| `cover-sphere` | сфера Блоха, красный — вектор состояния | кубиты, состояния, объяснение понятий |
| `cover-atom` | атом и кольца интерференции | сенсоры, физика, измерения |
| `cover-barcode` | штрихкод, переходящий в сферу | аналитика, рынок, серия |
| `cover-orbit` | сфера с орбитами | вычисления, объяснение |
| `cover-ring`, `-side`, `-corner`, `-horizon` | неоновая дуга: сверху справа, из правого края, из угла, дугой сверху | универсальная; положение дуги — под длину заголовка |
| `cover-red-ring` и те же `-side`, `-corner`, `-horizon` | белая дуга на красном | дайджест (`tone:"red"`) |
| `cover-interference`, `cover-circuit`, `cover-supremat`, `cover-bolt` | поле волн, схема, супрематизм, молния | по смыслу; молния — только явным выбором |
Без `bg` обложка получает дугу по кругу. Длинный заголовок (3 строки) — дуга `-corner` или `-horizon`, не `-side`.

## Фоны остальных карточек (подбираются сами)
Текст сверху: кольца, орбиты, перекрестие, точечная сетка, провода (`dark-ring`, `dark-orbit`, `dark-crosshair`, `dark-dots`, `dark-wires`). Контент до низа: схема, линейка (`dark-circuit`, `dark-ticks`). Светлые: `light-paper`, `light-frost`, `light-grid`. Красные: `red`, `red-deep`. Обложки с фото: `dark-ticks`, `dark-wires`, `dark-crosshair`. Пятнистые фоны (`dark-haze`, `dark-gradient`, `glass-*`) инструмент заменяет.

## Иконки
59 иконок, стиль `line` или `solid`. По смыслу: chip — процессор · shield — защита, ошибки · lock, lock-pqc, key, qkd — криптография · atom, qubit, bloch, ion-trap, neutral-atom — физика · navigation — маршрут · clock, calendar — время · money, invest, growth, decline — деньги · gov, bank, university, lab, factory — организации · people — люди · globe, satellite, fiber, node — связь. Нет подходящей — пункты без иконок (`text-*`, `two-sections`), а не случайная иконка.

## Шаблоны каруселей
Живые образцы — страница «SPARQ · система 1:1», раздел 09; спецификации — `examples/carousel-templates.jsonl`.
| шаблон | последовательность |
|---|---|
| 1 · аналитика рынка | typo · cover-barcode → text-m → graphic-L barH → graphic-SW donut → hero red → graphic-XL sankey → final-figures |
| 2 · кейсы стран | typo · cover-ring-side → text-s → case → case → table → final-tail |
| 3 · explain | typo · cover-sphere → text-m light → two-sections → list (иконки) → bubble → final-tail |
| 4 · персона | person → text-m → quote light → graphic-L timeline → final-tail |
| 5 · оптимизация | typo · cover-ring-horizon → text-m → list (иконки) → hero → final-tail |
| 6 · защита данных | typo · cover-circuit → text-m → list (lock-pqc, qkd, key, shield) → graphic-L barV → final-tail |
| 7 · новость с механикой | typo-circuit · cover-interference → graphic-M barH → quote → graphic-M steps → graphic-M reduction → graphic-L stepLine → final-tail |
| 8 · одно число, два прочтения | typo · cover-barcode → hero red → graphic-M strip → graphic-M areas → final-tail |
Шаблон — основа: карточки добавлять, убирать и менять под текст автора.
