const mongoose = require('mongoose');
const { getOrganizerModel } = require('../services/memberDb');
require('dotenv').config();

async function run() {
  const businessUri = process.env.BUSINESS_MONGODB_URI;
  const memberUri = process.env.MEMBER_MONGODB_URI;
  
  if (!businessUri || !memberUri) {
    console.error('Missing BUSINESS_MONGODB_URI or MEMBER_MONGODB_URI');
    process.exit(1);
  }
  
  console.log('Connecting to old BUSINESS_MONGODB_URI...');
  const oldConn = await mongoose.createConnection(businessUri).asPromise();
  console.log('Connected to old DB.');
  
  const seedCol = oldConn.db.collection('seedorganizers');
  const oldSeedCount = await seedCol.countDocuments();
  console.log(`Total organizers in old seed collection: ${oldSeedCount}`);
  
  if (oldSeedCount === 0) {
    console.log('No organizers found to migrate.');
    await oldConn.close();
    process.exit(0);
  }
  
  const seedDocs = await seedCol.find({}).toArray();
  
  console.log('Connecting to new MEMBER_MONGODB_URI...');
  const Organizer = await getOrganizerModel();
  console.log('Connected to new DB.');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const doc of seedDocs) {
    const phoneDigits = String(doc.phone || '').replace(/\D/g, '');
    if (!phoneDigits) {
      console.log(`Skipping organizer ${doc.name} because of empty phone number.`);
      skipped++;
      continue;
    }
    
    // Check if organizer already exists in new DB
    const exists = await Organizer.findOne({ phone: phoneDigits }).lean();
    if (exists) {
      console.log(`Organizer with phone ${phoneDigits} (${doc.name}) already exists in new DB. Skipping.`);
      skipped++;
      continue;
    }
    
    let cleanRole = (doc.role || 'Organizer').trim();
    let extractedWing = (doc.assembly || 'General').trim();
    
    if (cleanRole.toLowerCase().includes(' of ')) {
      const parts = cleanRole.split(/\s+[Oo]f\s+/);
      if (parts.length >= 2) {
        cleanRole = parts[0].trim();
        extractedWing = parts.slice(1).join(' Of ').trim();
      }
    }
    
    if (extractedWing.toLowerCase().endsWith(' wing')) {
      extractedWing = extractedWing.substring(0, extractedWing.length - 5) + ' Wing';
    }
    
    if (extractedWing) {
      extractedWing = extractedWing
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.substring(1))
        .join(' ');
    }
    
    // Create new organizer record with active: false (status inactive)
    await Organizer.create({
      name: doc.name,
      description: doc.description || doc.role || '',
      role: cleanRole,
      district: 'Tamil Nadu State',
      assembly: extractedWing || 'General',
      phone: phoneDigits,
      email: doc.email || '',
      image: doc.image || '',
      imagePublicId: doc.imagePublicId || '',
      active: false, // FORCE INACTIVE AS REQUESTED
      isSeed: true
    });
    inserted++;
  }
  
  console.log(`Migration results: Inserted: ${inserted}, Skipped: ${skipped}`);
  
  // Remove (drop) the seedorganizers collection in old DB to clean up
  if (inserted > 0) {
    console.log('Removing migrated seedorganizers from old DB...');
    await seedCol.drop();
    console.log('Successfully dropped old seedorganizers collection.');
  }
  
  await oldConn.close();
  // Close connection in memberDb
  await mongoose.connection.close();
  
  console.log('Migration complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
