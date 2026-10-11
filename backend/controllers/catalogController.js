import Category from "../model/Category.js";
import Brand from "../model/Brand.js";

// Default seed data matching motorcycled-ref-database.pdf §4.3 and §4.4
const DEFAULT_CATEGORIES = [
  { name: "Motorcycles", description: "Full motorcycle units" },
  { name: "Engine Parts", description: "Engine components and internals" },
  { name: "Brakes", description: "Brake pads, calipers, and discs" },
  { name: "Tires and Wheels", description: "Tires, rims, and wheel components" },
  { name: "Helmets", description: "Full-face, open-face, and modular helmets" },
  { name: "Riding Gear", description: "Jackets, gloves, boots, and protection" },
  { name: "Accessories", description: "Bags, phone mounts, and add-ons" },
  { name: "Lubricants", description: "Engine oils and lubricants" },
];

const DEFAULT_BRANDS = [
  { name: "Honda" },
  { name: "Yamaha" },
  { name: "Suzuki" },
  { name: "Kawasaki" },
  { name: "CFMOTO" },
];

// Seed categories and brands if empty on startup
export const seedCatalogDefaults = async () => {
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log("Seeded default categories.");
  }

  const brandCount = await Brand.countDocuments();
  if (brandCount === 0) {
    await Brand.insertMany(DEFAULT_BRANDS);
    console.log("Seeded default brands.");
  }
};

// GET /api/v1/categories — returns all categories (for product form dropdown)
export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  return res.status(200).json({ success: true, categories });
};

// GET /api/v1/brands — returns all brands (for product form dropdown)
export const getBrands = async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 }).lean();
  return res.status(200).json({ success: true, brands });
};
