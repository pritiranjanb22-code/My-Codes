import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

const statCards = [
  { name: "Today's Orders", icon: ShoppingBag, color: 'bg-blue-500', bgColor: 'bg-blue-100' },
  { name: "Today's Sales", icon: DollarSign, color: 'bg-green-500', bgColor: 'bg-green-100' },
  { name: 'Pending Payments', icon: CreditCard, color: 'bg-amber-500', bgColor: 'bg-amber-100' },
  { name: 'Active Products', icon: Package, color: 'bg-purple-500', bgColor: 'bg-purple-100' },
];

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your grocery store performance</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports" className="btn-outline">
            View Reports
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && [
          { label: "Today's Orders", value: stats.today.ordersCount, icon: ShoppingBag, color: 'text-blue-500', bgColor: 'bg-blue-100' },
          { label: "Today's Sales", value: formatCurrency(stats.today.sales), icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-100' },
          { label: 'Pending Payments', value: stats.today.pendingPayments, icon: CreditCard, color: 'text-amber-500', bgColor: 'bg-amber-100' },
          { label: 'This Month Sales', value: formatCurrency(stats.thisMonth.sales), icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-100' },
        ].map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}

        {/* Inventory Stats */}
        {stats && [
          { label: 'In Stock', value: stats.inventory.inStock, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
          { label: 'Low Stock', value: stats.inventory.lowStock, icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-100' },
          { label: 'Out of Stock', value: stats.inventory.outOfStock, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
        ].map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/products/new" className="btn-outline w-full justify-start">
                <Package className="w-5 h-5" />
                Add New Product
              </Link>
              <Link to="/orders" className="btn-outline w-full justify-start">
                <ShoppingBag className="w-5 h-5" />
                Manage Orders
              </Link>
              <Link to="/pending-payments" className="btn-outline w-full justify-start">
                <CreditCard className="w-5 h-5" />
                Verify Payments
              </Link>
              <Link to="/categories/new" className="btn-outline w-full justify-start">
                <Tag className="w-5 h-5" />
                Add Category
              </Link>
              <Link to="/reports" className="btn-outline w-full justify-start">
                <BarChart3 className="w-5 h-5" />
                View Reports
              </Link>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Stock Items</p>
                  <p className="text-xs text-amber-600">{stats?.inventory.lowStock || 0} products need restocking</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">Out of Stock</p>
                  <p className="text-xs text-red-600">{stats?.inventory.outOfStock || 0} products unavailable</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {stats?.recentOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{order.customerName} • {formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    <Link to={`/orders/${order.id}`} className="text-sm text-green-600 hover:text-green-700">
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  No recent orders
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

import { Tag } from 'lucide-react';