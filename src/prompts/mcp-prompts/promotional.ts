import { z } from 'zod';
import type { BrandProfile } from '../../types/brand.js';

export const PROMOTIONAL_PROMPT_DESCRIPTION = 'Guided workflow to create a promotional/sale email with urgency and offers';

export const promotionalPromptSchema = z.object({
  brand_name: z.string().optional().describe('Brand or company name'),
  offer: z.string().optional().describe('The offer or discount (e.g., "50% off", "Buy one get one free")'),
  deadline: z.string().optional().describe('Offer deadline or urgency text (e.g., "Ends Sunday", "24 hours only")'),
  product: z.string().optional().describe('Product or category being promoted'),
  cta_text: z.string().optional().describe('Call-to-action button text (e.g., "Shop Now", "Claim Offer")'),
  style: z.string().optional().describe('Layout style: countdown, product-grid, or single-hero'),
});

export const PROMOTIONAL_PROMPT_ARGS = promotionalPromptSchema.shape;

export function buildPromotionalPromptMessages(
  args: Record<string, string | undefined>,
  brand?: BrandProfile | null,
) {
  const brandName = args.brand_name || brand?.name || '[Your Brand]';
  const offer = args.offer || '20% off everything';
  const deadline = args.deadline || 'Limited time only';
  const product = args.product || 'our entire collection';
  const ctaText = args.cta_text || 'Shop Now';
  const style = args.style || 'single-hero';

  const brandContext = brand
    ? `\nUse these brand settings:
- Colors: primary ${brand.colors.primary}, secondary ${brand.colors.secondary}, accent ${brand.colors.accent}, background ${brand.colors.background}, text ${brand.colors.text}
- Fonts: heading "${brand.fonts.heading}", body "${brand.fonts.body}"
- Industry: ${brand.industry}
- Audience: ${brand.audience}`
    : '';

  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Create a promotional email for ${brandName} with the following details:

- **Offer**: ${offer}
- **Deadline**: ${deadline}
- **Product/Category**: ${product}
- **CTA button text**: "${ctaText}"
- **Layout style**: ${style}
${brandContext}

Please use the generate_email tool with type "promotional" and style "${style}", then compile_mjml to get the HTML. After that, use validate_email to check the output.

Suggested generate_email prompt: "Create a promotional email for ${brandName} advertising ${offer} on ${product}. Add urgency with '${deadline}'. Use '${ctaText}' as the primary CTA. Make the offer impossible to miss with bold typography and the brand's primary color for the hero section."`,
        },
      },
    ],
  };
}
