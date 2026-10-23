import mongoose from "mongoose";

// Suppliers for inventory acquisition (FR1.6.2 — Supplier Details).
// Deactivation is a soft delete so restock history remains auditable.
const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a supplier name"],
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
