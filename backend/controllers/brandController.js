import Brand from "../model/Brand.js";
import Product from "../model/Product.js";
import { cloudConf } from "../config/cloudinary.js";

// Helper: Upload a brand logo to Cloudinary
const uploadLogoToCloudinary = (dataUrl) =>
  cloudConf.uploader.upload(dataUrl, {
    folder: "motorshop/brands",
    width: 400,
    crop: "limit",
  });

// Helper: Delete a brand logo from Cloudinary by publicId
const destroyFromCloudinary = (publicId) =>
  cloudConf.uploader.destroy(publicId);

// Default seed data matching motorcycled-ref-database.pdf §4.4
const DEFAULT_BRANDS = [
  { name: "Honda" },
  { name: "Yamaha" },
  { name: "Suzuki" },
  { name: "Kawasaki" },
  { name: "CFMOTO" },
];

// Seed brands if empty on startup
export const seedBrandDefaults = async () => {
  try {
    const brandCount = await Brand.countDocuments();
    if (brandCount === 0) {
      await Brand.insertMany(DEFAULT_BRANDS);
      console.log("Seeded default brands.");
    }
  } catch (err) {
    console.error("Error seeding default brands:", err);
  }
};

// ─── PUBLIC / ADMIN: GET ALL BRANDS ───────────────────────────────────────────
// GET /api/v1/brands
// Returns active (non-archived) brands with aggregated assigned product count (PDF §5)
export const getBrands = async (req, res) => {
  try {
    let matchStage = { isArchived: { $ne: true } };
    if (req.query.status === "archived" || req.query.archived === "true") {
      matchStage = { isArchived: true };
    } else if (req.query.status === "all" || req.query.all === "true") {
      matchStage = {};
    }

    const brands = await Brand.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          let: { brandId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$brand", "$$brandId"] },
                    { $ne: ["$isArchived", true] },
                  ],
                },
              },
            },
          ],
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          logo: 1,
          isArchived: 1,
          createdAt: 1,
          updatedAt: 1,
          productsCount: { $size: "$products" },
        },
      },
      { $sort: { name: 1 } },
    ]);
    return res.status(200).json({ success: true, brands });
  } catch (err) {
    console.error("getBrands error:", err);
    return res.status(500).json({ success: false, message: "Error loading brands" });
  }
};

// ─── PUBLIC: GET SINGLE BRAND ─────────────────────────────────────────────────
// GET /api/v1/brand/:id
export const getSingleBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    const productsCount = await Product.countDocuments({
      brand: brand._id,
      isArchived: { $ne: true },
    });
    return res.status(200).json({
      success: true,
      brand: { ...brand.toObject(), productsCount },
    });
  } catch (err) {
    console.error("getSingleBrand error:", err);
    return res.status(500).json({ success: false, message: "Error loading brand" });
  }
};

// ─── ADMIN: CREATE BRAND ──────────────────────────────────────────────────────
// POST /api/v1/admin/brand/new
export const createBrand = async (req, res) => {
  try {
    const { name, logo } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Brand name is required" });
    }

    const trimmedName = name.trim();
    const existing = await Brand.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      isArchived: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "An active brand with this name already exists" });
    }

    let logoData = null;
    if (logo && typeof logo === "string" && logo.startsWith("data:")) {
      try {
        const result = await uploadLogoToCloudinary(logo);
        logoData = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (uploadErr) {
        console.error("Brand logo upload error:", uploadErr);
        return res.status(400).json({ success: false, message: "Failed to upload brand logo image" });
      }
    }

    const brand = await Brand.create({
      name: trimmedName,
      logo: logoData,
      isArchived: false,
    });

    return res.status(201).json({ success: true, brand });
  } catch (err) {
    console.error("createBrand error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create brand" });
  }
};

// ─── ADMIN: UPDATE BRAND ──────────────────────────────────────────────────────
// PUT /api/v1/admin/brand/:id
export const updateBrand = async (req, res) => {
  try {
    const { name, logo } = req.body;
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await Brand.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: req.params.id },
        isArchived: { $ne: true },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Another active brand already has this name" });
      }
      brand.name = trimmedName;
    }

    // Handle logo changes
    if (logo !== undefined) {
      if (typeof logo === "string" && logo.startsWith("data:")) {
        if (brand.logo?.publicId) {
          try {
            await destroyFromCloudinary(brand.logo.publicId);
          } catch (e) {
            console.error("Error removing old brand logo:", e);
          }
        }
        const result = await uploadLogoToCloudinary(logo);
        brand.logo = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } else if (logo === null || logo === "") {
        if (brand.logo?.publicId) {
          try {
            await destroyFromCloudinary(brand.logo.publicId);
          } catch (e) {
            console.error("Error removing old brand logo:", e);
          }
        }
        brand.logo = null;
      }
    }

    await brand.save();
    return res.status(200).json({ success: true, brand });
  } catch (err) {
    console.error("updateBrand error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update brand" });
  }
};

// ─── ADMIN: DELETE BRAND (WITH 409 CONFLICT CHECK & SOFT DELETE) ──────────────
// DELETE /api/v1/admin/brand/:id
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    // 1. Backend checks whether the brand has active products
    const activeProducts = await Product.find({
      brand: req.params.id,
      isArchived: { $ne: true },
    }).select("_id name price stock images");

    const productCount = activeProducts.length;

    // 2. If products exist, return conflict response (409 Conflict) containing product count & products
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        conflict: true,
        productCount,
        products: activeProducts,
        message: `Brand "${brand.name}" cannot be deleted because it is assigned to ${productCount} active product(s). Please reassign them before deletion.`,
      });
    }

    // 3. Once no active products reference the brand, soft-delete it
    brand.isArchived = true;
    await brand.save();

    return res.status(200).json({
      success: true,
      message: `Brand "${brand.name}" has been soft-deleted successfully.`,
      brand,
    });
  } catch (err) {
    console.error("deleteBrand error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete brand" });
  }
};

// ─── ADMIN: REASSIGN PRODUCTS AND SOFT-DELETE BRAND ───────────────────────────
// POST /api/v1/admin/brand/:id/reassign
export const reassignBrandAndSoftDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetBrandId } = req.body;

    if (!targetBrandId) {
      return res.status(400).json({
        success: false,
        message: "Please select a target brand to reassign products to.",
      });
    }

    if (id === targetBrandId) {
      return res.status(400).json({
        success: false,
        message: "Target brand cannot be the same as the brand being deleted.",
      });
    }

    const sourceBrand = await Brand.findById(id);
    if (!sourceBrand) {
      return res.status(404).json({ success: false, message: "Brand to delete not found" });
    }

    const targetBrand = await Brand.findById(targetBrandId);
    if (!targetBrand || targetBrand.isArchived) {
      return res.status(404).json({ success: false, message: "Selected target brand was not found or is archived" });
    }

    // Reassign all active products
    const result = await Product.updateMany(
      { brand: id },
      { $set: { brand: targetBrandId } },
    );

    // Once no active products reference the source brand, soft-delete it
    sourceBrand.isArchived = true;
    await sourceBrand.save();

    return res.status(200).json({
      success: true,
      message: `Reassigned ${result.modifiedCount} product(s) to "${targetBrand.name}" and soft-deleted brand "${sourceBrand.name}".`,
      reassignedCount: result.modifiedCount,
      brand: sourceBrand,
    });
  } catch (err) {
    console.error("reassignBrand error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to reassign products and delete brand",
    });
  }
};

// ─── ADMIN: RESTORE BRAND ────────────────────────────────────────────────────
// PUT /api/v1/admin/brand/:id/restore
export const restoreBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    if (!brand.isArchived) {
      return res.status(400).json({ success: false, message: "Brand is already active" });
    }

    brand.isArchived = false;
    await brand.save();

    return res.status(200).json({
      success: true,
      message: `Brand "${brand.name}" restored successfully.`,
      brand,
    });
  } catch (err) {
    console.error("restoreBrand error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to restore brand" });
  }
};

