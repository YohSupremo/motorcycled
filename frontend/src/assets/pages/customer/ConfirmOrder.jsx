import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { submitCheckout, resetCheckout } from "../../../actions/orderActions";
import { clearSuccessfulItems } from "../../../actions/cartActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { CheckoutStepper } from "../../components/CheckoutStepper";
import { buildPaymentSchema } from "../../schema/paymentSchema.js";
import { toast } from "react-toastify";

const generateSessionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PAYMENT_METHODS = [
  {
    value: "cash_on_releasing",
    label: "Cash on Delivery / Releasing",
    subtitle: "Pay in cash upon delivery or showroom turnover",
  },
  {
    value: "gcash",
    label: "GCash",
    subtitle: "Instant mobile wallet payment",
    badge: "Fast & Verified",
  },
  {
    value: "maya",
    label: "Maya (PayMaya)",
    subtitle: "Mobile wallet or QR payment",
  },
  {
    value: "bank_deposit",
    label: "Online Bank Transfer",
    subtitle: "Direct debit or online banking",
  },
];

const BANK_OPTIONS = [
  { code: "BDO", name: "BDO Unibank" },
  { code: "BPI", name: "Bank of the Philippine Islands" },
  { code: "UBP", name: "UnionBank" },
  { code: "Metrobank", name: "Metrobank" },
];

export const ConfirmOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems = [], shippingInfo } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading, success, results, error } = useSelector(
    (state) => state.checkout
  );

  const [paymentMethod, setPaymentMethod] = useState("cash_on_releasing");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const hasNotifiedRef = useRef(false);

  // Online Payment Input Fields
  const paymentSchema = useMemo(
    () => buildPaymentSchema(paymentMethod),
    [paymentMethod],
  );

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    control: paymentControl,
    formState: { errors: paymentErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      accountName:
        shippingInfo?.recipientName ||
        (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""),
      accountNumber: shippingInfo?.contactNumber || user?.contactNumber || "",
      referenceNumber: "",
      bankName: "BDO",
    },
  });

  const paymentForm = useWatch({ control: paymentControl });

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

  const selectedMotorcycles = useMemo(
    () => selectedItems.filter((i) => i.isVehicle),
    [selectedItems]
  );

  const selectedParts = useMemo(
    () => selectedItems.filter((i) => !i.isVehicle),
    [selectedItems]
  );

  const installmentMotorcycles = useMemo(
    () => selectedMotorcycles.filter((m) => m.purchaseMethod === "installment"),
    [selectedMotorcycles]
  );

  const cashMotorcycles = useMemo(
    () => selectedMotorcycles.filter((m) => m.purchaseMethod !== "installment"),
    [selectedMotorcycles]
  );

  const hasInstallment = installmentMotorcycles.length > 0;
  const hasMotorcycles = selectedMotorcycles.length > 0;

  // Financials
  const partsCashTotal = useMemo(
    () => selectedParts.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0),
    [selectedParts]
  );

  const motoCashTotal = useMemo(
    () => cashMotorcycles.reduce((acc, i) => acc + (i.price || 0), 0),
    [cashMotorcycles]
  );

  const installmentDownpaymentsTotal = useMemo(() => {
    return installmentMotorcycles.reduce((acc, item) => {
      const downPayment = Math.round(item.price * 0.2);
      const processingFee = 1500;
      return acc + downPayment + processingFee;
    }, 0);
  }, [installmentMotorcycles]);

  const isPartsDelivery =
    selectedParts.length > 0 &&
    (shippingInfo?.partsFulfillmentMethod === "delivery" ||
      (!selectedMotorcycles.length && shippingInfo?.fulfillmentMethod === "delivery"));

  const shippingFee = isPartsDelivery ? 350 : 0;
  // Grand total = only cash items + shipping. Installment downpayments are NOT
  // collected at checkout — they are due after admin approves the application.
  const grandTotal = partsCashTotal + motoCashTotal + shippingFee;

  const placeOrder = (data) => {
    if (!agreedTerms) {
      toast.warning("Please acknowledge and agree to the checkout terms.", {
        toastId: "agree-terms-warning",
      });
      return;
    }

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
        paymentDetails: {
          accountName: (data.accountName || "").trim(),
          accountNumber: (data.accountNumber || "").trim(),
          referenceNumber:
            (data.referenceNumber || "").trim() ||
            (paymentMethod === "gcash"
              ? `GC-${Date.now().toString().slice(-8)}`
              : paymentMethod === "maya"
              ? `MY-${Date.now().toString().slice(-8)}`
              : `BT-${Date.now().toString().slice(-8)}`),
          bankName: paymentMethod === "bank_deposit" ? data.bankName : "",
        },
      })
    ).then(() => {
      sessionStorage.removeItem("mcCheckoutSessionId");
    });
  };

  const handlePlaceOrder = () => {
    hasNotifiedRef.current = false;
    handleSubmit(placeOrder, () =>
      toast.error("Please enter your payment details before placing order.")
    )();
  };

  useEffect(() => {
    if (success && results && !hasNotifiedRef.current) {
      const responseData = results?.data || results || {};
      const checkoutResults = responseData.results || [];
      const successfulProductIds = new Set(
        checkoutResults
          .filter((r) => r.status === "success")
          .map((r) => r.productId)
      );
      if (successfulProductIds.size > 0) {
        hasNotifiedRef.current = true;
        toast.success("Order placed successfully!", {
          toastId: "order-placed-success",
        });
        const itemIdsToRemove = cartItems
          .filter((item) => successfulProductIds.has(item.productId))
          .map((item) => item.cartItemId);
        if (itemIdsToRemove.length > 0) {
          dispatch(clearSuccessfulItems(itemIdsToRemove));
        }
      }
    }
  }, [success, results, cartItems, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error || "Checkout failed. Please try again.", {
        toastId: "checkout-error",
      });
    }
  }, [error]);

  useEffect(() => {
    return () => {
      hasNotifiedRef.current = false;
      dispatch(resetCheckout());
    };
  }, [dispatch]);

  // SUCCESS RECEIPT VIEW
  if (success && results) {
    const responseData = results?.data || results || {};
    const checkoutResults = responseData.results || [];
    const isOnlinePayment = paymentMethod !== "cash_on_releasing";

    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased py-8">
        <main className="max-w-2xl mx-auto px-4 sm:px-6">
          <CheckoutStepper activeStep={3} />
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
            {/* Status Header */}
            <div className="p-8 text-center border-b border-zinc-100 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Order Confirmed
              </h1>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Thank you, your order has been received. An official electronic sales receipt has been logged.
              </p>
            </div>

            {/* Receipt Summary Body */}
            <div className="p-6 space-y-5 text-xs divide-y divide-zinc-100">
              {/* Order References */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] block">
                  Reference Numbers
                </span>
                {checkoutResults.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-zinc-600">
                      {r.type === "application" ? "Financing Application" : "Official Sales Order"}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                      {r.reference}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Details Recap */}
              <div className="pt-4 space-y-2">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] block">
                  Payment Information
                </span>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Method</span>
                  <span className="font-semibold text-zinc-900">
                    {PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label || paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Status</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isOnlinePayment
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isOnlinePayment ? "PAID (Verified Online)" : "PENDING (Pay at Showroom/COD)"}
                  </span>
                </div>

                {isOnlinePayment && (
                  <>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-600">Account Name</span>
                      <span className="font-semibold text-zinc-900">{paymentForm.accountName}</span>
                    </div>
                    {paymentForm.accountNumber && (
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-600">
                          {paymentMethod === "bank_deposit" ? "Bank Account Number" : "Mobile Number"}
                        </span>
                        <span className="font-mono text-zinc-900">{paymentForm.accountNumber}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Releasing / Destination */}
              <div className="pt-4 space-y-2">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] block">
                  Fulfillment Destination
                </span>
                <div className="text-zinc-700 space-y-0.5">
                  <p className="font-semibold text-zinc-900">{shippingInfo?.recipientName}</p>
                  <p>{shippingInfo?.contactNumber} • {shippingInfo?.email}</p>
                  {shippingInfo?.branch ? (
                    <p className="text-emerald-700 font-semibold pt-1">
                      Showroom Bay: {shippingInfo.branch}
                    </p>
                  ) : (
                    <p className="text-zinc-600 pt-1">
                      {shippingInfo?.address}, {shippingInfo?.barangay}, {shippingInfo?.city}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  dispatch(resetCheckout());
                  navigate("/orders");
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                View My Orders & Applications →
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Print Receipt
                </button>
                <Link
                  to="/shop"
                  onClick={() => dispatch(resetCheckout())}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-900 font-medium text-xs transition-colors"
                >
                  Return to Shop
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // EMPTY CHECKOUT FALLBACK
  if (selectedItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-zinc-50 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">No Items to Review</h2>
          <p className="text-xs text-zinc-500">
            Please select items in your cart before proceeding to checkout.
          </p>
          <Link
            to="/cart"
            className="inline-block w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  // MAIN REVIEW & PAYMENT FORM
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Progress Stepper Bar */}
        <CheckoutStepper activeStep={2} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (7 cols) — Unified Panel with Hairline Dividers */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl shadow-xs divide-y divide-zinc-200 overflow-hidden">
            {/* 1. Fulfillment Recap */}
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Fulfillment Information
                </span>
                <Link
                  to="/checkout/shipping"
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  Edit Details
                </Link>
              </div>

              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Recipient</span>
                  <p className="font-semibold text-zinc-900">{shippingInfo?.recipientName || "—"}</p>
                  <p className="text-zinc-500">{shippingInfo?.contactNumber} • {shippingInfo?.email}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Handover / Location</span>
                  {shippingInfo?.branch ? (
                    <p className="font-semibold text-zinc-900">{shippingInfo.branch}</p>
                  ) : (
                    <p className="font-semibold text-zinc-900">
                      {shippingInfo?.address}, {shippingInfo?.barangay}, {shippingInfo?.city}
                    </p>
                  )}
                  <p className="text-zinc-500 text-[11px]">
                    {hasMotorcycles ? "Showroom PDI & Handover" : isPartsDelivery ? "Door-to-Door Courier" : "Counter Pickup"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector & Inputs — only for cash items */}
            {grandTotal > 0 ? (
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Select Payment Method
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Choose how you want to settle your transaction.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm.value;
                    return (
                      <label
                        key={pm.value}
                        className={`relative flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.value}
                          checked={isSelected}
                          onChange={() => {
                            setPaymentMethod(pm.value);
                            clearErrors();
                          }}
                          className="mt-1 accent-zinc-900 cursor-pointer"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-900">{pm.label}</span>
                            {pm.badge && (
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                                {pm.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-500 block mt-0.5 text-[11px] leading-tight">
                            {pm.subtitle}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* DYNAMIC PAYMENT INPUT FIELDS */}
                {paymentMethod === "gcash" && (
                  <div className="mt-4 p-4.5 bg-blue-50/40 border border-blue-200 rounded-lg space-y-3.5 text-xs">
                    <div className="pb-2 border-b border-blue-100">
                      <span className="font-bold text-blue-900 text-xs block">
                        GCash Account Details
                      </span>
                      <p className="text-blue-700 text-[11px] mt-0.5">
                        Enter your registered GCash account name and mobile number to authorize payment.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          GCash Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("accountName")}
                          placeholder="e.g. Juan Dela Cruz"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                            paymentErrors.accountName ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountName && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          GCash Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          {...register("accountNumber")}
                          placeholder="0917 123 4567"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                            paymentErrors.accountNumber ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountNumber && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "maya" && (
                  <div className="mt-4 p-4.5 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3.5 text-xs">
                    <div className="pb-2 border-b border-emerald-100">
                      <span className="font-bold text-emerald-950 text-xs block">
                        Maya (PayMaya) Account Details
                      </span>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Enter your registered Maya account name and mobile number to authorize payment.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Maya Registered Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("accountName")}
                          placeholder="e.g. Juan Dela Cruz"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                            paymentErrors.accountName ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountName && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Maya Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          {...register("accountNumber")}
                          placeholder="0918 902 1145"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                            paymentErrors.accountNumber ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountNumber && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "bank_deposit" && (
                  <div className="mt-4 p-4.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3.5 text-xs">
                    <div className="pb-2 border-b border-zinc-200">
                      <span className="font-bold text-zinc-900 text-xs block">
                        Link Bank Account
                      </span>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        Select your bank and enter your account information to link and authorize payment.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Select Your Bank <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {BANK_OPTIONS.map((bk) => (
                          <button
                            type="button"
                            key={bk.code}
                            onClick={() => setValue("bankName", bk.code, { shouldValidate: true })}
                            className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                              paymentForm.bankName === bk.code
                                ? "bg-white border-zinc-900 ring-1 ring-zinc-900 font-bold text-zinc-900 shadow-xs"
                                : "bg-white/60 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            }`}
                          >
                            <span className="block text-xs font-bold">{bk.code}</span>
                            <span className="block text-[10px] text-zinc-500 truncate mt-0.5">{bk.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("accountName")}
                          placeholder="Full name on bank account"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                            paymentErrors.accountName ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountName && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          Sender Bank Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("accountNumber")}
                          placeholder="e.g. 0012 3456 7890"
                          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 font-mono ${
                            paymentErrors.accountNumber ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                          }`}
                        />
                        {paymentErrors.accountNumber && (
                          <p className="text-[11px] text-red-600 mt-1">{paymentErrors.accountNumber.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "cash_on_releasing" && (
                  <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-zinc-900">
                      Pay at Dealership Cashier or Upon Delivery
                    </p>
                    <p className="text-zinc-500">
                      No advance payment required today. Your order status will be marked as{" "}
                      <span className="font-semibold text-amber-800">Pending Payment</span> until you complete settlement in cash or debit card during unit turnover.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Installment-only cart — no payment needed at checkout */
              <div className="p-6">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-amber-950">No Payment Required at Checkout</p>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Your application will be submitted for credit review. Once admin approves it, you will be prompted on your <strong>Orders &amp; Applications</strong> page to choose how you'll pay the downpayment (GCash, Maya, bank transfer, or cash at branch). No money is collected today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. In-House Financing Summary (if installment item exists) */}
            {hasInstallment && (
              <div className="p-6 bg-amber-50/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                  Financing Schedule Summary
                </span>
                {installmentMotorcycles.map((item) => {
                  const downPayment = Math.round(item.price * 0.2);
                  const financedPrincipal = item.price - downPayment;
                  const rate = 0.07;
                  const monthlyPayment = Math.round((financedPrincipal * (1 + rate)) / (item.termMonths || 12));

                  return (
                    <div key={item.cartItemId} className="bg-white border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex justify-between font-semibold text-zinc-900">
                        <span>{item.name}</span>
                        <span className="font-mono text-amber-900">
                          {fmt(monthlyPayment)}/mo ({item.termMonths || 12} mos)
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-500 text-[11px]">
                        <span>20% Downpayment Due: {fmt(downPayment)}</span>
                        <span>Processing Fee: ₱1,500</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Dealership Terms Agreement & Actions */}
            <div className="p-6 bg-zinc-50 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className="text-xs text-zinc-600 leading-relaxed">
                  I confirm that all fulfillment and payment information provided is accurate and authentic. I understand and agree to the dealership terms of purchase and warranty policies.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/checkout/shipping"
                  className="w-full sm:w-auto px-5 py-3 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-semibold text-sm rounded-lg transition-colors text-center inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Fulfillment
                </Link>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-xs text-center"
                >
                  {loading
                    ? "Processing..."
                    : grandTotal > 0
                    ? `Place Order • ${fmt(grandTotal)}`
                    : "Submit Application →"}
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-bold text-sm text-zinc-900">
                  Order Summary ({selectedItems.length} {selectedItems.length === 1 ? "item" : "items"})
                </h3>
                <Link to="/checkout/shipping" className="text-xs text-emerald-700 hover:underline font-semibold">
                  Review Details
                </Link>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div key={item.cartItemId || item.productId} className="py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <ProductImagePlaceholder
                          name={item.name}
                          category={item.isVehicle ? "motorcycle" : "parts"}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {item.isVehicle
                          ? item.purchaseMethod === "installment"
                            ? `${item.termMonths || 12}-Mo Financing`
                            : "Full Cash SRP"
                          : `Qty: ${item.quantity}`}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-semibold text-zinc-900 shrink-0">
                      {fmt(item.price * (item.isVehicle ? 1 : item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs">
                {partsCashTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Parts & Accessories Subtotal</span>
                    <span className="font-mono text-zinc-900">{fmt(partsCashTotal)}</span>
                  </div>
                )}

                {motoCashTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Motorcycle Cash Subtotal</span>
                    <span className="font-mono text-zinc-900">{fmt(motoCashTotal)}</span>
                  </div>
                )}

                {installmentDownpaymentsTotal > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Financing Downpayment</span>
                    <span className="font-mono">{fmt(installmentDownpaymentsTotal)}</span>
                  </div>
                )}
                {installmentDownpaymentsTotal > 0 && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Downpayment is <strong>not due today</strong>. You will be prompted to submit payment after admin reviews and approves your application.
                  </p>
                )}

                <div className="flex justify-between text-zinc-600">
                  <span>Logistics & Freight</span>
                  <span className="font-mono text-zinc-900">
                    {shippingFee > 0 ? fmt(shippingFee) : "Free (Pickup)"}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-100">
                  <span>Total Due Today</span>
                  <span className="font-mono text-emerald-700">
                    {grandTotal > 0 ? fmt(grandTotal) : hasInstallment && grandTotal === 0 ? "₱0.00" : fmt(grandTotal)}
                  </span>
                </div>
                {hasInstallment && grandTotal === 0 && (
                  <p className="text-[10px] text-zinc-500 text-center">
                    No payment due now — downpayment collected after approval.
                  </p>
                )}
              </div>

              {/* Guarantees */}
              <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Secure Dealership Transaction Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Official Dealer Sales Invoice Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
