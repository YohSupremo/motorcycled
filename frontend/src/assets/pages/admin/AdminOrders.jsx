import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminOrders,
  getAdminApplications,
  updateOrderStatus,
  approveApplication,
  rejectApplication,
  confirmInstallmentOrder,
} from "../../../actions/orderActions";

export const AdminOrders = ({ initialSelectedOrderId }) => {
  const dispatch = useDispatch();
  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const { orders = [], loading: ordersLoading } = useSelector(
    (state) => state.adminOrders || {}
  );
  const { applications = [], loading: appsLoading } = useSelector(
    (state) => state.adminApplications || {}
  );

  const reloadData = () => {
    dispatch(getAdminOrders());
    dispatch(getAdminApplications());
  };

  useEffect(() => {
    reloadData();
  }, [dispatch]);

  // Transform backend orders and applications into unified table items
  const unifiedOrders = [
    // Regular orders
    ...orders.map((o) => {
      const itemsPrice = (o.orderItems || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );
      const customerName = o.user
        ? `${o.user.firstName || ""} ${o.user.lastName || ""}`.trim()
        : "Customer";

      // Map backend status to tab labels
      let displayStatus = "Pending";
      if (o.orderStatus === "processing") displayStatus = "Processing";
      else if (o.orderStatus === "shipped") displayStatus = "Shipped";
      else if (o.orderStatus === "completed" || o.orderStatus === "ready_for_pickup") displayStatus = "Delivered";
      else if (o.orderStatus === "canceled") displayStatus = "Cancelled";

      return {
        _id: o._id,
        id: o.orderNumber,
        isApplication: false,
        customer: customerName || "Customer",
        email: o.user?.email || "—",
        phone: o.shippingInfo?.contactNumber || o.user?.contactNumber || "—",
        createdAt: new Date(o.createdAt).toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: o.paymentMethod || "cash_on_releasing",
        status: displayStatus,
        shippingInfo: {
          address: o.shippingInfo?.address || "Dealership",
          city: o.shippingInfo?.city || (o.shippingInfo?.fulfillmentMethod === "pickup" ? (o.shippingInfo?.branch || "Dealership Pickup") : "Philippines"),
          postalCode: o.shippingInfo?.postalCode || "—",
          country: "Philippines",
          phoneNumber: o.shippingInfo?.contactNumber || "—",
        },
        items: (o.orderItems || []).map((i) => ({
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
        })),
        shippingPrice: o.shippingPrice || 0,
        taxRate: 0.12,
        totalPrice: o.totalPrice,
        installment: null,
      };
    }),

    // Installment applications
    ...applications.map((app) => {
      const customerName = app.user
        ? `${app.user.firstName || ""} ${app.user.lastName || ""}`.trim()
        : "Applicant";

      let displayStatus = "For Approval";
      if (app.applicationStatus === "approved") {
        displayStatus = app.linkedOrderId ? "Processing" : "Awaiting Downpayment";
      } else if (app.applicationStatus === "rejected" || app.applicationStatus === "canceled") {
        displayStatus = "Cancelled";
      }

      return {
        _id: app._id,
        id: app.applicationRef,
        isApplication: true,
        customer: customerName || "Applicant",
        email: app.user?.email || "—",
        phone: app.shippingInfo?.contactNumber || app.user?.contactNumber || "—",
        createdAt: new Date(app.createdAt).toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: "installment",
        status: displayStatus,
        shippingInfo: {
          address: app.shippingInfo?.address || "Dealership",
          city: app.shippingInfo?.city || (app.shippingInfo?.fulfillmentMethod === "pickup" ? (app.shippingInfo?.branch || "Showroom Pickup") : "Showroom"),
          postalCode: app.shippingInfo?.postalCode || "—",
          country: "Philippines",
          phoneNumber: app.shippingInfo?.contactNumber || "—",
        },
        items: [
          {
            name: app.productName,
            unitPrice: app.productPrice,
            quantity: 1,
          },
        ],
        shippingPrice: 0,
        taxRate: 0.12,
        totalPrice: app.totalRepayment || app.productPrice,
        installment: {
          applicationId: app._id,
          planName: `${app.termMonths} Months Standard Financing`,
          termMonths: app.termMonths,
          interestRate: app.interestRate,
          minDownpaymentPercent: 20,
          processingFee: app.processingFee || 1500,
          downpayment: app.downPayment,
          downpaymentConfirmedAt: app.linkedOrderId ? new Date(app.updatedAt).toLocaleDateString() : null,
          validId: app.user?.validId || "PH Government Issued ID",
          proofOfIncome: app.user?.proofOfIncome || "Income Statement / Bank Statement",
          confirmedTerms: app.confirmedTerms,
        },
      };
    }),
  ];

  const statusTabs = [
    "All",
    "For Approval",
    "Awaiting Downpayment",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  const computeTotal = (order) => {
    if (order.totalPrice !== undefined) return order.totalPrice;
    const itemsPrice = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = itemsPrice * order.taxRate;
    return itemsPrice + order.shippingPrice + tax;
  };

  const filteredOrders = unifiedOrders.filter((o) => {
    if (activeStatusTab !== "All" && o.status !== activeStatusTab) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCust = o.customer.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchId && !matchCust && !matchItem) return false;
    }
    return true;
  });

  const handleApproveApplication = async (appId) => {
    const selected = unifiedOrders.find((o) => o._id === appId || o.id === appId);
    const terms = selected?.installment?.confirmedTerms || {
      termMonths: selected?.installment?.termMonths || 12,
      downPayment: selected?.installment?.downPayment || 0,
      financedAmount: (selected?.totalPrice || 0) - (selected?.installment?.downPayment || 0),
      interestRate: selected?.installment?.interestRate || 0.07,
      monthlyPayment: Math.round(((selected?.totalPrice || 0) * 0.8 * 1.07) / 12),
      processingFee: selected?.installment?.processingFee || 1500,
      totalRepayment: selected?.totalPrice || 0,
    };

    await dispatch(approveApplication(appId, terms));
    setActionSuccess("Installment application approved! Awaiting downpayment.");
    setTimeout(() => setActionSuccess(""), 4000);
    reloadData();
    setSelectedOrder(null);
  };

  const handleRejectApplication = async (appId) => {
    await dispatch(rejectApplication(appId, rejectionReason || "Documents insufficient or unverified income records."));
    setActionSuccess("Installment application rejected.");
    setTimeout(() => setActionSuccess(""), 4000);
    setRejectionReason("");
    reloadData();
    setSelectedOrder(null);
  };

  const handleConfirmDownpayment = async (appId) => {
    await dispatch(confirmInstallmentOrder(appId));
    setActionSuccess("Downpayment confirmed! Official Order created and stock updated.");
    setTimeout(() => setActionSuccess(""), 4000);
    reloadData();
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (orderId, targetStatus) => {
    let backendStatus = targetStatus.toLowerCase();
    if (targetStatus === "Delivered") backendStatus = "completed";

    await dispatch(updateOrderStatus(orderId, { orderStatus: backendStatus }));
    setActionSuccess(`Order updated to ${targetStatus}!`);
    setTimeout(() => setActionSuccess(""), 4000);
    reloadData();
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Orders & Installment Applications
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational screening, document verification, downpayment confirmation & order fulfillment (<code className="font-mono text-zinc-600">orders</code> pipeline).
          </p>
        </div>
        <button
          type="button"
          onClick={reloadData}
          className="h-8 px-3 rounded text-xs font-semibold border border-zinc-300 hover:bg-zinc-50 text-zinc-700 cursor-pointer"
        >
          ↻ Refresh Records
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-md">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => {
            const count = tab === "All" ? unifiedOrders.length : unifiedOrders.filter((o) => o.status === tab).length;
            const isActive = activeStatusTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveStatusTab(tab)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span>{tab}</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-emerald-200/60 text-emerald-900" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Order ID (e.g. MC-2026 / IA-2026), customer name, or unit..."
            className="w-full h-9 px-3 text-xs bg-white border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Flat Orders Table */}
      <div className="border border-zinc-200 bg-white overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
              <th className="py-2.5 px-4 font-semibold">Reference</th>
              <th className="py-2.5 px-4 font-semibold">Customer & Destination</th>
              <th className="py-2.5 px-4 font-semibold">Items Snapshot</th>
              <th className="py-2.5 px-4 font-semibold">Type / Plan</th>
              <th className="py-2.5 px-4 font-semibold">Authoritative Total</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {ordersLoading || appsLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-zinc-400">
                  Loading order transactions…
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                  No records match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const total = computeTotal(o);
                return (
                  <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Order Ref & Timestamp */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-zinc-900 block">{o.id}</span>
                      <span className="text-[10px] font-mono text-zinc-400">{o.createdAt}</span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-900">{o.customer}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-xs">{o.shippingInfo.city}</p>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {o.items.map((item, idx) => (
                          <p key={idx} className="text-zinc-900 font-medium truncate">
                            {item.quantity}× {item.name}
                          </p>
                        ))}
                      </div>
                    </td>

                    {/* Payment / Plan */}
                    <td className="py-3 px-4">
                      {o.installment ? (
                        <div>
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold uppercase">
                            Installment
                          </span>
                          <span className="block text-[11px] text-zinc-500 mt-0.5">
                            {o.installment.planName}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded font-semibold uppercase">
                            Cash Order
                          </span>
                          <span className="block text-[11px] text-zinc-500 mt-0.5 capitalize">
                            {o.paymentMethod.replace(/_/g, " ")}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                      ₱{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Fulfillment Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
                          o.status === "For Approval"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : o.status === "Awaiting Downpayment"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : o.status === "Processing"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : o.status === "Shipped"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : o.status === "Delivered"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        Review Record &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over / Modal for Order Review */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-300 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                  {selectedOrder.isApplication ? "Financing Application Dossier" : "Order Transaction Record"}
                </span>
                <h2 className="text-base font-bold text-zinc-900 font-mono">
                  {selectedOrder.id}
                </h2>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                  selectedOrder.status === "For Approval"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : selectedOrder.status === "Awaiting Downpayment"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : selectedOrder.status === "Processing"
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : selectedOrder.status === "Shipped"
                    ? "bg-sky-50 text-sky-800 border-sky-200"
                    : selectedOrder.status === "Delivered"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {selectedOrder.status}
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-200 text-xs">
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Customer Information
                  </h3>
                  <p className="font-bold text-zinc-900">{selectedOrder.customer}</p>
                  <p className="text-zinc-600">{selectedOrder.email}</p>
                  <p className="text-zinc-600">{selectedOrder.phone}</p>
                </div>
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Fulfillment Destination
                  </h3>
                  <p className="text-zinc-900 font-medium">{selectedOrder.shippingInfo.address}</p>
                  <p className="text-zinc-600">{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}</p>
                  <p className="text-zinc-600">{selectedOrder.shippingInfo.country}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Line Items Purchased
                </h3>
                <div className="border border-zinc-200 rounded divide-y divide-zinc-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-[11px] text-zinc-500">Unit: ₱{item.unitPrice.toLocaleString()} × {item.quantity}</p>
                      </div>
                      <p className="font-mono font-bold text-zinc-900">
                        ₱{(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installment Application Review Section */}
              {selectedOrder.installment && (
                <div className="p-4 bg-emerald-50/50 rounded-md border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="font-bold text-emerald-950 uppercase tracking-wide text-xs">
                      Financing Application Review
                    </span>
                    <span className="font-mono text-[10px] text-emerald-800">
                      STATUS: {selectedOrder.installment.applicationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">Financing Plan</span>
                      <p className="font-semibold text-zinc-900">{selectedOrder.installment.planName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Agreed Downpayment</span>
                      <p className="font-bold text-zinc-900 font-mono">₱{selectedOrder.installment.downpayment.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Downpayment Status</span>
                      <p className="font-semibold text-zinc-900">
                        {selectedOrder.installment.downpaymentConfirmedAt
                          ? `Confirmed (${selectedOrder.installment.downpaymentConfirmedAt})`
                          : "Pending Settlement"}
                      </p>
                    </div>
                  </div>

                  {/* Submitted Documents */}
                  <div className="p-3 bg-white rounded border border-emerald-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span className="font-medium text-zinc-900">Primary Philippine Government ID:</span>
                      </div>
                      {selectedOrder.installment.validId?.startsWith("http") ? (
                        <a
                          href={selectedOrder.installment.validId}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Inspect Uploaded ID</span>
                          <span>↗</span>
                        </a>
                      ) : (
                        <span className="font-mono text-zinc-700 text-[11px]">{selectedOrder.installment.validId}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span className="font-medium text-zinc-900">Proof of Monthly Income / Capacity:</span>
                      </div>
                      {selectedOrder.installment.proofOfIncome?.startsWith("http") ? (
                        <a
                          href={selectedOrder.installment.proofOfIncome}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Inspect Proof of Income</span>
                          <span>↗</span>
                        </a>
                      ) : (
                        <span className="font-mono text-zinc-700 text-[11px]">{selectedOrder.installment.proofOfIncome}</span>
                      )}
                    </div>
                  </div>

                  {/* Operational Decision Actions */}
                  {selectedOrder.status === "For Approval" && (
                    <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason (if rejecting)..."
                          className="flex-1 h-8 px-2 text-xs border border-zinc-300 rounded bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectApplication(selectedOrder._id)}
                          className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium cursor-pointer"
                        >
                          Reject Application
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveApplication(selectedOrder._id)}
                          className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold cursor-pointer shadow-2xs"
                        >
                          Approve Credit & Require Downpayment &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm Downpayment Action */}
                  {selectedOrder.status === "Awaiting Downpayment" && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-600">
                        Verify downpayment collection before confirming to deduct stock and create order.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleConfirmDownpayment(selectedOrder._id)}
                        className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Confirm Downpayment & Generate Order
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Stepper / Order Fulfillment for cash/approved orders */}
              {selectedOrder.status !== "For Approval" && selectedOrder.status !== "Awaiting Downpayment" && !selectedOrder.isApplication && (
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                  <span className="font-medium text-zinc-700">Advance Fulfillment Stage:</span>
                  <div className="flex items-center gap-2">
                    {selectedOrder.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder._id, "Processing")}
                        className="h-8 px-3 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-800 cursor-pointer"
                      >
                        Mark as Processing
                      </button>
                    )}
                    {selectedOrder.status === "Processing" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder._id, "Shipped")}
                        className="h-8 px-3 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-800 cursor-pointer"
                      >
                        Mark as Shipped / Ready for Pickup
                      </button>
                    )}
                    {selectedOrder.status === "Shipped" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder._id, "Delivered")}
                        className="h-8 px-3 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 cursor-pointer"
                      >
                        Mark as Delivered / Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 px-4 rounded border border-zinc-300 text-zinc-700 hover:bg-white cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
