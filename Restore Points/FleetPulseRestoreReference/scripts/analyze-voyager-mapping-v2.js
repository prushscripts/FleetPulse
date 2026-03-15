const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Read both files
const voyagerPath = path.join(__dirname, '..', 'Reports', 'Transaction_acct_detail_report_03_04.txt');
const reginfoPath = path.join(__dirname, '..', 'reginfo.csv');

const voyagerContent = fs.readFileSync(voyagerPath, 'utf-8');
const reginfoContent = fs.readFileSync(reginfoPath, 'utf-8');

// Parse CSVs
const voyagerData = Papa.parse(voyagerContent, {
  header: true,
  skipEmptyLines: true,
});

const reginfoData = Papa.parse(reginfoContent, {
  header: true,
  skipEmptyLines: true,
});

console.log('=== Analyzing Voyager to FleetPulse Mapping ===\n');

// Extract unique Card IDs and Vehicle IDs from Voyager
const voyagerCards = new Map();
const voyagerVehicles = new Map();

voyagerData.data.forEach((row) => {
  const cardId = row['Card ID']?.trim();
  const vehicleId = row['Vehicle ID']?.trim();
  const odometer = row['Actual Odometer']?.trim();
  
  if (cardId && !voyagerCards.has(cardId)) {
    voyagerCards.set(cardId, {
      vehicleId: vehicleId,
      sampleOdometer: odometer,
      count: 0
    });
  }
  if (cardId) {
    const card = voyagerCards.get(cardId);
    if (card) card.count++;
  }
  
  if (vehicleId && !voyagerVehicles.has(vehicleId)) {
    voyagerVehicles.set(vehicleId, {
      cardIds: new Set(),
      sampleOdometer: odometer
    });
  }
  if (vehicleId && cardId) {
    const vehicle = voyagerVehicles.get(vehicleId);
    if (vehicle) vehicle.cardIds.add(cardId);
  }
});

console.log(`Found ${voyagerCards.size} unique Card IDs in Voyager report`);
console.log(`Found ${voyagerVehicles.size} unique Vehicle IDs in Voyager report\n`);

// Extract vehicles from reginfo CSV
const fleetVehicles = new Map();
reginfoData.data.forEach((row) => {
  const vehicleName = row['Vehicle Name']?.trim();
  const gasCard = row['Gas Card']?.trim();
  
  if (vehicleName && gasCard) {
    fleetVehicles.set(vehicleName, {
      gasCard: gasCard,
      // Extract last 3-4 digits from gas card for matching
      gasCardSuffix: gasCard.split(' ').pop()?.slice(-3) || '',
      gasCardLast4: gasCard.replace(/\s/g, '').slice(-4)
    });
  }
});

console.log(`Found ${fleetVehicles.size} vehicles with Gas Cards in reginfo.csv\n`);

// Try to match patterns
console.log('=== MATCHING ANALYSIS ===\n');

console.log('Sample Voyager Card IDs:');
let count = 0;
for (const [cardId, data] of voyagerCards.entries()) {
  if (count++ < 10) {
    console.log(`  Card ID: ${cardId.padEnd(10)} → Vehicle ID: ${data.vehicleId.padEnd(10)} (${data.count} transactions)`);
  }
}

console.log('\nSample FleetPulse Vehicles:');
count = 0;
for (const [vehicleName, data] of fleetVehicles.entries()) {
  if (count++ < 10) {
    console.log(`  ${vehicleName.padEnd(15)} → Gas Card: ${data.gasCard.padEnd(25)} (last 4: ${data.gasCardLast4})`);
  }
}

console.log('\n=== KEY FINDINGS ===\n');

console.log('1. Voyager Report Structure:');
console.log('   - Card ID: e.g., "700178", "700175", "700006"');
console.log('   - Vehicle ID: e.g., "000477", "000474", "000205"');
console.log('   - Actual Odometer: Mileage entered at pump');

console.log('\n2. FleetPulse Structure:');
console.log('   - Vehicle Code: e.g., "z611", "z477", "z474"');
console.log('   - Gas Card: e.g., "86949 5606 00263 2"');

console.log('\n3. MATCHING STRATEGY:');
console.log('\n   OPTION A: Match by Vehicle ID → z-number');
console.log('   - Voyager Vehicle ID "000477" might map to FleetPulse "z477"');
console.log('   - Voyager Vehicle ID "000474" might map to FleetPulse "z474"');
console.log('   - Pattern: Remove leading zeros, add "z" prefix');

console.log('\n   OPTION B: Match by Card ID → Gas Card → Vehicle');
console.log('   - Need to find relationship between Card ID and Gas Card numbers');
console.log('   - Card ID "700178" → Find matching Gas Card → Find Vehicle');

console.log('\n=== TESTING VEHICLE ID PATTERN ===\n');

// Test if Vehicle ID maps to z-numbers
const vehicleIdMatches = [];
voyagerVehicles.forEach((data, vehicleId) => {
  // Remove leading zeros
  const numPart = vehicleId.replace(/^0+/, '');
  // Try to find matching z-number
  const possibleZNumber = `z${numPart}`;
  
  if (fleetVehicles.has(possibleZNumber)) {
    vehicleIdMatches.push({
      voyagerVehicleId: vehicleId,
      fleetPulseCode: possibleZNumber,
      gasCard: fleetVehicles.get(possibleZNumber).gasCard,
      cardIds: Array.from(data.cardIds)
    });
  }
});

if (vehicleIdMatches.length > 0) {
  console.log(`✅ FOUND ${vehicleIdMatches.length} MATCHES using Vehicle ID pattern!\n`);
  console.log('Matches:');
  vehicleIdMatches.slice(0, 20).forEach(match => {
    console.log(`  Voyager Vehicle ID "${match.voyagerVehicleId}" → FleetPulse "${match.fleetPulseCode}"`);
    console.log(`    Gas Card: ${match.gasCard}`);
    console.log(`    Card IDs: ${match.cardIds.join(', ')}\n`);
  });
} else {
  console.log('❌ No matches found using Vehicle ID pattern');
  console.log('   Need to investigate Card ID → Gas Card mapping instead\n');
}

console.log('\n=== RECOMMENDATION ===\n');
if (vehicleIdMatches.length > 0) {
  console.log('✅ USE VEHICLE ID PATTERN!');
  console.log('   - Voyager Vehicle ID "000477" → FleetPulse "z477"');
  console.log('   - Voyager Vehicle ID "000474" → FleetPulse "z474"');
  console.log('   - Simply remove leading zeros and add "z" prefix');
  console.log('\n   Process:');
  console.log('   1. Parse Voyager CSV');
  console.log('   2. Extract Vehicle ID (e.g., "000477")');
  console.log('   3. Convert to FleetPulse code: "z" + Vehicle ID without leading zeros');
  console.log('   4. Update vehicle mileage from "Actual Odometer" column');
} else {
  console.log('⚠️  Need to investigate Card ID → Gas Card relationship');
  console.log('   - May need manual mapping table');
  console.log('   - Or check if Card ID maps to Gas Card numbers');
}

console.log('\n✅ Analysis complete!');
