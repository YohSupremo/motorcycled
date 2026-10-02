import { useState } from "react";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";

export const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Initial products dataset conforming to 4.4 schema
  const [products, setProducts] = useState([
    {
      id: "PRD-YAM-01",
      name: "Yamaha NMAX 155 ABS",
      description: "Liquid-cooled 4-stroke 155cc single cylinder with Variable Valve Actuation (VVA) and dual-channel ABS.",
      category: "Motorcycles",
      brand: "Yamaha",
      compatibleModels: ["NMAX 155 V1", "NMAX 155 V2 Connected"],
      price: 151900,
      stock: 8,
      lowStockThreshold: 3,
      installmentEligible: true,
      minInstallmentPrice: 30000,
      eligiblePlans: ["3 Mo", "6 Mo", "12 Mo", "24 Mo", "36 Mo"],
      isArchived: false,
    },
    {
      id: "PRD-HON-01",
      name: "Honda Click 125i (2026)",
      description: "eSP enhanced Smart Power liquid-cooled engine, full digital meter panel, LED headlight, and Combi-Brake.",
      category: "Motorcycles",
      brand: "Honda",
      compatibleModels: ["Click 125i V1", "Click 125i V2", "Click 125i V3"],
      price: 81400,
      stock: 12,
      lowStockThreshold: 4,
      installmentEligible: true,
      minInstallmentPrice: 20000,
      eligiblePlans: ["6 Mo", "12 Mo", "24 Mo", "36 Mo"],
      isArchived: false,
    },
    {
      id: "PRD-KAW-01",
      name: "Kawasaki Ninja 400 SE",
      description: "High-performance 399cc parallel-twin engine, assist & slipper clutch, lightweight trellis frame.",
      category: "Motorcycles",
      brand: "Kawasaki",
      compatibleModels: ["Ninja 400 2020-2026", "Z400"],
      price: 340900,
      stock: 2,
      lowStockThreshold: 3, // LOW STOCK!
      installmentEligible: true,
      minInstallmentPrice: 60000,
      eligiblePlans: ["12 Mo", "24 Mo", "36 Mo"],
      isArchived: false,
    },
    {
      id: "PRD-CFM-01",
      name: "CFMOTO 450SR S Sport",
      description: "449.5cc parallel twin with 270-degree crankshaft, Brembo M40 calipers, aerodynamic winglets.",
      category: "Motorcycles",
      brand: "CFMOTO",
      compatibleModels: ["CFMOTO 450SR", "450NK"],
      price: 328800,
      stock: 4,
      lowStockThreshold: 2,
      installmentEligible: true,
      minInstallmentPrice: 55000,
      eligiblePlans: ["12 Mo", "24 Mo", "36 Mo"],
      isArchived: false,
    },
    {
      id: "PRD-ENG-02",
      name: "Yamaha Genuine VVA Camshaft Assembly",
      description: "OEM hardened steel high-lift intake cam and roller rocker arm set.",
      category: "Engine Parts",
      brand: "Yamaha",
      compatibleModels: ["NMAX 155", "Aerox 155", "WR155R"],
      price: 3850,
      stock: 18,
      lowStockThreshold: 5,
      installmentEligible: false,
      minInstallmentPrice: 0,
      eligiblePlans: [],
      isArchived: false,
    },
    {
      id: "PRD-BRK-01",
      name: "Brembo 4-Piston Caliper + Sintered Pads",
      description: "Radial axial mount 32/34mm opposed pistons with pre-installed sintered metallic pads.",
      category: "Brakes",
      brand: "Honda",
      compatibleModels: ["Universal 100mm Radial Mount", "Click 150", "ADV 160"],
      price: 8400,
      stock: 11,
      lowStockThreshold: 4,
      installmentEligible: false,
      minInstallmentPrice: 0,
      eligiblePlans: [],
      isArchived: false,
    },
    {
      id: "PRD-LUB-01",
      name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
      description: "100% synthetic Ester technology 4-stroke lubricant meeting API SP and JASO MA2 specifications.",
      category: "Lubricants",
      brand: "Yamaha",
      compatibleModels: ["Universal 4-Stroke Motorcycles & Scooters"],
      price: 780,
      stock: 4, // LOW STOCK!
      lowStockThreshold: 6,
      installmentEligible: false,
      minInstallmentPrice: 0,
      eligiblePlans: [],
      isArchived: false,
    },
  ]);

  const categories = [
    "All",
    "Motorcycles",
    "Engine Parts",
    "Brakes",
    "Tires & Wheels",
    "Helmets",
    "Lubricants",
  ];

  const brands = ["All", "Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (selectedBrand !== "All" && p.brand !== selectedBrand) return false;
    if (onlyLowStock && p.stock > p.lowStockThreshold) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchModels = p.compatibleModels.some((m) => m.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchModels) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: "",
      description: "",
      category: "Motorcycles",
      brand: "Honda",
      compatibleModels: "",
      price: "",
      stock: "",
      lowStockThreshold: 5,
      installmentEligible: false,
      minInstallmentPrice: 20000,
      eligiblePlans: ["12 Mo", "24 Mo"],
      isArchived: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct({
      ...p,
      compatibleModels: p.compatibleModels.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const formatted = {
      ...editingProduct,
      price: Number(editingProduct.price),
      stock: Number(editingProduct.stock),
      lowStockThreshold: Number(editingProduct.lowStockThreshold),
      minInstallmentPrice: Number(editingProduct.minInstallmentPrice || 0),
      compatibleModels: typeof editingProduct.compatibleModels === "string"
        ? editingProduct.compatibleModels.split(",").map((s) => s.trim()).filter(Boolean)
        : editingProduct.compatibleModels,
    };

    setProducts((prev) => {
      const exists = prev.some((x) => x.id === formatted.id);
      if (exists) {
        return prev.map((x) => (x.id === formatted.id ? formatted : x));
      }
      return [formatted, ...prev];
    });

    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleToggleArchive = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived } : p))
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Catalog & Inventory Units
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage showroom motorcycles, OEM parts, and stock thresholds (<code className="font-mono text-zinc-600">products</code> catalog).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 !h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Flat Filter Toolbar (NO CARDS) */}
      <div className="py-3 border-y border-zinc-200 bg-white px-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Search Products</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, model or SKU..."
              className="w-full !h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-none focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full !h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded-none focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Brand / Make</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full !h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded-none focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 !h-8 px-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="rounded-none text-emerald-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[11px]">Low Stock Only (&le; Threshold)</span>
            </label>
          </div>

        </div>
      </div>

      {/* Flat Products Table */}
      <div className="border border-zinc-200 bg-white overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">SKU / Item</th>
                <th className="py-2.5 px-4 font-semibold">Classification</th>
                <th className="py-2.5 px-4 font-semibold">Compatible Models</th>
                <th className="py-2.5 px-4 font-semibold">Cash Price</th>
                <th className="py-2.5 px-4 font-semibold">Stock / Threshold</th>
                <th className="py-2.5 px-4 font-semibold">Financing</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    No matching products found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className={`hover:bg-zinc-50/70 transition-colors ${p.isArchived ? "opacity-60 bg-zinc-50/40" : ""}`}>
                      {/* SKU & Name with thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50">
                            <ProductImagePlaceholder
                              category={p.category}
                              name={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-zinc-400 block">{p.id}</span>
                            <p className="font-semibold text-zinc-900 leading-snug">{p.name}</p>
                            {p.isArchived && (
                              <span className="inline-block mt-0.5 text-[9px] font-mono uppercase px-1 rounded bg-zinc-200 text-zinc-700">
                                Archived
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-900 block">{p.category}</span>
                        <span className="text-[11px] text-zinc-500">{p.brand}</span>
                      </td>

                      {/* Compatible Models */}
                      <td className="py-3 px-4">
                        <p className="text-[11px] text-zinc-600 line-clamp-2 max-w-xs font-mono">
                          {p.compatibleModels.join(", ") || "Universal"}
                        </p>
                      </td>

                      {/* Cash Price */}
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        ₱{p.price.toLocaleString()}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${isLow ? "text-red-700" : "text-zinc-900"}`}>
                            {p.stock} units
                          </span>
                          {isLow ? (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                              Low Stock (&le;{p.lowStockThreshold})
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-400">
                              (Min {p.lowStockThreshold})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Financing Eligibility */}
                      <td className="py-3 px-4">
                        {p.installmentEligible ? (
                          <div>
                            <span className="inline-block text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Eligible (Min ₱{p.minInstallmentPrice.toLocaleString()})
                            </span>
                            <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">
                              {p.eligiblePlans.join(" · ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400">Cash / COD Only</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="!h-6 px-2 text-[11px] font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-zinc-700 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(p.id)}
                            className={`!h-6 px-2 text-[11px] font-medium rounded transition-colors cursor-pointer border ${
                              p.isArchived
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            {p.isArchived ? "Restore" : "Archive"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-sm font-bold text-zinc-900">
                {editingProduct.id.startsWith("PRD-") && products.some((x) => x.id === editingProduct.id)
                  ? `Edit Product (${editingProduct.id})`
                  : "Add New Product to Catalog"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
              
              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Yamaha NMAX 155 ABS"
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Category *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Brand / Make *</label>
                  <select
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                  >
                    {brands.filter((b) => b !== "All").map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Technical specifications, features, displacement, etc."
                  className="w-full p-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Compatible Models (Comma Separated)</label>
                <input
                  type="text"
                  value={editingProduct.compatibleModels}
                  onChange={(e) => setEditingProduct({ ...editingProduct, compatibleModels: e.target.value })}
                  placeholder="e.g. NMAX 155 V1, NMAX 155 V2, Aerox 155"
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Cash Price (₱) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Current Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Low Stock Alert &le;</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.lowStockThreshold}
                    onChange={(e) => setEditingProduct({ ...editingProduct, lowStockThreshold: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Installment Configuration */}
              <div className="pt-3 border-t border-zinc-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
                  <input
                    type="checkbox"
                    checked={editingProduct.installmentEligible}
                    onChange={(e) => setEditingProduct({ ...editingProduct, installmentEligible: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>Enable In-House Monthly Installment Financing</span>
                </label>

                {editingProduct.installmentEligible && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-600 font-medium">Min Qualifying Price (₱)</label>
                      <input
                        type="number"
                        min={0}
                        value={editingProduct.minInstallmentPrice}
                        onChange={(e) => setEditingProduct({ ...editingProduct, minInstallmentPrice: e.target.value })}
                        className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-600 font-medium">Eligible Terms</label>
                      <p className="text-[11px] text-zinc-500 pt-1">3, 6, 12, 24, 36 Months Active</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-2xs"
                >
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
