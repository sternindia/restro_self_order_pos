import React, { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Check,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";

interface Portion {
  name: string;
  price: number;
}

interface Addon {
  name: string;
  price: number;
}

const defaultProduct = {
  id: "1",
  name: "Veg Biryani",
  price: 299,
  isVeg: true,
  description:
    "Aromatic basmati rice cooked with fresh vegetables and traditional spices.",
  image:
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=90",
};

const defaultPortions: Portion[] = [
  { name: "Half", price: 199 },
  { name: "Full", price: 299 },
  { name: "Family Pack", price: 549 },
];

const defaultAddons: Addon[] = [
  { name: "Raita", price: 30 },
  { name: "Extra Gravy", price: 40 },
  { name: "Salad", price: 20 },
  { name: "Extra Biryani Rice", price: 60 },
];

export const MobileProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Check if item was passed via navigation state
  const passedItem = location.state?.item;

  const product = passedItem
    ? {
        id: String(passedItem.id || id || defaultProduct.id),
        name: passedItem.name || defaultProduct.name,
        price: parseFloat(passedItem.price || String(defaultProduct.price)),
        isVeg: passedItem.type === "Veg" || passedItem.isVeg !== false,
        description: passedItem.description || defaultProduct.description,
        image: passedItem.image || passedItem.image_url || (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "/images/dark_default_image.png" : "/images/default_image.png"),
      }
    : defaultProduct;

  const portions: Portion[] = passedItem?.portions || [
    { name: "Half", price: Math.round(product.price * 0.7) },
    { name: "Full", price: product.price },
    { name: "Family Pack", price: Math.round(product.price * 1.8) },
  ];

  const addons: Addon[] = passedItem?.addons || defaultAddons;

  const [selectedPortion, setSelectedPortion] = useState<string>("Full");
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [instructions, setInstructions] = useState("");

  const portion =
    portions.find((item) => item.name === selectedPortion) || portions[1] || portions[0];

  const addonTotal = selectedAddons.reduce(
    (sum, addon) => sum + addon.price,
    0
  );

  const total = (portion.price + addonTotal) * quantity;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((item) => item.name === addon.name);

      if (exists) {
        return prev.filter((item) => item.name !== addon.name);
      }

      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    try {
      const saved = localStorage.getItem("emenu_cart");
      const cart = saved ? JSON.parse(saved) : {};

      const cartKey = `${product.id}_${selectedPortion}`;
      const unitPrice = portion.price + addonTotal;

      const notesArr: string[] = [];
      if (selectedPortion) notesArr.push(`Portion: ${selectedPortion}`);
      if (selectedAddons.length > 0) {
        notesArr.push(`Addons: ${selectedAddons.map((a) => a.name).join(", ")}`);
      }
      if (instructions.trim()) {
        notesArr.push(`Note: ${instructions.trim()}`);
      }

      cart[cartKey] = {
        id: cartKey,
        item_id: product.id,
        name: product.name,
        price: unitPrice,
        quantity: (cart[cartKey]?.quantity || 0) + quantity,
        portion: selectedPortion,
        isVeg: product.isVeg,
        image: product.image,
        notes: notesArr.join(" • "),
      };

      localStorage.setItem("emenu_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("emenu_cart_updated"));
      toast.success(`${product.name} added to cart!`);
      navigate("/cart");
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] flex justify-center">
      {/* Mobile App Container */}
      <div className="relative w-full max-w-md min-h-screen bg-white dark:bg-[#1f1f28] overflow-hidden shadow-md">
        {/* ================= HERO IMAGE ================= */}
        <div className="relative h-[200px] sm:h-[220px] w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/default_image.png";
            }}
          />

          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10" />

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft size={19} strokeWidth={2.2} />
          </button>

          {/* Favorite */}
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition active:scale-95 cursor-pointer"
            aria-label="Toggle Favorite"
          >
            <Heart
              size={19}
              strokeWidth={2.2}
              className={
                liked ? "fill-[#ff4d0a] text-[#ff4d0a]" : "text-white"
              }
            />
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="relative -mt-6 rounded-t-[24px] bg-white dark:bg-[#1f1f28] px-3.5 pb-20 pt-3.5">
          {/* Product Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#101828] dark:text-white">
                {product.name}
              </h1>

              <p className="mt-0.5 text-[17px] font-semibold text-[#ff4d0a]">
                ₹{portion.price}
              </p>
            </div>

            {/* Veg / Non-Veg Badge */}
            <div
              className={`mt-0.5 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                product.isVeg
                  ? "border-[#9de7c1] bg-[#f0fff7] text-[#059669] dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-400"
                  : "border-[#fecaca] bg-[#fef2f2] text-[#dc2626] dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.isVeg ? "bg-[#10b981]" : "bg-[#ef4444]"
                }`}
              />
              {product.isVeg ? "Veg" : "Non-Veg"}
            </div>
          </div>

          {/* Description */}
          <p className="mt-1 max-w-[380px] text-[12px] leading-snug text-[#667085] dark:text-zinc-400 line-clamp-2">
            {product.description}
          </p>

          {/* ================= PORTION ================= */}
          <section className="mt-3.5">
            <h2 className="mb-1.5 text-[13px] font-semibold text-[#101828] dark:text-white">
              Portion Size
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {portions.map((item) => {
                const selected = selectedPortion === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedPortion(item.name)}
                    className={`min-h-[44px] rounded-xl border px-2 py-1.5 text-center transition cursor-pointer ${
                      selected
                        ? "border-[#ff5a1f] bg-[#fff7f2] dark:bg-[#ff5a1f]/15 text-[#ff4d0a]"
                        : "border-[#e5e7eb] dark:border-zinc-800 bg-white dark:bg-[#2a2a35] text-[#344054] dark:text-zinc-300"
                    }`}
                  >
                    <div className="text-[11.5px] font-medium leading-tight">
                      {item.name}
                    </div>

                    <div
                      className={`text-[11px] font-medium mt-0.5 ${
                        selected ? "text-[#ff4d0a]" : "text-[#667085] dark:text-zinc-400"
                      }`}
                    >
                      ₹{item.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= ADD ONS ================= */}
          <section className="mt-3">
            <h2 className="mb-1 text-[13px] font-semibold text-[#101828] dark:text-white">
              Add-ons
            </h2>

            <div className="space-y-0.5">
              {addons.map((addon) => {
                const checked = selectedAddons.some(
                  (item) => item.name === addon.name
                );

                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className="flex w-full items-center justify-between py-1.5 text-left cursor-pointer transition hover:bg-slate-50/70 dark:hover:bg-[#2a2a35]/60 px-1 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox */}
                      <div
                        className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                          checked
                            ? "border-[#ff4d0a] bg-[#ff4d0a]"
                            : "border-[#98a2b3] dark:border-zinc-600 bg-white dark:bg-[#2a2a35]"
                        }`}
                      >
                        {checked && (
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </div>

                      <span className="text-[12.5px] text-[#344054] dark:text-zinc-200">
                        {addon.name}
                      </span>
                    </div>

                    <span className="text-[11.5px] font-medium text-[#475467] dark:text-zinc-400">
                      +₹{addon.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= SPECIAL INSTRUCTIONS ================= */}
          <section className="mt-2.5">
            <h2 className="mb-1 text-[13px] font-semibold text-[#101828] dark:text-white">
              Special Instructions
            </h2>

            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={200}
              rows={1}
              placeholder="E.g. less spicy, no onions..."
              className="w-full resize-none rounded-xl border border-[#e4e7ec] dark:border-zinc-800 bg-white dark:bg-[#2a2a35] px-3 py-2 text-[12px] text-[#344054] dark:text-zinc-200 outline-none placeholder:text-[#98a2b3] dark:placeholder:text-zinc-500 focus:border-[#ff7043] focus:ring-2 focus:ring-[#ff7043]/10"
            />
          </section>
        </div>

        {/* ================= BOTTOM CART BAR ================= */}
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto border-t border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-[#1a1a22]/95 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5">
            {/* Quantity */}
            <div className="flex h-[42px] items-center rounded-xl border border-[#e5e7eb] dark:border-zinc-700 bg-white dark:bg-[#2a2a35]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-[42px] w-[34px] items-center justify-center text-[#344054] dark:text-zinc-300 active:bg-gray-50 dark:active:bg-zinc-700 cursor-pointer"
                aria-label="Decrease Quantity"
              >
                <Minus size={15} />
              </button>

              <span className="w-6 text-center text-[13px] font-medium text-slate-800 dark:text-white">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-[42px] w-[34px] items-center justify-center text-[#344054] dark:text-zinc-300 active:bg-gray-50 dark:active:bg-zinc-700 cursor-pointer"
                aria-label="Increase Quantity"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Add Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff4d0a] px-3.5 text-[13.5px] font-semibold text-white shadow-[0_4px_12px_rgba(255,77,10,0.22)] transition hover:bg-[#f04405] active:scale-[0.98] cursor-pointer"
            >
              <ShoppingCart size={17} />
              <span>Add to Cart</span>
              <span className="ml-auto font-semibold">₹{total}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileProductDetailPage;
