/**
 * voterDb.js
 * Read-only connection to the DigitalOcean voter_db MongoDB.
 * Voter schema: ass_1 … ass_234 collections
 * Document fields: ID, ASSEMBLY_NO, ASSEMBLY_NAME, VOTER_NAME, DISTRICT, GENDER, EPIC_NO, MOBILE_NUMBER
 */
const mongoose = require('mongoose');

let voterConn = null;
let collectionNames = [];

async function getConnection() {
  if (voterConn && voterConn.readyState === 1) return voterConn;

  const url = process.env.MONGO_VOTER_URL;
  if (!url) {
    console.warn('[voterDb] MONGO_VOTER_URL not set');
    return null;
  }

  try {
    voterConn = await mongoose.createConnection(url, {
      serverSelectionTimeoutMS: 8000,
      dbName: process.env.MONGO_VOTER_DB_NAME || 'voter_db',
    }).asPromise();
    console.log('[voterDb] connected');
    return voterConn;
  } catch (err) {
    console.error('[voterDb] connection failed:', err.message);
    return null;
  }
}

async function getCollectionNames() {
  if (collectionNames.length > 0) return collectionNames;

  const conn = await getConnection();
  if (!conn) return [];

  try {
    const db = conn.db;
    const cols = await db.listCollections().toArray();
    collectionNames = cols
      .map(c => c.name)
      .filter(n => /^ass_\d+$/.test(n))
      .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)));
    return collectionNames;
  } catch (err) {
    console.error('[voterDb] listCollections error:', err.message);
    return [];
  }
}

function normalise(doc) {
  if (!doc) return null;
  const row = JSON.parse(JSON.stringify(doc));
  const fullName = (row.VOTER_NAME || '').trim();
  return {
    epic_no:       (row.EPIC_NO || '').toUpperCase().trim(),
    name:          fullName,
    assembly_name: (row.ASSEMBLY_NAME || '').trim(),
    assembly_no:   String(row.ASSEMBLY_NO || ''),
    district:      (row.DISTRICT || '').trim(),
    gender:        (row.GENDER || '').trim(),
    mobile:        (row.MOBILE_NUMBER || '').trim(),
    voter_name:    fullName,
  };
}

/**
 * Find voter by EPIC number — searches all ass_N collections.
 * Returns normalised voter object or null.
 */
async function findByEpicNo(epicNo) {
  if (!epicNo) return null;
  const clean = epicNo.toUpperCase().trim();

  const conn = await getConnection();
  if (!conn) return null;

  const cols = await getCollectionNames();
  for (const colName of cols) {
    try {
      const doc = await conn.db.collection(colName).findOne({ EPIC_NO: clean });
      if (doc) return normalise(doc);
    } catch (err) {
      console.warn(`[voterDb] findByEpicNo error in ${colName}:`, err.message);
    }
  }
  return null;
}

module.exports = { findByEpicNo, getConnection };
