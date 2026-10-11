import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  getAdminProducts,
  newProduct,
  updateProduct,
  deleteProduct,
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
          First image (★) is primary
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
          <span className="text-emerald-600 font-bold">★</span>
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
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        ★ Primary
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
                    ✕
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
                      ‹
                    </button>
                    <button
                      type="button"
                      disabled={idx === imageList.length - 1}
                      onClick={() => onMoveImage(idx, 1)}
                      title="Move right"
                      className="w-5 h-5 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer font-bold"
                    >
                      ›
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
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-emerald-600 hover:text-white text-zinc-700 font-semibold text-[10px] transition-colors cursor-pointer"
                    >
                      ★ Set Primary
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

  // Populate form and existing images when editing
  useEffect(() => {
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
  }, [editingProduct]);

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
              className="h-9 px-4 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold transition-colors shadow-sm disabled:opacity-60"
            >
              {isLoading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
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
  const { error: createError, success } = useSelector((state) => state.newProduct);
  const {
    error: actionError,
    isDeleted,
    isUpdated,
    isArchived,
    loading: actionLoading,
  } = useSelector((state) => state.product);
  const { categories = [], brands = [] } = useSelector((state) => state.catalog);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      dispatch({ type: NEW_PRODUCT_RESET });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch(getAdminProducts());
    }
    if (isUpdated) {
      toast.success("Product updated successfully!", { position: "bottom-right" });
      dispatch({ type: UPDATE_PRODUCT_RESET });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch(getAdminProducts());
    }
    if (isDeleted) {
      toast.success("Product deleted successfully!", { position: "bottom-right" });
      dispatch({ type: DELETE_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
    if (isArchived !== null && isArchived !== undefined) {
      toast.success(
        isArchived ? "Product archived." : "Product restored.",
        { position: "bottom-right" },
      );
      dispatch({ type: ARCHIVE_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
  }, [error, createError, actionError, success, isUpdated, isDeleted, isArchived, dispatch]);

  // Delete with SweetAlert2 confirmation
  // Reference: itcp318-s3a-2026/frontend/src/Components/Admin/ProductsList.jsx line 99-101
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete product?",
      text: `"${name}" will be permanently removed including all Cloudinary images.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      dispatch(deleteProduct(id));
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

  // Filter products
  const filtered = products.filter((p) => {
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

  return (
    <div className="space-y-6">
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

      {/* Filter Toolbar */}
      <div className="py-3 border-y border-zinc-200 bg-white px-3">
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

      {/* Products Table */}
      <div className="border border-zinc-200 bg-white overflow-x-auto rounded-lg">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
              <th className="py-2.5 px-4 font-semibold">Product</th>
              <th className="py-2.5 px-4 font-semibold">Category / Brand</th>
              <th className="py-2.5 px-4 font-semibold">Compatible Models</th>
              <th className="py-2.5 px-4 font-semibold">Price</th>
              <th className="py-2.5 px-4 font-semibold">Stock</th>
              <th className="py-2.5 px-4 font-semibold">Financing</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading products...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                  No matching products found. Try adjusting filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                const catName = p.category?.name || "—";
                const brandName = p.brand?.name || "—";
                return (
                  <tr
                    key={p._id}
                    className={`hover:bg-zinc-50/70 transition-colors ${p.isArchived ? "opacity-60 bg-zinc-50/40" : ""}`}
                  >
                    {/* Product thumbnail + name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-semibold text-zinc-900 leading-snug">{p.name}</p>
                          {p.isArchived && (
                            <span className="inline-block mt-0.5 text-[9px] font-mono uppercase px-1 rounded bg-zinc-200 text-zinc-700">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-900 block">{catName}</span>
                      <span className="text-[11px] text-zinc-500">{brandName}</span>
                    </td>

                    {/* Compatible Models */}
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-zinc-600 line-clamp-2 max-w-xs font-mono">
                        {(p.compatibleModels || []).join(", ") || "Universal"}
                      </p>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                      ₱{Number(p.price).toLocaleString()}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold ${isLow ? "text-red-700" : "text-zinc-900"}`}>
                          {p.stock} units
                        </span>
                        {isLow && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 rounded bg-red-100 text-red-800 border border-red-200">
                            Low ≤{p.lowStockThreshold}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Financing */}
                    <td className="py-3 px-4">
                      {p.installmentEligible ? (
                        <span className="inline-block text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Eligible
                          {p.minInstallmentPrice > 0
                            ? ` (Min ₱${Number(p.minInstallmentPrice).toLocaleString()})`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">Cash / COD</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 px-2.5 text-[11px] font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-md text-zinc-700 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch(toggleArchiveProduct(p._id))}
                          className={`h-7 px-2.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                            p.isArchived
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {p.isArchived ? "Restore" : "Archive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id, p.name)}
                          className="h-7 px-2.5 text-[11px] font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        isLoading={actionLoading}
      />
    </div>
  );
};
