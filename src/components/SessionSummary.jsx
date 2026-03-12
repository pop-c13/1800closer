import { motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SessionSummary() {
  const { lead, callDuration, discoveryAnswers, computedSavings, calculator, pricing, sessionData, visibleSlides, setShowSummary } = useApp();
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;
  const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSlides = visibleSlides.length;
  const shownCount = sessionData.slidesShown.length;
  const skippedIds = visibleSlides
    .filter(s => !sessionData.slidesShown.includes(s.id))
    .map(s => s.id);

  const avgTime = shownCount > 0
    ? Math.floor(Object.values(sessionData.slideTimings).reduce((a, b) => a + b, 0) / shownCount)
    : 0;
  const avgMin = Math.floor(avgTime / 60);
  const avgSec = avgTime % 60;

  const discoveryLabels = {
    firstBusiness: 'First business',
    feeling: 'Feeling',
    motivation: 'Motivation',
    fullOrPartTime: 'Full/part-time',
    startupCosts: 'Startup costs',
    fundingSource: 'Funding source',
    futureInvestment: 'Future investment',
    profitStatus: 'Profit status',
    lastYearTax: 'Last year taxes',
  };

  const summaryText = `═══ 1-800Accountant Consultation Summary ═══
Lead: ${lead.firstName} ${lead.lastName} — ${lead.businessName}
Date: ${new Date().toISOString().split('T')[0]} | Duration: ${durationStr}${callDuration > 1800 ? ' ⚠️ OVER 30-MIN SLOT' : ''}
Source: ${lead.leadSource} | Entity: ${lead.entityType} | State: ${lead.state}

DISCOVERY:
${Object.entries(discoveryAnswers)
  .filter(([k, v]) => v && k !== 'formationConfirmed')
  .map(([k, v]) => `- ${discoveryLabels[k] || k}: ${v}`)
  .join('\n') || '- No discovery answers recorded'}

TAX SAVINGS:
- Annual income: $${calculator.incomeAmount.toLocaleString()}
- Tax bracket: ${calculator.taxRate}%
- SE tax savings: $${computedSavings.annualSavings.toLocaleString()}/yr

PRICING:
- Quoted: ${pricing.annualPrice ? `$${pricing.annualPrice}/year (${pricing.paymentType.toLowerCase()} payment, ${pricing.cardType})` : 'Not quoted'}

OBJECTIONS HANDLED:
${sessionData.objectionsClicked.length > 0
  ? sessionData.objectionsClicked.map(o => `- "${o.text}"`).join('\n')
  : '- None'}

SLIDES PRESENTED: ${shownCount}/${totalSlides}${skippedIds.length > 0 ? ` (skipped: ${skippedIds.join(', ')})` : ''}
AVG TIME PER SLIDE: ${avgMin}:${String(avgSec).padStart(2, '0')}

CALL NOTES:
${sessionData.quickNotes || '- No notes recorded'}
═══════════════════════════════════════════════`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-dark-bg border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Call Summary</h2>
          {callDuration > 1800 && <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold border border-red-500/20">⚠️ Over 30 min</span>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange rounded-lg text-white text-sm font-medium hover:bg-brand-orange/90"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 presenter-scroll">
          <pre className="text-white/80 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {summaryText}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}
