import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyOrders, payInstallmentAmortization } from "../../../actions/orderActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { ScrollReveal } from "../../components/ScrollReveal";
import { toast } from "react-toastify";

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const statusColor = (s) => {
  const map = {
    pending: "bg-zinc-100 text-zinc-700 border-zinc-300",
    processing: "bg-blue-50 text-blue-800 border-blue-200",
    ready_for_pickup: "bg-amber-50 text-amber-800 border-amber-200",
    shipped: "bg-sky-50 text-sky-800 border-sky-200",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    canceled: "bg-red-50 text-red-700 border-red-200",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    "for approval": "bg-amber-50 text-amber-800 border-amber-200",
  };
  return map[s?.toLowerCase()] || "bg-zinc-100 text-zinc-600 border-zinc-200";
};

const StatusBadge = ({ label }) => (
  <span
    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${statusColor(
      label
    )}`}
  >
    {label}
  </span>
);

const generatePaymentRef = () => `MP-${Math.floor(100000 + Math.random() * 900000)}`;

export const Orders = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("all");

  const { loading, orders = [], applications = [], error } = useSelector(
    (state) => state.myOrders
  );

  // Installment Payment Modal State
  const [payingApp, setPayingApp] = useState(null);
  const [payMethod, setPayMethod] = useState("gcash");
  const [refNumber, setRefNumber] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    dispatch(getMyOrders());
  }, [dispatch]);

  const shownOrders =
    activeTab === "all" || activeTab === "orders" ? orders : [];
  const shownApplications =
    activeTab === "all" || activeTab === "applications" ? applications : [];

  const handleOpenPayment = (app) => {
    setPayingApp(app);
    setPayMethod("gcash");
    setRefNumber(generatePaymentRef());
  };

  const handleConfirmInstallmentPayment = async (e) => {
    e.preventDefault();
    if (!payingApp) return;

    setSubmittingPay(true);
    const res = await dispatch(
      payInstallmentAmortization(payingApp._id, {
        paymentMethod: payMethod,
        referenceNumber: refNumber,
      })
    );
    setSubmittingPay(false);

    if (res?.success) {
      toast.success(
        `Installment #${(payingApp.installmentsPaid || 0) + 1} settled successfully.`
      );
      setPayingApp(null);
    } else {
      toast.error(res?.message || "Failed to process installment payment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-8 h-8 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-xs font-mono text-zinc-400">
            Loading orders & applications…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              My Orders & Financing Applications
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Track your cash purchases, in-house motorcycle loan applications, and monthly installment amortization schedules.
            </p>
          </div>
          <div className="flex items-center gap-1 border border-zinc-200 p-0.5 rounded-xl bg-white text-xs font-medium self-start sm:self-auto shadow-2xs">
            {[
              { key: "all", label: "All Records" },
              { key: "orders", label: `Cash Orders (${orders.length})` },
              { key: "applications", label: `Financing Loans (${applications.length})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === t.key
                    ? "bg-zinc-900 text-white font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 1: CASH ORDERS                                         */}
        {/* ────────────────────────────────────────────────────────────── */}
        {shownOrders.length > 0 && (
          <ScrollReveal threshold={0.05} duration={500}>
            <section className="space-y-4">
              <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                Cash Purchases & Deliveries
              </h2>
              {shownOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-2xs"
                >
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-zinc-50/80 border-b border-zinc-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-zinc-900 text-sm">
                        {order.orderNumber}
                      </span>
                      <StatusBadge label={order.orderStatus} />
                      <StatusBadge label={order.paymentStatus} />
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {new Date(order.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="px-5 py-4 space-y-3">
                    {order.orderItems?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-xs"
                      >
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ProductImagePlaceholder
                              category={item.itemType}
                              name={item.name}
                              compact
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-zinc-500">
                            {fmt(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-mono font-bold text-zinc-900 shrink-0">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order footer */}
                  <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-zinc-500 space-y-0.5">
                      <p>
                        <span className="font-semibold text-zinc-700">Settlement:</span>{" "}
                        {order.paymentMethod?.replace(/_/g, " ").toUpperCase()}
                      </p>
                      {order.shippingInfo?.fulfillmentMethod === "delivery" ? (
                        <p>
                          <span className="font-semibold text-zinc-700">
                            Doorstep Courier:
                          </span>{" "}
                          {order.shippingInfo?.address}, {order.shippingInfo?.city} (₱{order.shippingPrice || 0} Freight)
                        </p>
                      ) : (
                        <p>
                          <span className="font-semibold text-zinc-700">
                            Showroom Pickup:
                          </span>{" "}
                          {order.shippingInfo?.branch}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <a
                        href={`http://localhost:4001/api/v1/order/${order._id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Official Receipt</span>
                        <span>↗</span>
                      </a>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 font-mono">Order Total</p>
                        <p className="font-mono font-bold text-zinc-900 text-base">
                          {fmt(order.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </ScrollReveal>
        )}

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: IN-HOUSE FINANCING APPLICATIONS & AMORTIZATION      */}
        {/* ────────────────────────────────────────────────────────────── */}
        {shownApplications.length > 0 && (
          <ScrollReveal threshold={0.05} delay={50} duration={500}>
            <section className="space-y-4">
              <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                In-House Motorcycle Financing & Installment Schedules
              </h2>
              {shownApplications.map((app) => {
                const totalMonths = app.termMonths || 12;
                const paidMonths = app.installmentsPaid || 0;
                const progressPct = Math.min(100, Math.round((paidMonths / totalMonths) * 100));
                const isFullyPaid = paidMonths >= totalMonths;

                return (
                  <div
                    key={app._id}
                    className="border-2 border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-2xs space-y-0"
                  >
                    {/* Application header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-zinc-900 text-sm">
                          {app.applicationRef}
                        </span>
                        <StatusBadge label={app.applicationStatus} />
                        {app.linkedOrderId && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Unit Released & Active Loan
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Applied:{" "}
                        {new Date(app.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Product & Showroom info (5 cols) */}
                      <div className="lg:col-span-5 space-y-3">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            Financed Vehicle Asset
                          </p>
                          <p className="font-extrabold text-zinc-900 text-base mt-0.5">
                            {app.productName}
                          </p>
                          <p className="font-mono font-bold text-zinc-700 text-sm">
                            SRP: {fmt(app.productPrice)}
                          </p>
                        </div>

                        {/* Showroom Releasing Depot & Handover Instructions */}
                        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 text-xs space-y-1.5">
                          <span className="font-bold text-zinc-900 block text-[11px] uppercase tracking-wide">
                            Assigned Releasing Showroom Depot:
                          </span>
                          <p className="text-zinc-900 font-bold">{app.shippingInfo?.branch || "Pasig Central Showroom"}</p>
                          <p className="text-zinc-500 text-[11px]">
                            {app.applicationStatus === "approved"
                              ? "Your motorcycle is scheduled for pre-delivery preparation at this location."
                              : "This is your chosen branch for unit handover upon loan approval."}
                          </p>
                        </div>
                      </div>

                      {/* Right: Financing Terms & Metrics (7 cols) */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Term</span>
                            <span className="font-mono font-bold text-zinc-900">{totalMonths} Months</span>
                          </div>
                          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Downpayment</span>
                            <span className="font-mono font-bold text-zinc-900">{fmt(app.downPayment)}</span>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                            <span className="text-[10px] text-amber-800 block font-mono uppercase font-bold">Monthly Amort.</span>
                            <span className="font-mono font-extrabold text-amber-950 text-sm">
                              {fmt(app.monthlyPayment)}
                            </span>
                          </div>
                          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Total Repay</span>
                            <span className="font-mono font-bold text-zinc-900">{fmt(app.totalRepayment)}</span>
                          </div>
                        </div>

                        {/* Amortization Progress Tracker */}
                        {app.applicationStatus === "approved" && (
                          <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-200 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-900">
                                Amortization Progress ({paidMonths} of {totalMonths} Months Paid)
                              </span>
                              <span className="font-mono font-bold text-emerald-800">
                                {progressPct}% Complete
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                              {isFullyPaid ? (
                                <span className="text-xs font-bold text-emerald-800">
                                  Fully Settled! Official deed of sale released.
                                </span>
                              ) : (
                                <span className="text-[11px] text-zinc-600">
                                  Next Monthly Amortization: <strong className="text-zinc-900 font-mono">{fmt(app.monthlyPayment)}</strong>
                                </span>
                              )}

                              {!isFullyPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayment(app)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  Pay Installment ({fmt(app.monthlyPayment)}) →
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Guidelines Banner */}
                    {app.applicationStatus === "pending" && (
                      <div className="px-5 py-3.5 border-t border-amber-200 bg-amber-50/60 text-xs text-amber-950 flex items-start gap-2.5">
                        <span className="font-bold font-mono text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded shrink-0 mt-0.5">UNDER REVIEW</span>
                        <div className="space-y-0.5">
                          <strong className="block">Credit Investigation in Progress (24-Hour SLA)</strong>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Our loan evaluation officers are currently verifying your pre-qualification details. Once your application is marked <strong>Approved</strong>, this panel will display complete release instructions including what documents to bring and how to claim your motorcycle at <strong>{app.shippingInfo?.branch || "your selected showroom"}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                    {app.applicationStatus === "approved" && !app.linkedOrderId && (
                      <div className="px-5 py-4 border-t border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">LOAN APPROVED</span>
                          <span className="font-bold text-sm text-emerald-950">Next Step: Claim Your Motorcycle at Showroom</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/80 space-y-1">
                            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">Where to Go:</span>
                            <p className="font-bold text-zinc-900 text-xs">{app.shippingInfo?.branch || "Dealership Flagship Showroom"}</p>
                            <p className="text-[11px] text-zinc-600">Releasing Desk & Pre-Delivery Inspection (PDI) Bay</p>
                          </div>

                          <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/80 space-y-1">
                            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">What to Bring:</span>
                            <ul className="text-[11px] text-zinc-700 space-y-0.5 list-disc list-inside">
                              <li>1 Valid Government ID (Driver's License, PhilSys, UMID, Passport, etc.)</li>
                              <li>Proof of Income (Payslip, COE, or ITR)</li>
                              <li>Downpayment amount: <strong className="font-mono text-emerald-800">{fmt(app.downPayment)}</strong></li>
                            </ul>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-900 leading-relaxed pt-1">
                          Inspect your brand-new motorcycle, sign the official sales chattel mortgage contract, and claim your keys on the spot.
                        </p>
                      </div>
                    )}

                    {/* Payment History Accordion */}
                    {app.paymentHistory && app.paymentHistory.length > 0 && (
                      <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/40 text-xs space-y-1.5">
                        <span className="font-bold text-zinc-800 text-[11px] block uppercase tracking-wide">
                          Payment Ledger History:
                        </span>
                        <div className="space-y-1">
                          {app.paymentHistory.map((hist, hIdx) => (
                            <div
                              key={hIdx}
                              className="flex items-center justify-between py-1 border-b border-zinc-200/60 text-[11px] text-zinc-600"
                            >
                              <span>
                                Installment #{hist.installmentNumber} via{" "}
                                <strong className="text-zinc-900 uppercase">{hist.paymentMethod}</strong> (Ref: {hist.referenceNumber})
                              </span>
                              <span className="font-mono font-bold text-zinc-900">{fmt(hist.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </ScrollReveal>
        )}

        {/* Empty state */}
        {!loading &&
          shownOrders.length === 0 &&
          shownApplications.length === 0 && (
            <div className="border border-zinc-200 rounded-2xl p-16 text-center space-y-3 bg-white shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                No orders or loan applications yet
              </p>
              <p className="text-xs text-zinc-500">
                Visit the showroom catalog to explore motorcycles and genuine parts.
              </p>
              <a
                href="/shop"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Browse Showroom
              </a>
            </div>
          )}
      </main>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* MODAL: PAY MONTHLY INSTALLMENT AMORTIZATION                    */}
      {/* ────────────────────────────────────────────────────────────── */}
      {payingApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                  Monthly Amortization
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 mt-1">
                  Pay Installment #{(payingApp.installmentsPaid || 0) + 1}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingApp(null)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Vehicle:</span>
                <span className="font-bold text-zinc-900">{payingApp.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Application Ref:</span>
                <span className="font-mono text-zinc-700">{payingApp.applicationRef}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-zinc-200 text-sm">
                <span className="font-bold text-zinc-900">Amortization Due:</span>
                <span className="font-mono font-extrabold text-emerald-700 text-base">
                  {fmt(payingApp.monthlyPayment)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmInstallmentPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1.5 uppercase tracking-wide">
                  Select Payment Channel:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "gcash", label: "GCash QR", code: "GCASH" },
                    { id: "maya", label: "Maya Pay", code: "MAYA" },
                    { id: "bank_deposit", label: "Online Bank", code: "BANK" },
                    { id: "counter", label: "Showroom OTC", code: "OTC" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPayMethod(ch.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        payMethod === ch.id
                          ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold ring-1 ring-emerald-600"
                          : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <span className="font-mono text-[9px] font-bold bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded border border-zinc-200">{ch.code}</span>
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Payment Transaction / Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. GCash Ref No: 10029384729"
                  className="w-full h-11 px-3.5 border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingApp(null)}
                  className="px-4 py-2.5 text-xs text-zinc-600 hover:text-zinc-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:bg-zinc-300"
                >
                  {submittingPay ? "Recording..." : `Confirm Payment (${fmt(payingApp.monthlyPayment)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
