import React, { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Plus,
  Minus,
  Users,
  Utensils,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
}) => {
  const navigate = useNavigate();
  const calculatedCgst = cgstAmt !== undefined ? cgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);
  const calculatedSgst = sgstAmt !== undefined ? sgstAmt : (taxAmt ? taxAmt / 2 : (subtotal * (taxRate / 2)) / 100);
  const [orderType, setOrderType] = useState<"Dine In" | "Takeaway" | "Delivery">("Dine In");
  const [guestCount, setGuestCount] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem("emenu_guest_count");
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });

  const storedTable = (() => {
    try {
      const t = sessionStorage.getItem("emenu_table");
      if (!t) return "04";
      const clean = String(t).replace(/[^0-9]/g, "");
      return clean ? (clean.length === 1 ? `0${clean}` : clean) : t;
    } catch {
      return "04";
    }
  })();

  const getFoodItemImage = (item: any): string => {
    if (item.image && typeof item.image === "string" && item.image.trim() !== "") return item.image;
    if (item.image_url && typeof item.image_url === "string" && item.image_url.trim() !== "") return item.image_url;
    const name = (item.name || "").toLowerCase();
    if (name.includes("biryani") || name.includes("rice")) return "/images/cat_biryani.png";
    if (name.includes("paneer") || name.includes("tikka") || name.includes("tandoor") || name.includes("starter") || name.includes("kebab") || name.includes("roll")) {
      return "/images/cat_starters.png";
    }
    if (name.includes("curry") || name.includes("roti") || name.includes("naan") || name.includes("dal") || name.includes("gravy")) {
      return "/images/cat_main_course.png";
    }
    if (name.includes("drink") || name.includes("coke") || name.includes("shake") || name.includes("water") || name.includes("tea") || name.includes("coffee") || name.includes("cold")) {
      return "/images/cat_beverages.png";
    }
    return "/images/cat_starters.png";
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#101828] font-sans pb-[65px]">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#faf9f7]/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-200/60">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full active:scale-95 text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <h1 className="text-[17px] font-extrabold tracking-[-0.3px] text-slate-900">
          Your Order
        </h1>

        <button
          type="button"
          onClick={onClearCart}
          disabled={cartItems.length === 0}
          className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#ff4f1f] shadow-[0_1px_4px_rgba(0,0,0,0.03)] disabled:opacity-40 transition active:scale-95 cursor-pointer"
        >
          <Trash2 size={13} />
          Clear All
        </button>
      </header>

      {/* =====================================================
          ORDER TYPE TABS
      ===================================================== */}
      <div className="px-3.5 pt-2 pb-1.5">
        <div className="flex h-[36px] w-full rounded-xl bg-[#eeecea] p-1">
          {(["Dine In", "Takeaway", "Delivery"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setOrderType(type);
                try {
                  sessionStorage.setItem("emenu_order_type", type.toUpperCase());
                } catch {}
              }}
              className={`flex-1 rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer ${
                orderType === type
                  ? "bg-[#ff5520] text-white shadow-[0_2px_6px_rgba(255,85,32,0.18)]"
                  : "text-[#556070] hover:text-slate-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          TABLE + GUEST INFO (If Dine In)
      ===================================================== */}
      {orderType === "Dine In" && (
        <div className="flex gap-2 px-3.5 pb-2">
          {/* TABLE PILL */}
          <button
            type="button"
            onClick={() => navigate("/tables")}
            className="flex h-[36px] flex-1 items-center justify-between rounded-xl border border-[#e8e8e8] bg-white px-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] active:scale-98 transition cursor-pointer hover:border-slate-300"
            title="Change Table"
          >
            <div className="flex items-center gap-1.5">
              <Utensils size={15} strokeWidth={1.8} className="text-slate-700" />
              <span className="text-[11.5px] font-semibold text-slate-800">
                Table {storedTable}
              </span>
            </div>
            <Pencil size={13} className="text-[#667085]" />
          </button>

          {/* GUESTS PILL */}
          <div
            onClick={() => {
              const next = guestCount >= 10 ? 1 : guestCount + 1;
              setGuestCount(next);
              try {
                sessionStorage.setItem("emenu_guest_count", String(next));
              } catch {}
            }}
            className="flex h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e8e8e8] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] cursor-pointer active:scale-98 transition select-none hover:border-slate-300"
            title="Click to adjust guest count"
          >
            <Users size={15} strokeWidth={1.9} className="text-slate-700" />
            <span className="text-[11.5px] font-semibold text-slate-800">
              {guestCount} Guests
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          ORDER ITEMS
      ===================================================== */}
      <main className="px-3.5 pb-2">
        {cartItems.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#eeeeee] bg-white p-6 text-center shadow-xs">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1e9] text-[#ff5520]">
              <Utensils size={22} />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900">Your order is empty</h3>
            <p className="mt-0.5 text-[11.5px] text-[#667085]">
              Add some delicious items to continue
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-3.5 flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[#ff5520] px-4 text-[11px] font-bold text-white active:scale-95 transition shadow-xs cursor-pointer"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#eeeeee] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)] divide-y divide-[#f2f2f2]">
            {cartItems.map((item) => {
              const itemId = String(item.id || item.item_id);
              const quantity = item.quantity || 1;
              const itemPrice = parseFloat(item.price || "0");
              const itemImg = getFoodItemImage(item);

              return (
                <div key={itemId} className="flex min-h-[82px] gap-2.5 px-3 py-2.5">
                  {/* FOOD IMAGE */}
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-[#f3f3f3] flex items-center justify-center border border-slate-100">
                    <img
                      src={itemImg}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/cat_starters.png";
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
                          <h3 className="truncate text-[12.5px] font-bold text-[#101828]">
                            {item.name}
                          </h3>
                        </div>
                        {item.portion ? (
                          <p className="mt-0.5 text-[10.5px] text-[#667085] truncate">
                            {item.portion}
                            {item.notes ? ` • Note: ${item.notes}` : ""}
                          </p>
                        ) : item.notes ? (
                          <p className="mt-0.5 text-[10.5px] text-amber-700 truncate">
                            Note: {item.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemId)}
                        className="shrink-0 p-1 text-[#ff3b30] hover:text-red-700 active:scale-90 transition cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>

                    {/* QUANTITY + PRICE */}
                    <div className="mt-2 flex items-center justify-between">
                      {/* QUANTITY STEPPER */}
                      <div className="flex h-[26px] items-center overflow-hidden rounded-md border border-[#e2e8f0] bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, -1)}
                          className="flex h-full w-[26px] items-center justify-center text-[#344054] active:bg-[#f5f5f5] transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>

                        <span className="flex h-full min-w-[26px] items-center justify-center border-x border-[#e2e8f0] text-[11px] font-bold text-slate-800 px-1">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(itemId, 1)}
                          className="flex h-full w-[26px] items-center justify-center text-[#344054] active:bg-[#f5f5f5] transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* PRICE */}
                      <span className="text-[13px] font-bold text-[#101828]">
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
            className="mx-auto mt-2 flex h-[30px] items-center justify-center gap-1.5 rounded-lg bg-[#fff1e9] px-3.5 text-[11.5px] font-semibold text-[#ff5520] transition active:scale-95 cursor-pointer hover:bg-orange-100/70"
          >
            <Plus size={14} />
            Add More Items
          </button>
        )}

        {/* =================================================
            BILL SUMMARY / BREAKDOWN
        ================================================= */}
        {cartItems.length > 0 && (
          <div className="mt-3 border-t border-slate-200/80 pt-2.5 space-y-2 text-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-semibold text-[13px]">Subtotal</span>
              <span className="text-slate-900 font-bold text-[13px]">
                {subtotal.toFixed(2)} Rs
              </span>
            </div>

            {/* Service Charge (if applicable) */}
            {serviceChargeRate > 0 && serviceChargeAmt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-semibold text-[13px]">
                  Service Charge ({serviceChargeRate}%)
                </span>
                <span className="text-slate-900 font-bold text-[13px]">
                  +{serviceChargeAmt.toFixed(2)} Rs
                </span>
              </div>
            )}

            {/* CGST & SGST */}
            {taxRate > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-semibold text-[13px]">
                    CGST ({(taxRate / 2).toFixed(1)}%)
                  </span>
                  <span className="text-slate-900 font-bold text-[13px]">
                    +{calculatedCgst.toFixed(2)} Rs
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-semibold text-[13px]">
                    SGST ({(taxRate / 2).toFixed(1)}%)
                  </span>
                  <span className="text-slate-900 font-bold text-[13px]">
                    +{calculatedSgst.toFixed(2)} Rs
                  </span>
                </div>
              </>
            )}

            {/* Dashed line and To Pay (Grand Total) */}
            <div className="border-t border-dashed border-gray-300 pt-2.5 flex items-center justify-between">
              <span className="text-[14px] font-extrabold text-slate-900">
                To Pay (Grand Total)
              </span>
              <span className="text-[17px] font-black text-[#f05a24]">
                {grandTotal.toFixed(2)} Rs
              </span>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================
          BOTTOM CTA (PROCEED / CONFIRM)
      ===================================================== */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 px-3.5 py-2 backdrop-blur-md border-t border-slate-200/70 max-w-md mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          {existingOrderId && onCancelOrder ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelOrder}
                className="h-[38px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold active:scale-95 transition cursor-pointer"
              >
                Cancel Order
              </button>
              <button
                type="button"
                onClick={onProceed}
                disabled={updating}
                className="flex-1 flex h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#ff5520] text-[12.5px] font-bold text-white shadow-[0_2px_8px_rgba(255,85,32,0.2)] transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Order"}
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
            </div>
          ) : isSelfPosBilling ? (
            <button
              type="button"
              onClick={onProceed}
              disabled={submittingBilling}
              className="flex h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(16,185,129,0.2)] transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {submittingBilling ? "Generating Bill..." : "⚡ Confirm & Print Bill"}
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onProceed}
              className="flex h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff5520] text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(255,85,32,0.2)] transition active:scale-[0.98] cursor-pointer"
            >
              Proceed to Payment
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileCartPage;
