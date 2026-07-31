# oc-supermemory-redux

Clean Supermemory plugin for OpenCode. Follows the [Supermemory docs](https://supermemory.ai/docs) directly — no legacy compatibility shims, no cross-editor config discovery, no compaction, no version-check banners.

## What It Does

- **Recalls on every message** (not just the first) — injects profile + memories into the model's context as a `[SUPERMEMORY]` block via the `chat.message` hook
- **Provides a `supermemory` tool** with `add`, `search`, `profile`, `list`, and `forget` modes
- **Ingests conversations on session idle** — sends the full session transcript to Supermemory under a stable `customId` so the dreaming pipeline can extract facts and link entities (per the [Quickstart](https://supermemory.ai/docs/quickstart) pattern)
- **Uses a single `containerTag`** — one bucket, one query, no fan-out across empty legacy buckets
- **Logs via `client.app.log()`** — no log files dumped in `$HOME`

## Installation

### Option A: Bundled (recommended)

1. Clone and build:
```sh
git clone <repo-url> ~/repos/oc-supermemory-redux
cd ~/repos/oc-supermemory-redux
bun install
bun run build
```

2. Copy the bundled file to opencode's plugins directory:
```sh
mkdir -p ~/.config/opencode/plugins
cp dist/index.js ~/.config/opencode/plugins/supermemory-redux.js
```

The bundle is self-contained (all dependencies inlined by `bun build`). No `node_modules` needed in the plugins directory. No entry in `opencode.jsonc`'s `plugin` array needed — local plugins are auto-discovered from the `plugins/` directory.

### Option B: Unbundled (for development)

1. Clone to `~/.config/opencode/plugins/oc-supermemory-redux/`
2. Add dependencies to `~/.config/opencode/package.json`:
```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.162",
    "supermemory": "^4.0.0"
  }
}
```
3. OpenCode runs `bun install` at startup to install these.
4. The plugin's `src/index.ts` imports from the shared `node_modules/`.

Note: Option B shares `node_modules/` with other local plugins, which can cause version conflicts if multiple plugins declare different versions of the same dependency. Option A avoids this entirely.

## Configuration

Create `~/.config/opencode/supermemory.jsonc`:

```jsonc
{
  // Optional: the single container tag used for all reads and writes
  // (default: "opencode")
  "containerTag": "DrewR",

  // Optional: API key (falls back to
  // ~/.config/opencode/supermemory-credentials.json or
  // SUPERMEMORY_API_KEY env var if not set here)
  "apiKey": "sm_...",

  // Optional: Supermemory API URL (default: https://api.supermemory.ai)
  "baseUrl": "https://api.supermemory.ai",

  // Optional: similarity cutoff for search results, 0-1 (default: 0.6)
  "similarityThreshold": 0.6,

  // Optional: max memories injected per recall (default: 3)
  "maxMemories": 3,

  // Optional: include user profile in injected context (default: true)
  "injectProfile": true,

  // Optional: entity context for dynamic manual-memory extraction (default: built-in)
  "entityContext": "User is Drew, talking to an opencode coding agent...",

  // Optional: additional keyword patterns for save detection (default: built-in list)
  "keywordPatterns": ["log\\s+this", "write\\s+down"]
}
```

### Minimum viable config

If you already have an API key in `~/.codex/supermemory/credentials.json` or as an env var:

```json
{
  "containerTag": "DrewR"
}
```

That's it. Everything else has defaults. Without `containerTag`, the plugin uses `opencode`.

### API key resolution order

1. `SUPERMEMORY_API_KEY` environment variable
2. `apiKey` field in `~/.config/opencode/supermemory.jsonc`
3. `~/.config/opencode/supermemory-credentials.json` (separate credentials file)

The first source found wins. This plugin only reads from `~/.config/opencode/` — it does NOT read from `~/.codex/`, `~/.claude/`, `~/.cursor/`, or any other application's config directory.

## Architecture

```
src/
  config.ts    — config loading, JSONC parsing, API key discovery (184 lines)
  index.ts     — hook registration, tool definition, recall injection, conversation ingest (389 lines)
```

573 lines total. The bundled `dist/index.js` is a single self-contained file (~470KB).

### What this plugin does NOT do (by design)

- **No legacy tag fan-out** — the original opencode-supermemory queried 6 container tags per recall (claude, codex, cursor, opencode legacy buckets). This plugin queries one.
- **No compaction** — context window management is opencode's responsibility, not the plugin's.
- **No version-check banner** — no npm update notifications injected into your context.
- **No cross-editor config discovery** — does not read `~/.codex/`, `~/.claude/`, `~/.cursor/`, or any other application's config directory. Only reads from `~/.config/opencode/`.
- **No log file in `$HOME`** — uses `client.app.log()` for structured logging through opencode's built-in logging system.

## How it works

### Recall (chat.message hook)

On the first user message in a session, the plugin fetches the profile once. Later messages call `/v4/search` with the current message, the configured `similarityThreshold`, and `maxMemories`. Results are formatted into a `[SUPERMEMORY]` block and injected as a synthetic part.

### Save (supermemory tool, mode: "add")

When the model calls the `supermemory` tool with `mode: "add"` and `type: "direct"`, the plugin creates a direct memory through `/v4/memories`, bypassing dreaming. `type: "document"` uses document ingestion and accepts `dreaming: "dynamic" | "instant"` (default: `"dynamic"`). The `scope` argument is metadata only; the single configured `containerTag` is the routing boundary.

### Conversation ingestion (chat.message hook)

On each user message, the plugin sends the previous assistant response and current user message as structured turns to `/v4/conversations`. A stable `conversationId` of `session_<sessionID>` keeps the deltas attached to one conversation.

## Building

```sh
bun install
bun run build
```

This runs `bun build ./src/index.ts --outdir ./dist --target node && tsc --emitDeclarationOnly`. The output is a single `dist/index.js` with all dependencies inlined.

## License

MIT
