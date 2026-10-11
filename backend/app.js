import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connection from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import useRoutes from "./routes/useRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import { seedCatalogDefaults } from "./controllers/catalogController.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Must allow the exact frontend origin with credentials: true so the
// browser will store and send the JWT cookie on cross-origin requests.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

connection();
// Seed default categories & brands after mongoose connects.
// connection() returns void, so we use the mongoose "open" event.
mongoose.connection.once("open", () => seedCatalogDefaults());

app.use("/api/v1", authRoutes);
app.use("/api/v1/profile", useRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", catalogRoutes);

// Central error handler so multer/other middleware errors return a
// readable JSON response instead of Express's default HTML 500.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.http_code || err.status || 500).json({
    message: err.message || "Internal service error",
    success: false,
  });
});

app.listen(process.env.PORT, () => {
  console.log("Working on PORT: ", process.env.PORT);
});