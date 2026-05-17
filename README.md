# ZeroDB Sequential Thinking MCP

Persistent chain-of-thought reasoning for AI agents — reasoning chains survive sessions, resume across agents, and conclusions save as plan artifacts.

**Agents self-provision a ZeroDB account on first run. No signup, no dashboard, no API key copy-paste.**

---

## What Makes This Different

The upstream `@modelcontextprotocol/server-sequential-thinking` discards every reasoning chain when the session ends. This one doesn't.

| Feature | Upstream | This package |
|---------|----------|--------------|
| Sequential reasoning steps | ✅ | ✅ |
| Persists across sessions | ❌ | ✅ |
| Resume prior chain by ID | ❌ | ✅ |
| Save conclusion as plan artifact | ❌ | ✅ |
| Agent self-provisioning | ❌ | ✅ |
| Setup required | Manual | Zero |

---

## Agent Self-Provisioning

This is the key capability: **the agent provisions its own ZeroDB account**. No human needs to visit a dashboard, create an account, or copy an API key.

### How it works

```
Agent installs MCP → MCP boots → No credentials found →
  POST /api/v1/instant-db (zero-auth, terms auto-accepted on behalf of user) →
  ZeroDB account created (72h trial) →
  API key + project ID written to ~/.zerodb/credentials.json →
  Claim URL printed to stderr →
  MCP ready — agent starts working immediately
```

**The agent does all of this in ~2 seconds on first boot.** Subsequent boots are silent — credentials are read from disk.

### For agent swarms and multi-agent systems

Each agent instance reads from `~/.zerodb/credentials.json`. In a shared environment (e.g. OpenClaw agent swarm, CrewAI, AutoGen multi-agent), set `ZERODB_CONFIG_DIR` to a shared path so all agents use the same project:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "zerodb-sequential-thinking-mcp"],
      "env": {
        "ZERODB_CONFIG_DIR": "/shared/zerodb"
      }
    }
  }
}
```

Or provision once manually and share credentials via env vars:

```json
{
  "env": {
    "ZERODB_API_KEY": "zdb_live_...",
    "ZERODB_PROJECT_ID": "your-project-id"
  }
}
```

### Claiming the provisioned account

On first run you'll see this in stderr:

```
┌─────────────────────────────────────────────────────────────┐
│  ZeroDB account provisioned (72h trial)                     │
│                                                             │
│  Your reasoning chains are now persisted in ZeroDB.         │
│  API key: tmp_xxxxxx...                                     │
│                                                             │
│  Claim your account to keep data permanently:               │
│  → https://ainative.studio/claim?token=...&project=...      │
│                                                             │
│  Optional: set ZERODB_EMAIL=you@email.com in your MCP       │
│  config to receive account details via email.               │
│                                                             │
│  This message won't appear again after you claim.           │
└─────────────────────────────────────────────────────────────┘
```

Visit the claim URL, sign up or log in — your project transfers to your permanent account with a `zdb_live_` API key. All reasoning history is preserved.

---

## Install

### Claude Code

```bash
npx zerodb-sequential-thinking-mcp
```

Or add to `.mcp.json`:

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

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "zerodb-sequential-thinking-mcp"],
      "env": {
        "ZERODB_EMAIL": "you@email.com"
      }
    }
  }
}
```

### Cursor / Windsurf / Cline / Continue

Add to your IDE's MCP settings. Same config as above — `command: npx`, `args: ["-y", "zerodb-sequential-thinking-mcp"]`.

### OpenClaw / CrewAI / AutoGen / LangChain agent systems

For agent swarms, provision once then share credentials via `ZERODB_API_KEY` + `ZERODB_PROJECT_ID` env vars across all agent instances. All agents write to the same ZeroDB project — reasoning chains from any agent are resumable by any other agent.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZERODB_EMAIL` | No | Receive the claim link + account details via email after auto-provisioning |
| `ZERODB_API_KEY` | No | Skip auto-provisioning — use an existing ZeroDB key (e.g. after claiming) |
| `ZERODB_PROJECT_ID` | No | Required when `ZERODB_API_KEY` is set |
| `ZERODB_BASE_URL` | No | Override API base (default: `https://api.ainative.studio`) |
| `ZERODB_CONFIG_DIR` | No | Override credentials directory (default: `~/.zerodb`) |

---

## Tools

### `sequential_think`

Perform a sequential reasoning step. Chain multiple calls for complex, multi-step problems.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thought` | string | Yes | The current reasoning step |
| `chain_id` | string | No | Chain ID — auto-generated on first call, pass on subsequent steps |
| `step_number` | number | No | Current step number |
| `total_steps` | number | No | Estimated total steps |
| `next_step` | string | No | What to reason about next |
| `is_final` | boolean | No | Is this the last step before concluding? |
| `persist_steps` | boolean | No | Store each step in ZeroDB working memory (default: `false`) |

### `sequential_conclude`

Finalize a reasoning chain and save the conclusion as a persistent ZeroDB plan artifact. Returns an `artifact_id` you can pass to `sequential_resume` in any future session or agent.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conclusion` | string | Yes | The final answer or decision |
| `chain_id` | string | No | Chain ID from prior `sequential_think` calls |
| `title` | string | No | Artifact title (defaults to first 60 chars of conclusion) |
| `save_as` | string | No | `plan`, `prd`, or `task` (default: `plan`) |

### `sequential_resume`

Load a prior reasoning chain from ZeroDB and continue from where it left off — in any session, on any agent.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | Yes | ID returned by a prior `sequential_conclude` call |

---

## Example: Multi-Session, Multi-Agent Reasoning

**Agent A, Session 1 — Deep analysis:**
```
sequential_think: thought="Analyze architecture options for a payments service"
sequential_think: thought="Team is 4 engineers, 18-month runway, compliance required"
sequential_think: thought="Stripe + monolith wins on speed, microservices wins on scale"
sequential_conclude:
  conclusion="Use Stripe + monolith now. Extract payments microservice at $1M ARR."
  title="Payments Architecture Decision"
→ artifact_id: "f3a9-..."
```

**Agent B, Session 2 — Resume and extend (different agent, different session):**
```
sequential_resume: artifact_id="f3a9-..."
→ Prior conclusion loaded: "Use Stripe + monolith now..."
sequential_think: thought="We've hit $1M ARR. Revisiting the migration trigger."
sequential_conclude:
  conclusion="Begin payments microservice extraction. Start with webhook handler."
  title="Payments Architecture v2"
→ artifact_id: "b72c-..."
```

The `artifact_id` is the only thing that needs to pass between agents or sessions. Everything else is retrieved from ZeroDB.

---

## How Credentials Work

```
First run:
  ~/.zerodb/credentials.json created automatically
  { api_key: "tmp_...", project_id: "...", claimed: false, expires_at: "..." }

After claiming:
  { api_key: "zdb_live_...", project_id: "...", claimed: true }
  Silent boot from here on — no banner, no provisioning calls

Power user override (env vars take precedence over credentials file):
  ZERODB_API_KEY + ZERODB_PROJECT_ID → skips all provisioning
```

---

## Powered by ZeroDB

[ZeroDB](https://ainative.studio) — the agent memory and storage platform built for agentic AI. Every reasoning chain, plan artifact, and working memory record is stored in ZeroDB's `memories` table with vector embeddings for semantic recall.

- **Plan artifacts API:** `POST/GET/PATCH /api/v1/public/memory/v2/plan`
- **Memory API:** `POST /api/v1/public/memory/v2/remember`
- **Instant provisioning:** `POST /api/v1/instant-db`
- **Docs:** [ainative.studio/docs](https://ainative.studio/docs)
