/**
 * memberDb.js
 * Creates a dedicated Mongoose connection to MEMBER_MONGODB_URI.
 * All VaniganMember operations go through this connection so the
 * 18k-record old member collection (on the default MONGODB_URI) is
 * never touched.
 *
 * Usage:
 *   const { getMemberModel } = require('./services/memberDb');
 *   const VaniganMember = await getMemberModel();
 */
const mongoose = require('mongoose');

let _conn = null;
let _model = null;

async function getConnection() {
  if (_conn && _conn.readyState === 1) return _conn;

  const uri = process.env.MEMBER_MONGODB_URI;
  if (!uri) {
    throw new Error('MEMBER_MONGODB_URI is not configured');
  }

  _conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  console.log('[MemberDB] connected to', uri.split('@')[1]?.split('/')[0] || 'member DB');
  return _conn;
}

async function getMemberModel() {
  if (_model) return _model;
  const conn = await getConnection();

  // Use rawSchema exported from the model file
  const VaniganMemberFile = require('../models/VaniganMember');
  const schema = VaniganMemberFile.rawSchema || VaniganMemberFile.schema;
  _model = conn.models['VaniganMember'] || conn.model('VaniganMember', schema);
  return _model;
}

module.exports = { getConnection, getMemberModel };
