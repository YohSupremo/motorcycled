import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";

const planSchema = yup.object({
  name: yup.string().trim().required("Plan title is required"),
  termMonths: yup
    .number()
    .typeError("Tenure must be a number")
    .required("Tenure is required")
    .min(1, "Tenure must be at least 1 month"),
  interestRate: yup
    .number()
    .typeError("Interest rate must be a number")
    .required("Interest rate is required")
    .min(0, "Interest rate cannot be negative"),
  minDownpaymentPercent: yup
    .number()
    .typeError("Min downpayment must be a number")
    .required("Min downpayment is required")
    .min(10, "Minimum downpayment is 10%")
    .max(100, "Maximum downpayment is 100%"),
  processingFee: yup
    .number()
    .typeError("Fee must be a number")
    .min(0, "Fee cannot be negative")
    .default(0),
});

const settingsSchema = yup.object({
  taxRate: yup
    .number()
    .typeError("Tax rate must be a number")
    .required("Tax rate is required")
    .min(0, "Tax rate cannot be negative"),
  defaultLowStockThreshold: yup
    .number()
    .typeError("Threshold must be a number")
    .required("Threshold is required")
    .min(1, "Threshold must be at least 1"),
  downpaymentRefundable: yup.string().required(),
  latePenaltyEnabled: yup.boolean(),
  latePenaltyType: yup.string(),
  gracePeriodDays: yup
    .number()
    .typeError("Grace period must be a number")
    .min(0, "Cannot be negative"),
  defaultAfterMissedPayments: yup
    .number()
    .typeError("Missed payments must be a number")
    .min(1, "Must be at least 1"),
});

export const AdminSettings = () => {
  const [saveFeedback, setSaveFeedback] = useState(false);

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

  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    watch: watchSettings,
    formState: { errors: settingsErrors, isSubmitting: isSettingsSubmitting },
  } = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: {
      taxRate: 12,
      defaultLowStockThreshold: 5,
      downpaymentRefundable: "forfeited",
      latePenaltyEnabled: true,
      latePenaltyType: "fixed",
      gracePeriodDays: 5,
      defaultAfterMissedPayments: 3,
    },
  });

  const latePenaltyEnabled = watchSettings("latePenaltyEnabled");

  const {
    register: registerPlan,
    handleSubmit: handleSubmitPlan,
    reset: resetPlan,
    formState: { errors: planErrors, isSubmitting: isPlanSubmitting },
  } = useForm({
    resolver: yupResolver(planSchema),
    defaultValues: {
      name: "",
      termMonths: 12,
      interestRate: 7.0,
      minDownpaymentPercent: 20,
      processingFee: 1500,
    },
  });

  const handleSaveSettings = () => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleTogglePlanArchive = (id) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived } : p)),
    );
  };

  const handleOpenPlanModal = () => {
    resetPlan({
      name: "",
      termMonths: 12,
      interestRate: 7.0,
      minDownpaymentPercent: 20,
      processingFee: 1500,
    });
    setIsPlanModalOpen(true);
  };

  const handleAddPlan = (data) => {
    const plan = {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      termMonths: Number(data.termMonths),
      interestRate: Number(data.interestRate),
      minDownpaymentPercent: Number(data.minDownpaymentPercent),
      processingFee: Number(data.processingFee || 0),
      isArchived: false,
    };
    setPlans((prev) => [...prev, plan]);
    setIsPlanModalOpen(false);
    resetPlan();
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

      <form onSubmit={handleSubmitSettings(handleSaveSettings)} noValidate className="space-y-8">
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
                {...registerSettings("taxRate")}
                className={`w-full !h-8 px-2.5 border ${
                  settingsErrors.taxRate ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                } font-mono focus:outline-none`}
              />
              {settingsErrors.taxRate && (
                <span className="text-[11px] text-red-600 block">
                  {settingsErrors.taxRate.message}
                </span>
              )}
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
                {...registerSettings("defaultLowStockThreshold")}
                className={`w-full !h-8 px-2.5 border ${
                  settingsErrors.defaultLowStockThreshold ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                } font-mono focus:outline-none`}
              />
              {settingsErrors.defaultLowStockThreshold && (
                <span className="text-[11px] text-red-600 block">
                  {settingsErrors.defaultLowStockThreshold.message}
                </span>
              )}
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Trigger threshold when product is absent
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">
                Downpayment Policy on Cancel
              </label>
              <select
                {...registerSettings("downpaymentRefundable")}
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

        {/* Section 2: Late Penalties & Delinquency Rules */}
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
                {...registerSettings("latePenaltyEnabled")}
                className="text-emerald-600 focus:ring-0"
              />
              <span>
                Enforce Automated Delinquency Penalties on Payment Schedules
              </span>
            </label>

            {latePenaltyEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium block">
                    Penalty Assessment Method
                  </label>
                  <select
                    {...registerSettings("latePenaltyType")}
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
                    {...registerSettings("gracePeriodDays")}
                    className={`w-full !h-8 px-2.5 border ${
                      settingsErrors.gracePeriodDays ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {settingsErrors.gracePeriodDays && (
                    <span className="text-[11px] text-red-600 block">
                      {settingsErrors.gracePeriodDays.message}
                    </span>
                  )}
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
                    {...registerSettings("defaultAfterMissedPayments")}
                    className={`w-full !h-8 px-2.5 border ${
                      settingsErrors.defaultAfterMissedPayments ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {settingsErrors.defaultAfterMissedPayments && (
                    <span className="text-[11px] text-red-600 block">
                      {settingsErrors.defaultAfterMissedPayments.message}
                    </span>
                  )}
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
              onClick={handleOpenPlanModal}
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
            disabled={isSettingsSubmitting}
            className="h-9! px-6 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSettingsSubmitting ? "Saving..." : "Save Dealership Settings"}
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

            <form onSubmit={handleSubmitPlan(handleAddPlan)} noValidate className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-900">
                  Plan Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18 Months Promotional"
                  {...registerPlan("name")}
                  className={`w-full !h-8 px-2.5 border ${
                    planErrors.name ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                  } focus:outline-none`}
                />
                {planErrors.name && (
                  <span className="text-[11px] text-red-600 block">
                    {planErrors.name.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...registerPlan("termMonths")}
                    className={`w-full !h-8 px-2.5 border ${
                      planErrors.termMonths ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {planErrors.termMonths && (
                    <span className="text-[11px] text-red-600 block">
                      {planErrors.termMonths.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    {...registerPlan("interestRate")}
                    className={`w-full !h-8 px-2.5 border ${
                      planErrors.interestRate ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {planErrors.interestRate && (
                    <span className="text-[11px] text-red-600 block">
                      {planErrors.interestRate.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Min Downpayment % *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    {...registerPlan("minDownpaymentPercent")}
                    className={`w-full !h-8 px-2.5 border ${
                      planErrors.minDownpaymentPercent ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {planErrors.minDownpaymentPercent && (
                    <span className="text-[11px] text-red-600 block">
                      {planErrors.minDownpaymentPercent.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-900">
                    Doc / Proc Fee (₱)
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...registerPlan("processingFee")}
                    className={`w-full !h-8 px-2.5 border ${
                      planErrors.processingFee ? "border-red-500 focus:border-red-500" : "border-zinc-300 focus:border-emerald-600"
                    } font-mono focus:outline-none`}
                  />
                  {planErrors.processingFee && (
                    <span className="text-[11px] text-red-600 block">
                      {planErrors.processingFee.message}
                    </span>
                  )}
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
                  disabled={isPlanSubmitting}
                  className="!h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlanSubmitting ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
