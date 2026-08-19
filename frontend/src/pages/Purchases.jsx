import { useEffect, useState } from "react";
import { Plus, Search, Trash2, ShoppingCart, RefreshCw, X } from "lucide-react";
import api from "../api/axiosInstance.js";
import Modal from "../components/Modal.jsx";

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([
    { product: "", quantity: 1, purchasePrice: 0 },
  ]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get("/purchase"),
        api.get("/suppliers"),
        api.get("/products"),
      ]);

      if (purRes.data?.success) setPurchases(purRes.data.data);
      if (supRes.data?.success) setSuppliers(supRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load purchase records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSupplierId(suppliers[0]?._id || "");
    setItems([{ product: products[0]?._id || "", quantity: 1, purchasePrice: products[0]?.purchasePrice || 0 }]);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "product") {
      const selected = products.find((p) => p._id === value);
      if (selected) {
        updated[index].purchasePrice = selected.purchasePrice || 0;
      }
    }

    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { product: products[0]?._id || "", quantity: 1, purchasePrice: products[0]?.purchasePrice || 0 },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.purchasePrice || 0),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!supplierId) {
      setFormError("Please select a supplier");
      return;
    }

    for (const item of items) {
      if (!item.product) {
        setFormError("Please select a product for all rows");
        return;
      }
      if (item.quantity <= 0 || item.purchasePrice <= 0) {
        setFormError("Quantity and Purchase Price must be greater than 0");
        return;
      }
    }

    setFormLoading(true);
    try {
      await api.post("/purchase", {
        supplier: supplierId,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          purchasePrice: Number(i.purchasePrice),
        })),
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create purchase record");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase record?")) return;
    try {
      await api.delete(`/purchase/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete purchase record");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Record stock received from suppliers.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ShoppingCart className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p>No purchase records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Supplier</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Total Cost</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink-900">
                      {pur.invoiceNumber || `PUR-${pur._id.slice(-6)}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {pur.supplier?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {pur.items?.map((i) => `${i.product?.name || "Item"} x ${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{Number(pur.subtotal || pur.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(pur.purchaseDate || pur.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(pur._id)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Purchase"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{formError}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select Supplier *
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">Purchased Items</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Plus size={14} /> Add Item Row
              </button>
            </div>

            {items.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <div className="flex-1">
                  <select
                    value={row.product}
                    onChange={(e) => handleItemChange(idx, "product", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Cost ₹"
                    value={row.purchasePrice}
                    onChange={(e) => handleItemChange(idx, "purchasePrice", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-600">Total Purchase Cost:</span>
            <span className="text-lg font-bold text-ink-900">
              ₹{calculateSubtotal().toLocaleString("en-IN")}
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {formLoading ? "Recording..." : "Record Purchase"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
