import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DesktopLayout from '../components/DesktopLayout';
import { MobileHeader, MobileFooter } from '../components/mobile';
import { API_BASE_URL, getRestaurantId } from '../config';

const ContactUsPage: React.FC = () => {
  const navigate = useNavigate();

  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Big Ben Restaurant',
    address: '1st Flr, Sun Mill Compound, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    phone: '+91 98765 43210',
    email: 'support@tischly.com',
    openingHours: 'Mon - Sun: 11:00 AM - 11:30 PM'
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const savedSettings = localStorage.getItem('emenu_pos_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          const rName = parsed?.restaurantName || parsed?.restaurant_name || parsed?.business_name;
          const addr = parsed?.address || parsed?.location;
          const phone = parsed?.phone || parsed?.contact_phone || parsed?.mobile;
          const email = parsed?.email || parsed?.contact_email;
          if (rName || addr) {
            setRestaurantInfo(prev => ({
              ...prev,
              name: rName || prev.name,
              address: addr || prev.address,
              city: parsed?.city || prev.city,
              state: parsed?.state || prev.state,
              pincode: parsed?.pincode || prev.pincode,
              phone: phone || prev.phone,
              email: email || prev.email
            }));
          }
        }

        const rid = getRestaurantId();
        const res = await fetch(`${API_BASE_URL}/settings/pos/${rid}`);
        if (res.ok) {
          const data = await res.json();
          const s = data?.data || data;
          if (s) {
            setRestaurantInfo(prev => ({
              ...prev,
              name: s.restaurantName || s.restaurant_name || prev.name,
              address: s.address || prev.address,
              city: s.city || prev.city,
              state: s.state || prev.state,
              pincode: s.pincode || prev.pincode,
              phone: s.phone || prev.phone,
              email: s.email || prev.email
            }));
          }
        }
      } catch (e) {
        // use default
      }
    };
    fetchInfo();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error('Please enter your name and message.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Thank you! Your message has been sent.');
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    }, 800);
  };

  const contactContent = (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Contact Cards & Info (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Restaurant Card */}
          <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-[#ff5520]/15 flex items-center justify-center text-[#ff5520] shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {restaurantInfo.name}
                </h3>
                <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full mt-0.5">
                  Open Today
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <MapPin size={15} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Location</div>
                <div className="text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {restaurantInfo.address}, {restaurantInfo.city}, {restaurantInfo.state} - {restaurantInfo.pincode}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <Phone size={15} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Call Us</div>
                <a
                  href={`tel:${restaurantInfo.phone}`}
                  className="text-[#ff5520] hover:underline font-medium mt-0.5 block"
                >
                  {restaurantInfo.phone}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <Mail size={15} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Email Address</div>
                <a
                  href={`mailto:${restaurantInfo.email}`}
                  className="text-slate-600 dark:text-zinc-300 hover:text-[#ff5520] hover:underline mt-0.5 block truncate"
                >
                  {restaurantInfo.email}
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <Clock size={15} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Service Hours</div>
                <div className="text-slate-500 dark:text-zinc-400 mt-0.5">
                  {restaurantInfo.openingHours}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Tip */}
          <div className="bg-orange-50/70 dark:bg-[#ff5520]/10 border border-orange-200/70 dark:border-[#ff5520]/20 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#ff5520] mb-1">
              <MessageSquare size={14} /> Need Immediate Assistance?
            </div>
            <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              If you are at a table, you can also use the <strong>"Call Waiter"</strong> button directly from your digital menu.
            </p>
          </div>
        </div>

        {/* Right Column: Send Message Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Send size={16} className="text-[#ff5520]" /> Send us a Message
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
              Fill out the form below and our management team will get back to you shortly.
            </p>

            {submitted ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Thank you for reaching out. We have received your query and will respond as soon as possible.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reservation Inquiry, Food Feedback"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your message or inquiry here..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#ff5520] hover:bg-[#e04515] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Sending...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP VIEW (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Contact Us">
          {contactContent}
        </DesktopLayout>
      </div>

      {/* MOBILE VIEW (< md) */}
      <div className="block md:hidden min-h-screen bg-[#faf9f7] dark:bg-[#121318] text-[#101828] dark:text-[#f8fafc] font-sans pb-[70px]">
        <MobileHeader
          title="Contact Us"
          showBack={true}
          onBack={() => navigate(-1)}
        />
        {contactContent}
        <MobileFooter />
      </div>
    </>
  );
};

export default ContactUsPage;
