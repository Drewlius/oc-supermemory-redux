import { Plugin } from "@opencode/plugin";
import { Supermemory } from "supermemory";
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { loadConfig, type Config } from "./config.js";

const KEYWORD_PATTERN = /\b(remember|memorize|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;

const SAVE_NUDGE = `[MEMORY TRIGGER DETECTED]
The user wants you to remember something. Use the \`supermemory\` tool with \`mode: "add"\` to save this information.

Extract the key information and save it as a concise, searchable memory.

DO NOT skip this step. The user explicitly asked you to remember.`;

const LOG_FILE = join(homedir(), ".local", "share", "opencode", "log", "superMemory-Redux_OpenCode.log");

const ingestedMessageIds = new Set<string>();
const profiledSessions = new Set<string>();
const searchedMessageIds = new Set<string>();
const sessionModels = new Map<string, string>();

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fileLog(level: "info" | "warn" | "error", message: string, extra?: unknown) {
  const stamp = `${new Date().toISOString().slice(0, 22)}Z`;
  const line =
    `${stamp} [${level}] ${message}` +
    (extra === undefined ? "" : ` ${safeSnippet(extra)}`) +
    "\n";
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, line);
  } catch {}
  if (level === "error") console.error(`[superMemory Redux] ${message}`);
  else console.log(`[superMemory Redux] ${message}`);
}

function safeSnippet(value: unknown, max = 500): string {  try {
    const s = typeof value === "string" ? value : JSON.stringify(value);
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch {
    return "[unserializable]";
  }
}

function extractFactText(fact: unknown): string {
  if (typeof fact === "string") return fact;
  const obj = fact as Record<string, unknown>;
  if (obj?.text) return String(obj.text);
  if (obj?.content) return String(obj.content);
  if (obj?.fact) return String(obj.fact);
  return JSON.stringify(fact) ?? String(fact);
}

function formatContext(
  profile: { static?: unknown[]; dynamic?: unknown[] } | null,
  searchResults: {
    results?: Array<{ memory?: string; chunk?: string; similarity?: number; status?: string }>;
  } | null,
  config: Config,
): string {
  const parts: string[] = ["[SUPERMEMORY]"];
  if (config.injectProfile && profile) {
    const staticFacts = profile.static ?? [];
    const dynamicFacts = profile.dynamic ?? [];
    if (staticFacts.length > 0) {
      parts.push("\nUser Profile:");
      staticFacts.forEach((f) => parts.push(`- ${extractFactText(f)}`));}
    if (dynamicFacts.length > 0) {
      parts.push("\nRecent Context:");
      dynamicFacts.forEach((f) => parts.push(`- ${extractFactText(f)}`));}}
  const results = searchResults?.results ?? [];
  if (results.length > 0) {
    parts.push("\nRelevant Memories:");
    results.forEach((r) => {
      const sim = Math.round((r.similarity ?? 0) * 100);
      const content = r.memory || r.chunk || "";
      parts.push(`- [${sim}%] ${content}`);});}
  if (parts.length === 1) return "";
  return parts.join("\n");}

function toRecallResults(items: any[]): Array<{ memory?: string; chunk?: string; similarity?: number; status?: string }> {
  return (items ?? []).map((r: any) => ({
    memory: r.memory ?? r.chunk ?? r.content ?? (typeof r === "string" ? r : ""),
    chunk: r.chunk ?? "",
    similarity: r.similarity ?? r.score ?? 0,
    status: r.status ?? r.document?.status,
  }));
}

export default Plugin.define({
  id: "superMemory-Redux",
  async setup(ctx) {
    fileLog("info", `setup start dir=${ctx.location.directory}`);
    let config: Config;
    try { config = loadConfig();
    } catch (e) {
      const message = `Configuration failed: ${e instanceof Error ? e.message : String(e)}`;
      fileLog("error", message);
      return;}
    const sm = new Supermemory({ apiKey: config.apiKey, baseURL: config.baseUrl });
    const SEARCH_MODE = "hybrid";
    const apiHeaders = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    const trySyncEntityContext = async () => {
      try {
        const response = await fetch(
          `${config.baseUrl}/v3/container-tags/${encodeURIComponent(config.containerTag)}`,
          {
            method: "PATCH",
            headers: apiHeaders,
            body: JSON.stringify({ entityContext: config.entityContext }),
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok) fileLog("warn", `entity context sync failed (${response.status}): ${await response.text()}`);
        else fileLog("info", "entity context synced");
      } catch (error) {
        fileLog("warn", "entity context sync failed", errMsg(error));
      }
    };
    void trySyncEntityContext();
    const recallLines = (which: string, id: string) => ({
      ok: which === "profile"
        ? `profile injection successful for session:${id}`
        : `search results acquisition successful for session${id}`,
      failed: which === "profile"
        ? `profile injection failed for session:${id}`
        : `search results acquisition failed for session${id}`,
    });
    const postSynthetic = (sessionID: string, text: string, source: string) =>
      ctx.session.synthetic({
        sessionID,
        text,
        delivery: "steer",
        resume: false,
        metadata: { source },
      });
    const deliverInjection = async (label: string, sessionID: string, rawUserMessage: string, text: string) => {
      if (!text) {
        fileLog("error", recallLines(label, sessionID).failed, { results: 0, threshold: config.similarityThreshold, q: rawUserMessage.slice(0, 200) });
        return null;
      }
      const posted = await postSynthetic(sessionID, text, "supermemory-recall").catch((error: unknown) => {
        fileLog("error", recallLines(label, sessionID).failed, errMsg(error));
        return null;
      });
      if (!posted) return null;
      fileLog("info", recallLines(label, sessionID).ok, { chars: text.length, qChars: rawUserMessage.length, syntheticId: (posted as any)?.id ?? null });
      return posted;
    };
    await ctx.session.hook("prompt", async (event) => {
      const rawUserMessage = event.prompt.text?.trim();
      if (!rawUserMessage) return;
      const sessionID = event.sessionID;
      const model = (event as any).model;
      const modelID = model?.modelID ?? model?.id;
      if (modelID) sessionModels.set(sessionID, modelID);
      const turnID = `${sessionID}:${(event as any).messageID ?? rawUserMessage}`;
      const searchKey = `${turnID}:search`;
      const ingestKey = `${turnID}:ingest`;
      let label = "";
      let text = "";
      if (!profiledSessions.has(sessionID)) {
        label = "profile";
        try {
          const profileRes = await sm.profile({
            containerTag: config.containerTag,
            q: rawUserMessage,
            threshold: config.similarityThreshold,
          });
          text = formatContext(
            profileRes.profile ?? null,
            profileRes.searchResults ? { results: toRecallResults(profileRes.searchResults.results ?? []) } : null,
            config,
          );
        } catch (error) {
          fileLog("error", recallLines("profile", sessionID).failed, errMsg(error));
          label = "";
        } finally {
          profiledSessions.add(sessionID);
          searchedMessageIds.add(searchKey);
        }
      } else if (!searchedMessageIds.has(searchKey)) {
        label = "search";
        try {
          const results = await sm.search({
            q: rawUserMessage,
            containerTag: config.containerTag,
            searchMode: SEARCH_MODE,
            limit: config.maxMemories,
            threshold: config.similarityThreshold,
            rerank: config.rerank,
            rewriteQuery: config.rewriteQuery,
            aggregate: config.aggregate,
            include: { summaries: config.includeSummaries },
          });
          text = formatContext(null, { results: toRecallResults((results as any).results ?? []) }, config);
        } catch (error) {
          fileLog("error", recallLines("search", sessionID).failed, errMsg(error));
          label = "";
        } finally {
          searchedMessageIds.add(searchKey);
        }
      }
      if (label) await deliverInjection(label, sessionID, rawUserMessage, text);
      if (KEYWORD_PATTERN.test(rawUserMessage)) {
        const nudge = await postSynthetic(sessionID, SAVE_NUDGE, "supermemory-nudge").catch((error: unknown) => {
          fileLog("error", `keyword trigger failed for session:${sessionID}`, errMsg(error));
          return null;
        });
        if (nudge) fileLog("info", `keyword trigger posted for session:${sessionID}`, { syntheticId: (nudge as any)?.id ?? null });
      }
      try {
        if (!ingestedMessageIds.has(ingestKey)) {
          const context = await ctx.session.context({ sessionID });
          const msgs = Array.isArray(context) ? context : ((context as any)?.data ?? []);
          const previousAssistant = [...msgs].reverse().find((m: any) => m.type === "assistant");
          const assistantText =
            previousAssistant?.content
              ?.filter((p: any) => p?.type === "text")
              ?.map((p: any) => String(p?.text ?? ""))
              ?.join("\n")
              .trim() ?? "";
          const content = [
            `user: ${rawUserMessage}`,
            assistantText ? `assistant: ${assistantText}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          const toolModel = sessionModels.get(sessionID);
          await sm.add({
            content,
            containerTag: config.containerTag,
            customId: sessionID,
            metadata: { source: "opencode", ...(toolModel ? { model: toolModel } : {}) },
            ...{ dreaming: "dynamic" },
          });
          ingestedMessageIds.add(ingestKey);
          fileLog("info", `conversation turn ingestion successful for session ${sessionID}`, { userChars: rawUserMessage.length, asstChars: assistantText.length });
        }
      } catch (ingestErr) {
        fileLog("error", `conversation turn ingestion failed for session ${sessionID}`, errMsg(ingestErr));
      }
    });
    const wrapExecute = (toolName: string, fn: (input: any) => Promise<{ content: string; resolved?: unknown }>) => async (input: any) => {
      try {
        const { content, resolved } = await fn(input);
        fileLog("info", `${toolName} success`, resolved ?? safeSnippet(input, 200));
        return { content };
      } catch (error) {
        const message = errMsg(error);
        fileLog("error", `${toolName} failed`, message);
        return { content: JSON.stringify({ success: false, error: message }) };
      }
    };
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "search",
        description: "Find relevant past memories for the current task. Check on your own when prior context could help.",
        input: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query text" },
            limit: { type: "number", description: "Max memories to return" },
            rerank: { type: "boolean", description: "Rerank by relevance" },
            rewriteQuery: { type: "boolean", description: "Rewrite query for better recall" },
            aggregate: { type: "boolean", description: "Synthesize memories into a summary" },
            summaries: { type: "boolean", description: "Include document summaries" },
          },
          required: ["query"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("search", async (input) => {
          const args = input as { query: string; limit?: number; rerank?: boolean; rewriteQuery?: boolean; summaries?: boolean; aggregate?: boolean };
          const effectiveLimit = args.limit ?? config.maxMemories;
          const results = await sm.search({
            q: args.query,
            containerTag: config.containerTag,
            searchMode: SEARCH_MODE,
            limit: effectiveLimit,
            threshold: config.similarityThreshold,
            rerank: args.rerank ?? config.rerank,
            rewriteQuery: args.rewriteQuery ?? config.rewriteQuery,
            aggregate: args.aggregate ?? config.aggregate,
            include: { summaries: args.summaries ?? config.includeSummaries },
          });
          const n = (results as any)?.results?.length ?? 0;
          return { content: JSON.stringify({ success: true, results }), resolved: { limit: effectiveLimit, threshold: config.similarityThreshold, returned: n } };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "add",
        description: "Save lasting facts, decisions, or setup details. Save on your own when something worth keeping appears.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "Durable fact or summary to store" },
            filepath: { type: "string", description: "Optional source file path" },
            metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: ["string", "number", "boolean", "array"] } },
            taskType: { type: "string", enum: ["memory", "superrag"], description: "memory (default) or superrag" },
          },
          required: ["content"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("add", async (input) => {
          const args = input as { content: string; filepath?: string; taskType?: "memory" | "superrag"; metadata?: Record<string, string | number | boolean | string[]> };
          const results = await sm.add({
            containerTag: config.containerTag,
            content: args.content,
            filepath: args.filepath,
            taskType: args.taskType,
            metadata: args.metadata,
          });
          return { content: JSON.stringify({ success: true, results }), resolved: { chars: args.content.length, taskType: args.taskType ?? "memory" } };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "remember",
        description: "Save an exact user-stated fact. Use when the user says remember this.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "Exact fact text to store" },
            metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: "string" } },
          },
          required: ["content"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("remember", async (input) => {
          const args = input as { content: string; metadata?: Record<string, string> };
          const response = await fetch(`${config.baseUrl}/v4/memories`, {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({
              memories: [{ content: args.content, isStatic: false, metadata: { source: "opencode", ...(args.metadata ?? {}) } }],
              containerTag: config.containerTag,
            }),
          });
          if (!response.ok) throw new Error(`Remember failed (${response.status}): ${await response.text()}`);
          return { content: JSON.stringify({ success: true, result: await response.json() }), resolved: { chars: args.content.length } };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "forget",
        description: "Delete a stored memory. Only on explicit user request.",
        input: {
          type: "object",
          properties: {
            memoryId: { type: "string", description: "Memory ID to forget" },
            content: { type: "string", description: "Exact content when ID unknown" },
            reason: { type: "string", description: "Reason for forgetting" },
          },
          required: [],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("forget", async (input) => {
          const args = input as { memoryId?: string; content?: string; reason?: string };
          if (!args.memoryId && !args.content) throw new Error("memoryId or content is required");
          const result = await sm.memories.forget({
            containerTag: config.containerTag,
            ...(args.memoryId ? { id: args.memoryId } : { content: args.content }),
            ...(args.reason ? { reason: args.reason } : {}),
          });
          return { content: JSON.stringify({ success: true, result }), resolved: { memoryId: args.memoryId ?? null } };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "update",
        description: "Correct a stored memory. Only on explicit user request.",
        input: {
          type: "object",
          properties: {
            memoryId: { type: "string", description: "Memory ID to update" },
            content: { type: "string", description: "Exact content when ID unknown" },
            newContent: { type: "string", description: "Replacement content" },
          },
          required: ["newContent"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("update", async (input) => {
          const args = input as { memoryId?: string; content?: string; newContent: string };
          if (!args.memoryId && !args.content) throw new Error("memoryId or content is required");
          const result = await sm.memories.updateMemory({
            containerTag: config.containerTag,
            newContent: args.newContent,
            ...(args.memoryId ? { id: args.memoryId } : {}),
            ...(args.content ? { content: args.content } : {}),
          });
          return { content: JSON.stringify({ success: true, result }), resolved: { memoryId: args.memoryId ?? null } };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "list",
        description: "List recent stored documents. Use to browse before get.",
        input: {
          type: "object",
          properties: { limit: { type: "number", description: "Max documents" } },
          required: [],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("list", async (input) => {
          const args = input as { limit?: number };
          const result = await sm.documents.list({
            containerTags: [config.containerTag],
            limit: args.limit ?? config.maxMemories,
            sort: "createdAt",
            order: "desc",
          });
          return {
            content: JSON.stringify({
              success: true,
              count: result.memories.length,
              memories: result.memories.map((d) => ({
                id: d.id,
                customId: d.customId,
                title: d.title,
                summary: d.summary,
                type: d.type,
                status: d.status,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
              })),
            }),
            resolved: { limit: args.limit ?? config.maxMemories, count: result.memories.length },
          };
        }),
      });
    });
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "get",
        description: "Open one stored document by ID. Use after list or search.",
        input: {
          type: "object",
          properties: { documentId: { type: "string", description: "Document ID" } },
          required: ["documentId"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("get", async (input) => {
          const args = input as { documentId: string };
          const result = await sm.documents.get(args.documentId);
          return { content: JSON.stringify({ success: true, result }), resolved: { documentId: args.documentId } };
        }),
      });
    });
    fileLog("info", "setup complete: 7 tools registered, profile once per session + search per message");
  },
});
