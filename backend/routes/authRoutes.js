import { Router } from "express";

import { register } from "../controllers/AuthController.js";

import upload from "../middleware/multer.js";
const router = Router();

router.post("/register", upload.none(), register);

export default router;
