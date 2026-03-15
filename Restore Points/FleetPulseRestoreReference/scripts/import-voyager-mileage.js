const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Convert Voyager Vehicle ID to FleetPulse vehicle code
 * Example: "000477" → "z477"
 */
function vehicleIdToCode(vehicleId) {
  if (!vehicleId) return null;
  // Remove leading zeros and add "z" prefix
  const numPart = vehicleId.replace(/^0+/, '');
  return numPart ? `z${numPart}` : null;
}

/**
 * Parse Voyager CSV and update vehicle mileage
 */
async function importVoyagerMileage(csvFilePath) {
  try {
    console.log('=== Voyager Mileage Import ===\n');
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Found ${parsed.data.length} transactions in Voyager CSV\n`);

    // Get all vehicles from FleetPulse
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, code, current_mileage');

    if (vehiclesError) throw vehiclesError;

    const vehicleMap = new Map();
    vehicles.forEach(v => {
      vehicleMap.set(v.code.toLowerCase(), v);
    });

    console.log(`Found ${vehicles.length} vehicles in FleetPulse\n`);

    // Process transactions - find highest mileage per vehicle
    const vehicleHighestMileage = new Map(); // vehicleCode -> { mileage, transactionDate, cardId, invoiceNumber }
    const skipped = [];
    const errors = [];

    for (const row of parsed.data) {
      const vehicleId = row['Vehicle ID']?.trim();
      const odometerStr = row['Actual Odometer']?.trim();
      const transactionDate = row['Transaction Occurred Date']?.trim();
      const cardId = row['Card ID']?.trim();
      const invoiceNumber = row['Invoice Number']?.trim();

      // Skip invalid odometer readings
      if (!odometerStr || odometerStr === '0' || odometerStr === '123456' || odometerStr === '555' || odometerStr === '5555' || odometerStr === '55555') {
        skipped.push({ vehicleId, reason: 'Invalid odometer', odometer: odometerStr });
        continue;
      }

      const odometer = parseInt(odometerStr);
      if (isNaN(odometer) || odometer <= 0) {
        skipped.push({ vehicleId, reason: 'Invalid odometer value', odometer: odometerStr });
        continue;
      }

      // Convert Vehicle ID to FleetPulse code
      const vehicleCode = vehicleIdToCode(vehicleId);
      if (!vehicleCode) {
        skipped.push({ vehicleId, reason: 'Could not convert Vehicle ID', odometer });
        continue;
      }

      // Find vehicle
      const vehicle = vehicleMap.get(vehicleCode.toLowerCase());
      if (!vehicle) {
        skipped.push({ vehicleId, vehicleCode, reason: 'Vehicle not found in FleetPulse', odometer });
        continue;
      }

      // Parse Voyager date format (MMDDYYYY, e.g., "02032026")
      let parsedDate = null;
      if (transactionDate && transactionDate.length === 8) {
        try {
          const month = parseInt(transactionDate.substring(0, 2));
          const day = parseInt(transactionDate.substring(2, 4));
          const year = parseInt(transactionDate.substring(4, 8));
          parsedDate = new Date(year, month - 1, day).toISOString();
        } catch (e) {
          parsedDate = new Date().toISOString();
        }
      } else {
        parsedDate = new Date().toISOString();
      }

      // Track highest mileage per vehicle
      const existing = vehicleHighestMileage.get(vehicleCode);
      if (!existing || odometer > existing.mileage) {
        vehicleHighestMileage.set(vehicleCode, {
          vehicleId: vehicle.id,
          vehicleCode,
          mileage: odometer,
          transactionDate: parsedDate,
          cardId,
          invoiceNumber,
          oldMileage: vehicle.current_mileage,
        });
      }
    }

    // Build updates list - only vehicles where CSV mileage is higher than current
    const updates = [];
    vehicleHighestMileage.forEach((data, vehicleCode) => {
      if (data.mileage > data.oldMileage) {
        updates.push(data);
      } else {
        skipped.push({ vehicleCode, reason: 'Mileage not higher than current', current: data.oldMileage, odometer: data.mileage });
      }
    });

    console.log(`\n=== Processing Updates ===\n`);
    console.log(`Found ${updates.length} vehicles to update`);
    console.log(`Skipped ${skipped.length} transactions\n`);

    // Update vehicles
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        // Update vehicle mileage
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ current_mileage: update.newMileage })
          .eq('id', update.vehicleId);

        if (updateError) throw updateError;

        // Log to voyager_mileage_updates table
        const { error: logError } = await supabase
          .from('voyager_mileage_updates')
          .insert({
            card_number: update.cardId || null,
            vehicle_id: update.vehicleId,
            mileage: update.newMileage,
            transaction_date: update.transactionDate,
            transaction_id: update.invoiceNumber || null,
            raw_data: {
              vehicle_code: update.vehicleCode,
              old_mileage: update.oldMileage,
              card_id: update.cardId,
            },
          });

        if (logError) {
          console.warn(`Warning: Could not log update for ${update.vehicleCode}:`, logError.message);
        }

        console.log(`✅ ${update.vehicleCode}: ${update.oldMileage} → ${update.newMileage} mi`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating ${update.vehicleCode}:`, error.message);
        errors.push({ vehicleCode: update.vehicleCode, error: error.message });
        errorCount++;
      }
    }

    // Show vehicles found in CSV vs FleetPulse
    const vehiclesFound = new Map();
    vehicleHighestMileage.forEach((data, vehicleCode) => {
      vehiclesFound.set(vehicleCode, {
        csvMileage: data.mileage,
        fleetPulseMileage: data.oldMileage,
        needsUpdate: data.mileage > data.oldMileage
      });
    });

    console.log(`\n=== Summary ===\n`);
    console.log(`✅ Successfully updated: ${successCount} vehicles`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${skipped.length} transactions`);
    
    if (vehiclesFound.size > 0) {
      console.log(`\n=== Vehicles Found in CSV ===`);
      console.log(`Found ${vehiclesFound.size} vehicles in CSV (showing first 20):\n`);
      let count = 0;
      vehiclesFound.forEach((data, vehicleCode) => {
        if (count++ < 20) {
          const status = data.needsUpdate ? '✅ UPDATE' : '⏭️  SKIP';
          console.log(`  ${status} ${vehicleCode.padEnd(8)} CSV: ${String(data.csvMileage).padStart(8)} | FleetPulse: ${String(data.fleetPulseMileage).padStart(8)}`);
        }
      });
      if (vehiclesFound.size > 20) {
        console.log(`  ... and ${vehiclesFound.size - 20} more`);
      }
    }

    if (skipped.length > 0) {
      console.log(`\nSkipped transactions (showing first 30):`);
      skipped.slice(0, 30).forEach(s => {
        if (s.vehicleCode) {
          console.log(`  ${s.vehicleCode}: ${s.reason}${s.current ? ` (current: ${s.current}, new: ${s.odometer})` : ''}`);
        } else {
          console.log(`  Vehicle ID ${s.vehicleId}: ${s.reason}`);
        }
      });
      if (skipped.length > 30) {
        console.log(`  ... and ${skipped.length - 30} more`);
      }
    }

    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(e => {
        console.log(`  ${e.vehicleCode}: ${e.error}`);
      });
    }

    console.log(`\n✅ Import complete!`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run import
const csvPath = process.argv[2] || path.join(__dirname, '..', 'Reports', 'Transaction_acct_detail_report_03_04.txt');

if (!fs.existsSync(csvPath)) {
  console.error(`Error: CSV file not found: ${csvPath}`);
  console.error(`Usage: node import-voyager-mileage.js <path-to-voyager-csv>`);
  process.exit(1);
}

importVoyagerMileage(csvPath);
