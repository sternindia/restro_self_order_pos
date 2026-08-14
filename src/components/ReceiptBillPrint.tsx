import React from 'react';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
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
      {/* Thermal Printer CSS Rule */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-wrapper, .receipt-print-wrapper * {
            visibility: visible;
          }
          .receipt-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-w: 80mm;
            padding: 0;
            border: none;
            box-shadow: none;
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
