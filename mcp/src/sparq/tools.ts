/**
 * SPARQ Studio · MCP tools (sparq_*). The design system is sealed in local files (see assets.ts):
 * the model sends compact JSON specs, the server injects runtime code + assets and talks to Figma.
 */
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join, resolve, extname, basename } from "path";
import { homedir } from "os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IFigmaConnector } from "../core/figma-connector.js";
import { asset, json, mod, deckPrelude, cardsPrelude, auditPrelude, lit, KIT_VERSION, designDir } from "./assets.js";
import { lintTexts, words, type Profile } from "./textlint.js";

type Ctx = {
	getConnector: () => Promise<IFigmaConnector>;
	ws: () => any; // FigmaWebSocketServer | null
	pluginManifest: () => string | null;
};

/** Switch to the deck page in Design files (Slides files use the grid). */
const DECK_PAGE = `if(figma.editorType!=='slides'){await figma.loadAllPagesAsync();const __nm=JSON.parse(figma.root.getSharedPluginData('sparqdeck','config')||'{}').page||'SPARQ · презентация';const __p=figma.root.children.find(x=>x.name===__nm);if(__p&&figma.currentPage!==__p)await figma.setCurrentPageAsync(__p)}\n`;
const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data) }] });
const fail = (msg: string, extra: Record<string, unknown> = {}) => ({ content: [{ type: "text" as const, text: JSON.stringify({ error: msg, ...extra }) }], isError: true });

async function run(ctx: Ctx, code: string, fileKey?: string, timeout = 30000): Promise<any> {
	const c = await ctx.getConnector();
	const r: any = await c.executeCodeViaUI(code, Math.min(timeout, 30000), fileKey);
	if (!r || r.success === false) throw new Error((r && (r.error || r.message)) || "Figma execution failed");
	return r.result;
}

// ---------- images ----------
function imageSize(buf: Buffer): [number, number] | null {
	if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
	if (buf[0] === 0xff && buf[1] === 0xd8) {
		let i = 2;
		while (i < buf.length) {
			if (buf[i] !== 0xff) { i++; continue; }
			const m = buf[i + 1]; const len = buf.readUInt16BE(i + 2);
			if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
			i += 2 + len;
		}
	}
	return null;
}
const expand = (p: string) => resolve(p.replace(/^~(?=\/|$)/, homedir()));
/** Replace every {src|photo:"path"} in a spec with base64 bytes + pixel size (done locally, never shown to the model). */
function inlineImages(node: any, base?: string, notes: string[] = []): any {
	if (Array.isArray(node)) return node.map(n => inlineImages(n, base, notes));
	if (!node || typeof node !== "object") return node;
	const out: any = {};
	for (const [k, v] of Object.entries(node)) out[k] = inlineImages(v, base, notes);
	for (const key of ["src", "photo"]) {
		if (typeof out[key] === "string" && !out.b64) {
			const p = expand(base && !out[key].startsWith("/") && !out[key].startsWith("~") ? join(base, out[key]) : out[key]);
			if (!existsSync(p)) throw new Error("image not found: " + p);
			const buf = readFileSync(p);
			if (buf.length > 1_500_000) notes.push(`${basename(p)} is ${(buf.length / 1e6).toFixed(1)} MB — compress to JPEG ≤ 300 KB to keep the PDF small`);
			out.b64 = buf.toString("base64"); out.size = imageSize(buf) || undefined; delete out[key];
		}
	}
	return out;
}

// ---------- status ----------
const PROBE = `const kd=figma.root.getSharedPluginData('sparqdeck','version'), kc=figma.root.getSharedPluginData('sparq','kitVersion')||(figma.root.getSharedPluginData('sparq','ops')?'legacy':'');
await figma.loadAllPagesAsync();
const sys=figma.root.children.find(p=>p.name.startsWith('SPARQ · система'));
let slides=0; if(figma.editorType==='slides') slides=figma.getSlideGrid().flat().length; else slides=figma.currentPage.findChildren(n=>n.type==='FRAME'&&n.getSharedPluginData('sparqdeck','key')).length;
return {editor:figma.editorType, deck:kd||null, cards:kc||null, cardsLibrary:!!sys, slides, pages:figma.root.children.length, page:figma.currentPage.name};`;


/** Install tokens in phases: variables first, then text styles in chunks (first font loads are slow). */
async function installTokens(ctx: Ctx, tok: any, fileKey?: string) {
	const sum: any = { collections: 0, variables: 0, textStyles: 0, effectStyles: 0, paintStyles: 0, fontsMissing: [] as string[] };
	const add = (r: any) => { for (const k of Object.keys(sum)) { if (k === "fontsMissing") sum.fontsMissing.push(...(r.fontsMissing || [])); else sum[k] += r[k] || 0; } };
	add(await run(ctx, `const TOK=${lit({ collections: tok.collections })};const PHASE='vars';\nreturn ${mod("runtime/install/tokens.js")};`, fileKey, 30000));
	const n = (tok.textStyles || []).length; const step = 5;
	for (let i = 0; i < Math.max(n, 1); i += step) {
		add(await run(ctx, `const TOK=${lit({ textStyles: tok.textStyles, effectStyles: tok.effectStyles, paintStyles: tok.paintStyles })};const PHASE='styles';const FROM=${i};const TO=${i + step};\nreturn ${mod("runtime/install/tokens.js")};`, fileKey, 30000));
	}
	sum.fontsMissing = [...new Set(sum.fontsMissing)];
	return sum;
}

/** Russian typography for card texts (same rules as the deck engine): non-breaking spaces after short words, before dashes, between numbers and units. */
const NBSP = "\u00A0";
const SHORT_W = /(^|[\s«(„"])(в|к|с|о|у|и|а|я|на|по|от|до|за|из|во|со|не|ни|но|же|ли|бы|для|при|как|что|или|об|под|над|без|это|все|всё|его|её|их)\s(?=\S)/gi;
function typo(s: unknown): unknown {
	if (typeof s !== "string" || !s) return s;
	let x = s.replace(/ -- /g, " — ").replace(/(\d) - (\d)/g, "$1–$2");
	x = x.replace(SHORT_W, (_m, a, w) => a + w + NBSP).replace(SHORT_W, (_m, a, w) => a + w + NBSP);
	x = x.replace(/ —/g, NBSP + "—").replace(/(\d) (\d{3})(?!\d)/g, "$1" + NBSP + "$2").replace(/(\d) (?=[%₽$A-Za-zА-Яа-яЁё])/g, "$1" + NBSP);
	return x;
}
function typoCard(spec: Record<string, any>): Record<string, any> {
	const map = (o?: Record<string, unknown>) => o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === "counter" || k === "series" ? v : typo(v)]));
	return { ...spec, bold: Array.isArray(spec.bold) ? spec.bold.map((b: string) => typo(b)) : spec.bold, props: map(spec.props), texts: map(spec.texts), items: Array.isArray(spec.items) ? spec.items.map((i: any) => typeof i === "string" ? typo(i) : { ...i, title: typo(i.title), note: typo(i.note) }) : spec.items };
}
/** Word norms per card kind — a kind that does not fit its text is the usual cause of «пусто» / overflow. */
const KIND_WORDS: Record<string, [number, number]> = { "text-s": [1, 40], "text-m": [41, 85], "text-l": [86, 150], "graphic-L": [0, 35], "graphic-M": [0, 50], "graphic-XL": [0, 9], "graphic-SW": [0, 35], "graphic-SN": [0, 50], hero: [0, 30], quote: [0, 45], bubble: [0, 41], list: [0, 60], case: [0, 70], "final-tail": [0, 60], "final-figures": [0, 60], continue: [0, 85], "two-sections": [0, 70] };
function kindNote(spec: Record<string, any>): string | null {
	const norm = KIND_WORDS[spec.kind]; if (!norm) return null;
	const txt = [spec.props?.text, spec.texts?.text, spec.texts?.["text#2"]].filter(Boolean).join(" ").replace(/\*\*/g, "");
	const n = words(txt);
	if (n > norm[1]) return `слов ${n}, норма вида ${spec.kind} — до ${norm[1]}: следующий вид или вторая карточка`;
	if (n < norm[0]) return `слов ${n}, для ${spec.kind} мало (норма ${norm[0]}–${norm[1]}): text-s, hero или quote`;
	return null;
}

/** `**фрагмент**` in card texts → plain text + spec.bold (component text props cannot carry rich text). */
function boldMarkup(spec: Record<string, any>): Record<string, any> {
	const bold = new Set<string>(spec.bold || []);
	const strip = (v: unknown) => typeof v === "string" && v.includes("**") ? v.replace(/\*\*(.+?)\*\*/g, (_m, b) => (bold.add(b), b)) : v;
	const map = (o?: Record<string, unknown>) => o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, strip(v)]));
	return { ...spec, props: map(spec.props), texts: map(spec.texts), bold: bold.size ? [...bold] : undefined };
}

export function registerSparqTools(server: McpServer, ctx: Ctx) {
	// ------------------------------------------------------------------ status
	server.tool(
		"sparq_status",
		"SPARQ Studio: one-call situation report — is the Figma bridge connected, which files are open, which one is active, which SPARQ kits (deck / cards) are installed in each, how many slides. Call it at the start of any Figma work and whenever the user asks what is open. Output is short; relay it in plain language.",
		{},
		async () => {
			const ws = ctx.ws();
			const manifest = ctx.pluginManifest();
			if (!ws || !ws.isClientConnected()) {
				return ok({
					bridge: "not connected",
					todo: [
						"Открыть Figma Desktop (не браузер) и нужный файл",
						"Plugins → Development → «SPARQ Studio Bridge» (если плагина нет: Plugins → Development → Import plugin from manifest… → " + (manifest || "<plugin>/bridge/manifest.json") + ")",
						"Запустить плагин в каждом файле, с которым работаем; окно плагина можно свернуть, но не закрывать",
					],
					manifest,
				});
			}
			const files = ws.getConnectedFiles();
			const active = ws.getActiveFileKey();
			const rows: any[] = [];
			for (const f of files) {
				let kit: any = {};
				try { kit = await run(ctx, PROBE, f.fileKey, 8000); } catch (e: any) { kit = { error: e.message }; }
				rows.push({ file: f.fileName, key: f.fileKey, active: f.fileKey === active, ...kit });
			}
			return ok({ bridge: "connected", locked: ws.isTargetLocked(), kitVersion: KIT_VERSION, files: rows, hint: "deck/cards = версия установленного набора; null — набор ещё не поставлен (sparq_setup_file)." });
		},
	);

	// ------------------------------------------------------------------ use file
	server.tool(
		"sparq_use_file",
		"Make a connected file the target for all following calls and pin it (other files the user opens will not steal the target). Pass the file key from sparq_status.",
		{ fileKey: z.string() },
		async ({ fileKey }) => {
			const ws = ctx.ws();
			if (!ws) return fail("bridge not connected");
			const okk = ws.setActiveFile(fileKey, true);
			return okk ? ok({ active: fileKey, locked: true }) : fail("file is not connected — open the SPARQ Studio Bridge plugin in it", { connected: ws.getConnectedFiles().map((f: any) => f.fileKey) });
		},
	);

	// ------------------------------------------------------------------ setup
	server.tool(
		"sparq_setup_file",
		"Install a SPARQ kit into the target Figma file (idempotent, safe to re-run after updates). kit='deck' — presentation tokens, text styles, icons (fast). kit='cards' — Telegram-card tokens, styles, card generators AND the full component library page «SPARQ · система 1:1 (всё здесь)» (292 components, takes ~1–2 min). Run once per new file; sparq_status shows what is installed.",
		{
			kit: z.enum(["deck", "cards", "both"]),
			fileKey: z.string().optional(),
			library: z.boolean().optional().describe("cards only: rebuild the component library page (default true when missing)"),
			replaceLibrary: z.boolean().optional().describe("cards only: delete and rebuild existing component sets (after a library update)"),
			libraryPage: z.string().optional().describe("testing only: install the library into this page name"),
		},
		async ({ kit, fileKey, library, replaceLibrary, libraryPage }) => {
			const report: any = { kitVersion: KIT_VERSION };
			try {
				const editor = await run(ctx, "return figma.editorType;", fileKey, 5000);
				if (kit === "deck" || kit === "both") {
					const tok = json("tokens/deck.json");
					report.deckTokens = await installTokens(ctx, tok, fileKey);
					const icons = asset("icons/deck.json");
					const mark = asset("runtime/deck/mark.svg");
					await run(ctx, `figma.root.setSharedPluginData('sparqdeck','icons',${lit(icons)});figma.root.setSharedPluginData('sparqdeck','mark',${lit(mark)});if(!figma.root.getSharedPluginData('sparqdeck','config'))figma.root.setSharedPluginData('sparqdeck','config','{}');figma.root.setSharedPluginData('sparqdeck','version',${lit(KIT_VERSION)});return true;`, fileKey);
					report.deck = "installed";
				}
				if (kit === "cards" || kit === "both") {
					if (editor === "slides") return fail("cards kit needs a Figma Design file (1080² frames), not a Slides file", report);
					const tok = json("tokens/cards.json");
					report.cardsTokens = await installTokens(ctx, tok, fileKey);
					const code: Record<string, string> = {};
					for (const k of ["ops", "lib", "lib2", "lib3", "charts", "charts2", "fx", "lint", "chartdata", "mark"]) code[k] = asset(`runtime/cards/${k}.js`);
					await run(ctx, `const C=${lit(code)};for(const k in C)figma.root.setSharedPluginData('sparq',k,C[k]);figma.root.setSharedPluginData('sparq','kitVersion',${lit(KIT_VERSION)});return Object.keys(C).length;`, fileKey);
					const LPAGE = libraryPage || 'SPARQ · система 1:1 (всё здесь)';
					const libNames: string[] = json("library/cards.json").items.map((i: any) => i.name);
					const present: string[] = await run(ctx, `await figma.loadAllPagesAsync();const p=figma.root.children.find(p=>p.name.startsWith(${lit(libraryPage || 'SPARQ · система')}));if(!p)return [];await p.loadAsync();return p.findAll(n=>n.type==='COMPONENT_SET'||(n.type==='COMPONENT'&&n.parent.type!=='COMPONENT_SET'&&!n.name.includes('='))).map(n=>n.name);`, fileKey, 15000);
					const has = libNames.every(n => present.includes(n));
					if (library !== false && (!has || replaceLibrary)) {
						const lib = json("library/cards.json");
						const items: any[] = lib.items;
						const count = (s: any): number => 1 + (s.ch || []).reduce((a: number, c: any) => a + count(c), 0);
						let remaining: any[] = items.slice(); const installed: string[] = []; const warnings: string[] = []; let calls = 0;
						while (remaining.length && calls < 120) {
							calls++;
							const win: any[] = []; let n = 0;
							for (const it of remaining) { const c = it.variants.reduce((a: number, v: any) => a + count(v), 0); if (win.length && n + c > 700) break; win.push(it); n += c; }
							const r = await run(ctx, `const ITEMS=${lit(win)};const PAGE_NAME=${lit(LPAGE)};const REPLACE=${!!replaceLibrary};const BUDGET_MS=18000;\nreturn ${mod("runtime/install/library.js")};`, fileKey, 30000);
							installed.push(...r.installed); warnings.push(...r.warnings);
							const doneNames = new Set([...r.installed, ...r.skipped]);
							remaining = remaining.filter(it => !doneNames.has(it.name));
						}
						report.library = { sets: installed.length, calls, left: remaining.map((i: any) => i.name), warnings: warnings.slice(0, 12), warningsTotal: warnings.length };
					} else {
						const libVer: string = await run(ctx, `await figma.loadAllPagesAsync();const p=figma.root.children.find(p=>p.name===${lit(LPAGE)});return p?p.getPluginData('libVersion'):'';`, fileKey);
						report.library = !has ? "skipped" : libVer === KIT_VERSION ? "complete" : `outdated (installed ${libVer || "before 1.3"}, plugin ${KIT_VERSION}): new backgrounds/components are missing — run again with replaceLibrary:true`;
					}
					const justInstalled = report.library?.sets !== undefined && !(report.library.left || []).length;
					if (library !== false && has || justInstalled) report.layout = await run(ctx, `const PAGE_NAME=${lit(LPAGE)};const LIB_VERSION=${lit(KIT_VERSION)};const MARK=${justInstalled};\nreturn ${mod("runtime/install/pack.js")};`, fileKey, 30000);
					report.cards = "installed";
				}
				return ok(report);
			} catch (e: any) {
				return fail(e.message, report);
			}
		},
	);

	// ------------------------------------------------------------------ deck config
	server.tool(
		"sparq_deck_config",
		"Deck-wide settings stored in the file: total slide count for the |n/N⟩ counter, counter style, client logo (local SVG path; optional light/dark variants), text-lint voice. Call once per deck before building slides; only passed fields change.",
		{
			fileKey: z.string().optional(),
			total: z.number().optional(),
			counter: z.enum(["ket", "plain", "none"]).optional(),
			logo: z.string().optional().describe("path to client logo SVG (single-colour; recoloured to theme)"),
			logoDark: z.string().optional().describe("SVG for dark slides, used as-is"),
			logoLight: z.string().optional().describe("SVG for light slides, used as-is"),
			sparqMark: z.boolean().optional().describe("show the SPARQ mark in the header when there is no client logo (default true)"),
			voice: z.enum(["report", "pitch", "post"]).optional().describe("text-lint profile: report = no «вы/мы»; pitch = «мы» allowed; post = Telegram"),
			page: z.string().optional().describe("Design files only: page that holds the deck (default «SPARQ · презентация»)"),
		},
		async ({ fileKey, logo, logoDark, logoLight, ...cfg }) => {
			try {
				const set: Record<string, string> = {};
				if (logo) set.logo = readFileSync(expand(logo), "utf8");
				if (logoDark) set["logo-dark"] = readFileSync(expand(logoDark), "utf8");
				if (logoLight) set["logo-light"] = readFileSync(expand(logoLight), "utf8");
				const r = await run(ctx, `const S=${lit(set)};for(const k in S)figma.root.setSharedPluginData('sparqdeck',k,S[k]);const c=JSON.parse(figma.root.getSharedPluginData('sparqdeck','config')||'{}');Object.assign(c,${lit(cfg)});figma.root.setSharedPluginData('sparqdeck','config',JSON.stringify(c));return {config:c,logos:Object.keys(S)};`, fileKey);
				return ok(r);
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ slides
	server.tool(
		"sparq_slides",
		"Build or rebuild deck slides from JSON specs (the SPARQ slide DSL — see skill sparq-deck, references/dsl.md). Each spec needs a stable key ('S01'…); rebuilding the same key replaces that slide in place. Images: put local paths in {src} / {photo}; the server embeds them. After building, every slide is audited automatically (overflow, overlaps, tight gaps, mid-word breaks, empty bottom) and its texts are linted; fix what is reported, then take a screenshot. Prefer 1–4 slides per call.",
		{
			slides: z.array(z.record(z.any())).min(1),
			fileKey: z.string().optional(),
			assetsDir: z.string().optional().describe("base folder for relative image paths"),
			lint: z.enum(["report", "pitch", "post", "off"]).optional(),
			force: z.boolean().optional().describe("rebuild even if the user edited texts on the slide by hand (merge their edits into the spec first!)"),
		},
		async ({ slides, fileKey, assetsDir, lint, force }) => {
			const results: any[] = []; const notes: string[] = [];
			try {
				const installed = await run(ctx, "return figma.root.getSharedPluginData('sparqdeck','version');", fileKey, 5000);
				if (!installed) return fail("deck kit is not installed in this file — call sparq_setup_file {kit:'deck'} first");
				const cfg = JSON.parse((await run(ctx, "return figma.root.getSharedPluginData('sparqdeck','config')||'{}';", fileKey, 5000)) || "{}");
				const profile = (lint || cfg.voice || "pitch") as Profile | "off";
				for (const spec of slides) {
					if (!force && spec.key) {
						const edits = await run(ctx, deckPrelude() + `return await D.manualEdits(${lit(spec.key)});`, fileKey, 15000);
						if (edits) { results.push({ key: spec.key, skipped: "the user edited this slide by hand since the last build — merge these edits into the spec, then call again with force:true", manualEdits: edits }); continue; }
					}
					const s = inlineImages(spec, assetsDir, notes);
					const bgName = s.bg && (typeof s.bg === "string" ? s.bg : s.bg.name);
					const bgInject = bgName && /^[a-z]+$/.test(bgName) && existsSync(join(designDir(), "runtime/deck/bg", bgName + ".svg")) ? `D.bgSvg=${lit({ [bgName]: asset("runtime/deck/bg/" + bgName + ".svg") })};` : "";
					const il = typeof s.illus === "string" && /^[a-z-]+$/.test(s.illus) && existsSync(join(designDir(), "runtime/deck/illus", s.illus + ".svg")) ? `D.illusSvg=${lit({ [s.illus]: asset("runtime/deck/illus/" + s.illus + ".svg") })};` : "";
					const built = await run(ctx, deckPrelude() + bgInject + il + `return await D.build(${lit(s)});`, fileKey, 30000);
					const check = await run(ctx, auditPrelude() + `const sl=await figma.getNodeByIdAsync(${lit(built.id)});const a=(await __audit(sl)).filter(x=>!/ring|decor\\/|source|^EDGE|BOX×BOX|^CROSS|donut|icon\\/|GAP<PAD steps/.test(x));const texts=sl.findAll(n=>n.type==='TEXT'&&n.visible!==false).map(t=>({where:t.name,text:t.characters}));return {a,texts};`, fileKey, 20000);
					const lintHits = profile === "off" ? [] : lintTexts(check.texts.map((t: any) => ({ where: built.key + "/" + t.where, text: t.text })), profile as Profile);
					const w = check.texts.filter((t: any) => !["counter", "footnote"].includes(t.where)).reduce((a: number, t: any) => a + words(t.text), 0);
					results.push({ key: built.key, id: built.id, words: w, issues: [...built.issues, ...check.a.map((x: string) => "layout: " + x)].slice(0, 15), lint: lintHits.slice(0, 10) });
				}
				await run(ctx, "const K = " + mod("runtime/deck/kit.js") + ";\nawait K.deckPage();\nreturn K.sortSlides();", fileKey, 10000).catch(() => null);
				return ok({ slides: results, notes, next: "screenshot each slide (figma_capture_screenshot, scale 0.5–0.8) and look at it before reporting" });
			} catch (e: any) {
				return fail(e.message, { done: results, notes });
			}
		},
	);

	// ------------------------------------------------------------------ audit
	server.tool(
		"sparq_audit",
		"Re-check slides or cards without rebuilding: layout audit (overlaps, text outside, tight gaps, mid-word breaks, gaps smaller than padding) + editorial text lint. Pass slide keys (deck), node ids (any frame), or nothing for all deck slides.",
		{ keys: z.array(z.string()).optional(), nodeIds: z.array(z.string()).optional(), fileKey: z.string().optional(), lint: z.enum(["report", "pitch", "post", "off"]).optional() },
		async ({ keys, nodeIds, fileKey, lint }) => {
			try {
				const code = auditPrelude() + `
const keys=${lit(keys || null)}, ids=${lit(nodeIds || null)};
${DECK_PAGE}let targets=[];
if(ids){for(const id of ids){const n=await figma.getNodeByIdAsync(id);if(n)targets.push(n)}}
else{await figma.loadAllPagesAsync();const all=figma.editorType==='slides'?figma.getSlideGrid().flat():figma.currentPage.findChildren(n=>n.type==='FRAME'&&n.getSharedPluginData('sparqdeck','key'));targets=keys?all.filter(s=>keys.includes(s.getSharedPluginData('sparqdeck','key'))):all.filter(s=>s.getSharedPluginData('sparqdeck','key'))}
const out=[];for(const t of targets){const a=(await __audit(t)).filter(x=>!/ring|decor\\/|source|^EDGE|BOX×BOX|^CROSS|donut|icon\\/|GAP<PAD steps/.test(x));out.push({key:t.getSharedPluginData('sparqdeck','key')||t.name,id:t.id,layout:a.slice(0,15),texts:t.findAll(n=>n.type==='TEXT'&&n.visible!==false).map(x=>({where:x.name,text:x.characters}))})}
return out;`;
				const r = await run(ctx, code, fileKey, 30000);
				const cfgVoice = JSON.parse((await run(ctx, "return figma.root.getSharedPluginData('sparqdeck','config')||'{}';", fileKey, 5000)) || "{}").voice;
				const profile = (lint || cfgVoice || "pitch") as Profile | "off";
				return ok(r.map((s: any) => ({ key: s.key, id: s.id, layout: s.layout, lint: profile === "off" ? [] : lintTexts(s.texts.map((t: any) => ({ where: t.where, text: t.text })), profile as Profile).slice(0, 12), words: s.texts.reduce((a: number, t: any) => a + words(t.text), 0) })));
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ text lint (no Figma)
	server.tool(
		"sparq_text_lint",
		"Editorial lint for draft texts before they go into Figma (AI clichés, «не X, а Y», overclaims, empty evaluations, bureaucratese, typography). Works offline.",
		{ texts: z.array(z.object({ where: z.string(), text: z.string() })), profile: z.enum(["report", "pitch", "post"]).optional(), blacklist: z.array(z.string()).optional() },
		async ({ texts, profile, blacklist }) => ok({ hits: lintTexts(texts, (profile || "pitch") as Profile, blacklist || []), words: texts.map(t => ({ where: t.where, words: words(t.text) })) }),
	);

	// ------------------------------------------------------------------ run
	server.tool(
		"sparq_run",
		"Run custom JS in the target Figma file with the SPARQ runtime preloaded: kit='deck' gives K (deck kit: K.t, K.f, K.icon, K.T(dark)…) and D (D.build, D.block(parent, block, {T})); kit='cards' gives O (card ops: O.page, O.card, O.carousel, O.lint, O.chart…). Only when the user explicitly asks for something the system does not have — never to patch comments, fill empty space or move elements of built cards/slides (rebuild with another kind/block instead). Return a small JSON result. 30 s limit per call.",
		{ code: z.string(), kit: z.enum(["deck", "cards", "none"]).optional(), fileKey: z.string().optional(), timeout: z.number().optional() },
		async ({ code, kit, fileKey, timeout }) => {
			try {
				const pre = kit === "cards" ? cardsPrelude() : kit === "none" ? "" : deckPrelude();
				const r = await run(ctx, pre + `return await (async () => {\n${code}\n})();`, fileKey, timeout || 30000);
				return ok({ result: r });
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ cards
	server.tool(
		"sparq_cards",
		"Build Telegram carousel cards (1080²) from specs with the SPARQ card system (skill sparq-cards). Opens/creates page «P·<date> <slug>» and appends cards to its «карусель» row. spec = {kind, tone?, bg? (omit or 'auto' = picked by role; blotch backgrounds are replaced), props:{title,counter,text,…}, bold?:[…], rubric?, kicker?, items?:[{icon,title,note}] (kind=list, ≤4), plate?:{icon,tone,size,x,y}, chart?:{type,size,data}, texts?:{layer:text}, photo?:path}. ≤ 3–4 cards per call. Returns ids and lint.",
		{ slug: z.string(), date: z.string().optional(), cards: z.array(z.record(z.any())).min(1), fileKey: z.string().optional(), assetsDir: z.string().optional() },
		async ({ slug, date, cards, fileKey, assetsDir }) => {
			try {
				const notes: string[] = [];
				const pre = cards.map(c => kindNote(c));
				const specs = cards.map(c => inlineImages(typoCard(boldMarkup(c)), assetsDir, notes));
				const r = await run(ctx, cardsPrelude() + `await O.page(${lit(slug)},${lit(date || null)}||undefined);const out=[];
for(const s of ${lit(specs)}){const photo=s.b64?s:null;const spec={...s};delete spec.b64;delete spec.size;const c=await O.card(spec);
 if(photo){const ph=c.node.findOne(n=>n.name==='photo');if(ph){const im=figma.createImage(figma.base64Decode(photo.b64));ph.fills=[{type:'IMAGE',imageHash:im.hash,scaleMode:'FILL'}];for(const nm of ['bg/head','bg/body']){const x=c.node.findOne(n=>n.name===nm);if(x)x.visible=false}}}
 out.push({id:c.id,issues:c.issues,...(c.notes&&c.notes.length?{notes:c.notes}:{})})}
const l=await O.lint();return {cards:out,lint:l};`, fileKey, 30000);
				if (r && Array.isArray(r.cards)) r.cards.forEach((c: any, k: number) => { if (pre[k]) c.notes = [...(c.notes || []), pre[k]]; });
				return ok({ ...r, notes });
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ export
	server.tool(
		"sparq_export",
		"Export slides/cards to local files. format: png | jpg | pdf (pdf = one merged file of the selected slides — check the reported size against the 2 MB limit some applications have). Targets: deck keys, node ids, or all deck slides. Writes into outDir and returns paths and sizes.",
		{ outDir: z.string(), format: z.enum(["png", "jpg", "pdf"]), keys: z.array(z.string()).optional(), nodeIds: z.array(z.string()).optional(), scale: z.number().optional(), fileName: z.string().optional(), fileKey: z.string().optional() },
		async ({ outDir, format, keys, nodeIds, scale, fileName, fileKey }) => {
			try {
				const dir = expand(outDir); mkdirSync(dir, { recursive: true });
				const ids: { id: string; key: string }[] = await run(ctx, `${DECK_PAGE}const keys=${lit(keys || null)},ids=${lit(nodeIds || null)};
if(ids)return ids.map(id=>({id,key:id.replace(':','-')}));
await figma.loadAllPagesAsync();const all=figma.editorType==='slides'?figma.getSlideGrid().flat().filter(s=>!s.isSkippedSlide):figma.currentPage.findChildren(n=>n.type==='FRAME'&&n.getSharedPluginData('sparqdeck','key'));
return all.filter(s=>!keys||keys.includes(s.getSharedPluginData('sparqdeck','key'))).map(s=>({id:s.id,key:s.getSharedPluginData('sparqdeck','key')||s.name}));`, fileKey, 10000);
				const fmt = format === "pdf" ? "PDF" : format.toUpperCase();
				const files: { path: string; bytes: number }[] = []; const pdfParts: Buffer[] = [];
				for (const t of ids) {
					const b64: string = await run(ctx, `const n=await figma.getNodeByIdAsync(${lit(t.id)});const b=await n.exportAsync(${lit(fmt === "PDF" ? { format: "PDF" } : { format: fmt, constraint: { type: "SCALE", value: scale || 1 } })});return figma.base64Encode(b);`, fileKey, 30000);
					const buf = Buffer.from(b64, "base64");
					if (fmt === "PDF") pdfParts.push(buf);
					else { const p = join(dir, `${t.key}.${format}`); writeFileSync(p, buf); files.push({ path: p, bytes: buf.length }); }
				}
				if (fmt === "PDF") {
					const { PDFDocument } = await import("pdf-lib");
					const doc = await PDFDocument.create();
					for (const part of pdfParts) { const src = await PDFDocument.load(part); const pages = await doc.copyPages(src, src.getPageIndices()); pages.forEach(p => doc.addPage(p)); }
					const bytes = await doc.save({ useObjectStreams: true });
					const p = join(dir, (fileName || "deck") + ".pdf"); writeFileSync(p, bytes); files.push({ path: p, bytes: bytes.length });
				}
				const total = files.reduce((a, f) => a + f.bytes, 0);
				return ok({ files, totalMB: +(total / 1e6).toFixed(2), warn: total > 2e6 ? "больше 2 МБ: сжать фото/скриншоты (JPEG), убрать размытия и зерно" : undefined });
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ comments
	server.tool(
		"sparq_comments",
		"Read the user's Figma comments in the target file, already mapped to slide/card keys and the text near each pin — the fastest way to turn feedback into a fix list. Needs a Figma personal access token in ~/.sparq-studio/figma-token (or env FIGMA_ACCESS_TOKEN).",
		{ fileKey: z.string().optional(), includeResolved: z.boolean().optional() },
		async ({ fileKey, includeResolved }) => {
			try {
				const ws = ctx.ws();
				const key = fileKey || (ws && ws.getActiveFileKey());
				if (!key) return fail("no target file");
				const tokPath = join(homedir(), ".sparq-studio", "figma-token");
				const token = process.env.FIGMA_ACCESS_TOKEN || (existsSync(tokPath) ? readFileSync(tokPath, "utf8").trim() : "");
				if (!token) return fail("no Figma token: the user should create a personal access token in Figma (Settings → Security → Personal access tokens, scope: file comments read) and save it to ~/.sparq-studio/figma-token");
				const res = await fetch(`https://api.figma.com/v1/files/${key}/comments`, { headers: { "X-Figma-Token": token } });
				if (!res.ok) return fail("Figma API " + res.status);
				const data: any = await res.json();
				const list = (data.comments || []).filter((c: any) => includeResolved || !c.resolved_at);
				const nodeIds = [...new Set(list.map((c: any) => c.client_meta && c.client_meta.node_id).filter(Boolean))];
				const where: Record<string, any> = nodeIds.length ? await run(ctx, `const out={};for(const id of ${lit(nodeIds)}){const n=await figma.getNodeByIdAsync(id);if(!n){out[id]=null;continue}let p=n,key='';while(p&&p.type!=='PAGE'){key=p.getSharedPluginData&&p.getSharedPluginData('sparqdeck','key')||key;if(p.type==='SLIDE'||(p.parent&&p.parent.type==='PAGE'))break;p=p.parent}const t=n.type==='TEXT'?n:(n.findOne?n.findOne(x=>x.type==='TEXT'):null);out[id]={slide:key||(p&&p.name),node:n.name,type:n.type,text:t?t.characters.slice(0,80):null}}return out;`, key, 15000) : {};
				return ok(list.map((c: any) => ({ id: c.id, at: c.created_at.slice(0, 16), by: c.user && c.user.handle, msg: c.message, reply: !!c.parent_id, ...(c.client_meta && c.client_meta.node_id ? { ...(where[c.client_meta.node_id] || { note: "элемент уже удалён или пересобран — найти место по смыслу комментария и скриншоту" }), offset: c.client_meta.node_offset } : {}) })));
			} catch (e: any) { return fail(e.message); }
		},
	);

	// ------------------------------------------------------------------ catalog (offline)
	server.tool(
		"sparq_catalog",
		"Offline lists from the sealed design kit (no Figma call): what='icons' (deck icon names), 'card-icons' (icons + decor + backgrounds available to cards, by role), 'cards' (card components: kinds, tones, backgrounds, chart types, properties), 'charts' (card chart generators and data shapes).",
		{ what: z.enum(["icons", "card-icons", "cards", "charts"]) },
		async ({ what }) => {
			if (what === "icons") return ok(Object.keys(json("icons/deck.json")));
			if (what === "charts") return ok(asset("catalog/charts.md"));
			if (what === "card-icons") {
				const L = json("library/cards.json");
				const icons = L.items.filter((i: any) => /^sparq\/icon\//.test(i.name)).map((i: any) => i.name.slice(11));
				const sets = (n: string) => (L.items.find((i: any) => i.name === n)?.variants || []).map((v: any) => v.n);
				return ok({ icons, iconStyles: ["line", "solid"], illustrationCovers: { "cover-sphere": "сфера Блоха — кубиты, состояния, введение", "cover-landscape": "энергетический ландшафт — оптимизация, отжиг, вычисления", "cover-contours": "контуры PQC и КРК — защита данных, криптография", "cover-atom": "атом и интерференция — сенсоры, физика", "cover-network": "карта сети — кейс, инфраструктура, маршрут", "cover-barcode": "штрихкод→сфера — отчёт, аналитика, серия" }, iconPlate: sets("sparq/icon-plate"), backgrounds: { cover: ["cover-ring", "cover-orbit", "cover-interference", "cover-circuit", "cover-supremat", "cover-bolt", "cover-red-ring"], text: ["dark-ring", "dark-orbit", "dark-crosshair", "dark-dots", "dark-wires", "dark-field"], full: ["dark-circuit", "dark-ticks"], light: ["light-paper", "light-frost", "light-grid"], red: ["red", "red-deep"], blotchForbidden: ["dark-haze", "dark-gradient", "glass-orb", "glass-bolt"] } });
			}
			const lib = json("library/cards.json");
			return ok(lib.items.filter((i: any) => /card|bg|tag|rubric|chart|slot|mark|series|topic|country|status|meta/.test(i.name)).map((i: any) => ({ name: i.name, variants: i.variants.map((v: any) => v.n).join(" | ").slice(0, 600), props: Object.fromEntries(Object.entries(i.props).filter(([, d]: any) => d.type !== "VARIANT").map(([k, d]: any) => [k, d.type])) })));
		},
	);
	// ------------------------------------------------------------------ maintainer (SPARQ_MAINT=1)
	if (process.env.SPARQ_MAINT === "1") {
		server.tool(
			"sparq_maint_export",
			"Maintainer only: export the design source of a Figma file into the repo (design/_source/…): what='cards-library' (component snapshot of the system page), 'cards-tokens' or 'deck-tokens' (variables + styles). Then run tools/build-plugin.sh.",
			{ what: z.enum(["cards-library", "cards-tokens", "deck-tokens"]), out: z.string(), fileKey: z.string().optional(), pagePrefix: z.string().optional() },
			async ({ what, out, fileKey, pagePrefix }) => {
				try {
					let data: any;
					if (what === "cards-library") data = await run(ctx, `const PAGE_PREFIX=${lit(pagePrefix || "SPARQ · система")};const SECTIONS=null;\nreturn ${mod("runtime/maint/snapshot-library.js")};`, fileKey, 30000);
					else data = await run(ctx, `return ${mod("runtime/maint/export-tokens.js")};`, fileKey, 30000);
					const p = expand(out); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, JSON.stringify(data));
					return ok({ written: p, bytes: statSync(p).size });
				} catch (e: any) { return fail(e.message); }
			},
		);
	}
}


/** Upstream figma-console tools kept in the SPARQ toolset (the rest is hidden unless SPARQ_TOOLSET=full). */
export const UPSTREAM_KEEP = new Set([
	"figma_get_status", "figma_list_open_files", "figma_navigate", "figma_reconnect", "figma_diagnose",
	"figma_capture_screenshot", "figma_get_selection",
	"figma_get_comments", "figma_post_comment", "figma_delete_comment",
	"figma_list_slides", "figma_skip_slide", "figma_reorder_slides", "figma_focus_slide", "figma_set_image_fill",
]);
