import { Router } from "express";
import {
  getCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignCategoryAndSoftDelete,
  restoreCategory,
} from "../controllers/categoryController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.get("/categories", getCategories);
router.get("/category/:id", getSingleCategory);

// Admin Category routes
router.post(
  "/admin/category/new",
  auth,
  authorizeRoles("admin"),
  createCategory,
);
router.put(
  "/admin/category/:id",
  auth,
  authorizeRoles("admin"),
  updateCategory,
);
router.put(
  "/admin/category/:id/restore",
  auth,
  authorizeRoles("admin"),
  restoreCategory,
);
router.delete(
  "/admin/category/:id",
  auth,
  authorizeRoles("admin"),
  deleteCategory,
);
router.post(
  "/admin/category/:id/reassign",
  auth,
  authorizeRoles("admin"),
  reassignCategoryAndSoftDelete,
);

export default router;
