import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { submitCheckout, resetCheckout } from "../../../actions/orderActions";
import { clearSuccessfulItems } from "../../../actions/cartActions";
import { ScrollReveal } from "../../components/ScrollReveal";

const generateSessionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const PAYMENT_METHODS = [
  { value: "cash_on_releasing", label: "Cash on Releasing (Over-the-Counter)" },
  { value: "bank_deposit", label: "Bank Deposit / Online Transfer" },
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya (PayMaya)" },
];

export const ConfirmOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems, shippingInfo } = useSelector((state) => state.cart);
  const { loading, success, results, error } = useSelector(
    (state) => state.checkout
  );

  const [paymentMethod, setPaymentMethod] = useState("cash_on_releasing");
  // Stable session ID so retries are idempotent
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem("mcCheckoutSessionId");
    if (saved) return saved;
    const id = generateSessionId();
    sessionStorage.setItem("mcCheckoutSessionId", id);
    return id;
  });

  const selectedItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const selectedMotorcycles = selectedItems.filter((i) => i.isVehicle);
  const selectedParts = selectedItems.filter((i) => !i.isVehicle);

  const partsCashTotal = selectedParts.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );
  const motoCashTotal = selectedMotorcycles
    .filter((m) => m.purchaseMethod === "cash")
    .reduce((acc, i) => acc + i.price, 0);

  const shippingFee =
    selectedParts.length > 0 && shippingInfo?.fulfillmentMethod === "delivery"
      ? 350
      : 0;
  const cashGrandTotal = partsCashTotal + motoCashTotal + shippingFee;

  const handlePlaceOrder = () => {
    const items = selectedItems.map((i) => ({
      productId: i.productId,
      quantity: i.isVehicle ? 1 : i.quantity,
      purchaseMethod: i.isVehicle ? i.purchaseMethod : "cash",
      termMonths: i.termMonths || 12,
    }));

    dispatch(
      submitCheckout({
        checkoutSessionId: sessionId,
        items,
        shippingInfo,
        paymentMethod,
      })
    ).then(() => {
      // After success, remove session ID so next checkout gets a fresh one
      sessionStorage.removeItem("mcCheckoutSessionId");
    });
  };

  // Clear only successfully processed items after checkout
  useEffect(() => {
    if (success && results) {
      const responseData = results?.data || results || {};
      const checkoutResults = responseData.results || [];
      const successfulProductIds = new Set(
        checkoutResults
          .filter((r) => r.status === "success")
          .map((r) => r.productId)
      );
      if (successfulProductIds.size > 0) {
        const itemIdsToRemove = cartItems
          .filter((item) => successfulProductIds.has(item.productId))
          .map((item) => item.cartItemId);
        if (itemIdsToRemove.length > 0) {
          dispatch(clearSuccessfulItems(itemIdsToRemove));
        }
      }
    }
  }, [success, results]);

  // After success, render results breakdown
  if (success && results) {
    const responseData = results?.data || results || {};
    const checkoutResults = responseData.results || [];
    const summaryData = responseData.summary || {};
    const sessionRef = summaryData.sessionId || responseData.sessionId || sessionId;

    return (
      <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans">
        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="pb-4 border-b border-zinc-900">
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Order Submitted
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              Checkout session: {sessionRef}
            </p>
          </div>

          <div className="space-y-4">
            {checkoutResults.length > 0 ? (
              checkoutResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`border rounded-md p-4 flex items-start gap-4 ${
                    r.status === "success"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                      r.status === "success"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {r.status === "success" ? "✓" : "✗"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{r.productName || "Motorcycle / Order Item"}</p>
                    {r.status === "success" ? (
                      <>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {r.type === "order" ? (
                            <>
                              Order placed —{" "}
                              <span className="font-mono font-semibold text-emerald-800">
                                {r.reference}
                              </span>
                            </>
                          ) : (
                            <>
                              Installment application submitted —{" "}
                              <span className="font-mono font-semibold text-amber-800">
                                {r.reference}
                              </span>
                              <span className="ml-2 text-[11px] bg-amber-100 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                                Pending Review
                              </span>
                            </>
                          )}
                        </p>
                        {r.type === "application" && (
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Your application will be reviewed by our team. You will
                            be notified of the decision.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-red-700 mt-0.5">{r.error}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-emerald-200 bg-emerald-50/40 p-4 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                  <span>Transaction Confirmed</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Your purchase request has been submitted to the MotorCycled system. You can review your invoice, download receipts, and monitor approval status in your customer portal.
                </p>
              </div>
            )}
          </div>

          {checkoutResults.some((r) => r.status === "error") && (
            <div className="border border-amber-200 bg-amber-50 rounded-md p-3 text-xs text-amber-800">
              Some items could not be processed. They remain in your cart — please
              review and try again.
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/orders"
              onClick={() => dispatch(resetCheckout())}
              className="h-9 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center"
            >
              View My Orders →
            </Link>
            {results.results?.some((r) => r.status === "error") && (
              <Link
                to="/cart"
                onClick={() => dispatch(resetCheckout())}
                className="h-9 px-5 rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition-colors cursor-pointer inline-flex items-center"
              >
                ← Back to Cart
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-zinc-600">No items selected for checkout.</p>
          <Link to="/cart" className="text-emerald-700 text-xs font-semibold hover:underline">
            ← Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Progress */}
        <div className="pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-2">
            <span>Cart</span>
            <span>→</span>
            <span>Shipping</span>
            <span>→</span>
            <span className="text-zinc-900 font-semibold">Review & Pay</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Confirm Your Order
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review everything before placing your order. Backend will
            independently verify all prices and availability.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-md p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Motorcycles section */}
        {selectedMotorcycles.length > 0 && (
          <ScrollReveal threshold={0.05} duration={400}>
            <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Motorcycles ({selectedMotorcycles.length})
              </h2>
              <p className="text-[11px] text-zinc-500">
                Each motorcycle creates a separate order or application reference.
              </p>
              <div className="space-y-3">
                {selectedMotorcycles.map((item, idx) => (
                  <div
                    key={item.cartItemId}
                    className="border border-zinc-200 rounded p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.brand} • {item.category}
                      </p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="font-mono font-bold text-zinc-900 text-sm">
                        {fmt(item.price)}
                      </p>
                      {item.purchaseMethod === "installment" ? (
                        <span className="inline-block text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                          Installment — {item.termMonths || 12} months
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                          Cash Purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Parts section */}
        {selectedParts.length > 0 && (
          <ScrollReveal threshold={0.05} delay={50} duration={400}>
            <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Parts & Accessories ({selectedParts.length} items) — Cash
              </h2>
              <div className="space-y-2">
                {selectedParts.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-800">
                      {item.name}{" "}
                      <span className="text-zinc-500">× {item.quantity}</span>
                    </span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {shippingFee > 0 && (
                  <div className="flex items-center justify-between text-xs border-t border-zinc-100 pt-2">
                    <span className="text-zinc-600">Shipping fee:</span>
                    <span className="font-mono text-zinc-900">{fmt(shippingFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2">
                  <span>Parts subtotal:</span>
                  <span className="font-mono">{fmt(partsCashTotal + shippingFee)}</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Shipping summary */}
        <ScrollReveal threshold={0.05} delay={80} duration={400}>
          <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Fulfillment
              </h2>
              <Link
                to="/checkout/shipping"
                className="text-xs text-emerald-700 hover:underline font-medium"
              >
                Change
              </Link>
            </div>
            <div className="text-xs text-zinc-700 space-y-1">
              <p>
                <span className="font-semibold">Recipient:</span>{" "}
                {shippingInfo?.recipientName} · {shippingInfo?.contactNumber}
              </p>
              {shippingInfo?.fulfillmentMethod === "delivery" ? (
                <p>
                  <span className="font-semibold">Deliver to:</span>{" "}
                  {shippingInfo?.address}, {shippingInfo?.barangay},{" "}
                  {shippingInfo?.city} {shippingInfo?.postalCode}
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Pickup at:</span>{" "}
                  {shippingInfo?.branch}
                </p>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Payment method — for cash orders */}
        {(selectedMotorcycles.some((m) => m.purchaseMethod === "cash") ||
          selectedParts.length > 0) && (
          <ScrollReveal threshold={0.05} delay={100} duration={400}>
            <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Payment Method
              </h2>
              <p className="text-[11px] text-zinc-500">
                Applies to cash purchases only. Installment applications have
                their own payment process after approval.
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors text-xs ${
                      paymentMethod === pm.value
                        ? "border-emerald-400 bg-emerald-50/40"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.value}
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium text-zinc-800">{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Grand total summary */}
        <div className="border border-zinc-900 rounded-md p-4 bg-white flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Cash total (orders only):</p>
            <p className="text-xl font-extrabold font-mono text-zinc-900">
              {fmt(cashGrandTotal)}
            </p>
            {selectedMotorcycles.some((m) => m.purchaseMethod === "installment") && (
              <p className="text-[11px] text-amber-700 mt-0.5">
                + {selectedMotorcycles.filter((m) => m.purchaseMethod === "installment").length}{" "}
                installment application(s) pending approval
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handlePlaceOrder}
            className="h-11 px-8 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing…
              </>
            ) : (
              "Place Order →"
            )}
          </button>
        </div>

        <div className="flex justify-start">
          <Link
            to="/checkout/shipping"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            ← Back to Shipping
          </Link>
        </div>
      </main>
    </div>
  );
};
