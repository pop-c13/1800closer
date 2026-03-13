import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Minus, Clock, Copy, ArrowRight, Bot, Loader2 } from 'lucide-react';

function StatusIcon({ status }) {
  if (status === 'pass') return <Check size={14} className="text-green-400" />;
  if (status === 'warn') return <AlertTriangle size={14} className="text-yellow-400" />;
  if (status === 'fail') return <AlertTriangle size={14} className="text-red-400" />;
  return <Minus size={14} className="text-white/20" />;
}

export default function PostCallScorecard({ show, sessionData, onDone }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // If pre-generated scorecard data exists (viewing from manager), use it
  const scorecard = sessionData?.scorecard || null;

  const duration = sessionData?.duration || 0;
  const flowScore = scorecard?.flowScore || sessionData?.flowScore || 0;
  const outcome = sessionData?.outcome || sessionData?.disposition || '';

  useEffect(() => {
    if (!show) return;
    // If scorecard has a pre-generated AI summary, use it
    if (scorecard?.aiSummary) {
      setAiSummary(scorecard.aiSummary);
      setAiLoading(false);
      return;
    }
    // Otherwise, simulate AI generation (in production, call Anthropic API)
    const timer = setTimeout(() => {
      const savings = sessionData?.savingsPresented || sessionData?.computedSavings?.annualSavings || 0;
      const discovery = sessionData?.discoveryAnswered || 0;
      const price = sessionData?.priceQuoted || sessionData?.totalSale || 0;

      if (outcome === 'closed') {
        setAiSummary(`Strong close with a $${price.toLocaleString()} sale. Discovery was thorough at ${discovery}/9 questions. The calculator was used effectively showing $${savings.toLocaleString()}/yr in savings. Consider spending slightly less time in early slides to improve pacing.`);
      } else if (outcome === 'follow-up') {
        setAiSummary(`Good rapport built but the prospect needed more time. Discovery at ${discovery}/9 shows solid questioning. Focus on addressing the primary hesitation earlier in the next touchpoint and reinforce the ROI of $${savings.toLocaleString()}/yr before revisiting pricing.`);
      } else {
        setAiSummary(`The prospect wasn't a fit for the service. Flow score of ${flowScore}% suggests ${flowScore >= 80 ? 'the rep handled the conversation well despite the outcome' : 'there may be opportunities to qualify better in discovery and build more urgency before pricing'}. Review the discovery phase for earlier disqualification signals.`);
      }
      setAiLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [show]);

  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const pacingPct = Math.min(Math.round((duration / 1800) * 100), 150);
  const pacingStatus = duration <= 1800 ? 'on_time' : duration <= 1980 ? 'warning' : 'over_time';
  const pacingColor = pacingStatus === 'on_time' ? 'green' : pacingStatus === 'warning' ? 'yellow' : 'red';

  const outcomeBadge = outcome === 'closed'
    ? { label: 'SALE', color: 'bg-green-500/15 text-green-400 border-green-500/20' }
    : outcome === 'follow-up'
    ? { label: 'FOLLOW UP', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
    : { label: 'NOT INTERESTED', color: 'bg-red-500/15 text-red-400 border-red-500/20' };

  const flowChecklist = scorecard?.flowChecklist || [
    { label: 'Followed recommended slide path', status: flowScore > 70 ? 'pass' : 'warn' },
    { label: 'Covered all required sections', status: flowScore > 60 ? 'pass' : 'warn' },
    { label: 'Used the tax calculator', status: (sessionData?.computedSavings?.annualSavings || 0) > 0 ? 'pass' : 'fail' },
    { label: `Completed discovery (${sessionData?.discoveryAnswered || 0}/9 questions)`, status: (sessionData?.discoveryAnswered || 0) >= 8 ? 'pass' : 'warn' },
    { label: 'Skipped: Loan Agreement (optional)', status: 'skip' },
  ];

  const slidesPresented = scorecard?.slides?.presented || sessionData?.slidesPresented || 0;
  const totalSlides = scorecard?.slides?.total || sessionData?.totalSlides || 35;
  const avgTimePerSlide = slidesPresented > 0 ? Math.round(duration / slidesPresented) : 0;
  const savings = sessionData?.savingsPresented || sessionData?.computedSavings?.annualSavings || 0;
  const priceQuoted = sessionData?.priceQuoted || sessionData?.totalSale || 0;

  const handleCopy = () => {
    const text = [
      'CALL SCORECARD',
      `Lead: ${sessionData?.leadName || ''} — ${sessionData?.businessName || ''}`,
      `Duration: ${formatDuration(duration)} | ${pacingStatus === 'on_time' ? 'On Time' : 'Over Time'}`,
      `Outcome: ${outcomeBadge.label}`,
      `Flow Score: ${flowScore}%`,
      `Discovery: ${sessionData?.discoveryAnswered || 0}/9`,
      `Objections Handled: ${sessionData?.objectionsHandled || 0}`,
      `Savings Presented: $${savings.toLocaleString()}/yr`,
      `Price Quoted: $${priceQuoted.toLocaleString()}`,
      `Slides: ${slidesPresented}/${totalSlides}`,
      '',
      aiSummary ? `AI Summary: ${aiSummary}` : '',
      sessionData?.callNotes ? `Notes: ${sessionData.callNotes}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a22] shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">CALL SCORECARD</h2>
            <p className="text-white/50 text-sm mt-0.5">
              {sessionData?.leadName || ''} — {sessionData?.businessName || ''}
            </p>
            <p className="text-white/30 text-xs mt-0.5">{new Date().toLocaleDateString()}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${outcomeBadge.color}`}>
            {outcomeBadge.label}
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* PACING */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Pacing</h3>
            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-lg font-bold">{formatDuration(duration)}</span>
              <span className="text-white/30">/</span>
              <span className="text-white/50 font-mono">30:00</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pacingColor === 'green' ? 'bg-green-500' : pacingColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(pacingPct, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                pacingColor === 'green' ? 'text-green-400' : pacingColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {pacingStatus === 'on_time' ? '\u2705 On Time' : '\u26A0\uFE0F Over Time'}
              </span>
            </div>
          </div>

          {/* FLOW SCORE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Flow Score</h3>
              <span className={`text-2xl font-bold font-mono ${
                flowScore >= 85 ? 'text-green-400' : flowScore >= 70 ? 'text-yellow-400' : 'text-red-400'
              }`}>{flowScore}%</span>
            </div>
            <div className="space-y-1.5">
              {flowChecklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StatusIcon status={item.status} />
                  <span className={`text-sm ${
                    item.status === 'pass' ? 'text-white/70'
                    : item.status === 'warn' ? 'text-yellow-300/70'
                    : item.status === 'fail' ? 'text-red-300/70'
                    : 'text-white/30'
                  }`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ENGAGEMENT */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Engagement</h3>
            {/* Sale details if applicable */}
            {(outcome === 'closed' && sessionData?.products?.length > 0) && (
              <div className="mb-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <h4 className="text-[10px] font-bold text-green-400/60 uppercase tracking-wider mb-2">Sale Details</h4>
                {sessionData.products.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/70">{p.name}</span>
                    <span className="text-white font-mono">${p.price?.toLocaleString()} <span className="text-white/30 text-xs">{p.terms}</span></span>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-white/90">Total</span>
                  <span className="text-green-400 font-mono">${sessionData.totalSale?.toLocaleString()}</span>
                </div>
                {sessionData.firstPaymentAmount && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-white/40">First Payment</span>
                    <span className="text-brand-orange font-mono">${sessionData.firstPaymentAmount?.toLocaleString()}</span>
                  </div>
                )}
                {sessionData.paymentMethod && (
                  <div className="flex justify-between text-xs mt-0.5">
                    <span className="text-white/40">Payment Method</span>
                    <span className="text-white/60">{sessionData.paymentMethod}</span>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Discovery answered', `${sessionData?.discoveryAnswered || 0}/9`],
                ['Objections handled', sessionData?.objectionsHandled || 0],
                ['AI Coach tips used', sessionData?.coachTipsUsed || 0],
                ['Tax savings presented', `$${savings.toLocaleString()}/yr`],
                ['Price quoted', priceQuoted ? `$${priceQuoted.toLocaleString()}/yr` : 'N/A'],
                ['ROI shown', priceQuoted > 0 ? `${(savings / priceQuoted).toFixed(1)}x` : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-white/40 text-sm">{label}</span>
                  <span className="text-white/80 text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SLIDES */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Slides</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Presented', `${slidesPresented}/${totalSlides} slides`],
                ['Avg time/slide', `${Math.floor(avgTimePerSlide / 60)}:${String(avgTimePerSlide % 60).padStart(2, '0')}`],
                ['Longest', scorecard?.slides?.longest ? `Slide ${scorecard.slides.longest.slideNum} "${scorecard.slides.longest.title}" — ${Math.floor(scorecard.slides.longest.time / 60)}:${String(scorecard.slides.longest.time % 60).padStart(2, '0')}` : 'N/A'],
                ['Fastest', scorecard?.slides?.fastest ? `Slide ${scorecard.slides.fastest.slideNum} "${scorecard.slides.fastest.title}" — 0:${String(scorecard.slides.fastest.time).padStart(2, '0')}` : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-white/40 text-xs">{label}</span>
                  <span className="text-white/80 text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI COACHING SUMMARY */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-400" />
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">AI Coaching Summary</h3>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <Loader2 size={14} className="text-blue-400 animate-spin" />
                <span className="text-white/30 text-sm">Generating coaching insights...</span>
              </div>
            ) : aiSummary ? (
              <p className="text-white/60 text-sm leading-relaxed p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                {aiSummary}
              </p>
            ) : (
              <p className="text-white/20 text-sm italic">AI summary unavailable</p>
            )}
          </div>

          {/* CALL NOTES */}
          {sessionData?.callNotes && (
            <div>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Call Notes</h3>
              <p className="text-white/50 text-sm p-3 rounded-lg bg-white/[0.02] border border-white/5 whitespace-pre-wrap">
                {sessionData.callNotes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-all"
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Summary</>}
          </button>
          <button
            onClick={onDone}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white text-sm font-bold transition-all active:scale-[0.98]"
          >
            Done — Next Call <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
