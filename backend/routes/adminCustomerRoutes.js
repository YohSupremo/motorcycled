import express from "express";
import {
  createAdminCustomer,
  deactivateAdminCustomer,
  listAdminCustomers,
  reactivateAdminCustomer,
  updateAdminCustomer,
} from "../controllers/adminCustomerController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin/customers", auth, authorizeRoles("admin"), listAdminCustomers);
router.post("/admin/customers", auth, authorizeRoles("admin"), createAdminCustomer);
router.put("/admin/customers/:id", auth, authorizeRoles("admin"), updateAdminCustomer);
router.patch("/admin/customers/:id/deactivate", auth, authorizeRoles("admin"), deactivateAdminCustomer);
router.patch("/admin/customers/:id/reactivate", auth, authorizeRoles("admin"), reactivateAdminCustomer);

export default router;
