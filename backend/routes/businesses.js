const Business = require('../models/Business');
const listingRouter = require('./_listingFactory');

module.exports = listingRouter({
  Model: Business,
  folder: 'businesses',
  extraFields: ['category', 'address', 'phone', 'phone2', 'email', 'website',
                'openDays', 'openTime', 'closeTime', 'landmark', 'lat', 'lng', 'listingCode'],
});
