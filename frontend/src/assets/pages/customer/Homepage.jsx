import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { getProducts } from "../../../actions/productActions";

export const Homepage = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("All");

  // Select live products from database via Redux
  const { loading, products = [], productsCount = 0 } = useSelector(
    (state) => state.products || {}
  );

  // Fetch live catalog units on mount and filter changes
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Section 1: Featured Showroom Inventory (Structured Directory / Table - NO floating card slop) */}
        <ScrollReveal threshold={0.08} duration={650}>
          <section className="space-y-4">
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

            {/* Featured Motorcycle Cards Grid with Real Database Products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-zinc-200 rounded-lg p-4 bg-white animate-pulse space-y-3"
                  >
                    <div className="w-full h-44 bg-zinc-100 rounded" />
                    <div className="h-4 bg-zinc-100 rounded w-2/3" />
                    <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    <div className="h-6 bg-zinc-100 rounded w-1/3" />
                  </div>
                ))
              ) : products.length > 0 ? (
                products.slice(0, 8).map((bike) => {
                  const categoryName = bike.category?.name || bike.category || "Motorcycles";
                  const brandName = bike.brand?.name || bike.brand || "OEM";
                  const hasImage = bike.images && bike.images.length > 0 && bike.images[0]?.url;
                  const minDown = Number(bike.minInstallmentPrice || bike.price * 0.2);
                  const financedAmount = Math.max(0, bike.price - minDown);
                  const monthlyEst = Math.round((financedAmount * 1.1) / 12);

                  return (
                    <div
                      key={bike._id}
                      className="border border-zinc-200 rounded-lg bg-white hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Image: Real Cloudinary image or technical placeholder */}
                      <Link to={`/product/${bike._id}`} className="block overflow-hidden">
                        {hasImage ? (
                          <div className="w-full h-44 bg-zinc-100 overflow-hidden relative border-b border-zinc-100 flex items-center justify-center">
                            <img
                              src={bike.images[0].url}
                              alt={bike.name}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                            />
                            {bike.images.length > 1 && (
                              <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                +{bike.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <ProductImagePlaceholder
                            category={categoryName}
                            name={bike.name}
                            brand={brandName}
                          />
                        )}
                      </Link>

                      {/* Card Content */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                              {brandName}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                bike.stock === 0
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : bike.stock <= 3
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  bike.stock === 0 ? "bg-red-600" : "bg-emerald-600"
                                }`}
                              />
                              {bike.stock === 0 ? "Out of stock" : `${bike.stock} in stock`}
                            </span>
                          </div>

                          <Link
                            to={`/product/${bike._id}`}
                            className="block text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 hover:underline"
                          >
                            {bike.name}
                          </Link>

                          {bike.compatibleModels && bike.compatibleModels.length > 0 && (
                            <p className="text-[11px] text-zinc-500 font-mono line-clamp-1">
                              Fit: {bike.compatibleModels.join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-zinc-100 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-bold text-zinc-900 font-mono">
                              ₱
                              {Number(bike.price).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {categoryName}
                            </span>
                          </div>

                          {bike.installmentEligible && (
                            <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/60 border border-emerald-200/60 px-2 py-1 rounded space-y-0.5">
                              <span className="block font-semibold">
                                ₱{monthlyEst.toLocaleString()}/mo (12 mos)
                              </span>
                              <span className="block text-[10px] text-zinc-500">
                                Downpayment from ₱{minDown.toLocaleString()}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleNavigate("shop", `keyword=${encodeURIComponent(bike.name)}`)}
                              className="flex-1 !h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                            {bike.installmentEligible && (
                              <button
                                type="button"
                                onClick={() => handleNavigate("orders")}
                                className="flex-1 !h-8 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                              >
                                Financing
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-xs text-zinc-500 border border-zinc-200 rounded-lg bg-zinc-50">
                  No showroom units match the selected brand or keyword in database.
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

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
