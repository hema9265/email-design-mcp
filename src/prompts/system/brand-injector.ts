import type { BrandProfile } from '../../types/brand.js';

export function buildBrandContext(brand: BrandProfile): string {
  return `## BRAND CONTEXT

You are designing an email for **${brand.name}**.

### Brand Colors
- Primary (use for CTAs and key highlights): ${brand.colors.primary}
- Secondary (use for accents and secondary elements): ${brand.colors.secondary}
- Accent (use sparingly for emphasis): ${brand.colors.accent}
- Background: ${brand.colors.background}
- Text: ${brand.colors.text}

### Typography
- Heading font: ${brand.fonts.heading}, Arial, sans-serif
- Body font: ${brand.fonts.body}, Arial, sans-serif

${brand.logo ? `### Logo\nLogo URL: ${brand.logo}` : '### Logo\nNo logo provided — omit logo section or use a text-based header with the brand name.'}

### Voice & Tone
- Industry: ${brand.industry}
- Target audience: ${brand.audience}
- Tone: ${brand.tone}

### Brand Rules
- Use the primary color ONLY for CTA buttons and key highlights
- Use the secondary color for section backgrounds, borders, accents
- Body text must use the text color on the background color
- Maintain the ${brand.tone} tone throughout all copy
- Write copy appropriate for the ${brand.industry} industry and ${brand.audience} audience`;
}

export function buildNoBrandContext(): string {
  return `## BRAND CONTEXT

No brand profile is configured. Use a clean, professional default style:
- Primary color: #2563EB (blue)
- Background: #ffffff
- Text: #1a1a1a
- Font: Arial, sans-serif
- Tone: professional and friendly

The user can set up a brand profile using the \`setup_brand\` tool for personalized emails.`;
}
