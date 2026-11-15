import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Download,
  Truck,
  Package,
  DollarSign,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';
import { Order, OrderItem, Payment } from '../types';
import { formatCurrency, formatDate, getStatusLabel, getPaymentStatusLabel } from '../utils/helpers';
import toast from 'react-hot-toast';

const statusOptions = [
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
  { value: 'pending', label: 'Pending' },
  { value: 'verification_pending', label: 'Verification Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
];

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [paymentAction, setPaymentAction] = useState<'confirm' | 'reject'>('confirm');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrderById(id!);
        setOrder(data);
      } catch (error) {
        toast.error('Failed to load order');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    
    setUpdating(true);
    try {
      await api.updateOrderStatus(order!.id, selectedStatus, statusNotes);
      toast.success('Order status updated');
      setShowStatusModal(false);
      const data = await api.getOrderById(order!.id);
      setOrder(data);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentVerify = async () => {
    setVerifying(true);
    try {
      await api.verifyPayment(order!.id, paymentAction, rejectionReason);
      toast.success(paymentAction === 'confirm' ? 'Payment confirmed' : 'Payment rejected');
      setShowPaymentModal(false);
      const data = await api.getOrderById(order!.id);
      setOrder(data);
    } catch (error) {
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      handleStatusChange('cancelled');
    }
  };

  const handleDownloadInvoice = async () => {
    // This would generate and download a PDF invoice
    toast.success('Invoice download started');
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="btn-primary mt-4">Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadInvoice} className="btn-outline" disabled={!order}>
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
          <div className="flex items-center gap-2">
            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className={`badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{order.customerEmail || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Delivery Address
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{order.address?.fullName}</p>
              <p className="text-gray-600">{order.address?.phone}</p>
              <p className="text-gray-600">
                {order.address?.houseNumber}, {order.address?.street}, {order.address?.area}
              </p>
              <p className="text-gray-600">
                {order.address?.city} - {order.address?.pincode}, {order.address?.state}
              </p>
              {order.address?.landmark && (
                <p className="text-sm text-gray-500">Landmark: {order.address.landmark}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Order Items ({order.items.length})
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.productImageUrl ? (
                      <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      ×{item.quantity} {item.unit} • {formatCurrency(item.unitPrice)} each
                    </p>
                    {item.discountPercentage > 0 && (
                      <span className="badge-warning text-xs">{item.discountPercentage}% OFF</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Price Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({order.items.length} items)</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium text-gray-900">{order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {order.payment && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900 capitalize">{order.payment.method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-green-600 text-lg">{formatCurrency(order.payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium text-gray-900">
                    <span className={`badge ${getPaymentStatusBadgeClass(order.payment.status)}`}>
                      {getPaymentStatusLabel(order.payment.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">UPI ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{order.payment.upiId}</p>
                </div>
                {order.payment.upiTransactionId && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">UTR Number</p>
                    <p className="font-medium text-gray-900 font-mono">{order.payment.upiTransactionId}</p>
                  </div>
                )}
                {order.payment.upiTransactionDate && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-medium text-gray-900">{formatDate(order.payment.upiTransactionDate)}</p>
                  </div>
                )}
                {order.payment.paymentScreenshotUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Payment Screenshot</p>
                    <img src={order.payment.paymentScreenshotUrl} alt="Payment Screenshot" className="mt-2 max-w-xs rounded-lg border" />
                  </div>
                )}
                {order.payment.rejectionReason && (
                  <div className="col-span-2 text-red-600">
                    <p className="text-sm text-gray-500">Rejection Reason</p>
                    <p className="font-medium">{order.payment.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Assignment */}
          {order.deliveryAssignment && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Delivery Assignment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Delivery Person</p>
                  <p className="font-medium text-gray-900">{order.deliveryAssignment.deliveryPerson?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{order.deliveryAssignment.deliveryPerson?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{order.deliveryAssignment.deliveryPerson?.vehicleType || 'N/A'} - {order.deliveryAssignment.deliveryPerson?.vehicleNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900 capitalize">{order.deliveryAssignment.status.replace('_', ' ')}</p>
                </div>
                {order.deliveryAssignment.pickedUpAt && (
                  <div>
                    <p className="text-sm text-gray-500">Picked Up</p>
                    <p className="font-medium text-gray-900">{formatDate(order.deliveryAssignment.pickedUpAt)}</p>
                  </div>
                )}
                {order.deliveryAssignment.outForDeliveryAt && (
                  <div>
                    <p className="text-sm text-gray-500">Out for Delivery</p>
                    <p className="font-medium text-gray-900">{formatDate(order.deliveryAssignment.outForDeliveryAt)}</p>
                  </div>
                )}
                {order.deliveryAssignment.deliveredAt && (
                  <div>
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="font-medium text-gray-900">{formatDate(order.deliveryAssignment.deliveredAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedStatus(order.status);
                  setStatusNotes('');
                  setShowStatusModal(true);
                }}
                className="btn-outline w-full justify-start"
              >
                <RefreshCw className="w-4 h-4" />
                Update Status
              </button>
              
              {order.paymentStatus === 'verification_pending' && (
                <button
                  onClick={() => {
                    setPaymentAction('confirm');
                    setRejectionReason('');
                    setShowPaymentModal(true);
                  }}
                  className="btn-warning w-full justify-start"
                >
                  <CreditCard className="w-4 h-4" />
                  Verify Payment
                </button>
              )}
              
              {['confirmed', 'preparing', 'ready_for_delivery'].includes(order.status) && (
                <button
                  onClick={() => handleStatusChange('out_for_delivery')}
                  className="btn-secondary w-full justify-start"
                >
                  <Truck className="w-4 h-4" />
                  Mark Out for Delivery
                </button>
              )}
              
              {order.status === 'out_for_delivery' && (
                <button
                  onClick={() => handleStatusChange('delivered')}
                  className="btn-success w-full justify-start"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Delivered
                </button>
              )}
              
              {['payment_pending', 'confirmed', 'preparing'].includes(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  className="btn-danger w-full justify-start"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {[
                { status: 'payment_pending', label: 'Order Placed', time: order.createdAt, completed: true },
                { status: 'payment_verification_pending', label: 'Payment Verification', time: order.payment?.upiTransactionDate, completed: order.paymentStatus !== 'pending' },
                { status: 'confirmed', label: 'Order Confirmed', time: order.confirmedAt, completed: order.status !== 'payment_pending' && order.status !== 'payment_verification_pending' },
                { status: 'preparing', label: 'Preparing', time: null, completed: ['preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered'].includes(order.status) },
                { status: 'ready_for_delivery', label: 'Ready for Delivery', time: null, completed: ['ready_for_delivery', 'out_for_delivery', 'delivered'].includes(order.status) },
                { status: 'out_for_delivery', label: 'Out for Delivery', time: order.deliveryAssignment?.outForDeliveryAt, completed: ['out_for_delivery', 'delivered'].includes(order.status) },
                { status: 'delivered', label: 'Delivered', time: order.deliveredAt, completed: order.status === 'delivered' },
              ].map((step, index) => (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center
                      ${step.completed ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}
                    `}>
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    {index < 6 && (
                      <div className="absolute left-3 top-8 bottom-8 w-0.5 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-sm text-gray-500">{formatDate(step.time)}</p>
                    )}
                    {!step.time && !step.completed && (
                      <p className="text-sm text-gray-400">Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';