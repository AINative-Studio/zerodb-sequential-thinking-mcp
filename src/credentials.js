import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs';

function credentialsDir() {
  return process.env.ZERODB_CONFIG_DIR || join(homedir(), '.zerodb');
}

export function credentialsPath() {
  return join(credentialsDir(), 'credentials.json');
}

export function readCredentials() {
  try {
    const raw = readFileSync(credentialsPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeCredentials(data) {
  try {
    const dir = credentialsDir();
    mkdirSync(dir, { recursive: true });
    const tmp = credentialsPath() + '.tmp';
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    renameSync(tmp, credentialsPath());
  } catch (e) {
    process.stderr.write(`[zerodb] Warning: could not write credentials: ${e.message}\n`);
  }
}

export function markClaimed(newApiKey) {
  const creds = readCredentials();
  if (!creds) return;
  creds.claimed = true;
  if (newApiKey) creds.api_key = newApiKey;
  writeCredentials(creds);
}
