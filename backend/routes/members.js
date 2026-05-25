const Member = require('../models/Member');
const listingRouter = require('./_listingFactory');

module.exports = listingRouter({
  Model:           Member,
  folder:          'members',
  perItemFolder:   true,
  extraFields: ['designation', 'phone', 'email'],
});
