import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";
import { getAdminProducts } from "../../../actions/productActions";

const API = import.meta.env.VITE_API;

const restockSchema = yup.object({
  supplierId: yup.string().required("Supplier is required"),
  product: yup.string().trim().required("Select a product"),
  quantity: yup
    .number()
    .typeError("Quantity must be a valid number")
    .required("Quantity is required")
    .min(1, "Quantity must be at least 1"),
  unitCost: yup
    .number()
    .typeError("Unit cost must be a valid number")
    .required("Unit cost is required")
    .min(1, "Unit cost must be at least ₱1"),
  referenceNo: yup
    .string()
    .trim()
    .required("Purchase order reference is required"),
  notes: yup.string().default(""),
});

const OPERATION_LABELS = {
  restock: "Restock",
  sale: "Sale",
  reserve: "Reserve",
  release: "Release",
  cancellation: "Cancellation",
  adjustment: "Adjustment",
};

const nextPurchaseOrderRef = () => `PO-SUP-2026-${Math.floor(100 + Math.random() * 900)}`;

const fetchInventoryTransactions = async () => {
  const { data } = await axios.get(`${API}/admin/inventory/transactions`, {
    withCredentials: true,
  });
  return data.transactions || [];
};

const OPERATION_STYLES = {
  restock: "bg-emerald-50 text-emerald-800 border-emerald-200",
  sale: "bg-zinc-100 text-zinc-700 border-zinc-200",
  reserve: "bg-amber-50 text-amber-800 border-amber-200",
  release: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cancellation: "bg-zinc-100 text-zinc-700 border-zinc-200",
  adjustment: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const stockBadgeClass = (stock) => {
  if (stock <= 0) return "bg-rose-50 text-rose-700 border-rose-200";
  if (stock <= 5) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
};

const ProductSelect = ({ id, value, options, loading, invalid, onChange, onBlur }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

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
  const selectedProduct = options.find((product) => product.name === value);

  const openOptions = () => {
    setIsOpen(true);
    setSearch("");
    setActiveIndex(0);
  };

  const selectProduct = (product) => {
    onChange(product.name);
    setSearch(product.name);
    setIsOpen(false);
    setActiveIndex(0);
  };

  const closeOptions = () => {
    setIsOpen(false);
    setSearch(value ?? "");
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openOptions();
      } else {
        setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
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
          value={isOpen ? search : (value ?? "")}
          placeholder="Search products"
          onFocus={() => {
            if (!isOpen) openOptions();
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
            if (value) onChange("");
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
            <li className="px-2.5 py-2 text-[11px] text-zinc-500">Loading products...</li>
          ) : filteredOptions.length === 0 ? (
            <li className="px-2.5 py-2 text-[11px] text-zinc-500">No products found.</li>
          ) : (
            filteredOptions.map((product, index) => {
              const stock = Number(product.stock ?? 0);
              return (
                <li
                  key={product._id}
                  id={`${id}-option-${product._id}`}
                  role="option"
                  aria-selected={value === product.name}
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
        <span className="mt-1 block text-[10px] text-zinc-500">
          Current stock:{" "}
          <span
            className={`rounded border px-1 py-0.5 font-mono font-semibold ${stockBadgeClass(Number(selectedProduct.stock ?? 0))}`}
          >
            {Number(selectedProduct.stock ?? 0)}
          </span>
        </span>
      )}
    </div>
  );
};

export const AdminInventory = () => {
  const dispatch = useDispatch();
  const { products = [], loading: productsLoading } = useSelector((state) => state.products);
  const [activeTab, setActiveTab] = useState("ledger"); // 'ledger' | 'suppliers'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

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

  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [suppliers] = useState([
    {
      id: "SUP-01",
      name: "Apex Moto Distributors Inc.",
      contact: {
        person: "Eduardo Mendoza",
        email: "e.mendoza@apexmotoph.com",
        phone: "(02) 8872-3000, 0917 555 1010",
        address: "Building B, FTI Complex, Taguig City",
      },
      productLines: ["Yamaha Motorcycles", "OEM Spare Parts", "Brembo Brakes"],
      isActive: true,
    },
    {
      id: "SUP-02",
      name: "Honda Logistics Philippines",
      contact: {
        person: "Theresa Tan",
        email: "orders@hondalogistics.ph",
        phone: "(049) 545-2000",
        address: "Laguna Technopark, Biñan, Laguna",
      },
      productLines: ["Honda Scooters & Underbones", "OEM Consumables"],
      isActive: true,
    },
    {
      id: "SUP-03",
      name: "EuroLube Distribution Corp.",
      contact: {
        person: "Gabriel Santos",
        email: "gabriel@eurolube.ph",
        phone: "0918 890 1234",
        address: "North Harbor Center, Tondo, Manila",
      },
      productLines: ["Motul Engine Oils", "Chemicals & Chain Sprays"],
      isActive: true,
    },
  ]);

  useEffect(() => {
    let ignore = false;

    fetchInventoryTransactions()
      .then((transactions) => {
        if (ignore) return;
        setLedgerError("");
        setLedger(transactions);
      })
      .catch((error) => {
        if (ignore) return;
        setLedgerError(
          error.response?.data?.message || "Could not load stock transactions",
        );
      })
      .finally(() => {
        if (!ignore) setLedgerLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(restockSchema),
    defaultValues: {
      supplierId: "SUP-01",
      product: "",
      quantity: 24,
      unitCost: 580,
      referenceNo: "PO-SUP-2026-045",
      notes: "Emergency replenishment for low-stock threshold",
    },
  });

  const handleOpenRestock = () => {
    reset({
      supplierId: "SUP-01",
      product: "",
      quantity: 24,
      unitCost: 580,
      referenceNo: nextPurchaseOrderRef(),
      notes: "Emergency replenishment for low-stock threshold",
    });
    setSubmitError("");
    setIsRestockModalOpen(true);
  };

  const onRestockSubmit = async (data) => {
    setSubmitError("");
    const product = productOptions.find((option) => option.name === data.product);
    const supplier = suppliers.find((option) => option.id === data.supplierId);

    if (!product?._id) {
      setSubmitError("Select a product from the list.");
      return;
    }

    try {
      await axios.post(
        `${API}/admin/inventory/restock`,
        {
          productId: product._id,
          quantity: Number(data.quantity),
          unitCost: Number(data.unitCost),
          referenceNo: data.referenceNo.trim(),
          supplierId: data.supplierId,
          supplierName: supplier?.name || "",
          notes: data.notes ? data.notes.trim() : "",
        },
        { withCredentials: true },
      );
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || "Could not save the restock. Try again.",
      );
      return;
    }

    setIsRestockModalOpen(false);
    dispatch(getAdminProducts());

    try {
      const transactions = await fetchInventoryTransactions();
      setLedger(transactions);
      setLedgerError("");
    } catch {
      setLedgerError("Restock saved, but the ledger could not refresh.");
    }
  };

  const transactionTypes = ["All", "restock", "sale", "reserve", "release", "cancellation", "adjustment"];

  const filteredLedger = ledger.filter((item) => {
    if (selectedTypeFilter !== "All" && item.type !== selectedTypeFilter) return false;
    return true;
  });

  const ledgerColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Reference",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "date",
        headerName: "Date and time",
        width: 150,
        renderCell: (params) => (
          <span className="font-mono text-zinc-500 text-[11px]">{params.row.date}</span>
        ),
      },
      {
        field: "type",
        headerName: "Type",
        width: 140,
        renderCell: (params) => {
          const type = params.row.type;
          return (
            <div className="admin-table-cell-center">
              <span
                className={`admin-table-badge text-[11px] font-medium border ${
                  OPERATION_STYLES[type] || "bg-zinc-100 text-zinc-700 border-zinc-200"
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
        flex: 1.5,
        minWidth: 200,
        renderCell: (params) => (
          <span className="font-medium text-zinc-900 truncate text-xs">{params.row.product}</span>
        ),
      },
      {
        field: "quantityChange",
        headerName: "Quantity change",
        width: 120,
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
        field: "orderRef",
        headerName: "Order or PO",
        width: 140,
        renderCell: (params) => (
          <span className="font-mono text-[11px] text-zinc-600 truncate">{params.row.orderRef}</span>
        ),
      },
      {
        field: "note",
        headerName: "Notes",
        flex: 1.5,
        minWidth: 180,
        renderCell: (params) => {
          const tx = params.row;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="text-zinc-600 text-[11px] truncate">{tx.note}</span>
              <span className="text-[11px] text-zinc-500 truncate mt-1">By: {tx.performedBy}</span>
            </div>
          );
        },
      },
    ],
    []
  );

  const supplierColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Reference",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "name",
        headerName: "Company",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <span className="font-bold text-zinc-900 truncate">{params.row.name}</span>
        ),
      },
      {
        field: "contactPerson",
        headerName: "Contact",
        flex: 1,
        minWidth: 160,
        valueGetter: (value, row) => row.contact?.person || "None",
        renderCell: (params) => {
          const c = params.row.contact;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">{c.person}</span>
              <span className="text-[11px] text-zinc-500 font-mono truncate mt-1">{c.email}</span>
            </div>
          );
        },
      },
      {
        field: "contactLocation",
        headerName: "Phone and address",
        flex: 1.2,
        minWidth: 180,
        valueGetter: (value, row) => `${row.contact?.phone || ""} ${row.contact?.address || ""}`,
        renderCell: (params) => {
          const c = params.row.contact;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-mono text-zinc-700 text-xs leading-tight truncate">{c.phone}</span>
              <span className="text-[11px] text-zinc-500 truncate mt-1">{c.address}</span>
            </div>
          );
        },
      },
      {
        field: "productLines",
        headerName: "Product lines",
        flex: 1.4,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => {
          const lines = params.row.productLines || [];
          if (lines.length === 0) {
            return <span className="text-[11px] text-zinc-500">No product lines</span>;
          }
          return (
            <div className="flex min-w-0 w-full flex-col items-start gap-1.5 py-2">
              {lines.map((line, idx) => (
                <span
                  key={`${params.row.id}-${idx}`}
                  title={line}
                  className="block max-w-full whitespace-normal break-words text-[11px] leading-tight px-2 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 font-medium"
                >
                  {line}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        headerAlign: "right",
        align: "right",
        renderCell: () => (
          <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="admin-table-badge__dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ),
      },
    ],
    []
  );

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
          <span>Record restock</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
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
            <label htmlFor="inventory-type-filter" className="text-[11px] text-zinc-500">
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
      </div>

      {/* Stock ledger */}
      {activeTab === "ledger" && (
        <div className="border border-zinc-200 rounded bg-white overflow-hidden">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between gap-3">
            <span className="font-semibold text-zinc-800">Stock transaction history</span>
            <span className={`text-[11px] ${ledgerError ? "text-rose-600" : "text-zinc-500"}`}>
              {ledgerError || `Showing ${filteredLedger.length} transactions`}
            </span>
          </div>

          <DataGrid
            rows={filteredLedger}
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
          <DataGrid
            rows={suppliers}
            columns={supplierColumns}
            getRowId={(row) => row.id}
            getRowHeight={() => "auto"}
            getEstimatedRowHeight={() => 90}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            autoHeight
            sx={adminDataGridSx}
          />
        </div>
      )}

      {/* Record restock modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-heading"
            className="bg-white border border-zinc-300 rounded max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2 id="restock-heading" className="text-sm font-bold text-zinc-900">
                Record restock
              </h2>
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

            <form onSubmit={handleSubmit(onRestockSubmit)} noValidate className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="restock-supplier" className="font-semibold text-zinc-900">
                  Supplier *
                </label>
                <select
                  id="restock-supplier"
                  {...register("supplierId")}
                  className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.supplierId
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <span className="text-[11px] text-rose-600 block">
                    {errors.supplierId.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="restock-product" className="font-semibold text-zinc-900">
                    Product *
                  </label>
                  <span className="text-[10px] text-zinc-500">Lowest stock first</span>
                </div>
                <Controller
                  name="product"
                  control={control}
                  render={({ field }) => (
                    <ProductSelect
                      id="restock-product"
                      value={field.value}
                      options={productOptions}
                      loading={productsLoading}
                      invalid={Boolean(errors.product)}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {errors.product && (
                  <span className="text-[11px] text-rose-600 block">{errors.product.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="restock-quantity" className="font-semibold text-zinc-900">
                    Quantity added *
                  </label>
                  <input
                    id="restock-quantity"
                    type="number"
                    min={1}
                    {...register("quantity")}
                    className={`w-full !h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      errors.quantity
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {errors.quantity && (
                    <span className="text-[11px] text-rose-600 block">
                      {errors.quantity.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="restock-unit-cost" className="font-semibold text-zinc-900">
                    Unit cost (₱) *
                  </label>
                  <input
                    id="restock-unit-cost"
                    type="number"
                    min={1}
                    {...register("unitCost")}
                    className={`w-full !h-8 px-2 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      errors.unitCost
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {errors.unitCost && (
                    <span className="text-[11px] text-rose-600 block">
                      {errors.unitCost.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="restock-reference" className="font-semibold text-zinc-900">
                  Purchase order reference *
                </label>
                <input
                  id="restock-reference"
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

              <div className="space-y-1">
                <label htmlFor="restock-notes" className="font-semibold text-zinc-900">
                  Note
                </label>
                <input
                  id="restock-notes"
                  type="text"
                  {...register("notes")}
                  className="w-full !h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
                />
              </div>

              {submitError && (
                <p className="rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
                  {submitError}
                </p>
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
                  disabled={isSubmitting}
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
