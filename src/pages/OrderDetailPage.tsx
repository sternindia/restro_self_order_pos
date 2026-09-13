import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  AlertCircle,
  Utensils,
  Table2,
  Users,
  Plus,
  Minus,
  Edit2,
  Trash2,
  FileText,
  Wallet,
  Check,
  Save,
  MoreVertical,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import DesktopLayout from '../components/DesktopLayout';
import { printThermalReceiptDirect } from '../components/ReceiptBillPrint';
import MobileOrderDetailsPage from '../mobileview/MobileOrderDetailsPage';

export const OrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlOrderId = queryParams.get('id') || queryParams.get('order_id');

  const savedUser = localStorage.getItem('emenu_user');
  const userObj = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (userObj?.role_alias || userObj?.role || '').toLowerCase();
  const isSuperAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';
  const isSelfPosBilling =
    roleAlias === 'self_billing_pos' ||
    roleAlias === 'self_pos_billing' ||
    roleAlias === 'self-pos-billing' ||
    isSuperAdmin;

  const [order, setOrder] = useState<any>(() => {
    if (location.state?.order) return location.state.order;
    const saved = localStorage.getItem('emenu_last_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!urlOrderId || String(parsed.order_id) === String(urlOrderId)) return parsed;
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!order);
  const [posSettings, setPosSettings] = useState<any>(() => {
    const saved = localStorage.getItem('emenu_pos_settings');
    return saved ? JSON.parse(saved) : null;
  });

  // Interactive desktop view state
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [orderStatusStep, setOrderStatusStep] = useState<number>(1);
  const [discountAmountState, setDiscountAmountState] = useState<number>(0);
  const [isPaidState, setIsPaidState] = useState<boolean>(false);
  const [paymentMethodState, setPaymentMethodState] = useState<string>('');
  const [showAddNoteInput, setShowAddNoteInput] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrderAndSettings = async () => {
      try {
        const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

        if (!posSettings) {
          const sRes = await fetch(`${API_BASE_URL}/settings/pos/${restaurantId}`).catch(() => null);
          if (sRes && sRes.ok) {
            const data = await sRes.json();
            const settings = data?.data || data;
            setPosSettings(settings);
            localStorage.setItem('emenu_pos_settings', JSON.stringify(settings));
          }
        }

        if (urlOrderId) {
          const oRes = await fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null);
          if (oRes && oRes.ok) {
            const data = await oRes.json();
            const rawOrders = Array.isArray(data) ? data : data?.data || [];
            const cleanTarget = String(urlOrderId).replace(/^#/i, '').trim();
            const found = rawOrders.find(
              (o: any) => String(o.order_id).replace(/^#/i, '').trim() === cleanTarget
            );

            if (found) {
              setOrder(found);
              localStorage.setItem('emenu_last_order', JSON.stringify(found));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndSettings();
  }, [urlOrderId]);

  useEffect(() => {
    if (order) {
      setOrderItems(order.items || order.order_items || []);
      setSpecialInstructions(order.special_instructions || order.notes || order.instruction || '');
      setInternalNotes(order.internal_notes || '');

      const rawStatus = (
        isSelfPosBilling
          ? "COMPLETED"
          : (order.resolved_status || order.order_status || order.status || order.payment_status || 'PENDING')
      ).toString().toUpperCase();

      if (rawStatus.includes('PREPAR') || rawStatus.includes('KITCHEN') || rawStatus.includes('PROCESS')) {
        setOrderStatusStep(2);
      } else if (rawStatus.includes('READY') || rawStatus.includes('SERVED') || rawStatus.includes('DISPATCH')) {
        setOrderStatusStep(3);
      } else if (rawStatus.includes('COMPLET') || rawStatus.includes('PAID') || rawStatus.includes('CLOSED')) {
        setOrderStatusStep(4);
      } else {
        setOrderStatusStep(1);
      }

      setIsPaidState(rawStatus.includes('COMPLET') || rawStatus.includes('PAID') || rawStatus.includes('CLOSED'));
      setDiscountAmountState(Number(order.bill?.discount_amount || order.discount || order.discount_amount || 0));
      setPaymentMethodState(order.bill?.payment_method || order.payment_method || '');
    }
  }, [order, isSelfPosBilling]);

  const subtotal = orderItems.length > 0
    ? orderItems.reduce((acc, it) => {
        const q = Number(it.quantity || it.qty || 1);
        const u = Number(it.unit_price || it.price || (it.total_price ? it.total_price / q : 0));
        return acc + u * q;
      }, 0)
    : Number(order?.bill?.subtotal ?? order?.subtotal ?? 0);

  const discountAmount = discountAmountState > 0
    ? discountAmountState
    : Number(order?.bill?.discount_amount ?? order?.discount_amount ?? order?.discount ?? 0);

  const serviceCharge = Number(order?.bill?.service_charge ?? order?.service_charge ?? order?.serviceCharge ?? 0);

  const taxRatePercent = parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5);

  const totalTax = (order?.bill?.tax_amount !== undefined && orderItems.length === order?.items?.length)
    ? Number(order.bill.tax_amount)
    : Math.max(0, ((subtotal - discountAmount) * taxRatePercent) / 100);

  const cgstAmt = Number(order?.bill?.cgst_amount ?? (totalTax / 2));
  const sgstAmt = Number(order?.bill?.sgst_amount ?? (totalTax / 2));

  const grandTotal = Number(
    order?.bill?.grand_total ??
    order?.grand_total ??
    order?.total ??
    Math.max(0, subtotal - discountAmount + serviceCharge + totalTax)
  );

  const balanceDue = isPaidState ? 0 : grandTotal;

  const cleanDate = order?.created_at || order?.time || order?.date
    ? new Date(order.created_at || order.time || order.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'N/A';

  const handleQtyChange = (idx: number, delta: number) => {
    setOrderItems((prev) => {
      const next = [...prev];
      const currentQty = Number(next[idx].quantity || next[idx].qty || 1);
      const newQty = Math.max(1, currentQty + delta);
      const unitPrice = Number(next[idx].unit_price || next[idx].price || 0);
      next[idx] = {
        ...next[idx],
        quantity: newQty,
        qty: newQty,
        total_price: unitPrice * newQty,
      };
      return next;
    });
  };

  const handleDeleteItem = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePrint = () => {
    if (!order) return;
    printThermalReceiptDirect({
      orderId: order.order_id,
      dateStr: cleanDate,
      tableName: order.table_name || order.table || 'Walk-In',
      staffName: order.staff_name || order.order_meta?.staff_name || 'Staff',
      guestName: order.customer_name || order.guest_name || '',
      items: (orderItems || []).map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity || i.qty || 1),
        unit_price: Number(i.unit_price || i.price || 0),
        total_price: Number(i.total_price || 0),
      })),
      subtotal: subtotal,
      taxRate: taxRatePercent,
      cgstAmt: cgstAmt,
      sgstAmt: sgstAmt,
      serviceChargeRate: 0,
      serviceChargeAmt: serviceCharge,
      grandTotal: grandTotal,
      restaurantInfo: {
        name: posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'Big Ben Restaurant',
        address: posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel',
        city: posSettings?.city || posSettings?.restaurant_info?.city || 'Mumbai',
        state: posSettings?.state || posSettings?.restaurant_info?.state || 'MH',
        pincode: posSettings?.pincode || posSettings?.restaurant_info?.pincode || '400013',
        gstin: posSettings?.gstin || posSettings?.restaurant_info?.gstin || '',
        fssai: posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || '',
      },
    });
  };

  const handleRecordPayment = () => {
    setIsPaidState(true);
    if (!paymentMethodState) setPaymentMethodState('Cash');
  };

  const handleAddDiscountPrompt = () => {
    const val = prompt('Enter discount amount (₹):', String(discountAmountState));
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        setDiscountAmountState(num);
      }
    }
  };

  const syncOrderStatusToBackend = async (targetStatus: string) => {
    if (!order) return;
    const targetOrderId = order.order_id || order.id;
    if (!targetOrderId) return;

    try {
      const tableIdNum = order.table_number_id ? parseInt(String(order.table_number_id)) : null;
      const updatePayload = {
        order_status: targetStatus,
        status: targetStatus,
        table_number_id: tableIdNum,
      };

      let response = await fetch(`${API_BASE_URL}/order/update-status/${targetOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        await fetch(`${API_BASE_URL}/order/update-status/${targetOrderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
      }
    } catch (err) {
      console.warn('Failed to update status on server:', err);
    }
  };

  const handleNextStatusStep = async () => {
    if (orderStatusStep < 4) {
      const nextStep = orderStatusStep + 1;
      setOrderStatusStep(nextStep);
      const nextStatusName = nextStep === 4 ? 'COMPLETED' : nextStep === 3 ? 'READY' : 'PREPARING';
      
      if (nextStep === 4) {
        setIsPaidState(true);
      }

      const updated = {
        ...order,
        order_status: nextStatusName,
        resolved_status: nextStatusName,
        bill: {
          ...(order.bill || {}),
          payment_status: nextStep === 4 ? 'PAID' : (order.bill?.payment_status || 'PENDING'),
        },
      };
      setOrder(updated);
      localStorage.setItem('emenu_last_order', JSON.stringify(updated));

      // Persist to backend server so TablesPage & HistoryPage reflect it immediately
      await syncOrderStatusToBackend(nextStatusName);
    }
  };

  const handleSaveOrder = async () => {
    if (!order) return;
    const statusName = orderStatusStep === 4 ? 'COMPLETED' : orderStatusStep === 3 ? 'READY' : orderStatusStep === 2 ? 'PREPARING' : 'NEW';
    const updated = {
      ...order,
      items: orderItems,
      special_instructions: specialInstructions,
      internal_notes: internalNotes,
      order_status: statusName,
      resolved_status: statusName,
      discount: discountAmountState,
      bill: {
        ...(order.bill || {}),
        subtotal: subtotal,
        tax_amount: totalTax,
        grand_total: grandTotal,
        payment_method: paymentMethodState || 'Cash',
      },
    };
    setOrder(updated);
    localStorage.setItem('emenu_last_order', JSON.stringify(updated));

    await syncOrderStatusToBackend(statusName);
    alert('Order details saved successfully!');
  };

  const handleCancelOrder = async () => {
    setOrderStatusStep(1);
    const updated = { ...order, order_status: 'CANCELLED', resolved_status: 'CANCELLED' };
    setOrder(updated);
    localStorage.setItem('emenu_last_order', JSON.stringify(updated));

    // Persist CANCELLED to backend server so table frees up & history shows cancelled
    await syncOrderStatusToBackend('CANCELLED');
    navigate('/history');
  };

  if (loading) {
    return (
      <DesktopLayout activePage="History">
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-3 border-[#ff4b1f] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Loading Order Details...</p>
        </div>
      </DesktopLayout>
    );
  }

  if (!order) {
    return (
      <DesktopLayout activePage="History">
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Order Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-sm">We couldn't locate details for this order. It may have been archived or removed.</p>
          <button
            onClick={() => navigate('/history')}
            className="px-5 py-2.5 bg-[#ff4b1f] hover:bg-[#ed3f16] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Return to Order History
          </button>
        </div>
      </DesktopLayout>
    );
  }

  const rawOrdStatus = (
    isSelfPosBilling
      ? "COMPLETED"
      : (order?.resolved_status || order?.order_status || order?.status || '')
  ).toString().toUpperCase();

  const isCancelledOrder = rawOrdStatus.includes('CANCEL') || rawOrdStatus.includes('REJECT');
  const isCompletedOrCancelled = isCancelledOrder || orderStatusStep === 4 || isPaidState;

  const getStepButtonLabel = () => {
    if (isCancelledOrder) return 'Order Cancelled';
    if (orderStatusStep === 1) return 'Mark as Preparing';
    if (orderStatusStep === 2) return 'Mark as Ready';
    if (orderStatusStep === 3) return 'Complete Order';
    return 'Order Completed';
  };

  const statusPillText = isCancelledOrder
    ? 'Cancelled'
    : orderStatusStep === 1
    ? (rawOrdStatus === 'PENDING' ? 'Pending' : 'New Order')
    : orderStatusStep === 2
    ? 'Preparing'
    : orderStatusStep === 3
    ? 'Ready'
    : 'Completed';

  return (
    <>
      {/* Mobile View Render */}
      <div className="md:hidden">
        <MobileOrderDetailsPage
          order={order}
          onBack={() => navigate('/history')}
          onPrint={handlePrint}
          onUpdateStatus={() => handleNextStatusStep()}
          onCancelOrder={handleCancelOrder}
        />
      </div>

      {/* Desktop View Render - Matching Exact Mockup */}
      <div className="hidden md:block bg-[#f8f9fc] dark:bg-[#121217] min-h-screen pb-20">
        <DesktopLayout activePage="Orders">
          <div className="w-full px-5 py-4 space-y-4">

            {/* Navigation Header Row */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium hover:border-slate-300 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Orders</span>
              </button>

              <div className="flex items-center gap-2">
                {!isCompletedOrCancelled && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print KOT</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print Bill</span>
                    </button>
                  </>
                )}
                <button
                  className="p-1.5 bg-white dark:bg-[#1c1c24] border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-50 transition cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>

            {/* Order Header & Status Stepper */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#1c1c24] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    Order #{order.order_id || order.id || ''}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    isCancelledOrder
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200/60'
                      : orderStatusStep === 4
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200/60'
                      : 'bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] border-orange-200/60'
                  }`}>
                    {statusPillText}
                  </span>
                </div>
                <p className="text-[11.5px] font-normal text-slate-500 dark:text-zinc-400 mt-0.5">
                  Placed on {cleanDate}
                </p>
              </div>

              {/* Status Stepper */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[
                  { step: 1, label: 'New' },
                  { step: 2, label: 'Preparing' },
                  { step: 3, label: 'Ready' },
                  { step: 4, label: 'Completed' },
                ].map((s) => {
                  const isActive = orderStatusStep === s.step;
                  const isDone = orderStatusStep > s.step;

                  return (
                    <button
                      key={s.step}
                      disabled={isCompletedOrCancelled}
                      onClick={() => !isCompletedOrCancelled && setOrderStatusStep(s.step)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                        isCompletedOrCancelled
                          ? isActive
                            ? 'bg-slate-700 text-white cursor-not-allowed opacity-80'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
                          : isActive
                          ? 'bg-[#ff4b1f] text-white shadow-xs cursor-pointer'
                          : isDone
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer'
                          : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/60 cursor-pointer'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isActive
                            ? 'bg-white text-[#ff4b1f]'
                            : 'bg-slate-300 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {s.step}
                      </span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Metadata Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#1c1c24] p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center shrink-0">
                  <Utensils size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white leading-snug">
                    {order.order_meta?.order_type || order.order_type || 'Dine In'}
                  </h4>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Order Type</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1c1c24] p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center shrink-0">
                  <Table2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white leading-snug">
                    {order.table_name || order.table || (order.table_number ? `Table ${order.table_number}` : 'Walk-In')}
                  </h4>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Table No.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1c1c24] p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white leading-snug">
                    {order.guests || order.no_of_guests || order.guest_count || 1}
                  </h4>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">No. of Guests</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1c1c24] p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white leading-snug truncate">
                    {order.customer_name || order.guest_name || 'Walk-in Customer'}
                  </h4>
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Customer</p>
                </div>
              </div>
            </div>

            {/* Main Content Layout: Items & Financial Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Left Column: Items Table & Special Instructions (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">

                {/* Items Card */}
                <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Items ({orderItems.length})
                    </h3>
                    {!isCompletedOrCancelled && (
                      <button
                        onClick={() => navigate('/menu')}
                        className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-[#ff4b1f] rounded-xl text-xs font-medium transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Items</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10.5px] font-medium uppercase text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800 pb-2">
                          <th className="pb-2.5 w-8">#</th>
                          <th className="pb-2.5">Item</th>
                          <th className="pb-2.5 text-center">Qty</th>
                          <th className="pb-2.5 text-right">Price</th>
                          <th className="pb-2.5 text-right">Total</th>
                          {!isCompletedOrCancelled && (
                            <th className="pb-2.5 text-center w-20">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs">
                        {orderItems.map((it: any, idx: number) => {
                          const q = Number(it.quantity || it.qty || 1);
                          const uPrice = Number(it.unit_price || it.price || (it.total_price ? it.total_price / q : 0));
                          const tPrice = Number(it.total_price || uPrice * q);
                          const imgUrl = it.image || it.image_url || it.item_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80';

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition">
                              <td className="py-3 text-slate-400 dark:text-zinc-500 font-normal">
                                {idx + 1}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-zinc-700">
                                    <img
                                      src={imgUrl}
                                      alt={it.name || it.item_name || 'Food item'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/default_image.png';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-normal text-slate-800 dark:text-zinc-100">
                                      {it.name || it.item_name}
                                    </p>
                                    <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">
                                      {it.selectedVariant?.name || it.variant || it.portion || '1 Portion'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-center font-normal text-slate-800 dark:text-white">
                                {isCompletedOrCancelled ? (
                                  <span>×{q}</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-1 border border-slate-200 dark:border-zinc-700 rounded-lg p-0.5 max-w-[76px] mx-auto bg-slate-50/50 dark:bg-zinc-800/40">
                                    <button
                                      onClick={() => handleQtyChange(idx, -1)}
                                      className="w-4.5 h-4.5 flex items-center justify-center rounded text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <span className="font-normal text-slate-800 dark:text-white text-xs w-4 text-center">
                                      {q}
                                    </span>
                                    <button
                                      onClick={() => handleQtyChange(idx, 1)}
                                      className="w-4.5 h-4.5 flex items-center justify-center rounded text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-right font-normal text-slate-700 dark:text-zinc-300">
                                ₹{uPrice.toFixed(2)}
                              </td>
                              <td className="py-3 text-right font-normal text-slate-900 dark:text-white">
                                ₹{tPrice.toFixed(2)}
                              </td>
                              {!isCompletedOrCancelled && (
                                <td className="py-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        const newName = prompt('Edit item name:', it.name || it.item_name);
                                        if (newName) {
                                          setOrderItems((prev) => {
                                            const next = [...prev];
                                            next[idx] = { ...next[idx], name: newName };
                                            return next;
                                          });
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                                      title="Edit Item"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(idx)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                                      title="Remove Item"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Special Instructions Card */}
                <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <span>Special Instructions</span>
                    </div>
                    {!isCompletedOrCancelled && (
                      <button
                        onClick={() => setShowAddNoteInput((prev) => !prev)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Note</span>
                      </button>
                    )}
                  </div>

                  {showAddNoteInput ? (
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Add any specific instructions from the customer..."
                      className="w-full h-24 p-3 text-xs bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#ff4b1f]"
                    />
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-xs text-slate-500 dark:text-zinc-400">
                      {specialInstructions || 'No special instructions added.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary, Payment Status & Internal Notes (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">

                {/* Order Summary Card */}
                <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] flex items-center justify-center">
                      <Receipt size={15} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Order Summary
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                      <span>Subtotal ({orderItems.length} items)</span>
                      <span className="font-normal text-slate-900 dark:text-white">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>Discount</span>
                        {!isCompletedOrCancelled && (
                          <button
                            onClick={handleAddDiscountPrompt}
                            className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#ff4b1f] text-[10.5px] font-medium hover:bg-orange-100 transition cursor-pointer"
                          >
                            + Add Discount
                          </button>
                        )}
                      </div>
                      <span className="font-normal text-emerald-600 dark:text-emerald-400">
                        {discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : `₹0.00`}
                      </span>
                    </div>

                    {/* Service Charge */}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                        <span>Service Charge</span>
                        <span className="font-normal text-slate-900 dark:text-white">
                          +₹{serviceCharge.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Tax Breakdown */}
                    {totalTax > 0 ? (
                      <>
                        <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400 text-[11px]">
                          <span>CGST ({taxRatePercent / 2}%)</span>
                          <span>+₹{cgstAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400 text-[11px]">
                          <span>SGST ({taxRatePercent / 2}%)</span>
                          <span>+₹{sgstAmt.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                        <span>Taxes ({taxRatePercent}%)</span>
                        <span className="font-normal text-slate-900 dark:text-white">₹0.00</span>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-orange-50/50 dark:bg-orange-950/20 p-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Total Amount</span>
                      <span className="text-base font-bold text-[#ff4b1f]">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Status Card */}
                <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-xs">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                        <Wallet size={15} />
                      </div>
                      <span className="font-semibold">Payment Status</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isPaidState
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      }`}
                    >
                      {isPaidState ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                      <span>Payment Method</span>
                      <span className="font-normal text-slate-800 dark:text-zinc-200">
                        {paymentMethodState || order?.bill?.payment_method || order?.payment_method || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                      <span>Amount Paid</span>
                      <span className="font-normal text-slate-800 dark:text-zinc-200">
                        ₹{(isPaidState ? grandTotal : 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="font-normal text-slate-800 dark:text-zinc-200">Balance Due</span>
                      <span className="font-medium text-rose-600 text-xs">
                        ₹{balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!isPaidState && (
                    <button
                      onClick={handleRecordPayment}
                      className="w-full py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>

               

              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-white dark:bg-[#1c1c24] border border-slate-200/80 dark:border-zinc-800 p-3 rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <button
                onClick={() => !isCompletedOrCancelled && setShowCancelModal(true)}
                disabled={isCompletedOrCancelled}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
                  isCompletedOrCancelled
                    ? 'bg-slate-100 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/50 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
                    : 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border-rose-200/80 text-rose-600 cursor-pointer'
                }`}
              >
                <Trash2 size={14} />
                <span>Cancel Order</span>
              </button>

              <div className="flex items-center gap-2.5">
                {!isCompletedOrCancelled && (
                  <button
                    onClick={handleSaveOrder}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 text-xs font-medium transition cursor-pointer shadow-2xs"
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                )}
                <button
                  onClick={() => !isCompletedOrCancelled && handleNextStatusStep()}
                  disabled={isCompletedOrCancelled}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition shadow-xs ${
                    isCompletedOrCancelled
                      ? 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-not-allowed opacity-70 border border-slate-300 dark:border-zinc-700'
                      : 'bg-[#ff4b1f] hover:bg-[#ed3f16] text-white cursor-pointer'
                  }`}
                >
                  <Check size={14} />
                  <span>{getStepButtonLabel()}</span>
                </button>
              </div>
            </div>

          </div>
        </DesktopLayout>
      </div>

      {/* Cancel Order Confirmation Modal (Exact UI from Design) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-[370px] bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800/80 p-6 sm:p-7 text-center overflow-hidden">
            {/* Soft pink corner decorative glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-100/60 dark:bg-red-950/30 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/80 dark:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            {/* Centered Trash Icon with decorative rays */}
            <div className="relative mx-auto mb-4 flex items-center justify-center w-20 h-20">
              {/* Left decorative rays */}
              <div className="absolute -left-1 flex flex-col gap-1.5 opacity-80">
                <span className="w-2.5 h-[2.5px] bg-[#ef4444] rounded-full rotate-[-25deg]" />
                <span className="w-3.5 h-[2.5px] bg-[#ef4444] rounded-full rotate-[15deg]" />
              </div>

              {/* Icon Circle */}
              <div className="w-16 h-16 rounded-full bg-[#fef2f2] dark:bg-red-950/40 flex items-center justify-center text-[#ef4444] shadow-sm">
                <Trash2 size={28} strokeWidth={2.2} />
              </div>

              {/* Right decorative rays */}
              <div className="absolute -right-1 flex flex-col gap-1.5 opacity-80">
                <span className="w-2.5 h-[2.5px] bg-[#ef4444] rounded-full rotate-[25deg]" />
                <span className="w-3.5 h-[2.5px] bg-[#ef4444] rounded-full rotate-[-15deg]" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
              Cancel Order?
            </h3>

            {/* Subtitle */}
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6">
              Order #{order.order_id || order.id || ''} will be cancelled.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="h-[44px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer active:scale-95"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  handleCancelOrder();
                }}
                className="h-[44px] rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold transition cursor-pointer shadow-md shadow-red-500/20 active:scale-95"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailPage;
