import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { saveBrand, loadBrand, listBrands } from '../lib/storage.js';
import type { BrandProfile } from '../types/brand.js';

export const setupBrandSchema = z.object({
  name: z.string().describe('Brand name'),
  url: z.string().optional().describe('Brand website URL (for future auto-extraction)'),
  primary_color: z.string().describe('Primary brand color (hex, e.g., "#FF6B35")'),
  secondary_color: z.string().optional().describe('Secondary color (hex). Defaults to a muted version of primary.'),
  accent_color: z.string().optional().describe('Accent color (hex). Defaults to primary.'),
  background_color: z.string().optional().describe('Background color (hex). Defaults to "#ffffff".'),
  text_color: z.string().optional().describe('Text color (hex). Defaults to "#1a1a1a".'),
  heading_font: z.string().optional().describe('Heading font family. Defaults to "Arial".'),
  body_font: z.string().optional().describe('Body font family. Defaults to "Arial".'),
  logo: z.string().optional().describe('Logo image URL'),
  industry: z.string().optional().describe('Industry (e.g., "e-commerce", "SaaS", "healthcare")'),
  audience: z.string().optional().describe('Target audience (e.g., "young professionals", "enterprise buyers")'),
  tone: z.enum(['formal', 'casual', 'friendly', 'professional']).optional().describe('Brand voice tone. Defaults to "professional".'),
});

export async function setupBrandHandler(args: z.infer<typeof setupBrandSchema>) {
  const now = new Date().toISOString();

  const brand: BrandProfile = {
    id: args.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || randomUUID(),
    url: args.url || '',
    name: args.name,
    colors: {
      primary: args.primary_color,
      secondary: args.secondary_color || adjustColor(args.primary_color, 0.3),
      accent: args.accent_color || args.primary_color,
      background: args.background_color || '#ffffff',
      text: args.text_color || '#1a1a1a',
    },
    fonts: {
      heading: args.heading_font || 'Arial',
      body: args.body_font || 'Arial',
    },
    logo: args.logo,
    industry: args.industry || 'general',
    audience: args.audience || 'general audience',
    tone: args.tone || 'professional',
    createdAt: now,
    updatedAt: now,
  };

  // Check if brand with same id already exists — update it
  const existing = await loadBrand(brand.id);
  if (existing) {
    brand.createdAt = existing.createdAt;
  }

  await saveBrand(brand);

  const allBrands = await listBrands();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            success: true,
            message: existing
              ? `Brand "${brand.name}" updated successfully.`
              : `Brand "${brand.name}" saved successfully.`,
            brand,
            totalBrands: allBrands.length,
            hint: 'Use this brand with generate_email by setting brand_id to "' + brand.id + '".',
          },
          null,
          2,
        ),
      },
    ],
  };
}

/**
 * Simple color adjustment — lightens a hex color by a factor.
 * Used to auto-generate a secondary color from the primary.
 */
function adjustColor(hex: string, factor: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * factor));
  const newG = Math.min(255, Math.round(g + (255 - g) * factor));
  const newB = Math.min(255, Math.round(b + (255 - b) * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
