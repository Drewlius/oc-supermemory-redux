# oc-supermemory-redux

Clean Supermemory plugin for OpenCode. Follows the [Supermemory docs](https://supermemory.ai/docs) directly. no legacy compatibility shims, no cross-editor config discovery, no compaction takeover, no version-check banners.

## What It Does

- **Recalls on every message** (not just the first) injects profile + memories into the model's context as a `[SUPERMEMORY]` block via the `chat.message` hook
- **Provides a `supermemory` tool** with `add`, `search`, `profile`, `list`, and `forget` modes
- **No Cross Folder Config Hunting** Uses one defined config folder + 1 additional file for credentials if preferred. all centralized in `~/.configs/opencode/`
- **Ingests conversations on session idle** sends the full session transcript to Supermemory under a stable `customId` so the dreaming pipeline can extract facts and link entities (per the [Quickstart](https://supermemory.ai/docs/quickstart) pattern)
- **Uses a single `containerTag`** one bucket, one query, no fan-out across empty legacy buckets
- **Logs via `client.app.log()`** no log files dumped in users `$HOME` directory.

## Installation

### Option A: Bundled (recommended)

1. Clone and build:
```sh
git clone <repo-url> ~/repos/oc-supermemory-redux
cd oc-supermemory-redux
bun install
bun run build
```

2. Copy the bundled file to opencode's plugins directory:
```sh
mkdir -p ~/.config/opencode/plugins
cp dist/index.js ~/.config/opencode/plugins/supermemory-redux.js
```

The bundle is self-contained (all dependencies inlined by `bun build`). No `node_modules` needed in the plugins directory. No entry in `opencode.jsonc`'s `plugin` array needed local plugins are auto-discovered from the `plugins/` directory.

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

### Option C: Copy the pre-built file supermemory-redux.js

```sh
git clone https://github.com/Drewlius/oc-supermemory-redux.git
cd oc-supermemory-redux
mkdir -p $HOME/.config/opencode/plugins
cp supermemory-redux.js $HOME/.config/opencode/plugins/supermemory-redux.js
```

## Configuration

Create `~/.config/opencode/supermemory.jsonc`:

```jsonc
{
  // API key (can also use SUPERMEMORY_API_KEY env var)
  "apiKey": "",

  // Supermemory API base URL (point at a self-hosted instance, e.g. http://localhost:8787)
  "baseUrl": "https://api.supermemory.ai",

  // Min similarity for memory retrieval (0-1)
  "similarityThreshold": 0.6,

  // Max memories injected per request (default: 3)
  "maxMemories": 3,

  // Include user profile in context
  "injectProfile": true,

  // The single container used for all reads and writes (default: "opencode")
  "containerTag": "opencode",
}

```

### Minimum recommended config
you can generate your api key [here](https://console.supermemory.ai/keys?create=false)
```jsonc
{
  "apiKey": "your_api_key",
  "containerTag": "<your-custom-tag>",
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

- **No legacy tag fan-out** the original opencode-supermemory queried 6 container tags per recall (claude, codex, cursor, opencode legacy buckets). This plugin queries one.
- **No compaction** context window management is opencode's responsibility, not the plugin's.
- **No version-check banner** no npm update notifications injected into your context.
- **No cross-editor config discovery** does not read `~/.codex/`, `~/.claude/`, `~/.cursor/`, or any other application's config directory. Only reads from `~/.config/opencode/`.
- **No log file in `$HOME`** uses `client.app.log()` for structured logging through opencode's built-in logging system.

## <div align="center">How it works

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
