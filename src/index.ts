import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Part } from "@opencode-ai/sdk";
import { tool } from "@opencode-ai/plugin";
import Supermemory from "supermemory";
import { loadConfig, type Config } from "./config.js";

const KEYWORD_PATTERN = /\b(remember|memorize|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;

const SAVE_NUDGE = `[MEMORY TRIGGER DETECTED]
The user wants you to remember something. Use the \`supermemory\` tool with \`mode: "add"\` to save this information.

Extract the key information and save it as a concise, searchable memory.
- Use \`scope: "user"\` for personal preferences (cross-project)
- Use \`scope: "project"\` for project-specific knowledge

DO NOT skip this step. The user explicitly asked you to remember.`;

function extractFactText(fact: unknown): string {
  if (typeof fact === "string") return fact;
  const obj = fact as Record<string, unknown>;
  if (obj?.text) return String(obj.text);
  if (obj?.content) return String(obj.content);
  if (obj?.fact) return String(obj.fact);
  return JSON.stringify(fact);
}

function formatContext(
  profile: { static?: unknown[]; dynamic?: unknown[] } | null,
  searchResults: { results?: Array<{ memory?: string; chunk?: string; similarity?: number }> } | null,
  config: Config,
): string {
  const parts: string[] = ["[SUPERMEMORY]"];

  if (config.injectProfile && profile) {
    const staticFacts = profile.static ?? [];
    const dynamicFacts = profile.dynamic ?? [];

    if (staticFacts.length > 0) {
      parts.push("\nUser Profile:");
      staticFacts.slice(0, 5).forEach((f) => parts.push(`- ${extractFactText(f)}`));
    }

    if (dynamicFacts.length > 0) {
      parts.push("\nRecent Context:");
      dynamicFacts.slice(0, 5).forEach((f) => parts.push(`- ${extractFactText(f)}`));
    }
  }

  const results = searchResults?.results ?? [];
  if (results.length > 0) {
    parts.push("\nRelevant Memories:");
    results.slice(0, config.maxMemories).forEach((r) => {
      const sim = Math.round((r.similarity ?? 0) * 100);
      const content = r.memory || r.chunk || "";
      parts.push(`- [${sim}%] ${content}`);
    });
  }

  if (parts.length === 1) return "";
  return parts.join("\n");
}

export const SupermemoryRedux: Plugin = async (ctx: PluginInput) => {
  const { client } = ctx;

  let config: Config;
  try {
    config = loadConfig();
  } catch (e) {
    await client.app.log({
      body: {
        service: "oc-supermemory-redux",
        level: "error",
        message: `Config load failed: ${e instanceof Error ? e.message : String(e)}`,
      },
    });
    return {};
  }

  const sm = new Supermemory({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  await client.app.log({
    body: {
      service: "oc-supermemory-redux",
      level: "info",
      message: "Plugin initialized",
      extra: { containerTag: config.containerTag, baseUrl: config.baseUrl },
    },
  });

  const ingestedMessageIds = new Set<string>();
  const profiledSessions = new Set<string>();

  return {
    "chat.message": async (input, output) => {
      try {
        const textParts = output.parts.filter(
          (p): p is Part & { type: "text"; text: string } => p.type === "text",
        );
        if (textParts.length === 0) return;

        const userMessage = textParts.map((p) => p.text).join("\n");
        if (!userMessage.trim()) return;

        if (KEYWORD_PATTERN.test(userMessage)) {
          output.parts.push({
            id: `prt_sm-nudge-${Date.now()}`,
            sessionID: input.sessionID,
            messageID: output.message.id,
            type: "text",
            text: SAVE_NUDGE,
            synthetic: true,
          });
        }

        let profile: { static?: unknown[]; dynamic?: unknown[] } | null = null;
        let searchResults: { results?: Array<{ memory?: string; chunk?: string; similarity?: number }> } | null = null;

        if (!profiledSessions.has(input.sessionID)) {
          const result = await sm.profile({ containerTag: config.containerTag });
          profile = result.profile ?? null;
          profiledSessions.add(input.sessionID);
        } else {
          searchResults = await sm.search({
            q: userMessage,
            containerTag: config.containerTag,
            searchMode: "memories",
            limit: config.maxMemories,
            threshold: config.similarityThreshold,
          });
        }

        const contextText = formatContext(
          profile,
          searchResults,
          config,
        );

        if (contextText) {
          output.parts.unshift({
            id: `prt_sm-context-${Date.now()}`,
            sessionID: input.sessionID,
            messageID: output.message.id,
            type: "text",
            text: contextText,
            synthetic: true,
          });
        }

        try {
          const response = await ctx.client.session.messages({
            path: { id: input.sessionID },
            query: { directory: ctx.directory },
          });
          if (response.error) {
            throw new Error(`OpenCode message retrieval failed: ${JSON.stringify(response.error)}`);
          }

          const msgs = response.data ?? [];

          if (!ingestedMessageIds.has(output.message.id)) {
            const previousAssistant = [...msgs].reverse().find((msg) => msg.info.role === "assistant");
            const assistantText = previousAssistant?.parts
              .filter((p): p is Part & { type: "text"; text: string } => p.type === "text" && !p.synthetic)
              .map((p) => p.text)
              .join("\n")
              .trim();
            const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
            if (assistantText) conversationMessages.push({ role: "assistant", content: assistantText });
            conversationMessages.push({ role: "user", content: userMessage });

            const conversationResponse = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v4/conversations`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                conversationId: `session_${input.sessionID}`,
                messages: conversationMessages,
                containerTags: [config.containerTag],
                metadata: { type: "conversation", source: "opencode" },
              }),
            });
            if (!conversationResponse.ok) {
              throw new Error(
                `Conversation ingestion failed (${conversationResponse.status}): ${await conversationResponse.text()}`,
              );
            }

            ingestedMessageIds.add(output.message.id);

            await client.app.log({
              body: {
                service: "oc-supermemory-redux",
                level: "info",
                message: "Conversation ingested on chat.message",
                extra: {
                  sessionID: input.sessionID,
                  messageCount: conversationMessages.length,
                  contentLength: JSON.stringify(conversationMessages).length,
                  containerTag: config.containerTag,
                },
              },
            });
          }
        } catch (ingestErr) {
          await client.app.log({
            body: {
              service: "oc-supermemory-redux",
              level: "warn",
              message: `Turn ingestion skipped: ${ingestErr instanceof Error ? ingestErr.message : String(ingestErr)}`,
            },
          });
        }
      } catch (e) {
        await client.app.log({
          body: {
            service: "oc-supermemory-redux",
            level: "error",
            message: `chat.message error: ${e instanceof Error ? e.message : String(e)}`,
          },
        });
      }
    },

    tool: {
      supermemory: tool({
        description:
          "Manage and query the Supermemory persistent memory system. " +
          "Use 'search' to find relevant memories, 'add' to store new knowledge, " +
          "'profile' to view user profile, 'list' to see recent memories, " +
          "'forget' to remove a memory.",
        args: {
          mode: tool.schema
            .enum(["add", "search", "profile", "list", "forget"])
            .optional(),
          content: tool.schema.string().optional(),
          query: tool.schema.string().optional(),
          scope: tool.schema.enum(["user", "project"]).optional(),
          type: tool.schema.enum(["direct", "document"]).optional(),
          dreaming: tool.schema.enum(["dynamic", "instant"]).optional(),
          memoryId: tool.schema.string().optional(),
          limit: tool.schema.number().optional(),
        },
        async execute(args: {
          mode?: string;
          content?: string;
          query?: string;
          scope?: "user" | "project";
          type?: "direct" | "document";
          dreaming?: "dynamic" | "instant";
          memoryId?: string;
          limit?: number;
        }) {
          const mode = args.mode || "help";

          try {
            switch (mode) {
              case "add": {
                if (!args.content) {
                  return JSON.stringify({
                    success: false,
                    error: "content is required for add mode",
                  });
                }

                if ((args.type ?? "direct") === "direct") {
                  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v4/memories`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${config.apiKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      memories: [{
                        content: args.content,
                        isStatic: false,
                        metadata: { type: "manual", scope: args.scope || "user", source: "opencode" },
                      }],
                      containerTag: config.containerTag,
                    }),
                  });
                  if (!response.ok) {
                    throw new Error(`Direct memory creation failed (${response.status}): ${await response.text()}`);
                  }

                  const result = await response.json() as {
                    documentId: string | null;
                    memories: Array<{ id: string }>;
                  };

                  return JSON.stringify({
                    success: true,
                    id: result.memories[0]?.id,
                    documentId: result.documentId,
                    type: "direct",
                    containerTag: config.containerTag,
                  });
                }

                const result = await sm.add({
                  content: args.content,
                  containerTag: config.containerTag,
                  customId: `manual_${Date.now()}`,
                  metadata: { type: "manual", scope: args.scope || "user", source: "opencode" },
                  entityContext: config.entityContext,
                  dreaming: args.dreaming ?? "dynamic",
                } as Record<string, unknown> & Parameters<typeof sm.add>[0]);

                return JSON.stringify({
                  success: true,
                  id: (result as { id?: string }).id,
                  status: (result as { status?: string }).status,
                  type: "document",
                  dreaming: args.dreaming ?? "dynamic",
                  containerTag: config.containerTag,
                });
              }

              case "search": {
                if (!args.query) {
                  return JSON.stringify({
                    success: false,
                    error: "query is required for search mode",
                  });
                }

                const results = await sm.search({
                  q: args.query,
                  containerTag: config.containerTag,
                  searchMode: "hybrid",
                  limit: args.limit || config.maxMemories,
                  threshold: config.similarityThreshold,
                });

                const searchResults = results as {
                  results?: Array<{
                    id?: string;
                    memory?: string;
                    chunk?: string;
                    similarity?: number;
                  }>;
                };

                return JSON.stringify({
                  success: true,
                  query: args.query,
                  count: searchResults.results?.length ?? 0,
                  results: (searchResults.results ?? []).map((r) => ({
                    id: r.id,
                    content: r.memory || r.chunk,
                    similarity: Math.round((r.similarity ?? 0) * 100),
                  })),
                });
              }

              case "profile": {
                const result = await sm.profile({
                  containerTag: config.containerTag,
                  q: args.query,
                });

                const p = result as {
                  profile?: { static?: unknown[]; dynamic?: unknown[] };
                };

                return JSON.stringify({
                  success: true,
                  profile: {
                    static: p.profile?.static ?? [],
                    dynamic: p.profile?.dynamic ?? [],
                  },
                });
              }

              case "list": {
                const result = await sm.documents.list({
                  containerTags: [config.containerTag],
                  limit: args.limit || 20,
                  includeContent: true,
                  sort: "createdAt",
                  order: "desc",
                });

                return JSON.stringify({
                  success: true,
                  count: result.memories.length,
                  memories: result.memories.map((d) => ({
                    id: d.id,
                    content: d.content?.slice(0, 200),
                    createdAt: d.createdAt,
                  })),
                });
              }

              case "forget": {
                if (!args.memoryId && !args.content) {
                  return JSON.stringify({
                    success: false,
                    error: "memoryId or exact content is required for forget mode",
                  });
                }

                let result;
                try {
                  result = await sm.memories.forget({
                    ...(args.memoryId ? { id: args.memoryId } : { content: args.content }),
                    containerTag: config.containerTag,
                  });
                } catch (error) {
                  const isNotFound = error instanceof Error && error.message.includes("404");
                  if (!args.memoryId || !args.content || !isNotFound) throw error;
                  result = await sm.memories.forget({
                    content: args.content,
                    containerTag: config.containerTag,
                  });
                }

                return JSON.stringify({
                  success: true,
                  id: result.id,
                  forgotten: result.forgotten,
                });
              }

              default:
                return JSON.stringify({
                  success: true,
                  message: "Supermemory Redux Usage Guide",
                  containerTag: config.containerTag,
                  commands: [
                    { command: "add", description: "Store a new memory", args: ["content", "scope?", "type?", "dreaming?"] },
                    { command: "search", description: "Search memories (hybrid mode)", args: ["query", "limit?"] },
                    { command: "profile", description: "View user profile", args: ["query?"] },
                    { command: "list", description: "List recent documents", args: ["limit?"] },
                    { command: "forget", description: "Remove a memory", args: ["memoryId?", "content?"] },
                  ],
                });
            }
          } catch (e) {
            return JSON.stringify({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        },
      }),
    },
  };
};
