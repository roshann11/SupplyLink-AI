"use client";

import { useEffect, useState } from "react";
import { productsApi, ProductResponse } from "@/lib/api-client";
import { Package, Plus, Trash2, Edit2, X, Search, Globe, FolderOpen } from "lucide-react";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "my">("directory");
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Product form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    currency: "USD",
    stock_quantity: "0",
    image_url: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  function loadProducts() {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (activeTab === "my" && token) {
      productsApi
        .listMy(token)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      productsApi
        .listActive()
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }

  function handleOpenCreate() {
    setEditingProduct(null);
    setForm({
      name: "",
      sku: "",
      description: "",
      price: "",
      currency: "USD",
      stock_quantity: "0",
      image_url: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(p: ProductResponse) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description || "",
      price: p.price !== null ? String(p.price) : "",
      currency: p.currency,
      stock_quantity: String(p.stock_quantity),
      image_url: p.image_url || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const data = {
      ...form,
      price: form.price ? parseFloat(form.price) : null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data, token);
      } else {
        await productsApi.create(data, token);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving product");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await productsApi.delete(id, token);
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse directory products or manage your company's list.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "directory"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Globe className="h-4 w-4" />
          Global Directory
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "my"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          My Products
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No products found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {activeTab === "my"
              ? "You haven't listed any products yet. Click 'Add Product' to start building your catalog."
              : "No active products exist in the database directories."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative aspect-video w-full bg-slate-100 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-slate-300" />
                )}
                {!product.is_active && (
                  <span className="absolute left-3 top-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    SKU: {product.sku}
                  </span>
                  <h4 className="mt-1 font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{product.description || "No description provided."}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
                  <p className="font-extrabold text-slate-800">
                    {product.price !== null ? `${product.price.toFixed(2)} ${product.currency}` : "Contact for Quote"}
                  </p>
                  {activeTab === "my" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-slate-100 animate-scale-up mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add Product to Catalog"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Product Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">SKU / Model Number</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Available Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={form.stock_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Unit Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 29.99"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Product Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
