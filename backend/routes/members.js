const Member = require('../models/Member');
const listingRouter = require('./_listingFactory');

module.exports = listingRouter({
  Model: Member,
  folder: 'members',
  extraFields: ['designation', 'phone', 'email'],
});
