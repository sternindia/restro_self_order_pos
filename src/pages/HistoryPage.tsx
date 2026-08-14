import React, { useEffect, useState } from 'react';
import { ArrowLeft, Receipt, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Printer, Download, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';

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
  const isSelfPosBilling = currentUser?.role === 'self-pos-billing' || currentUser?.role === 'self_pos_billing';

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

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

      if (!ordersRes.ok) {
        throw new Error('Failed to load history data from server');
      }

      const ordersData = await ordersRes.json();
      const rawOrders = ordersData && ordersData.status === true && Array.isArray(ordersData.data) ? ordersData.data : [];

      // Use raw status from backend directly as requested by the user
      const resolvedOrders = rawOrders.map((order: any) => {
        return {
          ...order,
          resolved_status: (order.order_status || '').toUpperCase()
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

  const handleDownloadBill = (order: any) => {
    const cleanDate = order.created_at 
      ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString('en-GB')
      : new Date().toLocaleString('en-GB');

    const taxRate = parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5);
    const serviceChargeRate = parseFloat(posSettings?.financials?.service_charge_percentage ?? posSettings?.serviceCharge ?? 0);
    const items = order.items || [];
    const itemsSubtotal = items.reduce((sum: number, item: any) => {
      const q = parseInt(item.quantity || item.qty) || 1;
      const unitP = Number(item.unit_price || item.price || (item.total_price ? item.total_price / q : 0));
      return sum + (unitP * q);
    }, 0);

    const subtotal = Number(order.bill?.subtotal ?? order.subTotal ?? order.subtotal ?? itemsSubtotal);
    const serviceAmt = Number(order.bill?.service_charge ?? order.serviceCharge ?? ((subtotal * serviceChargeRate) / 100));
    const taxTotal = Number(order.bill?.tax_amount ?? order.tax ?? (((subtotal + serviceAmt) * taxRate) / 100));
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const grandTotal = Number(order.bill?.grand_total ?? order.total ?? order.grand_total ?? (subtotal + serviceAmt + taxTotal));
    const totalQty = items.reduce((sum: number, item: any) => sum + (parseInt(item.quantity || item.qty) || 1), 0);

    const restaurantNameStr = posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'Big Ben Restaurant';
    const addressStr = posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel';
    const cityStateStr = [posSettings?.city || posSettings?.restaurant_info?.city, posSettings?.state || posSettings?.restaurant_info?.state, posSettings?.pincode || posSettings?.restaurant_info?.pincode].filter(Boolean).join(', ') || 'pune, MH, 411057';
    const gstinStr = posSettings?.gstin || posSettings?.restaurant_info?.gstin || posSettings?.restaurant_info?.gst_number || '27AAAAA0000A1Z5';
    const fssaiStr = posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || posSettings?.restaurant_info?.fssai_number || '10019022009876';

    const lines = [
      restaurantNameStr,
      addressStr,
      cityStateStr,
      `GSTIN: ${gstinStr}`,
      `FSSAI NO: ${fssaiStr}`,
      "--------------------------------------------------",
      `Bill No: ${order.order_id}                   Date: ${cleanDate}`,
      `Dine In: ${order.table_name || 'N/A'}                  Waiter: Ravi`,
      "--------------------------------------------------",
      "Item                             Qty.   Price   Amount",
      "--------------------------------------------------"
    ];

    (order.items || []).forEach((item: any) => {
      const name = (item.name || 'Item').padEnd(28, ' ').substring(0, 28);
      const qty = String(item.quantity || item.qty || 1).padStart(3, ' ');
      const price = Number(item.unit_price || item.price || 0).toFixed(2).padStart(7, ' ');
      const amt = (Number(item.total_price || (Number(item.unit_price || item.price || 0) * (item.quantity || 1)))).toFixed(2).padStart(7, ' ');
      lines.push(`${name} ${qty} ${price} ${amt}`);
    });

    lines.push("--------------------------------------------------");
    lines.push(`Total Qty: ${totalQty}               Sub Total  ${subtotal.toFixed(2)}`);
    lines.push(`                                    CGST ${halfTaxRate}%   ${cgstAmt.toFixed(2)}`);
    lines.push(`                                    SGST ${halfTaxRate}%   ${sgstAmt.toFixed(2)}`);
    if (serviceChargeRate > 0) {
      lines.push(`                          Service Charge ${serviceChargeRate}%   ${serviceAmt.toFixed(2)}`);
    }
    lines.push("--------------------------------------------------");
    lines.push(`Grand Total (INR)                         ${grandTotal.toFixed(2)}`);
    lines.push("--------------------------------------------------");
    lines.push("");
    lines.push("             Thank you & Visit Again              ");
    lines.push("--------------------------------------------------");

    let contentStream = `BT /F1 10 Tf 20 760 Td 14 TL\n`;
    lines.forEach((line) => {
      const safeLine = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      contentStream += `(${safeLine}) Tj T*\n`;
    });
    contentStream += `ET`;

    const pdfRaw = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 450 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
5 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000246 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + contentStream.length}
%%EOF`;

    const blob = new Blob([pdfRaw], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bill_Receipt_${order.order_id}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrintOrder = (order: any) => {
    const cleanDate = order.created_at 
      ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    const items = order.items || [];
    const totalQty = items.reduce((sum: number, item: any) => sum + (parseInt(item.quantity || item.qty) || 1), 0);
    
    // Fallback subtotal calculation from items if order.bill is empty
    const itemsSubtotal = items.reduce((sum: number, item: any) => {
      const q = parseInt(item.quantity || item.qty) || 1;
      const unitP = Number(item.unit_price || item.price || (item.total_price ? item.total_price / q : 0));
      return sum + (unitP * q);
    }, 0);

    const taxRate = parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5);
    const serviceChargeRate = parseFloat(posSettings?.financials?.service_charge_percentage ?? posSettings?.serviceCharge ?? 0);

    const subTotalNum = Number(order.bill?.subtotal ?? order.subTotal ?? order.subtotal ?? itemsSubtotal);
    const serviceAmt = Number(order.bill?.service_charge ?? order.serviceCharge ?? ((subTotalNum * serviceChargeRate) / 100));
    const taxTotal = Number(order.bill?.tax_amount ?? order.tax ?? ((subTotalNum * taxRate) / 100));
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const grandTotalNum = Number(order.bill?.grand_total ?? order.total ?? order.grand_total ?? (subTotalNum + serviceAmt + taxTotal));

    const itemsRowsHtml = items.map((item: any) => {
      const qty = parseInt(item.quantity || item.qty) || 1;
      const unitPrice = Number(item.unit_price || item.price || 0);
      const itemAmount = Number(item.total_price || (unitPrice * qty));
      return `
        <div style="margin-bottom: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="flex: 1; text-align: left; word-break: break-word;">${item.name}</span>
            <span style="width: 32px; text-align: center;">${qty}</span>
            <span style="width: 55px; text-align: right;">${unitPrice.toFixed(2)}</span>
            <span style="width: 60px; text-align: right;">${itemAmount.toFixed(2)}</span>
          </div>
          ${(item.notes && !item.notes.includes('Session Order')) ? `<div style="font-size: 9px; color: #333; font-style: italic; padding-left: 4px;">* ${item.notes}</div>` : ''}
        </div>
      `;
    }).join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>POS Receipt #${order.order_id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: monospace, sans-serif;
            width: 80mm;
            max-width: 100%;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 6px;">
          <div style="font-size: 14px; font-weight: bold;">${posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'Big Ben Restaurant'}</div>
          <div style="font-size: 10px;">${posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel'}</div>
          <div style="font-size: 10px;">
            ${[posSettings?.city || posSettings?.restaurant_info?.city, posSettings?.state || posSettings?.restaurant_info?.state, posSettings?.pincode || posSettings?.restaurant_info?.pincode].filter(Boolean).join(', ') || 'pune, MH, 411057'}
          </div>
          <div style="font-size: 10px;">GSTIN: ${posSettings?.gstin || posSettings?.restaurant_info?.gstin || posSettings?.restaurant_info?.gst_number || '27AAAAA0000A1Z5'}</div>
          <div style="font-size: 10px;">FSSAI NO: ${posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || posSettings?.restaurant_info?.fssai_number || '10019022009876'}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        ${order.guest_name ? `
          <div style="font-size: 10px;">
            Customer Name: ${order.guest_name} ${order.phone ? `(${order.phone})` : ''}
          </div>
          <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>Bill No: ${order.order_id}</span>
          <span>Date: ${cleanDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>${order.table_name ? `Dine In: ${order.table_name}` : 'Type: DINE-IN'}</span>
          <span>Waiter: Ravi</span>
        </div>

        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
          <span style="flex: 1; text-align: left;">Item</span>
          <span style="width: 32px; text-align: center;">Qty.</span>
          <span style="width: 55px; text-align: right;">Price</span>
          <span style="width: 60px; text-align: right;">Amount</span>
        </div>

        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        ${itemsRowsHtml}

        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <div style="font-size: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Total Qty: ${totalQty}</span>
            <span>Sub Total &nbsp;&nbsp;${subTotalNum.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
            <span>CGST ${((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}% &nbsp;&nbsp;${cgstAmt.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
            <span>SGST ${((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}% &nbsp;&nbsp;${sgstAmt.toFixed(2)}</span>
          </div>
          ${serviceAmt > 0 ? `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
              <span>Service Charge ${serviceChargeRate}% &nbsp;&nbsp;${serviceAmt.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-top: 4px;">
            <span>Grand Total (INR)</span>
            <span>${grandTotalNum.toFixed(2)}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 6px 0 4px 0;"></div>

        <div style="text-align: center; font-size: 11px; font-weight: 500; padding: 2px 0;">
          Thank you & Visit Again
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'CONFIRMED') return 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
    if (s === 'CANCELLED') return 'bg-rose-50 text-rose-600 border border-rose-200/50';
    if (s === 'PENDING') return 'bg-amber-50 text-amber-600 border border-amber-200/50';
    if (s === 'PREPARING' || s === 'SERVED') return 'bg-sky-50 text-sky-600 border border-sky-200/50';
    return 'bg-gray-50 text-gray-500 border border-gray-200';
  };

  const filteredOrders = orders.filter((order: any) => {
    const orderType = (order.order_meta?.order_type || order.order_type || '').toUpperCase();
    const tableNum = String(order.order_meta?.table_number || order.table_name || '').toLowerCase();
    const staffName = String(order.order_meta?.staff_name || order.staff_name || '').toLowerCase();
    const isCounterOrder = orderType === 'TAKEAWAY' || tableNum.includes('counter') || staffName.includes('self pos') || staffName.includes('counter');

    // Strict role segregation: Self POS Billing sees Counter Orders; Waiters/Staff see Table/Dine-In Orders only.
    if (isSelfPosBilling) {
      if (!isCounterOrder) return false;
    } else {
      if (isCounterOrder) return false;
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

      if (dateFilter === 'THIS_WEEK') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        if (orderDate < oneWeekAgo) return false;
      }
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      const status = (order.resolved_status || order.order_status || '').toUpperCase();
      const paymentStatus = (order.bill?.payment_status || '').toUpperCase();

      if (statusFilter === 'PAID') {
        const isPaid = status === 'PAID' || status === 'COMPLETED' || paymentStatus === 'PAID';
        if (!isPaid) return false;
      }

      if (statusFilter === 'PENDING') {
        const isPaid = status === 'PAID' || status === 'COMPLETED' || paymentStatus === 'PAID';
        if (isPaid) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans pb-10">
      <Header />
      
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="p-2 sm:p-2.5 bg-white rounded-xl shadow-xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all border border-gray-200">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Order Registry</h1>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:block">Tabular history & detailed billing logs</p>
            </div>
          </div>
          <button 
            onClick={fetchOrderHistory} 
            className="p-2 sm:p-3 bg-white rounded-xl shadow-xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all active:scale-95 border border-gray-200 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin text-[#0077b6]' : ''}`} />
          </button>
        </div>

        {/* Mobile & Desktop Responsive Date Filter Toolbar */}
        <div className="flex flex-col gap-2.5 mb-5 select-none">
          {/* Top Row: Scrollable Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 min-w-0">
            <button
              onClick={() => { setDateFilter('ALL'); setStatusFilter('ALL'); setStartDate(''); setEndDate(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'ALL' && statusFilter === 'ALL' && !startDate && !endDate
                  ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📋 All Logs
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'TODAY' ? 'ALL' : 'TODAY'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'TODAY' && !startDate && !endDate
                  ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📅 Today
            </button>

            <button
              onClick={() => { setDateFilter(dateFilter === 'THIS_WEEK' ? 'ALL' : 'THIS_WEEK'); setStartDate(''); setEndDate(''); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                dateFilter === 'THIS_WEEK' && !startDate && !endDate
                  ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              📆 This Week
            </button>

            <div className="h-4 w-[1px] bg-gray-300 mx-0.5 flex-shrink-0"></div>

            <button
              onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-700 border-emerald-200/80 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Paid
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-amber-700 border-amber-200/80 hover:bg-amber-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pending
            </button>
          </div>

          {/* Custom Date Range Pill Bar (Fits 100% width on Mobile without clipping) */}
          <div className="flex items-center gap-1.5 w-full bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex-1 min-w-0 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/60 focus-within:border-[#0077b6] transition-colors">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value) setDateFilter('ALL');
                }}
                className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-gray-800 outline-none cursor-pointer p-0"
              />
            </div>

            <span className="text-gray-300 font-extrabold text-xs px-0.5">→</span>

            <div className="flex-1 min-w-0 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/60 focus-within:border-[#0077b6] transition-colors">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (e.target.value) setDateFilter('ALL');
                }}
                className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-gray-800 outline-none cursor-pointer p-0"
              />
            </div>

            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-1 px-2 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer flex-shrink-0"
                title="Clear date filter"
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-150 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0077b6]"></div>
            <p className="text-gray-500 mt-5 font-bold text-sm">Fetching restaurant order records...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-700 flex flex-col items-center shadow-sm">
            <AlertCircle size={36} className="mb-3 text-rose-500" />
            <p className="font-bold text-lg">{error}</p>
            <button 
              onClick={fetchOrderHistory} 
              className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              Reload History
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center text-gray-500 shadow-sm">
            <Receipt size={56} className="mx-auto mb-4 opacity-25 text-gray-400" />
            <p className="font-extrabold text-xl text-gray-800">No Orders Found</p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">No order records match your selected filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 sm:overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full [-webkit-overflow-scrolling:touch]">
              <table className="w-full text-left border-collapse min-w-[580px] sm:min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200/80">
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
                  {filteredOrders.map((order) => {
                    const isExpanded = !!expandedOrders[order.order_id];
                    const itemsSummary = (order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ');
                    
                    const cleanDate = order.created_at 
                      ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Date N/A';

                    return (
                      <React.Fragment key={order.order_id}>
                        {/* Table Main Row */}
                        <tr 
                          className={`hover:bg-gray-50/70 transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-gray-50/50' : ''
                          }`}
                          onClick={() => toggleExpand(order.order_id)}
                        >
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-900">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenOrderPlacedPage(order); }}
                              className="text-[#0077b6] hover:underline font-extrabold cursor-pointer"
                              title="View & update order on Order Placed page"
                            >
                              #{order.order_id}
                            </button>
                          </td>
                          {isEnableTables && (
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold text-[#0077b6] whitespace-nowrap">
                              <span className="bg-[#0077b6]/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs">
                                {order.table_name || 'Walk-In'}
                              </span>
                            </td>
                          )}
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
                            {cleanDate}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs text-gray-600 font-medium max-w-[130px] sm:max-w-xs truncate" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-black text-gray-900 whitespace-nowrap">
                            ₹{Number(order.bill?.grand_total || 0).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${getStatusBadgeClass(isSelfPosBilling ? 'COMPLETED' : order.resolved_status)}`}>
                              {isSelfPosBilling ? 'COMPLETED' : (order.resolved_status || 'N/A')}
                            </span>
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
                                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-1.5">
                                    <Receipt size={13} /> Ordered Items List
                                  </h4>
                                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-2.5 shadow-inner">
                                    {(order.items || []).map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                                          <span className="text-[11px] sm:text-xs text-gray-400">Price: ₹{Number(item.unit_price).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 font-bold text-gray-700 flex-shrink-0">
                                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">x{item.quantity}</span>
                                          <span>₹{(Number(item.total_price || item.unit_price * item.quantity)).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                {/* Right Side: Billing Breakdown */}
                                {order.bill && (
                                  <div className="bg-white border border-dashed border-gray-300 rounded-xl p-3.5 sm:p-5 shadow-sm w-full md:max-w-sm md:ml-auto">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3 text-center">
                                      Billing breakdown
                                    </h4>
                                    <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-gray-800">₹{Number(order.bill.subtotal).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 pl-2">
                                        <span>CGST ({((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}%)</span>
                                        <span>+₹{(Number(order.bill.tax_amount || 0) / 2).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 pl-2">
                                        <span>SGST ({((parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5)) / 2).toFixed(1)}%)</span>
                                        <span>+₹{(Number(order.bill.tax_amount || 0) / 2).toFixed(2)}</span>
                                      </div>
                                      {Number(order.bill.service_charge) > 0 && (
                                        <div className="flex justify-between text-[11px] sm:text-xs text-gray-500">
                                          <span>Service Charge ({posSettings?.financials?.service_charge_percentage || posSettings?.serviceCharge || 5}%)</span>
                                          <span>+₹{Number(order.bill.service_charge).toFixed(2)}</span>
                                        </div>
                                      )}
                                      {order.bill.discount_amount > 0 && (
                                        <div className="flex justify-between text-[11px] sm:text-xs text-red-500">
                                          <span>Discount</span>
                                          <span>-₹{Number(order.bill.discount_amount).toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-dashed pt-2.5 mt-2.5 flex justify-between font-extrabold text-sm sm:text-base text-gray-900">
                                        <span>Grand Total</span>
                                        <span className="text-[#0077b6]">₹{Number(order.bill.grand_total).toFixed(2)}</span>
                                      </div>
                                      <div className="text-[9px] text-center text-gray-400 font-bold tracking-wide uppercase pt-2">
                                        Payment state: {isSelfPosBilling ? 'PAID' : order.bill.payment_status} | Bill: {isSelfPosBilling ? 'COMPLETED' : order.bill.bill_status}
                                      </div>

                                      {/* Print & Download Action Buttons (Hidden for self-pos-billing) */}
                                      {!isSelfPosBilling && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-dashed border-gray-200">
                                          {order.resolved_status !== 'CANCELLED' && order.resolved_status !== 'REJECTED' ? (
                                            <>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
                                                className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
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
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
