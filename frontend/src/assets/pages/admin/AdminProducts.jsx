import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { DataGrid } from "@mui/x-data-grid";
import {
  getAdminProducts,
  newProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkRestoreProducts,
  toggleArchiveProduct,
  getCategories,
  getBrands,
  clearErrors,
} from "../../../actions/productActions.js";
import {
  NEW_PRODUCT_RESET,
  UPDATE_PRODUCT_RESET,
  DELETE_PRODUCT_RESET,
  ARCHIVE_PRODUCT_RESET,
} from "../../../constants/productConstants.js";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder.jsx";

// ─── Product Image Manager ────────────────────────────────────────────────────
// Allows multiple image uploads, preview gallery, reordering, and explicit primary image selection.
// Primary image (index 0) is prominently badged and used across catalog thumbnails.
const ProductImageManager = ({
  imageList,
  onFilesAdded,
  onSetPrimary,
  onMoveImage,
  onRemoveImage,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
        <span>Product Images ({imageList.length})</span>
        <span className="text-[10px] text-zinc-400 font-normal">
          First image is primary showroom thumbnail
        </span>
      </label>
      <label
        htmlFor="product-images-input"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium cursor-pointer transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Add Images</span>
      </label>
      <input
        id="product-images-input"
        type="file"
        name="images"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={onFilesAdded}
      />
    </div>

    {imageList.length === 0 ? (
      <label
        htmlFor="product-images-input"
        className="flex flex-col items-center justify-center gap-1.5 p-6 border-2 border-dashed border-zinc-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors cursor-pointer text-center"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <span className="text-xs font-medium text-zinc-700">
          Click to upload multiple images
        </span>
        <span className="text-[10px] text-zinc-400">
          PNG, JPG, WEBP • Max 5MB per file • Select multiple files
        </span>
      </label>
    ) : (
      <div className="space-y-2">
        <p className="text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>
            The first photo is the <strong>Primary Showroom Thumbnail</strong>. Click <strong>"Set Primary"</strong> on any other photo to change it.
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {imageList.map((img, idx) => {
            const isPrimary = idx === 0;
            return (
              <div
                key={img.id}
                className={`relative rounded-md border overflow-hidden flex flex-col justify-between bg-zinc-50 group transition-all ${
                  isPrimary
                    ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Thumbnail Image */}
                <div className="w-full aspect-square bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={img.preview}
                    alt={`product-img-${idx}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge or Position Tag */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {isPrimary ? (
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Primary
                      </span>
                    ) : (
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    title="Remove this photo"
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Bottom Control Bar */}
                <div className="p-1.5 bg-white border-t border-zinc-200 flex items-center justify-between gap-1 text-[10px]">
                  {/* Reorder Arrows */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveImage(idx, -1)}
                      title="Move left"
                      className="w-5 h-5 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer font-bold"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                      type="button"
                      disabled={idx === imageList.length - 1}
                      onClick={() => onMoveImage(idx, 1)}
                      title="Move right"
                      className="w-5 h-5 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer font-bold"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>

                  {/* Set Primary Button */}
                  {isPrimary ? (
                    <span className="text-[10px] font-bold text-emerald-700">
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(idx)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 hover:bg-emerald-600 hover:text-white text-zinc-700 font-semibold text-[10px] transition-colors cursor-pointer"
                    >
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

// ─── Product Modal Form ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  lowStockThreshold: 5,
  compatibleModels: "",
  installmentEligible: false,
  minInstallmentPrice: "",
  category: "",
  brand: "",
};

const ProductModal = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  brands,
  isLoading,
}) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageList, setImageList] = useState([]); // List of { id, preview, data, isNew }

  const isEdit = !!editingProduct;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form and existing images when editing or reset on close
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setImageList([]);
      setIsSubmitting(false);
      return;
    }

    if (editingProduct) {
      setForm({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        price: editingProduct.price ?? "",
        stock: editingProduct.stock ?? "",
        lowStockThreshold: editingProduct.lowStockThreshold ?? 5,
        compatibleModels: (editingProduct.compatibleModels || []).join(", "),
        installmentEligible: editingProduct.installmentEligible || false,
        minInstallmentPrice: editingProduct.minInstallmentPrice ?? "",
        category: editingProduct.category?._id || editingProduct.category || "",
        brand: editingProduct.brand?._id || editingProduct.brand || "",
      });
      const existing = (editingProduct.images || []).map((img, idx) => ({
        id: img.publicId || `existing-${idx}`,
        preview: img.url,
        data: { url: img.url, publicId: img.publicId },
        isNew: false,
      }));
      setImageList(existing);
    } else {
      setForm(EMPTY_FORM);
      setImageList([]);
    }
    setIsSubmitting(false);
  }, [editingProduct, isOpen]);

  // Reset local submitting flag when Redux finishes loading
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  // Handle adding multiple images via file picker (preserves and appends to existing list)
  const handleFilesAdded = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB size limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setImageList((prev) => [
            ...prev,
            {
              id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              preview: reader.result,
              data: reader.result,
              isNew: true,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input value so user can pick additional files or re-pick if needed
    e.target.value = "";
  };

  // Promotes the image at index to become index 0 (Primary)
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    setImageList((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  // Reorders images forward/backward
  const handleMoveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= imageList.length) return;
    setImageList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Removes an image from the list
  const handleRemoveImage = (index) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || isSubmitting) return; // Prevent spamming / multiple submits

    setIsSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      compatibleModels: form.compatibleModels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      installmentEligible: form.installmentEligible,
      minInstallmentPrice: form.installmentEligible ? Number(form.minInstallmentPrice) : 0,
      category: form.category,
      brand: form.brand,
      images: imageList.map((item) => item.data),
    };

    if (isEdit) {
      dispatch(updateProduct(editingProduct._id, payload));
    } else {
      dispatch(newProduct(payload));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <h2 className="text-sm font-bold text-zinc-900">
            {isEdit ? `Edit Product` : "Add New Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Name */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-900">Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Yamaha NMAX 155 ABS"
              className="w-full h-9 px-3 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-900">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-9 px-2 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-900">Brand *</label>
              <select
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full h-9 px-2 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-900">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Technical specifications, features, displacement..."
              className="w-full p-2.5 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Compatible Models */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-900">Compatible Models</label>
            <input
              type="text"
              value={form.compatibleModels}
              onChange={(e) => setForm({ ...form, compatibleModels: e.target.value })}
              placeholder="e.g. NMAX 155 V1, NMAX 155 V2, Aerox 155"
              className="w-full h-9 px-3 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
            />
            <p className="text-[10px] text-zinc-400">Comma-separated list of models</p>
          </div>

          {/* Price / Stock / Low Stock Threshold */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-900">Price (₱) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full h-9 px-3 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-900">Stock *</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full h-9 px-3 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-900">Low Stock ≤</label>
              <input
                type="number"
                required
                min={1}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="w-full h-9 px-3 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Installment */}
          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
              <input
                type="checkbox"
                checked={form.installmentEligible}
                onChange={(e) => setForm({ ...form, installmentEligible: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-0 w-3.5 h-3.5"
              />
              Enable In-House Installment Financing
            </label>
            {form.installmentEligible && (
              <div className="pl-5 space-y-1">
                <label className="text-[11px] text-zinc-600 font-medium">
                  Min Qualifying Price (₱)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.minInstallmentPrice}
                  onChange={(e) => setForm({ ...form, minInstallmentPrice: e.target.value })}
                  className="w-48 h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <ProductImageManager
              imageList={imageList}
              onFilesAdded={handleFilesAdded}
              onSetPrimary={handleSetPrimary}
              onMoveImage={handleMoveImage}
              onRemoveImage={handleRemoveImage}
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className="h-9 px-4 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Admin Products Page ───────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/Components/Admin/ProductsList.jsx
export const AdminProducts = () => {
  const dispatch = useDispatch();

  // Redux state
  // Reference: itcp318-s3a-2026/frontend/src/Components/Admin/ProductsList.jsx lines 23-24
  const { loading, error, products = [] } = useSelector((state) => state.products);
  const { loading: createLoading, error: createError, success } = useSelector((state) => state.newProduct);
  const {
    error: actionError,
    isDeleted,
    isUpdated,
    isArchived,
    loading: actionLoading,
    message: actionMessage,
  } = useSelector((state) => state.product);
  const { categories = [], brands = [] } = useSelector((state) => state.catalog);

  const isProductBusy = createLoading || actionLoading;

  // Local UI state
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "archived"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const headerCheckboxRef = useRef(null);

  // Fetch data on mount
  // Reference: itcp318-s3a-2026/frontend/src/Components/Admin/ProductsList.jsx line 55
  useEffect(() => {
    dispatch(getAdminProducts());
    dispatch(getCategories());
    dispatch(getBrands());
  }, [dispatch]);

  // Handle success / error side-effects with toast
  // Reference: itcp318-s3a-2026/frontend/src/Components/Admin/ProductsList.jsx lines 57-80
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }
    if (createError) {
      toast.error(createError, { position: "bottom-right" });
      dispatch(clearErrors());
    }
    if (actionError) {
      toast.error(actionError, { position: "bottom-right" });
      dispatch(clearErrors());
    }
    if (success) {
      toast.success("Product created successfully!", { position: "bottom-right" });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch({ type: NEW_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
    if (isUpdated) {
      toast.success("Product updated successfully!", { position: "bottom-right" });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch({ type: UPDATE_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
    if (isDeleted) {
      toast.success(actionMessage || "Product soft-deleted successfully!", { position: "bottom-right" });
      dispatch({ type: DELETE_PRODUCT_RESET });
      dispatch(getAdminProducts());
      setSelectedProductIds([]);
    }
    if (isArchived !== null && isArchived !== undefined) {
      toast.success(
        actionMessage || (isArchived ? "Product archived." : "Product restored."),
        { position: "bottom-right" },
      );
      dispatch({ type: ARCHIVE_PRODUCT_RESET });
      dispatch(getAdminProducts());
      setSelectedProductIds([]);
    }
  }, [error, createError, actionError, success, isUpdated, isDeleted, isArchived, actionMessage, dispatch]);

  // Soft-delete with SweetAlert2 confirmation (no permanent deletion)
  const handleSoftDelete = async (p) => {
    const result = await Swal.fire({
      title: `Delete "${p.name}"?`,
      text: `"${p.name}" will be soft-deleted from the catalog. You can restore it at any time.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      dispatch(deleteProduct(p._id));
    }
  };

  // Restore product with confirmation
  const handleRestore = async (p) => {
    const confirm = await Swal.fire({
      title: `Restore "${p.name}"?`,
      text: `"${p.name}" will be restored and made available in the shop catalog.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });
    if (confirm.isConfirmed) {
      dispatch(toggleArchiveProduct(p._id));
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Active & Archived counts
  const activeProducts = products.filter((p) => !p.isArchived);
  const archivedProducts = products.filter((p) => p.isArchived);

  // Filter products
  const filtered = products.filter((p) => {
    if (statusFilter === "active" && p.isArchived) return false;
    if (statusFilter === "archived" && !p.isArchived) return false;
    const catId = typeof p.category === "object" ? p.category?._id : p.category;
    const brandId = typeof p.brand === "object" ? p.brand?._id : p.brand;
    if (selectedCategory !== "all" && catId !== selectedCategory) return false;
    if (selectedBrand !== "all" && brandId !== selectedBrand) return false;
    if (onlyLowStock && p.stock > p.lowStockThreshold) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchModels = p.compatibleModels?.some((m) => m.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchModels) return false;
    }
    return true;
  });

  // Bulk selection calculations
  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p._id)),
    [products, selectedProductIds]
  );
  const selectedActiveProducts = useMemo(
    () => selectedProducts.filter((p) => !p.isArchived),
    [selectedProducts]
  );
  const selectedArchivedProducts = useMemo(
    () => selectedProducts.filter((p) => p.isArchived),
    [selectedProducts]
  );

  // Clear selections when switching status tabs
  useEffect(() => {
    setSelectedProductIds([]);
  }, [statusFilter]);

  const handleRowSelectionChange = useCallback(
    (newSelectionModel) => {
      if (!newSelectionModel) {
        setSelectedProductIds([]);
        return;
      }
      if (Array.isArray(newSelectionModel)) {
        setSelectedProductIds(newSelectionModel);
      } else if (newSelectionModel.ids instanceof Set) {
        if (newSelectionModel.type === "exclude") {
          const excluded = newSelectionModel.ids;
          setSelectedProductIds(filtered.map((p) => p._id).filter((id) => !excluded.has(id)));
        } else {
          setSelectedProductIds(Array.from(newSelectionModel.ids));
        }
      } else if (Array.isArray(newSelectionModel.ids)) {
        setSelectedProductIds(newSelectionModel.ids);
      } else {
        setSelectedProductIds([]);
      }
    },
    [filtered]
  );

  const rowSelectionModel = useMemo(() => {
    return {
      type: "include",
      ids: new Set(selectedProductIds),
    };
  }, [selectedProductIds]);

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Product",
        flex: 1.6,
        minWidth: 260,
        renderCell: (params) => {
          const p = params.row;
          const catName = p.category?.name || "—";
          return (
            <div className="flex items-center gap-3 min-w-0 py-1">
              <div className="w-10 h-10 rounded-md border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50 relative">
                {p.images && p.images.length > 0 ? (
                  <>
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    {p.images.length > 1 && (
                      <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[8px] font-mono px-1 rounded-tl">
                        {p.images.length}
                      </span>
                    )}
                  </>
                ) : (
                  <ProductImagePlaceholder
                    category={catName}
                    name={p.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <p className="font-semibold text-zinc-900 leading-snug truncate">{p.name}</p>
                {p.isArchived && (
                  <span className="w-fit h-4 mt-1 px-1 text-[9px] leading-4 font-mono uppercase rounded bg-zinc-200 text-zinc-700">
                    Archived
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        field: "categoryBrand",
        headerName: "Category / Brand",
        flex: 1,
        minWidth: 150,
        valueGetter: (value, row) => `${row.category?.name || "—"} ${row.brand?.name || "—"}`,
        renderCell: (params) => {
          const catName = params.row.category?.name || "—";
          const brandName = params.row.brand?.name || "—";
          return (
            <div className="flex flex-col justify-center min-w-0 w-full leading-tight">
              <span className="font-medium text-zinc-900 block truncate" title={catName}>{catName}</span>
              <span className="text-[11px] text-zinc-500 block truncate" title={brandName}>{brandName}</span>
            </div>
          );
        },
      },
      {
        field: "isArchived",
        headerName: "Status",
        width: 155,
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
        field: "compatibleModels",
        headerName: "Compatible Models",
        flex: 1.1,
        minWidth: 170,
        valueGetter: (value, row) => (row.compatibleModels || []).join(", ") || "Universal",
        renderCell: (params) => (
          <p className="text-[11px] text-zinc-600 line-clamp-2 max-w-xs font-mono">
            {(params.row.compatibleModels || []).join(", ") || "Universal"}
          </p>
        ),
      },
      {
        field: "price",
        headerName: "Price",
        width: 120,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">
            ₱{Number(params.row.price).toLocaleString()}
          </span>
        ),
      },
      {
        field: "stock",
        headerName: "Stock",
        width: 155,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          const p = params.row;
          const isLow = p.stock <= p.lowStockThreshold;
          return (
            <div className="flex items-center gap-1.5">
              <span className={`font-mono font-bold ${isLow ? "text-red-700" : "text-zinc-900"}`}>
                {p.stock} units
              </span>
              {isLow && (
                <span className="admin-table-badge text-[10px] font-mono font-semibold bg-red-100 text-red-800 border border-red-200">
                  Low ≤{p.lowStockThreshold}
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "installmentEligible",
        headerName: "Financing",
        width: 190,
        renderCell: (params) => {
          const p = params.row;
          return p.installmentEligible ? (
            <span className="admin-table-badge text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
              Eligible
              {p.minInstallmentPrice > 0
                ? ` (Min ₱${Number(p.minInstallmentPrice).toLocaleString()})`
                : ""}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">Cash / COD</span>
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
          const p = params.row;
          return (
            <div
              className="flex items-center justify-end gap-1 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {p.isArchived ? (
                <button
                  type="button"
                  onClick={() => handleRestore(p)}
                  className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore Product"
                  aria-label="Restore Product"
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
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit Product"
                    aria-label="Edit Product"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSoftDelete(p)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Product"
                    aria-label="Delete Product"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    [handleRestore, handleOpenEdit, handleSoftDelete]
  );

  // Bulk Soft-Delete with SweetAlert2 confirmation
  const handleBulkSoftDelete = async () => {
    const targetIds = selectedActiveProducts.map((p) => p._id);
    if (targetIds.length === 0) return;

    const count = targetIds.length;
    const result = await Swal.fire({
      title: `Delete ${count} selected product(s)?`,
      text: `These ${count} product(s) will be soft-deleted from the catalog. You can view them in the Soft-Deleted filter or restore them at any time.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, delete (${count})`,
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setBulkLoading(true);
      await dispatch(bulkDeleteProducts(targetIds));
      setBulkLoading(false);
    }
  };

  // Bulk Restore with confirmation
  const handleBulkRestore = async () => {
    const targetIds = selectedArchivedProducts.map((p) => p._id);
    if (targetIds.length === 0) return;

    const count = targetIds.length;
    const result = await Swal.fire({
      title: `Restore ${count} selected product(s)?`,
      text: `These ${count} product(s) will be restored to active status and made available in the shop catalog.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, restore (${count})`,
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setBulkLoading(true);
      await dispatch(bulkRestoreProducts(targetIds));
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Catalog Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <Link
          to="/admin/products"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-xs"
        >
          Products &amp; Units ({products.length})
        </Link>
        <Link
          to="/admin/categories"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Categories ({categories.length})
        </Link>
        <Link
          to="/admin/brands"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Brands ({brands.length})
        </Link>
      </div>

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Catalog &amp; Inventory
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage motorcycles, OEM parts, accessories and stock levels.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Active Products
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeProducts.length}
            </span>
            <span className="text-xs text-zinc-400">
              of {products.length} total units
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Soft-Deleted / Archived
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedProducts.length}
            </span>
            <span className="text-xs text-zinc-400">recoverable</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600 font-mono">
              {products.filter((p) => p.stock <= p.lowStockThreshold && !p.isArchived).length}
            </span>
            <span className="text-xs text-zinc-400">need replenishment</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="py-3 border-y border-zinc-200 bg-white px-3 space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
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
              All ({products.length})
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
              Active ({activeProducts.length})
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
              Soft-Deleted ({archivedProducts.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, model, description..."
              className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 h-8 px-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[11px]">Low Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProductIds.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-lg p-3 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 shadow-md flex-wrap animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">
              {selectedProductIds.length} product{selectedProductIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer ml-1"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedActiveProducts.length > 0 && (
              <button
                type="button"
                onClick={handleBulkSoftDelete}
                disabled={bulkLoading}
                className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Soft-delete selected active products"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete Selected ({selectedActiveProducts.length})</span>
              </button>
            )}

            {selectedArchivedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleBulkRestore}
                disabled={bulkLoading}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Restore selected soft-deleted products"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Restore Selected ({selectedArchivedProducts.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Products DataGrid */}
      <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <DataGrid
          className="admin-products-grid"
          rows={filtered}
          columns={columns}
          getRowId={(row) => row._id}
          rowHeight={64}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          loading={loading}
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
            "& .MuiDataGrid-columnHeaderCheckbox": {
              width: "52px !important",
              minWidth: "52px !important",
              maxWidth: "52px !important",
              paddingLeft: "0 !important",
              paddingRight: "0 !important",
              justifyContent: "center",
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
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "rgba(236, 253, 245, 0.6) !important",
              "&:hover": {
                backgroundColor: "rgba(209, 250, 229, 0.8) !important",
              },
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
              paddingLeft: "16px",
              paddingRight: "16px",
            },
            "& .MuiDataGrid-cellCheckbox": {
              width: "52px !important",
              minWidth: "52px !important",
              maxWidth: "52px !important",
              paddingLeft: "0 !important",
              paddingRight: "0 !important",
              justifyContent: "center",
            },
            "& .MuiCheckbox-root": {
              color: "#d4d4d8",
              "&.Mui-checked": {
                color: "#059669",
              },
              "&.MuiCheckbox-indeterminate": {
                color: "#059669",
              },
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

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        isLoading={isProductBusy}
      />
    </div>
  );
};
