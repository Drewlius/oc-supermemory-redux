import { Plugin } from "@opencode/plugin";
import { Supermemory } from "supermemory";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { Config } from "./config.js";

const KEYWORD_PATTERN = /\b(remember|memorize|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;

const SAVE_NUDGE = `[MEMORY TRIGGER DETECTED]
The user wants you to remember something. Use the "SuperMemory Remember Tool" to save this information.
Extract the durable facts and save it as a concise memory.
DO NOT skip this step. The user explicitly asked you to remember.`;

const ingestedMessageIds = new Set<string>();
const profiledSessions = new Set<string>();
const searchedMessageIds = new Set<string>();
const LOG_FILE = join(homedir(), ".local", "share", "opencode", "log", "superMemory-Redux_OpenCode.log");

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fileLog(
  level: "info" | "warn" | "error",
  message: string,
  extra?: unknown
): void {
  const line = `${new Date().toISOString()} ${level} ${message}${extra === undefined ? "" : " " + String(extra)}\n`;
  try {
    mkdirSync(dirname(LOG_FILE), {recursive: true}) 
    appendFileSync(LOG_FILE, line);
  } catch (error) {
    console.error("[superMemory Redux] Log write failed:", errMsg(error));
  }
}

export default Plugin.define({
  id: "oc-superMemory-Redux",
  async setup(ctx) {
    fileLog("info", `Memory integration is starting up ${ctx.location.directory}`);
    const sm = new Supermemory({
      environment: Config.SUPERMEMORY_API_KEY,
      baseUrl: Config.baseUrl,
    }); 
    const apiHeaders = {
      "Authorization": `Bearer ${Config.SUPERMEMORY_API_KEY}`,
      "Content-Type": "application/json",
    };
    
    try {
      await sm.namespaces.update(Config.nameSpace, { 
      supportingContext:  Config.supportingContext});
      fileLog("info", "supporting context sync complete");
    } catch (error) {
      fileLog("warn", errMsg(error));
    };
    
    const postSynthetic = async (
      sessionID: string,
      text: string,
    ) => {
      return await ctx.session.synthetic({
        sessionID,
        text,
        delivery: "steer",
        resume: false, 
        metadata: { source: "opencode" }
      });
    };
    
    await ctx.session.hook("prompt", async (event) => {
      const rawUserMessage = event.prompt.text?.trim();
      if (!rawUserMessage) return;
      
      const sessionID = event.sessionID
      const turnID = `${sessionID}:${(event as any).messageID ?? rawUserMessage}`;
      const searchKey = `${turnID}:search`;
      
      if (!profiledSessions.has(sessionID)) {
        try {
          const profileResponse = await sm.profile(Config.nameSpace);
          await postSynthetic(sessionID, JSON.stringify(profileResponse));
          } catch (error) { fileLog("error", errMsg(error)) 
          } finally {
            profiledSessions.add(sessionID);
          }
        } else if (!searchedMessageIds.has(searchKey)) {
            try {
              const results = await sm.search( Config.nameSpace, {
                query: rawUserMessage,
                limit: Config.maxMemories, 
                threshold: Config.similarityThreshold,
                rewriteQuery: Config.rewriteQuery,
            });
            await postSynthetic(sessionID, JSON.stringify(results)); 
            } catch (error) { fileLog("error", errMsg(error))
            } finally {
                searchedMessageIds.add(searchKey)
            }
          };

          if (KEYWORD_PATTERN.test(rawUserMessage)) {
            await postSynthetic(sessionID, SAVE_NUDGE)};
            fileLog("info", `keyword trigger attempted for session:${sessionID}`);

        const ingestKey = `${turnID}:ingest`;
        
        try {
          if (!ingestedMessageIds.has(ingestKey)) {
            const context = await ctx.session.context({ sessionID });
            const msgs: any[] = Array.isArray(context) ? context : ((context as any)?.data ?? []);
            let assistantText = "";
            
            for (const m of msgs) {
              if (m?.role === "assistant") {
                assistantText = (m.content ?? [])
                .filter((p: any) => p?.type === "text")
                .map((p: any) => String(p?.text ?? ""))
                .join("\n")
                .trim();
            }
          }
            const contents = [
              `USER: ${rawUserMessage}`,
              `ASSISTANT: ${assistantText}`
            ].filter(Boolean).join("").trim();

            await sm.add(Config.nameSpace, {
              content: contents,
              id:  sessionID,
              supportingContext: Config.supportingContext,
              metadata: {
                contains: "conversation",
                source: "opencode",
                session: sessionID,
              },
              dreaming: "dynamic"
            });

            ingestedMessageIds.add(ingestKey);
            fileLog("info", `conversation turn ingestion successful for session ${sessionID}`, {
               userChars: rawUserMessage.length,
              asstChars: assistantText.length,              
            });
          }
        } catch (error) {
          fileLog("error", `conversation turn ingestion failed for session ${sessionID}`, errMsg(error));
        }
      });

      const wrapExecute = (
        toolName: string, 
        fn: (input: any) => Promise<{ content: string; resolved?: unknown }>
      ) => async (input: any) => {
        try {
          const { content } = await fn(input);
          fileLog("info", `${toolName} success`,);
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
                },
                required: ["query"],
                additionalProperties: false,
              },
              options: { namespace: "supermemory" },
              execute: wrapExecute("search", async (input) => {
                const args = input as { 
                  query: string; 
                  limit?: number; 
                  threshold: boolean;
                };
                const effectiveLimit = args.limit ?? Config.maxMemories;
                const results = await sm.search(Config.nameSpace, {
                  query: args.query, 
                  searchMode: "hybrid",
                  threshold: Config.similarityThreshold,
                });
                
                const n = (results as any)?.results?.length ?? 0;
                
                return { 
                  content: JSON.stringify({ success: true, results }),
                  resolved: { limit: effectiveLimit,
                    threshold: Config.similarityThreshold,
                      returned: n 
                  }, 
                };
              }), 
            });

            editor.add({
              name: "add",
              description: "Save lasting facts, decisions, or setup details. Save on your own when something worth keeping appears.",
              input: {
                type: "object",
                properties: {
                  content: { type: "string", description: "Durable fact or summary to store" },
                  metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: ["string", "number", "boolean", "array"] } },
                  taskType: { type: "string", enum: ["memory", "superrag"], description: "memory (default) or superrag" },
                },
                required: ["content"],
                additionalProperties: false,
              },
              options: { namespace: "supermemory" },
              execute: wrapExecute("add", async (input) => {
                const args = input as { 
                  content: string; 
                  filepath?: string; 
                  taskType?: "memory" | "superrag"; 
                  metadata?: Record<string, string | number | boolean | string[]>;
                };

                const results = await sm.add(Config.nameSpace, {
                  content: args.content,
                  metadata: args.metadata,
                  taskType: args.taskType,
                  dreaming: "dynamic",
                  });

                return { 
                  content: JSON.stringify({ success: true, results }), 
                  resolved: { 
                    chars: args.content.length, 
                    taskType: args.taskType ?? "memory",
                    dreaming: "dynamic" 
                  }, 
                };
              }),
            });

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
                const response = await fetch(`${Config.baseUrl}/v4/memories`, {
                  method: "POST",
                  headers: apiHeaders,
                  body: JSON.stringify({
                    memories: [
                      { 
                        content: args.content, 
                        isStatic: false, 
                        metadata: { 
                          source: "opencode", 
                          ...(args.metadata ?? {}), 
                        }, 
                      },
                    ],
                    nameSpace: Config.nameSpace,
                  }),
                });

                if (!response.ok) {
                  throw new Error(`Remember failed (${response.status}): ${await response.text()}`);
              }
                return { 
                  content: JSON.stringify({ success: true, result: await response.json() }), 
                  resolved: { chars: args.content.length },
                };
              }),
            });

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
                const args = input as { memoryIds?: string[];};
                const result = await sm.memories.forget(Config.nameSpace, {
                  ids: args.memoryIds ?? [],  
                });

                return { 
                  content: JSON.stringify({ success: true, result }), 
                  resolved: { memoryIds: args.memoryIds ?? null } 
                };
              }),
            });

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
                const result = await sm.list(Config.nameSpace, "chunks", {
                  limit: args.limit ?? Config.maxMemories,
                  sort: "createdAt",
                  order: "desc",
                });
                return {
                  content: JSON.stringify({
                    success: true,
                    count: result.memories.length,
                    memories: result.memories.map((d: any) => ({
                      id: d.id,
                      customId: d.customId,
                      title: d.title,
                      summary: d.summary, 
                      type: d.type,
                      status: d.status,
                    })),
                  }),
                  resolved: { 
                    limit: args.limit ?? Config.maxMemories, 
                    count: result.memories.length 
                  },
                };
              }),
            });

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
                const result = await sm.documents.get(Config.nameSpace, args.documentId);

                return { 
                  content: JSON.stringify({ success: true, result }), 
                  resolved: { documentId: args.documentId }, 
                  };
                }
              ),
            }
          );
        } 
      );
    },
  }
);