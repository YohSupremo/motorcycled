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

router.use(auth, authorizeRoles("admin"));
router.get("/admin/customers", listAdminCustomers);
router.post("/admin/customers", createAdminCustomer);
router.put("/admin/customers/:id", updateAdminCustomer);
router.patch("/admin/customers/:id/deactivate", deactivateAdminCustomer);
router.patch("/admin/customers/:id/reactivate", reactivateAdminCustomer);

export default router;
