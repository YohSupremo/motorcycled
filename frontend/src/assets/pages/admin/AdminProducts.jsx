import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
  toggleFeatureProduct,
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
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const StarIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.2l5.9-.8z" />
  </svg>
);

// Product Image Manager
// Allows multiple image uploads, preview gallery, reordering, and explicit primary image selection.
// The primary image (index 0) is used across catalog thumbnails.
const ProductImageManager = ({
  imageList,
  onFilesAdded,
  onSetPrimary,
  onMoveImage,
  onRemoveImage,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <label className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
        <span>Product images ({imageList.length})</span>
        <span className="text-[11px] text-zinc-500 font-normal">
          The first image is the main thumbnail.
        </span>
      </label>
      <label
        htmlFor="product-images-input"
        className="inline-flex items-center gap-2 px-3 py-2 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium cursor-pointer transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Add images</span>
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
        className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-zinc-200 rounded hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors cursor-pointer text-center"
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
        <span className="text-xs font-medium text-zinc-700">Choose images to upload</span>
        <span className="text-[11px] text-zinc-500">
          PNG, JPG, or WEBP. Up to 5MB each. Multiple files allowed.
        </span>
      </label>
    ) : (
      <div className="space-y-2">
        <p className="text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200 rounded px-3 py-2 flex items-center gap-2">
          <span className="text-emerald-700 shrink-0">
            <StarIcon className="w-3.5 h-3.5" />
          </span>
          <span>
            The first photo is the main thumbnail. Use Set primary on another photo to change it.
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imageList.map((img, idx) => {
            const isPrimary = idx === 0;
            return (
              <div
                key={img.id}
                className={`relative rounded border overflow-hidden flex flex-col justify-between bg-zinc-50 group transition-colors ${
                  isPrimary
                    ? "border-emerald-600 ring-2 ring-emerald-600/30"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="w-full aspect-square bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={img.preview}
                    alt={`Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {isPrimary ? (
                      <span className="bg-emerald-700 text-white text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1">
                        Primary
                      </span>
                    ) : (
                      <span className="bg-zinc-900/70 text-white text-[10px] font-mono px-2 py-1 rounded">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    title="Remove this photo"
                    aria-label="Remove this photo"
                    className="absolute top-2 right-2 w-6 h-6 rounded bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="p-2 bg-white border-t border-zinc-200 flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveImage(idx, -1)}
                      title="Move left"
                      aria-label="Move image left"
                      className="w-6 h-6 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={idx === imageList.length - 1}
                      onClick={() => onMoveImage(idx, 1)}
                      title="Move right"
                      aria-label="Move image right"
                      className="w-6 h-6 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                  {isPrimary ? (
                    <span className="text-[11px] font-semibold text-emerald-700">Primary</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(idx)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Set primary
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

const productSchema = yup.object({
  name: yup.string().trim().required("Product name is required"),
  category: yup.string().trim().required("Category is required"),
  brand: yup.string().trim().required("Brand is required"),
  description: yup.string().default(""),
  compatibleModels: yup.string().default(""),
  price: yup
    .number()
    .typeError("Price must be a valid number")
    .required("Price is required")
    .min(0, "Price cannot be negative"),
  stock: yup
    .number()
    .typeError("Stock must be a valid number")
    .required("Stock is required")
    .min(0, "Stock cannot be negative"),
  lowStockThreshold: yup
    .number()
    .typeError("Threshold must be a valid number")
    .required("Low stock threshold is required")
    .min(1, "Threshold must be at least 1"),
  installmentEligible: yup.boolean().default(false),
  minInstallmentPrice: yup
    .number()
    .transform((val, orig) => (orig === "" || orig === null || orig === undefined ? 0 : val))
    .nullable()
    .when("installmentEligible", {
      is: true,
      then: (schema) =>
        schema
          .required("Minimum installment price is required")
          .min(0, "Cannot be negative"),
      otherwise: (schema) => schema.notRequired(),
    }),
  isFeatured: yup.boolean().default(false),
});

const ProductModal = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  brands,
  isLoading,
}) => {
  const dispatch = useDispatch();
  const [imageList, setImageList] = useState([]); // List of { id, preview, data, isNew }

  const isEdit = !!editingProduct;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      brand: "",
      description: "",
      compatibleModels: "",
      price: "",
      stock: "",
      lowStockThreshold: 5,
      installmentEligible: false,
      minInstallmentPrice: "",
      isFeatured: false,
    },
  });

  const installmentEligible = watch("installmentEligible");

  // Populate form and existing images when editing or reset on close
  useEffect(() => {
    if (!isOpen) {
      reset({
        name: "",
        category: "",
        brand: "",
        description: "",
        compatibleModels: "",
        price: "",
        stock: "",
        lowStockThreshold: 5,
        installmentEligible: false,
        minInstallmentPrice: "",
        isFeatured: false,
      });
      setImageList([]);
      return;
    }

    if (editingProduct) {
      reset({
        name: editingProduct.name || "",
        category: editingProduct.category?._id || editingProduct.category || "",
        brand: editingProduct.brand?._id || editingProduct.brand || "",
        description: editingProduct.description || "",
        compatibleModels: (editingProduct.compatibleModels || []).join(", "),
        price: editingProduct.price ?? "",
        stock: editingProduct.stock ?? "",
        lowStockThreshold: editingProduct.lowStockThreshold ?? 5,
        installmentEligible: editingProduct.installmentEligible || false,
        minInstallmentPrice: editingProduct.minInstallmentPrice ?? "",
        isFeatured: Boolean(editingProduct.isFeatured),
      });
      const existing = (editingProduct.images || []).map((img, idx) => ({
        id: img.publicId || `existing-${idx}`,
        preview: img.url,
        data: { url: img.url, publicId: img.publicId },
        isNew: false,
      }));
      setImageList(existing);
    } else {
      reset({
        name: "",
        category: "",
        brand: "",
        description: "",
        compatibleModels: "",
        price: "",
        stock: "",
        lowStockThreshold: 5,
        installmentEligible: false,
        minInstallmentPrice: "",
        isFeatured: false,
      });
      setImageList([]);
    }
  }, [editingProduct, isOpen, reset]);

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

  const onSubmitProduct = (data) => {
    if (isLoading || isSubmitting) return;

    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : "",
      price: Number(data.price),
      stock: Number(data.stock),
      lowStockThreshold: Number(data.lowStockThreshold),
      compatibleModels: data.compatibleModels
        ? data.compatibleModels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      installmentEligible: Boolean(data.installmentEligible),
      minInstallmentPrice: data.installmentEligible
        ? Number(data.minInstallmentPrice || 0)
        : 0,
      isFeatured: Boolean(data.isFeatured),
      category: data.category,
      brand: data.brand,
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
    <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-heading"
        className="bg-white border border-zinc-300 rounded max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
          <h2 id="product-modal-heading" className="text-sm font-bold text-zinc-900">
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 cursor-pointer transition-colors"
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
          onSubmit={handleSubmit(onSubmitProduct)}
          noValidate
          className="p-4 space-y-4 overflow-y-auto text-xs flex-1"
        >
          <div className="space-y-1">
            <label htmlFor="product-name" className="font-semibold text-zinc-900">
              Product name *
            </label>
            <input
              id="product-name"
              type="text"
              {...register("name")}
              placeholder="Yamaha NMAX 155 ABS"
              className={`w-full h-9 px-3 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                errors.name
                  ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                  : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
              }`}
            />
            {errors.name && (
              <span className="text-[11px] text-rose-600 block">{errors.name.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="product-category" className="font-semibold text-zinc-900">
                Category *
              </label>
              <select
                id="product-category"
                {...register("category")}
                className={`w-full h-9 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                  errors.category
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="text-[11px] text-rose-600 block">{errors.category.message}</span>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="product-brand" className="font-semibold text-zinc-900">
                Brand *
              </label>
              <select
                id="product-brand"
                {...register("brand")}
                className={`w-full h-9 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                  errors.brand
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.brand && (
                <span className="text-[11px] text-rose-600 block">{errors.brand.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="product-description" className="font-semibold text-zinc-900">
              Description
            </label>
            <textarea
              id="product-description"
              rows={3}
              {...register("description")}
              placeholder="Technical specifications, features, displacement"
              className="w-full p-3 border border-zinc-300 rounded resize-none transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="product-models" className="font-semibold text-zinc-900">
              Compatible models
            </label>
            <input
              id="product-models"
              type="text"
              {...register("compatibleModels")}
              placeholder="NMAX 155 V1, NMAX 155 V2, Aerox 155"
              className="w-full h-9 px-3 border border-zinc-300 rounded font-mono transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            />
            <p className="text-[11px] text-zinc-500">Comma-separated list of models</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="product-price" className="font-semibold text-zinc-900">
                Price (₱) *
              </label>
              <input
                id="product-price"
                type="number"
                min={0}
                {...register("price")}
                className={`w-full h-9 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                  errors.price
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              />
              {errors.price && (
                <span className="text-[11px] text-rose-600 block">{errors.price.message}</span>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="product-stock" className="font-semibold text-zinc-900">
                Stock *
              </label>
              <input
                id="product-stock"
                type="number"
                min={0}
                {...register("stock")}
                className={`w-full h-9 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                  errors.stock
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              />
              {errors.stock && (
                <span className="text-[11px] text-rose-600 block">{errors.stock.message}</span>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="product-threshold" className="font-semibold text-zinc-900">
                Low stock threshold
              </label>
              <input
                id="product-threshold"
                type="number"
                min={1}
                {...register("lowStockThreshold")}
                className={`w-full h-9 px-3 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                  errors.lowStockThreshold
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              />
              {errors.lowStockThreshold && (
                <span className="text-[11px] text-rose-600 block">
                  {errors.lowStockThreshold.message}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
              <input
                type="checkbox"
                {...register("installmentEligible")}
                className="rounded text-emerald-700 w-3.5 h-3.5"
              />
              Enable installment financing
            </label>
            {installmentEligible && (
              <div className="pl-5 space-y-1">
                <label
                  htmlFor="product-min-installment"
                  className="text-[11px] text-zinc-600 font-medium"
                >
                  Minimum qualifying price (₱)
                </label>
                <input
                  id="product-min-installment"
                  type="number"
                  min={0}
                  {...register("minInstallmentPrice")}
                  className={`w-48 h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.minInstallmentPrice
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {errors.minInstallmentPrice && (
                  <span className="text-[11px] text-rose-600 block">
                    {errors.minInstallmentPrice.message}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
              <input
                type="checkbox"
                {...register("isFeatured")}
                className="rounded text-emerald-700 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-2">
                <span className="text-emerald-700">
                  <StarIcon className="w-3.5 h-3.5" />
                </span>
                <span>Feature on the homepage</span>
                <span className="text-[11px] text-zinc-500 font-normal">
                  Shows this unit in the homepage showroom.
                </span>
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-zinc-200 space-y-2">
            <ProductImageManager
              imageList={imageList}
              onFilesAdded={handleFilesAdded}
              onSetPrimary={handleSetPrimary}
              onMoveImage={handleMoveImage}
              onRemoveImage={handleRemoveImage}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className="h-9 px-4 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="h-9 px-5 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEdit ? "Updating..." : "Adding..."}</span>
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Products Page
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
      toast.success("Product created.", { position: "bottom-right" });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch({ type: NEW_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
    if (isUpdated) {
      toast.success("Product updated.", { position: "bottom-right" });
      setIsModalOpen(false);
      setEditingProduct(null);
      dispatch({ type: UPDATE_PRODUCT_RESET });
      dispatch(getAdminProducts());
    }
    if (isDeleted) {
      toast.success(actionMessage || "Product moved to the archive.", { position: "bottom-right" });
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
      confirmButtonText: "Delete product",
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
      confirmButtonText: "Restore product",
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

  // Active, Archived & Featured counts
  const activeProducts = products.filter((p) => !p.isArchived);
  const archivedProducts = products.filter((p) => p.isArchived);
  const featuredProducts = products.filter((p) => p.isFeatured && !p.isArchived);

  // Filter products
  const filtered = products.filter((p) => {
    if (statusFilter === "active" && p.isArchived) return false;
    if (statusFilter === "archived" && !p.isArchived) return false;
    if (statusFilter === "featured" && (!p.isFeatured || p.isArchived)) return false;
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
          const catName = p.category?.name || "Unassigned";
          return (
            <div className="flex items-center gap-3 min-w-0 py-1">
              <div className="w-10 h-10 rounded border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50 relative">
                {p.images && p.images.length > 0 ? (
                  <>
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    {p.images.length > 1 && (
                      <span className="absolute bottom-0 right-0 bg-zinc-900/70 text-white text-[10px] font-mono px-1 rounded-tl">
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
                  <span className="w-fit mt-1 px-2 py-0.5 text-[11px] leading-4 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
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
        headerName: "Category and brand",
        flex: 1,
        minWidth: 150,
        valueGetter: (value, row) => `${row.category?.name || "Unassigned"} ${row.brand?.name || "Unassigned"}`,
        renderCell: (params) => {
          const catName = params.row.category?.name || "Unassigned";
          const brandName = params.row.brand?.name || "Unassigned";
          return (
            <div className="flex flex-col justify-center min-w-0 w-full leading-tight">
              <span className="font-medium text-zinc-900 block truncate" title={catName}>
                {catName}
              </span>
              <span className="text-[11px] text-zinc-500 block truncate" title={brandName}>
                {brandName}
              </span>
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
        field: "compatibleModels",
        headerName: "Compatible models",
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
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${isLow ? "text-rose-700" : "text-zinc-900"}`}>
                {p.stock} units
              </span>
              {isLow && (
                <span className="admin-table-badge text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  Low stock
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
            <div className="flex flex-col justify-center leading-tight">
              <span className="admin-table-badge text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                Eligible
              </span>
              {p.minInstallmentPrice > 0 && (
                <span className="text-[11px] text-zinc-500 mt-1">
                  Min ₱{Number(p.minInstallmentPrice).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500">Cash or COD</span>
          );
        },
      },
      {
        field: "isFeatured",
        headerName: "Featured",
        width: 100,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          const p = params.row;
          const isFeatured = Boolean(p.isFeatured);
          return (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const res = await dispatch(toggleFeatureProduct(p._id));
                if (res?.success) {
                  toast.success(res.message);
                } else {
                  toast.error(res?.message || "Failed to update featured status");
                }
              }}
              className={`p-2 rounded flex items-center justify-center transition-colors cursor-pointer ${
                isFeatured
                  ? "text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                  : "text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100"
              }`}
              title={
                isFeatured
                  ? "Featured in the homepage showroom. Click to remove"
                  : "Not featured. Click to feature on the homepage"
              }
              aria-label={isFeatured ? "Remove from homepage" : "Feature on homepage"}
              aria-pressed={isFeatured}
            >
              <StarIcon />
            </button>
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
                  className="p-2 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore product"
                  aria-label="Restore product"
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
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Edit product"
                    aria-label="Edit product"
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
                    onClick={() => handleSoftDelete(p)}
                    className="p-2 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Archive product"
                    aria-label="Archive product"
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
    [handleRestore, handleOpenEdit, handleSoftDelete]
  );

  // Bulk Soft-Delete with SweetAlert2 confirmation
  const handleBulkSoftDelete = async () => {
    const targetIds = selectedActiveProducts.map((p) => p._id);
    if (targetIds.length === 0) return;

    const count = targetIds.length;
    const result = await Swal.fire({
      title: `Delete ${count} selected ${count === 1 ? "product" : "products"}?`,
      text: `These ${count} ${count === 1 ? "product" : "products"} will be soft-deleted from the catalog. You can view them in the Archived filter or restore them at any time.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Delete ${count}`,
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
      title: `Restore ${count} selected ${count === 1 ? "product" : "products"}?`,
      text: `These ${count} ${count === 1 ? "product" : "products"} will be restored to active status and made available in the shop catalog.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Restore ${count}`,
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
      {/* Catalog subnavigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <Link
          to="/admin/products"
          className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 text-white"
        >
          Products ({products.length})
        </Link>
        <Link
          to="/admin/categories"
          className="px-4 py-2 rounded text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Categories ({categories.length})
        </Link>
        <Link
          to="/admin/brands"
          className="px-4 py-2 rounded text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Brands ({brands.length})
        </Link>
      </div>

      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Products and stock
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage motorcycles, OEM parts, accessories, and stock levels.
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
          Add product
        </button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Active products</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono">
              {activeProducts.length}
            </span>
            <span className="text-xs text-zinc-500">of {products.length} units</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Archived</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {archivedProducts.length}
            </span>
            <span className="text-xs text-zinc-500">can be restored</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Low stock</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 font-mono">
              {products.filter((p) => p.stock <= p.lowStockThreshold && !p.isArchived).length}
            </span>
            <span className="text-xs text-zinc-500">below threshold</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="py-4 border-y border-zinc-200 bg-white px-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
              All ({products.length})
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
              Active ({activeProducts.length})
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
              Archived ({archivedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("featured")}
              className={`px-3 py-2 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-2 ${
                statusFilter === "featured"
                  ? "bg-white text-emerald-700 border border-emerald-300"
                  : "text-zinc-600 hover:text-zinc-900 border border-transparent"
              }`}
            >
              <span className="text-emerald-700">
                <StarIcon className="w-3.5 h-3.5" />
              </span>
              <span>Featured ({featuredProducts.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label htmlFor="product-search" className="text-[11px] font-semibold text-zinc-600 block">
              Search
            </label>
            <input
              id="product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, model, or description"
              className="w-full h-8 px-3 text-xs bg-zinc-50 border border-zinc-300 rounded transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="product-filter-category" className="text-[11px] font-semibold text-zinc-600 block">
              Category
            </label>
            <select
              id="product-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="product-filter-brand" className="text-[11px] font-semibold text-zinc-600 block">
              Brand
            </label>
            <select
              id="product-filter-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-300 rounded transition-colors focus:bg-white focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            >
              <option value="all">All brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <label
              htmlFor="product-filter-low-stock"
              className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 h-8 px-3 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded transition-colors"
            >
              <input
                id="product-filter-low-stock"
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="rounded text-emerald-700 w-3.5 h-3.5"
              />
              <span className="text-[11px]">Low stock only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedProductIds.length > 0 && (
        <div className="bg-zinc-900 text-white rounded p-4 sm:px-4 sm:py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {selectedProductIds.length}{" "}
              {selectedProductIds.length === 1 ? "product" : "products"} selected
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
                className="h-8 px-3 rounded bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                title="Archive the selected products"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Archive selected ({selectedActiveProducts.length})</span>
              </button>
            )}

            {selectedArchivedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleBulkRestore}
                disabled={bulkLoading}
                className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                title="Restore the selected archived products"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Restore selected ({selectedArchivedProducts.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="border border-zinc-200 bg-white rounded overflow-hidden">
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
            ...adminDataGridSx,
            "& .MuiDataGrid-columnHeaderCheckbox": {
              width: "52px !important",
              minWidth: "52px !important",
              maxWidth: "52px !important",
              paddingLeft: "0 !important",
              paddingRight: "0 !important",
              justifyContent: "center",
            },
            "& .MuiDataGrid-cellCheckbox": {
              width: "52px !important",
              minWidth: "52px !important",
              maxWidth: "52px !important",
              paddingLeft: "0 !important",
              paddingRight: "0 !important",
              justifyContent: "center",
            },
          }}
        />
      </div>

      {/* Add / edit modal */}
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
