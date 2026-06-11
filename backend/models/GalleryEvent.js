const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const GalleryEventSchema = new mongoose.Schema(
  {
    eventName:   { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    eventDate:   { type: Date, required: true },
    images:      { type: [ImageSchema], default: [] },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryEvent', GalleryEventSchema);
