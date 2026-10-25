import { Router } from "express";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../controllers/settingsController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/admin/settings", auth, authorizeRoles("admin"), getStoreSettings);
router.put("/admin/settings", auth, authorizeRoles("admin"), updateStoreSettings);

export default router;
