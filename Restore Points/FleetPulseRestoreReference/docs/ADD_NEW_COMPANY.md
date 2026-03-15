# Adding a New Company to FleetPulse

FleetPulse uses **company authentication keys** so users can join the right tenant. Each company has a unique key (e.g. `WheelzUpAPD2026`, `prushlogisticsroadmap`).

## Create a new company (one-time per company)

1. Open **Supabase** → **SQL Editor** → **New query**.
2. Run:

```sql
INSERT INTO companies (id, name, auth_key)
VALUES (
  uuid_generate_v4(),
  'Your Company Display Name',
  'yourcompanykey'
)
ON CONFLICT (auth_key) DO NOTHING;
```

- **name**: What shows in the app (e.g. "Prush Logistics Group LLC").
- **auth_key**: The code users type in Settings → My Companies. Use a single word or slug (e.g. `prushlogisticsroadmap`, `acmefleet2026`). No spaces.

3. Click **Run**.

## How users attach to the company

- **Signup:** Optional "Company invite code" — if they enter the key, they’re linked to that company.
- **Already signed up:** Settings → **My Companies** → "Add another company" → enter the key. They can then switch between companies via the company switcher in the top bar.

## Prush Logistics (this project)

- Company name: **Prush Logistics Group LLC**
- Auth key: **prushlogisticsroadmap**

SQL to add it is in `supabase/add-prush-logistics-company.sql`. Run that file in the Supabase SQL Editor if you haven’t already.
