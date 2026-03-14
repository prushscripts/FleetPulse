# Voyager US Bank Fleet Gas Card Integration Setup

## Overview
This integration allows FleetPulse to automatically update vehicle mileage when drivers use Voyager gas cards at the pump. When a driver enters mileage at the pump, it will live-update the corresponding vehicle in FleetPulse.

## Setup Steps

### 1. Database Setup
Run the SQL script in Supabase to create the necessary tables:

```bash
# In Supabase SQL Editor, run:
supabase/voyager-integration.sql
```

This creates:
- `voyager_card_mappings` - Maps gas card numbers to vehicles
- `voyager_api_config` - Stores Voyager API credentials (admin-only)
- `voyager_mileage_updates` - Logs all mileage updates from Voyager

### 2. Mark User as Admin
To access the Admin Panel, you need to mark your user as an admin:

```sql
-- Replace 'your-user-id' with your actual user ID from auth.users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
) 
WHERE id = 'your-user-id';
```

Or via Supabase Dashboard:
1. Go to Authentication → Users
2. Find your user
3. Edit user metadata
4. Add: `"is_admin": true`

### 3. Access Admin Panel
Once marked as admin:
1. Log in to FleetPulse
2. Click "Admin" in the navbar (only visible to admins)
3. You'll see two tabs:
   - **Card Mappings**: Map gas card numbers to vehicles
   - **API Configuration**: Enter Voyager API credentials

### 4. Configure Card Mappings
1. Go to Admin Panel → Card Mappings tab
2. Click "Add Card Mapping"
3. Enter:
   - **Card Number**: e.g., "z611"
   - **Vehicle**: Select the vehicle this card is assigned to
   - **Notes**: Optional notes
   - **Active**: Check to enable this mapping
4. Click "Create"

### 5. Configure API Settings
**Note**: Wait until you receive your Voyager API key from upper management.

1. Go to Admin Panel → API Configuration tab
2. Enter:
   - **API Key**: Your Voyager API key (stored securely)
   - **API Endpoint**: Voyager API endpoint URL (if provided)
   - **Account ID**: Your Voyager account ID (if provided)
   - **Enable automatic mileage sync**: Check to enable live updates
3. Click "Save API Configuration"

## How It Works

### Current Flow (Manual)
1. Driver uses gas card (e.g., z611) at pump
2. Driver enters mileage at pump
3. **Currently**: You manually update mileage in FleetPulse

### Future Flow (Automated - After API Integration)
1. Driver uses gas card (e.g., z611) at pump
2. Driver enters mileage at pump
3. Voyager API sends webhook/transaction data to FleetPulse
4. FleetPulse looks up card number in `voyager_card_mappings`
5. Finds corresponding vehicle (e.g., vehicle code "Z611")
6. Automatically updates vehicle mileage
7. Logs update in `voyager_mileage_updates` table

## Next Steps (After Receiving API Key)

1. **API Integration**: We'll need to create:
   - Webhook endpoint to receive Voyager transaction data
   - Service to parse transaction data and extract mileage
   - Logic to match card numbers to vehicles and update mileage

2. **Testing**: Test with a single card/vehicle pair first

3. **Monitoring**: Check `voyager_mileage_updates` table to verify updates are working

## Security Notes

- API keys are stored securely in the database
- Only admins can access API configuration
- Only admins can create/edit card mappings
- All mileage updates are logged for audit purposes
- RLS (Row Level Security) policies ensure data isolation

## Troubleshooting

### "Admin" tab not showing in navbar
- Make sure you've marked your user as admin (see step 2)
- Refresh the page after updating user metadata

### Can't access Admin Panel
- Check that `is_admin` is set to `true` in your user metadata
- Try logging out and back in

### Card mapping not saving
- Ensure the vehicle exists in the vehicles table
- Check browser console for errors
- Verify you're logged in as an admin user

## Files Created

- `supabase/voyager-integration.sql` - Database schema
- `app/dashboard/admin/page.tsx` - Admin page (server component)
- `app/dashboard/admin/AdminClient.tsx` - Admin panel UI
- Updated `components/Navbar.tsx` - Added Admin link for admins

## Future Enhancements

- Real-time webhook processing
- Automatic mileage sync from Voyager API
- Email notifications for mileage updates
- Dashboard showing recent Voyager transactions
- Bulk import of card mappings via CSV
