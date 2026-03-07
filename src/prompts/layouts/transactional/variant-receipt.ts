export const TRANSACTIONAL_RECEIPT = {
  name: 'receipt',
  description: 'Payment receipt/invoice with detailed line items and payment info',
  instructions: `### Layout: Payment Receipt

Structure the email in this exact order:
1. **Header** — Logo centered, minimal padding
2. **Receipt headline** — "Payment Receipt" or "Invoice" with receipt/invoice number
3. **Payment summary** — Date, payment method (e.g., "Visa ending in 4242"), and status
4. **Line items** — Detailed table with description, quantity, unit price, and line total
5. **Totals** — Subtotal, tax, discounts (if any), and grand total
6. **Billing info** — Billing name and address
7. **Primary CTA** — "Download PDF" or "View Receipt" button
8. **Support** — "Questions about this charge?" link
9. **Footer** — Company info, legal text, unsubscribe link

Design notes:
- Use clean table formatting with alternating subtle row backgrounds
- Right-align monetary values
- Bold the grand total row
- Include a receipt number for reference
- Professional, accountant-friendly layout`,
};
