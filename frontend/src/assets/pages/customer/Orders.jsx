import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getMyOrders, payInstallmentAmortization, cancelOrder } from "../../../actions/orderActions";
import { installmentPaymentSchema } from "../../schema/installmentPaymentSchema.js";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API || "http://localhost:4001/api/v1";

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const StatusBadge = ({ label }) => {
  const s = label?.toLowerCase() || "";

  if (s === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300">
        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Completed &amp; Delivered</span>
      </span>
    );
  }
  if (s === "ready_for_pickup") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Ready for Pickup</span>
      </span>
    );
  }
  if (s === "shipped") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-sky-50 text-sky-800 border-sky-300">
        <svg className="w-3 h-3 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <span>In Transit</span>
      </span>
    );
  }
  if (s === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-300">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span>Processing</span>
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 border-zinc-300">
        <span>Order Placed</span>
      </span>
    );
  }
  if (s === "canceled" || s === "failed" || s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-300">
        <span>✕ {label}</span>
      </span>
    );
  }
  if (s === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300">
        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Loan Approved</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 border-zinc-200 capitalize">
      {label}
    </span>
  );
};

const generatePaymentRef = () => `MP-${Math.floor(100000 + Math.random() * 900000)}`;

export const Orders = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("all");

  const { loading, orders = [], applications = [], error } = useSelector(
    (state) => state.myOrders
  );

  // Installment Payment Modal State
  const [payingApp, setPayingApp] = useState(null);
  const [submittingPay, setSubmittingPay] = useState(false);

  const {
    register,
    handleSubmit: handlePaymentFormSubmit,
    setValue,
    reset: resetPaymentForm,
    control: paymentControl,
    formState: { errors: paymentErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(installmentPaymentSchema),
    defaultValues: { paymentMethod: "gcash", referenceNumber: "" },
  });

  const paymentForm = useWatch({ control: paymentControl });

  useEffect(() => {
    dispatch(getMyOrders());
  }, [dispatch]);

  const completedOrders = orders.filter((o) => o.orderStatus === "completed");
  const shownOrders =
    activeTab === "all"
      ? orders
      : activeTab === "completed"
        ? completedOrders
        : activeTab === "orders"
          ? orders
          : [];
  const shownApplications =
    activeTab === "all" || activeTab === "applications" ? applications : [];

  const handleOpenPayment = (app) => {
    setPayingApp(app);
    resetPaymentForm({
      paymentMethod: "gcash",
      referenceNumber: generatePaymentRef(),
    });
  };

  const handleConfirmInstallmentPayment = async (data) => {
    if (!payingApp) return;

    setSubmittingPay(true);
    const res = await dispatch(
      payInstallmentAmortization(payingApp._id, {
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
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

  const handleCancelOrder = async (order) => {
    const result = await Swal.fire({
      title: "Cancel order?",
      text: `Are you sure you want to cancel order ${order.orderNumber}? Items will be returned to stock if not yet shipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "Keep order",
    });

    if (!result.isConfirmed) return;

    const res = await dispatch(cancelOrder(order._id));
    if (res?.success) {
      toast.success(res?.data?.message || "Order canceled successfully");
      dispatch(getMyOrders());
    } else {
      toast.error(res?.message || "Failed to cancel order");
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
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              My Orders & Financing Applications
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
              Track your cash purchases, in-house motorcycle loan applications, and monthly installment amortization schedules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { key: "all", label: "All Records", count: orders.length + applications.length },
              { key: "completed", label: "Ready to Review", count: completedOrders.length, highlight: true },
              { key: "orders", label: "Cash Orders", count: orders.length },
              { key: "applications", label: "Financing Loans", count: applications.length },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === t.key
                    ? "bg-zinc-900 text-white font-semibold shadow-xs"
                    : t.highlight && completedOrders.length > 0
                      ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold"
                      : "text-zinc-600 bg-white hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200"
                  }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === t.key
                        ? "bg-zinc-700 text-white"
                        : t.highlight && completedOrders.length > 0
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                  >
                    {t.count}
                  </span>
                )}
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
        {/* SECTION 1: CASH PURCHASES & DELIVERIES                         */}
        {/* ────────────────────────────────────────────────────────────── */}
        {activeTab !== "applications" && (
          <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Cash Purchases &amp; Deliveries</span>
                  <span className="text-xs text-zinc-400 font-mono font-normal">
                    ({shownOrders.length} {shownOrders.length === 1 ? "order" : "orders"})
                  </span>
                </h2>
                {activeTab === "completed" && (
                  <span className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Showing delivered items ready for customer reviews</span>
                  </span>
                )}
              </div>

              {shownOrders.length === 0 ? (
                <div className="border border-dashed border-zinc-300 rounded-2xl p-10 bg-white text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    {activeTab === "completed"
                      ? "No Completed Orders to Review"
                      : "No Cash Orders Found"}
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    {activeTab === "completed"
                      ? "When your order status is marked 'Completed' by the showroom admin, your products will be listed here with a direct link to rate and write a customer review."
                      : "Browse our showroom catalog to purchase motorcycles, OEM replacement parts, or rider gear."}
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Explore Catalog</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              ) : (
                shownOrders.map((order) => {
                  const isCompleted = order.orderStatus === "completed";
                  return (
                    <div
                      key={order._id}
                      className={`border rounded-2xl bg-white overflow-hidden shadow-xs transition-all hover:shadow-md ${isCompleted
                          ? "border-emerald-200 ring-1 ring-emerald-500/10"
                          : "border-zinc-200"
                        }`}
                    >
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200/80">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Order</span>
                            <span className="font-bold text-zinc-900 text-sm tracking-tight bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs font-price">
                              {order.orderNumber}
                            </span>
                          </div>
                          <StatusBadge label={order.orderStatus} />
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <svg className="w-2.5 h-2.5 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <span>Ready to Rate &amp; Review</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Completed order review prompt banner */}
                      {isCompleted && (
                        <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-emerald-900">
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">
                              Your order was delivered! How was your experience with the unit and service?
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
                            Verified Purchase Benefit
                          </span>
                        </div>
                      )}

                      {/* Order items */}
                      <div className="px-5 py-4 divide-y divide-zinc-100">
                        {order.orderItems?.map((item, idx) => {
                          const prodId = item.product?._id || item.product;
                          return (
                            <div
                              key={idx}
                              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <Link
                                  to={`/product/${prodId}`}
                                  className="w-14 h-14 shrink-0 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden group/img relative block cursor-pointer"
                                  title={`View details for ${item.name}`}
                                >
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <ProductImagePlaceholder
                                      category={item.itemType}
                                      name={item.name}
                                      compact
                                    />
                                  )}
                                </Link>
                                <div className="min-w-0 space-y-1">
                                  <Link
                                    to={`/product/${prodId}`}
                                    className="font-bold text-zinc-900 text-sm hover:text-emerald-700 transition-colors line-clamp-1 block cursor-pointer"
                                  >
                                    {item.name}
                                  </Link>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span className="font-price font-semibold text-zinc-800">{fmt(item.price)}</span>
                                    <span>×</span>
                                    <span className="bg-zinc-100 px-1.5 py-0.2 rounded text-[11px] font-semibold text-zinc-700">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="text-zinc-300">•</span>
                                    <span className="capitalize text-zinc-500 font-medium">
                                      {item.itemType || "item"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Item Right Side: Price & Actions */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                                <div className="text-left sm:text-right pr-1">
                                  <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-medium">Item Total</span>
                                  <span className="font-price font-bold text-zinc-900 text-sm">
                                    {fmt(item.price * item.quantity)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/product/${prodId}`}
                                    className="h-8 px-2.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-colors inline-flex items-center cursor-pointer"
                                  >
                                    View
                                  </Link>

                                  {isCompleted && (
                                    <Link
                                      to={`/product/${prodId}#reviews`}
                                      className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
                                      title={`Write a verified customer review for ${item.name}`}
                                    >
                                      <svg className="w-3.5 h-3.5 fill-amber-300 text-amber-300" viewBox="0 0 24 24">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                      <span>Write Review</span>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Details & Settlement Footer */}
                      <div className="px-5 py-3.5 border-t border-zinc-200/80 bg-zinc-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Fulfillment & Payment */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-5 h-5 rounded-md bg-white border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-600">
                              {order.shippingInfo?.fulfillmentMethod === "delivery" ? (
                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              )}
                            </div>
                            <span className="font-semibold text-zinc-900">
                              {order.shippingInfo?.fulfillmentMethod === "delivery"
                                ? "Doorstep Courier Delivery"
                                : "Dealership Showroom Pickup"}
                            </span>
                            <span className="text-zinc-300 hidden sm:inline">•</span>
                            <span className="text-zinc-500 text-[11px]">
                              {order.shippingInfo?.fulfillmentMethod === "delivery"
                                ? `${order.shippingInfo?.address || ""}, ${order.shippingInfo?.city || ""}`
                                : `Claim at ${order.shippingInfo?.branch || "Central Flagship Showroom"}`}
                              {order.shippingPrice > 0 && ` (₱${order.shippingPrice} Freight)`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Settlement:</span>
                            <span className="font-semibold text-zinc-800 text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded">
                              {order.paymentMethod?.replace(/_/g, " ").toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${order.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                              {order.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Right: Totals & Receipt Action */}
                        <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200/70">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(order.orderStatus === "pending" || order.orderStatus === "processing") && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                className="h-8 px-2.5 rounded-lg border border-rose-300 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>Cancel Order</span>
                              </button>
                            )}
                            <a
                              href={`${API}/order/${order._id}/receipt`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-2.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              title="View HTML Receipt"
                            >
                              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Receipt</span>
                            </a>
                            <a
                              href={`${API}/order/${order._id}/receipt?format=pdf`}
                              target="_blank"
                              rel="noreferrer"
                              download={`Receipt-${order.orderNumber}.pdf`}
                              className="h-8 px-2.5 rounded-lg border border-emerald-300 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              title="Download Official PDF Receipt"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>PDF</span>
                            </a>
                          </div>

                          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

                          <div className="text-right">
                            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Total Paid / Due</p>
                            <p className="font-price font-extrabold text-zinc-900 text-lg leading-tight">
                              {fmt(order.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
        )}

        {/* ────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: IN-HOUSE FINANCING APPLICATIONS & AMORTIZATION      */}
        {/* ────────────────────────────────────────────────────────────── */}
        {shownApplications.length > 0 && (
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
                    className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-xs space-y-0"
                  >
                    {/* Application header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200/80">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-zinc-900 text-sm bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs">
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
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-medium">Term</span>
                            <span className="font-price font-bold text-zinc-900">{totalMonths} Months</span>
                          </div>
                          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-medium">Downpayment</span>
                            <span className="font-price font-bold text-zinc-900">{fmt(app.downPayment)}</span>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                            <span className="text-[10px] text-amber-800 block uppercase font-bold tracking-wider">Monthly Amort.</span>
                            <span className="font-price font-extrabold text-amber-950 text-sm">
                              {fmt(app.monthlyPayment)}
                            </span>
                          </div>
                          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-medium">Total Repay</span>
                            <span className="font-price font-bold text-zinc-900">{fmt(app.totalRepayment)}</span>
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
                                app.downPaymentSettled === false ? (
                                  /* Downpayment not yet settled — block amortization */
                                  <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 max-w-xs">
                                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span className="leading-snug">
                                      {!app.downPaymentMethod || app.downPaymentMethod === "cash_on_releasing"
                                        ? `Please bring your downpayment (${fmt(app.downPayment)}) to the branch. Monthly installment payments will unlock once admin confirms receipt.`
                                        : "Your online downpayment is being verified by the admin. Monthly installments will unlock once confirmed."}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPayment(app)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                                  >
                                    Pay Installment ({fmt(app.monthlyPayment)}) →
                                  </button>
                                )
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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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

            <form
              onSubmit={handlePaymentFormSubmit(handleConfirmInstallmentPayment)}
              noValidate
              className="space-y-4"
            >
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
                      onClick={() =>
                        setValue("paymentMethod", ch.id, {
                          shouldValidate: true,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${paymentForm.paymentMethod === ch.id
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
                  {...register("referenceNumber")}
                  placeholder="e.g. GCash Ref No: 10029384729"
                  className={`w-full h-11 px-3.5 border rounded-xl text-xs text-zinc-900 font-mono focus:outline-none ${
                    paymentErrors.referenceNumber
                      ? "border-red-500"
                      : "border-zinc-300 focus:border-zinc-900"
                  }`}
                />
                {paymentErrors.referenceNumber && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {paymentErrors.referenceNumber.message}
                  </p>
                )}
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
