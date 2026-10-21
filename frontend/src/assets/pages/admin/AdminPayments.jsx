import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const paymentSchema = yup.object({
  orderId: yup.string().trim().required("Order reference is required"),
  customer: yup.string().trim().required("Customer name is required"),
  type: yup.string().required("Payment type is required"),
  amount: yup
    .number()
    .typeError("Amount paid must be a number")
    .required("Amount paid is required")
    .min(1, "Amount must be at least ₱1"),
  method: yup.string().required("Payment method is required"),
  referenceNo: yup.string().trim().required("Reference number is required"),
});

const PAYMENT_TYPE_LABELS = {
  installment: "Installment",
  downpayment: "Downpayment",
  payoff: "Payoff",
  full: "Full payment",
};

export const AdminPayments = () => {
  const [activeSubTab, setActiveSubTab] = useState("schedules"); // "schedules" or "payments"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      orderId: "ORD-2026-0891",
      customer: "Juan Dela Cruz",
      type: "installment",
      amount: 10792,
      method: "bank_deposit",
      referenceNo: "BDO-DEP-9923841",
    },
  });

  const handleOpenRecordModal = (
    orderId = "ORD-2026-0891",
    customer = "Juan Dela Cruz",
    amount = 10792,
    method = "bank_deposit"
  ) => {
    reset({
      orderId,
      customer,
      type: "installment",
      amount: Number(amount) || 0,
      method,
      referenceNo: `REF-${Date.now().toString().slice(-6)}`,
    });
    setIsModalOpen(true);
  };

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

  const onRecordPaymentSubmit = (data) => {
    const newReceipt = {
      receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: data.orderId,
      customer: data.customer,
      type: data.type,
      amount: Number(data.amount),
      method: data.method,
      referenceNo: data.referenceNo,
      paidAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      recordedBy: "Kelly Laurence (Admin)",
    };

    setPayments((prev) => [newReceipt, ...prev]);

    // If it settles a schedule, mark paid
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.orderId === data.orderId && s.status !== "Paid") {
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

  const handleSearchChange = (event) => setSearchQuery(event.target.value);

  const scheduleColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Schedule",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono font-semibold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "orderCustomer",
        headerName: "Customer",
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
        headerName: "Term",
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
        headerName: "Due date",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700 text-xs">
            {params.row.dueDate}
          </span>
        ),
      },
      {
        field: "amountDue",
        headerName: "Amount due",
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
        headerName: "Status",
        width: 205,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const s = params.row;
          let badgeCls = "bg-zinc-100 text-zinc-700 border-zinc-200";
          let dotCls = "bg-zinc-400";
          if (s.status === "Paid") {
            badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
            dotCls = "bg-emerald-500";
          } else if (s.status === "Overdue") {
            badgeCls = "bg-amber-50 text-amber-700 border-amber-200";
            dotCls = "bg-amber-500";
          } else if (s.status === "Defaulted") {
            badgeCls = "bg-rose-50 text-rose-700 border-rose-200";
            dotCls = "bg-rose-500";
          }
          return (
            <div className="admin-table-cell-center justify-center">
              <span
                className={`admin-table-badge gap-2 text-[11px] font-medium border ${badgeCls}`}
                title={s.status}
              >
                <span className={`admin-table-badge__dot w-1.5 h-1.5 rounded-full ${dotCls}`} />
                {s.status}
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
            <div className="flex items-center justify-end gap-2 w-full">
              {s.status === "Overdue" && (
                <button
                  type="button"
                  onClick={() => handleMarkDefaulted(s.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded transition-colors cursor-pointer whitespace-nowrap"
                  title="Mark account as defaulted"
                >
                  <svg
                    className="w-3.5 h-3.5 text-rose-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
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
                  onClick={() =>
                    handleOpenRecordModal(
                      s.orderId,
                      s.customer,
                      s.amountDue,
                      "cash"
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded transition-colors cursor-pointer whitespace-nowrap"
                >
                  <svg
                    className="w-3.5 h-3.5 text-zinc-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Collect</span>
                </button>
              )}
              {s.status === "Paid" && (
                <span className="text-[11px] text-zinc-400 font-mono">-</span>
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
        headerName: "Receipt",
        width: 140,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.receiptNo}</span>
        ),
      },
      {
        field: "orderPayer",
        headerName: "Payer",
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
        headerName: "Payment type",
        width: 130,
        renderCell: (params) => (
          <span className="admin-table-badge text-[11px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase">
            {PAYMENT_TYPE_LABELS[params.row.type] || params.row.type}
          </span>
        ),
      },
      {
        field: "method",
        headerName: "Method",
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
        headerName: "Amount",
        width: 140,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900 text-xs">
            ₱{params.row.amount.toLocaleString()}
          </span>
        ),
      },
      {
        field: "recordedBy",
        headerName: "Recorded",
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
      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Payments and schedules
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Record cash and bank collections, track installment schedules, and apply penalties to overdue accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenRecordModal()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record collection</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="border-y border-zinc-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
        <div className="px-4 py-2 space-y-1">
          <span className="block text-[11px] font-medium text-zinc-500">Month collections</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">₱89,810</p>
          <p className="text-[11px] text-zinc-500">14 transactions recorded</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="block text-[11px] font-medium text-zinc-500">Unpaid dues, current</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">₱14,742</p>
          <p className="text-[11px] text-zinc-500">2 installments maturing this week</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            Overdue delinquencies
          </span>
          <p className="text-2xl font-bold tracking-tight text-rose-700 font-mono">₱14,850</p>
          <p className="text-[11px] text-rose-600">2 delinquent schedule rows</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="block text-[11px] font-medium text-zinc-500">Defaulted accounts</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">1 account</p>
          <p className="text-[11px] text-zinc-500">Statutory delinquency enforcement</p>
        </div>
      </div>

      {/* Tabs and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("schedules")}
            className={`px-3 py-2 font-semibold transition-colors cursor-pointer border-b-2 -mb-2 ${
              activeSubTab === "schedules"
                ? "border-zinc-900 text-zinc-900 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Payment schedules ({schedules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("payments")}
            className={`px-3 py-2 font-semibold transition-colors cursor-pointer border-b-2 -mb-2 ${
              activeSubTab === "payments"
                ? "border-zinc-900 text-zinc-900 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Receipts ({payments.length})
          </button>
        </div>

        <div className="max-w-xs w-full sm:w-auto">
          <label htmlFor="payments-search" className="sr-only">
            Search payment schedules
          </label>
          <input
            id="payments-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by order, customer, or status"
            className="!h-8 px-3 text-xs bg-white border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700 focus:outline-offset-1 w-full"
          />
        </div>
      </div>

      {/* Schedules */}
      {activeSubTab === "schedules" && (
        <div className="border border-zinc-200 bg-white rounded overflow-hidden">
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
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Receipts */}
      {activeSubTab === "payments" && (
        <div className="border border-zinc-200 bg-white rounded overflow-hidden">
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
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Record collection modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-collection-heading"
            className="bg-white border border-zinc-300 rounded max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2 id="record-collection-heading" className="text-sm font-bold text-zinc-900">
                Record collection
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 cursor-pointer transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onRecordPaymentSubmit)} noValidate className="p-4 space-y-3 text-xs">

              <div className="space-y-1">
                <label htmlFor="payment-order-id" className="font-semibold text-zinc-900">Order reference *</label>
                <input
                  id="payment-order-id"
                  type="text"
                  {...register("orderId")}
                  className={`w-full !h-8 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.orderId
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {errors.orderId && (
                  <span className="text-[11px] text-rose-600 block">
                    {errors.orderId.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="payment-customer" className="font-semibold text-zinc-900">Customer *</label>
                <input
                  id="payment-customer"
                  type="text"
                  {...register("customer")}
                  className={`w-full !h-8 px-3 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.customer
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {errors.customer && (
                  <span className="text-[11px] text-rose-600 block">
                    {errors.customer.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="payment-type" className="font-semibold text-zinc-900">Payment type *</label>
                  <select
                    id="payment-type"
                    {...register("type")}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700 focus:outline-offset-1"
                  >
                    <option value="installment">Installment due</option>
                    <option value="downpayment">Downpayment</option>
                    <option value="payoff">Early payoff</option>
                    <option value="full">Full payment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="payment-amount" className="font-semibold text-zinc-900">Amount paid *</label>
                  <input
                    id="payment-amount"
                    type="number"
                    min={1}
                    {...register("amount")}
                    className={`w-full !h-8 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      errors.amount
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {errors.amount && (
                    <span className="text-[11px] text-rose-600 block">
                      {errors.amount.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="payment-method" className="font-semibold text-zinc-900">Method *</label>
                  <select
                    id="payment-method"
                    {...register("method")}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700 focus:outline-offset-1"
                  >
                    <option value="cash">Showroom cash</option>
                    <option value="bank_deposit">Bank deposit (BDO or BPI)</option>
                    <option value="online">Online (GCash or Maya)</option>
                    <option value="cod">Cash on delivery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="payment-reference" className="font-semibold text-zinc-900">Reference number *</label>
                  <input
                    id="payment-reference"
                    type="text"
                    {...register("referenceNo")}
                    placeholder="e.g. BDO-DEP-9921"
                    className={`w-full !h-8 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      errors.referenceNo
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {errors.referenceNo && (
                    <span className="text-[11px] text-rose-600 block">
                      {errors.referenceNo.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="!h-8 px-4 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save receipt"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
