import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
  },
  { timestamps: true },
);

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);
export default StoreSettings;
