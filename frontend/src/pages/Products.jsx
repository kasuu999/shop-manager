import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Package, RefreshCw, AlertCircle } from "lucide-react";
import api from "../api/axiosInstance.js";
import Modal from "../components/Modal.jsx";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    sellingPrice: "",
    unit: "pcs",
    stock: "0",
    lowStockLimit: "5",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Inline "create new category" state — lets the user add a category
  // without leaving the product form.
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      let query = [];
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (selectedCategory) query.push(`category=${selectedCategory}`);
      const queryString = query.length ? `?${query.join("&")}` : "";

      const res = await api.get(`/products${queryString}`);
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories[0]?._id || "",
      barcode: "",
      purchasePrice: "",
      sellingPrice: "",
      unit: "pcs",
      stock: "0",
      lowStockLimit: "5",
    });
    setFormError("");
    setShowNewCategory(false);
    setNewCategoryName("");
    setCategoryError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || "",
      category: prod.category?._id || prod.category || "",
      barcode: prod.barcode || "",
      purchasePrice: prod.purchasePrice ?? "",
      sellingPrice: prod.sellingPrice ?? "",
      unit: prod.unit || "pcs",
      stock: prod.stock ?? "0",
      lowStockLimit: prod.lowStockLimit ?? "5",
    });
    setFormError("");
    setShowNewCategory(false);
    setNewCategoryName("");
    setCategoryError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        stock: Number(formData.stock),
        lowStockLimit: Number(formData.lowStockLimit),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Creates a category from the small inline form inside the product
  // modal, then adds it to the `categories` list in state and selects it —
  // so the person never has to leave the "Add Product" flow just to add a
  // category that doesn't exist yet.
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError("Category name is required");
      return;
    }
    setCategoryError("");
    setCreatingCategory(true);

    try {
      const res = await api.post("/categories", { name: newCategoryName.trim() });
      const newCategory = res.data.data;

      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory._id }));
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err) {
      setCategoryError(err.response?.data?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Products Catalog</h2>
          <p className="text-sm text-slate-500">Manage products, pricing, and stock limits.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Cost Price</th>
                  <th className="px-6 py-3.5">Sell Price</th>
                  <th className="px-6 py-3.5">Stock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const isLowStock = prod.stock <= (prod.lowStockLimit || 0);
                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-ink-900">
                        <div>
                          <span>{prod.name}</span>
                          {prod.barcode && (
                            <span className="block text-xs text-slate-400 font-mono">
                              Barcode: {prod.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        ₹{Number(prod.purchasePrice || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ₹{Number(prod.sellingPrice || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-medium ${
                              isLowStock ? "text-amber-600" : "text-slate-800"
                            }`}
                          >
                            {prod.stock} {prod.unit || "pcs"}
                          </span>
                          {isLowStock && (
                            <AlertCircle size={14} className="text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod._id)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{formError}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Basmati Rice 5kg"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory((prev) => !prev);
                    setCategoryError("");
                  }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {showNewCategory ? "Cancel" : "+ New category"}
                </button>
              </div>

              {showNewCategory ? (
                // Inline create form — replaces the dropdown while active,
                // so creating a category and picking one never overlap.
                <div className="space-y-2">
                  {categoryError && (
                    <p className="text-xs text-red-600">{categoryError}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                      className="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {creatingCategory ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unit *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. pcs, kg, ltr"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Purchase Cost (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Low Stock Limit
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockLimit}
                onChange={(e) => setFormData({ ...formData, lowStockLimit: e.target.value })}
                placeholder="5"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Barcode</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Optional barcode / code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
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
              {formLoading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}