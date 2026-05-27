const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    category: { type: String, required: true, unique: true },
    imageUrl:  { type: String, default: '' },
    publicId:  { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CategoryImage', schema);
