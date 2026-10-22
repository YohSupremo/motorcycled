import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
    initialCapital: {
      type: Number,
      default: 0,
      min: [0, "Initial capital cannot be negative"],
    },
  },
  { timestamps: true },
);

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);
export default StoreSettings;
