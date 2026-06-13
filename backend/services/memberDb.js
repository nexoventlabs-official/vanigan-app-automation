/**
 * memberDb.js
 * ONE shared Mongoose connection to MEMBER_MONGODB_URI.
 *
 * All new data — VaniganMember, VaniganUser, Business listings, Reviews,
 * Organizer profiles, and Member directory listings — goes through this single connection.
 *
 * The old BUSINESS_MONGODB_URI cluster holds the 18k seed businesses
 * and is NOT touched for any new writes.
 *
 * Usage:
 *   const { getMemberModel, getBusinessModel, getReviewModel, getVaniganUserModel, getOrganizerModel, getMemberListingModel } = require('./services/memberDb');
 *   const VaniganMember = await getMemberModel();
 *   const Business      = await getBusinessModel();
 *   const Review        = await getReviewModel();
 *   const VaniganUser   = await getVaniganUserModel();
 *   const Organizer     = await getOrganizerModel();
 *   const Member        = await getMemberListingModel();
 */
const mongoose = require('mongoose');

let _conn = null;
let _connPromise = null;

// Cached model references (populated lazily)
const _models = {};

function getConnection() {
  if (_conn && _conn.readyState === 1) return Promise.resolve(_conn);
  if (_connPromise) return _connPromise;

  const uri = process.env.MEMBER_MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error('MEMBER_MONGODB_URI is not configured'));
  }

  _connPromise = mongoose
    .createConnection(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .asPromise()
    .then((conn) => {
      _conn = conn;
      _connPromise = null;
      console.log('[MemberDB] connected to', uri.split('@')[1]?.split('/')[0] || 'member DB');
      return conn;
    })
    .catch((err) => {
      _connPromise = null;
      console.error('[MemberDB] connection error:', err.message);
      throw err;
    });

  return _connPromise;
}

async function getMemberModel() {
  if (_models.VaniganMember) return _models.VaniganMember;
  const conn = await getConnection();
  const { rawSchema } = require('../models/VaniganMember');
  _models.VaniganMember = conn.models['VaniganMember'] || conn.model('VaniganMember', rawSchema);
  return _models.VaniganMember;
}

async function getBusinessModel() {
  if (_models.Business) return _models.Business;
  const conn = await getConnection();
  const { rawSchema } = require('../models/Business');
  _models.Business = conn.models['Business'] || conn.model('Business', rawSchema);
  return _models.Business;
}

async function getReviewModel() {
  if (_models.Review) return _models.Review;
  const conn = await getConnection();
  const { rawSchema } = require('../models/Review');
  _models.Review = conn.models['Review'] || conn.model('Review', rawSchema);
  return _models.Review;
}

async function getVaniganUserModel() {
  if (_models.VaniganUser) return _models.VaniganUser;
  const conn = await getConnection();
  const { rawSchema } = require('../models/VaniganUser');
  _models.VaniganUser = conn.models['VaniganUser'] || conn.model('VaniganUser', rawSchema);
  return _models.VaniganUser;
}

async function getOrganizerModel() {
  if (_models.Organizer) return _models.Organizer;
  const conn = await getConnection();
  const { rawSchema } = require('../models/Organizer');
  _models.Organizer = conn.models['Organizer'] || conn.model('Organizer', rawSchema);
  return _models.Organizer;
}

async function getMemberListingModel() {
  if (_models.Member) return _models.Member;
  const conn = await getConnection();
  const { rawSchema } = require('../models/Member');
  _models.Member = conn.models['Member'] || conn.model('Member', rawSchema);
  return _models.Member;
}

module.exports = { getConnection, getMemberModel, getBusinessModel, getReviewModel, getVaniganUserModel, getOrganizerModel, getMemberListingModel };
