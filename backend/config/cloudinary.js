import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config:", {
  cloud_name: cloudinary.config().cloud_name,
  hasApiKey: !!cloudinary.config().api_key,
  hasApiSecret: !!cloudinary.config().api_secret,
});

export const cloudConf = cloudinary;
