import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import api from "../api/axiosInstance.js";

const TABS = [
  { key: "sales", label: "Sales Report" },
  { key: "purchases", label: "Purchases Report" },
  { key: "stock", label: "Stock Valuation Report" },
  { key: "profit", label: "Profit & Loss Summary" },
];

// Maps each tab to its ACTUAL backend endpoint. These must match
// reportRoute.js exactly — sales/purchases/profit support ?startDate=&endDate=,
// stock does not (it's just current stock levels, no date range).
const ENDPOINTS = {
  sales: "/report/sales/report",
  purchases: "/report/purchases/report",
  stock: "/report/stocks/report",
  profit: "/report/profit/report",
};

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      let query = "";
      // Stock report has no date filter on the backend — only build the
      // query string for the other three reports.
      if (activeTab !== "stock") {
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        query = params.length ? `?${params.join("&")}` : "";
      }

      const res = await api.get(`${ENDPOINTS[activeTab]}${query}`);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Reports & Analytics</h2>
        <p className="text-sm text-slate-500">
          View sales, purchases, stock valuation, and profit summaries.
        </p>
      </div>

      {/* Tabs & Date Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4 border-b border-slate-200 text-sm font-semibold">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "stock" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            />
            <button
              onClick={fetchReport}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
            >
              Filter
            </button>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : !reportData ? (
          <div className="py-12 text-center text-slate-400">No report data available.</div>
        ) : (
          <>
            {activeTab === "sales" && <SalesReport data={reportData} />}
            {activeTab === "purchases" && <PurchasesReport data={reportData} />}
            {activeTab === "stock" && <StockReport data={reportData} />}
            {activeTab === "profit" && <ProfitReport data={reportData} />}
          </>
        )}
      </div>
    </div>
  );
}

// ---- Small shared bits ----

function SummaryCard({ label, value, tone = "default" }) {
  const toneClasses =
    tone === "brand"
      ? "bg-brand-50 border-brand-200 text-brand-700"
      : "bg-slate-50 border-slate-200 text-ink-900";
  return (
    <div className={`rounded-xl border p-5 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-slate-400">
        {text}
      </td>
    </tr>
  );
}

// ---- Sales Report — matches { totalSalesAmount, numberOfSales, sales } ----

function SalesReport({ data }) {
  const { totalSalesAmount, numberOfSales, sales = [] } = data;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <SummaryCard label="Total Sales Amount" value={formatCurrency(totalSalesAmount)} tone="brand" />
        <SummaryCard label="Number of Sales" value={numberOfSales ?? 0} />
      </div>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Invoice</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Payment</th>
              <th className="px-6 py-3.5 text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <EmptyRow colSpan={5} text="No sales in this period." />
            ) : (
              sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3.5 font-medium text-ink-900">{sale.invoiceNumber || "-"}</td>
                  <td className="px-6 py-3.5">{formatDate(sale.saleDate)}</td>
                  <td className="px-6 py-3.5">{sale.customer?.name || "Walk-in"}</td>
                  <td className="px-6 py-3.5 capitalize">{sale.paymentMethod}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                    {formatCurrency(sale.grandTotal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Purchases Report — matches { totalPurchaseAmount, numberOfPurchases, purchases } ----

function PurchasesReport({ data }) {
  const { totalPurchaseAmount, numberOfPurchases, purchases = [] } = data;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <SummaryCard label="Total Purchase Amount" value={formatCurrency(totalPurchaseAmount)} tone="brand" />
        <SummaryCard label="Number of Purchases" value={numberOfPurchases ?? 0} />
      </div>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Invoice</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Supplier</th>
              <th className="px-6 py-3.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.length === 0 ? (
              <EmptyRow colSpan={4} text="No purchases in this period." />
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3.5 font-medium text-ink-900">{purchase.invoiceNumber || "-"}</td>
                  <td className="px-6 py-3.5">{formatDate(purchase.purchaseDate)}</td>
                  <td className="px-6 py-3.5">{purchase.supplier?.name || "-"}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                    {formatCurrency(purchase.subtotal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Stock Report — data itself is the array of products (see getStockReport) ----

function StockReport({ data }) {
  const products = Array.isArray(data) ? data : [];
  const lowStockCount = products.filter((p) => p.isLowStock).length;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <SummaryCard label="Total Products" value={products.length} tone="brand" />
        <SummaryCard label="Low Stock Products" value={lowStockCount} />
      </div>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Product</th>
              <th className="px-6 py-3.5">Barcode</th>
              <th className="px-6 py-3.5">Stock</th>
              <th className="px-6 py-3.5">Low Stock Limit</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <EmptyRow colSpan={5} text="No products found." />
            ) : (
              products.map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3.5 font-medium text-ink-900">{p.name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{p.barcode || "-"}</td>
                  <td className="px-6 py-3.5">
                    {p.stock} {p.unit}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{p.lowStockLimit}</td>
                  <td className="px-6 py-3.5">
                    {p.isLowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                        <AlertTriangle size={12} /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Profit Report — matches { totalProfit, numberOfSales, breakdown } ----

function ProfitReport({ data }) {
  const { totalProfit, numberOfSales, breakdown = [] } = data;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <SummaryCard label="Total Profit" value={formatCurrency(totalProfit)} tone="brand" />
        <SummaryCard label="Number of Sales" value={numberOfSales ?? 0} />
      </div>

      <p className="px-6 pb-4 text-xs text-slate-400">
        Profit is estimated using each product's current purchase price, not the price at the time of sale.
      </p>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Invoice</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {breakdown.length === 0 ? (
              <EmptyRow colSpan={3} text="No sales in this period." />
            ) : (
              breakdown.map((row) => (
                <tr key={row.saleId} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3.5 font-medium text-ink-900">{row.invoiceNumber || "-"}</td>
                  <td className="px-6 py-3.5">{formatDate(row.saleDate)}</td>
                  <td
                    className={`px-6 py-3.5 text-right font-semibold ${
                      row.profit >= 0 ? "text-brand-700" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.profit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}