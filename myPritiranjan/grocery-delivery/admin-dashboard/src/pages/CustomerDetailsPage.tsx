import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, Order, Address } from '../types';
import { formatCurrency, formatDate, getStatusLabel, getPaymentStatusLabel } from '../utils/helpers';
import toast from 'react-hot-toast';

export function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'details'>('orders');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, ordersData, addressesData] = await Promise.all([
          api.getCustomerById(id!),
          api.getCustomerOrders(id!),
          api.getCustomerAddresses(id!),
        ]);
        setCustomer(customerData);
        setOrders(ordersData);
        setAddresses(addressesData);
      } catch (error) {
        toast.error('Failed to load customer');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleDeleteCustomer = () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    
    setDeleting(true);
    // In a real app, you'd call an API to delete the customer
    // await api.deleteCustomer(id!);
    toast.error('Delete customer not implemented in demo');
    setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <button onClick={() => navigate('/customers')} className="btn-primary mt-4">Back to Customers</button>
      </div>
    );
  }

  const totalOrders = customer.totalOrders || 0;
  const totalSpent = customer.totalSpent || 0;
  const pendingOrders = orders.filter(o => ['confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery'].includes(o.status)).length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
            <p className="text-gray-500">{customer.phone} • {customer.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button onClick={handleDeleteCustomer} disabled={deleting} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-2xl font-bold text-amber-600">{pendingOrders}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Cancelled Orders</p>
          <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6" aria-label="Tabs">
            {[
              { id: 'details', label: 'Details', icon: User },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && customer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Personal Information
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm text-gray-500">Full Name</dt>
                      <dd className="font-medium text-gray-900">{customer.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900 flex items-center gap-2">
                        {customer.phone}
                        {customer.phoneVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900 flex items-center gap-2">
                        {customer.email || 'Not provided'}
                        {customer.emailVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Date of Birth</dt>
                      <dd className="font-medium text-gray-900">{customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Gender</dt>
                      <dd className="font-medium text-gray-900">{customer.gender || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Member Since</dt>
                      <dd className="font-medium text-gray-900">{formatDate(customer.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Loyalty Points</dt>
                      <dd className="font-medium text-gray-900">{customer.loyaltyPoints || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Status</dt>
                      <dd className="font-medium text-gray-900">
                        <span className="badge-success">Active</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Purchase Statistics
                  </h3>
                  <dl className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm text-gray-500">Total Orders</dt>
                        <dd className="text-2xl font-bold text-gray-900">{totalOrders}</dd>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm text-gray-500">Total Spent</dt>
                        <dd className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</dd>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm text-gray-500">Avg Order Value</dt>
                        <dd className="text-2xl font-bold text-gray-900">{totalOrders > 0 ? formatCurrency(totalSpent / totalOrders) : '₹0'}</dd>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm text-gray-500">Loyalty Points</dt>
                        <dd className="text-2xl font-bold text-amber-600">{customer.loyaltyPoints || 0}</dd>
                      </div>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Order Status Breakdown</dt>
                      <dd className="space-y-2 mt-2">
                        {['delivered', 'cancelled', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'payment_pending', 'payment_verification_pending'].map(status => {
                          const count = orders.filter(o => o.status === status).length;
                          if (count === 0) return null;
                          return (
                            <div key={status} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-900">{count}</span>
                            </div>
                          );
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order History ({orders.length})</h3>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="card p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)} • {order.items.length} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className={`badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                          <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Addresses ({addresses.length})</h3>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved addresses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="card p-4 border-l-4 border-green-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">{address.label}</span>
                            {address.isDefault && <span className="badge-success">Default</span>}
                          </div>
                          <p className="font-medium text-gray-900">{address.fullName}</p>
                          <p className="text-sm text-gray-600">{address.phone}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.houseNumber}, {address.street}, {address.area}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city} - {address.pincode}, {address.state}
                          </p>
                          {address.landmark && (
                            <p className="text-sm text-gray-500 mt-1">Landmark: {address.landmark}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { formatCurrency, formatDate } from '../utils/helpers';