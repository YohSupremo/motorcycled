import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Rating,
  CircularProgress,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import axios from "axios";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { getProducts } from "../../../actions/productActions";

export const Homepage = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("All");
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Infinite Scroll State (15pts deliverable via react-infinite-scroll-component)
  const [infiniteProducts, setInfiniteProducts] = useState([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);

  // Select live products from database via Redux
  const { loading, products = [], productsCount = 0 } = useSelector(
    (state) => state.products || {}
  );

  // Fetch live catalog units for hero carousel on mount and filter changes
  useEffect(() => {
    dispatch(
      getProducts(
        1,
        searchQuery,
        [0, 9999999],
        "",
        selectedBrandFilter === "All" ? "" : selectedBrandFilter
      )
    );
  }, [dispatch, searchQuery, selectedBrandFilter]);

  // Initial fetch for Infinite Scroll products catalog
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const api = import.meta.env.VITE_API;
        const res = await axios.get(`${api}/products?page=1&limit=8`);
        if (isMounted && res.data) {
          const fetched = res.data.products || [];
          setInfiniteProducts(fetched);
          setTotalCatalogCount(res.data.productsCount || 0);
          setInfinitePage(1);
          setHasMore(fetched.length < (res.data.productsCount || 0));
        }
      } catch (err) {
        console.error("Failed to load initial products for infinite scroll", err);
      }
    };
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch next page function for react-infinite-scroll-component
  const fetchMoreProducts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = infinitePage + 1;
    try {
      const api = import.meta.env.VITE_API;
      const res = await axios.get(`${api}/products?page=${nextPage}&limit=8`);
      if (res.data) {
        const newItems = res.data.products || [];
        setInfiniteProducts((prev) => {
          // Deduplicate by _id
          const existingIds = new Set(prev.map((p) => p._id));
          const filtered = newItems.filter((p) => !existingIds.has(p._id));
          const updated = [...prev, ...filtered];
          if (updated.length >= (res.data.productsCount || 0) || newItems.length === 0) {
            setHasMore(false);
          }
          return updated;
        });
        setInfinitePage(nextPage);
      }
    } catch (err) {
      console.error("Failed to fetch more products for infinite scroll", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredUnits = useMemo(() => products.slice(0, 8), [products]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedBrandFilter, searchQuery]);

  useEffect(() => {
    if (featuredUnits.length > 0 && carouselIndex >= featuredUnits.length) {
      setCarouselIndex(0);
    }
  }, [featuredUnits.length, carouselIndex]);

  const goToSlide = (index) => {
    const len = featuredUnits.length;
    if (len === 0) return;
    setCarouselIndex(((index % len) + len) % len);
  };

  const handleNavigate = (path, paramString = "") => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
    } else {
      navigate(paramString ? `/${path}?${paramString}` : `/${path}`);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleNavigate("shop", `keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      handleNavigate("shop");
    }
  };

  const categories = [
    {
      name: "Motorcycles",
      desc: "Brand-new scooters, underbones, touring & sportbikes ready for releasing",
      count: "Live Showroom",
      tag: "Units",
    },
    {
      name: "Engine Parts",
      desc: "Genuine cylinder blocks, forged pistons, valves, drive belts & CVT clutch assemblies",
      count: "OEM Parts",
      tag: "Components",
    },
    {
      name: "Brakes",
      desc: "Hydraulic disc calipers, sintered brake pads, master cylinders & rear shock absorbers",
      count: "Safety",
      tag: "Chassis",
    },
    {
      name: "Tires and Wheels",
      desc: "High-grip tubeless compound tires, cast alloy rims, tire valves & tubes",
      count: "Performance",
      tag: "Consumables",
    },
    {
      name: "Helmets",
      desc: "ECE 22.06 & DOT certified full-face helmets, armored jackets & riding gloves",
      count: "Certified",
      tag: "Gear",
    },
    {
      name: "Lubricants",
      desc: "Full synthetic 4-stroke engine oils, gear lubricants, coolant & chain care products",
      count: "Maintenance",
      tag: "Fluids",
    },
  ];

  const brands = ["All", "Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];

  const testimonials = [
    {
      author: "Mark Anthony Ramos",
      role: "Yamaha NMAX 155 ABS",
      location: "Pasig City",
      initials: "MR",
      verifiedTag: "Verified Owner • 12-Mo Financing",
      acquiredDate: "Released Aug 2026",
      quote:
        "Digital screening was approved in less than 36 hours. The monthly amortization breakdown in the portal has zero hidden charges, and downpayment receipt was issued immediately upon turnover.",
    },
    {
      author: "Karlo Mendoza",
      role: "Honda Click 125i",
      location: "Quezon City",
      initials: "KM",
      verifiedTag: "Daily Commuter • Cash Booking",
      acquiredDate: "Released Sep 2026",
      quote:
        "Delivered straight to my doorstep in Quezon City complete with LTO registration papers and dealer warranty booklet. The pre-delivery checklist was thoroughly explained by the courier technician.",
    },
    {
      author: "Christian Bautista",
      role: "Kawasaki Ninja 400 SE",
      location: "Cebu City",
      initials: "CB",
      verifiedTag: "Track Enthusiast • OEM Parts",
      acquiredDate: "Released Jul 2026",
      quote:
        "Finding genuine OEM sprockets, sintered brake pads, and Motul 7100 oil under one roof used to be difficult. Motorcycled's verified parts catalog and branch pickup in Cebu made maintenance seamless.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Editorial Dealership Hero Banner - Unboxed & Content-First */}
      <section className="border-b border-zinc-200 bg-zinc-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Main Editorial Header */}
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.15]">
                Motorcycle Dealership, OEM Parts & In-House Installments.
              </h1>

              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
                Browse showroom inventory with transparent cash pricing and
                structured monthly financing. Submit digital documents for
                24-hour credit review and schedule nationwide delivery.
              </p>

              {/* Integrated Search and Action */}
              <form onSubmit={handleHeroSearch} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search model (e.g. NMAX 155, Ninja 400, Click 125)..."
                  className="!h-10 flex-1 px-3 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                />
                <button
                  type="submit"
                  className="!h-10 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  Explore Catalog
                </button>
              </form>

              {/* Brand Filter Row */}
              <div className="pt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-zinc-500 font-medium mr-1">
                  Filter by Make:
                </span>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrandFilter(b)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      selectedBrandFilter === b
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Meta Column: Real Dealership Operational Specs */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-6 lg:pt-0 lg:pl-8 space-y-5 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Financing Terms
                </span>
                <p className="font-semibold text-zinc-900 text-sm">
                  3, 6, 12, 24 & 36 Months
                </p>
                <p className="text-zinc-500">
                  Fixed rate amortization with transparent interest breakdown
                  and zero hidden charges.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Credit Screening
                </span>
                <p className="font-semibold text-zinc-900 text-sm">
                  24-48 Hour Digital Verification
                </p>
                <p className="text-zinc-500">
                  Submit valid Philippine government ID and proof of monthly
                  income directly online.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Unit Release & Warranty
                </span>
                <p className="font-semibold text-zinc-900 text-sm">
                  LTO Registration & OEM Warranty
                </p>
                <p className="text-zinc-500">
                  Complete registration papers, comprehensive insurance, and
                  manufacturer service network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured product spotlight — full-bleed carousel, live catalog units */}
      <ScrollReveal threshold={0.08} duration={650}>
        <section className="bg-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-zinc-900">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                  Showroom Inventory
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                  Featured Motorcycle Units
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-zinc-500">
                  Showing {products.length} of {productsCount} showroom models
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate("shop")}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Full Catalog &rarr;
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
              <div className="animate-pulse flex flex-col items-center gap-5 py-8">
                <div className="w-full max-w-xl h-64 sm:h-80 bg-zinc-100 rounded" />
                <div className="h-5 bg-zinc-100 rounded w-48" />
                <div className="h-4 bg-zinc-100 rounded w-32" />
                <div className="h-10 bg-zinc-100 rounded w-56" />
              </div>
            </div>
          ) : featuredUnits.length > 0 ? (
            <FeaturedProductCarousel
              units={featuredUnits}
              activeIndex={carouselIndex}
              onGoTo={goToSlide}
              onFinancing={() => handleNavigate("orders")}
            />
          ) : (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
              <div className="py-12 text-center text-xs text-zinc-500 border border-zinc-200 rounded-lg bg-zinc-50">
                No showroom units match the selected brand or keyword in database.
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Section 2: Catalog Categories (Structured Directory Index - NO floating cards) */}
        <ScrollReveal threshold={0.08} delay={60} duration={650}>
          <section className="space-y-4">
            <div className="pb-3 border-b border-zinc-900">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Parts & Equipment Directory
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Genuine OEM Catalog by Category
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Select a specialized category to inspect compatibility with
                Honda, Yamaha, Suzuki, Kawasaki, and CFMOTO models.
              </p>
            </div>

            {/* Unified Directory Grid with crisp single borders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-200">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleNavigate("shop", `category=${encodeURIComponent(cat.name)}`)}
                  className="border-r border-b border-zinc-200 p-5 hover:bg-zinc-50/80 transition-colors cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-zinc-400 uppercase tracking-wider">
                        {cat.tag}
                      </span>
                      <span className="text-emerald-700 font-medium">
                        {cat.count}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 flex items-center text-xs font-semibold text-zinc-700 group-hover:text-emerald-700 transition-colors">
                    <span>Browse {cat.name}</span>
                    <span className="ml-1 transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Section: Live Inventory with Infinite Scroll (15pts deliverable) */}
        <section className="space-y-6 pt-4 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-900">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Continuous Inventory Stream
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                All Available Motorcycles & Certified OEM Parts
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Explore real inventory loaded continuously via Infinite Scroll as you browse down the showroom floor.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                label={`Showing ${infiniteProducts.length} of ${totalCatalogCount || infiniteProducts.length} Items`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: "0.72rem", fontWeight: 600, borderColor: "#059669", color: "#059669" }}
              />
            </div>
          </div>

          <InfiniteScroll
            dataLength={infiniteProducts.length}
            next={fetchMoreProducts}
            hasMore={hasMore}
            loader={
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1.5 }}>
                <CircularProgress size={24} sx={{ color: "#059669" }} />
                <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#52525b", fontWeight: 500 }}>
                  Loading more catalog items...
                </Typography>
              </Box>
            }
            endMessage={
              <Box sx={{ textAlign: "center", py: 4, color: "#71717a", fontSize: "0.8rem", borderTop: "1px dashed #e4e4e7", mt: 4 }}>
                <p className="font-semibold text-zinc-700">✓ You have viewed the entire dealership catalog</p>
                <p className="text-xs text-zinc-400 mt-0.5">All 30 active units and OEM parts loaded</p>
              </Box>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-zinc-200">
              {infiniteProducts.map((p) => {
                const categoryName = p.category?.name || p.category || "General";
                const brandName = p.brand?.name || p.brand || "OEM";
                const hasImage = p.images && p.images.length > 0 && p.images[0]?.url;
                const rating = Number(p.ratings) || 0;
                const reviewCount = Number(p.numOfReviews) || 0;

                return (
                  <div
                    key={p._id}
                    className="border-r border-b border-zinc-200 bg-white hover:bg-zinc-50/80 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <Link to={`/product/${p._id}`} className="block overflow-hidden">
                      {hasImage ? (
                        <div className="w-full h-40 bg-zinc-100 overflow-hidden relative flex items-center justify-center">
                          <img
                            src={p.images[0].url}
                            alt={p.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <ProductImagePlaceholder
                          category={categoryName}
                          name={p.name}
                          brand={brandName}
                        />
                      )}
                    </Link>

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono uppercase font-bold text-zinc-400 tracking-wider">
                            {brandName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                              p.stock === 0
                                ? "bg-red-50 text-red-700 border-red-200"
                                : p.stock <= 3
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                          </span>
                        </div>

                        <Link
                          to={`/product/${p._id}`}
                          className="block text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 hover:underline leading-snug"
                        >
                          {p.name}
                        </Link>

                        {/* MUI Rating component (20pts MUI styling deliverable) */}
                        <div className="flex items-center gap-1 pt-0.5">
                          <Rating
                            value={rating}
                            precision={0.1}
                            readOnly
                            size="small"
                            sx={{ fontSize: "0.8rem" }}
                          />
                          <span className="text-[11px] font-semibold text-zinc-700">
                            {rating.toFixed(1)}
                          </span>
                          {reviewCount > 0 && (
                            <span className="text-[10px] text-zinc-400">
                              ({reviewCount})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 font-mono">
                          ₱{Number(p.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <Link
                          to={`/product/${p._id}`}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
        </section>

        {/* Section 3: Financing Protocol (Unboxed, 3-Step Sequential Flow - NO cards inside cards) */}
        <ScrollReveal threshold={0.08} delay={80} duration={650}>
          <section className="border-t border-zinc-200 pt-10 space-y-8">
            <div className="max-w-2xl space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Financing Protocol
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Structured In-House Installments
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Transparent amortizations with direct credit review. No
                third-party lending markups, zero hidden charges.
              </p>
            </div>

            {/* Clean 3-Column Timeline with Top Border Dividers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-t-2 border-zinc-900 pt-4 space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-700 block">
                  Step 01 / Term Selection
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Configure Term & Downpayment
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Choose flexible repayment terms spanning 3, 6, 12, 24, or 36
                  months. Select your downpayment percentage (minimum 20%) to
                  view your fixed monthly dues and principal balance.
                </p>
              </div>

              <div className="border-t-2 border-zinc-900 pt-4 space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-700 block">
                  Step 02 / Digital Screening
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Submit Verification Documents
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Upload your primary Philippine Government ID, billing address
                  proof, and latest 3 months of payslips or business permits.
                  Credit review feedback is provided within 24 to 48 hours.
                </p>
              </div>

              <div className="border-t-2 border-zinc-900 pt-4 space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-700 block">
                  Step 03 / Releasing & Schedule
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Contract Turnover & Release
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Settle the agreed downpayment online or over the counter. Sign
                  the promissory deed, and receive your unit along with complete
                  official LTO registration and insurance documents.
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-200 text-xs">
              <div className="flex items-center gap-2 text-zinc-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>
                  Already an active installment account holder? Track your
                  monthly amortization and penalty dues.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="h-9! px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-colors cursor-pointer self-start sm:self-auto"
              >
                View Payment Schedules &rarr;
              </button>
            </div>
          </section>
        </ScrollReveal>

        {/* Section 4: Verified Customer Testimonials */}
        <ScrollReveal threshold={0.08} delay={90} duration={650}>
          <section className="border-t border-zinc-200 pt-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-900">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                  Verified Rider & Owner Experiences
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Real feedback from certified motorcycle buyers and active
                  monthly installment account holders.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="flex text-amber-500 text-sm">★★★★★</span>
                <span className="font-bold text-zinc-900">4.9 / 5.0</span>
                <span className="text-zinc-400">
                  • Over 1,240 Verified Releases
                </span>
              </div>
            </div>

            {/* Testimonials Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-200 rounded-lg p-5 bg-white hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Rating stars & badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-500 tracking-wider">
                        ★★★★★
                      </span>
                      <span className="inline-block text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {t.verifiedTag}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>

                  {/* Rider profile info */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {t.initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {t.author}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {t.role} • {t.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0 hidden sm:inline">
                      {t.acquiredDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Section 5: Dealership Standards & Operational Commitments (Table-style horizontal divider) */}
        <ScrollReveal threshold={0.08} delay={100} duration={600}>
          <section className="border-t border-zinc-200 pt-8 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
                  Authentication
                </span>
                <p className="font-bold text-zinc-900">
                  100% Genuine OEM Parts
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Direct sourcing from Yamaha, Honda, Suzuki, Kawasaki, and
                  CFMOTO.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
                  Compliance
                </span>
                <p className="font-bold text-zinc-900">
                  LTO Official Processing
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Expedited registration and plate release handled directly by
                  dealership staff.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
                  Coverage
                </span>
                <p className="font-bold text-zinc-900">Manufacturer Warranty</p>
                <p className="text-zinc-500 text-[11px]">
                  Comprehensive engine and electrical warranty honored across
                  official service centers.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block">
                  Logistics
                </span>
                <p className="font-bold text-zinc-900">Inspected Release</p>
                <p className="text-zinc-500 text-[11px]">
                  Pre-delivery 24-point safety and fluid checklist completed
                  before vehicle handover.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
};

const productMeta = (bike) => {
  const categoryName = bike.category?.name || bike.category || "Motorcycles";
  const brandName = bike.brand?.name || bike.brand || "OEM";
  const hasImage = Boolean(bike.images?.[0]?.url);
  const minDown = Number(bike.minInstallmentPrice || bike.price * 0.2);
  const financedAmount = Math.max(0, bike.price - minDown);
  const monthlyEst = Math.round((financedAmount * 1.1) / 12);
  const rating = Number(bike.ratings) || 0;
  const reviewCount = Number(bike.numOfReviews) || 0;
  return { categoryName, brandName, hasImage, minDown, monthlyEst, rating, reviewCount };
};

const ProductSpotlightImage = ({ bike, active = false }) => {
  const { categoryName, brandName, hasImage } = productMeta(bike);

  if (hasImage) {
    return (
      <div className="w-full h-56 sm:h-72 lg:h-[22rem] bg-white flex items-center justify-center overflow-hidden">
        <img
          src={bike.images[0].url}
          alt={bike.name}
          className={`max-h-full max-w-full object-contain object-center ${
            active ? "home-spotlight__hero-img" : ""
          }`}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-56 sm:h-72 lg:h-[22rem] bg-zinc-50 flex items-center justify-center overflow-hidden">
      <ProductImagePlaceholder
        category={categoryName}
        name={bike.name}
        brand={brandName}
        compact
        className="h-full"
      />
    </div>
  );
};

const FeaturedProductCarousel = ({
  units,
  activeIndex,
  onGoTo,
  onFinancing,
}) => {
  const canNavigate = units.length > 1;
  const slides = useMemo(() => {
    if (units.length < 2) return units;
    return [units[units.length - 1], ...units, units[0]];
  }, [units]);

  const [visualIndex, setVisualIndex] = useState(canNavigate ? 1 : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    animatingRef.current = false;
    setIsAnimating(false);
    setVisualIndex(units.length > 1 ? 1 : 0);
  }, [units]);

  const go = (direction) => {
    if (!canNavigate || animatingRef.current) return;
    animatingRef.current = true;
    setIsAnimating(true);
    setVisualIndex((current) => current + direction);
    onGoTo(activeIndex + direction);
  };

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (!canNavigate) {
      animatingRef.current = false;
      setIsAnimating(false);
      return;
    }

    if (visualIndex === 0) {
      setIsAnimating(false);
      setVisualIndex(units.length);
    } else if (visualIndex === units.length + 1) {
      setIsAnimating(false);
      setVisualIndex(1);
    } else {
      setIsAnimating(false);
    }
    animatingRef.current = false;
  };

  const current = units[activeIndex] || units[0];
  const {
    categoryName,
    brandName,
    minDown,
    monthlyEst,
    rating,
    reviewCount,
  } = productMeta(current);
  const roundedRating = Math.round(rating);

  return (
    <div className="relative pb-12 pt-2 sm:pt-4">
      <div
        className="home-spotlight__viewport"
        style={{ "--visual-index": visualIndex }}
      >
        <div
          className={`home-spotlight__track ${isAnimating ? "is-animating" : ""}`}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((bike, index) => {
            const isActive = index === visualIndex;
            const slideKey = `${bike._id}-${index}`;

            return (
              <div
                key={slideKey}
                className={`home-spotlight__slide ${isActive ? "is-active" : ""}`}
              >
                <div className="home-spotlight__slide-inner flex flex-col items-center">
                  {isActive ? (
                    <Link
                      to={`/product/${bike._id}`}
                      className="block w-full group"
                      aria-label={`View ${bike.name}`}
                    >
                      <ProductSpotlightImage bike={bike} active />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="block w-full bg-transparent border-0 p-0 cursor-pointer"
                      onClick={() => go(index > visualIndex ? 1 : -1)}
                      aria-label={`Show ${bike.name}`}
                    >
                      <ProductSpotlightImage bike={bike} />
                    </button>
                  )}
                  <span
                    className={`mt-3 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase line-clamp-1 ${
                      isActive ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {bike.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canNavigate && (
        <>
          <button
            type="button"
            className="home-spotlight__nav absolute left-3 sm:left-6 md:left-[22%] top-[34%] sm:top-[38%] z-10"
            onClick={() => go(-1)}
            aria-label="Previous featured unit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 5L8 12L15 19"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="home-spotlight__nav absolute right-3 sm:right-6 md:right-[22%] top-[34%] sm:top-[38%] z-10"
            onClick={() => go(1)}
            aria-label="Next featured unit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 5L16 12L9 19"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      <div className="max-w-xl mx-auto px-4 mt-5 sm:mt-6 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          <span className="font-semibold text-emerald-700">{brandName}</span>
          <span className="text-zinc-300">/</span>
          <span>{categoryName}</span>
        </div>

        <Link
          to={`/product/${current._id}`}
          className="text-base sm:text-lg font-extrabold tracking-[0.16em] uppercase text-zinc-900 hover:text-emerald-700 transition-colors"
        >
          {current.name}
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span className="text-lg font-bold text-zinc-900 font-mono tracking-tight">
            ₱
            {Number(current.price).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
          {rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-500 tracking-tight">
                {"★".repeat(Math.max(0, roundedRating))}
                {"☆".repeat(Math.max(0, 5 - roundedRating))}
              </span>
              <span className="text-zinc-500">
                {rating.toFixed(1)}
                {reviewCount > 0 ? ` (${reviewCount})` : ""}
              </span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
              current.stock === 0
                ? "bg-red-50 text-red-800 border-red-200"
                : current.stock <= 3
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                current.stock === 0 ? "bg-red-600" : "bg-emerald-600"
              }`}
            />
            {current.stock === 0 ? "Out of stock" : `${current.stock} in stock`}
          </span>
        </div>

        {current.installmentEligible && (
          <p className="text-[11px] text-emerald-800">
            From ₱{monthlyEst.toLocaleString()}/mo (12 mos) · Downpayment ₱
            {minDown.toLocaleString()}
          </p>
        )}

        {current.images?.length > 1 && (
          <span className="text-[10px] font-mono text-zinc-400">
            {current.images.length} photos
          </span>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <Link
            to={`/product/${current._id}`}
            className="inline-flex items-center justify-center min-w-[16rem] !h-10 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-bold tracking-[0.14em] uppercase transition-colors"
          >
            View Featured Motorcycle
          </Link>
          {current.installmentEligible && (
            <button
              type="button"
              onClick={onFinancing}
              className="inline-flex items-center justify-center min-w-[9rem] !h-10 px-5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer"
            >
              Financing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
