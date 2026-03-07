import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateEmailHandler } from './generate-email.js';

vi.mock('../lib/storage.js', () => {
  const brand = {
    id: 'test-brand',
    url: 'https://example.com',
    name: 'Test Brand',
    colors: { primary: '#FF6B35', secondary: '#FFB088', accent: '#FF6B35', background: '#ffffff', text: '#1a1a1a' },
    fonts: { heading: 'Georgia', body: 'Arial' },
    industry: 'e-commerce',
    audience: 'young adults',
    tone: 'friendly' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  return {
    loadBrand: vi.fn().mockImplementation((id: string) =>
      id === 'test-brand' ? Promise.resolve(brand) : Promise.resolve(null),
    ),
    listBrands: vi.fn().mockResolvedValue([brand]),
    saveEmail: vi.fn(),
  };
});

describe('generate-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates context for a welcome email', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a welcome email for new subscribers',
      brand_id: 'test-brand',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.emailType).toBe('welcome');
    expect(parsed.brandId).toBe('test-brand');
    expect(parsed.systemPrompt).toContain('expert email designer');
    expect(parsed.systemPrompt).toContain('MJML');
    expect(parsed.systemPrompt).toContain('Test Brand');
    expect(parsed.systemPrompt).toContain('#FF6B35');
    expect(parsed.userInstruction).toContain('welcome');
  });

  it('auto-detects email type from prompt', async () => {
    const result = await generateEmailHandler({
      prompt: 'Send a promotional sale announcement for Black Friday',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.emailType).toBe('promotional');
  });

  it('detects newsletter type', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a weekly digest newsletter',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.emailType).toBe('newsletter');
  });

  it('detects transactional type', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create an order confirmation receipt',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.emailType).toBe('transactional');
  });

  it('falls back to custom type for unrecognized prompts', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create an email about our new podcast episode',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.emailType).toBe('custom');
  });

  it('returns error for unknown brand_id', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a welcome email',
      brand_id: 'nonexistent',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('not found');
  });

  it('uses default brand context when no brands exist', async () => {
    const { listBrands } = await import('../lib/storage.js');
    vi.mocked(listBrands).mockResolvedValueOnce([]);

    const result = await generateEmailHandler({
      prompt: 'Create a welcome email',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.brandId).toBe('none');
    expect(parsed.systemPrompt).toContain('No brand profile');
  });

  it('includes design rules in system prompt', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a welcome email',
      brand_id: 'test-brand',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.systemPrompt).toContain('Spacing Rules');
    expect(parsed.systemPrompt).toContain('Typography Rules');
    expect(parsed.systemPrompt).toContain('CTA Button Rules');
  });

  it('includes layout variant instructions', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a welcome email',
      type: 'welcome',
      brand_id: 'test-brand',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.layoutVariant).toBeDefined();
    expect(parsed.systemPrompt).toContain('Layout');
  });

  it('accepts a style preference', async () => {
    const result = await generateEmailHandler({
      prompt: 'Create a welcome email',
      type: 'welcome',
      style: 'minimalist',
      brand_id: 'test-brand',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.layoutVariant).toBe('minimalist');
  });
});
