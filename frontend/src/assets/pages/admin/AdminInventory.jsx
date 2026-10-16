import { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

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
      note: "Customer vehicle turnover & key release",
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

  const [restockForm, setRestockForm] = useState({
    supplierId: "SUP-01",
    product: "Motul 7100 4T 10W-40 Synthetic Oil (1L)",
    quantity: "24",
    unitCost: "580",
    referenceNo: "PO-SUP-2026-045",
    notes: "Emergency replenishment for low-stock threshold",
  });

  const handleCreateRestock = (e) => {
    e.preventDefault();
    const qty = Number(restockForm.quantity);
    const newTxn = {
      id: `TXN-${Math.floor(8900 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      product: restockForm.product,
      type: "restock",
      quantityChange: qty,
      orderRef: restockForm.referenceNo,
      performedBy: "Kelly Laurence (Admin)",
      note: restockForm.notes,
    };

    setLedger([newTxn, ...ledger]);
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
        headerName: "Txn ID",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "date",
        headerName: "Date & Time",
        width: 150,
        renderCell: (params) => (
          <span className="font-mono text-zinc-500 text-[11px]">{params.row.date}</span>
        ),
      },
      {
        field: "type",
        headerName: "Operation Type",
        width: 140,
        renderCell: (params) => {
          const type = params.row.type;
          return (
            <div className="admin-table-cell-center">
              {type === "restock" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  restock (+)
                </span>
              )}
              {type === "sale" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  sale (-)
                </span>
              )}
              {type === "reserve" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  reserve (hold)
                </span>
              )}
              {type === "release" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200">
                  release (handover)
                </span>
              )}
              {type === "cancellation" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                  cancellation (+)
                </span>
              )}
              {type === "adjustment" && (
                <span className="admin-table-badge uppercase text-[10px] font-mono font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                  adjustment
                </span>
              )}
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
            <span className={`font-mono font-bold text-xs ${delta > 0 ? "text-emerald-700" : "text-zinc-800"}`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          );
        },
      },
      {
        field: "orderRef",
        headerName: "Reference",
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
              <span className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">By: {tx.performedBy}</span>
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
        headerName: "Supplier ID",
        width: 110,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">{params.row.id}</span>
        ),
      },
      {
        field: "name",
        headerName: "Company Name",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <span className="font-bold text-zinc-900 truncate">{params.row.name}</span>
        ),
      },
      {
        field: "contactPerson",
        headerName: "Contact Person",
        flex: 1,
        minWidth: 160,
        valueGetter: (value, row) => row.contact?.person || "None",
        renderCell: (params) => {
          const c = params.row.contact;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-semibold text-zinc-900 text-xs truncate">{c.person}</span>
              <span className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{c.email}</span>
            </div>
          );
        },
      },
      {
        field: "contactLocation",
        headerName: "Contact and address",
        flex: 1.2,
        minWidth: 180,
        valueGetter: (value, row) => `${row.contact?.phone || ""} ${row.contact?.address || ""}`,
        renderCell: (params) => {
          const c = params.row.contact;
          return (
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <span className="font-mono text-zinc-700 text-xs leading-tight truncate">{c.phone}</span>
              <span className="text-[11px] text-zinc-400 truncate mt-0.5">{c.address}</span>
            </div>
          );
        },
      },
      {
        field: "productLines",
        headerName: "Product lines",
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => (
          <div className="flex flex-wrap gap-1 py-1">
            {(params.row.productLines || []).map((line, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium whitespace-nowrap"
              >
                {line}
              </span>
            ))}
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        headerAlign: "right",
        align: "right",
        renderCell: () => (
          <span className="admin-table-badge gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
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
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Inventory and Suppliers
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Track stock movements, audit adjustments, and manage supplier restock orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRestockModalOpen(true)}
          className="inline-flex items-center gap-2 h-9! px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record restock</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border ${
              activeTab === "ledger"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Stock ledger ({ledger.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border ${
              activeTab === "suppliers"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {activeTab === "ledger" && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-zinc-400 font-mono">Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="!h-7 px-2 border border-zinc-300 rounded text-xs bg-white font-mono uppercase focus:border-emerald-600 focus:outline-none"
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Append-Only Stock Ledger */}
      {activeTab === "ledger" && (
        <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-xs space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
            <span className="font-semibold text-zinc-800">
              Stock transaction history
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
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

      {/* TAB 2: Suppliers Directory & Product Lines */}
      {activeTab === "suppliers" && (
        <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <DataGrid
            rows={suppliers}
            columns={supplierColumns}
            getRowId={(row) => row.id}
            rowHeight={60}
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

      {/* Record Restock Purchase Order Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
            
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-sm font-bold text-zinc-900">
                Record restock
              </h2>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRestock} className="p-4 space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Select Supplier *</label>
                <select
                  value={restockForm.supplierId}
                  onChange={(e) => setRestockForm({ ...restockForm, supplierId: e.target.value })}
                  className="w-full !h-8 px-2 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Product *</label>
                <input
                  type="text"
                  required
                  value={restockForm.product}
                  onChange={(e) => setRestockForm({ ...restockForm, product: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Quantity Added *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">Unit Cost (₱) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={restockForm.unitCost}
                    onChange={(e) => setRestockForm({ ...restockForm, unitCost: e.target.value })}
                    className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Purchase order or invoice reference *</label>
                <input
                  type="text"
                  required
                  value={restockForm.referenceNo}
                  onChange={(e) => setRestockForm({ ...restockForm, referenceNo: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Note</label>
                <input
                  type="text"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-2xs"
                >
                  Save restock
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
