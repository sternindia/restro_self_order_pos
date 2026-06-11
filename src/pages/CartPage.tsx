import React, { useState } from 'react';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [cart, setCart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const saveCart = (newCart: Record<string, any>) => {
    setCart(newCart);
    localStorage.setItem('emenu_cart', JSON.stringify(newCart));
  };

  const updateQty = (id: string, delta: number) => {
    const newCart = { ...cart };
    if (!newCart[id]) return;
    newCart[id].quantity += delta;
    if (newCart[id].quantity <= 0) {
      delete newCart[id];
    }
    saveCart(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = { ...cart };
    delete newCart[id];
    saveCart(newCart);
  };

  const setItemNotes = (id: string, notes: string) => {
    const newCart = { ...cart };
    if (newCart[id]) {
      newCart[id].notes = notes;
    }
    saveCart(newCart);
  };

  const openModal = (id: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  return (
    <div className="cart-body min-h-screen bg-[#f8f8f8]">
      <div className="header-cart sticky top-0 z-50 flex h-[10vh] w-full items-center justify-between bg-white px-[3%] py-[1.5%] shadow-md">
        <div className="backpluscart flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="back-arrow text-[20px] text-black cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-bold text-black">Cart</h2>
        </div>
        <button className="cart-icon text-[20px] text-black">
          <ShoppingBag size={24} />
        </button>
      </div>

      <div className="cart-container m-[3%_2.5%] w-[95%] rounded-[10px] bg-white p-[15px] shadow-md">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-2">🛒</div>
            Your cart is empty.
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="cart-item flex items-center justify-between border-b border-[#ddd] py-[15px] last:border-b-0">
              <div className="item-info flex-1">
                <div className="iconplusitem flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      src={item.isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                      alt={item.isVeg ? "Veg" : "Non-Veg"} 
                      className="h-[20px] w-[20px]"
                    />
                  </div>
                  <div className="nameplusprice ml-[4%]">
                    <div className="nameCart mb-[1vh] w-auto max-w-[40vw] text-[16px] font-bold">
                      {item.name}
                    </div>
                    <div className="price text-[15px] text-[#555]">
                      {item.price.toFixed(2)} Rs
                    </div>
                  </div>
                </div>
                
                {item.notes && (
                  <div className="text-xs text-gray-500 italic mt-1 ml-[4%]">
                    Instruction: "{item.notes}"
                  </div>
                )}

                <button 
                  onClick={() => openModal(item.id)}
                  className="write-instruction mt-[2vh] cursor-pointer text-[14px] text-[#777] no-underline block text-left"
                >
                  ✏️ {item.notes ? 'Edit' : 'Write'} instruction on item.
                </button>
              </div>
              <div className="quantity flex items-center rounded-[10px] border border-[#0077b6] p-[10px_5px]">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="delete mx-[10px] text-[15px] text-red-600 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => updateQty(item.id, -1)}
                  className="mx-[5px] text-[16px] text-gray-500 font-bold cursor-pointer"
                >
                  −
                </button>
                <span className="text-[16px] font-bold px-[5px]">{item.quantity}</span>
                <button 
                  onClick={() => updateQty(item.id, 1)}
                  className="add mx-[10px] text-[20px] font-bold text-[#0077b6] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <Link 
          to="/order-info" 
          className="cart-footer fixed bottom-[2.5vh] ml-[2.5vw] flex h-[6vh] w-[95vw] items-center justify-center rounded-[10px] bg-[#0077b6] p-[15px] no-underline shadow-md"
        >
          <div className="cart-button text-center text-[16px] text-white">
            Confirm Order - {grandTotal.toFixed(2)} Rs - Plus Taxes
          </div>
        </Link>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modalcart fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="modal-content-cart w-full max-w-[400px] rounded-[8px] bg-white p-[20px] text-center shadow-lg">
            <span 
              className="close float-right cursor-pointer text-[24px]" 
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h3 className="text-[16px] font-bold">{cart[selectedItemId]?.name}</h3>
            <textarea 
              id="notes-textarea"
              defaultValue={cart[selectedItemId]?.notes || ''}
              className="modalinput mt-[2vh] h-[20vh] w-full rounded-[5px] border border-[#ccc] p-[8px] outline-none focus:border-[#0077b6]" 
              placeholder="Enter your instruction"
            ></textarea>
            <button 
              className="submit-btn mt-[2vh] w-full rounded-[5px] bg-[#0077b6] p-[8px_12px] text-white hover:opacity-90"
              onClick={() => {
                const el = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                setItemNotes(selectedItemId, el?.value || '');
                setIsModalOpen(false);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
