import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";

export const Orders = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const activeInstallmentOrder = {
    orderId: "ORD-2026-0042",
    productName: "Yamaha NMAX 155 ABS",
    category: "Motorcycles",
    brand: "Yamaha",
    totalPrice: "₱151,900.00",
    downpayment: "₱30,380.00",
    downpaymentConfirmedAt: "Aug 02, 2026",
    financedAmount: "₱121,520.00",
    planName: "12 Months Standard Installment",
    termMonths: 12,
    monthlyDue: "₱11,340.00",
    remainingBalance: "₱68,040.00",
    orderStatus: "Delivered",
  };

  const paymentSchedules = [
    {
      installmentNo: 1,
      dueDate: "Aug 15, 2026",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Paid",
      receiptNo: "RCT-2026-0811",
      paidAt: "Aug 14, 2026",
      method: "online",
    },
    {
      installmentNo: 2,
      dueDate: "Sep 15, 2026",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Paid",
      receiptNo: "RCT-2026-0914",
      paidAt: "Sep 15, 2026",
      method: "bank_deposit",
    },
    {
      installmentNo: 3,
      dueDate: "Oct 15, 2026",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Unpaid",
      receiptNo: null,
      paidAt: null,
      method: null,
    },
    {
      installmentNo: 4,
      dueDate: "Nov 15, 2026",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Unpaid",
      receiptNo: null,
      paidAt: null,
      method: null,
    },
    {
      installmentNo: 5,
      dueDate: "Dec 15, 2026",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Unpaid",
      receiptNo: null,
      paidAt: null,
      method: null,
    },
    {
      installmentNo: 6,
      dueDate: "Jan 15, 2027",
      amountDue: "₱11,340.00",
      penalty: null,
      status: "Unpaid",
      receiptNo: null,
      paidAt: null,
      method: null,
    },
  ];

  const orders = [
    {
      orderId: "ORD-2026-0042",
      date: "Aug 01, 2026",
      items: [
        { name: "Yamaha NMAX 155 ABS", unitPrice: "₱151,900.00", quantity: 1 },
      ],
      paymentMethod: "installment",
      orderStatus: "Delivered",
      totalAmount: "₱151,900.00",
      deliveryAddress: "Block 14 Lot 8 Emerald Avenue, Pasig City",
    },
    {
      orderId: "ORD-2026-0089",
      date: "Sep 20, 2026",
      items: [
        {
          name: "HJC RPHA 11 Full-Face Helmet (Solid Matte)",
          unitPrice: "₱18,500.00",
          quantity: 1,
        },
        {
          name: "Yamalube 4T Full Synthetic 10W-40 (1L)",
          unitPrice: "₱450.00",
          quantity: 2,
        },
      ],
      paymentMethod: "online",
      orderStatus: "Processing",
      totalAmount: "₱19,400.00",
      deliveryAddress: "Block 14 Lot 8 Emerald Avenue, Pasig City",
    },
  ];

  const handleOpenPayment = (sched) => {
    setSelectedSchedule(sched);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Header & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Financing Schedule & Orders
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Contractual monthly amortization schedule, official receipts,
              downpayment confirmation, and parts order fulfillment.
            </p>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center gap-1 border border-zinc-200 p-0.5 rounded bg-zinc-50 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schedules")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === "schedules"
                  ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Installment Schedule
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === "orders"
                  ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Purchases ({orders.length})
            </button>
          </div>
        </div>

        {/* Financed Contract Summary Strip - Clean border panel, no floating shadow */}
        <ScrollReveal threshold={0.1} duration={600}>
          <div className="border border-zinc-200 rounded-md p-5 bg-zinc-50/60 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
            <div className="py-2 sm:py-0 sm:pr-4 first:pl-0 flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
                <ProductImagePlaceholder
                  category={activeInstallmentOrder.category}
                  name={activeInstallmentOrder.productName}
                  brand={activeInstallmentOrder.brand}
                  compact
                />
              </div>
              <div>
                <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Active Financed Unit
                </span>
                <p className="text-sm font-bold text-zinc-900">
                  {activeInstallmentOrder.productName}
                </p>
                <span className="text-xs font-mono text-zinc-500">
                  {activeInstallmentOrder.orderId}
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:px-4">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Next Monthly Due
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-zinc-900 font-mono">
                  {activeInstallmentOrder.monthlyDue}
                </span>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Oct 15, 2026
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:px-4">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Remaining Balance
              </span>
              <div className="mt-1">
                <span className="text-sm font-bold text-zinc-900 font-mono">
                  {activeInstallmentOrder.remainingBalance}
                </span>
                <p className="text-[11px] text-zinc-500">
                  of {activeInstallmentOrder.financedAmount} principal
                </p>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:pl-4 last:pr-0">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Installment Progress
              </span>
              <div className="mt-1">
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-emerald-700 font-semibold">
                    2 of 12 settled
                  </span>
                  <span className="font-mono text-zinc-500">16.7%</span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[16.7%]" />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Section: Payment Schedule Table - Unboxed directly on canvas */}
        {(activeTab === "all" || activeTab === "schedules") && (
          <ScrollReveal threshold={0.08} delay={50} duration={650}>
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                      Monthly Amortization Schedule
                    </h2>
                    <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      Active Deed
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Pre-computed monthly dues with breakdown of principal, grace
                    period, and payment verification receipts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenPayment(
                      paymentSchedules.find((s) => s.status === "Unpaid"),
                    )
                  }
                  className="inline-flex items-center gap-1.5 !h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Pay upcoming installment (Oct 15)
                </button>
              </div>

              <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[11px] font-semibold">
                        <th className="py-3 px-4">No.</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 font-mono">Amount Due</th>
                        <th className="py-3 px-4">Late Penalty</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Settled Date</th>
                        <th className="py-3 px-4 font-mono">Receipt No.</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {paymentSchedules.map((row) => (
                        <tr
                          key={row.installmentNo}
                          className="hover:bg-zinc-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-zinc-900">
                            #{row.installmentNo}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-800 whitespace-nowrap">
                            {row.dueDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-900 font-bold whitespace-nowrap">
                            {row.amountDue}
                          </td>
                          <td className="py-3 px-4 text-zinc-500">
                            {row.penalty ? row.penalty : "₱0.00"}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
                                row.status === "Paid"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                            {row.paidAt || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-600 whitespace-nowrap">
                            {row.receiptNo || "—"}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {row.status === "Paid" ? (
                              <button
                                type="button"
                                className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-medium cursor-pointer"
                              >
                                Download receipt
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(row)}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                              >
                                Pay now &rarr;
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 gap-2">
                <span>
                  Standard 3-day grace period applies before statutory 2%
                  penalty assessment.
                </span>
                <span className="font-mono text-zinc-700">
                  Downpayment confirmation: {activeInstallmentOrder.downpayment}
                </span>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Section: Purchase Orders - Unboxed list */}
        {(activeTab === "all" || activeTab === "orders") && (
          <ScrollReveal threshold={0.08} delay={70} duration={650}>
            <section className="space-y-4 pt-4 border-t border-zinc-200">
              <div className="pb-3 border-b border-zinc-200">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                  Delivered & In-Transit Purchases
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Summary of all unit bookings and parts fulfillment shipments.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200 bg-white overflow-hidden">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-5 hover:bg-zinc-50/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-zinc-900">
                          {ord.orderId}
                        </span>
                        <span className="text-xs text-zinc-300">|</span>
                        <span className="text-xs text-zinc-500">
                          {ord.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          Payment:{" "}
                          <strong className="uppercase font-mono text-zinc-800">
                            {ord.paymentMethod}
                          </strong>
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                            ord.orderStatus === "Delivered"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ord.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs text-zinc-700"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
                              <ProductImagePlaceholder
                                category={item.name}
                                name={item.name}
                                compact
                              />
                            </div>
                            <span className="font-medium text-zinc-900">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span className="font-mono text-zinc-900 font-semibold">
                            {item.unitPrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 gap-2">
                      <span>
                        Delivery Address:{" "}
                        <strong className="text-zinc-800 font-normal">
                          {ord.deliveryAddress}
                        </strong>
                      </span>
                      <span className="text-sm font-bold text-zinc-900">
                        Total:{" "}
                        <span className="font-mono">{ord.totalAmount}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>

      {/* Payment Submission Modal */}
      {showPaymentModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-sm w-full p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Pay Installment #{selectedSchedule.installmentNo}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Due: {selectedSchedule.dueDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(
                  `Payment recorded for Installment #${selectedSchedule.installmentNo}!`,
                );
                setShowPaymentModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Amount to Pay
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedSchedule.amountDue}
                  className="w-full !h-9 px-2.5 font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Payment Method
                </label>
                <select className="w-full !h-9 px-2.5 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer">
                  <option value="online">
                    Online Payment (GCash / Maya / Card)
                  </option>
                  <option value="bank_deposit">Bank Deposit / Transfer</option>
                  <option value="cash">Over-the-counter Cash Payment</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Reference No. (Bank or Gateway)
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-8392104"
                  required
                  className="w-full !h-9 px-2.5 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 !h-9 rounded-md border border-zinc-300 bg-white text-zinc-700 font-medium hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 !h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-xs"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
