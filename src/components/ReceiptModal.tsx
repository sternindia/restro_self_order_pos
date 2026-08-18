import React from 'react';

const cleanOrderIdHelper = (id: any) => {
    if (!id) return '1001';
    let s = String(id).trim();
    s = s.replace(/^#?TBL-Table\s*#?/i, '');
    s = s.replace(/^#?TBL-/i, '');
    s = s.replace(/^#?Table\s*#?/i, '');
    s = s.replace(/^#/i, '');
    return s || '1001';
};

const cleanItemNameHelper = (name: any) => {
    if (!name) return '';
    return String(name).replace(/\s*\([^)]*Active Order[^)]*\)/gi, '').trim();
};

export const generateReceiptHtml = (selectedHistoryOrder: any, posSettings: any) => {
    if (!selectedHistoryOrder) return '';

    const items = selectedHistoryOrder.items || [];
    const totalQty = items.reduce((acc: number, item: any) => acc + (parseInt(item.quantity || item.qty) || 1), 0);
    const taxRate = posSettings?.taxRate ?? (posSettings?.financials?.tax_rate_percentage ? parseFloat(posSettings.financials.tax_rate_percentage) : 5);
    const serviceChargeRate = posSettings?.serviceCharge ?? (posSettings?.financials?.service_charge_percentage ? parseFloat(posSettings.financials.service_charge_percentage) : 10);
    const subtotal = selectedHistoryOrder.subtotal ?? selectedHistoryOrder.subTotal ?? selectedHistoryOrder.bill?.subtotal ?? (selectedHistoryOrder.total / (1 + (taxRate + serviceChargeRate) / 100));
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const taxTotal = selectedHistoryOrder.tax ?? selectedHistoryOrder.bill?.tax_amount ?? (subtotal * (taxRate / 100));
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const serviceAmt = selectedHistoryOrder.serviceCharge ?? selectedHistoryOrder.bill?.service_charge ?? (subtotal * (serviceChargeRate / 100));
    const grandTotal = selectedHistoryOrder.total ?? selectedHistoryOrder.bill?.grand_total ?? (subtotal + taxTotal + serviceAmt);

    const formattedDate = selectedHistoryOrder.time || selectedHistoryOrder.created_at
        ? new Date(String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).includes(' ') ? String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).replace(' ', 'T') : String(selectedHistoryOrder.time || selectedHistoryOrder.created_at)).toLocaleDateString('en-GB') + ' ' + new Date(String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).includes(' ') ? String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).replace(' ', 'T') : String(selectedHistoryOrder.time || selectedHistoryOrder.created_at)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleString();

    const itemsRowsHtml = items.map((item: any) => {
        const qty = parseInt(item.quantity || item.qty) || 1;
        const unitPrice = Number(item.price || item.unit_price || 0) + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        const itemAmount = unitPrice * qty;
        const cleanName = cleanItemNameHelper(item.name || item.item_name || 'Item');
        const hasNotes = item.notes && !item.notes.includes('Session Order') && !item.notes.includes('Active Order');

        return `
            <div style="margin-bottom: 3px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10px;">
                    <span style="flex: 1; min-width: 0; text-align: left; word-break: break-word; overflow-wrap: break-word; padding-right: 4px;">${cleanName}</span>
                    <span style="width: 28px; text-align: center; flex-shrink: 0;">${qty}</span>
                    <span style="width: 52px; text-align: right; flex-shrink: 0;">${unitPrice.toFixed(2)}</span>
                    <span style="width: 56px; text-align: right; flex-shrink: 0;">${itemAmount.toFixed(2)}</span>
                </div>
                ${item.selectedVariant ? `<div style="font-size: 9px; color: #555; padding-left: 4px;">Opt: ${item.selectedVariant.name}</div>` : ''}
                ${hasNotes ? `<div style="font-size: 9px; color: #555; font-style: italic; padding-left: 4px;">* ${item.notes}</div>` : ''}
            </div>
        `;
    }).join('');

    const displayOrderId = cleanOrderIdHelper(selectedHistoryOrder.order_id);
    const rawTable = selectedHistoryOrder.table_number || selectedHistoryOrder.table_name || selectedHistoryOrder.table;
    const tableText = (rawTable && rawTable !== 'N/A') ? `Dine In: ${String(rawTable).startsWith('Table') ? rawTable : `Table #${rawTable}`}` : `Type: ${selectedHistoryOrder.type || 'Takeaway'}`;

    const resName = posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'Big Ben Restaurant';
    const resAddr = posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel';
    const resCityState = [posSettings?.city || posSettings?.restaurant_info?.city, posSettings?.state || posSettings?.restaurant_info?.state, posSettings?.pincode || posSettings?.restaurant_info?.pincode].filter(Boolean).join(', ') || 'Mumbai, MH';
    const gstin = posSettings?.gstin || posSettings?.restaurant_info?.gstin || '27AAAAA0000A1Z5';
    const fssaiNo = posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || '10019022009876';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>POS Receipt ${displayOrderId}</title>
            <style>
                @page {
                    size: auto;
                    margin: 0mm !important;
                }
                * {
                    box-sizing: border-box !important;
                }
                html, body {
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #fff !important;
                    color: #000 !important;
                    font-family: 'Inconsolata', 'Consolas', 'Courier New', monospace;
                    font-size: 10.5px;
                    line-height: 1.25;
                }
                .receipt-wrapper {
                    width: 100%;
                    max-width: 100%;
                    margin: 0;
                    padding: 4px 6px;
                    box-sizing: border-box;
                }
                @media print {
                    html, body, .receipt-wrapper {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 2px 4px !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-wrapper">
                <div style="text-align: center; margin-bottom: 6px;">
                    <div style="font-size: 14px; font-weight: bold;">${resName}</div>
                    <div style="font-size: 10px;">${resAddr}</div>
                    <div style="font-size: 10px;">${resCityState}</div>
                    ${gstin ? `<div style="font-size: 10px;">GSTIN: ${gstin}</div>` : ''}
                    ${fssaiNo ? `<div style="font-size: 10px;">FSSAI NO: ${fssaiNo}</div>` : ''}
                </div>

                <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

                ${(selectedHistoryOrder.customer_name || selectedHistoryOrder.guest_name) ? `
                    <div style="font-size: 10px;">
                        Customer Name: ${selectedHistoryOrder.customer_name || selectedHistoryOrder.guest_name} ${selectedHistoryOrder.customer_phone || selectedHistoryOrder.phone ? `(${selectedHistoryOrder.customer_phone || selectedHistoryOrder.phone})` : ''}
                    </div>
                    <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <span>Bill No: ${displayOrderId}</span>
                    <span>Date: ${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <span>${tableText}</span>
                    <span>Cashier: ${selectedHistoryOrder.server || selectedHistoryOrder.staff_name || 'Ravi'}</span>
                </div>

                <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
                    <span style="flex: 1; text-align: left; padding-right: 4px;">Item</span>
                    <span style="width: 28px; text-align: center; flex-shrink: 0;">Qty.</span>
                    <span style="width: 52px; text-align: right; flex-shrink: 0;">Price</span>
                    <span style="width: 56px; text-align: right; flex-shrink: 0;">Amount</span>
                </div>

                <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

                ${itemsRowsHtml}

                <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

                <div style="font-size: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>Total Qty: ${totalQty}</span>
                        <span>Sub Total &nbsp;&nbsp;${Number(subtotal).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                        <span>CGST ${halfTaxRate}% &nbsp;&nbsp;${Number(cgstAmt).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                        <span>SGST ${halfTaxRate}% &nbsp;&nbsp;${Number(sgstAmt).toFixed(2)}</span>
                    </div>
                    ${serviceChargeRate > 0 ? `
                        <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                            <span>Service Charge ${serviceChargeRate}% &nbsp;&nbsp;${Number(serviceAmt).toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 13px; margin-top: 5px; padding-top: 2px;">
                        <span>Grand Total(INR)</span>
                        <span>${Number(grandTotal).toFixed(2)}</span>
                    </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 5px 0 4px 0;"></div>

                <div style="text-align: center; font-size: 11px; font-weight: 500; padding: 2px 0;">
                    Thank you & Visit Again
                </div>

                <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `;
};

export const triggerPrintReceipt = (selectedHistoryOrder: any, posSettings: any, printDirectFn: any = null) => {
    if (printDirectFn) {
        printDirectFn(selectedHistoryOrder);
        return;
    }
    const receiptHtml = generateReceiptHtml(selectedHistoryOrder, posSettings);
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
    }
};

const ReceiptModal: React.FC<{
    selectedHistoryOrder: any;
    setSelectedHistoryOrder: (val: any) => void;
    posSettings: any;
    onPrintDirect?: ((order: any) => void) | null;
}> = ({ selectedHistoryOrder, setSelectedHistoryOrder, posSettings, onPrintDirect = null }) => {
    if (!selectedHistoryOrder) return null;

    const items = selectedHistoryOrder.items || [];
    const totalQty = items.reduce((acc: number, item: any) => acc + (parseInt(item.quantity || item.qty) || 1), 0);
    const taxRate = posSettings?.taxRate ?? (posSettings?.financials?.tax_rate_percentage ? parseFloat(posSettings.financials.tax_rate_percentage) : 5);
    const serviceChargeRate = posSettings?.serviceCharge ?? (posSettings?.financials?.service_charge_percentage ? parseFloat(posSettings.financials.service_charge_percentage) : 10);
    const subtotal = Number(selectedHistoryOrder.subtotal ?? selectedHistoryOrder.subTotal ?? selectedHistoryOrder.bill?.subtotal ?? (selectedHistoryOrder.total / (1 + (taxRate + serviceChargeRate) / 100)));
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const taxTotal = Number(selectedHistoryOrder.tax ?? selectedHistoryOrder.bill?.tax_amount ?? (subtotal * (taxRate / 100)));
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const serviceAmt = Number(selectedHistoryOrder.serviceCharge ?? selectedHistoryOrder.bill?.service_charge ?? (subtotal * (serviceChargeRate / 100)));
    const grandTotal = Number(selectedHistoryOrder.total ?? selectedHistoryOrder.bill?.grand_total ?? (subtotal + taxTotal + serviceAmt));

    const formattedDate = selectedHistoryOrder.time || selectedHistoryOrder.created_at
        ? new Date(String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).includes(' ') ? String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).replace(' ', 'T') : String(selectedHistoryOrder.time || selectedHistoryOrder.created_at)).toLocaleDateString('en-GB') + ' ' + new Date(String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).includes(' ') ? String(selectedHistoryOrder.time || selectedHistoryOrder.created_at).replace(' ', 'T') : String(selectedHistoryOrder.time || selectedHistoryOrder.created_at)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleString();

    const displayOrderId = cleanOrderIdHelper(selectedHistoryOrder.order_id);
    const rawTable = selectedHistoryOrder.table_number || selectedHistoryOrder.table_name || selectedHistoryOrder.table;
    const tableText = (rawTable && rawTable !== 'N/A') ? `Dine In: ${String(rawTable).startsWith('Table') ? rawTable : `Table #${rawTable}`}` : `Type: ${selectedHistoryOrder.type || 'Takeaway'}`;

    const resName = posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'Big Ben Restaurant';
    const resAddr = posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel';
    const resCityState = [posSettings?.city || posSettings?.restaurant_info?.city, posSettings?.state || posSettings?.restaurant_info?.state, posSettings?.pincode || posSettings?.restaurant_info?.pincode].filter(Boolean).join(', ') || 'Mumbai, MH';
    const gstin = posSettings?.gstin || posSettings?.restaurant_info?.gstin || '27AAAAA0000A1Z5';
    const fssaiNo = posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || '10019022009876';

    const handlePrintReceipt = () => {
        const effectivePosSettings = posSettings || {};
        const isThermalOn = effectivePosSettings?.enableThermalPrinting ?? effectivePosSettings?.enable_thermal_printing ?? true;
        if (isThermalOn && onPrintDirect) {
            onPrintDirect(selectedHistoryOrder);
        } else {
            triggerPrintReceipt(selectedHistoryOrder, effectivePosSettings);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-4 text-black" style={{ fontFamily: "'Inconsolata', 'Consolas', 'Courier New', monospace" }}>
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                    <h6 className="font-bold mb-0 font-sans text-base">Receipt Preview</h6>
                    <button className="text-gray-500 hover:text-black font-bold text-xl cursor-pointer" onClick={() => setSelectedHistoryOrder(null)}>✕</button>
                </div>
                
                {/* ── Receipt Content Container (Visible on-screen) ── */}
                <div className="bg-white p-2 text-black" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{resName}</div>
                        <div style={{ fontSize: '10px' }}>{resAddr}</div>
                        <div style={{ fontSize: '10px' }}>{resCityState}</div>
                        {gstin && <div style={{ fontSize: '10px' }}>GSTIN: {gstin}</div>}
                        {fssaiNo && <div style={{ fontSize: '10px' }}>FSSAI NO: {fssaiNo}</div>}
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                    {/* Customer Info if available */}
                    {(selectedHistoryOrder.customer_name || selectedHistoryOrder.guest_name) && (
                        <>
                            <div style={{ fontSize: '10px' }}>Customer Name: {selectedHistoryOrder.customer_name || selectedHistoryOrder.guest_name} {selectedHistoryOrder.customer_phone || selectedHistoryOrder.phone ? `(${selectedHistoryOrder.customer_phone || selectedHistoryOrder.phone})` : ''}</div>
                            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
                        </>
                    )}

                    {/* Bill Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span>Bill No: {displayOrderId}</span>
                        <span>Date: {formattedDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span>{tableText}</span>
                        <span>Cashier: {selectedHistoryOrder.server || selectedHistoryOrder.staff_name || 'Ravi'}</span>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

                    {/* Table Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
                        <span style={{ flex: 1, textAlign: 'left', paddingRight: '4px' }}>Item</span>
                        <span style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>Qty.</span>
                        <span style={{ width: '52px', textAlign: 'right', flexShrink: 0 }}>Price</span>
                        <span style={{ width: '56px', textAlign: 'right', flexShrink: 0 }}>Amount</span>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

                    {/* Items List */}
                    {items.length > 0 ? (
                        items.map((item: any, idx: number) => {
                            const qty = parseInt(item.quantity || item.qty) || 1;
                            const unitPrice = Number(item.price || item.unit_price || 0) + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                            const itemAmount = unitPrice * qty;
                            const cleanName = cleanItemNameHelper(item.name || item.item_name || 'Item');
                            const hasNotes = item.notes && !item.notes.includes('Session Order') && !item.notes.includes('Active Order');

                            return (
                                <div key={idx} style={{ marginBottom: '3px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '10px' }}>
                                        <span style={{ flex: 1, minWidth: 0, textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', paddingRight: '4px' }}>{cleanName}</span>
                                        <span style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>{qty}</span>
                                        <span style={{ width: '52px', textAlign: 'right', flexShrink: 0 }}>{unitPrice.toFixed(2)}</span>
                                        <span style={{ width: '56px', textAlign: 'right', flexShrink: 0 }}>{itemAmount.toFixed(2)}</span>
                                    </div>
                                    {item.selectedVariant && <div style={{ fontSize: '9px', color: '#555', paddingLeft: '4px' }}>Opt: {item.selectedVariant.name}</div>}
                                    {hasNotes && <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', paddingLeft: '4px' }}>* {item.notes}</div>}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '10px', color: '#666' }}>
                            Summary Amount: ₹{selectedHistoryOrder.total ? Number(selectedHistoryOrder.total).toFixed(2) : '0.00'}
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

                    {/* Totals Section */}
                    <div style={{ fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Total Qty: {totalQty}</span>
                            <span>Sub Total &nbsp;&nbsp;{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                            <span>CGST {halfTaxRate}% &nbsp;&nbsp;{cgstAmt.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                            <span>SGST {halfTaxRate}% &nbsp;&nbsp;{sgstAmt.toFixed(2)}</span>
                        </div>
                        {serviceChargeRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                <span>Service Charge {serviceChargeRate}% &nbsp;&nbsp;{serviceAmt.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', marginTop: '5px', paddingTop: '2px' }}>
                            <span>Grand Total(INR)</span>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0 4px 0' }}></div>

                    {/* Footer Greeting */}
                    <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '500', padding: '2px 0' }}>
                        Thank you & Visit Again
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
                </div>

                <div className="flex gap-2 justify-end mt-3 font-sans">
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedHistoryOrder(null)}>Close</button>
                    <button 
                        className="px-3 py-1.5 bg-black text-white rounded text-xs font-bold hover:bg-gray-800 cursor-pointer" 
                        onClick={handlePrintReceipt}
                    >
                        🖨️ Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
