import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, ShoppingBag, Clock, UtensilsCrossed, Grid } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import ReceiptBillPrint, { printThermalReceiptDirect } from '../components/ReceiptBillPrint';
import OrderStatusBadge from '../components/OrderStatusBadge';

const OrderNumberPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlOrderId = queryParams.get('id') || queryParams.get('order_id') || queryParams.get('track_id');

  const savedUser = localStorage.getItem('emenu_user');
  const userObj = savedUser ? JSON.parse(savedUser) : null;
  const isGuestCustomer = !userObj || userObj.isGuest || userObj.role?.toLowerCase() === 'guest';
  const isSelfPosBilling = userObj?.role === 'self-pos-billing' || userObj?.role === 'self_pos_billing';

  const [orderInfo, setOrderInfo] = useState<any>(() => {
    const saved = localStorage.getItem('emenu_last_order');
    return saved ? JSON.parse(saved) : null;
  });

  const [posSettings, setPosSettings] = useState<any>(() => {
    const saved = localStorage.getItem('emenu_pos_settings');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const fetchLatestDataFromBackend = async () => {
      try {
        const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;
        const targetOrderId = urlOrderId || orderInfo?.order_id;
        if (!targetOrderId) return;

        // Fetch POS Settings (if not cached) and Orders in parallel
        const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
        const [settingsRes, ordersRes] = await Promise.all([
          savedSettingsStr ? null : fetch(`${API_BASE_URL}/settings/pos/${restaurantId}`).catch(() => null),
          fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null)
        ]);

        if (settingsRes && settingsRes.ok) {
          const data = await settingsRes.json();
          const settings = data?.data || data;
          if (settings?.restaurant_info) {
            setPosSettings(settings);
            localStorage.setItem('emenu_pos_settings', JSON.stringify(settings));
          }
        }

        if (ordersRes && ordersRes.ok) {
          const data = await ordersRes.json();
          const rawOrders = Array.isArray(data) ? data : (data?.data || []);
          const cleanTarget = String(targetOrderId).replace(/^#/i, '').trim();
          const freshOrder = rawOrders.find((o: any) => String(o.order_id).replace(/^#/i, '').trim() === cleanTarget);

          if (freshOrder) {
            const updated = {
              order_id: freshOrder.order_id,
              table: freshOrder.table_name || freshOrder.table_number || 'Walk-In',
              guest_name: freshOrder.guest_name || freshOrder.staff_name || 'Customer',
              phone: freshOrder.phone || '',
              items: freshOrder.items || [],
              subTotal: freshOrder.bill?.subtotal || freshOrder.subtotal || 0,
              tax: freshOrder.bill?.tax_amount || freshOrder.tax_amount || 0,
              serviceCharge: freshOrder.bill?.service_charge !== undefined 
                ? parseFloat(freshOrder.bill.service_charge) 
                : (orderInfo?.serviceCharge ?? 0),
              total: freshOrder.bill?.grand_total || freshOrder.total || 0,
              order_status: freshOrder.order_status || freshOrder.status || 'PENDING',
              created_at: freshOrder.created_at || freshOrder.time
            };
            setOrderInfo(updated);
            localStorage.setItem('emenu_last_order', JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.error('Failed to sync order from backend:', err);
      }
    };

    fetchLatestDataFromBackend();
  }, [location.search]);

  if (!orderInfo) {
    return (
      <div className="numberBody min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">No active order found</h2>
          <p className="text-xs text-gray-500 mb-6">You haven't placed any order yet in this session.</p>
          <Link 
            to="/" 
            className="inline-block bg-[#0077b6] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  const { order_id, table, guest_name, phone, items = [], subTotal = 0, tax = 0, total = 0, created_at } = orderInfo;

  const handlePrint = () => {
    printThermalReceiptDirect({
      orderId: order_id,
      dateStr: cleanDate,
      tableName: table || 'Walk-In',
      staffName: staff_name || 'Staff',
      guestName: guest_name,
      items: items.map((item: any) => ({
        name: item.name,
        quantity: parseInt(item.quantity || item.qty) || 1,
        price: Number(item.unit_price || item.price || 0),
        total_price: Number(item.total_price || ((item.unit_price || item.price || 0) * (item.quantity || 1)))
      })),
      subtotal: subTotalNum,
      taxRate: taxRate,
      cgstAmt: cgstAmt,
      sgstAmt: sgstAmt,
      serviceChargeRate: serviceChargeRate,
      serviceChargeAmt: serviceAmt,
      grandTotal: grandTotalNum,
      restaurantInfo: restaurantInfo
    });
    window.print();
  };

  const handleTakeNewOrder = () => {
    sessionStorage.removeItem('emenu_table');
    localStorage.removeItem('emenu_cart');
    localStorage.removeItem('emenu_last_order');
    if (!isGuestCustomer) {
      navigate('/tables');
    } else {
      navigate('/');
    }
  };

  const cleanDate = created_at 
    ? new Date(created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  // Calculations matching POS Receipt logic with fallbacks
  const totalQty = items.reduce((sum: number, item: any) => sum + (parseInt(item.quantity || item.qty) || 1), 0);
  const itemsSubtotal = items.reduce((sum: number, item: any) => {
    const q = parseInt(item.quantity || item.qty) || 1;
    const unitP = Number(item.unit_price || item.price || (item.total_price ? item.total_price / q : 0));
    return sum + (unitP * q);
  }, 0);

  const taxRate = parseFloat(posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5);
  const serviceChargeRate = parseFloat(posSettings?.financials?.service_charge_percentage ?? posSettings?.serviceCharge ?? 0);

  const subTotalNum = parseFloat(subTotal) > 0 ? parseFloat(subTotal) : itemsSubtotal;
  const serviceAmt = orderInfo?.serviceCharge !== undefined 
    ? parseFloat(orderInfo.serviceCharge)
    : (orderInfo?.totals?.service_charge !== undefined 
      ? parseFloat(orderInfo.totals.service_charge) 
      : (orderInfo?.service_charge !== undefined ? parseFloat(orderInfo.service_charge) : 0));
  const taxTotal = parseFloat(tax) > 0 ? parseFloat(tax) : ((subTotalNum * taxRate) / 100);
  const cgstAmt = taxTotal / 2;
  const sgstAmt = taxTotal / 2;
  const grandTotalNum = parseFloat(total) > 0 ? parseFloat(total) : (subTotalNum + serviceAmt + taxTotal);

  const handleDownloadBill = () => {
    const subtotal = subTotalNum;
    const taxTotal = subtotal * (taxRate / 100);
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const serviceAmt = subtotal * (serviceChargeRate / 100);
    const grandTotal = grandTotalNum || (subtotal + taxTotal + serviceAmt);

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
      `Bill No: ${order_id}                   Date: ${cleanDate}`,
      `${table ? `Dine In: ${String(table).includes('Table') ? table : `Table #${table}`}` : 'Type: DINE-IN'}                  Waiter: Ravi`,
      "--------------------------------------------------",
      "Item                             Qty.   Price   Amount",
      "--------------------------------------------------"
    ];

    (items || []).forEach((item: any) => {
      const name = (item.name || 'Item').padEnd(28, ' ').substring(0, 28);
      const qty = String(item.quantity || item.qty || 1).padStart(3, ' ');
      const price = Number(item.price || item.unit_price || 0).toFixed(2).padStart(7, ' ');
      const amt = (Number(item.price || item.unit_price || 0) * Number(item.quantity || item.qty || 1)).toFixed(2).padStart(7, ' ');
      lines.push(`${name} ${qty} ${price} ${amt}`);
    });

    lines.push("--------------------------------------------------");
    lines.push(`Total Qty: ${totalQty}               Sub Total  ${subtotal.toFixed(2)}`);
    lines.push(`                                    CGST ${halfTaxRate}%   ${cgstAmt.toFixed(2)}`);
    lines.push(`                                    SGST ${halfTaxRate}%   ${sgstAmt.toFixed(2)}`);
    if (serviceAmt > 0) {
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
    link.download = `Bill_Receipt_${order_id}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
   const handleOrderMore = () => {
    if (table) {
      const activeTableNum = String(table).replace(/Table\s*#/i, '').replace(/Table\s*/i, '').trim();
      sessionStorage.setItem('emenu_table', activeTableNum);
    }
    navigate('/');
  };

  return (
    <div className="numberBody min-h-screen bg-[#f8f9fa] font-sans pb-32">
      {/* Thermal POS Receipt Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-pos-receipt, #thermal-pos-receipt * {
            visibility: visible !important;
          }
          #thermal-pos-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 8px !important;
            display: block !important;
            background: white !important;
            color: black !important;
            font-family: monospace, monospace !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header (Hidden on print) */}
      <div className="header-number sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-4 md:px-8 shadow-sm border-b border-gray-150 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="back-arrow p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Back to menu"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900">Order Summary</h2>
            <p className="text-[11px] text-gray-500 font-medium">Receipt #{order_id}</p>
          </div>
        </div>

        {(() => {
          const currentStatus = String(orderInfo?.order_status || orderInfo?.status || 'PENDING').toUpperCase();
          const isOrderCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';
          if (!isGuestCustomer && !isSelfPosBilling && !isOrderCancelled) {
            return (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Printer size={16} />
                <span className="hidden xs:inline">Print POS Bill</span>
              </button>
            );
          }
          return null;
        })()}
      </div>

      {/* Web View Order Review Card */}
      <div className="numbermiddle flex justify-center w-full px-2 sm:px-6 md:px-12 py-3 sm:py-6 no-print">
        <div className="number-container w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 md:p-10 shadow-sm border border-gray-200 space-y-4 sm:space-y-7">
          {/* Order Status Banner */}
          {(() => {
            const currentStatus = String(orderInfo?.order_status || orderInfo?.status || 'PENDING').toUpperCase();
            const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';
            const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'SERVED' || currentStatus === 'PAID' || currentStatus === 'CONFIRMED';

            if (isCancelled) {
              return (
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white border border-rose-200/70 rounded-2xl p-3 sm:p-6 text-center space-y-2 shadow-xs">
                  <div className="flex justify-center mb-1">
                    <OrderStatusBadge status={currentStatus} />
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-rose-950 tracking-tight">
                    Order Has Been Cancelled
                  </h3>
                  <p className="text-[11px] sm:text-sm text-rose-700 font-medium max-w-sm mx-auto">
                    This order was cancelled by restaurant staff.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
                    <span className="bg-white text-rose-900 font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-lg border border-rose-200/80 shadow-2xs">
                      Order ID: #{order_id}
                    </span>
                  </div>
                </div>
              );
            }

            if (isCompleted || isSelfPosBilling) {
              return (
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-sky-50/40 to-white border border-emerald-200/70 rounded-2xl p-3 sm:p-6 text-center space-y-2 shadow-xs">
                  <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold shadow-2xs mb-1 max-w-full">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 flex-shrink-0"></span>
                    <span className="truncate">⚡ Bill Generated & Order Completed</span>
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-emerald-950 tracking-tight">
                    Order Completed!
                  </h3>
                  <p className="text-[11px] sm:text-sm text-emerald-700 font-medium max-w-sm mx-auto leading-relaxed">
                    {isSelfPosBilling 
                      ? `Counter order #${order_id} has been billed successfully.`
                      : `Your order #${order_id} has been completed. Thank you!`}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
                    <span className="bg-white text-emerald-900 font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
                      Order ID: #{order_id}
                    </span>
                    <span className="bg-white text-[#0077b6] font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-lg border border-[#0077b6]/20 shadow-2xs">
                      {isSelfPosBilling ? 'Type: Counter Billing' : (table ? (String(table).includes('Table') ? table : `Table #${table}`) : 'Walk-In')}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/70 rounded-2xl p-4 sm:p-6 text-center space-y-2 shadow-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Kitchen Preparing Order
                </div>

                <h3 className="text-base sm:text-xl font-black text-emerald-950 tracking-tight">
                  Order Active & Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700 font-medium max-w-sm mx-auto">
                  Kitchen staff is preparing your items.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="bg-white text-emerald-900 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-200/80 shadow-2xs">
                    Order ID: #{order_id}
                  </span>
                  {table && (
                    <span className="bg-white text-[#0077b6] font-black text-xs px-3 py-1.5 rounded-xl border border-[#0077b6]/20 shadow-2xs">
                      {String(table).includes('Table') ? table : `Table #${table}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Customer & Timestamp Info */}
          <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-600 bg-gray-50/80 p-3.5 sm:p-4 rounded-xl border border-gray-100 gap-2">
            <div>
              <span className="text-gray-400 font-medium">Customer: </span>
              <span className="font-bold text-gray-900">{guest_name || 'Guest Customer'}</span>
              {phone && <span className="text-gray-500 font-medium ml-1">({phone})</span>}
            </div>
            <div className="flex items-center gap-1 text-gray-500 font-medium">
              <Clock size={14} />
              <span>{cleanDate}</span>
            </div>
          </div>

          {/* Items Ordered List */}
          <div>
            <h4 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between border-b pb-2">
              <span>Ordered Items</span>
              <span className="text-gray-500 font-semibold">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </h4>
            
            <div className="divide-y divide-gray-100">
              {items.map((item: any, idx: number) => {
                const itemTotal = (parseFloat(item.price || item.unit_price || 0) * (parseInt(item.quantity || item.qty) || 1)).toFixed(2);
                return (
                  <div key={idx} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-gray-400 min-w-[16px]">{idx + 1}.</span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-xs sm:text-base leading-snug break-words">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                          ₹{parseFloat(item.price || item.unit_price || 0).toFixed(2)} × {item.quantity || item.qty}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] sm:text-xs text-amber-800 italic bg-amber-50 rounded px-2 py-0.5 mt-1 inline-block border border-amber-200/50">
                            Note: "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="font-extrabold text-gray-900 text-xs sm:text-base whitespace-nowrap">
                      ₹{itemTotal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bill-details border-t border-dashed border-gray-300 pt-4 space-y-2.5">
            <h4 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-wider mb-2">
              Bill Breakdown
            </h4>

            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">₹{subTotalNum.toFixed(2)}</span>
            </div>

            {serviceAmt > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                <span>Service Charge ({serviceChargeRate}%)</span>
                <span className="font-semibold text-gray-900">+₹{serviceAmt.toFixed(2)}</span>
              </div>
            )}

            {taxTotal > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-500 pl-2">
                  <span>CGST ({(posSettings?.financials?.cgst || 2.5)}%)</span>
                  <span>+₹{cgstAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pl-2">
                  <span>SGST ({(posSettings?.financials?.sgst || 2.5)}%)</span>
                  <span>+₹{sgstAmt.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between font-black text-base sm:text-lg text-gray-900">
              <span>Grand Total</span>
              <span className="text-[#0077b6]">₹{grandTotalNum.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider pt-3 border-t border-gray-100">
            Thank you for dining with Big Ben Restaurant!
          </div>
        </div>
      </div>

      {/* Unified Receipt Bill Print Component */}
      <ReceiptBillPrint
        orderId={order_id}
        dateStr={cleanDate}
        tableName={table ? (String(table).includes('Table') ? table : `Table #${table}`) : 'DINE-IN'}
        staffName="Staff"
        guestName={guest_name}
        items={items}
        subtotal={subTotalNum}
        taxRate={taxRate}
        cgstAmt={cgstAmt}
        sgstAmt={sgstAmt}
        serviceChargeRate={serviceChargeRate}
        serviceChargeAmt={serviceAmt}
        grandTotal={grandTotalNum}
        restaurantInfo={{
          name: posSettings?.restaurantName || posSettings?.restaurant_info?.name,
          address: posSettings?.address || posSettings?.restaurant_info?.address,
          city: posSettings?.city || posSettings?.restaurant_info?.city,
          state: posSettings?.state || posSettings?.restaurant_info?.state,
          pincode: posSettings?.pincode || posSettings?.restaurant_info?.pincode,
          gstin: posSettings?.gstin || posSettings?.restaurant_info?.gstin || posSettings?.restaurant_info?.gst_number,
          fssai: posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || posSettings?.restaurant_info?.fssai_number
        }}
      />

      {/* Curved Center-Raised FAB Bottom Navigation Bar (Hidden for self-pos-billing) */}
      {!isSelfPosBilling && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-2xl h-14 sm:h-16 flex items-center px-4 no-print">
          <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-around w-full relative">
            {/* Print Tab (Only for Staff/Waiters when order is not cancelled) */}
            {(() => {
              const currentStatus = String(orderInfo?.order_status || orderInfo?.status || 'PENDING').toUpperCase();
              const isOrderCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';
              if (!isGuestCustomer && !isOrderCancelled) {
                return (
                  <button 
                    onClick={handlePrint}
                    className="flex flex-col items-center justify-center px-2 text-gray-500 hover:text-amber-600 transition-colors cursor-pointer group"
                  >
                    <Printer size={20} className="group-hover:scale-110 transition-transform text-amber-500" />
                    <span className="text-[10px] font-extrabold tracking-wider uppercase mt-0.5 text-gray-600">Print</span>
                  </button>
                );
              }
              return null;
            })()}



            {/* MENU TAB (Always visible for Guest Customers on mobile; responsive for staff) */}
            <button 
              onClick={handleOrderMore}
              className={`${isGuestCustomer ? 'flex' : 'hidden md:flex'} flex-col items-center justify-center px-2 text-gray-500 hover:text-[#0077b6] transition-colors cursor-pointer group`}
            >
              <UtensilsCrossed size={20} className="group-hover:scale-110 transition-transform text-[#0077b6]" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase mt-0.5 text-gray-600">Menu</span>
            </button>

            {/* CENTER RAISED FAB BUTTON - TAKE NEW ORDER FOR WAITERS / ADD MORE FOR GUESTS */}
            <div className="relative -top-3.5 flex flex-col items-center justify-center">
              <button 
                onClick={handleTakeNewOrder}
                className="bg-gradient-to-tr from-[#0077b6] to-[#0284c7] hover:from-[#005f92] hover:to-[#0284c7] text-white p-3 rounded-full shadow-lg shadow-sky-500/35 border-4 border-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                title="Start Fresh New Order"
              >
                <ShoppingBag size={20} className="text-white" />
              </button>
              <span className="text-[10px] font-black tracking-wider uppercase text-[#0077b6] mt-0.5">
                {isGuestCustomer ? 'Order' : 'New'}
              </span>
            </div>

            {/* TABLES TAB FOR WAITERS (Only on Tablet & Desktop to avoid crowding mobile bar) */}
            {!isGuestCustomer && (
              <button 
                onClick={() => {
                  sessionStorage.removeItem('emenu_table');
                  localStorage.removeItem('emenu_cart');
                  navigate('/tables');
                }}
                className="hidden md:flex flex-col items-center justify-center px-2 text-gray-500 hover:text-[#0077b6] transition-colors cursor-pointer group"
              >
                <Grid size={20} className="group-hover:scale-110 transition-transform text-gray-500 group-hover:text-[#0077b6]" />
                <span className="text-[10px] font-extrabold tracking-wider uppercase mt-0.5 text-gray-600">Tables</span>
              </button>
            )}

            {/* HISTORY TAB FOR WAITERS/STAFF */}
            {!isGuestCustomer && (
              <Link 
                to="/history"
                className="flex flex-col items-center justify-center px-2 text-gray-500 hover:text-[#0077b6] transition-colors no-underline group"
              >
                <Clock size={20} className="group-hover:scale-110 transition-transform text-gray-500 group-hover:text-[#0077b6]" />
                <span className="text-[10px] font-extrabold tracking-wider uppercase mt-0.5 text-gray-600">History</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderNumberPage;
