import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema(
  {
    transactionRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["restock", "sale", "reserve", "release", "cancellation", "adjustment"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    orderRef: {
      type: String,
      default: "",
      trim: true,
    },
    supplierId: {
      type: String,
      default: "",
      trim: true,
    },
    supplierName: {
      type: String,
      default: "",
      trim: true,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });
inventoryTransactionSchema.index({ supplierId: 1, type: 1, createdAt: -1 });

const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema,
);

export default InventoryTransaction;
