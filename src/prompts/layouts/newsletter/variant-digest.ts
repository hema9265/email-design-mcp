export const NEWSLETTER_DIGEST = {
  name: 'digest',
  description: 'Numbered list of links with brief descriptions',
  instructions: `### Layout: Digest Style

Structure the email in this exact order:
1. **Header** — Logo + "Weekly Digest" or similar title + date
2. **Introduction** — 1-2 sentences setting context ("Here's what happened this week...")
3. **Numbered list** — 5-7 items, each with:
   - Number (bold, in primary color)
   - Headline (linked)
   - 1-line description
   - Subtle divider between items
4. **Bonus/tip section** (optional) — Quick tip or quote in a highlighted box
5. **Footer** — Social links, unsubscribe

Design notes:
- No images in the list — text-only for fast scanning
- Numbers create visual rhythm and scannability
- Each item should feel distinct — use spacing and dividers
- Highlighted box: use secondary color background with padding
- This layout works great for content-heavy brands`,
};
