import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
import connection from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

connection();

app.use("/api/v1", authRoutes);
app.listen(process.env.PORT, () => {
  console.log("Working on PORT: ", process.env.PORT);
});
