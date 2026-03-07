# email-design-mcp

An open-source MCP server that enables AI assistants to design and generate professional, responsive email templates.

Works with Claude Desktop, Cursor, VS Code Copilot, and any MCP-compatible client.

## Features

- **Generate emails from natural language** - Describe what you want, get production-ready MJML + HTML
- **Brand memory** - Save brand colors, fonts, and tone once, use across all emails
- **Expert design built-in** - Professional spacing, typography, color usage, and CTA patterns enforced automatically
- **Iterative refinement** - Say "make the headline bigger" or "remove the testimonials section" in plain English
- **Layout variety** - 12 layout variants across 4 email types prevent repetitive designs
- **Live preview** - Local preview server with hot reload at `http://localhost:3947`
- **Validation** - Checks size limits, dark mode, accessibility, links, and more
- **Export** - Get HTML, MJML, or both for any generated email
- **Guided workflows** - MCP prompts walk you through creating welcome, newsletter, promotional, and transactional emails
- **No API keys needed** - Uses the host AI model (Claude, GPT, etc.) for generation

## Quick Start

### Install

```bash
npm install -g email-design-mcp
```

### Connect to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "email-design": {
      "command": "email-design-mcp"
    }
  }
}
```

### Connect to Cursor / VS Code

Add to `.cursor/mcp.json` or VS Code MCP settings:

```json
{
  "mcpServers": {
    "email-design": {
      "command": "npx",
      "args": ["email-design-mcp"]
    }
  }
}
```

## Usage

### 1. Set up your brand (optional but recommended)

**Option A — Auto-extract from website:**
> "Set up a brand from https://acme.com"

The server fetches the site and extracts colors, fonts, logo, and name automatically.

**Option B — Manual setup:**
> "Set up a brand called Acme with primary color #FF6B35, secondary #1A1A2E, casual tone, targeting young professionals"

You can also combine both — provide a URL for auto-extraction and override specific values manually.

### 2. Generate an email

> "Create a welcome email for new subscribers"

The server composes an expert prompt stack with design rules, brand context, and layout instructions. The AI generates MJML, which is compiled to responsive HTML.

### 3. Refine

> "Make the headline bigger and change the button to say 'Start Free Trial'"

Refinements target specific sections without regenerating the whole email. Version history lets you undo changes.

### 4. Export

> "Export the email as HTML"

Get the final HTML or MJML ready to paste into your ESP.

## Tools

| Tool | Description |
|------|-------------|
| `setup_brand` | Save a brand profile (colors, fonts, tone) |
| `generate_email` | Generate an email from a natural language prompt |
| `refine_email` | Iterate on a generated email with feedback |
| `compile_mjml` | Compile raw MJML to HTML |
| `validate_email` | Check email for best practices |
| `export_email` | Export as HTML, MJML, or both |
| `screenshot_to_email` | Convert a design description to a branded email |

## Guided Workflows (MCP Prompts)

These prompts walk you through creating specific email types with smart defaults:

| Prompt | Description |
|--------|-------------|
| `welcome-email` | Welcome email for new subscribers |
| `newsletter` | Newsletter with featured content |
| `promotional` | Sale/launch email with urgency |
| `transactional` | Receipt, confirmation, or shipping notification |

## Templates

4 bundled MJML templates with placeholder variables:

- **Welcome** - Hero image + intro text + CTA
- **Newsletter** - Featured article + content grid + footer
- **Promotional** - Hero offer + product showcase + urgency
- **Transactional** - Order confirmation with itemized details

## Validation Checks

| Check | What it verifies |
|-------|-----------------|
| Email size | Under Gmail's 102KB clipping threshold |
| Dark mode | `color-scheme: light dark` declaration |
| Alt text | All images have meaningful alt attributes |
| Links | All `<a>` tags have href attributes |
| Unsubscribe | Footer contains unsubscribe link |
| Text ratio | Sufficient text relative to images |
| Viewport | Mobile viewport meta tag |
| Preheader | Hidden preview text for inbox |
| Title | HTML title tag present |
| Inline styles | Styles inlined for email client compatibility |

## Storage

Data is stored at `~/.email-design-mcp/`:

```
~/.email-design-mcp/
  brands/           # Brand profiles (JSON)
  history/          # Generated email history (JSON)
  config.json       # Optional config (history retention, preview port)
```

History is automatically cleaned up after 30 days (configurable in `config.json`).

## Development

```bash
git clone https://github.com/anthropics/email-design-mcp.git
cd email-design-mcp
npm install
npm run dev        # Watch mode
npm test           # Run tests
npm run typecheck  # Type check
npm run build      # Compile TypeScript
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design document.

**Stack**: TypeScript, Node.js, MJML, Zod, MCP SDK

**Key design decisions**:
- No external AI API calls - the host model does generation
- Prompt engineering layer (expert system prompts + design rules + layout variants) is the core differentiator
- MJML for email rendering ensures Outlook/Gmail/mobile compatibility
- Local JSON storage keeps it simple with no database dependency

## License

MIT
