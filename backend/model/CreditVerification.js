import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    originalName: { type: String },
  },
  { _id: false },
);

const creditVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    governmentId: { type: documentSchema },
    proofOfIncome: { type: documentSchema },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

creditVerificationSchema.index({ status: 1, createdAt: -1 });

const CreditVerification = mongoose.model(
  "CreditVerification",
  creditVerificationSchema,
);

export default CreditVerification;
