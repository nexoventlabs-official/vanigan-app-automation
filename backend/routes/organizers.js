const Organizer = require('../models/Organizer');
const listingRouter = require('./_listingFactory');

module.exports = listingRouter({
  Model: Organizer,
  folder: 'organizers',
  extraFields: ['role', 'phone', 'email'],
});
