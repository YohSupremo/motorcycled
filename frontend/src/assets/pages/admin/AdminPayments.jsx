import { useState } from "react";

export const AdminPayments = () => {
  const [activeSubTab, setActiveSubTab] = useState("schedules"); // 'schedules' | 'payments'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    orderId: "ORD-2026-0891",
    customer: "Juan Dela Cruz",
    type: "installment",
    amount: "10792",
    method: "bank_deposit",
    referenceNo: "BDO-DEP-9923841",
    notes: "Over-the-counter deposit at Megamall branch",
  });

  const [schedules, setSchedules] = useState([
    {
      id: "SCH-1001",
      orderId: "ORD-2026-0891",
      customer: "Juan Dela Cruz",
      installmentNo: 1,
      totalTerms: 12,
      dueDate: "2026-10-15",
      amountDue: 10792,
      penalty: 0,
      status: "Unpaid",
      defaultedAt: null,
    },
    {
      id: "SCH-1002",
      orderId: "ORD-2026-0885",
      customer: "Karlo Mendoza",
      installmentNo: 3,
      totalTerms: 24,
      dueDate: "2026-10-10",
      amountDue: 3950,
      penalty: 0,
      status: "Unpaid",
      defaultedAt: null,
    },
    {
      id: "SCH-0994",
      orderId: "ORD-2026-0710",
      customer: "Eduardo Garcia",
      installmentNo: 5,
      totalTerms: 12,
      dueDate: "2026-09-25",
      amountDue: 8450,
      penalty: 250,
      status: "Overdue",
      defaultedAt: null,
    },
    {
      id: "SCH-0988",
      orderId: "ORD-2026-0685",
      customer: "Patricia Lim",
      installmentNo: 8,
      totalTerms: 12,
      dueDate: "2026-09-28",
      amountDue: 5900,
      penalty: 250,
      status: "Overdue",
      defaultedAt: null,
    },
    {
      id: "SCH-0950",
      orderId: "ORD-2026-0520",
      customer: "Nestor Aquino",
      installmentNo: 4,
      totalTerms: 24,
      dueDate: "2026-08-15",
      amountDue: 7200,
      penalty: 500,
      status: "Defaulted",
      defaultedAt: "2026-09-18",
    },
    {
      id: "SCH-0920",
      orderId: "ORD-2026-0880",
      customer: "Christian Bautista",
      installmentNo: 1,
      totalTerms: 36,
      dueDate: "2026-09-30",
      amountDue: 9850,
      penalty: 0,
      status: "Paid",
      defaultedAt: null,
    },
  ]);

  const [payments, setPayments] = useState([
    {
      receiptNo: "REC-2026-5510",
      orderId: "ORD-2026-0880",
      customer: "Christian Bautista",
      type: "downpayment",
      amount: 70000,
      method: "bank_deposit",
      referenceNo: "BDO-REF-4418902",
      paidAt: "2026-09-27 11:20",
      recordedBy: "Kelly Laurence (Admin)",
    },
    {
      receiptNo: "REC-2026-5509",
      orderId: "ORD-2026-0880",
      customer: "Christian Bautista",
      type: "installment",
      amount: 9850,
      method: "online",
      referenceNo: "GCASH-9912048",
      paidAt: "2026-09-30 08:45",
      recordedBy: "System (Webhook)",
    },
    {
      receiptNo: "REC-2026-5508",
      orderId: "ORD-2026-0872",
      customer: "Ramon Valenzuela",
      type: "full",
      amount: 9960,
      method: "online",
      referenceNo: "PAYMAYA-332198",
      paidAt: "2026-09-24 09:12",
      recordedBy: "System (Gateway)",
    },
  ]);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const newReceipt = {
      receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: paymentForm.orderId,
      customer: paymentForm.customer,
      type: paymentForm.type,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      referenceNo: paymentForm.referenceNo,
      paidAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      recordedBy: "Kelly Laurence (Admin)",
    };

    setPayments([newReceipt, ...payments]);

    // If it settles a schedule, mark paid
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.orderId === paymentForm.orderId && s.status !== "Paid") {
          return { ...s, status: "Paid", penalty: 0 };
        }
        return s;
      })
    );

    setIsModalOpen(false);
  };

  const handleMarkDefaulted = (scheduleId) => {
    const today = new Date().toISOString().slice(0, 10);
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, status: "Defaulted", defaultedAt: today }
          : s
      )
    );
  };

  const filteredSchedules = schedules.filter((s) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        s.orderId.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Payments, Receipts & Installment Schedules
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Record manual cash/bank collections, monitor contractual payment rows, and enforce default penalties (<code className="font-mono text-zinc-600">payments</code> & <code className="font-mono text-zinc-600">payment_schedules</code> records).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 !h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record Collection</span>
        </button>
      </div>

      {/* Flat Unified Financial Metrics Strip (NO CARDS) */}
      <div className="border-y border-zinc-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
        <div className="px-4 py-2 space-y-1">
          <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">Month Collections</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">₱89,810</p>
          <p className="text-[11px] text-zinc-500">14 transactions recorded</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">Unpaid Dues (Current)</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">₱14,742</p>
          <p className="text-[11px] text-zinc-500">2 installments maturing this week</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="font-mono uppercase text-[10px] tracking-wider text-red-700 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Overdue Delinquencies
          </span>
          <p className="text-2xl font-bold tracking-tight text-red-700 font-mono">₱14,850</p>
          <p className="text-[11px] text-red-600">2 delinquent schedule rows</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">Defaulted Accounts</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">1 Account</p>
          <p className="text-[11px] text-zinc-500">Statutory delinquency enforcement</p>
        </div>
      </div>

      {/* Sub-Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("schedules")}
            className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer border-b-2 -mb-2 ${
              activeSubTab === "schedules"
                ? "border-emerald-600 text-emerald-950 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Payment Schedules Tracker ({schedules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("payments")}
            className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer border-b-2 -mb-2 ${
              activeSubTab === "payments"
                ? "border-emerald-600 text-emerald-950 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Official Receipts & Payments Log ({payments.length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ref, customer, or status..."
          className="!h-8 px-2.5 text-xs bg-white border border-zinc-300 focus:border-emerald-600 focus:outline-none max-w-xs"
        />
      </div>

      {/* TAB 1: Payment Schedules Tracker (Flat Table) */}
      {activeSubTab === "schedules" && (
        <div className="border border-zinc-200 bg-white overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Schedule ID</th>
                  <th className="py-2.5 px-4 font-semibold">Order / Customer</th>
                  <th className="py-2.5 px-4 font-semibold">Installment Term</th>
                  <th className="py-2.5 px-4 font-semibold">Due Date</th>
                  <th className="py-2.5 px-4 font-semibold">Contractual Due</th>
                  <th className="py-2.5 px-4 font-semibold">Status / Decision</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSchedules.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900">{s.id}</td>
                    
                    <td className="py-3 px-4">
                      <span className="font-mono text-zinc-600 block">{s.orderId}</span>
                      <span className="font-semibold text-zinc-900">{s.customer}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 font-mono text-[11px]">
                        Month {s.installmentNo} of {s.totalTerms}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-700">
                      {s.dueDate}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-zinc-900">₱{s.amountDue.toLocaleString()}</span>
                      {s.penalty > 0 && (
                        <span className="block text-[10px] text-red-600 font-medium">+₱{s.penalty} penalty</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {s.status === "Paid" && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Paid Settled
                        </span>
                      )}
                      {s.status === "Unpaid" && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Upcoming / Unpaid
                        </span>
                      )}
                      {s.status === "Overdue" && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-300">
                          Overdue Delinquent
                        </span>
                      )}
                      {s.status === "Defaulted" && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-950 border border-red-400">
                          Defaulted ({s.defaultedAt})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {s.status === "Overdue" && (
                        <button
                          type="button"
                          onClick={() => handleMarkDefaulted(s.id)}
                          className="!h-6 px-2 text-[10px] font-medium border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Mark Account as Defaulted"
                        >
                          Mark Default
                        </button>
                      )}
                      {s.status === "Unpaid" && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentForm({
                              orderId: s.orderId,
                              customer: s.customer,
                              type: "installment",
                              amount: String(s.amountDue),
                              method: "cash",
                              referenceNo: `CASH-REC-${Date.now().toString().slice(-4)}`,
                              notes: `Settle month ${s.installmentNo}`,
                            });
                            setIsModalOpen(true);
                          }}
                          className="!h-6 px-2 text-[10px] font-medium border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Official Receipts & Payments Log */}
      {activeSubTab === "payments" && (
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Receipt No</th>
                  <th className="py-2.5 px-4 font-semibold">Order / Payer</th>
                  <th className="py-2.5 px-4 font-semibold">Payment Type</th>
                  <th className="py-2.5 px-4 font-semibold">Method & Reference</th>
                  <th className="py-2.5 px-4 font-semibold">Amount Settle</th>
                  <th className="py-2.5 px-4 font-semibold">Recorded By / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.map((p) => (
                  <tr key={p.receiptNo} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">{p.receiptNo}</td>
                    
                    <td className="py-3 px-4">
                      <span className="font-mono text-zinc-500 block">{p.orderId}</span>
                      <span className="font-semibold text-zinc-900">{p.customer}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {p.type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-900 capitalize block">{p.method.replace("_", " ")}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{p.referenceNo}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      ₱{p.amount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-zinc-800 block">{p.recordedBy}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{p.paidAt}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
            
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-sm font-bold text-zinc-900">
                Record Manual Collection
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Target Order Reference *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.orderId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, orderId: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Paying Customer Name *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.customer}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customer: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Payment Type *</label>
                  <select
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none capitalize"
                  >
                    <option value="installment">Installment Due</option>
                    <option value="downpayment">Downpayment</option>
                    <option value="payoff">Early Payoff</option>
                    <option value="full">Full Cash Settled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Amount Paid (₱) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Method *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="cash">Showroom Cash</option>
                    <option value="bank_deposit">Bank Deposit (BDO/BPI)</option>
                    <option value="online">Online / GCash / Maya</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Bank / Ref Number *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    placeholder="e.g. BDO-DEP-9921"
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-2xs"
                >
                  Generate Official Receipt
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
