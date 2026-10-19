import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  contactNumber: {
    type: String,
    default: "",
  },
  profilePicture: {
    type: String,
    default: "https://res.cloudinary.com/chqrvlr4/image/upload/v1/profile/default-avatar.png",
  },
  validId: {
    type: String,
    default: "",
  },
  proofOfIncome: {
    type: String,
    default: "",
  },
  authProvider: {
    type: String,
    enum: ["local", "google", "facebook", "firebase"],
    default: "local",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
});

// Compare a plain-text password with the stored (hashed) password.
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Create a signed JWT for this user.
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME || process.env.JWT_EXPIRE || "7d",
  });
};

const User = mongoose.model("User", userSchema);
export default User;
