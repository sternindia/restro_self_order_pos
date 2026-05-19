import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="infobody min-h-screen bg-[#f8f8f8]">
      <div className="header-info sticky top-0 z-50 flex h-[10vh] w-full items-center bg-white px-[3%] py-[1.5%] shadow-md">
        <button onClick={() => navigate(-1)} className="back-arrow mr-[4%] text-[20px] text-black">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-bold text-black">Order Information</h2>
      </div>

      <div className="bodymiddle flex justify-center px-[2.5vw]">
        <div className="info-container mb-[10vh] mt-[3vh] w-full max-w-[600px] rounded-[10px] bg-white p-[20px] shadow-lg">
          <div className="restaurant-info mb-4">
            <h2 className="mb-2 text-left text-[20px] font-bold text-black">BIG BEN RESTAURANT</h2>
            <p className="my-1 text-[16px] text-[#666]">
              📍 <b> Location:</b> 1st Flr, A Wing, Todi Estate, Sun Mill Compound, Lower Parel (west)
            </p>
            <p className="my-1 text-[16px] text-[#666]">
              📞 <b> Phone:</b> +91-9876543212
            </p>
          </div>

          <div className="order-type my-4">
            <label className="block font-bold">Order Type</label>
            <div className="order-box mt-1 rounded-[5px] border border-[#0077b6] bg-[#d1efff] p-[10px] text-center font-bold text-[#0077b6]">
              <span>🍽️ DINEIN</span>
            </div>
          </div>

          <div className="personal-info">
            <div className="mt-4">
              <label className="block font-bold">Guest Name</label>
              <input 
                type="text" 
                placeholder="Guest Name" 
                className="mt-1 w-full rounded-[5px] border border-[#333] p-[10px] outline-none focus:border-[#0077b6]"
              />
            </div>

            <div className="mt-4">
              <label className="block font-bold">Phone</label>
              <input 
                type="text" 
                placeholder="Phone" 
                className="mt-1 w-full rounded-[5px] border border-[#333] p-[10px] outline-none focus:border-[#0077b6]"
              />
            </div>

            <div className="mt-4">
              <label className="block font-bold">Email Address</label>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="mt-1 w-full rounded-[5px] border border-[#333] p-[10px] outline-none focus:border-[#0077b6]"
              />
            </div>

            <div className="mt-4">
              <label className="block font-bold">Write instruction for the restaurant</label>
              <textarea 
                placeholder="Write instruction for the restaurant" 
                className="mt-1 min-h-[100px] w-full rounded-[5px] border border-[#333] p-[10px] outline-none focus:border-[#0077b6]"
              ></textarea>
            </div>
          </div>

          <div className="summary mt-5 text-[16px]">
            <p className="my-1 flex justify-between">Sub Total: <span>200.00 Rs</span></p>
            <p className="my-1 flex justify-between">Tax: <span>10.00 Rs</span></p>
            <hr className="my-[10px] h-px border-0 bg-[#ddd]" />
            <p className="total flex justify-between font-bold text-[#0077b6]">
              Total: <span>210.00 Rs</span>
            </p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setShowModal(true)}
        className="info-footer fixed bottom-0 left-[2.5vw] mb-[15px] flex w-[95vw] items-center justify-center rounded-[10px] bg-[#0077b6] p-[15px] shadow-md transition-opacity hover:opacity-90"
      >
        <div className="cart-button text-center text-[16px] text-white">Place Order</div>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="confirmationmodal fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="confirmationmodal-content w-full max-w-[400px] rounded-[10px] bg-white p-[20px] text-center shadow-xl">
            <div className="confirmationcheck-icon mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#2ecc71] text-[40px] text-white">
              <CheckCircle2 size={40} />
            </div>
            <div className="confirmationmenu-text mt-[7%] text-[20px] font-normal text-black">
              Your order has been placed<br />successfully.
            </div>
            <button 
              onClick={() => {
                setShowModal(false);
                navigate('/');
              }}
              className="confirmationmenu-btn mt-[15%] w-full max-w-[240px] rounded-[5px] bg-[#0077b6] p-[10px_30px] text-[16px] text-white hover:opacity-90"
            >
              Go to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoPage;
