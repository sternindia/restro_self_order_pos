import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const OrderNumberPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="numberBody min-h-screen bg-[#f8f8f8]">
      <div className="header-number sticky top-0 z-50 flex h-[10vh] w-full items-center bg-white px-[3%] py-[1.5%] shadow-md">
        <button onClick={() => navigate(-1)} className="back-arrow mr-[4%] text-[20px] text-black">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-bold">#1733838309</h2>
      </div>

      <div className="numbermiddle flex justify-center px-[2.5vw] pt-[5vh]">
        <div className="number-container w-full max-w-[600px] rounded-[10px] bg-white p-[20px] shadow-lg">
          <div>
            <div className="item-list flex items-center justify-between border-b border-[#ddd] py-[12px]">
              <div className="item-details flex flex-col">
                <p className="item-name font-bold text-black text-[16px]">Hot Chocolate</p>
                <p className="item-price text-[14px] text-gray-500">100.00 Rs x 1</p>
              </div>
              <p className="item-total font-bold text-black text-[16px]">100.00 Rs</p>
            </div>

            <div className="item-list flex items-center justify-between border-b border-[#ddd] py-[12px]">
              <div className="item-details flex flex-col">
                <p className="item-name font-bold text-black text-[16px]">Bournvita Milk</p>
                <p className="item-price text-[14px] text-gray-500">100.00 Rs x 1</p>
              </div>
              <p className="item-total font-bold text-black text-[16px]">100.00 Rs</p>
            </div>
          </div>

          <div className="bill-details mt-5">
            <div className="bill-details-text mb-[10px] text-left text-[20px] font-bold text-black">
              Bill Detail
            </div>
            <div className="bill-row my-[5px] flex justify-between text-[16px]">
              <span>Sub Total</span>
              <span>200.00 Rs</span>
            </div>
            <div className="bill-row my-[5px] flex justify-between text-[16px]">
              <span>Tax</span>
              <span>10.00 Rs</span>
            </div>
            <hr className="my-2 h-px border-0 bg-[#ddd]" />
            <div className="bill-row total flex justify-between font-bold text-[#0077b6] text-[18px]">
              <span>Total</span>
              <span>210.00 Rs</span>
            </div>
          </div>
        </div>
      </div>

      <Link 
        to="/order-info" 
        className="checkout-btn fixed bottom-[2.5vh] ml-[2.5vw] flex h-[6vh] w-[95vw] items-center justify-center rounded-[10px] bg-[#0077b6] text-center text-white no-underline shadow-md transition-opacity hover:opacity-90"
      >
        Checkout
      </Link>
    </div>
  );
};

export default OrderNumberPage;
