import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  newCheckout,
  getMyOrders,
  getOrderDetails,
  getApplicationDetails,
  getAdminOrders,
  getAdminApplications,
  updateOrderStatus,
  approveApplication,
  rejectApplication,
  confirmInstallmentOrder,
  getOrderReceipt,
  payInstallment,
} from "../controllers/orderController.js";

const router = express.Router();

// ── Customer routes ──────────────────────────────────────────────────────────
router.post("/checkout", auth, newCheckout);
router.get("/orders/me", auth, getMyOrders);
router.get("/order/:id", auth, getOrderDetails);
router.get("/order/:id/receipt", auth, getOrderReceipt);
router.get("/application/:id", auth, getApplicationDetails);
router.post("/application/:id/pay-installment", auth, payInstallment);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get("/admin/orders", auth, authorizeRoles("admin"), getAdminOrders);
router.get("/admin/applications", auth, authorizeRoles("admin"), getAdminApplications);
router.put("/admin/order/:id/status", auth, authorizeRoles("admin"), updateOrderStatus);
router.put("/admin/application/:id/approve", auth, authorizeRoles("admin"), approveApplication);
router.put("/admin/application/:id/reject", auth, authorizeRoles("admin"), rejectApplication);
router.put(
  "/admin/application/:id/confirm-order",
  auth,
  authorizeRoles("admin"),
  confirmInstallmentOrder,
);

export default router;
