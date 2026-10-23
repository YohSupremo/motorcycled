import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    // Cost snapshot at the time of sale, used for COGS reporting (FR1.9).
    costPrice: { type: Number, default: 0, min: [0, "Cost price cannot be negative"] },
    image: { type: String },
    itemType: {
      type: String,
      enum: ["motorcycle", "part", "accessory", "service"],
      required: true,
    },
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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    checkoutSessionId: { type: String, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingInfo: shippingInfoSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash_on_releasing", "cash_on_delivery", "cod", "bank_deposit", "gcash", "maya"],
    },
    paymentDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      referenceNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "refunded"],
      default: "pending",
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "ready_for_pickup", "shipped", "completed", "canceled"],
      default: "pending",
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

// Auto-generate orderNumber and enforce paymentStatus before validation
orderSchema.pre("validate", async function () {
  if (this.paymentMethod) {
    const m = String(this.paymentMethod).toLowerCase().trim();
    if (m === "gcash" || m === "maya" || m === "bank_deposit") {
      // Online payments are never COD
      if (!this.paymentStatus || this.paymentStatus === "pending") {
        this.paymentStatus = "paid";
      }
      if (!this.paidAt) {
        this.paidAt = new Date();
      }
    } else {
      const isCod =
        m === "cash_on_releasing" ||
        m === "cash_on_delivery" ||
        m === "cod" ||
        m === "cash";
      if (!isCod) {
        if (!this.paymentStatus || this.paymentStatus === "pending") {
          this.paymentStatus = "paid";
        }
        if (!this.paidAt) {
          this.paidAt = new Date();
        }
      }
    }
  }

  if (!this.orderNumber) {
    try {
      const year = new Date().getFullYear();
      const count = await mongoose.model("Order").countDocuments();
      const rand = Math.floor(100 + Math.random() * 900);
      this.orderNumber = `MC-${year}-${String(count + 1).padStart(5, "0")}-${rand}`;
    } catch (err) {
      this.orderNumber = `MC-${new Date().getFullYear()}-${Date.now()}`;
    }
  }
});

// Indexes for fast customer order lookups and admin order status filtering
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
