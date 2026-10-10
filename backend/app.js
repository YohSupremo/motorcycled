import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
import connection from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use("/api/v1", authRoutes);

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