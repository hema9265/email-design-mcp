import { WELCOME_HERO_CTA } from './welcome/variant-hero-cta.js';
import { WELCOME_STORY_DRIVEN } from './welcome/variant-story-driven.js';
import { WELCOME_MINIMALIST } from './welcome/variant-minimalist.js';
import { NEWSLETTER_MAGAZINE } from './newsletter/variant-magazine.js';
import { NEWSLETTER_DIGEST } from './newsletter/variant-digest.js';
import { NEWSLETTER_EDITORIAL } from './newsletter/variant-editorial.js';
import { PROMO_COUNTDOWN } from './promotional/variant-countdown.js';
import { PROMO_PRODUCT_GRID } from './promotional/variant-product-grid.js';
import { PROMO_SINGLE_HERO } from './promotional/variant-single-hero.js';
import { TRANSACTIONAL_ORDER_CONFIRMATION } from './transactional/variant-order-confirmation.js';
import { TRANSACTIONAL_SHIPPING } from './transactional/variant-shipping-notification.js';
import { TRANSACTIONAL_RECEIPT } from './transactional/variant-receipt.js';
import type { EmailType } from '../../types/email.js';

export interface LayoutVariant {
  name: string;
  description: string;
  instructions: string;
}

const layoutVariants: Record<string, LayoutVariant[]> = {
  welcome: [WELCOME_HERO_CTA, WELCOME_STORY_DRIVEN, WELCOME_MINIMALIST],
  newsletter: [NEWSLETTER_MAGAZINE, NEWSLETTER_DIGEST, NEWSLETTER_EDITORIAL],
  promotional: [PROMO_COUNTDOWN, PROMO_PRODUCT_GRID, PROMO_SINGLE_HERO],
  transactional: [TRANSACTIONAL_ORDER_CONFIRMATION, TRANSACTIONAL_SHIPPING, TRANSACTIONAL_RECEIPT],
};

export function getLayoutVariants(emailType: EmailType): LayoutVariant[] {
  return layoutVariants[emailType] || [];
}

export function selectLayoutVariant(
  emailType: EmailType,
  preferredStyle?: string,
  lastUsedVariant?: string,
): LayoutVariant | null {
  const variants = getLayoutVariants(emailType);
  if (variants.length === 0) return null;

  // If user specified a style preference, try to match it
  if (preferredStyle) {
    const match = variants.find(
      (v) =>
        v.name.includes(preferredStyle.toLowerCase()) ||
        v.description.toLowerCase().includes(preferredStyle.toLowerCase()),
    );
    if (match) return match;
  }

  // Rotate: pick a different variant than the last one used
  if (lastUsedVariant) {
    const available = variants.filter((v) => v.name !== lastUsedVariant);
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }

  // Default: random selection
  return variants[Math.floor(Math.random() * variants.length)];
}
