import { Router } from "express";
import {
  register,
  login,
  logout,
  getUserProfile,
  firebaseLogin,
  forgotPassword,
  resetPassword,
  changePassword,
  reactivateOwnAccount,
} from "../controllers/AuthController.js";
import upload from "../middleware/multer.js";
import { auth } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";
const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "validId", maxCount: 1 },
    { name: "proofOfIncome", maxCount: 1 },
  ]),
  register,
);

router.post("/login", login);
router.post("/reactivate", reactivateOwnAccount);
router.post("/firebase-login", firebaseLogin);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/change", auth, changePassword);
router.get("/logout", logout);
router.get("/me", auth, getUserProfile);

export default router;
