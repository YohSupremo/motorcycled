import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { DataGrid } from "@mui/x-data-grid";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  reassignBrandAndDelete,
  restoreBrand,
  clearErrors,
} from "../../../actions/productActions.js";
import {
  CREATE_BRAND_RESET,
  UPDATE_BRAND_RESET,
  DELETE_BRAND_RESET,
} from "../../../constants/productConstants.js";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const buildBrandSchema = (brands, editingBrand) =>
  yup.object({
    name: yup
      .string()
      .trim()
      .required("Brand name is required")
      .test(
        "unique-name",
        "An active brand with this name already exists",
        (value) =>
          !value ||
          !brands.some(
            (brand) =>
              !brand.isArchived &&
              brand._id !== editingBrand?._id &&
              String(brand.name || "").trim().toLowerCase() ===
                value.toLowerCase(),
          ),
      ),
  });

const reassignSchema = yup.object({
  targetBrandId: yup
    .string()
    .trim()
    .required("Select a brand to move the products to"),
});

export const AdminBrands = () => {
  const dispatch = useDispatch();

  const {
    loadingBrands,
    brands = [],
    actionLoading,
    isBrandCreated,
    isBrandUpdated,
    isBrandDeleted,
    error,
  } = useSelector((state) => state.catalog);

  // Local UI state
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "archived"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLogo, setFilterLogo] = useState("all"); // "all", "with-logo", "without-logo"
  const [sortBy, setSortBy] = useState("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // Form state via React Hook Form + Yup
  const brandSchema = useMemo(
    () => buildBrandSchema(brands, editingBrand),
    [brands, editingBrand],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(brandSchema),
    defaultValues: {
      name: "",
    },
  });

  const [logoPreview, setLogoPreview] = useState(""); // data URL or existing image URL
  const [logoData, setLogoData] = useState(undefined); // undefined = untouched, string = new data url, null = removed
  const [reassignState, setReassignState] = useState({
    isOpen: false,
    sourceBrand: null,
    productCount: 0,
    products: [],
  });

  const {
    register: registerReassign,
    handleSubmit: handleReassignFormSubmit,
    reset: resetReassign,
    control: reassignControl,
    formState: { errors: reassignErrors },
  } = useForm({
    resolver: yupResolver(reassignSchema),
    defaultValues: { targetBrandId: "" },
  });

  const reassignTargetId = useWatch({
    control: reassignControl,
    name: "targetBrandId",
  });

  // Initial fetch (fetch all so admin can filter active & soft-deleted)
  useEffect(() => {
    dispatch(getBrands({ all: "true" }));
  }, [dispatch]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    reset({ name: "" });
    setLogoPreview("");
    setLogoData(undefined);
  };

  // Handle side-effects (toasts, modal close, refetch)
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }

    if (isBrandCreated) {
      toast.success("Brand created.", { position: "bottom-right" });
      dispatch({ type: CREATE_BRAND_RESET });
      handleCloseModal();
      dispatch(getBrands({ all: "true" }));
    }

    if (isBrandUpdated) {
      toast.success("Brand updated.", { position: "bottom-right" });
      dispatch({ type: UPDATE_BRAND_RESET });
      handleCloseModal();
      dispatch(getBrands({ all: "true" }));
    }

    if (isBrandDeleted) {
      dispatch({ type: DELETE_BRAND_RESET });
      dispatch(getBrands({ all: "true" }));
    }
  }, [error, isBrandCreated, isBrandUpdated, isBrandDeleted, dispatch]);

  const handleOpenAdd = () => {
    setEditingBrand(null);
    reset({ name: "" });
    setLogoPreview("");
    setLogoData(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);
    reset({ name: brand.name || "" });
    setLogoPreview(brand.logo?.url || "");
    setLogoData(undefined);
    setIsModalOpen(true);
  };

  // Image file picker handler
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setLogoPreview(reader.result);
        setLogoData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear chosen logo
  const handleRemoveLogo = () => {
    setLogoPreview("");
    setLogoData(null);
  };

  // Submit form
  const onSubmitBrand = (data) => {
    const payload = { name: data.name.trim() };
    if (logoData !== undefined) {
      payload.logo = logoData;
    }

    if (editingBrand) {
      dispatch(updateBrand(editingBrand._id, payload));
    } else {
      dispatch(createBrand(payload));
    }
  };

  // Delete handler: backend checks if active products exist
  const handleDelete = async (brand) => {
    const confirm = await Swal.fire({
      title: `Delete "${brand.name}"?`,
      text: "The brand will be archived and can be restored later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete brand",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // Backend checks whether the brand has active products
    const res = await dispatch(deleteBrand(brand._id));

    // If products exist, backend returns a conflict with the product count and products
    if (res?.conflict) {
      resetReassign({ targetBrandId: "" });
      setReassignState({
        isOpen: true,
        sourceBrand: brand,
        productCount: res.productCount,
        products: res.products || [],
      });
      return;
    }

    if (res?.success) {
      toast.success(`Brand "${brand.name}" deleted.`);
      dispatch(getBrands({ all: "true" }));
    }
  };

  // Restore handler for soft-deleted brand
  const handleRestore = async (brand) => {
    const confirm = await Swal.fire({
      title: `Restore "${brand.name}"?`,
      text: "This brand will be restored and made available in the shop catalog.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Restore brand",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const res = await dispatch(restoreBrand(brand._id));
    if (res?.success) {
      toast.success(res.message || `Brand "${brand.name}" restored.`);
      dispatch(getBrands({ all: "true" }));
    } else {
      toast.error(res?.message || "Failed to restore brand");
    }
  };

  // Close reassign modal and clear its form
  const closeReassignModal = () => {
    setReassignState({
      isOpen: false,
      sourceBrand: null,
      productCount: 0,
      products: [],
    });
    resetReassign({ targetBrandId: "" });
  };

  // Handle reassigning products and soft-deleting brand
  const handleReassignSubmit = async (data) => {
    const res = await dispatch(
      reassignBrandAndDelete(
        reassignState.sourceBrand._id,
        data.targetBrandId,
      ),
    );

    if (res?.success) {
      toast.success(res.data?.message || "Products moved and brand archived.");
      closeReassignModal();
      dispatch(getBrands({ all: "true" }));
    }
  };

  // Active & Archived counts
  const activeBrands = brands.filter((b) => !b.isArchived);
  const archivedBrands = brands.filter((b) => b.isArchived);

  // Filter and sort
  const filteredBrands = brands
    .filter((b) => {
      if (statusFilter === "active" && b.isArchived) return false;
      if (statusFilter === "archived" && !b.isArchived) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!b.name?.toLowerCase().includes(q)) return false;
      }
      if (filterLogo === "with-logo" && !b.logo?.url) return false;
      if (filterLogo === "without-logo" && b.logo?.url) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "products-desc")
        return (b.productsCount || 0) - (a.productsCount || 0);
      if (sortBy === "products-asc")
        return (a.productsCount || 0) - (b.productsCount || 0);
      return 0;
    });

  const totalAssignedProducts = brands.reduce(
    (acc, curr) => acc + (curr.productsCount || 0),
    0,
  );

  const columns = useMemo(
    () => [
      {
        field: "logo",
        headerName: "Logo",
        width: 80,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const brand = params.row;
          const isArchived = !!brand.isArchived;
          return brand.logo?.url ? (
            <div className="w-9 h-9 rounded bg-zinc-50 border border-zinc-200 flex items-center justify-center p-1 mx-auto overflow-hidden">
              <img
                src={brand.logo.url}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`w-9 h-9 rounded flex items-center justify-center font-extrabold text-xs mx-auto border ${
                isArchived
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-zinc-100 border-zinc-200 text-zinc-500"
              }`}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          );
        },
      },
      {
        field: "name",
        headerName: "Brand",
        flex: 1.5,
        minWidth: 200,
        renderCell: (params) => {
          const brand = params.row;
          const isArchived = !!brand.isArchived;
          return (
            <div className="py-1">
              <span
                className={`text-xs font-semibold text-zinc-900 ${
                  isArchived ? "text-zinc-600 line-through decoration-zinc-400" : ""
                }`}
              >
                {brand.name}
              </span>
              {!brand.logo?.url && (
                <span className="ml-2 text-[11px] text-zinc-500 font-normal">
                  No logo
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "isArchived",
        headerName: "Status",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          return params.row.isArchived ? (
            <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-amber-500" />
              Archived
            </span>
          ) : (
            <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          );
        },
      },
      {
        field: "productsCount",
        headerName: "Products",
        width: 140,
        type: "number",
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const pCount = params.row.productsCount || 0;
          return (
            <span
              className={`admin-table-badge gap-1 text-[11px] font-medium border ${
                pCount > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}
            >
              {pCount} {pCount === 1 ? "product" : "products"}
            </span>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const brand = params.row;
          const isArchived = !!brand.isArchived;
          return (
            <div className="inline-flex items-center justify-end gap-1 w-full">
              {isArchived ? (
                <button
                  type="button"
                  onClick={() => handleRestore(brand)}
                  className="p-2 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore brand"
                  aria-label="Restore brand"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(brand)}
                    className="p-2 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit brand"
                    aria-label="Edit brand"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(brand)}
                    className="p-2 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete brand"
                    aria-label="Delete brand"
                  >
                    <svg
                      className="w-4 h-4"
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
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [handleRestore, handleOpenEdit, handleDelete]
  );

  return (
    <div className="space-y-6">
      {/* Catalog subnavigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <Link
          to="/admin/products"
          className="px-4 py-2 rounded text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Products
        </Link>
        <Link
          to="/admin/categories"
          className="px-4 py-2 rounded text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Categories
        </Link>
        <Link
          to="/admin/brands"
          className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 text-white"
        >
          Brands ({brands.length})
        </Link>
      </div>

      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Brands
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Add, rename, and archive the manufacturers used across the catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 h-9 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add brand
        </button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Active brands</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeBrands.length}
            </span>
            <span className="text-xs text-zinc-500">of {brands.length} brands</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Archived</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedBrands.length}
            </span>
            <span className="text-xs text-zinc-500">can be restored</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Assigned products</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-zinc-500">units in the catalog</span>
          </div>
        </div>
      </div>

      {/* Search and filter toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded border border-zinc-200">
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-zinc-900 border border-zinc-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            All ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-white text-emerald-700 border border-emerald-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            Active ({activeBrands.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              statusFilter === "archived"
                ? "bg-white text-amber-700 border border-amber-300"
                : "text-zinc-600 hover:text-zinc-900 border border-transparent"
            }`}
          >
            Archived ({archivedBrands.length})
          </button>
        </div>

        <div className="flex flex-1 items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label htmlFor="brand-search" className="sr-only">
              Search brands
            </label>
            <input
              id="brand-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand name"
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-300 rounded transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="brand-logo-filter" className="text-xs text-zinc-600 shrink-0 font-medium">
              Logo
            </label>
            <select
              id="brand-logo-filter"
              value={filterLogo}
              onChange={(e) => setFilterLogo(e.target.value)}
              className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-300 rounded cursor-pointer font-medium text-zinc-700 transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            >
              <option value="all">All logos</option>
              <option value="with-logo">With logo</option>
              <option value="without-logo">Without logo</option>
            </select>

            <label htmlFor="brand-sort" className="text-xs text-zinc-600 shrink-0 font-medium">
              Sort
            </label>
            <select
              id="brand-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-300 rounded cursor-pointer font-medium text-zinc-700 transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            >
              <option value="name-asc">Name (A to Z)</option>
              <option value="name-desc">Name (Z to A)</option>
              <option value="products-desc">Most products</option>
              <option value="products-asc">Fewest products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brands grid */}
      {loadingBrands ? (
        <div className="py-16 text-center text-zinc-500 bg-white rounded border border-zinc-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Loading brands</span>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="py-16 text-center bg-white rounded border border-dashed border-zinc-300">
          <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 8.5 8.5 0 1 0 20 13.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-800">No brands found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No brand matches "${searchQuery}". Try a different keyword.`
              : "No brands have been added yet."}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 h-8 px-4 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Add brand
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded border border-zinc-200 overflow-hidden">
          <DataGrid
            rows={filteredBrands}
            columns={columns}
            getRowId={(row) => row._id}
            rowHeight={60}
            loading={loadingBrands}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            autoHeight
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Add and edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-modal-heading"
            className="bg-white rounded border border-zinc-300 w-full max-w-md overflow-hidden"
          >
            <div className="px-4 py-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2 id="brand-modal-heading" className="text-sm font-bold text-zinc-900">
                {editingBrand ? "Edit brand" : "Add brand"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close"
                className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmitBrand)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label htmlFor="brand-name" className="font-semibold text-zinc-900 block">
                  Name *
                </label>
                <input
                  id="brand-name"
                  type="text"
                  placeholder="Honda, Yamaha, Kawasaki"
                  {...register("name")}
                  className={`w-full h-9 px-3 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.name
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {errors.name && (
                  <span className="text-[11px] text-rose-600 block">{errors.name.message}</span>
                )}
                <span className="text-[11px] text-zinc-500 block">
                  Must be unique across the catalog.
                </span>
              </div>

              {/* Logo upload */}
              <div className="space-y-2">
                <label htmlFor="brand-logo-file" className="font-semibold text-zinc-900 block">
                  Logo
                </label>

                {logoPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
                    <div className="w-16 h-16 rounded bg-white border border-zinc-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] font-medium text-zinc-700 block">
                        Logo selected
                      </span>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="brand-logo-file"
                          className="px-2.5 py-1 text-[11px] font-medium bg-white border border-zinc-300 hover:bg-zinc-100 rounded cursor-pointer transition-colors"
                        >
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="brand-logo-file"
                    className="flex flex-col items-center justify-center gap-1.5 p-5 border-2 border-dashed border-zinc-200 rounded hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors cursor-pointer text-center"
                  >
                    <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-zinc-700">Upload logo</span>
                    <span className="text-[11px] text-zinc-500">
                      PNG, JPG, SVG or WEBP, up to 2MB
                    </span>
                  </label>
                )}

                <input
                  id="brand-logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || isSubmitting}
                  className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading || isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingBrand ? (
                    "Save changes"
                  ) : (
                    "Add brand"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand in use dialog */}
      {reassignState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-reassign-heading"
            className="bg-white rounded border border-amber-300 w-full max-w-lg overflow-hidden"
          >
            <div className="px-4 py-4 border-b border-amber-200 flex items-center justify-between gap-3 bg-amber-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 id="brand-reassign-heading" className="text-sm font-bold text-amber-900">
                    Brand in use ({reassignState.sourceBrand?.name})
                  </h2>
                  <p className="text-[11px] text-amber-700">
                    This brand still has active products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReassignModal}
                aria-label="Close"
                className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleReassignFormSubmit(handleReassignSubmit)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-1">
                <p className="font-semibold text-xs">
                  This brand has{" "}
                  <span className="font-bold font-mono">
                    {reassignState.productCount} active{" "}
                    {reassignState.productCount === 1 ? "product" : "products"}
                  </span>{" "}
                  assigned to it.
                </p>
                <p className="text-[11px] text-amber-800">
                  Move these products to another brand, or cancel the deletion.
                </p>
              </div>

              {reassignState.products.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold text-zinc-800">
                      Products to move ({reassignState.productCount})
                    </span>
                    <span className="text-zinc-500">Move them to the brand you pick</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-zinc-200 border border-zinc-200 rounded bg-zinc-50">
                    {reassignState.products.map((p) => {
                      const thumb = p.images?.[0]?.url;
                      return (
                        <div
                          key={p._id}
                          className="flex items-center gap-3 p-2 bg-white"
                        >
                          <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-4 h-4 text-zinc-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 text-xs truncate">{p.name}</p>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                              <span className="font-mono text-zinc-700 font-bold">
                                ₱{Number(p.price || 0).toLocaleString()}
                              </span>
                              <span>Stock {p.stock}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="brand-reassign-target" className="font-semibold text-zinc-900 block">
                  Move all {reassignState.productCount}{" "}
                  {reassignState.productCount === 1 ? "product" : "products"} to *
                </label>
                <select
                  id="brand-reassign-target"
                  {...registerReassign("targetBrandId")}
                  className={`w-full h-9 px-3 border rounded transition-colors font-medium text-zinc-800 bg-white focus:outline-2 focus:outline-offset-1 ${
                    reassignErrors.targetBrandId
                      ? "border-red-500 focus:outline-red-600"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                >
                  <option value="">Choose a brand</option>
                  {brands
                    .filter(
                      (b) =>
                        b._id !== reassignState.sourceBrand?._id &&
                        !b.isArchived,
                    )
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.productsCount || 0} existing products)
                      </option>
                    ))}
                </select>
                {reassignErrors.targetBrandId && (
                  <p className="text-[11px] text-red-600">
                    {reassignErrors.targetBrandId.message}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReassignModal}
                  className="h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reassignTargetId}
                  className="h-8 px-4 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Moving...</span>
                    </>
                  ) : (
                    "Move and archive"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
