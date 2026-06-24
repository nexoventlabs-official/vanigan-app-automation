/**
 * memberAuth.js
 * Member registration + auth routes for the Vanigan user website.
 *
 * All VaniganMember reads/writes go through MEMBER_MONGODB_URI (new DB).
 * The old members collection on the default MONGODB_URI is never touched.
 *
 * POST /api/member-auth/lookup-epic      — validate EPIC, return voter data
 * POST /api/member-auth/send-otp         — send OTP via 2Factor
 * POST /api/member-auth/verify-otp       — verify OTP
 * POST /api/member-auth/signup           — complete registration, generate membership ID
 * POST /api/member-auth/login            — login (phone + PIN)
 * GET  /api/member-auth/me?phone=        — get current member profile
 * GET  /api/member-auth/check-phone?phone= — check if phone registered
 * POST /api/member-auth/upload-photo     — upload member photo during signup
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const { getMemberModel } = require("../services/memberDb");
const Business = require("../models/Business");
const { findByEpicNo } = require("../services/voterDb");
const { uploadBuffer } = require("../services/memberCloudinary");
const { getZoneByDistrict, calculateAge } = require("../utils/zoneData");
const auth = require("../middleware/auth");
const crypto = require("crypto");
const safeError = require("../utils/safeError");

/* ── Rate limiters ── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please wait before requesting again." },
});

const epicLookupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many EPIC lookups. Please slow down." },
});

const router = express.Router();
// FIX 4.4: fileFilter rejects non-image uploads server-side
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    cb(null, true);
  },
});

// In-memory OTP store: phone → { sessionId, expiry }
const otpStore = new Map();

/* ── helpers ── */
function safeUser(m) {
  if (!m) return null;
  const obj = m.toObject ? m.toObject() : { ...m };
  delete obj.pinHash;
  return obj;
}

/** Generate membership ID: TNVS- + 8 uppercase hex chars e.g. TNVS-A3F2B7C1 */
async function generateMembershipId(VaniganMember) {
  let id, exists;
  do {
    id = "TNVS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    exists = await VaniganMember.findOne({ membershipId: id })
      .select("_id")
      .lean();
  } while (exists);
  return id;
}

/** Generate referral code: REF- + 8 uppercase hex chars e.g. REF-B91A4C2F */
async function generateReferralCode(VaniganMember) {
  let code, exists;
  do {
    code = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    exists = await VaniganMember.findOne({ referralCode: code })
      .select("_id")
      .lean();
  } while (exists);
  return code;
}

/* ─────────────────────────────────────────────────────────────
   GET /check-phone?phone=
───────────────────────────────────────────────────────────── */
router.get("/check-phone", async (req, res) => {
  try {
    const digits = String(req.query.phone || "").replace(/\D/g, "");
    if (!digits) return res.status(400).json({ error: "phone required" });
    const VaniganMember = await getMemberModel();
    const m = await VaniganMember.findOne({ phone: digits })
      .select("_id name phone")
      .lean();
    res.json({ exists: !!m, name: m?.name || "" });
  } catch (err) {
    console.error("[member-auth/check-phone]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /lookup-epic
   Body: { epic }
───────────────────────────────────────────────────────────── */
router.post("/lookup-epic", epicLookupLimiter, async (req, res) => {
  try {
    const epic = String(req.body.epic || "")
      .toUpperCase()
      .trim();
    if (!epic || epic.length < 6) {
      return res.status(400).json({ error: "Valid EPIC number required." });
    }

    // Check if already registered with this EPIC
    const VaniganMember = await getMemberModel();
    const existing = await VaniganMember.findOne({ epicNo: epic })
      .select("_id phone")
      .lean();
    if (existing) {
      return res.status(409).json({
        error: "epic_exists",
        message: "This EPIC number is already registered.",
      });
    }

    const voter = await findByEpicNo(epic);
    if (!voter) {
      return res.status(404).json({
        error: "epic_not_found",
        message: "Voter not found. Please check your EPIC number.",
      });
    }

    const zone = getZoneByDistrict(voter.district);
    res.json({
      found: true,
      voter: {
        epic_no: voter.epic_no,
        name: voter.name,
        assembly_name: voter.assembly_name,
        assembly_no: voter.assembly_no,
        district: voter.district,
        zone,
        gender: voter.gender,
        mobile: voter.mobile,
      },
    });
  } catch (err) {
    console.error("[member-auth/lookup-epic]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /send-otp
   Body: { phone }
───────────────────────────────────────────────────────────── */
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const digits = String(req.body.phone || "").replace(/\D/g, "");
    if (digits.length < 10) {
      return res.status(400).json({ error: "Valid 10-digit phone required." });
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OTP service not configured." });
    }

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${digits}/AUTOGEN2`;
    const response = await axios.get(url, { timeout: 15000 });
    const data = response.data;

    if (data.Status === "Success") {
      otpStore.set(digits, {
        sessionId: data.Details,
        expiry: Date.now() + 10 * 60 * 1000,
      });
      // Mask phone in logs — never log full number
      console.log(`[otp] Sent to ***${digits.slice(-4)}, session: ${String(data.Details).slice(0, 6)}...`);
      return res.json({ ok: true, message: "OTP sent successfully." });
    }

    console.error("[otp] 2Factor failed:", data);
    res.status(500).json({ error: data.Details || "Failed to send OTP." });
  } catch (err) {
    console.error("[member-auth/send-otp]", err.message);
    res.status(500).json({ error: "OTP send failed. Please try again." });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /verify-otp
   Body: { phone, otp }
───────────────────────────────────────────────────────────── */
router.post("/verify-otp", async (req, res) => {
  try {
    const digits = String(req.body.phone || "").replace(/\D/g, "");
    const otp = String(req.body.otp || "").trim();

    if (!digits || !otp) {
      return res.status(400).json({ error: "phone and otp required." });
    }

    const record = otpStore.get(digits);
    if (!record) {
      return res.status(400).json({
        error: "otp_expired",
        message: "OTP expired or not sent. Please request a new OTP.",
      });
    }
    if (Date.now() > record.expiry) {
      otpStore.delete(digits);
      return res.status(400).json({
        error: "otp_expired",
        message: "OTP expired. Please request a new OTP.",
      });
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "OTP service not configured." });

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${record.sessionId}/${otp}`;
    const response = await axios.get(url, { timeout: 15000 });
    const data = response.data;

    if (data.Status === "Success" && data.Details === "OTP Matched") {
      otpStore.delete(digits);
      return res.json({ ok: true, message: "OTP verified successfully." });
    }

    res.status(400).json({
      error: "invalid_otp",
      message: "Invalid OTP. Please try again.",
    });
  } catch (err) {
    console.error("[member-auth/verify-otp]", err.message);
    res.status(500).json({ error: "OTP verification failed." });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /upload-photo  (multipart: photo + phone)
───────────────────────────────────────────────────────────── */
router.post("/upload-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "photo required" });
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    if (!phone) return res.status(400).json({ error: "phone required" });

    const result = await uploadBuffer(req.file.buffer, {
      phone,
      subfolder: "photos",
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("[member-auth/upload-photo]", err.message);
    res.status(500).json({ error: "Photo upload failed." });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /signup
───────────────────────────────────────────────────────────── */
router.post("/signup", async (req, res) => {
  try {
    const {
      hasEpic,
      epicNo,
      name,
      district,
      assemblyName,
      assemblyNo,
      zone,
      phone,
      secondaryPhone,
      dob,
      bloodGroup,
      gender,
      businessAddress,
      photoUrl,
      photoPublicId,
      pin,
      confirmPin,
      bizName,
      bizCategory,
      bizSubCat,
      referredBy,
    } = req.body;

    /* ── Validation ── */
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 10)
      return res.status(400).json({ error: "Valid 10-digit phone required." });
    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Name is required." });
    if (!/^\d{4}$/.test(String(pin || "")))
      return res.status(400).json({ error: "PIN must be exactly 4 digits." });
    if (String(pin) !== String(confirmPin))
      return res.status(400).json({ error: "PINs do not match." });

    const VaniganMember = await getMemberModel();

    /* ── Duplicate checks ── */
    const existingPhone = await VaniganMember.findOne({ phone: digits });
    if (existingPhone) {
      return res.status(409).json({
        error: "phone_exists",
        message: "An account with this number already exists. Please login.",
      });
    }
    const cleanEpic =
      hasEpic && epicNo ? String(epicNo).toUpperCase().trim() : "";
    if (cleanEpic) {
      const existingEpic = await VaniganMember.findOne({ epicNo: cleanEpic });
      if (existingEpic) {
        return res.status(409).json({
          error: "epic_exists",
          message: "This EPIC number is already registered.",
        });
      }
    }

    /* ── Validate referredBy ── */
    const cleanReferredBy = String(referredBy || "")
      .trim()
      .toUpperCase();
    let referrer = null;
    if (cleanReferredBy) {
      referrer = await VaniganMember.findOne({ membershipId: cleanReferredBy })
        .select("_id referralCount")
        .lean();
      // silently ignore invalid referral codes — don't block signup
    }

    /* ── Calculate age from DOB (DD/MM/YYYY) ── */
    const age = calculateAge(dob);

    /* ── Zone ── */
    const memberZone = zone || getZoneByDistrict(district);

    /* ── Generate membership ID + referral code ── */
    const membershipId = await generateMembershipId(VaniganMember);
    const referralCode = await generateReferralCode(VaniganMember);

    /* ── Hash PIN ── */
    const pinHash = await bcrypt.hash(String(pin), 10);

    /* ── Create member ── */
    const member = await VaniganMember.create({
      membershipId,
      referralCode,
      referredBy: referrer ? cleanReferredBy : "",
      phone: digits,
      secondaryPhone: String(secondaryPhone || "").replace(/\D/g, ""),
      pinHash,
      name: String(name).trim(),
      hasEpic: !!hasEpic,
      epicNo: cleanEpic,
      assemblyName: String(assemblyName || "").trim(),
      assemblyNo: String(assemblyNo || "").trim(),
      district: String(district || "").trim(),
      zone: memberZone,
      dob: String(dob || "").trim(),
      age,
      bloodGroup: String(bloodGroup || "").trim(),
      gender: String(gender || "").trim(),
      businessAddress: String(businessAddress || "").trim(),
      photoUrl: String(photoUrl || "").trim(),
      photoPublicId: String(photoPublicId || "").trim(),
      bizName: String(bizName || "").trim(),
      bizCategory: String(bizCategory || "").trim(),
      bizSubCat: String(bizSubCat || "").trim(),
      active: true,
    });

    /* ── Increment referrer's count ── */
    if (referrer) {
      await VaniganMember.updateOne(
        { _id: referrer._id },
        { $inc: { referralCount: 1 } },
      );
    }

    // Auto-link business if one exists for this phone
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (biz) {
      member.businessId = biz._id;
      await member.save();
    }

    const safeBiz = biz
      ? (() => {
          const { ownerPin, ownerPhone, ...s } = biz;
          return s;
        })()
      : null;

    res.json({ member: safeUser(member), business: safeBiz });
  } catch (err) {
    console.error("[member-auth/signup]", err);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /login   Body: { phone, pin }
───────────────────────────────────────────────────────────── */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits || !/^\d{4}$/.test(String(pin || ""))) {
      return res
        .status(400)
        .json({ error: "Phone and 4-digit PIN are required." });
    }

    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone: digits });
    if (!member) {
      return res.status(404).json({
        error: "no_account",
        message: "No account found. Please sign up first.",
      });
    }

    const ok = await bcrypt.compare(String(pin), member.pinHash);
    if (!ok) {
      return res.status(403).json({
        error: "wrong_pin",
        message: "Incorrect PIN. Please try again.",
      });
    }

    // Recalculate age if DOB present and age not set
    if (member.dob && (!member.age || member.age === 0)) {
      member.age = calculateAge(member.dob);
      await member.save();
    }

    // Auto-link business
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (biz && !member.businessId) {
      member.businessId = biz._id;
      await member.save();
    }

    let safeBiz = null;
    if (biz) {
      const { ownerPin, ownerPhone, ...bizSafe } = biz;
      try {
        const Review = require("../models/Review");
        const mongoose = require("mongoose");
        const reviews = await Review.find({
          targetKind: "business",
          targetId: biz._id,
        })
          .sort({ createdAt: -1 })
          .lean();
        const avgAgg = await Review.aggregate([
          {
            $match: {
              targetKind: "business",
              targetId: new mongoose.Types.ObjectId(biz._id.toString()),
            },
          },
          {
            $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } },
          },
        ]);
        safeBiz = {
          ...bizSafe,
          reviews,
          rating: avgAgg[0] ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
          reviewCount: avgAgg[0] ? avgAgg[0].count : 0,
        };
      } catch {
        safeBiz = bizSafe;
      }
    }

    res.json({ member: safeUser(member), business: safeBiz });
  } catch (err) {
    console.error("[member-auth/login]", err);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /me?phone=
───────────────────────────────────────────────────────────── */
router.get("/me", async (req, res) => {
  try {
    const digits = String(req.query.phone || "").replace(/\D/g, "");
    if (!digits) return res.status(400).json({ error: "phone required" });

    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone: digits }).lean();
    if (!member) return res.status(404).json({ error: "not_found" });

    const { pinHash: _, ...safeMember } = member;

    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    let safeBiz = null;
    if (biz) {
      const { ownerPin, ownerPhone, ...bizSafe } = biz;
      try {
        const Review = require("../models/Review");
        const mongoose = require("mongoose");
        const reviews = await Review.find({
          targetKind: "business",
          targetId: biz._id,
        })
          .sort({ createdAt: -1 })
          .lean();
        const avgAgg = await Review.aggregate([
          {
            $match: {
              targetKind: "business",
              targetId: new mongoose.Types.ObjectId(biz._id.toString()),
            },
          },
          {
            $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } },
          },
        ]);
        safeBiz = {
          ...bizSafe,
          reviews,
          rating: avgAgg[0] ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
          reviewCount: avgAgg[0] ? avgAgg[0].count : 0,
        };
      } catch {
        safeBiz = bizSafe;
      }
    }

    res.json({ member: safeMember, business: safeBiz });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /link-epic
   Body: { phone, epic }
   — For no-EPIC members who want to link their voter ID later.
   — Validates EPIC, updates member name/district/assembly/zone,
     clears hasEpic=false → hasEpic=true.
───────────────────────────────────────────────────────────── */
router.post("/link-epic", async (req, res) => {
  try {
    const { phone, epic } = req.body;
    const digits = String(phone || "").replace(/\D/g, "");
    const cleanEpic = String(epic || "")
      .toUpperCase()
      .trim();

    if (!digits || digits.length < 10)
      return res.status(400).json({ error: "Valid phone required." });
    if (!cleanEpic || cleanEpic.length < 6)
      return res.status(400).json({ error: "Valid EPIC number required." });

    const VaniganMember = await getMemberModel();

    // Must be an existing member
    const member = await VaniganMember.findOne({ phone: digits });
    if (!member)
      return res
        .status(404)
        .json({ error: "no_account", message: "No account found." });

    // Check EPIC not already taken by another member
    const epicTaken = await VaniganMember.findOne({ epicNo: cleanEpic });
    if (epicTaken && epicTaken.phone !== digits) {
      return res.status(409).json({
        error: "epic_exists",
        message: "This EPIC is already linked to another account.",
      });
    }

    // Look up voter data
    const voter = await findByEpicNo(cleanEpic);
    if (!voter) {
      return res.status(404).json({
        error: "epic_not_found",
        message: "Voter not found. Please check your EPIC number.",
      });
    }

    const zone = getZoneByDistrict(voter.district);

    // Update member with voter details
    member.epicNo = cleanEpic;
    member.hasEpic = true;
    member.name = voter.name; // update to voter-verified name
    member.assemblyName = voter.assembly_name;
    member.assemblyNo = voter.assembly_no;
    member.district = voter.district;
    member.zone = zone;
    if (voter.mobile && !member.secondaryPhone) {
      member.secondaryPhone = voter.mobile;
    }
    if (voter.gender && !member.gender) {
      member.gender = voter.gender;
    }
    await member.save();

    res.json({
      ok: true,
      member: safeUser(member),
      voter: {
        name: voter.name,
        assembly_name: voter.assembly_name,
        district: voter.district,
        zone,
        mobile: voter.mobile,
      },
    });
  } catch (err) {
    console.error("[member-auth/link-epic]", err);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /link-business
   Body: { phone, businessId }
───────────────────────────────────────────────────────────── */
router.post("/link-business", async (req, res) => {
  try {
    const { phone, businessId } = req.body;
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits || !businessId) {
      return res.status(400).json({ error: "phone and businessId required" });
    }

    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone: digits });
    if (!member) return res.status(404).json({ error: "no_account" });

    member.businessId = businessId;
    await member.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /verify-business-pin
   Body: { phone, pin }
   — Verifies the member's signup PIN, then copies it as the
     business ownerPin so the same PIN unlocks "My Business".
   — Called from the post-registration page instead of "set a new PIN".
───────────────────────────────────────────────────────────── */
router.post("/verify-business-pin", async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits || !/^\d{4}$/.test(String(pin || ""))) {
      return res
        .status(400)
        .json({ error: "phone and 4-digit PIN are required." });
    }

    // 1. Look up member and verify PIN
    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone: digits });
    if (!member) {
      return res.status(404).json({
        error: "no_member",
        message:
          "No membership account found for this number. Please sign up first.",
      });
    }

    const pinOk = await bcrypt.compare(String(pin), member.pinHash);
    if (!pinOk) {
      return res.status(403).json({
        error: "wrong_pin",
        message: "Incorrect PIN. Please enter the PIN you set during signup.",
      });
    }

    // 2. Find the business for this phone and set ownerPin = same hash
    const biz = await Business.findOne({ ownerPhone: digits });
    if (!biz) {
      return res.status(404).json({
        error: "no_business",
        message: "Business not found. Please complete registration first.",
      });
    }

    // Use the same pinHash (already bcrypt) — no need to re-hash
    biz.ownerPin = member.pinHash;
    await biz.save();

    // 3. Link business to member record if not already linked
    if (!member.businessId) {
      member.businessId = biz._id;
      await member.save();
    }

    res.json({ ok: true, businessId: biz._id, businessName: biz.name });
  } catch (err) {
    console.error("[member-auth/verify-business-pin]", err);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /admin-promote/:phone
   Admin: promote VaniganMember → Organizer (copies data)
───────────────────────────────────────────────────────────── */
router.post("/admin-promote/:phone", auth, async (req, res) => {
  const phone = String(req.params.phone || "").replace(/\D/g, "");
  if (!phone) return res.status(400).json({ error: "phone required" });
  try {
    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone }).lean();
    if (!member) return res.status(404).json({ error: "Member not found" });

    const { getOrganizerModel } = require("../services/memberDb");
    const Organizer = await getOrganizerModel();
    // Check if already an organizer
    const existing = await Organizer.findOne({ phone });
    if (existing)
      return res.status(409).json({
        error: "already_organizer",
        message: "This member is already an organizer.",
      });

    const org = await Organizer.create({
      name: member.name,
      description: member.businessAddress || "",
      role: member.bizCategory || "Member",
      district: member.district || "",
      assembly: member.assemblyName || "",
      phone: member.phone,
      email: "",
      image: member.photoUrl || "",
      imagePublicId: member.photoPublicId || "",
      active: true,
    });

    // Mark member as promoted — hide from member list
    await VaniganMember.updateOne({ phone }, { isOrganizer: true });

    res.json({ ok: true, organizer: org });
  } catch (err) {
    console.error("[admin-promote]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /admin-delete/:phone
   Admin: hard-delete a VaniganMember and ALL their data:
     - VaniganMember doc
     - VaniganUser doc (if exists for same phone)
     - Their Business listing + all images (in memberCloudinary vanigan_members/{phone}/)
     - Reviews they wrote + reviews on their business
     - Their following / savedBusinesses references in others' docs
     - Member photo folder from memberCloudinary
───────────────────────────────────────────────────────────── */
router.delete("/admin-delete/:phone", auth, async (req, res) => {
  const phone = String(req.params.phone || "").replace(/\D/g, "");
  if (!phone) return res.status(400).json({ error: "phone required" });

  const log = [];
  try {
    const mongoose = require("mongoose");
    const Review = require("../models/Review");
    const Business = require("../models/Business");
    const {
      getMemberModel,
      getVaniganUserModel,
    } = require("../services/memberDb");
    const { deleteMemberFolder } = require("../services/memberCloudinary");
    // Business images now live in member cloudinary (vanigan_members/{phone}/business/...)
    // so deleteMemberFolder already covers them — no separate bizDestroy needed

    const VaniganMember = await getMemberModel();
    const VaniganUser = await getVaniganUserModel();

    // 1. Find the member
    const member = await VaniganMember.findOne({ phone }).lean();
    if (!member) return res.status(404).json({ error: "Member not found" });

    // 2. Delete their business listing
    // Images are under vanigan_members/{phone}/business/... — deleteMemberFolder below covers them
    const biz = await Business.findOne({ ownerPhone: phone }).lean();
    if (biz) {
      await Business.deleteOne({ _id: biz._id });
      log.push(`Deleted business: ${biz.name}`);
    }

    // 3. Delete reviews WRITTEN by this member (by phone)
    const revByMember = await Review.deleteMany({ phone });
    log.push(`Deleted ${revByMember.deletedCount} reviews by member`);

    // 4. Delete reviews ON their business
    if (biz) {
      const revOnBiz = await Review.deleteMany({
        targetKind: "business",
        targetId: biz._id,
      });
      log.push(`Deleted ${revOnBiz.deletedCount} reviews on business`);
    }

    // 5. Remove this member from others' following / savedBusinesses arrays
    if (biz) {
      const bizOid = new mongoose.Types.ObjectId(biz._id.toString());
      await VaniganMember.updateMany(
        { following: bizOid },
        { $pull: { following: bizOid } },
      );
      await VaniganMember.updateMany(
        { savedBusinesses: bizOid },
        { $pull: { savedBusinesses: bizOid } },
      );
      await VaniganUser.updateMany(
        { following: bizOid },
        { $pull: { following: bizOid } },
      );
      await VaniganUser.updateMany(
        { savedBusinesses: bizOid },
        { $pull: { savedBusinesses: bizOid } },
      );
      log.push("Removed business from others' following/saved lists");
    }

    // 6. Delete member photo folder from memberCloudinary
    await deleteMemberFolder(phone);
    log.push(`Deleted Cloudinary folder: vanigan_members/${phone}`);

    // 7. Delete VaniganUser (legacy web-auth) if exists
    const userDel = await VaniganUser.deleteOne({ phone });
    if (userDel.deletedCount) log.push("Deleted VaniganUser record");

    // 8. Finally delete the VaniganMember
    await VaniganMember.deleteOne({ phone });
    log.push("Deleted VaniganMember record");

    console.log(`[admin-delete] Deleted member ${phone}:`, log);
    res.json({ ok: true, log });
  } catch (err) {
    console.error("[admin-delete]", err.message);
    res.status(500).json({ error: safeError(err), log });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /admin-list  — Admin: list all VaniganMembers (paginated)
   Query: page, limit, q (search by name/phone/membershipId)
───────────────────────────────────────────────────────────── */
router.get("/admin-list", auth, async (req, res) => {
  try {
    const { q = "", page = 1, limit = 50 } = req.query;
    const VaniganMember = await getMemberModel();

    const filter = {};
    if (q) {
      const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [
        { name: rx },
        { phone: rx },
        { membershipId: rx },
        { district: rx },
      ];
    }
    // Exclude promoted organizers
    filter.isOrganizer = { $ne: true };

    const skip =
      (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const take = Math.min(100, parseInt(limit));

    const [members, total] = await Promise.all([
      VaniganMember.find(filter)
        .select("-pinHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      VaniganMember.countDocuments(filter),
    ]);

    // Enrich with their linked business (from wati_panel businesses)
    const phones = members.map((m) => m.phone).filter(Boolean);
    const bizDocs = phones.length
      ? await Business.find({ ownerPhone: { $in: phones } })
          .select("_id name ownerPhone ownerPin active category")
          .lean()
      : [];
    const bizByPhone = {};
    bizDocs.forEach((b) => {
      bizByPhone[b.ownerPhone] = b;
    });

    const enriched = members.map((m) => ({
      ...m,
      business: bizByPhone[m.phone] || null,
      // verified = has EPIC + has business with PIN set
      verified: m.hasEpic && !!bizByPhone[m.phone]?.ownerPin,
      // hasBusinessPin = business linked and PIN confirmed
      hasBusinessPin: !!bizByPhone[m.phone]?.ownerPin,
    }));

    res.json({ members: enriched, total, page: parseInt(page), limit: take });
  } catch (err) {
    console.error("[member-auth/admin-list]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /admin-member/:phone
   Admin: get a single VaniganMember's details
───────────────────────────────────────────────────────────── */
router.get("/admin-member/:phone", auth, async (req, res) => {
  try {
    const phone = String(req.params.phone || "").replace(/\D/g, "");
    if (!phone) return res.status(400).json({ error: "phone required" });
    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone }).lean();
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ ok: true, member });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /referral-info?phone=
   Returns referral code, link, count, who referred this member,
   and list of members they referred.
───────────────────────────────────────────────────────────── */
router.get("/referral-info", async (req, res) => {
  try {
    const digits = String(req.query.phone || "").replace(/\D/g, "");
    if (!digits) return res.status(400).json({ error: "phone required" });

    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone: digits })
      .select("membershipId referralCode referredBy referralCount name")
      .lean();
    if (!member) return res.status(404).json({ error: "not_found" });

    const userWebsiteUrl = (process.env.USER_WEBSITE_URL || "").replace(
      /\/+$/,
      "",
    );
    const referralLink = `${userWebsiteUrl}?ref=${member.membershipId}`;

    // Who referred this member
    let referredByMember = null;
    if (member.referredBy) {
      referredByMember = await VaniganMember.findOne({
        membershipId: member.referredBy,
      })
        .select("name membershipId photoUrl district assemblyName")
        .lean();
    }

    // Members they referred
    const referredMembers = await VaniganMember.find({
      referredBy: member.membershipId,
    })
      .select("name membershipId photoUrl district assemblyName createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      referralCode: member.referralCode,
      membershipId: member.membershipId,
      referralLink,
      referralCount: member.referralCount || referredMembers.length,
      referredBy: referredByMember,
      referredMembers,
    });
  } catch (err) {
    console.error("[referral-info]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /verify-card
   Public endpoint — verifies a membership card by membershipId + PIN.
   Used by the QR scan landing page to authenticate the cardholder.
───────────────────────────────────────────────────────────── */
router.post("/verify-card", async (req, res) => {
  try {
    const { membershipId, pin } = req.body;
    if (!membershipId || !/^\d{4}$/.test(String(pin || ""))) {
      return res
        .status(400)
        .json({ error: "membershipId and 4-digit PIN are required." });
    }

    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({
      membershipId: String(membershipId).toUpperCase().trim(),
    });
    if (!member) {
      return res
        .status(404)
        .json({ error: "not_found", message: "Member not found." });
    }

    const ok = await bcrypt.compare(String(pin), member.pinHash);
    if (!ok) {
      return res
        .status(403)
        .json({ error: "wrong_pin", message: "Incorrect PIN." });
    }

    const { pinHash: _, ...safeMember } = member.toObject();
    res.json({ ok: true, member: safeMember });
  } catch (err) {
    console.error("[verify-card]", err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
