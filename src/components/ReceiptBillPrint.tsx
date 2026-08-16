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

export const printThermalReceiptDirect = (props: ReceiptBillProps) => {
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

  const itemsHtml = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = item.total_price !== undefined ? Number(item.total_price) : price * qty;
    return `
      <div style="display:flex; justify-content:space-between; font-size:10.5px; padding:1.5px 0;">
        <span style="width:50%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500;">${item.name}</span>
        <span style="width:16.66%; text-align:center;">${qty}</span>
        <span style="width:16.66%; text-align:right;">${price.toFixed(2)}</span>
        <span style="width:16.66%; text-align:right; font-weight:bold;">${lineTotal.toFixed(2)}</span>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Bill #${cleanOrderId}</title>
      <style>
        @page { size: 80mm auto; margin: 0mm; }
        html, body {
          width: 80mm;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-family: monospace, Courier, monospace;
          color: #000000;
          font-size: 11px;
        }
        .wrapper {
          width: 80mm;
          padding: 4mm 3mm;
          box-sizing: border-box;
        }
        .divider {
          border-bottom: 1px dashed #444;
          margin: 4px 0;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div style="text-align:center;">
          <div style="font-size:13px; font-weight:bold; text-transform:uppercase;">${resName}</div>
          <div style="font-size:9.5px; line-height:1.2;">${resAddr}</div>
          <div style="font-size:9.5px;">${resCityState}</div>
          <div style="font-size:9.5px; font-weight:bold;">GSTIN: ${gstin}</div>
          <div style="font-size:9.5px;">FSSAI NO: ${fssai}</div>
        </div>

        <div class="divider"></div>

        <div style="font-size:10px;">
          <div class="flex-between"><span>Bill No: <strong>#${cleanOrderId}</strong></span><span>Date: ${displayDate}</span></div>
          <div class="flex-between"><span>Table: <strong>${props.tableName || 'DINE-IN'}</strong></span><span>Staff: ${props.staffName || 'Staff'}</span></div>
          ${props.guestName ? `<div>Customer: ${props.guestName}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="flex-between" style="font-size:10.5px; font-weight:bold; border-bottom:1px solid #333; padding-bottom:2px;">
          <span style="width:50%;">Item</span>
          <span style="width:16.66%; text-align:center;">Qty</span>
          <span style="width:16.66%; text-align:right;">Price</span>
          <span style="width:16.66%; text-align:right;">Amt</span>
        </div>

        <div>${itemsHtml}</div>

        <div class="divider"></div>

        <div style="font-size:10.5px;">
          <div class="flex-between"><span>Total Qty: ${totalQty}</span><span style="font-weight:bold;">Sub Total: ₹${subtotal.toFixed(2)}</span></div>
          ${serviceChargeRate > 0 && serviceChargeAmt > 0 ? `<div class="flex-between"><span>Service Charge (${serviceChargeRate}%)</span><span>+₹${serviceChargeAmt.toFixed(2)}</span></div>` : ''}
          ${taxRate > 0 ? `
            <div class="flex-between"><span>CGST (${halfTaxRate}%)</span><span>+₹${calculatedCgst.toFixed(2)}</span></div>
            <div class="flex-between"><span>SGST (${halfTaxRate}%)</span><span>+₹${calculatedSgst.toFixed(2)}</span></div>
          ` : ''}
          <div class="divider"></div>
          <div class="flex-between" style="font-size:12px; font-weight:bold;">
            <span>Grand Total (INR)</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="text-align:center; font-size:9.5px; font-weight:bold; margin-top:4px;">
          Thank you & Visit Again!
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    let iframe = document.getElementById('silent-thermal-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'silent-thermal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          const win = window.open('', '_blank', 'width=380,height=600');
          if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
            setTimeout(() => win.close(), 500);
          }
        }
      }, 250);
    }
  } catch (err) {
    window.print();
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
