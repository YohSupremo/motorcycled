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
    address: { type: String },
    barangay: { type: String },
    city: { type: String },
    postalCode: { type: String },
    fulfillmentMethod: { type: String, enum: ["delivery", "pickup"] },
    branch: { type: String },
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
      enum: ["cash_on_releasing", "bank_deposit", "gcash", "maya"],
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

// Auto-generate orderNumber before validation
orderSchema.pre("validate", async function () {
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

const Order = mongoose.model("Order", orderSchema);
export default Order;
