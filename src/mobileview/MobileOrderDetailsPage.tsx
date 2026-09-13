import React from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Receipt,
  Utensils,
  CreditCard,
  Info,
  Printer,
  RotateCcw,
  Armchair,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReceiptBillPrint, {
  printThermalReceiptDirect,
  type ReceiptBillProps,
} from "../components/ReceiptBillPrint";
import { API_BASE_URL } from "../config";

export interface MobileOrderDetailsProps {
  order?: any;
  onBack: () => void;
  onPrint?: (order: any) => void;
  onReorder?: (order: any) => void;
  onUpdateStatus?: (nextStatus: string) => void;
  onCancelOrder?: () => void;
}

export const MobileOrderDetailsPage: React.FC<MobileOrderDetailsProps> = ({
  order,
  onBack,
  onPrint,
  onReorder,
  onUpdateStatus,
  onCancelOrder,
}) => {
  const navigate = useNavigate();

  const targetOrder = order?.rawOrder || order;

  // 1. Order ID
  const rawId = targetOrder?.order_id || targetOrder?.id || order?.id || order?.order_id;
  const orderId = rawId
    ? String(rawId).startsWith("#")
      ? String(rawId)
      : `#${rawId}`
    : "#—";

  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('emenu_user') : null;
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isSuperAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';
  const isSelfPosBilling = roleAlias === 'self_billing_pos' || roleAlias === 'self_pos_billing' || roleAlias === 'self-pos-billing' || isSuperAdmin;

  // Track status state locally so button can advance status immediately
  const initialRawStatus = (
    isSelfPosBilling
      ? "completed"
      : (targetOrder?.resolved_status ||
         targetOrder?.order_status ||
         targetOrder?.status ||
         order?.status ||
         "Completed")
  ).toLowerCase();

  const [currentStatus, setCurrentStatus] = React.useState<string>(initialRawStatus);
  const [showCancelModal, setShowCancelModal] = React.useState<boolean>(false);

  React.useEffect(() => {
    setCurrentStatus(initialRawStatus);
  }, [initialRawStatus]);

  const isCancelled = currentStatus.includes("cancel") || currentStatus.includes("reject");
  const isCompleted = isSelfPosBilling || currentStatus.includes("complete") || currentStatus.includes("paid") || currentStatus.includes("closed");
  const isPreparing = currentStatus.includes("prepar") || currentStatus.includes("kitchen") || currentStatus.includes("process");
  const isReady = currentStatus.includes("ready") || currentStatus.includes("served") || currentStatus.includes("dispatch");
  const isPending = !isCancelled && !isCompleted && !isPreparing && !isReady;
  const isActive = !isCancelled && !isCompleted;

  // Persist status directly to server so History and Table status update immediately
  const syncMobileStatusToBackend = async (targetStatus: string) => {
    const targetOrderId = targetOrder?.order_id || targetOrder?.id || order?.order_id || order?.id;
    if (!targetOrderId) return;
    try {
      const tableIdNum = targetOrder?.table_number_id ? parseInt(String(targetOrder.table_number_id)) : null;
      const updatePayload = {
        order_status: targetStatus,
        status: targetStatus,
        table_number_id: tableIdNum,
      };

      let response = await fetch(`${API_BASE_URL}/order/update-status/${targetOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        await fetch(`${API_BASE_URL}/order/update-status/${targetOrderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
      }
    } catch (err) {
      console.warn("Failed to sync mobile status to server:", err);
    }
  };

  // 3. Date & Time
  const formattedDateTime = (() => {
    try {
      const rawDate = targetOrder?.created_at || targetOrder?.time || targetOrder?.date || order?.created_at;
      if (rawDate) {
        const d = new Date(
          typeof rawDate === "string" && rawDate.includes(" ")
            ? rawDate.replace(" ", "T")
            : rawDate
        );
        if (!isNaN(d.getTime())) {
          return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          }).replace(',', ' •');
        }
      }
    } catch {}
    return "Date N/A";
  })();

  // 4. Table & Type
  const rawTable = targetOrder?.table_name || targetOrder?.table_number || targetOrder?.table || order?.table || "Walk-In";
  const tableDisplay = String(rawTable);
  const orderType = targetOrder?.order_meta?.order_type || targetOrder?.order_type || order?.order_type || "Dine In";

  // 5. Items (Fully dynamic from backend order object)
  const orderItems = React.useMemo(() => {
    const rawItems = targetOrder?.items || order?.items;
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      return rawItems.map((item: any) => {
        const name = item.name || item.item_name || "Dish";
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(
          item.unit_price ||
            item.price ||
            (item.total_price ? item.total_price / qty : 0)
        );
        const total = Number(
          item.total_price || item.total || price * qty
        );

        return {
          name,
          variant: item.variant || "",
          qty,
          price,
          total,
          image:
            item.image ||
            item.image_url ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
        };
      });
    }

    if (order?.item) {
      const priceVal = Number(String(order.total || "0").replace(/[^0-9.]/g, "")) || 0;
      return [
        {
          name: order.item,
          variant: "",
          qty: 1,
          price: priceVal,
          total: priceVal,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
        }
      ];
    }

    return [];
  }, [targetOrder, order]);

  // Load POS Settings
  const posSettings = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("emenu_pos_settings");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  // 6. Financials (Matches Desktop HistoryPage 1-to-1)
  const taxRate = parseFloat(
    posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5
  );
  const halfTaxRate = (taxRate / 2).toFixed(1);

  const serviceChargeRate = parseFloat(
    posSettings?.financials?.service_charge_percentage ??
      posSettings?.serviceCharge ??
      0
  );

  const itemsSubtotal = orderItems.reduce((acc, i) => acc + i.total, 0);

  const subtotal = Number(
    targetOrder?.bill?.subtotal ?? targetOrder?.subTotal ?? targetOrder?.subtotal ?? itemsSubtotal
  );

  const serviceChargeAmt = Number(
    targetOrder?.bill?.service_charge ?? targetOrder?.serviceCharge ??
      (serviceChargeRate > 0 ? (subtotal * serviceChargeRate) / 100 : 0)
  );

  const totalGst = Number(
    targetOrder?.bill?.tax_amount ?? targetOrder?.tax ?? (subtotal * (taxRate / 100))
  );

  const cgst = Number((totalGst / 2).toFixed(2));
  const sgst = Number((totalGst / 2).toFixed(2));

  const grandTotal = Number(
    targetOrder?.bill?.grand_total ?? targetOrder?.total ?? targetOrder?.grand_total ?? (subtotal + totalGst + serviceChargeAmt)
  );

  // 7. Payment details
  const paymentMethod =
    targetOrder?.bill?.payment_method || targetOrder?.payment_method || order?.payment_method || "Cash";
  const billNo =
    targetOrder?.bill?.bill_number || targetOrder?.bill_number || `BILL-${orderId.replace("#", "")}`;
  const orderSource = targetOrder?.order_meta?.order_type || targetOrder?.source || "POS (Counter)";
  const createdBy =
    targetOrder?.staff_name || targetOrder?.order_meta?.staff_name || targetOrder?.created_by || "Staff";
  const notes = targetOrder?.notes || "No additional notes";

  // Prepare standard thermal print data
  const printData: ReceiptBillProps = React.useMemo(() => {
    const taxRate = parseFloat(
      posSettings?.financials?.tax_rate_percentage ?? posSettings?.taxRate ?? 5
    );
    const serviceRate = parseFloat(
      posSettings?.financials?.service_charge_percentage ??
        posSettings?.serviceCharge ??
        0
    );

    return {
      orderId: orderId.replace(/^#/i, ""),
      dateStr: formattedDateTime,
      tableName: tableDisplay,
      staffName: createdBy,
      guestName: order?.guest_name || order?.customer_name,
      items: orderItems.map((it: any) => ({
        name: it.name,
        quantity: it.qty,
        price: it.price,
        total_price: it.total,
      })),
      subtotal: subtotal,
      taxRate: taxRate,
      cgstAmt: cgst,
      sgstAmt: sgst,
      serviceChargeRate: serviceRate,
      serviceChargeAmt: order?.bill?.service_charge ?? 0,
      grandTotal: grandTotal,
      restaurantInfo:
        posSettings?.restaurantInfo ||
        posSettings?.business_info || {
          name:
            posSettings?.restaurantName ||
            posSettings?.restaurant_info?.name ||
            "BIG BEN RESTAURANT",
          address:
            posSettings?.address ||
            posSettings?.restaurant_info?.address ||
            "1st Flr, Sun Mill Compound, Lower Parel",
          city:
            posSettings?.city ||
            posSettings?.restaurant_info?.city ||
            "Mumbai",
          state:
            posSettings?.state ||
            posSettings?.restaurant_info?.state ||
            "MH",
          pincode:
            posSettings?.pincode ||
            posSettings?.restaurant_info?.pincode ||
            "",
          gstin:
            posSettings?.gstin ||
            posSettings?.restaurant_info?.gstin ||
            "27AAAAA0000A1Z5",
          fssai:
            posSettings?.fssaiNo ||
            posSettings?.restaurant_info?.fssai_no ||
            "10019022009876",
        },
    };
  }, [
    orderId,
    formattedDateTime,
    tableDisplay,
    createdBy,
    order,
    orderItems,
    subtotal,
    totalGst,
    cgst,
    sgst,
    grandTotal,
    posSettings,
  ]);

  // Handle Print
  const handlePrint = () => {
    if (onPrint) {
      onPrint(order);
      return;
    }

    const isThermalOn =
      posSettings?.enableThermalPrinting ??
      posSettings?.enable_thermal_printing ??
      true;

    if (isThermalOn) {
      printThermalReceiptDirect(printData);
      return;
    }

    window.print();
  };

  // Handle Reorder
  const handleReorder = () => {
    if (onReorder) {
      onReorder(order);
    } else {
      try {
        const cartStr = localStorage.getItem("emenu_cart");
        const cart = cartStr ? JSON.parse(cartStr) : {};
        orderItems.forEach((item, index) => {
          const key = `reorder_${item.name}_${index}`;
          cart[key] = {
            id: key,
            name: item.name,
            price: item.price,
            quantity: item.qty,
            image: item.image,
          };
        });
        localStorage.setItem("emenu_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("emenu_cart_updated"));
        navigate("/cart");
      } catch (err) {
        console.error("Reorder failed", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] text-slate-900 dark:text-white font-sans w-full max-w-full overflow-x-hidden">
      {/* Thermal POS Receipt Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden on screen, active only for browser print */}
      <div className="hidden print:block">
        <ReceiptBillPrint {...printData} />
      </div>

      {/* Mobile App Container */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#faf9f7] dark:bg-[#16161d] overflow-x-hidden flex flex-col justify-between no-print">
        {/* =====================================================
            HEADER (Compact & Clean)
        ===================================================== */}
        <header className="sticky top-0 z-30 flex h-[50px] shrink-0 items-center justify-between bg-[#faf9f7]/95 dark:bg-[#1a1a22]/95 px-2.5 sm:px-3 border-b border-slate-200/70 dark:border-zinc-800 backdrop-blur-md">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>

          <h1 className="text-[16px] sm:text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Order Details
          </h1>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal size={20} strokeWidth={2.2} />
          </button>
        </header>

        {/* =====================================================
            SCROLLABLE CONTENT (Tight padding, zero wasted space)
        ===================================================== */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-2.5 pb-6">
          {/* =================================================
              ORDER SUMMARY CARD
          ================================================= */}
          <section className="mt-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-3 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              {/* Order ID + Status + Date */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] sm:text-[22px] font-normal tracking-tight text-slate-900 dark:text-white leading-none">
                    {orderId}
                  </h2>

                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fee2e2] dark:bg-rose-950/40 px-2 py-0.5 text-[10.5px] font-normal text-[#ef4444] dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                      Cancelled
                    </span>
                  ) : isPreparing ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10.5px] font-normal text-blue-600 dark:text-blue-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Preparing
                    </span>
                  ) : isReady ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[10.5px] font-normal text-purple-600 dark:text-purple-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Ready
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] dark:bg-amber-950/40 px-2 py-0.5 text-[10.5px] font-normal text-[#d97706] dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#dff9ed] dark:bg-emerald-950/40 px-2 py-0.5 text-[10.5px] font-normal text-[#079455] dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]" />
                      Completed
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">
                  {formattedDateTime}
                </p>
              </div>

              {/* Table + Dine In Badges */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <InfoBadge
                  icon={<Armchair size={13} strokeWidth={2.2} />}
                  text={tableDisplay}
                />

                <InfoBadge
                  icon={<Utensils size={13} strokeWidth={2.2} />}
                  text={orderType}
                />
              </div>
            </div>
          </section>

          {/* =================================================
              ITEMS ORDERED
          ================================================= */}
          <section className="mt-2.5 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] shadow-2xs">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0e8] dark:bg-[#ff5a1f]/20 text-[#ff5722]">
                  <Receipt size={16} strokeWidth={2.2} />
                </div>

                <h3 className="text-[13.5px] font-normal text-slate-900 dark:text-white">
                  Items Ordered
                </h3>
              </div>

              <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400">
                {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_32px_58px_64px] border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#2a2a35] px-3 py-1.5 text-[10px] font-normal uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {orderItems.map((item, index) => (
                <OrderItem
                  key={`${item.name}-${index}`}
                  item={item}
                />
              ))}
            </div>

            {/* =================================================
                BILL SUMMARY (Matches Mobile Cart breakdown with smaller CGST/SGST font)
            ================================================= */}
            <div className="border-t border-slate-100 dark:border-zinc-800 px-3 py-3 space-y-2">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-slate-800 dark:text-zinc-300 font-normal text-[14px]">
                  Subtotal
                </span>
                <span className="text-slate-900 dark:text-white font-normal text-[14px]">
                  {subtotal.toFixed(2)} Rs
                </span>
              </div>

              {/* Service Charge (if applicable) */}
              {serviceChargeRate > 0 && serviceChargeAmt > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-zinc-400 font-normal text-[11.5px]">
                    Service Charge ({serviceChargeRate}%)
                  </span>
                  <span className="text-slate-900 dark:text-zinc-200 font-normal text-[11.5px]">
                    +{serviceChargeAmt.toFixed(2)} Rs
                  </span>
                </div>
              )}

              {/* CGST & SGST */}
              {taxRate > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 dark:text-zinc-300 font-normal text-[11.5px]">
                      CGST ({halfTaxRate}%)
                    </span>
                    <span className="text-slate-900 dark:text-zinc-200 font-normal text-[11.5px]">
                      +{cgst.toFixed(2)} Rs
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 dark:text-zinc-300 font-normal text-[11.5px]">
                      SGST ({halfTaxRate}%)
                    </span>
                    <span className="text-slate-900 dark:text-zinc-200 font-normal text-[11.5px]">
                      +{sgst.toFixed(2)} Rs
                    </span>
                  </div>
                </>
              )}

              {/* Dashed line and To Pay (Grand Total) */}
              <div className="border-t border-dashed border-gray-300 dark:border-zinc-700 pt-2.5 flex items-center justify-between">
                <span className="text-[14px] font-normal text-slate-900 dark:text-white">
                  To Pay (Grand Total)
                </span>
                <span className="text-[18px] font-normal text-[#f05a24]">
                  {grandTotal.toFixed(2)} Rs
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              PAYMENT DETAILS
          ================================================= */}
          <section className="mt-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-3 shadow-2xs">
            <CardTitle
              icon={<CreditCard size={16} strokeWidth={2.2} />}
              title="Payment Details"
            />

            <div className="mt-2 border-t border-slate-100 dark:border-zinc-800 pt-2 space-y-1">
              <DetailRow
                label="Payment Method"
                value={
                  <span className="flex items-center gap-1.5 font-normal text-slate-800 dark:text-zinc-200">
                    <CreditCard size={14} className="text-slate-500 dark:text-zinc-400" />
                    {paymentMethod}
                  </span>
                }
              />

              <DetailRow
                label="Paid Amount"
                value={<span className="font-normal text-slate-900 dark:text-white">₹{grandTotal.toFixed(2)}</span>}
              />

              <DetailRow
                label="Payment Status"
                value={
                  isCancelled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fee2e2] dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-normal text-[#ef4444] dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                      Unpaid
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-normal text-[#d97706] dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#dff9ed] dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-normal text-[#079455] dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]" />
                      Paid
                    </span>
                  )
                }
              />

              <DetailRow label="Bill No." value={billNo} />
            </div>
          </section>

          {/* =================================================
              ADDITIONAL INFO
          ================================================= */}
          <section className="mt-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-3 shadow-2xs">
            <CardTitle icon={<Info size={16} strokeWidth={2.2} />} title="Additional Info" />

            <div className="mt-2 border-t border-slate-100 dark:border-zinc-800 pt-2 space-y-1">
              <DetailRow label="Order Source" value={orderSource} />
              <DetailRow label="Created By" value={createdBy} />
              <DetailRow
                label="Notes"
                value={
                  notes === "No additional notes" ? (
                    <span className="text-slate-400 dark:text-zinc-500">{notes}</span>
                  ) : (
                    notes
                  )
                }
              />
            </div>
          </section>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}
          <section className="mt-3.5 mb-4 space-y-2.5">
            {/* Complete Order Button for Active Orders */}
            {isActive && (
              <button
                type="button"
                onClick={async () => {
                  const next = "completed";
                  setCurrentStatus(next);
                  if (onUpdateStatus) {
                    onUpdateStatus(next);
                  } else {
                    if (targetOrder) {
                      targetOrder.order_status = "COMPLETED";
                      targetOrder.resolved_status = "COMPLETED";
                      try {
                        localStorage.setItem("emenu_last_order", JSON.stringify(targetOrder));
                      } catch {}
                    }
                  }
                  await syncMobileStatusToBackend("COMPLETED");
                }}
                className="w-full flex h-[44px] items-center justify-center gap-2 rounded-xl bg-[#ff5722] hover:bg-[#e64a19] text-[13.5px] font-normal text-white shadow-xs active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>Complete Order</span>
              </button>
            )}

            {/* Secondary Buttons Row */}
            <div className={`grid gap-2.5 ${isPending ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {isPending && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex h-[42px] items-center justify-center gap-2 rounded-xl border border-[#ff5722] bg-white dark:bg-transparent text-[13px] font-normal text-[#ff5722] active:scale-95 transition cursor-pointer hover:bg-orange-50/50 dark:hover:bg-zinc-800"
                >
                  <Printer size={16} />
                  Print Bill
                </button>
              )}

              <button
                type="button"
                onClick={handleReorder}
                className={`flex h-[42px] items-center justify-center gap-2 rounded-xl text-[13px] font-normal active:scale-95 transition cursor-pointer ${
                  isActive
                    ? 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#2a2a35]'
                    : 'bg-[#ff5722] text-white hover:bg-[#e64a19] shadow-xs'
                }`}
              >
                <RotateCcw size={16} />
                Reorder
              </button>
            </div>

            {/* Cancel Order Button for Active Orders */}
            {isActive && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full flex h-[40px] items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-[12.5px] font-normal text-red-600 dark:text-red-400 hover:bg-red-100/70 transition cursor-pointer active:scale-95"
              >
                <Ban size={15} />
                <span>Cancel Order</span>
              </button>
            )}
          </section>
        </main>
      </div>

      {/* Confirmation Popup Modal for Cancelling Order (Matching Exact UI Design) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-[340px] bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800/80 p-6 text-center overflow-hidden">
            {/* Soft pink corner decorative glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-red-100/60 dark:bg-red-950/30 rounded-full blur-xl pointer-events-none" />

            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100/80 dark:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Centered Trash Icon with decorative rays */}
            <div className="relative mx-auto mb-3 flex items-center justify-center w-18 h-18">
              {/* Left decorative rays */}
              <div className="absolute -left-1 flex flex-col gap-1 opacity-80">
                <span className="w-2 h-[2px] bg-[#ef4444] rounded-full rotate-[-25deg]" />
                <span className="w-3 h-[2px] bg-[#ef4444] rounded-full rotate-[15deg]" />
              </div>

              {/* Icon Circle */}
              <div className="w-14 h-14 rounded-full bg-[#fef2f2] dark:bg-red-950/40 flex items-center justify-center text-[#ef4444] shadow-xs">
                <Trash2 size={24} strokeWidth={2.2} />
              </div>

              {/* Right decorative rays */}
              <div className="absolute -right-1 flex flex-col gap-1 opacity-80">
                <span className="w-2 h-[2px] bg-[#ef4444] rounded-full rotate-[25deg]" />
                <span className="w-3 h-[2px] bg-[#ef4444] rounded-full rotate-[-15deg]" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-normal text-slate-900 dark:text-white tracking-tight mb-1">
              Cancel Order?
            </h3>

            {/* Subtitle */}
            <p className="text-xs font-normal text-slate-500 dark:text-zinc-400 mb-5">
              Order {orderId} will be cancelled.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="h-[42px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-normal hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer active:scale-95"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowCancelModal(false);
                  setCurrentStatus("cancelled");
                  if (onCancelOrder) {
                    onCancelOrder();
                  } else {
                    if (targetOrder) {
                      targetOrder.order_status = "CANCELLED";
                      targetOrder.resolved_status = "CANCELLED";
                      try {
                        localStorage.setItem("emenu_last_order", JSON.stringify(targetOrder));
                      } catch {}
                    }
                    navigate("/history");
                  }
                  await syncMobileStatusToBackend("CANCELLED");
                }}
                className="h-[42px] rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-normal transition cursor-pointer shadow-md shadow-red-500/20 active:scale-95"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =============================================================
   INFO BADGE (Compact Pill)
============================================================= */
function InfoBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff7f1] dark:bg-[#ff5a1f]/15 px-2 py-1 text-[#ff5722] text-[11px] font-bold">
      {icon}
      <span>{text}</span>
    </div>
  );
}

/* =============================================================
   CARD TITLE
============================================================= */
function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0e8] dark:bg-[#ff5a1f]/20 text-[#ff5722]">
        {icon}
      </div>
      <h3 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">{title}</h3>
    </div>
  );
}

/* =============================================================
   ORDER ITEM (Optimized widths, no ugly truncation)
============================================================= */
function OrderItem({ item }: { item: any }) {
  return (
    <div className="grid grid-cols-[1fr_32px_58px_64px] items-center px-3 py-2">
      {/* Item with Thumbnail + Name */}
      <div className="flex min-w-0 items-center gap-2 pr-1">
        <img
          src={item.image}
          alt={item.name}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p
            className="truncate text-[12px] font-normal text-slate-900 dark:text-zinc-200 leading-tight"
            title={item.name}
          >
            {item.name}
          </p>
          {item.variant ? (
            <p className="text-[10px] font-normal text-slate-400 dark:text-zinc-400 leading-none mt-0.5">
              {item.variant}
            </p>
          ) : null}
        </div>
      </div>

      {/* Qty */}
      <div className="text-center text-[12px] font-normal text-slate-700 dark:text-zinc-300">
        {item.qty}
      </div>

      {/* Price */}
      <div className="text-right text-[11.5px] font-normal text-slate-600 dark:text-zinc-400">
        ₹{item.price.toFixed(2)}
      </div>

      {/* Total */}
      <div className="text-right text-[12px] font-normal text-slate-900 dark:text-white">
        ₹{item.total.toFixed(2)}
      </div>
    </div>
  );
}

/* =============================================================
   DETAIL ROW
============================================================= */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11.5px]">
      <span className="shrink-0 text-slate-500 dark:text-zinc-400 font-medium">{label}</span>
      <span className="text-right text-slate-800 dark:text-zinc-200 font-medium truncate">
        {value}
      </span>
    </div>
  );
}

export default MobileOrderDetailsPage;
