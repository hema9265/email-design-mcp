# email-design-mcp

An MCP server that enables AI assistants to design and generate professional email templates.

## Architecture

Read `ARCHITECTURE.md` for the full design document. Key points:

- **MCP server** using `@modelcontextprotocol/sdk` with stdio transport
- **MJML** for email template generation (compiles to responsive HTML)
- **TypeScript** + Node.js runtime
- **Zod** for input validation
- **Vitest** for testing
- Storage at `~/.email-design-mcp/` (JSON files, no DB)

## Project Structure

```
src/
  index.ts              # Entry point, MCP server setup
  tools/                # MCP tool handlers (one file per tool)
  resources/            # MCP resource handlers
  prompts/              # Prompt engineering layer (system prompts, design rules, layouts)
  preview/              # Email preview (live server + screenshot)
  lib/                  # Core logic (compiler, validator, storage, brand extraction)
  templates/            # Bundled MJML templates
  types/                # TypeScript type definitions
```

## Development Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode (tsx)
npm test               # Run tests (vitest)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

## Code Conventions

- Use **named exports** (no default exports)
- Use **Zod** for all tool input schemas
- **Error handling**: return structured error responses, never throw unhandled
- File naming: **kebab-case** (e.g., `setup-brand.ts`, `email-validator.ts`)
- One tool per file in `src/tools/`
- Keep prompt text in `src/prompts/`, not inline in tool handlers
- Use `const` over `let` where possible
- Prefer explicit types over `any`

## MCP Tool Pattern

Each tool follows this pattern:

```typescript
import { z } from 'zod';

export const myToolSchema = z.object({
  input: z.string().describe('Description for the AI'),
});

export async function myToolHandler(args: z.infer<typeof myToolSchema>) {
  // Implementation
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
  };
}
```

Tools are registered in `src/index.ts` using the MCP SDK's `server.tool()` method.

## Testing

- Test files go next to source files: `foo.ts` → `foo.test.ts`
- Use **vitest** — `describe/it/expect` pattern
- Mock external dependencies (file system, network)
- Snapshot tests for prompt assembly and template compilation

## Build Phases

Phases 1-4 complete. Currently at **Phase 5: Enhancements (post-MVP)**
- See ARCHITECTURE.md for full phase details

## Key Dependencies

- `@modelcontextprotocol/sdk` — MCP server SDK
- `mjml` — Email template framework
- `zod` — Schema validation
- `vitest` — Testing (dev)
- `typescript` — Language (dev)
- `tsx` — Dev runner (dev)

## Don'ts

- Don't call external AI APIs — the host model does the generation
- Don't use default exports
- Don't put prompt text inline in tool handlers
- Don't use `any` type without justification
- Don't store data in the project directory — use `~/.email-design-mcp/`
