import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import {
  getAdminOrders,
  getAdminApplications,
  updateOrderStatus,
  approveApplication,
  rejectApplication,
  confirmInstallmentOrder,
} from "../../../actions/orderActions";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const STATUS_STYLES = {
  "For Approval": { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  "Awaiting Downpayment": { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Processing: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  Pending: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  Shipped: { badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  Delivered: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.Pending;

export const AdminOrders = () => {
  const dispatch = useDispatch();
  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
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
    dispatch(getAdminOrders());
    dispatch(getAdminApplications());
  }, [dispatch]);

  // Transform backend orders and applications into unified table items
  const unifiedOrders = [
    // Regular orders
    ...orders.map((o) => {
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
        email: o.user?.email || "-",
        phone: o.shippingInfo?.contactNumber || o.user?.contactNumber || "-",
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
          postalCode: o.shippingInfo?.postalCode || "-",
          country: "Philippines",
          phoneNumber: o.shippingInfo?.contactNumber || "-",
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
        email: app.user?.email || "-",
        phone: app.shippingInfo?.contactNumber || app.user?.contactNumber || "-",
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
          postalCode: app.shippingInfo?.postalCode || "-",
          country: "Philippines",
          phoneNumber: app.shippingInfo?.contactNumber || "-",
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
          planName: `${app.termMonths} month standard financing`,
          termMonths: app.termMonths,
          interestRate: app.interestRate,
          minDownpaymentPercent: 20,
          processingFee: app.processingFee || 1500,
          downpayment: app.downPayment,
          downPaymentMethod: app.downPaymentMethod || "cash_on_releasing",
          downPaymentSettled: app.downPaymentSettled || false,
          downpaymentConfirmedAt: app.linkedOrderId ? new Date(app.updatedAt).toLocaleDateString() : null,
          validId: app.user?.validId || "Government ID",
          proofOfIncome: app.user?.proofOfIncome || "Income statement or bank statement",
          confirmedTerms: app.confirmedTerms,
        },
      };
    }),
  ];

  const statusTabs = [
    "All",
    "Pending",
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
    setActionSuccess("Application approved. Awaiting downpayment.");
    setTimeout(() => setActionSuccess(""), 4000);
    reloadData();
    setSelectedOrder(null);
  };

  const handleRejectApplication = async (appId) => {
    await dispatch(rejectApplication(appId, rejectionReason || "Documents insufficient or unverified income records."));
    setActionSuccess("Application rejected.");
    setTimeout(() => setActionSuccess(""), 4000);
    setRejectionReason("");
    reloadData();
    setSelectedOrder(null);
  };

  const handleConfirmDownpayment = async (appId) => {
    await dispatch(confirmInstallmentOrder(appId));
    setActionSuccess("Downpayment confirmed. Order created and stock updated.");
    setTimeout(() => setActionSuccess(""), 4000);
    reloadData();
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (orderId, targetStatus) => {
    let backendStatus = targetStatus.toLowerCase();
    const payload = { orderStatus: backendStatus };
    if (targetStatus === "Delivered") {
      payload.orderStatus = "completed";
      payload.paymentStatus = "paid";
    }
    if (targetStatus === "Cancelled") {
      payload.orderStatus = "canceled";
    }

    await dispatch(updateOrderStatus(orderId, payload));
    setActionSuccess(`Order updated to ${targetStatus}. Email with item breakdown and PDF receipt sent to the customer.`);
    setTimeout(() => setActionSuccess(""), 4500);
    reloadData();
    setSelectedOrder(null);
  };

  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const handleRejectionReasonChange = (event) => setRejectionReason(event.target.value);

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Reference",
        width: 180,
        renderCell: (params) => {
          const o = params.row;
          return (
            <div className="flex min-w-0 w-full flex-col justify-center py-1 leading-tight">
              <span
                className="block min-w-0 max-w-full font-mono font-bold text-zinc-900 break-all"
                title={o.id}
              >
                {o.id}
              </span>
              <span className="block min-w-0 max-w-full text-[10px] font-mono text-zinc-400 truncate mt-0.5" title={o.createdAt}>
                {o.createdAt}
              </span>
            </div>
          );
        },
      },
      {
        field: "customer",
        headerName: "Customer",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => {
          const o = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">{o.customer}</span>
              <span className="text-[11px] text-zinc-400 truncate mt-0.5">{o.shippingInfo?.city || "-"}</span>
            </div>
          );
        },
      },
      {
        field: "items",
        headerName: "Items",
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => {
          const o = params.row;
          const items = o.items || [];
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight py-1">
              <span className="text-zinc-900 font-medium truncate text-xs">
                {items[0] ? `${items[0].quantity}× ${items[0].name}` : "-"}
              </span>
              {items.length > 1 && (
                <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                  +{items.length - 1} other item{items.length > 2 ? "s" : ""}
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "plan",
        headerName: "Order type",
        flex: 1,
        minWidth: 150,
        valueGetter: (value, row) => (row.installment ? "Installment" : "Cash Order"),
        renderCell: (params) => {
          const o = params.row;
          return o.installment ? (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="admin-table-badge bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono font-medium uppercase">
                Installment
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {o.installment.planName}
              </span>
            </div>
          ) : (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="admin-table-badge bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono font-medium uppercase">
                Cash Order
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5 capitalize truncate">
                {(o.paymentMethod || "").replace(/_/g, " ")}
              </span>
            </div>
          );
        },
      },
      {
        field: "total",
        headerName: "Total",
        width: 180,
        type: "number",
        headerAlign: "left",
        align: "left",
        valueGetter: (value, row) => computeTotal(row),
        renderCell: (params) => {
          const total = computeTotal(params.row);
          return (
            <span className="font-mono font-bold text-zinc-900 text-xs">
              ₱{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const status = params.row.status;
          const style = statusStyle(status);
          return (
            <span
              className={`admin-table-badge gap-2 text-[11px] font-medium border ${style.badge}`}
              title={status}
            >
              <span className={`admin-table-badge__dot w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {status}
            </span>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const o = params.row;
          return (
            <button
              type="button"
              onClick={() => setSelectedOrder(o)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Review</span>
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Orders and applications
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review credit applications, confirm downpayments, and advance fulfillment.
          </p>
        </div>
        <button
          type="button"
          onClick={reloadData}
          className="inline-flex items-center gap-2 h-8 px-3 rounded text-xs font-semibold border border-zinc-300 hover:bg-zinc-50 text-zinc-700 cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters and search */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => {
            const count = tab === "All" ? unifiedOrders.length : unifiedOrders.filter((o) => o.status === tab).length;
            const isActive = activeStatusTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveStatusTab(tab)}
                className={`px-3 py-2 rounded font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-zinc-900 text-white border-zinc-900 font-semibold"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span>{tab}</span>
                <span className={`ml-2 font-mono text-[11px] ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <label htmlFor="orders-search" className="sr-only">
            Search orders and applications
          </label>
          <input
            id="orders-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by reference, customer, or item"
            className="w-full h-9 px-3 text-xs bg-white border border-zinc-300 rounded focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700 focus:outline-offset-1 transition-colors"
          />
        </div>
      </div>

      {/* Orders DataGrid */}
      <div className="border border-zinc-200 bg-white rounded overflow-hidden">
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeight={72}
          loading={ordersLoading || appsLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight
          sx={adminDataGridSx}
        />
      </div>

      {/* Order review modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-zinc-900/50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-review-heading"
            className="bg-white border border-zinc-300 rounded max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs"
          >
            {/* Modal header */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="order-review-heading" className="text-base font-bold text-zinc-900 font-mono truncate">
                  {selectedOrder.id}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {selectedOrder.isApplication ? "Installment application" : "Cash order"}
                </p>
              </div>
              <span
                className={`admin-table-badge gap-2 text-[11px] font-medium border shrink-0 ${statusStyle(selectedOrder.status).badge}`}
              >
                <span className={`admin-table-badge__dot w-1.5 h-1.5 rounded-full ${statusStyle(selectedOrder.status).dot}`} />
                {selectedOrder.status}
              </span>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Customer and delivery */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-200 text-xs">
                <div>
                  <h3 className="text-[11px] font-semibold text-zinc-500 mb-1">
                    Customer
                  </h3>
                  <p className="font-bold text-zinc-900">{selectedOrder.customer}</p>
                  <p className="text-zinc-600">{selectedOrder.email}</p>
                  <p className="text-zinc-600">{selectedOrder.phone}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-zinc-500 mb-1">
                    Delivery address
                  </h3>
                  <p className="text-zinc-900 font-medium">{selectedOrder.shippingInfo.address}</p>
                  <p className="text-zinc-600">{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}</p>
                  <p className="text-zinc-600">{selectedOrder.shippingInfo.country}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-zinc-500">
                  Items
                </h3>
                <div className="border border-zinc-200 rounded divide-y divide-zinc-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-[11px] text-zinc-500">₱{item.unitPrice.toLocaleString()} each × {item.quantity}</p>
                      </div>
                      <p className="font-mono font-bold text-zinc-900">
                        ₱{(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financing review */}
              {selectedOrder.installment && (
                <div className="p-4 bg-zinc-50 rounded border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-200">
                    <span className="font-bold text-zinc-900 text-xs">
                      Financing details
                    </span>
                    {selectedOrder.installment.confirmedTerms && (
                      <span className="text-[11px] text-zinc-500">
                        Terms confirmed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">Plan</span>
                      <p className="font-semibold text-zinc-900">{selectedOrder.installment.planName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Downpayment</span>
                      <p className="font-bold text-zinc-900 font-mono">
                        ₱{(selectedOrder.installment.downpayment || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Downpayment status</span>
                      <p className="font-semibold text-zinc-900">
                        {selectedOrder.installment.downpaymentConfirmedAt
                          ? `Confirmed (${selectedOrder.installment.downpaymentConfirmedAt})`
                          : "Pending settlement"}
                      </p>
                    </div>
                  </div>

                  {/* Submitted documents */}
                  <div className="p-3 bg-white rounded border border-zinc-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
                        <span className="font-medium text-zinc-900">Government ID</span>
                      </div>
                      {selectedOrder.installment.validId?.startsWith("http") ? (
                        <a
                          href={selectedOrder.installment.validId}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Open document</span>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <span className="font-mono text-zinc-700 text-[11px] truncate">{selectedOrder.installment.validId}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
                        <span className="font-medium text-zinc-900">Proof of income</span>
                      </div>
                      {selectedOrder.installment.proofOfIncome?.startsWith("http") ? (
                        <a
                          href={selectedOrder.installment.proofOfIncome}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Open document</span>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <span className="font-mono text-zinc-700 text-[11px] truncate">{selectedOrder.installment.proofOfIncome}</span>
                      )}
                    </div>
                  </div>

                  {/* Decision actions */}
                  {selectedOrder.status === "For Approval" && (
                    <div className="pt-2 border-t border-zinc-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <label htmlFor="rejection-reason" className="sr-only">
                          Reason for rejection
                        </label>
                        <input
                          id="rejection-reason"
                          type="text"
                          value={rejectionReason}
                          onChange={handleRejectionReasonChange}
                          placeholder="Reason for rejection (optional)"
                          className="flex-1 h-8 px-2 text-xs border border-zinc-300 rounded bg-white focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700 focus:outline-offset-1 transition-colors"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectApplication(selectedOrder._id)}
                          className="h-8 px-3 rounded bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium cursor-pointer transition-colors"
                        >
                          Reject application
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveApplication(selectedOrder._id)}
                          className="h-8 px-4 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold cursor-pointer transition-colors"
                        >
                          Approve application
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm downpayment — only for COD/cash-on-releasing, not for pre-paid online */}
                  {selectedOrder.status === "Awaiting Downpayment" && !selectedOrder.installment?.downPaymentSettled && (
                    <div className="pt-2 border-t border-zinc-200 space-y-2">
                      {selectedOrder.installment?.downPaymentMethod && selectedOrder.installment.downPaymentMethod !== "cash_on_releasing" ? (
                        <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          Downpayment paid via {selectedOrder.installment.downPaymentMethod.replace(/_/g, " ").toUpperCase()} — auto-confirmed.
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] text-zinc-600">
                            Customer will pay the downpayment in cash at the branch. Collect and verify before confirming.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleConfirmDownpayment(selectedOrder._id)}
                            className="h-8 px-4 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold cursor-pointer transition-colors whitespace-nowrap"
                          >
                            Confirm downpayment received
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Fulfillment step for cash orders */}
              {!selectedOrder.isApplication && selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-3">
                  <span className="font-medium text-zinc-700">Fulfillment status</span>
                  <div className="flex items-center gap-2">
                    <select
                      id="fulfillment-status"
                      className="h-8 px-2 border border-zinc-300 rounded text-xs bg-white"
                      defaultValue={selectedOrder.status}
                    >
                      {selectedOrder.status === "Pending" && <option value="Pending">Pending</option>}
                      {(selectedOrder.status === "Pending" || selectedOrder.status === "Processing") && <option value="Processing">Processing</option>}
                      {(selectedOrder.status === "Processing" || selectedOrder.status === "Shipped") && <option value="Shipped">Shipped</option>}
                      {(selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered") && <option value="Delivered">Delivered</option>}
                      {(selectedOrder.status === "Pending" || selectedOrder.status === "Processing") && <option value="Cancelled">Cancelled</option>}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const select = document.getElementById("fulfillment-status");
                        const val = select?.value;
                        if (val && val !== selectedOrder.status) {
                          handleUpdateStatus(selectedOrder._id, val);
                        }
                      }}
                      className="h-8 px-3 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
              {!selectedOrder.isApplication && (selectedOrder.status === "Delivered" || selectedOrder.status === "Cancelled") && (
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-3">
                  <span className="font-medium text-zinc-700">Fulfillment status</span>
                  <span className="text-xs text-zinc-500">Completed - no changes allowed</span>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              {!selectedOrder.isApplication ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`${import.meta.env.VITE_API}/order/${selectedOrder._id}/receipt?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                    download={`Receipt-${selectedOrder.id}.pdf`}
                    className="inline-flex items-center gap-2 h-8 px-3 rounded bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 font-medium text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF receipt</span>
                  </a>
                  <a
                    href={`${import.meta.env.VITE_API}/order/${selectedOrder._id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 h-8 px-3 rounded bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 font-medium text-xs transition-colors"
                  >
                    <span>View receipt</span>
                  </a>
                </div>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 px-4 rounded border border-zinc-300 text-zinc-700 hover:bg-white cursor-pointer font-medium text-xs transition-colors"
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
