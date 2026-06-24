const mongoose = require('mongoose');

const WingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: true }
);

const rawSchema = WingSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let WingModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  WingModel = conn.model('Wing', WingSchema);
} else {
  WingModel = mongoose.model('Wing', WingSchema);
}

WingModel.rawSchema = rawSchema;
module.exports = WingModel;
