import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
} from "@mui/material";
import { submitCheckout, resetCheckout } from "../../../actions/orderActions";
import { clearSuccessfulItems } from "../../../actions/cartActions";
import { toast } from "react-toastify";

const CHECKOUT_STEPS = ["Cart", "Fulfillment & Verification", "Review & Terms", "Complete"];

const generateSessionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_METHODS = [
  {
    value: "cash_on_releasing",
    label: "Cash on Releasing / Over-the-Counter",
    desc: "Pay in cash or debit card at the dealership cashier during showroom turnover.",
  },
  {
    value: "bank_deposit",
    label: "Bank Deposit / Official Wire Transfer",
    desc: "Direct bank transfer to official MotorCycled Dealership corporate accounts (BDO / BPI).",
  },
  {
    value: "gcash",
    label: "GCash QR / Merchant Transfer",
    desc: "Instant verified mobile payment via official dealership GCash QR merchant code.",
  },
  {
    value: "maya",
    label: "Maya (PayMaya) / Card Checkout",
    desc: "Scan-to-pay via Maya QR or online wallet transfer.",
  },
];

const INTEREST_RATES = { 12: 0.07, 24: 0.08, 36: 0.09 };
const PROCESSING_FEE = 1500;

function computeFinancing(price, termMonths = 12) {
  const rate = INTEREST_RATES[termMonths] || 0.07;
  const downPayment = Math.round(price * 0.2);
  const financedAmount = price - downPayment;
  const monthlyPayment = Math.round((financedAmount * (1 + rate)) / termMonths);
  const totalRepayment = downPayment + monthlyPayment * termMonths + PROCESSING_FEE;
  const totalDownpaymentDue = downPayment + PROCESSING_FEE;
  return {
    rate,
    downPayment,
    financedAmount,
    monthlyPayment,
    processingFee: PROCESSING_FEE,
    totalDownpaymentDue,
    totalRepayment,
  };
}

export const ConfirmOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems = [], shippingInfo } = useSelector((state) => state.cart);
  const { loading, success, results, error } = useSelector(
    (state) => state.checkout
  );

  const [paymentMethod, setPaymentMethod] = useState("cash_on_releasing");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedInspection, setAgreedInspection] = useState(false);

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
  const hasCashItems = cashMotorcycles.length > 0 || selectedParts.length > 0;

  const partsCashTotal = useMemo(
    () => selectedParts.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [selectedParts]
  );

  const motoCashTotal = useMemo(
    () => cashMotorcycles.reduce((acc, i) => acc + i.price, 0),
    [cashMotorcycles]
  );

  const isPartsDelivery =
    selectedParts.length > 0 &&
    (shippingInfo?.partsFulfillmentMethod === "delivery" ||
      (!selectedMotorcycles.length && shippingInfo?.fulfillmentMethod === "delivery"));

  const shippingFee = isPartsDelivery ? 350 : 0;

  const immediateCashTotal = partsCashTotal + motoCashTotal + shippingFee;

  const installmentDownpaymentsTotal = useMemo(() => {
    return installmentMotorcycles.reduce((acc, item) => {
      const f = computeFinancing(item.price, item.termMonths || 12);
      return acc + f.totalDownpaymentDue;
    }, 0);
  }, [installmentMotorcycles]);

  const handlePlaceOrder = () => {
    if ((hasInstallment || selectedMotorcycles.length > 0) && (!agreedTerms || !agreedInspection)) {
      toast.warning("Please acknowledge the dealership policies and PDI inspection agreement.");
      return;
    }

    const items = selectedItems.map((i) => ({
      productId: i.productId,
      quantity: i.isVehicle ? 1 : i.quantity,
      purchaseMethod: i.isVehicle ? i.purchaseMethod : "cash",
      termMonths: i.termMonths || 12,
    }));

    const documentUploads = {
      verificationMethod: shippingInfo?.verificationMethod || "showroom_physical",
      idCard: shippingInfo?.idCardPreview ? { url: shippingInfo.idCardPreview } : null,
      proofOfIncome: shippingInfo?.proofOfIncomePreview ? { url: shippingInfo.proofOfIncomePreview } : null,
    };

    dispatch(
      submitCheckout({
        checkoutSessionId: sessionId,
        items,
        shippingInfo,
        paymentMethod,
        documentUploads,
      })
    ).then(() => {
      sessionStorage.removeItem("mcCheckoutSessionId");
    });
  };

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
        toast.success("Order and financing application submitted successfully.");
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
      toast.error(error || "Checkout failed. Please try again.");
    }
  }, [error]);

  // SUCCESS VIEW: Premium Dealership Dossier
  if (success && results) {
    const responseData = results?.data || results || {};
    const checkoutResults = responseData.results || [];

    const successfulApps = checkoutResults.filter(
      (r) => r.status === "success" && r.type === "application"
    );
    const successfulOrders = checkoutResults.filter(
      (r) => r.status === "success" && r.type === "order"
    );

    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col font-sans">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          
          {/* MUI Stepper (Step 4: Complete) */}
          <Box sx={{ width: "100%", pb: 1 }}>
            <Stepper activeStep={3} alternativeLabel>
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
          
          {/* Hero Banner */}
          <div className="bg-emerald-900 text-white rounded-3xl p-8 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold">
                Official Dealership Confirmation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {successfulApps.length > 0 && successfulOrders.length === 0
                ? "Financing Application Successfully Lodged"
                : "Transaction Confirmed"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Your documentation has been received by MotorCycled Central Operations. Our releasing officer will coordinate with you regarding vehicle handover.
            </p>
          </div>

          {/* Applications Dossier */}
          {successfulApps.length > 0 && (
            <div className="space-y-4">
              {successfulApps.map((app, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        In-House Motorcycle Financing Dossier
                      </span>
                      <h2 className="text-lg font-extrabold text-zinc-900 mt-1">
                        {app.productName || "Certified Showroom Motorcycle"}
                      </h2>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-mono font-extrabold text-amber-950 text-sm block">
                        {app.reference}
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold">
                        Status: Under Credit Investigation (CI)
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Visual Roadmap */}
                  <div>
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide block mb-2">
                      Operational Workflow Roadmap:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                          1. Application Filed
                          <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                        <p className="text-[10px] text-zinc-600">KYC profile logged in dealer database.</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-amber-900 block text-[11px]">2. CI Phone Call</span>
                        <p className="text-[10px] text-zinc-600">Loan officer calls you within 24–48 hours.</p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-zinc-800 block text-[11px]">3. Branch Appearance</span>
                        <p className="text-[10px] text-zinc-600">Sign loan agreement & settle 20% downpayment.</p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-zinc-800 block text-[11px]">4. PDI & Turnover</span>
                        <p className="text-[10px] text-zinc-600">Pre-delivery inspection & vehicle drive-out.</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Checklist */}
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-2 text-xs">
                    <span className="font-bold text-zinc-900 block">
                       Documents to Bring for Showroom Releasing:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-600 text-[11px]">
                      <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg><span>2 Valid Philippine Government IDs (Original + Photocopies)</span></div>
                      <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg><span>Latest 3 Months Proof of Income / Payslips / ITR</span></div>
                      <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg><span>Proof of Residential Billing (Meralco / Water / Telco)</span></div>
                      <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg><span>Downpayment funds ready upon contract execution</span></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-zinc-500">
                    <span>Releasing Showroom: <strong className="text-zinc-900">{shippingInfo?.branch}</strong></span>
                    <span>Applicant: <strong className="text-zinc-900">{shippingInfo?.recipientName}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cash Orders */}
          {successfulOrders.length > 0 && (
            <div className="space-y-3">
              {successfulOrders.map((ord, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Cash Order Confirmed
                      </span>
                      <h3 className="font-bold text-zinc-900 text-sm mt-1">{ord.productName || "Order Products"}</h3>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 text-sm">{ord.reference}</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Settlement: <strong className="text-zinc-900 uppercase">{paymentMethod.replace(/_/g, " ")}</strong> • Fulfillment: <strong className="text-zinc-900">{shippingInfo?.partsFulfillmentMethod === "delivery" ? `Doorstep Courier Delivery to ${shippingInfo?.city || "your home"}` : `Pickup at ${shippingInfo?.branch}`}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="contained"
                onClick={() => {
                  dispatch(resetCheckout());
                  navigate("/orders");
                }}
                sx={{
                  bgcolor: "#059669",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 4,
                  py: 1.3,
                  borderRadius: "10px",
                  "&:hover": { bgcolor: "#047857" },
                }}
              >
                View My Orders & Applications →
              </Button>

              <button
                type="button"
                onClick={() => window.print()}
                className="border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Print / Save Copy
              </button>
            </div>

            <Link
              to="/shop"
              onClick={() => dispatch(resetCheckout())}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold"
            >
              Browse Showroom Catalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // EMPTY CHECKOUT FALLBACK
  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-zinc-900">No Items to Review</h2>
          <p className="text-xs text-zinc-500">Please choose items in your shopping cart before checkout.</p>
          <Link
            to="/cart"
            className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors"
          >
            ← Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  // MAIN REVIEW & AUTHORIZATION FORM
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* MUI Stepper (Step 3: Review & Terms) */}
        <Box sx={{ width: "100%", pb: 1 }}>
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

        {/* Page Sub-header Toolbar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Review & Authorize Order
              </h1>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Step 3 of 3
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Verify your financing breakdown, payment arrangements, and dealership handover protocols.
            </p>
          </div>

          <Link
            to="/checkout/shipping"
            className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold self-start sm:self-auto transition-colors"
          >
            ← Back to Fulfillment
          </Link>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Review Cards & Agreements (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* FINANCING MOTORCYCLES DOSSIER */}
            {installmentMotorcycles.length > 0 && (
              <div className="space-y-4">
                {installmentMotorcycles.map((item) => {
                  const fin = computeFinancing(item.price, item.termMonths || 12);
                  return (
                    <div
                      key={item.cartItemId}
                      className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-zinc-100 gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            In-House Motorcycle Financing Schedule
                          </span>
                          <h2 className="text-lg font-extrabold text-zinc-900 mt-1">
                            {item.name}
                          </h2>
                          <p className="text-xs text-zinc-500">
                            {item.brand} • {item.termMonths || 12}-Month In-House Loan Schedule
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-zinc-400 block font-mono">Cash SRP</span>
                          <span className="font-mono font-extrabold text-zinc-900 text-lg">
                            {fmt(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Loan Metrics Grid */}
                      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                          <span className="font-bold text-zinc-900 uppercase text-[11px]">
                            Financing Structure & Amortization
                          </span>
                          <span className="font-mono text-zinc-500 text-[10px]">
                            Rate: {(fin.rate * 100).toFixed(0)}% add-on
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-white rounded-lg p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">20% Downpayment</span>
                            <span className="font-mono font-bold text-zinc-900">{fmt(fin.downPayment)}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Processing & LTO</span>
                            <span className="font-mono font-bold text-zinc-900">{fmt(fin.processingFee)}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Financed Principal</span>
                            <span className="font-mono font-bold text-zinc-900">{fmt(fin.financedAmount)}</span>
                          </div>
                          <div className="bg-amber-100 rounded-lg p-2.5 border border-amber-300">
                            <span className="text-[10px] text-amber-900 block font-mono uppercase font-bold">Monthly Payment</span>
                            <span className="font-mono font-extrabold text-amber-950 text-sm">
                              {fmt(fin.monthlyPayment)}/mo
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pt-1 border-t border-zinc-200">
                          <span className="font-bold text-zinc-900">
                            Total Downpayment Payable upon Releasing at Showroom:
                          </span>
                          <span className="font-mono font-extrabold text-amber-950 text-sm bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                            {fmt(fin.totalDownpaymentDue)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                        <span className="font-bold font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">INFO</span>
                        <span><strong>Zero Upfront Payment Today:</strong> Your downpayment ({fmt(fin.totalDownpaymentDue)}) is settled at your chosen showroom upon credit approval and physical unit turnover.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CASH PURCHASES BREAKDOWN */}
            {(cashMotorcycles.length > 0 || selectedParts.length > 0) && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 className="font-extrabold text-zinc-900 text-base">
                    Outright Cash Items
                  </h3>
                  <span className="text-xs font-mono font-bold text-zinc-900">
                    Total: {fmt(immediateCashTotal)}
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 text-xs">
                  {cashMotorcycles.map((item) => (
                    <div key={item.cartItemId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 block">{item.name}</span>
                        <span className="text-zinc-500 text-[11px]">{item.brand} • Full Cash Purchase</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900">{fmt(item.price)}</span>
                    </div>
                  ))}

                  {selectedParts.map((item) => (
                    <div key={item.cartItemId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 block">{item.name}</span>
                        <span className="text-zinc-500 text-[11px]">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  {shippingFee > 0 && (
                    <div className="py-2.5 flex items-center justify-between text-zinc-600">
                      <span>Parts Courier Freight:</span>
                      <span className="font-mono font-bold text-zinc-900">{fmt(shippingFee)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide block">
                    Choose Settlement Method for Cash Items:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.value}
                        className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all ${
                          paymentMethod === pm.value
                            ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethodRadio"
                          value={pm.value}
                          checked={paymentMethod === pm.value}
                          onChange={() => setPaymentMethod(pm.value)}
                          className="mt-0.5 accent-emerald-600 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 text-xs block">{pm.label}</span>
                          <span className="text-[10px] text-zinc-500 leading-tight block mt-0.5">{pm.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FULFILLMENT & PURCHASER RECAP */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-extrabold text-zinc-900 text-base">
                  Releasing & Ownership Verification
                </h3>
                <Link to="/checkout/shipping" className="text-xs text-emerald-700 hover:underline font-bold">
                  Edit ↗
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Verified Purchaser</span>
                  <p className="font-bold text-zinc-900 text-sm">{shippingInfo?.recipientName}</p>
                  <p className="text-zinc-600">{shippingInfo?.contactNumber} • {shippingInfo?.email}</p>
                  {hasInstallment && (
                    <div className="pt-2 mt-1 border-t border-zinc-200 text-[11px] space-y-0.5">
                      <p className="text-zinc-700 font-semibold">
                        Livelihood: {shippingInfo?.employmentStatus}
                      </p>
                      <p className="text-zinc-500">
                        Employer/Source: {shippingInfo?.employerName || "Registered Source"} ({shippingInfo?.yearsEmployed || "Active"})
                      </p>
                      <p className="text-zinc-500 font-mono">
                        Primary Income: {shippingInfo?.monthlyIncome}
                        {shippingInfo?.secondaryIncomeSource && !shippingInfo.secondaryIncomeSource.startsWith("None")
                          ? ` • Secondary: ${shippingInfo.secondaryIncomeSource} (${shippingInfo.secondaryIncomeAmount || "Supplementary"})`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Logistics Routing</span>
                  
                  {selectedMotorcycles.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-900 block text-xs">Dealership Showroom Releasing Bay:</span>
                      <p className="text-zinc-700 font-semibold">{shippingInfo?.branch}</p>
                      <p className="text-[11px] text-emerald-800 font-semibold">Includes Pre-Delivery Inspection (PDI) & LTO Turnover</p>
                    </div>
                  )}

                  {selectedParts.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 space-y-0.5">
                      <span className="font-bold text-zinc-900 block text-xs">Parts Dispatch:</span>
                      {shippingInfo?.partsFulfillmentMethod === "delivery" ? (
                        <>
                          <p className="font-semibold text-zinc-800">Door-to-Door Courier Delivery (₱350 Freight)</p>
                          <p className="text-zinc-600 text-[11px]">
                            {shippingInfo?.address}, {shippingInfo?.barangay}, {shippingInfo?.city} {shippingInfo?.postalCode ? `(${shippingInfo?.postalCode})` : ""}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-zinc-800">Showroom Counter Pickup (FREE)</p>
                          <p className="text-zinc-600 text-[11px]">Collect together at: {shippingInfo?.branch}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MANDATORY SAFEGUARD AGREEMENTS */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide block">
                Dealership Agreements & Acknowledgments:
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                  />
                  <span className="text-zinc-700 leading-relaxed text-[11px]">
                    I certify that all identification and purchaser details provided are authentic and correct. For financing applications, I consent to standard credit evaluation (CI) and phone verification.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedInspection}
                    onChange={(e) => setAgreedInspection(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                  />
                  <span className="text-zinc-700 leading-relaxed text-[11px]">
                    I understand that motorcycle units require in-person releasing, Pre-Delivery Inspection (PDI) sign-off, and presentation of valid government IDs at the authorized showroom.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Financial Summary & Checkout Action (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-extrabold text-zinc-900 text-base">
                  Financial Authorization
                </h3>
                <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Live Stock Reserved
                </span>
              </div>

              {/* Tally Breakdown */}
              <div className="space-y-2 text-xs text-zinc-600 divide-y divide-zinc-100">
                {hasInstallment && !hasCashItems ? (
                  <div className="pt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Upfront Charge Today:</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ₱0.00
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-800 font-semibold">
                      <span>Downpayment on Releasing:</span>
                      <span className="font-mono font-bold text-zinc-900">{fmt(installmentDownpaymentsTotal)}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 pt-1">
                      {installmentMotorcycles.length} Financing Dossier(s) will be submitted for 24-hr credit underwriting.
                    </p>
                  </div>
                ) : hasInstallment && hasCashItems ? (
                  <div className="pt-1 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-zinc-900">
                      <span>Immediate Cash Due:</span>
                      <span className="font-mono text-lg font-extrabold text-zinc-900">{fmt(immediateCashTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-600">
                      <span>Downpayment on Release:</span>
                      <span className="font-mono font-bold text-zinc-900">{fmt(installmentDownpaymentsTotal)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex justify-between items-center text-sm font-bold text-zinc-900">
                    <span>Total Cash Payable:</span>
                    <span className="font-mono text-2xl font-extrabold text-zinc-900">{fmt(immediateCashTotal)}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={loading || ((hasInstallment || selectedMotorcycles.length > 0) && (!agreedTerms || !agreedInspection))}
                onClick={handlePlaceOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Processing Submission…</span>
                ) : hasInstallment && !hasCashItems ? (
                  <span>Submit Financing Application →</span>
                ) : hasInstallment ? (
                  <span>Place Order & Submit Financing →</span>
                ) : (
                  <span>Place Cash Order →</span>
                )}
              </button>

              {/* Dealership Assurances */}
              <div className="pt-4 border-t border-zinc-100 space-y-2 text-[11px] text-zinc-600">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Official LTO Registration Liaison Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Certified OEM Manufacturer Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Pre-Delivery Inspection (PDI) at Releasing Bay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
