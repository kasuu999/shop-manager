import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Package, RefreshCw } from "lucide-react";
import api from "../api/axiosInstance.js";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'purchases' | 'stock' | 'profit'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      let endpoint = "/report/sales/report";
      if (activeTab === "purchases") endpoint = "/report/purchases/report";
      else if (activeTab === "stock") endpoint = "/report/stocks/report";
      else if (activeTab === "profit") endpoint = "/report/profit/report";

      let params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const queryString = params.length ? `?${params.join("&")}` : "";

      const res = await api.get(`${endpoint}${queryString}`);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">
            View financial summaries, sales trends, purchase logs, and net profits.
          </p>
        </div>
      </div>

      {/* Tabs & Date Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === "sales"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === "purchases"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Purchases Report
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === "stock"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Stock Valuation Report
          </button>
          <button
            onClick={() => setActiveTab("profit")}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === "profit"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Profit & Loss Summary
          </button>
        </div>

        {/* Date Filter */}
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
      </div>

      {/* Report Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : !reportData ? (
          <div className="py-12 text-center text-slate-400">No report data available.</div>
        ) : (
          <div>
            {/* Sales / Purchase Summary Cards */}
            {activeTab === "profit" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Sales</p>
                    <p className="mt-2 text-2xl font-bold text-ink-900">
                      ₹{Number(reportData.totalSales || reportData.totalRevenue || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Purchase Cost</p>
                    <p className="mt-2 text-2xl font-bold text-ink-900">
                      ₹{Number(reportData.totalPurchases || reportData.totalCost || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-5 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-800 uppercase">Gross Profit</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                      ₹{Number(reportData.grossProfit || reportData.profit || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-ink-900 capitalize">{activeTab} Summary</h3>
                  <span className="text-sm font-semibold text-brand-600">
                    Total: ₹{Number(reportData.totalAmount || reportData.totalValuation || reportData.totalSales || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="py-4 text-sm text-slate-600">
                  <p>Total Records Processed: <span className="font-semibold text-slate-900">{reportData.count || reportData.totalItems || reportData.sales?.length || 0}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
