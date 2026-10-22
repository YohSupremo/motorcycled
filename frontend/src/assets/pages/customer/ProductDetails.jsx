import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getProductDetails, clearErrors } from "../../../actions/productActions";
import { addToCart } from "../../../actions/cartActions";
import {
  getProductReviews,
  getMyReview,
  newReview,
  updateReview,
  deleteMyReview,
  clearErrors as clearReviewErrors,
} from "../../../actions/reviewActions";
import {
  NEW_REVIEW_RESET,
  DELETE_MY_REVIEW_RESET,
} from "../../../constants/reviewConstants";
import { toast } from "react-toastify";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { reviewSchema } from "../../schema/reviewSchema.js";

// Product detail page: gallery, pricing, financing, reviews, and specifications.
export const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, product } = useSelector(
    (state) => state.productDetails || {}
  );
  const { cartItems = [] } = useSelector((state) => state.cart || {});
  const { reviews = [], count: reviewCount } = useSelector(
    (state) => state.productReviews || {}
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const { loading: reviewLoading } = useSelector(
    (state) => state.newReview || {}
  );
  const {
    review: myReview,
    ordered,
    received,
    loading: myReviewLoading,
  } = useSelector((state) => state.myReview || {});
  const { loading: deletingReview } = useSelector(
    (state) => state.deleteMyReview || {}
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [editingReview, setEditingReview] = useState(false);

  const {
    register,
    handleSubmit: handleReviewFormSubmit,
    setValue,
    reset: resetReview,
    control: reviewControl,
    formState: { errors: reviewErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", comment: "" },
  });

  const reviewForm = useWatch({ control: reviewControl });

  // MP2 Review Filters (5pts: Star filter, Verified Purchase filter, keyword search)
  const [reviewFilterRating, setReviewFilterRating] = useState(0); // 0 = all
  const [reviewFilterVerified, setReviewFilterVerified] = useState(false);
  const [reviewSearchKeyword, setReviewSearchKeyword] = useState("");

  useEffect(() => {
    dispatch(getProductDetails(id));
    dispatch(getProductReviews(id));
    if (isAuthenticated) dispatch(getMyReview(id));
    return () => {
      dispatch(clearErrors());
      dispatch(clearReviewErrors());
      dispatch({ type: NEW_REVIEW_RESET });
      dispatch({ type: DELETE_MY_REVIEW_RESET });
    };
  }, [dispatch, id, isAuthenticated]);

  // Scroll to top on navigation, or auto-scroll to review section if explicitly requested
  useEffect(() => {
    if (
      window.location.hash === "#reviews" ||
      window.location.search.includes("writeReview=true")
    ) {
      const timer = setTimeout(() => {
        const el = document.getElementById("reviews");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [id]);

  const resetReviewForm = () => {
    resetReview({ rating: 0, title: "", comment: "" });
    setEditingReview(false);
  };

  const handleStartEdit = () => {
    if (!myReview) return;
    resetReview({
      rating: myReview.rating,
      title: myReview.title || "",
      comment: myReview.comment || "",
    });
    setEditingReview(true);
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Delete your review for this product?")) return;
    const result = await dispatch(deleteMyReview(id));
    if (result?.type?.endsWith?.("SUCCESS")) {
      toast.success("Your review has been deleted.");
      resetReviewForm();
      dispatch(getProductReviews(id));
      dispatch(getMyReview(id));
      dispatch(getProductDetails(id));
    } else if (result?.type?.endsWith?.("FAIL")) {
      toast.error(result.payload || "Failed to delete review");
    }
  };

  const handleReviewSubmit = async (data) => {
    const payload = {
      rating: data.rating,
      title: (data.title || "").trim(),
      comment: (data.comment || "").trim(),
    };
    const result = myReview
      ? await dispatch(updateReview(id, payload))
      : await dispatch(newReview(id, payload));
    if (result?.type?.endsWith?.("SUCCESS")) {
      toast.success(
        myReview
          ? "Your review has been updated."
          : "Thank you! Your review has been saved."
      );
      resetReviewForm();
      dispatch({ type: NEW_REVIEW_RESET });
      dispatch(getProductReviews(id));
      dispatch(getMyReview(id));
      dispatch(getProductDetails(id));
    } else if (result?.type?.endsWith?.("FAIL")) {
      toast.error(result.payload || "Failed to submit review");
    }
  };

  const images = product?.images || [];
  const activeImage = images[selectedImageIndex]?.url;
  const categoryName = product?.category?.name || product?.category || "General";
  const brandName = product?.brand?.name || product?.brand || "OEM";
  const inStock = product?.stock || 0;

  // Financing calculation
  const minDown = Number(
    product?.minInstallmentPrice || (product?.price ? product.price * 0.2 : 0)
  );
  const financedAmount = Math.max(0, (product?.price || 0) - minDown);
  const monthlyEstimate = Math.round((financedAmount * 1.1) / 12);

  const handleIncreaseQty = () => {
    const current = Number(quantity) || 1;
    if (current < inStock) setQuantity(current + 1);
  };

  const handleDecreaseQty = () => {
    const current = Number(quantity) || 1;
    if (current > 1) setQuantity(current - 1);
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num < 1) {
      setQuantity(1);
    } else if (inStock > 0 && num > inStock) {
      setQuantity(inStock);
    } else {
      setQuantity(num);
    }
  };

  const handleQuantityBlur = () => {
    const num = Number(quantity);
    if (!num || num < 1) {
      setQuantity(1);
    } else if (inStock > 0 && num > inStock) {
      setQuantity(inStock);
    }
  };

  const handleAddToCart = async () => {
    const finalQty = Number(quantity) || 1;
    setQuantity(finalQty);

    const inCart = (cartItems || [])
      .filter((i) => i.productId === product._id)
      .reduce((sum, i) => sum + (i.quantity || 1), 0);

    if (inCart + finalQty > inStock) {
      const remaining = Math.max(0, inStock - inCart);
      const warnMsg =
        inCart >= inStock
          ? `Stock limit reached! You already have all ${inStock} available units of "${product.name}" in your cart.`
          : `Cannot add ${finalQty} units. Stock limit is ${inStock} (${inCart} already in cart, only ${remaining} available).`;
      toast.warning(warnMsg);
      return;
    }

    const result = await dispatch(addToCart(product._id, finalQty));
    if (result && result.success === false) {
      toast.warning(result.message || `Cannot add to cart: Stock limit reached!`);
    } else {
      toast.success(`Added ${finalQty} × "${product.name}" to your cart!`);
    }
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Review aggregates derived from the loaded review list (with product.ratings fallback)
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : Number(product?.ratings) || 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const otherReviews = reviews.filter((r) => r.user?._id !== user?._id);

  // Filter reviews dynamically based on star rating, verified badge, and keyword
  const filteredOtherReviews = otherReviews.filter((r) => {
    if (reviewFilterRating > 0 && r.rating !== reviewFilterRating) return false;
    if (reviewFilterVerified && !r.isVerifiedPurchase) return false;
    if (reviewSearchKeyword.trim()) {
      const q = reviewSearchKeyword.toLowerCase();
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchUser = `${r.user?.firstName || ""} ${r.user?.lastName || ""}`
        .toLowerCase()
        .includes(q);
      if (!matchComment && !matchTitle && !matchUser) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center py-16">
        <div className="max-w-5xl w-full mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="w-full h-96 bg-zinc-100 rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 bg-zinc-100 rounded w-1/4" />
            <div className="h-8 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-1/2" />
            <div className="h-12 bg-zinc-100 rounded w-1/3" />
            <div className="h-24 bg-zinc-100 rounded w-full" />
            <div className="h-10 bg-zinc-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !product._id || product.isArchived) {
    return (
      <div className="min-h-[60vh] bg-white flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-4 border border-zinc-200 rounded-lg p-8 bg-zinc-50">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Product not found</h2>
          <p className="text-sm text-zinc-600">
            {error ||
              "The requested product or part could not be found."}
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Back to shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link to="/" className="hover:text-zinc-900 transition-colors">
            Showroom
          </Link>
          <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link to="/shop" className="hover:text-zinc-900 transition-colors">
            Catalog
          </Link>
          <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link
            to={`/shop?category=${encodeURIComponent(categoryName)}`}
            className="hover:text-zinc-900 transition-colors"
          >
            {categoryName}
          </Link>
          <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-zinc-900 font-medium truncate max-w-[12rem]">
            {product.name}
          </span>
        </nav>

        {/* Core grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="w-full aspect-4/3 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden relative flex items-center justify-center group select-none">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <ProductImagePlaceholder
                  category={categoryName}
                  name={product.name}
                  brand={brandName}
                />
              )}

              {/* Stock badge */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded border ${
                    inStock === 0
                      ? "bg-red-50 text-red-700 border-red-200"
                      : inStock <= 3
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {inStock === 0
                    ? "Out of stock"
                    : inStock <= 3
                    ? "Low stock"
                    : "In stock"}
                </span>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-zinc-800 shadow-md border border-zinc-200 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-zinc-800 shadow-md border border-zinc-200 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <div className="absolute bottom-3 right-3 bg-zinc-950/80 text-white text-[10px] px-2 py-0.5 rounded z-10">
                    {selectedImageIndex + 1} of {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {images.length <= 4 ? (
                  images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded-md border overflow-hidden transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-emerald-600 ring-2 ring-emerald-600/30"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))
                ) : (
                  <>
                    {images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-md border overflow-hidden transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-emerald-600 ring-2 ring-emerald-600/30"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImageIndex < 3) {
                          setSelectedImageIndex(3);
                        } else {
                          setSelectedImageIndex(
                            (selectedImageIndex + 1) % images.length
                          );
                        }
                      }}
                      className={`aspect-square rounded-md border overflow-hidden relative transition-all cursor-pointer group ${
                        selectedImageIndex >= 3
                          ? "border-emerald-600 ring-2 ring-emerald-600/30"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={
                          selectedImageIndex >= 3
                            ? images[selectedImageIndex].url
                            : images[3].url
                        }
                        alt={`${product.name} additional photos`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-zinc-950/65 flex flex-col items-center justify-center text-white transition-colors group-hover:bg-zinc-950/55">
                        <span className="text-base font-bold">
                          +{images.length - 3}
                        </span>
                        <span className="text-[10px] text-zinc-300">photos</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="space-y-6">
            <div className="space-y-3 border-b border-zinc-200 pb-5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {brandName}
                </span>
                <span className="text-zinc-500">{categoryName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-tight text-balance">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600">
                {product.numOfReviews > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(product.ratings)
                              ? "text-amber-400 fill-amber-400"
                              : "text-zinc-200 fill-zinc-200"
                          }`}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span>
                      {Number(product.ratings).toFixed(1)} (
                      {product.numOfReviews} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-500">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-zinc-500 block">Cash price</span>
                  <span className="text-3xl font-bold text-zinc-900 tracking-tight">
                    ₱
                    {Number(product.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Availability</span>
                  <span
                    className={`text-sm font-semibold ${
                      inStock > 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {inStock > 0 ? `In stock (${inStock})` : "Sold out"}
                  </span>
                </div>
              </div>

              {product.installmentEligible && (
                <div className="pt-3 border-t border-zinc-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-emerald-900">
                    <span>In-house financing estimate (12 months)</span>
                    <span>₱{monthlyEstimate.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Minimum downpayment</span>
                    <span>₱{minDown.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Compatible models */}
            {product.compatibleModels && product.compatibleModels.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-zinc-900 block">
                  Compatible models
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.compatibleModels.map((model, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 text-xs border border-zinc-200"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-zinc-900 block">
                Description
              </span>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {product.description ||
                  "Official dealership motorcycle unit or OEM component."}
              </p>
            </div>

            {/* Quantity and actions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-zinc-300 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={Number(quantity) <= 1}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer text-sm transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={inStock > 0 ? inStock : 1}
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    aria-label="Quantity"
                    className="w-14 h-9 text-center text-sm font-semibold text-zinc-900 border-x border-zinc-200 focus:outline-none focus:bg-emerald-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={Number(quantity) >= inStock}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-zinc-500">{inStock} in stock</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={inStock === 0}
                  onClick={handleAddToCart}
                  className="flex-1 h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {inStock === 0 ? "Sold out" : "Add to cart"}
                </button>

                {product.installmentEligible && (
                  <button
                    type="button"
                    onClick={() => navigate("/orders")}
                    className="h-11 px-5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Apply for financing
                  </button>
                )}
              </div>
            </div>

            {/* Assurance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-200 text-xs">
              <div className="flex items-start gap-2 text-zinc-600">
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <span className="font-semibold text-zinc-900 block">
                    Official dealership release
                  </span>
                  <span className="text-zinc-500">
                    Genuine OEM parts with factory serial
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-zinc-600">
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <span className="font-semibold text-zinc-900 block">
                    Nationwide delivery and pickup
                  </span>
                  <span className="text-zinc-500">
                    Pick up at a local hub or doorstep courier
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <section className="pt-8 border-t border-zinc-200 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Specifications
          </h2>
          <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-sm border-collapse">
              <tbody className="divide-y divide-zinc-200">
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-medium text-zinc-600 w-1/3">
                    Model
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">{product.name}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-600">Brand</td>
                  <td className="py-2.5 px-4 text-zinc-900">{brandName}</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-medium text-zinc-600">
                    Category
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">{categoryName}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-600">
                    Availability
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">
                    {inStock > 0 ? `${inStock} units` : "Out of stock"}
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-medium text-zinc-600">
                    Financing
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">
                    {product.installmentEligible
                      ? "Available (3, 6, 12, 24 months)"
                      : "Cash only"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Customer reviews */}
        <section id="reviews" className="pt-8 border-t border-zinc-200 space-y-6 scroll-mt-24">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Summary */}
            <div className="lg:w-64 shrink-0 space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                Customer reviews
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-zinc-900 tracking-tight">
                  {avgRating.toFixed(1)}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(avgRating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-zinc-200 fill-zinc-200"
                        }`}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                {distribution.map(({ star, count }) => {
                  const isSelected = reviewFilterRating === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFilterRating(isSelected ? 0 : star)}
                      className={`w-full flex items-center gap-2 text-xs p-1 rounded transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-300"
                          : "hover:bg-zinc-50 text-zinc-600"
                      }`}
                      title={`Filter by ${star} star reviews`}
                    >
                      <span className="w-3 text-zinc-500 font-medium">{star}</span>
                      <svg
                        className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{
                            width: reviewCount
                              ? `${(count / reviewCount) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span className="w-4 text-right text-zinc-400 font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>

              {(reviewFilterRating > 0 || reviewFilterVerified || reviewSearchKeyword) && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewFilterRating(0);
                    setReviewFilterVerified(false);
                    setReviewSearchKeyword("");
                  }}
                  className="w-full text-center text-xs text-emerald-700 hover:text-emerald-800 font-semibold pt-1 underline cursor-pointer"
                >
                  Reset Review Filters
                </button>
              )}
            </div>

            {/* List and form */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Your review */}
              {isAuthenticated && myReview && !editingReview && (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-zinc-900">
                      Your review
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="h-8 px-3 rounded-md border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteReview}
                        disabled={deletingReview}
                        className="h-8 px-3 rounded-md border border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {deletingReview ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= myReview.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-zinc-200 fill-zinc-200"
                        }`}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    {myReview.isVerifiedPurchase && (
                      <span className="ml-1 text-[10px] font-medium text-emerald-700">
                        Verified purchase
                      </span>
                    )}
                  </div>
                  {myReview.title && (
                    <p className="text-sm font-semibold text-zinc-900 mt-2">
                      {myReview.title}
                    </p>
                  )}
                  {myReview.comment && (
                    <p className="text-sm text-zinc-700 leading-relaxed mt-0.5">
                      {myReview.comment}
                    </p>
                  )}
                </div>
              )}

              {/* MP2: Review Filter Bar (5pts) */}
              {reviews.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Filter Reviews</span>
                      <span className="text-[10px] text-zinc-500 font-normal font-mono">
                        ({filteredOtherReviews.length} shown)
                      </span>
                    </span>

                    {/* Verified Only Toggle */}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-zinc-700 font-medium">
                      <input
                        type="checkbox"
                        checked={reviewFilterVerified}
                        onChange={(e) => setReviewFilterVerified(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-zinc-300"
                      />
                      <span>Verified purchases only</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Star chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setReviewFilterRating(0)}
                        className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                          reviewFilterRating === 0
                            ? "bg-zinc-900 text-white font-semibold"
                            : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        All Stars
                      </button>
                      {[5, 4, 3, 2, 1].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewFilterRating(reviewFilterRating === s ? 0 : s)}
                          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap ${
                            reviewFilterRating === s
                              ? "bg-amber-500 text-white font-semibold"
                              : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <span>{s}</span>
                          <span className="text-amber-300">★</span>
                        </button>
                      ))}
                    </div>

                    {/* Search keyword inside reviews */}
                    <div className="relative flex-1 min-w-[140px]">
                      <input
                        type="text"
                        value={reviewSearchKeyword}
                        onChange={(e) => setReviewSearchKeyword(e.target.value)}
                        placeholder="Search review comments..."
                        className="w-full h-8 px-2.5 pr-7 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-emerald-600"
                      />
                      {reviewSearchKeyword && (
                        <button
                          type="button"
                          onClick={() => setReviewSearchKeyword("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {filteredOtherReviews.length > 0 ? (
                <ul className="divide-y divide-zinc-200">
                  {filteredOtherReviews.map((r) => {
                    const author = r.user
                      ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim()
                      : "Customer";
                    const initials = author
                      .split(" ")
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <li key={r._id} className="py-5 flex gap-3">
                        {r.user?.profilePicture ? (
                          <img
                            src={r.user.profilePicture}
                            alt={author}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold flex items-center justify-center shrink-0">
                            {initials || "C"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-zinc-900">
                              {author}
                            </span>
                            {r.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <svg
                                  className="w-2.5 h-2.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Verified purchase
                              </span>
                            )}
                            <span className="text-xs text-zinc-400">
                              {new Date(r.createdAt).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= r.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-zinc-200 fill-zinc-200"
                                }`}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                          {r.title && (
                            <p className="text-sm font-semibold text-zinc-900 mt-1.5">
                              {r.title}
                            </p>
                          )}
                          {r.comment && (
                            <p className="text-sm text-zinc-600 leading-relaxed mt-0.5">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : otherReviews.length > 0 && filteredOtherReviews.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-300 rounded-lg p-4 bg-zinc-50">
                  <p className="text-xs font-semibold text-zinc-700">
                    No reviews found matching your active filter criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilterRating(0);
                      setReviewFilterVerified(false);
                      setReviewSearchKeyword("");
                    }}
                    className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                  >
                    Reset review filters
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-zinc-500 py-6">
                  No customer reviews yet. Be the first to share your experience.
                </p>
              ) : null}

              {/* Write / update review */}
              {(!isAuthenticated || !myReview || editingReview) && (
                <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {myReview ? "Update your review" : "Write a review"}
                  </h3>

                  {!isAuthenticated ? (
                    <p className="text-sm text-zinc-600 mt-2">
                      <Link
                      to="/login"
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Log in
                    </Link>{" "}
                    to review products that have been delivered to you.
                    </p>
                  ) : myReviewLoading ? (
                    <p className="text-sm text-zinc-500 mt-3">
                      Loading your review...
                    </p>
                  ) : !myReview && !received ? (
                    <p className="text-sm text-zinc-600 mt-2">
                      {ordered ? (
                        <>
                          Your order is on the way. You can rate and review this
                          product once it has been delivered.
                        </>
                      ) : (
                        <>
                          You can only review products that have been delivered
                          to you.{" "}
                          <Link
                            to="/shop"
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            Browse the catalog
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  ) : (
                    <form
                      onSubmit={handleReviewFormSubmit(handleReviewSubmit)}
                      noValidate
                      className="mt-4 space-y-3"
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setValue("rating", star, {
                                  shouldValidate: true,
                                  shouldTouch: true,
                                })
                              }
                              aria-label={`${star} star${star > 1 ? "s" : ""}`}
                              className="cursor-pointer p-0.5"
                            >
                              <svg
                                className={`w-6 h-6 transition-colors ${
                                  star <= reviewForm.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-zinc-300 fill-zinc-200 hover:fill-amber-200"
                                }`}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        {reviewErrors.rating && (
                          <p className="text-xs text-red-600 mt-1">
                            {reviewErrors.rating.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          {...register("title")}
                          maxLength={80}
                          placeholder="Title (optional)"
                          className={`w-full h-10 px-3 rounded-md border bg-white text-sm text-zinc-900 focus:outline-none ${
                            reviewErrors.title
                              ? "border-red-500"
                              : "border-zinc-300 focus:border-emerald-600"
                          }`}
                        />
                        {reviewErrors.title && (
                          <p className="text-xs text-red-600 mt-1">
                            {reviewErrors.title.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <textarea
                          {...register("comment")}
                          rows={3}
                          maxLength={1000}
                          placeholder={`What do you think about the ${product.name}? (optional)`}
                          className={`w-full px-3 py-2 rounded-md border bg-white text-sm text-zinc-900 focus:outline-none resize-y ${
                            reviewErrors.comment
                              ? "border-red-500"
                              : "border-zinc-300 focus:border-emerald-600"
                          }`}
                        />
                        {reviewErrors.comment && (
                          <p className="text-xs text-red-600 mt-1">
                            {reviewErrors.comment.message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">
                          Posting as <strong className="text-zinc-800 font-medium">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "you"}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          {myReview && (
                            <button
                              type="button"
                              onClick={resetReviewForm}
                              className="h-10 px-4 rounded-md border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={reviewLoading}
                            className="h-10 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                          >
                            {reviewLoading
                              ? "Saving..."
                              : myReview
                              ? "Update review"
                              : "Submit review"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductDetails;
