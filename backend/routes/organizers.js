const { getOrganizerModel } = require('../services/memberDb');
const listingRouter = require('./_listingFactory');
const memberCloudinary = require('../services/memberCloudinary');

/**
 * Organizer listings admin CRUD.
 * Images go to MEMBER_CLOUDINARY under the organizer's phone folder:
 *   vanigan_members/{phone}/organizer/  — organizer profile image
 */
module.exports = async (req, res, next) => {
  try {
    const Organizer = await getOrganizerModel();
    return listingRouter({
      Model:            Organizer,
      folder:           'organizers',
      cloudinaryService: memberCloudinary,
      getPhone: (doc) => (doc.phone || '').replace(/\D/g, '') || null,
      extraFields: ['role', 'phone', 'email'],
    })(req, res, next);
  } catch (err) {
    next(err);
  }
};
