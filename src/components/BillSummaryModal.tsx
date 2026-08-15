import React from 'react';
import { FileText } from 'lucide-react';

interface BillSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  taxRate?: number;
  cgstAmt?: number;
  sgstAmt?: number;
  taxAmt?: number;
  serviceChargeRate?: number;
  serviceChargeAmt?: number;
  grandTotal: number;
  title?: string;
}

const BillSummaryModal: React.FC<BillSummaryModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  taxRate = 5.0,
  cgstAmt,
  sgstAmt,
  taxAmt,
  serviceChargeRate = 0,
  serviceChargeAmt = 0,
  grandTotal,
  title = "Bill Summary"
}) => {
  if (!isOpen) return null;

  const calculatedCgst = cgstAmt !== undefined ? cgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);
  const calculatedSgst = sgstAmt !== undefined ? sgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#f05a24]">
              <FileText size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-800 py-1">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-slate-800 font-semibold text-xs pb-2 border-b border-gray-100">
            <span className="text-slate-800 font-semibold">Subtotal</span>
            <span className="text-slate-900 font-bold">{subtotal.toFixed(2)} Rs</span>
          </div>

          {/* Service Charge formatted like CGST & SGST (no remove button, normal font) */}
          {serviceChargeRate > 0 && serviceChargeAmt > 0 && (
            <div className="flex justify-between items-center text-slate-800 font-semibold text-xs">
              <span className="text-slate-800 font-semibold">Service Charge ({serviceChargeRate}%)</span>
              <span className="text-slate-900 font-bold">+{serviceChargeAmt.toFixed(2)} Rs</span>
            </div>
          )}

          {/* CGST & SGST */}
          {taxRate > 0 && (
            <>
              <div className="flex justify-between items-center text-slate-800 font-semibold text-xs">
                <span className="text-slate-800 font-semibold">CGST ({(taxRate / 2).toFixed(1)}%)</span>
                <span className="text-slate-900 font-bold">+{calculatedCgst.toFixed(2)} Rs</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 font-semibold text-xs">
                <span className="text-slate-800 font-semibold">SGST ({(taxRate / 2).toFixed(1)}%)</span>
                <span className="text-slate-900 font-bold">+{calculatedSgst.toFixed(2)} Rs</span>
              </div>
            </>
          )}

          {/* Grand Total */}
          <div className="border-t border-dashed border-gray-300 pt-2.5 flex justify-between items-center text-sm font-extrabold text-slate-900">
            <span className="text-slate-900 font-extrabold">To Pay (Grand Total)</span>
            <span className="text-[#f05a24] text-lg font-black">{grandTotal.toFixed(2)} Rs</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#f05a24] hover:bg-[#d94815] active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default BillSummaryModal;
