import { Router } from "express";
import {
  getBrands,
  getSingleBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  reassignBrandAndSoftDelete,
  restoreBrand,
} from "../controllers/brandController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.get("/brands", getBrands);
router.get("/brand/:id", getSingleBrand);

// Admin Brand routes
router.post(
  "/admin/brand/new",
  auth,
  authorizeRoles("admin"),
  createBrand,
);
router.put(
  "/admin/brand/:id",
  auth,
  authorizeRoles("admin"),
  updateBrand,
);
router.put(
  "/admin/brand/:id/restore",
  auth,
  authorizeRoles("admin"),
  restoreBrand,
);
router.delete(
  "/admin/brand/:id",
  auth,
  authorizeRoles("admin"),
  deleteBrand,
);
router.post(
  "/admin/brand/:id/reassign",
  auth,
  authorizeRoles("admin"),
  reassignBrandAndSoftDelete,
);

export default router;
