const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Read the CSV files
const reginfoPath = path.join(__dirname, '..', '..', 'data', 'reginfo.csv');
const reginfoContent = fs.readFileSync(reginfoPath, 'utf-8');

// Parse CSV
const reginfoData = Papa.parse(reginfoContent, {
  header: true,
  skipEmptyLines: true,
});

console.log('=== Analyzing Voyager Vehicle ID to Truck Code Mapping ===\n');

// Create a map of Gas Card to Vehicle Name
const gasCardToVehicle = new Map();
const vehicleToGasCard = new Map();

reginfoData.data.forEach((row) => {
  const vehicleName = row['Vehicle Name']?.trim();
  const gasCard = row['Gas Card']?.trim();
  
  const licensePlate = row['Vehicle License Plate']?.trim();
  
  const vin = row['Vehicle VIN/SN']?.trim();
  
  const statePlate = row['State Plate']?.trim();
  
  if (vehicleName && gasCard) {
    // Store both directions
    gasCardToVehicle.set(gasCard, {
      vehicleName,
      licensePlate,
      vin,
      statePlate,
      fullGasCard: gasCard
    });
    vehicleToGasCard.set(vehicleName, gasCard);
  }
});

console.log(`Found ${gasCardToVehicle.size} vehicles with Gas Card numbers\n`);

// Show sample mappings
console.log('Sample Gas Card → Vehicle Mappings:');
let count = 0;
for (const [gasCard, vehicle] of gasCardToVehicle.entries()) {
  if (count++ < 10) {
    console.log(`  Gas Card: ${gasCard.padEnd(25)} → Vehicle: ${vehicle.vehicleName}`);
  }
}

console.log('\n=== IMPORTANT FINDINGS ===');
console.log('\n1. Voyager Report Structure:');
console.log('   - Card # column: Shows card numbers (e.g., 700175, 700178)');
console.log('   - Vehicle ID column: Shows vehicle IDs (e.g., 00473340, 00058341)');
console.log('   - Actual Odometer column: Shows mileage entered at pump');

console.log('\n2. Your CSV Structure:');
console.log('   - Vehicle Name: Truck codes (e.g., z611, z658)');
console.log('   - Gas Card: Full card numbers (e.g., "86949 5606 00212 9")');

console.log('\n3. Matching Strategy:');
console.log('   OPTION A: Match by Card #');
console.log('   - Extract last digits from Voyager Card # (e.g., "700178" → "178")');
console.log('   - Match against Gas Card last digits in CSV');
console.log('   - Example: Voyager Card "700178" might match Gas Card ending in "178"');

console.log('\n   OPTION B: Match by Vehicle ID (if available in Voyager)');
console.log('   - Voyager Vehicle ID might map to your vehicle codes');
console.log('   - Need to check if Vehicle ID correlates with truck numbers');

console.log('\n4. Recommended Approach:');
console.log('   - Use Voyager Card # to match vehicles');
console.log('   - Create mapping table: Voyager Card # → FleetPulse Vehicle Code');
console.log('   - When processing CSV from Voyager:');
console.log('     * Extract Card # from Voyager report');
console.log('     * Look up corresponding vehicle in mapping table');
console.log('     * Update vehicle mileage from "Actual Odometer" column');

console.log('\n=== NEXT STEPS ===');
console.log('1. Download Voyager CSV report (daily scheduled)');
console.log('2. Parse CSV to extract: Card #, Vehicle ID, Actual Odometer, Date');
console.log('3. Match Card # to FleetPulse vehicle using mapping table');
console.log('4. Update vehicle.current_mileage with Actual Odometer value');
console.log('5. Log update in voyager_mileage_updates table');

console.log('\n=== SAMPLE MAPPING DATA ===');
console.log('\nTo create the mapping, you\'ll need to:');
console.log('1. Export a Voyager report with both Card # and Vehicle ID');
console.log('2. Match Card # to your Gas Card numbers in CSV');
console.log('3. Create voyager_card_mappings entries in FleetPulse Admin Panel');

// Show vehicles that might match common patterns
console.log('\n=== VEHICLES WITH GAS CARDS ===');
const vehiclesWithCards = Array.from(vehicleToGasCard.entries())
  .slice(0, 20)
  .map(([vehicle, card]) => ({ vehicle, card }));

vehiclesWithCards.forEach(({ vehicle, card }) => {
  // Extract potential card number (last few digits before check digit)
  const cardParts = card.split(' ');
  const lastPart = cardParts[cardParts.length - 1];
  console.log(`  ${vehicle.padEnd(10)} → Gas Card: ${card.padEnd(25)} (last digits: ${lastPart})`);
});

console.log('\n✅ Analysis complete!');
console.log('\n💡 TIP: When you get a Voyager CSV, we can build a script to:');
console.log('   1. Parse the Voyager CSV');
console.log('   2. Match Card # to vehicles');
console.log('   3. Update mileage automatically');
