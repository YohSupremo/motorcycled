import mongoose from "mongoose";
import Product from "../model/Product.js";
import InventoryTransaction from "../model/InventoryTransaction.js";
import { runInTransaction } from "../utils/transaction.js";

class HttpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

const formatTransaction = (transaction) => ({
  id: transaction.transactionRef,
  date: new Date(transaction.createdAt).toISOString().slice(0, 16).replace("T", " "),
  product: transaction.productName,
  type: transaction.type,
  quantityChange: transaction.quantityChange,
  orderRef: transaction.orderRef,
  performedBy: transaction.performedByName || "Admin",
  note: transaction.note,
});

const makeTransactionRef = () =>
  `TXN-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

export const getInventoryTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      transactions: transactions.map(formatTransaction),
    });
  } catch (error) {
    console.error("getInventoryTransactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load stock transactions",
    });
  }
};

export const createRestock = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      unitCost = 0,
      referenceNo,
      supplierId = "",
      supplierName = "",
      notes = "",
    } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      throw new HttpError("Select a valid product", 400);
    }

    const restockQuantity = Number(quantity);
    if (!Number.isInteger(restockQuantity) || restockQuantity < 1) {
      throw new HttpError("Quantity must be a whole number of at least 1", 400);
    }

    const cost = Number(unitCost);
    if (!Number.isFinite(cost) || cost < 0) {
      throw new HttpError("Unit cost must be zero or greater", 400);
    }

    const purchaseOrderRef = cleanString(referenceNo);
    if (!purchaseOrderRef) {
      throw new HttpError("Purchase order reference is required", 400);
    }

    const { transaction, stock } = await runInTransaction(async (session) => {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isArchived: false },
        { $inc: { stock: restockQuantity } },
        { new: true, session },
      );

      if (!product) {
        throw new HttpError("Product not found", 404);
      }

      const performedByName =
        [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim() || "Admin";

      const [created] = await InventoryTransaction.create(
        [
          {
            transactionRef: makeTransactionRef(),
            product: product._id,
            productName: product.name,
            type: "restock",
            quantityChange: restockQuantity,
            orderRef: purchaseOrderRef,
            supplierId: cleanString(supplierId),
            supplierName: cleanString(supplierName),
            unitCost: cost,
            performedBy: req.user._id,
            performedByName,
            note: cleanString(notes),
          },
        ],
        { session },
      );

      return { transaction: created, stock: product.stock };
    });

    return res.status(201).json({
      success: true,
      message: `Restocked ${transaction.productName}`,
      transaction: formatTransaction(transaction),
      stock,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("createRestock error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error saving restock",
    });
  }
};
