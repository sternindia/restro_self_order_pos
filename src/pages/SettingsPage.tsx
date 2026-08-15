import React, { useState, useEffect } from 'react';
import { Sliders, Building2, Coins, SlidersHorizontal, Printer, Sparkles, LayoutGrid, CheckCircle2, RotateCw, GlassWater } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { API_BASE_URL, getRestaurantId, parseBool } from '../config';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('emenu_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state matching restaurant_pos 1-to-1
  const [posSettings, setPosSettings] = useState({
    restaurantName: 'BIG BEN RESTAURANT',
    address: '1st Flr, Sun Mill Compound, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    gstin: '27AAAAA0000A1Z5',
    fssaiNo: '10019022009876',
    taxRate: 5.0,
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 0.0,
    isRestaurantServesLiquor: false,
    stateVatTaxRate: 0.0,
    enableThermalPrinting: true,
    autoCleanTables: false,
    isEnableTables: true
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access restricted to Admin only.');
      navigate('/', { replace: true });
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const rid = getRestaurantId();
        const res = await fetch(`${API_BASE_URL}/settings/pos/${rid}`);
        if (res.ok) {
          const data = await res.json();
          const settings = data?.data || data;
          if (settings) {
            localStorage.setItem('emenu_pos_settings', JSON.stringify(settings));
            const enableTablesVal = settings?.hardware_and_preferences?.is_enable_tables ?? settings?.is_enable_tables ?? settings?.isEnableTables;
            const enableThermalVal = settings?.hardware_and_preferences?.is_enable_thermal_print ?? settings?.enable_thermal_printing ?? settings?.enableThermalPrinting;
            const autoCleanVal = settings?.hardware_and_preferences?.auto_clean_tables ?? settings?.auto_clean_tables ?? settings?.autoCleanTables;
            const servesLiquorVal = settings?.is_restaurant_serves_liquor ?? settings?.isRestaurantServesLiquor;

            const tRate = parseFloat(settings?.financials?.tax_rate_percentage ?? settings?.tax_rate ?? settings?.taxRate ?? 5.0);

            setPosSettings({
              restaurantName: settings?.restaurant_info?.name || settings?.restaurant_name || settings?.restaurantName || 'BIG BEN RESTAURANT',
              address: settings?.restaurant_info?.address || settings?.restaurant_address || settings?.address || '1st Flr, Sun Mill Compound, Lower Parel',
              city: settings?.restaurant_info?.city || settings?.city || 'Mumbai',
              state: settings?.restaurant_info?.state || settings?.state || 'Maharashtra',
              pincode: settings?.restaurant_info?.pincode || settings?.pincode || '400013',
              gstin: settings?.restaurant_info?.gstin || settings?.restaurant_info?.gst_number || settings?.gstin || '27AAAAA0000A1Z5',
              fssaiNo: settings?.restaurant_info?.fssai_no || settings?.restaurant_info?.fssai_number || settings?.fssai_no || settings?.fssaiNo || '10019022009876',
              taxRate: tRate,
              cgst: parseFloat(settings?.financials?.cgst ?? settings?.cgst ?? (tRate / 2)),
              sgst: parseFloat(settings?.financials?.sgst ?? settings?.sgst ?? (tRate / 2)),
              serviceCharge: parseFloat(settings?.financials?.service_charge_percentage ?? settings?.service_charge ?? settings?.serviceCharge ?? 0.0),
              isRestaurantServesLiquor: parseBool(servesLiquorVal, false),
              stateVatTaxRate: parseFloat(settings?.state_vat_tax_rate ?? settings?.stateVatTaxRate ?? 0.0),
              enableThermalPrinting: parseBool(enableThermalVal, true),
              autoCleanTables: parseBool(autoCleanVal, false),
              isEnableTables: parseBool(enableTablesVal, true)
            });
          }
        }
      } catch (err: any) {
        console.warn('Failed to load POS settings from API, using local cache:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin, navigate]);

  const sanitizeAddress = (addr: string, c = '', s = '', p = '') => {
    if (!addr) return '';
    let cleaned = String(addr).trim();
    const tokens = [c, s, p, 'pune', 'MH', 'Maharashtra', '411057', '411056'].filter(Boolean);
    let prev = '';
    while (cleaned !== prev) {
      prev = cleaned;
      tokens.forEach(token => {
        if (!token || token.length < 2) return;
        const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`,\\s*${escaped}\\s*$`, 'i');
        cleaned = cleaned.replace(regex, '');
      });
    }
    return cleaned.trim();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const restaurantId = getRestaurantId();

    const cleanedAddress = sanitizeAddress(posSettings.address, posSettings.city, posSettings.state, posSettings.pincode);

    try {
      const payload = {
        restaurant_id: restaurantId,
        restaurant_name: posSettings.restaurantName,
        restaurant_address: cleanedAddress,
        city: posSettings.city || '',
        state: posSettings.state || '',
        pincode: posSettings.pincode || '',
        gstin: posSettings.gstin || '',
        fssai_no: posSettings.fssaiNo || '',
        tax_rate: posSettings.taxRate,
        cgst: posSettings.cgst ?? (posSettings.taxRate / 2),
        sgst: posSettings.sgst ?? (posSettings.taxRate / 2),
        service_charge: posSettings.serviceCharge,
        enable_thermal_printing: posSettings.enableThermalPrinting ? 1 : 0,
        auto_clean_tables: posSettings.autoCleanTables ? 1 : 0,
        is_restaurant_serves_liquor: posSettings.isRestaurantServesLiquor ? 1 : 0,
        state_vat_tax_rate: posSettings.isRestaurantServesLiquor ? (posSettings.stateVatTaxRate ?? 0) : 0,
        is_enable_tables: posSettings.isEnableTables ? 1 : 0
      };

      // 1. Update local storage cache
      localStorage.setItem('emenu_pos_settings', JSON.stringify({
        ...payload,
        restaurant_info: {
          name: posSettings.restaurantName,
          address: cleanedAddress,
          city: posSettings.city,
          state: posSettings.state,
          pincode: posSettings.pincode,
          gstin: posSettings.gstin,
          fssai_no: posSettings.fssaiNo
        },
        financials: {
          tax_rate_percentage: posSettings.taxRate,
          service_charge_percentage: posSettings.serviceCharge,
          cgst: posSettings.cgst,
          sgst: posSettings.sgst
        },
        hardware_and_preferences: {
          is_enable_tables: posSettings.isEnableTables,
          is_enable_thermal_print: posSettings.enableThermalPrinting
        }
      }));

      // 2. Post to backend API
      const response = await fetch(`${API_BASE_URL}/settings/pos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      toast.success(data.message || "POS settings updated successfully.");
    } catch (error: any) {
      console.error("Failed to update POS settings:", error);
      toast.error("POS Settings saved locally.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans pb-12">
      <Header />

      <div className="mt-4 px-[3%] py-4 max-w-[1000px] mx-auto box-border">
        {/* Clean Open Header Title */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">POS System Settings</h1>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:block">Configure store branding, taxation, and print protocols</p>
          </div>
          <button 
            type="button"
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E6DF] rounded-[8px] shadow-2xs hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin text-[#f05a24]' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 font-bold text-[#f05a24]">Loading Settings...</div>
        ) : (
          <form onSubmit={handleSaveSettings}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Restaurant Identity */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#F0E6DF] h-full space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                    <Building2 size={18} className="text-[#f05a24]" />
                    <h6 className="font-extrabold text-gray-900 text-sm m-0">Restaurant Identity</h6>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                      required
                      value={posSettings.restaurantName || ''}
                      onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Restaurant Address</label>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                      rows={3}
                      required
                      value={posSettings.address || ''}
                      onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">City</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                        placeholder="Pune"
                        value={posSettings.city || ''}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">State</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                        placeholder="Maharashtra"
                        value={posSettings.state || ''}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Pincode</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                        placeholder="411056"
                        value={posSettings.pincode || ''}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, pincode: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* GSTIN & FSSAI Info */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold uppercase text-gray-900 focus:border-[#f05a24] outline-none"
                        placeholder="27CCCCCC0000A1Z5"
                        value={posSettings.gstin || ''}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, gstin: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">FSSAI License No.</label>
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                        placeholder="10019022009777"
                        value={posSettings.fssaiNo || ''}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, fssaiNo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Financials & Preferences */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Card 2: Financials & Taxes */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#F0E6DF] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Coins size={18} className="text-[#f05a24]" />
                    <h6 className="font-extrabold text-gray-900 text-sm m-0">Taxes & Financials</h6>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-black text-gray-900 focus:border-[#f05a24] outline-none"
                        required
                        value={posSettings.taxRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || 0;
                          setPosSettings(prev => ({
                            ...prev,
                            taxRate: rate,
                            cgst: rate / 2,
                            sgst: rate / 2
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Service Charge (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-black text-gray-900 focus:border-[#f05a24] outline-none"
                        required
                        value={posSettings.serviceCharge}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  {/* CGST & SGST Badge Breakdown */}
                  <div className="flex items-center gap-2 py-1">
                    <span className="px-2 py-1 bg-[#FFF0E6] text-[#f05a24] rounded-md text-[11px] font-extrabold border border-[#f05a24]/20">
                      CGST: {(posSettings.cgst ?? (posSettings.taxRate / 2)).toFixed(2)}%
                    </span>
                    <span className="px-2 py-1 bg-[#FFF0E6] text-[#f05a24] rounded-md text-[11px] font-extrabold border border-[#f05a24]/20">
                      SGST: {(posSettings.sgst ?? (posSettings.taxRate / 2)).toFixed(2)}%
                    </span>
                  </div>

                  {/* Serves Liquor Block */}
                  <div className="p-3 bg-[#FAF6F0]/70 rounded-xl border border-[#F0E6DF] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 cursor-pointer" htmlFor="servesLiquorCheck">
                        <GlassWater size={16} className="text-[#f05a24]" />
                        <span>Serves Liquor (State VAT)</span>
                      </label>
                      <input
                        type="checkbox"
                        id="servesLiquorCheck"
                        className="w-4 h-4 text-[#f05a24] accent-[#f05a24] rounded-md cursor-pointer"
                        checked={posSettings.isRestaurantServesLiquor ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPosSettings(prev => ({
                            ...prev,
                            isRestaurantServesLiquor: checked,
                            stateVatTaxRate: checked ? prev.stateVatTaxRate : 0
                          }));
                        }}
                      />
                    </div>

                    {posSettings.isRestaurantServesLiquor && (
                      <div className="pt-2 border-t border-[#F0E6DF]">
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">State VAT Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-black text-gray-900 focus:border-[#f05a24] outline-none"
                          required
                          value={posSettings.stateVatTaxRate ?? 0}
                          onChange={(e) => setPosSettings(prev => ({ ...prev, stateVatTaxRate: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: System Preferences */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#F0E6DF] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <SlidersHorizontal size={18} className="text-[#f05a24]" />
                    <h6 className="font-extrabold text-gray-900 text-sm m-0">System Modules</h6>
                  </div>

                  <div className="space-y-2">
                    {/* Thermal Printing Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#F0E6DF] bg-[#FAF6F0]/70">
                      <div>
                        <label className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 cursor-pointer" htmlFor="serialPrinterCheck">
                          <Printer size={15} className="text-gray-700" />
                          <span>Thermal Printing</span>
                        </label>
                        <div className="text-[10px] text-gray-500 font-medium">Direct thermal receipt print</div>
                      </div>
                      <input
                        type="checkbox"
                        id="serialPrinterCheck"
                        className="w-4 h-4 text-[#f05a24] accent-[#f05a24] rounded-md cursor-pointer"
                        checked={posSettings.enableThermalPrinting ?? true}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, enableThermalPrinting: e.target.checked }))}
                      />
                    </div>

                    {/* Auto-Clean Tables Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#F0E6DF] bg-[#FAF6F0]/70">
                      <div>
                        <label className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 cursor-pointer" htmlFor="autoCleanCheck">
                          <Sparkles size={15} className="text-amber-500" />
                          <span>Auto-Clean Tables</span>
                        </label>
                        <div className="text-[10px] text-gray-500 font-medium">Clean tables when dirty</div>
                      </div>
                      <input
                        type="checkbox"
                        id="autoCleanCheck"
                        className="w-4 h-4 text-[#f05a24] accent-[#f05a24] rounded-md cursor-pointer"
                        checked={posSettings.autoCleanTables ?? false}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, autoCleanTables: e.target.checked }))}
                      />
                    </div>

                    {/* Enable Tables Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#F0E6DF] bg-[#FAF6F0]/70">
                      <div>
                        <label className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 cursor-pointer" htmlFor="enableTablesCheck">
                          <LayoutGrid size={15} className="text-[#f05a24]" />
                          <span>Seating & Tables</span>
                        </label>
                        <div className="text-[10px] text-gray-500 font-medium">Enable table management</div>
                      </div>
                      <input
                        type="checkbox"
                        id="enableTablesCheck"
                        className="w-4 h-4 text-[#f05a24] accent-[#f05a24] rounded-md cursor-pointer"
                        checked={posSettings.isEnableTables ?? false}
                        onChange={(e) => setPosSettings(prev => ({ ...prev, isEnableTables: e.target.checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Aligned Tischly Sunset Orange Save Button */}
            <div className="mt-5 pt-2 flex justify-end items-center">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#f05a24] hover:bg-[#d94815] active:scale-95 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-[#f05a24]/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RotateCw size={16} className="animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-white" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
