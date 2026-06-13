const Business = require('../models/Business');
const listingRouter = require('./_listingFactory');
const memberCloudinary = require('../services/memberCloudinary');
const generateListingCode = require('../utils/generateListingCode');

/**
 * Business listings admin CRUD.
 * All images go to MEMBER_CLOUDINARY under the owner's phone folder:
 *   vanigan_members/{ownerPhone}/business/          — profile image
 *   vanigan_members/{ownerPhone}/business/cover/    — cover image
 *   vanigan_members/{ownerPhone}/business/gallery/  — gallery
 *   vanigan_members/{ownerPhone}/business/services/ — service images
 *
 * memberCloudinary.ROOT = 'vanigan_members', so resolveUpload in _listingFactory
 * will translate folder paths correctly using the ownerPhone.
 */
module.exports = listingRouter({
  Model:            Business,
  folder:           'businesses',
  multiImage:       true,
  cloudinaryService: memberCloudinary,
  getPhone: (doc) => (doc.ownerPhone || '').replace(/\D/g, '') || null,
  extraFields: [
    'category', 'subCategory',
    'address', 'landmark', 'serviceLocations',
    'city', 'pincode',
    'phone', 'whatsappNo', 'landline', 'phone2', 'email', 'website',
    'fbLink', 'twitterLink', 'instaLink', 'googleMap', 'videoUrl',
    'openDays', 'openTime', 'closeTime',
    'lat', 'lng',
    'infoQuestion', 'infoAnswer',
    'listingCode', 'listingMode', 'slug',
    'ownerPhone',
  ],
  onBeforeCreate: async (doc) => {
    if (!doc.listingCode) {
      doc.listingCode = await generateListingCode();
    }
  },
});
