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
    const payload = { orderStatus: backendStatus };
    if (targetStatus === "Delivered") {
      payload.orderStatus = "completed";
      payload.paymentStatus = "paid";
    }

    await dispatch(updateOrderStatus(orderId, payload));
    setActionSuccess(`Order updated to ${targetStatus}! Email with item breakdown & PDF receipt sent to customer.`);
    setTimeout(() => setActionSuccess(""), 4500);
    reloadData();
    setSelectedOrder(null);
  };

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Reference",
        width: 140,
        renderCell: (params) => {
          const o = params.row;
          return (
            <div className="py-1">
              <span className="font-mono font-bold text-zinc-900 block leading-tight">{o.id}</span>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{o.createdAt}</span>
            </div>
          );
        },
      },
      {
        field: "customer",
        headerName: "Customer & Destination",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => {
          const o = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">{o.customer}</span>
              <span className="text-[11px] text-zinc-400 truncate mt-0.5">{o.shippingInfo?.city || "—"}</span>
            </div>
          );
        },
      },
      {
        field: "items",
        headerName: "Items Snapshot",
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => {
          const o = params.row;
          const items = o.items || [];
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight py-1">
              <span className="text-zinc-900 font-medium truncate text-xs">
                {items[0] ? `${items[0].quantity}× ${items[0].name}` : "—"}
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
        headerName: "Type / Plan",
        flex: 1,
        minWidth: 150,
        valueGetter: (value, row) => (row.installment ? "Installment" : "Cash Order"),
        renderCell: (params) => {
          const o = params.row;
          return o.installment ? (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="admin-table-badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-medium uppercase">
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
        headerName: "Authoritative Total",
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
          let badgeCls = "bg-zinc-100 text-zinc-700 border-zinc-200";
          let dotCls = "bg-zinc-400";
          if (status === "For Approval") {
            badgeCls = "bg-amber-50 text-amber-700 border-amber-200";
            dotCls = "bg-amber-500";
          } else if (status === "Awaiting Downpayment") {
            badgeCls = "bg-blue-50 text-blue-700 border-blue-200";
            dotCls = "bg-blue-500";
          } else if (status === "Processing") {
            badgeCls = "bg-purple-50 text-purple-700 border-purple-200";
            dotCls = "bg-purple-500";
          } else if (status === "Shipped") {
            badgeCls = "bg-sky-50 text-sky-700 border-sky-200";
            dotCls = "bg-sky-500";
          } else if (status === "Delivered") {
            badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
            dotCls = "bg-emerald-500";
          } else if (status === "Rejected" || status === "Cancelled") {
            badgeCls = "bg-rose-50 text-rose-700 border-rose-200";
            dotCls = "bg-rose-500";
          }
          return (
            <span
              className={`admin-table-badge gap-1.5 text-[11px] font-medium border ${badgeCls}`}
              title={status}
            >
              <span className={`admin-table-badge__dot w-1.5 h-1.5 rounded-full ${dotCls}`} />
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
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <span>Review</span>
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold border border-zinc-300 hover:bg-zinc-50 text-zinc-700 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh Records
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-1.5 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-md">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span>{actionSuccess}</span>
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

      {/* Orders DataGrid */}
      <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
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
          sx={{
            border: "none",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fafafa",
              borderBottom: "1px solid #e4e4e7",
              color: "#52525b",
              fontWeight: 600,
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.05em",
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none !important",
            },
            "& .MuiDataGrid-columnHeader": {
              paddingLeft: "16px",
              paddingRight: "16px",
            },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none !important",
            },
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #f4f4f5",
              transition: "background-color 0.15s ease",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(244, 244, 245, 0.7)",
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
              paddingLeft: "16px",
              paddingRight: "16px",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e4e4e7",
              backgroundColor: "#fafafa",
            },
            "& .MuiTablePagination-root": {
              fontSize: "0.75rem",
            },
          }}
        />
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

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              {!selectedOrder.isApplication ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`${import.meta.env.VITE_API}/order/${selectedOrder._id}/receipt?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                    download={`Receipt-${selectedOrder.id}.pdf`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF Receipt</span>
                  </a>
                  <a
                    href={`${import.meta.env.VITE_API}/order/${selectedOrder._id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 font-medium text-xs transition-colors shadow-2xs"
                  >
                    <span>View HTML</span>
                  </a>
                </div>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-8 px-4 rounded border border-zinc-300 text-zinc-700 hover:bg-white cursor-pointer font-medium text-xs shadow-2xs"
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
