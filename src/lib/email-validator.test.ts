import { describe, it, expect } from 'vitest';
import { validateEmail } from './email-validator.js';

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width"></head>
<body>
  <p>Hello world</p>
  <a href="https://example.com">Link</a>
  <a href="https://example.com/unsubscribe">Unsubscribe</a>
</body>
</html>`;

const FULL_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to Our Brand</title>
  <meta name="viewport" content="width=device-width">
  <style>:root { color-scheme: light dark; }</style>
</head>
<body>
  <div class="preheader" style="display:none;">Preview text for inbox</div>
  <h1 style="font-size:24px;">Welcome!</h1>
  <p>This is a test email with enough text content to pass the ratio check. We want to make sure that
  the validator sees enough text here to consider the text-to-image ratio acceptable. Adding more text
  to get past the 300 character threshold for the check to pass cleanly.</p>
  <img src="https://placehold.co/600x300" alt="Hero image" />
  <a href="https://example.com">Visit us</a>
  <a href="https://example.com/unsubscribe">Unsubscribe</a>
</body>
</html>`;

describe('validateEmail', () => {
  it('should pass all checks for a well-formed email', () => {
    const result = validateEmail(FULL_HTML);
    expect(result.failed).toBe(0);
    expect(result.darkModeCompatible).toBe(true);
    expect(result.mobileResponsive).toBe(true);
    expect(result.accessibilityScore).toBeGreaterThanOrEqual(80);
  });

  it('should detect missing dark mode support', () => {
    const result = validateEmail(MINIMAL_HTML);
    const darkCheck = result.checks.find((c) => c.name === 'dark-mode');
    expect(darkCheck?.status).toBe('warn');
    expect(result.darkModeCompatible).toBe(false);
  });

  it('should detect images without alt text', () => {
    const html = `<html><body><img src="test.png"><img src="test2.png" alt="Good"></body></html>`;
    const result = validateEmail(html);
    const altCheck = result.checks.find((c) => c.name === 'image-alt-text');
    expect(altCheck?.status).toBe('fail');
    expect(altCheck?.message).toContain('1 of 2');
  });

  it('should detect missing unsubscribe link', () => {
    const html = `<html><body><p>Hello</p></body></html>`;
    const result = validateEmail(html);
    const unsubCheck = result.checks.find((c) => c.name === 'unsubscribe-link');
    expect(unsubCheck?.status).toBe('warn');
  });

  it('should detect links without href', () => {
    const html = `<html><body><a>Bad link</a><a href="https://example.com">Good link</a></body></html>`;
    const result = validateEmail(html);
    const linkCheck = result.checks.find((c) => c.name === 'links-valid');
    expect(linkCheck?.status).toBe('fail');
  });

  it('should warn on large email size', () => {
    const bigHtml = '<html><body>' + 'x'.repeat(110 * 1024) + '</body></html>';
    const result = validateEmail(bigHtml);
    const sizeCheck = result.checks.find((c) => c.name === 'email-size');
    expect(sizeCheck?.status).toBe('fail');
  });

  it('should return correct pass/fail/warning counts', () => {
    const result = validateEmail(FULL_HTML);
    expect(result.passed + result.failed + result.warnings).toBe(result.checks.length);
  });
});
