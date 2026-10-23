import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  restoreSupplier,
} from "../controllers/supplierController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// Admin supplier management (FR1.6.2 — Supplier Details)
router.get("/suppliers", auth, authorizeRoles("admin"), getSuppliers);

router.post(
  "/admin/supplier/new",
  auth,
  authorizeRoles("admin"),
  createSupplier,
);
router.put(
  "/admin/supplier/:id",
  auth,
  authorizeRoles("admin"),
  updateSupplier,
);
router.put(
  "/admin/supplier/:id/restore",
  auth,
  authorizeRoles("admin"),
  restoreSupplier,
);
router.delete(
  "/admin/supplier/:id",
  auth,
  authorizeRoles("admin"),
  deactivateSupplier,
);

export default router;
