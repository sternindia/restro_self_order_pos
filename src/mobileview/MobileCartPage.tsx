import React, { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Utensils,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export interface MobileCartPageProps {
  cartItems: any[];
  subtotal: number;
  taxRate: number;
  taxAmt: number;
  cgstAmt?: number;
  sgstAmt?: number;
  serviceChargeRate?: number;
  serviceChargeAmt?: number;
  grandTotal: number;
  onUpdateQuantity: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onProceed: () => void;
  isSelfPosBilling?: boolean;
  submittingBilling?: boolean;
  existingOrderId?: string | null;
  updating?: boolean;
  onCancelOrder?: () => void;
  isEnableTables?: boolean;
  isGuestCustomer?: boolean;
}

export const MobileCartPage: React.FC<MobileCartPageProps> = ({
  cartItems,
  subtotal,
  taxRate,
  taxAmt,
  cgstAmt,
  sgstAmt,
  serviceChargeRate = 0,
  serviceChargeAmt = 0,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceed,
  isSelfPosBilling = false,
  submittingBilling = false,
  existingOrderId = null,
  updating = false,
  onCancelOrder,
  isEnableTables = true,
  isGuestCustomer = true,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const calculatedCgst = cgstAmt !== undefined ? cgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);
  const calculatedSgst = sgstAmt !== undefined ? sgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);
  const [orderType, setOrderType] = useState<"Dine In" | "Takeaway" | "Delivery">("Dine In");
  const [discountInput, setDiscountInput] = useState("");
  const beforeDiscountTotal = grandTotal; // grandTotal already has taxes
  const discountAmt = Math.min(Math.max(parseFloat(discountInput) || 0, 0), beforeDiscountTotal);
  const finalTotal = beforeDiscountTotal - discountAmt;

  const getFoodItemImage = (item: any): string => {
    const fallback = isDark ? "/images/dark_default_image.png" : "/images/default_image.png";
    const img = item.image || item.image_url;
    if (!img || typeof img !== "string" || img.trim() === "" || img.includes("default_image.png")) {
      return fallback;
    }
    return img;
  };



  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#121318] text-[#101828] dark:text-[#f8fafc] font-sans pb-[65px] transition-colors">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#faf9f7]/95 dark:bg-[#1a1b23]/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-200/60 dark:border-[#272935] transition-colors">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full active:scale-95 text-slate-800 dark:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-[#252834] transition cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        <h1 className="text-[16px] font-semibold tracking-[-0.2px] text-slate-900 dark:text-white">
          Your Order
        </h1>

        <button
          type="button"
          onClick={onClearCart}
          disabled={cartItems.length === 0}
          className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] dark:border-[#2f3240] bg-white dark:bg-[#1e202a] px-2.5 py-1 text-[11px] font-medium text-[#ff5520] shadow-[0_1px_4px_rgba(0,0,0,0.03)] disabled:opacity-40 transition active:scale-95 cursor-pointer"
        >
          <Trash2 size={13} />
          Clear All
        </button>
      </header>

      {/* =====================================================
          ORDER TYPE TABS
      ===================================================== */}
      <div className="px-3.5 pt-2.5 pb-1.5">
        <div className="flex h-[38px] w-full rounded-xl bg-[#eeecea] dark:bg-[#1c1e27] p-1 border border-transparent dark:border-[#272935]">
          {(["Dine In", "Takeaway", "Delivery"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setOrderType(type);
                try {
                  sessionStorage.setItem("emenu_order_type", type.toUpperCase());
                } catch { }
              }}
              className={`flex-1 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer ${orderType === type
                ? "bg-[#ff5520] text-white shadow-[0_2px_8px_rgba(255,85,32,0.3)]"
                : "text-[#556070] dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          ORDER ITEMS
      ===================================================== */}
      <main className="px-3.5 pb-2">
        {cartItems.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#eeeeee] dark:border-[#262834] bg-white dark:bg-[#1a1b24] p-6 text-center shadow-xs">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1e9] dark:bg-[#ff5520]/15 text-[#ff5520]">
              <Utensils size={22} />
            </div>
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Your order is empty</h3>
            <p className="mt-0.5 text-[11.5px] text-[#667085] dark:text-[#94a3b8]">
              Add some delicious items to continue
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-3.5 flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[#ff5520] px-4 text-[11px] font-medium text-white active:scale-95 transition shadow-xs cursor-pointer"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#eeeeee] dark:border-[#262834] bg-white dark:bg-[#1a1b24] shadow-[0_2px_8px_rgba(16,24,40,0.03)] divide-y divide-[#f2f2f2] dark:divide-[#262834]">
            {cartItems.map((item) => {
              const itemId = String(item.id || item.item_id);
              const quantity = item.quantity || 1;
              const itemPrice = parseFloat(item.price || "0");
              const itemImg = getFoodItemImage(item);

              return (
                <div key={itemId} className="flex min-h-[82px] gap-2.5 px-3 py-2.5">
                  {/* FOOD IMAGE */}
                  <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-lg bg-[#f3f3f3] dark:bg-[#222430] flex items-center justify-center border border-slate-100 dark:border-[#2b2e3c]">
                    <img
                      src={itemImg}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = isDark ? "/images/dark_default_image.png" : "/images/default_image.png";
                      }}
                    />
                  </div>

                  {/* ITEM INFORMATION */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.isVeg !== false ? "/images/veg.png" : "/images/nonVeg.png"}
                            alt={item.isVeg !== false ? "Veg" : "Non-Veg"}
                            className="h-3.5 w-3.5 object-contain shrink-0"
                          />
                          <h3 className="truncate text-[12.5px] font-semibold text-[#101828] dark:text-[#f1f5f9]">
                            {item.name}
                          </h3>
                        </div>
                        {item.portion ? (
                          <p className="mt-0.5 text-[10.5px] text-[#667085] dark:text-[#94a3b8] truncate">
                            {item.portion}
                            {item.notes ? ` • Note: ${item.notes}` : ""}
                          </p>
                        ) : item.notes ? (
                          <p className="mt-0.5 text-[10.5px] text-amber-700 dark:text-amber-400 truncate">
                            Note: {item.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemId)}
                        className="shrink-0 p-1 text-[#ff4d4f] hover:text-red-500 active:scale-90 transition cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>

                    {/* QUANTITY + PRICE */}
                    <div className="mt-2 flex items-center justify-between">
                      {/* QUANTITY STEPPER */}
                      <div className="flex h-[26px] items-center overflow-hidden rounded-lg border border-[#e2e8f0] dark:border-[#323646] bg-white dark:bg-[#222531]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, -1)}
                          className="flex h-full w-[26px] items-center justify-center text-[#344054] dark:text-[#cbd5e1] active:bg-[#f5f5f5] dark:active:bg-[#2e3242] transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>

                        <span className="flex h-full min-w-[26px] items-center justify-center border-x border-[#e2e8f0] dark:border-[#323646] text-[11.5px] font-semibold text-slate-800 dark:text-white px-1">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, 1)}
                          className="flex h-full w-[26px] items-center justify-center text-[#344054] dark:text-[#cbd5e1] active:bg-[#f5f5f5] dark:active:bg-[#2e3242] transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* PRICE */}
                      <span className="text-[13px] font-bold text-[#101828] dark:text-white">
                        ₹{(itemPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================
            ADD MORE ITEMS BUTTON
        ================================================= */}
        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mx-auto mt-2.5 flex h-[32px] items-center justify-center gap-1.5 rounded-xl bg-[#fff1e9] dark:bg-[#ff5520]/15 px-4 text-[11.5px] font-semibold text-[#ff5520] transition active:scale-95 cursor-pointer hover:bg-orange-100/70"
          >
            <Plus size={14} />
            Add More Items
          </button>
        )}

        {/* =================================================
            BILL SUMMARY / BREAKDOWN
        ================================================= */}
        {cartItems.length > 0 && (
          <div className="mt-3.5 rounded-2xl border border-slate-200/80 dark:border-[#262834] bg-white dark:bg-[#1a1b24] p-3.5 space-y-2 text-xs shadow-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-[#94a3b8] font-medium text-[12px]">Subtotal</span>
              <span className="text-slate-900 dark:text-white font-semibold text-[12.5px]">
                {subtotal.toFixed(2)} Rs
              </span>
            </div>

            {/* Service Charge (if applicable) */}
            {serviceChargeRate > 0 && serviceChargeAmt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-[#94a3b8] font-medium text-[12px]">
                  Service Charge ({serviceChargeRate}%)
                </span>
                <span className="text-slate-900 dark:text-white font-semibold text-[12.5px]">
                  +{serviceChargeAmt.toFixed(2)} Rs
                </span>
              </div>
            )}

            {/* CGST & SGST */}
            {taxRate > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#94a3b8] font-medium text-[11.5px]">
                    CGST ({(taxRate / 2).toFixed(1)}%)
                  </span>
                  <span className="text-slate-900 dark:text-white font-semibold text-[11.5px]">
                    +{calculatedCgst.toFixed(2)} Rs
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#94a3b8] font-medium text-[11.5px]">
                    SGST ({(taxRate / 2).toFixed(1)}%)
                  </span>
                  <span className="text-slate-900 dark:text-white font-semibold text-[11.5px]">
                    +{calculatedSgst.toFixed(2)} Rs
                  </span>
                </div>
              </>
            )}

            {/* Discount Input */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="text-slate-600 dark:text-[#94a3b8] font-medium text-[12px] shrink-0">Discount (₹)</label>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-[#64748b] text-[11px]">-</span>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="w-20 text-right text-[12px] font-semibold px-2 py-[3px] rounded-md border border-slate-300 dark:border-[#333748] bg-white dark:bg-[#121318] text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-400"
                />
              </div>
            </div>
            {discountAmt > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="text-[12px]">Discount Applied</span>
                <span className="text-[12px]">-{discountAmt.toFixed(2)} Rs</span>
              </div>
            )}

            <div className="border-t border-dashed border-slate-200 dark:border-[#2f3342] pt-2.5 flex items-center justify-between">
              <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                To Pay (Grand Total)
              </span>
              <span className="text-[16px] font-extrabold text-[#ff5520]">
                {finalTotal.toFixed(2)} Rs
              </span>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================
          BOTTOM CTA (PROCEED / CONFIRM)
      ===================================================== */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#1a1b23]/95 px-3.5 py-2 backdrop-blur-md border-t border-slate-200/70 dark:border-[#272935] max-w-md mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.03)] transition-colors">
          {existingOrderId && onCancelOrder ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelOrder}
                className="h-[38px] px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-[12px] font-medium active:scale-95 transition cursor-pointer"
              >
                Cancel Order
              </button>
              <button
                type="button"
                onClick={onProceed}
                disabled={updating}
                className="flex-1 flex h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#ff5520] text-[12.5px] font-medium text-white shadow-[0_2px_8px_rgba(255,85,32,0.2)] transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Order"}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          ) : isSelfPosBilling ? (
            <button
              type="button"
              onClick={onProceed}
              disabled={submittingBilling}
              className="flex h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(16,185,129,0.2)] transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {submittingBilling ? "Generating Bill..." : "⚡ Confirm & Print Bill"}
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onProceed}
              className="flex h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff5520] text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(255,85,32,0.2)] transition active:scale-[0.98] cursor-pointer"
            >
              Proceed to Payment
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileCartPage;
