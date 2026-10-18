import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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
  Legend,
} from "recharts";

const API = import.meta.env.VITE_API;

const fmtCurrency = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const AdminDashboard = ({ onSelectOrder }) => {
  const navigate = useNavigate();

  // Telemetry & Analytics State
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

  // Quiz 2: Date Range Filter & Chart Configuration State
  const [preset, setPreset] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartType, setChartType] = useState("area"); // 'area' | 'bar' | 'line'
  const [metricMode, setMetricMode] = useState("sales"); // 'sales' | 'orders' | 'units'

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
      setError(err.response?.data?.message || "Failed to load real-time dealership telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(preset, customStart, customEnd);
  }, [fetchStats, preset]);

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    if (new Date(customStart) > new Date(customEnd)) {
      alert("Start date cannot be after end date.");
      return;
    }
    setPreset("custom");
    fetchStats("custom", customStart, customEnd);
  };

  const { metrics, rangeSummary, salesTimeline, categorySales, pendingApprovals, recentOrders, lowStockProducts } =
    dashboardData;

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
        headerName: "Applicant & Contact",
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
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 border border-zinc-200 text-zinc-700">
              {params.row.term}
            </span>
            <span className="text-[11px] text-zinc-600 mt-0.5 font-mono truncate">
              ₱{Number(params.row.monthly || 0).toLocaleString()} / mo
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
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              <svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              onClick={() => onSelectOrder && onSelectOrder(params.row._id)}
              className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Review &amp; Decide
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
        headerName: "Customer & Destination",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <div className="leading-tight">
            <p className="font-semibold text-zinc-900 text-xs">{params.row.customer}</p>
            <p className="text-[10px] text-zinc-400 font-mono">{params.row.city}</p>
          </div>
        ),
      },
      {
        field: "firstItemName",
        headerName: "Items Snapshot",
        flex: 1.3,
        minWidth: 180,
        renderCell: (params) => (
          <div className="leading-tight min-w-0">
            <p className="font-medium text-zinc-900 text-xs truncate">
              {params.row.firstItemName}
            </p>
            {params.row.itemsCount > 1 && (
              <span className="text-[10px] text-zinc-400 font-mono">
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
        width: 120,
        renderCell: (params) => {
          const s = params.row.orderStatus;
          const isDone = s === "completed";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
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
          <span className="font-mono text-[11px] text-zinc-400">
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
    <div className="space-y-8 pb-10">
      {/* Title & Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Dealership Operational Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE MONGODB SYNC</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time dealership telemetry aggregated across <code className="font-mono text-zinc-600 font-semibold">orders</code>, <code className="font-mono text-zinc-600 font-semibold">installment_applications</code>, and <code className="font-mono text-zinc-600 font-semibold">products</code> collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStats(preset, customStart, customEnd, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 !h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap disabled:opacity-50"
            title="Refresh database telemetry"
          >
            <svg
              className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? "Refreshing..." : "Refresh Feeds"}</span>
          </button>
          <Link
            to="/admin/orders"
            className="inline-flex items-center justify-center !h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>Review Applications</span>
            <span className="ml-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {metrics.pendingScreeningCount}
            </span>
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center justify-center !h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Restock Inventory
          </Link>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => fetchStats(preset, customStart, customEnd)} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Flat Unified Financial Metrics Strip (Derived directly from MongoDB) */}
      <div className="border-y border-zinc-200 bg-white grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 py-3">
        {/* Metric 1: Monthly Collections */}
        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Monthly Collections (Current Month)
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded font-semibold">
              Live DB
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {loading ? "Loading..." : fmtCurrency(metrics.monthlyRevenue)}
          </p>
          <p className="text-[11px] text-zinc-500">
            Cash purchases + Settled collections
          </p>
        </div>

        {/* Metric 2: Total Dealership Sales Revenue */}
        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              All-Time Settled Revenue
            </span>
            <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1 rounded font-semibold">
              {metrics.totalOrders} Orders
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-700 font-mono">
            {loading ? "Loading..." : fmtCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-[11px] text-zinc-500">
            Total realized turnover
          </p>
        </div>

        {/* Metric 3: Screening Queue */}
        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Underwriting Screening Queue
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded font-semibold">
              Action Req.
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-amber-700 font-mono">
            {loading ? "..." : `${metrics.pendingScreeningCount} Pending`}
          </p>
          <p className="text-[11px] text-zinc-500">
            Awaiting credit approval decision
          </p>
        </div>

        {/* Metric 4: Stock Alerts */}
        <div className="px-4 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400">
              Low Stock Watchlist
            </span>
            <span className="text-[10px] font-mono text-rose-800 bg-rose-50 border border-rose-200 px-1 rounded font-semibold">
              Stock &le; 5
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-rose-700 font-mono">
            {loading ? "..." : `${metrics.lowStockCount} Alert${metrics.lowStockCount === 1 ? "" : "s"}`}
          </p>
          <p className="text-[11px] text-zinc-500">
            Critical threshold reached
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* QUIZ 2 (15pts): SALES CHARTS WITH DATE RANGE FILTER (LINE & BAR CHART)    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <section className="border border-zinc-200 bg-white rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header & Controls Toolbar */}
        <div className="p-5 border-b border-zinc-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                  Quiz 2 Requirement (15pts)
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs font-semibold text-zinc-500">
                  Interactive Dealership Sales Analytics
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight mt-0.5">
                Sales Performance &amp; Revenue Trends
              </h2>
            </div>

            {/* Chart Type and Metric Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Toggle: Sales (₱) vs Orders count vs Units */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMetricMode("sales")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    metricMode === "sales"
                      ? "bg-white text-emerald-800 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Sales Revenue (₱)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode("orders")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    metricMode === "orders"
                      ? "bg-white text-zinc-900 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Order Volume (#)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode("units")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    metricMode === "units"
                      ? "bg-white text-zinc-900 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Units Sold
                </button>
              </div>

              {/* Chart Style Toggle: Area vs Bar vs Line */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartType("area")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "area"
                      ? "bg-white text-zinc-900 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title="Area fill chart"
                >
                  <span>Area</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "bar"
                      ? "bg-white text-zinc-900 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title="Bar chart"
                >
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("line")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "line"
                      ? "bg-white text-zinc-900 shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title="Line chart"
                >
                  <span>Line</span>
                </button>
              </div>
            </div>
          </div>

          {/* Date Range Filter Bar (Presets & Custom Date Pickers) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mr-1">
                Date Range:
              </span>
              {[
                { key: "7d", label: "Last 7 Days" },
                { key: "30d", label: "Last 30 Days" },
                { key: "this_month", label: "This Month" },
                { key: "90d", label: "Last 90 Days" },
                { key: "ytd", label: "Year to Date (2026)" },
                { key: "custom", label: "Custom Range" },
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    preset === p.key
                      ? "bg-zinc-900 text-white font-semibold shadow-xs"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Pickers (active when Custom selected or available directly) */}
            {preset === "custom" && (
              <form
                onSubmit={handleApplyCustomRange}
                className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200 self-start md:self-auto"
              >
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-zinc-400 font-mono text-[10px]">From:</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                    className="h-7 px-2 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-zinc-400 font-mono text-[10px]">To:</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                    className="h-7 px-2 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
                >
                  Apply Filter
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Filtered Range KPI Highlights Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-100 bg-zinc-50/50 border-b border-zinc-100">
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
              Filtered Range Sales
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {fmtCurrency(rangeSummary.totalSales)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {rangeSummary.startDate} → {rangeSummary.endDate}
            </span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
              Orders Count
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {rangeSummary.totalOrders} {rangeSummary.totalOrders === 1 ? "Order" : "Orders"}
            </span>
            <span className="text-[10px] text-zinc-500">
              Within selected window
            </span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
              Average Order Value (AOV)
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {fmtCurrency(rangeSummary.averageOrderValue)}
            </span>
            <span className="text-[10px] text-zinc-500">
              Per completed transaction
            </span>
          </div>
          <div className="p-4">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
              Total Units Sold
            </span>
            <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
              {rangeSummary.totalUnits} Units
            </span>
            <span className="text-[10px] text-zinc-500">
              Bikes, parts &amp; accessories
            </span>
          </div>
        </div>

        {/* Primary Recharts Sales Chart Container */}
        <div className="p-5">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center space-y-2 text-zinc-400">
              <svg className="w-8 h-8 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs font-mono">Aggregating database sales data points...</span>
            </div>
          ) : salesTimeline.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-xs text-zinc-500">
              No sales data recorded for the selected date window.
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
                      tickFormatter={(v) =>
                        metricMode === "sales"
                          ? v >= 1000000
                            ? `₱${(v / 1000000).toFixed(1)}M`
                            : v >= 1000
                            ? `₱${(v / 1000).toFixed(0)}k`
                            : `₱${v}`
                          : v
                      }
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === "Sales" ? `₱${Number(val).toLocaleString()}` : `${val} ${name}`,
                        name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}, 2026`}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar
                      dataKey={metricMode === "sales" ? "sales" : metricMode === "orders" ? "orders" : "units"}
                      name={metricMode === "sales" ? "Sales" : metricMode === "orders" ? "Orders" : "Units Sold"}
                      fill="#059669"
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
                      tickFormatter={(v) =>
                        metricMode === "sales"
                          ? v >= 1000000
                            ? `₱${(v / 1000000).toFixed(1)}M`
                            : v >= 1000
                            ? `₱${(v / 1000).toFixed(0)}k`
                            : `₱${v}`
                          : v
                      }
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === "Sales" ? `₱${Number(val).toLocaleString()}` : `${val} ${name}`,
                        name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}, 2026`}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Line
                      type="monotone"
                      dataKey={metricMode === "sales" ? "sales" : metricMode === "orders" ? "orders" : "units"}
                      name={metricMode === "sales" ? "Sales" : metricMode === "orders" ? "Orders" : "Units Sold"}
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#059669" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={salesTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
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
                      tickFormatter={(v) =>
                        metricMode === "sales"
                          ? v >= 1000000
                            ? `₱${(v / 1000000).toFixed(1)}M`
                            : v >= 1000
                            ? `₱${(v / 1000).toFixed(0)}k`
                            : `₱${v}`
                          : v
                      }
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === "Sales" ? `₱${Number(val).toLocaleString()}` : `${val} ${name}`,
                        name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}, 2026`}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Area
                      type="monotone"
                      dataKey={metricMode === "sales" ? "sales" : metricMode === "orders" ? "orders" : "units"}
                      name={metricMode === "sales" ? "Sales" : metricMode === "orders" ? "Orders" : "Units Sold"}
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Share Breakdown Footer */}
        {categorySales.length > 0 && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">
              Category Sales in Range:
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {categorySales.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-zinc-600 font-medium">{cat.name}:</span>
                  <span className="font-mono font-bold text-zinc-900">{fmtCurrency(cat.sales)}</span>
                  <span className="text-[11px] text-zinc-400 font-mono">({cat.units} units)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: LIVE UNDERWRITING QUEUE (REAL MONGODB INSTALLMENT APPLICATIONS) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-zinc-900">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
              Underwriting Queue
            </span>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Installment Credit Screening &amp; Document Verification
            </h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            Open Order Workflow &rarr;
          </Link>
        </div>

        <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-700">No pending financing applications in the underwriting queue.</p>
              <p>All submitted credit applications have been processed and decided.</p>
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
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(244, 244, 245, 0.7)",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e4e4e7",
                  backgroundColor: "#fafafa",
                  fontSize: "0.75rem",
                },
              }}
            />
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: TWO COLUMN STREAM — LIVE RECENT ORDERS & LOW-STOCK WATCHLIST    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column: Real Recent Orders Stream */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
                Order Activity
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Live Transaction &amp; Order Stream
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              All Orders &rarr;
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden">
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
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(244, 244, 245, 0.7)",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e4e4e7",
                  backgroundColor: "#fafafa",
                  fontSize: "0.75rem",
                },
              }}
            />
          </div>
        </div>

        {/* Right Column: Real Low-Stock Watchlist */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-700 font-bold block">
                Inventory Watchlist
              </span>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>Low Stock Threshold (&le; 5 Units)</span>
              </h2>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Restock &rarr;
            </Link>
          </div>

          <div className="border border-zinc-200 bg-white rounded-xl shadow-xs divide-y divide-zinc-200 text-xs overflow-hidden">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                All catalog inventory items are sufficiently stocked above minimum thresholds.
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-zinc-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="capitalize font-mono">{item.category}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-zinc-800">{fmtCurrency(item.price)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2.5">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        item.stock === 0
                          ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {item.stock === 0 ? "Out of Stock" : `${item.stock} left`}
                    </span>
                    <Link
                      to="/admin/inventory"
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded cursor-pointer transition-colors"
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
