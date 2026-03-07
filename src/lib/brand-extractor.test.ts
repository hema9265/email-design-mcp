import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBrandFromUrl, pickBrandColors } from './brand-extractor.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Acme Corp - Build Amazing Things</title>
  <meta property="og:site_name" content="Acme Corp" />
  <meta name="description" content="We build amazing things for developers" />
  <meta name="theme-color" content="#e74c3c" />
  <link rel="apple-touch-icon" href="/apple-icon.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto" rel="stylesheet" />
  <style>
    :root {
      --primary-color: #3498db;
      --brand-accent: #2ecc71;
    }
    body { font-family: 'Inter', sans-serif; color: #333333; }
    .btn { background-color: #e74c3c; }
    h1 { font-family: 'Montserrat', sans-serif; }
  </style>
</head>
<body>
  <img src="/images/logo.svg" alt="Acme Logo" class="site-logo" />
  <h1>Welcome to Acme</h1>
  <a href="https://example.com" style="color: #9b59b6;">Link</a>
</body>
</html>`;

describe('brand-extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractBrandFromUrl', () => {
    it('extracts brand details from HTML', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_HTML),
      });

      const result = await extractBrandFromUrl('https://acme.com');

      expect(result.name).toBe('Acme Corp');
      expect(result.description).toBe('We build amazing things for developers');
      expect(result.logo).toBeTruthy();
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.fonts.length).toBeGreaterThan(0);
    });

    it('extracts colors from CSS variables and inline styles', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_HTML),
      });

      const result = await extractBrandFromUrl('https://acme.com');

      // Should find colors from CSS vars, theme-color, inline styles
      expect(result.colors).toContain('#3498db');
      expect(result.colors).toContain('#2ecc71');
      expect(result.colors).toContain('#e74c3c');
      expect(result.colors).toContain('#9b59b6');
    });

    it('extracts fonts from Google Fonts links and CSS', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_HTML),
      });

      const result = await extractBrandFromUrl('https://acme.com');

      expect(result.fonts).toContain('Inter');
      expect(result.fonts).toContain('Roboto');
    });

    it('filters out common non-brand colors', async () => {
      const html = `<html><head><title>Test</title></head><body>
        <div style="color: #ffffff; background-color: #000000;"></div>
        <div style="color: #333333; background-color: #f5f5f5;"></div>
        <div style="background-color: #ff5733;"></div>
      </body></html>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await extractBrandFromUrl('https://test.com');

      // Should only include #ff5733, not the common grays/blacks/whites
      expect(result.colors).toContain('#ff5733');
      expect(result.colors).not.toContain('#ffffff');
      expect(result.colors).not.toContain('#000000');
      expect(result.colors).not.toContain('#333333');
    });

    it('extracts name from title when og:site_name is missing', async () => {
      const html = `<html><head><title>Cool Startup - Homepage</title></head><body></body></html>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await extractBrandFromUrl('https://coolstartup.com');

      expect(result.name).toBe('Cool Startup');
    });

    it('prepends https:// if missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><head><title>Test</title></head><body></body></html>'),
      });

      await extractBrandFromUrl('example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object),
      );
    });

    it('throws on failed fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(extractBrandFromUrl('https://nonexistent.com')).rejects.toThrow('Failed to fetch');
    });

    it('extracts logo from img with logo class', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_HTML),
      });

      const result = await extractBrandFromUrl('https://acme.com');

      // Should find apple-touch-icon first, or the logo img
      expect(result.logo).toBeTruthy();
    });
  });

  describe('pickBrandColors', () => {
    it('returns defaults when no colors extracted', () => {
      const result = pickBrandColors([]);
      expect(result.primary).toBe('#2563eb');
      expect(result.secondary).toBe('#64748b');
      expect(result.accent).toBe('#f59e0b');
    });

    it('uses first color as primary', () => {
      const result = pickBrandColors(['#ff0000', '#00ff00', '#0000ff']);
      expect(result.primary).toBe('#ff0000');
      expect(result.secondary).toBe('#00ff00');
      expect(result.accent).toBe('#0000ff');
    });

    it('generates secondary from primary when only one color', () => {
      const result = pickBrandColors(['#ff0000']);
      expect(result.primary).toBe('#ff0000');
      expect(result.secondary).not.toBe('#ff0000');
      expect(result.accent).toBe('#ff0000');
    });
  });
});
