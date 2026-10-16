import { Router } from "express";
import {
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
  deleteMyReview,
  getAllReviews,
  toggleReviewVisibility,
  deleteReview,
} from "../controllers/reviewController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/product/:id/reviews", getProductReviews);

// ── Customer routes (require auth) ────────────────────────────────────────────
// Own review + whether the customer has ordered / received the product.
router.get("/product/:id/my-review", auth, getMyReview);
router.post("/product/:id/review", auth, createReview);
router.put("/product/:id/review", auth, updateReview);
router.delete("/product/:id/review", auth, deleteMyReview);

// ── Admin routes (require auth + admin role) ──────────────────────────────────
router.get("/admin/reviews", auth, authorizeRoles("admin"), getAllReviews);

router.put(
  "/admin/review/:id/hide",
  auth,
  authorizeRoles("admin"),
  toggleReviewVisibility,
);

router.delete(
  "/admin/review/:id",
  auth,
  authorizeRoles("admin"),
  deleteReview,
);

export default router;
