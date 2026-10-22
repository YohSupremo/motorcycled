import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Slider,
  Rating,
  Chip,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { getProducts, getCategories, getBrands } from "../../../actions/productActions";
import { addToCart } from "../../../actions/cartActions";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API;

export const Shop = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params on mount
  const initialCategory = searchParams.get("category") || "All";
  const initialBrand = searchParams.get("brand") || "All";
  const initialKeyword = searchParams.get("keyword") || searchParams.get("search") || "";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialMinPrice = Number(searchParams.get("minPrice")) || 0;
  const initialMaxPrice = Number(searchParams.get("maxPrice")) || 350000;
  const initialRating = Number(searchParams.get("ratings")) || 0;
  const initialOnlyReviewed = searchParams.get("hasReviews") === "true";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice]);
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [onlyReviewed, setOnlyReviewed] = useState(initialOnlyReviewed);
  const [onlyInstallment, setOnlyInstallment] = useState(
    searchParams.get("installment") === "true"
  );
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  // Infinite Scroll State
  const [infiniteProducts, setInfiniteProducts] = useState([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Select live data from Redux store
  // Reference: itcp318-s3a-2026/frontend/src/Components/Home.jsx
  const {
    loading,
    products = [],
    productsCount = 0,
    filteredProductsCount = 0,
  } = useSelector((state) => state.products || {});

  const { cartItems = [] } = useSelector((state) => state.cart || {});

  const { categories: dbCategories = [], brands: dbBrands = [] } = useSelector(
    (state) => state.catalog || {}
  );

  // Fetch categories & brands once on mount
  useEffect(() => {
    dispatch(getCategories());
    dispatch(getBrands());
  }, [dispatch]);

  // Sync initial Redux products with infiniteProducts on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setInfiniteProducts(products || []);
      setInfinitePage(1);
      const totalAvailable = productsCount || filteredProductsCount || 0;
      setHasMore((products || []).length < totalAvailable);
    }, 0);
    return () => clearTimeout(timer);
  }, [products, filteredProductsCount, productsCount]);

  // Fetch products from database whenever query parameters change
  useEffect(() => {
    dispatch(
      getProducts(
        1,
        searchQuery,
        priceRange,
        selectedCategory,
        selectedBrand,
        onlyInstallment,
        selectedRating,
        12,
        onlyReviewed
      )
    );
  }, [
    dispatch,
    searchQuery,
    priceRange,
    selectedCategory,
    selectedBrand,
    onlyInstallment,
    selectedRating,
    onlyReviewed,
  ]);

  // Fetch more products for Infinite Scroll
  const fetchMoreProducts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = infinitePage + 1;
    try {
      let url = `${API}/products?page=${nextPage}&limit=12&price[gte]=${priceRange[0]}&price[lte]=${priceRange[1]}`;
      if (searchQuery.trim()) url += `&keyword=${encodeURIComponent(searchQuery.trim())}`;
      if (selectedCategory && selectedCategory !== "All") url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedBrand && selectedBrand !== "All") url += `&brand=${encodeURIComponent(selectedBrand)}`;
      if (onlyInstallment) url += `&onlyInstallment=true`;
      if (selectedRating > 0) url += `&ratings=${selectedRating}`;
      if (onlyReviewed) url += `&hasReviews=true`;

      const res = await axios.get(url);
      if (res.data) {
        const newItems = res.data.products || [];
        setInfiniteProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const filtered = newItems.filter((p) => !existingIds.has(p._id));
          const updated = [...prev, ...filtered];
          const totalAvail = res.data.productsCount || res.data.filteredProductsCount || 0;
          if (updated.length >= totalAvail || newItems.length === 0) {
            setHasMore(false);
          }
          return updated;
        });
        setInfinitePage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more products via infinite scroll", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Sync state changes back to search params (without page refresh)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
    if (selectedBrand && selectedBrand !== "All") params.set("brand", selectedBrand);
    if (searchQuery.trim()) params.set("keyword", searchQuery.trim());
    if (onlyInstallment) params.set("installment", "true");
    if (onlyReviewed) params.set("hasReviews", "true");
    if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
    if (priceRange[1] < 350000) params.set("maxPrice", String(priceRange[1]));
    if (selectedRating > 0) params.set("ratings", String(selectedRating));
    if (currentPage > 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [
    selectedCategory,
    selectedBrand,
    searchQuery,
    onlyInstallment,
    priceRange,
    selectedRating,
    currentPage,
    setSearchParams,
  ]);

  // Available categories list (fallback to defaults if DB is still seeding)
  const categoriesList = useMemo(() => {
    const names = ["All"];
    if (dbCategories?.length > 0) {
      dbCategories.forEach((c) => {
        if (c?.name && !names.includes(c.name)) names.push(c.name);
      });
    } else {
      names.push(
        "Motorcycles",
        "Engine Parts",
        "Brakes",
        "Tires and Wheels",
        "Helmets",
        "Riding Gear",
        "Accessories",
        "Lubricants"
      );
    }
    return names;
  }, [dbCategories]);

  // Available brands list
  const brandsList = useMemo(() => {
    const names = ["All"];
    if (dbBrands?.length > 0) {
      dbBrands.forEach((b) => {
        if (b?.name && !names.includes(b.name)) names.push(b.name);
      });
    } else {
      names.push("Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO");
    }
    return names;
  }, [dbBrands]);

  const handleAddToCart = async (product) => {
    // Check local stock limits first
    const inCart = (cartItems || [])
      .filter((i) => i.productId === product._id)
      .reduce((sum, i) => sum + (i.quantity || 1), 0);

    if (inCart >= product.stock) {
      const warnMsg = `Stock limit reached! You already have all ${product.stock} units of "${product.name}" in your cart.`;
      toast.warning(warnMsg);
      return;
    }

    const result = await dispatch(addToCart(product._id, 1));
    if (result && result.success === false) {
      const warnMsg = result.message || `Cannot add "${product.name}": Stock limit reached!`;
      toast.warning(warnMsg);
    } else {
      toast.success(`Added "${product.name}" to cart.`);
    }
  };

  const handleNavigate = (path) => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
    } else {
      navigate(`/${path}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPriceRange([0, 350000]);
    setSelectedRating(0);
    setOnlyReviewed(false);
    setOnlyInstallment(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header and Cart Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Motorcycles, Parts and Accessories
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              New showroom units, OEM replacement parts, and rider safety gear
              with model-specific compatibility.
            </p>
          </div>
        </div>

        {/* Catalog Layout: Integrated Sidebar Filter + Unboxed Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Filter Column - Integrated without card wrapper, sticky on scroll */}
          <aside className="lg:col-span-1 lg:border-r lg:border-zinc-200 lg:pr-6 space-y-6 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
            {/* Search Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Search Catalog
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search name, model, spec..."
                  className="w-full h-9 px-3 pr-8 text-xs text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Price Filter (MUI Slider - 5pts) */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Price Range (PHP)
                </label>
                {(priceRange[0] > 0 || priceRange[1] < 350000) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriceRange([0, 350000]);
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <Box sx={{ px: 1, pt: 1 }}>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => {
                    setPriceRange(newValue);
                    setCurrentPage(1);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={350000}
                  step={5000}
                  valueLabelFormat={(val) => `₱${val.toLocaleString()}`}
                  sx={{
                    color: "#059669", // emerald-600
                    "& .MuiSlider-thumb": {
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    },
                  }}
                />
              </Box>
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 font-price">
                <span>₱{priceRange[0].toLocaleString()}</span>
                <span>₱{priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Category Filter (MUI Chips - 5pts) */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Category
                </label>
                {selectedCategory !== "All" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      clickable
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      color={isSelected ? "success" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: isSelected ? 700 : 500,
                        borderColor: isSelected ? "#059669" : "#e4e4e7",
                        bgcolor: isSelected ? "#059669" : "transparent",
                        color: isSelected ? "#ffffff" : "#3f3f46",
                        "&:hover": {
                          bgcolor: isSelected ? "#047857" : "#f4f4f5",
                        },
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Ratings Filter (MUI Rating - 5pts) */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Customer Ratings
                </label>
                {selectedRating > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRating(0);
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setSelectedRating(selectedRating === star ? 0 : star);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedRating === star
                        ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-300"
                        : "text-zinc-700 hover:bg-zinc-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Rating
                        value={star}
                        readOnly
                        size="small"
                        precision={0.5}
                        sx={{ fontSize: "0.95rem" }}
                      />
                      <span className="text-[11px] text-zinc-600">
                        {star === 5 ? "5 stars" : `${star} and up`}
                      </span>
                    </div>
                    {selectedRating === star && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Filter (MP2: 5pts - Customer Reviews Only) */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Review Filter
                </label>
                {onlyReviewed && (
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyReviewed(false);
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <label className="flex items-start gap-2.5 p-2 rounded-md hover:bg-zinc-50 border border-zinc-200 cursor-pointer transition-colors bg-white">
                <input
                  type="checkbox"
                  checked={onlyReviewed}
                  onChange={(e) => {
                    setOnlyReviewed(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                    <span>Only Reviewed Products</span>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                      ★ 1+
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    Only show catalog units with customer feedback
                  </span>
                </div>
              </label>
            </div>

            {/* Brand Filter */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Manufacturer
                </label>
                {selectedBrand !== "All" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand("All");
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {brandsList.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setSelectedBrand(b);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedBrand === b
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent"
                    }`}
                  >
                    <span>{b}</span>
                    {selectedBrand === b && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Installment Filter */}
            <div className="pt-4 border-t border-zinc-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInstallment}
                  onChange={(e) => {
                    setOnlyInstallment(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs text-zinc-800 font-medium">
                  Installment financing eligible only
                </span>
              </label>
            </div>

            {/* Reset All Filters */}
            {(selectedCategory !== "All" ||
              selectedBrand !== "All" ||
              onlyInstallment ||
              priceRange[0] > 0 ||
              priceRange[1] < 350000 ||
              selectedRating > 0 ||
              searchQuery) && (
              <div className="pt-2">
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={handleResetFilters}
                  sx={{
                    borderColor: "#d4d4d8",
                    color: "#3f3f46",
                    fontSize: "0.75rem",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "#a1a1aa",
                      bgcolor: "#f4f4f5",
                    },
                  }}
                >
                  Reset all filters
                </Button>
              </div>
            )}
          </aside>

          {/* Right Catalog Main Area */}
          <div className="lg:col-span-3 space-y-4">
            <ScrollReveal threshold={0.05} duration={600}>
              {/* View Bar and Metrics */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 text-xs">
                <span className="text-zinc-600">
                  Displaying{" "}
                  <strong>{infiniteProducts?.length || 0}</strong> of{" "}
                  <strong>{filteredProductsCount || productsCount || 0}</strong> items in database
                </span>

                {/* View Switcher: Table or Grid */}
                <div className="flex items-center gap-1 border border-zinc-200 rounded p-0.5 bg-zinc-50">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-2 py-1 rounded text-xs cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Directory Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-2 py-1 rounded text-xs cursor-pointer ${
                      viewMode === "table"
                        ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Inventory Table
                  </button>
                </div>
              </div>

              {/* Loading Skeleton */}
              {loading && infiniteProducts.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-zinc-200 rounded-md p-4 space-y-3 bg-white animate-pulse"
                    >
                      <div className="w-full h-40 bg-zinc-100 rounded" />
                      <div className="h-4 bg-zinc-100 rounded w-2/3" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                      <div className="h-6 bg-zinc-100 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : infiniteProducts.length === 0 ? (
                /* Empty State */
                <div className="border border-zinc-200 rounded-md p-12 text-center space-y-3 bg-zinc-50/50">
                  <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800">
                    No products found in database
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    There are no products matching your current filters. Try
                    adjusting the category, manufacturer, or search keywords.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 h-8 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={infiniteProducts.length}
                  next={fetchMoreProducts}
                  hasMore={hasMore}
                  scrollThreshold={0.7}
                  loader={
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1.5 }}>
                      <CircularProgress size={22} sx={{ color: "#059669" }} />
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#52525b", fontWeight: 500 }}>
                        Loading more products...
                      </Typography>
                    </Box>
                  }
                  endMessage={
                    <Box sx={{ textAlign: "center", py: 4, color: "#71717a", fontSize: "0.75rem", borderTop: "1px dashed #e4e4e7", mt: 4 }}>
                      <p className="font-semibold text-zinc-700">All catalog products loaded</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Showing all {infiniteProducts.length} matching items</p>
                    </Box>
                  }
                >
                  {viewMode === "grid" ? (
                    /* Architectural Grid - Real Cloudinary images + database attributes */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-200">
                      {infiniteProducts.map((p) => {
                    const categoryName = p.category?.name || p.category || "General";
                    const brandName = p.brand?.name || p.brand || "OEM";
                    const hasImage = p.images && p.images.length > 0 && p.images[0]?.url;

                    // Approximate installment monthly computation (standard 12-month)
                    const minDown = Number(p.minInstallmentPrice || p.price * 0.2);
                    const financedAmount = Math.max(0, p.price - minDown);
                    const monthlyEstimate = Math.round((financedAmount * 1.1) / 12);

                    return (
                      <div
                        key={p._id}
                        className="border-r border-b border-zinc-200 bg-white hover:bg-zinc-50/70 transition-colors flex flex-col justify-between overflow-hidden group"
                      >
                        {/* Image: Real Cloudinary photo or technical OEM placeholder */}
                        <Link to={`/product/${p._id}`} className="block overflow-hidden">
                          {hasImage ? (
                            <div className="w-full h-44 bg-zinc-100 overflow-hidden relative border-b border-zinc-100 flex items-center justify-center">
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                              />
                              {p.images.length > 1 && (
                                <span className="absolute bottom-2 right-2 bg-zinc-950/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                  +{p.images.length - 1} photos
                                </span>
                              )}
                            </div>
                          ) : (
                            <ProductImagePlaceholder
                              category={categoryName}
                              name={p.name}
                              brand={brandName}
                            />
                          )}
                        </Link>

                        <div className="p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                                {brandName}
                              </span>
                              <span
                                className={`font-medium px-1.5 py-0.5 rounded text-[10px] border ${
                                  p.stock === 0
                                    ? "bg-red-50 text-red-800 border-red-200"
                                    : p.stock <= 3
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                              </span>
                            </div>

                            <Link
                              to={`/product/${p._id}`}
                              className="block text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 hover:underline"
                            >
                              {p.name}
                            </Link>

                            {/* MUI Rating display (5pts deliverable) */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <Rating
                                value={Number(p.ratings) || 0}
                                precision={0.1}
                                readOnly
                                size="small"
                                sx={{ fontSize: "0.85rem" }}
                              />
                              <span className="text-[11px] font-semibold text-zinc-700">
                                {p.ratings ? Number(p.ratings).toFixed(1) : "0.0"}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                ({p.numOfReviews || 0})
                              </span>
                            </div>

                            {p.compatibleModels && p.compatibleModels.length > 0 && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium">
                                Compatible: {p.compatibleModels.join(", ")}
                              </p>
                            )}

                            {p.description && (
                              <p className="text-[11px] text-zinc-500 line-clamp-2">
                                {p.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-zinc-100 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm font-bold text-zinc-900 font-price tracking-tight">
                                ₱
                                {Number(p.price).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-medium">
                                {categoryName}
                              </span>
                            </div>

                            {p.installmentEligible && (
                              <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/60 border border-emerald-200/60 px-2 py-1 rounded">
                                Financing: ₱{monthlyEstimate.toLocaleString()}/mo (12 mos)
                                <span className="block text-[10px] text-zinc-500 font-price">
                                  Min Down: ₱{minDown.toLocaleString()}
                                </span>
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={p.stock === 0}
                                onClick={() => handleAddToCart(p)}
                                className="flex-1 h-8 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors cursor-pointer"
                              >
                                {p.stock === 0 ? "Sold out" : "Add to cart"}
                              </button>
                              {p.installmentEligible && (
                                <button
                                  type="button"
                                  onClick={() => handleNavigate("orders")}
                                  className="h-8 px-2.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  Financing
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table Directory View - Data dense, structured dealership inventory */
                <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[11px] font-semibold">
                          <th className="py-3 px-3.5">Product</th>
                          <th className="py-3 px-3.5 hidden md:table-cell">
                            Category and Brand
                          </th>
                          <th className="py-3 px-3.5 hidden lg:table-cell">
                            Compatibility
                          </th>
                          <th className="py-3 px-3.5 text-center">Stock</th>
                          <th className="py-3 px-3.5 font-semibold">Price (PHP)</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {infiniteProducts.map((p) => {
                          const categoryName = p.category?.name || p.category || "General";
                          const brandName = p.brand?.name || p.brand || "OEM";
                          const hasImage = p.images && p.images.length > 0 && p.images[0]?.url;

                          return (
                            <tr
                              key={p._id}
                              className="hover:bg-zinc-50/70 transition-colors"
                            >
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-3">
                                  <Link
                                    to={`/product/${p._id}`}
                                    className="w-10 h-10 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity"
                                  >
                                    {hasImage ? (
                                      <img
                                        src={p.images[0].url}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <ProductImagePlaceholder
                                        category={categoryName}
                                        name={p.name}
                                        brand={brandName}
                                        compact
                                      />
                                    )}
                                  </Link>
                                  <div>
                                    <Link
                                      to={`/product/${p._id}`}
                                      className="font-semibold text-zinc-900 block hover:text-emerald-700 hover:underline transition-colors"
                                    >
                                      {p.name}
                                    </Link>
                                    {p.installmentEligible && (
                                      <span className="text-[10px] text-emerald-700 font-medium">
                                        Financing eligible
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3.5 hidden md:table-cell">
                                <span className="text-zinc-800">{categoryName}</span>
                                <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                  {brandName}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 hidden lg:table-cell text-zinc-500 text-[11px]">
                                {p.compatibleModels?.length > 0
                                  ? p.compatibleModels.join(", ")
                                  : "Universal Fit"}
                              </td>
                              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    p.stock === 0
                                      ? "bg-red-50 text-red-800 border-red-200"
                                      : p.stock <= 3
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                  }`}
                                >
                                  {p.stock === 0 ? "Out of stock" : `${p.stock} units`}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-price font-bold text-zinc-900 whitespace-nowrap">
                                ₱
                                {Number(p.price).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                                <Link
                                  to={`/product/${p._id}`}
                                  className="inline-block h-7 leading-7 px-2.5 rounded border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-medium cursor-pointer transition-colors"
                                >
                                  View
                                </Link>
                                <button
                                  type="button"
                                  disabled={p.stock === 0}
                                  onClick={() => handleAddToCart(p)}
                                  className="h-7 px-3 rounded bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-xs font-medium cursor-pointer transition-colors"
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                  )}
                </InfiniteScroll>
              )}
            </ScrollReveal>
          </div>
        </div>
      </main>
    </div>
  );
};
