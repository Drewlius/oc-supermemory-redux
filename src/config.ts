import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface Config {
  apiKey: string;
  baseUrl: string;
  containerTag: string;
  similarityThreshold: number;
  maxMemories: number;
  injectProfile: boolean;
  entityContext: string;
  keywordPatterns: string[];
}

const DEFAULT_BASE_URL = "https://api.supermemory.ai";

const DEFAULT_KEYWORDS = [
  "remember",
  "memorize",
  "save\\s+this",
  "note\\s+this",
  "keep\\s+in\\s+mind",
  "don'?t\\s+forget",
  "learn\\s+this",
  "store\\s+this",
  "record\\s+this",
  "make\\s+a\\s+note",
  "take\\s+note",
  "jot\\s+down",
  "commit\\s+to\\s+memory",
  "never\\s+forget",
  "always\\s+remember",
  "log\\s+this",
  "write\\s+down",
];

const DEFAULT_ENTITY_CONTEXT = `Shared coding-agent memory for one user.

EXTRACT:
- User preferences, accepted decisions, durable workflows, actions, and learnings
- Architecture, conventions, patterns, setup details
- Decisions and their rationale

SKIP:
- Generic suggestions the user did not accept
- Transient command output and low-value chatter
- Granular details that do not help future work`;

function stripJsoncComments(content: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  let i = 0;

  while (i < content.length) {
    const c = content[i];
    const next = content[i + 1];

    if (escaped) {
      result += c;
      escaped = false;
      i++;
      continue;
    }

    if (c === "\\" && inString) {
      result += c;
      escaped = true;
      i++;
      continue;
    }

    if (c === '"') {
      inString = !inString;
      result += c;
      i++;
      continue;
    }

    if (!inString && c === "/" && next === "/") {
      while (i < content.length && content[i] !== "\n") i++;
      result += "\n";
      continue;
    }

    if (!inString && c === "/" && next === "*") {
      i += 2;
      while (i < content.length && !(content[i] === "*" && content[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    result += c;
    i++;
  }

  return result.replace(/,(\s*[}\]])/g, "$1");
}

function loadConfigFile(): Record<string, unknown> | null {
  const configDir = join(homedir(), ".config", "opencode");
  const paths = [
    join(configDir, "supermemory.jsonc"),
    join(configDir, "supermemory.json"),
  ];

  for (const path of paths) {
    if (!existsSync(path)) continue;
    try {
      const raw = readFileSync(path, "utf-8");
      return JSON.parse(stripJsoncComments(raw));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[oc-supermemory-redux] Failed to parse ${path}: ${msg}`);
      return null;
    }
  }

  return null;
}

function loadApiKey(fileConfig: Record<string, unknown> | null): string | undefined {
  if (process.env.SUPERMEMORY_API_KEY) return process.env.SUPERMEMORY_API_KEY;
  if (fileConfig?.apiKey) return fileConfig.apiKey as string;

  const opencodeCreds = join(homedir(), ".config", "opencode", "supermemory-credentials.json");
  if (existsSync(opencodeCreds)) {
    try {
      const c = JSON.parse(readFileSync(opencodeCreds, "utf-8"));
      if (c.apiKey) return c.apiKey;
    } catch {}
  }

  return undefined;
}

export function loadConfig(): Config {
  const fileConfig = loadConfigFile();
  const apiKey = loadApiKey(fileConfig);

  if (!apiKey) {
    throw new Error(
      "No Supermemory API key found. Set SUPERMEMORY_API_KEY env var, " +
      "add apiKey to ~/.config/opencode/supermemory.jsonc, or create " +
      "~/.config/opencode/supermemory-credentials.json with {\"apiKey\": \"sm_...\"}"
    );
  }

  const containerTag =
    (fileConfig?.containerTag as string) ||
    "opencode";

  if (!fileConfig?.containerTag) {
    console.warn(
      `[oc-supermemory-redux] No containerTag set in config. ` +
      `Using "${containerTag}" as fallback. Set containerTag in ` +
      `~/.config/opencode/supermemory.jsonc to target your memory bucket.`
    );
  }

  const userKeywords = (fileConfig?.keywordPatterns as string[]) || [];
  const keywordPatterns = [...new Set([...DEFAULT_KEYWORDS, ...userKeywords])];

  return {
    apiKey,
    baseUrl: (fileConfig?.baseUrl as string) || DEFAULT_BASE_URL,
    containerTag,
    similarityThreshold: (fileConfig?.similarityThreshold as number) ?? 0.6,
    maxMemories: (fileConfig?.maxMemories as number) ?? 3,
    injectProfile: fileConfig?.injectProfile !== false,
    entityContext: (fileConfig?.entityContext as string) || DEFAULT_ENTITY_CONTEXT,
    keywordPatterns,
  };
}
