import { Plugin } from "@opencode/plugin";
import { Supermemory } from "supermemory";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { Config } from "./config.js";

const KEYWORD_PATTERN = /\b(remember|mind|think|convient|guranteed|promise|memorize|noted|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;
const SAVE_NUDGE = `[NUDGE TO REMEMBER] If there is someting worth remembering do it now with the supermemory.add tool you do not need permission to complete this action.`
const ingestedMessageIds = new Set<string>();
const profiledSessions = new Set<string>();
const searchedMessageIds = new Set<string>();
const LOG_FILE = join(homedir(), ".local", "share", "opencode", "log", "oc-supermemory-redux.log");

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
};

function fileLog(
  level: "info" | "warn" | "error",
  message: string,
  extra = ""
): void {
  const line = `${new Date().toISOString()} ${level} ${message} ${extra}\n`;
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
    appendFileSync(LOG_FILE, line);
  } catch (error) {
    console.error("[oc-supermemory-redux] Log write failed:", errMsg(error));
  }
};

export default Plugin.define({
  id: "oc-superMemory-Redux",
  async setup(ctx) {
    fileLog("info", `Memory integration is starting up ${ctx.location.directory}`);
    const sm = new Supermemory({
      apiKey: Config.SUPERMEMORY_API_KEY,
      baseUrl: Config.baseUrl,
      timeoutInSeconds: 8,
      maxRetries: 1,
    });
    try {
      await sm.namespaces.update(Config.nameSpace, {
        supportingContext: Config.supportingContext
        }
      )
      fileLog("info", "supportingContext sync. completed")
    } catch (error) {
      fileLog("warn", "unable to sync supportingContext with profile", errMsg(error)
      )
    };

    const postSynthetic = async (
      sessionID: string,
      text: string,
    ) => {
      return await ctx.session.synthetic({
        sessionID,
        text,
        description: "[CONTEXT INJECTION, ALWAYS VERIFY]",
        delivery: "steer",
        resume: true,
        metadata: {
          source: "SuperMemory v5+",
          Fact: "No Gurantee",
          Memories: "Best Attempt At Accuracy",
          Harness: "OpenCode v2+",
          Advice: "supermemory.forget bad memories as you see them."
          }
        }
      );
    };

    await ctx.session.hook("prompt", async (event) => {
      const rawUserMessage = event.prompt.text?.trim();
      const sessionID = event.sessionID;
      const turnID = `${sessionID}:${(event as any).messageID ?? rawUserMessage}`;
      const searchKey = `${turnID}:search`;
      const ingestKey = `${turnID}:ingest`;
      if (!rawUserMessage) return;
      try {
        if (KEYWORD_PATTERN.test(rawUserMessage)) {
          await postSynthetic(sessionID, SAVE_NUDGE)
          fileLog("info", `memory trigger attempted for session:${sessionID}`)
        }
      } catch (error) {
        fileLog("info", `Memory trigger failed with prompt:${rawUserMessage}`, errMsg(error))
      };
      if (!profiledSessions.has(sessionID) && Config.injectProfile) {
        try {
          const profileResponse: any = await sm.profile(Config.nameSpace);
          const p = profileResponse?.profile;
          if (p) {
            p.static?.splice?.(15);
            p.dynamic?.splice?.(35);
            if (p.buckets) for (const k in p.buckets) p.buckets[k]?.splice?.(5);
          }
          await postSynthetic(sessionID, JSON.stringify(profileResponse))
          await sm.add(Config.nameSpace, {
              id: sessionID,
              content: `USER: ${rawUserMessage}`, 
              supportingContext: Config.supportingContext, 
              taskType: "memory", 
              date: new Date().toISOString(), 
              metadata: {
                contains: "conversation",
                source: "opencode",
                session: sessionID
              }
            }
          )
          fileLog("info", `Profile injection successful for session:${sessionID}`);
        } catch (error) {
            fileLog("error", `profiile injection failed for session:${sessionID}`, errMsg(error));
        }
        profiledSessions.add(sessionID);
      } else if (!searchedMessageIds.has(searchKey)) {
          try {
            const searchResults = await sm.search(Config.nameSpace, {
              query: rawUserMessage,
              limit: Config.maxMemories,
              threshold: Config.similarityThreshold,
              rewriteQuery: Config.rewriteQuery,
              rerank: `aggregate`,
              include: {documents: false, related: true, forgotten: false},
              searchMode: `memories`
              }
            )
            await postSynthetic(sessionID, JSON.stringify(searchResults))
              fileLog("info", `Supermemory search successful for turn:${turnID}`)
          } catch (error) {
              fileLog("error", `Supermemory prompt-query failed for turn:${turnID}`, errMsg(error))
          }
          searchedMessageIds.add(searchKey)
        };

      if (!ingestedMessageIds.has(ingestKey)) {
        try {
          const context = await ctx.session.context({ sessionID });
          const msgs: any[] = Array.isArray(context) ? context : ((context as any)?.data ?? []);
          let assistantText = ""
          for (const m of msgs) {
            if (m?.type === "assistant") {
              assistantText = (m.content ?? [])
              .filter((p: any) => p?.type === "text")
              .map((p: any) => String(p?.text ?? ""))
              .join("")
              .trim()
            }
          }
          const contents = [
          `ASSISTANT: ${assistantText}`,
          `USER: ${rawUserMessage}` 
          ].join("\n").trim()

          await sm.add(Config.nameSpace, {
            id: sessionID,
            content: contents,
            supportingContext: Config.supportingContext,
            taskType: "memory",
            date: new Date().toISOString(),
            metadata: {
              contains: "conversation",
              source: "opencode",
              session: sessionID
              }
            }
          )
          fileLog("info", `turn ingestion successful session:${sessionID}`,
            JSON.stringify({
              asstChars: assistantText.length,
              userChars: rawUserMessage.length
              }
            )
          )
        } catch (error) {
          fileLog("error", `turn ingestion failed for session:${sessionID}`, errMsg(error));
          }
        ingestedMessageIds.add(ingestKey);
        };
      }
    );

    const wrapExecute = (
      toolName: string,
      fn: (input: any) => Promise<unknown>
    ) => async (input: any) => {
      try {
        const result = await fn(input);
        fileLog("info", `${toolName} success`,);
        return { content: JSON.stringify({ invokedTool: toolName, result }) };
      } catch (error) {
        fileLog("error", `${toolName} failed`, errMsg(error));
        return { content: JSON.stringify({ invokedTool: toolName, error: errMsg(error) }) };
      }
    };
    await ctx.tool.transform((editor) =>  {
      editor.add({
        name: "search",
        description: "Find relevant past memories for the current task. Check on your own without needing to be prompted.",
        input: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query text" },
            limit: { type: "number", description: "Max memories to return" },
            threshold: { type: "number", description: "Similarty 0.01 - 1"},
            rerank: { type: "string", enum: ["none", "order", "aggregate"], description: "Post retrieval ranking; order: improves result ordering; aggregate: combines overlapping context into cleaner answers, helpful to ensure highest relevant results"},
            rewriteQuery: { type: "boolean", description: "Expand and clarify the query gbefore retrieavl to improve recall for conversational or underspecified prompts. This incresases latency by 400ms."},
            include: { type: "object", properties: {documents: { type: "boolean"}, related: { type: "boolean"}, forgotten: { type: "boolean"}}, description: "optional booleans to broaden the search"},
            searchMode: { type: "string", enum: ["hybrid", "memories", "chunks"], description: "Search surface. hybrid combines learned memories with source chunks. memories returns learned context. chunks returns source passages"}
          },
          required: ["query", ""],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("search", async (input) => {
          const args = input as {
            query: string,
            limit?: number,
            threshold?: number;
            rerank?: "none" | "order" | "aggregate";
            rewriteQuery?: boolean;
            include?: object;
            searchMode?: "hybrid" | "memories" | "chunks";
          };
          const results = await sm.search(Config.nameSpace, {
            query: args.query,
            limit: args.limit ?? Config.maxMemories,
            threshold: args.threshold ?? Config.similarityThreshold,
            rerank: args.rerank ?? "aggregate",
            rewriteQuery: args.rewriteQuery ?? true,
            include: args.include ?? { documents: false, related: true, forgotten: false },
            searchMode: args.searchMode ?? "memories",
          });
          return results;
        }),
      });

      editor.add({
        name: "add",
        description: "Save relevant memories, decisions, or important details. Save on your own without being prompted.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "The content to process. This may be plaintext or a URL to suppported rich content" },
            id: { type: "string", description: "optional caller defined documentID for direct retrieval or updating the document later"},
            supportingContext: { type: "string", description: "Context used to guide memory extraction. Max 1500 characters. Constant until next updated again."},
            taskType: { type: "string", enum: ["memory", "superrag"], description: "Processing pipeline. memory builds durable learned context; superrag optimizes the document for retrieval without generating memories"},
            date: { type: "string", description: "When the source content is from, in ISO 8601 format"},
            metadata: { type: "object", description: "arbitrary metadata in JSON format"},
          },
          required: ["content","supportingContext"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("add", async (input) => {
          const args = input as {
            content: string;
            id?: string;
            supportingContext: string;
            date?: string
            taskType?: "memory" | "superrag";
            metadata?: Record<string, string | number | boolean | string[]>;
            dreaming?: string
            };
          const results = await sm.add(Config.nameSpace,  {
            content: args.content,
            id: args.id ?? crypto.randomUUID().toString(),
            supportingContext: args.supportingContext,
            taskType: args.taskType ?? "memory",
            date: new Date().toISOString(),
            metadata: args.metadata ?? {source: "Opencode Agent Generated Memory"},
            dreaming: "dynamic"
          });
          return results;
        }),
      });
      editor.add({
        name: "forget",
        description: "Delete stored memories by memory id (the id on a search result). Not a document id.",
        input: {
          type: "object",
          properties: {
            ids: { type: "array", items: { type: "string" }, description: "Memory ID to forget" }
          },
          required: ["ids"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("forget", async (input) => {
          const args = input as { ids: string[] };
          const results = await sm.memories.forget(Config.nameSpace, {
            ids: args.ids
          });
          return results;
        }),
      });
      editor.add({
        name: "list",
        description: "List recent stored documents. Use to browse before get.",
        input: {
          type: "object",
          properties: { limit: { type: "number", description: "Max documents to return" } },
          required: [],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("list", async (input) => {
          const args = input as { limit?: number };
          const results = await sm.list(Config.nameSpace, "documents", {
            limit: args.limit ?? Config.maxMemories,
            sort: "createdAt",
            order: "desc",
          });
          return results;
        }),
      });
      editor.add({
        name: "get",
        description: "Open one stored document by documentId (from list or add). Not a memory id.",
        input: {
          type: "object",
          properties: { documentId: { type: "string", description: "Document ID" } },
          required: ["documentId"],
          additionalProperties: false,
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("get", async (input) => {
          const args = input as { documentId: string };
          const results = await sm.documents.get(Config.nameSpace, args.documentId
          );
          return results
          }),
        });
      });
    }
  }
);