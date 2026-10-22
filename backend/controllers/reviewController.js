import mongoose from "mongoose";
import Review from "../model/Review.js";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import { Filter } from "bad-words";

// Bad-words filter configuration (Unit 1: 10pts)
// Masks profanities and offensive language with asterisks (****)
const badWordsFilter = new Filter();
badWordsFilter.addWords(
  "gago",
  "tarantado",
  "tangina",
  "bobo",
  "puta",
  "leche",
  "ulol",
  "peste",
  "t@ngina",
  "kupal",
  "inutil"
);

export const cleanBadWords = (text) => {
  if (!text || typeof text !== "string") return text || "";
  try {
    return badWordsFilter.clean(text);
  } catch (err) {
    console.error("bad-words clean error:", err);
    return text;
  }
};

// Calls an async (req,res) handler and forwards thrown errors to Express,
// keeping each controller body free of repetitive try/catch noise.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Recompute a product's ratings average and numOfReviews from its visible
// reviews, then persist both onto the Product document.
const recomputeProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: "$product",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(avg * 10) / 10,
    numOfReviews: count,
  });
};

// A customer may review a product only after it has been delivered (a completed
// order). `ordered` tracks any non-canceled order and is used to explain the
// "on the way" state in the UI; `received` gates actually writing a review.
const getOrderFlags = async (userId, productId) => {
  const orders = await Order.find({
    user: userId,
    orderStatus: { $ne: "canceled" },
    "orderItems.product": productId,
  }).select("orderStatus");

  const completed = orders.find((o) => o.orderStatus === "completed");

  return {
    ordered: orders.length > 0,
    received: Boolean(completed),
    orderId: completed?._id,
  };
};

const validateReviewInput = (rating, comment) => {
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }
  return { rating: numericRating, comment: (comment || "").trim() };
};

// ─── PUBLIC: LIST REVIEWS FOR A PRODUCT ───────────────────────────────────────
// GET /api/v1/product/:id/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const reviews = await Review.find({ product: id, isHidden: false })
    .populate("user", "firstName lastName profilePicture")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, count: reviews.length, reviews });
});

// ─── CUSTOMER: OWN REVIEW + ELIGIBILITY ───────────────────────────────────────
// GET /api/v1/product/:id/my-review  (auth required)
export const getMyReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const [review, flags] = await Promise.all([
    Review.findOne({ product: productId, user: req.user._id }),
    getOrderFlags(req.user._id, productId),
  ]);

  return res.status(200).json({
    success: true,
    review,
    ordered: flags.ordered,
    received: flags.received,
  });
});

// ─── CUSTOMER: CREATE OWN REVIEW ──────────────────────────────────────────────
// POST /api/v1/product/:id/review  (auth required)
export const createReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const product = await Product.findById(productId);
  if (!product || product.isArchived) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const existing = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "You have already reviewed this product. Edit your review instead.",
    });
  }

  const { error, rating, comment } = validateReviewInput(
    req.body.rating,
    req.body.comment,
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const flags = await getOrderFlags(req.user._id, productId);
  if (!flags.received) {
    return res.status(403).json({
      success: false,
      message:
        "You can only review products that have been delivered to you.",
    });
  }

  // Mask bad words in title and comment (Unit 1: 10pts bad-words package)
  const cleanedTitle = cleanBadWords((req.body.title || "").trim());
  const cleanedComment = cleanBadWords(comment);

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title: cleanedTitle,
    comment: cleanedComment,
    isVerifiedPurchase: flags.received,
    order: flags.orderId,
  });

  await recomputeProductRating(productId);
  const updated = await Product.findById(productId).select(
    "ratings numOfReviews",
  );

  return res.status(201).json({
    success: true,
    message: "Review submitted",
    review,
    ratings: updated.ratings,
    numOfReviews: updated.numOfReviews,
  });
});

// ─── CUSTOMER: UPDATE OWN REVIEW ──────────────────────────────────────────────
// PUT /api/v1/product/:id/review  (auth required)
export const updateReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const review = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "You have not reviewed this product yet" });
  }

  const { error, rating, comment } = validateReviewInput(
    req.body.rating,
    req.body.comment,
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const flags = await getOrderFlags(req.user._id, productId);

  // Mask bad words on review update as well
  review.rating = rating;
  review.title = cleanBadWords((req.body.title || "").trim());
  review.comment = cleanBadWords(comment);
  review.isVerifiedPurchase = flags.received;
  review.order = flags.orderId;
  await review.save();

  await recomputeProductRating(productId);
  const updated = await Product.findById(productId).select(
    "ratings numOfReviews",
  );

  return res.status(200).json({
    success: true,
    message: "Review updated",
    review,
    ratings: updated.ratings,
    numOfReviews: updated.numOfReviews,
  });
});

// ─── CUSTOMER: DELETE OWN REVIEW ──────────────────────────────────────────────
// DELETE /api/v1/product/:id/review  (auth required)
export const deleteMyReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const review = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "You have not reviewed this product yet" });
  }

  await review.deleteOne();
  await recomputeProductRating(productId);

  return res.status(200).json({ success: true, message: "Review deleted" });
});

// ─── ADMIN: LIST ALL REVIEWS ──────────────────────────────────────────────────
// GET /api/v1/admin/reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("product", "name")
    .populate("user", "firstName lastName email profilePicture")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, count: reviews.length, reviews });
});

// ─── ADMIN: TOGGLE VISIBILITY (MODERATION) ────────────────────────────────────
// PUT /api/v1/admin/review/:id/hide
export const toggleReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });
  }

  review.isHidden = !review.isHidden;
  await review.save();
  await recomputeProductRating(review.product);

  return res.status(200).json({
    success: true,
    message: review.isHidden ? "Review hidden" : "Review published",
    review,
  });
});

// ─── ADMIN: DELETE REVIEW ─────────────────────────────────────────────────────
// DELETE /api/v1/admin/review/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });
  }

  const productId = review.product;
  await review.deleteOne();
  await recomputeProductRating(productId);

  return res.status(200).json({ success: true, message: "Review deleted" });
});
