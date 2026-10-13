/**
 * SPARQ Studio · sealed design assets.
 * The design system lives as files next to the server bundle (plugin/design/*):
 * tokens, runtime JS executed inside Figma, icon sets, the cards component snapshot.
 * Nothing here is ever sent to the model — only to Figma through the bridge.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const KIT_VERSION = "1.4.0";
/** Version of the component library snapshot (design/library/cards.json). Bump only when components change — files with an older library are asked to reinstall it, which is heavy. */
export const LIB_VERSION = "1.3.0";

function findDesignDir(): string {
	if (process.env.SPARQ_DESIGN_DIR && existsSync(process.env.SPARQ_DESIGN_DIR)) return process.env.SPARQ_DESIGN_DIR;
	const here = dirname(fileURLToPath(import.meta.url));
	// bundled: <plugin>/server/sparq-mcp.mjs → <plugin>/design ; dev: mcp/dist/sparq → repo/design
	const candidates = [join(here, "..", "design"), join(here, "design"), join(here, "..", "..", "..", "design"), join(here, "..", "..", "design")];
	for (const c of candidates) if (existsSync(join(c, "tokens", "deck.json"))) return resolve(c);
	throw new Error("SPARQ design assets not found. Set SPARQ_DESIGN_DIR. Looked in: " + candidates.join(", "));
}

let DIR: string | null = null;
const cache = new Map<string, string>();
export function designDir(): string {
	if (!DIR) DIR = findDesignDir();
	return DIR;
}
export function asset(rel: string): string {
	const hit = cache.get(rel);
	if (hit !== undefined) return hit;
	const txt = readFileSync(join(designDir(), rel), "utf8");
	cache.set(rel, txt);
	return txt;
}
export function json<T = any>(rel: string): T {
	return JSON.parse(asset(rel));
}

/** Wrap a runtime module (body ending in `return X;`) as an awaited expression. */
export function mod(rel: string, tail = ""): string {
	return `await (async () => {\n${asset(rel)}\n${tail}\n})()`;
}

/** Prelude giving user code K (deck kit) and D (slide DSL). */
export function deckPrelude(): string {
	return `const K = ${mod("runtime/deck/kit.js")};\nconst D = await (async (K) => {\n${asset("runtime/deck/dsl.js")}\n})(K);\n`;
}
/** Prelude giving user code O (cards ops) — cards code lives in the file's plugin data after setup. */
export function cardsPrelude(): string {
	return `const __AF = Object.getPrototypeOf(async function(){}).constructor;\nif (!figma.root.getSharedPluginData('sparq','ops')) throw new Error('SPARQ cards kit is not installed in this file — run sparq_setup_file {kit:"cards"}');\nglobalThis.__sqFonts = globalThis.__sqFonts || new Set();\nconst __LF = async (f) => { const k = f.family + '|' + f.style; if (globalThis.__sqFonts.has(k)) return; await figma.loadFontAsync(f); globalThis.__sqFonts.add(k); };\n// Figma throttles repeated loadFontAsync calls within one execution; card modules get a figma proxy with a cached loader.\nconst __F = new Proxy({}, { get: (_, k) => k === 'loadFontAsync' ? __LF : (typeof figma[k] === 'function' ? figma[k].bind(figma) : figma[k]), set: (_, k, v) => { figma[k] = v; return true; }, has: (_, k) => k in figma });\nconst O = await (new __AF('figma', figma.root.getSharedPluginData('sparq','ops')))(__F);\n`;
}
export function auditPrelude(): string {
	return `const __audit = await (async () => {\nlet audit;\n${asset("runtime/common/audit.js")}\nreturn audit;\n})();\n`;
}

/** JS string literal for embedding data into generated code. */
export const lit = (v: unknown) => JSON.stringify(v).split(String.fromCharCode(0x2028)).join("\\u2028").split(String.fromCharCode(0x2029)).join("\\u2029");
