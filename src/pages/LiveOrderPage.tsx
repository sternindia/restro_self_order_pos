import React, { useEffect, useState } from 'react';
import {
  Receipt,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Printer,
  Eye,
  Search,
  Calendar,
  X,
  Info,
  CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import DesktopLayout from '../components/DesktopLayout';
import { printThermalReceiptDirect } from '../components/ReceiptBillPrint';
import ReceiptModal from '../components/ReceiptModal';
import MobileLiveOrderPage from '../mobileview/MobileLiveOrderPage';
import MobileOrderDetailsPage from '../mobileview/MobileOrderDetailsPage';

function HistoryStatusBadge({ status }: { status: string }) {
  const st = (status || '').toUpperCase();
  const isPaid = st === 'PAID' || st === 'COMPLETED';
  const isCancelled = st === 'CANCELLED' || st === 'REJECTED';

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }

  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {st || 'Pending'}
    </span>
  );
}

interface OrderHistoryItem {
  order_id: string;
  table_name: string;
  table_number_id: string;
  order_status: string;
  created_at: string;
  guest_name?: string;
  phone?: string;
  resolved_status?: string;
  order_type?: string;
  staff_name?: string;
  order_meta?: {
    order_type?: string;
    staff_name?: string;
    table_number?: string;
    staff_id?: string;
    staff_role?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  bill?: {
    subtotal: number;
    tax_amount: number;
    service_charge: number;
    discount_amount: number;
    grand_total: number;
    payment_status: string;
    bill_status: string;
    bill_number?: string;
    payment_method?: string;
  };
}

const LiveOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('emenu_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isWaiter = roleAlias === 'waiter';
  const isSuperAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';
  const isSelfPosBilling = roleAlias === 'self_billing_pos' || roleAlias === 'self_pos_billing' || roleAlias === 'self-pos-billing' || isSuperAdmin;

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'COMPLETED' | 'PENDING' | 'CANCELLED'>('PENDING');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedDesktopDetailOrder, setSelectedDesktopDetailOrder] = useState<any>(null);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, startDate, endDate, search]);

  // 1. Compute Base Orders (Role + Date Range Filters applied)
  const baseOrders = React.useMemo(() => {
    return orders.filter((order: any) => {
      const orderType = (order.order_meta?.order_type || order.order_type || '').toUpperCase();
      const tableNum = String(order.order_meta?.table_number || order.table_name || '').toLowerCase();
      const staffName = String(order.order_meta?.staff_name || order.staff_name || '').toLowerCase();
      const orderStaffRole = (order.order_meta?.staff_role || order.staff_role || (staffName.includes('waiter') ? 'waiter' : '')).toLowerCase();
      const isCounterOrder = orderType === 'TAKEAWAY' || tableNum.includes('counter') || staffName.includes('self pos') || staffName.includes('counter');

      // 1. Waiter Role: Show ONLY orders created by Waiter
      if (isWaiter) {
        if (isCounterOrder) return false;
        const currentStaffId = String(currentUser?.id || currentUser?.user_id || currentUser?.staff_id || '');
        const orderStaffId = String(order.order_meta?.staff_id || order.staff_id || order.waiter_id || '');
        if (currentStaffId && orderStaffId && orderStaffId !== currentStaffId) {
          return false;
        }
      }

      // 2. Admin / Counter POS Billing: Show ONLY orders created by Admin / Counter POS (exclude Waiter table orders)
      if (isSuperAdmin || isSelfPosBilling) {
        if (orderStaffRole === 'waiter' || (!isCounterOrder && staffName.includes('waiter'))) {
          return false;
        }
      }

      // Date Range Filter (Between Dates)
      const dateStr = order.created_at || '';
      const orderDate = new Date(dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }

      // Preset Date Filter (only if custom date inputs are empty)
      if (!startDate && !endDate && dateFilter !== 'ALL') {
        const today = new Date();

        if (dateFilter === 'TODAY') {
          const isSameDay = 
            orderDate.getDate() === today.getDate() &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();
          if (!isSameDay) return false;
        }

        if (dateFilter === 'YESTERDAY') {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          const isYesterday = 
            orderDate.getDate() === yesterday.getDate() &&
            orderDate.getMonth() === yesterday.getMonth() &&
            orderDate.getFullYear() === yesterday.getFullYear();
          if (!isYesterday) return false;
        }

        if (dateFilter === 'THIS_WEEK') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          if (orderDate < oneWeekAgo) return false;
        }

        if (dateFilter === 'THIS_MONTH') {
          const isThisMonth = 
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [orders, isWaiter, isSuperAdmin, isSelfPosBilling, currentUser, startDate, endDate, dateFilter]);

  // 2. Compute dynamic Counts from baseOrders (Matches actual visible records 100%)
  const counts = React.useMemo(() => {
    const comp = baseOrders.filter((o: any) => {
      const st = (o.resolved_status || o.order_status || '').toUpperCase();
      const p = (o.bill?.payment_status || '').toUpperCase();
      return st === 'COMPLETED' || st === 'PAID' || p === 'PAID';
    });
    const pend = baseOrders.filter((o: any) => {
      const st = (o.resolved_status || o.order_status || '').toUpperCase();
      const p = (o.bill?.payment_status || '').toUpperCase();
      return st !== 'COMPLETED' && st !== 'PAID' && p !== 'PAID' && st !== 'CANCELLED' && st !== 'REJECTED';
    });
    const canc = baseOrders.filter((o: any) => {
      const st = (o.resolved_status || o.order_status || '').toUpperCase();
      return st === 'CANCELLED' || st === 'REJECTED';
    });
    const rev = comp.reduce((s: number, o: any) => s + Number(o.bill?.grand_total || 0), 0);

    return {
      all: baseOrders.length,
      completed: comp.length,
      pending: pend.length,
      cancelled: canc.length,
      revenue: rev,
    };
  }, [baseOrders]);

  // 3. Compute Filtered Orders (Applying Status Filter & Search)
  const filteredOrders = React.useMemo(() => {
    return baseOrders.filter((order: any) => {
      // Status Filter
      if (statusFilter !== 'ALL') {
        const status = (order.resolved_status || order.order_status || '').toUpperCase();
        const paymentStatus = (order.bill?.payment_status || '').toUpperCase();

        if (statusFilter === 'PAID' || statusFilter === 'COMPLETED') {
          const isPaid = status === 'PAID' || status === 'COMPLETED' || paymentStatus === 'PAID';
          if (!isPaid) return false;
        }

        if (statusFilter === 'PENDING') {
          const isPaid = status === 'PAID' || status === 'COMPLETED' || paymentStatus === 'PAID';
          const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
          if (isPaid || isCancelled) return false;
        }

        if (statusFilter === 'CANCELLED') {
          const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
          if (!isCancelled) return false;
        }
      }

      // Search Filter
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const orderId = String(order.order_id || '').toLowerCase();
        const table = String(order.table_name || '').toLowerCase();
        const guest = String(order.guest_name || '').toLowerCase();
        const phone = String(order.phone || '').toLowerCase();
        const items = (order.items || []).map((i: any) => i.name).join(' ').toLowerCase();

        const matches =
          orderId.includes(s) ||
          `#${orderId}`.includes(s) ||
          table.includes(s) ||
          guest.includes(s) ||
          phone.includes(s) ||
          items.includes(s);

        if (!matches) return false;
      }

      return true;
    });
  }, [baseOrders, statusFilter, search]);

  // Single Unified Calendar Modal State (Matches restaurant_pos 1-to-1)
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');

  const openCalendarModal = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    if (startDate) {
      setCalendarViewDate(new Date(startDate));
    } else {
      setCalendarViewDate(new Date());
    }
    setShowCalendarModal(true);
  };

  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayStr = getTodayStr();

  const handleDateClick = (dateStr: string) => {
    if (dateStr > todayStr) return;
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else if (tempStartDate && !tempEndDate) {
      if (dateStr >= tempStartDate) {
        setTempEndDate(dateStr);
      } else {
        setTempStartDate(dateStr);
        setTempEndDate('');
      }
    }
  };

  const applyCalendarRange = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate || tempStartDate);
    setShowCalendarModal(false);
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setTempStartDate('');
    setTempEndDate('');
  };

  const getCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: ({ dayNum: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      days.push({ dayNum: d, dateStr: `${yyyy}-${mm}-${dd}` });
    }
    return days;
  };

  const handleOpenOrderPlacedPage = (order: any) => {
    localStorage.setItem('emenu_last_order', JSON.stringify(order));
    navigate(`/order-detail?id=${order.order_id}`, { state: { order } });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const [posSettings, setPosSettings] = useState<any>(() => {
    const saved = localStorage.getItem('emenu_pos_settings');
    return saved ? JSON.parse(saved) : null;
  });
  const [isEnableTables, setIsEnableTables] = useState<boolean>(true);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedUser = localStorage.getItem('emenu_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

      const parseBool = (val: any, defaultVal: boolean = true) => {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') {
          const low = val.trim().toLowerCase();
          if (low === 'true' || low === '1') return true;
          if (low === 'false' || low === '0') return false;
        }
        return !!val;
      };

      const applySettings = (settingsData: any) => {
        if (!settingsData) return;
        setPosSettings(settingsData);
        const enableTablesVal = settingsData?.hardware_and_preferences?.is_enable_tables ?? settingsData?.is_enable_tables ?? settingsData?.isEnableTables;
        setIsEnableTables(parseBool(enableTablesVal, false));
      };

      const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
      if (savedSettingsStr) {
        try {
          applySettings(JSON.parse(savedSettingsStr));
        } catch { }
      }

      // Fetch orders from server
      const ordersRes = await fetch(`${API_BASE_URL}/orders/${restaurantId}`);

      let rawOrders: any[] = [];
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        rawOrders = Array.isArray(ordersData)
          ? ordersData
          : (Array.isArray(ordersData?.data) ? ordersData.data : (Array.isArray(ordersData?.orders) ? ordersData.orders : []));
      }

      // Merge local last order if present and missing from backend response
      const savedLast = localStorage.getItem('emenu_last_order');
      if (savedLast) {
        try {
          const parsedLast = JSON.parse(savedLast);
          if (parsedLast && parsedLast.order_id) {
            const exists = rawOrders.some((o: any) => String(o.order_id) === String(parsedLast.order_id));
            if (!exists) {
              rawOrders.unshift({
                order_id: String(parsedLast.order_id),
                table_name: parsedLast.table || 'Walk-In',
                guest_name: parsedLast.guest_name || 'Guest',
                phone: parsedLast.phone || '',
                order_status: parsedLast.order_status || 'PENDING',
                created_at: parsedLast.created_at || new Date().toISOString(),
                items: parsedLast.items || [],
                bill: {
                  subtotal: parsedLast.subTotal || 0,
                  tax_amount: parsedLast.tax || 0,
                  service_charge: parsedLast.serviceCharge || 0,
                  grand_total: parsedLast.total || 0,
                  payment_status: 'PAID'
                }
              });
            }
          }
        } catch (e) {
          console.warn('Failed to parse local last order for history:', e);
        }
      }

      // Use raw status from backend directly as requested by the user
      const resolvedOrders = rawOrders.map((order: any) => {
        return {
          ...order,
          resolved_status: (order.order_status || order.status || 'PENDING').toUpperCase()
        };
      });

      // Sort orders latest first
      resolvedOrders.sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setOrders(resolvedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders history:', err);
      setError(err.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);

  const handlePrintOrder = (order: any) => {
    const isThermalOn = posSettings?.enableThermalPrinting ?? posSettings?.enable_thermal_printing ?? true;
    if (isThermalOn) {
      const cleanDate = order.created_at 
        ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

      const items = (order.items || []).map((item: any) => {
        const q = parseInt(item.quantity || item.qty) || 1;
        const unitP = Number(item.unit_price || item.price || (item.total_price ? item.total_price / q : 0));
        return {
          name: item.name,
          quantity: q,
          price: unitP,
          total_price: Number(item.total_price || (unitP * q))
        };
      });
      
      const itemsSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const taxRate = parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5);
      const serviceChargeRate = parseFloat(posSettings?.financials?.service_charge_percentage ?? posSettings?.serviceCharge ?? 0);

      const subTotalNum = Number(order.bill?.subtotal ?? order.subTotal ?? order.subtotal ?? itemsSubtotal);
      const serviceAmt = Number(order.bill?.service_charge ?? order.serviceCharge ?? ((subTotalNum * serviceChargeRate) / 100));
      const taxTotal = Number(order.bill?.tax_amount ?? order.tax ?? ((subTotalNum * taxRate) / 100));
      const cgstAmt = taxTotal / 2;
      const sgstAmt = taxTotal / 2;
      const grandTotalNum = Number(order.bill?.grand_total ?? order.total ?? order.grand_total ?? (subTotalNum + serviceAmt + taxTotal));

      const printData = {
        orderId: order.order_id,
        dateStr: cleanDate,
        tableName: order.table_name || 'Walk-In',
        staffName: order.staff_name || 'Staff',
        guestName: order.guest_name,
        items: items,
        subtotal: subTotalNum,
        taxRate: taxRate,
        cgstAmt: cgstAmt,
        sgstAmt: sgstAmt,
        serviceChargeRate: serviceChargeRate,
        serviceChargeAmt: serviceAmt,
        grandTotal: grandTotalNum,
        restaurantInfo: posSettings?.restaurantInfo || posSettings?.business_info || {
          name: posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'BIG BEN RESTAURANT',
          address: posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel',
          city: posSettings?.city || posSettings?.restaurant_info?.city || 'Mumbai',
          state: posSettings?.state || posSettings?.restaurant_info?.state || 'MH',
          pincode: posSettings?.pincode || posSettings?.restaurant_info?.pincode || '',
          gstin: posSettings?.gstin || posSettings?.restaurant_info?.gstin || '27AAAAA0000A1Z5',
          fssai: posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || '10019022009876'
        }
      };

      printThermalReceiptDirect(printData);
      return;
    }

    setSelectedHistoryOrder(order);
  };

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <>
      {/* MOBILE VIEW (< md) */}
      <div className="block md:hidden">
        <MobileLiveOrderPage
          orders={filteredOrders}
          loading={loading}
          onRefresh={fetchOrderHistory}
          onSelectOrder={(ord) => setSelectedHistoryOrder(ord)}
          onPrintOrder={handlePrintOrder}
          onOpenCalendar={openCalendarModal}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* DESKTOP VIEW (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Live Orders">
          <section className="px-5 py-4 flex-1">
            {/* Toolbar row — just Refresh, no redundant title */}
            <div className="mb-3.5 flex items-center justify-end">
              <button
                type="button"
                onClick={fetchOrderHistory}
                className="flex h-[34px] items-center gap-1.5 rounded-xl border border-[#e9e4df] dark:border-zinc-800 bg-white dark:bg-[#18181b] px-3 text-[13px] font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-[#ff4b1f]' : ''} />
                <span>Refresh</span>
              </button>
            </div>




            {/* Table Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#18181b] rounded-2xl border border-[#eee9e4] dark:border-zinc-800 shadow-xs">
                <RefreshCw size={28} className="animate-spin text-[#ff4b1f] mb-3" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium text-xs">Loading order records...</p>
              </div>
            ) : error ? (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-6 text-center text-rose-700 dark:text-rose-400 flex flex-col items-center shadow-xs">
                <AlertCircle size={32} className="mb-2 text-rose-500" />
                <p className="font-semibold text-sm">{error}</p>
                <button 
                  onClick={fetchOrderHistory} 
                  className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer"
                >
                  Reload History
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] border border-[#eee9e4] dark:border-zinc-800 rounded-2xl p-16 text-center text-gray-500 shadow-xs">
                <Receipt size={48} className="mx-auto mb-3 opacity-25 text-gray-400" />
                <p className="font-semibold text-base text-[#071B34] dark:text-white">No Orders Found</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto font-normal">
                  No order records match your selected filter criteria.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_6px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/90 dark:bg-zinc-900/60 border-b border-[#eee9e4] dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Order ID</th>
                        {isEnableTables && (
                          <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Table</th>
                        )}
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Total</th>
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-[12px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {paginatedOrders.map((order) => {
                        const isExpanded = !!expandedOrders[order.order_id];
                        const itemsSummary = (order.items || []).map((i: any) => `${i.name} x${i.quantity}`).join(', ');
                        
                        const cleanDate = order.created_at 
                          ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Date N/A';

                        return (
                          <React.Fragment key={order.order_id}>
                            <tr 
                              className={`hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none ${
                                isExpanded ? 'bg-slate-50/50 dark:bg-zinc-800/30' : ''
                              }`}
                              onClick={() => toggleExpand(order.order_id)}
                            >
                              <td className="px-4 py-3 text-[13px] font-semibold text-[#071B34] dark:text-white">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenOrderPlacedPage(order); }}
                                  className="text-[#071B34] dark:text-white hover:text-[#ff4b1f] hover:underline font-semibold cursor-pointer tracking-tight"
                                  title="Open Order Details Page"
                                >
                                  #{order.order_id}
                                </button>
                              </td>
                              {isEnableTables && (
                                <td className="px-4 py-3 text-[12px] font-medium whitespace-nowrap">
                                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-md text-[12px] font-medium shadow-2xs">
                                    {order.table_name || 'Walk-In'}
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-3 text-[12px] text-slate-600 dark:text-zinc-400 font-normal whitespace-nowrap">
                                {cleanDate}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-slate-700 dark:text-zinc-300 font-normal max-w-[200px] truncate" title={itemsSummary}>
                                {itemsSummary || '—'}
                              </td>
                              <td className="px-4 py-3 text-[14px] font-bold text-[#071B34] dark:text-white whitespace-nowrap">
                                ₹{Number(order.bill?.grand_total || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <HistoryStatusBadge status={isSelfPosBilling ? 'COMPLETED' : (order.resolved_status || 'PENDING')} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    className="p-1.5 hover:bg-emerald-100/70 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200/50 dark:border-emerald-800/40 cursor-pointer"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleOpenOrderPlacedPage(order);
                                    }}
                                    title="Open Order Details Page"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  {(() => {
                                    const st = (order.resolved_status || order.order_status || '').toUpperCase();
                                    const isDone = st === 'COMPLETED' || st === 'PAID' || st === 'CANCELLED' || st === 'REJECTED' || isSelfPosBilling;
                                    if (isDone) return null;
                                    return (
                                      <button 
                                        className="p-1.5 hover:bg-amber-100/70 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg transition-colors border border-amber-200/50 dark:border-amber-800/40 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
                                        title="Print Bill"
                                      >
                                        <Printer size={14} />
                                      </button>
                                    );
                                  })()}
                                  <button 
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(order.order_id); }}
                                    title={isExpanded ? "Collapse Details" : "Expand Details"}
                                  >
                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Order Detail Drawer */}
                            {isExpanded && (
                              <tr className="bg-[#fcfaf8] dark:bg-zinc-900/80">
                                <td colSpan={isEnableTables ? 7 : 6} className="p-4 sm:p-5 border-t border-[#eee9e4] dark:border-zinc-800">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">

                                    {/* Card 1: Ordered Items List Table */}
                                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-[#eee9e4] dark:border-zinc-800 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                                          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Receipt size={14} className="text-[#ff4b1f]" />
                                            <span>Ordered Items</span>
                                          </h4>
                                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                            {(order.items || []).length} items
                                          </span>
                                        </div>

                                        {/* Table Header */}
                                        <div className="grid grid-cols-[1fr_36px_60px_60px] text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800 pb-1 mb-1">
                                          <span>Item</span>
                                          <span className="text-center">Qty</span>
                                          <span className="text-right">Price</span>
                                          <span className="text-right">Total</span>
                                        </div>

                                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                                          {(order.items || []).map((it: any, idx: number) => {
                                            const q = Number(it.quantity || it.qty || 1);
                                            const uPrice = Number(it.unit_price || it.price || (it.total_price ? it.total_price / q : 0));
                                            const tPrice = Number(it.total_price || (uPrice * q));

                                            return (
                                              <div key={idx} className="grid grid-cols-[1fr_36px_60px_60px] items-center text-[12px] py-1 border-b border-slate-50 dark:border-zinc-800/50 last:border-0">
                                                <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate pr-1" title={it.name}>{it.name}</span>
                                                <span className="text-center font-bold text-slate-500 dark:text-zinc-400">×{q}</span>
                                                <span className="text-right text-slate-500 dark:text-zinc-400">₹{uPrice.toFixed(2)}</span>
                                                <span className="text-right font-bold text-slate-900 dark:text-white">₹{tPrice.toFixed(2)}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card 2: Order & Payment Metadata */}
                                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-[#eee9e4] dark:border-zinc-800 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3 border-b border-slate-100 dark:border-zinc-800/80 pb-2 flex items-center gap-1.5">
                                          <Info size={14} className="text-[#ff4b1f]" />
                                          <span>Order Summary</span>
                                        </h4>

                                        <div className="space-y-2 text-[12px]">
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Order ID:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">#{order.order_id}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Status:</span>
                                            <HistoryStatusBadge status={isSelfPosBilling ? 'COMPLETED' : (order.resolved_status || 'PENDING')} />
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Table / Type:</span>
                                            <span className="font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                                              {order.table_name || 'Walk-In'} • {order.order_meta?.order_type || order.order_type || 'Dine In'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Date & Time:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{cleanDate}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Billed By:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{order.staff_name || order.order_meta?.staff_name || 'Staff'}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Bill Reference:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{order.bill?.bill_number || `BILL-${order.order_id}`}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card 3: Financial Breakdown & Quick Actions */}
                                    <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-[#eee9e4] dark:border-zinc-800 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3 border-b border-slate-100 dark:border-zinc-800/80 pb-2 flex items-center gap-1.5">
                                          <CreditCard size={14} className="text-[#ff4b1f]" />
                                          <span>Billing Breakdown</span>
                                        </h4>

                                        {(() => {
                                          const subtotalVal = Number(order.bill?.subtotal || 0);
                                          const taxVal = Number(order.bill?.tax_amount || 0);
                                          const cgstVal = taxVal / 2;
                                          const sgstVal = taxVal / 2;
                                          const serviceVal = Number(order.bill?.service_charge || 0);
                                          const discountVal = Number(order.bill?.discount_amount || 0);
                                          const grandVal = Number(order.bill?.grand_total || 0);

                                          return (
                                            <div className="space-y-1.5 text-[12px]">
                                              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                                                <span>Subtotal</span>
                                                <span className="font-semibold text-slate-800 dark:text-zinc-200">₹{subtotalVal.toFixed(2)}</span>
                                              </div>
                                              {taxVal > 0 && (
                                                <>
                                                  <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                                                    <span>CGST</span>
                                                    <span>+₹{cgstVal.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                                                    <span>SGST</span>
                                                    <span>+₹{sgstVal.toFixed(2)}</span>
                                                  </div>
                                                </>
                                              )}
                                              {serviceVal > 0 && (
                                                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                                                  <span>Service Charge</span>
                                                  <span>+₹{serviceVal.toFixed(2)}</span>
                                                </div>
                                              )}
                                              {discountVal > 0 && (
                                                <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                                                  <span>Discount</span>
                                                  <span>-₹{discountVal.toFixed(2)}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 dark:border-zinc-700 text-[14px] font-extrabold text-[#071B34] dark:text-white">
                                                <span>Grand Total</span>
                                                <span className="text-[#ff4b1f]">₹{grandVal.toFixed(2)}</span>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                                        {(() => {
                                          const st = (order.resolved_status || order.order_status || '').toUpperCase();
                                          const isDone = st === 'COMPLETED' || st === 'PAID' || st === 'CANCELLED' || st === 'REJECTED' || isSelfPosBilling;
                                          if (isDone) return null;
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handlePrintOrder(order)}
                                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-[12px] font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95 shadow-2xs"
                                            >
                                              <Printer size={14} />
                                              <span>Print Bill</span>
                                            </button>
                                          );
                                        })()}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenOrderPlacedPage(order)}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#ff4b1f] text-white text-[12px] font-bold hover:bg-[#ed3f16] transition cursor-pointer active:scale-95 shadow-xs"
                                        >
                                          <Eye size={14} />
                                          <span>Open Placed Order</span>
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 bg-slate-50/80 dark:bg-zinc-900/60 border-t border-[#eee9e4] dark:border-zinc-800 flex items-center justify-between text-[12px]">
                    <span className="text-slate-500 dark:text-zinc-400 font-normal">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={`px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                          currentPage === 1
                            ? 'border-slate-200 dark:border-zinc-800 text-slate-300 dark:text-zinc-600 cursor-not-allowed'
                            : 'border-[#eee9e4] dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={`px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                          currentPage === totalPages
                            ? 'border-slate-200 dark:border-zinc-800 text-slate-300 dark:text-zinc-600 cursor-not-allowed'
                            : 'border-[#eee9e4] dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

      {showCalendarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            className="bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-[#eee9e4] dark:border-zinc-800 w-full max-w-[340px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee9e4] dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#ff4b1f]" />
                <span className="text-[13px] font-medium text-[#071B34] dark:text-white">Select Date Range</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Calendar Controls & Grid */}
            <div className="p-4 space-y-3">
              {/* Month Navigation */}
              {(() => {
                const todayObj = new Date();
                const isCurrentMonthOrFuture =
                  calendarViewDate.getFullYear() > todayObj.getFullYear() ||
                  (calendarViewDate.getFullYear() === todayObj.getFullYear() &&
                    calendarViewDate.getMonth() >= todayObj.getMonth());

                return (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarViewDate(
                          new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)
                        )
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer text-sm"
                    >
                      ‹
                    </button>
                    <span className="text-[13px] font-medium text-[#071B34] dark:text-white">
                      {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      disabled={isCurrentMonthOrFuture}
                      onClick={() => {
                        if (!isCurrentMonthOrFuture) {
                          setCalendarViewDate(
                            new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)
                          );
                        }
                      }}
                      className={`h-7 w-7 flex items-center justify-center rounded-lg text-sm transition ${
                        isCurrentMonthOrFuture
                          ? 'text-slate-300 dark:text-zinc-600 cursor-not-allowed'
                          : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer'
                      }`}
                    >
                      ›
                    </button>
                  </div>
                );
              })()}

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <span key={i} className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 py-0.5">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 text-center gap-y-0.5">
                {getCalendarDays().map((item, idx) => {
                  if (!item) return <div key={idx} />;
                  const isFuture = item.dateStr > todayStr;
                  const isStart = tempStartDate === item.dateStr;
                  const isEnd = tempEndDate === item.dateStr;
                  const inRange =
                    tempStartDate &&
                    tempEndDate &&
                    item.dateStr > tempStartDate &&
                    item.dateStr < tempEndDate;
                  const isSelected = isStart || isEnd;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isFuture && handleDateClick(item.dateStr)}
                      className={`h-8 flex items-center justify-center transition-all ${
                        isFuture ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${inRange ? 'bg-orange-50 dark:bg-orange-950/20' : ''} ${
                        isStart && tempEndDate ? 'bg-orange-50 dark:bg-orange-950/20 rounded-l-full' : ''
                      } ${
                        isEnd && tempStartDate ? 'bg-orange-50 dark:bg-orange-950/20 rounded-r-full' : ''
                      } ${!inRange && !isSelected ? 'rounded-full' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] transition-all ${
                          isSelected
                            ? 'bg-[#ff4b1f] text-white font-medium'
                            : inRange
                            ? 'text-[#ff4b1f] font-normal'
                            : isFuture
                            ? 'text-slate-300 dark:text-zinc-600 font-normal'
                            : 'text-slate-700 dark:text-zinc-300 font-normal hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {item.dayNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Summary */}
              <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-center">
                <span className="text-[12px] font-normal text-slate-500 dark:text-zinc-400">
                  {tempStartDate ? (
                    <>
                      <span className="text-[#071B34] dark:text-white font-medium">{tempStartDate}</span>
                      {tempEndDate ? (
                        <> → <span className="text-[#071B34] dark:text-white font-medium">{tempEndDate}</span></>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500"> → pick end date</span>
                      )}
                    </>
                  ) : (
                    'Tap a date to start selection'
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setTempStartDate(''); setTempEndDate(''); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-[12px] font-normal text-slate-600 dark:text-zinc-300 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyCalendarRange}
                  className="flex-1 py-2 rounded-xl bg-[#ff4b1f] hover:bg-[#ed3f16] text-white text-[12px] font-medium transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </DesktopLayout>
      </div>

      {/* Desktop Centered Order Details Modal */}
      {selectedDesktopDetailOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#faf9f7] dark:bg-[#16161d] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative">
            <MobileOrderDetailsPage
              order={selectedDesktopDetailOrder}
              onBack={() => setSelectedDesktopDetailOrder(null)}
              onPrint={handlePrintOrder}
            />
          </div>
        </div>
      )}

      <div className="hidden md:block">
        <ReceiptModal 
          selectedHistoryOrder={selectedHistoryOrder}
          setSelectedHistoryOrder={setSelectedHistoryOrder}
          posSettings={posSettings}
        />
      </div>
    </>
  );
};

export default LiveOrderPage;
