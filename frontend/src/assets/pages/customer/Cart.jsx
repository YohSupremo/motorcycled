import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from "@mui/material";
import {
  removeFromCart,
  updateCartItemQuantity,
  selectCartItem,
  selectAllCartItems,
  setItemPurchaseMethod,
  setItemTermMonths,
  clearCart,
} from "../../../actions/cartActions";
import { toast } from "react-toastify";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { ScrollReveal } from "../../components/ScrollReveal";

const CHECKOUT_STEPS = ["Cart", "Fulfillment & Verification", "Review & Terms", "Complete"];

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Compute financing preview (client-side display only; backend recalculates authoritatively)
const computeInstallmentPreview = (price, termMonths = 12) => {
  const RATES = { 12: 0.07, 24: 0.08, 36: 0.09 };
  const rate = RATES[termMonths] || 0.07;
  const downPayment = Math.round(price * 0.2);
  const financed = price - downPayment;
  const monthly = Math.round((financed * (1 + rate)) / termMonths);
  const processingFee = 1500;
  const total = downPayment + monthly * termMonths + processingFee;
  return { downPayment, financed, monthly, processingFee, total, rate };
};

export const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems = [] } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Group cart items into vehicles vs parts
  const motorcycleItems = useMemo(
    () => cartItems.filter((i) => i.isVehicle),
    [cartItems]
  );
  const partItems = useMemo(
    () => cartItems.filter((i) => !i.isVehicle),
    [cartItems]
  );

  // Selected items
  const selectedItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const allSelected =
    cartItems.length > 0 && cartItems.every((i) => i.selected);
  const someSelected = selectedItems.length > 0;

  const selectedMotorcycles = selectedItems.filter((i) => i.isVehicle);
  const selectedParts = selectedItems.filter((i) => !i.isVehicle);

  const partsCashTotal = selectedParts.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );
  const motorcycleCashTotal = selectedMotorcycles
    .filter((i) => i.purchaseMethod === "cash")
    .reduce((acc, i) => acc + i.price * i.quantity, 0);

  const immediateCashTotal = partsCashTotal + motorcycleCashTotal;

  const hasInstallment = selectedMotorcycles.some(
    (m) => m.purchaseMethod === "installment"
  );
  const hasCashItems =
    selectedParts.length > 0 ||
    selectedMotorcycles.some((m) => m.purchaseMethod === "cash");

  // Handlers
  const handleRemove = (item) => {
    dispatch(removeFromCart(item.cartItemId));
    toast.info(`Removed "${item.name}" from cart`);
  };

  const handleQty = (item, delta) => {
    const current = Number(item.quantity) || 1;
    if (delta > 0 && current >= item.inStock) {
      toast.warning(`Maximum available inventory is ${item.inStock} units`);
      return;
    }
    const newQty = Math.max(1, Math.min(item.inStock, current + delta));
    dispatch(updateCartItemQuantity(item.cartItemId, newQty));
  };

  const handleSelect = (cartItemId, val) =>
    dispatch(selectCartItem(cartItemId, val));

  const handleSelectAll = () => dispatch(selectAllCartItems(!allSelected));

  const handleClearCart = () => {
    dispatch(clearCart());
    setShowClearConfirm(false);
    toast.info("Cart has been cleared");
  };

  const handlePurchaseMethod = (cartItemId, method) => {
    dispatch(setItemPurchaseMethod(cartItemId, method));
    toast.info(`Switched to ${method === "installment" ? "In-House Financing" : "Outright Cash Payment"}`);
  };

  const handleTermMonths = (cartItemId, months) => {
    dispatch(setItemTermMonths(cartItemId, parseInt(months, 10)));
    toast.info(`Financing term set to ${months} Months`);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to proceed with checkout");
      navigate(`/login?redirect=${encodeURIComponent("/checkout/shipping")}`);
      return;
    }
    if (!someSelected) {
      toast.warning("Please select at least one item to proceed to checkout");
      return;
    }
    navigate("/checkout/shipping");
  };

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col font-sans">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-zinc-600">
              <svg className="w-8 h-8 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Your Shopping Bag is Empty
              </h1>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Explore our showroom for brand-new certified motorcycles, OEM replacement parts, and rider accessories.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <span>Browse Showroom & Shop</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* MUI Stepper (Step 1) */}
        <Box sx={{ width: "100%", pb: 1 }}>
          <Stepper activeStep={0} alternativeLabel>
            {CHECKOUT_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    },
                    "& .Mui-active": {
                      color: "#059669 !important",
                      fontWeight: 700,
                    },
                    "& .Mui-completed": {
                      color: "#059669 !important",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Page Sub-header Toolbar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Shopping Cart
              </h1>
              <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Configure your vehicle payment method (cash vs financing) and verify your genuine parts.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-zinc-700 hover:text-emerald-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              {allSelected ? "Deselect All" : "Select All Items"}
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1"
            >
              Empty Cart
            </button>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Item Showcase (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. MOTORCYCLE ASSETS SECTION */}
            {motorcycleItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Showroom Motorcycles ({motorcycleItems.length})
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Dealer Unit Handover
                  </span>
                </div>

                <div className="space-y-4">
                  {motorcycleItems.map((item) => {
                    const isInstallment = item.purchaseMethod === "installment";
                    const currentTerm = item.termMonths || 12;
                    const preview = computeInstallmentPreview(item.price, currentTerm);

                    return (
                      <div
                        key={item.cartItemId}
                        className={`bg-white rounded-xl border transition-all shadow-xs ${
                          item.selected
                            ? "border-emerald-600/80 ring-1 ring-emerald-600/30"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="p-4 sm:p-5 space-y-4">
                          
                          {/* Top Row: Checkbox, Image, Title & Price */}
                          <div className="flex items-start gap-3 sm:gap-4">
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={(e) => handleSelect(item.cartItemId, e.target.checked)}
                              className="mt-1.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                            />

                            {/* Motorcycle Visual Thumbnail */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ProductImagePlaceholder
                                  category={item.category}
                                  name={item.name}
                                  brand={item.brand}
                                  compact
                                />
                              )}
                            </div>

                            {/* Details & Pricing */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold uppercase bg-zinc-900 text-white px-2 py-0.5 rounded">
                                      {item.brand}
                                    </span>
                                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      Ready for Releasing
                                    </span>
                                  </div>
                                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight mt-1">
                                    {item.name}
                                  </h3>
                                  <p className="text-xs text-zinc-500">
                                    {item.category} • Certified Dealership Stock ({item.inStock} units available)
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs text-zinc-400 block font-mono">SRP</span>
                                  <span className="text-base sm:text-lg font-mono font-extrabold text-zinc-900 block">
                                    {fmt(item.price)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(item)}
                                    className="text-[11px] text-zinc-400 hover:text-red-600 font-medium transition-colors cursor-pointer mt-1"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Purchase Mode Segmented Switcher */}
                          {item.installmentEligible && (
                            <div className="pt-3 border-t border-zinc-100 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                                  Payment Structure:
                                </span>

                                {/* Segmented Tactile Pill Toggle */}
                                <div className="inline-flex rounded-lg bg-zinc-100 p-1 border border-zinc-200 text-xs font-semibold self-start sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handlePurchaseMethod(item.cartItemId, "cash")}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                      !isInstallment
                                        ? "bg-white text-zinc-900 shadow-xs font-bold"
                                        : "text-zinc-600 hover:text-zinc-900"
                                    }`}
                                  >
                                    Outright Cash
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePurchaseMethod(item.cartItemId, "installment")}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                      isInstallment
                                        ? "bg-amber-600 text-white shadow-xs font-bold"
                                        : "text-zinc-600 hover:text-zinc-900"
                                    }`}
                                  >
                                    In-House Financing
                                  </button>
                                </div>
                              </div>

                              {/* Interactive Financing Loan Calculator Bar */}
                              {isInstallment && (
                                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80 text-xs">
                                    <span className="font-bold text-amber-900">
                                      Select Financing Term:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {[12, 24, 36].map((term) => (
                                        <button
                                          key={term}
                                          type="button"
                                          onClick={() => handleTermMonths(item.cartItemId, term)}
                                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                                            currentTerm === term
                                              ? "bg-amber-800 text-white shadow-xs"
                                              : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-100"
                                          }`}
                                        >
                                          {term} Mo ({(computeInstallmentPreview(item.price, term).rate * 100).toFixed(0)}%)
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Metric Tiles */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-white/80 rounded-lg p-2 border border-amber-200">
                                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Min. Downpayment</span>
                                      <span className="font-mono font-bold text-zinc-900 text-xs">{fmt(preview.downPayment)}</span>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-2 border border-amber-200">
                                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Doc & LTO Fee</span>
                                      <span className="font-mono font-bold text-zinc-900 text-xs">{fmt(preview.processingFee)}</span>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-2 border border-amber-200">
                                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Financed Principal</span>
                                      <span className="font-mono font-bold text-zinc-900 text-xs">{fmt(preview.financed)}</span>
                                    </div>
                                    <div className="bg-amber-100/90 rounded-lg p-2 border border-amber-300">
                                      <span className="text-[10px] text-amber-800 block uppercase font-mono font-bold">Monthly Payment</span>
                                      <span className="font-mono font-extrabold text-amber-950 text-sm">
                                        {fmt(preview.monthly)} <span className="text-[10px] font-normal text-amber-800">/mo</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1">
                                    <span>
                                      Downpayment due upon credit approval at branch: <strong>{fmt(preview.downPayment + preview.processingFee)}</strong>
                                    </span>
                                    <span className="font-mono text-zinc-500">
                                      Total: {fmt(preview.total)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. PARTS & ACCESSORIES SECTION */}
            {partItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Genuine Parts & Rider Gear ({partItems.length})
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Outright Cash Purchase
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 shadow-xs">
                  {partItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                        item.selected ? "bg-emerald-50/15" : "hover:bg-zinc-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!item.selected}
                          onChange={(e) => handleSelect(item.cartItemId, e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                        />

                        <div className="w-14 h-14 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ProductImagePlaceholder
                              category={item.category}
                              name={item.name}
                              brand={item.brand}
                              compact
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            {item.brand} • {item.category}
                          </p>
                          <span className="text-xs font-mono font-bold text-zinc-900 mt-0.5 block">
                            {fmt(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQty(item, -1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer font-bold text-sm"
                          >
                            –
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQty(item, 1)}
                            disabled={item.quantity >= item.inStock}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer font-bold text-sm"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right w-24">
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-zinc-900 block">
                            {fmt(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="text-[10px] text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. LOGISTICS PROTOCOL BRIEFING (Structured Hallmark Module) */}
            {(selectedParts.length > 0 && selectedMotorcycles.length > 0 || hasInstallment) && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Fulfillment & Operational Guidance
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">
                    Showroom Protocol
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {hasInstallment && (
                    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                        <span className="font-mono text-[9px] bg-amber-200 text-amber-950 px-1 py-0.5 rounded font-bold">LOAN</span>
                        <span>In-House Financing Pre-Qualification</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        No upfront charge today. Your financing dossier is evaluated by our credit officer. Downpayment is settled at your chosen branch showroom upon credit approval.
                      </p>
                    </div>
                  )}

                  {selectedParts.length > 0 && selectedMotorcycles.length > 0 && (
                    <div className="border border-zinc-200 bg-zinc-50/70 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-[11px]">
                        <span className="font-mono text-[9px] bg-zinc-200 text-zinc-800 px-1 py-0.5 rounded font-bold">SPLIT</span>
                        <span>Split Fulfillment Dispatch</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Motorcycles undergo Certified Pre-Delivery Inspection (PDI) at the dealership showroom. Parts/accessories can be delivered via courier or consolidated at pickup.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 self-start">
            <ScrollReveal threshold={0.1} duration={500}>
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-5">
                <div className="pb-3 border-b border-zinc-900">
                  <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
                    Order Summary
                  </h2>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedItems.length} of {cartItems.length} line items selected
                  </span>
                </div>

                {/* Line Item Breakdown */}
                <div className="space-y-2.5 text-xs divide-y divide-zinc-100">
                  {selectedMotorcycles.filter((m) => m.purchaseMethod === "cash").length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Motorcycles — Cash ({selectedMotorcycles.filter((m) => m.purchaseMethod === "cash").length}):</span>
                      <span className="font-mono text-zinc-900 font-bold">
                        {fmt(motorcycleCashTotal)}
                      </span>
                    </div>
                  )}

                  {selectedMotorcycles.filter((m) => m.purchaseMethod === "installment").length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Motorcycles — Installment:</span>
                      <span className="font-mono text-amber-800 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {selectedMotorcycles.filter((m) => m.purchaseMethod === "installment").length} Application(s)
                      </span>
                    </div>
                  )}

                  {selectedParts.length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Parts & Accessories ({selectedParts.length}):</span>
                      <span className="font-mono text-zinc-900 font-bold">
                        {fmt(partsCashTotal)}
                      </span>
                    </div>
                  )}

                  {/* Financial Total Block */}
                  <div className="pt-3 pb-1 space-y-1">
                    {hasInstallment && !hasCashItems ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Upfront Due Today:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                            ₱0.00 (Zero Charge)
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-tight">
                          Downpayment settled directly at branch showroom upon credit approval.
                        </p>
                      </div>
                    ) : hasInstallment && hasCashItems ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-600">
                          <span>Immediate Cash Total:</span>
                          <span className="font-mono font-extrabold text-zinc-900 text-base">
                            {fmt(immediateCashTotal)}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-tight">
                          + Financing downpayment settled separately upon branch approval.
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm font-bold text-zinc-900">
                        <span>Total Cash Payable:</span>
                        <span className="font-mono text-xl font-extrabold text-zinc-900">
                          {fmt(immediateCashTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Action Button */}
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!someSelected}
                  onClick={handleProceedToCheckout}
                  sx={{
                    bgcolor: "#059669",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    py: 1.3,
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                    "&:hover": { bgcolor: "#047857" },
                    "&:disabled": { bgcolor: "#e4e4e7", color: "#a1a1aa" },
                  }}
                >
                  {someSelected
                    ? `Proceed to Fulfillment (${selectedItems.length}) →`
                    : "Select items to checkout"}
                </Button>

                {!isAuthenticated && someSelected && (
                  <p className="text-[11px] text-amber-700 text-center">
                    You will be asked to authenticate before completing checkout.
                  </p>
                )}

                {/* Official Dealership Assurances (Hallmark Craftsmanship) */}
                <div className="pt-4 border-t border-zinc-150 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    Certified Dealership Assurances
                  </span>
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 space-y-2.5 text-[11px]">
                    <div className="flex items-start gap-2.5 text-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        <svg className="w-2.5 h-2.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block text-[11px]">
                          LTO Registration Assistance
                        </span>
                        <span className="text-zinc-500 text-[10px] leading-tight block">
                          Official liaison support for registration & conduction plate.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        <svg className="w-2.5 h-2.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block text-[11px]">
                          Genuine OEM Warranty
                        </span>
                        <span className="text-zinc-500 text-[10px] leading-tight block">
                          Certified factory warranty across all authorized service bays.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        <svg className="w-2.5 h-2.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block text-[11px]">
                          Showroom PDI Inspection
                        </span>
                        <span className="text-zinc-500 text-[10px] leading-tight block">
                          Pre-delivery mechanical check and technician orientation.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#18181b" }}>
          Empty Shopping Cart?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#52525b" }}>
            This will remove all {cartItems.length} line item(s) from your shopping bag. This action cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowClearConfirm(false)}
            sx={{ textTransform: "none", color: "#71717a", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearCart}
            variant="contained"
            color="error"
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Yes, Empty Cart
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
