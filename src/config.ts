import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { parse as parseJsonc, type ParseError } from "jsonc-parser/lib/esm/main.js";

declare const process: {
  env: Record<string, string | undefined>;
};

export interface Config {
  SUPERMEMORY_API_KEY: string;
  baseUrl: string;
  nameSpace: string;
  similarityThreshold: number;
  maxMemories: number;
  injectProfile: boolean;
  supportingContext: string;
  rerank: boolean;
  rewriteQuery: boolean;
  aggregate: boolean;
  includeSummaries: boolean;
}

const DIR = process.env.OPENCODE_CONFIG_DIR?.trim() || join(homedir(), ".config", "opencode");

const DEFAULTS = {
  baseUrl: "https://api.supermemory.ai",
  nameSpace: "opencode",
  similarityThreshold: 0.6,
  maxMemories: 3,
  injectProfile: true,
  rerank: false,
  rewriteQuery: false,
  aggregate: false,
  includeSummaries: false,
  supportingContext: `Shared coding-agent memory for one user.
EXTRACT:
- User preferences, accepted decisions, durable workflows, actions, and learnings
- Architecture, conventions, patterns, setup details
- Decisions and their rationale
SKIP:
- Generic suggestions the user did not accept
- Transient command output and low-value chatter
- Granular details that do not help future work`,
};

// API-key precedence, most-trusted first.  jsonc = allow // comments + trailing commas.
const FILES: [string, boolean][] = [
  ["supermemory-credentials.json", false],
  ["supermemory.jsonc", true],
  ["supermemory-credentials.jsonc", true],
  ["supermemory.json", false],
];

function read(name: string, jsonc: boolean): Record<string, unknown> | null {
  const p = join(DIR, name);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
    const errors: ParseError[] = [];
    const out: unknown = jsonc
      ? parseJsonc(raw, errors, { allowTrailingComma: true })
      : JSON.parse(raw);
    return (typeof out === "object" && out !== null && !Array.isArray(out))
     ? (out as Record<string, unknown>)
     : null;
  } catch {
    return null;
  }
}

function key(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function isRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 100;
}

function b(v: unknown, d: boolean): boolean {
  return typeof v === "boolean" ? v : d;
}

function url(v: unknown): string {
  if (typeof v !== "string") return DEFAULTS.baseUrl;
  const s = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v) ? v : `http://${v}`;
  try {
    const u = new URL(s);
    return (u.protocol === "http:" || u.protocol === `https:`)
      ? u.toString().replace(/\/$/, "")
      : DEFAULTS.baseUrl;
  } catch {
    return DEFAULTS.baseUrl;
  }
}

function loadConfig(): Config {
  const f = Object.fromEntries(FILES.map(([n, j]) => [n, read(n, j)]));

  const SUPERMEMORY_API_KEY =
    key(process.env.SUPERMEMORY_API_KEY) ??
    key(f["supermemory-credentials.json"]?.SUPERMEMORY_API_KEY) ??
    key(f["supermemory.jsonc"]?.SUPERMEMORY_API_KEY) ??
    key(f["supermemory-credentials.jsonc"]?.SUPERMEMORY_API_KEY) ??
    key(f["supermemory.json"]?.SUPERMEMORY_API_KEY) ??
    "dummy";

  const base = f["supermemory.jsonc"] ?? f["supermemory.json"] ?? {};
  return {
    SUPERMEMORY_API_KEY,
    baseUrl: url(base.baseUrl),
    nameSpace:
      typeof base.nameSpace === "string" && /^[a-zA-Z0-9_:-]{1,100}$/.test(base.nameSpace)
        ? base.nameSpace
        : DEFAULTS.nameSpace,
    similarityThreshold: isRange(base.similarityThreshold, 0, 1)
      ? base.similarityThreshold
      : DEFAULTS.similarityThreshold,
    maxMemories: isInt(base.maxMemories) ? base.maxMemories : DEFAULTS.maxMemories,
    injectProfile: b(base.injectProfile, DEFAULTS.injectProfile),
    supportingContext:
      typeof base.supportingContext === "string" && base.supportingContext.length <= 1500
        ? base.supportingContext
        : DEFAULTS.supportingContext,
    rerank: b(base.rerank, DEFAULTS.rerank),
    rewriteQuery: b(base.rewriteQuery, DEFAULTS.rewriteQuery),
    aggregate: b(base.aggregate, DEFAULTS.aggregate),
    includeSummaries: b(base.includeSummaries, DEFAULTS.includeSummaries),
  };
}
export const Config = loadConfig()