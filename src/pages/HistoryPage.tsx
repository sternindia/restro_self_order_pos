import React, { useEffect, useState } from 'react';
import { ArrowLeft, Receipt, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Printer, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { printThermalReceiptDirect } from '../components/ReceiptBillPrint';
import ReceiptModal from '../components/ReceiptModal';

interface OrderHistoryItem {
  order_id: string;
  table_name: string;
  table_number_id: string;
  order_status: string;
  created_at: string;
  guest_name?: string;
  phone?: string;
  resolved_status?: string;
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
  };
}

const HistoryPage: React.FC = () => {
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'COMPLETED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, startDate, endDate]);

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
    localStorage.setItem('emenu_last_order', JSON.stringify({
      order_id: order.order_id,
      table: order.table_name || 'Walk-In',
      guest_name: order.guest_name,
      phone: order.phone,
      items: order.items || [],
      subTotal: order.bill?.subtotal || 0,
      tax: order.bill?.tax_amount || 0,
      total: order.bill?.grand_total || 0,
      created_at: order.created_at
    }));
    navigate('/order-number');
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

  const filteredOrders = orders.filter((order: any) => {
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

    // 2. Super Admin / Counter POS Billing: Hide Waiters' table orders unless logged in as Waiter
    if (isSuperAdmin || isSelfPosBilling) {
      if (orderStaffRole === 'waiter' || (!isCounterOrder && staffName.includes('waiter'))) {
        return false;
      }
    }

    // 1. Date Range Filter (Between Dates)
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

    // 2. Preset Date Filter (only if custom date inputs are empty)
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

    // 3. Status Filter
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

    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans pb-10">
      <Header />
      
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="p-2 sm:p-2.5 bg-white rounded-xl shadow-2xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all border border-[#F0E6DF]">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Order Registry</h1>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:block">Tabular history & detailed billing logs</p>
            </div>
          </div>
          <button 
            onClick={fetchOrderHistory} 
            className="p-2 sm:p-3 bg-white rounded-xl shadow-2xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all active:scale-95 border border-[#F0E6DF] cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin text-[#f05a24]' : ''}`} />
          </button>
        </div>

        {/* Mobile & Desktop Responsive Date Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-5 select-none">
          {/* Scrollable Quick Presets (Left Side) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 min-w-0 flex-1">
            <button
              onClick={() => { setDateFilter('ALL'); setStatusFilter('ALL'); setStartDate(''); setEndDate(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'ALL' && statusFilter === 'ALL' && !startDate && !endDate
                  ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📋 All Logs
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'TODAY' ? 'ALL' : 'TODAY'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'TODAY' && !startDate && !endDate
                  ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📅 Today
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'YESTERDAY' ? 'ALL' : 'YESTERDAY'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'YESTERDAY' && !startDate && !endDate
                  ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📆 Yesterday
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'THIS_WEEK' ? 'ALL' : 'THIS_WEEK'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'THIS_WEEK' && !startDate && !endDate
                  ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📊 This Week
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'THIS_MONTH' ? 'ALL' : 'THIS_MONTH'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'THIS_MONTH' && !startDate && !endDate
                  ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              🗓️ This Month
            </button>

            <div className="h-4 w-[1px] bg-gray-300 mx-0.5 flex-shrink-0"></div>

            <button
              onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-emerald-700 border-emerald-200/80 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
            </button>

            {!isSuperAdmin && !isSelfPosBilling && (
              <>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-white text-amber-700 border-amber-200/80 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pending
                </button>

                <button
                  onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-rose-700 border-rose-200/80 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Cancelled
                </button>
              </>
            )}
          </div>

          {/* Single Unified Calendar Range Button (Right Side on Desktop / Same Line) */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={openCalendarModal}
              className="w-full md:w-auto flex items-center justify-between gap-3 px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl border border-gray-200 shadow-2xs hover:border-[#f05a24] transition-all cursor-pointer min-w-[200px]"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[#f05a24] text-xs">📅</span>
                {startDate ? (
                  <span className="text-xs font-black text-gray-900">
                    {startDate} {endDate && endDate !== startDate ? `→ ${endDate}` : ''}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 font-semibold">Select Date Range...</span>
                )}
              </span>
              {(startDate || endDate) ? (
                <span
                  onClick={(e) => { e.stopPropagation(); clearDateRange(); }}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded-md ml-1 border border-rose-200 cursor-pointer"
                  title="Clear Date Filter"
                >
                  ✕
                </span>
              ) : (
                <ChevronDown size={14} className="text-gray-400 ml-1 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-[#F0E6DF] shadow-xs">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f05a24]"></div>
            <p className="text-gray-500 mt-5 font-bold text-sm">Fetching restaurant order records...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-700 flex flex-col items-center shadow-xs">
            <AlertCircle size={36} className="mb-3 text-rose-500" />
            <p className="font-bold text-lg">{error}</p>
            <button 
              onClick={fetchOrderHistory} 
              className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all"
            >
              Reload History
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#F0E6DF] rounded-2xl p-16 text-center text-gray-500 shadow-xs">
            <Receipt size={56} className="mx-auto mb-4 opacity-25 text-gray-400" />
            <p className="font-extrabold text-xl text-gray-800">No Orders Found</p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">No order records match your selected filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#F0E6DF] sm:overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full [-webkit-overflow-scrolling:touch]">
              <table className="w-full text-left border-collapse min-w-[580px] sm:min-w-full">
                <thead className="bg-[#FAF6F0]/70 border-b border-[#F0E6DF]">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">ID</th>
                    {isEnableTables && (
                      <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Table</th>
                    )}
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOrders.map((order) => {
                    const isExpanded = !!expandedOrders[order.order_id];
                    const itemsSummary = (order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ');
                    
                    const cleanDate = order.created_at 
                      ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Date N/A';

                    return (
                      <React.Fragment key={order.order_id}>
                        {/* Table Main Row */}
                        <tr 
                          className={`hover:bg-[#FAF6F0]/40 transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-[#FAF6F0]/50' : ''
                          }`}
                          onClick={() => toggleExpand(order.order_id)}
                        >
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-black text-slate-900">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenOrderPlacedPage(order); }}
                              className="text-slate-900 hover:text-[#f05a24] hover:underline font-black cursor-pointer tracking-tight"
                              title="View & update order on Order Placed page"
                            >
                              #{order.order_id}
                            </button>
                          </td>
                          {isEnableTables && (
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-extrabold shadow-2xs">
                                {order.table_name || 'Walk-In'}
                              </span>
                            </td>
                          )}
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs text-gray-800 font-bold whitespace-nowrap">
                            {cleanDate}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs text-gray-900 font-bold max-w-[130px] sm:max-w-xs truncate" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-black text-gray-900 whitespace-nowrap">
                            ₹{Number(order.bill?.grand_total || 0).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <OrderStatusBadge status={isSelfPosBilling ? 'COMPLETED' : order.resolved_status} />
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                className="p-1.5 hover:bg-emerald-100/70 text-emerald-700 bg-emerald-50 rounded-lg transition-colors border border-emerald-200/50 cursor-pointer"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (isSelfPosBilling) {
                                    toggleExpand(order.order_id);
                                  } else {
                                    handleOpenOrderPlacedPage(order);
                                  }
                                }}
                                title={isSelfPosBilling ? "View Order Items Detail" : "Open Order Placed Page to Review/Update"}
                              >
                                <Eye size={14} />
                              </button>
                              {!isSelfPosBilling && order.resolved_status !== 'CANCELLED' && order.resolved_status !== 'REJECTED' && (
                                <>
                                  <button 
                                    className="p-1.5 hover:bg-amber-100/70 text-amber-700 bg-amber-50 rounded-lg transition-colors border border-amber-200/50 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
                                    title="Print Bill"
                                  >
                                    <Printer size={14} />
                                  </button>
                                </>
                              )}
                              <button 
                                className="p-1 hover:bg-gray-200/50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors ml-0.5"
                                onClick={(e) => { e.stopPropagation(); toggleExpand(order.order_id); }}
                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row (Receipt details) */}
                        {isExpanded && (
                          <tr className="bg-gray-50/30">
                            <td colSpan={isEnableTables ? 7 : 6} className="p-1 sm:px-6 sm:py-4 border-t border-b border-gray-100">
                              <div className="sticky left-0 w-[calc(100vw-1.5rem)] sm:w-full max-w-full px-1 sm:px-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-start w-full">
                                {/* Left Side: Items Detail */}
                                <div className="w-full">
                                  <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-1.5">
                                    <Receipt size={13} /> Ordered Items List
                                  </h4>
                                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-2.5 shadow-inner">
                                    {(order.items || []).map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <span className="font-bold text-gray-900 truncate">{item.name}</span>
                                          <span className="text-[11px] sm:text-xs text-gray-700 font-semibold">Price: ₹{Number(item.unit_price).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 font-bold text-gray-900 flex-shrink-0">
                                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">x{item.quantity}</span>
                                          <span>₹{(Number(item.total_price || item.unit_price * item.quantity)).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                {/* Right Side: Billing Breakdown */}
                                {order.bill && (
                                  <div className="bg-white border border-dashed border-gray-300 rounded-xl p-3.5 sm:p-5 shadow-2xs w-full md:max-w-sm md:ml-auto">
                                    <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-widest border-b pb-2 mb-3 text-center">
                                      Billing breakdown
                                    </h4>
                                    <div className="space-y-2 text-xs sm:text-sm text-gray-900">
                                      <div className="flex justify-between">
                                        <span className="font-bold text-gray-900">Subtotal</span>
                                        <span className="font-bold text-gray-900">₹{Number(order.bill.subtotal).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] sm:text-xs text-gray-800 font-semibold pl-2">
                                        <span>CGST ({((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}%)</span>
                                        <span>+₹{(Number(order.bill.tax_amount || 0) / 2).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] sm:text-xs text-gray-800 font-semibold pl-2">
                                        <span>SGST ({((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}%)</span>
                                        <span>+₹{(Number(order.bill.tax_amount || 0) / 2).toFixed(2)}</span>
                                      </div>
                                      {Number(order.bill.service_charge) > 0 && (
                                        <div className="flex justify-between text-[11px] sm:text-xs text-gray-800 font-semibold">
                                          <span>Service Charge ({posSettings?.financials?.service_charge_percentage || posSettings?.serviceCharge || 5}%)</span>
                                          <span>+₹{Number(order.bill.service_charge).toFixed(2)}</span>
                                        </div>
                                      )}
                                      {order.bill.discount_amount > 0 && (
                                        <div className="flex justify-between text-[11px] sm:text-xs text-red-600 font-bold">
                                          <span>Discount</span>
                                          <span>-₹{Number(order.bill.discount_amount).toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-dashed pt-2.5 mt-2.5 flex justify-between font-extrabold text-sm sm:text-base text-gray-900">
                                        <span>Grand Total</span>
                                        <span className="text-[#f05a24]">₹{Number(order.bill.grand_total).toFixed(2)}</span>
                                      </div>


                                      {/* Print & Download Action Buttons (Hidden for self-pos-billing) */}
                                      {!isSelfPosBilling && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-dashed border-gray-200">
                                          {order.resolved_status !== 'CANCELLED' && order.resolved_status !== 'REJECTED' ? (
                                            <>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
                                                className="w-full py-1.5 px-2 bg-[#f05a24] hover:bg-[#d94815] active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                                              >
                                                <Printer size={13} />
                                                <span>Print Bill</span>
                                              </button>
                                            </>
                                          ) : (
                                            <div className="w-full py-1.5 px-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold text-center border border-rose-200">
                                              Order Cancelled
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
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

            {/* Pagination Controls Bar */}
            {filteredOrders.length > 0 && (
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 px-3 sm:px-5 py-3 bg-[#FAF6F0]/70 border-t border-[#F0E6DF] text-xs font-bold text-gray-700 w-full overflow-hidden">
                <div className="text-center sm:text-left text-[11px] sm:text-xs">
                  Showing <span className="font-extrabold text-gray-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)}</span> to{' '}
                  <span className="font-extrabold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of{' '}
                  <span className="font-extrabold text-[#f05a24]">{filteredOrders.length}</span> orders
                </div>

                <div className="flex items-center justify-center gap-1 sm:gap-1.5 max-w-full overflow-x-auto no-scrollbar py-0.5 px-1 shrink-0">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 border-[#F0E6DF] hover:bg-white hover:text-[#f05a24] hover:border-[#f05a24] shadow-2xs'
                    }`}
                  >
                    ‹ Prev
                  </button>

                  {/* Page Numbers Container with horizontal scroll safety on very small screens */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[60vw] sm:max-w-none">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 shrink-0 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-[#f05a24] text-white shadow-2xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 border-[#F0E6DF] hover:bg-white hover:text-[#f05a24] hover:border-[#f05a24] shadow-2xs'
                    }`}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Single Unified Range Calendar Modal (Matches restaurant_pos 1-to-1) ── */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#1E1F24] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>📅</span>
                <span>Select Date Range</span>
              </h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-white font-black text-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Calendar Controls & Grid */}
            <div className="p-4 space-y-3">
              {/* Month Header Navigation */}
              {(() => {
                const todayObj = new Date();
                const isCurrentMonthOrFuture = calendarViewDate.getFullYear() > todayObj.getFullYear() || 
                  (calendarViewDate.getFullYear() === todayObj.getFullYear() && calendarViewDate.getMonth() >= todayObj.getMonth());
                
                return (
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 font-extrabold text-gray-800 text-sm transition-all cursor-pointer"
                    >
                      ‹
                    </button>
                    <span className="font-extrabold text-gray-900 text-sm">
                      {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      disabled={isCurrentMonthOrFuture}
                      onClick={() => {
                        if (!isCurrentMonthOrFuture) {
                          setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
                        }
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-extrabold text-sm transition-all ${
                        isCurrentMonthOrFuture ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer'
                      }`}
                    >
                      ›
                    </button>
                  </div>
                );
              })()}

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <span key={i} className="text-[11px] font-extrabold text-gray-400 uppercase">{d}</span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 text-center gap-1">
                {getCalendarDays().map((item, idx) => {
                  if (!item) return <div key={idx} />;
                  const isFuture = item.dateStr > todayStr;
                  const isStart = tempStartDate === item.dateStr;
                  const isEnd = tempEndDate === item.dateStr;
                  const inRange = tempStartDate && tempEndDate && item.dateStr > tempStartDate && item.dateStr < tempEndDate;
                  const isSelected = isStart || isEnd;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isFuture && handleDateClick(item.dateStr)}
                      className={`h-9 flex items-center justify-center transition-all ${
                        isFuture ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
                      } ${
                        inRange ? 'bg-[#FFF0E6]' : ''
                      } ${
                        isStart && tempEndDate ? 'bg-[#FFF0E6] rounded-l-full' : ''
                      } ${
                        isEnd && tempStartDate ? 'bg-[#FFF0E6] rounded-r-full' : ''
                      } ${
                        !inRange && !isSelected ? 'rounded-full' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center font-bold text-xs rounded-full transition-all ${
                          isSelected
                            ? 'bg-[#f05a24] text-white shadow-2xs font-black'
                            : inRange
                            ? 'text-[#f05a24] font-black'
                            : isFuture
                            ? 'text-gray-300 font-normal'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.dayNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Info Summary */}
              <div className="p-2.5 rounded-xl text-center border bg-[#FAF6F0] border-[#F0E6DF]">
                <span className="text-xs font-semibold text-slate-800">
                  {tempStartDate ? (
                    <>
                      Selected: <strong className="text-slate-950 font-black">{tempStartDate}</strong> {tempEndDate ? `to ${tempEndDate}` : '(Select End Date)'}
                    </>
                  ) : (
                    'Click a date to select Start Date'
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate('');
                    setTempEndDate('');
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl border border-gray-200 transition-all cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyCalendarRange}
                  className="flex-1 py-2 px-3 bg-[#f05a24] hover:bg-[#d94815] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal 
        selectedHistoryOrder={selectedHistoryOrder}
        setSelectedHistoryOrder={setSelectedHistoryOrder}
        posSettings={posSettings}
      />
    </div>
  );
};

export default HistoryPage;
