import { Router } from "express";
import { register } from "../controllers/AuthController.js";
import upload from "../middleware/multer.js";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "validId", maxCount: 1 },
    { name: "proofOfIncome" },
  ]),
  register,
);

export default router;
