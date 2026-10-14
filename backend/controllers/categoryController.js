import Category from "../model/Category.js";
import Product from "../model/Product.js";

// Default seed data matching motorcycled-ref-database.pdf §4.3
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

// Seed categories if empty on startup
export const seedCategoryDefaults = async () => {
  try {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log("Seeded default categories.");
    }
  } catch (err) {
    console.error("Error seeding default categories:", err);
  }
};

// ─── PUBLIC / ADMIN: GET ALL CATEGORIES ───────────────────────────────────────
// GET /api/v1/categories
// Returns active (non-archived) categories with aggregated assigned product count (PDF §5)
export const getCategories = async (req, res) => {
  try {
    let matchStage = { isArchived: { $ne: true } };
    if (req.query.status === "archived" || req.query.archived === "true") {
      matchStage = { isArchived: true };
    } else if (req.query.status === "all" || req.query.all === "true") {
      matchStage = {};
    }

    const categories = await Category.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          let: { catId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$category", "$$catId"] },
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
          description: 1,
          isArchived: 1,
          createdAt: 1,
          updatedAt: 1,
          productsCount: { $size: "$products" },
        },
      },
      { $sort: { name: 1 } },
    ]);
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ success: false, message: "Error loading categories" });
  }
};

// ─── PUBLIC: GET SINGLE CATEGORY ──────────────────────────────────────────────
// GET /api/v1/category/:id
export const getSingleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    const productsCount = await Product.countDocuments({
      category: category._id,
      isArchived: { $ne: true },
    });
    return res.status(200).json({
      success: true,
      category: { ...category.toObject(), productsCount },
    });
  } catch (err) {
    console.error("getSingleCategory error:", err);
    return res.status(500).json({ success: false, message: "Error loading category" });
  }
};

// ─── ADMIN: CREATE CATEGORY ───────────────────────────────────────────────────
// POST /api/v1/admin/category/new
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      isArchived: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "A category with this name already exists" });
    }

    const category = await Category.create({
      name: trimmedName,
      description: description ? description.trim() : "",
      isArchived: false,
    });

    return res.status(201).json({ success: true, category });
  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create category" });
  }
};

// ─── ADMIN: UPDATE CATEGORY ───────────────────────────────────────────────────
// PUT /api/v1/admin/category/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: req.params.id },
        isArchived: { $ne: true },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Another active category already has this name" });
      }
      category.name = trimmedName;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();
    return res.status(200).json({ success: true, category });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update category" });
  }
};

// ─── ADMIN: DELETE CATEGORY (WITH 409 CONFLICT CHECK & SOFT DELETE) ───────────
// DELETE /api/v1/admin/category/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // 1. Backend checks whether the category has active products
    const activeProducts = await Product.find({
      category: req.params.id,
      isArchived: { $ne: true },
    }).select("_id name price stock images");

    const productCount = activeProducts.length;

    // 2. If products exist, return a conflict response (409 Conflict) containing the product count & products
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        conflict: true,
        productCount,
        products: activeProducts,
        message: `Category "${category.name}" cannot be deleted because it is assigned to ${productCount} active product(s). Please reassign them before deletion.`,
      });
    }

    // 3. Once no active products reference the category, soft-delete it
    category.isArchived = true;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" has been soft-deleted successfully.`,
      category,
    });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete category" });
  }
};

// ─── ADMIN: REASSIGN PRODUCTS AND SOFT-DELETE CATEGORY ────────────────────────
// POST /api/v1/admin/category/:id/reassign
export const reassignCategoryAndSoftDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCategoryId } = req.body;

    if (!targetCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Please select a target category to reassign products to.",
      });
    }

    if (id === targetCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Target category cannot be the same as the category being deleted.",
      });
    }

    const sourceCategory = await Category.findById(id);
    if (!sourceCategory) {
      return res.status(404).json({ success: false, message: "Category to delete not found" });
    }

    const targetCategory = await Category.findById(targetCategoryId);
    if (!targetCategory || targetCategory.isArchived) {
      return res.status(404).json({ success: false, message: "Selected target category was not found or is archived" });
    }

    // Reassign all active products
    const result = await Product.updateMany(
      { category: id },
      { $set: { category: targetCategoryId } },
    );

    // Once no active products reference the source category, soft-delete it
    sourceCategory.isArchived = true;
    await sourceCategory.save();

    return res.status(200).json({
      success: true,
      message: `Reassigned ${result.modifiedCount} product(s) to "${targetCategory.name}" and soft-deleted category "${sourceCategory.name}".`,
      reassignedCount: result.modifiedCount,
      category: sourceCategory,
    });
  } catch (err) {
    console.error("reassignCategory error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to reassign products and delete category",
    });
  }
};

// ─── ADMIN: RESTORE CATEGORY ─────────────────────────────────────────────────
// PUT /api/v1/admin/category/:id/restore
export const restoreCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (!category.isArchived) {
      return res.status(400).json({ success: false, message: "Category is already active" });
    }

    category.isArchived = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" restored successfully.`,
      category,
    });
  } catch (err) {
    console.error("restoreCategory error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to restore category" });
  }
};

