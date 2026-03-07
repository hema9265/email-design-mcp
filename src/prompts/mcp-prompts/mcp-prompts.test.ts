import { describe, it, expect } from 'vitest';
import { buildWelcomePromptMessages, WELCOME_PROMPT_DESCRIPTION } from './welcome.js';
import { buildNewsletterPromptMessages, NEWSLETTER_PROMPT_DESCRIPTION } from './newsletter.js';
import { buildPromotionalPromptMessages, PROMOTIONAL_PROMPT_DESCRIPTION } from './promotional.js';
import { buildTransactionalPromptMessages, TRANSACTIONAL_PROMPT_DESCRIPTION } from './transactional.js';
import type { BrandProfile } from '../../types/brand.js';

const testBrand: BrandProfile = {
  id: 'test-brand',
  url: 'https://example.com',
  name: 'TestCo',
  colors: {
    primary: '#FF6B35',
    secondary: '#1A1A2E',
    accent: '#E94560',
    background: '#FFFFFF',
    text: '#333333',
  },
  fonts: { heading: 'Inter', body: 'Open Sans' },
  industry: 'technology',
  audience: 'developers',
  tone: 'professional',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MCP Prompts', () => {
  describe('welcome-email', () => {
    it('should have a description', () => {
      expect(WELCOME_PROMPT_DESCRIPTION).toBeTruthy();
    });

    it('should build messages with default args', () => {
      const result = buildWelcomePromptMessages({});
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('welcome');
    });

    it('should inject brand context when provided', () => {
      const result = buildWelcomePromptMessages({ brand_name: 'TestCo' }, testBrand);
      expect(result.messages[0].content.text).toContain('TestCo');
      expect(result.messages[0].content.text).toContain('#FF6B35');
    });

    it('should use custom args', () => {
      const result = buildWelcomePromptMessages({
        brand_name: 'Acme',
        subscriber_benefit: 'weekly tips',
        cta_text: 'Join Now',
        tone: 'casual',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('Acme');
      expect(text).toContain('weekly tips');
      expect(text).toContain('Join Now');
      expect(text).toContain('casual');
    });
  });

  describe('newsletter', () => {
    it('should have a description', () => {
      expect(NEWSLETTER_PROMPT_DESCRIPTION).toBeTruthy();
    });

    it('should build messages with default args', () => {
      const result = buildNewsletterPromptMessages({});
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('newsletter');
    });

    it('should accept style preference', () => {
      const result = buildNewsletterPromptMessages({ style: 'digest' });
      expect(result.messages[0].content.text).toContain('digest');
    });
  });

  describe('promotional', () => {
    it('should have a description', () => {
      expect(PROMOTIONAL_PROMPT_DESCRIPTION).toBeTruthy();
    });

    it('should build messages with custom offer', () => {
      const result = buildPromotionalPromptMessages({
        offer: '50% off',
        deadline: 'Ends tonight',
        product: 'winter collection',
      });
      const text = result.messages[0].content.text;
      expect(text).toContain('50% off');
      expect(text).toContain('Ends tonight');
      expect(text).toContain('winter collection');
    });
  });

  describe('transactional', () => {
    it('should have a description', () => {
      expect(TRANSACTIONAL_PROMPT_DESCRIPTION).toBeTruthy();
    });

    it('should build messages with transaction type', () => {
      const result = buildTransactionalPromptMessages({
        transaction_type: 'shipping',
      });
      expect(result.messages[0].content.text).toContain('shipping');
    });

    it('should inject brand context', () => {
      const result = buildTransactionalPromptMessages({}, testBrand);
      expect(result.messages[0].content.text).toContain('#FF6B35');
      expect(result.messages[0].content.text).toContain('TestCo');
    });
  });
});
