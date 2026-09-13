import React from "react";
import MobileHeader, { type MobileHeaderProps } from "./MobileHeader";
import MobileFooter, { type MobileFooterProps } from "./MobileFooter";

export interface MobileLayoutProps {
  children: React.ReactNode;
  headerProps?: MobileHeaderProps;
  footerProps?: MobileFooterProps;
  hideHeader?: boolean;
  hideFooter?: boolean;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  headerProps,
  footerProps,
  hideHeader = false,
  hideFooter = false,
  className = "",
}) => {
  return (
    <div className={`min-h-screen bg-[#faf9f7] text-slate-900 font-sans ${className}`}>
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#faf9f7] overflow-x-hidden flex flex-col justify-between">
        {!hideHeader && <MobileHeader {...headerProps} />}
        <main className="flex-1 pb-20">{children}</main>
        {!hideFooter && <MobileFooter {...footerProps} />}
      </div>
    </div>
  );
};

export default MobileLayout;
