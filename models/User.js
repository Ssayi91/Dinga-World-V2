const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: [] }, // Roles like "admin" or "super_admin"
  permissions: { type: [String], default: [] }, // Pages or actions the user can access
});

module.exports = mongoose.model("User", userSchema);
