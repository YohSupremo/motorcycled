import { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

export const AdminSettings = () => {
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Settings matching schema 4.15
  const [settings, setSettings] = useState({
    taxRate: 12, // 12% statutory VAT
    defaultLowStockThreshold: 5,
    latePenalty: {
      enabled: true,
      type: "fixed", // 'fixed' | 'percentage'
      value: 250,
      gracePeriodDays: 5,
    },
    defaultAfterMissedPayments: 3,
    cancellationPolicy: {
      downpaymentRefundable: false, // Dealership policy
    },
  });

  // Installment plans matching schema 4.7
  const [plans, setPlans] = useState([
    {
      id: "PLAN-3M",
      name: "3 Months Quick Term",
      termMonths: 3,
      interestRate: 3.5,
      minDownpaymentPercent: 20,
      processingFee: 1000,
      isArchived: false,
    },
    {
      id: "PLAN-6M",
      name: "6 Months Flexible",
      termMonths: 6,
      interestRate: 5.0,
      minDownpaymentPercent: 20,
      processingFee: 1200,
      isArchived: false,
    },
    {
      id: "PLAN-12M",
      name: "12 Months Standard",
      termMonths: 12,
      interestRate: 7.0,
      minDownpaymentPercent: 20,
      processingFee: 1500,
      isArchived: false,
    },
    {
      id: "PLAN-24M",
      name: "24 Months Extended",
      termMonths: 24,
      interestRate: 8.5,
      minDownpaymentPercent: 20,
      processingFee: 2000,
      isArchived: false,
    },
    {
      id: "PLAN-36M",
      name: "36 Months Tier 1 Big Bike",
      termMonths: 36,
      interestRate: 9.5,
      minDownpaymentPercent: 25,
      processingFee: 2500,
      isArchived: false,
    },
  ]);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    termMonths: 12,
    interestRate: 7.0,
    minDownpaymentPercent: 20,
    processingFee: 1500,
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleTogglePlanArchive = (id) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived } : p)),
    );
  };

  const handleAddPlan = (e) => {
    e.preventDefault();
    const plan = {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
      name: newPlan.name,
      termMonths: Number(newPlan.termMonths),
      interestRate: Number(newPlan.interestRate),
      minDownpaymentPercent: Number(newPlan.minDownpaymentPercent),
      processingFee: Number(newPlan.processingFee),
      isArchived: false,
    };
    setPlans([...plans, plan]);
    setIsPlanModalOpen(false);
    setNewPlan({
      name: "",
      termMonths: 12,
      interestRate: 7.0,
      minDownpaymentPercent: 20,
      processingFee: 1500,
    });
  };

  const planColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Plan Name",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => {
          const plan = params.row;
          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${
                  plan.isArchived ? "text-zinc-500 line-through" : "text-zinc-900"
                }`}
              >
                {plan.name}
              </span>
              {plan.isArchived && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-bold">
                  Archived
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "termMonths",
        headerName: "Tenure",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700">
            {params.row.termMonths} Months
          </span>
        ),
      },
      {
        field: "interestRate",
        headerName: "Interest Rate",
        width: 130,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">
            {params.row.interestRate}%
          </span>
        ),
      },
      {
        field: "minDownpaymentPercent",
        headerName: "Min Downpayment",
        width: 140,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700">
            {params.row.minDownpaymentPercent}%
          </span>
        ),
      },
      {
        field: "processingFee",
        headerName: "Doc Fee",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700">
            ₱{params.row.processingFee?.toLocaleString()}
          </span>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const plan = params.row;
          return (
            <div className="inline-flex items-center justify-end gap-1.5 w-full">
              {plan.isArchived ? (
                <button
                  type="button"
                  onClick={() => handleTogglePlanArchive(plan.id)}
                  className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore Plan"
                  aria-label="Restore Plan"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTogglePlanArchive(plan.id)}
                  className="p-1.5 rounded-md hover:bg-amber-50 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer"
                  title="Archive Plan"
                  aria-label="Archive Plan"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Dealership & Financing Rule Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure system-wide taxation, stock thresholds, late penalty
            parameters, and active installment plans (
            <code className="font-mono text-zinc-600">settings</code> &{" "}
            <code className="font-mono text-zinc-600">installment_plans</code>{" "}
            schema).
          </p>
        </div>

        {saveFeedback && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded animate-fadeIn">
            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Settings Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: Tax, Logistics & Inventory Rules (Flat Section, NO CARDS) */}
        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
              Baseline Dealership Parameters
            </span>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Taxation, Inventory & Order Cancellation Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs bg-white p-4 border border-zinc-200">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">
                Statutory Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings({ ...settings, taxRate: Number(e.target.value) })
                }
                className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Copied to order snapshot at checkout
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">
                Default Low-Stock Alert &le;
              </label>
              <input
                type="number"
                min={1}
                value={settings.defaultLowStockThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultLowStockThreshold: Number(e.target.value),
                  })
                }
                className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Trigger threshold when product is absent
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">
                Downpayment Policy on Cancel
              </label>
              <select
                value={
                  settings.cancellationPolicy.downpaymentRefundable
                    ? "refundable"
                    : "forfeited"
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cancellationPolicy: {
                      downpaymentRefundable: e.target.value === "refundable",
                    },
                  })
                }
                className="w-full !h-8 px-2 border border-zinc-300 focus:border-emerald-600 focus:outline-none"
              >
                <option value="forfeited">
                  Forfeited (Standard Dealership)
                </option>
                <option value="refundable">
                  Refundable (Subject to Review)
                </option>
              </select>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Standard order cancellation policy outcome
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Late Penalties & Default Delinquency (Flat Section, NO CARDS) */}
        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
              Contractual Schedule Enforcement
            </span>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Late Payment Penalties & Delinquency Rules
            </h2>
          </div>

          <div className="space-y-4 text-xs bg-white p-4 border border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
              <input
                type="checkbox"
                checked={settings.latePenalty.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    latePenalty: {
                      ...settings.latePenalty,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="text-emerald-600 focus:ring-0"
              />
              <span>
                Enforce Automated Delinquency Penalties on Payment Schedules
              </span>
            </label>

            {settings.latePenalty.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium block">
                    Penalty Assessment Method
                  </label>
                  <select
                    value={settings.latePenalty.type}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        latePenalty: {
                          ...settings.latePenalty,
                          type: e.target.value,
                        },
                      })
                    }
                    className="w-full !h-8 px-2 border border-zinc-300 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="fixed">Fixed Penalty Fee (₱250)</option>
                    <option value="percentage">
                      Percentage Rate (e.g. 2%)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium block">
                    Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.latePenalty.gracePeriodDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        latePenalty: {
                          ...settings.latePenalty,
                          gracePeriodDays: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Calendar days before penalty attaches
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium block">
                    Default Delinquency Trigger
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings.defaultAfterMissedPayments}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAfterMissedPayments: Number(e.target.value),
                      })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Missed payments before legal default
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: In-House Installment Plans Directory (Flat Section, NO CARDS) */}
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-zinc-900 pb-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
                Active Financing Tenures
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                In-House Installment Plans Directory
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="!h-7 px-3 bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 cursor-pointer shadow-2xs"
            >
              + Add Plan
            </button>
          </div>

          <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
            <DataGrid
              rows={plans}
              columns={planColumns}
              getRowId={(row) => row.id}
              rowHeight={58}
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
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
                  fontSize: "0.75rem",
                },
              }}
            />
          </div>
        </section>

        {/* Save Bar */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="h-9! px-6 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Save Dealership Settings
          </button>
        </div>
      </form>

      {/* Add Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-sm w-full overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-sm font-bold text-zinc-900">
                Add Installment Plan
              </h2>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 text-xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  placeholder="e.g. 18 Months Promotional"
                  className="w-full !h-8 px-2.5 border border-zinc-300 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPlan.termMonths}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, termMonths: e.target.value })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    value={newPlan.interestRate}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, interestRate: e.target.value })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Min Downpayment % *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={newPlan.minDownpaymentPercent}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        minDownpaymentPercent: e.target.value,
                      })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Doc / Proc Fee (₱)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPlan.processingFee}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, processingFee: e.target.value })
                    }
                    className="w-full !h-8 px-2.5 border border-zinc-300 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="!h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-2xs"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
