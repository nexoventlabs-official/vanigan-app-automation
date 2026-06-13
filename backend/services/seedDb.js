/**
 * seedDb.js
 * READ-ONLY connection to BUSINESS_MONGODB_URI — the 18k seed business listings.
 * Never writes to this DB.
 */
const mongoose = require('mongoose');

let _conn = null;
let _connPromise = null;
let _SeedBusiness = null;

const SeedBusinessSchema = new mongoose.Schema({}, { strict: false, collection: 'businesses' });

function getSeedConnection() {
  if (_conn && _conn.readyState === 1) return Promise.resolve(_conn);
  if (_connPromise) return _connPromise;

  const uri = process.env.BUSINESS_MONGODB_URI;
  if (!uri) return Promise.resolve(null);

  _connPromise = mongoose
    .createConnection(uri, { serverSelectionTimeoutMS: 8000, socketTimeoutMS: 30000 })
    .asPromise()
    .then((conn) => {
      _conn = conn;
      _connPromise = null;
      console.log('[SeedDB] connected (read-only)');
      return conn;
    })
    .catch((err) => {
      _connPromise = null;
      console.warn('[SeedDB] connection failed:', err.message);
      return null;
    });

  return _connPromise;
}

async function getSeedBusinessModel() {
  if (_SeedBusiness) return _SeedBusiness;
  const conn = await getSeedConnection();
  if (!conn) return null;
  _SeedBusiness = conn.models['SeedBusiness'] || conn.model('SeedBusiness', SeedBusinessSchema);
  return _SeedBusiness;
}

/**
 * Query seed businesses with the same filter/sort/skip/limit as new businesses.
 * Returns plain objects with _id as string and a `isSeed: true` flag.
 */
async function findSeedBusinesses(filter = {}, { sort = { name: 1 }, skip = 0, limit = 60 } = {}) {
  const Model = await getSeedBusinessModel();
  if (!Model) return [];
  try {
    const docs = await Model.find(filter)
      .sort(sort).skip(skip).limit(limit)
      .lean().maxTimeMS(10000);
    return docs.map(d => ({ ...d, _id: d._id.toString(), isSeed: true }));
  } catch (err) {
    console.warn('[SeedDB] query failed:', err.message);
    return [];
  }
}

async function countSeedBusinesses(filter = {}) {
  const Model = await getSeedBusinessModel();
  if (!Model) return 0;
  try {
    return await Model.countDocuments(filter).maxTimeMS(10000);
  } catch (err) {
    console.warn('[SeedDB] count failed:', err.message);
    return 0;
  }
}

async function findSeedBusinessById(id) {
  const Model = await getSeedBusinessModel();
  if (!Model) return null;
  try {
    const doc = await Model.findById(id).lean().maxTimeMS(8000);
    if (!doc) return null;
    return { ...doc, _id: doc._id.toString(), isSeed: true };
  } catch {
    return null;
  }
}

let _SeedOrganizer = null;
const SeedOrganizerSchema = new mongoose.Schema({}, { strict: false, collection: 'seedorganizers' });

async function getSeedOrganizerModel() {
  if (_SeedOrganizer) return _SeedOrganizer;
  const conn = await getSeedConnection();
  if (!conn) return null;
  _SeedOrganizer = conn.models['SeedOrganizer'] || conn.model('SeedOrganizer', SeedOrganizerSchema);
  return _SeedOrganizer;
}

async function findSeedOrganizers(filter = {}, { sort = { name: 1 }, skip = 0, limit = 50 } = {}) {
  const Model = await getSeedOrganizerModel();
  if (!Model) return [];
  try {
    const docs = await Model.find(filter)
      .sort(sort).skip(skip).limit(limit)
      .lean().maxTimeMS(10000);
    return docs.map(d => ({ ...d, _id: d._id.toString(), isSeed: true }));
  } catch (err) {
    console.warn('[SeedDB] organizer query failed:', err.message);
    return [];
  }
}

async function countSeedOrganizers(filter = {}) {
  const Model = await getSeedOrganizerModel();
  if (!Model) return 0;
  try {
    return await Model.countDocuments(filter).maxTimeMS(10000);
  } catch (err) {
    console.warn('[SeedDB] organizer count failed:', err.message);
    return 0;
  }
}

async function findSeedOrganizerById(id) {
  const Model = await getSeedOrganizerModel();
  if (!Model) return null;
  try {
    const doc = await Model.findById(id).lean().maxTimeMS(8000);
    if (!doc) return null;
    return { ...doc, _id: doc._id.toString(), isSeed: true };
  } catch {
    return null;
  }
}

let _SeedMember = null;
const SeedMemberSchema = new mongoose.Schema({}, { strict: false, collection: 'seedmembers' });

async function getSeedMemberModel() {
  if (_SeedMember) return _SeedMember;
  const conn = await getSeedConnection();
  if (!conn) return null;
  _SeedMember = conn.models['SeedMember'] || conn.model('SeedMember', SeedMemberSchema);
  return _SeedMember;
}

async function findSeedMembers(filter = {}, { sort = { name: 1 }, skip = 0, limit = 50 } = {}) {
  const Model = await getSeedMemberModel();
  if (!Model) return [];
  try {
    const docs = await Model.find(filter)
      .sort(sort).skip(skip).limit(limit)
      .lean().maxTimeMS(10000);
    return docs.map(d => ({ ...d, _id: d._id.toString(), isSeed: true }));
  } catch (err) {
    console.warn('[SeedDB] member query failed:', err.message);
    return [];
  }
}

async function countSeedMembers(filter = {}) {
  const Model = await getSeedMemberModel();
  if (!Model) return 0;
  try {
    return await Model.countDocuments(filter).maxTimeMS(10000);
  } catch (err) {
    console.warn('[SeedDB] member count failed:', err.message);
    return 0;
  }
}

module.exports = {
  findSeedBusinesses, countSeedBusinesses, findSeedBusinessById,
  findSeedOrganizers, countSeedOrganizers, findSeedOrganizerById,
  findSeedMembers, countSeedMembers,
  getSeedConnection,
};
