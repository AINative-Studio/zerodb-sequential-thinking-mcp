#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { provision } from './src/provision.js';
import { ZeroDBClient } from './src/zerodb.js';
import { TOOLS, executeTool } from './src/tools.js';

async function main() {
  const credentials = await provision();
  const client = new ZeroDBClient(credentials);

  const server = new Server(
    { name: 'zerodb-sequential-thinking-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await executeTool(name, args || {}, client);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('ZeroDB Sequential Thinking MCP v0.1.0 — ready\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
