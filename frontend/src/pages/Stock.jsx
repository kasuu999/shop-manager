import { useEffect, useState } from "react";
import { Boxes, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import api from "../api/axiosInstance.js";

export default function Stock() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'history'
  const [products, setProducts] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [prodRes, histRes] = await Promise.all([
        api.get("/products"),
        api.get("/stock"),
      ]);

      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (histRes.data?.success) setStockHistory(histRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockProducts = products.filter(
    (p) => Number(p.stock) <= Number(p.lowStockLimit || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Stock & Inventory</h2>
          <p className="text-sm text-slate-500">
            Monitor real-time inventory levels and stock movement history.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Stock Overview ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("lowstock")}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "lowstock"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Low Stock Alerts ({lowStockProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Stock Movement Log ({stockHistory.length})
        </button>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : activeTab === "overview" || activeTab === "lowstock" ? (
          <div className="overflow-x-auto">
            { (activeTab === "lowstock" ? lowStockProducts : products).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Boxes className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p>No products to display.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Product Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Current Stock</th>
                    <th className="px-6 py-3.5">Low Limit</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === "lowstock" ? lowStockProducts : products).map((prod) => {
                    const isLow = Number(prod.stock) <= Number(prod.lowStockLimit || 0);
                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-ink-900">{prod.name}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {prod.category?.name || "Uncategorized"}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {prod.stock} {prod.unit || "pcs"}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {prod.lowStockLimit || 0} {prod.unit || "pcs"}
                        </td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <AlertTriangle size={12} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Movement History Log */
          <div className="overflow-x-auto">
            {stockHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Boxes className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p>No stock movement logs recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Quantity Change</th>
                    <th className="px-6 py-3.5">Stock Before → After</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockHistory.map((hist) => {
                    const isAddition = hist.type === "PURCHASE" || hist.type === "ADDITION";
                    return (
                      <tr key={hist._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-ink-900">
                          {hist.product?.name || "Product"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                              isAddition
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {isAddition ? (
                              <ArrowDownLeft size={12} />
                            ) : (
                              <ArrowUpRight size={12} />
                            )}
                            {hist.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">
                          {isAddition ? `+${hist.quantity}` : `-${hist.quantity}`}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {hist.previousStock} → {hist.newStock}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(hist.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
