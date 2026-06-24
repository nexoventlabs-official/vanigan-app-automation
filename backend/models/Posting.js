const mongoose = require('mongoose');

const PostingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: true }
);

const rawSchema = PostingSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let PostingModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  PostingModel = conn.model('Posting', PostingSchema);
} else {
  PostingModel = mongoose.model('Posting', PostingSchema);
}

PostingModel.rawSchema = rawSchema;
module.exports = PostingModel;
