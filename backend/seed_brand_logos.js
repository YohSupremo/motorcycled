import "dotenv/config";
import mongoose from "mongoose";
import Brand from "./model/Brand.js";
import { cloudConf } from "./config/cloudinary.js";

const BRAND_LOGOS = [
  {
    name: "Honda",
    svgUrl: "https://cdn.simpleicons.org/honda/ffffff",
  },
  {
    name: "Yamaha",
    svgUrl: "https://cdn.simpleicons.org/yamaha/ffffff",
  },
  {
    name: "Suzuki",
    svgUrl: "https://cdn.simpleicons.org/suzuki/ffffff",
  },
  {
    name: "Kawasaki",
    svgUrl: "https://cdn.simpleicons.org/kawasaki/ffffff",
  },
  {
    name: "Ducati",
    svgUrl: "https://cdn.simpleicons.org/ducati/ffffff",
  },
  {
    name: "BMW Motorrad",
    svgUrl: "https://cdn.simpleicons.org/bmw/ffffff",
  },
  {
    name: "CFMOTO",
    customSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" fill="#ffffff">
      <path d="M26 8 C15 8 7 16 7 26 C7 36 15 44 26 44 C33 44 38 41 42 35 L34 30 C32 33 29 36 26 36 C20 36 15 31 15 26 C15 21 20 16 26 16 C29 16 32 19 34 22 L42 17 C38 11 33 8 26 8 Z" fill="#ffffff"/>
      <path d="M26 18 C22 18 19 21 19 26 C19 31 22 34 26 34 C28 34 30 33 31 31 L37 35 C34 40 30 42 26 42 C17 42 10 35 10 26 C10 17 17 10 26 10 C30 10 34 12 37 17 L31 21 C30 19 28 18 26 18 Z" fill="#10b981"/>
      <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="26" letter-spacing="2.5" fill="#ffffff">CFMOTO</text>
    </svg>`,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB successfully.");

    for (const b of BRAND_LOGOS) {
      let b64 = "";
      if (b.svgUrl) {
        console.log(`Fetching logo for ${b.name} from ${b.svgUrl}...`);
        const res = await fetch(b.svgUrl);
        if (!res.ok) {
          console.warn(`Failed to fetch ${b.name}: ${res.status}`);
          continue;
        }
        const svgText = await res.text();
        b64 = "data:image/svg+xml;base64," + Buffer.from(svgText).toString("base64");
      } else if (b.customSvg) {
        b64 = "data:image/svg+xml;base64," + Buffer.from(b.customSvg).toString("base64");
      }

      console.log(`Uploading ${b.name} logo to Cloudinary...`);
      const uploadRes = await cloudConf.uploader.upload(b64, {
        folder: "motorshop/brands",
        resource_type: "image",
      });

      console.log(`${b.name} uploaded: ${uploadRes.secure_url}`);

      // Upsert into Brand collection
      const updated = await Brand.findOneAndUpdate(
        { name: b.name },
        {
          $set: {
            name: b.name,
            logo: {
              url: uploadRes.secure_url,
              publicId: uploadRes.public_id,
            },
            isArchived: false,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`Saved brand in DB: ${updated.name} (id: ${updated._id})`);
    }

    console.log("\nAll brand logos successfully seeded to database!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
