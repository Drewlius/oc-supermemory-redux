import { Plugin, tool } from "@opencode-ai/plugin";
import Supermemory from "supermemory";
import { loadConfig, type Config } from "./config.js";

const KEYWORD_PATTERN = /\b(remember|memorize|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;

const SAVE_NUDGE = `[MEMORY TRIGGER DETECTED]
The user wants you to remember something. Use the \`supermemory\` tool with \`mode: "add"\` to save this information.

Extract the key information and save it as a concise, searchable memory.

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

export default Plugin.define({
    id: "oc-supermemory-redux",
  async setup(ctx) {
    let lastErrorNoticeAt = 0;
    console.log(`Loaded for ${ctx.location.directory}`)

  const notifyError = async (message: string, throttle = true) => {
    const now = Date.now();
    if (throttle && now - lastErrorNoticeAt < 30_000) return;
    lastErrorNoticeAt = now;

    const visibleMessage = message.length > 500 ? `${message.slice(0, 497)}...` : message;
    try {
      await client.tui.showToast({
        body: {
          title: "Supermemory Redux",
          message: visibleMessage,
          variant: "error",
          duration: 10_000,
        },
        query: { directory: ctx.directory },
      });
    };
    catch {}
  };

  let config: Config;
  try {
    config = loadConfig();
  } catch (e) {
    const message = `Configuration failed: ${e instanceof Error ? e.message : String(e)}`;
    await notifyError(message, false);
    await client.app.log({
      body: {
        service: "oc-supermemory-redux",
        level: "error",
        message,
      },
    });
  },
  return;

  const sm = new Supermemory({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  let entityContextSynced = false;
  const syncEntityContext = async () => {
    if (entityContextSynced) return;

    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, "")}/v3/container-tags/${encodeURIComponent(config.containerTag)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entityContext: config.entityContext }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (response.status === 404) return;
    if (!response.ok) {
      throw new Error(`Entity context synchronization failed (${response.status}): ${await response.text()}`);
    }
    entityContextSynced = true;
  };

  const trySyncEntityContext = async () => {
    try {
      await syncEntityContext();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await notifyError(message);
      await client.app.log({
        body: {
          service: "oc-supermemory-redux",
          level: "error",
          message,
        },
      });
    }
  };

  await client.app.log({
    body: {
      service: "oc-supermemory-redux",
      level: "info",
      message: "Plugin initialized",
      extra: { containerTag: config.containerTag, baseUrl: config.baseUrl },
    },
  });
  void trySyncEntityContext();

  const ingestedMessageIds = new Set<string>();
  const profiledSessions = new Set<string>();
  const sessionModels = new Map<string, string>();

  await ctx.session.hook("prompt", async (event) => {
    const userMessage = event.prompt.text?.trim();
    if (!userMessage) return;

    const sessionID = (event as { sessionID: string }).sessionID;

    if (!profiledSessions.has(sessionID)) {
      const results = await sm.profile ({ containerTag: config.containerTag, q: userMessage, threshold: config.similarityThreshold });
      const text = formatContext(result.profile ?? null, result.searchResults ?? null, config);
      if (text) event.prompt.text = `${userMessage}\n\n${text}`;
      profiledSessions.add(SessionsID);
      } else {
      const results = await sm.search({ q: userMessage, containerTag: config.containerTag, searchMode: "hybrid", limit: config.maxMemories, threshold: config.similarityThreshold});
      const text = formatContext(null, results as never, config);
      if (text) event.prompt.text = ${userMessage}\n\n${text}`;


        (p): p is Part & { type: "text"; text: string } => p.type === "text",
      );
      if (textParts.length === 0) return;

      const userMessage = textParts.map((p) => p.text).join("\n");
      if (!userMessage.trim()) return;

      if (input.model?.modelID) SessionModels.set(input.sessionID
        , input.model.modelID);

      if (KEYWORD_PATTERN.test(userMessage)) {
        output.parts.push({
          id: `prt_sm-nudge-${Date.now()}`,
          sessionID
          : input.sessionID
          ,
          messageID: output.message.id,
          type: "text",
          text: SAVE_NUDGE,
          synthetic: true,
        });
      }

      try {
        let profile: { static?: unknown[]; dynamic?: unknown[] } | null = null;
        let searchResults: { results?: Array<{ memory?: string; chunk?: string; similarity?: number }> } | null = null;

        if (!profiledSessions.has(input.sessionID
          )) {
          const result = await sm.profile({
            containerTag: config.containerTag,
            q: userMessage,
            threshold: config.similarityThreshold,
          });
          profile = result.profile ?? null;
          searchResults = (result.searchResults as {
            results?: Array<{ memory?: string; chunk?: string; similarity?: number }>;
          } | undefined) ?? null;
          profiledSessions.add(input.sessionID
            );
        } else {
          searchResults = await sm.search({
            q: userMessage,
            containerTag: config.containerTag,
            searchMode: "hybrid",
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
            sessionID
            : input.sessionID
            ,
            messageID: output.message.id,
            type: "text",
            text: contextText,
            synthetic: true,
          });
        }
      } catch (e) {
        const message = `Memory recall failed: ${e instanceof Error ? e.message : String(e)}`;
        await notifyError(message);
        await client.app.log({
          body: {
            service: "oc-supermemory-redux",
            level: "error",
            message,
          },
        });
      }

      try {
          const response = await ctx.client.session.messages({
            path: { id: input.sessionID
              },
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
            const turnModel = (previousAssistant?.info as { modelID?: string } | undefined)?.modelID;
            const assistantContent = assistantText
              ? turnModel
                ? `[model: ${turnModel}]\n${assistantText}`
                : assistantText
              : undefined;
            const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
            if (assistantContent) conversationMessages.push({ role: "assistant", content: assistantContent });
            conversationMessages.push({ role: "user", content: userMessage });

            const conversationResponse = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v4/conversations`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                conversationId: `session_${input.sessionID
                  }`,
                messages: conversationMessages,
                containerTags: [config.containerTag],
                metadata: {
                  source: "opencode",
                  model: input.model?.modelID,
                },
              }),
              signal: AbortSignal.timeout(10_000),
            });
            if (!conversationResponse.ok) {
              throw new Error(
                `Conversation ingestion failed $({conversationResponse.status}): ${await conversationResponse.text()}`,
              );
            }
            await trySyncEntityContext();

            ingestedMessageIds.add(output.message.id);

            await client.app.log({
              body: {
                service: "oc-supermemory-redux",
                level: "info",
                message: "Conversation ingested on chat.message",
                extra: {
                  sessionID
                  : input.sessionID
                  ,
                  messageCount: conversationMessages.length,
                  contentLength: JSON.stringify(conversationMessages).length,
                  containerTag: config.containerTag,
                },
              },
            });
          }
      } catch (ingestErr) {
        const message = `Conversation ingestion failed: ${ingestErr instanceof Error ? ingestErr.message : String(ingestErr)}`;
        await notifyError(message);
        await client.app.log({
          body: {
            service: "oc-supermemory-redux",
            level: "warn",
            message,
          },
        });
      }
    },

    await ctx.tool.transform((editor) => {
        editor.add({
            name: "supermemory",
            description: "Manage and query the Supermemory persistent memory system. " +
                "'update' to correct an existing memory, " +
                "'list' to see recent documents, " +
                "'get' to retrieve a complete document, and " +
                "'forget' to remove a memory.",
            input: {
                type: "object",
                properties: {
                    mode: { type: "string", enum: ["add", "update", "search", "profile", "list", "get", "forget"] },
                    content: { type: "string" },
                    newContent: { type: "string" },
                    query: { type: "string" },
                    memoryId: { type: "string" },
                    documentId: { type: "string" },
                    limit: { type: "number" },
                    reason: { type: "string" },
                },
                required: [],
                additionalProperties: false
            };
          const toolModel = sessionModels.get(context.sessionID
            );

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "search",
        description: "Search Supermemory for relevant memories. Requires query, others are optional.",
        input: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query text" },
            limit: { type: "number", description: "Max memories to return" },
            rerank: { type: "boolean", description: "Rerank by relevance" },
            rewriteQuery: { type: "boolean", description: "Rewrite query for better recall, adds latency" },
            aggregate: { type: "boolean", description: "If true, aggregates information from multiple memories to create new synthesized memories." },
            summaries: { type: "boolean", description: "Include document summaries" }
          },
          required: ["query"],
          additionalProperties: false
        },
        options: {
          namespace: "supermemory"
        },
        execute: async (input, tool) => {
          const args = input as { query: string; limit?: number; rerank?: boolean; rewriteQuery?: boolean; summaries?: boolean; aggregate?: boolean; };
          const results = await sm.search({
            q: args.query,
            containerTag: config.containerTag,
            searchMode: "hybrid",
            limit: args.limit ?? config.maxMemories,
            threshold: config.similarityThreshold,
            rerank: args.rerank ?? config.rerank,
            rewriteQuery: args.rewriteQuery ?? config.rewriteQuery,
            aggregate: args.aggregate ?? config.aggregate,
            include: { summaries: args.summaries ?? config.includeSummaries },
          });
          return { content: JSON.stringify({ success: true, results }) };
          },
        });
      });

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "add",
        description: "Ingest content into memory supports Text string, file path, or URL",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "The content to extract and process into a document. This can be a URL, website, PDF, image, or video" },
            filepath: { type: "string", description: "Optional filepath Used by SuperMemory to store the full path of the file." },
            metadata: { type: "object", description: "optional metadata", additionalProperties: { type: ["string", "number", "boolean", "array"] } },
            taskType: { type: "string", enum: ["memory", "superrag"], description: "Task type: memory (default) for full context layer with SuperRAG built in, superrag for managed RAG as a service." },
          },
          required: ["content"],
          additionalProperties: false
        },
        options: {
          namespace: "supermemory"
        },
        execute: async (input, tool) => {
          const args = input as { content: string; filepath?: string; taskType?: "memory" | "superrag"; metadata?: Record<string, string | number | boolean | string[]> };
          const results = await sm.add({
            containerTag: config.containerTag,
            content: args.content,
            filepath: args.filepath,
            metadata: args.metadata,
            taskType: args.taskType ?? config.taskType,
          });
          return { content: JSON.stringify({ success: true, results }) };
          },
        });
      });

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "remember",
        description: "Store an exact memory directly. Requires content. Use for explicit facts, not document ingestion.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "Exact memory text to store" },
            metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: "string" } }
          },
          required: ["content"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: async (input, tool) => {
          const args = input as { content: string; static?: boolean; metadata?: Record<string, string | number | boolean | string[]> };
          const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v4/memories`, {
            method: "POST",
            headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              memories: [{ content: args.content, isStatic: false, metadata: { source: "opencode", ...(args.metadata ?? {}) } }],
              containerTag: config.containerTag
            })
          });
          if (!response.ok) throw new Error(`Remember failed (${response.status}): ${await response.text()}`);
          const result = await response.json();
          return { content: JSON.stringify({ success: true, result }) };
        }
      });
    });

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "forget",
        description: "Forget a memory. Requires memoryId or exact content. Optional reason.",
        input: {
          type: "object",
          properties: {
            memoryId: { type: "string", description: "Memory ID to forget" },
            content: { type: "string", description: "Exact content to forget when ID unknown" },
            reason: { type: "string", description: "Reason for forgetting" }
          },
          required: [],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: async (input, tool) => {
          const args = input as { memoryId?: string; content?: string; reason?: string };
          if (!args.memoryId && !args.content) throw new Error("memoryId or content is required");
          const result = await sm.memories.forget({
            containerTag: config.containerTag,
            ...(args.memoryId ? { id: args.memoryId } : { content: args.content }),
            ...(args.reason ? { reason: args.reason } : {})
          });
          return { content: JSON.stringify({ success: true, result }) };
        }
      });
    });

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "update",
        description: "Update a memory by creating a new version. Requires newContent plus memoryId or content.",
        input: {
          type: "object",
          properties: {
            memoryId: { type: "string", description: "Memory ID to update" },
            content: { type: "string", description: "Exact content to match when ID unknown" },
            newContent: { type: "string", description: "Replacement content" }
          },
          required: ["newContent"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: async (input, tool) => {
          const args = input as { memoryId?: string; content?: string; newContent: string };
          const result = await sm.memories.updateMemory({
            containerTag: config.containerTag,
            newContent: args.newContent,
            ...(args.memoryId ? { id: args.memoryId } : {}),
            ...(args.content ? { content: args.content } : {})
          });
          return { content: JSON.stringify({ success: true, result }) };
        }
      });
    });

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "list",
        description: "Advanced browsing. List recent documents. Optional limit.",
        input: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max documents to return" }
          },
          required: [],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: async (input, tool) => {
          const args = input as { limit?: number };
          const result = await sm.documents.list({
            containerTags: [config.containerTag],
            limit: args.limit ?? 10,
            sort: "createdAt",
            order: "desc"
          });
          return { content: JSON.stringify({ success: true, count: result.memories.length, memories: result.memories.map((d) => ({ id: d.id, customId: d.customId, title: d.title, summary: d.summary, type: d.type, status: d.status, createdAt: d.createdAt, updatedAt: d.updatedAt })) }) };

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "get",
        description: "Advanced browsing. Retrieve a full document by ID. Requires documentId.",
        input: {
          type: "object",
          properties: {
            documentId: { type: "string", description: "Document ID to retrieve" }
          },
          required: ["documentId"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: async (input, tool) => {
          const args = input as { documentId: string };
          const result = await sm.documents.get(args.documentId);
          return { content: JSON.stringify({ success: true, result }) };
        }
      });
    });









            ...(toolModel ? { model: toolModel } : {}),
          },
        },
      ],
        containerTag: config.containerTag,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Direct memory creation failed (${response.status}): ${await response.text()}`);
    }
    await trySyncEntityContext();






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
                    ...(args.reason ? { reason: args.reason } : {}),
                  });
                } catch (error) {
                  const isNotFound = error instanceof Error && error.message.includes("404");
                  if (!args.memoryId || !args.content || !isNotFound) throw error;
                  result = await sm.memories.forget({
                    content: args.content,
                    containerTag: config.containerTag,
                    ...(args.reason ? { reason: args.reason } : {}),
                  });
                }


              default:
                return JSON.stringify({
                  success: true,
                  message: "Supermemory Redux Usage Guide",
                  containerTag: config.containerTag,
                  commands: [
                    { command: "add", description: "Store a new memory", args: ["content"] },
                    { command: "update", description: "Correct an existing memory", args: ["memoryId", "newContent"] },
                    { command: "search", description: "Search memories (hybrid mode)", args: ["query", "limit?"] },
                    { command: "profile", description: "View user profile", args: ["query?"] },
                    { command: "list", description: "List recent documents", args: ["limit?"] },
                    { command: "get", description: "Retrieve a complete document", args: ["documentId"] },
                    { command: "forget", description: "Remove a memory", args: ["memoryId?", "content?", "reason?"] },
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