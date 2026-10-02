import { useState } from "react";

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

  const [suppliers, setSuppliers] = useState([
    {
      id: "SUP-01",
      name: "Apex Moto Distributors Inc.",
      contact: {
        person: "Eduardo Mendoza",
        email: "e.mendoza@apexmotoph.com",
        phone: "(02) 8872-3000 · 0917 555 1010",
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

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Inventory Ledger & Supplier Restocking
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Append-only stock transaction log, supplier directory, and purchase order records (<code className="font-mono text-zinc-600">inventory_transactions</code>, <code className="font-mono text-zinc-600">suppliers</code>, <code className="font-mono text-zinc-600">restocks</code> schema).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRestockModalOpen(true)}
          className="inline-flex items-center gap-2 !h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record Supplier Restock</span>
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
            Append-Only Stock Ledger ({ledger.length} entries)
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
            Suppliers & Product Lines ({suppliers.length})
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
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-2xs space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
            <span className="font-semibold text-zinc-800">
              Immutable Ledger Stream (Strictly append-only audit trail; stock is derived)
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              Showing {filteredLedger.length} transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-mono uppercase text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Txn ID</th>
                  <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-2.5 px-4 font-semibold">Operation Type</th>
                  <th className="py-2.5 px-4 font-semibold">Item & Description</th>
                  <th className="py-2.5 px-4 font-semibold">Qty Delta</th>
                  <th className="py-2.5 px-4 font-semibold">Order / PO Ref</th>
                  <th className="py-2.5 px-4 font-semibold">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLedger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">{tx.id}</td>
                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">{tx.date}</td>
                    
                    <td className="py-3 px-4">
                      {tx.type === "restock" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          restock (+)
                        </span>
                      )}
                      {tx.type === "sale" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          sale (-)
                        </span>
                      )}
                      {tx.type === "reserve" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          reserve (hold)
                        </span>
                      )}
                      {tx.type === "release" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                          release (handover)
                        </span>
                      )}
                      {tx.type === "cancellation" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                          cancellation (+)
                        </span>
                      )}
                      {tx.type === "adjustment" && (
                        <span className="inline-block uppercase text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          adjustment
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-zinc-900 max-w-xs">
                      {tx.product}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-xs">
                      <span className={tx.quantityChange > 0 ? "text-emerald-700" : "text-zinc-800"}>
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                      {tx.orderRef}
                    </td>

                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      <p>{tx.note}</p>
                      <span className="text-[10px] font-mono text-zinc-400">By: {tx.performedBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Suppliers Directory & Product Lines (Flat Directory Table, NO CARDS) */}
      {activeTab === "suppliers" && (
        <div className="border border-zinc-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">Supplier ID</th>
                <th className="py-2.5 px-4 font-semibold">Company Name</th>
                <th className="py-2.5 px-4 font-semibold">Contact Person</th>
                <th className="py-2.5 px-4 font-semibold">Hotline & Location</th>
                <th className="py-2.5 px-4 font-semibold">Authorized Product Lines</th>
                <th className="py-2.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900">{s.id}</td>
                  
                  <td className="py-3 px-4 font-bold text-zinc-900">
                    {s.name}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-zinc-900">{s.contact.person}</p>
                    <span className="text-[11px] text-zinc-500 font-mono">{s.contact.email}</span>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <p className="font-mono text-zinc-700">{s.contact.phone}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{s.contact.address}</p>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {s.productLines.map((line, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium"
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      Active Supplier
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Restock Purchase Order Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
            
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-sm font-bold text-zinc-900">
                Record Supplier Restock
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
                <label className="font-semibold text-zinc-900">Product / Item *</label>
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
                <label className="font-semibold text-zinc-900">Supplier PO / Invoice Reference *</label>
                <input
                  type="text"
                  required
                  value={restockForm.referenceNo}
                  onChange={(e) => setRestockForm({ ...restockForm, referenceNo: e.target.value })}
                  className="w-full !h-8 px-2.5 border border-zinc-300 rounded focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">Internal Audit Note</label>
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
                  Post to Ledger Stream
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
