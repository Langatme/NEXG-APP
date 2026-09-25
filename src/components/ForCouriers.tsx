import { useState, useEffect } from 'react';
import { responsiveProps } from './ResponsiveImage';
import { 
  ArrowRight, 
  ArrowLeft,
  DollarSign,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  Globe,
  Star,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Phone,
  User,
  Navigation,
  Check,
  Menu,
  X,
  Utensils,
  Sparkles,
  Compass,
  Sun,
  Moon
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import LogoIcon from './LogoIcon';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { formatKes, formatLocalizedNumber, interpolatePartnerCopy, partnerEconomicsCopy, PARTNER_ECONOMICS } from '../data/partnerEconomics';

import { useTheme } from '../context/ThemeContext';

interface ForCouriersProps {
  onNavigate: (page: 'home' | 'merchants' | 'properties' | 'restaurants' | 'experiences' | 'merchant_onboarding' | 'properties' | 'couriers' | 'courier_onboarding' | 'rider_portal') => void;
}

export default function ForCouriers({ onNavigate }: ForCouriersProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLight, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const economicsCopy = partnerEconomicsCopy[language].courier;

  // Calculator States
  const [deliveriesPerDay, setDeliveriesPerDay] = useState(12);
  const [averageDistanceKm, setAverageDistanceKm] = useState(5);
  const [averageTipKes, setAverageTipKes] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileNav = (page: any) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  // Estimate completed route kilometres at the owner-provided KES rate.
  const dailyBaseEarnings = Math.round(
    deliveriesPerDay * averageDistanceKm * PARTNER_ECONOMICS.courierRateKesPerKm,
  );
  const dailyTipEarnings = Math.round(deliveriesPerDay * averageTipKes);
  const totalDailyEarnings = dailyBaseEarnings + dailyTipEarnings;
  
  // Weekly earnings assuming 5 active days
  const totalWeeklyEarnings = totalDailyEarnings * 5;
  // Monthly earnings assuming 22 active days
  const totalMonthlyEarnings = totalDailyEarnings * 22;

  return (
    <div className={`${isLight ? 'bg-[#F8F9FA] text-slate-900' : 'bg-[#1a1c1c] text-[#f9f9f9]'} font-sans antialiased selection:bg-[#E5B65F] selection:text-black min-h-screen transition-colors duration-300`}>
      
      {/* Adaptive Docked Navigation for Couriers */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition duration-300 ${
          scrolled 
            ? (isLight ? 'bg-[#F8F9FA]/85 backdrop-blur-2xl shadow-xs py-3' : 'bg-[#1a1c1c]/85 backdrop-blur-2xl shadow-xs py-3')
            : 'bg-transparent py-5 sm:py-6'
        }`} 
        id="top-nav"
      >
        <div className="px-4 sm:px-6 max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition backdrop-blur-md cursor-pointer min-w-[40px] min-h-[40px] ${
                isLight
                  ? 'bg-white/80 hover:bg-white text-slate-800 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={t.ui.forCouriers.s_75dde0}
              aria-label={t.ui.forCouriers.s_ce7472}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Elegant brand info */}
            <div className="flex items-center gap-2 cursor-pointer py-1" onClick={() => onNavigate('home')}>
              {/* The wordmark already spells NEXG, so no text sits beside it. */}
              <LogoIcon variant="wordmark" className="h-7 w-auto" />
            </div>
          </div>

          {/* Desktop links & In-Page Courier Anchors */}
          <div className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-semibold">
            {scrolled ? (
              <>
                <a href="#earnings-calculator" className={`transition-colors cursor-pointer py-2 px-2 hover:text-[#E5B65F] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{t.partnerHeaders.earningsCalc}</a>
                <a href="#fleet-benefits" className={`transition-colors cursor-pointer py-2 px-2 hover:text-[#E5B65F] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{t.partnerHeaders.fleetPerks}</a>
                <a href="#elite-standards" className={`transition-colors cursor-pointer py-2 px-2 hover:text-[#E5B65F] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{t.partnerHeaders.standards}</a>
                <a href="#faq-section" className={`transition-colors cursor-pointer py-2 px-2 hover:text-[#E5B65F] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{t.partnerHeaders.faq}</a>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('properties')} className={`transition-colors cursor-pointer py-2 px-2 ${isLight ? 'text-slate-700 hover:text-amber-800' : 'text-gray-300 hover:text-white'}`}>{t.nav.forProperties}</button>
                <button onClick={() => onNavigate('merchants')} className={`transition-colors cursor-pointer py-2 px-2 ${isLight ? 'text-slate-700 hover:text-amber-800' : 'text-gray-300 hover:text-white'}`}>{t.nav.forMerchants}</button>
                <button onClick={() => onNavigate('couriers')} className={`transition-colors cursor-pointer py-2 px-2 ${isLight ? 'text-amber-800 font-bold' : 'text-[#E5B65F] font-bold'}`}>{t.nav.forCouriers}</button>
                <button onClick={() => onNavigate('experiences')} className={`transition-colors cursor-pointer py-2 px-2 ${isLight ? 'text-slate-700 hover:text-amber-800' : 'text-gray-300 hover:text-white'}`}>{t.nav.experiences}</button>
              </>
            )}

            {/* Quick Action Docked CTA */}
            <button
              onClick={() => onNavigate('courier_onboarding')}
              className={`px-4 py-2 rounded-full font-bold text-xs transition cursor-pointer shadow-xs active:scale-95 ${
                isLight 
                  ? 'bg-[#B88728] hover:bg-[#9e721d] text-slate-950'
                  : 'bg-[#E5B65F] hover:bg-[#d6a54d] text-[#291800]'
              }`}
            >
              {t.partnersPortal.applyFleet}
            </button>
            
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle Button */}
            <button
              id="couriers-theme-toggle-btn"
              onClick={toggleTheme}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white/80 hover:bg-white border-slate-200 text-amber-800 shadow-2xs'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-[#E5B65F]'
              }`}
              aria-label={t.ui.forCouriers.s_b74c4e}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          {/* Mobile hamburger & controls */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              id="couriers-mobile-theme-btn"
              onClick={toggleTheme}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-amber-800'
                  : 'bg-white/10 border-white/15 text-[#E5B65F]'
              }`}
              title={t.ui.forCouriers.s_b74c4e}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-10 h-10 flex items-center justify-center transition-colors focus:outline-none cursor-pointer min-w-[40px] min-h-[40px] ${
                isLight ? 'text-slate-800 hover:text-amber-800' : 'text-white hover:text-[#E5B65F]'
              }`}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-4 right-4 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-50 md:hidden backdrop-blur-2xl ${
                isLight
                  ? 'bg-white/95 text-slate-800 shadow-lg'
                  : 'bg-[#1e2020]/95 text-white'
              }`}
            >
              <div className="flex flex-col gap-3 font-semibold text-sm">
                <button onClick={() => handleMobileNav('home')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors">{t.ui.forCouriers.s_a1e9f9}</button>
                <button onClick={() => handleMobileNav('properties')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors">{t.ui.forCouriers.s_38769a}</button>
                <button onClick={() => handleMobileNav('merchants')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors">{t.ui.forCouriers.s_52a6f3}</button>
                <button onClick={() => handleMobileNav('couriers')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors text-[#E5B65F]">{t.ui.forCouriers.s_18414d}</button>
                <button onClick={() => handleMobileNav('rider_portal')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors">Rider portal preview</button>
                <button onClick={() => handleMobileNav('experiences')} className="text-left py-2 hover:text-[#E5B65F] w-full transition-colors">Experiences</button>
              </div>
              <button 
                onClick={() => handleMobileNav('courier_onboarding')}
                className="w-full text-center text-sm font-bold bg-[#E5B65F] text-[#291800] rounded-xl py-3 hover:bg-[#ffddb1] transition-colors"
              >{t.ui.forCouriers.s_9b1690}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section with Dual Day/Night Image & Organic Bottom Blend */}
      <section className="relative h-[80vh] min-h-[520px] sm:min-h-[580px] flex flex-col justify-end pb-[5%] sm:pb-[5%] overflow-hidden z-10 pt-20">
        {/* Background Image with Ambient Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {isLight ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/70 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9FA]/95 via-[#F8F9FA]/70 to-transparent z-10"></div>
              <img 
                src={responsiveProps('couriers_hero_light_1789911815432.jpg', '100vw')?.src} 
                alt={t.ui.forCouriers.s_ff2382} 
                className="w-full h-full object-cover opacity-85 brightness-105 transition-transform duration-[10000ms] hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1c] via-[#1a1c1c]/80 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1c1c]/95 via-[#1a1c1c]/70 to-transparent z-10"></div>
              <img 
                src={responsiveProps('nexg_motorbike_mockup.jpg', '100vw')?.src} 
                alt={t.ui.forCouriers.s_d44881} 
                className="w-full h-full object-cover opacity-80 sm:opacity-90 transition-transform duration-[10000ms] hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </>
          )}

          {/* Organic Bottom Blend Feathering */}
          <div className={`absolute -bottom-1 left-0 right-0 h-32 z-10 ${
            isLight ? 'bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/90 to-transparent' : 'bg-gradient-to-t from-[#1a1c1c] via-[#1a1c1c]/90 to-transparent'
          }`} />
        </div>

        {/* Content Container */}
        <div className="container mx-auto max-w-[1400px] relative z-20 px-4 sm:px-8 xl:px-16 w-full">
          <div className="max-w-3xl">
            <h1 className={`font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_a08321}<br />
              <span className="text-[#E5B65F]">{t.ui.forCouriers.s_ce60db}</span>
            </h1>
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 max-w-2xl leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-[#d1d5db]'}`}>
              Increase your earnings by delivering to premium guests and luxury residents. Enjoy higher payouts and 100% of your tips.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button 
                onClick={() => onNavigate('courier_onboarding')}
                className="w-full sm:w-auto bg-[#E5B65F] text-[#291800] px-8 py-4 rounded-full font-bold text-base hover:bg-[#ffddb1] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer min-h-[48px]"
              >{t.ui.forCouriers.s_33b4c6}</button>
              <button 
                onClick={() => {
                  const el = document.getElementById('earnings-calculator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full sm:w-auto border px-8 py-4 rounded-full font-bold text-base transition-colors text-center cursor-pointer min-h-[48px] ${
                  isLight
                    ? 'border-slate-300 text-slate-800 hover:bg-slate-100 bg-white/70 shadow-sm'
                    : 'border-white/20 text-white hover:bg-white/5'
                }`}
              >{t.ui.forCouriers.s_38df83}</button>
              <button
                onClick={() => onNavigate('rider_portal')}
                className={`w-full sm:w-auto border px-8 py-4 rounded-full font-bold text-base transition-colors text-center cursor-pointer min-h-[48px] ${
                  isLight
                    ? 'border-slate-300 text-slate-800 hover:bg-slate-100 bg-white/70 shadow-sm'
                    : 'border-white/20 text-white hover:bg-white/5'
                }`}
              >Rider portal preview</button>
            </div>
          </div>
        </div>
      </section>


      {/* The NEXG Standard & Fleet Benefits (Bento Grid) */}
      <section id="fleet-benefits" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto relative z-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className={`font-bold tracking-widest text-xs uppercase px-3.5 py-1.5 rounded-full border ${
            isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
          }`}>{t.ui.forCouriers.s_df9144}</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-3 sm:mb-4 tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Why Ride with the Elite?
          </h2>
          <p className={`text-sm sm:text-base md:text-lg ${
            isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
          }`}>
            We don't just deliver packages; we transport experiences. Our courier partners are the premium ambassadors representing East Africa's leading hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <Award size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>White-Glove Service</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_7f255f}</p>
          </div>

          {/* Card 2 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_981b01}</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_08c1c3}</p>
          </div>

          {/* Card 3 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <Navigation size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_5150fd}</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_9d3f52}</p>
          </div>

          {/* Card 4 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <DollarSign size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_530246}</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_4748c1}</p>
          </div>

          {/* Card 5 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <Clock size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_93fef0}</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_95e986}</p>
          </div>

          {/* Card 6 */}
          <div className={`rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg hover:-translate-y-1.5 transition duration-300 ${
            isLight
              ? 'bg-white hover:shadow-xl text-slate-900'
              : 'bg-white/5 hover:bg-white/[0.08] text-white'
          }`}>
            <div className={`mb-5 ${
              isLight ? 'text-amber-800' : 'text-[#E5B65F]'
            }`}>
              <Briefcase size={28} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_2d816d}</h3>
            <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_97b846}</p>
          </div>
        </div>
      </section>

      {/* The Tech Advantage */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Card Left */}
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-[#E5B65F]/5 rounded-[40px] blur-3xl"></div>
            <div className={`relative rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-xl border overflow-hidden transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#131515] border-white/10 text-white'
            }`}>
              <div className="flex items-center gap-4 mb-6 sm:mb-10">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                }`}>
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_440245}</h3>
                  <p className={`text-xs sm:text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Next-gen courier utility for maximum efficiency
                  </p>
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    1
                  </div>
                  <div>
                    <h4 className={`font-bold text-base sm:text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Room-Specific Delivery Guidance
                    </h4>
                    <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_f370c7}</p>
                  </div>
                </div>

                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    2
                  </div>
                  <div>
                    <h4 className={`font-bold text-base sm:text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Zero-Lag Cashouts
                    </h4>
                    <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_85cf78}</p>
                  </div>
                </div>

                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    3
                  </div>
                  <div>
                    <h4 className={`font-bold text-base sm:text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_fbe3b3}</h4>
                    <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_c88176}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphic Right */}
          <div className="order-1 lg:order-2">
            <div className={`h-[320px] sm:h-[450px] lg:h-[550px] rounded-2xl sm:rounded-[32px] overflow-hidden shadow-2xl relative group border ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 z-10"></div>
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={t.ui.forCouriers.s_befa37} 
                src={responsiveProps('courier_delivery_door_1783931148146.jpg', '100vw')?.src} 
                referrerPolicy="no-referrer"
              />
              <div className={`absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 backdrop-blur-xl p-4 sm:p-6 rounded-2xl z-20 border shadow-lg ${
                isLight ? 'bg-white/95 text-slate-900 border-slate-200 shadow-xl' : 'bg-[#131515]/95 text-white border-white/10 shadow-lg'
              }`}>
                <p className={`text-xl sm:text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>98% Order Completion</p>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-gray-300'}`}>{t.ui.forCouriers.s_1bedd8}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Earnings Section */}
      <section id="earnings-calculator" className={`py-16 sm:py-24 border-y transition-colors duration-300 ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#131515] border-white/10'
      }`}>
        <div className="px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div>
              <span className={`font-bold tracking-widest text-xs uppercase px-3.5 py-1.5 rounded-full border ${
                isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
              }`}>{t.ui.forCouriers.s_765f2b}</span>
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-4 sm:mb-6 tracking-tight leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>{t.ui.forCouriers.s_2ed1ed}</h2>
              <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed ${
                isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
              }`}>
                Enjoy a transparent base-plus-bonus structure designed specifically for top-tier couriers. All tips are 100% yours, and rating incentives boost your earnings exponentially.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start">
                  <div className={`p-2.5 border rounded-xl mr-4 mt-0.5 ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_8049d9}</h4>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_e3a7a2}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`p-2.5 border rounded-xl mr-4 mt-0.5 ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <Star size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>5-Star Excellence Boost</h4>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_42475b}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`p-2.5 border rounded-xl mr-4 mt-0.5 ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_bc89aa}</h4>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_a7acb1}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Earnings Estimator */}
            <div className={`rounded-2xl sm:rounded-[32px] p-5 sm:p-8 md:p-10 shadow-xl border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-white/5 backdrop-blur-xl border-white/10 text-white'
            }`}>
              <h3 className={`text-lg sm:text-xl font-bold mb-6 sm:mb-8 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <DollarSign size={22} className={isLight ? 'text-amber-800' : 'text-[#E5B65F]'} />{economicsCopy.heading}</h3>

              <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
                {/* Billable distance per completed delivery */}
                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-2">
                    <label htmlFor="courier-distance" className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      {economicsCopy.distancePerDelivery}
                    </label>
                    <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>{formatLocalizedNumber(averageDistanceKm, language)} km</span>
                  </div>
                  <input
                    id="courier-distance"
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={averageDistanceKm}
                    onChange={(event) => setAverageDistanceKm(Number(event.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isLight ? 'bg-slate-300 accent-amber-600' : 'bg-white/10 accent-[#E5B65F]'
                    }`}
                  />
                </div>

                {/* Slider: Deliveries */}
                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-2">
                    <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{economicsCopy.deliveriesPerDayLabel}</span>
                    <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>{deliveriesPerDay} {economicsCopy.ordersPerDay}</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="25" 
                    value={deliveriesPerDay}
                    onChange={(e) => setDeliveriesPerDay(parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isLight ? 'bg-slate-300 accent-amber-600' : 'bg-white/10 accent-[#E5B65F]'
                    }`}
                  />
                </div>

                {/* Slider: Tip */}
                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-2">
                    <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{economicsCopy.averageTipPerDelivery}</span>
                    <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>{formatKes(averageTipKes, language)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="500"
                    step="10"
                    value={averageTipKes}
                    onChange={(e) => setAverageTipKes(parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isLight ? 'bg-slate-300 accent-amber-600' : 'bg-white/10 accent-[#E5B65F]'
                    }`}
                  />
                </div>
              </div>

              {/* Earnings breakdown */}
              <div className={`border-t pt-6 space-y-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className={`p-3 sm:p-4 rounded-xl text-center border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/5 text-white'
                  }`}>
                    <p className={`text-[10px] sm:text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{economicsCopy.estimatedDaily}</p>
                    <p className={`text-sm sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatKes(totalDailyEarnings, language)}</p>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-xl text-center border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/5 text-white'
                  }`}>
                    <p className={`text-[10px] sm:text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{economicsCopy.weekly}</p>
                    <p className={`text-sm sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatKes(totalWeeklyEarnings, language)}</p>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-xl text-center border ${
                    isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-[#E5B65F]/10 border-[#E5B65F]/20 text-[#E5B65F]'
                  }`}>
                    <p className={`text-[10px] sm:text-xs mb-1 font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>{economicsCopy.monthly}</p>
                    <p className={`text-sm sm:text-xl font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>{formatKes(totalMonthlyEarnings, language)}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs flex items-start gap-2.5 leading-relaxed font-medium border ${
                  isLight
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-[#E5B65F]/10 border-[#E5B65F]/20 text-[#E5B65F]'
                }`}>
                  <Zap size={16} className={`flex-shrink-0 mt-0.5 ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`} />
                  <div className="space-y-2">
                    <p>
                      {interpolatePartnerCopy(economicsCopy.rateNotice, {
                        rate: formatKes(PARTNER_ECONOMICS.courierRateKesPerKm, language),
                        notice: formatLocalizedNumber(PARTNER_ECONOMICS.courierRateNoticeHours, language),
                      })}
                    </p>
                    <p>
                      {interpolatePartnerCopy(economicsCopy.estimateBasis, {
                        rate: formatKes(PARTNER_ECONOMICS.courierRateKesPerKm, language),
                      })}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate('courier_onboarding')}
                  className="w-full py-4 bg-[#E5B65F] hover:bg-[#ffddb1] text-[#291800] rounded-xl font-bold transition text-sm tracking-wide shadow-md cursor-pointer"
                >{t.ui.forCouriers.s_06816c}</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Powerful Analytics */}
      <section className={`py-16 sm:py-24 border-y transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#131515] border-white/10'
      }`}>
        <div className="px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className={`font-bold tracking-widest text-xs uppercase px-3.5 py-1.5 rounded-full border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
            }`}>{t.ui.forCouriers.s_53cdfb}</span>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-4 sm:mb-6 tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>{t.ui.forCouriers.s_78df83}</h2>
            <p className={`text-xs sm:text-sm md:text-base lg:text-lg ${
              isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
            }`}>{t.ui.forCouriers.s_4f555f}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Analytics Card 1 */}
            <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md border flex flex-col justify-between transition ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 hover:shadow-xl text-slate-900'
                : 'bg-white/5 border-white/10 hover:shadow-lg text-white'
            }`}>
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div className={`p-3 rounded-2xl border ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{t.ui.forCouriers.s_209f63}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>+35%</p>
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_e72e94}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_8b1193}</p>
              </div>
              <div className={`mt-8 pt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>{t.ui.forCouriers.s_c71f96}</span>
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>96.5%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                  <div className="bg-[#E5B65F] h-full rounded-full" style={{ width: '96.5%' }}></div>
                </div>
              </div>
            </div>

            {/* Analytics Card 2 */}
            <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md border flex flex-col justify-between transition ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 hover:shadow-xl text-slate-900'
                : 'bg-white/5 border-white/10 hover:shadow-lg text-white'
            }`}>
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div className={`p-3 rounded-2xl border ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <Star size={24} />
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{t.ui.forCouriers.s_4d5b64}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>4.95 / 5</p>
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_5b8964}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_6d1c48}</p>
              </div>
              <div className={`mt-8 pt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>{t.ui.forCouriers.s_c38c49}</span>
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>Top 2%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                  <div className="bg-[#E5B65F] h-full rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>

            {/* Analytics Card 3 */}
            <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md border flex flex-col justify-between transition sm:max-lg:col-span-2 ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 hover:shadow-xl text-slate-900'
                : 'bg-white/5 border-white/10 hover:shadow-lg text-white'
            }`}>
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div className={`p-3 rounded-2xl border ${
                    isLight ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/5 border-white/10 text-[#E5B65F]'
                  }`}>
                    <Navigation size={24} />
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{t.ui.forCouriers.s_153ab5}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`}>-45%</p>
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_d781b4}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_f582d4}</p>
              </div>
              <div className={`mt-8 pt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>{t.ui.forCouriers.s_677710}</span>
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>95.4%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                  <div className="bg-[#E5B65F] h-full rounded-full" style={{ width: '95.4%' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4-Step Onboarding Timeline Flow */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto" id="how-it-works-timeline">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className={`font-bold tracking-widest text-xs uppercase px-3.5 py-1.5 rounded-full border ${
            isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
          }`}>{t.ui.forCouriers.s_4c36e1}</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-4 sm:mb-6 tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            4 Simple Steps to Get Started
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
            isLight ? 'text-slate-600' : 'text-[#a0a1a1]'
          }`}>{t.ui.forCouriers.s_7e32e7}</p>
        </div>

        {/* Timeline track wrapper */}
        <div className="relative">
          {/* Connector Line (Desktop only) */}
          <div className={`absolute top-[48%] left-[12%] right-[12%] h-[2px] -translate-y-1/2 hidden lg:block z-0 pointer-events-none ${
            isLight
              ? 'bg-gradient-to-r from-amber-300 via-slate-300 to-amber-300'
              : 'bg-gradient-to-r from-[#E5B65F]/40 via-white/10 to-[#E5B65F]/40'
          }`}></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            
            {/* Step 1 */}
            <div className={`relative rounded-2xl p-6 transition duration-300 flex flex-col justify-between min-h-[220px] ${
              isLight
                ? 'bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg shadow-sm text-slate-900'
                : 'bg-[#131515] border border-white/10 hover:border-[#E5B65F]/40 hover:bg-white/[0.02] shadow-lg text-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
                  }`}>{t.ui.forCouriers.s_2bf27f}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                    isLight
                      ? 'bg-amber-100 border border-amber-300 text-amber-800'
                      : 'bg-[#E5B65F]/10 border border-[#E5B65F]/30 text-[#E5B65F]'
                  }`}>
                    1
                  </div>
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_0c343a}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_2a7274}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`relative rounded-2xl p-6 transition duration-300 flex flex-col justify-between min-h-[220px] ${
              isLight
                ? 'bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg shadow-sm text-slate-900'
                : 'bg-[#131515] border border-white/10 hover:border-[#E5B65F]/40 hover:bg-white/[0.02] shadow-lg text-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
                  }`}>{t.ui.forCouriers.s_c24cae}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                    isLight
                      ? 'bg-amber-100 border border-amber-300 text-amber-800'
                      : 'bg-[#E5B65F]/10 border border-[#E5B65F]/30 text-[#E5B65F]'
                  }`}>
                    2
                  </div>
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_5ce9fd}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_5e7925}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`relative rounded-2xl p-6 transition duration-300 flex flex-col justify-between min-h-[220px] ${
              isLight
                ? 'bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg shadow-sm text-slate-900'
                : 'bg-[#131515] border border-white/10 hover:border-[#E5B65F]/40 hover:bg-white/[0.02] shadow-lg text-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
                  }`}>{t.ui.forCouriers.s_4d81b2}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                    isLight
                      ? 'bg-amber-100 border border-amber-300 text-amber-800'
                      : 'bg-[#E5B65F]/10 border border-[#E5B65F]/30 text-[#E5B65F]'
                  }`}>
                    3
                  </div>
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_928714}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_fcf600}</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`relative rounded-2xl p-6 transition duration-300 flex flex-col justify-between min-h-[220px] ${
              isLight
                ? 'bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg shadow-sm text-slate-900'
                : 'bg-[#131515] border border-white/10 hover:border-[#E5B65F]/40 hover:bg-white/[0.02] shadow-lg text-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-widest uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">{t.ui.forCouriers.s_e3b925}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-inner">
                    ✓
                  </div>
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_0e840b}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_45b640}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          
          {/* Left Graphic */}
          <div className="relative">
            <div className={`h-[320px] sm:h-[450px] lg:h-[550px] rounded-2xl sm:rounded-[32px] overflow-hidden shadow-2xl relative group border ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 z-10"></div>
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={t.ui.forCouriers.s_777b12} 
                src={responsiveProps('courier_delivery_door_1783931148146.jpg', '100vw')?.src} 
                referrerPolicy="no-referrer"
              />
              <div className={`absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 backdrop-blur-xl p-4 sm:p-6 rounded-2xl z-20 border shadow-lg ${
                isLight ? 'bg-white/95 text-slate-900 border-slate-200 shadow-xl' : 'bg-[#131515]/95 text-white border-white/10 shadow-lg'
              }`}>
                <p className={`text-xl sm:text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_41493f}</p>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_3500ab}</p>
              </div>
            </div>
          </div>

          {/* Right Requirements */}
          <div>
            <span className={`font-bold tracking-widest text-xs uppercase px-3 py-1.5 rounded-full border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
            }`}>{t.ui.forCouriers.s_2e6151}</span>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-4 sm:mb-6 tracking-tight leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>{t.ui.forCouriers.s_933192}</h2>
            <p className={`text-sm sm:text-base mb-6 sm:mb-10 leading-relaxed ${
              isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
            }`}>
              We select only the most professional and courteous operators. To maintain our reputation with premium hotels and resorts, all applicants must meet the following criteria:
            </p>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex gap-4 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5 text-xs ${
                  isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#E5B65F]/20 text-[#E5B65F]'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm sm:text-base mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_c18810}</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_aed5c5}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5 text-xs ${
                  isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#E5B65F]/20 text-[#E5B65F]'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm sm:text-base mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_c10fec}</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>
                    Your motorbike, scooter, or car must be in exemplary visual and technical working condition (no visible dents or severe mechanical issues).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5 text-xs ${
                  isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#E5B65F]/20 text-[#E5B65F]'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm sm:text-base mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.ui.forCouriers.s_54c4b5}</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>
                    An open, positive mindset with excellent hospitality manners is critical. Fluency in English (or Swahili) is required to interact with premium international guests.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className={`py-12 sm:py-20 lg:py-24 border-t px-4 sm:px-8 xl:px-16 transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50/60' : 'border-white/10'
      }`}>
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className={`font-bold tracking-widest text-xs uppercase px-3 py-1.5 rounded-full border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#E5B65F]/10 text-[#E5B65F] border-[#E5B65F]/20'
            }`}>{t.ui.forCouriers.s_ad6c0d}</span>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-4 mb-3 sm:mb-4 tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>{t.ui.forCouriers.s_b53080}</h2>
            <p className={`text-xs sm:text-sm md:text-base ${
              isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
            }`}>
              Got questions? We have direct answers. Explore answers to commonly asked questions from elite partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
            <div className={`rounded-2xl p-5 sm:p-6 border transition ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              <h4 className={`font-bold text-sm sm:text-base mb-2 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <HelpCircle size={18} className={`flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`} />
                How soon can I start delivering?
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_22d1d3}</p>
            </div>

            <div className={`rounded-2xl p-5 sm:p-6 border transition ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              <h4 className={`font-bold text-sm sm:text-base mb-2 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <HelpCircle size={18} className={`flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`} />
                Do I need to own my vehicle?
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>
                Yes, you must have access to a reliable, clean vehicle. However, we have special lease-to-own programs with local premium vehicle providers if you wish to upgrade to an executive vehicle.
              </p>
            </div>

            <div className={`rounded-2xl p-5 sm:p-6 border transition ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              <h4 className={`font-bold text-sm sm:text-base mb-2 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <HelpCircle size={18} className={`flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`} />
                What areas do you currently cover?
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_653ccb}</p>
            </div>

            <div className={`rounded-2xl p-5 sm:p-6 border transition ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900'
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              <h4 className={`font-bold text-sm sm:text-base mb-2 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <HelpCircle size={18} className={`flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-[#E5B65F]'}`} />
                What is the NEXG courier dress code?
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_eeb176}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-8 max-w-[1400px] mx-auto">
        <div className={`rounded-3xl sm:rounded-[40px] py-12 sm:py-16 px-5 sm:px-10 md:px-16 text-center relative overflow-hidden shadow-2xl border transition-colors ${
          isLight
            ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border-amber-200 text-slate-900'
            : 'bg-[#1a1c1c] text-white border-white/10'
        }`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C49A5C 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className={`text-xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Ready to Partner with East Africa's Finest?
            </h2>
            <p className={`text-xs sm:text-sm md:text-base mb-6 sm:mb-10 leading-relaxed max-w-2xl mx-auto ${
              isLight ? 'text-slate-600 font-medium' : 'text-[#a0a1a1]'
            }`}>{t.ui.forCouriers.s_eb35f1}</p>
            <button 
              onClick={() => onNavigate('courier_onboarding')}
              className="bg-[#E5B65F] hover:bg-[#ffddb1] text-[#291800] px-8 sm:px-10 py-3.5 sm:py-5 rounded-full font-bold text-sm sm:text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            >{t.ui.forCouriers.s_6bde0a}</button>
            <p className={`mt-6 text-[10px] sm:text-xs tracking-wider uppercase font-semibold ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              Fast Review within 48 Hours • Complete Starter Kit Included • Elite Earnings
            </p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className={`border-t py-12 sm:py-16 px-4 sm:px-8 xl:px-16 max-w-[1400px] mx-auto rounded-t-3xl transition-colors duration-300 ${
        isLight
          ? 'bg-white text-slate-900 border-slate-200 shadow-sm'
          : 'bg-[#111212] text-white border-white/10'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 mb-12">
          
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-1 cursor-pointer mb-6" onClick={() => onNavigate('home')}>
              {/* The wordmark already spells NEXG, so no text sits beside it. */}
              <LogoIcon variant="wordmark" className="h-9 w-auto" />
            </div>
            <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#a0a1a1]'}`}>{t.ui.forCouriers.s_89bdbf}</p>
            <div className="flex space-x-4">
              <button className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:text-amber-800 hover:border-amber-400 bg-slate-50'
                  : 'border-white/15 text-gray-400 hover:text-[#E5B65F] hover:border-[#E5B65F] bg-white/5'
              }`}>
                <Star size={16} />
              </button>
              <button className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:text-amber-800 hover:border-amber-400 bg-slate-50'
                  : 'border-white/15 text-gray-400 hover:text-[#E5B65F] hover:border-[#E5B65F] bg-white/5'
              }`}>
                <Globe size={16} />
              </button>
              <button className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:text-amber-800 hover:border-amber-400 bg-slate-50'
                  : 'border-white/15 text-gray-400 hover:text-[#E5B65F] hover:border-[#E5B65F] bg-white/5'
              }`}>
                <Zap size={16} />
              </button>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Company</h4>
            <div className="flex flex-col space-y-3">
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_c887b9}</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>Careers</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>Blog</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>Press</button>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Resources</h4>
            <div className="flex flex-col space-y-3">
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_110158}</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_9ad0cc}</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>FAQs</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_1d2be9}</button>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Legal</h4>
            <div className="flex flex-col space-y-3">
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_0c8a9a}</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_9db108}</button>
              <button onClick={() => onNavigate('home')} className={`text-sm font-semibold text-left bg-transparent border-none cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#B88728]' : 'text-gray-400 hover:text-[#E5B65F]'
              }`}>{t.ui.forCouriers.s_e6e178}</button>
            </div>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Newsletter</h4>
            <p className={`text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{t.ui.forCouriers.s_ec3c35}</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email address" 
                className={`border rounded-l-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-[#B88728]'
                    : 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-[#E5B65F]'
                }`}
              />
              <button className={`rounded-r-xl px-4 flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#B88728] hover:bg-[#9e721d] text-slate-950'
                  : 'bg-[#E5B65F] hover:bg-[#ffddb1] text-[#291800]'
              }`}>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>

        <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-gray-400'
        }`}>
          <p>© 2026 NEXG App. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Globe size={14} /> Global</span>
            <span className="flex items-center gap-1.5">{t.ui.forCouriers.s_a9577d}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
