import { Router } from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createRestock,
  getInventoryTransactions,
} from "../controllers/inventoryController.js";

const router = Router();

router.get(
  "/admin/inventory/transactions",
  auth,
  authorizeRoles("admin"),
  getInventoryTransactions,
);

router.post("/admin/inventory/restock", auth, authorizeRoles("admin"), createRestock);

export default router;
