# ZeroDB Sequential Thinking MCP

ZeroDB Sequential Thinking MCP is a Model Context Protocol server for structured, step-by-step reasoning with optional ZeroDB-backed persistence. It gives MCP-capable clients three tools for starting a reasoning chain, concluding it as a reusable artifact, and resuming that artifact in a later session.

The package is designed for Claude Desktop, Claude Code, Cursor, Cline, Windsurf, and other MCP hosts that can launch a stdio server.

## Install

Run it directly with `npx`:

```sh
npx zerodb-sequential-thinking-mcp
```

Or install it globally:

```sh
npm install -g zerodb-sequential-thinking-mcp
zerodb-sequential-thinking-mcp
```

The server requires Node.js 18 or newer.

## Claude Desktop

Add the server to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zerodb-sequential-thinking": {
      "command": "npx",
      "args": ["-y", "zerodb-sequential-thinking-mcp"],
      "env": {
        "ZERODB_EMAIL": "you@example.com"
      }
    }
  }
}
```

Restart Claude Desktop after saving the config.

## Claude Code

Add the server as a stdio MCP integration:

```sh
claude mcp add zerodb-sequential-thinking -- npx -y zerodb-sequential-thinking-mcp
```

To pass environment variables:

```sh
ZERODB_EMAIL=you@example.com claude mcp add zerodb-sequential-thinking -- npx -y zerodb-sequential-thinking-mcp
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `ZERODB_EMAIL` | No | Email address used to receive a ZeroDB claim link and account details after auto-provisioning. |
| `ZERODB_API_KEY` | No | Existing ZeroDB API key. Set this to skip auto-provisioning. |
| `ZERODB_PROJECT_ID` | No | Existing ZeroDB project ID. Set this with `ZERODB_API_KEY` to use an existing project. |
| `ZERODB_BASE_URL` | No | ZeroDB API base URL. Defaults to `https://api.ainative.studio`. |
| `ZERODB_CONFIG_DIR` | No | Directory for local credential storage. Defaults to `~/.zerodb`. |

You can also copy `.env.example` to `.env` for local development.

## How Auto-Provisioning Works

On first run, the server is intended to provision a temporary ZeroDB project when `ZERODB_API_KEY` and `ZERODB_PROJECT_ID` are not provided.

The expected flow is:

1. The MCP server requests a temporary ZeroDB project.
2. Credentials are stored under `~/.zerodb/credentials.json` unless `ZERODB_CONFIG_DIR` overrides the location.
3. If `ZERODB_EMAIL` is set, ZeroDB sends a claim email for the temporary project.
4. The claim link lets you attach the project to a permanent ZeroDB account.
5. Temporary projects expire after the trial window if they are not claimed.

If you already have ZeroDB credentials, set `ZERODB_API_KEY` and `ZERODB_PROJECT_ID` to bypass auto-provisioning.

## Tools

### `sequential_think`

Record one step in a reasoning chain. Call it repeatedly for complex tasks.

Parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `thought` | Yes | The current reasoning step. |
| `chain_id` | No | Existing chain ID. If omitted, the server creates one. |
| `step_number` | No | Current step number. Defaults to `1`. |
| `total_steps` | No | Estimated number of steps in the chain. |
| `next_step` | No | What should be reasoned about next. |
| `is_final` | No | Set to `true` when this is the final reasoning step before conclusion. |
| `persist_steps` | No | Set to `true` to persist each step to ZeroDB working memory once persistence is enabled. |

Example tool call:

```json
{
  "thought": "Identify the API boundary before writing implementation code.",
  "step_number": 1,
  "total_steps": 3,
  "next_step": "Map the request and response contract",
  "persist_steps": true
}
```

### `sequential_conclude`

Finalize a chain and save the conclusion as a plan artifact.

Parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `conclusion` | Yes | Final answer, decision, or implementation plan. |
| `chain_id` | No | Chain ID returned by earlier `sequential_think` calls. |
| `title` | No | Artifact title. Defaults to a short title derived from the conclusion. |
| `save_as` | No | Artifact type: `plan`, `prd`, or `task`. Defaults to `plan`. |

Example tool call:

```json
{
  "chain_id": "chain_123",
  "title": "MCP install documentation plan",
  "save_as": "plan",
  "conclusion": "Document npx install, Claude Desktop config, env vars, and the ZeroDB claim flow."
}
```

### `sequential_resume`

Resume from a previously saved artifact.

Parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `artifact_id` | Yes | Artifact ID returned by `sequential_conclude`. |

Example tool call:

```json
{
  "artifact_id": "artifact_123"
}
```

## Example: Multi-Session Reasoning

Use `sequential_think` while planning a task:

```json
{
  "thought": "The README needs install, env vars, tool docs, and claim-flow sections.",
  "step_number": 1,
  "total_steps": 2
}
```

Then store the finished plan:

```json
{
  "chain_id": "chain_123",
  "save_as": "plan",
  "conclusion": "Ship a README with MCP host setup, ZeroDB credentials, and tool reference."
}
```

In a later session, resume the saved artifact:

```json
{
  "artifact_id": "artifact_123"
}
```

## Current Implementation Notes

At version `0.1.0`, `sequential_think` returns a chain ID and records the submitted step in the response. ZeroDB provisioning and artifact persistence are represented by the `src/provision.js` and `src/plan-store.js` integration points and are still being wired into the package.

Until persistence lands, `sequential_conclude` and `sequential_resume` return stub responses. Keep that in mind when testing hosted account claiming or cross-session resume behavior.

## Troubleshooting

If your MCP host cannot start the server, confirm that Node.js 18 or newer is available:

```sh
node --version
```

If a host cannot find the package, use the explicit `npx` form:

```sh
npx -y zerodb-sequential-thinking-mcp
```

If you use an existing ZeroDB project, set both `ZERODB_API_KEY` and `ZERODB_PROJECT_ID`. Setting only one of them is not enough to skip provisioning.

## License

MIT
