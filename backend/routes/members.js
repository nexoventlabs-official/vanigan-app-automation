const { getMemberListingModel } = require('../services/memberDb');
const listingRouter = require('./_listingFactory');

module.exports = async (req, res, next) => {
  try {
    const Member = await getMemberListingModel();
    return listingRouter({
      Model:         Member,
      folder:        'members',
      perItemFolder: true,
      extraFields:   ['designation', 'phone', 'email'],
    })(req, res, next);
  } catch (err) {
    next(err);
  }
};
