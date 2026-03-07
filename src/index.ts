#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { compileMjmlSchema, compileMjmlHandler } from './tools/compile-mjml.js';
import { setupBrandSchema, setupBrandHandler } from './tools/setup-brand.js';
import { generateEmailSchema, generateEmailHandler } from './tools/generate-email.js';

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

server.tool(
  'setup_brand',
  'Save a brand profile with colors, fonts, tone, and identity. This brand context is used by generate_email to create on-brand emails. Call this before generating emails for personalized results.',
  setupBrandSchema.shape,
  async (args) => setupBrandHandler(setupBrandSchema.parse(args)),
);

server.tool(
  'generate_email',
  'Generate a professional email template from a natural language prompt. Returns expert system prompts, brand context, layout instructions, and a user instruction for the AI to produce MJML. After generating MJML, call compile_mjml to get the final HTML.',
  generateEmailSchema.shape,
  async (args) => generateEmailHandler(generateEmailSchema.parse(args)),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
