// Auto-provisions a ZeroDB account on first run.
// Full implementation: reads credentials, calls ZeroDB provisioning API,
// writes credentials to ~/.zerodb-sequential-thinking-mcp.json.

import { readCredentials, writeCredentials } from './credentials.js';

const API_BASE = 'https://api.ainative.studio';

export async function provision() {
  // Power user override
  if (process.env.ZERODB_API_KEY && process.env.ZERODB_PROJECT_ID) {
    return {
      api_key: process.env.ZERODB_API_KEY,
      project_id: process.env.ZERODB_PROJECT_ID,
      base_url: process.env.ZERODB_BASE_URL || API_BASE,
      claimed: true,
    };
  }

  const existing = readCredentials();
  if (existing) {
    const now = new Date();
    const expires = existing.expires_at ? new Date(existing.expires_at) : null;

    if (existing.claimed) return existing;

    if (expires && expires <= now) {
      process.stderr.write('[zerodb] Trial account expired — provisioning a new one...\n');
      // fall through to re-provision
    } else {
      if (expires) {
        const hoursLeft = Math.round((expires - now) / 3600000);
        if (hoursLeft < 24) {
          printExpiryWarning(existing.claim_url, hoursLeft);
        }
      }
      return existing;
    }
  }

  // Provision new account
  const creds = await createInstantDB();
  writeCredentials(creds);
  printFirstRunBanner(creds.claim_url, creds.api_key);

  // Soft email capture
  if (process.env.ZERODB_EMAIL) {
    await sendClaimEmail(process.env.ZERODB_EMAIL, creds.claim_url, creds.project_id, creds.api_key).catch(() => {});
  }

  return creds;
}

async function createInstantDB() {
  const res = await fetch(`${API_BASE}/api/v1/instant-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agree_terms: true, on_behalf_of: 'mcp-sequential-thinking' }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ZeroDB provisioning failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    api_key: data.api_key,
    project_id: data.project_id,
    base_url: API_BASE,
    expires_at: data.expires_at,
    claim_url: data.claim_url,
    claimed: false,
  };
}

async function sendClaimEmail(email, claimUrl, projectId, apiKey) {
  await fetch(`${API_BASE}/api/v1/instant-db/send-claim-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ email, claim_url: claimUrl, project_id: projectId }),
    signal: AbortSignal.timeout(10000),
  });
}

function printFirstRunBanner(claimUrl, apiKey) {
  const key = apiKey ? apiKey.slice(0, 12) + '...' : '(see credentials file)';
  process.stderr.write(`
┌─────────────────────────────────────────────────────────────┐
│  ZeroDB account provisioned (72h trial)                     │
│                                                             │
│  Your reasoning chains are now persisted in ZeroDB.         │
│  API key: ${key.padEnd(49)}│
│                                                             │
│  Claim your account to keep data permanently:               │
│  → ${(claimUrl || '').slice(0, 55).padEnd(55)}│
│                                                             │
│  Optional: set ZERODB_EMAIL=you@email.com in your MCP       │
│  config to receive account details via email.               │
│                                                             │
│  This message won't appear again after you claim.           │
└─────────────────────────────────────────────────────────────┘
`);
}

function printExpiryWarning(claimUrl, hoursLeft) {
  process.stderr.write(`
[zerodb] ⚠️  Your ZeroDB trial expires in ${hoursLeft}h.
[zerodb] Claim now to keep your reasoning history: ${claimUrl}
`);
}
