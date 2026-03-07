export const TRANSACTIONAL_SHIPPING = {
  name: 'shipping-notification',
  description: 'Shipping notification with tracking information and delivery estimate',
  instructions: `### Layout: Shipping Notification

Structure the email in this exact order:
1. **Header** — Logo centered, minimal padding
2. **Status headline** — Bold "Your Order Has Shipped!" with a brief message
3. **Tracking info** — Carrier name, tracking number (styled as a code/monospace block)
4. **Delivery estimate** — Expected delivery date prominently displayed
5. **Order summary** — Brief list of items shipped (no prices needed)
6. **Primary CTA** — "Track Package" button
7. **Support** — Help link for delivery issues
8. **Footer** — Company info, unsubscribe link

Design notes:
- Use a progress indicator or status bar visual if possible (shipped → in transit → delivered)
- Keep the tracking number easy to copy
- Delivery date should be prominent (larger font or highlighted background)
- Clean, minimal design — no marketing content`,
};
