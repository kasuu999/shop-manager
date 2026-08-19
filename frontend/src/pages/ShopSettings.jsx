import { useEffect, useState } from "react";
import { Store, Save, RefreshCw } from "lucide-react";
import api from "../api/axiosInstance.js";

export default function ShopSettings() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
  });
  const [hasExistingShop, setHasExistingShop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchShop = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/shop");
      if (res.data?.success && res.data?.data) {
        const s = res.data.data;
        setFormData({
          name: s.name || "",
          phone: s.phone || "",
          email: s.email || "",
          address: s.address || "",
          gstNumber: s.gstNumber || "",
        });
        setHasExistingShop(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setHasExistingShop(false);
      } else {
        setError(err.response?.data?.message || "Failed to load shop details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (hasExistingShop) {
        await api.put("/shop", formData);
        setMessage("Shop settings updated successfully!");
      } else {
        await api.post("/shop", formData);
        setHasExistingShop(true);
        setMessage("Shop created successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save shop settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Shop Settings</h2>
        <p className="text-sm text-slate-500">
          Configure shop profile details, contact information, and GST number for receipts.
        </p>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Shop Name *</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
            <Store size={18} className="text-slate-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Moin Super Mart"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="9876543210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="shop@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">GST / Tax Number</label>
          <input
            type="text"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            placeholder="e.g. 22AAAAA0000A1Z5"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Shop Address</label>
          <textarea
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full shop address..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
