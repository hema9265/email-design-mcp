import * as cheerio from 'cheerio';

export interface ExtractedBrand {
  name?: string;
  logo?: string;
  colors: string[];
  fonts: string[];
  description?: string;
}

export async function extractBrandFromUrl(url: string): Promise<ExtractedBrand> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EmailDesignMCP/1.0)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${normalizedUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const name = extractName($, normalizedUrl);
  const logo = extractLogo($, normalizedUrl);
  const colors = extractColors($, html);
  const fonts = extractFonts($, html);
  const description = extractDescription($);

  return { name, logo, colors, fonts, description };
}

function extractName($: cheerio.CheerioAPI, url: string): string | undefined {
  // Try og:site_name first
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName) return ogSiteName.trim();

  // Try title tag — strip common suffixes
  const title = $('title').text().trim();
  if (title) {
    // "Acme Inc - Homepage" → "Acme Inc"
    const cleaned = title.split(/\s*[|\-–—]\s*/)[0].trim();
    if (cleaned) return cleaned;
  }

  // Fallback: derive from domain
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const domain = hostname.split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return undefined;
  }
}

function extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // Try common logo patterns
  const candidates: string[] = [];

  // apple-touch-icon (usually high-res logo)
  const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href');
  if (appleTouchIcon) candidates.push(appleTouchIcon);

  // og:image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) candidates.push(ogImage);

  // favicon
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
  if (favicon) candidates.push(favicon);

  // img tags with "logo" in class, id, src, or alt
  $('img').each((_, el) => {
    const img = $(el);
    const src = img.attr('src') || '';
    const alt = (img.attr('alt') || '').toLowerCase();
    const cls = (img.attr('class') || '').toLowerCase();
    const id = (img.attr('id') || '').toLowerCase();

    if (alt.includes('logo') || cls.includes('logo') || id.includes('logo') || src.toLowerCase().includes('logo')) {
      if (src) candidates.push(src);
    }
  });

  if (candidates.length === 0) return undefined;

  // Resolve relative URLs
  const best = candidates[0];
  return resolveUrl(best, baseUrl);
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function extractColors($: cheerio.CheerioAPI, html: string): string[] {
  const colorSet = new Set<string>();

  // 1. CSS custom properties (--primary-color, --brand-color, etc.)
  const cssVarRegex = /--[\w-]*(color|brand|primary|secondary|accent)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi;
  let match;
  while ((match = cssVarRegex.exec(html)) !== null) {
    const color = normalizeColor(match[2]);
    if (color) colorSet.add(color);
  }

  // 2. Inline style colors and background-colors
  const inlineColorRegex = /(?:background-color|color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi;
  while ((match = inlineColorRegex.exec(html)) !== null) {
    const color = normalizeColor(match[1]);
    if (color) colorSet.add(color);
  }

  // 3. Style block colors
  const styleBlocks = $('style').text() + ' ' + ($('link[rel="stylesheet"]').length > 0 ? '' : '');
  const styleColorRegex = /(?:background-color|color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi;
  while ((match = styleColorRegex.exec(styleBlocks)) !== null) {
    const color = normalizeColor(match[1]);
    if (color) colorSet.add(color);
  }

  // 4. Theme color meta tag
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) {
    const color = normalizeColor(themeColor);
    if (color) colorSet.add(color);
  }

  // Filter out common non-brand colors (pure white, black, grays)
  const filtered = Array.from(colorSet).filter((c) => {
    const lower = c.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000', '#333', '#333333', '#666', '#666666',
      '#999', '#999999', '#ccc', '#cccccc', '#eee', '#eeeeee', '#f5f5f5', '#fafafa',
      '#f8f8f8', '#f0f0f0', '#ddd', '#dddddd', '#aaa', '#aaaaaa', '#111', '#111111',
      '#222', '#222222', '#444', '#444444', '#555', '#555555', '#777', '#777777',
      '#888', '#888888', '#bbb', '#bbbbbb', '#e5e5e5'].includes(lower);
  });

  return filtered.slice(0, 10);
}

function extractFonts($: cheerio.CheerioAPI, html: string): string[] {
  const fontSet = new Set<string>();

  // 1. Google Fonts links (handles both css and css2 formats)
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    // css2 format: family=Inter:wght@400;700&family=Roboto
    // css format: family=Inter|Roboto:400,700
    const familyMatches = href.matchAll(/family=([^&:]+)/g);
    for (const m of familyMatches) {
      const families = m[1].split('|');
      for (const family of families) {
        fontSet.add(decodeURIComponent(family.replace(/\+/g, ' ').split(':')[0]));
      }
    }
  });

  // 2. font-family declarations in styles
  const fontFamilyRegex = /font-family\s*:\s*['"]?([^'";,}]+)/gi;
  const allStyles = $('style').text() + ' ' + html;
  let match;
  while ((match = fontFamilyRegex.exec(allStyles)) !== null) {
    const font = match[1].trim().replace(/['"]/g, '');
    // Skip generic families
    if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
      'inherit', 'initial', 'unset', '-apple-system', 'BlinkMacSystemFont'].includes(font.toLowerCase())) {
      fontSet.add(font);
    }
  }

  return Array.from(fontSet).slice(0, 5);
}

function extractDescription($: cheerio.CheerioAPI): string | undefined {
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) return metaDesc.trim();

  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) return ogDesc.trim();

  return undefined;
}

function normalizeColor(color: string): string | null {
  const hex = color.trim();
  // Normalize 3-char hex to 6-char
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  // Strip 8-char hex alpha channel
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
    return hex.slice(0, 7).toLowerCase();
  }
  return null;
}

export function pickBrandColors(colors: string[]): {
  primary: string;
  secondary: string;
  accent: string;
} {
  if (colors.length === 0) {
    return { primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' };
  }
  return {
    primary: colors[0],
    secondary: colors[1] || adjustBrightness(colors[0], 0.3),
    accent: colors[2] || colors[0],
  };
}

function adjustBrightness(hex: string, factor: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * factor));
  const newG = Math.min(255, Math.round(g + (255 - g) * factor));
  const newB = Math.min(255, Math.round(b + (255 - b) * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
