export const MJML_GUIDE_PROMPT = `## MJML SYNTAX GUIDE

You MUST generate valid MJML markup. Follow these rules exactly:

### STRUCTURE
Every email must follow this structure:
\`\`\`mjml
<mjml>
  <mj-head>
    <mj-attributes>
      <!-- Global style defaults -->
    </mj-attributes>
    <mj-style>
      /* CSS overrides */
    </mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <!-- Content components -->
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
\`\`\`

### KEY COMPONENTS
- \`<mj-section>\` — horizontal row container (like a table row)
- \`<mj-column>\` — vertical column inside a section (1-4 columns per section)
- \`<mj-text>\` — text content (supports inline HTML)
- \`<mj-image>\` — responsive image (always set width and alt)
- \`<mj-button>\` — call-to-action button
- \`<mj-divider>\` — horizontal rule
- \`<mj-spacer>\` — vertical spacing
- \`<mj-social>\` — social media icons
- \`<mj-wrapper>\` — groups sections with shared background

### DO's
- Always wrap content in \`<mj-section>\` → \`<mj-column>\`
- Set \`width\` on \`<mj-image>\` (default container is 600px)
- Use \`padding\` attribute on sections/columns for spacing
- Use \`<mj-attributes>\` in \`<mj-head>\` for global defaults
- Use \`font-family\` with web-safe fallbacks: \`'Custom Font', Arial, sans-serif\`
- Set \`background-color\` on \`<mj-body>\` for full-width background
- Use \`border-radius\` on \`<mj-button>\` for rounded buttons

### DON'Ts
- DON'T nest \`<mj-section>\` inside \`<mj-column>\` (sections are top-level only)
- DON'T use \`<mj-column>\` outside of \`<mj-section>\`
- DON'T use raw HTML outside of \`<mj-text>\` or \`<mj-raw>\`
- DON'T use CSS flexbox or grid (MJML handles layout)
- DON'T exceed 4 columns in a single section
- DON'T forget \`<mj-head>\` — it's required for attributes and styles
- DON'T use \`<style>\` tags directly — use \`<mj-style>\`

### COMMON PATTERNS

**Full-width background section:**
\`\`\`mjml
<mj-section background-color="#f4f4f4" full-width="full-width">
\`\`\`

**Two-column layout:**
\`\`\`mjml
<mj-section>
  <mj-column width="50%"><!-- Left --></mj-column>
  <mj-column width="50%"><!-- Right --></mj-column>
</mj-section>
\`\`\`

**Centered button:**
\`\`\`mjml
<mj-button background-color="#FF6B35" color="#ffffff" font-size="16px" padding="20px 0" border-radius="4px" href="#">
  Get Started
</mj-button>
\`\`\``;
