import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from './SlideRenderer';

export default function ViewerView() {
  const [currentSlide, setCurrentSlide] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [computedSavings, setComputedSavings] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [calculator, setCalculator] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [showSavingsBanner, setShowSavingsBanner] = useState(false);

  // BroadcastChannel listener
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('sales-presenter-sync');
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SLIDE_CHANGE') {
          setCurrentSlide(payload.slideData);
          setLeadData(payload.leadData);
          setComputedSavings(payload.computedSavings);
          setPricing(payload.pricing);
          setCalculator(payload.taxCalc);
          if (payload.slideIndex != null) setSlideIndex(payload.slideIndex);
          if (payload.showSavingsBanner !== undefined) setShowSavingsBanner(payload.showSavingsBanner);
        } else if (type === 'FULL_STATE') {
          setCurrentSlide(payload.currentSlide);
          setLeadData(payload.leadData);
          setComputedSavings(payload.computedSavings);
          setPricing(payload.pricing);
          setCalculator(payload.taxCalc);
          if (payload.showSavingsBanner !== undefined) setShowSavingsBanner(payload.showSavingsBanner);
          if (payload.slideVisibility) {
            const visibleCount = Object.values(payload.slideVisibility).filter(Boolean).length;
            if (visibleCount > 0) setTotalSlides(visibleCount);
          }
        }
      };
    } catch (e) {}
    return () => { if (channel) channel.close(); };
  }, []);

  const progress = totalSlides > 0
    ? Math.min(((slideIndex + 1) / totalSlides) * 100, 100)
    : 0;

  const businessName = leadData?.businessName || '';
  const annualSavings = computedSavings?.annualSavings || 0;

  // Personalized waiting screen
  if (!currentSlide) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white flex flex-col items-center justify-center select-none">
        {/* Subtle orange gradient bar at top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-orange to-orange-400" />

        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-2xl bg-brand-orange flex items-center justify-center mb-8 shadow-xl"
        >
          <span className="text-white font-black text-5xl leading-none select-none">A</span>
        </motion.div>

        {/* Personalized welcome */}
        {leadData?.firstName ? (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">
              Welcome, {leadData.firstName}
            </h1>
            <div className="w-16 h-0.5 bg-brand-orange rounded-full mb-6" />
            <p className="text-gray-500 text-lg mb-1">Prepared for:</p>
            <p className="text-2xl font-semibold text-gray-800 mb-1">{leadData.businessName || ''}</p>
            {(leadData.address || leadData.state) && (
              <p className="text-gray-400 text-base">
                {leadData.state || ''}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            1-800Accountant
          </h1>
        )}

        <p className="text-gray-400 text-base mt-8 mb-6">
          Your consultation will begin momentarily.
        </p>

        {/* Pulsing dots */}
        <div className="flex items-center gap-2.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-brand-orange/40"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 flex flex-col items-center">
          <div className="w-12 h-0.5 bg-gray-200 rounded-full mb-4" />
          <p className="text-gray-300 text-xs">
            1-800Accountant &middot; America's Leading Virtual Accounting Firm
          </p>
        </div>
      </div>
    );
  }

  // Active presentation
  return (
    <div className="fixed inset-0 overflow-hidden bg-white select-none">
      <AnimatePresence mode="wait">
        <SlideRenderer
          key={currentSlide?.id || slideIndex}
          slide={currentSlide}
          leadData={leadData}
          computedSavings={computedSavings}
          pricing={pricing}
          calculator={calculator}
        />
      </AnimatePresence>

      {/* Tax savings banner — only after savings slide reveal */}
      <AnimatePresence>
        {showSavingsBanner && annualSavings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-md shadow-lg"
          >
            <span className="live-pulse inline-block w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-400">
              {businessName ? `${businessName} — ` : ''}Potential Savings:{' '}
              <span className="text-green-300 font-bold">
                ${Number(annualSavings).toLocaleString()}/yr
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {totalSlides > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-[3px] bg-black/5">
          <motion.div
            className="h-full bg-brand-orange"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}
