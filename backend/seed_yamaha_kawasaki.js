import "dotenv/config";
import mongoose from "mongoose";
import Brand from "./model/Brand.js";
import { cloudConf } from "./config/cloudinary.js";

const yamahaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" fill="#ffffff">
  <circle cx="24" cy="25" r="18" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M24 10 L24 40 M12 32 L36 18 M12 18 L36 32" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <text x="54" y="33" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" letter-spacing="3" fill="#ffffff">YAMAHA</text>
</svg>`;

const kawasakiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 50" fill="#ffffff">
  <path d="M10 8 L18 8 L28 23 L38 8 L46 8 L32 27 L48 42 L40 42 L27 29 L18 42 L10 42 Z" fill="#ffffff"/>
  <text x="56" y="33" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="23" letter-spacing="2.5" fill="#ffffff">KAWASAKI</text>
</svg>`;

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB.");

    const yb64 = "data:image/svg+xml;base64," + Buffer.from(yamahaSvg).toString("base64");
    const yRes = await cloudConf.uploader.upload(yb64, {
      folder: "motorshop/brands",
      resource_type: "image",
    });
    await Brand.findOneAndUpdate(
      { name: "Yamaha" },
      { $set: { logo: { url: yRes.secure_url, publicId: yRes.public_id }, isArchived: false } },
      { upsert: true }
    );
    console.log("Yamaha saved to DB:", yRes.secure_url);

    const kb64 = "data:image/svg+xml;base64," + Buffer.from(kawasakiSvg).toString("base64");
    const kRes = await cloudConf.uploader.upload(kb64, {
      folder: "motorshop/brands",
      resource_type: "image",
    });
    await Brand.findOneAndUpdate(
      { name: "Kawasaki" },
      { $set: { logo: { url: kRes.secure_url, publicId: kRes.public_id }, isArchived: false } },
      { upsert: true }
    );
    console.log("Kawasaki saved to DB:", kRes.secure_url);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seed();
