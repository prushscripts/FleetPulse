# Voyager CSV Import Guide

## How It Works

The Voyager Vehicle ID maps directly to your FleetPulse z-numbers:

**Pattern:** Remove leading zeros from Vehicle ID, then add "z" prefix

### Examples:
- Voyager Vehicle ID `"000477"` → FleetPulse `"z477"`
- Voyager Vehicle ID `"000474"` → FleetPulse `"z474"`
- Voyager Vehicle ID `"000611"` → FleetPulse `"z611"`
- Voyager Vehicle ID `"000205"` → FleetPulse `"z205"`

## How to Use

### 1. Download Voyager CSV Report

1. Log into Voyager
2. Go to **Reports** → **Transaction Detail Report**
3. Set date range (e.g., last 30 days)
4. Click **"Download as CSV"**
5. Save the file (e.g., `Transaction_acct_detail_report_03_04.txt`)

### 2. Run the Import Script

```bash
# Option 1: Use npm script (defaults to Reports folder)
npm run import-voyager

# Option 2: Specify custom file path
node scripts/import-voyager-mileage.js "path/to/your/voyager-report.csv"
```

### 3. What It Does

The script will:
1. ✅ Parse the Voyager CSV file
2. ✅ Extract Vehicle ID and Actual Odometer (mileage)
3. ✅ Convert Vehicle ID to FleetPulse code (e.g., "000477" → "z477")
4. ✅ Find matching vehicle in FleetPulse
5. ✅ Update vehicle mileage **only if new mileage is higher** than current
6. ✅ Log all updates to `voyager_mileage_updates` table for audit trail
7. ✅ Skip invalid odometer readings (0, 123456, 555, etc.)

### 4. Example Output

```
=== Voyager Mileage Import ===

Found 333 transactions in Voyager CSV

Found 200 vehicles in FleetPulse

=== Processing Updates ===

Found 45 vehicles to update
Skipped 288 transactions

✅ z477: 316372 → 317821 mi
✅ z611: 200000 → 200000 mi
✅ z474: 200000 → 317821 mi
...

=== Summary ===

✅ Successfully updated: 45 vehicles
❌ Errors: 0
⏭️  Skipped: 288 transactions

✅ Import complete!
```

## Scheduled Daily Import

### Option 1: Manual (Daily)
1. Download Voyager CSV report each morning
2. Run: `npm run import-voyager`
3. Done!

### Option 2: Automated (Future)
Once you have API access, we can:
- Set up automated daily CSV download
- Run import automatically
- Email you a summary

## What Gets Updated

- **Vehicle Mileage**: Updates `current_mileage` field
- **Only if higher**: Won't decrease mileage (only increases)
- **Audit Log**: All updates logged in `voyager_mileage_updates` table

## Skipped Transactions

The script will skip:
- Invalid odometer readings (0, 123456, 555, etc.)
- Vehicles not found in FleetPulse
- Transactions where mileage is lower than current mileage
- Missing Vehicle ID

## Troubleshooting

### "Vehicle not found in FleetPulse"
- Make sure the vehicle exists in FleetPulse with the correct z-number
- Check that Vehicle ID in Voyager matches (e.g., "000477" = "z477")

### "No vehicles updated"
- Check that vehicles exist in FleetPulse
- Verify Vehicle IDs in CSV match your z-numbers
- Check that odometer values are valid (not 0, 123456, etc.)

### "SUPABASE_SERVICE_ROLE_KEY not found"
- Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file
- Get it from: Supabase Dashboard → Settings → API → service_role secret key

## Files Created

- `scripts/import-voyager-mileage.js` - Import script
- `voyager_mileage_updates` table - Audit log (already exists)

## Next Steps

1. ✅ Test with your current CSV file
2. ✅ Set up daily manual import process
3. ⏳ Wait for Voyager API access for automation
4. ⏳ Build automated daily import system
