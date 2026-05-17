// Thin HTTP client for the ZeroDB / AINative API.

export class ZeroDBClient {
  constructor({ api_key, project_id, base_url = 'https://api.ainative.studio' }) {
    this.apiKey = api_key;
    this.projectId = project_id;
    this.baseUrl = base_url;
  }

  async request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      signal: AbortSignal.timeout(10000),
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);

    if (res.status === 401) {
      process.stderr.write('[zerodb] 401 Unauthorized — your API key may have expired. Re-run to re-provision or set ZERODB_API_KEY.\n');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ZeroDB API error ${res.status} ${method} ${path}: ${text}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }
}
