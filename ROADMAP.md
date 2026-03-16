# FleetPulse Template Marketplace Roadmap

## Marketplace architecture (future)

- Templates stored as JSON configs in a `templates` table.
- Each template includes layout JSON, feature flags, widget config, and color overrides.
- Premium templates are purchase-gated (one-time or subscription add-on).
- Partner template creators submit through a partner portal workflow.
- Purchases linked by `company_id + template_id` in a `purchases` table.
- Revenue share target: 70% creator / 30% FleetPulse.

