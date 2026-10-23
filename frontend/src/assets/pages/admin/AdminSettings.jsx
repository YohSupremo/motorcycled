import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const API = import.meta.env.VITE_API;

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
  const [settingsError, setSettingsError] = useState("");

  // Installment plans
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

  const handleSaveSettings = async (data) => {
    setSettingsError("");
    try {
      await axios.put(`${API}/admin/settings`, data, {
        withCredentials: true,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
    } catch (err) {
      setSettingsError(
        err.response?.data?.message || "Could not save store settings.",
      );
    }
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
        headerName: "Plan",
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
                <span className="admin-table-badge text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Archived
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "termMonths",
        headerName: "Term",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700">
            {params.row.termMonths} months
          </span>
        ),
      },
      {
        field: "interestRate",
        headerName: "Interest",
        width: 130,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900">
            {params.row.interestRate}%
          </span>
        ),
      },
      {
        field: "minDownpaymentPercent",
        headerName: "Downpayment",
        width: 140,
        renderCell: (params) => (
          <span className="font-mono text-zinc-700">
            {params.row.minDownpaymentPercent}%
          </span>
        ),
      },
      {
        field: "processingFee",
        headerName: "Doc fee",
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
                  className="p-2 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Restore plan"
                  aria-label="Restore plan"
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
                <button
                  type="button"
                  onClick={() => handleTogglePlanArchive(plan.id)}
                  className="p-2 rounded hover:bg-amber-50 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer"
                  title="Archive plan"
                  aria-label="Archive plan"
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
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Set taxation, stock alerts, payment penalties, and installment plans.
          </p>
        </div>

        {saveFeedback && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
            <svg
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Settings saved
          </span>
        )}
      </div>

      {settingsError && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded">
          {settingsError}
        </div>
      )}

      <form
        onSubmit={handleSubmitSettings(handleSaveSettings)}
        noValidate
        className="space-y-8"
      >
        {/* Tax, inventory and cancellation rules */}
        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[11px] font-medium text-emerald-700 block">
              Baseline parameters
            </span>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight text-balance">
              Taxation, inventory, and cancellation rules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs bg-white p-4 border border-zinc-200">
            <div className="space-y-1">
              <label
                htmlFor="setting-tax-rate"
                className="font-semibold text-zinc-800 block"
              >
                Tax rate (%)
              </label>
              <input
                id="setting-tax-rate"
                type="number"
                step="0.1"
                min={0}
                {...registerSettings("taxRate")}
                className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                  settingsErrors.taxRate
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              />
              {settingsErrors.taxRate && (
                <span className="text-[11px] text-rose-600 block">
                  {settingsErrors.taxRate.message}
                </span>
              )}
              <span className="text-[11px] text-zinc-500 block">
                Copied to the order when it is placed
              </span>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="setting-low-stock"
                className="font-semibold text-zinc-800 block"
              >
                Low-stock alert level
              </label>
              <input
                id="setting-low-stock"
                type="number"
                min={1}
                {...registerSettings("defaultLowStockThreshold")}
                className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                  settingsErrors.defaultLowStockThreshold
                    ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                    : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                }`}
              />
              {settingsErrors.defaultLowStockThreshold && (
                <span className="text-[11px] text-rose-600 block">
                  {settingsErrors.defaultLowStockThreshold.message}
                </span>
              )}
              <span className="text-[11px] text-zinc-500 block">
                Stock at or below this number is flagged
              </span>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="setting-downpayment-policy"
                className="font-semibold text-zinc-800 block"
              >
                Downpayment on cancellation
              </label>
              <select
                id="setting-downpayment-policy"
                {...registerSettings("downpaymentRefundable")}
                className="w-full h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
              >
                <option value="forfeited">Forfeited</option>
                <option value="refundable">Refundable after review</option>
              </select>
              <span className="text-[11px] text-zinc-500 block">
                What happens to the downpayment when an order is cancelled
              </span>
            </div>
          </div>
        </section>

        {/* Late payment rules */}
        <section className="space-y-4">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[11px] font-medium text-emerald-700 block">
              Contractual enforcement
            </span>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight text-balance">
              Late payment penalties and delinquency rules
            </h2>
          </div>

          <div className="space-y-4 text-xs bg-white p-4 border border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-900">
              <input
                type="checkbox"
                {...registerSettings("latePenaltyEnabled")}
                className="text-emerald-600 focus:outline-2 focus:outline-offset-2 focus:outline-emerald-700"
              />
              <span>Apply late payment penalties to payment schedules</span>
            </label>

            {latePenaltyEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-200">
                <div className="space-y-1">
                  <label
                    htmlFor="setting-penalty-type"
                    className="text-zinc-700 font-medium block"
                  >
                    Penalty type
                  </label>
                  <select
                    id="setting-penalty-type"
                    {...registerSettings("latePenaltyType")}
                    className="w-full h-8 px-2 border border-zinc-300 rounded transition-colors focus:border-emerald-700 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-700"
                  >
                    <option value="fixed">Fixed fee (₱250)</option>
                    <option value="percentage">Percentage of balance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="setting-grace-period"
                    className="text-zinc-700 font-medium block"
                  >
                    Grace period (days)
                  </label>
                  <input
                    id="setting-grace-period"
                    type="number"
                    min={0}
                    {...registerSettings("gracePeriodDays")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      settingsErrors.gracePeriodDays
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {settingsErrors.gracePeriodDays && (
                    <span className="text-[11px] text-rose-600 block">
                      {settingsErrors.gracePeriodDays.message}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 block">
                    Days before the penalty applies
                  </span>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="setting-default-after-missed"
                    className="text-zinc-700 font-medium block"
                  >
                    Default after missed payments
                  </label>
                  <input
                    id="setting-default-after-missed"
                    type="number"
                    min={1}
                    {...registerSettings("defaultAfterMissedPayments")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      settingsErrors.defaultAfterMissedPayments
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {settingsErrors.defaultAfterMissedPayments && (
                    <span className="text-[11px] text-rose-600 block">
                      {settingsErrors.defaultAfterMissedPayments.message}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 block">
                    Missed payments before the account is marked as default
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Installment plans */}
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-zinc-900 pb-2">
            <div>
              <span className="text-[11px] font-medium text-emerald-700 block">
                Active financing tenures
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight text-balance">
                Installment plans
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenPlanModal}
              className="inline-flex items-center gap-2 h-7 px-3 rounded bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
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
              Add plan
            </button>
          </div>

          <div className="border border-zinc-200 bg-white rounded overflow-hidden">
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
              sx={adminDataGridSx}
            />
          </div>
        </section>

        {/* Save bar */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSettingsSubmitting}
            className="h-9 px-6 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSettingsSubmitting ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      {/* Add plan modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-modal-heading"
            className="bg-white border border-zinc-300 rounded max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50">
              <h2
                id="plan-modal-heading"
                className="text-sm font-bold text-zinc-900"
              >
                Add installment plan
              </h2>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                aria-label="Close"
                className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
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
              onSubmit={handleSubmitPlan(handleAddPlan)}
              noValidate
              className="p-4 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label htmlFor="plan-name" className="font-semibold text-zinc-900">
                  Plan title *
                </label>
                <input
                  id="plan-name"
                  type="text"
                  placeholder="18 months promotional"
                  {...registerPlan("name")}
                  className={`w-full h-8 px-2.5 border rounded transition-colors focus:outline-2 focus:outline-offset-1 ${
                    planErrors.name
                      ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                      : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                  }`}
                />
                {planErrors.name && (
                  <span className="text-[11px] text-rose-600 block">
                    {planErrors.name.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="plan-term" className="font-semibold text-zinc-900">
                    Term (months) *
                  </label>
                  <input
                    id="plan-term"
                    type="number"
                    min={1}
                    {...registerPlan("termMonths")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      planErrors.termMonths
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {planErrors.termMonths && (
                    <span className="text-[11px] text-rose-600 block">
                      {planErrors.termMonths.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="plan-interest" className="font-semibold text-zinc-900">
                    Interest rate (%) *
                  </label>
                  <input
                    id="plan-interest"
                    type="number"
                    step="0.1"
                    min={0}
                    {...registerPlan("interestRate")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      planErrors.interestRate
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {planErrors.interestRate && (
                    <span className="text-[11px] text-rose-600 block">
                      {planErrors.interestRate.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="plan-downpayment" className="font-semibold text-zinc-900">
                    Downpayment (%) *
                  </label>
                  <input
                    id="plan-downpayment"
                    type="number"
                    min={10}
                    max={100}
                    {...registerPlan("minDownpaymentPercent")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      planErrors.minDownpaymentPercent
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {planErrors.minDownpaymentPercent && (
                    <span className="text-[11px] text-rose-600 block">
                      {planErrors.minDownpaymentPercent.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="plan-fee" className="font-semibold text-zinc-900">
                    Processing fee (₱)
                  </label>
                  <input
                    id="plan-fee"
                    type="number"
                    min={0}
                    {...registerPlan("processingFee")}
                    className={`w-full h-8 px-2.5 border rounded font-mono transition-colors focus:outline-2 focus:outline-offset-1 ${
                      planErrors.processingFee
                        ? "border-rose-500 focus:border-rose-500 focus:outline-rose-500"
                        : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                    }`}
                  />
                  {planErrors.processingFee && (
                    <span className="text-[11px] text-rose-600 block">
                      {planErrors.processingFee.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="h-8 px-3 rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPlanSubmitting}
                  className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlanSubmitting ? "Saving..." : "Save plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
