import React, { useState } from 'react';
import { Check, ArrowRight, ChefHat, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSelectionModalProps {
  onSelect: (theme: 'light' | 'dark') => void;
}

const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({ onSelect }) => {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState<'light' | 'dark' | null>(
    theme === 'dark' || theme === 'light' ? theme : null
  );

  const handlePreview = (mode: 'light' | 'dark') => {
    setSelected(mode);
    setTheme(mode); // Apply theme globally for live preview
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-300 overflow-y-auto">
      
      {/* Main Container */}
      <div className="relative w-full max-w-[950px] bg-[#f8f9fa] rounded-3xl sm:rounded-[28px] shadow-2xl flex flex-col items-center px-4 pt-10 pb-6 sm:px-10 sm:pt-12 sm:pb-8 animate-in zoom-in-95 duration-300 my-auto mt-12 sm:mt-auto">
        
        {/* Top Chef Hat Icon */}
        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl sm:rounded-[20px] shadow-xl p-2.5 sm:p-3 flex items-center justify-center border border-slate-100/50">
          <ChefHat size={32} className="text-slate-800 sm:w-9 sm:h-9" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-2 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#ff5722] rounded-full" />
          <div className="absolute top-1.5 -right-4 sm:-right-5 w-1.5 h-1.5 bg-orange-300 rounded-full" />
        </div>

        {/* Header Text */}
        <h2 className="text-[22px] sm:text-[30px] font-bold text-[#1a1a22] tracking-tight mb-1 sm:mb-2 text-center leading-tight">
          Choose Your Theme
        </h2>
        <p className="text-[13px] sm:text-[15px] text-slate-500 font-medium text-center max-w-lg mb-6 sm:mb-8 leading-relaxed px-2">
          Select your preferred theme to get started. You can always change this later from settings.
        </p>

        {/* Theme Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => handlePreview('light')}
            className={`group relative text-left w-full rounded-[20px] overflow-hidden transition-all duration-300 border-[3px] flex flex-col ${
              selected === 'light'
                ? 'border-[#ff5722] shadow-[0_0_30px_-8px_rgba(255,87,34,0.3)] scale-[1.01]'
                : 'border-white bg-white shadow-lg hover:shadow-xl'
            }`}
          >
            {/* Checkmark */}
            {selected === 'light' && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-6 h-6 sm:w-7 sm:h-7 bg-[#ff5722] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                <Check size={14} strokeWidth={3.5} className="text-white sm:w-4 sm:h-4" />
              </div>
            )}
            
            {/* Image container (Floating Effect) */}
            <div className="w-full relative bg-white px-0.5 pt-1 sm:px-1 sm:pt-1 pb-1.5" style={{ aspectRatio: '16/10' }}>
              <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-slate-200/60 relative">
                <img 
                  src="/images/light_theme_preview.jpg" 
                  alt="Light Theme Preview" 
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </div>
            
            {/* Text section */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4 bg-white relative z-10">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-50 text-[#ff5722] flex items-center justify-center shrink-0 border border-orange-100">
                <Sun size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-[#1a1a22] mb-0.5 truncate">Light Mode</h3>
                <p className="text-[12px] sm:text-[13.5px] text-slate-500 font-normal truncate">Clean, bright and easy on the eyes</p>
              </div>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => handlePreview('dark')}
            className={`group relative text-left w-full rounded-[20px] overflow-hidden transition-all duration-300 border-[3px] flex flex-col ${
              selected === 'dark'
                ? 'border-[#ff5722] shadow-[0_0_30px_-8px_rgba(255,87,34,0.25)] scale-[1.01]'
                : 'border-[#1c1c24] bg-[#1c1c24] shadow-lg hover:shadow-xl'
            }`}
          >
            {/* Checkmark */}
            {selected === 'dark' && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-6 h-6 sm:w-7 sm:h-7 bg-[#ff5722] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                <Check size={14} strokeWidth={3.5} className="text-white sm:w-4 sm:h-4" />
              </div>
            )}
            
            {/* Image container (Floating Effect) */}
            <div className="w-full relative bg-[#1c1c24] px-0.5 pt-1 sm:px-1 sm:pt-1 pb-1.5" style={{ aspectRatio: '16/10' }}>
              <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-zinc-700/50 relative">
                <img 
                  src="/images/dark_theme_preview.png" 
                  alt="Dark Theme Preview" 
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </div>
            
            {/* Text section */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4 bg-[#1c1c24] relative z-10">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 text-zinc-300 flex items-center justify-center shrink-0 border border-white/5">
                <Moon size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 truncate">Dark Mode</h3>
                <p className="text-[12px] sm:text-[13.5px] text-zinc-400 font-normal truncate">Sleek, modern and perfect for low-light</p>
              </div>
            </div>
          </button>

        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-[400px]">
          <button
            type="button"
            disabled={!selected}
            onClick={handleConfirm}
            className={`w-full h-12 sm:h-[52px] rounded-xl flex items-center justify-center gap-2 text-[14px] sm:text-[15px] font-semibold transition-all duration-200 ${
              selected
                ? 'bg-[#ff5722] hover:bg-[#e64a19] text-white shadow-lg shadow-[#ff5722]/30 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {selected ? (
              <>
                Continue with {selected === 'light' ? 'Light' : 'Dark'} Mode
                <ArrowRight size={16} strokeWidth={2.5} className="sm:w-[18px] sm:h-[18px]" />
              </>
            ) : (
              'Select a theme to continue'
            )}
          </button>
          <p className="text-[13px] sm:text-[14px] text-[#64748b] font-normal mt-1">
            <span className="underline underline-offset-4 decoration-slate-300 cursor-pointer hover:text-slate-900 transition-colors">
              You can change this anytime from Settings
            </span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ThemeSelectionModal;
