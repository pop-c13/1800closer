import { motion } from 'framer-motion';

// ─── Personalized Savings Layout (virtual slide 21b) ─────────────────────────
function PersonalizedSavingsLayout({ slide, leadData, computedSavings, calculator }) {
  const income = calculator?.incomeAmount || 75000;
  const noElection = computedSavings?.noElection || 0;
  const withElection = computedSavings?.withElection || 0;
  const savings = computedSavings?.annualSavings || 0;
  const firstName = leadData?.firstName || 'there';
  const businessName = leadData?.businessName || 'your business';

  const fmt = (n) => '$' + Number(n).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white px-8 py-10 text-center"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          {firstName}, here's your savings breakdown
        </h2>
        <p className="text-gray-500 text-base md:text-lg">
          For <span className="font-semibold text-gray-700">{businessName}</span> earning {fmt(income)}/year
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mb-8">
        {/* Without Election */}
        <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Without S-Corp Election</p>
          <p className="text-sm text-gray-500 mb-3">Self-employment tax on full income</p>
          <p className="text-4xl font-black text-red-500">{fmt(noElection)}</p>
          <p className="text-xs text-red-400 mt-1">/year in SE tax</p>
        </div>

        {/* With Election */}
        <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">With S-Corp Election</p>
          <p className="text-sm text-gray-500 mb-3">SE tax only on reasonable salary</p>
          <p className="text-4xl font-black text-green-600">{fmt(withElection)}</p>
          <p className="text-xs text-green-500 mt-1">/year in SE tax</p>
        </div>
      </div>

      {/* Savings Banner */}
      <div className="w-full max-w-2xl bg-gradient-to-r from-[#F47920] to-orange-500 rounded-2xl p-6 text-white text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/80 mb-1">Your Annual Tax Savings</p>
        <p className="text-5xl font-black">{fmt(savings)}</p>
        <p className="text-white/70 text-sm mt-2">Every year, back in your pocket</p>
      </div>
    </motion.div>
  );
}

// ─── Main SlideRenderer ──────────────────────────────────────────────────────
export default function SlideRenderer({ slide, leadData, computedSavings, pricing, calculator }) {
  if (!slide) return <div className="w-full h-full bg-gray-100" />;

  // Virtual slide 21b — no image, render custom layout
  if (slide.id === '21b') {
    return (
      <PersonalizedSavingsLayout
        slide={slide}
        leadData={leadData}
        computedSavings={computedSavings}
        calculator={calculator}
      />
    );
  }

  // Build the image path — slides are at /slides/slide-01.png through slide-52.png
  const slideNum = String(slide.id).padStart(2, '0');
  const imgSrc = `/slides/slide-${slideNum}.png`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-white flex items-center justify-center">
      {/* The actual slide image */}
      <img
        src={imgSrc}
        alt={`Slide ${slide.id}: ${slide.title}`}
        className="w-full h-full object-contain"
        draggable={false}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />

      {/* Fallback if image is missing */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center flex-col gap-3 text-center p-8"
        style={{ display: 'none' }}
      >
        <div className="text-6xl font-black text-gray-300">{slide.id}</div>
        <div className="text-xl font-bold text-gray-500">{slide.title}</div>
        <div className="text-sm text-gray-400">{slide.subtitle}</div>
        <div className="text-xs text-gray-300 mt-4">Image not found: {imgSrc}</div>
      </div>

      {/* ═══ DYNAMIC OVERLAYS ═══ */}

      {/* Slide 1: Lead name + business name on the Hello slide */}
      {slide.id === 1 && leadData?.businessName && (
        <div className="absolute bottom-[8%] left-0 right-0 text-center z-10">
          <div className="text-white text-lg font-semibold drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Prepared for {leadData.businessName}
          </div>
          <div className="text-white/80 text-sm mt-1 drop-shadow-md" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
            {leadData.firstName} {leadData.lastName}
          </div>
        </div>
      )}

      {/* Slide 21: Dynamic savings comparison numbers */}
      {slide.id === 21 && computedSavings && (
        <>
          <div className="absolute z-10" style={{ bottom: '18%', left: '18%' }}>
            <span className="text-xl font-black text-red-500" style={{ textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}>
              ${computedSavings.noElection?.toLocaleString()}
            </span>
          </div>
          <div className="absolute z-10" style={{ bottom: '18%', right: '18%' }}>
            <span className="text-xl font-black text-emerald-600" style={{ textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}>
              ${computedSavings.withElection?.toLocaleString()}
            </span>
          </div>
          <div className="absolute z-10" style={{ bottom: '4%', left: '50%', transform: 'translateX(-50%)' }}>
            <span className="text-2xl font-black text-gray-900" style={{ textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}>
              Annual Savings: ${computedSavings.annualSavings?.toLocaleString()}
            </span>
          </div>
        </>
      )}

      {/* Slide 24: Dynamic price reveal */}
      {slide.id === 24 && pricing?.annualPrice && (
        <div className="absolute z-10" style={{ bottom: '6%', left: '50%', transform: 'translateX(-50%)' }}>
          <span className="text-3xl font-black text-[#F47920]" style={{ textShadow: '0 2px 8px rgba(255,255,255,0.9)' }}>
            ${pricing.annualPrice}/year
          </span>
        </div>
      )}

      {/* Slide 38: Bundle price */}
      {slide.id === 38 && pricing?.annualPrice && (
        <div className="absolute z-10" style={{ bottom: '6%', left: '50%', transform: 'translateX(-50%)' }}>
          <span className="text-2xl font-black text-[#F47920]" style={{ textShadow: '0 2px 8px rgba(255,255,255,0.9)' }}>
            Your Investment: ${pricing.annualPrice}/year
          </span>
        </div>
      )}
    </div>
  );
}
