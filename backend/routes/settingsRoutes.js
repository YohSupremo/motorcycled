import { Router } from "express";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../controllers/settingsController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.use(auth, authorizeRoles("admin"));
router.get("/admin/settings", getStoreSettings);
router.put("/admin/settings", updateStoreSettings);

export default router;
