import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
  RESTORE_BRAND_RESET,
} from "../../../constants/productConstants.js";

const brandSchema = yup.object({
  name: yup.string().trim().required("Brand name is required"),
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
    targetBrandId: "",
    productCount: 0,
    products: [],
  });

  // Initial fetch (fetch all so admin can filter active & soft-deleted)
  useEffect(() => {
    dispatch(getBrands({ all: "true" }));
  }, [dispatch]);

  // Handle side-effects
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }

    if (isBrandCreated) {
      toast.success("Brand created successfully!", { position: "bottom-right" });
      dispatch({ type: CREATE_BRAND_RESET });
      handleCloseModal();
      dispatch(getBrands({ all: "true" }));
    }

    if (isBrandUpdated) {
      toast.success("Brand updated successfully!", { position: "bottom-right" });
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    reset({ name: "" });
    setLogoPreview("");
    setLogoData(undefined);
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
      title: `Delete brand "${brand.name}"?`,
      text: `Are you sure you want to delete this brand?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // Backend checks whether the brand has active products
    const res = await dispatch(deleteBrand(brand._id));

    // If products exist, backend returns a 409 Conflict with the product count & products
    if (res?.conflict) {
      setReassignState({
        isOpen: true,
        sourceBrand: brand,
        targetBrandId: "",
        productCount: res.productCount,
        products: res.products || [],
      });
      return;
    }

    if (res?.success) {
      toast.success(`Brand "${brand.name}" deleted successfully!`);
      dispatch(getBrands({ all: "true" }));
    }
  };

  // Restore handler for soft-deleted brand
  const handleRestore = async (brand) => {
    const confirm = await Swal.fire({
      title: `Restore brand "${brand.name}"?`,
      text: `This brand will be restored and made available in the shop catalog.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const res = await dispatch(restoreBrand(brand._id));
    if (res?.success) {
      toast.success(res.message || `Brand "${brand.name}" restored successfully!`);
      dispatch(getBrands({ all: "true" }));
    } else {
      toast.error(res?.message || "Failed to restore brand");
    }
  };

  // Handle reassigning products and soft-deleting brand
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignState.targetBrandId) {
      toast.warn("Please select a target brand to reassign products to.");
      return;
    }

    const res = await dispatch(
      reassignBrandAndDelete(
        reassignState.sourceBrand._id,
        reassignState.targetBrandId,
      ),
    );

    if (res?.success) {
      toast.success(
        res.data?.message ||
          "Products reassigned and brand deleted successfully!",
      );
      setReassignState({
        isOpen: false,
        sourceBrand: null,
        targetBrandId: "",
        productCount: 0,
      });
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

  const brandsWithLogoCount = brands.filter((b) => !!b.logo?.url).length;
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
            <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center p-1 mx-auto overflow-hidden">
              <img
                src={brand.logo.url}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs mx-auto border ${
                isArchived
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-zinc-100 border-zinc-200/80 text-zinc-500"
              }`}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          );
        },
      },
      {
        field: "name",
        headerName: "Brand Name",
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
                <span className="ml-2 text-[10px] text-zinc-400 font-normal">
                  (No logo uploaded)
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
              Soft-Deleted
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
        headerName: "Assigned Products",
        width: 160,
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
              {pCount} {pCount === 1 ? "Product" : "Products"}
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
            <div className="inline-flex items-center justify-end gap-1.5 w-full">
              {isArchived ? (
                <button
                  type="button"
                  onClick={() => handleRestore(brand)}
                  className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore Brand"
                  aria-label="Restore Brand"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(brand)}
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit Brand"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(brand)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Brand"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      {/* Catalog Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <Link
          to="/admin/products"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Products &amp; Units
        </Link>
        <Link
          to="/admin/categories"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Categories
        </Link>
        <Link
          to="/admin/brands"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-xs"
        >
          Brands ({brands.length})
        </Link>
      </div>

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Brand Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage motorcycle and component manufacturers per FR1.3 and Database Specification §4.4.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Brand
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Active Brands
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeBrands.length}
            </span>
            <span className="text-xs text-zinc-400">
              of {brands.length} total
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Soft-Deleted / Archived
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedBrands.length}
            </span>
            <span className="text-xs text-zinc-400">recoverable</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Catalog Coverage
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-zinc-400">associated products</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            All ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Active ({activeBrands.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === "archived"
                ? "bg-white text-amber-700 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Soft-Deleted ({archivedBrands.length})
          </button>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands by name..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <select
              value={filterLogo}
              onChange={(e) => setFilterLogo(e.target.value)}
              className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-600 cursor-pointer font-medium text-zinc-700"
            >
              <option value="all">All Logos</option>
              <option value="with-logo">With Logo</option>
              <option value="without-logo">Without Logo</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-600 cursor-pointer font-medium text-zinc-700"
            >
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="products-desc">Most Products</option>
              <option value="products-asc">Fewest Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brands Table */}
      {loadingBrands ? (
        <div className="py-16 text-center text-zinc-400 bg-white rounded-xl border border-zinc-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Loading brands...</span>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-zinc-300">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-800">No brands found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No brand matches "${searchQuery}". Try a different term.`
              : "No brands have been registered in the dealership yet."}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Add First Brand
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
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

      {/* Add / Edit Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <h2 className="text-sm font-bold text-zinc-900">
                {editingBrand ? "Edit Brand" : "Add New Brand"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitBrand)} noValidate className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-900 block">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Honda, Yamaha, Kawasaki, CFMOTO"
                  {...register("name")}
                  className={`w-full h-9 px-3 border ${
                    errors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600"
                  } rounded-lg focus:outline-none transition-colors`}
                />
                {errors.name && (
                  <span className="text-[11px] text-red-600 block">
                    {errors.name.message}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 block">
                  Must be unique across the catalog (FR1.3.3).
                </span>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-900 block">
                  Brand Logo <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>

                {logoPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="w-16 h-16 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <span className="text-[11px] font-medium text-zinc-700 block">
                        Logo Selected
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
                          className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="brand-logo-file"
                    className="flex flex-col items-center justify-center gap-1.5 p-5 border-2 border-dashed border-zinc-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-zinc-700">
                      Upload Brand Logo
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      PNG, JPG, SVG, WEBP • Max 2MB
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

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-8 px-3 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || isSubmitting}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-60 transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading || isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingBrand ? (
                    "Update Brand"
                  ) : (
                    "Create Brand"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 409 Conflict Reassignment Dialog */}
      {reassignState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-amber-300 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-sm font-bold text-amber-900">
                    Brand In Use ({reassignState.sourceBrand?.name})
                  </h2>
                  <p className="text-[11px] text-amber-700">
                    409 Conflict: Cannot delete brand with active products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setReassignState({
                    isOpen: false,
                    sourceBrand: null,
                    targetBrandId: "",
                    productCount: 0,
                  })
                }
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                <p className="font-semibold text-xs">
                  This brand currently has{" "}
                  <span className="font-bold underline text-amber-950 font-mono">
                    {reassignState.productCount} active product(s)
                  </span>{" "}
                  anchored to it.
                </p>
                <p className="text-[11px] text-amber-800">
                  Per system design, you must choose to reassign these products to another
                  brand before soft-deleting, or cancel the deletion.
                </p>
              </div>

              {/* Anchored Products List */}
              {reassignState.products.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-800">
                      Anchored Products ({reassignState.productCount})
                    </span>
                    <span className="text-zinc-400">
                      Will be migrated to new brand
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-lg bg-zinc-50 p-1 space-y-1">
                    {reassignState.products.map((p) => {
                      const thumb = p.images?.[0]?.url;
                      return (
                        <div
                          key={p._id}
                          className="flex items-center gap-3 p-2 bg-white rounded-md border border-zinc-100 shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
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
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 text-xs truncate">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                              <span className="font-mono text-emerald-700 font-bold">
                                ₱{Number(p.price || 0).toLocaleString()}
                              </span>
                              <span>•</span>
                              <span>Stock: {p.stock}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-900 block">
                  Reassign all {reassignState.productCount} product(s) to:{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={reassignState.targetBrandId}
                  onChange={(e) =>
                    setReassignState({
                      ...reassignState,
                      targetBrandId: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 border border-zinc-300 rounded-lg focus:border-emerald-600 focus:outline-none transition-colors font-medium text-zinc-800 bg-white"
                >
                  <option value="">-- Choose destination brand --</option>
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
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReassignState({
                      isOpen: false,
                      sourceBrand: null,
                      targetBrandId: "",
                      productCount: 0,
                    })
                  }
                  className="h-8 px-3 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel Deletion
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reassignState.targetBrandId}
                  className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reassigning &amp; Deleting...</span>
                    </>
                  ) : (
                    "Reassign & Soft-Delete"
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
