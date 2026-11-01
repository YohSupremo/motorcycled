import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { Checkbox, Chip, InputAdornment, TextField } from "@mui/material";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";

const API = import.meta.env.VITE_API;

const STATIC_INSTALLMENT_PLANS = [
  { id: "PLAN-12M", name: "12 Months Standard", termMonths: 12, interestRate: 7, minDownpaymentPercent: 20, processingFee: 1500 },
  { id: "PLAN-24M", name: "24 Months Extended", termMonths: 24, interestRate: 8, minDownpaymentPercent: 20, processingFee: 1500 },
  { id: "PLAN-36M", name: "36 Months Tier 1 Big Bike", termMonths: 36, interestRate: 9, minDownpaymentPercent: 25, processingFee: 1500 },
];

const settingsSchema = yup.object({
  taxRate: yup.number().typeError("Tax rate must be a number").required().min(0),
  defaultLowStockThreshold: yup.number().typeError("Threshold must be a number").required().min(1),
  globalShippingFee: yup.number().typeError("Shipping fee must be a number").required().min(0),
  downpaymentRefundable: yup.string().required(),
});

const defaults = {
  taxRate: 12,
  defaultLowStockThreshold: 5,
  globalShippingFee: 350,
  downpaymentRefundable: "forfeited",
};

const inputClass = "w-full h-9 px-2.5 border border-zinc-300 rounded font-mono focus:outline-2 focus:outline-offset-1 focus:border-emerald-700 focus:outline-emerald-700";

export const AdminSettings = () => {
  const [products, setProducts] = useState([]);
  const [featuredIds, setFeaturedIds] = useState(new Set());
  const [plans, setPlans] = useState(STATIC_INSTALLMENT_PLANS);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveFeedback, setSaveFeedback] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [{ data: settingsData }, { data: productsData }] = await Promise.all([
          axios.get(`${API}/admin/settings`, { withCredentials: true }),
          axios.get(`${API}/admin/products`, { withCredentials: true }),
        ]);
        reset({ ...defaults, ...(settingsData.settings || {}) });
        setPlans(settingsData.settings?.installmentPlans || STATIC_INSTALLMENT_PLANS);
        const featured = (productsData.products || [])
          .filter((product) => product.isFeatured && !product.isArchived)
          .map((product) => product._id);
        setProducts(productsData.products || []);
        setFeaturedIds(new Set(featured));
      } catch (error) {
        setSettingsError(error.response?.data?.message || "Could not load store settings.");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const toggleFeatured = (id) => {
    setFeaturedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (data) => {
    setSettingsError("");
    setSaveFeedback("");
    try {
      await axios.put(`${API}/admin/settings`, data, { withCredentials: true });
      const changes = products
        .filter((product) => product.isFeatured !== featuredIds.has(product._id))
        .map((product) =>
          axios.patch(`${API}/admin/product/${product._id}/feature`, {}, { withCredentials: true }),
        );
      await Promise.all(changes);
      setProducts((current) =>
        current.map((product) => ({ ...product, isFeatured: featuredIds.has(product._id) })),
      );
      setSaveFeedback("Settings saved");
      window.setTimeout(() => setSaveFeedback(""), 2500);
    } catch (error) {
      setSettingsError(error.response?.data?.message || "Could not save store settings.");
    }
  };

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isArchived),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const matching = !query
      ? activeProducts
      : activeProducts.filter((product) =>
          [product.name, product.brand?.name, product.category?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query)),
        );

    return [...matching].sort(
      (a, b) =>
        Number(featuredIds.has(b._id)) - Number(featuredIds.has(a._id)) ||
        a.name.localeCompare(b.name),
    );
  }, [activeProducts, featuredIds, productSearch]);

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage storefront defaults, featured products, and the static financing catalog.</p>
        </div>
        {saveFeedback && <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">{saveFeedback}</span>}
      </div>

      {settingsError && <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded">{settingsError}</div>}

      <form onSubmit={handleSubmit(handleSave)} noValidate className="space-y-8">
        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[11px] font-medium text-emerald-700">Store defaults</span>
            <h2 className="text-base font-bold text-zinc-900">Taxation, inventory, and delivery</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs bg-white p-4 border border-zinc-200">
            <label className="space-y-1">
              <span className="font-semibold text-zinc-800 block">Tax rate (%)</span>
              <input type="number" step="0.1" min="0" {...register("taxRate")} className={inputClass} />
              {errors.taxRate && <span className="text-rose-600">{errors.taxRate.message}</span>}
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-zinc-800 block">Low-stock alert level</span>
              <input type="number" min="1" {...register("defaultLowStockThreshold")} className={inputClass} />
              {errors.defaultLowStockThreshold && <span className="text-rose-600">{errors.defaultLowStockThreshold.message}</span>}
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-zinc-800 block">Global shipping fee (₱)</span>
              <input type="number" min="0" step="0.01" {...register("globalShippingFee")} className={inputClass} />
              <span className="text-[11px] text-zinc-500 block">Applied to parts delivery orders; pickup remains free.</span>
              {errors.globalShippingFee && <span className="text-rose-600">{errors.globalShippingFee.message}</span>}
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-zinc-800 block">Downpayment on cancellation</span>
              <select {...register("downpaymentRefundable")} className={inputClass.replace("font-mono", "")}>
                <option value="forfeited">Forfeited</option>
                <option value="refundable">Refundable after review</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[11px] font-medium text-emerald-700">Homepage showcase</span>
            <h2 className="text-base font-bold text-zinc-900">Featured products</h2>
          </div>
          <div className="bg-white border border-zinc-200 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                Search by product, brand, or category. Selected products appear first and will show in the homepage carousel after saving.
              </p>
              <Chip
                size="small"
                label={`${featuredIds.size} selected`}
                sx={{
                  alignSelf: "flex-start",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#047857",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                }}
              />
            </div>
            {activeProducts.length === 0 ? (
              <p className="text-xs text-zinc-500">No active products available.</p>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products, brands, or categories..."
                  aria-label="Search products to feature"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-4-4" />
                          </svg>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      backgroundColor: "#fafafa",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#047857",
                    },
                  }}
                />
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-zinc-500 border border-dashed border-zinc-300 p-6 text-center">
                    No active products match “{productSearch}”.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-200">
                    {filteredProducts.map((product) => {
                      const isSelected = featuredIds.has(product._id);
                      const brandName = product.brand?.name || "OEM";
                      const categoryName = product.category?.name || "General";
                      const hasImage = product.images?.[0]?.url;

                      return (
                        <label
                          key={product._id}
                          className={`group border-r border-b border-zinc-200 cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/60" : "bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <div className="relative h-32 bg-zinc-100 overflow-hidden flex items-center justify-center">
                            {hasImage ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <ProductImagePlaceholder category={categoryName} name={product.name} brand={brandName} />
                            )}
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleFeatured(product._id)}
                              slotProps={{ input: { "aria-label": `Feature ${product.name}` } }}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                padding: "4px",
                                color: "#d4d4d8",
                                backgroundColor: "rgba(255,255,255,0.9)",
                                "&.Mui-checked": { color: "#059669" },
                                "&:hover": { backgroundColor: "#fff" },
                              }}
                            />
                            {isSelected && (
                              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="p-3 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono uppercase font-bold text-zinc-400 tracking-wider text-[10px] truncate">{brandName}</span>
                              <span className="text-[11px] font-semibold text-zinc-700 whitespace-nowrap">₱{Number(product.price || 0).toLocaleString()}</span>
                            </div>
                            <h3 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">{product.name}</h3>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[11px] font-medium text-emerald-700">Static financing catalog</span>
            <h2 className="text-base font-bold text-zinc-900">Installment plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white border border-zinc-200 p-4 text-xs space-y-2">
                <h3 className="font-semibold text-zinc-900">{plan.name}</h3>
                <p className="text-zinc-600">{plan.termMonths} months · {plan.interestRate}% interest</p>
                <p className="text-zinc-600">Minimum downpayment: {plan.minDownpaymentPercent}%</p>
                <p className="text-zinc-600">Processing fee: ₱{Number(plan.processingFee).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">Plans are fixed by the system and are not editable from settings.</p>
        </section>

        <div className="pt-2 flex items-center justify-end">
          <button type="submit" disabled={isSubmitting} className="h-9 px-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60">
            {isSubmitting ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
