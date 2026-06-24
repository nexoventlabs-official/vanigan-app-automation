const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getPostingModel, getConnection } = require('../services/memberDb');

async function run() {
  try {
    const Posting = await getPostingModel();
    console.log('Clearing existing postings (roles) in the database...');
    const deleteResult = await Posting.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} old postings.`);

    const roles = [
      // State Level
      'State President', 'State Vice President', 'State Secretary', 'State Joint Secretary', 'State Treasurer', 'State Joint Treasurer',
      // Assembly Level
      'Assembly President', 'Assembly Vice President', 'Assembly Secretary', 'Assembly Joint Secretary', 'Assembly Treasurer', 'Assembly Joint Treasurer',
      // District Level
      'District President', 'District Vice President', 'District Secretary', 'District Joint Secretary', 'District Treasurer', 'District Joint Treasurer',
      // Zone Level
      'Zone President', 'Zone Vice President', 'Zone Secretary', 'Zone Joint Secretary', 'Zone Treasurer', 'Zone Joint Treasurer',
      // Area Level
      'Area President', 'Area Vice President', 'Area Secretary', 'Area Joint Secretary', 'Area Treasurer', 'Area Joint Treasurer'
    ];

    console.log('Seeding new 30 roles...');
    const seedDocs = roles.map(name => ({ name }));
    const insertResult = await Posting.insertMany(seedDocs);
    console.log(`Successfully seeded ${insertResult.length} new postings/roles.`);

  } catch (err) {
    console.error('Seeding Error:', err);
  } finally {
    const conn = await getConnection().catch(() => null);
    if (conn) {
      await conn.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}

run();
