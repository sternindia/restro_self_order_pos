import React from "react";
import MobileSearchPage from "../mobileview/MobileSearchPage";
import DesktopLayout from "../components/DesktopLayout";

const SearchPage: React.FC = () => {
  return (
    <>
      <div className="block md:hidden">
        <MobileSearchPage />
      </div>

      <div className="hidden md:block">
        <DesktopLayout activePage="Menu">
          <div className="max-w-4xl mx-auto px-7 py-6 w-full flex-1">
            <MobileSearchPage />
          </div>
        </DesktopLayout>
      </div>
    </>
  );
};

export default SearchPage;
