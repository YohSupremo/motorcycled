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
} from "../../../constants/productConstants.js";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const buildCategorySchema = (categories, editingCategory) =>
  yup.object({
    name: yup
      .string()
      .trim()
      .required("Category name is required")
      .test(
        "unique-name",
        "A category with this name already exists",
        (value) =>
          !value ||
          !categories.some(
            (category) =>
              !category.isArchived &&
              category._id !== editingCategory?._id &&
              String(category.name || "").trim().toLowerCase() ===
                value.toLowerCase(),
          ),
      ),
    description: yup.string().default(""),
  });

const reassignSchema = yup.object({
  targetCategoryId: yup
    .string()
    .trim()
    .required("Select a category to move the products to"),
});

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

  // Form handling via React Hook Form + Yup
  const categorySchema = useMemo(
    () => buildCategorySchema(categories, editingCategory),
    [categories, editingCategory],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [reassignState, setReassignState] = useState({
    isOpen: false,
    sourceCategory: null,
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
    defaultValues: { targetCategoryId: "" },
  });

  const reassignTargetId = useWatch({
    control: reassignControl,
    name: "targetCategoryId",
  });

  // Initial fetch (fetch all so admin can filter active & soft-deleted)
  useEffect(() => {
    dispatch(getCategories({ all: "true" }));
  }, [dispatch]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset({ name: "", description: "" });
  };

  // Handle side-effects (toasts, modal close, refetch)
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }

    if (isCategoryCreated) {
      toast.success("Category created.", { position: "bottom-right" });
      dispatch({ type: CREATE_CATEGORY_RESET });
      handleCloseModal();
      dispatch(getCategories({ all: "true" }));
    }

    if (isCategoryUpdated) {
      toast.success("Category updated.", { position: "bottom-right" });
      dispatch({ type: UPDATE_CATEGORY_RESET });
      handleCloseModal();
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
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    reset({
      name: category.name || "",
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  // Form submit
  const onSubmitCategory = (data) => {
    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : "",
    };

    if (editingCategory) {
      dispatch(updateCategory(editingCategory._id, payload));
    } else {
      dispatch(createCategory(payload));
    }
  };

  // Delete handler: backend checks if active products exist
  const handleDelete = async (category) => {
    const confirm = await Swal.fire({
      title: `Delete "${category.name}"?`,
      text: "The category will be archived and can be restored later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete category",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // Backend checks whether the category has active products
    const res = await dispatch(deleteCategory(category._id));

    // If products exist, backend returns a 409 Conflict with the product count & products
    if (res?.conflict) {
      resetReassign({ targetCategoryId: "" });
      setReassignState({
        isOpen: true,
        sourceCategory: category,
        productCount: res.productCount,
        products: res.products || [],
      });
      return;
    }

    if (res?.success) {
      toast.success(`Category "${category.name}" deleted.`);
      dispatch(getCategories({ all: "true" }));
    }
  };

  // Restore handler for soft-deleted category
  const handleRestore = async (category) => {
    const confirm = await Swal.fire({
      title: `Restore "${category.name}"?`,
      text: "This category will be restored and made available in the shop catalog.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Restore category",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const res = await dispatch(restoreCategory(category._id));
    if (res?.success) {
      toast.success(res.message || `Category "${category.name}" restored.`);
      dispatch(getCategories({ all: "true" }));
    } else {
      toast.error(res?.message || "Failed to restore category");
    }
  };

  // Close reassign modal and clear its form
  const closeReassignModal = () => {
    setReassignState({
      isOpen: false,
      sourceCategory: null,
      productCount: 0,
      products: [],
    });
    resetReassign({ targetCategoryId: "" });
  };

  // Handle reassigning products and soft-deleting category
  const handleReassignSubmit = async (data) => {
    const res = await dispatch(
      reassignCategoryAndDelete(
        reassignState.sourceCategory._id,
        data.targetCategoryId,
      ),
    );

    if (res?.success) {
      toast.success(res.data?.message || "Products moved and category archived.");
      closeReassignModal();
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
        headerName: "Category",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const category = params.row;
          const isArchived = !!category.isArchived;
          return (
            <div className="flex items-center gap-2 py-1 h-full">
              <div
                className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 border ${
                  isArchived
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
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
            <span className="text-zinc-600 line-clamp-2">{params.row.description}</span>
          ) : (
            <span className="text-zinc-500">No description</span>
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
        width: 130,
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
          const category = params.row;
          const isArchived = !!category.isArchived;
          return (
            <div className="inline-flex items-center justify-end gap-1 w-full">
              {isArchived ? (
                <button
                  type="button"
                  onClick={() => handleRestore(category)}
                  className="p-2 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore category"
                  aria-label="Restore category"
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
                    onClick={() => handleOpenEdit(category)}
                    className="p-2 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit category"
                    aria-label="Edit category"
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
                    onClick={() => handleDelete(category)}
                    className="p-2 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete category"
                    aria-label="Delete category"
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
          className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 text-white"
        >
          Categories ({categories.length})
        </Link>
        <Link
          to="/admin/brands"
          className="px-4 py-2 rounded text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Brands
        </Link>
      </div>

      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Categories
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Add, rename, and archive the categories used across the catalog.
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
          Add category
        </button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Active categories</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeCategories.length}
            </span>
            <span className="text-xs text-zinc-500">of {categories.length} categories</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Archived</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedCategories.length}
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
            All ({categories.length})
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
            Active ({activeCategories.length})
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
            Archived ({archivedCategories.length})
          </button>
        </div>

        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1">
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
            <label htmlFor="category-search" className="sr-only">
              Search categories
            </label>
            <input
              id="category-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description"
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-300 rounded transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="category-sort" className="text-xs text-zinc-600 shrink-0 font-medium">
              Sort
            </label>
            <select
              id="category-sort"
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

      {/* Categories grid */}
      {loadingCategories ? (
        <div className="py-16 text-center text-zinc-500 bg-white rounded border border-zinc-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Loading categories</span>
        </div>
      ) : filteredCategories.length === 0 ? (
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
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 h-8 px-4 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Add category
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded border border-zinc-200 overflow-hidden">
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
            aria-labelledby="category-modal-heading"
            className="bg-white rounded border border-zinc-300 w-full max-w-md overflow-hidden"
          >
            <div className="px-4 py-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2 id="category-modal-heading" className="text-sm font-bold text-zinc-900">
                {editingCategory ? "Edit category" : "Add category"}
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
              onSubmit={handleSubmit(onSubmitCategory)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label htmlFor="category-name" className="font-semibold text-zinc-900 block">
                  Name *
                </label>
                <input
                  id="category-name"
                  type="text"
                  placeholder="Motorcycles, engine parts, brakes"
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

              <div className="space-y-1">
                <label htmlFor="category-description" className="font-semibold text-zinc-900 block">
                  Description
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  placeholder="Short summary of what belongs in this category"
                  {...register("description")}
                  className="w-full p-3 border border-zinc-300 rounded resize-none transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
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
                  ) : editingCategory ? (
                    "Save changes"
                  ) : (
                    "Add category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category in use dialog */}
      {reassignState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassign-heading"
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
                  <h2 id="reassign-heading" className="text-sm font-bold text-amber-900">
                    Category in use ({reassignState.sourceCategory?.name})
                  </h2>
                  <p className="text-[11px] text-amber-700">
                    This category still has active products.
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
                  This category has{" "}
                  <span className="font-bold font-mono">
                    {reassignState.productCount} active{" "}
                    {reassignState.productCount === 1 ? "product" : "products"}
                  </span>{" "}
                  assigned to it.
                </p>
                <p className="text-[11px] text-amber-800">
                  Move these products to another category, or cancel the deletion.
                </p>
              </div>

              {reassignState.products.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold text-zinc-800">
                      Products to move ({reassignState.productCount})
                    </span>
                    <span className="text-zinc-500">Move them to the category you pick</span>
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
                <label htmlFor="reassign-target" className="font-semibold text-zinc-900 block">
                  Move all {reassignState.productCount}{" "}
                  {reassignState.productCount === 1 ? "product" : "products"} to *
                </label>
                <select
                  id="reassign-target"
                  {...registerReassign("targetCategoryId")}
                  className={`w-full h-9 px-3 border rounded transition-colors font-medium text-zinc-800 bg-white focus:outline-2 focus:outline-offset-1 ${
                    reassignErrors.targetCategoryId
                      ? "border-red-500 focus:outline-red-600"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                >
                  <option value="">Choose a category</option>
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
                {reassignErrors.targetCategoryId && (
                  <p className="text-[11px] text-red-600">
                    {reassignErrors.targetCategoryId.message}
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

export default AdminCategories;
