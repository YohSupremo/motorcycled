import { useState } from "react";

export const AdminOrders = ({ initialSelectedOrderId }) => {
  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject' | 'confirm_dp' | 'update_status'
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const [orders, setOrders] = useState([
    {
      id: "ORD-2026-0891",
      customer: "Juan Dela Cruz",
      email: "juan.delacruz@example.com",
      phone: "0917 123 4567",
      createdAt: "2026-10-01 14:32",
      paymentMethod: "installment",
      status: "For Approval",
      shippingInfo: {
        address: "Unit 402, Emerald Mansions, Ortigas Center",
        city: "Pasig City",
        postalCode: "1605",
        country: "Philippines",
        phoneNumber: "0917 123 4567",
      },
      items: [
        {
          name: "Yamaha NMAX 155 ABS (Matte Dark Bluish Gray)",
          unitPrice: 151900,
          quantity: 1,
        },
      ],
      shippingPrice: 0,
      taxRate: 0.12,
      installment: {
        planName: "12 Months Standard",
        termMonths: 12,
        interestRate: 0.07,
        minDownpaymentPercent: 20,
        processingFee: 1500,
        downpayment: 32000,
        downpaymentConfirmedAt: null,
        applicationStatus: "For Approval",
        validId: "PH-DL-N02-99-123456 (Professional Driver's License)",
        proofOfIncome: "3-Month BDO Electronic Statement & Payslip",
      },
    },
    {
      id: "ORD-2026-0885",
      customer: "Karlo Mendoza",
      email: "karlo.m@example.com",
      phone: "0918 333 4444",
      createdAt: "2026-09-29 10:15",
      paymentMethod: "installment",
      status: "Awaiting Downpayment",
      shippingInfo: {
        address: "74 Timog Avenue, South Triangle",
        city: "Quezon City",
        postalCode: "1103",
        country: "Philippines",
        phoneNumber: "0918 333 4444",
      },
      items: [
        {
          name: "Honda Click 125i (Pearl Arctic White)",
          unitPrice: 81400,
          quantity: 1,
        },
      ],
      shippingPrice: 350,
      taxRate: 0.12,
      installment: {
        planName: "24 Months Commuter",
        termMonths: 24,
        interestRate: 0.08,
        minDownpaymentPercent: 20,
        processingFee: 1500,
        downpayment: 17000,
        downpaymentConfirmedAt: null,
        applicationStatus: "Approved",
        validId: "UMID-CRN-0111-2345-6",
        proofOfIncome: "Certificate of Employment (BPO IT)",
      },
    },
    {
      id: "ORD-2026-0880",
      customer: "Christian Bautista",
      email: "bautista.c@example.com",
      phone: "0922 456 7890",
      createdAt: "2026-09-26 16:45",
      paymentMethod: "installment",
      status: "Processing",
      shippingInfo: {
        address: "Lot 8 Block 3, Banilad Heights",
        city: "Cebu City",
        postalCode: "6000",
        country: "Philippines",
        phoneNumber: "0922 456 7890",
      },
      items: [
        {
          name: "Kawasaki Ninja 400 SE (Lime Green / Ebony)",
          unitPrice: 340900,
          quantity: 1,
        },
      ],
      shippingPrice: 0,
      taxRate: 0.12,
      installment: {
        planName: "36 Months Tier 1",
        termMonths: 36,
        interestRate: 0.09,
        minDownpaymentPercent: 20,
        processingFee: 2500,
        downpayment: 70000,
        downpaymentConfirmedAt: "2026-09-27 11:20",
        applicationStatus: "Approved",
        validId: "PH-PASSPORT-P89211A",
        proofOfIncome: "Audited Financials & Form 1701",
      },
    },
    {
      id: "ORD-2026-0872",
      customer: "Ramon Valenzuela",
      email: "ramon.v@example.com",
      phone: "0917 555 8899",
      createdAt: "2026-09-24 09:12",
      paymentMethod: "online",
      status: "Delivered",
      shippingInfo: {
        address: "15 Real Street, Alabang",
        city: "Muntinlupa City",
        postalCode: "1780",
        country: "Philippines",
        phoneNumber: "0917 555 8899",
      },
      items: [
        {
          name: "Brembo 4-Piston Caliper + Sintered Pads",
          unitPrice: 8400,
          quantity: 1,
        },
        {
          name: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
          unitPrice: 780,
          quantity: 2,
        },
      ],
      shippingPrice: 350,
      taxRate: 0.12,
      installment: null,
    },
  ]);

  const statusTabs = [
    "All",
    "For Approval",
    "Awaiting Downpayment",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  // Helper to compute derived order total
  const computeTotal = (order) => {
    const itemsPrice = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = itemsPrice * order.taxRate;
    return itemsPrice + order.shippingPrice + tax;
  };

  const filteredOrders = orders.filter((o) => {
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

  const handleApproveApplication = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "Awaiting Downpayment",
            installment: {
              ...o.installment,
              applicationStatus: "Approved",
            },
          };
        }
        return o;
      })
    );
    setSelectedOrder(null);
  };

  const handleRejectApplication = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "Cancelled",
            installment: {
              ...o.installment,
              applicationStatus: "Rejected",
              rejectionReason: rejectionReason || "Documents insufficient or unverified income records.",
            },
          };
        }
        return o;
      })
    );
    setRejectionReason("");
    setSelectedOrder(null);
  };

  const handleConfirmDownpayment = (orderId) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "Processing",
            installment: {
              ...o.installment,
              downpaymentConfirmedAt: now,
            },
          };
        }
        return o;
      })
    );
    setSelectedOrder(null);
  };

  const handleUpdateStatus = (orderId, targetStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o))
    );
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
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => {
            const count = tab === "All" ? orders.length : orders.filter((o) => o.status === tab).length;
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
            placeholder="Filter by Order ID (e.g. ORD-2026), customer name, or unit..."
            className="w-full !h-9 px-3 text-xs bg-white border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Flat Orders Table (NO CARDS) */}
      <div className="border border-zinc-200 bg-white overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">Order Ref</th>
                <th className="py-2.5 px-4 font-semibold">Customer & Destination</th>
                <th className="py-2.5 px-4 font-semibold">Items Snapshot</th>
                <th className="py-2.5 px-4 font-semibold">Payment / Plan</th>
                <th className="py-2.5 px-4 font-semibold">Order Total</th>
                <th className="py-2.5 px-4 font-semibold">Fulfillment Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    No orders match the selected criteria.
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
                            <div key={idx} className="line-clamp-1">
                              <span className="font-medium text-zinc-900">{item.name}</span>
                              <span className="text-zinc-500 font-mono text-[10px]"> (x{item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Payment Method / Plan */}
                      <td className="py-3 px-4">
                        {o.paymentMethod === "installment" ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Installment • {o.installment?.termMonths} Mo
                            </span>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              DP: ₱{o.installment?.downpayment.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {o.paymentMethod.toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Order Total */}
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        ₱{Math.round(total).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {o.status === "For Approval" && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                            Screening Pending
                          </span>
                        )}
                        {o.status === "Awaiting Downpayment" && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-300">
                            Awaiting Downpayment
                          </span>
                        )}
                        {o.status === "Processing" && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-300">
                            Processing Release
                          </span>
                        )}
                        {o.status === "Delivered" && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Delivered / Released
                          </span>
                        )}
                        {o.status === "Cancelled" && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-300">
                            Cancelled / Voided
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="!h-7 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-[11px] cursor-pointer shadow-2xs"
                        >
                          Inspect & Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Installment Review Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-zinc-900">{selectedOrder.id}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-zinc-200 text-zinc-800">
                  {selectedOrder.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto text-xs flex-1">
              
              {/* Applicant & Shipping Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50/70 rounded-md border border-zinc-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Customer Details</span>
                  <p className="font-bold text-zinc-900 text-sm">{selectedOrder.customer}</p>
                  <p className="text-zinc-600">{selectedOrder.email}</p>
                  <p className="text-zinc-600 font-mono">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Registered Delivery Destination</span>
                  <p className="text-zinc-800 font-medium">{selectedOrder.shippingInfo.address}</p>
                  <p className="text-zinc-600">{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.postalCode}</p>
                  <p className="text-zinc-500 font-mono">Freight: {selectedOrder.shippingPrice === 0 ? "Free Showroom Pickup" : `₱${selectedOrder.shippingPrice}`}</p>
                </div>
              </div>

              {/* Items Ordered */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Ordered Vehicle / Components</span>
                <div className="border border-zinc-200 rounded divide-y divide-zinc-100">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">{it.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">Unit Price: ₱{it.unitPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-zinc-900 font-mono">₱{(it.unitPrice * it.quantity).toLocaleString()}</span>
                        <span className="block text-[10px] text-zinc-500">Qty: {it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installment Application Deep Dive */}
              {selectedOrder.paymentMethod === "installment" && selectedOrder.installment && (
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="font-bold text-emerald-950 text-xs">
                      Installment Contract & Document Review
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      Application: {selectedOrder.installment.applicationStatus}
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
                      <span className="font-mono text-zinc-700 text-[11px]">{selectedOrder.installment.validId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span className="font-medium text-zinc-900">Proof of Monthly Income / Capacity:</span>
                      </div>
                      <span className="font-mono text-zinc-700 text-[11px]">{selectedOrder.installment.proofOfIncome}</span>
                    </div>
                  </div>

                  {/* Operational Decision Actions */}
                  {selectedOrder.status === "For Approval" && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectApplication(selectedOrder.id)}
                        className="!h-8 px-3 rounded bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveApplication(selectedOrder.id)}
                        className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold cursor-pointer shadow-2xs"
                      >
                        Approve Credit & Require Downpayment &rarr;
                      </button>
                    </div>
                  )}

                  {/* Confirm Downpayment Action */}
                  {selectedOrder.status === "Awaiting Downpayment" && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-600">
                        Ensure official receipt or bank deposit slip is verified before confirming downpayment.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleConfirmDownpayment(selectedOrder.id)}
                        className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Confirm Downpayment Received
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Stepper / Order Fulfillment */}
              {selectedOrder.status !== "For Approval" && selectedOrder.status !== "Awaiting Downpayment" && (
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                  <span className="font-medium text-zinc-700">Advance Fulfillment Stage:</span>
                  <div className="flex items-center gap-2">
                    {selectedOrder.status === "Processing" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "Shipped")}
                        className="!h-8 px-3 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-800 cursor-pointer"
                      >
                        Mark as Shipped / Dispatched
                      </button>
                    )}
                    {selectedOrder.status === "Shipped" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, "Delivered")}
                        className="!h-8 px-3 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 cursor-pointer"
                      >
                        Mark as Delivered / Handed Over
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
                className="!h-8 px-4 rounded border border-zinc-300 text-zinc-700 hover:bg-white cursor-pointer"
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
