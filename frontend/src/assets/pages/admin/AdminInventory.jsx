import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";
import { getAdminProducts } from "../../../actions/productActions";

const API = import.meta.env.VITE_API;

const supplierSchema = yup.object({
  name: yup.string().trim().required("Supplier name is required"),
  contactPerson: yup.string().trim().default(""),
  email: yup
    .string()
    .trim()
    .default("")
    .test(
      "valid-email",
      "Enter a valid email address",
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    ),
  phone: yup
    .string()
    .trim()
    .default("")
    .test(
      "valid-phone",
      "Enter a valid phone number (7–15 digits)",
      (value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      },
    ),
  address: yup.string().trim().default(""),
});

const bulkRestockSchema = yup.object({
  referenceNo: yup
    .string()
    .trim()
    .required("Purchase order reference is required"),
  restocks: yup
    .array()
    .of(
      yup.object({
        productId: yup.string().required("Select a product"),
        productName: yup.string().default(""),
        productPrice: yup.number().default(0),
        supplierId: yup.string().required("Select a supplier"),
        quantity: yup
          .number()
          .typeError("Quantity must be a valid number")
          .required("Quantity is required")
          .integer("Use a whole number")
          .min(1, "Quantity must be at least 1"),
        unitCost: yup
          .number()
          .typeError("Unit cost must be a valid number")
          .required("Unit cost is required")
          .moreThan(0, "Unit cost must be greater than 0")
          .test(
            "below-selling-price",
            "Unit cost must be less than the selling price",
            function validateMargin(value) {
              const sellingPrice = Number(this.parent.productPrice || 0);
              if (!sellingPrice || value === undefined || value === null || value === "") {
                return true;
              }
              return Number(value) < sellingPrice;
            },
          ),
        note: yup.string().default(""),
      }),
    )
    .min(1, "Add at least one restock line"),
});

const OPERATION_LABELS = {
  restock: "Restock",
  sale: "Sale",
  reserve: "Reserve",
  release: "Release",
  cancellation: "Cancellation",
  adjustment: "Adjustment",
};

const nextPurchaseOrderRef = () =>
  `PO-SUP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

const emptyRestockRow = (supplierId = "") => ({
  productId: "",
  productName: "",
  productPrice: 0,
  supplierId,
  quantity: 1,
  unitCost: 1,
  note: "",
});

const formatPeso = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fetchInventoryTransactions = async (params = {}) => {
  const { data } = await axios.get(`${API}/admin/inventory/transactions`, {
    params,
    withCredentials: true,
  });
  return {
    transactions: data.transactions || [],
    summary: data.summary || {
      totalEntries: 0,
      totalUnits: 0,
      totalCost: 0,
    },
  };
};

const fetchSuppliers = async (status = "all") => {
  const { data } = await axios.get(`${API}/suppliers`, {
    params: { status },
    withCredentials: true,
  });
  return data.suppliers || [];
};

const OPERATION_STYLES = {
  restock: "bg-emerald-50 text-emerald-800 border-emerald-200",
  sale: "bg-indigo-50 text-indigo-800 border-indigo-200",
  reserve: "bg-amber-50 text-amber-800 border-amber-200",
  release: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cancellation: "bg-amber-50 text-amber-800 border-amber-200",
  adjustment: "bg-purple-50 text-purple-800 border-purple-200",
};

const stockBadgeClass = (stock) => {
  if (stock <= 0) return "bg-rose-50 text-rose-700 border-rose-200";
  if (stock <= 5) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
};

const ProductSelect = ({
  id,
  value,
  options,
  loading,
  invalid,
  onChange,
  onBlur,
  onSelect,
  valueKey = "name",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const getOptionValue = (product) =>
    valueKey === "_id" ? product._id : product.name;

  const selectedProduct = options.find(
    (product) => getOptionValue(product) === value,
  );
  const displayValue = selectedProduct?.name ?? "";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const query = search.trim().toLowerCase();
  const filteredOptions = query
    ? options.filter((product) => product.name?.toLowerCase().includes(query))
    : options;

  const openOptions = () => {
    setIsOpen(true);
    setSearch(selectedProduct?.name || "");
    setActiveIndex(0);
  };

  const selectProduct = (product) => {
    onChange(getOptionValue(product));
    onSelect?.(product);
    setSearch(product.name);
    setIsOpen(false);
    setActiveIndex(0);
  };

  const closeOptions = () => {
    setIsOpen(false);
    setSearch(selectedProduct?.name || "");
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openOptions();
      } else {
        setActiveIndex((index) =>
          Math.min(index + 1, filteredOptions.length - 1),
        );
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && isOpen && filteredOptions.length > 0) {
      event.preventDefault();
      selectProduct(filteredOptions[activeIndex] ?? filteredOptions[0]);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeOptions();
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filteredOptions[activeIndex]
              ? `${id}-option-${filteredOptions[activeIndex]._id}`
              : undefined
          }
          value={isOpen ? search : displayValue}
          placeholder="Search products"
          onFocus={() => {
            if (!isOpen) openOptions();
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
            if (value) {
              onChange("");
              onSelect?.(null);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          className={`w-full !h-8 pl-2 pr-8 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
            invalid
              ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
              : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (isOpen) {
              closeOptions();
              inputRef.current?.blur();
            } else {
              inputRef.current?.focus();
              openOptions();
            }
          }}
          aria-label={isOpen ? "Close product list" : "Open product list"}
          className="absolute right-0 top-0 flex h-8 w-8 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded border border-zinc-200 bg-white py-1"
        >
          {loading ? (
            <li className="px-2.5 py-2 text-[11px] text-zinc-500">
              Loading products...
            </li>
          ) : filteredOptions.length === 0 ? (
            <li className="px-2.5 py-2 text-[11px] text-zinc-500">
              No products found.
            </li>
          ) : (
            filteredOptions.map((product, index) => {
              const stock = Number(product.stock ?? 0);
              return (
                <li
                  key={product._id}
                  id={`${id}-option-${product._id}`}
                  role="option"
                  aria-selected={value === getOptionValue(product)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectProduct(product);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 ${
                    index === activeIndex ? "bg-emerald-50" : "bg-white"
                  }`}
                >
                  <span className="min-w-0 truncate text-[11px] font-medium text-zinc-900">
                    {product.name}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${stockBadgeClass(stock)}`}
                  >
                    {stock <= 0 ? "Out" : `${stock} left`}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}

      {!isOpen && selectedProduct && (
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zinc-500">
          <span>
            Current stock:{" "}
            <span
              className={`rounded border px-1 py-0.5 font-mono font-semibold ${stockBadgeClass(Number(selectedProduct.stock ?? 0))}`}
            >
              {Number(selectedProduct.stock ?? 0)}
            </span>
          </span>
          <span className="font-mono">
            Selling: {formatPeso(selectedProduct.price)}
          </span>
        </span>
      )}
    </div>
  );
};

export const AdminInventory = () => {
  const dispatch = useDispatch();
  const { products = [], loading: productsLoading } = useSelector(
    (state) => state.products,
  );

  const [activeTab, setActiveTab] = useState("ledger");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [failedLines, setFailedLines] = useState([]);

  const [ledger, setLedger] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalEntries: 0,
    totalUnits: 0,
    totalCost: 0,
  });
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    dispatch(getAdminProducts());
  }, [dispatch]);

  const productOptions = useMemo(
    () =>
      [...products]
        .filter((product) => !product.isArchived)
        .sort(
          (a, b) =>
            Number(a.stock ?? 0) - Number(b.stock ?? 0) ||
            (a.name ?? "").localeCompare(b.name ?? ""),
        ),
    [products],
  );

  const supplierOptions = useMemo(
    () =>
      [...suppliers]
        .filter((supplier) => !supplier.deletedAt && supplier.isActive !== false)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [suppliers],
  );

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params =
        selectedTypeFilter === "All" ? {} : { type: selectedTypeFilter };
      const result = await fetchInventoryTransactions(params);
      setLedger(result.transactions);
      setLedgerSummary(result.summary);
      setLedgerError("");
    } catch (error) {
      setLedgerError(
        error.response?.data?.message || "Could not load stock transactions",
      );
    } finally {
      setLedgerLoading(false);
    }
  }, [selectedTypeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLedger();
  }, [loadLedger]);

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    try {
      const list = await fetchSuppliers("all");
      setSuppliers(list);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load suppliers",
      );
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSuppliers();
  }, [loadSuppliers]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(bulkRestockSchema),
    mode: "onChange",
    defaultValues: {
      referenceNo: "",
      restocks: [emptyRestockRow()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "restocks",
  });

  const restockRows = useWatch({ control, name: "restocks" });

  const {
    register: registerSupplier,
    handleSubmit: handleSupplierSubmit,
    reset: resetSupplierForm,
    setError: setSupplierError,
    formState: {
      errors: supplierErrors,
      isSubmitting: supplierSubmitting,
    },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const handleOpenRestock = () => {
    reset({
      referenceNo: nextPurchaseOrderRef(),
      restocks: [emptyRestockRow(supplierOptions[0]?._id || "")],
    });
    setSubmitError("");
    setFailedLines([]);
    setIsRestockModalOpen(true);
  };

  const handleProductSelect = (index, product) => {
    if (!product) {
      setValue(`restocks.${index}.productId`, "");
      setValue(`restocks.${index}.productName`, "");
      setValue(`restocks.${index}.productPrice`, 0);
      return;
    }

    setValue(`restocks.${index}.productId`, product._id, {
      shouldValidate: true,
    });
    setValue(`restocks.${index}.productName`, product.name);
    setValue(
      `restocks.${index}.productPrice`,
      Number(product.price || 0),
      { shouldValidate: true },
    );

    const recordedCost = Number(product.costPrice || 0);
    if (recordedCost > 0) {
      setValue(`restocks.${index}.unitCost`, recordedCost, {
        shouldValidate: true,
      });
    }
  };

  const onRestockSubmit = async (data) => {
    setSubmitError("");
    setFailedLines([]);

    const restocks = data.restocks.map((row) => ({
      productId: row.productId,
      supplierId: row.supplierId,
      quantity: Number(row.quantity),
      unitCost: Number(row.unitCost),
      note: row.note ? row.note.trim() : "",
    }));

    try {
      await axios.post(
        `${API}/admin/inventory/bulk-restock`,
        {
          referenceNo: data.referenceNo.trim(),
          restocks,
        },
        { withCredentials: true },
      );
    } catch (error) {
      const response = error.response?.data;
      if (response?.failedLines?.length) {
        setFailedLines(response.failedLines);
        setSubmitError(
          response.message || "Some restock lines could not be processed.",
        );
      } else {
        setSubmitError(
          response?.message || "Could not save the restock. Try again.",
        );
      }
      return;
    }

    setIsRestockModalOpen(false);
    toast.success("Restock saved");
    dispatch(getAdminProducts());
    await Promise.all([loadLedger(), loadSuppliers()]);
  };

  const openAddSupplier = () => {
    setEditingSupplier(null);
    resetSupplierForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    });
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    resetSupplierForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsSupplierModalOpen(true);
  };

  const onSupplierSubmit = async (data) => {
    try {
      if (editingSupplier) {
        await axios.put(
          `${API}/admin/supplier/${editingSupplier._id}`,
          data,
          { withCredentials: true },
        );
      } else {
        await axios.post(`${API}/admin/supplier/new`, data, {
          withCredentials: true,
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Could not save supplier";
      if (error.response?.status === 409) {
        setSupplierError("name", { type: "server", message });
      } else {
        toast.error(message);
      }
      return;
    }

    toast.success(editingSupplier ? "Supplier updated" : "Supplier added");
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    await loadSuppliers();
  };

  const handleDeactivateSupplier = async (supplier) => {
    const result = await Swal.fire({
      title: "Deactivate supplier?",
      text: `${supplier.name} will no longer appear in restock options.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Deactivate",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#71717a",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API}/admin/supplier/${supplier._id}`, {
        withCredentials: true,
      });
      toast.success("Supplier deactivated");
      await loadSuppliers();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Cannot deactivate supplier",
        text:
          error.response?.data?.message ||
          "Restock history must be preserved for auditing.",
      });
    }
  };

  const handleRestoreSupplier = async (supplier) => {
    try {
      await axios.put(
        `${API}/admin/supplier/${supplier._id}/restore`,
        {},
        { withCredentials: true },
      );
      toast.success("Supplier restored");
      await loadSuppliers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not restore supplier",
      );
    }
  };

  const transactionTypes = [
    "All",
    "restock",
    "sale",
    "reserve",
    "release",
    "cancellation",
    "adjustment",
  ];

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      if (supplierStatusFilter === "active" && supplier.deletedAt) return false;
      if (supplierStatusFilter === "deactivated" && !supplier.deletedAt) {
        return false;
      }

      if (!query) return true;

      return [supplier.name, supplier.contactPerson, supplier.email, supplier.phone, supplier.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [suppliers, supplierSearch, supplierStatusFilter]);

  const ledgerColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Reference",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "date",
        headerName: "Date and time",
        width: 145,
        renderCell: (params) => (
          <span className="font-mono text-zinc-500 text-[11px]">
            {params.row.date}
          </span>
        ),
      },
      {
        field: "type",
        headerName: "Type",
        width: 125,
        renderCell: (params) => {
          const type = params.row.type;
          return (
            <div className="admin-table-cell-center">
              <span
                className={`admin-table-badge text-[11px] font-medium border ${
                  OPERATION_STYLES[type] ||
                  "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}
              >
                {OPERATION_LABELS[type] || type}
              </span>
            </div>
          );
        },
      },
      {
        field: "product",
        headerName: "Product",
        flex: 1.4,
        minWidth: 180,
        renderCell: (params) => (
          <span className="font-medium text-zinc-900 truncate text-xs">
            {params.row.product}
          </span>
        ),
      },
      {
        field: "supplierName",
        headerName: "Supplier",
        flex: 1,
        minWidth: 150,
        renderCell: (params) =>
          params.row.supplierName ? (
            <span className="text-zinc-700 truncate text-xs">
              {params.row.supplierName}
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          ),
      },
      {
        field: "quantityChange",
        headerName: "Quantity",
        width: 100,
        type: "number",
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          const delta = params.row.quantityChange;
          return (
            <span
              className={`font-mono font-bold text-xs ${
                delta > 0 ? "text-emerald-700" : "text-zinc-800"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          );
        },
      },
      {
        field: "unitCost",
        headerName: "Unit cost",
        width: 110,
        renderCell: (params) =>
          Number(params.row.unitCost) > 0 ? (
            <span className="font-mono text-[11px] text-zinc-700">
              {formatPeso(params.row.unitCost)}
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          ),
      },
      {
        field: "totalCost",
        headerName: "Total cost",
        width: 120,
        renderCell: (params) =>
          Number(params.row.totalCost) > 0 ? (
            <span className="font-mono text-[11px] font-semibold text-zinc-900">
              {formatPeso(params.row.totalCost)}
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          ),
      },
      {
        field: "orderRef",
        headerName: "Order or PO",
        width: 135,
        renderCell: (params) => (
          <span className="font-mono text-[11px] text-zinc-600 truncate">
            {params.row.orderRef}
          </span>
        ),
      },
      {
        field: "note",
        headerName: "Notes",
        flex: 1.4,
        minWidth: 170,
        renderCell: (params) => {
          const tx = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="text-zinc-600 text-[11px] truncate">
                {tx.note || "—"}
              </span>
              <span className="text-[11px] text-zinc-500 truncate mt-1">
                By: {tx.performedBy}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const supplierColumns = [
      {
        field: "name",
        headerName: "Supplier",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <span className="font-bold text-zinc-900 truncate">
            {params.row.name}
          </span>
        ),
      },
      {
        field: "contactPerson",
        headerName: "Contact",
        flex: 1,
        minWidth: 170,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="font-semibold text-zinc-900 text-xs truncate">
              {params.row.contactPerson || "No contact person"}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono truncate mt-1">
              {params.row.email || "No email"}
            </span>
          </div>
        ),
      },
      {
        field: "phone",
        headerName: "Phone and address",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="font-mono text-zinc-700 text-xs leading-tight truncate">
              {params.row.phone || "No phone"}
            </span>
            <span className="text-[11px] text-zinc-500 truncate mt-1">
              {params.row.address || "No address"}
            </span>
          </div>
        ),
      },
      {
        field: "restockCount",
        headerName: "Restocks",
        width: 110,
        renderCell: (params) => {
          const count = Number(params.row.restockCount || 0);
          return (
            <span
              className={`admin-table-badge gap-1 text-[11px] font-medium border ${
                count > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}
            >
              {count} {count === 1 ? "restock" : "restocks"}
            </span>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) =>
          params.row.deletedAt ? (
            <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
              <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Deactivated
            </span>
          ) : (
            <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
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
        renderCell: (params) => {
          const supplier = params.row;
          return (
            <div className="inline-flex items-center justify-end gap-1 w-full">
              <button
                type="button"
                onClick={() => openEditSupplier(supplier)}
                className="!h-7 px-2 rounded border border-zinc-200 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                Edit
              </button>
              {supplier.deletedAt ? (
                <button
                  type="button"
                  onClick={() => handleRestoreSupplier(supplier)}
                  className="!h-7 px-2 rounded border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeactivateSupplier(supplier)}
                  className="!h-7 px-2 rounded border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          );
        },
      },
  ];

  return (
    <div className="space-y-6">
      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Inventory and suppliers
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Stock movements, count adjustments, and supplier restock orders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenRestock}
          disabled={supplierOptions.length === 0}
          title={supplierOptions.length === 0 ? "Add a supplier first" : undefined}
          className="inline-flex items-center gap-2 h-9 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span>Record restock</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`px-3 py-2 rounded font-semibold transition-colors cursor-pointer border ${
              activeTab === "ledger"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Stock ledger ({ledger.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-2 rounded font-semibold transition-colors cursor-pointer border ${
              activeTab === "suppliers"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {activeTab === "ledger" && (
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="inventory-type-filter"
              className="text-[11px] text-zinc-500"
            >
              Type
            </label>
            <select
              id="inventory-type-filter"
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="!h-8 px-2 border border-zinc-300 rounded text-xs bg-white transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All types" : OPERATION_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "suppliers" && (
          <button
            type="button"
            onClick={openAddSupplier}
            className="inline-flex items-center gap-2 h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add supplier
          </button>
        )}
      </div>

      {/* Stock ledger */}
      {activeTab === "ledger" && (
        <div className="border border-zinc-200 rounded bg-white overflow-hidden">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between gap-3">
            <span className="font-semibold text-zinc-800">
              Stock transaction history
            </span>
            <span
              className={`text-[11px] ${ledgerError ? "text-rose-600" : "text-zinc-500"}`}
            >
              {ledgerError || `Showing ${ledger.length} transactions`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 border-b border-zinc-200">
            <div className="px-4 py-3">
              <p className="font-mono uppercase text-[10px] tracking-wider text-zinc-500">
                Entries
              </p>
              <p className="mt-1 text-lg font-bold text-zinc-900">
                {ledgerSummary.totalEntries.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono uppercase text-[10px] tracking-wider text-zinc-500">
                Net units moved
              </p>
              <p className="mt-1 text-lg font-bold text-zinc-900">
                {Number(ledgerSummary.totalUnits).toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono uppercase text-[10px] tracking-wider text-zinc-500">
                Movement value
              </p>
              <p className="mt-1 text-lg font-bold text-zinc-900">
                {formatPeso(ledgerSummary.totalCost)}
              </p>
            </div>
          </div>

          <DataGrid
            rows={ledger}
            columns={ledgerColumns}
            loading={ledgerLoading}
            getRowId={(row) => row.id}
            rowHeight={60}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            autoHeight
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Suppliers */}
      {activeTab === "suppliers" && (
        <div className="border border-zinc-200 bg-white rounded overflow-hidden">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "deactivated", label: "Deactivated" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSupplierStatusFilter(tab.key)}
                  className={`h-8 px-3 rounded border font-semibold transition-colors cursor-pointer ${
                    supplierStatusFilter === tab.key
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : "bg-white text-zinc-600 border-zinc-300 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Search suppliers"
                className="w-full !h-8 pl-8 pr-2 border border-zinc-300 rounded text-xs transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
              />
            </div>
          </div>

          <DataGrid
            rows={filteredSuppliers}
            columns={supplierColumns}
            loading={suppliersLoading}
            getRowId={(row) => row._id}
            getRowHeight={() => "auto"}
            getEstimatedRowHeight={() => 72}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            autoHeight
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Bulk restock modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-heading"
            className="bg-white border border-zinc-300 rounded w-full max-w-5xl max-h-[92vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <div>
                <h2
                  id="restock-heading"
                  className="text-sm font-bold text-zinc-900"
                >
                  Record bulk restock
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Add every purchase line received from the supplier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
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
              onSubmit={handleSubmit(onRestockSubmit)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              {supplierOptions.length === 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    No active suppliers yet. Add a supplier before recording a
                    restock.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRestockModalOpen(false);
                      setActiveTab("suppliers");
                      openAddSupplier();
                    }}
                    className="h-7 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer transition-colors"
                  >
                    Add supplier
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="bulk-restock-reference"
                  className="font-semibold text-zinc-900"
                >
                  Purchase order reference *
                </label>
                <input
                  id="bulk-restock-reference"
                  type="text"
                  {...register("referenceNo")}
                  className={`w-full !h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.referenceNo
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {errors.referenceNo && (
                  <span className="text-[11px] text-rose-600 block">
                    {errors.referenceNo.message}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const row = restockRows?.[index] || {};
                  const rowErrors = errors.restocks?.[index] || {};
                  const sellingPrice = Number(row.productPrice || 0);
                  const margin =
                    sellingPrice > 0 && Number(row.unitCost) > 0
                      ? ((sellingPrice - Number(row.unitCost)) / sellingPrice) *
                        100
                      : null;

                  return (
                    <div
                      key={field.id}
                      className="rounded border border-zinc-200 bg-zinc-50/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          Line {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="!h-7 px-2 rounded border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4 space-y-1">
                          <label
                            htmlFor={`bulk-product-${index}`}
                            className="font-semibold text-zinc-900"
                          >
                            Product *
                          </label>
                          <Controller
                            name={`restocks.${index}.productId`}
                            control={control}
                            render={({ field: productField }) => (
                              <ProductSelect
                                id={`bulk-product-${index}`}
                                value={productField.value}
                                options={productOptions}
                                loading={productsLoading}
                                invalid={Boolean(rowErrors.productId)}
                                onChange={productField.onChange}
                                onBlur={productField.onBlur}
                                onSelect={(product) =>
                                  handleProductSelect(index, product)
                                }
                                valueKey="_id"
                              />
                            )}
                          />
                          <input
                            type="hidden"
                            {...register(`restocks.${index}.productName`)}
                          />
                          <input
                            type="hidden"
                            {...register(`restocks.${index}.productPrice`, {
                              valueAsNumber: true,
                            })}
                          />
                          {rowErrors.productId && (
                            <span className="text-[11px] text-rose-600 block">
                              {rowErrors.productId.message}
                            </span>
                          )}
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label
                            htmlFor={`bulk-supplier-${index}`}
                            className="font-semibold text-zinc-900"
                          >
                            Supplier *
                          </label>
                          <select
                            id={`bulk-supplier-${index}`}
                            {...register(`restocks.${index}.supplierId`)}
                            className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                              rowErrors.supplierId
                                ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                                : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                            }`}
                          >
                            <option value="">Select supplier</option>
                            {supplierOptions.map((supplier) => (
                              <option key={supplier._id} value={supplier._id}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                          {rowErrors.supplierId && (
                            <span className="text-[11px] text-rose-600 block">
                              {rowErrors.supplierId.message}
                            </span>
                          )}
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label
                            htmlFor={`bulk-quantity-${index}`}
                            className="font-semibold text-zinc-900"
                          >
                            Quantity *
                          </label>
                          <input
                            id={`bulk-quantity-${index}`}
                            type="number"
                            min={1}
                            step={1}
                            {...register(`restocks.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            className={`w-full !h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                              rowErrors.quantity
                                ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                                : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                            }`}
                          />
                          {rowErrors.quantity && (
                            <span className="text-[11px] text-rose-600 block">
                              {rowErrors.quantity.message}
                            </span>
                          )}
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label
                            htmlFor={`bulk-unit-cost-${index}`}
                            className="font-semibold text-zinc-900"
                          >
                            Unit cost (₱) *
                          </label>
                          <input
                            id={`bulk-unit-cost-${index}`}
                            type="number"
                            min={0.01}
                            step="0.01"
                            {...register(`restocks.${index}.unitCost`, {
                              valueAsNumber: true,
                            })}
                            className={`w-full !h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                              rowErrors.unitCost
                                ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                                : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                            }`}
                          />
                          {rowErrors.unitCost && (
                            <span className="text-[11px] text-rose-600 block">
                              {rowErrors.unitCost.message}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                          {sellingPrice > 0 ? (
                            <span className="font-mono">
                              Selling: {formatPeso(sellingPrice)}
                            </span>
                          ) : (
                            <span>Select a product to see its selling price.</span>
                          )}
                          {margin !== null && (
                            <span
                              className={`font-mono font-semibold ${
                                margin > 0 ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              Margin: {margin.toFixed(1)}%
                            </span>
                          )}
                        </div>

                        <div className="flex-1 sm:max-w-md">
                          <input
                            type="text"
                            placeholder="Line note (optional)"
                            {...register(`restocks.${index}.note`)}
                            className="w-full !h-7 px-2 border border-zinc-300 rounded text-[11px] transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => append(emptyRestockRow(supplierOptions[0]?._id || ""))}
                className="h-8 px-3 rounded border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                + Add row
              </button>

              {submitError && (
                <div className="rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 space-y-1">
                  <p>{submitError}</p>
                  {failedLines.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {failedLines.map((line) => (
                        <li key={`${line.lineIndex}-${line.reason}`}>
                          Line {line.lineIndex + 1}: {line.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || supplierOptions.length === 0}
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / edit supplier modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-heading"
            className="bg-white border border-zinc-300 rounded w-full max-w-lg overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2
                id="supplier-modal-heading"
                className="text-sm font-bold text-zinc-900"
              >
                {editingSupplier ? "Edit supplier" : "Add supplier"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                }}
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
              onSubmit={handleSupplierSubmit(onSupplierSubmit)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label
                  htmlFor="supplier-name"
                  className="font-semibold text-zinc-900"
                >
                  Supplier name *
                </label>
                <input
                  id="supplier-name"
                  type="text"
                  {...registerSupplier("name")}
                  className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    supplierErrors.name
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {supplierErrors.name && (
                  <span className="text-[11px] text-rose-600 block">
                    {supplierErrors.name.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="supplier-contact"
                    className="font-semibold text-zinc-900"
                  >
                    Contact person
                  </label>
                  <input
                    id="supplier-contact"
                    type="text"
                    {...registerSupplier("contactPerson")}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="supplier-email"
                    className="font-semibold text-zinc-900"
                  >
                    Email
                  </label>
                  <input
                    id="supplier-email"
                    type="email"
                    {...registerSupplier("email")}
                    className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                      supplierErrors.email
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {supplierErrors.email && (
                    <span className="text-[11px] text-rose-600 block">
                      {supplierErrors.email.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="supplier-phone"
                    className="font-semibold text-zinc-900"
                  >
                    Phone
                  </label>
                  <input
                    id="supplier-phone"
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    {...registerSupplier("phone")}
                    className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                      supplierErrors.phone
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {supplierErrors.phone && (
                    <span className="text-[11px] text-rose-600 block">
                      {supplierErrors.phone.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="supplier-address"
                    className="font-semibold text-zinc-900"
                  >
                    Address
                  </label>
                  <input
                    id="supplier-address"
                    type="text"
                    {...registerSupplier("address")}
                    className="w-full !h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupplierModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supplierSubmitting}
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {supplierSubmitting
                    ? "Saving..."
                    : editingSupplier
                      ? "Save changes"
                      : "Add supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
