/**
 * SPARQ Studio · editorial text lint (server side, no Figma needed).
 * Catches the patterns the team kept fixing by hand: AI clichés, antitheses, overclaims,
 * empty evaluations, bureaucratese, colloquialisms, typography slips.
 * Profiles: "report" (analytic report: no вы/мы), "pitch" (deck for an accelerator/client: мы allowed),
 * "post" (Telegram carousel: editorial blacklist is strict).
 */
export type Profile = "report" | "pitch" | "post";
type Rule = { id: string; re: RegExp; hint: string; profiles?: Profile[] };

const RULES: Rule[] = [
	{ id: "address", re: /(^|[\s«(])(вы|вас|вам|ваш\S*)([\s.,;:!?)»]|$)/i, hint: "обращение к читателю на «вы» — переписать безлично", profiles: ["report", "post"] },
	{ id: "we", re: /(^|[\s«(])(мы|нам|нас|наш\S*)([\s.,;:!?)»]|$)/i, hint: "«мы» в аналитическом тексте — писать от предмета", profiles: ["report"] },
	{ id: "antithesis", re: /(^|[\s.;:—])не [^.;]{2,50}, а /i, hint: "конструкция «не X, а Y» — сказать прямо, что есть" },
	{ id: "overclaim", re: /единственн|уникальн|революц|прорыв|невероятн|(^|\s)лучш(ий|ая|ее|ие)\s|(^|\s)перв(ый|ая|ое|ые) в (мире|россии|стране)/i, hint: "сверхутверждение — «один из», «по заявлению», цифра" },
	{ id: "cliche", re: /играет ключев|является ключев|стоит отметить|важно понимать|важно подчеркнуть|не секрет, что|нельзя не упомянуть|в современном мире|в цифровую эпоху|квантовая эра|открыва\S* (новые )?перспектив|уникальная возможность|время покажет|эксперты сходятся|палка о двух концах/i, hint: "штамп — убрать или заменить фактом" },
	{ id: "summary", re: /таким образом|подводя итог|в заключение|в целом можно сказать/i, hint: "школьное резюме — вывод формулировать сразу" },
	{ id: "empty-eval", re: /(^|\s)(интересн|значительн|существенн|важн)(ый|ая|ое|ые|о)\s/i, hint: "пустая оценка — показать, чем именно" },
	{ id: "colloquial", re: /в деле|на (квантовом )?железе|(^|\s)шанс(\s|$)|это и есть|по сути|буквально|давайте|прикольн|круто/i, hint: "разговорное — нейтральная лексика" },
	{ id: "staff", re: /(^|\s)кадр(ы|ов|ам)(\s|[.,]|$)/i, hint: "«кадры» — «специалисты», «сотрудники» (если это не устойчивое «подготовка кадров»)", profiles: ["report"] },
	{ id: "hype", re: /хорон|золотые люстры|меняет правила игры|game.?changer/i, hint: "запрещённая лексика из чёрного списка" },
	{ id: "anglicism", re: /\b(insight|use[- ]?case|roadmap|deadline|feature|skill)s?\b/i, hint: "англицизм — по-русски, если есть привычное слово" },
	{ id: "typo-dash", re: /\s-\s/, hint: "дефис вместо тире — « — »" },
	{ id: "typo-quotes", re: /"[^"]+"/, hint: "прямые кавычки — «ёлочки»" },
	{ id: "typo-dots", re: /\.\.\./, hint: "три точки — «…»" },
	{ id: "caps", re: /(^|\s)[А-ЯЁ]{6,}(\s|$)/, hint: "капслок в тексте — выделять жирным или цветом" },
];

export function lintTexts(texts: { where: string; text: string }[], profile: Profile = "pitch", extra: string[] = []) {
	const hits: { where: string; rule: string; hint: string; snippet: string }[] = [];
	const extraRes = extra.filter(Boolean).map(p => ({ id: "blacklist", re: new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), hint: "из чёрного списка команды" } as Rule));
	for (const { where, text } of texts) {
		if (!text || text.length < 4 || /^\|/.test(text) || /(^|\/)(kicker|counter|label|source)$/.test(where)) continue;
		const t = text.replace(/ /g, " ");
		for (const r of [...RULES, ...extraRes]) {
			if (r.profiles && !r.profiles.includes(profile)) continue;
			const m = t.match(r.re);
			if (!m) continue;
			const i = Math.max(0, (m.index || 0) - 30);
			hits.push({ where, rule: r.id, hint: r.hint, snippet: t.slice(i, i + 90).replace(/\n/g, " ") });
		}
	}
	return hits;
}

/** Word count without kets/numbers-only tokens — for capacity checks. */
export const words = (s: string) => (s.replace(/\|[^⟩]*⟩/g, " ").match(/[A-Za-zА-Яа-яЁё][\wА-Яа-яЁё-]*/g) || []).length;
