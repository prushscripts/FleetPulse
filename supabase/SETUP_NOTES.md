## Role Access Codes (Multi-tenant)

Access codes now live in the `companies` table:
- `manager_access_code`
- `driver_access_code`

### Apply the migration
1. Open Supabase SQL editor
2. Run: `supabase/add-role-access-codes.sql`

### Regenerating codes
Managers can view/copy (and Premium can regenerate) codes from:
`/dashboard/control-panel`

Regenerating a code invalidates the old code for **new signups only**.
Existing accounts are not affected.

## Inspection photo storage bucket
Create Supabase Storage bucket:
- Name: `inspection-photos`
- Public: enabled
