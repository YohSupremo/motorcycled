import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
  selectCartItem,
  selectAllCartItems,
  setItemPurchaseMethod,
  setItemTermMonths,
  clearCart,
  addToCart,
} from "../../../actions/cartActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { ScrollReveal } from "../../components/ScrollReveal";

const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Compute financing preview (client-side display only; backend recalculates authoritatively)
const computeInstallmentPreview = (price, termMonths) => {
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

  const { cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Selected items
  const selectedItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const allSelected =
    cartItems.length > 0 && cartItems.every((i) => i.selected);
  const someSelected = selectedItems.length > 0;

  // Separate selected into motorcycles and parts
  const selectedMotorcycles = selectedItems.filter((i) => i.isVehicle);
  const selectedParts = selectedItems.filter((i) => !i.isVehicle);

  // Preview totals for selected items
  const partsCashTotal = selectedParts.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );
  const motorcycleCashTotal = selectedMotorcycles
    .filter((i) => i.purchaseMethod === "cash")
    .reduce((acc, i) => acc + i.price * i.quantity, 0);
  const selectedGrandTotal = partsCashTotal + motorcycleCashTotal;

  const handleRemove = (cartItemId) => dispatch(removeFromCart(cartItemId));

  const handleQty = (item, delta) => {
    const current = Number(item.quantity) || 1;
    const newQty = Math.max(1, Math.min(item.inStock, current + delta));
    dispatch(updateCartItemQuantity(item.cartItemId, newQty));
  };

  const handleQtyDirect = (item, val) => {
    if (val === "") {
      dispatch(updateCartItemQuantity(item.cartItemId, 1));
      return;
    }
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    dispatch(
      updateCartItemQuantity(
        item.cartItemId,
        Math.max(1, Math.min(item.inStock, n))
      )
    );
  };

  const handleSelect = (cartItemId, val) =>
    dispatch(selectCartItem(cartItemId, val));

  const handleSelectAll = () => dispatch(selectAllCartItems(!allSelected));

  const handleClearCart = () => {
    dispatch(clearCart());
    setShowClearConfirm(false);
  };

  const handlePurchaseMethod = (cartItemId, method) =>
    dispatch(setItemPurchaseMethod(cartItemId, method));

  const handleTermMonths = (cartItemId, months) =>
    dispatch(setItemTermMonths(cartItemId, parseInt(months, 10)));

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent("/checkout/shipping")}`);
      return;
    }
    if (!someSelected) return;
    navigate("/checkout/shipping");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="pb-4 border-b border-zinc-900 mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Review certified motorcycle units, genuine replacement parts, and
              configure your purchase.
            </p>
          </div>
          <ScrollReveal threshold={0.1} duration={500}>
            <div className="border border-zinc-200 rounded-md p-16 text-center space-y-4 bg-zinc-50/50">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900">
                  Your shopping cart is currently empty
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Explore showroom motorcycles, OEM engine assemblies, sintered
                  brakes, and certified riding safety gear.
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Browse Inventory Catalog</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Review certified motorcycle units, genuine replacement parts, and
              configure your purchase method.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              ← Continue Shopping
            </Link>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Empty Cart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Item List */}
          <div className="lg:col-span-8 space-y-4">
            <ScrollReveal threshold={0.05} duration={500}>
              <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[11px] font-semibold">
                        <th className="py-3 px-4 w-8">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            className="accent-emerald-600 cursor-pointer"
                            aria-label="Select all"
                          />
                        </th>
                        <th className="py-3 px-4">Item Details</th>
                        <th className="py-3 px-4 font-mono">Unit Price</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 font-mono text-right">Subtotal</th>
                        <th className="py-3 px-4 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {cartItems.map((item) => {
                        const lineTotal = item.price * (Number(item.quantity) || 1);
                        const preview =
                          item.isVehicle && item.purchaseMethod === "installment"
                            ? computeInstallmentPreview(item.price, item.termMonths || 12)
                            : null;
                        return (
                          <tr
                            key={item.cartItemId}
                            className={`transition-colors ${
                              item.selected ? "bg-emerald-50/20" : "hover:bg-zinc-50/50"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3.5 px-4">
                              <input
                                type="checkbox"
                                checked={!!item.selected}
                                onChange={(e) =>
                                  handleSelect(item.cartItemId, e.target.checked)
                                }
                                className="accent-emerald-600 cursor-pointer"
                              />
                            </td>

                            {/* Item Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
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
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="font-bold text-zinc-900 text-xs sm:text-sm">
                                      {item.name}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                                      {item.brand}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                    <span>{item.category}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-medium">
                                      {item.inStock} in stock
                                    </span>
                                  </div>

                                  {/* Purchase method selector for motorcycles */}
                                  {item.isVehicle && item.installmentEligible && (
                                    <div className="pt-1 space-y-1">
                                      <div className="flex items-center gap-3 text-[11px]">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`method-${item.cartItemId}`}
                                            value="cash"
                                            checked={item.purchaseMethod === "cash"}
                                            onChange={() =>
                                              handlePurchaseMethod(item.cartItemId, "cash")
                                            }
                                            className="accent-emerald-600"
                                          />
                                          <span className="font-medium text-zinc-700">
                                            Cash
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`method-${item.cartItemId}`}
                                            value="installment"
                                            checked={item.purchaseMethod === "installment"}
                                            onChange={() =>
                                              handlePurchaseMethod(
                                                item.cartItemId,
                                                "installment"
                                              )
                                            }
                                            className="accent-emerald-600"
                                          />
                                          <span className="font-medium text-zinc-700">
                                            Installment
                                          </span>
                                        </label>
                                      </div>

                                      {/* Term selector for installment */}
                                      {item.purchaseMethod === "installment" && (
                                        <div className="flex flex-col gap-1">
                                          <select
                                            value={item.termMonths || 12}
                                            onChange={(e) =>
                                              handleTermMonths(item.cartItemId, e.target.value)
                                            }
                                            className="h-7 px-2 border border-zinc-300 rounded text-[11px] bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer w-36"
                                          >
                                            <option value={12}>12 months</option>
                                            <option value={24}>24 months</option>
                                            <option value={36}>36 months</option>
                                          </select>
                                          {preview && (
                                            <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 space-y-0.5">
                                              <div>
                                                Down: {fmt(preview.downPayment)} (20%)
                                              </div>
                                              <div>
                                                Monthly: {fmt(preview.monthly)} ×{" "}
                                                {item.termMonths || 12}
                                              </div>
                                              <div className="text-zinc-500">
                                                Est. total: {fmt(preview.total)} (incl. fees)
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Non-installment-eligible motorcycle badge */}
                                  {item.isVehicle && !item.installmentEligible && (
                                    <span className="inline-block text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                                      Cash only
                                    </span>
                                  )}

                                  {/* Parts/accessories badge */}
                                  {!item.isVehicle && (
                                    <span className="inline-block text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                                      Cash purchase
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="py-3.5 px-4 font-mono text-zinc-900 font-semibold whitespace-nowrap">
                              {fmt(item.price)}
                            </td>

                            {/* Quantity — motorcycles fixed at 1 */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {item.isVehicle ? (
                                <span className="font-mono font-semibold text-zinc-700 px-3">
                                  1
                                </span>
                              ) : (
                                <div className="inline-flex items-center border border-zinc-300 rounded-md bg-white shadow-sm overflow-hidden">
                                  <button
                                    type="button"
                                    disabled={Number(item.quantity) <= 1}
                                    onClick={() => handleQty(item, -1)}
                                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.inStock}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQtyDirect(item, e.target.value)
                                    }
                                    className="w-10 h-7 text-center font-mono font-semibold text-xs text-zinc-900 border-x border-zinc-200 focus:outline-none focus:bg-emerald-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    disabled={Number(item.quantity) >= item.inStock}
                                    onClick={() => handleQty(item, 1)}
                                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Subtotal */}
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-right whitespace-nowrap">
                              {item.purchaseMethod === "installment" && preview
                                ? fmt(item.price)
                                : fmt(lineTotal)}
                            </td>

                            {/* Remove */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemove(item.cartItemId)}
                                className="w-7 h-7 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* Info notices */}
            {selectedMotorcycles.some((m) => m.purchaseMethod === "installment") && (
              <div className="border border-amber-200 bg-amber-50/60 rounded-md p-3 text-xs text-amber-800 space-y-0.5">
                <p className="font-semibold">Installment Application Notice</p>
                <p>
                  Financing applications are subject to admin review and approval.
                  Submission does not guarantee approval or reserve inventory.
                  Amounts shown are estimates — confirmed terms are set upon approval.
                </p>
              </div>
            )}

            {selectedParts.length > 0 && selectedMotorcycles.length > 0 && (
              <div className="border border-zinc-200 bg-zinc-50/60 rounded-md p-3 text-xs text-zinc-600">
                <p>
                  <span className="font-semibold">Mixed Checkout:</span> Your
                  motorcycle(s) and parts will be processed as separate
                  orders/applications. Parts use the cash-only checkout flow.
                </p>
              </div>
            )}
          </div>

          {/* Right: Summary Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 self-start">
            <ScrollReveal threshold={0.1} duration={500}>
              <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-5">
                <div className="pb-3 border-b border-zinc-900">
                  <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                    Order Summary
                  </h2>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedItems.length} of {cartItems.length} items selected
                  </span>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-xs divide-y divide-zinc-100">
                  {selectedMotorcycles.filter((m) => m.purchaseMethod === "cash")
                    .length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>
                        Motorcycle(s) — Cash (
                        {
                          selectedMotorcycles.filter(
                            (m) => m.purchaseMethod === "cash"
                          ).length
                        }
                        ):
                      </span>
                      <span className="font-mono text-zinc-900 font-semibold">
                        {fmt(motorcycleCashTotal)}
                      </span>
                    </div>
                  )}
                  {selectedMotorcycles.filter(
                    (m) => m.purchaseMethod === "installment"
                  ).length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>
                        Motorcycle(s) — Installment (
                        {
                          selectedMotorcycles.filter(
                            (m) => m.purchaseMethod === "installment"
                          ).length
                        }
                        ):
                      </span>
                      <span className="font-mono text-zinc-500 italic text-[11px]">
                        Pending approval
                      </span>
                    </div>
                  )}
                  {selectedParts.length > 0 && (
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Parts & Accessories ({selectedParts.length} items):</span>
                      <span className="font-mono text-zinc-900 font-semibold">
                        {fmt(partsCashTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 pb-1 text-sm font-bold text-zinc-900">
                    <span>Cash Total:</span>
                    <span className="font-mono text-base text-zinc-900">
                      {fmt(selectedGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout button */}
                <button
                  type="button"
                  disabled={!someSelected}
                  onClick={handleProceedToCheckout}
                  className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>
                    {someSelected
                      ? `Proceed to Checkout (${selectedItems.length})`
                      : "Select items to checkout"}
                  </span>
                  <span>&rarr;</span>
                </button>

                {!isAuthenticated && someSelected && (
                  <p className="text-[11px] text-amber-700 text-center">
                    You will be asked to log in before checkout.
                  </p>
                )}

                {/* Guarantee */}
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2 text-[11px] text-zinc-500">
                  <svg
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>
                    LTO Registration assistance & genuine OEM warranty included.
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

      {/* Clear cart confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Empty Cart?</h3>
            <p className="text-xs text-zinc-600">
              This will remove all{" "}
              <span className="font-semibold">{cartItems.length}</span> item(s)
              from your cart. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="h-9 px-4 rounded border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className="h-9 px-4 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Empty Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
