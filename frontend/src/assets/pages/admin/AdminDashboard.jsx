import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DataGrid } from "@mui/x-data-grid";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const API = import.meta.env.VITE_API;

const customRangeSchema = yup.object({
  startDate: yup.string().required("Start date is required"),
  endDate: yup
    .string()
    .required("End date is required")
    .test(
      "on-or-after-start",
      "End date cannot be before the start date",
      function (value) {
        const { startDate } = this.parent;
        return !value || !startDate || new Date(value) >= new Date(startDate);
      },
    ),
});

const fmtCurrency = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const AdminDashboard = ({ onSelectOrder }) => {
  // Telemetry and analytics state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalOrders: 0,
      activeInstallmentsCount: 0,
      activeInstallmentsValue: 0,
      pendingScreeningCount: 0,
      lowStockCount: 0,
    },
    cashFlow: {
      cashIn: 0,
      cashOut: 0,
      netCashFlow: 0,
      initialCapital: 0,
    },
    rangeSummary: {
      startDate: "",
      endDate: "",
      preset: "30d",
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalUnits: 0,
    },
    salesTimeline: [],
    categorySales: [],
    pendingApprovals: [],
    recentOrders: [],
    lowStockProducts: [],
  });

  // Quiz 2: date range filter and chart configuration state
  const [preset, setPreset] = useState("30d");
  const [chartType, setChartType] = useState("area"); // area, bar, or line
  const [metricMode, setMetricMode] = useState("sales"); // sales, orders, or units

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(customRangeSchema),
    defaultValues: { startDate: "", endDate: "" },
  });

  const fetchStats = useCallback(async (activePreset, start, end, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      let query = `?preset=${activePreset || "30d"}`;
      if (activePreset === "custom" && start && end) {
        query += `&startDate=${start}&endDate=${end}`;
      }
      const { data } = await axios.get(`${API}/admin/dashboard-stats${query}`, {
        withCredentials: true,
      });

      if (data?.success && data?.data) {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
      setError(err.response?.data?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const { startDate, endDate } = getValues();
    fetchStats(preset, startDate, endDate);
  }, [fetchStats, preset, getValues]);

  const handleApplyCustomRange = (data) => {
    setPreset("custom");
    fetchStats("custom", data.startDate, data.endDate);
  };

  const refreshStats = (isManualRefresh = false) => {
    const { startDate, endDate } = getValues();
    fetchStats(preset, startDate, endDate, isManualRefresh);
  };

  const {
    metrics,
    cashFlow = { cashIn: 0, cashOut: 0, netCashFlow: 0, initialCapital: 0 },
    rangeSummary,
    salesTimeline,
    categorySales,
    pendingApprovals,
    recentOrders,
    lowStockProducts,
  } = dashboardData;

  const metricDataKey =
    metricMode === "sales" ? "sales" : metricMode === "orders" ? "orders" : "units";
  const metricSeriesName =
    metricMode === "sales" ? "Revenue" : metricMode === "orders" ? "Orders" : "Units";
  const rangeYear = String(rangeSummary.endDate || "").slice(0, 4);

  const formatAxisValue = (v) =>
    metricMode === "sales"
      ? v >= 1000000
        ? `₱${(v / 1000000).toFixed(1)}M`
        : v >= 1000
        ? `₱${(v / 1000).toFixed(0)}k`
        : `₱${v}`
      : v;

  const formatTooltipValue = (val, name) => [
    name === "Revenue" ? `₱${Number(val).toLocaleString()}` : `${val} ${name.toLowerCase()}`,
    name,
  ];

  const formatTooltipLabel = (label) =>
    rangeYear ? `Date: ${label}, ${rangeYear}` : `Date: ${label}`;

  // Material UI DataGrid columns for real underwriting credit applications
  const approvalColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Application Ref",
        width: 145,
        renderCell: (params) => (
          <span className="font-mono font-semibold text-zinc-900">
            {params.row.id}
          </span>
        ),
      },
      {
        field: "customer",
        headerName: "Applicant",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900">{params.row.customer}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              {params.row.phone || params.row.email}
            </p>
          </div>
        ),
      },
      {
        field: "vehicle",
        headerName: "Vehicle Model",
        flex: 1.2,
        minWidth: 170,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-medium text-zinc-900 line-clamp-1">{params.row.vehicle}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Downpayment: ₱{Number(params.row.downpayment || 0).toLocaleString()}
            </p>
          </div>
        ),
      },
      {
        field: "term",
        headerName: "Financing Terms",
        width: 180,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 border border-zinc-200 text-zinc-700">
              {params.row.term}
            </span>
            <span className="text-[11px] text-zinc-500 mt-0.5 font-mono truncate">
              ₱{Number(params.row.monthly || 0).toLocaleString()} per month
            </span>
          </div>
        ),
      },
      {
        field: "credentials",
        headerName: "Verified Credentials",
        flex: 1.2,
        minWidth: 200,
        sortable: false,
        renderCell: (params) => (
          <div className="flex flex-col justify-center min-w-0 leading-tight">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{params.row.validId}</span>
            </span>
            <span className="text-[10px] text-zinc-500 truncate mt-0.5">
              {params.row.incomeProof}
            </span>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 130,
        headerAlign: "right",
        align: "right",
        sortable: false,
        renderCell: (params) => (
          <div className="inline-flex items-center justify-end w-full">
            <Link
              to="/admin/orders"
              onClick={() => onSelectOrder?.(params.row._id)}
              className="inline-flex items-center justify-center px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs cursor-pointer whitespace-nowrap"
            >
              Review
            </Link>
          </div>
        ),
      },
    ],
    [onSelectOrder]
  );

  // Material UI DataGrid columns for real recent orders stream
  const recentOrdersColumns = useMemo(
    () => [
      {
        field: "orderNumber",
        headerName: "Reference",
        width: 150,
        renderCell: (params) => (
          <span className="font-mono font-semibold text-zinc-900 text-xs">
            {params.row.orderNumber}
          </span>
        ),
      },
      {
        field: "customer",
        headerName: "Customer",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900 text-xs">{params.row.customer}</p>
            <p className="text-[10px] text-zinc-500 font-mono">{params.row.city}</p>
          </div>
        ),
      },
      {
        field: "firstItemName",
        headerName: "Items",
        flex: 1.3,
        minWidth: 180,
        renderCell: (params) => (
          <div className="leading-tight min-w-0">
            <p className="font-medium text-zinc-900 text-xs truncate">
              {params.row.firstItemName}
            </p>
            {params.row.itemsCount > 1 && (
              <span className="text-[10px] text-zinc-500 font-mono">
                +{params.row.itemsCount - 1} other item{params.row.itemsCount - 1 > 1 ? "s" : ""}
              </span>
            )}
          </div>
        ),
      },
      {
        field: "totalPrice",
        headerName: "Total Amount",
        width: 120,
        renderCell: (params) => (
          <span className="font-mono font-bold text-zinc-900 text-xs">
            ₱{Number(params.row.totalPrice || 0).toLocaleString()}
          </span>
        ),
      },
      {
        field: "orderStatus",
        headerName: "Fulfillment",
        width: 150,
        renderCell: (params) => {
          const s = params.row.orderStatus;
          const isDone = s === "completed";
          return (
            <span
              title={s}
              className={`inline-flex max-w-full items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase whitespace-normal break-words leading-tight ${
                isDone
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : s === "shipped"
                  ? "bg-sky-50 text-sky-800 border border-sky-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {s}
            </span>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Date",
        width: 100,
        renderCell: (params) => (
          <span className="font-mono text-[11px] text-zinc-500">
            {new Date(params.row.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 text-balance">
            Dealership overview
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Sales, credit screening, and stock levels for the current period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refreshStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 !h-8 px-3 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <svg
              className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </button>
          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center !h-8 px-3 rounded bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>
              Review applications
              {metrics.pendingScreeningCount > 0 ? ` (${metrics.pendingScreeningCount})` : ""}
            </span>
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center justify-center !h-8 px-3 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            Restock inventory
          </Link>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => refreshStats()} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Cash flow */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-zinc-900">
          <div>
            <span className="text-[11px] font-medium text-emerald-700 block">
              This month
            </span>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight text-balance">
              Cash flow
            </h2>
          </div>
          <Link
            to="/admin/settings"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            Set initial capital
          </Link>
        </div>

        <div className="border-y border-zinc-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
          <div className="px-4 py-2 space-y-1">
            <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
              Total cash in
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-700 font-mono">
              {loading ? "Loading..." : fmtCurrency(cashFlow.cashIn)}
            </p>
            <p className="text-[11px] text-zinc-500">Money actually received this month</p>
          </div>

          <div className="px-4 py-2 space-y-1">
            <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
              Total cash out
            </span>
            <p className="text-2xl font-bold tracking-tight text-rose-700 font-mono">
              {loading ? "Loading..." : fmtCurrency(cashFlow.cashOut)}
            </p>
            <p className="text-[11px] text-zinc-500">Supplier restocks this month</p>
          </div>

          <div className="px-4 py-2 space-y-1">
            <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
              Net cash flow
            </span>
            <p
              className={`text-2xl font-bold tracking-tight font-mono ${
                cashFlow.netCashFlow < 0 ? "text-rose-700" : "text-zinc-900"
              }`}
            >
              {loading ? "Loading..." : fmtCurrency(cashFlow.netCashFlow)}
            </p>
            <p className="text-[11px] text-zinc-500">Cash in minus cash out</p>
          </div>

          <div className="px-4 py-2 space-y-1">
            <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
              Initial capital
            </span>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
              {loading ? "Loading..." : fmtCurrency(cashFlow.initialCapital)}
            </p>
            <p className="text-[11px] text-zinc-500">Owner's original investment</p>
          </div>
        </div>
      </section>

      {/* Key figures */}
      <div className="border-y border-zinc-200 bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
        <div className="px-4 py-2 space-y-1">
          <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
            All-time revenue
          </span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {loading ? "Loading..." : fmtCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-[11px] text-zinc-500">
            Realized turnover across {metrics.totalOrders} orders
          </p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
            Credit screening queue
          </span>
          <p className="text-2xl font-bold tracking-tight text-amber-700 font-mono">
            {loading ? "..." : `${metrics.pendingScreeningCount} pending`}
          </p>
          <p className="text-[11px] text-zinc-500">Awaiting a credit decision</p>
        </div>

        <div className="px-4 py-2 space-y-1">
          <span className="block font-mono uppercase text-[10px] tracking-wider text-zinc-500">
            Low stock watchlist
          </span>
          <p className="text-2xl font-bold tracking-tight text-rose-700 font-mono">
            {loading ? "..." : `${metrics.lowStockCount} alert${metrics.lowStockCount === 1 ? "" : "s"}`}
          </p>
          <p className="text-[11px] text-zinc-500">Items with 5 units or fewer in stock</p>
        </div>
      </div>

      {/* Sales charts with date range filter */}
      <section className="border border-zinc-200 bg-white rounded overflow-hidden">
        <div className="p-6 border-b border-zinc-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight text-balance">
              Sales and revenue
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Show</span>
                <div className="flex items-center p-0.5 bg-zinc-100 rounded border border-zinc-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMetricMode("sales")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      metricMode === "sales"
                        ? "bg-white text-emerald-700 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode("orders")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      metricMode === "orders"
                        ? "bg-white text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode("units")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      metricMode === "units"
                        ? "bg-white text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Units
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Chart</span>
                <div className="flex items-center p-0.5 bg-zinc-100 rounded border border-zinc-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartType("area")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      chartType === "area"
                        ? "bg-white text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Area chart"
                  >
                    Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      chartType === "bar"
                        ? "bg-white text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Bar chart"
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      chartType === "line"
                        ? "bg-white text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                    title="Line chart"
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500 mr-1">Date range</span>
              {[
                { key: "7d", label: "7 days" },
                { key: "30d", label: "30 days" },
                { key: "this_month", label: "This month" },
                { key: "90d", label: "90 days" },
                { key: "ytd", label: "Year to date" },
                { key: "custom", label: "Custom" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setPreset(p.key);
                    if (p.key !== "custom") {
                      fetchStats(p.key, "", "");
                    }
                  }}
                  className={`px-3 py-2 rounded text-xs font-medium cursor-pointer transition-colors ${
                    preset === p.key
                      ? "bg-zinc-900 text-white font-semibold"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === "custom" && (
              <div className="flex flex-col gap-1 self-start md:self-auto">
                <form
                  onSubmit={handleSubmit(handleApplyCustomRange)}
                  noValidate
                  className="flex items-start gap-2 bg-zinc-50 p-2 rounded border border-zinc-200"
                >
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono text-[10px]">From</span>
                      <input
                        type="date"
                        {...register("startDate")}
                        className={`h-7 px-2 text-xs bg-white border rounded focus:outline-2 focus:outline-offset-1 font-mono ${
                          errors.startDate
                            ? "border-red-500 focus:outline-red-600"
                            : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                        }`}
                      />
                    </div>
                    {errors.startDate && (
                      <span className="text-[10px] text-red-600">
                        {errors.startDate.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono text-[10px]">To</span>
                      <input
                        type="date"
                        {...register("endDate")}
                        className={`h-7 px-2 text-xs bg-white border rounded focus:outline-2 focus:outline-offset-1 font-mono ${
                          errors.endDate
                            ? "border-red-500 focus:outline-red-600"
                            : "border-zinc-300 focus:border-emerald-700 focus:outline-emerald-700"
                        }`}
                      />
                    </div>
                    {errors.endDate && (
                      <span className="text-[10px] text-red-600">
                        {errors.endDate.message}
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="h-7 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Figures for the selected range */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-100 bg-zinc-50/50 border-b border-zinc-100">
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Sales in range
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {fmtCurrency(rangeSummary.totalSales)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {rangeSummary.startDate} to {rangeSummary.endDate}
            </span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Orders
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {rangeSummary.totalOrders} {rangeSummary.totalOrders === 1 ? "Order" : "Orders"}
            </span>
            <span className="text-[10px] text-zinc-500">In the selected period</span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Average order value
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {fmtCurrency(rangeSummary.averageOrderValue)}
            </span>
            <span className="text-[10px] text-zinc-500">Per completed transaction</span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Units sold
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {rangeSummary.totalUnits} units
            </span>
            <span className="text-[10px] text-zinc-500">Bikes, parts and accessories</span>
          </div>
        </div>

        {/* Sales chart */}
        <div className="p-6">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center space-y-2 text-zinc-500">
              <svg className="w-8 h-8 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs font-mono">Loading sales data</span>
            </div>
          ) : salesTimeline.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-xs text-zinc-500">
              No sales in the selected period.
            </div>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={salesTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e4e4e7" }}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatAxisValue}
                    />
                    <Tooltip
                      formatter={formatTooltipValue}
                      labelFormatter={formatTooltipLabel}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "4px",
                        boxShadow: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey={metricDataKey}
                      name={metricSeriesName}
                      fill="#047857"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : chartType === "line" ? (
                  <LineChart data={salesTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e4e4e7" }}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatAxisValue}
                    />
                    <Tooltip
                      formatter={formatTooltipValue}
                      labelFormatter={formatTooltipLabel}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "4px",
                        boxShadow: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={metricDataKey}
                      name={metricSeriesName}
                      stroke="#047857"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#047857" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={salesTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e4e4e7" }}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatAxisValue}
                    />
                    <Tooltip
                      formatter={formatTooltipValue}
                      labelFormatter={formatTooltipLabel}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "4px",
                        boxShadow: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={metricDataKey}
                      name={metricSeriesName}
                      stroke="#047857"
                      strokeWidth={2}
                      fill="#047857"
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {categorySales.length > 0 && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
              Category sales
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {categorySales.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-zinc-600 font-medium">{cat.name}</span>
                  <span className="font-mono font-bold text-zinc-900">{fmtCurrency(cat.sales)}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">({cat.units} units)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Underwriting queue */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-zinc-900">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight text-balance">
            Installment credit screening
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            Open order workflow
          </Link>
        </div>

        <div className="border border-zinc-200 bg-white rounded overflow-hidden">
          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-900">No pending credit applications.</p>
              <p>Every submitted application has been decided.</p>
            </div>
          ) : (
            <DataGrid
              rows={pendingApprovals}
              columns={approvalColumns}
              getRowId={(row) => row._id || row.id}
              rowHeight={68}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              autoHeight
              sx={adminDataGridSx}
            />
          )}
        </div>
      </section>

      {/* Recent orders and low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight text-balance">
              Recent orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              All orders
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white rounded overflow-hidden">
            <DataGrid
              rows={recentOrders}
              columns={recentOrdersColumns}
              getRowId={(row) => row._id || row.orderNumber}
              rowHeight={56}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              autoHeight
              sx={adminDataGridSx}
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-rose-600 shrink-0" />
              <span className="text-balance">Low stock</span>
            </h2>
            <Link
              to="/admin/inventory"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Restock
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white rounded divide-y divide-zinc-200 text-xs overflow-hidden">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Every catalog item is above the minimum stock level.
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-zinc-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="capitalize font-mono">{item.category}</span>
                      <span className="font-mono font-bold text-zinc-800">{fmtCurrency(item.price)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        item.stock === 0
                          ? "bg-red-50 text-red-700 border-red-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
                    </span>
                    <Link
                      to="/admin/inventory"
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded cursor-pointer transition-colors"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
