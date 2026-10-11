import { Router } from "express";
import { getCategories, getBrands } from "../controllers/catalogController.js";

const router = Router();

// GET /api/v1/categories — category dropdown for product form
router.get("/categories", getCategories);

// GET /api/v1/brands — brand dropdown for product form
router.get("/brands", getBrands);

export default router;
