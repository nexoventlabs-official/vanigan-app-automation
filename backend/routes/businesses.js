const Business = require('../models/Business');
const listingRouter = require('./_listingFactory');
const businessCloudinary = require('../services/businessCloudinary');

module.exports = listingRouter({
  Model:            Business,
  folder:           'businesses',
  multiImage:       true,
  cloudinaryService: businessCloudinary,
  extraFields: [
    'category', 'subCategory',
    'address', 'landmark', 'serviceLocations',
    'city', 'pincode',
    'phone', 'whatsappNo', 'landline', 'phone2', 'email', 'website',
    'fbLink', 'twitterLink', 'googleMap', 'videoUrl',
    'openDays', 'openTime', 'closeTime',
    'lat', 'lng',
    'infoQuestion', 'infoAnswer',
    'listingCode', 'listingMode', 'slug',
    'ownerPhone',
  ],
});
