import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Receipt,
  RefreshCw,
  X,
  CreditCard,
  ShoppingCart,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ScanLine,
} from "lucide-react";
import api from "../api/axiosInstance.js";
import Modal from "../components/Modal.jsx";
import BarcodeScannerModal from "../components/BarcodeScannerModal.jsx";

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

  // Barcode Scanner (mobile camera)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState(""); // brief inline feedback: "Added X" / "Not found: X"
  // html5-qrcode's success callback can fire several times per second while
  // the same barcode stays in frame. This ref makes sure exactly ONE scan
  // per modal-open session gets processed, instead of adding the same
  // product to the cart repeatedly from one scan.
  const scanHandledRef = useRef(false);

  // Sale Details / Cancel (Sale Return) State
  const [viewSale, setViewSale] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [toast, setToast] = useState("");

  const [categories, setCategories] = useState([]);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    sellingPrice: "",
    unit: "pcs",
    stock: "50",
  });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [saleRes, custRes, prodRes, catRes] = await Promise.all([
        api.get("/sale"),
        api.get("/customers"),
        api.get("/products?limit=1000"),
        api.get("/categories"),
      ]);

      if (saleRes.data?.success) setSales(saleRes.data.data);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
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
    setScanNotice("");
    setIsModalOpen(true);
  };

  // Core "add or increment" logic, shared by manual click AND barcode scan.
  const addProductToCart = (product) => {
    if (product.stock <= 0) {
      return { ok: false, message: `${product.name} is out of stock.` };
    }

    const existingIndex = cart.findIndex((item) => item.product._id === product._id);
    if (existingIndex > -1) {
      if (cart[existingIndex].quantity >= product.stock) {
        return { ok: false, message: `Cannot add more "${product.name}" — only ${product.stock} in stock.` };
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      return { ok: true, message: `${product.name} quantity increased.` };
    }

    setCart((prev) => [
      ...prev,
      { product, quantity: 1, sellingPrice: product.sellingPrice || 0 },
    ]);
    return { ok: true, message: `${product.name} added to cart.` };
  };

  const handleAddToCart = (product) => {
    const result = addProductToCart(product);
    if (!result.ok) alert(result.message);
  };

  const handleBarcodeScanned = async (code) => {
    // Automatically open POS modal if scanning from main Sales page
    setIsModalOpen(true);

    const trimmedCode = code.trim();
    let matched = products.find((p) => p.barcode && p.barcode.trim() === trimmedCode);

    if (!matched) {
      try {
        const res = await api.get(`/products/barcode/${encodeURIComponent(trimmedCode)}`);
        if (res.data?.success && res.data.data) {
          const bData = res.data.data;
          matched = {
            _id: bData._id || bData.id,
            name: bData.name,
            barcode: bData.barcode,
            sellingPrice: bData.sellingPrice,
            purchasePrice: bData.purchasePrice,
            unit: bData.unit,
            stock: bData.stock,
            lowStockLimit: bData.lowStockLimit,
            category: bData.category,
          };
        }
      } catch (_) {}
    }

    if (!matched) {
      // Barcode not in shop stock yet — open Express Quick Add modal right in POS!
      setIsScannerOpen(false);
      setQuickAddData({
        name: "",
        category: categories[0]?._id || "",
        barcode: trimmedCode,
        purchasePrice: "",
        sellingPrice: "",
        unit: "pcs",
        stock: "50",
      });
      setQuickAddError("");
      setQuickAddModalOpen(true);
    } else {
      const result = addProductToCart(matched);
      setScanNotice(result.message);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    setQuickAddError("");
    setQuickAddLoading(true);

    try {
      const payload = {
        ...quickAddData,
        purchasePrice: Number(quickAddData.purchasePrice) || 0,
        sellingPrice: Number(quickAddData.sellingPrice) || 0,
        stock: Number(quickAddData.stock) || 1,
        lowStockLimit: 5,
      };

      const res = await api.post("/products", payload);
      const newProduct = res.data?.data;

      // Add to local state product list & refresh in background
      setProducts((prev) => [newProduct, ...prev]);

      // Automatically add new product to POS Cart
      addProductToCart(newProduct);

      setToast(`Product "${newProduct.name}" created and added to bill!`);
      setQuickAddModalOpen(false);
      fetchData();
    } catch (err) {
      setQuickAddError(err.response?.data?.message || "Failed to create product");
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleOpenScanner = () => {
    scanHandledRef.current = false;
    setScanNotice("");
    setIsScannerOpen(true);
  };

  // Global listener for handheld USB/Bluetooth hardware barcode scanners
  useEffect(() => {
    let codeBuffer = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        return;
      }

      const currentTime = Date.now();

      if (e.key === "Enter") {
        if (codeBuffer.length >= 3) {
          handleBarcodeScanned(codeBuffer);
          codeBuffer = "";
        }
      } else if (e.key.length === 1) {
        if (currentTime - lastKeyTime > 120) {
          codeBuffer = "";
        }
        codeBuffer += e.key;
        lastKeyTime = currentTime;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, categories]);

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!scanNotice) return;
    const timer = setTimeout(() => setScanNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [scanNotice]);

  const handleConfirmCancelSale = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      const res = await api.patch(`/sale/${cancelTarget._id}/cancel`);
      const updatedSale = res.data?.data;

      // Reflect the cancellation immediately in the list (and in the
      // details modal if it happens to be open for the same sale).
      setSales((prev) =>
        prev.map((s) => (s._id === cancelTarget._id ? { ...s, ...updatedSale } : s))
      );
      setViewSale((prev) => (prev && prev._id === cancelTarget._id ? { ...prev, ...updatedSale } : prev));

      setToast(`Sale ${cancelTarget.invoiceNumber || ""} cancelled — stock restored.`);
      setCancelTarget(null);

      // Refresh in the background so product stock numbers shown elsewhere
      // (e.g. the POS product list) stay accurate.
      fetchData();
    } catch (err) {
      setCancelError(err.response?.data?.message || "Failed to cancel sale");
    } finally {
      setCancelLoading(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenScanner}
            className="flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ink-800 transition-colors"
          >
            <ScanLine size={16} /> Scan & Sell Barcode
          </button>
          <button
            onClick={handleOpenPOS}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> New Sale / POS Counter
          </button>
        </div>
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
                  <th className="px-6 py-3.5">Status</th>
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
                    <td className="px-6 py-4">
                      {sale.status === "cancelled" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 uppercase">
                          <Ban size={12} /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 uppercase">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewSale(sale)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="View sale details"
                        >
                          <Eye size={16} />
                        </button>
                        {sale.status !== "cancelled" && (
                          <button
                            onClick={() => {
                              setCancelError("");
                              setCancelTarget(sale);
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            title="Cancel sale / return stock"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sale._id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete sale record"
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
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type product name or barcode..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOpenScanner}
                  title="Scan barcode with camera"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800 transition-colors"
                >
                  <ScanLine size={16} /> Scan
                </button>
              </div>
              {scanNotice && (
                <p className="mt-1.5 text-xs font-medium text-slate-600">{scanNotice}</p>
              )}
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

      {/* Sale Details Modal */}
      <Modal
        isOpen={!!viewSale}
        onClose={() => setViewSale(null)}
        title={viewSale ? `Sale ${viewSale.invoiceNumber || ""}` : "Sale Details"}
        maxWidth="max-w-xl"
      >
        {viewSale && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {viewSale.status === "cancelled" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 uppercase">
                  <Ban size={12} /> Cancelled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 uppercase">
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
              <span className="text-xs text-slate-500">
                {new Date(viewSale.saleDate || viewSale.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="font-medium text-ink-900">{viewSale.customer?.name || "Walk-in Customer"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payment Method</p>
                <p className="font-medium text-ink-900 uppercase">{viewSale.paymentMethod || "cash"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewSale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{item.product?.name || "Item"}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">₹{item.sellingPrice}</td>
                      <td className="px-3 py-2 text-right font-medium">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{Number(viewSale.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>₹{Number(viewSale.discount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink-900">
                <span>Grand Total</span>
                <span>₹{Number(viewSale.grandTotal || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {viewSale.status === "cancelled" && viewSale.cancelledAt && (
              <p className="text-xs text-red-500">
                Cancelled on {new Date(viewSale.cancelledAt).toLocaleString()} — stock was restored.
              </p>
            )}

            {viewSale.status !== "cancelled" && (
              <button
                onClick={() => {
                  setCancelError("");
                  setCancelTarget(viewSale);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw size={16} /> Cancel Sale / Return Stock
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Sale Confirmation Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => (cancelLoading ? null : setCancelTarget(null))}
        title="Cancel Sale"
        maxWidth="max-w-sm"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">
                Are you sure you want to cancel sale{" "}
                <span className="font-semibold">{cancelTarget.invoiceNumber}</span>? This will restore
                stock for all items on this sale. This action cannot be undone.
              </p>
            </div>

            {cancelError && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{cancelError}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Sale
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancelSale}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {cancelLoading && <RefreshCw size={14} className="animate-spin" />}
                {cancelLoading ? "Cancelling..." : "Yes, Cancel Sale"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Express Quick Add Product Modal (Triggered on Scanned Unknown Barcode) */}
      <Modal
        isOpen={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        title="Express Quick Add Product to Shop Stock"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-3">
          <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
            Barcode <span className="font-mono font-bold text-amber-900">{quickAddData.barcode}</span> not found in shop stock yet. Enter details to save & add to bill instantly:
          </div>

          {quickAddError && (
            <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{quickAddError}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Product Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={quickAddData.name}
              onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
              placeholder="e.g. Pond's 7g / Lays ₹10"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={quickAddData.sellingPrice}
                onChange={(e) => setQuickAddData({ ...quickAddData, sellingPrice: e.target.value })}
                placeholder="10"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-emerald-700 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Stock Qty</label>
              <input
                type="number"
                min="1"
                value={quickAddData.stock}
                onChange={(e) => setQuickAddData({ ...quickAddData, stock: e.target.value })}
                placeholder="50"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quickAddData.purchasePrice}
                onChange={(e) => setQuickAddData({ ...quickAddData, purchasePrice: e.target.value })}
                placeholder="8"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Category</label>
              <select
                value={quickAddData.category}
                onChange={(e) => setQuickAddData({ ...quickAddData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuickAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickAddLoading}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {quickAddLoading ? "Saving..." : "Save & Add to Bill"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Barcode Scanner Modal (mobile camera) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

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