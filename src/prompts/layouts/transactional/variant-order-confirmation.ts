export const TRANSACTIONAL_ORDER_CONFIRMATION = {
  name: 'order-confirmation',
  description: 'Clean order confirmation with itemized details and tracking CTA',
  instructions: `### Layout: Order Confirmation

Structure the email in this exact order:
1. **Header** — Logo centered, minimal padding
2. **Confirmation message** — Bold "Order Confirmed" headline with a brief thank-you message
3. **Order details** — Order number, date, and an itemized table showing products, quantities, and prices
4. **Order total** — Subtotal, shipping, and total amount
5. **Shipping address** — Delivery address block
6. **Primary CTA** — "View Order" or "Track Order" button
7. **Support** — "Questions? Contact support" link
8. **Footer** — Company info, unsubscribe link

Design notes:
- Keep it clean, professional, and scannable
- Use a subtle background color (#f9f9f9) for the order details section
- Minimal imagery — this is informational, not promotional
- Use consistent, aligned table formatting for line items
- Footer should be minimal`,
};
