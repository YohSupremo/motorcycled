import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";
import {
  addAddress,
  deleteAddress,
  getProfile,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "../controllers/UserController.js";

const router = Router();

router.use(auth);
router.get("/", getProfile);
router.put("/", upload.single("profilePicture"), updateProfile);
router.get("/addresses", listAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.patch("/addresses/:id/default", setDefaultAddress);

export default router;
