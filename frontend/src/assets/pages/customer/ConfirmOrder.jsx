import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import { submitCheckout, resetCheckout } from "../../../actions/orderActions";
import { clearSuccessfulItems } from "../../../actions/cartActions";
import { toast } from "react-toastify";
import { ScrollReveal } from "../../components/ScrollReveal";

const generateSessionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const CHECKOUT_STEPS = ["Cart", "Fulfillment & Shipping", "Review & Pay", "Complete"];

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
        toast.success("Order / Financing application submitted successfully!", {
          icon: "🎉",
        });
        const itemIdsToRemove = cartItems
          .filter((item) => successfulProductIds.has(item.productId))
          .map((item) => item.cartItemId);
        if (itemIdsToRemove.length > 0) {
          dispatch(clearSuccessfulItems(itemIdsToRemove));
        }
      }
    }
  }, [success, results]);

  useEffect(() => {
    if (error) {
      toast.error(error || "Checkout failed. Please try again.", { icon: "❌" });
    }
  }, [error]);

  // After success, render results breakdown
  if (success && results) {
    const responseData = results?.data || results || {};
    const checkoutResults = responseData.results || [];
    const summaryData = responseData.summary || {};
    const sessionRef = summaryData.sessionId || responseData.sessionId || sessionId;

    return (
      <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans">
        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* MUI Stepper on Completion */}
          <Box sx={{ width: "100%", pb: 2 }}>
            <Stepper activeStep={3} alternativeLabel>
              {CHECKOUT_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      },
                      "& .Mui-completed": {
                        color: "#059669 !important",
                        fontWeight: 700,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

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
            <Button
              variant="contained"
              onClick={() => {
                dispatch(resetCheckout());
                navigate("/orders");
              }}
              sx={{
                bgcolor: "#18181b",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 3,
                py: 1,
                "&:hover": { bgcolor: "#27272a" },
              }}
            >
              View My Orders →
            </Button>
            {results.results?.some((r) => r.status === "error") && (
              <Button
                variant="outlined"
                onClick={() => {
                  dispatch(resetCheckout());
                  navigate("/cart");
                }}
                sx={{
                  borderColor: "#d4d4d8",
                  color: "#3f3f46",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  "&:hover": { borderColor: "#a1a1aa", bgcolor: "#f4f4f5" },
                }}
              >
                ← Back to Cart
              </Button>
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
        {/* MUI Stepper (20pts requirement) */}
        <Box sx={{ width: "100%", pb: 2 }}>
          <Stepper activeStep={2} alternativeLabel>
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

        {/* Progress & Header */}
        <div className="pb-4 border-b border-zinc-900">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Confirm Your Order
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review everything before placing your order. Backend independently verifies all prices and live inventory.
          </p>
        </div>

        {/* Error banner via MUI Alert */}
        {error && (
          <Alert severity="error" variant="filled" sx={{ borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
            {error}
          </Alert>
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
        <div className="border border-zinc-900 rounded-md p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <Button
            type="button"
            variant="contained"
            disabled={loading}
            onClick={handlePlaceOrder}
            sx={{
              bgcolor: "#059669",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              px: 4,
              py: 1.2,
              borderRadius: "6px",
              boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
              "&:hover": { bgcolor: "#047857" },
              "&:disabled": { bgcolor: "#d4d4d8", color: "#a1a1aa" },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} sx={{ color: "#ffffff" }} />
                <span>Processing Order…</span>
              </Box>
            ) : (
              "Place Order →"
            )}
          </Button>
        </div>

        <div className="flex justify-start">
          <Button
            variant="text"
            onClick={() => navigate("/checkout/shipping")}
            sx={{
              color: "#059669",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              "&:hover": { bgcolor: "#ecfdf5", textDecoration: "underline" },
            }}
          >
            ← Back to Shipping
          </Button>
        </div>
      </main>
    </div>
  );
};
