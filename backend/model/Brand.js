import mongoose from "mongoose";

// 4.4 brands — from motorcycled-ref-database.pdf Section 4.4
// Examples: Honda, Yamaha, Suzuki, Kawasaki, CFMOTO
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a brand name"],
      unique: true,
      trim: true,
    },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true },
);

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
