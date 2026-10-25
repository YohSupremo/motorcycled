import { Router } from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import { getAdminReports } from "../controllers/reportController.js";

const router = Router();

router.get("/admin/reports", auth, authorizeRoles("admin"), getAdminReports);

export default router;
