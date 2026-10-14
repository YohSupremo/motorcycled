import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { DataGrid } from "@mui/x-data-grid";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignCategoryAndDelete,
  restoreCategory,
  clearErrors,
} from "../../../actions/productActions.js";
import {
  CREATE_CATEGORY_RESET,
  UPDATE_CATEGORY_RESET,
  DELETE_CATEGORY_RESET,
  RESTORE_CATEGORY_RESET,
} from "../../../constants/productConstants.js";

export const AdminCategories = () => {
  const dispatch = useDispatch();

  const {
    loadingCategories,
    categories = [],
    actionLoading,
    isCategoryCreated,
    isCategoryUpdated,
    isCategoryDeleted,
    error,
  } = useSelector((state) => state.catalog);

  // Local state
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "archived"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [reassignState, setReassignState] = useState({
    isOpen: false,
    sourceCategory: null,
    targetCategoryId: "",
    productCount: 0,
    products: [],
  });

  // Initial fetch (fetch all so admin can filter active & soft-deleted)
  useEffect(() => {
    dispatch(getCategories({ all: "true" }));
  }, [dispatch]);

  // Handle side-effects (toasts, modal close, refetch)
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }

    if (isCategoryCreated) {
      toast.success("Category created successfully!", { position: "bottom-right" });
      dispatch({ type: CREATE_CATEGORY_RESET });
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      dispatch(getCategories({ all: "true" }));
    }

    if (isCategoryUpdated) {
      toast.success("Category updated successfully!", { position: "bottom-right" });
      dispatch({ type: UPDATE_CATEGORY_RESET });
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      dispatch(getCategories({ all: "true" }));
    }

    if (isCategoryDeleted) {
      dispatch({ type: DELETE_CATEGORY_RESET });
      dispatch(getCategories({ all: "true" }));
    }
  }, [error, isCategoryCreated, isCategoryUpdated, isCategoryDeleted, dispatch]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warn("Category name is required");
      return;
    }

    if (editingCategory) {
      dispatch(updateCategory(editingCategory._id, formData));
    } else {
      dispatch(createCategory(formData));
    }
  };

  // Delete handler: backend checks if active products exist
  const handleDelete = async (category) => {
    const confirm = await Swal.fire({
      title: `Delete "${category.name}"?`,
      text: `Are you sure you want to delete this category?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // Backend checks whether the category has active products
    const res = await dispatch(deleteCategory(category._id));

    // If products exist, backend returns a 409 Conflict with the product count & products
    if (res?.conflict) {
      setReassignState({
        isOpen: true,
        sourceCategory: category,
        targetCategoryId: "",
        productCount: res.productCount,
        products: res.products || [],
      });
      return;
    }

    if (res?.success) {
      toast.success(`Category "${category.name}" deleted successfully!`);
      dispatch(getCategories({ all: "true" }));
    }
  };

  // Restore handler for soft-deleted category
  const handleRestore = async (category) => {
    const confirm = await Swal.fire({
      title: `Restore "${category.name}"?`,
      text: `This category will be restored and made available in the shop catalog.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const res = await dispatch(restoreCategory(category._id));
    if (res?.success) {
      toast.success(res.message || `Category "${category.name}" restored successfully!`);
      dispatch(getCategories({ all: "true" }));
    } else {
      toast.error(res?.message || "Failed to restore category");
    }
  };

  // Handle reassigning products and soft-deleting category
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignState.targetCategoryId) {
      toast.warn("Please select a target category to reassign products to.");
      return;
    }

    const res = await dispatch(
      reassignCategoryAndDelete(
        reassignState.sourceCategory._id,
        reassignState.targetCategoryId,
      ),
    );

    if (res?.success) {
      toast.success(
        res.data?.message ||
          "Products reassigned and category deleted successfully!",
      );
      setReassignState({
        isOpen: false,
        sourceCategory: null,
        targetCategoryId: "",
        productCount: 0,
      });
      dispatch(getCategories({ all: "true" }));
    }
  };

  // Active & Archived counts
  const activeCategories = categories.filter((c) => !c.isArchived);
  const archivedCategories = categories.filter((c) => c.isArchived);

  // Filter and sort
  const filteredCategories = categories
    .filter((c) => {
      if (statusFilter === "active" && c.isArchived) return false;
      if (statusFilter === "archived" && !c.isArchived) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
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

  const totalAssignedProducts = categories.reduce(
    (acc, curr) => acc + (curr.productsCount || 0),
    0,
  );

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Category Name",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const category = params.row;
          const isArchived = !!category.isArchived;
          return (
            <div className="flex items-center gap-2.5 py-1.5 h-full">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                  isArchived
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                }`}
              >
                {category.name.charAt(0).toUpperCase()}
              </div>
              <span
                className={`font-semibold text-zinc-900 truncate ${
                  isArchived ? "text-zinc-600 line-through decoration-zinc-400" : ""
                }`}
              >
                {category.name}
              </span>
            </div>
          );
        },
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.8,
        minWidth: 260,
        renderCell: (params) => {
          return params.row.description ? (
            <span className="text-zinc-500 line-clamp-2">{params.row.description}</span>
          ) : (
            <span className="text-zinc-400 italic">No description provided</span>
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
          const category = params.row;
          const isArchived = !!category.isArchived;
          return (
            <div className="inline-flex items-center justify-end gap-1.5 w-full">
              {isArchived ? (
                <button
                  type="button"
                  onClick={() => handleRestore(category)}
                  className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore Category"
                  aria-label="Restore Category"
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
                    onClick={() => handleOpenEdit(category)}
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Category"
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
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-xs"
        >
          Categories ({categories.length})
        </Link>
        <Link
          to="/admin/brands"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Brands
        </Link>
      </div>

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Category Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage product categories per FR1.3 and Database Specification §4.3.
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
          Add New Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Active Categories
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeCategories.length}
            </span>
            <span className="text-xs text-zinc-400">
              of {categories.length} total
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Soft-Deleted / Archived
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedCategories.length}
            </span>
            <span className="text-xs text-zinc-400">recoverable</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Total Assigned Products
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-zinc-400">catalog units</span>
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
            All ({categories.length})
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
            Active ({activeCategories.length})
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
            Soft-Deleted ({archivedCategories.length})
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
              placeholder="Search categories by name or description..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-500 shrink-0 font-medium">Sort by:</span>
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

      {/* Categories Table / Card Grid */}
      {loadingCategories ? (
        <div className="py-16 text-center text-zinc-400 bg-white rounded-xl border border-zinc-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-zinc-300">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-800">No categories found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No category matches "${searchQuery}". Try a different keyword.`
              : "No categories have been created yet."}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
          <DataGrid
            rows={filteredCategories}
            columns={columns}
            getRowId={(row) => row._id}
            rowHeight={60}
            loading={loadingCategories}
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <h2 className="text-sm font-bold text-zinc-900">
                {editingCategory ? "Edit Category" : "Add New Category"}
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-900 block">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Motorcycles, Engine Parts, Brakes"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full h-9 px-3 border border-zinc-300 rounded-lg focus:border-emerald-600 focus:outline-none transition-colors"
                />
                <span className="text-[10px] text-zinc-400 block">
                  Must be unique across the catalog (FR1.3.1).
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-900 block">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of items classified under this category..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-zinc-300 rounded-lg focus:border-emerald-600 focus:outline-none resize-none transition-colors"
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
                  disabled={actionLoading}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-60 transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
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
                    Category In Use ({reassignState.sourceCategory?.name})
                  </h2>
                  <p className="text-[11px] text-amber-700">
                    409 Conflict: Cannot delete category with active products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setReassignState({
                    isOpen: false,
                    sourceCategory: null,
                    targetCategoryId: "",
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
                  This category currently has{" "}
                  <span className="font-bold underline text-amber-950 font-mono">
                    {reassignState.productCount} active product(s)
                  </span>{" "}
                  anchored to it.
                </p>
                <p className="text-[11px] text-amber-800">
                  Per system design, you must choose to reassign these products to another
                  category before soft-deleting, or cancel the deletion.
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
                      Will be migrated to new category
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
                  value={reassignState.targetCategoryId}
                  onChange={(e) =>
                    setReassignState({
                      ...reassignState,
                      targetCategoryId: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 border border-zinc-300 rounded-lg focus:border-emerald-600 focus:outline-none transition-colors font-medium text-zinc-800 bg-white"
                >
                  <option value="">-- Choose destination category --</option>
                  {categories
                    .filter(
                      (c) =>
                        c._id !== reassignState.sourceCategory?._id &&
                        !c.isArchived,
                    )
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.productsCount || 0} existing products)
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
                      sourceCategory: null,
                      targetCategoryId: "",
                      productCount: 0,
                    })
                  }
                  className="h-8 px-3 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel Deletion
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reassignState.targetCategoryId}
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

export default AdminCategories;
