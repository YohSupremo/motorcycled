import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = import.meta.env.VITE_API;
const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const chartColors = ["#047857", "#c2410c", "#be123c", "#a16207", "#0f766e"];

const TopProductTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const product = payload[0].payload;

  return (
    <div className="border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-zinc-900">{product.product}</p>
      {product.category && <p className="mt-1 text-zinc-500">{product.category}</p>}
      <p className="mt-1 font-medium text-emerald-700">{product.units} units sold</p>
    </div>
  );
};

const Card = ({ label, value, detail }) => (
  <div className="border border-zinc-200 bg-white rounded p-4">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="mt-2 text-xl font-bold tracking-tight text-zinc-900">{value}</p>
    {detail && <p className="mt-1 text-xs text-zinc-500">{detail}</p>}
  </div>
);

const ExpandButton = ({ expanded, onClick, count }) =>
  count > 5 ? (
    <button
      type="button"
      onClick={onClick}
      className="border-t border-zinc-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
    >
      {expanded ? "Show less" : `Show all ${count}`}
    </button>
  ) : null;

export const AdminReports = () => {
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API}/admin/reports`, {
        params: { dateFrom, dateTo },
        withCredentials: true,
      });
      setReports(data.reports);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const sales = reports?.sales;
  const inventory = reports?.inventory;
  const expenses = reports?.expenses;
  const orders = reports?.orders;
  const installments = reports?.installments;
  const visibleRows = (rows, key) => (expanded[key] ? rows : rows.slice(0, 5));
  const toggleExpanded = (key) =>
    setExpanded((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Reports</h1>
          <p className="mt-1 text-xs text-zinc-500">
            Sales, inventory, restocking costs, orders, products, and installment receivables.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-zinc-500">
            From
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 block h-8 rounded border border-zinc-300 bg-white px-2 text-xs text-zinc-700" />
          </label>
          <label className="text-xs text-zinc-500">
            To
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 block h-8 rounded border border-zinc-300 bg-white px-2 text-xs text-zinc-700" />
          </label>
          <button type="button" onClick={loadReports} className="h-8 rounded bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {loading && <p className="text-sm text-zinc-500">Loading reports...</p>}

      {!loading && reports && (
        <>
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Sales report</h2>
              <p className="mt-1 text-xs text-zinc-500">Paid and completed sales within the selected date range.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card label="Sales" value={money(sales.totalSales)} />
              <Card label="Paid orders" value={sales.totalOrders} />
              <Card label="Units sold" value={sales.totalUnits} />
            </div>
            <div className="mt-3 rounded border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-900">Sales by day</p>
                <span className="text-[11px] text-zinc-500">₱</span>
              </div>
              <div className="flex h-56 flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="h-56 w-full sm:w-3/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sales.byDate} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₱${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => [money(value), "Sales"]} />
                    <Bar dataKey="sales" fill="#047857" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto rounded border border-zinc-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Units</th><th className="px-4 py-3 text-right">Sales</th></tr></thead>
                <tbody>{visibleRows(sales.byDate, "sales").map((row) => <tr key={row.date} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.orders}</td><td className="px-4 py-3">{row.units}</td><td className="px-4 py-3 text-right font-mono">{money(row.sales)}</td></tr>)}</tbody>
              </table>
              <ExpandButton expanded={expanded.sales} onClick={() => toggleExpanded("sales")} count={sales.byDate.length} />
            </div>
            </div>
          </section>

          <section>
            <div className="mb-3"><h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Inventory and restocking</h2><p className="mt-1 text-xs text-zinc-500">All active inventory totals and restocking expenses for the selected date range.</p></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4"><Card label="Active products" value={inventory.totalProducts} detail="All non-archived products" /><Card label="Units on hand" value={inventory.totalUnits} detail="Across all active products" /><Card label="Inventory value" value={money(inventory.inventoryValue)} detail="Current stock at cost price" /><Card label="Restocking expense" value={money(expenses.totalExpenses)} detail="Selected date range" /></div>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="overflow-x-auto rounded border border-zinc-200 bg-white"><div className="border-b border-zinc-200 px-4 py-3"><p className="text-xs font-semibold text-zinc-900">Low-stock products</p><p className="mt-1 text-[11px] text-zinc-500">Active products at or below their stock threshold.</p></div><table className="w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Stock</th></tr></thead><tbody>{visibleRows(inventory.lowStock, "stock").map((row) => <tr key={row.product} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3">{row.product}</td><td className="px-4 py-3 text-zinc-500">{row.category}</td><td className="px-4 py-3 text-right font-mono">{row.stock}</td></tr>)}</tbody></table><ExpandButton expanded={expanded.stock} onClick={() => toggleExpanded("stock")} count={inventory.lowStock.length} />{inventory.lowStock.length === 0 && <p className="p-4 text-xs text-zinc-500">No low-stock products.</p>}</div>
              <div className="overflow-x-auto rounded border border-zinc-200 bg-white"><div className="border-b border-zinc-200 px-4 py-3"><p className="text-xs font-semibold text-zinc-900">Restocking expenses</p><p className="mt-1 text-[11px] text-zinc-500">Inventory restocking transactions in the selected date range.</p></div><table className="w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody>{visibleRows(expenses.entries, "expenses").map((row) => <tr key={row.reference} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td><td className="px-4 py-3">{row.product}</td><td className="px-4 py-3 text-right font-mono">{money(row.total)}</td></tr>)}</tbody></table><ExpandButton expanded={expanded.expenses} onClick={() => toggleExpanded("expenses")} count={expenses.entries.length} />{expenses.entries.length === 0 && <p className="p-4 text-xs text-zinc-500">No restocking expenses in this range.</p>}</div>
            </div>
          </section>

          <section>
            <div className="mb-3"><h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Orders and top products</h2><p className="mt-1 text-xs text-zinc-500">Customer order summary and best-selling products grouped by category.</p></div>
            <div className="mb-3 rounded border border-zinc-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-zinc-900">Top 5 products by units sold</p>
              <div className="flex h-56 flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="h-56 w-full sm:w-3/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports.topProducts.slice(0, 5)}
                        dataKey="units"
                        nameKey="product"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={82}
                        paddingAngle={2}
                      >
                        {reports.topProducts.slice(0, 5).map((row, index) => (
                          <Cell
                            key={`${row.category}-${row.product}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<TopProductTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid w-full grid-cols-2 gap-1 sm:w-2/5 sm:grid-cols-1">
                  {reports.topProducts.slice(0, 5).map((row, index) => (
                    <div
                      key={`${row.category}-${row.product}`}
                      className="flex items-center gap-2 text-[11px] text-zinc-600"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className="truncate">{row.product}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="overflow-x-auto rounded border border-zinc-200 bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody>{visibleRows(orders.entries, "orders").map((row) => <tr key={row.orderNumber} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3 font-mono">{row.orderNumber}</td><td className="px-4 py-3">{row.customer}</td><td className="px-4 py-3 text-right font-mono">{money(row.total)}</td></tr>)}</tbody></table><ExpandButton expanded={expanded.orders} onClick={() => toggleExpanded("orders")} count={orders.entries.length} /></div>
              <div className="overflow-x-auto rounded border border-zinc-200 bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Units</th><th className="px-4 py-3 text-right">Sales</th></tr></thead><tbody>{visibleRows(reports.topProducts, "topProducts").map((row) => <tr key={`${row.category}-${row.product}`} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3">{row.product}</td><td className="px-4 py-3 text-zinc-500">{row.category}</td><td className="px-4 py-3 text-right font-mono">{row.units}</td><td className="px-4 py-3 text-right font-mono">{money(row.sales)}</td></tr>)}</tbody></table><ExpandButton expanded={expanded.topProducts} onClick={() => toggleExpanded("topProducts")} count={reports.topProducts.length} /></div>
            </div>
          </section>

          <section>
            <div className="mb-3"><h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Installment reports</h2><p className="mt-1 text-xs text-zinc-500">Collections and outstanding receivables from approved installment applications.</p></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Card label="Collected" value={money(installments.totalCollected)} /><Card label="Outstanding" value={money(installments.totalOutstanding)} /><Card label="Overdue accounts" value={installments.overdueAccounts.length} detail={installments.overdueNote} /></div>
            <div className="mt-3 overflow-x-auto rounded border border-zinc-200 bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500"><tr><th className="px-4 py-3">Application</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3 text-right">Collected</th><th className="px-4 py-3 text-right">Outstanding</th></tr></thead><tbody>{visibleRows(installments.entries, "installments").map((row) => <tr key={row.reference} className="border-b border-zinc-100 last:border-0"><td className="px-4 py-3 font-mono">{row.reference}</td><td className="px-4 py-3">{row.customer}</td><td className="px-4 py-3 text-right font-mono">{money(row.collected)}</td><td className="px-4 py-3 text-right font-mono">{money(row.outstanding)}</td></tr>)}</tbody></table><ExpandButton expanded={expanded.installments} onClick={() => toggleExpanded("installments")} count={installments.entries.length} /></div>
          </section>
        </>
      )}
    </div>
  );
};
