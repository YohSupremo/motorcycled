import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";

export const Shop = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [onlyInstallment, setOnlyInstallment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [addedNotice, setAddedNotice] = useState("");

  const categories = [
    "All",
    "Motorcycles",
    "Engine Parts",
    "Brakes",
    "Tires and Wheels",
    "Helmets",
    "Riding Gear",
    "Lubricants",
  ];

  const brands = ["All", "Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];

  const products = [
    {
      id: 1,
      name: "Yamaha NMAX 155 ABS",
      category: "Motorcycles",
      brand: "Yamaha",
      compatibleModels: ["NMAX 155 V1", "NMAX 155 V2"],
      price: 151900,
      stock: 4,
      installmentEligible: true,
      minDownpayment: 30380,
      monthlyEstimate: "₱11,340/mo (12 mos)",
    },
    {
      id: 2,
      name: "Honda Click 125i (CBS)",
      category: "Motorcycles",
      brand: "Honda",
      compatibleModels: ["Click 125 V2", "Click 125 V3"],
      price: 81400,
      stock: 7,
      installmentEligible: true,
      minDownpayment: 16280,
      monthlyEstimate: "₱6,120/mo (12 mos)",
    },
    {
      id: 3,
      name: "Kawasaki Ninja 400 SE",
      category: "Motorcycles",
      brand: "Kawasaki",
      compatibleModels: ["Ninja 400", "Z400"],
      price: 340900,
      stock: 2,
      installmentEligible: true,
      minDownpayment: 68180,
      monthlyEstimate: "₱18,200/mo (24 mos)",
    },
    {
      id: 4,
      name: "CFMOTO 450SR Sport",
      category: "Motorcycles",
      brand: "CFMOTO",
      compatibleModels: ["450SR"],
      price: 299900,
      stock: 3,
      installmentEligible: true,
      minDownpayment: 59980,
      monthlyEstimate: "₱16,400/mo (24 mos)",
    },
    {
      id: 5,
      name: "Yamalube 4T Full Synthetic 10W-40 (1 Liter)",
      category: "Lubricants",
      brand: "Yamaha",
      compatibleModels: [
        "Yamaha Mio",
        "Yamaha NMAX",
        "Yamaha Aerox",
        "Universal 4T",
      ],
      price: 450,
      stock: 35,
      installmentEligible: false,
    },
    {
      id: 6,
      name: "Honda Genuine High-Performance Brake Pads",
      category: "Brakes",
      brand: "Honda",
      compatibleModels: ["Honda Click 125", "Honda Click 150", "Honda ADV 150"],
      price: 680,
      stock: 14,
      installmentEligible: false,
    },
    {
      id: 7,
      name: "HJC RPHA 11 Full-Face Helmet (Matte Black)",
      category: "Helmets",
      brand: "Kawasaki",
      compatibleModels: ["Universal Rider Gear"],
      price: 18500,
      stock: 5,
      installmentEligible: true,
      minDownpayment: 3700,
      monthlyEstimate: "₱2,650/mo (6 mos)",
    },
    {
      id: 8,
      name: "Pirelli Angel Scooter Tire 130/70-13",
      category: "Tires and Wheels",
      brand: "Yamaha",
      compatibleModels: ["Yamaha NMAX 155", "Honda PCX 160"],
      price: 3100,
      stock: 12,
      installmentEligible: false,
    },
    {
      id: 9,
      name: "Koso High-Angle Performance Camshaft",
      category: "Engine Parts",
      brand: "Yamaha",
      compatibleModels: ["Yamaha NMAX 155", "Yamaha Aerox 155"],
      price: 2850,
      stock: 8,
      installmentEligible: false,
    },
  ];

  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory)
      return false;
    if (selectedBrand !== "All" && p.brand !== selectedBrand) return false;
    if (onlyInstallment && !p.installmentEligible) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchModel = p.compatibleModels.some((m) =>
        m.toLowerCase().includes(q),
      );
      if (!matchName && !matchModel) return false;
    }
    return true;
  });

  const handleAddToCart = (product) => {
    setCartItemsCount((prev) => prev + 1);
    setAddedNotice(`Added "${product.name}" to cart`);
    setTimeout(() => setAddedNotice(""), 2200);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header & Cart Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Motorcycles, Parts & Accessories
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Brand-new showroom motorcycle units, certified OEM replacement
              parts, and rider safety equipment with model-specific
              compatibility.
            </p>
          </div>

          {addedNotice && (
            <div className="flex items-center">
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md animate-fade-in-subtle">
                ✓ {addedNotice}
              </span>
            </div>
          )}
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, model, spec..."
                className="w-full !h-9 px-3 text-xs text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Category Filter */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Category
                </label>
                {selectedCategory !== "All" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
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
                    onClick={() => setSelectedBrand("All")}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrand(b)}
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
                  onChange={(e) => setOnlyInstallment(e.target.checked)}
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
              searchQuery) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedBrand("All");
                    setOnlyInstallment(false);
                    setSearchQuery("");
                  }}
                  className="w-full !h-8 rounded border border-zinc-300 text-xs text-zinc-700 font-medium hover:bg-zinc-50 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </aside>

          {/* Right Catalog Main Area */}
          <div className="lg:col-span-3 space-y-4">
            <ScrollReveal threshold={0.05} duration={600}>
              {/* View Bar & Metrics */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 text-xs">
                <span className="text-zinc-600">
                  Displaying <strong>{filteredProducts.length}</strong> items in
                  catalog
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

              {filteredProducts.length === 0 ? (
                <div className="border border-zinc-200 rounded-md p-12 text-center space-y-2 bg-zinc-50/50">
                  <p className="text-sm font-semibold text-zinc-800">
                    No matching products found
                  </p>
                  <p className="text-xs text-zinc-500">
                    Try adjusting your category, manufacturer filter, or search
                    keywords.
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                /* Architectural Grid - Shared single 1px borders, ZERO floating cards, ZERO drop shadows */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-200">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="border-r border-b border-zinc-200 bg-white hover:bg-zinc-50/70 transition-colors flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Automotive Technical Product Image Placeholder */}
                      <ProductImagePlaceholder
                        category={p.category}
                        name={p.name}
                        brand={p.brand}
                      />

                      <div className="p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                              {p.brand}
                            </span>
                            <span
                              className={`font-medium px-1.5 py-0.5 rounded text-[10px] border ${
                                p.stock <= 3
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {p.stock} in stock
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700 transition-colors">
                            {p.name}
                          </h3>

                          <p className="text-[11px] text-zinc-500 line-clamp-2">
                            Compatible: {p.compatibleModels.join(", ")}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-zinc-100 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-bold text-zinc-900 font-mono">
                              ₱
                              {p.price.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {p.category}
                            </span>
                          </div>

                          {p.installmentEligible && (
                            <div className="text-[11px] text-emerald-700 font-medium bg-emerald-50/60 border border-emerald-200/60 px-2 py-1 rounded">
                              Financing: {p.monthlyEstimate}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p)}
                              className="flex-1 !h-8 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer"
                            >
                              Add to cart
                            </button>
                            {p.installmentEligible && (
                              <button
                                type="button"
                                onClick={() => onNavigate("orders")}
                                className="!h-8 px-2.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Financing
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                            Category & Brand
                          </th>
                          <th className="py-3 px-3.5 hidden lg:table-cell">
                            Compatibility
                          </th>
                          <th className="py-3 px-3.5 text-center">Stock</th>
                          <th className="py-3 px-3.5 font-mono">Price (PHP)</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {filteredProducts.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-zinc-50/70 transition-colors"
                          >
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
                                  <ProductImagePlaceholder
                                    category={p.category}
                                    name={p.name}
                                    brand={p.brand}
                                    compact
                                  />
                                </div>
                                <div>
                                  <span className="font-semibold text-zinc-900 block">
                                    {p.name}
                                  </span>
                                  {p.installmentEligible && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      Installment: {p.monthlyEstimate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 hidden md:table-cell">
                              <span className="text-zinc-800">
                                {p.category}
                              </span>
                              <span className="block text-[10px] text-zinc-400 font-mono">
                                {p.brand}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 hidden lg:table-cell text-zinc-500 text-[11px]">
                              {p.compatibleModels.join(", ")}
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  p.stock <= 3
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                }`}
                              >
                                {p.stock} units
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                              ₱
                              {p.price.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className="!h-7 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer transition-colors"
                              >
                                Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </main>
    </div>
  );
};
