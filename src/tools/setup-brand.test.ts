import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupBrandHandler } from './setup-brand.js';

// Mock storage
vi.mock('../lib/storage.js', () => ({
  saveBrand: vi.fn(),
  loadBrand: vi.fn().mockResolvedValue(null),
  listBrands: vi.fn().mockResolvedValue([]),
}));

// Mock brand extractor
vi.mock('../lib/brand-extractor.js', () => ({
  extractBrandFromUrl: vi.fn().mockResolvedValue({
    name: 'Example Site',
    logo: 'https://example.com/logo.png',
    colors: ['#e74c3c', '#3498db', '#2ecc71'],
    fonts: ['Roboto', 'Open Sans'],
    description: 'An example website',
  }),
  pickBrandColors: vi.fn().mockReturnValue({
    primary: '#e74c3c',
    secondary: '#3498db',
    accent: '#2ecc71',
  }),
}));

describe('setup-brand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a brand with minimal inputs', async () => {
    const result = await setupBrandHandler({
      name: 'Test Brand',
      primary_color: '#FF6B35',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.brand.name).toBe('Test Brand');
    expect(parsed.brand.id).toBe('test-brand');
    expect(parsed.brand.colors.primary).toBe('#FF6B35');
    expect(parsed.brand.colors.background).toBe('#ffffff');
    expect(parsed.brand.tone).toBe('professional');
  });

  it('creates a brand with all inputs', async () => {
    const result = await setupBrandHandler({
      name: 'My Company',
      url: 'https://example.com',
      primary_color: '#2563EB',
      secondary_color: '#10B981',
      accent_color: '#F59E0B',
      background_color: '#f8f9fa',
      text_color: '#333333',
      heading_font: 'Georgia',
      body_font: 'Verdana',
      logo: 'https://example.com/logo.png',
      industry: 'SaaS',
      audience: 'developers',
      tone: 'casual',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.brand.colors.secondary).toBe('#10B981');
    expect(parsed.brand.fonts.heading).toBe('Georgia');
    expect(parsed.brand.industry).toBe('SaaS');
    expect(parsed.brand.tone).toBe('casual');
  });

  it('generates a secondary color from primary when not provided', async () => {
    const result = await setupBrandHandler({
      name: 'Auto Color',
      primary_color: '#000000',
    });

    const parsed = JSON.parse(result.content[0].text);
    // Black lightened by 30% should give a gray
    expect(parsed.brand.colors.secondary).not.toBe('#000000');
    expect(parsed.brand.colors.secondary).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('derives a kebab-case id from the brand name', async () => {
    const result = await setupBrandHandler({
      name: 'My Awesome Brand!',
      primary_color: '#FF0000',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.brand.id).toBe('my-awesome-brand');
  });

  it('errors when neither name nor url is provided', async () => {
    const result = await setupBrandHandler({});

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('name or a website URL');
  });

  it('auto-extracts brand details from url', async () => {
    const result = await setupBrandHandler({
      url: 'https://example.com',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.brand.name).toBe('Example Site');
    expect(parsed.brand.colors.primary).toBe('#e74c3c');
    expect(parsed.brand.fonts.heading).toBe('Roboto');
    expect(parsed.brand.fonts.body).toBe('Open Sans');
    expect(parsed.brand.logo).toBe('https://example.com/logo.png');
    expect(parsed.extraction).toContain('Auto-extracted');
    expect(parsed.extractedColors).toEqual(['#e74c3c', '#3498db', '#2ecc71']);
  });

  it('explicit args override extracted values', async () => {
    const result = await setupBrandHandler({
      url: 'https://example.com',
      name: 'Override Name',
      primary_color: '#FF0000',
      heading_font: 'Inter',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.brand.name).toBe('Override Name');
    expect(parsed.brand.colors.primary).toBe('#FF0000');
    expect(parsed.brand.fonts.heading).toBe('Inter');
    // Body font should still come from extraction
    expect(parsed.brand.fonts.body).toBe('Open Sans');
  });
});
