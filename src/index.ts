import {  Plugin  } from "@opencode/plugin";
import {  Supermemory  } from "supermemory";
import {  loadConfig, type Config } from "./config.js";

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
  profile: {
    static ? : unknown[];dynamic ? : unknown[]
  } | null,
  searchResults: {
    results ? : Array < {
      memory ? : string; chunk ? : string; similarity ? : number
    } >
  } | null,
  config: Config,
): string {
  const parts: string[] = ["[SUPERMEMORY]"];

  if (config.injectProfile && profile) {
    const staticFacts = profile.static ?? [];
    const dynamicFacts = profile.dynamic ?? [];

    if (staticFacts.length > 0) {
      parts.push("\nUser Profile:");
      staticFacts.forEach((f) => parts.push(`- ${extractFactText(f)}`));
    }

    if (dynamicFacts.length > 0) {
      parts.push("\nRecent Context:");
      dynamicFacts.forEach((f) => parts.push(`- ${extractFactText(f)}`));
    }
  }


  const results = searchResults?.results ?? [];
  if (results.length > 0) {
    parts.push("\nRelevant Memories:");
    results.forEach((r) => {
      const sim = Math.round((r.similarity ?? 0) * 100);
      const content = r.memory || r.chunk || "";
      parts.push(`- [${sim}%] ${content}`);
    });
  }

  if (parts.length === 1) return "";

  return parts.join("\n");
}

export default Plugin.define({
      id: "superMemory-Redux",
      async setup(ctx) {
          let lastErrorNoticeAt = 0;
          console.log(`Loaded for ${ctx.location.directory}`)
          const notifyError = async (message: string, throttle = true) => {
            const now = Date.now();
            if (throttle && now - lastErrorNoticeAt < 30_000) return;
            lastErrorNoticeAt = now;
            console.error(`[superMemory Redux] ${message.slice(0, 500)}`);
          };
          let config: Config;
          try { config = loadConfig()
         }  catch (e) {
            const message = `Configuration failed: ${e instanceof Error ? e.message : String(e)}`;
            await notifyError(message, false);
            return
         }
          const sm = new Supermemory({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
          });

          let entityContextSynced = false;
          const syncEntityContext = async () => {
            if (entityContextSynced) return;

            const response = await fetch(
              `${config.baseUrl.replace(/\/$/, "")}/v3/container-tags/${encodeURIComponent(config.containerTag)}`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${config.apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  entityContext: config.entityContext
                }),
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
              await notifyError(message, true);
            }
          };

          console.log(`[supermemory] config loaded for ${config.containerTag}`);
          trySyncEntityContext().catch((e)   => console.error(e));

          const ingestedMessageIds = new Set < string > ();
          const profiledSessions = new Set < string > ();
          const sessionModels = new Map<string, string>();

          await ctx.session.hook("prompt", async (event) => {
            const userMessage = event.prompt.text?.trim();
            if (!userMessage) return;
            const sessionID = event.sessionID;
            const modelID = (event as any).model?.modelID ?? (event as any).model?.id;
            if (modelID) sessionModels.set(sessionID, modelID);

            if (!profiledSessions.has(sessionID)) {
              const profileRes = await sm.profile({
                containerTag: config.containerTag,
                q: userMessage,
                threshold: config.similarityThreshold,
              });
              const text = formatContext(
                profileRes.profile ?? null,
                profileRes.searchResults ? {
                  results: (profileRes.searchResults.results ?? []).map((r: any) => ({
                    memory: r.memory ?? r.chunk ?? r.content ?? (typeof r === "string" ? r : ""),
                    chunk: r.chunk ?? "",
                    similarity: r.similarity ?? r.score ?? 0,
                  }))
                } : null, config);
              if (text) event.prompt.text = `${userMessage}\n\n${text}`;
              profiledSessions.add(sessionID);
            } else {
              const results = await sm.search({
                q: userMessage,
                containerTag: config.containerTag,
                searchMode: "hybrid",
                limit: config.maxMemories,
                threshold: config.similarityThreshold,
              });
              const text = formatContext(null, {
                results: (results.results ?? []).map((r: any) => ({
                  memory: r.memory ?? r.chunk ?? r.content ?? "",
                  chunk: r.chunk ?? "",
                  similarity: r.similarity ?? r.score ?? 0,
                }))
              }, config);
              if (text) event.prompt.text = `${userMessage}\n\n${text}`;
            }
          if (KEYWORD_PATTERN.test(userMessage)) {
            event.prompt.text = `${userMessage}\n\n${SAVE_NUDGE}`;
          }
          try {
            const sessionID = event.sessionID;
            const ingestKey = `${sessionID}:${userMessage}`;
            if (!ingestedMessageIds.has(ingestKey)) {
              const context = await ctx.session.context({ sessionID });
              const msgs = (context as any).data ?? [];
              const previousAssistant = [...msgs].reverse().find((m: any) => m.type === "assistant"); // .type, not .info?.role
              const assistantText = previousAssistant?.content
              ?.filter((p: any) => p?.type === "text")
              ?.map((p: any) => p?.text)
              ?.join("\n").trim() ?? "";
              const content = [
                `user: ${userMessage}`,
                assistantText? `assistant: ${assistantText}` : "",
              ].filter(Boolean).join("\n");

              const toolModel = sessionModels.get(sessionID);
              await sm.add({
                content,
                containerTag: config.containerTag,
                customId: sessionID,
                metadata: { source: "opencode", ...(toolModel ? { model: toolModel } : {}) },
              });
              ingestedMessageIds.add(ingestKey);
              console.log(`[Supermemory] ingested ${assistantText ? "user+assistant" : "user"} for ${sessionID} (customId=${sessionID})`);
            }
          } catch (ingestErr) {
            const message = `Conversation ingestion failed: ${ingestErr instanceof Error ? ingestErr.message : String(ingestErr)}`;
            await notifyError(message, true);
        };
        await ctx.tool.transform((editor) => {
          editor.add({
            name: "search",
            description: "Search Supermemory for relevant memories. Requires query, others are optional.",
            input: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query text, Required."
                },
                limit: {
                  type: "number",
                  description: "Max memories to return"
                },
                rerank: {
                  type: "boolean",
                  description: "Rerank by relevance"
                },
                rewriteQuery: {
                  type: "boolean",
                  description: "Rewrite query for better recall, adds latency"
                },
                aggregate: {
                  type: "boolean",
                  description: "If true, aggregates information from multiple memories to create new synthesized memories."
                },
                summaries: {
                  type: "boolean",
                  description: "Include document summaries"
                }
              },
              required: ["query"],
              additionalProperties: false
            },
            options: {
              namespace: "supermemory"
            },
            execute: async (input, _tool) => {
              const args = input as {
                query: string;limit ? : number;rerank ? : boolean;rewriteQuery ? : boolean;summaries ? : boolean;aggregate ? : boolean;
              };
              const results = await sm.search({
                q: args.query,
                containerTag: config.containerTag,
                searchMode: "hybrid",
                limit: args.limit ?? config.maxMemories,
                threshold: config.similarityThreshold,
                rerank: args.rerank ?? config.rerank,
                rewriteQuery: args.rewriteQuery ?? config.rewriteQuery,
                aggregate: args.aggregate ?? config.aggregate,
                include: {
                  summaries: args.summaries ?? config.includeSummaries
                },
              });
              return {
                content: JSON.stringify({
                  success: true,
                  results
                })
              };
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
              content: {
                type: "string",
                description: "The content to extract and process into a document. This can be a URL, website, PDF, image, or video"
              },
              filepath: {
                type: "string",
                description: "Optional filepath Used by SuperMemory to store the full path of the file."
              },
              metadata: {
                type: "object",
                description: "optional metadata",
                additionalProperties: {
                  type: ["string", "number", "boolean", "array"]
                }
              },
              taskType: {
                type: "string",
                enum: ["memory", "superrag"],
                description: "Task type: memory (default) for full context layer with SuperRAG built in, superrag for managed RAG as a service."
              }
            },
            required: ["content"],
            additionalProperties: false
          },
          options: {
            namespace: "supermemory"
          },
          execute: async (input, _tool) => {
            const args = input as {
              content: string;filepath ? : string;taskType ? : "memory" | "superrag";metadata ? : Record < string,
              string | number | boolean | string[] >
            };
            const results = await sm.add({
              containerTag: config.containerTag,
              content: args.content,
              filepath: args.filepath,
              metadata: args.metadata,
            });
            return {
              content: JSON.stringify({
                success: true,
                results
              })
            };
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
                content: {
                  type: "string",
                  description: "Exact memory text to store"
                },
                metadata: {
                  type: "object",
                  description: "Optional metadata",
                  additionalProperties: {
                    type: "string"
                  }
                }
              },
              required: ["content"],
              additionalProperties: false
            },
            options: {
              namespace: "supermemory"
            },
            execute: async (input, _tool) => {
              const args = input as {
                content: string;static ? : boolean;metadata ? : Record < string,
                string | number | boolean | string[] >
              };
              const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v4/memories`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${config.apiKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  memories: [{
                    content: args.content,
                    isStatic: false,
                    metadata: {
                      source: "opencode",
                      ...(args.metadata ?? {})
                    }
                  }],
                  containerTag: config.containerTag
                })
              });
              if (!response.ok) throw new Error(`Remember failed (${response.status}): ${await response.text()}`);
              const result = await response.json();
              return {
                content: JSON.stringify({
                  success: true,
                  result
                })
              };
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
                memoryId: {
                  type: "string",
                  description: "Memory ID to forget"
                },
                content: {
                  type: "string",
                  description: "Exact content to forget when ID unknown"
                },
                reason: {
                  type: "string",
                  description: "Reason for forgetting"
                }
              },
              required: [],
                additionalProperties: false
              },
              options: {
                namespace: "supermemory"
              },
              execute: async (input, _tool) => {
                const args = input as {
                  memoryId ? : string;
                  content ? : string;
                  reason ? : string
                };
                if (!args.memoryId && !args.content) throw new Error("memoryId or content is required");
                const result = await sm.memories.forget({
                  containerTag: config.containerTag,
                  ...(args.memoryId ? {
                    id: args.memoryId
                  } : {
                    content: args.content
                  }),
                  ...(args.reason ? {
                    reason: args.reason
                  } : {})
                });
                return {
                  content: JSON.stringify({
                    success: true,
                    result
                  })
                };
              },
            });
          });
          await ctx.tool.transform((editor) => {
            editor.add({
              name: "update",
              description: "Update a memory by creating a new version. Requires newContent plus memoryId or content.",
              input: {
                type: "object",
                properties: {
                  memoryId: {
                    type: "string",
                    description: "Memory ID to update"
                  },
                  content: {
                    type: "string",
                    description: "Exact content to match when ID unknown"
                  },
                  newContent: {
                    type: "string",
                    description: "Replacement content"
                  }
                },
                required: ["newContent"],
                additionalProperties: false
              },
              options: {
                namespace: "supermemory"
              },
              execute: async (input, _tool) => {
                const args = input as {
                  memoryId ? : string;
                  content ? : string;
                  newContent: string
                };
                const result = await sm.memories.updateMemory({
                  containerTag: config.containerTag,
                  newContent: args.newContent,
                  ...(args.memoryId ? {
                    id: args.memoryId
                  } : {}),
                  ...(args.content ? {
                    content: args.content
                  } : {})
                });
                return {
                  content: JSON.stringify({
                    success: true,
                    result
                  })
                };
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
                  limit: {
                    type: "number",
                    description: "Max documents to return"
                  }
                },
                required: false,
                additionalProperties: false
              },
              options: {
                namespace: "supermemory"
              },
              execute: async (input, _tool) => {
                const args = input as {
                  limit ? : number
                };
                const result = await sm.documents.list({
                  containerTags: [config.containerTag],
                  limit: args.limit ?? 10,
                  sort: "createdAt",
                  order: "desc"
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
                      updatedAt: d.updatedAt
                    }))
                  })
                };
              }
            });
          });
          await ctx.tool.transform((editor) => {
              editor.add({
                    name: "get",
                    description: "Advanced browsing. Retrieve a full document by ID. Requires documentId.",
                    input: {
                      type: "object",
                      properties: {
                        documentId: {
                          type: "string",
                          description: "Document ID to retrieve"
                        }
                      },
                      required: "documentId",
                      additionalProperties: false
                    },
                    options: {
                      namespace: "supermemory"
                    },
                    execute: async(input) => {
                        const args = input as {
                          documentId: string
                        };
                        const result = await sm.documents.get(args.documentId);
                        return {
                          content: JSON.stringify({
                            success: true,
                            result
                        }
                      )
                    };
                  }
                }
              );
            }
          );
        }
      )
    }
  }
)