import React from 'react';

export interface ReceiptItem {
  name: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unit_price?: number;
  total_price?: number;
}

export interface ReceiptBillProps {
  orderId: string | number;
  dateStr?: string;
  tableName?: string;
  staffName?: string;
  guestName?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxRate?: number;
  cgstAmt?: number;
  sgstAmt?: number;
  serviceChargeRate?: number;
  serviceChargeAmt?: number;
  grandTotal: number;
  restaurantInfo?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    fssai?: string;
    phone?: string;
  };
}

export const printThermalReceiptDirect = async (props: ReceiptBillProps) => {
  const cleanOrderId = String(props.orderId).replace(/^#/i, '');
  const displayDate = props.dateStr || new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const taxRate = props.taxRate ?? 5.0;
  const halfTaxRate = (taxRate / 2).toFixed(1);
  const subtotal = Number(props.subtotal || 0);
  const calculatedCgst = props.cgstAmt !== undefined ? props.cgstAmt : (subtotal * (taxRate / 2)) / 100;
  const calculatedSgst = props.sgstAmt !== undefined ? props.sgstAmt : (subtotal * (taxRate / 2)) / 100;
  const serviceChargeRate = props.serviceChargeRate || 0;
  const serviceChargeAmt = props.serviceChargeAmt || 0;
  const grandTotal = Number(props.grandTotal || 0);
  const items = props.items || [];
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const restaurantInfo = props.restaurantInfo;
  const resName = restaurantInfo?.name || 'BIG BEN RESTAURANT';
  const resAddr = restaurantInfo?.address || '1st Flr, Sun Mill Compound, Lower Parel (West)';
  const resCityState = [restaurantInfo?.city, restaurantInfo?.state, restaurantInfo?.pincode].filter(Boolean).join(', ') || 'Mumbai, MH';
  const gstin = restaurantInfo?.gstin || '27AAAAA0000A1Z5';
  const fssai = restaurantInfo?.fssai || '10019022009876';

  const ESC = '\x1b', GS = '\x1d';

  const padRow = (left: string, right: string, width = 42) => {
    const l = String(left || '');
    const r = String(right || '');
    const spaces = width - l.length - r.length;
    if (spaces > 0) return l + ' '.repeat(spaces) + r;
    return l.slice(0, Math.max(0, width - r.length - 1)) + ' ' + r;
  };

  // ESC/POS Reset & Small/Compact Font B (\x1b!\x01) for crisp, non-wrapping 58mm layout
  let receipt = `${ESC}@${ESC}!\x01${ESC}a\x01${ESC}E\x01${resName.slice(0, 42)}\n${ESC}E\x00`;

  if (resAddr) {
    const addrWords = resAddr.split(' ');
    let line = '';
    addrWords.forEach(w => {
      if ((line + ' ' + w).trim().length <= 42) {
        line = (line + ' ' + w).trim();
      } else {
        receipt += `${line}\n`;
        line = w;
      }
    });
    if (line) receipt += `${line}\n`;
  }

  if (resCityState) {
    receipt += `${resCityState.slice(0, 42)}\n`;
  }
  if (gstin) receipt += `GSTIN: ${gstin}\n`;
  if (fssai) receipt += `FSSAI NO: ${fssai}\n`;

  receipt += `------------------------------------------\n${ESC}a\x00`;

  if (props.guestName) {
    receipt += `Name: ${props.guestName}\n`;
    receipt += `------------------------------------------\n`;
  }

  receipt += `${padRow(`Bill No: ${cleanOrderId}`, `Date: ${displayDate}`, 42)}\n`;
  receipt += `${padRow(`Dine In: ${props.tableName || 'DINE-IN'}`, `Cashier: ${props.staffName || 'Staff'}`, 42)}\n`;
  receipt += `------------------------------------------\n`;
  receipt += `${"Item".padEnd(20, ' ')}${" Qty. "}${" Price  "}${"  Amount"}\n`;
  receipt += `------------------------------------------\n`;

  items.forEach((item: any) => {
    const qty = Number(item.quantity || item.qty) || 1;
    const unitPrice = Number(item.price || item.unit_price) || 0;
    const itemAmount = item.total_price !== undefined ? Number(item.total_price) : unitPrice * qty;

    const rawName = String(item.name || 'Item').replace(/\s*\([^)]*Active Order[^)]*\)/gi, '').trim();
    const nameStr = rawName.slice(0, 20).padEnd(20, ' ');
    const qtyStr = `  ${String(qty)}`.padEnd(6, ' ');
    const priceStr = unitPrice.toFixed(2).padStart(7, ' ') + ' ';
    const amtStr = itemAmount.toFixed(2).padStart(8, ' ');

    receipt += `${nameStr}${qtyStr}${priceStr}${amtStr}\n`;
    if (rawName.length > 21) {
      receipt += `  ${rawName.slice(21, 40)}\n`;
    }
    if (item.selectedVariant) {
      receipt += `  Opt: ${item.selectedVariant.name}\n`;
    }
    if (item.notes && !item.notes.includes('Session Order') && !item.notes.includes('Active Order')) {
      receipt += `  * ${item.notes}\n`;
    }
  });

  receipt += `------------------------------------------\n`;
  receipt += `${padRow(`Total Qty: ${totalQty}`, `Sub Total ${subtotal.toFixed(2)}`, 42)}\n`;
  receipt += `${padRow(`  CGST ${halfTaxRate}%`, calculatedCgst.toFixed(2), 42)}\n`;
  receipt += `${padRow(`  SGST ${halfTaxRate}%`, calculatedSgst.toFixed(2), 42)}\n`;
  if (serviceChargeRate > 0 && serviceChargeAmt > 0) {
    receipt += `${padRow(`  Service Charge ${serviceChargeRate}%`, serviceChargeAmt.toFixed(2), 42)}\n`;
  }
  receipt += `------------------------------------------\n`;
  receipt += `${ESC}E\x01${padRow('Grand Total(INR)', grandTotal.toFixed(2), 42)}\n${ESC}E\x00`;
  receipt += `------------------------------------------\n${ESC}a\x01Thank you & Visit Again\n------------------------------------------\n\n\n\n${GS}V\x41\x03`;

  console.log('--- REAL-TIME THERMAL PRINTER RAW OUTPUT (42 CHARS) ---\n' + receipt);

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(receipt);

  // 1. TRY WEB SERIAL
  const navAny = navigator as any;
  if (navAny.serial) {
    try {
      const availablePorts = await navAny.serial.getPorts();
      let port = availablePorts[0];
      if (!port) {
        port = await navAny.serial.requestPort();
      }
      if (port) {
        await port.open({ baudRate: 9600 });
        const writer = port.writable?.getWriter();
        if (writer) {
          await writer.write(encodedData);
          writer.releaseLock();
          await port.close();
          return;
        }
      }
    } catch (err: any) {
      console.warn('Serial print error:', err?.message);
    }
  }
};

const ReceiptBillPrint: React.FC<ReceiptBillProps> = ({
  orderId,
  dateStr,
  tableName = 'DINE-IN',
  staffName = 'Staff',
  guestName,
  items = [],
  subtotal,
  taxRate = 5.0,
  cgstAmt,
  sgstAmt,
  serviceChargeRate = 0,
  serviceChargeAmt = 0,
  grandTotal,
  restaurantInfo
}) => {
  const cleanOrderId = String(orderId).replace(/^#/i, '');
  const displayDate = dateStr || new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  const halfTaxRate = (taxRate / 2).toFixed(1);
  const calculatedCgst = cgstAmt !== undefined ? cgstAmt : (subtotal * (taxRate / 2)) / 100;
  const calculatedSgst = sgstAmt !== undefined ? sgstAmt : (subtotal * (taxRate / 2)) / 100;

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const resName = restaurantInfo?.name || 'BIG BEN RESTAURANT';
  const resAddr = restaurantInfo?.address || '1st Flr, Sun Mill Compound, Lower Parel (West)';
  const resCityState = [restaurantInfo?.city, restaurantInfo?.state, restaurantInfo?.pincode].filter(Boolean).join(', ') || 'Mumbai, MH';
  const gstin = restaurantInfo?.gstin || '27AAAAA0000A1Z5';
  const fssai = restaurantInfo?.fssai || '10019022009876';

  return (
    <div className="receipt-print-wrapper font-mono text-[12px] text-black bg-white p-4 max-w-[320px] mx-auto border border-dashed border-gray-300 rounded-lg shadow-xs">
      {/* Thermal Printer Direct 80mm CSS Rule */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .receipt-print-wrapper, .receipt-print-wrapper * {
            visibility: visible !important;
          }
          .receipt-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm 2mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Header Info */}
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-black uppercase tracking-tight">{resName}</h2>
        <p className="text-[10px] leading-tight">{resAddr}</p>
        <p className="text-[10px]">{resCityState}</p>
        <p className="text-[10px] font-bold">GSTIN: {gstin}</p>
        <p className="text-[10px]">FSSAI NO: {fssai}</p>
      </div>

      <div className="my-2 border-b border-dashed border-gray-400" />

      {/* Order Meta Info */}
      <div className="text-[10.5px] space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No: <strong className="font-bold">#{cleanOrderId}</strong></span>
          <span>Date: {displayDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Table: <strong className="font-bold">{tableName}</strong></span>
          <span>Staff: {staffName}</span>
        </div>
        {guestName && (
          <div>
            <span>Customer: {guestName}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-b border-dashed border-gray-400" />

      {/* Items Table Header */}
      <div className="flex justify-between text-[11px] font-bold border-b border-gray-300 pb-1">
        <span className="w-1/2">Item</span>
        <span className="w-1/6 text-center">Qty</span>
        <span className="w-1/6 text-right">Price</span>
        <span className="w-1/6 text-right">Amt</span>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-100 py-1">
        {items.map((item, idx) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const lineTotal = item.total_price !== undefined ? Number(item.total_price) : price * qty;

          return (
            <div key={idx} className="flex justify-between text-[10.5px] py-0.5 leading-snug">
              <span className="w-1/2 truncate font-medium">{item.name}</span>
              <span className="w-1/6 text-center">{qty}</span>
              <span className="w-1/6 text-right">{price.toFixed(2)}</span>
              <span className="w-1/6 text-right font-bold">{lineTotal.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="my-2 border-b border-dashed border-gray-400" />

      {/* Totals Breakdown */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Total Qty: {totalQty}</span>
          <span className="font-bold">Sub Total: ₹{subtotal.toFixed(2)}</span>
        </div>

        {serviceChargeRate > 0 && serviceChargeAmt > 0 && (
          <div className="flex justify-between text-[10.5px]">
            <span>Service Charge ({serviceChargeRate}%)</span>
            <span>+₹{serviceChargeAmt.toFixed(2)}</span>
          </div>
        )}

        {taxRate > 0 && (
          <>
            <div className="flex justify-between text-[10.5px]">
              <span>CGST ({halfTaxRate}%)</span>
              <span>+₹{calculatedCgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span>SGST ({halfTaxRate}%)</span>
              <span>+₹{calculatedSgst.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="my-1.5 border-b border-dashed border-gray-400" />

        <div className="flex justify-between text-xs font-black pt-0.5">
          <span>Grand Total (INR)</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="my-2.5 border-b border-dashed border-gray-400" />

      {/* Footer */}
      <div className="text-center text-[10px] font-bold text-gray-700 space-y-0.5">
        <p>Thank you & Visit Again!</p>
        <p className="text-[9px] text-gray-500 font-normal">Powered by Restaurant POS System</p>
      </div>
    </div>
  );
};

export default ReceiptBillPrint;
