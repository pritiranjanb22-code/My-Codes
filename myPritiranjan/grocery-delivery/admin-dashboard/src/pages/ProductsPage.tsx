import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product, PaginatedResponse } from '../types';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    status: '',
    isFeatured: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [categories, setCategories] = useState<any[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });
      setProducts(data.data);
      setPagination(prev => ({ ...prev, total: data.meta.total, totalPages: data.meta.totalPages }));
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { isActive: !product.isActive });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock': return 'badge-success';
      case 'low_stock': return 'badge-warning';
      case 'out_of_stock': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Link to="/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="input w-48"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input w-40"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.isFeatured}
            onChange={(e) => handleFilterChange('isFeatured', e.target.value)}
            className="input w-36"
          >
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {loading && products.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'image', label: '' },
                      { key: 'name', label: 'Product' },
                      { key: 'category', label: 'Category' },
                      { key: 'sellingPrice', label: 'Price' },
                      { key: 'stockStatus', label: 'Stock' },
                      { key: 'isFeatured', label: 'Featured' },
                      { key: 'isActive', label: 'Status' },
                      { key: 'createdAt', label: 'Created' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {sortConfig.key === key && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.unit} • {product.brand || 'No brand'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(product.sellingPrice)}</p>
                          {product.mrpPrice && product.mrpPrice > product.sellingPrice && (
                            <p className="text-sm text-gray-500 line-through">{formatCurrency(product.mrpPrice)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${getStockStatusBadgeClass(product.stockStatus)}`}>
                          {getStockStatusLabel(product.stockStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${product.isFeatured ? 'badge-primary' : 'badge-gray'}`}>
                          {product.isFeatured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/products/${product.id}/edit`} className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors ${!product.isActive ? 'text-green-600' : ''}`}
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {product.isActive ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-outline px-3 py-1"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-outline px-3 py-1"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getStockStatusBadgeClass(status: string) {
  switch (status) {
    case 'in_stock': return 'badge-success';
    case 'low_stock': return 'badge-warning';
    case 'out_of_stock': return 'badge-danger';
    default: return 'badge-primary';
  }
}

function getStockStatusLabel(status: string) {
  const labels: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };
  return labels[status] || status;
}

import { CheckCircle } from 'lucide-react';