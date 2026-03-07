export interface ValidationResult {
  sizeKb: number;
  darkModeCompatible: boolean;
  mobileResponsive: boolean;
  accessibilityScore: number;
  checks: ValidationCheck[];
  passed: number;
  failed: number;
  warnings: number;
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const MAX_EMAIL_SIZE_KB = 102;

export function validateEmail(html: string): ValidationResult {
  const checks: ValidationCheck[] = [];

  // 1. Email size check
  const sizeKb = Math.round((Buffer.byteLength(html, 'utf8') / 1024) * 100) / 100;
  if (sizeKb > MAX_EMAIL_SIZE_KB) {
    checks.push({
      name: 'email-size',
      status: 'fail',
      message: `Email is ${sizeKb}KB — exceeds Gmail's ${MAX_EMAIL_SIZE_KB}KB clipping threshold.`,
    });
  } else if (sizeKb > MAX_EMAIL_SIZE_KB * 0.8) {
    checks.push({
      name: 'email-size',
      status: 'warn',
      message: `Email is ${sizeKb}KB — approaching Gmail's ${MAX_EMAIL_SIZE_KB}KB clipping threshold.`,
    });
  } else {
    checks.push({
      name: 'email-size',
      status: 'pass',
      message: `Email is ${sizeKb}KB — well within limits.`,
    });
  }

  // 2. Dark mode compatibility
  const hasDarkMeta = /color-scheme\s*:\s*[^;]*dark/i.test(html);
  if (hasDarkMeta) {
    checks.push({
      name: 'dark-mode',
      status: 'pass',
      message: 'Dark mode color-scheme declaration found.',
    });
  } else {
    checks.push({
      name: 'dark-mode',
      status: 'warn',
      message: 'No color-scheme dark mode declaration found. Add "color-scheme: light dark" for better dark mode support.',
    });
  }

  // 3. Images have alt text
  const imgRegex = /<img\b[^>]*>/gi;
  const images = html.match(imgRegex) || [];
  const imagesWithoutAlt = images.filter((img) => {
    const hasAlt = /\balt\s*=\s*"[^"]+"/i.test(img) || /\balt\s*=\s*'[^']+'/i.test(img);
    return !hasAlt;
  });

  if (images.length === 0) {
    checks.push({
      name: 'image-alt-text',
      status: 'pass',
      message: 'No images found (nothing to check).',
    });
  } else if (imagesWithoutAlt.length === 0) {
    checks.push({
      name: 'image-alt-text',
      status: 'pass',
      message: `All ${images.length} image(s) have alt text.`,
    });
  } else {
    checks.push({
      name: 'image-alt-text',
      status: 'fail',
      message: `${imagesWithoutAlt.length} of ${images.length} image(s) missing meaningful alt text.`,
    });
  }

  // 4. Links have href
  const linkRegex = /<a\b[^>]*>/gi;
  const links = html.match(linkRegex) || [];
  const emptyLinks = links.filter((link) => {
    return !/\bhref\s*=\s*"[^"]+"/i.test(link) && !/\bhref\s*=\s*'[^']+'/i.test(link);
  });

  if (links.length === 0) {
    checks.push({
      name: 'links-valid',
      status: 'warn',
      message: 'No links found in the email.',
    });
  } else if (emptyLinks.length === 0) {
    checks.push({
      name: 'links-valid',
      status: 'pass',
      message: `All ${links.length} link(s) have href attributes.`,
    });
  } else {
    checks.push({
      name: 'links-valid',
      status: 'fail',
      message: `${emptyLinks.length} of ${links.length} link(s) missing href attribute.`,
    });
  }

  // 5. Unsubscribe link
  const hasUnsubscribe = /unsubscribe/i.test(html);
  if (hasUnsubscribe) {
    checks.push({
      name: 'unsubscribe-link',
      status: 'pass',
      message: 'Unsubscribe link/text found in email.',
    });
  } else {
    checks.push({
      name: 'unsubscribe-link',
      status: 'warn',
      message: 'No unsubscribe link found. Most email regulations require one.',
    });
  }

  // 6. Text-to-image ratio (rough heuristic)
  const textContent = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const textLength = textContent.length;
  const imageCount = images.length;

  if (imageCount > 0 && textLength < 100) {
    checks.push({
      name: 'text-image-ratio',
      status: 'fail',
      message: 'Very little text relative to images. Aim for 80:20 text-to-image ratio to avoid spam filters.',
    });
  } else if (imageCount > 0 && textLength < 300) {
    checks.push({
      name: 'text-image-ratio',
      status: 'warn',
      message: 'Low text-to-image ratio. Consider adding more text content.',
    });
  } else {
    checks.push({
      name: 'text-image-ratio',
      status: 'pass',
      message: 'Text-to-image ratio looks good.',
    });
  }

  // 7. Viewport meta tag (mobile)
  const hasViewport = /viewport/i.test(html);
  checks.push({
    name: 'mobile-viewport',
    status: hasViewport ? 'pass' : 'warn',
    message: hasViewport
      ? 'Viewport meta tag found for mobile rendering.'
      : 'No viewport meta tag found. MJML usually adds this automatically.',
  });

  // 8. Preheader text check
  const hasPreheader = /preheader|preview.?text/i.test(html);
  checks.push({
    name: 'preheader-text',
    status: hasPreheader ? 'pass' : 'warn',
    message: hasPreheader
      ? 'Preheader/preview text found.'
      : 'No preheader text detected. Adding hidden preview text improves open rates in inbox previews.',
  });

  // 9. HTML title tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const hasTitle = titleMatch && titleMatch[1].trim().length > 0;
  checks.push({
    name: 'html-title',
    status: hasTitle ? 'pass' : 'warn',
    message: hasTitle
      ? 'HTML title tag found.'
      : 'Empty or missing <title> tag. Some email clients show this in the subject line area.',
  });

  // 10. Inline styles present (email best practice)
  const hasInlineStyles = /style\s*=\s*"/i.test(html);
  checks.push({
    name: 'inline-styles',
    status: hasInlineStyles ? 'pass' : 'warn',
    message: hasInlineStyles
      ? 'Inline styles detected (good for email client compatibility).'
      : 'No inline styles found. Many email clients strip <style> blocks — inline styles are more reliable.',
  });

  // Calculate scores
  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;

  // Accessibility score: simple percentage based on pass ratio
  const accessibilityScore = Math.round((passed / checks.length) * 100);

  return {
    sizeKb,
    darkModeCompatible: hasDarkMeta,
    mobileResponsive: hasViewport,
    accessibilityScore,
    checks,
    passed,
    failed,
    warnings,
  };
}
