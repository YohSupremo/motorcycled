import mongoose, { model } from "mongoose";

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
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  // profilePicture: {
  //   type: String,
  //   required: true,
  // }
  // validId: {
  //   type: String,
  //   required: true,
  // }
  // proofOfIncome: {
  //   type: String,
  //   required: true,
  // }
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

export default User = mongoose.model("User", userSchema);
