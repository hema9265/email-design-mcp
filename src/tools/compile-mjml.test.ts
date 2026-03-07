import { describe, it, expect } from 'vitest';
import { compileMjmlHandler } from './compile-mjml.js';

const VALID_MJML = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello from MCP</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

describe('compileMjmlHandler', () => {
  it('returns compiled HTML in MCP response format', async () => {
    const result = await compileMjmlHandler({ mjml: VALID_MJML });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.html).toContain('Hello from MCP');
    expect(parsed.sizeKb).toBeGreaterThan(0);
  });

  it('returns error response for invalid MJML', async () => {
    const result = await compileMjmlHandler({ mjml: '<div>bad</div>' });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
    expect(parsed.hint).toBeDefined();
  });

  it('includes size in KB', async () => {
    const result = await compileMjmlHandler({ mjml: VALID_MJML });
    const parsed = JSON.parse(result.content[0].text);

    expect(typeof parsed.sizeKb).toBe('number');
    expect(parsed.sizeKb).toBeLessThan(102); // well under Gmail clip limit
  });
});
