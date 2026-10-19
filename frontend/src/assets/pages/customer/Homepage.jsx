import { useState, useEffect, useMemo, useRef } from "react";
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
import { addToCart } from "../../../actions/cartActions";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API;

const financeSteps = [
  {
    title: "Configure repayment plan",
    desc: "Choose repayment terms spanning 3, 6, 12, 24, or 36 months. Select your downpayment percentage (minimum 20%) to view your fixed monthly dues and principal balance.",
  },
  {
    title: "Digital screening",
    desc: "Upload your primary Philippine Government ID, billing address proof, and latest 3 months of payslips or business permits. Credit review feedback is provided within 24 to 48 hours.",
  },
  {
    title: "Vehicle turnover",
    desc: "Settle the agreed downpayment online or over the counter. Sign the promissory deed, and receive your unit along with complete official LTO registration and insurance documents.",
  },
];

const testimonials = [
  {
    author: "Mark Anthony Ramos",
    role: "Yamaha NMAX 155 ABS",
    location: "Pasig City",
    initials: "MR",
    verifiedTag: "Verified Owner, 12-Month Financing",
    acquiredDate: "Released Aug 2026",
    quote:
      "Digital screening was approved in less than 36 hours. The monthly amortization breakdown in the portal has zero hidden charges, and downpayment receipt was issued immediately upon turnover.",
  },
  {
    author: "Karlo Mendoza",
    role: "Honda Click 125i",
    location: "Quezon City",
    initials: "KM",
    verifiedTag: "Daily Commuter, Cash Booking",
    acquiredDate: "Released Sep 2026",
    quote:
      "Delivered straight to my doorstep in Quezon City complete with LTO registration papers and dealer warranty booklet. The pre-delivery checklist was thoroughly explained by the courier technician.",
  },
  {
    author: "Christian Bautista",
    role: "Kawasaki Ninja 400 SE",
    location: "Cebu City",
    initials: "CB",
    verifiedTag: "Track Enthusiast, OEM Parts",
    acquiredDate: "Released Jul 2026",
    quote:
      "Finding genuine OEM sprockets, sintered brake pads, and Motul 7100 oil under one roof used to be difficult. Motorcycled's verified parts catalog and branch pickup in Cebu made maintenance straightforward.",
  },
];

export const Homepage = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("All");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { cartItems = [] } = useSelector((state) => state.cart || {});

  // Infinite Scroll State (15pts deliverable via react-infinite-scroll-component)
  const [infiniteProducts, setInfiniteProducts] = useState([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);
  const [liveBrands, setLiveBrands] = useState([]);

  // Financing timeline: reveal once when scrolled into view
  const financeTimelineRef = useRef(null);
  const [financeTimelineIn, setFinanceTimelineIn] = useState(
    () => typeof window === "undefined" || !("IntersectionObserver" in window)
  );

  useEffect(() => {
    const node = financeTimelineRef.current;
    if (
      !node ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFinanceTimelineIn(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Reviews: staggered reveal once when scrolled into view
  const reviewsRef = useRef(null);
  const [reviewsIn, setReviewsIn] = useState(
    () => typeof window === "undefined" || !("IntersectionObserver" in window)
  );

  useEffect(() => {
    const node = reviewsRef.current;
    if (
      !node ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setReviewsIn(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Reviews spotlight: cycle one owner quote at a time, looping continuously
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewPaused, setReviewPaused] = useState(false);

  useEffect(() => {
    if (!reviewsIn || reviewPaused || testimonials.length <= 1) {
      return;
    }
    if (
      typeof window === "undefined" ||
      !window.matchMedia ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = setInterval(() => {
      setReviewIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reviewsIn, reviewPaused]);

  // Fetch live brands with logos from MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${API}/brands`);
        if (isMounted && res.data && res.data.brands) {
          setLiveBrands(res.data.brands);
        }
      } catch (err) {
        console.warn("Could not load dynamic brands:", err);
      }
    };
    fetchBrands();
    return () => {
      isMounted = false;
    };
  }, []);

  // Select live products from database via Redux
  const { loading, products = [], productsCount = 0 } = useSelector(
    (state) => state.products || {}
  );

  // Fetch live featured units for hero carousel on mount and filter changes
  useEffect(() => {
    dispatch(
      getProducts(
        1,
        searchQuery,
        [0, 9999999],
        "",
        selectedBrandFilter === "All" ? "" : selectedBrandFilter,
        false,
        0,
        12,
        false,
        true // isFeatured: only fetch featured showroom models
      )
    );
  }, [dispatch, searchQuery, selectedBrandFilter]);

  // Initial fetch for Infinite Scroll products catalog
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const res = await axios.get(`${API}/products?page=1&limit=8`);
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
      const res = await axios.get(`${API}/products?page=${nextPage}&limit=8`);
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

  const handleAddToCart = async (product) => {
    const inCart = (cartItems || [])
      .filter((i) => i.productId === product._id)
      .reduce((sum, i) => sum + (i.quantity || 1), 0);

    if (inCart >= product.stock) {
      toast.warning(
        `Stock limit reached! You already have all ${product.stock} units of "${product.name}" in your cart.`
      );
      return;
    }

    const result = await dispatch(addToCart(product._id, 1));
    if (result && result.success === false) {
      toast.warning(result.message || `Cannot add "${product.name}": Stock limit reached!`);
    } else {
      toast.success(`Added "${product.name}" to cart!`);
    }
  };

  const featuredUnits = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured && !p.isArchived);
    if (featured.length > 0) return featured;
    return products.filter((p) => !p.isArchived).slice(0, 8);
  }, [products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCarouselIndex(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedBrandFilter, searchQuery]);

  useEffect(() => {
    if (featuredUnits.length > 0 && carouselIndex >= featuredUnits.length) {
      const timer = setTimeout(() => {
        setCarouselIndex(0);
      }, 0);
      return () => clearTimeout(timer);
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
    },
    {
      name: "Engine Parts",
      desc: "Genuine cylinder blocks, forged pistons, valves, drive belts & CVT clutch assemblies",
    },
    {
      name: "Brakes",
      desc: "Hydraulic disc calipers, sintered brake pads, master cylinders & rear shock absorbers",
    },
    {
      name: "Tires and Wheels",
      desc: "High-grip tubeless compound tires, cast alloy rims, tire valves & tubes",
    },
    {
      name: "Helmets",
      desc: "ECE 22.06 & DOT certified full-face helmets, armored jackets & riding gloves",
    },
    {
      name: "Lubricants",
      desc: "Full synthetic 4-stroke engine oils, gear lubricants, coolant & chain care products",
    },
  ];

  const brands = useMemo(() => {
    if (liveBrands && liveBrands.length > 0) {
      return ["All", ...liveBrands.map((b) => b.name)];
    }
    return ["All", "Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];
  }, [liveBrands]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Cinematic Full-Bleed Motorcycle Hero */}
      <section
        style={{ marginTop: "calc(-1 * var(--nav-h, 56px))" }}
        className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center bg-zinc-950 overflow-hidden"
      >
        {/* Full-bleed background motorcycle video with fallback poster & subtle settle on load */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero-video-poster.jpg?v=2"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none anim-settle"
        >
          <source src="/videos/hero-video.mp4?v=2" type="video/mp4" />
          <img
            src="/hero-video-poster.jpg?v=2"
            alt="Motorcycled showroom unit"
            className="w-full h-full object-cover select-none"
          />
        </video>
        {/* Flat dark overlay for text contrast and legibility without gradients */}
        <div className="absolute inset-0 bg-zinc-950/75 sm:bg-zinc-950/65" />

        <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-2xl anim-stagger">
            {/* Brand line */}
            <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase mb-2">
              Motorcycled Dealership
            </p>

            {/* Heavy condensed headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.98] mb-5 font-['Bebas_Neue',Impact,sans-serif]">
              Built for the open road.
            </h1>

            {/* Direct, restrained supporting copy */}
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed mb-6 max-w-md">
              New motorcycles, genuine parts, and financing that fits.
            </p>

            {/* Integrated Hero Search Bar */}
            <form onSubmit={handleHeroSearch} className="mb-6 flex flex-col sm:flex-row items-stretch gap-2 max-w-xl">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search model (e.g. NMAX 155, Ninja 400, Click 125)..."
                  className="!h-11 w-full pl-10 pr-3.5 text-sm text-white bg-zinc-900/90 border border-zinc-700/80 rounded placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="!h-11 px-5 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap btn-motion"
              >
                Search Catalog
              </button>
            </form>

            {/* Dual action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("shop")}
                className="h-11 px-6 rounded bg-transparent hover:bg-white/10 active:bg-white/20 border border-white/40 hover:border-white text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 btn-motion"
              >
                <span>Explore motorcycles</span>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Logo Loop Marquee - Dynamic from Database */}
      {liveBrands.length > 0 && (
        <section className="bg-zinc-950 border-b border-zinc-800/80 py-5 overflow-hidden relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-medium">
              Authorized Dealership & Certified OEM Brands
            </span>
            <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline-block">
              {liveBrands.length} Verified Makes
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            {/* Edge gradient masks for seamless visual fade */}
            <div className="absolute left-0 inset-y-0 w-16 sm:w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-16 sm:w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

            <div className="marquee-track flex items-center gap-12 sm:gap-16">
              {[...liveBrands, ...liveBrands].map((b, idx) => (
                <button
                  key={`${b._id || b.name}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedBrandFilter(b.name);
                    handleNavigate("shop", `brand=${encodeURIComponent(b.name)}`);
                  }}
                  className="shrink-0 flex items-center justify-center gap-2.5 px-4 py-1.5 cursor-pointer group transition-transform hover:scale-105"
                  title={`Browse ${b.name} inventory`}
                >
                  {b.logo?.url ? (
                    <img
                      src={b.logo.url}
                      alt={b.name}
                      className="h-7 sm:h-9 w-auto max-w-[130px] object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-400 transition-colors">
                      {b.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured product spotlight - full-bleed carousel, live catalog units */}
      <ScrollReveal threshold={0.08} duration={400}>
        <section className="w-full bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-zinc-900">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                  Featured motorcycles
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-zinc-500">
                  Showing {featuredUnits.length} showroom model{featuredUnits.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate("shop")}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Full catalog &rarr;
                </button>
              </div>
            </div>

            {/* Showroom Filters: Brand chips and quick model search */}
            <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-500 font-medium mr-1">
                  Filter by make:
                </span>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrandFilter(b)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      selectedBrandFilter === b
                        ? "bg-emerald-700 text-white font-semibold"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              <form onSubmit={handleHeroSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter model..."
                  className="!h-8 px-2.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded focus:outline-none focus:border-emerald-700"
                />
                <button
                  type="submit"
                  className="!h-8 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                >
                  Search
                </button>
              </form>
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
              <div className="py-12 text-center text-xs text-zinc-500 border border-zinc-200 rounded bg-zinc-50">
                No showroom units match the selected brand or keyword in database.
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Section 2: Catalog Categories (Structured Directory Index - NO floating cards) */}
        <ScrollReveal threshold={0.08} delay={60} duration={400}>
          <section className="w-full bg-zinc-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-4">
            <div className="pb-3 border-b border-zinc-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Parts and gear by category
              </h2>
            </div>

            {/* Unified Directory Grid with crisp single borders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-700">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleNavigate("shop", `category=${encodeURIComponent(cat.name)}`)}
                  className="bg-zinc-800 border-r border-b border-zinc-700 p-5 hover:bg-zinc-700 transition-colors cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 flex items-center text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    <span>Browse {cat.name}</span>
                    <span className="ml-1 transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Section: Live Inventory with Infinite Scroll (white band) */}
        <ScrollReveal threshold={0.08} delay={70} duration={400}>
          <section className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-900">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Available motorcycles and parts
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                label={`Showing ${infiniteProducts.length} of ${totalCatalogCount || infiniteProducts.length} Items`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: "0.72rem", fontWeight: 600, borderColor: "#047857", color: "#047857" }}
              />
            </div>
          </div>

          <InfiniteScroll
            dataLength={infiniteProducts.length}
            next={fetchMoreProducts}
            hasMore={hasMore}
            loader={
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1.5 }}>
                <CircularProgress size={24} sx={{ color: "#047857" }} />
                <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#52525b", fontWeight: 500 }}>
                  Loading more catalog items...
                </Typography>
              </Box>
            }
            endMessage={
              <Box sx={{ textAlign: "center", py: 4, color: "#71717a", fontSize: "0.8rem", borderTop: "1px dashed #e4e4e7", mt: 4 }}>
                <p className="font-semibold text-zinc-700 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>End of catalog</span>
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">All available units and parts loaded</p>
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
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${p.stock === 0
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

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-900 font-mono">
                          ₱{Number(p.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={p.stock === 0}
                            onClick={() => handleAddToCart(p)}
                            className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            {p.stock === 0 ? "Out" : "+ Cart"}
                          </button>
                          <Link
                            to={`/product/${p._id}`}
                            className="text-[11px] font-semibold text-zinc-600 hover:text-emerald-700 hover:underline"
                          >
                            View &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
          </div>
          </section>
        </ScrollReveal>

        {/* Section 3: Financing Protocol (dark band) */}
        <ScrollReveal threshold={0.08} delay={80} duration={400}>
          <section className="w-full bg-zinc-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
            <div className="max-w-2xl space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How in-house installments work
              </h2>
            </div>

            {/* Vertical timeline: numbered nodes on a connector line */}
            <div
              ref={financeTimelineRef}
              className={`timeline max-w-2xl ${financeTimelineIn ? "is-in" : ""}`}
            >
              {financeSteps.map((step, i) => (
                <div
                  key={step.title}
                  className="timeline__step relative flex gap-5 pb-8 last:pb-0"
                >
                  <span
                    className="timeline__node relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950"
                    style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: "1.125rem",
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < financeSteps.length - 1 && (
                    <span
                      className="timeline__connector absolute top-10 bottom-0 left-5 w-0.5 bg-zinc-700"
                      aria-hidden="true"
                    />
                  )}
                  <div className="pt-1">
                    <h3 className="text-sm font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-md text-xs text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-700 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>
                  Already an active installment account holder? Track your
                  monthly amortization and penalty dues.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="h-9! px-4 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium transition-colors cursor-pointer self-start sm:self-auto"
              >
                View payment schedules &rarr;
              </button>
            </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Section 4: Verified Customer Testimonials (white band) */}
        <ScrollReveal threshold={0.08} delay={90} duration={650}>
          <section className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6">
            <div className="pb-3 border-b border-zinc-900">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Verified owner experiences
              </h2>
            </div>

            {/* Reviews: looping spotlight, one owner quote at a time */}
            <div
              ref={reviewsRef}
              className={`reviews ${reviewsIn ? "is-in" : ""}`}
              onMouseEnter={() => setReviewPaused(true)}
              onMouseLeave={() => setReviewPaused(false)}
              onFocus={() => setReviewPaused(true)}
              onBlur={() => setReviewPaused(false)}
            >
              <div className="reviews__stage">
                {testimonials.map((t, idx) => (
                  <figure
                    key={idx}
                    className={`reviews__slide ${
                      idx === reviewIndex ? "is-active" : ""
                    }`}
                    aria-hidden={idx !== reviewIndex}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute top-4 right-6 text-7xl leading-none font-serif text-emerald-500/15"
                    >
                      &rdquo;
                    </span>

                    {/* Rating stars & badge */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
                      </div>
                      <span className="inline-block text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {t.verifiedTag}
                      </span>
                    </div>

                    <blockquote className="text-base sm:text-xl text-zinc-800 leading-relaxed">
                      {t.quote}
                    </blockquote>

                    {/* Rider profile info */}
                    <figcaption className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {t.initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {t.author}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {t.role}, {t.location}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0 hidden sm:inline">
                        {t.acquiredDate}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>

              {/* Spotlight indicator */}
              <div className="reviews__dots">
                {testimonials.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Show review ${idx + 1} of ${testimonials.length}`}
                    aria-current={idx === reviewIndex}
                    className={`reviews__dot ${
                      idx === reviewIndex ? "is-active" : ""
                    }`}
                    onClick={() => setReviewIndex(idx)}
                  />
                ))}
              </div>
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
          className={`max-h-full max-w-full object-contain object-center ${active ? "home-spotlight__hero-img" : ""
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
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setVisualIndex(units.length > 1 ? 1 : 0);
    }, 0);
    return () => clearTimeout(timer);
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
                    className={`mt-3 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase line-clamp-1 ${isActive ? "text-zinc-900" : "text-zinc-400"
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
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          {current.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
              ★ Featured Showroom Unit
            </span>
          )}
          <span className="font-semibold text-emerald-700">{brandName}</span>
          <span className="text-zinc-300">-</span>
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
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3 h-3 ${i < roundedRating ? "text-amber-500 fill-amber-500" : "text-zinc-200 fill-zinc-200"}`}
                    viewBox="0 0 24 24"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="text-zinc-500">
                {rating.toFixed(1)}
                {reviewCount > 0 ? ` (${reviewCount})` : ""}
              </span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${current.stock === 0
              ? "bg-red-50 text-red-800 border-red-200"
              : current.stock <= 3
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${current.stock === 0 ? "bg-red-600" : "bg-emerald-700"
                }`}
            />
            {current.stock === 0 ? "Out of stock" : `${current.stock} in stock`}
          </span>
        </div>

        {current.installmentEligible && (
          <p className="text-[11px] text-emerald-800">
            From ₱{monthlyEst.toLocaleString()} per month (12 months), downpayment ₱
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
            className="inline-flex items-center justify-center min-w-[16rem] !h-10 px-6 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-bold tracking-[0.14em] uppercase transition-colors"
          >
            View motorcycle
          </Link>
          {current.installmentEligible && (
            <button
              type="button"
              onClick={onFinancing}
              className="inline-flex items-center justify-center min-w-[9rem] !h-10 px-5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer"
            >
              Financing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
