# oc-supermemory-redux

A focused [Supermemory](https://supermemory.ai/docs) plugin for OpenCode. It follows the current API contracts without legacy cross-editor tag discovery, custom compaction handling, or version-check banners.

## Features

- Fetches the configured container's profile on the first message of a session and includes search results for that message.
- Searches for relevant memories on every later message.
- Incrementally sends structured user and assistant turns to `/v4/conversations` under a stable conversation ID.
- Uses one configurable `containerTag` for all reads and writes.
- Creates direct memories through `/v4/memories` rather than document ingestion.
- Provides `add`, `update`, `search`, `profile`, `list`, `get`, and `forget` tool modes.
- Lists document metadata first and retrieves complete document content only when requested.
- Synchronizes the configured `entityContext` with the container's settings.
- Displays OpenCode toast notifications for invalid configuration and backend failures.
- Keeps recall and conversation ingestion independent so one failing path does not block the other.

## Installation

OpenCode loads local plugins from its `plugins` configuration directory. The default directory is `~/.config/opencode/plugins/`

### Prebuilt Plugin

The repository includes a self-contained `oc-supermemory-redux.js` bundle, so Bun is not required.

```sh
mkdir -p "~/.config/opencode/plugins"
curl -fsSL \
  https://raw.githubusercontent.com/Drewlius/oc-supermemory-redux/main/oc-supermemory-redux.js \
  -o "~/.config/opencode/plugins/oc-supermemory-redux.js"
```

Create the [configuration file](#configuration) at:

```text
~/.config/opencode/supermemory.jsonc
```

No entry in `opencode.jsonc` is required. OpenCode automatically discovers JavaScript files in the local `plugins` directory.

### Build From Source

```sh
git clone https://github.com/Drewlius/oc-supermemory-redux_OpenCode.git
cd oc-supermemory-redux_OpenCode
bun install --frozen-lockfile
bun run typecheck
bun run build
mkdir -p "~/.config/opencode/plugins"
cp ./dist/index.js "~/.config/opencode/plugins/oc-supermemory-redux.js"
```

Then create the [configuration file](#configuration) at `~/.config/opencode/supermemory.jsonc`, or directly inside `OPENCODE_CONFIG_DIR` when that override is set.

Restart OpenCode after installing or updating the plugin.

## Configuration

Create `supermemory.jsonc` in your OpenCode configuration directory:

```jsonc
{
  // Omit this when using SUPERMEMORY_API_KEY or the credentials file.
  "apiKey": "sm_...",

  // One container for all plugin reads and writes.
  "containerTag": "opencode",

  // Optional settings shown with their defaults.
  "baseUrl": "https://api.supermemory.ai",
  "similarityThreshold": 0.6,
  "maxMemories": 3,
  "injectProfile": true
}
```

The optional `entityContext` setting accepts a string up to 1,500 characters. If omitted, the plugin uses its built-in coding-agent context and synchronizes it with the configured container.

### API Key Resolution

The first available API key is used:

1. `SUPERMEMORY_API_KEY` environment variable
2. `SUPERMEMORY_API_KEY` in `supermemory.jsonc`
3. `SUPERMEMORY_API_KEY` in `supermemory-credentials.json`

Both configuration files belong in the OpenCode configuration directory. The plugin does not inspect configuration belonging to Claude, Codex, Cursor, or other applications.

Invalid JSON, missing credentials, unsupported values, and unreachable back-end services produce console errors in OpenCode.log. Configuration validation includes:

- `baseUrl`: "https://supermemory.ai" -  valid HTTP or HTTPS URL - ( local server defaults to "http://localhost:6767" )
- `SUPERMEMORY_API_KEY`: "<sm_your-key> 
- `nameSpace`: string - 1-100 characters supported
- `similarityThreshold`: number - from 0 to 1
- `maxMemories`: integer - from 1 to 100
- `injectProfile`: boolean - true or false
- `supportingContext`: string - maximum 1,500 characters
- `rewriteQuery`: boolean

## <div align="center"> How It Works
---

### Recall

On the first user message for a session, the plugin calls `profile` The response provides the static and dynamic profile and does not fire again unless you reload the session, restart OpenCode, or start a new session.

Later messages call `search` in memories mode using the configured threshold and result limit. Retrieved context is injected as a synthetic prompt and is invisible in user space.

### Conversation Ingestion

On each user message, the plugin sends the previous assistant response and current user message as structured turns via `add` with a stable `id` and `dreaming: "dynamic"`. The stable `id` uses `session_<sessionID>`, allowing Supermemory to associate incremental document updates with one conversation.

Recall and ingestion use separate failure paths. A failed profile or search request does not prevent conversation ingestion from being attempted.

### Agents Memory Tools

- `add`: Creates a direct, non-static memory through `/v4/memories`.
- `search`: Searches Supermemory using hybrid mode.
- `profile`: Retrieves the configured container's profile.
- `list`: Lists recent documents.
- `get`: Retrieves one complete document by ID.
- `forget`: Soft-deletes a memory by ID or exact content.

Direct memories and conversation updates include `source: "opencode"` metadata for provenance. The plugin does not use metadata for routing or filtering.

## Design Boundaries

- No legacy container-tag fan-out
- No cross-editor configuration discovery
- No plugin-managed compaction
- No version-check banner
- No home-directory log file

OpenCode handles context-window management. Plugin diagnostics use OpenCode's structured logging and toast notifications.

## Development

```sh
bun install --frozen-lockfile
bun run typecheck
bun run build
```

The build produces the self-contained `dist/index.js` bundle. Keep the top-level `oc-supermemory-redux.js` release artifact synchronized with that file.

## Patch Notes

- compatability update for supermemory api v5 and locally hosted `supermemory-server v0.0.9`
- Migrated plugin to OpenCode V ^2.0 specification.
- Toast error notifications are now gone and currently we are only logging errors/success through a dedicated log file at ~/.local/share/opencode/log/oc-supermemory-redux.log
- memory and profile injections fire via synthetic message injections and are only visible to the agent, check the log file for verbose information or ask your agent.
- all supermemory sub commands: search, add, forget, update, list, get, docs, ect. now have individual mappings with a deeper explanation of their use case so your agent can more intelligently decide what tool to use and when to use it.
- removed fallback strip to the profile and memories so it is important  to not set that too high now as we provide no defense against you injecting 20 or more memories per search query.
- removed /v4/conversations ingestion pathway for per turn conversational ingestion as it is not available on the locally hosted binary. Instead writes to documents/add with a stable document `id`, provides near identical results. 
