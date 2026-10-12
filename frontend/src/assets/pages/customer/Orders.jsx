import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyOrders } from "../../../actions/orderActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { ScrollReveal } from "../../components/ScrollReveal";

const fmt = (n) =>
  `₱${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

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

export const Orders = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("all");

  const { loading, orders = [], applications = [], error } = useSelector(
    (state) => state.myOrders
  );

  useEffect(() => {
    dispatch(getMyOrders());
  }, [dispatch]);

  const shownOrders =
    activeTab === "all" || activeTab === "orders" ? orders : [];
  const shownApplications =
    activeTab === "all" || activeTab === "applications" ? applications : [];

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
            Loading orders…
          </span>
        </div>
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
              My Orders & Applications
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Track your cash purchases, installment applications, and payment
              schedules.
            </p>
          </div>
          <div className="flex items-center gap-1 border border-zinc-200 p-0.5 rounded bg-zinc-50 text-xs font-medium self-start sm:self-auto">
            {[
              { key: "all", label: "All" },
              { key: "orders", label: `Orders (${orders.length})` },
              { key: "applications", label: `Applications (${applications.length})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === t.key
                    ? "bg-white text-zinc-900 font-semibold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 rounded-md p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Orders */}
        {shownOrders.length > 0 && (
          <ScrollReveal threshold={0.05} duration={500}>
            <section className="space-y-4">
              <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                Cash Orders
              </h2>
              {shownOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-zinc-200 rounded-md bg-white overflow-hidden"
                >
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-200">
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
                        <div className="w-10 h-10 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
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
                  <div className="px-5 py-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-zinc-500 space-y-0.5">
                      <p>
                        <span className="font-semibold text-zinc-700">Method:</span>{" "}
                        {order.paymentMethod?.replace(/_/g, " ")}
                      </p>
                      {order.shippingInfo?.fulfillmentMethod === "delivery" ? (
                        <p>
                          <span className="font-semibold text-zinc-700">
                            Deliver to:
                          </span>{" "}
                          {order.shippingInfo?.city}
                        </p>
                      ) : (
                        <p>
                          <span className="font-semibold text-zinc-700">
                            Pickup:
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
                        <p className="text-[11px] text-zinc-400">Order Total</p>
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

        {/* Installment Applications */}
        {shownApplications.length > 0 && (
          <ScrollReveal threshold={0.05} delay={50} duration={500}>
            <section className="space-y-4">
              <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                Installment Applications
              </h2>
              {shownApplications.map((app) => (
                <div
                  key={app._id}
                  className="border border-zinc-200 rounded-md bg-white overflow-hidden"
                >
                  {/* Application header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-zinc-900 text-sm">
                        {app.applicationRef}
                      </span>
                      <StatusBadge label={app.applicationStatus} />
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {new Date(app.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Product info */}
                    <div>
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        Motorcycle
                      </p>
                      <p className="font-bold text-zinc-900 text-sm">
                        {app.productName}
                      </p>
                      <p className="font-mono font-semibold text-zinc-700 text-sm mt-0.5">
                        {fmt(app.productPrice)}
                      </p>
                    </div>

                    {/* Financing terms */}
                    <div className="space-y-1 text-xs">
                      <p className="font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        {app.applicationStatus === "approved"
                          ? "Confirmed Terms"
                          : "Proposed Terms"}
                      </p>
                      {(app.applicationStatus === "approved"
                        ? app.confirmedTerms
                        : app) && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Term:</span>
                            <span className="font-mono text-zinc-900">
                              {app.termMonths} months
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Down payment:</span>
                            <span className="font-mono text-zinc-900">
                              {fmt(app.downPayment)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Monthly:</span>
                            <span className="font-mono font-bold text-zinc-900">
                              {fmt(app.monthlyPayment)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Est. total repayment:
                            </span>
                            <span className="font-mono text-zinc-900">
                              {fmt(app.totalRepayment)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status notices */}
                  {app.applicationStatus === "pending" && (
                    <div className="px-5 py-3 border-t border-amber-100 bg-amber-50/50 text-[11px] text-amber-800">
                      Your application is under review. Our team will contact you
                      once a decision is made.
                    </div>
                  )}
                  {app.applicationStatus === "rejected" && (
                    <div className="px-5 py-3 border-t border-red-100 bg-red-50/50 text-[11px] text-red-700">
                      Application rejected.{" "}
                      {app.rejectionReason && (
                        <span>Reason: {app.rejectionReason}</span>
                      )}
                    </div>
                  )}
                  {app.applicationStatus === "approved" && !app.linkedOrderId && (
                    <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/50 text-[11px] text-emerald-800">
                      Application approved! Awaiting downpayment confirmation
                      from dealership before your order is created.
                    </div>
                  )}
                  {app.linkedOrderId && (
                    <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/50 text-[11px] text-emerald-800">
                      Order created. Your motorcycle is being processed.
                    </div>
                  )}
                </div>
              ))}
            </section>
          </ScrollReveal>
        )}

        {/* Empty state */}
        {!loading &&
          shownOrders.length === 0 &&
          shownApplications.length === 0 && (
            <div className="border border-zinc-200 rounded-md p-16 text-center space-y-3 bg-zinc-50/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                No orders yet
              </p>
              <p className="text-xs text-zinc-500">
                Start shopping to see your orders and applications here.
              </p>
              <a
                href="/shop"
                className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Browse Shop
              </a>
            </div>
          )}
      </main>
    </div>
  );
};
