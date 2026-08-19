import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  Users,
  Truck,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import api from "../api/axiosInstance.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/dashboard");
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    todaysSalesTotal = 0,
    todaysPurchaseTotal = 0,
    totalProducts = 0,
    totalCustomers = 0,
    totalSuppliers = 0,
    lowStockCount = 0,
    recentSales = [],
    recentPurchases = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">
            Welcome back! Here is what's happening with your store today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/sales"
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} /> New Sale
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Sales
            </span>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-ink-900">
              ₹{todaysSalesTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Purchases
            </span>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-ink-900">
              ₹{todaysPurchaseTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Items
            </span>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink-900">{lowStockCount}</span>
            {lowStockCount > 0 && (
              <Link
                to="/stock"
                className="text-xs font-semibold text-amber-600 hover:underline"
              >
                View low stock →
              </Link>
            )}
          </div>
        </div>

        {/* Total Products */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-ink-900">{totalProducts}</span>
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customers
            </span>
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-ink-900">{totalCustomers}</span>
          </div>
        </div>

        {/* Suppliers */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Suppliers
            </span>
            <div className="rounded-lg bg-teal-50 p-2.5 text-teal-600">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-ink-900">{totalSuppliers}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Recent Sales</h3>
            <Link
              to="/sales"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No sales recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">
                      {sale.invoiceNumber || `INV-${sale._id.slice(-6)}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.customer?.name || "Walk-in Customer"} •{" "}
                      {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-slate-900">
                    ₹{(sale.grandTotal || sale.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Recent Purchases</h3>
            <Link
              to="/purchases"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentPurchases.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No purchases recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPurchases.map((pur) => (
                <div key={pur._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">
                      {pur.invoiceNumber || `PUR-${pur._id.slice(-6)}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pur.supplier?.name || "Supplier"} •{" "}
                      {new Date(pur.purchaseDate || pur.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-slate-900">
                    ₹{(pur.subtotal || pur.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
