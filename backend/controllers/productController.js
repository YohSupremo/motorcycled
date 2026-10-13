import mongoose from "mongoose";
import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Brand from "../model/Brand.js";
import { cloudConf } from "../config/cloudinary.js";

// Helper: Upload a single Base64 data URL to Cloudinary.
// Reference: itcp318-s3a-2026/backend/controllers/product.js lines 31-35
const uploadToCloudinary = (dataUrl) =>
  cloudConf.uploader.upload(dataUrl, {
    folder: "motorshop/products",
    width: 800,
    crop: "limit",
  });

// Helper: Delete a single asset from Cloudinary by publicId.
// Reference: itcp318-s3a-2026 adaptation for cleanup on delete/update
const destroyFromCloudinary = (publicId) =>
  cloudConf.uploader.destroy(publicId);

// ─── ADMIN: CREATE ────────────────────────────────────────────────────────────
// POST /api/v1/admin/product/new
// Reference: itcp318-s3a-2026/backend/controllers/product.js → newProduct (lines 6-64)
export const newProduct = async (req, res) => {
  let images = [];

  // Collect Base64 data URLs sent from frontend FileReader
  // Reference: itcp318-s3a-2026/backend/controllers/product.js lines 15-18
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else if (Array.isArray(req.body.images)) {
    images = req.body.images;
  }

  // Upload each image to Cloudinary, collect { url, publicId }
  const imagesLinks = [];
  for (const image of images) {
    try {
      const result = await uploadToCloudinary(image);
      imagesLinks.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
    }
  }

  req.body.images = imagesLinks;
  // Reference: itcp318-s3a-2026/backend/controllers/product.js line 49
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  if (!product) {
    return res.status(400).json({ success: false, message: "Product not created" });
  }

  return res.status(201).json({ success: true, product });
};

// ─── ADMIN: GET ALL PRODUCTS ──────────────────────────────────────────────────
// GET /api/v1/admin/products
// Reference: itcp318-s3a-2026/backend/controllers/product.js → getAdminProducts (lines 114-128)
export const getAdminProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 });

  if (!products) {
    return res.status(404).json({ success: false, message: "Products not found" });
  }

  return res.status(200).json({ success: true, products });
};

// ─── PUBLIC: GET SINGLE PRODUCT ───────────────────────────────────────────────
// GET /api/v1/product/:id
// Reference: itcp318-s3a-2026/backend/controllers/product.js → getSingleProduct (lines 100-112)
export const getSingleProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name description")
    .populate("brand", "name logo");

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  return res.status(200).json({ success: true, product });
};

// ─── ADMIN: UPDATE ────────────────────────────────────────────────────────────
// PUT /api/v1/admin/product/:id
// Reference: itcp318-s3a-2026/backend/controllers/product.js → updateProduct (lines 129-176)
export const updateProduct = async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Process images if provided in request
  if (req.body.images !== undefined) {
    let rawImages = [];
    if (typeof req.body.images === "string") {
      rawImages.push(req.body.images);
    } else if (Array.isArray(req.body.images)) {
      rawImages = req.body.images;
    }

    const finalImages = [];
    for (const item of rawImages) {
      if (typeof item === "string" && item.startsWith("data:")) {
        // New Base64 image -> upload to Cloudinary
        try {
          const result = await uploadToCloudinary(item);
          finalImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } catch (err) {
          console.error("Cloudinary upload error:", err);
        }
      } else if (item && typeof item === "object" && item.url && item.publicId) {
        // Preserved existing image object
        finalImages.push({
          url: item.url,
          publicId: item.publicId,
        });
      } else if (typeof item === "string" && item.startsWith("http")) {
        // Existing image URL
        const matched = product.images.find((img) => img.url === item);
        if (matched) {
          finalImages.push({
            url: matched.url,
            publicId: matched.publicId,
          });
        }
      }
    }

    // Clean up removed images from Cloudinary
    const keptPublicIds = new Set(finalImages.map((img) => img.publicId));
    for (const oldImg of product.images) {
      if (!keptPublicIds.has(oldImg.publicId)) {
        try {
          await destroyFromCloudinary(oldImg.publicId);
        } catch (err) {
          console.error("Error removing old image from Cloudinary:", err);
        }
      }
    }

    req.body.images = finalImages;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name")
    .populate("brand", "name");

  return res.status(200).json({ success: true, product });
};

// ─── ADMIN: DELETE ────────────────────────────────────────────────────────────
// DELETE /api/v1/admin/product/:id
// Reference: itcp318-s3a-2026/backend/controllers/product.js → deleteProduct (lines 178-191)
// Extends reference by also deleting Cloudinary images (PDF §1 Design Principles #5 adaptation)
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Remove all associated Cloudinary images before deleting the document
  for (const img of product.images) {
    try {
      await destroyFromCloudinary(img.publicId);
    } catch (err) {
      console.error("Cloudinary destroy error:", err);
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  return res.status(200).json({ success: true, message: "Product deleted successfully" });
};

// ─── ADMIN: TOGGLE ARCHIVE ───────────────────────────────────────────────────
// PATCH /api/v1/admin/product/:id/archive
// PDF §4.5: isArchived flag — archive instead of hard-delete (PDF §1 Design Principles #5)
export const toggleArchiveProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  product.isArchived = !product.isArchived;
  await product.save();

  return res.status(200).json({
    success: true,
    message: `Product ${product.isArchived ? "archived" : "restored"} successfully`,
    isArchived: product.isArchived,
  });
};

// ─── PUBLIC: GET PRODUCTS (Storefront) ───────────────────────────────────────
// GET /api/v1/products
// Supports: keyword search, category, brand, price range, pagination
// Reference: itcp318-s3a-2026/backend/controllers/product.js → getProducts (lines 66-98)
// & itcp318-s3a-2026/backend/utils/apiFeatures.js
export const getProducts = async (req, res) => {
  const resPerPage = Number(req.query.limit) || 12;
  const currentPage = Number(req.query.page) || 1;
  const skip = resPerPage * (currentPage - 1);

  // Build query filter
  const filter = { isArchived: false };

  // Keyword search (Reference: apiFeatures.js regex on name, extended to description)
  if (req.query.keyword && req.query.keyword.trim() !== "") {
    const kw = req.query.keyword.trim();
    filter.$or = [
      { name: { $regex: kw, $options: "i" } },
      { description: { $regex: kw, $options: "i" } },
      { compatibleModels: { $regex: kw, $options: "i" } },
    ];
  }

  // Category filter: handles both ObjectId and category name (e.g. "Brakes")
  if (req.query.category && req.query.category !== "All") {
    if (mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = req.query.category;
    } else {
      const cat = await Category.findOne({
        name: { $regex: `^${req.query.category}$`, $options: "i" },
      });
      if (cat) filter.category = cat._id;
    }
  }

  // Brand filter: handles both ObjectId and brand name (e.g. "Yamaha")
  if (req.query.brand && req.query.brand !== "All") {
    if (mongoose.Types.ObjectId.isValid(req.query.brand)) {
      filter.brand = req.query.brand;
    } else {
      const b = await Brand.findOne({
        name: { $regex: `^${req.query.brand}$`, $options: "i" },
      });
      if (b) filter.brand = b._id;
    }
  }

  // Installment filter
  if (req.query.onlyInstallment === "true" || req.query.onlyInstallment === true) {
    filter.installmentEligible = true;
  }

  // Price range filter (Supports price[gte], price[lte], minPrice, maxPrice)
  if (
    req.query["price[gte]"] !== undefined ||
    req.query["price[lte]"] !== undefined ||
    req.query.minPrice !== undefined ||
    req.query.maxPrice !== undefined
  ) {
    filter.price = {};
    const minP = req.query["price[gte]"] ?? req.query.minPrice;
    const maxP = req.query["price[lte]"] ?? req.query.maxPrice;
    if (minP !== undefined && minP !== "") filter.price.$gte = Number(minP);
    if (maxP !== undefined && maxP !== "") filter.price.$lte = Number(maxP);
  }

  // Ratings filter (e.g. 4 stars and above)
  if (req.query.ratings || req.query["ratings[gte]"]) {
    const minRating = Number(req.query.ratings || req.query["ratings[gte]"]);
    if (!isNaN(minRating) && minRating > 0) {
      filter.ratings = { $gte: minRating };
    }
  }

  const productsCount = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 })
    .limit(resPerPage)
    .skip(skip);

  return res.status(200).json({
    success: true,
    productsCount,
    resPerPage,
    filteredProductsCount: products.length,
    products,
  });
};
