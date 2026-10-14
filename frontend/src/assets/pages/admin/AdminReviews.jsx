import { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

export const AdminReviews = () => {
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'active' | 'hidden'

  const [reviews, setReviews] = useState([
    {
      id: "REV-101",
      customer: "Mark Anthony Ramos",
      email: "mark.ramos@example.com",
      product: "Yamaha NMAX 155 ABS",
      rating: 5,
      title: "Smooth financing process & immediate release",
      body: "Digital screening was approved in less than 36 hours. The monthly amortization breakdown in the portal has zero hidden charges, and downpayment receipt was issued immediately upon turnover.",
      createdAt: "2026-08-14",
      isVerifiedPurchase: true, // Derived from Delivered order
      isHidden: false, // Admin moderation status
    },
    {
      id: "REV-102",
      customer: "Karlo Mendoza",
      email: "karlo.m@example.com",
      product: "Honda Click 125i (2026)",
      rating: 5,
      title: "Doorstep delivery with complete LTO papers",
      body: "Delivered straight to my doorstep in Quezon City complete with LTO registration papers and dealer warranty booklet. The pre-delivery checklist was thoroughly explained by the courier technician.",
      createdAt: "2026-09-02",
      isVerifiedPurchase: true,
      isHidden: false,
    },
    {
      id: "REV-103",
      customer: "Christian Bautista",
      email: "bautista.c@example.com",
      product: "Brembo 4-Piston Caliper + Sintered Pads",
      rating: 5,
      title: "Genuine OEM parts guaranteed",
      body: "Finding genuine OEM sprockets, sintered brake pads, and Motul 7100 oil under one roof used to be difficult. Motorshop's verified parts catalog and branch pickup in Cebu made maintenance seamless.",
      createdAt: "2026-07-29",
      isVerifiedPurchase: true,
      isHidden: false,
    },
    {
      id: "REV-104",
      customer: "Anonymous User",
      email: "guest_spammer@tempmail.com",
      product: "Kawasaki Ninja 400 SE",
      rating: 1,
      title: "Spam advertisement content",
      body: "Check out this alternative link for discounted counterfeit parts at scamwebsite.xyz with free delivery.",
      createdAt: "2026-09-21",
      isVerifiedPurchase: false,
      isHidden: true,
    },
  ]);

  const handleToggleHide = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isHidden: !r.isHidden } : r))
    );
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterMode === "active") return !r.isHidden;
    if (filterMode === "hidden") return r.isHidden;
    return true;
  });

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Review ID",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900 text-xs">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "customer",
        headerName: "Customer & Status",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const r = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-900 text-xs truncate">
                  {r.customer}
                </span>
                {r.isVerifiedPurchase ? (
                  <span className="admin-table-badge gap-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <svg
                      className="w-2.5 h-2.5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="admin-table-badge text-[10px] text-zinc-500 bg-zinc-100 shrink-0">
                    Unverified
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                {r.email}
              </span>
            </div>
          );
        },
      },
      {
        field: "product",
        headerName: "Reviewed Product",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <span className="font-medium text-zinc-900 text-xs truncate">
            {params.row.product}
          </span>
        ),
      },
      {
        field: "rating",
        headerName: "Rating",
        width: 110,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          const rating = params.row.rating;
          return (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-200 fill-zinc-200"
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="font-mono text-xs font-semibold text-zinc-600 ml-0.5">
                {rating}.0
              </span>
            </div>
          );
        },
      },
      {
        field: "body",
        headerName: "Review Content",
        flex: 2.2,
        minWidth: 320,
        renderCell: (params) => {
          const r = params.row;
          return (
            <div className="flex flex-col justify-center max-w-md leading-tight">
              <p className="font-semibold text-zinc-900 text-xs truncate">
                {r.title}
              </p>
              <p className="text-zinc-600 text-xs mt-0.5 line-clamp-1">
                {r.body}
              </p>
              <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Submitted: {r.createdAt}
              </span>
            </div>
          );
        },
      },
      {
        field: "isHidden",
        headerName: "Moderation State",
        width: 130,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          return (
            <div className="flex items-center justify-center w-full">
              {params.row.isHidden ? (
                <span className="admin-table-badge gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Hidden
                </span>
              ) : (
                <span className="admin-table-badge gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Public
                </span>
              )}
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
          const r = params.row;
          return (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={() => handleToggleHide(r.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                  r.isHidden
                    ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    : "bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                }`}
                title={r.isHidden ? "Make Review Public" : "Hide Review from Store"}
              >
                {r.isHidden ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Unhide</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-rose-600 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    <span>Hide</span>
                  </>
                )}
              </button>
            </div>
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
            Customer Ratings &amp; Review Moderation
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit customer product reviews, verify delivery history, and manage content visibility (
            <code className="font-mono text-zinc-600">reviews</code> collection).
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 text-xs bg-zinc-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("active")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              filterMode === "active"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Public ({reviews.filter((r) => !r.isHidden).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("hidden")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              filterMode === "hidden"
                ? "bg-white text-amber-700 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Hidden Moderated ({reviews.filter((r) => r.isHidden).length})
          </button>
        </div>
      </div>

      {/* Reviews DataGrid */}
      <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <DataGrid
          rows={filteredReviews}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeight={64}
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
              paddingX: "16px",
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

    </div>
  );
};
