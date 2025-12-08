const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: String,
  phone: String,
  addresses: {
    street: String,
    ward: String,
    district: String,
    city: String,
    isDefault: Boolean,
  },
  role: String,
  faceDescriptor: [Number], // 128-dimensional face embedding
  faceEnrolled: { type: Boolean, default: false },
  enrollmentPhoto: String, // Base64 enrollment photo
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", usersSchema);