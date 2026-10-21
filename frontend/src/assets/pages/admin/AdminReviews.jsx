import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  getAdminReviews,
  toggleReviewVisibility,
  deleteReview,
} from "../../../actions/reviewActions";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const AdminReviews = () => {
  const dispatch = useDispatch();
  const [filterMode, setFilterMode] = useState("all"); // "all", "public", "hidden"

  const { loading, reviews: rawReviews } = useSelector(
    (state) => state.adminReviews || {}
  );
  const { loading: moderating } = useSelector(
    (state) => state.reviewModeration || {}
  );

  useEffect(() => {
    dispatch(getAdminReviews());
  }, [dispatch]);

  // Map backend shape to DataGrid row shape
  const reviews = useMemo(
    () =>
      (rawReviews || []).map((r) => {
        const author = r.user
          ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim()
          : "Customer";
        return {
          id: r._id,
          customer: author || "Customer",
          email: r.user?.email || "",
          product: r.product?.name || "Deleted product",
          rating: r.rating,
          title: r.title,
          body: r.comment,
          createdAt: formatDate(r.createdAt),
          isVerifiedPurchase: r.isVerifiedPurchase,
          isHidden: r.isHidden,
        };
      }),
    [rawReviews]
  );

  const publicCount = reviews.filter((r) => !r.isHidden).length;
  const hiddenCount = reviews.filter((r) => r.isHidden).length;

  const handleToggleHide = useCallback(
    async (reviewId) => {
      const result = await dispatch(toggleReviewVisibility(reviewId));
      if (result?.type?.endsWith?.("SUCCESS")) {
        toast.success("Review visibility updated.");
      }
      dispatch(getAdminReviews());
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (reviewId) => {
      const confirm = await Swal.fire({
        title: "Delete this review?",
        text: "The review is removed for good and cannot be restored.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Delete review",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) return;

      const result = await dispatch(deleteReview(reviewId));
      if (result?.type?.endsWith?.("SUCCESS")) {
        toast.success("Review deleted.");
      }
      dispatch(getAdminReviews());
    },
    [dispatch]
  );

  const filteredReviews = reviews.filter((r) => {
    if (filterMode === "public") return !r.isHidden;
    if (filterMode === "hidden") return r.isHidden;
    return true;
  });

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900 text-xs">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "customer",
        headerName: "Customer",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const r = params.row;
          return (
            <div className="flex min-w-0 w-full flex-col justify-center leading-tight">
              <div className="flex min-w-0 w-full items-center gap-1.5">
                <span
                  className="min-w-0 flex-1 truncate font-semibold text-zinc-900 text-xs"
                  title={r.customer}
                >
                  {r.customer}
                </span>
                {r.isVerifiedPurchase ? (
                  <span className="admin-table-badge shrink-0 whitespace-nowrap gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <svg
                      className="w-3 h-3 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="admin-table-badge shrink-0 whitespace-nowrap text-[11px] text-zinc-500 bg-zinc-100">
                    Unverified
                  </span>
                )}
              </div>
              <span className="min-w-0 max-w-full text-[11px] text-zinc-500 font-mono truncate mt-1" title={r.email}>
                {r.email}
              </span>
            </div>
          );
        },
      },
      {
        field: "product",
        headerName: "Product",
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
        width: 120,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          const rating = params.row.rating;
          return (
            <div className="flex items-center gap-1.5">
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
                    aria-hidden="true"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="font-mono text-xs font-semibold text-zinc-600">
                {rating}
                <span className="sr-only"> out of 5</span>
              </span>
            </div>
          );
        },
      },
      {
        field: "body",
        headerName: "Review",
        flex: 2.2,
        minWidth: 320,
        renderCell: (params) => {
          const r = params.row;
          return (
            <div className="flex flex-col justify-center max-w-md leading-tight">
              <p className="font-semibold text-zinc-900 text-xs truncate">
                {r.title}
              </p>
              <p className="text-zinc-600 text-xs mt-1 line-clamp-1">{r.body}</p>
              <span className="text-[11px] font-mono text-zinc-500 mt-1">
                Submitted {r.createdAt}
              </span>
            </div>
          );
        },
      },
      {
        field: "isHidden",
        headerName: "Status",
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
        width: 190,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const r = params.row;
          return (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => handleToggleHide(r.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  r.isHidden
                    ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    : "bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                }`}
                title={r.isHidden ? "Show this review" : "Hide this review"}
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
                      aria-hidden="true"
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
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    <span>Hide</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer whitespace-nowrap"
                title="Delete review"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          );
        },
      },
    ],
    [handleToggleHide, handleDelete]
  );

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Reviews
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Audit customer reviews and control what shoppers can see.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 text-xs bg-zinc-100 p-1 rounded">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-2 rounded font-semibold transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-white text-zinc-900 border border-zinc-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("public")}
            className={`px-3 py-2 rounded font-semibold transition-colors cursor-pointer ${
              filterMode === "public"
                ? "bg-white text-emerald-700 border border-emerald-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            Public ({publicCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("hidden")}
            className={`px-3 py-2 rounded font-semibold transition-colors cursor-pointer ${
              filterMode === "hidden"
                ? "bg-white text-amber-700 border border-amber-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            Hidden ({hiddenCount})
          </button>
        </div>
      </div>

      {/* Reviews grid */}
      <div className="border border-zinc-200 bg-white rounded overflow-hidden">
        <DataGrid
          rows={filteredReviews}
          columns={columns}
          loading={loading || moderating}
          getRowId={(row) => row.id}
          rowHeight={64}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight
          sx={adminDataGridSx}
        />
      </div>
    </div>
  );
};
