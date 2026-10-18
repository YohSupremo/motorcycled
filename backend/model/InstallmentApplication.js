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
    email: { type: String },
    address: { type: String },
    barangay: { type: String },
    city: { type: String },
    postalCode: { type: String },
    fulfillmentMethod: { type: String, enum: ["delivery", "pickup"] },
    partsFulfillmentMethod: { type: String, enum: ["delivery", "pickup"] },
    branch: { type: String },
    governmentIdType: { type: String },
    governmentIdNumber: { type: String },
    employmentStatus: { type: String },
    employerName: { type: String },
    yearsEmployed: { type: String },
    workplaceLocation: { type: String },
    monthlyIncome: { type: String },
    secondaryIncomeSource: { type: String },
    secondaryIncomeAmount: { type: String },
    proofOfIncomeType: { type: String },
    emergencyContactName: { type: String },
    emergencyContactNumber: { type: String },
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
    documentUploads: {
      verificationMethod: {
        type: String,
        enum: ["showroom_physical", "online_upload"],
        default: "showroom_physical",
      },
      idCard: {
        publicId: { type: String },
        url: { type: String },
      },
      proofOfIncome: {
        publicId: { type: String },
        url: { type: String },
      },
      documentVerified: { type: Boolean, default: false },
      purgedAt: { type: Date },
    },
    installmentsPaid: { type: Number, default: 0 },
    paymentHistory: [
      {
        paidAt: { type: Date, default: Date.now },
        amount: { type: Number },
        paymentMethod: { type: String },
        referenceNumber: { type: String },
        installmentNumber: { type: Number },
      },
    ],
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

// Indexes for fast customer application lookups and admin status filtering
installmentApplicationSchema.index({ user: 1, createdAt: -1 });
installmentApplicationSchema.index({ applicationStatus: 1, createdAt: -1 });

const InstallmentApplication = mongoose.model(
  "InstallmentApplication",
  installmentApplicationSchema,
);
export default InstallmentApplication;
