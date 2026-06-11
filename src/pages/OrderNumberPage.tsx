import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const OrderNumberPage: React.FC = () => {
  const navigate = useNavigate();

  const [orderInfo] = useState<any>(() => {
    const saved = localStorage.getItem('emenu_last_order');
    return saved ? JSON.parse(saved) : null;
  });

  if (!orderInfo) {
    return (
      <div className="numberBody min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-sm w-full">
          <div className="text-4xl mb-3">❓</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">No active order found</h2>
          <p className="text-sm text-gray-500 mb-6">You haven't placed any order yet in this session.</p>
          <Link 
            to="/" 
            className="inline-block bg-[#0077b6] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  const { order_id, items, subTotal, tax, total } = orderInfo;

  return (
    <div className="numberBody min-h-screen bg-[#f8f8f8] pb-[10vh]">
      <div className="header-number sticky top-0 z-50 flex h-[10vh] w-full items-center bg-white px-[3%] py-[1.5%] shadow-md">
        <button onClick={() => navigate('/')} className="back-arrow mr-[4%] text-[20px] text-black cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-bold">Order {order_id}</h2>
      </div>

      <div className="numbermiddle flex justify-center px-[2.5vw] pt-[5vh]">
        <div className="number-container w-full max-w-[600px] rounded-[10px] bg-white p-[20px] shadow-lg">
          <div>
            {items.map((item: any) => (
              <div key={item.id} className="item-list flex items-center justify-between border-b border-[#ddd] py-[12px] last:border-b-0">
                <div className="item-details flex flex-col">
                  <p className="item-name font-bold text-black text-[16px]">{item.name}</p>
                  <p className="item-price text-[14px] text-gray-500">{item.price.toFixed(2)} Rs x {item.quantity}</p>
                  {item.notes && (
                    <span className="text-[11px] text-gray-400 italic">Note: {item.notes}</span>
                  )}
                </div>
                <p className="item-total font-bold text-black text-[16px]">{(item.price * item.quantity).toFixed(2)} Rs</p>
              </div>
            ))}
          </div>

          <div className="bill-details mt-5">
            <div className="bill-details-text mb-[10px] text-left text-[20px] font-bold text-black">
              Bill Detail
            </div>
            <div className="bill-row my-[5px] flex justify-between text-[16px]">
              <span>Sub Total</span>
              <span>{subTotal.toFixed(2)} Rs</span>
            </div>
            <div className="bill-row my-[5px] flex justify-between text-[16px]">
              <span>Tax (5%)</span>
              <span>{tax.toFixed(2)} Rs</span>
            </div>
            <hr className="my-2 h-px border-0 bg-[#ddd]" />
            <div className="bill-row total flex justify-between font-bold text-[#0077b6] text-[18px]">
              <span>Total</span>
              <span>{total.toFixed(2)} Rs</span>
            </div>
          </div>
        </div>
      </div>

      <Link 
        to="/" 
        className="checkout-btn fixed bottom-[2.5vh] ml-[2.5vw] flex h-[6vh] w-[95vw] items-center justify-center rounded-[10px] bg-[#0077b6] text-center text-white no-underline shadow-md transition-opacity hover:opacity-90 cursor-pointer"
      >
        Order More Items
      </Link>
    </div>
  );
};

export default OrderNumberPage;
