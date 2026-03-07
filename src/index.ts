#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { compileMjmlSchema, compileMjmlHandler } from './tools/compile-mjml.js';

const server = new McpServer({
  name: 'email-design-mcp',
  version: '0.1.0',
});

server.tool(
  'compile_mjml',
  'Compile MJML markup into responsive, production-ready HTML email. Returns the compiled HTML along with file size and any validation warnings.',
  compileMjmlSchema.shape,
  async (args) => compileMjmlHandler(compileMjmlSchema.parse(args)),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
