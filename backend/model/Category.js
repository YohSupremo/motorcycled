import mongoose from "mongoose";

// 4.3 categories — from motorcycled-ref-database.pdf Section 4.3
// Examples: Motorcycles, Engine Parts, Brakes, Tires and Wheels, Helmets, Riding Gear, Accessories, Lubricants
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a category name"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
