# email-design-mcp

An open-source MCP (Model Context Protocol) server that enables AI assistants to design and generate professional, responsive email templates.

## Vision

Allow users of Claude, ChatGPT, Cursor, VS Code Copilot, and other MCP-compatible clients to generate on-brand, production-ready emails without leaving their AI workspace.

---

## What Problem Are We Solving?

### Current Pain Points

1. **Context Switching** - Marketers jump between AI chat → email builder → ESP
2. **No Brand Memory** - Every AI prompt requires re-explaining brand details
3. **Email Expertise Required** - Responsive email design is hard (Outlook, dark mode, mobile)
4. **Existing MCP Servers** - Only handle sending/reading, not designing

### Our Solution

An MCP server that:
- Generates MJML/HTML emails from natural language prompts
- Remembers brand context (colors, fonts, voice) across sessions
- Enforces email best practices automatically
- Exports to any ESP (Klaviyo, Mailchimp, HubSpot, etc.)

---

## Target Users

1. **Marketers** - Non-technical users who live in Claude/ChatGPT
2. **Developers** - Using Cursor/VS Code for email template development
3. **Agencies** - Creating emails for multiple client brands

---

## Core Features (MVP)

### Tools

| Tool | Description | Inputs | Outputs |
|------|-------------|--------|---------|
| `setup_brand` | Extract brand from website + save profile | `url`, `industry?`, `audience?` | Brand config |
| `generate_email` | Create email from prompt using brand context | `prompt`, `type?`, `template?` | MJML + HTML |
| `refine_email` | Iterate on generated email | `email_id`, `feedback`, `section?` | Updated MJML + HTML |
| `compile_mjml` | Compile MJML to HTML | `mjml` | HTML |
| `validate_email` | Check size, dark mode, accessibility | `html` | Validation report |
| `export_email` | Get email in desired format | `email_id`, `format` | HTML/MJML file |
| `screenshot_to_email` | Convert a design screenshot into a branded email | `image_description`, `brand_id?` | MJML + HTML |

### Resources

| Resource | Description |
|----------|-------------|
| `brand://profile` | Saved brand configuration |
| `templates://library/*` | Bundled starter templates |
| `emails://history/*` | Previously generated emails |

### Prompts (Pre-built Workflows)

| Prompt | Description |
|--------|-------------|
| `welcome-email` | Guided welcome email creation |
| `newsletter` | Newsletter template workflow |
| `promotional` | Sale/launch email workflow |
| `transactional` | Receipt/confirmation workflow |

---

## Technical Architecture

### Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js | MCP SDK is mature in TypeScript |
| Language | TypeScript | Type safety, better DX |
| MCP SDK | `@modelcontextprotocol/sdk` | Official Anthropic SDK |
| Email Framework | MJML | Battle-tested, best Outlook support |
| Validation | Zod | Schema validation for inputs |
| Storage | Local JSON files | Simple, no DB needed for MVP |
| AI | Host model (Claude/GPT) | No extra API keys needed |

### Project Structure

```
email-design-mcp/
├── src/
│   ├── index.ts              # Entry point, server setup
│   ├── tools/                # MCP tool handlers
│   │   ├── setup-brand.ts
│   │   ├── generate-email.ts
│   │   ├── refine-email.ts
│   │   ├── compile-mjml.ts
│   │   ├── validate-email.ts
│   │   └── export-email.ts
│   ├── resources/            # MCP resource handlers
│   │   ├── brand.ts
│   │   ├── templates.ts
│   │   └── history.ts
│   ├── prompts/              # Prompt engineering layer (OUR MOAT)
│   │   ├── system/           # Expert system prompts
│   │   │   ├── email-expert.ts
│   │   │   ├── mjml-guide.ts
│   │   │   └── brand-injector.ts
│   │   ├── design-rules/     # Codified design knowledge
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   ├── color-usage.ts
│   │   │   ├── cta-patterns.ts
│   │   │   └── layout-principles.ts
│   │   ├── layouts/           # Layout variants per email type
│   │   │   ├── welcome/
│   │   │   ├── newsletter/
│   │   │   └── promotional/
│   │   ├── mcp-prompts/       # MCP prompt templates (user-facing workflows)
│   │   │   ├── welcome.ts
│   │   │   ├── newsletter.ts
│   │   │   └── promotional.ts
│   ├── preview/              # Email preview system
│   │   ├── server.ts             # Local HTTP server for live preview
│   │   ├── renderer.ts           # HTML → screenshot (Puppeteer)
│   │   └── hot-reload.ts         # WebSocket push on refinements
│   ├── lib/                  # Core logic
│   │   ├── brand-extractor.ts    # Website scraping
│   │   ├── mjml-compiler.ts      # MJML → HTML
│   │   ├── email-validator.ts    # Validation checks
│   │   ├── section-labeler.ts    # Label MJML sections for targeted edits
│   │   └── storage.ts            # Local file storage
│   ├── templates/            # Bundled MJML templates
│   │   ├── welcome.mjml
│   │   ├── newsletter.mjml
│   │   └── promotional.mjml
│   └── types/                # TypeScript types
│       ├── brand.ts
│       ├── email.ts
│       └── mcp.ts
├── # Runtime data stored at ~/.email-design-mcp/ (user home)
│   # ~/.email-design-mcp/brands/{brandId}.json
│   # ~/.email-design-mcp/history/{emailId}.json
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md
```

---

## Data Models

### Brand Profile

```typescript
interface BrandProfile {
  id: string;
  url: string;
  name: string;

  // Visual
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;

  // Voice
  industry: string;
  audience: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';

  // Meta
  createdAt: string;
  updatedAt: string;
}
```

### Generated Email

```typescript
interface GeneratedEmail {
  id: string;
  prompt: string;
  type: 'welcome' | 'newsletter' | 'promotional' | 'transactional' | 'custom';

  // Content
  mjml: string;
  html: string;

  // Metadata
  brandId: string;
  templateUsed?: string;

  // Validation
  validation?: {
    sizeKb: number;
    darkModeCompatible: boolean;
    mobileResponsive: boolean;
    accessibilityScore: number;
  };

  // History
  createdAt: string;
  refinements: Array<{
    feedback: string;
    timestamp: string;
  }>;
}
```

---

## Brand Extraction Strategy

### Method: Website Scraping

1. Fetch homepage HTML
2. Extract:
   - **Logo**: `<link rel="icon">`, `og:image`, or first prominent image
   - **Colors**: Parse CSS variables, most-used colors in stylesheets
   - **Fonts**: `font-family` declarations
   - **Tone**: Analyze copy with simple heuristics (word choice, sentence length)

### Libraries

| Task | Library | Notes |
|------|---------|-------|
| Fetch HTML | `node-fetch` or `undici` | Built into Node 18+ |
| Parse HTML | `cheerio` | jQuery-like, lightweight |
| Parse CSS | `css-tree` | Extract color/font values |
| Color extraction | `colorthief` | Dominant colors from images |

### Fallback

If scraping fails or is incomplete:
- Ask user 3-5 questions via MCP tool response
- Store answers as brand profile

---

## Email Generation Strategy

### How It Works

1. User provides prompt: "Create a welcome email for new subscribers"
2. MCP server:
   - Loads brand profile from storage
   - Selects appropriate base template (or starts blank)
   - **Selects a layout variant** to avoid repetitive designs
   - Returns structured prompt to host AI with:
     - Brand context (colors, fonts, tone)
     - **Expert system prompt** (design principles, email best practices)
     - MJML syntax guidelines
     - **Layout variant instructions** (which pattern to use)
3. Host AI (Claude/GPT) generates MJML
4. MCP server:
   - Compiles MJML → HTML
   - Validates output
   - Stores in history
   - Returns result

### Key Insight

**We don't call external AI APIs.** The host (Claude Desktop, ChatGPT, Cursor) already has an AI model. Our MCP server just:
- Provides context (brand, templates)
- Enforces constraints (MJML syntax, best practices)
- Processes output (compile, validate)

This means:
- No API keys needed
- No usage costs for us
- Works with any AI model the user has

---

## Prompt Engineering Layer (Our Moat)

This is the core differentiator. A user prompting Claude directly gets generic output. Our MCP server produces **premium, expert-level emails** because we inject specialized knowledge that no casual user would write themselves.

### Why This Matters

Without this layer, our MCP server is just a thin MJML compiler wrapper — no real value over raw prompting. The prompt engineering layer is what makes the output **noticeably better** than what users get on their own.

### Structure

```
src/
  prompts/
    system/                    # Expert system prompts
      email-expert.ts          # Core email design expertise
      mjml-guide.ts            # MJML syntax rules & patterns
      brand-injector.ts        # Merges brand context into prompts
    design-rules/              # Codified design knowledge
      spacing.ts               # Padding, margins, section gaps
      typography.ts            # Font sizes, line heights, hierarchy
      color-usage.ts           # How to apply brand colors effectively
      cta-patterns.ts          # Button styles, placement, copy rules
      layout-principles.ts     # Visual hierarchy, content flow
    layouts/                   # Layout variant definitions
      welcome/
        variant-hero-cta.ts        # Hero image → headline → CTA
        variant-story-driven.ts    # Personal intro → value props → CTA
        variant-minimalist.ts      # Logo → short copy → single CTA
      newsletter/
        variant-magazine.ts        # Featured article → grid
        variant-digest.ts          # Numbered list of links
        variant-editorial.ts       # Long-form with pull quotes
      promotional/
        variant-countdown.ts       # Urgency-driven with timer
        variant-product-grid.ts    # Multiple products in grid
        variant-single-hero.ts     # One big hero image + offer
```

### System Prompt Stack

When generating an email, we compose a system prompt from multiple layers:

```
┌─────────────────────────────────┐
│  1. Email Expert Knowledge      │  ← "You are an expert email designer..."
│     - Design principles         │     Spacing, hierarchy, responsive rules
│     - Email client quirks       │     Outlook hacks, Gmail clipping, dark mode
│     - Deliverability rules      │     Text/image ratio, CTA best practices
├─────────────────────────────────┤
│  2. MJML Syntax Guide           │  ← Valid components, attributes, patterns
│     - Do's and Don'ts           │     Common mistakes to avoid
│     - Responsive patterns       │     Mobile-first column stacking
├─────────────────────────────────┤
│  3. Brand Context               │  ← Injected from stored brand profile
│     - Colors, fonts, tone       │     "Use #FF6B35 for CTAs, casual tone"
│     - Industry conventions      │     "E-commerce: show products, urgency"
├─────────────────────────────────┤
│  4. Layout Variant              │  ← Selected to ensure variety
│     - Structure instructions    │     "Use a hero image → 3 value props → CTA"
│     - Section ordering          │     Which blocks in which order
├─────────────────────────────────┤
│  5. User Prompt                 │  ← The actual user request
│     "Create a welcome email     │
│      for new subscribers"       │
└─────────────────────────────────┘
```

### Design Rules (Codified Expertise)

These are the specific rules that make our output premium:

| Category | Example Rules |
|----------|---------------|
| Spacing | 20px padding inside sections, 32px between sections, 48px before footer |
| Typography | Headings 24-28px, body 16px, min line-height 1.5, max 75 chars/line |
| Color usage | Primary for CTAs only, secondary for accents, never more than 3 colors |
| CTA | One primary CTA above fold, max 2 CTAs total, min 44px tap target |
| Images | Max 600px wide, always include alt text, use placeholder if none provided |
| Layout | Single column for mobile, max 3 columns desktop, content width 600px |
| Dark mode | Include `color-scheme: light dark`, use transparent PNGs where possible |

### Variation Strategy (Avoiding Repetitive Designs)

**Problem**: Same prompt → same layout every time → feels robotic.

**Solution**: Multiple layout variants per email type, with smart selection:

1. **Track history** — Record which layout variant was last used per brand
2. **Rotate variants** — Pick a different variant than the last one used
3. **User can override** — `generate_email({ prompt: "...", style: "minimalist" })`
4. **Style modifiers** — Random selection of micro-variations:
   - Rounded vs. sharp button corners
   - Centered vs. left-aligned text
   - With vs. without divider lines
   - Image above vs. beside text

This means two "welcome email" requests for the same brand produce **visually distinct** results.

---

## Preview System

Users need to **see** the email, not read raw HTML code in the chat.

### Dual Preview Approach

**1. Image thumbnail in chat (instant visual feedback)**
- After generating/refining, render the HTML → screenshot using a headless browser (Puppeteer or Playwright)
- Return the image as MCP image content — displays inline in the chat
- User immediately sees what the email looks like without leaving the conversation
- Shows both desktop and mobile widths side by side

**2. Live preview server (full interactive view)**
- Spin up a lightweight local HTTP server (e.g., port 3947)
- Serve the generated HTML at `http://localhost:3947/preview/{emailId}`
- Return the URL in the tool response — user clicks to open in browser
- **Auto-refreshes** on every refinement (via WebSocket or SSE)
- User can inspect, scroll, test links, resize browser for responsive check

### Preview Architecture

```
src/
  preview/
    server.ts              # Local HTTP server for live preview
    renderer.ts            # HTML → screenshot (Puppeteer/Playwright)
    hot-reload.ts          # WebSocket push on refinements
```

### Flow

```
User: "Create a welcome email"
  ↓
MCP server generates MJML → compiles HTML
  ↓
┌─────────────────────────────────────┐
│  Returns to chat:                   │
│  1. 📸 Inline image preview         │  ← user sees it immediately
│  2. 🔗 http://localhost:3947/...    │  ← click for full preview
│  3. ✅ Validation summary           │
└─────────────────────────────────────┘
```

---

## Iterative Design Workflow

This is where users spend most of their time. The first generation is rarely perfect — users need to tweak text, swap sections, adjust styling. Our UX must make this **as easy as saying what's wrong**.

### How Refinement Works

The `refine_email` tool accepts natural language feedback. The MCP server:

1. Loads the **current MJML** from history (by `email_id`)
2. **Labels each section** with identifiers (header, hero, body, cta, footer, etc.)
3. Passes the current MJML + user feedback + brand context to the host AI
4. AI modifies only the relevant parts
5. Recompiles → re-renders preview → **live preview auto-refreshes in browser**

### What Users Can Say (Examples)

| User Says | What Happens |
|-----------|--------------|
| "Make the headline bigger" | AI adjusts font-size in the heading section |
| "Change the button to say 'Get Started'" | AI updates CTA text |
| "Remove the testimonials section" | AI removes that `<mj-section>` block |
| "Add a 3-column feature grid below the hero" | AI inserts a new section with `<mj-column>` layout |
| "Make it more minimal" | AI reduces sections, increases whitespace, simplifies |
| "Swap the hero image and text order" | AI restructures the hero section |
| "Use a darker background" | AI adjusts background colors while keeping contrast |
| "The footer feels too heavy, simplify it" | AI strips footer to essentials |

### Section-Level Targeting

For precise edits, users can target specific sections:

```
refine_email({
  email_id: "abc123",
  feedback: "Replace this with a 2-column layout showing features with icons",
  section: "body"          // optional: targets a specific section
})
```

The server labels sections in the stored MJML with comments:

```mjml
<!-- section:header -->
<mj-section>...</mj-section>

<!-- section:hero -->
<mj-section>...</mj-section>

<!-- section:body -->
<mj-section>...</mj-section>

<!-- section:cta -->
<mj-section>...</mj-section>

<!-- section:footer -->
<mj-section>...</mj-section>
```

When a `section` is specified, only that block is passed to the AI for modification — the rest stays untouched. This prevents the AI from accidentally changing parts the user already approved.

### Refinement History

Every refinement is tracked, so users can:
- **Undo** — revert to a previous version ("go back to the version before I changed the header")
- **Compare** — see what changed between iterations
- **Branch** — "try a different CTA but keep everything else" without losing the current version

### The Full Iterative Loop

```
Generate → Preview → Feedback → Refine → Preview → Feedback → ... → Export
   ↑                                                                    │
   └────── "Start over with a different layout" ────────────────────────┘
```

**Key UX principles:**
- Every change shows an updated preview instantly (image in chat + live reload in browser)
- Small changes don't regenerate the whole email — only the targeted section
- User never has to write MJML or HTML — pure natural language
- History is preserved so nothing is lost

---

## Email Best Practices (Auto-Enforced)

| Rule | Implementation |
|------|----------------|
| Mobile-first | MJML handles this by default |
| Single-column layout | Template structure |
| CTA above fold | Prompt engineering |
| Under 102KB | Validation tool checks |
| Dark mode compatible | MJML + CSS guidance in prompts |
| 80:20 text-to-image | Validation tool checks |
| Accessible | Alt text reminders, color contrast |

---

## Template Library

### Bundled Templates (MVP)

1. **Welcome Email** - Simple hero + intro text + CTA
2. **Newsletter** - Header + multiple content blocks + footer
3. **Promotional** - Hero image + offer + CTA + urgency
4. **Transactional** - Clean, informational, minimal design

### Template Format

Each template is MJML with placeholder variables:

```mjml
<mjml>
  <mj-body background-color="{{backgroundColor}}">
    <mj-section>
      <mj-column>
        <mj-image src="{{logoUrl}}" />
        <mj-text color="{{textColor}}" font-family="{{headingFont}}">
          {{headline}}
        </mj-text>
        <mj-button background-color="{{primaryColor}}">
          {{ctaText}}
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

---

## Validation Checks

| Check | Threshold | How |
|-------|-----------|-----|
| Email size | < 102KB | Measure compiled HTML |
| Images | Have alt text | Parse HTML |
| Dark mode | Meta tag present | Check for `color-scheme` |
| Mobile | MJML guarantees | N/A (MJML handles) |
| Links | All have href | Parse HTML |
| Unsubscribe | Footer contains link | Pattern match |

---

## Export Formats

| Format | Use Case |
|--------|----------|
| HTML | Direct use, any ESP |
| MJML | Editable source |
| Copy to clipboard | Quick paste |

### Future (Post-MVP)

- **Figma to email** — Import Figma designs via API and convert to MJML (requires Figma API key)
- Direct push to Klaviyo/Mailchimp via API
- Zapier webhook
- Download as .zip with images

---

## Development Phases

### Phase 1: Foundation
- [ ] Project setup (TypeScript, MCP SDK)
- [ ] Basic server with stdio transport
- [ ] `compile_mjml` tool (simplest, proves MCP works)
- [ ] Test with Claude Desktop

### Phase 2: Core Tools
- [ ] `generate_email` tool
- [ ] `setup_brand` tool (basic, manual input)
- [ ] Local storage for brand/history
- [ ] 2-3 bundled templates
- [ ] **Prompt engineering layer** — expert system prompts, MJML guide, design rules
- [ ] **Layout variants** — at least 2-3 variants per email type to avoid repetitive output

### Phase 3: Intelligence
- [ ] Website scraping for brand extraction
- [ ] `validate_email` tool
- [ ] `refine_email` tool with section-level targeting
- [ ] `screenshot_to_email` tool (leverages host AI's vision to describe layout, then generates matching MJML)
- [ ] **Preview system** — live preview server + image thumbnail in chat
- [ ] **Section labeling** — auto-label MJML sections for targeted refinements
- [ ] **Refinement history** — undo, compare, branch between versions
- [ ] MCP Resources (brand, templates, history)

### Phase 4: Polish
- [ ] MCP Prompts (guided workflows)
- [ ] More templates
- [ ] Better validation
- [ ] Storage housekeeping (auto-cleanup old history)
- [ ] Documentation + installation guide
- [ ] npm publish

---

## Design Decisions

### Resolved

1. **Storage location**: `~/.email-design-mcp/` (user home directory)
   - Persists across projects regardless of where the server runs
   - Structure: `~/.email-design-mcp/brands/`, `~/.email-design-mcp/history/`
   - Avoids polluting project directories

2. **Template variables**: Mustache-style `{{variable}}`
   - Familiar syntax, easy to find-and-replace
   - AI models understand this convention well

3. **Multi-brand support**: Multi-brand from day one
   - Store as `brands/{brandId}.json` — no harder than single-brand
   - Default to last-used brand if none specified in a request
   - Feels like single-brand for simple use cases, scales naturally

4. **Image handling**: Layered approach
   - **Default**: Placeholder URLs (`https://placehold.co/600x300`) so emails render immediately
   - **User URLs**: Accept user-provided image URLs when given in the prompt
   - **Future**: Unsplash/Pexels integration as optional enhancement (requires API key, skipped for MVP)

5. **Error handling**: Auto-fix with transparency
   - First attempt: compile MJML as-is
   - If compilation fails: apply common auto-fixes (unclosed tags, missing `<mj-body>` wrapper, invalid attributes)
   - If auto-fix succeeds: return result with a note explaining what was fixed
   - If auto-fix fails: return specific MJML validation errors so the AI can regenerate
   - **In the refinement loop**: if a refinement produces invalid MJML, automatically fall back to the last working version and relay the error to the AI for a second attempt — the user should never see a broken state

6. **Storage housekeeping**: No limits on generation, but keep disk clean
   - Users can generate as many emails as they want — the AI cost is on the host model, not us
   - Auto-cleanup: delete history older than 30 days (configurable)
   - `~/.email-design-mcp/config.json` for user preferences (history retention, preview port, etc.)
   - Exported emails are never auto-deleted — only working history

---

## Testing Strategy

### Unit Tests
| What | How |
|------|-----|
| MJML compilation | Feed known MJML → verify HTML output |
| Section labeler | Verify sections are correctly tagged with comments |
| Brand extractor | Mock HTML pages → verify extracted colors/fonts |
| Validation checks | Test each rule (size, dark mode, alt text) with pass/fail fixtures |
| Auto-fix logic | Feed broken MJML → verify it gets fixed or returns clear errors |

### Integration Tests
| What | How |
|------|-----|
| MCP tool round-trip | Call each tool via MCP SDK test client → verify response format |
| Generate → Refine loop | Generate an email, refine it, verify history tracking |
| Preview server | Start server, fetch preview URL, verify HTML is served |

### Snapshot Tests
| What | How |
|------|-----|
| Prompt assembly | Snapshot the composed system prompt for each email type to catch unintended changes |
| Template output | Snapshot compiled HTML from each bundled template |

### Test Framework
- **Vitest** — fast, TypeScript-native, good for unit + integration
- Run with `npm test`, CI-ready

---

## Installation & Setup

### For Users (npm)

```bash
npm install -g email-design-mcp
```

### Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### For Development

```bash
git clone https://github.com/<org>/email-design-mcp.git
cd email-design-mcp
npm install
npm run dev        # Watch mode
npm test           # Run tests
```

---

## References

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MJML Documentation](https://mjml.io/documentation/)
- [Email Design Best Practices](https://www.retainful.com/blog/email-design-best-practice)

---

## Competitive Landscape

| Tool | What It Does | Our Differentiation |
|------|--------------|---------------------|
| [Migma.ai](https://migma.ai) | Full email builder SaaS (screenshot/Figma to email) | We're open-source, MCP-native; screenshot-to-email in Phase 3, Figma post-MVP |
| [mjml.ai](https://mjml.ai) | Web-based MJML editor | We work inside your AI chat |
| [Vibemail](https://github.com/vibe-mail) | Browser MJML editor | We're an MCP server, not a web app |
| Gmail MCP servers | Send/read emails | We design emails, not send them |

---

*Last updated: 2026-03-07*
