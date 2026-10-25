import mongoose from "mongoose";

// 4.5 products — from motorcycled-ref-database.pdf Section 4.5
// Reference: backend/models/product.js from https://github.com/m3lfx/itcp318-s3a-2026
// Adapted for motorshop-specific schema (category/brand as ObjectId refs,
// moto-shop fields: compatibleModels, installment options, isArchived, lowStockThreshold)
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // FK → categories (PDF §4.5)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category for this product"],
    },
    // FK → brands (PDF §4.5)
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Please select a brand for this product"],
    },
    // e.g. ["Honda Click 125i V1", "ADV 160"] — used in search (PDF §4.5, FR1.2.5)
    compatibleModels: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Please enter product price"],
      min: [0, "Price cannot be negative"],
    },
    // Latest acquisition cost, updated by restocking.
    // Used for inventory valuation and COGS reporting (FR1.9).
    costPrice: {
      type: Number,
      default: 0,
      min: [0, "Cost price cannot be negative"],
    },
    ratings: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    // Falls back to settings.lowStockThreshold if absent (PDF §4.5)
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    // Cloudinary assets — { url: secure_url, publicId: public_id }
    // Reference: itcp318-s3a-2026/backend/controllers/product.js lines 31-40
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    installmentEligible: {
      type: Boolean,
      default: false,
    },
    minInstallmentPrice: {
      type: Number,
      default: 0,
    },
    // Archive flag instead of hard-delete (PDF §1 Design Principles #5)
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Featured status for Homepage Showcase
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Admin who created the product — FK → users
    // Reference: itcp318-s3a-2026/backend/controllers/product.js line 49
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes from PDF §4.5 + Storefront Compound Filters
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ compatibleModels: 1 });
productSchema.index({ isArchived: 1, isFeatured: 1, category: 1, price: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
