# Carousel templates for the SPARQ.2 system page (section 09) — also used as worked examples in the plugin skill.
import json
def P(**k): return k
T = {}
T["t1"] = dict(title="шаблон 1 · аналитика рынка", note="серия «рынок квантов»: тезис → данные → герой → главный график → итог. 7 карточек.", cards=[
 dict(kind="typo", bg="cover-barcode", rubric="рынок квантов", props=P(title="суверенные\nгонки", series="|часть 3⟩")),
 dict(kind="text-m", props=P(title="ловушка размеров", counter="|1/6⟩", text="Государственные инвестиции в квантовые программы достигли **$55 млрд**, и их разброс огромный. Прямо сравнивать эти числа нельзя: они отражают не потенциал, а тип государственного участия. Китай и Евросоюз финансируют инфраструктуру и исследования, США — оборонные заказы и венчур, Россия — отраслевые программы госкорпораций. Поэтому дальше сравниваем не суммы, а механизмы.")),
 dict(kind="graphic-L", props=P(title="госбюджеты", counter="|2/6⟩", text="Китай тратит почти в 20 раз больше России, и большая часть уходит в инфраструктуру."), chart=dict(type="barH", size="L", data=dict(data=[dict(label="Китай", value=15.3, accent=1), dict(label="Япония", value=9.2), dict(label="США", value=5.6), dict(label="Германия", value=5.2), dict(label="Россия", value=0.8)], pre="$", suf=" млрд"))),
 dict(kind="graphic-SW", props=P(title="как регулируют", counter="|3/6⟩", text="Половина стран ограничивается мягкими рекомендациями."), chart=dict(type="donut", size="SW", data=dict(data=[dict(label="мягкие рекомендации", value=50, accent=1), dict(label="отраслевые правила", value=30), dict(label="жёсткий режим", value=12), dict(label="нет регулирования", value=8)], center=dict(value="50 %", label="мягкие меры"), suf=" %"))),
 dict(kind="hero", tone="red", props=P(title="масштаб", counter="|4/6⟩", number="19 : 1", text="разрыв между самым большим и самым маленьким госбюджетом")),
 dict(kind="graphic-XL", props=P(title="куда идут деньги", counter="|5/6⟩", text="Государства платят за криптографию, венчур — за железо."), chart=dict(type="sankey", size="XL", data=dict(src=[dict(n="государства", v=44.5, accent=1), dict(n="венчур", v=12.6)], dst=[dict(n="криптография", v=26.7), dict(n="исследования", v=13.3), dict(n="сенсоры", v=5.4), dict(n="железо", v=10.7), dict(n="софт", v=1.0)], flows=[[0,0,26.7],[0,1,13.3],[0,2,4.5],[1,2,0.9],[1,3,10.7],[1,4,1.0]]))),
 dict(kind="final-figures", texts={"title": "итог", "counter": "|6/6⟩", "text": "У каждой страны своя модель участия государства."}),
])
T["t2"] = dict(title="шаблон 2 · кейсы стран", note="регуляторика и геополитика: вход → кейсы → позиции → финал. 6 карточек.", cards=[
 dict(kind="typo", bg="cover-ring-side", rubric="рынок квантов", props=P(title="безопасность\nпротив политики", series="|криптография 2⟩")),
 dict(kind="text-s", props=P(title="введение", counter="|1/5⟩", text="Одни и те же технологии государства оценивают противоположно — и это решение политическое.")),
 dict(kind="case", kicker="кейс · ЕС", props=P(title="кейс\nЕвросоюза", counter="|2/5⟩", text="С 2019 года 27 стран ЕС строят общую квантовую сеть EuroQCI к 2027 году. Но в 2024-м агентства четырёх стран назвали QKD недостаточно зрелой.")),
 dict(kind="case", kicker="кейс · Великобритания", props=P(title="кейс\nБритании", counter="|3/5⟩", text="Центр кибербезопасности заявляет жёстко: агентство не поддерживает использование QKD для правительственных задач.")),
 dict(kind="table", props=P(title="позиции регуляторов", counter="|4/5⟩", text="Подходы делятся на три группы — от обязательного гибрида до полного отказа.")),
 dict(kind="final-tail", tone="red", props=P(title="решает\nполитика", text="прошлые части: такая разная регуляция")),
])
T["t3"] = dict(title="шаблон 3 · explain", note="объяснение понятия: что это → чем отличается → где применяют → вывод. 6 карточек.", cards=[
 dict(kind="typo", bg="cover-sphere", rubric="explain", props=P(title="что такое\nкудит", series="|кудиты 1⟩")),
 dict(kind="text-m", tone="light", props=P(title="кубит и кудит", counter="|1/5⟩", text="Кубит хранит **два состояния**, кудит — больше: три, четыре или десять. Один кудит заменяет несколько кубитов, и процессор можно сделать компактнее.")),
 dict(kind="two-sections", props=P(title="два подхода", counter="|2/5⟩"), texts={"госзаказ": "кубит", "венчур": "кудит", "text": "Два состояния: 0 и 1. Для сложной задачи нужно много кубитов и связей между ними.", "text#2": "Больше уровней в одной частице: то же число состояний на меньшем числе элементов."}),
 dict(kind="list", props=P(title="где применяют", counter="|3/5⟩", text="Кудиты особенно полезны в четырёх задачах:"), items=[dict(icon="chip", title="компактные процессоры", note="меньше элементов на ту же задачу"), dict(icon="shield", title="коррекция ошибок", note="избыточность внутри одной частицы"), dict(icon="atom", title="квантовая химия", note="больше уровней — точнее модель"), dict(icon="lock", title="криптография", note="больше бит на фотон")]),
 dict(kind="bubble", props=P(title="кому это важно", counter="|4/5⟩", text="Кудиты — не замена кубитам, а другой способ уплотнить вычисления."), texts={"text#2": "Тем, кто следит за российскими ионными процессорами: ФИАН показал 16-кудитный процессор."}),
 dict(kind="final-tail", tone="red", props=P(title="меньше элементов —\nбольше состояний", text="прошлые выпуски explain: что такое кубит")),
])
T["t4"] = dict(title="шаблон 4 · персона / history", note="история человека или лаборатории: персона → контекст → цитата → путь → финал. 5 карточек.", cards=[
 dict(kind="person", rubric="history", texts={"name": "Алексей\nФёдоров", "regalia": "Профессор МФТИ, директор Института физики и квантовой инженерии НИТУ МИСИС"}),
 dict(kind="text-m", props=P(title="с чего начиналось", counter="|1/4⟩", text="Первая дорожная карта «Квантовые вычисления» стартовала в **2020 году** с бюджетом $800 млн.")),
 dict(kind="quote", tone="light", texts={"text": "Мы прошли путь от одного кубита до десятков кубитов за пять лет.", "who": "Имя Фамилия", "role": "должность, организация"}),
 dict(kind="graphic-L", props=P(title="путь", counter="|3/4⟩", text="Ключевые точки программы:"), chart=dict(type="timeline", size="L", data=dict(events=[dict(date="2020", label="старт дорожной карты"), dict(date="2023", label="50 кубитов · МГУ"), dict(date="2024", label="16 кудитов · ФИАН"), dict(date="2025", label="цель: 300 кубитов", accent=1)]))),
 dict(kind="final-tail", tone="red", props=P(title="дальше —\n300 кубитов", text="прошлые выпуски history")),
])
T["t5"] = dict(title="шаблон 5 · оптимизация и вычисления", note="задача, которая сводится к поиску минимума: что это → как ищут → какие задачи → результат. 5 карточек.", cards=[
 dict(kind="typo", bg="cover-ring-horizon", rubric="explain", props=P(title="поиск\nминимума", series="|вычисления 1⟩")),
 dict(kind="text-m", props=P(title="как ищут решение", counter="|1/4⟩", text="Логистика сводится к поиску минимума: из тысяч вариантов нужен самый дешёвый. Классический алгоритм застревает в **локальном минимуме**, квантовый отжиг может «пройти насквозь».")),
 dict(kind="list", props=P(title="три класса задач", counter="|2/4⟩", text="Где поиск минимума встречается в ритейле:"), items=[dict(icon="navigation", title="маршруты", note="доставка в магазины и на склады"), dict(icon="clock", title="расписания", note="смены, окна приёмки, промо"), dict(icon="people", title="размещение", note="запасы, комплектовщики, волны")]),
 dict(kind="hero", props=P(title="результат", counter="|3/4⟩", number="61 vs 142", text="машины в симуляции: Aisin · Япония, 340 тыс. коробок")),
 dict(kind="final-tail", tone="red", props=P(title="выбирает\nзадача", text="прошлые выпуски explain: вычисления")),
])
T["t6"] = dict(title="шаблон 6 · защита данных", note="криптография и каналы: угроза → два контура → сроки → вывод. 5 карточек.", cards=[
 dict(kind="typo", bg="cover-circuit", rubric="рынок квантов", props=P(title="защита\nданных", series="|PQC и КРК⟩")),
 dict(kind="text-m", props=P(title="отложенная расшифровка", counter="|1/4⟩", text="Данные, перехваченные сегодня, можно расшифровать через 10–15 лет. Поэтому срок угрозы считают от **срока хранения**, а не от даты появления компьютера.")),
 dict(kind="list", props=P(title="два контура", counter="|2/4⟩", text="Защита строится в два слоя:"), items=[dict(icon="lock-pqc", title="PQC", note="новые алгоритмы в программном обеспечении"), dict(icon="qkd", title="КРК", note="ключи по квантовому каналу между узлами"), dict(icon="key", title="управление ключами", note="смена и хранение"), dict(icon="shield", title="гибрид", note="оба контура вместе на критичных каналах")]),
 dict(kind="graphic-L", props=P(title="срок угрозы", counter="|3/4⟩", text="Вероятность, что квантовый компьютер взломает RSA-2048 (середина оценки):"), chart=dict(type="barV", size="L", data=dict(data=[dict(label="через 10 лет", value=39), dict(label="через 15 лет", value=69, accent=1)], suf=" %"))),
 dict(kind="final-tail", tone="red", props=P(title="сначала PQC,\nпотом КРК", text="прошлые выпуски: защита данных")),
])
if __name__ == "__main__":
    json.dump(T, open("/Users/alpha7en/Documents/antigravity/sparq-design-kit/.scratch/templates.json", "w"), ensure_ascii=False)
    print({k: len(v["cards"]) for k, v in T.items()})
