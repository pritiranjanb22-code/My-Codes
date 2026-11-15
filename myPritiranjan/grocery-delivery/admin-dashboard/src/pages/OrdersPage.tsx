import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Order, PaginatedResponse } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'payment_verification_pending', label: 'Payment Verification' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentStatusOptions = [
  { value: '', label: 'All Payment Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'verification_pending', label: 'Verification Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });
      setOrders(data.data);
      setPagination(prev => ({ ...prev, total: data.meta.total, totalPages: data.meta.totalPages }));
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'out_for_delivery': return 'badge-warning';
      case 'payment_verification_pending': return 'badge-info';
      case 'confirmed':
      case 'preparing':
      case 'ready_for_delivery':
        return 'badge-info';
      default: return 'badge-primary';
    }
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'refunded': return 'badge-info';
      case 'verification_pending': return 'badge-warning';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <Link to="/pending-payments" className="btn-warning">
          <CreditCard className="w-4 h-4" />
          Pending Payments
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input w-48"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="input w-48"
          >
            {paymentStatusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="input w-40"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="input w-40"
            placeholder="To"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        {loading && orders.length === 0 ? (
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
                      { key: 'orderNumber', label: 'Order #' },
                      { key: 'customerName', label: 'Customer' },
                      { key: 'totalAmount', label: 'Amount' },
                      { key: 'status', label: 'Status' },
                      { key: 'paymentStatus', label: 'Payment' },
                      { key: 'createdAt', label: 'Date' },
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <Link to={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-green-600">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Link to={`/orders/${order.id}`} className="text-green-600 hover:text-green-700 text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No orders found
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    payment_pending: 'Payment Pending',
    payment_verification_pending: 'Payment Verification',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready_for_delivery: 'Ready for Delivery',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    verification_pending: 'Under Verification',
    paid: 'Paid',
    rejected: 'Rejected',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'delivered': return 'badge-success';
    case 'cancelled': return 'badge-danger';
    case 'out_for_delivery': return 'badge-warning';
    case 'payment_verification_pending': return 'badge-info';
    case 'confirmed':
    case 'preparing':
    case 'ready_for_delivery':
      return 'badge-info';
    default: return 'badge-primary';
  }
}

function getPaymentStatusBadgeClass(status: string) {
  switch (status) {
    case 'paid': return 'badge-success';
    case 'rejected': return 'badge-danger';
    case 'refunded': return 'badge-info';
    case 'verification_pending': return 'badge-warning';
    default: return 'badge-primary';
  }
}