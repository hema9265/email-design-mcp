import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { saveBrand, loadBrand, listBrands } from '../lib/storage.js';
import { extractBrandFromUrl, pickBrandColors } from '../lib/brand-extractor.js';
import type { BrandProfile } from '../types/brand.js';

export const setupBrandSchema = z.object({
  name: z.string().optional().describe('Brand name. Auto-detected from website if url is provided.'),
  url: z.string().optional().describe('Brand website URL. If provided, colors/fonts/logo are auto-extracted from the site.'),
  primary_color: z.string().optional().describe('Primary brand color (hex, e.g., "#FF6B35"). Auto-extracted if url is provided.'),
  secondary_color: z.string().optional().describe('Secondary color (hex). Defaults to a muted version of primary.'),
  accent_color: z.string().optional().describe('Accent color (hex). Defaults to primary.'),
  background_color: z.string().optional().describe('Background color (hex). Defaults to "#ffffff".'),
  text_color: z.string().optional().describe('Text color (hex). Defaults to "#1a1a1a".'),
  heading_font: z.string().optional().describe('Heading font family. Defaults to "Arial".'),
  body_font: z.string().optional().describe('Body font family. Defaults to "Arial".'),
  logo: z.string().optional().describe('Logo image URL. Auto-extracted if url is provided.'),
  industry: z.string().optional().describe('Industry (e.g., "e-commerce", "SaaS", "healthcare")'),
  audience: z.string().optional().describe('Target audience (e.g., "young professionals", "enterprise buyers")'),
  tone: z.enum(['formal', 'casual', 'friendly', 'professional']).optional().describe('Brand voice tone. Defaults to "professional".'),
});

export async function setupBrandHandler(args: z.infer<typeof setupBrandSchema>) {
  // If neither name nor url provided, error
  if (!args.name && !args.url) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: 'Provide at least a brand name or a website URL.',
            hint: 'Use url to auto-extract brand details, or provide name and primary_color manually.',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  let extracted: {
    name?: string;
    logo?: string;
    colors: string[];
    fonts: string[];
    description?: string;
  } | null = null;

  let extractionNote = '';

  // Auto-extract from URL if provided
  if (args.url) {
    try {
      extracted = await extractBrandFromUrl(args.url);
      const parts: string[] = [];
      if (extracted.colors.length > 0) parts.push(`${extracted.colors.length} colors`);
      if (extracted.fonts.length > 0) parts.push(`${extracted.fonts.length} fonts`);
      if (extracted.logo) parts.push('logo');
      if (extracted.name) parts.push('name');
      extractionNote = parts.length > 0
        ? `Auto-extracted from ${args.url}: ${parts.join(', ')}.`
        : `Fetched ${args.url} but couldn't extract brand details. Using provided/default values.`;
    } catch (err) {
      extractionNote = `Could not fetch ${args.url}: ${err instanceof Error ? err.message : 'unknown error'}. Using provided/default values.`;
    }
  }

  // Merge: explicit args override extracted values
  const brandColors = extracted ? pickBrandColors(extracted.colors) : null;

  const brandName = args.name || extracted?.name || 'My Brand';
  const primaryColor = args.primary_color || brandColors?.primary || '#2563eb';

  const now = new Date().toISOString();

  const brand: BrandProfile = {
    id: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || randomUUID(),
    url: args.url || '',
    name: brandName,
    colors: {
      primary: primaryColor,
      secondary: args.secondary_color || brandColors?.secondary || adjustColor(primaryColor, 0.3),
      accent: args.accent_color || brandColors?.accent || primaryColor,
      background: args.background_color || '#ffffff',
      text: args.text_color || '#1a1a1a',
    },
    fonts: {
      heading: args.heading_font || (extracted?.fonts[0]) || 'Arial',
      body: args.body_font || (extracted?.fonts[1] || extracted?.fonts[0]) || 'Arial',
    },
    logo: args.logo || extracted?.logo,
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
            ...(extractionNote ? { extraction: extractionNote } : {}),
            ...(extracted?.colors.length ? { extractedColors: extracted.colors } : {}),
            ...(extracted?.fonts.length ? { extractedFonts: extracted.fonts } : {}),
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
