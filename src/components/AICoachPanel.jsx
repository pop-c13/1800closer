import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, AlertCircle, Zap, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_FAST = 'claude-haiku-4-5-20251001';
const MODEL_QUALITY = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert sales coach for 1-800Accountant, a virtual accounting firm for small businesses. You're coaching a sales rep in real-time during a live prospect call.

Your role:
- Provide concise, actionable coaching tips (2-3 sentences max)
- Generate rebuttals tailored to the specific lead's situation
- Reference the lead's actual data (name, business, income, state, etc.)
- Be encouraging but direct — the rep reads this WHILE talking to a prospect
- Never suggest dishonest tactics
- Focus on value-based selling — help the prospect see the ROI

The service:
- Core package: Tax advisory + tax prep + bookkeeping software + entity election + deliverables
- Add-ons: Full-service bookkeeping, Payroll
- Typical pricing: ~$2,000–$4,000/year (partner pricing is ~40% less than traditional CPAs at $7K–$9K)
- 100% tax deductible
- 92% customer satisfaction, 4.6 Trustpilot, 100K+ clients
- 75-day window for entity classification election — creates urgency

Format: SHORT, scannable tips. Bold key phrases. No long paragraphs. The rep is glancing at this while talking.`;

const OBJECTIONS = [
  'Too expensive',
  'Need to think about it',
  'Already have an accountant',
  'Spouse needs to decide',
  'Just started, no revenue',
  'I can do it myself / TurboTax',
  'Not ready to commit today',
  "What if I don't like it?",
];

const PACING_THRESHOLD_SECONDS = 180; // 3 minutes

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function callCoach(message, model) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'No response generated.';
  } catch (err) {
    return 'Coach unavailable — check API connection.';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AICoachPanel() {
  const {
    lead,
    visibleSlides,
    currentSlideIndex,
    calculator,
    computedSavings,
    discoveryAnswers,
    sessionData,
    trackObjection,
  } = useApp();

  // State
  const [autoTip, setAutoTip] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [pacingAlert, setPacingAlert] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const debounceRef = useRef(null);
  const slideTimerRef = useRef(null);
  const slideEnteredRef = useRef(Date.now());
  const prevSlideIndexRef = useRef(currentSlideIndex);
  const responseEndRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Context builder
  // ---------------------------------------------------------------------------

  const buildContext = useCallback(() => {
    const slide = visibleSlides[currentSlideIndex];
    const slideId = slide?.id || 'unknown';
    const slideTitle = slide?.title || 'Unknown';
    const slideCategory = slide?.category || 'general';
    const timeOnSlide = Math.floor((Date.now() - slideEnteredRef.current) / 1000);

    const firstName = lead?.firstName || 'Unknown';
    const lastName = lead?.lastName || '';
    const businessName = lead?.businessName || 'N/A';
    const entityType = lead?.entityType || lead?.entity || 'N/A';
    const state = lead?.state || 'N/A';
    const leadSource = lead?.leadSource || lead?.source || 'N/A';
    const annualIncome = calculator.incomeRange || 'N/A';
    const incomeAmount = calculator.incomeAmount || 0;
    const employees = calculator.employees || 'Just me';
    const taxRate = calculator.taxRate || 25;
    const annualSavings = computedSavings?.annualSavings || 0;

    const filledCount = Object.values(discoveryAnswers || {}).filter(
      (v) => v !== '' && v !== false && v !== null && v !== undefined,
    ).length;

    const slidesShown = (sessionData?.slidesShown || []).join(', ') || 'none';
    const objectionsClicked =
      (sessionData?.objectionsClicked || []).map((o) => o.text).join(', ') || 'none';

    return `CURRENT CONTEXT:
- Slide: #${slideId} "${slideTitle}" (${slideCategory})
- Time on this slide: ${timeOnSlide}s
- Lead: ${firstName} ${lastName} — ${businessName} (${entityType}, ${state})
- Lead Source: ${leadSource}
- Revenue: ${annualIncome} (est. $${incomeAmount})
- Employees: ${employees}
- Tax Bracket: ${taxRate}%
- Computed Savings: $${annualSavings}/yr
- Discovery completed: ${filledCount}/9 answers
- Discovery data: ${JSON.stringify(discoveryAnswers)}
- Slides shown so far: ${slidesShown}
- Objections raised: ${objectionsClicked}`;
  }, [
    visibleSlides,
    currentSlideIndex,
    lead,
    calculator,
    computedSavings,
    discoveryAnswers,
    sessionData,
  ]);

  // ---------------------------------------------------------------------------
  // Auto-tip on slide change (2-second debounce, Haiku)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Skip initial mount or if no slides yet
    if (visibleSlides.length === 0) return;

    // Reset slide timer
    slideEnteredRef.current = Date.now();
    setPacingAlert(null);

    // Clear any existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const slide = visibleSlides[currentSlideIndex];
      if (!slide) return;

      setIsLoadingTip(true);
      setError(null);

      const context = buildContext();
      const prompt = `${context}

The rep just moved to slide "${slide.title}". Give a quick coaching tip for this slide — what should the rep emphasize or do right now?`;

      const response = await callCoach(prompt, MODEL_FAST);
      setAutoTip({
        text: response,
        slideId: slide.id,
        timestamp: new Date(),
      });
      setIsLoadingTip(false);
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentSlideIndex, visibleSlides.length]); // intentionally minimal deps

  // ---------------------------------------------------------------------------
  // Pacing alert — nudge if on a slide > 3 minutes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);

    slideTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - slideEnteredRef.current) / 1000);
      if (elapsed >= PACING_THRESHOLD_SECONDS) {
        const slide = visibleSlides[currentSlideIndex];
        setPacingAlert(
          `You've been on "${slide?.title || 'this slide'}" for ${Math.floor(elapsed / 60)}+ min. Consider moving forward or checking if the prospect has questions.`,
        );
      }
    }, 10000); // check every 10 seconds

    return () => clearInterval(slideTimerRef.current);
  }, [currentSlideIndex, visibleSlides]);

  // ---------------------------------------------------------------------------
  // Handle objection click (Sonnet)
  // ---------------------------------------------------------------------------

  const handleObjection = useCallback(
    async (objectionText) => {
      trackObjection(objectionText);
      setIsLoadingResponse(true);
      setAiResponse(null);
      setError(null);

      const context = buildContext();
      const prompt = `${context}

The prospect just raised this objection: "${objectionText}"

Give the rep a SHORT, powerful rebuttal tailored to this specific lead's situation. Include a suggested phrase they can say word-for-word.`;

      const response = await callCoach(prompt, MODEL_QUALITY);
      setAiResponse({
        type: 'objection',
        label: objectionText,
        text: response,
        timestamp: new Date(),
      });
      setIsLoadingResponse(false);

      // Scroll to response
      setTimeout(() => {
        responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    [buildContext, trackObjection],
  );

  // ---------------------------------------------------------------------------
  // Handle custom question (Sonnet)
  // ---------------------------------------------------------------------------

  const handleAskCoach = useCallback(async () => {
    if (!customQuestion.trim()) return;

    setIsLoadingResponse(true);
    setAiResponse(null);
    setError(null);

    const context = buildContext();
    const prompt = `${context}

The sales rep is asking for coaching help: "${customQuestion.trim()}"

Provide a concise, actionable answer.`;

    const question = customQuestion.trim();
    setCustomQuestion('');

    const response = await callCoach(prompt, MODEL_QUALITY);
    setAiResponse({
      type: 'question',
      label: question,
      text: response,
      timestamp: new Date(),
    });
    setIsLoadingResponse(false);

    setTimeout(() => {
      responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [customQuestion, buildContext]);

  // ---------------------------------------------------------------------------
  // Key handler for input
  // ---------------------------------------------------------------------------

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskCoach();
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <Bot className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
          AI Sales Coach
        </h3>
        {isLoadingTip && (
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin ml-auto" />
        )}
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* ---- Pacing Alert ---- */}
        <AnimatePresence>
          {pacingAlert && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{pacingAlert}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Auto Coaching Tip ---- */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-[2px]" />
          <div className="relative rounded-xl bg-gray-800/90 border border-gray-700/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Auto Coach
              </span>
            </div>

            {isLoadingTip && !autoTip ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating tip...
              </div>
            ) : autoTip ? (
              <motion.div
                key={autoTip.slideId + autoTip.timestamp}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: autoTip.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n/g, '<br/>'),
                }}
              />
            ) : (
              <p className="text-xs text-gray-500 italic">
                Navigate slides to get coaching tips...
              </p>
            )}
          </div>
        </div>

        {/* ---- Objection Buttons ---- */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <MessageSquare className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Common Objections
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {OBJECTIONS.map((obj) => (
              <button
                key={obj}
                onClick={() => handleObjection(obj)}
                disabled={isLoadingResponse}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 hover:border-gray-600/50 transition-all duration-150 text-left leading-tight disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                {obj}
              </button>
            ))}
          </div>
        </div>

        {/* ---- AI Response Card ---- */}
        <AnimatePresence mode="wait">
          {(isLoadingResponse || aiResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl bg-gray-800/70 border border-gray-700/50 p-3"
            >
              {isLoadingResponse ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Thinking...
                </div>
              ) : aiResponse ? (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        aiResponse.type === 'objection'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {aiResponse.type === 'objection' ? 'Rebuttal' : 'Answer'}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate">
                      {aiResponse.label}
                    </span>
                  </div>
                  <div
                    className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: aiResponse.text
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-white">$1</strong>',
                        )
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={responseEndRef} />

        {/* ---- Error ---- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-red-400 px-1"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Custom Question Input (pinned to bottom) ---- */}
      <div className="mt-auto border-t border-gray-700/50 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the coach anything..."
            disabled={isLoadingResponse}
            className="flex-1 text-xs bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleAskCoach}
            disabled={isLoadingResponse || !customQuestion.trim()}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500/80 text-white text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoadingResponse ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
