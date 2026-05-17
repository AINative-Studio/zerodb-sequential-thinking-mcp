# ZeroDB Sequential Thinking MCP

Sequential chain-of-thought reasoning that persists across sessions — powered by ZeroDB.

**Auto-provisions a ZeroDB account on first run. No signup required.**

## What this does

- 3 tools: `sequential_think`, `sequential_conclude`, `sequential_resume`
- Each reasoning chain can be concluded and saved as a persistent plan artifact
- Resume any prior reasoning chain in a future session using its artifact ID
- Steps optionally stored in ZeroDB working memory for full chain persistence

## Install

### Claude Code / Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "zerodb-sequential-thinking-mcp"]
    }
  }
}
```

On first run, a ZeroDB account is automatically provisioned. You'll see a claim URL in your terminal output.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZERODB_EMAIL` | No | Your email — receive the claim link and account details |
| `ZERODB_API_KEY` | No | Skip auto-provisioning, use an existing ZeroDB API key |
| `ZERODB_PROJECT_ID` | No | Required if `ZERODB_API_KEY` is set |
| `ZERODB_BASE_URL` | No | Override API base URL (default: `https://api.ainative.studio`) |

## How Auto-Provisioning Works

1. On first run, the server calls ZeroDB's instant provisioning API
2. A temporary account is created with a 72-hour trial
3. A claim URL is printed to stderr — visit it to make your account permanent
4. If you set `ZERODB_EMAIL`, you'll also receive the claim link by email
5. After claiming, your data and reasoning history persist indefinitely

## Tools

### `sequential_think`

Perform a sequential reasoning step. Chain multiple calls for complex problems.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thought` | string | Yes | The current reasoning step |
| `chain_id` | string | No | Chain ID (auto-generated on first call, reuse to continue) |
| `step_number` | number | No | Current step number |
| `total_steps` | number | No | Estimated total steps |
| `next_step` | string | No | What to reason about next |
| `is_final` | boolean | No | Is this the last step? |
| `persist_steps` | boolean | No | Store each step in ZeroDB (default: false) |

### `sequential_conclude`

Finalize a reasoning chain and save it as a persistent ZeroDB plan artifact.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conclusion` | string | Yes | The final answer or decision |
| `chain_id` | string | No | Chain ID from prior `sequential_think` calls |
| `title` | string | No | Artifact title |
| `save_as` | string | No | `plan`, `prd`, or `task` (default: `plan`) |

Returns `artifact_id` — save this to resume the chain later.

### `sequential_resume`

Resume a reasoning chain from a previous session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | Yes | ID returned by `sequential_conclude` |

## Example: Multi-Session Reasoning

**Session 1 — Analyze and conclude:**
```
sequential_think: "Analyze the trade-offs of microservices vs monolith..."
sequential_think: "Considering team size of 5 engineers..."
sequential_conclude: conclusion="Use monolith for now, revisit at 15 engineers", title="Architecture Decision"
-> artifact_id: "abc-123"
```

**Session 2 — Resume and extend:**
```
sequential_resume: artifact_id="abc-123"
-> Returns prior conclusion and context
sequential_think: "Revisiting this decision — team is now 12 engineers..."
sequential_conclude: conclusion="Begin microservices migration with auth service first"
```

## Claiming Your Account

Visit the claim URL printed on first run:
```
https://ainative.studio/claim?token=...&project=...
```

Sign up or log in — your project transfers to your permanent account with a `zdb_live_` API key. Update your MCP config to use `ZERODB_API_KEY` with the new key for silent boots.

## Powered by ZeroDB

[ZeroDB](https://ainative.studio) is AINative Studio's agent memory and storage platform.
