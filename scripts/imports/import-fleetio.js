const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Use service_role key for import (bypasses RLS)
// Get this from Supabase Dashboard → Settings → API → service_role secret key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  console.error('For imports, add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role secret key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importFleetioData() {
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '..', '..', 'data', 'fleetio-service-reminder-export-2026-02-19.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Found ${parsed.data.length} rows in CSV`);

    // Extract unique vehicles (group by Vehicle Name)
    const vehicleMap = new Map();

    parsed.data.forEach((row) => {
      const vehicleName = row['Vehicle Name']?.trim();
      if (!vehicleName) return;

      const currentMeter = parseFloat(row['Vehicle Current Meter']) || 0;
      const serviceTask = row['Service Task']?.trim() || '';
      const isOilChange = serviceTask.toLowerCase().includes('oil');
      
      // If vehicle not seen yet
      if (!vehicleMap.has(vehicleName)) {
        const nextDueMeter = parseFloat(row['Next Due Meter']) || 0;
        const dueMeter = parseFloat(row['Due Meter']) || 0;
        
        // For oil change due mileage, prioritize oil change service tasks
        let oilChangeDue = 0;
        if (isOilChange) {
          oilChangeDue = nextDueMeter || dueMeter || currentMeter + 5000;
        } else {
          oilChangeDue = currentMeter + 5000; // Default fallback
        }

        vehicleMap.set(vehicleName, {
          code: vehicleName,
          make: row['Vehicle Make']?.trim() || null,
          model: row['Vehicle Model']?.trim() || null,
          year: row['Vehicle Year'] ? parseInt(row['Vehicle Year']) : null,
          current_mileage: Math.round(currentMeter),
          oil_change_due_mileage: Math.round(oilChangeDue),
          license_plate: row['State Plate']?.trim() || null,
          vin: row['Vehicle VIN/SN']?.trim() || null,
          notes: row['Reason for inactivity']?.trim() || null,
        });
      } else {
        // Update existing vehicle
        const existing = vehicleMap.get(vehicleName);
        
        // Update current mileage if this row has higher mileage
        if (currentMeter > existing.current_mileage) {
          existing.current_mileage = Math.round(currentMeter);
        }
        
        // Update oil change due mileage if this is an oil change reminder
        if (isOilChange) {
          const nextDueMeter = parseFloat(row['Next Due Meter']) || 0;
          const dueMeter = parseFloat(row['Due Meter']) || 0;
          const oilChangeDue = nextDueMeter || dueMeter;
          if (oilChangeDue > 0) {
            existing.oil_change_due_mileage = Math.round(oilChangeDue);
          }
        }
        
        // Update other fields if they're missing
        if (!existing.make && row['Vehicle Make']?.trim()) {
          existing.make = row['Vehicle Make'].trim();
        }
        if (!existing.model && row['Vehicle Model']?.trim()) {
          existing.model = row['Vehicle Model'].trim();
        }
        if (!existing.year && row['Vehicle Year']) {
          existing.year = parseInt(row['Vehicle Year']);
        }
        if (!existing.vin && row['Vehicle VIN/SN']?.trim()) {
          existing.vin = row['Vehicle VIN/SN'].trim();
        }
        if (!existing.license_plate && row['State Plate']?.trim()) {
          existing.license_plate = row['State Plate'].trim();
        }
      }
    });

    const vehicles = Array.from(vehicleMap.values());
    console.log(`\nExtracted ${vehicles.length} unique vehicles:`);
    vehicles.forEach(v => {
      console.log(`  - ${v.code}: ${v.current_mileage} mi (oil due: ${v.oil_change_due_mileage} mi)`);
    });

    // Insert vehicles into Supabase
    console.log('\nImporting vehicles into Supabase...');
    const { data, error } = await supabase
      .from('vehicles')
      .upsert(vehicles, {
        onConflict: 'code',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error importing vehicles:', error);
      return;
    }

    console.log(`\n✅ Successfully imported ${data.length} vehicles!`);
    console.log('\nVehicles imported:');
    data.forEach(v => {
      console.log(`  - ${v.code} (ID: ${v.id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

importFleetioData();
