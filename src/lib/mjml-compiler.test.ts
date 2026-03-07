import { describe, it, expect } from 'vitest';
import { compileMjml } from './mjml-compiler.js';

const VALID_MJML = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello World</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const MJML_WITH_BUTTON = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">Welcome!</mj-text>
        <mj-button background-color="#FF6B35" href="https://example.com">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

describe('compileMjml', () => {
  it('compiles valid MJML to HTML', async () => {
    const result = await compileMjml(VALID_MJML);

    expect(result.html).toContain('Hello World');
    expect(result.html).toContain('<!doctype html>');
    expect(result.errors).toHaveLength(0);
  });

  it('produces responsive HTML with meta viewport', async () => {
    const result = await compileMjml(VALID_MJML);

    expect(result.html).toContain('viewport');
  });

  it('compiles MJML with buttons and styles', async () => {
    const result = await compileMjml(MJML_WITH_BUTTON);

    expect(result.html).toContain('Welcome!');
    expect(result.html).toContain('Get Started');
    expect(result.html).toContain('https://example.com');
    expect(result.errors).toHaveLength(0);
  });

  it('rejects completely invalid input', async () => {
    await expect(compileMjml('<div>not mjml</div>')).rejects.toThrow();
  });
});
