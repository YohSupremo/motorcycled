import { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

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

  const scheduleColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Schedule ID",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono font-semibold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "orderCustomer",
        headerName: "Order / Customer",
        flex: 1.2,
        minWidth: 180,
        valueGetter: (value, row) => `${row.orderId} ${row.customer}`,
        renderCell: (params) => {
          const s = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">
                {s.customer}
              </span>
              <span className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">
                {s.orderId}
              </span>
            </div>
          );
        },
      },
      {
        field: "term",
        headerName: "Installment Term",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700 text-xs">
            Month {params.row.installmentNo} of {params.row.totalTerms}
          </span>
        ),
      },
      {
        field: "dueDate",
        headerName: "Due Date",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700 text-xs">
            {params.row.dueDate}
          </span>
        ),
      },
      {
        field: "amountDue",
        headerName: "Contractual Due",
        width: 150,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          const s = params.row;
          return (
            <div className="flex flex-col justify-center leading-tight">
              <span className="font-mono font-bold text-zinc-900 text-xs">
                ₱{s.amountDue.toLocaleString()}
              </span>
              {s.penalty > 0 ? (
                <span className="text-[10px] text-rose-600 font-mono font-medium mt-0.5">
                  +₱{s.penalty} penalty
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        field: "status",
        headerName: "Status / Decision",
        width: 205,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const s = params.row;
          let badgeCls = "bg-zinc-100 text-zinc-700 border-zinc-200";
          let dotCls = "bg-zinc-400";
          let label = s.status;
          if (s.status === "Paid") {
            badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
            dotCls = "bg-emerald-500";
            label = "Settled";
          } else if (s.status === "Unpaid") {
            badgeCls = "bg-zinc-100 text-zinc-700 border-zinc-200";
            dotCls = "bg-zinc-400";
            label = "Upcoming";
          } else if (s.status === "Overdue") {
            badgeCls = "bg-amber-50 text-amber-700 border-amber-200";
            dotCls = "bg-amber-500";
            label = "Overdue";
          } else if (s.status === "Defaulted") {
            badgeCls = "bg-rose-50 text-rose-700 border-rose-200";
            dotCls = "bg-rose-500";
            label = s.defaultedAt ? `Defaulted (${s.defaultedAt})` : "Defaulted";
          }
          return (
            <div className="admin-table-cell-center justify-center">
              <span
                className={`admin-table-badge gap-1.5 text-[11px] font-medium border ${badgeCls}`}
                title={label}
              >
                <span className={`admin-table-badge__dot w-1.5 h-1.5 rounded-full ${dotCls}`} />
                {label}
              </span>
            </div>
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
          const s = params.row;
          return (
            <div className="flex items-center justify-end gap-1.5 w-full">
              {s.status === "Overdue" && (
                <button
                  type="button"
                  onClick={() => handleMarkDefaulted(s.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Mark Account as Defaulted"
                >
                  <svg
                    className="w-3.5 h-3.5 text-rose-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Default</span>
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <svg
                    className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Collect</span>
                </button>
              )}
              {s.status === "Paid" && (
                <span className="text-[11px] text-zinc-400 font-mono">
                  Settled
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const paymentColumns = useMemo(
    () => [
      {
        field: "receiptNo",
        headerName: "Receipt No",
        width: 140,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.receiptNo}</span>
        ),
      },
      {
        field: "orderPayer",
        headerName: "Order / Payer",
        flex: 1.2,
        minWidth: 180,
        valueGetter: (value, row) => `${row.orderId} ${row.customer}`,
        renderCell: (params) => {
          const p = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">{p.customer}</span>
              <span className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">{p.orderId}</span>
            </div>
          );
        },
      },
      {
        field: "type",
        headerName: "Payment Type",
        width: 130,
        renderCell: (params) => (
          <span className="admin-table-badge text-[11px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase">
            {params.row.type}
          </span>
        ),
      },
      {
        field: "method",
        headerName: "Method & Reference",
        flex: 1.2,
        minWidth: 170,
        renderCell: (params) => {
          const p = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-medium text-zinc-900 text-xs capitalize truncate">
                {(p.method || "").replace("_", " ")}
              </span>
              <span className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">{p.referenceNo}</span>
            </div>
          );
        },
      },
      {
        field: "amount",
        headerName: "Amount Settle",
        width: 140,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => (
          <span className="font-mono font-bold text-emerald-800 text-xs">
            ₱{params.row.amount.toLocaleString()}
          </span>
        ),
      },
      {
        field: "recordedBy",
        headerName: "Recorded By / Date",
        flex: 1.2,
        minWidth: 170,
        renderCell: (params) => {
          const p = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="text-zinc-800 text-xs truncate">{p.recordedBy}</span>
              <span className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">{p.paidAt}</span>
            </div>
          );
        },
      },
    ],
    []
  );

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
          className="inline-flex items-center gap-2 h-9! px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
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

      {/* TAB 1: Payment Schedules Tracker */}
      {activeSubTab === "schedules" && (
        <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <DataGrid
            rows={filteredSchedules}
            columns={scheduleColumns}
            getRowId={(row) => row.id}
            rowHeight={60}
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
      )}

      {/* TAB 2: Official Receipts & Payments Log */}
      {activeSubTab === "payments" && (
        <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <DataGrid
            rows={payments}
            columns={paymentColumns}
            getRowId={(row) => row.receiptNo}
            rowHeight={60}
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
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
