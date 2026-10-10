import { Router } from "express";
import {
  register,
  login,
  logout,
  getUserProfile,
} from "../controllers/AuthController.js";
import upload from "../middleware/multer.js";
import { auth } from "../middleware/authMiddleware.js";

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
router.get("/logout", logout);
router.get("/me", auth, getUserProfile);

export default router;