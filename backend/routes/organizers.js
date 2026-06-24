const express = require('express');
const { getOrganizerModel, getMemberModel } = require('../services/memberDb');
const listingRouter = require('./_listingFactory');
const memberCloudinary = require('../services/memberCloudinary');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const safeError = require('../utils/safeError');
const { getZoneByDistrict, calculateAge } = require('../utils/zoneData');

const router = express.Router();

// Define /direct route for direct organizer creation or promotion
router.post('/direct', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, role, district, assembly, phone, email, dob, bloodGroup, address, active } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    if (!dob) return res.status(400).json({ error: 'Date of Birth is required' });

    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'Valid phone number is required' });

    const VaniganMember = await getMemberModel();
    const Organizer = await getOrganizerModel();

    // Check if phone already registered in Organizer
    const existingOrg = await Organizer.findOne({ phone: digits }).lean();
    if (existingOrg) {
      return res.status(400).json({ error: 'Organizer is already registered with this phone number' });
    }

    const existingMember = await VaniganMember.findOne({ phone: digits }).lean();

    // Determine birth year from dob (which is in YYYY-MM-DD or DD/MM/YYYY)
    let birthYear = '';
    if (dob.includes('-')) {
      birthYear = dob.split('-')[0];
    } else if (dob.includes('/')) {
      birthYear = dob.split('/')[2];
    }

    if (!birthYear || birthYear.length !== 4 || isNaN(birthYear)) {
      return res.status(400).json({ error: 'Invalid Date of Birth. Birth year must be 4 digits.' });
    }

    // Convert dob to DD/MM/YYYY for Member DB consistency if it is YYYY-MM-DD
    let dobFormatted = dob;
    if (dob.includes('-')) {
      const [y, m, d] = dob.split('-');
      dobFormatted = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // Calculate age and zone
    const age = calculateAge(dob);
    const memberZone = req.body.zone || getZoneByDistrict(district || '');
    const isActive = active === 'true' || active === true;

    // Handle photo upload
    let imageUrl = '';
    let imagePublicId = '';
    if (req.file) {
      const uploadResult = await memberCloudinary.uploadBuffer(req.file.buffer, {
        phone: digits,
        subfolder: 'organizer'
      });
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    } else if (existingMember) {
      imageUrl = existingMember.photoUrl || '';
      imagePublicId = existingMember.photoPublicId || '';
    }

    let member;
    let pinCodeToShow = birthYear;

    if (existingMember) {
      // PROMOTION: Update the existing member record (and set/reset PIN to birth year)
      const pinHash = await bcrypt.hash(birthYear, 10);
      await VaniganMember.updateOne(
        { phone: digits },
        {
          $set: {
            isOrganizer: true,
            name: name.trim(),
            dob: dobFormatted,
            age,
            pinHash,
            bloodGroup: (bloodGroup || '').trim(),
            businessAddress: (address || '').trim(),
            bizCategory: (role || 'Organizer').trim(), // store role in bizCategory for rendering card
            assemblyName: (assembly || '').trim(),
            district: (district || 'Tamil Nadu State').trim(),
            zone: memberZone,
            active: isActive,
            photoUrl: imageUrl,
            photoPublicId: imagePublicId,
          }
        }
      );
      member = await VaniganMember.findOne({ phone: digits }).lean();
      console.log(`[Promotion] Promoted existing member ${digits} to organizer. PIN set to birth year.`);
    } else {
      // NEW CREATION: Create both records from scratch
      // Hash the PIN (birth year)
      const pinHash = await bcrypt.hash(birthYear, 10);
      pinCodeToShow = birthYear;

      // Generate unique membershipId & referralCode
      let membershipId, exists;
      do {
        membershipId = "TNVS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        exists = await VaniganMember.findOne({ membershipId }).select("_id").lean();
      } while (exists);

      let referralCode;
      do {
        referralCode = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        exists = await VaniganMember.findOne({ referralCode }).select("_id").lean();
      } while (exists);

      member = await VaniganMember.create({
        membershipId,
        referralCode,
        referredBy: '',
        phone: digits,
        secondaryPhone: '',
        pinHash,
        name: name.trim(),
        hasEpic: false,
        epicNo: '',
        assemblyName: (assembly || '').trim(),
        assemblyNo: '',
        district: (district || 'Tamil Nadu State').trim(),
        zone: memberZone,
        dob: dobFormatted,
        age,
        bloodGroup: (bloodGroup || '').trim(),
        gender: '',
        businessAddress: (address || '').trim(),
        photoUrl: imageUrl,
        photoPublicId: imagePublicId,
        bizName: '',
        bizCategory: (role || 'Organizer').trim(),
        bizSubCat: '',
        active: isActive,
        isOrganizer: true,
      });
      console.log(`[DirectCreate] Created new organizer ${digits} from scratch.`);
    }

    // Create the Organizer record
    const org = await Organizer.create({
      name: name.trim(),
      description: (address || '').trim(),
      role: (role || 'Organizer').trim(),
      district: (district || 'Tamil Nadu State').trim(),
      assembly: (assembly || '').trim(),
      phone: digits,
      email: (email || '').trim(),
      image: imageUrl,
      imagePublicId,
      active: isActive,
    });

    // Auto-link business if one exists for this phone
    const Business = require('../models/Business');
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (biz && !member.businessId) {
      await VaniganMember.updateOne({ _id: member._id }, { businessId: biz._id });
    }

    res.status(201).json({ ok: true, member, organizer: org, pin: pinCodeToShow });
  } catch (err) {
    console.error('[direct-organizer-create]', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Define GET /direct/:phone route to retrieve full organizer + member details for editing
router.get('/direct/:phone', auth, async (req, res) => {
  try {
    const digits = String(req.params.phone).replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'Valid phone is required' });
    
    const VaniganMember = await getMemberModel();
    const Organizer = await getOrganizerModel();
    
    const [member, organizer] = await Promise.all([
      VaniganMember.findOne({ phone: digits }).lean(),
      Organizer.findOne({ phone: digits }).lean()
    ]);
    
    if (!organizer) return res.status(404).json({ error: 'Organizer not found' });
    
    res.json({ member, organizer });
  } catch (err) {
    console.error('[direct-organizer-get]', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Define GET /check-phone/:phone route to check if phone is registered in Organizer or Member collections
router.get('/check-phone/:phone', auth, async (req, res) => {
  try {
    const digits = String(req.params.phone).replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'Valid phone is required' });

    const VaniganMember = await getMemberModel();
    const Organizer = await getOrganizerModel();

    const [org, member] = await Promise.all([
      Organizer.findOne({ phone: digits }).select('_id name').lean(),
      VaniganMember.findOne({ phone: digits }).select('_id name').lean()
    ]);

    if (org) {
      return res.json({ status: 'organizer', message: `Already registered as Organizer (${org.name})`, name: org.name });
    }
    if (member) {
      return res.json({ status: 'member', message: `Registered as Member (${member.name})`, name: member.name });
    }
    return res.json({ status: 'available', message: 'Available' });
  } catch (err) {
    console.error('[direct-organizer-check-phone]', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Define PUT /direct/:phone route for editing organizer details
router.put('/direct/:phone', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, role, district, assembly, phone, email, dob, bloodGroup, address, active } = req.body;
    const oldPhoneDigits = String(req.params.phone).replace(/\D/g, '');
    const newPhoneDigits = String(phone || '').replace(/\D/g, '') || oldPhoneDigits;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!dob) return res.status(400).json({ error: 'Date of Birth is required' });

    const VaniganMember = await getMemberModel();
    const Organizer = await getOrganizerModel();

    // Find the existing organizer record
    const organizerDoc = await Organizer.findOne({ phone: oldPhoneDigits });
    if (!organizerDoc) {
      return res.status(404).json({ error: 'Organizer not found' });
    }

    // Check unique phone constraints if phone changes
    if (newPhoneDigits !== oldPhoneDigits) {
      const otherOrg = await Organizer.findOne({ phone: newPhoneDigits }).lean();
      if (otherOrg) {
        return res.status(400).json({ error: 'Another organizer is already registered with this phone number' });
      }
      const otherMember = await VaniganMember.findOne({ phone: newPhoneDigits }).lean();
      if (otherMember) {
        return res.status(400).json({ error: 'Another member is already registered with this phone number' });
      }
    }

    const memberDoc = await VaniganMember.findOne({ phone: oldPhoneDigits });

    // Determine birth year from dob
    let birthYear = '';
    if (dob.includes('-')) {
      birthYear = dob.split('-')[0];
    } else if (dob.includes('/')) {
      birthYear = dob.split('/')[2];
    }

    if (!birthYear || birthYear.length !== 4 || isNaN(birthYear)) {
      return res.status(400).json({ error: 'Invalid Date of Birth. Birth year must be 4 digits.' });
    }

    let dobFormatted = dob;
    if (dob.includes('-')) {
      const [y, m, d] = dob.split('-');
      dobFormatted = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    const age = calculateAge(dob);
    const memberZone = req.body.zone || getZoneByDistrict(district || '');
    const isActive = active === 'true' || active === true;

    // Handle photo
    let imageUrl = organizerDoc.image || '';
    let imagePublicId = organizerDoc.imagePublicId || '';
    if (req.file) {
      if (imagePublicId) {
        await memberCloudinary.destroy(imagePublicId).catch(() => {});
      }
      const uploadResult = await memberCloudinary.uploadBuffer(req.file.buffer, {
        phone: newPhoneDigits,
        subfolder: 'organizer'
      });
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    } else if (memberDoc && memberDoc.photoUrl) {
      imageUrl = memberDoc.photoUrl;
      imagePublicId = memberDoc.photoPublicId || '';
    }

    // Update member record
    let pinCodeToShow = birthYear;
    if (memberDoc) {
      const pinHash = await bcrypt.hash(birthYear, 10);
      await VaniganMember.updateOne(
        { phone: oldPhoneDigits },
        {
          $set: {
            name: name.trim(),
            dob: dobFormatted,
            age,
            pinHash,
            phone: newPhoneDigits,
            bloodGroup: (bloodGroup || '').trim(),
            businessAddress: (address || '').trim(),
            bizCategory: (role || 'Organizer').trim(),
            assemblyName: (assembly || '').trim(),
            district: (district || 'Tamil Nadu State').trim(),
            zone: memberZone,
            active: isActive,
            photoUrl: imageUrl,
            photoPublicId: imagePublicId,
          }
        }
      );
    } else {
      // MEMBER DOES NOT EXIST YET: Generate unique membershipId, referralCode, and pinHash (birth year)
      const pinHash = await bcrypt.hash(birthYear, 10);
      pinCodeToShow = birthYear;

      let membershipId, exists;
      do {
        membershipId = "TNVS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        exists = await VaniganMember.findOne({ membershipId }).select("_id").lean();
      } while (exists);

      let referralCode;
      do {
        referralCode = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        exists = await VaniganMember.findOne({ referralCode }).select("_id").lean();
      } while (exists);

      await VaniganMember.create({
        membershipId,
        referralCode,
        referredBy: '',
        phone: newPhoneDigits,
        secondaryPhone: '',
        pinHash,
        name: name.trim(),
        hasEpic: false,
        epicNo: '',
        assemblyName: (assembly || '').trim(),
        assemblyNo: '',
        district: (district || 'Tamil Nadu State').trim(),
        zone: memberZone,
        dob: dobFormatted,
        age,
        bloodGroup: (bloodGroup || '').trim(),
        gender: '',
        businessAddress: (address || '').trim(),
        photoUrl: imageUrl,
        photoPublicId: imagePublicId,
        bizName: '',
        bizCategory: (role || 'Organizer').trim(),
        bizSubCat: '',
        active: isActive,
        isOrganizer: true,
      });
      console.log(`[OrganizerUpdate-CreateMember] Created missing VaniganMember profile for organizer ${newPhoneDigits}.`);
    }

    // Update organizer record
    await Organizer.updateOne(
      { phone: oldPhoneDigits },
      {
        $set: {
          name: name.trim(),
          description: (address || '').trim(),
          role: (role || 'Organizer').trim(),
          district: (district || 'Tamil Nadu State').trim(),
          assembly: (assembly || '').trim(),
          phone: newPhoneDigits,
          email: (email || '').trim(),
          image: imageUrl,
          imagePublicId,
          active: isActive,
        }
      }
    );

    const updatedMember = await VaniganMember.findOne({ phone: newPhoneDigits }).lean();
    res.json({ ok: true, member: updatedMember, pin: pinCodeToShow });
  } catch (err) {
    console.error('[direct-organizer-update]', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Intercept DELETE /:id to perform full cascade deletion (Member, User, Business, Cloudinary assets, and Reviews)
router.delete('/:id', auth, async (req, res) => {
  try {
    const Organizer = await getOrganizerModel();
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.json({ ok: true });
    }

    const phone = (organizer.phone || '').replace(/\D/g, '');
    const log = [];

    // 1. Delete from Cloudinary using organizer's photo ID (if exists)
    if (organizer.imagePublicId) {
      await memberCloudinary.destroy(organizer.imagePublicId).catch(() => {});
    }

    // 2. If organizer has a phone number, perform a full member-delete style cleanup
    if (phone) {
      const mongoose = require('mongoose');
      const Review = require('../models/Review');
      const Business = require('../models/Business');
      const { getMemberModel, getVaniganUserModel } = require('../services/memberDb');
      const { deleteMemberFolder } = require('../services/memberCloudinary');

      const VaniganMember = await getMemberModel();
      const VaniganUser = await getVaniganUserModel();

      // Delete business listing
      const biz = await Business.findOne({ ownerPhone: phone }).lean();
      if (biz) {
        await Business.deleteOne({ _id: biz._id });
        log.push(`Deleted business: ${biz.name}`);

        // Delete reviews on business
        const revOnBiz = await Review.deleteMany({ targetKind: 'business', targetId: biz._id });
        log.push(`Deleted ${revOnBiz.deletedCount} reviews on business`);

        // Remove business from others' following/saved lists
        const bizOid = new mongoose.Types.ObjectId(biz._id.toString());
        await VaniganMember.updateMany({ following: bizOid }, { $pull: { following: bizOid } }).catch(() => {});
        await VaniganMember.updateMany({ savedBusinesses: bizOid }, { $pull: { savedBusinesses: bizOid } }).catch(() => {});
        await VaniganUser.updateMany({ following: bizOid }, { $pull: { following: bizOid } }).catch(() => {});
        await VaniganUser.updateMany({ savedBusinesses: bizOid }, { $pull: { savedBusinesses: bizOid } }).catch(() => {});
      }

      // Delete reviews written by this user
      const revByMember = await Review.deleteMany({ phone });
      log.push(`Deleted ${revByMember.deletedCount} reviews written by phone ${phone}`);

      // Delete Member Cloudinary folder
      await deleteMemberFolder(phone).catch(() => {});
      log.push(`Deleted Cloudinary folder for phone ${phone}`);

      // Delete VaniganUser
      await VaniganUser.deleteOne({ phone });
      log.push('Deleted VaniganUser record');

      // Delete VaniganMember
      await VaniganMember.deleteOne({ phone });
      log.push('Deleted VaniganMember record');
    }

    // 3. Delete the Organizer record itself
    await organizer.deleteOne();
    log.push('Deleted Organizer record');

    console.log(`[organizer-delete] Full cleanup for organizer ${phone || req.params.id}:`, log);
    res.json({ ok: true, log });
  } catch (err) {
    console.error('[organizer-delete-error]', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Delegate all other routes dynamically to factory-built router
router.use(async (req, res, next) => {
  try {
    const Organizer = await getOrganizerModel();
    const subRouter = listingRouter({
      Model:            Organizer,
      folder:           'organizers',
      cloudinaryService: memberCloudinary,
      getPhone: (doc) => (doc.phone || '').replace(/\D/g, '') || null,
      extraFields: ['role', 'phone', 'email'],
    });
    subRouter(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
