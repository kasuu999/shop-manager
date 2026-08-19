import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Receipt, RefreshCw, X, CreditCard, ShoppingCart } from "lucide-react";
import api from "../api/axiosInstance.js";
import Modal from "../components/Modal.jsx";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // POS / New Sale Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [cart, setCart] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Product Search inside POS
  const [productQuery, setProductQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [saleRes, custRes, prodRes] = await Promise.all([
        api.get("/sale"),
        api.get("/customers"),
        api.get("/products"),
      ]);

      if (saleRes.data?.success) setSales(saleRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPOS = () => {
    setCustomerId("");
    setPaymentMethod("cash");
    setDiscount(0);
    setCart([]);
    setFormError("");
    setProductQuery("");
    setIsModalOpen(true);
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      alert("Product is out of stock!");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product._id === product._id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity >= product.stock) {
        alert("Cannot add more than available stock!");
        return;
      }
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          sellingPrice: product.sellingPrice || 0,
        },
      ]);
    }
  };

  const handleQuantityChange = (product_id, newQty) => {
    const qty = Math.max(1, Number(newQty) || 1);
    const updated = cart.map((item) => {
      if (item.product._id === product_id) {
        if (qty > item.product.stock) {
          alert(`Only ${item.product.stock} items available in stock.`);
          return { ...item, quantity: item.product.stock };
        }
        return { ...item, quantity: qty };
      }
      return item;
    });
    setCart(updated);
  };

  const handleRemoveFromCart = (product_id) => {
    setCart(cart.filter((item) => item.product._id !== product_id));
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.sellingPrice || 0),
      0
    );
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub - Number(discount || 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (cart.length === 0) {
      setFormError("Cart is empty! Select at least one product.");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        customer: customerId || undefined,
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        })),
        discount: Number(discount) || 0,
        paymentMethod,
      };

      await api.post("/sale", payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to process sale");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sale record?")) return;
    try {
      await api.delete(`/sale/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete sale record");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(productQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Sales & Billing (POS)</h2>
          <p className="text-sm text-slate-500">Record customer sales and generate invoices.</p>
        </div>
        <button
          onClick={handleOpenPOS}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> New Sale / POS Counter
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
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p>No sale records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink-900">
                      {sale.invoiceNumber || `INV-${sale._id.slice(-6)}`}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {sale.customer?.name || "Walk-in Customer"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {sale.items?.map((i) => `${i.product?.name || "Item"} x ${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 uppercase">
                        {sale.paymentMethod || "cash"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{Number(sale.grandTotal || sale.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sale._id)}
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

      {/* POS Billing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="POS Billing Counter"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Item Selection */}
          <div className="space-y-4 lg:col-span-7">
            {/* Customer Select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Quick Search */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Search Products to Add
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Type product name or barcode..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Product Grid / Cards */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1 bg-slate-50/50">
              {filteredProducts.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No products match search.</p>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod._id}
                    onClick={() => handleAddToCart(prod)}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-2.5 hover:border-brand-500 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-semibold text-sm text-ink-900">{prod.name}</p>
                      <p className="text-xs text-slate-400">
                        Stock: {prod.stock} {prod.unit || "pcs"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-brand-600">
                        ₹{prod.sellingPrice}
                      </span>
                      <span className="block text-[10px] text-slate-400">Click to add</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Billing Summary Cart */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-5 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-ink-900 mb-3 flex items-center gap-2">
                <ShoppingCart size={16} /> Bill Cart ({cart.length} items)
              </h4>

              {formError && (
                <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Cart List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">Cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-slate-200 text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-slate-800">{item.product.name}</p>
                        <p className="text-slate-500">₹{item.sellingPrice} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product._id, e.target.value)}
                          className="w-12 rounded border border-slate-300 p-1 text-center font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product._id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Checkout */}
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculateSubtotal().toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-xs bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1">
                  {["cash", "upi", "card", "credit"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode === "card" ? "bank" : mode)}
                      className={`rounded py-1 text-[11px] font-semibold uppercase border transition-colors ${
                        (paymentMethod === mode || (mode === "card" && paymentMethod === "bank"))
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base font-bold text-ink-900">
                <span>Grand Total:</span>
                <span className="text-xl text-emerald-700">
                  ₹{calculateGrandTotal().toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="submit"
                disabled={formLoading || cart.length === 0}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {formLoading ? "Processing..." : "Complete & Print Invoice"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
