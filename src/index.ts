#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { compileMjmlSchema, compileMjmlHandler } from './tools/compile-mjml.js';
import { setupBrandSchema, setupBrandHandler } from './tools/setup-brand.js';
import { generateEmailSchema, generateEmailHandler } from './tools/generate-email.js';
import { validateEmailSchema, validateEmailHandler } from './tools/validate-email.js';
import { refineEmailSchema, refineEmailHandler } from './tools/refine-email.js';
import { exportEmailSchema, exportEmailHandler } from './tools/export-email.js';
import { screenshotToEmailSchema, screenshotToEmailHandler } from './tools/screenshot-to-email.js';
import { listBrandResources, readBrandResource } from './resources/brand.js';
import { listTemplateResources, readTemplateResource } from './resources/templates.js';
import { listHistoryResources, readHistoryResource } from './resources/history.js';
import { startPreviewServer, notifyReload } from './preview/server.js';
import { cleanupOldHistory } from './lib/storage-housekeeping.js';
import { WELCOME_PROMPT_DESCRIPTION, WELCOME_PROMPT_ARGS, buildWelcomePromptMessages } from './prompts/mcp-prompts/welcome.js';
import { NEWSLETTER_PROMPT_DESCRIPTION, NEWSLETTER_PROMPT_ARGS, buildNewsletterPromptMessages } from './prompts/mcp-prompts/newsletter.js';
import { PROMOTIONAL_PROMPT_DESCRIPTION, PROMOTIONAL_PROMPT_ARGS, buildPromotionalPromptMessages } from './prompts/mcp-prompts/promotional.js';
import { TRANSACTIONAL_PROMPT_DESCRIPTION, TRANSACTIONAL_PROMPT_ARGS, buildTransactionalPromptMessages } from './prompts/mcp-prompts/transactional.js';
import { listBrands } from './lib/storage.js';

const server = new McpServer({
  name: 'email-design-mcp',
  version: '0.3.0',
});

// --- Tools ---

server.tool(
  'compile_mjml',
  'Compile MJML markup into responsive, production-ready HTML email. Returns the compiled HTML along with file size and any validation warnings.',
  compileMjmlSchema.shape,
  async (args) => compileMjmlHandler(compileMjmlSchema.parse(args)),
);

server.tool(
  'setup_brand',
  'Save a brand profile with colors, fonts, tone, and identity. Provide a website URL to auto-extract brand colors, fonts, and logo — or specify them manually. This brand context is used by generate_email to create on-brand emails.',
  setupBrandSchema.shape,
  async (args) => setupBrandHandler(setupBrandSchema.parse(args)),
);

server.tool(
  'generate_email',
  'Generate a professional email template from a natural language prompt. Returns expert system prompts, brand context, layout instructions, and a user instruction for the AI to produce MJML. After generating MJML, call compile_mjml to get the final HTML.',
  generateEmailSchema.shape,
  async (args) => generateEmailHandler(generateEmailSchema.parse(args)),
);

server.tool(
  'validate_email',
  'Validate a compiled HTML email for best practices: size limits (Gmail clipping), dark mode support, accessibility (alt text), link integrity, unsubscribe link, and text-to-image ratio.',
  validateEmailSchema.shape,
  async (args) => validateEmailHandler(validateEmailSchema.parse(args)),
);

server.tool(
  'refine_email',
  'Iterate on a previously generated email. Provide natural language feedback to modify the design. Supports section-level targeting (header, hero, body, cta, footer) and version history for undo.',
  refineEmailSchema.shape,
  async (args) => refineEmailHandler(refineEmailSchema.parse(args)),
);

server.tool(
  'export_email',
  'Export a generated email as HTML, MJML, or both. Supports exporting specific versions from the refinement history.',
  exportEmailSchema.shape,
  async (args) => exportEmailHandler(exportEmailSchema.parse(args)),
);

server.tool(
  'screenshot_to_email',
  'Convert a design description (from a screenshot or mockup) into a branded MJML email. Describe the layout, colors, sections, and content — the AI will generate matching MJML.',
  screenshotToEmailSchema.shape,
  async (args) => screenshotToEmailHandler(screenshotToEmailSchema.parse(args)),
);

// --- Resources ---

server.resource(
  'brand-list',
  new ResourceTemplate('brand://{brandId}', { list: undefined }),
  async (uri, params) => {
    const brandId = params.brandId as string;
    const content = await readBrandResource(brandId);
    if (!content) {
      throw new Error(`Brand "${brandId}" not found`);
    }
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: content }],
    };
  },
);

server.resource(
  'templates-list',
  new ResourceTemplate('templates://library/{templateId}', { list: undefined }),
  async (uri, params) => {
    const templateId = params.templateId as string;
    const content = await readTemplateResource(templateId);
    if (!content) {
      throw new Error(`Template "${templateId}" not found`);
    }
    return {
      contents: [{ uri: uri.href, mimeType: 'text/plain', text: content }],
    };
  },
);

server.resource(
  'history-list',
  new ResourceTemplate('emails://history/{emailId}', { list: undefined }),
  async (uri, params) => {
    const emailId = params.emailId as string;
    const content = await readHistoryResource(emailId);
    if (!content) {
      throw new Error(`Email "${emailId}" not found`);
    }
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: content }],
    };
  },
);

// --- Prompts (Guided Workflows) ---

async function getLatestBrand() {
  const brands = await listBrands();
  if (brands.length === 0) return null;
  return brands.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

server.prompt(
  'welcome-email',
  WELCOME_PROMPT_DESCRIPTION,
  WELCOME_PROMPT_ARGS,
  async (args) => {
    const brand = await getLatestBrand();
    return buildWelcomePromptMessages(args, brand);
  },
);

server.prompt(
  'newsletter',
  NEWSLETTER_PROMPT_DESCRIPTION,
  NEWSLETTER_PROMPT_ARGS,
  async (args) => {
    const brand = await getLatestBrand();
    return buildNewsletterPromptMessages(args, brand);
  },
);

server.prompt(
  'promotional',
  PROMOTIONAL_PROMPT_DESCRIPTION,
  PROMOTIONAL_PROMPT_ARGS,
  async (args) => {
    const brand = await getLatestBrand();
    return buildPromotionalPromptMessages(args, brand);
  },
);

server.prompt(
  'transactional',
  TRANSACTIONAL_PROMPT_DESCRIPTION,
  TRANSACTIONAL_PROMPT_ARGS,
  async (args) => {
    const brand = await getLatestBrand();
    return buildTransactionalPromptMessages(args, brand);
  },
);

// --- Server startup ---

async function main() {
  // Start preview server in background (non-blocking)
  startPreviewServer().catch(() => {
    // Preview server is optional — don't block MCP startup
  });

  // Run storage housekeeping in background (non-blocking)
  cleanupOldHistory().catch(() => {
    // Housekeeping is optional — don't block MCP startup
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
