import mongoose from "mongoose";
import Product from "../model/Product.js";
import InventoryTransaction from "../model/InventoryTransaction.js";
import Supplier from "../model/Supplier.js";
import { runInTransaction } from "../utils/transaction.js";

class HttpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const formatTransaction = (transaction) => {
  const quantityChange = Number(transaction.quantityChange || 0);
  const unitCost = Number(transaction.unitCost || 0);

  return {
    id: transaction.transactionRef,
    date: new Date(transaction.createdAt).toISOString().slice(0, 16).replace("T", " "),
    createdAt: transaction.createdAt,
    product: transaction.productName,
    productId: transaction.product ? String(transaction.product) : "",
    type: transaction.type,
    quantityChange,
    orderRef: transaction.orderRef,
    supplierId: transaction.supplierId || "",
    supplierName: transaction.supplierName || "",
    unitCost,
    totalCost: Math.abs(quantityChange) * unitCost,
    performedBy: transaction.performedByName || "Admin",
    note: transaction.note,
  };
};

const makeTransactionRef = () =>
  `TXN-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

const performedByName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Admin";

const parseDateRange = (dateFrom, dateTo) => {
  const range = {};

  if (dateFrom && !Number.isNaN(Date.parse(dateFrom))) {
    range.$gte = new Date(dateFrom);
  }

  if (dateTo && !Number.isNaN(Date.parse(dateTo))) {
    const end = new Date(dateTo);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateTo))) {
      end.setHours(23, 59, 59, 999);
    }
    range.$lte = end;
  }

  return range;
};

// GET /api/v1/admin/inventory/transactions
// Optional filters: type, supplierId, productId, brandId, categoryId,
// dateFrom, dateTo, limit
export const getInventoryTransactions = async (req, res) => {
  try {
    const { type, supplierId, productId, brandId, categoryId, dateFrom, dateTo } =
      req.query;

    const match = {};

    if (type && type !== "All" && type !== "all") {
      match.type = type;
    }

    if (supplierId) {
      match.supplierId = cleanString(supplierId);
    }

    const productConditions = [];

    if (productId && mongoose.isValidObjectId(productId)) {
      productConditions.push({ product: new mongoose.Types.ObjectId(productId) });
    }

    if (
      (brandId && mongoose.isValidObjectId(brandId)) ||
      (categoryId && mongoose.isValidObjectId(categoryId))
    ) {
      const productFilter = {};
      if (brandId && mongoose.isValidObjectId(brandId)) {
        productFilter.brand = brandId;
      }
      if (categoryId && mongoose.isValidObjectId(categoryId)) {
        productFilter.category = categoryId;
      }

      const productIds = await Product.find(productFilter).distinct("_id");
      productConditions.push({ product: { $in: productIds } });
    }

    if (productConditions.length === 1) {
      Object.assign(match, productConditions[0]);
    } else if (productConditions.length > 1) {
      match.$and = productConditions;
    }

    const dateRange = parseDateRange(dateFrom, dateTo);
    if (Object.keys(dateRange).length > 0) {
      match.createdAt = dateRange;
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

    const [transactions, summaryRows] = await Promise.all([
      InventoryTransaction.find(match).sort({ createdAt: -1 }).limit(limit).lean(),
      InventoryTransaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalUnits: { $sum: "$quantityChange" },
            totalCost: {
              $sum: { $multiply: [{ $abs: "$quantityChange" }, "$unitCost"] },
            },
          },
        },
      ]),
    ]);

    const summary = summaryRows[0] || {};

    return res.status(200).json({
      success: true,
      transactions: transactions.map(formatTransaction),
      summary: {
        totalEntries: summary.totalEntries || 0,
        totalUnits: summary.totalUnits || 0,
        totalCost: summary.totalCost || 0,
      },
    });
  } catch (error) {
    console.error("getInventoryTransactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load stock transactions",
    });
  }
};

// POST /api/v1/admin/inventory/restock
// Legacy single-line restock endpoint. Kept for compatibility.
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

    const update = { $inc: { stock: restockQuantity } };
    if (cost > 0) {
      update.$set = { costPrice: cost };
    }

    const { transaction, stock } = await runInTransaction(async (session) => {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isArchived: false },
        update,
        { new: true, session },
      );

      if (!product) {
        throw new HttpError("Product not found", 404);
      }

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
            performedByName: performedByName(req.user),
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

// POST /api/v1/admin/inventory/bulk-restock
// Body: { referenceNo, restocks: [{ productId, supplierId, quantity, unitCost, note }] }
// All lines commit in one MongoDB transaction, or none do.
export const bulkRestock = async (req, res) => {
  try {
    const { referenceNo } = req.body;
    const restocks = Array.isArray(req.body.restocks) ? req.body.restocks : [];

    if (restocks.length === 0) {
      throw new HttpError("Add at least one restock line", 400);
    }

    const failedLines = [];
    const prepared = [];
    const productCache = new Map();
    const supplierCache = new Map();
    const batchRef =
      cleanString(referenceNo) || `PO-BULK-${Date.now().toString().slice(-8)}`;

    for (let index = 0; index < restocks.length; index += 1) {
      const line = restocks[index] || {};
      const productId = cleanString(line.productId);
      const supplierId = cleanString(line.supplierId);
      const quantity = Number(line.quantity);
      const unitCost = Number(line.unitCost);
      const note = cleanString(line.note ?? line.notes);

      if (!mongoose.isValidObjectId(productId)) {
        failedLines.push({ lineIndex: index, productId, reason: "Select a valid product" });
        continue;
      }

      if (!mongoose.isValidObjectId(supplierId)) {
        failedLines.push({ lineIndex: index, productId, reason: "Select a valid supplier" });
        continue;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        failedLines.push({
          lineIndex: index,
          productId,
          reason: "Quantity must be a whole number of at least 1",
        });
        continue;
      }

      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        failedLines.push({
          lineIndex: index,
          productId,
          reason: "Unit cost must be greater than zero",
        });
        continue;
      }

      let supplier = supplierCache.get(supplierId);
      if (supplier === undefined) {
        supplier = await Supplier.findById(supplierId).lean();
        supplierCache.set(supplierId, supplier);
      }

      if (!supplier || supplier.deletedAt) {
        failedLines.push({
          lineIndex: index,
          productId,
          reason: "Supplier not found or deactivated",
        });
        continue;
      }

      let product = productCache.get(productId);
      if (product === undefined) {
        product = await Product.findById(productId).lean();
        productCache.set(productId, product);
      }

      if (!product || product.isArchived) {
        failedLines.push({
          lineIndex: index,
          productId,
          reason: "Product not found or archived",
        });
        continue;
      }

      if (unitCost >= Number(product.price || 0)) {
        failedLines.push({
          lineIndex: index,
          productId,
          reason: `Unit cost must be less than the selling price (${Number(
            product.price || 0,
          ).toLocaleString()})`,
        });
        continue;
      }

      prepared.push({
        productId,
        supplierId,
        supplier,
        product,
        quantity,
        unitCost,
        note,
      });
    }

    if (failedLines.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some restock lines could not be processed",
        failedLines,
      });
    }

    const createdRows = await runInTransaction(async (session) => {
      const rows = [];

      for (const line of prepared) {
        const product = await Product.findOneAndUpdate(
          { _id: line.productId, isArchived: false },
          {
            $inc: { stock: line.quantity },
            $set: { costPrice: line.unitCost },
          },
          { new: true, session },
        );

        if (!product) {
          throw new HttpError(
            `Product "${line.product.name}" is no longer available`,
            409,
          );
        }

        const [transaction] = await InventoryTransaction.create(
          [
            {
              transactionRef: makeTransactionRef(),
              product: product._id,
              productName: product.name,
              type: "restock",
              quantityChange: line.quantity,
              orderRef: batchRef,
              supplierId: line.supplierId,
              supplierName: line.supplier.name,
              unitCost: line.unitCost,
              performedBy: req.user._id,
              performedByName: performedByName(req.user),
              note: line.note,
            },
          ],
          { session },
        );

        rows.push({ transaction, stock: product.stock });
      }

      return rows;
    });

    return res.status(201).json({
      success: true,
      message: `Restocked ${createdRows.length} line${
        createdRows.length === 1 ? "" : "s"
      }`,
      referenceNo: batchRef,
      transactions: createdRows.map((row) => formatTransaction(row.transaction)),
      stocks: createdRows.map((row) => ({
        productId: String(row.transaction.product),
        stock: row.stock,
      })),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("bulkRestock error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error saving restocks",
    });
  }
};
