import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const restockSchema = yup.object({
  supplierId: yup.string().required("Supplier is required"),
  product: yup.string().trim().required("Product name is required"),
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

const nextTransactionId = () => `TXN-${Math.floor(8900 + Math.random() * 900)}`;

const nextPurchaseOrderRef = () => `PO-SUP-2026-${Math.floor(100 + Math.random() * 900)}`;

const OPERATION_STYLES = {
  restock: "bg-emerald-50 text-emerald-800 border-emerald-200",
  sale: "bg-zinc-100 text-zinc-700 border-zinc-200",
  reserve: "bg-amber-50 text-amber-800 border-amber-200",
  release: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cancellation: "bg-zinc-100 text-zinc-700 border-zinc-200",
  adjustment: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export const AdminInventory = () => {
  const [activeTab, setActiveTab] = useState("ledger"); // 'ledger' | 'suppliers'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  const [ledger, setLedger] = useState([
    {
      id: "TXN-8821",
      date: "2026-10-02 10:14",
      product: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
      type: "sale",
      quantityChange: -2,
      orderRef: "ORD-2026-0893",
      performedBy: "Online Order",
      note: "Checkout fulfilled via courier dispatch",
    },
    {
      id: "TXN-8820",
      date: "2026-10-01 14:35",
      product: "Yamaha NMAX 155 ABS (Matte Dark Bluish Gray)",
      type: "reserve",
      quantityChange: -1,
      orderRef: "ORD-2026-0891",
      performedBy: "System Automated Reserve",
      note: "Reserved upon installment credit approval",
    },
    {
      id: "TXN-8819",
      date: "2026-10-01 11:20",
      product: "Brembo 4-Piston Caliper + Sintered Pads",
      type: "restock",
      quantityChange: +15,
      orderRef: "PO-SUP-2026-042",
      performedBy: "Kelly Laurence (Admin)",
      note: "Received shipment from Apex Moto Distributors",
    },
    {
      id: "TXN-8818",
      date: "2026-09-30 16:40",
      product: "Honda Click 125i (Pearl Arctic White)",
      type: "release",
      quantityChange: -1,
      orderRef: "ORD-2026-0880",
      performedBy: "Showroom Technician",
      note: "Customer vehicle turnover and key release",
    },
    {
      id: "TXN-8817",
      date: "2026-09-29 13:10",
      product: "Yamaha Genuine VVA Camshaft Assembly",
      type: "adjustment",
      quantityChange: +2,
      orderRef: "ADJ-INV-0012",
      performedBy: "Kelly Laurence (Admin)",
      note: "Warehouse physical cycle count reconciliation",
    },
    {
      id: "TXN-8816",
      date: "2026-09-28 09:30",
      product: "Kawasaki Ninja 400 SE",
      type: "cancellation",
      quantityChange: +1,
      orderRef: "ORD-2026-0870",
      performedBy: "System Automated Return",
      note: "Unit returned to active inventory after order cancellation",
    },
  ]);

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(restockSchema),
    defaultValues: {
      supplierId: "SUP-01",
      product: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
      quantity: 24,
      unitCost: 580,
      referenceNo: "PO-SUP-2026-045",
      notes: "Emergency replenishment for low-stock threshold",
    },
  });

  const handleOpenRestock = () => {
    reset({
      supplierId: "SUP-01",
      product: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
      quantity: 24,
      unitCost: 580,
      referenceNo: nextPurchaseOrderRef(),
      notes: "Emergency replenishment for low-stock threshold",
    });
    setIsRestockModalOpen(true);
  };

  const onRestockSubmit = (data) => {
    const qty = Number(data.quantity);
    const newTxn = {
      id: nextTransactionId(),
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      product: data.product.trim(),
      type: "restock",
      quantityChange: qty,
      orderRef: data.referenceNo.trim(),
      performedBy: "Kelly Laurence (Admin)",
      note: data.notes ? data.notes.trim() : "",
    };

    setLedger((prev) => [newTxn, ...prev]);
    setIsRestockModalOpen(false);
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
            <span className="text-[11px] text-zinc-500">
              Showing {filteredLedger.length} transactions
            </span>
          </div>

          <DataGrid
            rows={filteredLedger}
            columns={ledgerColumns}
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
                <label htmlFor="restock-product" className="font-semibold text-zinc-900">
                  Product *
                </label>
                <input
                  id="restock-product"
                  type="text"
                  {...register("product")}
                  className={`w-full !h-8 px-2 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    errors.product
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
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
