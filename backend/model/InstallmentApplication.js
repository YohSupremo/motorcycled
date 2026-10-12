import mongoose from "mongoose";

const confirmedTermsSchema = new mongoose.Schema(
  {
    termMonths: { type: Number },
    downPayment: { type: Number },
    financedAmount: { type: Number },
    interestRate: { type: Number },
    monthlyPayment: { type: Number },
    processingFee: { type: Number },
    totalRepayment: { type: Number },
  },
  { _id: false },
);

const shippingInfoSchema = new mongoose.Schema(
  {
    recipientName: { type: String },
    contactNumber: { type: String },
    address: { type: String },
    barangay: { type: String },
    city: { type: String },
    postalCode: { type: String },
    fulfillmentMethod: { type: String, enum: ["delivery", "pickup"] },
    branch: { type: String },
  },
  { _id: false },
);

const installmentApplicationSchema = new mongoose.Schema(
  {
    applicationRef: { type: String, unique: true, required: true },
    checkoutSessionId: { type: String, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true },
    productImage: { type: String },
    termMonths: {
      type: Number,
      required: true,
      enum: [12, 24, 36],
    },
    downPayment: { type: Number, required: true },
    financedAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    processingFee: { type: Number, default: 1500 },
    totalRepayment: { type: Number, required: true },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "canceled"],
      default: "pending",
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    confirmedTerms: confirmedTermsSchema,
    linkedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    shippingInfo: shippingInfoSchema,
  },
  { timestamps: true },
);

// Auto-generate applicationRef before validation
installmentApplicationSchema.pre("validate", async function () {
  if (!this.applicationRef) {
    try {
      const year = new Date().getFullYear();
      const count = await mongoose.model("InstallmentApplication").countDocuments();
      const rand = Math.floor(100 + Math.random() * 900);
      this.applicationRef = `IA-${year}-${String(count + 1).padStart(5, "0")}-${rand}`;
    } catch (err) {
      this.applicationRef = `IA-${new Date().getFullYear()}-${Date.now()}`;
    }
  }
});

const InstallmentApplication = mongoose.model(
  "InstallmentApplication",
  installmentApplicationSchema,
);
export default InstallmentApplication;
