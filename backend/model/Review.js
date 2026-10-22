import mongoose from "mongoose";

// Review model — customer product reviews (PDF §4.6).
// Adapted for motorshop: reviews are anchored to a Product and authored by a
// User, with admin moderation via isHidden and optional Order-based verified
// purchase. `seedId` gives idempotent identity for the review seeder.
const reviewSchema = new mongoose.Schema(
  {
    // FK → products
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    // FK → users
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must have an author"],
    },
    // FK → orders — set when the reviewer has a completed order for the product
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    // Derived from a completed/delivered order (PDF §4.6)
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Admin moderation status — hidden reviews are excluded from public reads
    isHidden: {
      type: Boolean,
      default: false,
    },
    // Stable id used by the seeder so re-runs update instead of duplicate
    seedId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
