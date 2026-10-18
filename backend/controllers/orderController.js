import mongoose from "mongoose";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import InstallmentApplication from "../model/InstallmentApplication.js";
import Category from "../model/Category.js";
import User from "../model/User.js";
import { cloudConf } from "../config/cloudinary.js";
import { notifyOrderPlaced, notifyInstallmentUpdate } from "../services/notificationService.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PROCESSING_FEE = 1500;
const SHIPPING_DELIVERY = 350;
const INTEREST_RATES = { 12: 0.07, 24: 0.08, 36: 0.09 };

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

// ─── newCheckout ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/checkout
 * Processes a checkout session: creates Orders for cash purchases and
 * InstallmentApplications for installment purchases. Idempotent on
 * checkoutSessionId.
 */
export const newCheckout = async (req, res) => {
  try {
    const { checkoutSessionId, items, shippingInfo, paymentMethod } = req.body;

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

    // ── 4. Create parts Order (grouped) ──────────────────────────────────────
    if (partsItems.length > 0) {
      // Deduct stock atomically for each part
      const stockErrors = [];
      const confirmedParts = [];

      for (const pi of partsItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: pi.product._id, stock: { $gte: pi.quantity } },
          { $inc: { stock: -pi.quantity } },
          { new: true },
        );
        if (!updated) {
          stockErrors.push({ productId: pi.product._id.toString(), error: "Insufficient stock (race condition)" });
        } else {
          confirmedParts.push(pi);
        }
      }

      // Push errors for parts that failed stock deduction
      for (const se of stockErrors) {
        results.push({ productId: se.productId, status: "error", error: se.error });
      }

      if (confirmedParts.length > 0) {
        const orderItems = confirmedParts.map((pi) => ({
          product: pi.product._id,
          name: pi.product.name,
          quantity: pi.quantity,
          price: pi.product.price,
          image: pi.product.images?.[0]?.url || "",
          itemType: pi.itemType,
        }));

        const itemsPrice = confirmedParts.reduce(
          (sum, pi) => sum + pi.product.price * pi.quantity,
          0,
        );
        const totalPrice = itemsPrice + shippingPrice;

        const partsOrder = new Order({
          checkoutSessionId,
          user: req.user._id,
          orderItems,
          shippingInfo: partsShippingInfo,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          totalPrice,
        });
        await partsOrder.save();
        notifyOrderPlaced(partsOrder, req.user);

        for (const pi of confirmedParts) {
          results.push({
            productId: pi.product._id.toString(),
            productName: pi.product.name,
            status: "success",
            type: "order",
            reference: partsOrder.orderNumber,
          });
        }
      }
    }

    // ── 5. Create individual Orders for cash motorcycle purchases ─────────────
    for (const mi of motorcycleCashItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: mi.product._id, stock: { $gte: mi.quantity } },
        { $inc: { stock: -mi.quantity } },
        { new: true },
      );

      if (!updated) {
        results.push({
          productId: mi.product._id.toString(),
          productName: mi.product.name,
          status: "error",
          error: "Insufficient stock (race condition)",
        });
        continue;
      }

      const itemsPrice = mi.product.price * mi.quantity;
      // Motorcycles are always picked up from dealership for delivery coordination;
      // use shippingPrice = 0 for motorcycles (dealership standard).
      const motoOrder = new Order({
        checkoutSessionId,
        user: req.user._id,
        orderItems: [
          {
            product: mi.product._id,
            name: mi.product.name,
            quantity: mi.quantity,
            price: mi.product.price,
            image: mi.product.images?.[0]?.url || "",
            itemType: mi.itemType,
          },
        ],
        shippingInfo: motorcycleShippingInfo,
        paymentMethod,
        itemsPrice,
        shippingPrice: 0,
        totalPrice: itemsPrice,
      });
      await motoOrder.save();
      notifyOrderPlaced(motoOrder, req.user);

      results.push({
        productId: mi.product._id.toString(),
        productName: mi.product.name,
        status: "success",
        type: "order",
        reference: motoOrder.orderNumber,
      });
    }

    // ── 6. Create InstallmentApplications (no stock deduction) ───────────────
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
        documentUploads: {
          verificationMethod,
          idCard: documentUploads.idCard || null,
          proofOfIncome: documentUploads.proofOfIncome || null,
          documentVerified: false,
        },
      });
      await app.save();

      results.push({
        productId: ii.product._id.toString(),
        productName: ii.product.name,
        status: "success",
        type: "application",
        reference: app.applicationRef,
      });
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
    console.error("newCheckout error:", error);
    return res.status(500).json({ success: false, message: "Server error during checkout" });
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
      order.orderStatus = orderStatus;
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

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      data: { order },
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
      application.documentUploads.documentVerified = true;
      application.documentUploads.purgedAt = new Date();
      application.documentUploads.idCard = undefined;
      application.documentUploads.proofOfIncome = undefined;
    }

    await application.save();

    const applicant = await User.findById(application.user);
    if (applicant) {
      notifyInstallmentUpdate(application, applicant, "approved");
    }

    return res.status(200).json({
      success: true,
      message: "Installment application approved and sensitive documents securely purged",
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

// ─── confirmInstallmentOrder ───────────────────────────────────────────────────

/**
 * PUT /api/v1/admin/application/:id/confirm-order
 * Called after downpayment is confirmed. Creates the linked Order for an
 * approved installment application and deducts stock (admin only).
 */
export const confirmInstallmentOrder = async (req, res) => {
  try {
    const application = await InstallmentApplication.findById(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Installment application not found" });
    }

    if (application.applicationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Application must be 'approved' before confirming an order (current: '${application.applicationStatus}')`,
      });
    }

    if (application.linkedOrderId) {
      return res.status(400).json({
        success: false,
        message: "An order has already been created for this application",
      });
    }

    // Atomically verify and deduct stock
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: application.product, stock: { $gt: 0 } },
      { $inc: { stock: -1 } },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock and cannot be ordered",
      });
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
    await order.save();

    application.linkedOrderId = order._id;
    await application.save();

    return res.status(201).json({
      success: true,
      message: "Installment order confirmed and created",
      data: { application, order },
    });
  } catch (error) {
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

    const itemsHtml = (order.orderItems || [])
      .map(
        (i) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;"><strong>${i.name}</strong> (${i.itemType})</td>
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
    .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #e4e4e7; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 25px; }
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
      pendingApps,
    ] = await Promise.all([
      Order.find()
        .populate("user", "firstName lastName email contactNumber")
        .populate("orderItems.product", "name category price images")
        .sort({ createdAt: -1 }),
      InstallmentApplication.find()
        .populate("user", "firstName lastName email contactNumber validId proofOfIncome")
        .populate("product", "name price category images")
        .sort({ createdAt: -1 }),
      Product.find({ stock: { $lte: 5 }, isArchived: false })
        .select("name price stock category brand images")
        .sort({ stock: 1 }),
      InstallmentApplication.find({ applicationStatus: "pending" })
        .populate("user", "firstName lastName email contactNumber validId proofOfIncome")
        .populate("product", "name price category images")
        .sort({ createdAt: -1 }),
    ]);

    // Financial totals across all time
    const completedOrders = allOrders.filter(
      (o) => o.orderStatus === "completed" || o.paymentStatus === "paid"
    );
    const totalOrderSales = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const approvedApps = allApps.filter((a) => a.applicationStatus === "approved");
    const downpaymentCollections = approvedApps.reduce(
      (sum, a) => sum + (a.downPayment || 0),
      0
    );
    const amortizationCollections = approvedApps.reduce((sum, a) => {
      const history = a.paymentHistory || [];
      return sum + history.reduce((acc, h) => acc + (h.amount || a.monthlyPayment || 0), 0);
    }, 0);

    const totalRevenue = totalOrderSales + downpaymentCollections + amortizationCollections;

    // Monthly Collections (current month)
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyOrders = completedOrders.filter(
      (o) => new Date(o.createdAt) >= currentMonthStart
    );
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Filtered range sales
    const rangeOrders = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d >= start &&
        d <= end &&
        o.orderStatus !== "canceled" &&
        (o.orderStatus === "completed" || o.paymentStatus === "paid")
      );
    });

    // Generate continuous date map for smooth Line/Bar charting
    const dayMap = {};
    const iter = new Date(start);
    while (iter <= end) {
      const key = iter.toISOString().split("T")[0];
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
      const key = new Date(o.createdAt).toISOString().split("T")[0];
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
          monthlyRevenue,
          totalOrders: allOrders.length,
          activeInstallmentsCount: approvedApps.length,
          activeInstallmentsValue: approvedApps.reduce(
            (acc, a) => acc + (a.totalRepayment || a.productPrice || 0),
            0
          ),
          pendingScreeningCount: pendingApps.length,
          lowStockCount: lowStockProducts.length,
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
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ success: false, message: "Server error generating dashboard telemetry" });
  }
};

