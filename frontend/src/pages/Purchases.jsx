import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  RefreshCw,
  X,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from "lucide-react";
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

  // Purchase Details / Return State
  const [viewPurchase, setViewPurchase] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [toast, setToast] = useState("");

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Per-item "remaining returnable" = purchased quantity - already returned
  const remainingReturnable = (item) => item.quantity - (item.returnedQuantity || 0);

  const handleOpenReturn = (purchase) => {
    setReturnError("");
    // Pre-fill every returnable item's input with an empty value (0 quantity == "not returning this item").
    const initialQuantities = {};
    purchase.items.forEach((item) => {
      initialQuantities[item.product._id || item.product] = "";
    });
    setReturnQuantities(initialQuantities);
    setReturnTarget(purchase);
  };

  const handleReturnQuantityChange = (productId, value, max) => {
    // Clamp to [0, remaining returnable] as the user types, mirroring the
    // existing POS quantity-input pattern in Sales.jsx.
    let qty = value === "" ? "" : Math.max(0, Number(value) || 0);
    if (qty !== "" && qty > max) qty = max;
    setReturnQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleConfirmReturn = async () => {
    if (!returnTarget) return;
    setReturnError("");

    const items = returnTarget.items
      .map((item) => {
        const productId = item.product._id || item.product;
        const qty = Number(returnQuantities[productId]) || 0;
        return { product: productId, quantity: qty };
      })
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setReturnError("Enter a return quantity for at least one item.");
      return;
    }

    setReturnLoading(true);
    try {
      const res = await api.post(`/purchase/${returnTarget._id}/return`, { items });
      const updatedPurchase = res.data?.data;

      setPurchases((prev) =>
        prev.map((p) => (p._id === returnTarget._id ? { ...p, ...updatedPurchase } : p))
      );
      setViewPurchase((prev) => (prev && prev._id === returnTarget._id ? { ...prev, ...updatedPurchase } : prev));

      setToast(res.data?.message || "Purchase return processed — stock updated.");
      setReturnTarget(null);

      // Refresh in the background so product stock numbers shown elsewhere
      // (e.g. the New Purchase product list) stay accurate.
      fetchData();
    } catch (err) {
      setReturnError(err.response?.data?.message || "Failed to process purchase return");
    } finally {
      setReturnLoading(false);
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
                  <th className="px-6 py-3.5">Return Status</th>
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
                    <td className="px-6 py-4">
                      {pur.returnStatus === "full" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 uppercase">
                          <Ban size={12} /> Fully Returned
                        </span>
                      ) : pur.returnStatus === "partial" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600 uppercase">
                          <RotateCcw size={12} /> Partially Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 uppercase">
                          <CheckCircle2 size={12} /> None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewPurchase(pur)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="View purchase details"
                        >
                          <Eye size={16} />
                        </button>
                        {pur.returnStatus !== "full" && (
                          <button
                            onClick={() => handleOpenReturn(pur)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            title="Return items / decrease stock"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pur._id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete purchase record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

      {/* Purchase Details Modal */}
      <Modal
        isOpen={!!viewPurchase}
        onClose={() => setViewPurchase(null)}
        title={viewPurchase ? `Purchase ${viewPurchase.invoiceNumber || `PUR-${viewPurchase._id.slice(-6)}`}` : "Purchase Details"}
        maxWidth="max-w-2xl"
      >
        {viewPurchase && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {viewPurchase.returnStatus === "full" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 uppercase">
                  <Ban size={12} /> Fully Returned
                </span>
              ) : viewPurchase.returnStatus === "partial" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 uppercase">
                  <RotateCcw size={12} /> Partially Returned
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 uppercase">
                  <CheckCircle2 size={12} /> No Returns
                </span>
              )}
              <span className="text-xs text-slate-500">
                {new Date(viewPurchase.purchaseDate || viewPurchase.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400">Supplier</p>
              <p className="font-medium text-ink-900">{viewPurchase.supplier?.name || "Unknown"}</p>
            </div>

            <div className="rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Purchased</th>
                    <th className="px-3 py-2 text-right">Returned</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewPurchase.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{item.product?.name || "Item"}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{item.returnedQuantity || 0}</td>
                      <td className="px-3 py-2 text-right font-medium">{remainingReturnable(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-ink-900">
              <span>Total Purchase Cost</span>
              <span>₹{Number(viewPurchase.subtotal || 0).toLocaleString("en-IN")}</span>
            </div>

            {viewPurchase.returnStatus !== "full" && (
              <button
                onClick={() => {
                  setViewPurchase(null);
                  handleOpenReturn(viewPurchase);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw size={16} /> Return Items
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Purchase Return Modal */}
      <Modal
        isOpen={!!returnTarget}
        onClose={() => (returnLoading ? null : setReturnTarget(null))}
        title="Return Purchase Items"
        maxWidth="max-w-xl"
      >
        {returnTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">
                Enter the quantity being returned for each product. Stock will decrease by the
                returned amount. This action cannot be undone.
              </p>
            </div>

            {returnError && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{returnError}</div>
            )}

            <div className="space-y-2">
              {returnTarget.items.map((item) => {
                const productId = item.product._id || item.product;
                const max = remainingReturnable(item);
                const fullyReturned = max <= 0;
                return (
                  <div
                    key={productId}
                    className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                      fullyReturned ? "border-slate-100 bg-slate-50/60 opacity-60" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{item.product?.name || "Item"}</p>
                      <p className="text-xs text-slate-500">
                        Purchased: {item.quantity} &middot; Already Returned: {item.returnedQuantity || 0} &middot;{" "}
                        <span className="font-medium text-slate-700">Remaining Returnable: {max}</span>
                      </p>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        max={max}
                        disabled={fullyReturned}
                        placeholder="0"
                        value={returnQuantities[productId] ?? ""}
                        onChange={(e) => handleReturnQuantityChange(productId, e.target.value, max)}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-center text-xs bg-white focus:outline-none disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                disabled={returnLoading}
                onClick={() => setReturnTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={returnLoading}
                onClick={handleConfirmReturn}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {returnLoading && <RefreshCw size={14} className="animate-spin" />}
                {returnLoading ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}