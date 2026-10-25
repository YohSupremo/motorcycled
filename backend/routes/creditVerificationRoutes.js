import express from "express";
import {
  approveCreditVerification,
  getCreditVerificationDocuments,
  getMyCreditVerification,
  listCreditVerifications,
  rejectCreditVerification,
  submitCreditVerification,
} from "../controllers/creditVerificationController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/credit-verification/me", auth, getMyCreditVerification);
router.post(
  "/credit-verification",
  auth,
  upload.fields([
    { name: "governmentId", maxCount: 1 },
    { name: "proofOfIncome", maxCount: 1 },
  ]),
  submitCreditVerification,
);
router.get(
  "/admin/credit-verifications",
  auth,
  authorizeRoles("admin"),
  listCreditVerifications,
);
router.get(
  "/admin/credit-verifications/:id",
  auth,
  authorizeRoles("admin"),
  getCreditVerificationDocuments,
);
router.put(
  "/admin/credit-verifications/:id/approve",
  auth,
  authorizeRoles("admin"),
  approveCreditVerification,
);
router.put(
  "/admin/credit-verifications/:id/reject",
  auth,
  authorizeRoles("admin"),
  rejectCreditVerification,
);

export default router;
