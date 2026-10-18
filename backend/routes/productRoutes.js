import { Router } from "express";
import {
  newProduct,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkRestoreProducts,
  toggleArchiveProduct,
  toggleFeatureProduct,
  getProducts,
} from "../controllers/productController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

// Reference: itcp318-s3a-2026/backend/routes/product.js
// Adapted to ES Modules and motorshop auth middleware
const router = Router();

// ── Admin routes (require auth + admin role) ──────────────────────────────────
// Reference: itcp318-s3a-2026/backend/routes/product.js lines 22, 24, 26, 27
router.post(
  "/admin/product/new",
  auth,
  authorizeRoles("admin"),
  newProduct,
);

router.get(
  "/admin/products",
  auth,
  authorizeRoles("admin"),
  getAdminProducts,
);

router.put(
  "/admin/product/:id",
  auth,
  authorizeRoles("admin"),
  updateProduct,
);

router.delete(
  "/admin/product/:id",
  auth,
  authorizeRoles("admin"),
  deleteProduct,
);

router.post(
  "/admin/products/bulk-delete",
  auth,
  authorizeRoles("admin"),
  bulkDeleteProducts,
);

router.post(
  "/admin/products/bulk-restore",
  auth,
  authorizeRoles("admin"),
  bulkRestoreProducts,
);

router.patch(
  "/admin/product/:id/archive",
  auth,
  authorizeRoles("admin"),
  toggleArchiveProduct,
);

router.patch(
  "/admin/product/:id/feature",
  auth,
  authorizeRoles("admin"),
  toggleFeatureProduct,
);

// ── Public routes ─────────────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/backend/routes/product.js lines 23, 29
router.get("/products", getProducts);
router.get("/product/:id", getSingleProduct);

export default router;
