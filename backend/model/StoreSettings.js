import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
    taxRate: { type: Number, min: 0, default: 12 },
    defaultLowStockThreshold: { type: Number, min: 1, default: 5 },
    downpaymentRefundable: {
      type: String,
      enum: ["forfeited", "refundable"],
      default: "forfeited",
    },
    globalShippingFee: { type: Number, min: 0, default: 350 },
  },
  { timestamps: true },
);

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);
export default StoreSettings;
