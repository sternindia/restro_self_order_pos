import React from "react";
import MobileProductDetailPage from "../mobileview/MobileProductDetailPage";
import DesktopLayout from "../components/DesktopLayout";

const ProductDetailPage: React.FC = () => {
  return (
    <>
      <div className="block md:hidden">
        <MobileProductDetailPage />
      </div>

      <div className="hidden md:block">
        <DesktopLayout activePage="Menu">
          <div className="max-w-4xl mx-auto px-7 py-6 w-full flex-1">
            <MobileProductDetailPage />
          </div>
        </DesktopLayout>
      </div>
    </>
  );
};

export default ProductDetailPage;
