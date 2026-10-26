import mongoose from "mongoose";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import InstallmentApplication from "../model/InstallmentApplication.js";
import Category from "../model/Category.js";
import User from "../model/User.js";
import InventoryTransaction from "../model/InventoryTransaction.js";
import CreditVerification from "../model/CreditVerification.js";
import { cloudConf } from "../config/cloudinary.js";
import { notifyOrderPlaced, notifyInstallmentUpdate, sendNotification } from "../services/notificationService.js";
import { generateOrderInvoicePDF } from "../services/pdfService.js";
import { sendOrderStatusEmail } from "../services/emailService.js";
import { runInTransaction } from "../utils/transaction.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PROCESSING_FEE = 1500;
const SHIPPING_DELIVERY = 350;
const INTEREST_RATES = { 12: 0.07, 24: 0.08, 36: 0.09 };

class HttpError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Compute all installment financing figures from a product price + term.
 */
function computeFinancing(productPrice, termMonths) {
  const interestRate = INTEREST_RATES[termMonths];
  const downPayment = Math.round(productPrice * 0.2);
  const financedAmount = productPrice - downPayment;
  const monthlyPayment = Math.round((financedAmount * (1 + interestRate)) / termMonths);
  const totalRepayment =
    downPayment + monthlyPayment * termMonths + PROCESSING_FEE;
  return { interestRate, downPayment, financedAmount, monthlyPayment, totalRepayment };
}

/**
 * Check if the chosen payment method is cash on delivery / cash on releasing / COD.
 * Note: Digital wallets like 'gcash' contain the letters 'cash' but are NOT cash on delivery.
 */
const makeTransactionRef = (prefix = "TXN") =>
  `${prefix}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

const performedByName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Customer";

export const isCashOnDeliveryMethod = (method) => {
  if (!method) return false;
  const m = String(method).toLowerCase().trim();
  if (m === "gcash" || m === "maya" || m === "bank_deposit") {
    return false;
  }
  return (
    m === "cash_on_releasing" ||
    m === "cash_on_delivery" ||
    m === "cod" ||
    m === "cash"
  );
};

// ─── newCheckout ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/checkout
 * Processes a checkout session: creates Orders for cash purchases and
 * InstallmentApplications for installment purchases. Idempotent on
 * checkoutSessionId and atomic across stock, order, and application writes.
 */
export const newCheckout = async (req, res) => {
  try {
    const { checkoutSessionId, items, shippingInfo, paymentMethod, paymentDetails } = req.body;

    // ── 1. Basic validation ──────────────────────────────────────────────────
    if (!checkoutSessionId) {
      return res.status(400).json({ success: false, message: "checkoutSessionId is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items array is required and must be non-empty" });
    }
    if (!shippingInfo) {
      return res.status(400).json({ success: false, message: "shippingInfo is required" });
    }
    if (!shippingInfo.recipientName || !shippingInfo.contactNumber || !shippingInfo.fulfillmentMethod) {
      return res.status(400).json({
        success: false,
        message: "shippingInfo must include recipientName, contactNumber, and fulfillmentMethod",
      });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "paymentMethod is required" });
    }

    // ── 1.5. Credit verification guard ──────────────────────────────────────
    // Installment financing requires an approved credit verification on file.
    const hasInstallmentItem = items.some((i) => i.purchaseMethod === "installment");
    if (hasInstallmentItem) {
      const creditVerification = await CreditVerification.findOne({ user: req.user._id }).select("status").lean();
      if (!creditVerification || creditVerification.status !== "approved") {
        const statusMsg = !creditVerification
          ? "You have not submitted credit verification documents."
          : creditVerification.status === "pending"
          ? "Your credit verification is still under review."
          : "Your credit verification was not approved.";
        return res.status(403).json({
          success: false,
          message: `Installment financing requires approved credit verification. ${statusMsg} Please visit your profile to manage your verification status.`,
          creditVerificationRequired: true,
        });
      }
    }

    // ── 2. Idempotency check ─────────────────────────────────────────────────
    const [existingOrders, existingApps] = await Promise.all([
      Order.find({ checkoutSessionId }),
      InstallmentApplication.find({ checkoutSessionId }),
    ]);

    if (existingOrders.length > 0 || existingApps.length > 0) {
      const previousResults = [
        ...existingOrders.map((o) => ({
          type: "order",
          reference: o.orderNumber,
          status: "success",
        })),
        ...existingApps.map((a) => ({
          type: "application",
          reference: a.applicationRef,
          status: "success",
        })),
      ];
      return res.status(200).json({
        success: true,
        message: "Checkout session already processed (idempotent response)",
        data: {
          results: previousResults,
          summary: {
            totalOrders: existingOrders.length,
            totalApplications: existingApps.length,
            sessionId: checkoutSessionId,
          },
        },
      });
    }

    // ── 3. Fetch products + determine types ──────────────────────────────────
    const motorcycleCategory = await Category.findOne({ name: "Motorcycles" });
    const motorcycleCategoryId = motorcycleCategory ? motorcycleCategory._id.toString() : null;

    const results = [];
    const motorcycleCashItems = [];
    const motorcycleInstallmentItems = [];
    const partsItems = [];

    for (const item of items) {
      const { productId, quantity = 1, purchaseMethod, termMonths } = item;

      if (!productId) {
        results.push({ productId: null, status: "error", error: "productId is required" });
        continue;
      }

      let product;
      try {
        product = await Product.findById(productId).populate("category");
      } catch {
        results.push({ productId, status: "error", error: "Invalid product ID" });
        continue;
      }

      if (!product) {
        results.push({ productId, status: "error", error: "Product not found" });
        continue;
      }
      if (product.isArchived) {
        results.push({ productId, status: "error", error: "Product is no longer available" });
        continue;
      }

      const isMotorcycle =
        product.category &&
        (product.category._id.toString() === motorcycleCategoryId ||
          product.category.name === "Motorcycles");

      const itemType = isMotorcycle ? "motorcycle" : "part";

      if (!isMotorcycle) {
        // Parts/accessories — cash only
        if (purchaseMethod === "installment") {
          results.push({
            productId,
            status: "error",
            error: "Parts and accessories can only be purchased with cash",
          });
          continue;
        }
        if (product.stock < quantity) {
          results.push({ productId, status: "error", error: "Insufficient stock" });
          continue;
        }
        partsItems.push({ product, quantity, itemType });
      } else {
        // Motorcycle
        if (purchaseMethod === "installment") {
          if (!termMonths || !INTEREST_RATES[termMonths]) {
            results.push({
              productId,
              status: "error",
              error: "termMonths must be 12, 24, or 36 for installment purchases",
            });
            continue;
          }
          motorcycleInstallmentItems.push({ product, quantity: 1, itemType, termMonths });
        } else {
          // cash
          if (product.stock < quantity) {
            results.push({ productId, status: "error", error: "Insufficient stock" });
            continue;
          }
          motorcycleCashItems.push({ product, quantity, itemType });
        }
      }
    }

    const itemErrors = results.filter((result) => result.status === "error");
    if (itemErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Some items could not be checked out. Remove unavailable items and try again.",
        errors: itemErrors,
      });
    }

    // ── 3.5. Separate logistics for Parts vs Motorcycles ─────────────────────
    // Motorcycles are ALWAYS released at the authorized showroom bay (pickup + PDI)
    const motorcycleShippingInfo = {
      ...shippingInfo,
      fulfillmentMethod: "pickup",
      branch: shippingInfo.branch,
    };

    // Parts can be courier delivery (to customer home) or showroom pickup
    const partsFulfillmentMethod =
      shippingInfo.partsFulfillmentMethod ||
      shippingInfo.fulfillmentMethod ||
      "pickup";

    const partsShippingInfo = {
      ...shippingInfo,
      fulfillmentMethod: partsFulfillmentMethod,
      branch: partsFulfillmentMethod === "pickup" ? shippingInfo.branch : undefined,
    };

    const shippingPrice =
      partsFulfillmentMethod === "delivery" ? SHIPPING_DELIVERY : 0;

    const { createdOrders, transactionResults } = await runInTransaction(async (session) => {
      const orders = [];
      const transactionResults = [];

      // ── 4. Create parts Order (grouped) ────────────────────────────────────
      if (partsItems.length > 0) {
        const orderItems = [];

        for (const pi of partsItems) {
          const updated = await Product.findOneAndUpdate(
            { _id: pi.product._id, stock: { $gte: pi.quantity } },
            { $inc: { stock: -pi.quantity } },
            { new: true, session },
          );

          if (!updated) {
            throw new HttpError(
              `"${pi.product.name}" no longer has enough stock.`,
              409,
              { productId: pi.product._id.toString(), productName: pi.product.name },
            );
          }

          orderItems.push({
            product: pi.product._id,
            name: pi.product.name,
            quantity: pi.quantity,
            price: pi.product.price,
            costPrice: Number(pi.product.costPrice || 0),
            image: pi.product.images?.[0]?.url || "",
            itemType: pi.itemType,
          });
        }

        const itemsPrice = orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const totalPrice = itemsPrice + shippingPrice;

        const isCod = isCashOnDeliveryMethod(paymentMethod);
        const partsOrder = new Order({
          checkoutSessionId,
          user: req.user._id,
          orderItems,
          shippingInfo: partsShippingInfo,
          paymentMethod,
          paymentDetails: paymentDetails || {},
          paymentStatus: isCod ? "pending" : "paid",
          paidAt: isCod ? undefined : new Date(),
          itemsPrice,
          shippingPrice,
          totalPrice,
        });
        await partsOrder.save({ session });
        orders.push(partsOrder);

        const customerName = performedByName(req.user);
        for (const item of orderItems) {
          await InventoryTransaction.create(
            [
              {
                transactionRef: makeTransactionRef("TXN-SALE"),
                product: item.product,
                productName: item.name,
                type: "sale",
                quantityChange: -item.quantity,
                orderRef: partsOrder.orderNumber,
                unitCost: Number(item.costPrice || 0),
                performedBy: req.user._id,
                performedByName: customerName,
                note: `Customer purchase via Order #${partsOrder.orderNumber}`,
              },
            ],
            { session },
          );

          transactionResults.push({
            productId: item.product.toString(),
            productName: item.name,
            status: "success",
            type: "order",
            reference: partsOrder.orderNumber,
          });
        }
      }

      // ── 5. Create individual Orders for cash motorcycle purchases ───────────
      for (const mi of motorcycleCashItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: mi.product._id, stock: { $gte: mi.quantity } },
          { $inc: { stock: -mi.quantity } },
          { new: true, session },
        );

        if (!updated) {
          throw new HttpError(
            `"${mi.product.name}" no longer has enough stock.`,
            409,
            { productId: mi.product._id.toString(), productName: mi.product.name },
          );
        }

        const itemsPrice = mi.product.price * mi.quantity;
        // Motorcycles are always picked up from dealership for delivery coordination;
        // use shippingPrice = 0 for motorcycles (dealership standard).
        const isCod = isCashOnDeliveryMethod(paymentMethod);
        const motoOrder = new Order({
          checkoutSessionId,
          user: req.user._id,
          orderItems: [
            {
              product: mi.product._id,
              name: mi.product.name,
              quantity: mi.quantity,
              price: mi.product.price,
              costPrice: Number(mi.product.costPrice || 0),
              image: mi.product.images?.[0]?.url || "",
              itemType: mi.itemType,
            },
          ],
          shippingInfo: motorcycleShippingInfo,
          paymentMethod,
          paymentDetails: paymentDetails || {},
          paymentStatus: isCod ? "pending" : "paid",
          paidAt: isCod ? undefined : new Date(),
          itemsPrice,
          shippingPrice: 0,
          totalPrice: itemsPrice,
        });
        await motoOrder.save({ session });
        orders.push(motoOrder);

        const customerName = performedByName(req.user);
        await InventoryTransaction.create(
          [
            {
              transactionRef: makeTransactionRef("TXN-SALE"),
              product: mi.product._id,
              productName: mi.product.name,
              type: "sale",
              quantityChange: -mi.quantity,
              orderRef: motoOrder.orderNumber,
              unitCost: Number(mi.product.costPrice || 0),
              performedBy: req.user._id,
              performedByName: customerName,
              note: `Motorcycle purchase via Order #${motoOrder.orderNumber}`,
            },
          ],
          { session },
        );

        transactionResults.push({
          productId: mi.product._id.toString(),
          productName: mi.product.name,
          status: "success",
          type: "order",
          reference: motoOrder.orderNumber,
        });
      }

      // ── 6. Create InstallmentApplications (no stock deduction, no payment collected) ──
      // IMPORTANT: downpayment is NOT collected at checkout.
      // The customer will be prompted to pay ONLY after admin approves the application.
      for (const ii of motorcycleInstallmentItems) {
        const financing = computeFinancing(ii.product.price, ii.termMonths);

        const documentUploads = req.body.documentUploads || {};
        const verificationMethod = documentUploads.verificationMethod || "showroom_physical";

        const app = new InstallmentApplication({
          checkoutSessionId,
          user: req.user._id,
          product: ii.product._id,
          productName: ii.product.name,
          productPrice: ii.product.price,
          productImage: ii.product.images?.[0]?.url || "",
          termMonths: ii.termMonths,
          downPayment: financing.downPayment,
          financedAmount: financing.financedAmount,
          interestRate: financing.interestRate,
          monthlyPayment: financing.monthlyPayment,
          processingFee: PROCESSING_FEE,
          totalRepayment: financing.totalRepayment,
          shippingInfo: motorcycleShippingInfo,
          // Downpayment details are NOT set at checkout — collected after approval only
          downPaymentMethod: null,
          downPaymentSettled: false,
          documentUploads: {
            verificationMethod,
            idCard: documentUploads.idCard || null,
            proofOfIncome: documentUploads.proofOfIncome || null,
            documentVerified: false,
          },
        });
        await app.save({ session });

        transactionResults.push({
          productId: ii.product._id.toString(),
          productName: ii.product.name,
          status: "success",
          type: "application",
          reference: app.applicationRef,
        });
      }

      return { createdOrders: orders, transactionResults };
    });

    results.push(...transactionResults);

    // Notifications run only after the transaction has committed.
    for (const order of createdOrders) {
      try {
        await notifyOrderPlaced(order, req.user);
      } catch (notificationError) {
        console.error(
          `[newCheckout] Order notification failed for ${order.orderNumber}:`,
          notificationError.message,
        );
      }
    }

    // ── 7. Build summary ──────────────────────────────────────────────────────
    const totalOrders = results.filter((r) => r.status === "success" && r.type === "order").length;
    const totalApplications = results.filter(
      (r) => r.status === "success" && r.type === "application",
    ).length;

    return res.status(201).json({
      success: true,
      message: "Checkout processed",
      data: {
        results,
        summary: { totalOrders, totalApplications, sessionId: checkoutSessionId },
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.details ? { errors: [error.details] } : {}),
      });
    }

    console.error("newCheckout error:", error);
    return res.status(500).json({ success: false, message: "Server error during checkout" });
  }
};

// ─── newOrder (Reference / Course API Compatibility) ──────────────────────────
// POST /api/v1/order/new
// Reference: itcp318-s3a-2026/backend/controllers/order.js
export const newOrder = async (req, res) => {
  try {
    const {
      orderItems = [],
      shippingInfo = {},
      itemsPrice,
      taxPrice = 0,
      shippingPrice = 0,
      totalPrice,
      paymentMethod = "cash_on_releasing",
      paymentInfo,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: "No order items provided" });
    }

    const items = orderItems.map((item) => ({
      product: item.product || item._id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      costPrice: Number(item.costPrice || 0),
      image: item.image || "",
      itemType: item.itemType || "part",
    }));

    const finalShippingInfo = {
      recipientName:
        shippingInfo.recipientName ||
        shippingInfo.name ||
        `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
        "Customer",
      contactNumber: shippingInfo.contactNumber || shippingInfo.phoneNo || "—",
      email: shippingInfo.email || req.user.email || "—",
      address: shippingInfo.address || "—",
      city: shippingInfo.city || "—",
      postalCode: shippingInfo.postalCode || "—",
      fulfillmentMethod: shippingInfo.fulfillmentMethod || "delivery",
    };

    const calculatedItemsPrice =
      itemsPrice !== undefined
        ? Number(itemsPrice)
        : items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const calculatedTotalPrice =
      totalPrice !== undefined
        ? Number(totalPrice)
        : calculatedItemsPrice + Number(shippingPrice) + Number(taxPrice);

    const isCod = isCashOnDeliveryMethod(paymentMethod);
    const resolvedPaymentStatus =
      paymentInfo?.status === "succeeded" || !isCod ? "paid" : "pending";
    const resolvedPaidAt =
      paymentInfo?.status === "succeeded" || !isCod ? new Date() : undefined;

    const order = new Order({
      checkoutSessionId: req.body.checkoutSessionId || `session_${Date.now()}`,
      user: req.user._id,
      orderItems: items,
      shippingInfo: finalShippingInfo,
      paymentMethod: [
        "cash_on_releasing",
        "cash_on_delivery",
        "cod",
        "bank_deposit",
        "gcash",
        "maya",
      ].includes(paymentMethod)
        ? paymentMethod
        : "cash_on_releasing",
      paymentStatus: resolvedPaymentStatus,
      itemsPrice: calculatedItemsPrice,
      shippingPrice: Number(shippingPrice) || 0,
      totalPrice: calculatedTotalPrice,
      paidAt: resolvedPaidAt,
    });

    await order.save();
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("newOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to create order" });
  }
};

// ─── getMyOrders ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders/me
 * Returns all orders and installment applications belonging to the logged-in user.
 */
export const getMyOrders = async (req, res) => {
  try {
    const [orders, applications] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate("orderItems.product", "name category images")
        .sort({ createdAt: -1 }),
      InstallmentApplication.find({ user: req.user._id }).sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      applications,
      data: { orders, applications },
    });
  } catch (error) {
    console.error("getMyOrders error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching orders" });
  }
};

// ─── getOrderDetails ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/order/:id
 * Returns a single order. Accessible by the owning customer or an admin.
 */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "orderItems.product",
      "name category images",
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, order, data: { order } });
  } catch (error) {
    console.error("getOrderDetails error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching order" });
  }
};

// ─── getApplicationDetails ─────────────────────────────────────────────────────

/**
 * GET /api/v1/application/:id
 * Returns a single installment application. Accessible by the owning customer or an admin.
 */
export const getApplicationDetails = async (req, res) => {
  try {
    const application = await InstallmentApplication.findById(req.params.id).populate(
      "product",
      "name category images price",
    );

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Installment application not found" });
    }

    const isOwner = application.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, application, data: { application } });
  } catch (error) {
    console.error("getApplicationDetails error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching application" });
  }
};

// ─── getAdminOrders ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/orders
 * Returns all orders (admin only).
 */
export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email contactNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
      data: { orders, total: orders.length },
    });
  } catch (error) {
    console.error("getAdminOrders error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching orders" });
  }
};

// ─── getAdminApplications ──────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/applications
 * Returns all installment applications (admin only).
 */
export const getAdminApplications = async (req, res) => {
  try {
    const applications = await InstallmentApplication.find()
      .populate("user", "firstName lastName email contactNumber validId proofOfIncome")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
      data: { applications, total: applications.length },
    });
  } catch (error) {
    console.error("getAdminApplications error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching applications" });
  }
};

// ─── updateOrderStatus ─────────────────────────────────────────────────────────

// Allowed forward transitions for orderStatus
const STATUS_TRANSITIONS = {
  pending: ["processing", "canceled"],
  processing: ["ready_for_pickup", "shipped", "canceled"],
  ready_for_pickup: ["completed", "canceled"],
  shipped: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

/**
 * PUT /api/v1/admin/order/:id/status
 * Updates order and/or payment status (admin only).
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, paidAt } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Validate orderStatus transition if provided
    if (orderStatus && orderStatus !== order.orderStatus) {
      const allowed = STATUS_TRANSITIONS[order.orderStatus] || [];
      if (!allowed.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition order from '${order.orderStatus}' to '${orderStatus}'`,
        });
      }
      const previousStatus = order.orderStatus;
      order.orderStatus = orderStatus;

      // When cancelling an order that was pending or processing, restore inventory stock
      if (orderStatus === "canceled" && ["pending", "processing"].includes(previousStatus)) {
        const adminName = performedByName(req.user);
        for (const item of order.orderItems || []) {
          if (item.product && item.quantity > 0) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });

            await InventoryTransaction.create({
              transactionRef: makeTransactionRef("TXN-CNCL"),
              product: item.product,
              productName: item.name,
              type: "cancellation",
              quantityChange: item.quantity,
              orderRef: order.orderNumber,
              unitCost: Number(item.costPrice || 0),
              performedBy: req.user._id,
              performedByName: adminName,
              note: `Restored stock from canceled order #${order.orderNumber}`,
            });
          }
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Auto-mark payment as paid when order reaches completed status (e.g., Cash on Releasing / COD)
    if (order.orderStatus === "completed" && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      if (!order.paidAt) {
        order.paidAt = new Date();
      }
    }

    if (paidAt) {
      order.paidAt = new Date(paidAt);
    }

    await order.save();

    // Populate user and order details for email + PDF receipt generation
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "firstName lastName email contactNumber")
      .populate("orderItems.product", "name category brand");

    let emailResult = null;
    let pdfBuffer = null;

    try {
      // 1. Generate the official PDF invoice/receipt
      pdfBuffer = await generateOrderInvoicePDF(populatedOrder, populatedOrder.user);

      // 2. Email customer on status update with item list, subtotal, and total + PDF attachment
      emailResult = await sendOrderStatusEmail({
        order: populatedOrder,
        user: populatedOrder.user,
        newStatus: order.orderStatus,
        pdfBuffer,
      });

      // 3. Persist notification in database ledger
      await sendNotification({
        recipientId: populatedOrder.user?._id || order.user,
        type: "order_status_update",
        subject: `Order ${order.orderNumber} Status Updated: ${order.orderStatus.toUpperCase()}`,
        message: `Your order status has been updated to ${order.orderStatus.toUpperCase()}. An updated receipt has been emailed to ${populatedOrder.user?.email || order.shippingInfo?.email}.`,
        orderId: order._id,
      });
    } catch (notifyErr) {
      console.error("[updateOrderStatus] Notification/PDF receipt error:", notifyErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated and receipt emailed to customer",
      data: {
        order,
        emailSent: emailResult?.success ?? false,
        emailRecipient: populatedOrder.user?.email || order.shippingInfo?.email,
        emailPreviewUrl: emailResult?.previewUrl || null,
      },
    });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error updating order" });
  }
};

// ─── approveApplication ────────────────────────────────────────────────────────

/**
 * PUT /api/v1/admin/application/:id/approve
 * Approves an installment application with confirmed financing terms (admin only).
 */
export const approveApplication = async (req, res) => {
  try {
    const { confirmedTerms } = req.body;

    if (!confirmedTerms) {
      return res.status(400).json({ success: false, message: "confirmedTerms is required" });
    }

    const application = await InstallmentApplication.findById(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Installment application not found" });
    }

    if (application.applicationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already '${application.applicationStatus}' and cannot be approved`,
      });
    }

    application.applicationStatus = "approved";
    application.approvedAt = new Date();
    application.confirmedTerms = confirmedTerms;

    // ── Purge uploaded verification documents (DPA compliance) ──────────────
    if (application.documentUploads) {
      if (application.documentUploads.idCard?.publicId) {
        try {
          await cloudConf.uploader.destroy(application.documentUploads.idCard.publicId);
        } catch (cErr) {
          console.error("Cloudinary purge error for idCard:", cErr);
        }
      }
      if (application.documentUploads.proofOfIncome?.publicId) {
        try {
          await cloudConf.uploader.destroy(application.documentUploads.proofOfIncome.publicId);
        } catch (cErr) {
          console.error("Cloudinary purge error for proofOfIncome:", cErr);
        }
      }
      application.documentUploads.documentVerified = true;
      application.documentUploads.purgedAt = new Date();
      application.documentUploads.idCard = undefined;
      application.documentUploads.proofOfIncome = undefined;
    }

    await application.save();

    // ── Notify applicant to proceed with downpayment ─────────────────────────
    // NOTE: No money is collected here. The customer must visit Orders page and
    // submit their downpayment method. The order is created only after admin
    // calls confirmInstallmentOrder (PUT /admin/application/:id/confirm-order).
    const applicant = await User.findById(application.user);
    if (applicant) {
      notifyInstallmentUpdate(application, applicant, "approved");
    }

    return res.status(200).json({
      success: true,
      message: "Installment application approved. Customer notified to submit downpayment.",
      data: { application },
    });
  } catch (error) {
    console.error("approveApplication error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error approving application" });
  }
};

// ─── rejectApplication ─────────────────────────────────────────────────────────

/**
 * PUT /api/v1/admin/application/:id/reject
 * Rejects an installment application with an optional reason (admin only).
 */
export const rejectApplication = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const application = await InstallmentApplication.findById(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Installment application not found" });
    }

    if (application.applicationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already '${application.applicationStatus}' and cannot be rejected`,
      });
    }

    application.applicationStatus = "rejected";
    application.rejectedAt = new Date();
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }

    // Ephemeral document purge (DPA compliance)
    if (application.documentUploads) {
      if (application.documentUploads.idCard?.publicId) {
        try {
          await cloudConf.uploader.destroy(application.documentUploads.idCard.publicId);
        } catch (cErr) {
          console.error("Cloudinary purge error for idCard:", cErr);
        }
      }
      if (application.documentUploads.proofOfIncome?.publicId) {
        try {
          await cloudConf.uploader.destroy(application.documentUploads.proofOfIncome.publicId);
        } catch (cErr) {
          console.error("Cloudinary purge error for proofOfIncome:", cErr);
        }
      }
      application.documentUploads.purgedAt = new Date();
      application.documentUploads.idCard = undefined;
      application.documentUploads.proofOfIncome = undefined;
    }

    await application.save();

    const applicant = await User.findById(application.user);
    if (applicant) {
      notifyInstallmentUpdate(application, applicant, "rejected", rejectionReason);
    }

    return res.status(200).json({
      success: true,
      message: "Installment application rejected",
      data: { application },
    });
  } catch (error) {
    console.error("rejectApplication error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error rejecting application" });
  }
};

// ─── submitDownpayment ─────────────────────────────────────────────────────────

/**
 * PUT /api/v1/application/:id/submit-downpayment
 * Customer submits their chosen downpayment method and optional reference number
 * AFTER their application has been approved by admin.
 * Does NOT settle the downpayment — admin must call confirm-order to finalize.
 */
export const submitDownpayment = async (req, res) => {
  try {
    const { downPaymentMethod, referenceNumber } = req.body;

    const validMethods = ["cash_on_releasing", "gcash", "maya", "bank_deposit"];
    if (!downPaymentMethod || !validMethods.includes(downPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `downPaymentMethod must be one of: ${validMethods.join(", ")}.`,
      });
    }

    const application = await InstallmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Installment application not found" });
    }

    // Only the owning customer may submit a downpayment
    if (application.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Guard: application must be approved first
    if (application.applicationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Downpayment can only be submitted for approved applications (current status: '${application.applicationStatus}').`,
      });
    }

    // Guard: cannot re-submit once downpayment is already settled
    if (application.downPaymentSettled) {
      return res.status(409).json({
        success: false,
        message: "Downpayment has already been confirmed. No further action needed.",
      });
    }

    application.downPaymentMethod = downPaymentMethod;
    // Store reference number for online payments so admin can verify
    if (referenceNumber && downPaymentMethod !== "cash_on_releasing") {
      application.downPaymentReference = referenceNumber.trim();
    }

    await application.save();

    // Log the submission for admin visibility; the admin will see the updated
    // downPaymentMethod and downPaymentReference in the AdminOrders panel.
    console.log(
      `[submitDownpayment] ${req.user.firstName || "Customer"} submitted downpayment ` +
      `(${downPaymentMethod}) for ${application.applicationRef}` +
      (referenceNumber ? ` Ref: ${referenceNumber}` : "")
    );

    return res.status(200).json({
      success: true,
      message: downPaymentMethod === "cash_on_releasing"
        ? "Noted! Please bring your downpayment to the branch. The admin will confirm receipt and activate your loan."
        : "Downpayment submission received. The admin will verify your reference number and activate your loan shortly.",
      data: { application },
    });
  } catch (error) {
    console.error("submitDownpayment error:", error);
    return res.status(500).json({ success: false, message: "Server error submitting downpayment" });
  }
};

// ─── confirmInstallmentOrder ───────────────────────────────────────────────────

/**
 * PUT /api/v1/admin/application/:id/confirm-order
 * Called after downpayment is confirmed. Creates the linked Order for an
 * approved installment application and deducts stock (admin only).
 */
export const confirmInstallmentOrder = async (req, res) => {
  try {
    const { application, order } = await runInTransaction(async (session) => {
      const application = await InstallmentApplication.findById(req.params.id).session(session);

      if (!application) {
        throw new HttpError("Installment application not found", 404);
      }

      if (application.applicationStatus !== "approved") {
        throw new HttpError(
          `Application must be 'approved' before confirming an order (current: '${application.applicationStatus}')`,
          400,
        );
      }

      if (application.linkedOrderId) {
        throw new HttpError("An order has already been created for this application", 400);
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: application.product, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { new: true, session },
      );

      if (!updatedProduct) {
        throw new HttpError("Product is out of stock and cannot be ordered", 400);
      }

      // Use confirmed terms if available, otherwise fall back to application terms
      const terms = application.confirmedTerms || application;

      const itemsPrice = application.productPrice;
      const order = new Order({
        checkoutSessionId: application.checkoutSessionId,
        user: application.user,
        orderItems: [
          {
            product: application.product,
            name: application.productName,
            quantity: 1,
            price: application.productPrice,
            costPrice: Number(updatedProduct.costPrice || 0),
            image: application.productImage || "",
            itemType: "motorcycle",
          },
        ],
        shippingInfo: application.shippingInfo,
        paymentMethod: "bank_deposit",
        paymentStatus: "processing",
        itemsPrice,
        shippingPrice: 0,
        totalPrice: terms.totalRepayment || itemsPrice,
        orderStatus: "pending",
      });
      await order.save({ session });

      application.linkedOrderId = order._id;
      application.downPaymentSettled = true;
      application.downPaymentSettledAt = new Date();
      await application.save({ session });

      await InventoryTransaction.create(
        [
          {
            transactionRef: makeTransactionRef("TXN-SALE"),
            product: application.product,
            productName: application.productName,
            type: "sale",
            quantityChange: -1,
            orderRef: order.orderNumber,
            unitCost: Number(updatedProduct.costPrice || 0),
            performedBy: req.user._id,
            performedByName: performedByName(req.user),
            note: `Installment order confirmed (${application.applicationRef || "Financing"})`,
          },
        ],
        { session },
      );

      return { application, order };
    });

    return res.status(201).json({
      success: true,
      message: "Installment order confirmed and created",
      data: { application, order },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("confirmInstallmentOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error confirming installment order" });
  }
};

/**
 * GET /api/v1/order/:id/receipt
 * Renders printable HTML / PDF invoice receipt for an order.
 */
export const getOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email contactNumber")
      .populate("orderItems.product", "name category brand");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).send("Unauthorized to access this receipt");
    }

    // Direct binary PDF stream if format=pdf or download=true requested
    if (req.query.format === "pdf" || req.query.download === "true") {
      const pdfBuffer = await generateOrderInvoicePDF(order, order.user);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="Receipt-${order.orderNumber}.pdf"`
      );
      return res.status(200).send(pdfBuffer);
    }

    const itemsHtml = (order.orderItems || [])
      .map(
        (i) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;"><strong>${i.name}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: center;">${i.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: right; font-family: monospace;">₱${i.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: right; font-family: monospace; font-weight: bold;">₱${(i.price * i.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>`
      )
      .join("");

    const vat = order.itemsPrice * 0.12;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt — ${order.orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; padding: 40px; background: #fafafa; }
    .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #e4e4e7; border-top: 4px solid #047857; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 25px; }
    .brand-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #047857; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; }
    .badge-paid { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-pending { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #f4f4f5; text-align: left; padding: 10px; text-transform: uppercase; font-size: 11px; color: #71717a; }
    .total-table { width: 300px; margin-left: auto; margin-top: 20px; }
    .total-table td { padding: 6px 10px; }
    .btn-print { background: #059669; color: white; border: none; padding: 10px 20px; font-weight: 600; border-radius: 6px; cursor: pointer; float: right; margin-bottom: 20px; }
    @media print { .btn-print { display: none; } body { padding: 0; background: white; } .invoice-box { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: auto;">
    <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div style="clear: both;"></div>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="brand-title">MotorCycled</div>
        <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Dealership, OEM Parts & Service Hub</div>
        <div style="font-size: 12px; color: #71717a;">Metro Manila, Philippines · Official Transaction Invoice</div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #18181b;">${order.orderNumber}</div>
        <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Date: ${new Date(order.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div style="margin-top: 8px;">
          <span class="badge ${order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}">
            PAYMENT: ${order.paymentStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 25px;">
      <div>
        <div style="font-weight: 700; color: #71717a; font-size: 11px; text-transform: uppercase;">Billed / Delivered To</div>
        <div style="font-weight: bold; margin-top: 3px;">${order.user?.firstName || ''} ${order.user?.lastName || ''}</div>
        <div style="color: #52525b;">${order.user?.email || ''} · ${order.shippingInfo?.contactNumber || order.user?.contactNumber || ''}</div>
        <div style="color: #52525b; margin-top: 2px;">${order.shippingInfo?.address || order.shippingInfo?.branch || 'Showroom Releasing'}</div>
        <div style="color: #52525b;">${order.shippingInfo?.city || ''} ${order.shippingInfo?.postalCode || ''}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: #71717a; font-size: 11px; text-transform: uppercase;">Fulfillment & Method</div>
        <div style="font-weight: 600; margin-top: 3px; text-transform: capitalize;">${order.shippingInfo?.fulfillmentMethod === 'delivery' ? 'Door-to-Door Delivery' : 'Dealership Pickup'}</div>
        <div style="color: #52525b; text-transform: capitalize;">Payment Method: ${order.paymentMethod?.replace(/_/g, ' ')}</div>
        <div style="color: #52525b;">Order Status: ${order.orderStatus.toUpperCase()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table class="total-table">
      <tr>
        <td style="color: #71717a;">Subtotal:</td>
        <td style="text-align: right; font-family: monospace; font-weight: 600;">₱${order.itemsPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td style="color: #71717a;">Shipping / Freight:</td>
        <td style="text-align: right; font-family: monospace; font-weight: 600;">${order.shippingPrice > 0 ? `₱${order.shippingPrice.toFixed(2)}` : 'FREE (₱0.00)'}</td>
      </tr>
      <tr>
        <td style="color: #71717a;">VAT (12% Included):</td>
        <td style="text-align: right; font-family: monospace; color: #71717a;">₱${vat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr style="border-top: 2px solid #18181b;">
        <td style="font-size: 15px; font-weight: 800;">Total Amount:</td>
        <td style="text-align: right; font-family: monospace; font-size: 16px; font-weight: 800; color: #047857;">₱${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; text-align: center;">
      Official system receipt generated by MotorCycled E-Commerce platform. All motorcycles carry genuine manufacturer warranties and LTO documentation support.
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  } catch (error) {
    console.error("getOrderReceipt error:", error);
    return res.status(500).send("Error generating receipt");
  }
};

/**
 * POST /api/v1/application/:id/pay-installment
 * Allows a customer to pay their monthly amortization or settle installments online.
 */
export const payInstallment = async (req, res) => {
  try {
    const { paymentMethod = "gcash", referenceNumber } = req.body;

    const application = await InstallmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Installment application not found" });
    }

    if (
      application.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const currentPaid = application.installmentsPaid || 0;
    const termMonths = application.termMonths || 12;

    // ── Guard: downpayment must be settled before amortization ───────────────
    if (!application.downPaymentSettled) {
      return res.status(400).json({
        success: false,
        message: "Downpayment has not been settled yet. Please pay or wait for admin confirmation of your downpayment before making monthly installment payments.",
        downPaymentRequired: true,
      });
    }

    if (currentPaid >= termMonths) {
      return res.status(400).json({
        success: false,
        message: "This motorcycle financing has already been fully paid!",
      });
    }

    const nextNumber = currentPaid + 1;
    application.installmentsPaid = nextNumber;

    if (!application.paymentHistory) {
      application.paymentHistory = [];
    }

    application.paymentHistory.push({
      paidAt: new Date(),
      amount: application.monthlyPayment,
      paymentMethod,
      referenceNumber: referenceNumber || `MC-PAY-${Date.now().toString().slice(-6)}`,
      installmentNumber: nextNumber,
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message: `Installment #${nextNumber} of ${termMonths} paid successfully!`,
      data: { application },
    });
  } catch (error) {
    console.error("payInstallment error:", error);
    return res.status(500).json({ success: false, message: "Error processing installment payment" });
  }
};

// ─── getDashboardStats (Quiz 2: 15pts - Sales Charts with Date Range Filter) ──

/**
 * GET /api/v1/admin/dashboard-stats
 * Returns live operational telemetry, financial metrics, and timeline sales aggregation
 * with support for custom date range filters and preset filters.
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, preset = "30d" } = req.query;

    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      if (preset === "7d") {
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
      } else if (preset === "30d") {
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      } else if (preset === "90d") {
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
      } else if (preset === "this_month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      } else if (preset === "ytd") {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      } else {
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      }
    }

    const [
      allOrders,
      allApps,
      lowStockProducts,
      restockTotals,
      inventoryTotals,
      recentRestocksRaw,
    ] = await Promise.all([
      Order.find()
        .populate("user", "firstName lastName email contactNumber")
        .populate("orderItems.product", "name category price images costPrice")
        .sort({ createdAt: -1 }),
      InstallmentApplication.find()
        .populate("user", "firstName lastName email contactNumber validId proofOfIncome")
        .populate("product", "name price category images")
        .sort({ createdAt: -1 }),
      Product.find({ stock: { $lte: 5 }, isArchived: false })
        .select("name price stock category brand images")
        .sort({ stock: 1 }),
      InventoryTransaction.aggregate([
        { $match: { type: "restock" } },
        {
          $group: {
            _id: null,
            totalSpent: {
              $sum: { $multiply: [{ $abs: "$quantityChange" }, "$unitCost"] },
            },
          },
        },
      ]),
      Product.aggregate([
        { $match: { isArchived: { $ne: true } } },
        {
          $group: {
            _id: null,
            // Valuation uses only the cost stored in the database. Products
            // without a recorded cost contribute zero until they are restocked.
            totalValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$stock", 0] },
                  { $ifNull: ["$costPrice", 0] },
                ],
              },
            },
          },
        },
      ]),
      InventoryTransaction.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .select(
          "product productName type quantityChange unitCost supplierId supplierName orderRef note performedByName createdAt",
        )
        .lean(),
    ]);

    const pendingApps = allApps.filter((a) => a.applicationStatus === "pending");

    // Financial totals across all time
    const completedOrders = allOrders.filter(
      (o) => o.orderStatus === "completed" || o.paymentStatus === "paid"
    );
    const totalOrderSales = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const approvedApps = allApps.filter((a) => a.applicationStatus === "approved");

    // "Active Loan" = approved + downpayment confirmed (linkedOrderId exists) + not fully paid
    // This matches the exact logic used in the Orders & Finance module's displayStatus computation
    const activeLoanApps = allApps.filter((a) => {
      if (a.applicationStatus !== "approved") return false;
      if (!a.linkedOrderId) return false; // still awaiting downpayment
      const paid = a.installmentsPaid || 0;
      const total = a.termMonths || 0;
      return !(total > 0 && paid >= total); // exclude fully paid
    });
    const downpaymentCollections = approvedApps.reduce(
      (sum, a) => sum + (a.downPayment || 0),
      0
    );
    const amortizationCollections = approvedApps.reduce((sum, a) => {
      const history = a.paymentHistory || [];
      return sum + history.reduce((acc, h) => acc + (h.amount || a.monthlyPayment || 0), 0);
    }, 0);

    const totalRevenue = totalOrderSales + downpaymentCollections + amortizationCollections;

    // Inventory and profitability telemetry (FR1.9).
    // COGS uses the cost snapshot taken at sale time; older orders fall back to
    // the product's current recorded cost.
    const totalRestockSpent = restockTotals[0]?.totalSpent || 0;
    const inventoryValue = inventoryTotals[0]?.totalValue || 0;
    const cogs = completedOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce((acc, item) => {
          const cost =
            Number(item.costPrice) > 0
              ? Number(item.costPrice)
              : Number(item.product?.costPrice || 0);
          return acc + cost * Number(item.quantity || 0);
        }, 0),
      0,
    );
    const grossProfit = totalOrderSales - cogs;
    const netCashRecovery = totalRevenue - totalRestockSpent;
    const recoveryRate =
      totalRestockSpent > 0
        ? Math.min(100, Math.max(0, (totalRevenue / totalRestockSpent) * 100))
        : totalRevenue > 0
          ? 100
          : 0;

    const recentActivity = recentRestocksRaw.map((transaction) => {
      const quantityChange = Number(transaction.quantityChange || 0);
      const unitCost = Number(transaction.unitCost || 0);

      return {
        ...transaction,
        productId: transaction.product ? String(transaction.product) : "",
        quantityChange,
        unitCost,
        totalCost: Math.abs(quantityChange) * unitCost,
      };
    });

    const recentRestocks = recentActivity.filter((t) => t.type === "restock");
    const recentStockActivity = recentActivity;

    // Cash flow is all-time; the charts below handle the selected date range.
    const cashFlow = {
      cashIn: totalRevenue,
      cashOut: totalRestockSpent,
      netCashFlow: netCashRecovery,
    };

    const toYMD = (date) => {
      const d = new Date(date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const startKey = toYMD(start);
    const endKey = toYMD(end);

    // Filtered range sales
    const rangeOrders = allOrders.filter((o) => {
      if (o.orderStatus === "canceled") return false;
      const orderKey = toYMD(o.paidAt || o.updatedAt || o.createdAt);
      return orderKey >= startKey && orderKey <= endKey;
    });

    // Generate continuous date map for smooth Line/Bar charting
    const dayMap = {};
    const iter = new Date(start);
    iter.setHours(0, 0, 0, 0);
    const endIter = new Date(end);
    endIter.setHours(0, 0, 0, 0);
    while (iter <= endIter) {
      const key = toYMD(iter);
      dayMap[key] = {
        date: key,
        displayDate: iter.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: 0,
        orders: 0,
        units: 0,
      };
      iter.setDate(iter.getDate() + 1);
    }

    for (const o of rangeOrders) {
      const key = toYMD(o.paidAt || o.updatedAt || o.createdAt);
      if (dayMap[key]) {
        dayMap[key].sales += o.totalPrice || 0;
        dayMap[key].orders += 1;
        const totalQty = (o.orderItems || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
        dayMap[key].units += totalQty;
      }
    }

    const salesTimeline = Object.values(dayMap);

    // Category Sales breakdown within range
    const categoryMap = {};
    for (const o of rangeOrders) {
      for (const item of o.orderItems || []) {
        const cat = item.itemType || "parts";
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, sales: 0, units: 0 };
        }
        categoryMap[catName].sales += (item.price || 0) * (item.quantity || 1);
        categoryMap[catName].units += item.quantity || 1;
      }
    }
    const categorySales = Object.values(categoryMap);

    const rangeTotalSales = rangeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const rangeTotalOrders = rangeOrders.length;
    const rangeAverageOrderValue =
      rangeTotalOrders > 0 ? Math.round(rangeTotalSales / rangeTotalOrders) : 0;
    const rangeTotalUnits = rangeOrders.reduce((sum, o) => {
      return sum + (o.orderItems || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    }, 0);

    // Latest 8 orders for real live activity
    const recentOrders = allOrders.slice(0, 8).map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customer: o.user ? `${o.user.firstName || ""} ${o.user.lastName || ""}`.trim() : (o.shippingInfo?.recipientName || "Walk-in Guest"),
      email: o.user?.email || o.shippingInfo?.email || "—",
      city: o.shippingInfo?.city || "Showroom Claim",
      itemsCount: (o.orderItems || []).length,
      firstItemName: o.orderItems?.[0]?.name || "Catalog Product",
      firstItemType: o.orderItems?.[0]?.itemType || "part",
      totalPrice: o.totalPrice,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
    }));

    // Formatted real pending underwriting applications
    const formattedPendingApprovals = pendingApps.map((app) => ({
      _id: app._id,
      id: app.applicationRef,
      customer: app.user ? `${app.user.firstName || ""} ${app.user.lastName || ""}`.trim() : "Financing Applicant",
      email: app.user?.email || app.shippingInfo?.email || "—",
      phone: app.user?.contactNumber || app.shippingInfo?.contactNumber || "—",
      vehicle: app.productName,
      productPrice: app.productPrice,
      term: `${app.termMonths || 12} Months Standard`,
      downpayment: app.downPayment || Math.round(app.productPrice * 0.2),
      monthly: app.monthlyPayment,
      submittedDate: new Date(app.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      validId: app.user?.validId || "PH Government Valid ID",
      incomeProof: app.user?.proofOfIncome || "3-Month Bank / Payslip Records",
    }));

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalOrders: allOrders.length,
          activeInstallmentsCount: activeLoanApps.length,
          activeInstallmentsValue: activeLoanApps.reduce((acc, a) => {
            const totalRepayment = a.totalRepayment || a.productPrice || 0;
            const dpPaid = a.downPaymentSettled ? (a.downPayment || 0) : 0;
            const installmentsPaid = a.installmentsPaid || 0;
            const monthlyPayment = a.monthlyPayment || 0;
            const amortizationPaid = installmentsPaid * monthlyPayment;
            const outstanding = Math.max(0, totalRepayment - dpPaid - amortizationPaid);
            return acc + outstanding;
          }, 0),
          pendingScreeningCount: pendingApps.length,
          lowStockCount: lowStockProducts.length,
        },
        cashFlow,
        financials: {
          totalRestockSpent,
          inventoryValue,
          cogs,
          grossProfit,
          netCashRecovery,
          recoveryRate,
        },
        rangeSummary: {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          preset,
          totalSales: rangeTotalSales,
          totalOrders: rangeTotalOrders,
          averageOrderValue: rangeAverageOrderValue,
          totalUnits: rangeTotalUnits,
        },
        salesTimeline,
        categorySales,
        pendingApprovals: formattedPendingApprovals,
        recentOrders,
        recentActivity,
        recentStockActivity,
        recentRestocks,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ success: false, message: "Server error generating dashboard telemetry" });
  }
};

// ─── cancelMyOrder ─────────────────────────────────────────────────────────────

/**
 * PUT /api/v1/order/:id/cancel
 * Allows a customer to cancel their own order if it's still pending or processing.
 */
export const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only orders that are pending or processing can be canceled",
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = "canceled";

    const customerName = performedByName(req.user);
    for (const item of order.orderItems || []) {
      if (item.product && item.quantity > 0) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });

        await InventoryTransaction.create({
          transactionRef: makeTransactionRef("TXN-CNCL"),
          product: item.product,
          productName: item.name,
          type: "cancellation",
          quantityChange: item.quantity,
          orderRef: order.orderNumber,
          unitCost: Number(item.costPrice || 0),
          performedBy: req.user._id,
          performedByName: customerName,
          note: `Stock restored from canceled order #${order.orderNumber} (customer request, was ${previousStatus})`,
        });
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order canceled successfully",
      order,
    });
  } catch (error) {
    console.error("cancelMyOrder error:", error);
    return res.status(500).json({ success: false, message: "Server error canceling order" });
  }
};

