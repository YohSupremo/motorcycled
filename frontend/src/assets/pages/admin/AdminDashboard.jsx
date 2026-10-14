import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";

export const AdminDashboard = ({ onSelectOrder }) => {
  const pendingApprovals = [
    {
      id: "ORD-2026-0891",
      customer: "Juan Dela Cruz",
      email: "juan.delacruz@example.com",
      phone: "0917 123 4567",
      vehicle: "Yamaha NMAX 155 ABS",
      term: "12 Months (Standard)",
      downpayment: 32000,
      monthly: 10792,
      submittedDate: "2026-10-01",
      validId: "PH-DL-N02-99-123456 (Driver's License)",
      incomeProof: "3-Month BDO Payslip Records",
    },
    {
      id: "ORD-2026-0894",
      customer: "Maria Santos",
      email: "maria.santos@example.com",
      phone: "0918 987 6543",
      vehicle: "Honda Click 125i (2026)",
      term: "24 Months (Extended)",
      downpayment: 16500,
      monthly: 3950,
      submittedDate: "2026-10-02",
      validId: "UMID-CRN-0111-2345-6 (UMID ID)",
      incomeProof: "COE & Bank Statement",
    },
    {
      id: "ORD-2026-0889",
      customer: "Rodrigo Reyes",
      email: "rodrigo.reyes@example.com",
      phone: "0920 555 4321",
      vehicle: "Kawasaki Ninja 400 SE",
      term: "36 Months (Tier 1)",
      downpayment: 70000,
      monthly: 9850,
      submittedDate: "2026-09-30",
      validId: "PH-PASSPORT-P89211A",
      incomeProof: "ITR Form 1701 & Business Permit",
    },
  ];

  const recentTransactions = [
    {
      id: "TXN-8821",
      type: "sale",
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      product: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
      qty: -2,
      ref: "ORD-2026-0893",
      performedBy: "Online Order",
      time: "24 mins ago",
    },
    {
      id: "TXN-8820",
      type: "reserve",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      product: "Yamaha NMAX 155 ABS (Matte Dark Bluish Gray)",
      qty: -1,
      ref: "ORD-2026-0891 (Reserved)",
      performedBy: "Automated Reserve",
      time: "1 hour ago",
    },
    {
      id: "TXN-8819",
      type: "restock",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      product: "Brembo 4-Piston Caliper + Sintered Pads",
      qty: +15,
      ref: "PO-SUP-2026-042 (Apex Moto Dist.)",
      performedBy: "Kelly Laurence (Admin)",
      time: "3 hours ago",
    },
    {
      id: "TXN-8818",
      type: "release",
      badge: "bg-purple-50 text-purple-800 border-purple-200",
      product: "Honda Click 125i (Pearl Arctic White)",
      qty: -1,
      ref: "ORD-2026-0880 (Handover)",
      performedBy: "Showroom Staff",
      time: "5 hours ago",
    },
  ];

  const overdueAccounts = [
    {
      id: "SCH-0442",
      orderId: "ORD-2026-0710",
      customer: "Eduardo Garcia",
      dueDate: "2026-09-25",
      daysOverdue: 7,
      amountDue: 8450,
      penalty: 250,
      contact: "0917 888 1234",
    },
    {
      id: "SCH-0419",
      orderId: "ORD-2026-0685",
      customer: "Patricia Lim",
      dueDate: "2026-09-28",
      daysOverdue: 4,
      amountDue: 5900,
      penalty: 250,
      contact: "0919 777 9876",
    },
  ];

  const approvalColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Order / Ref",
        width: 145,
        renderCell: (params) => (
          <span className="font-mono font-semibold text-zinc-900">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "customer",
        headerName: "Applicant & Contact",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900">{params.row.customer}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              {params.row.phone}
            </p>
          </div>
        ),
      },
      {
        field: "vehicle",
        headerName: "Motorcycle Model",
        flex: 1.2,
        minWidth: 170,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-medium text-zinc-900">{params.row.vehicle}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Downpayment: ₱{params.row.downpayment.toLocaleString()}
            </p>
          </div>
        ),
      },
      {
        field: "term",
        headerName: "Financing Terms",
        width: 180,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="admin-table-badge bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[11px]">
              {params.row.term}
            </span>
            <span className="text-[11px] text-zinc-600 mt-0.5 font-mono truncate">
              ₱{params.row.monthly.toLocaleString()} / mo
            </span>
          </div>
        ),
      },
      {
        field: "credentials",
        headerName: "Uploaded Credentials",
        flex: 1.3,
        minWidth: 240,
        sortable: false,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="admin-table-badge gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200">
              <svg
                className="w-3 h-3 text-emerald-600 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {params.row.validId}
            </span>
            <span className="text-[10px] text-zinc-500 truncate mt-0.5">
              {params.row.incomeProof}
            </span>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <div className="inline-flex items-center justify-end w-full">
            <Link
              to="/admin/orders"
              onClick={() => {
                onSelectOrder && onSelectOrder(params.row.id);
              }}
              className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Review &amp; Decide
            </Link>
          </div>
        ),
      },
    ],
    [onSelectOrder]
  );

  const transactionColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Txn",
        width: 100,
        renderCell: (params) => (
          <span className="font-mono text-zinc-500 text-[11px]">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "type",
        headerName: "Type",
        width: 130,
        renderCell: (params) => (
          <span
            className={`admin-table-badge text-[10px] font-mono uppercase font-bold border ${params.row.badge}`}
          >
            {params.row.type}
          </span>
        ),
      },
      {
        field: "product",
        headerName: "Product Description",
        flex: 1.2,
        minWidth: 170,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-medium text-zinc-900 line-clamp-1">
              {params.row.product}
            </p>
            <span className="text-[10px] text-zinc-400 font-mono">
              {params.row.time}
            </span>
          </div>
        ),
      },
      {
        field: "qty",
        headerName: "Delta",
        width: 80,
        renderCell: (params) => (
          <span
            className={`font-mono font-bold ${
              params.row.qty > 0 ? "text-emerald-700" : "text-zinc-700"
            }`}
          >
            {params.row.qty > 0 ? `+${params.row.qty}` : params.row.qty}
          </span>
        ),
      },
      {
        field: "ref",
        headerName: "Reference",
        width: 120,
        headerAlign: "right",
        align: "right",
        renderCell: (params) => (
          <span className="font-mono text-zinc-500 text-[11px]">
            {params.row.ref}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Dealership Operational Telemetry
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time data feeds derived from MongoDB collections (
            <code className="font-mono text-zinc-600">orders</code>,{" "}
            <code className="font-mono text-zinc-600">payment_schedules</code>,{" "}
            <code className="font-mono text-zinc-600">
              inventory_transactions
            </code>
            ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center !h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Review Applications ({pendingApprovals.length})
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center justify-center !h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Record Payment
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center justify-center !h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Restock PO
          </Link>
        </div>
      </div>

      {/* Flat Unified Financial Metrics Strip (NO CARDS - Border & Divider Driven) */}
      <div className="border-y border-zinc-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Monthly Collections
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded font-semibold">
              +14.2%
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            ₱4,285,450
          </p>
          <p className="text-[11px] text-zinc-500">
            Amortization + Cash + Downpayments
          </p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Active Installments
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded font-semibold">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            142 Accounts
          </p>
          <p className="text-[11px] text-zinc-500">
            ₱12.8M financed active portfolio
          </p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Screening Queue
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded font-semibold">
              Action Req.
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-amber-700 font-mono">
            3 Pending
          </p>
          <p className="text-[11px] text-zinc-500">
            Verification within 24-48 hours
          </p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Stock Watchlist
            </span>
            <span className="text-[10px] font-mono text-red-800 bg-red-50 border border-red-200 px-1 rounded font-semibold">
              2 Alerts
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-red-700 font-mono">
            2 Low Stock
          </p>
          <p className="text-[11px] text-zinc-500">
            Stock &le; lowStockThreshold
          </p>
        </div>
      </div>

      {/* Section 1: Credit Screening & Verification Queue (Flat Direct Table, NO CARDS) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-zinc-900">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
              Underwriting Queue
            </span>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Installment Credit Screening & Document Verification
            </h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            View All Orders &rarr;
          </Link>
        </div>

        <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <DataGrid
            rows={pendingApprovals}
            columns={approvalColumns}
            getRowId={(row) => row.id}
            rowHeight={70}
            pageSizeOptions={[5, 10]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
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
                fontSize: "0.75rem",
              },
            }}
          />
        </div>
      </section>

      {/* Two Column Grid: Append-Only Stock Ledger & Overdue Delinquencies (Flat Tables, NO CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column: Append-Only Stock Ledger */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
                Stock Ledger
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Append-Only Stock Ledger Stream
              </h2>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Full Ledger &rarr;
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
            <DataGrid
              rows={recentTransactions}
              columns={transactionColumns}
              getRowId={(row) => row.id}
              rowHeight={58}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
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
                  fontSize: "0.75rem",
                },
              }}
            />
          </div>
        </div>

        {/* Right Column: Overdue Payment Dues (Flat Direct List, NO CARDS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-red-700 font-bold block">
                Payment Delinquencies
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>Overdue Payment Dues</span>
              </h2>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Collections &rarr;
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white divide-y divide-zinc-200 text-xs">
            {overdueAccounts.map((acct) => (
              <div
                key={acct.id}
                className="p-3.5 flex items-start justify-between gap-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">
                      {acct.customer}
                    </span>
                    <span className="font-mono text-[10px] text-red-700 font-semibold bg-red-50 border border-red-200 px-1 rounded">
                      {acct.daysOverdue}d overdue
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-mono">
                    {acct.orderId} • Due: {acct.dueDate}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Contact: {acct.contact}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-zinc-900 font-mono">
                    ₱{(acct.amountDue + acct.penalty).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-red-600 font-mono font-medium">
                    +₱{acct.penalty} penalty
                  </p>
                  <Link
                    to="/admin/payments"
                    className="inline-flex items-center justify-center mt-1.5 px-2.5 py-1 text-xs font-medium bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    Post Payment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
