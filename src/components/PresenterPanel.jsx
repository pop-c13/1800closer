import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, ExternalLink, ChevronLeft, ChevronRight, Eye, EyeOff,
  Clock, Sun, Moon, Settings, X, ChevronDown, ChevronUp, StickyNote, Send,
  Bot, Loader2, Check, ArrowLeft, Lightbulb
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAVINGS_SLIDE } from '../context/AppContext';
import { PRODUCT_CATALOG } from './DispositionModal';
import SlideRenderer from './SlideRenderer';
import CallTimer from './CallTimer';
import WhisperToast from './WhisperToast';
import SessionSummary from './SessionSummary';
import DispositionModal from './DispositionModal';
import PostCallScorecard from './PostCallScorecard';
import slides from '../data/slides';
import { getIndustryContent } from '../data/industryContent';
import { createAudioResponder } from '../lib/audioStream';

// ─── Discovery questions ──────────────────────────────────────────────────────
const DISCOVERY_QUESTIONS = [
  { key: 'firstBusiness', question: 'Is this your first business or have you owned one before?', type: 'select', options: ['', 'First business', 'Owned before'] },
  { key: 'feeling', question: 'How are you feeling — excited, nervous, or a mix?', type: 'select', options: ['', 'Excited', 'Nervous', 'Mix of both'] },
  { key: 'motivation', question: 'What motivated you to start this business?', type: 'text' },
  { key: 'formationConfirmed', question: 'Formation date confirmed?', type: 'checkbox' },
  { key: 'fullOrPartTime', question: 'Full-time or part-time?', type: 'select', options: ['', 'Full-time', 'Part-time alongside W-2'] },
  { key: 'startupCosts', question: 'Startup costs so far?', type: 'text', extra: { key: 'fundingSource', label: 'Funding source?', type: 'select', options: ['', 'Savings', 'Loans', 'Credit Cards', 'Mix'] } },
  { key: 'futureInvestment', question: 'Future investment planned?', type: 'text' },
  { key: 'profitStatus', question: 'Current profit status?', type: 'select', options: ['', 'Profit', 'Breaking even', 'Early-stage build-out'] },
  { key: 'lastYearTax', question: 'Last year — refund or owed?', type: 'select', options: ['', 'Got a refund', 'Owed taxes', "Didn't file", 'N/A'] },
];

// ─── Income / employee options ────────────────────────────────────────────────
const INCOME_RANGES = ['Under $25k', '$25k–$50k', '$50k–$100k', '$100k–$250k', '$250k+'];
const EMPLOYEE_OPTIONS = ['Just me', '1–2', '3–5', '6+'];

// ─── Objection buttons ────────────────────────────────────────────────────────
const OBJECTION_BUTTONS = [
  'Too expensive',
  'Need to think',
  'Have accountant',
  'Spouse decides',
  'No revenue yet',
  'Do it myself',
];

// ─── AI Coach system prompt (same as AICoachPanel) ────────────────────────────
const COACH_SYSTEM_PROMPT = `You are an expert sales coach for 1-800Accountant, a virtual accounting firm for small businesses. You're coaching a sales rep in real-time during a live prospect call.

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

// ─── Helper: replace template vars in notes ───────────────────────────────────
function replaceTemplateVars(text, lead, repName, pricing, computedSavings, calculator) {
  if (!text) return '';
  let result = text;
  result = result.replace(/\[LEAD_FIRST_NAME\]/g, lead?.firstName || 'there');
  result = result.replace(/\[LEAD_SOURCE\]/g, lead?.leadSource || 'your source');
  result = result.replace(/\[REP_NAME\]/g, repName || 'your rep');
  result = result.replace(/\[FORMATION_DATE\]/g, lead?.formationDate || '[FORMATION_DATE]');
  result = result.replace(/\[PRICE\]/g, pricing?.annualPrice || '[PRICE]');
  result = result.replace(/\[BUSINESS_NAME\]/g, lead?.businessName || 'your business');
  // Savings slide vars
  result = result.replace(/\[INCOME_AMOUNT\]/g, fmtCurrency(calculator?.incomeAmount || 0).replace('$', ''));
  result = result.replace(/\[NO_ELECTION\]/g, fmtCurrency(computedSavings?.noElection || 0));
  result = result.replace(/\[WITH_ELECTION\]/g, fmtCurrency(computedSavings?.withElection || 0));
  result = result.replace(/\[ANNUAL_SAVINGS\]/g, fmtCurrency(computedSavings?.annualSavings || 0));
  return result;
}

// ─── Helper: format currency ──────────────────────────────────────────────────
function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString();
}

// ─── Helper: group slides by category ─────────────────────────────────────────
function groupByCategory(slideList) {
  const groups = [];
  const seen = new Set();
  for (const s of slideList) {
    const cat = s.category || 'Other';
    if (!seen.has(cat)) {
      seen.add(cat);
      groups.push({ category: cat, slides: [] });
    }
    groups.find(g => g.category === cat).slides.push(s);
  }
  return groups;
}

// ─── Auto-tip generator (local, no API call) ─────────────────────────────────
function generateAutoTip(slide, lead, discovery, calculator, savings, session, callDuration, currentSlideIndex, visibleSlides) {
  if (!slide) return '';

  // Pacing check — 30-min appointment slot
  const elapsedMin = Math.floor(callDuration / 60);
  const slideNum = visibleSlides[currentSlideIndex]?.id;
  const numericSlideId = typeof slideNum === 'number' ? slideNum : 0;

  if (elapsedMin >= 20 && numericSlideId < 22) {
    return `⏰ You're at ${elapsedMin} minutes — consider transitioning to pricing soon to stay within your 30-minute slot.`;
  }
  if (elapsedMin >= 25 && numericSlideId < 30) {
    return `🔴 ${elapsedMin} minutes elapsed! You're running long. Move to pricing and close — you have less than 5 minutes left in the slot.`;
  }
  if (elapsedMin >= 30) {
    return `⚠️ You've exceeded the 30-minute slot (${elapsedMin} min). Wrap up the call — summarize key savings and ask for the close.`;
  }

  const id = slide.id;
  const firstName = lead?.firstName || 'the prospect';

  if (id === 1) return `Start with energy! Confirm ${firstName} can see your screen. Ask about spouse/partner early — it affects tax strategy.`;
  if (id === 2) return `Build credibility here. Mention the 17 years average experience — it differentiates from DIY solutions.`;
  if (id === 3) return `Social proof slide. Let the numbers speak. Pause after "92% satisfaction" — let it land.`;
  if (id === 4) return `Reinforce the partner pricing advantage. "${firstName} is getting ~40% off because of ${lead?.leadSource || 'their source'}."`;
  if (id === 5) {
    const filled = Object.values(discovery).filter(v => v && v !== false).length;
    if (filled < 5) return `Discovery is critical — you've captured ${filled}/9 answers. Ask open-ended questions and LISTEN. This builds rapport and gives you ammo for the close.`;
    return `Great discovery progress (${filled}/9)! Use what you've learned to personalize the rest of the presentation.`;
  }
  if (id >= 6 && id <= 7) return `Tax education section. Keep it simple — use the flow diagram to make it visual. Watch for confusion signals.`;
  if (id >= 8 && id <= 12) return `Deduction slides — this is where prospects get excited. Ask "${firstName}, have you been tracking these?" to create urgency for professional help.`;
  if (id >= 13 && id <= 17) return `Optional deduction detail. Only dive deep if ${firstName} shows interest in this specific area. Don't over-explain.`;
  if (id >= 18 && id <= 20) return `Entity structure — this is the "aha moment." Build tension around the 15.3% SE tax before revealing the solution.`;
  if (id === 21 || id === '21b') return `This is the money slide! Let the savings number land. Pause. Say "${firstName}, that's ${fmtCurrency(savings?.annualSavings || 0)} back in your pocket every year."`;
  if (id >= 22 && id <= 24) return `Pricing section. Frame it against the $7K-$9K traditional cost FIRST, then reveal the partner price. The contrast sells.`;
  if (id >= 25 && id <= 35) return `Deliverables section. Move at a steady pace — show value but don't linger. The prospect should feel "I get a LOT for this price."`;
  if (id === 36) return `Team slide. Emphasize "you get a whole team, not just one person." This justifies the investment.`;
  if (id === 37) return `100% tax deductible! This is a closer's best friend. "The investment literally pays for itself, ${firstName}."`;
  if (id === 38) return `CLOSING TIME. Confirm contact details naturally, then ask for the card. Be direct but warm. Silence after the ask is your friend.`;
  if (id === 39) return `Congratulations! Be genuinely excited. Outline the next 24 hours clearly so ${firstName} knows exactly what to expect.`;
  if (id >= 40) return `Wrap-up. Keep it brief and warm. Ask for the survey. Thank them genuinely.`;
  return `Stay conversational. Read ${firstName}'s energy and adapt your pace.`;
}

// ─── AI Coach API call ────────────────────────────────────────────────────────
async function callCoachAPI(message) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: COACH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'No response generated.';
  } catch (err) {
    return 'Coach unavailable — check API connection.';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PresenterPanel() {
  const navigate = useNavigate();
  const {
    lead, setLead, updateLead,
    repName, setRepName,
    discoveryAnswers, setDiscoveryAnswers,
    currentSlideIndex, visibleSlides, setVisibleSlides,
    slideVisibility, setSlideVisibility,
    isCallActive, startCall, endCall, callDuration,
    showSummary,
    calculator, setCalculator,
    pricing, setPricing,
    orderProducts, setOrderProducts, orderPaymentMethod, setOrderPaymentMethod,
    computedSavings,
    sessionId,
    observer, setObserver,
    goToSlide, nextSlide, prevSlide,
    sessionData, setSessionData,
    trackObjection,
    theme, toggleTheme,
    showSavingsBanner,
    showOutcomeSelector, confirmOutcome, sessionSaveStatus,
    resetSession,
  } = useApp();

  const [showSlideManager, setShowSlideManager] = useState(false);
  const [observerVisible, setObserverVisible] = useState(true);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [objectionsExpanded, setObjectionsExpanded] = useState(false);
  const [coachTip, setCoachTip] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResponse, setCoachResponse] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showScorecard, setShowScorecard] = useState(false);
  const [scorecardData, setScorecardData] = useState(null);

  const scriptAreaRef = useRef(null);
  const slideNoteRef = useRef(null);
  const thumbnailStripRef = useRef(null);
  const audioResponderRef = useRef(null);

  // Silent audio bridge — detect extension and create WebRTC responder for managers
  useEffect(() => {
    if (!isCallActive || !sessionId) return;

    // Create audio responder that silently handles manager audio requests
    const responder = createAudioResponder(sessionId);
    audioResponderRef.current = responder;

    return () => {
      if (audioResponderRef.current) {
        audioResponderRef.current.destroy();
        audioResponderRef.current = null;
      }
    };
  }, [isCallActive, sessionId]);

  // ── Theme-aware class helpers ─────────────────────────────────────────────
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-dark-bg' : 'bg-gray-50';
  const panelBg = isDark ? 'bg-[#131318]' : 'bg-white';
  const barBg = isDark ? 'bg-dark-bar border-white/5' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/60' : 'text-gray-500';
  const textDim = isDark ? 'text-white/40' : 'text-gray-400';
  const cardBg = isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200';
  const inputBg = isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900';
  const brandLabel = isDark ? 'text-white/60' : 'text-gray-400';

  // ── Redirect if no lead ───────────────────────────────────────────────────
  useEffect(() => {
    if (!lead) {
      navigate('/home');
    }
  }, [lead, navigate]);

  // ── Initialize visible slides — inject savings slide between 21 and 22 ────
  useEffect(() => {
    const base = slides.filter(s => {
      if (s.required) return true;
      return slideVisibility[s.id] !== false;
    });
    const idx21 = base.findIndex(s => s.id === 21);
    if (idx21 !== -1) {
      const alreadyHas = base.some(s => s.id === '21b');
      if (!alreadyHas) {
        base.splice(idx21 + 1, 0, SAVINGS_SLIDE);
      }
    }
    setVisibleSlides(base);
  }, [slideVisibility, setVisibleSlides]);

  // ── Auto-scroll to current slide notes on change ──────────────────────────
  useEffect(() => {
    if (slideNoteRef.current) {
      slideNoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentSlideIndex]);

  // ── Auto-scroll thumbnail strip ───────────────────────────────────────────
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.querySelector('.thumb-active');
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentSlideIndex]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // ── AI Coach — auto-tip on slide change ───────────────────────────────────
  useEffect(() => {
    if (!currentSlide || !lead) return;
    const timer = setTimeout(() => {
      const tips = generateAutoTip(currentSlide, lead, discoveryAnswers, calculator, computedSavings, sessionData, callDuration, currentSlideIndex, visibleSlides);
      setCoachTip(tips);
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  // ── Toggle slide visibility ───────────────────────────────────────────────
  const toggleSlideVisibility = useCallback((slideId) => {
    setSlideVisibility(prev => ({
      ...prev,
      [slideId]: prev[slideId] === false ? true : false,
    }));
  }, [setSlideVisibility]);

  // ── Toggle category collapse (slide manager) ─────────────────────────────
  const toggleCategory = useCallback((cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  // ── AI Coach — handle objection click ─────────────────────────────────────
  const handleObjection = useCallback(async (objectionText) => {
    trackObjection(objectionText);
    setCoachLoading(true);
    setCoachResponse('');
    setObjectionsExpanded(false);

    const slide = visibleSlides[currentSlideIndex];
    const context = `CURRENT CONTEXT:
- Slide: #${slide?.id} "${slide?.title}" (${slide?.category})
- Lead: ${lead?.firstName} ${lead?.lastName} — ${lead?.businessName} (${lead?.entityType}, ${lead?.state})
- Lead Source: ${lead?.leadSource}
- Revenue: ${calculator.incomeRange} (est. $${calculator.incomeAmount})
- Computed Savings: $${computedSavings?.annualSavings}/yr
- Discovery completed: ${discoveryFilled}/9 answers`;

    const prompt = `${context}

The prospect just raised this objection: "${objectionText}"

Give the rep a SHORT, powerful rebuttal tailored to this specific lead's situation. Include a suggested phrase they can say word-for-word.`;

    const response = await callCoachAPI(prompt);
    setCoachResponse(response);
    setCoachLoading(false);
  }, [lead, visibleSlides, currentSlideIndex, calculator, computedSavings, trackObjection]);

  // ── AI Coach — handle custom question ─────────────────────────────────────
  const handleAskCoach = useCallback(async () => {
    if (!customQuestion.trim()) return;

    setCoachLoading(true);
    setCoachResponse('');

    const slide = visibleSlides[currentSlideIndex];
    const context = `CURRENT CONTEXT:
- Slide: #${slide?.id} "${slide?.title}" (${slide?.category})
- Lead: ${lead?.firstName} ${lead?.lastName} — ${lead?.businessName} (${lead?.entityType}, ${lead?.state})
- Revenue: ${calculator.incomeRange} (est. $${calculator.incomeAmount})
- Computed Savings: $${computedSavings?.annualSavings}/yr`;

    const question = customQuestion.trim();
    setCustomQuestion('');

    const prompt = `${context}

The sales rep is asking for coaching help: "${question}"

Provide a concise, actionable answer.`;

    const response = await callCoachAPI(prompt);
    setCoachResponse(response);
    setCoachLoading(false);
  }, [customQuestion, lead, visibleSlides, currentSlideIndex, calculator, computedSavings]);

  // ── Calculate flow score ─────────────────────────────────────────────────
  const calculateFlowScore = () => {
    const discoveryPct = Object.values(discoveryAnswers).filter(v => v && v !== '').length / 9;
    const slidesPct = sessionData.slidesShown.length / Math.max(visibleSlides.length, 1);
    const usedCalc = computedSavings.annualSavings > 0 ? 1 : 0;
    const pacingOk = callDuration <= 1800 ? 1 : callDuration <= 1980 ? 0.5 : 0;
    return Math.round(((discoveryPct * 0.3) + (slidesPct * 0.3) + (usedCalc * 0.2) + (pacingOk * 0.2)) * 100);
  };

  // ── Disposition submit handler ──────────────────────────────────────────
  const handleDispositionSubmit = (data) => {
    // Build scorecard data from session
    const scData = {
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : '',
      businessName: lead?.businessName || '',
      duration: callDuration,
      outcome: data.disposition,
      disposition: data.disposition,
      products: data.products || [],
      totalSale: data.totalSale || 0,
      firstPaymentAmount: data.firstPaymentAmount || 0,
      paymentMethod: data.paymentMethod || '',
      discoveryAnswered: Object.values(discoveryAnswers).filter(v => v && v !== '').length,
      objectionsHandled: sessionData.objectionsClicked.length,
      coachTipsUsed: sessionData.coachTips?.length || 0,
      savingsPresented: computedSavings.annualSavings,
      priceQuoted: data.totalSale || parseFloat(pricing.annualPrice) || 0,
      totalSlides: visibleSlides.length,
      slidesPresented: sessionData.slidesShown.length,
      flowScore: calculateFlowScore(),
      callNotes: sessionData.quickNotes || '',
      computedSavings,
      notInterestedReason: data.reason || null,
      followUpDate: data.followUpDate || null,
      followUpTemp: data.followUpTemp || null,
    };
    setScorecardData(scData);

    // Call confirmOutcome with enhanced data
    confirmOutcome(data.disposition, data);
    setShowScorecard(true);
  };

  // ── Scorecard done handler ──────────────────────────────────────────────
  const handleScorecardDone = () => {
    setShowScorecard(false);
    setScorecardData(null);
    resetSession();
    navigate('/home');
  };

  // ── Early return if no lead ───────────────────────────────────────────────
  if (!lead) return null;

  const currentSlide = visibleSlides[currentSlideIndex] || null;
  const progress = visibleSlides.length > 0
    ? ((currentSlideIndex + 1) / visibleSlides.length) * 100
    : 0;

  // ── Discovery completion count ────────────────────────────────────────────
  const discoveryFilled = Object.entries(discoveryAnswers).filter(
    ([k, v]) => v !== '' && v !== false && v !== null && v !== undefined
  ).length;

  // ── Industry content ──────────────────────────────────────────────────────
  const industryContent = getIndustryContent(lead?.industry);

  // ── Render notes lines with formatting ────────────────────────────────────
  function renderNotes(noteText) {
    if (!noteText) return null;
    const processed = replaceTemplateVars(noteText, lead, repName, pricing, computedSavings, calculator);
    const lines = processed.split('\n');

    return lines.map((line, i) => {
      const trimmed = line.trim();

      // Empty lines -> spacer
      if (!trimmed) {
        return <div key={i} className="h-3" />;
      }

      // Pause / conditional lines -> orange italic
      if (/\(pause/i.test(trimmed) || /\(If /i.test(trimmed)) {
        return (
          <p key={i} className={`text-brand-orange italic text-sm leading-relaxed`}>
            {trimmed}
          </p>
        );
      }

      // Emoji highlight lines
      if (/[\u{1F449}\u{1F4DE}\u{1F4E7}\u{1F4C5}\u{1F9FE}]/u.test(trimmed)) {
        return (
          <p key={i} className={`text-sm leading-relaxed ${isDark ? 'bg-brand-blue/15 text-white' : 'bg-blue-50 text-blue-900'} rounded px-2 py-1 my-0.5`}>
            {trimmed}
          </p>
        );
      }

      // Numbered lines -> orange left border
      if (/^\d+\./.test(trimmed)) {
        return (
          <p key={i} className={`text-sm leading-relaxed border-l-2 border-brand-orange pl-3 my-0.5 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {trimmed}
          </p>
        );
      }

      // Default text
      return (
        <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {trimmed}
        </p>
      );
    });
  }

  // ── Render industry callout card ──────────────────────────────────────────
  function renderIndustryCallout(contentKey) {
    if (!industryContent || !industryContent[contentKey]) return null;
    const raw = industryContent[contentKey];
    const content = raw.replace(/\[STATE\]/g, lead?.state || 'your state');

    return (
      <div className={`p-3 rounded-xl border-l-4 border-purple-400 ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'} my-3`}>
        <p className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Lightbulb size={12} />
          PERSONALIZED FOR {lead?.industry || 'YOUR INDUSTRY'}
        </p>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
          {content}
        </p>
      </div>
    );
  }

  // ── Render inline discovery questions (slide 5) ───────────────────────────
  function renderInlineDiscovery() {
    return (
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] uppercase tracking-wider font-bold ${textDim}`}>Discovery</span>
          <span className="text-xs font-bold text-brand-orange">{discoveryFilled}/9</span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
          <div
            className="h-full bg-brand-orange rounded-full transition-all duration-300"
            style={{ width: `${(discoveryFilled / 9) * 100}%` }}
          />
        </div>
        {DISCOVERY_QUESTIONS.map((q) => {
          const val = discoveryAnswers[q.key];
          const isCompleted = val !== '' && val !== false && val != null;
          return (
            <div key={q.key} className={`px-2.5 py-1.5 rounded-lg border ${isCompleted ? 'border-green-500/30 ' + (isDark ? 'bg-green-500/5' : 'bg-green-50') : cardBg}`}>
              <div className="flex items-start gap-2">
                {isCompleted && <Check size={10} className="text-green-500 mt-1 shrink-0" />}
                <div className="flex-1">
                  <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isCompleted ? 'text-green-400/70' : textDim}`}>{q.question}</label>

                  {q.type === 'select' && (
                    <select
                      value={val || ''}
                      onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-orange/50 ${inputBg}`}
                    >
                      {q.options.map(o => (
                        <option key={o} value={o}>{o || 'Select...'}</option>
                      ))}
                    </select>
                  )}

                  {q.type === 'text' && (
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                      placeholder="Type answer..."
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-orange/50 placeholder:opacity-30 ${inputBg}`}
                    />
                  )}

                  {q.type === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${textDim}`}>{lead.formationDate || 'N/A'}</span>
                      <input
                        type="checkbox"
                        checked={val || false}
                        onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [q.key]: e.target.checked }))}
                        className="accent-brand-orange"
                      />
                      <span className={`text-xs ${textMuted}`}>Confirmed</span>
                    </div>
                  )}

                  {/* Extra sub-question */}
                  {q.extra && (
                    <div className="mt-2">
                      <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${textDim}`}>{q.extra.label}</label>
                      <select
                        value={discoveryAnswers[q.extra.key] || ''}
                        onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [q.extra.key]: e.target.value }))}
                        className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-orange/50 ${inputBg}`}
                      >
                        {q.extra.options.map(o => (
                          <option key={o} value={o}>{o || 'Select...'}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render inline calculator ──────────────────────────────────────────────
  function renderInlineCalculator() {
    const noElection = computedSavings.noElection;
    const withElection = computedSavings.withElection;
    const annualSavings = computedSavings.annualSavings;

    return (
      <div className={`mt-4 p-4 rounded-xl border ${cardBg}`}>
        <h3 className="text-brand-orange text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          Tax Savings Calculator
        </h3>

        {/* Big savings card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-600/80 to-green-700/80 text-center mb-4">
          <p className="text-green-200/70 text-xs font-medium uppercase tracking-wider mb-1">{lead.businessName}'s Potential Savings</p>
          <p className="text-3xl font-black text-white">{fmtCurrency(annualSavings)}<span className="text-sm font-medium text-white/60">/yr</span></p>
        </div>

        {/* Income Range */}
        <div className="mb-3">
          <label className={`text-xs ${textMuted} block mb-1`}>Income Range</label>
          <select
            value={calculator.incomeRange}
            onChange={(e) => setCalculator(prev => ({ ...prev, incomeRange: e.target.value }))}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange/50 ${inputBg}`}
          >
            {INCOME_RANGES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Income Amount Slider */}
        <div className="mb-3">
          <label className={`text-xs ${textMuted} block mb-1`}>
            Income Amount: <span className={`font-semibold ${text}`}>{fmtCurrency(calculator.incomeAmount)}</span>
          </label>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={calculator.incomeAmount}
            onChange={(e) => setCalculator(prev => ({ ...prev, incomeAmount: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Employees */}
        <div className="mb-3">
          <label className={`text-xs ${textMuted} block mb-1`}>Employees</label>
          <div className="flex gap-1.5">
            {EMPLOYEE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setCalculator(prev => ({ ...prev, employees: opt }))}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${calculator.employees === opt ? 'border-brand-orange bg-brand-orange/15 text-brand-orange font-semibold' : `border-${isDark ? 'white/10' : 'gray-200'} ${isDark ? 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10' : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Tax Bracket */}
        <div className="mb-3">
          <label className={`text-xs ${textMuted} block mb-1`}>
            Tax Bracket: <span className={`font-semibold ${text}`}>{calculator.taxRate}%</span>
          </label>
          <input
            type="range"
            min={15}
            max={40}
            step={1}
            value={calculator.taxRate}
            onChange={(e) => setCalculator(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Spouse Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={calculator.hasSpouse}
            onChange={(e) => setCalculator(prev => ({ ...prev, hasSpouse: e.target.checked }))}
            className="accent-brand-orange"
          />
          <label className={`text-xs ${textMuted}`}>Spouse Income</label>
        </div>
        {calculator.hasSpouse && (
          <div className="mb-3">
            <label className={`text-xs ${textMuted} block mb-1`}>Spouse Income</label>
            <input
              type="number"
              value={calculator.spouseIncome}
              onChange={(e) => setCalculator(prev => ({ ...prev, spouseIncome: Number(e.target.value) }))}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange/50 ${inputBg}`}
            />
          </div>
        )}

        {/* Breakdown */}
        <div className={`p-3 rounded-xl border ${cardBg} space-y-2`}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider ${textDim}`}>Tax Breakdown</h4>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${textMuted}`}>No Election (SE Tax)</span>
            <span className="text-sm font-bold text-red-400">{fmtCurrency(noElection)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${textMuted}`}>With S-Corp Election</span>
            <span className="text-sm font-bold text-green-400">{fmtCurrency(withElection)}</span>
          </div>
          <div className={`h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${text}`}>Annual Savings</span>
            <span className="text-lg font-black text-green-400">{fmtCurrency(annualSavings)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Quick Quote builder (slides 23-24, 38) ────────────────────────
  function renderPricingInput() {
    const TERM_OPTIONS = [
      { key: 'full', label: 'Full' },
      { key: '2-pay', label: '2' },
      { key: '3-pay', label: '3' },
      { key: '4-pay', label: '4' },
    ];

    const getFirst = (price, terms) => {
      const p = parseFloat(price) || 0;
      if (terms === '2-pay') return Math.ceil((p / 2) * 100) / 100;
      if (terms === '3-pay') return Math.ceil((p / 3) * 100) / 100;
      if (terms === '4-pay') return Math.ceil((p / 4) * 100) / 100;
      return p;
    };

    const totalSale = orderProducts.reduce((s, p) => s + (parseFloat(p.price) || 0), 0);
    const totalFirst = orderProducts.reduce((s, p) => s + getFirst(p.price, p.terms), 0);
    const availableAddons = PRODUCT_CATALOG.filter(c => !orderProducts.some(o => o.id === c.id));

    return (
      <div className={`mt-4 p-3 rounded-xl border ${cardBg} space-y-2`}>
        <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center gap-1.5">
          {'\uD83D\uDCB0'} Quick Quote
        </h3>

        {/* Product rows */}
        {orderProducts.map((product) => (
          <div key={product.id} className={`p-2 rounded-lg border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium flex-1 truncate ${text}`}>{product.name}</span>
              {product.locked ? (
                <span className="text-xs font-bold text-brand-orange">${parseFloat(product.price).toLocaleString()}</span>
              ) : (
                <div className="flex items-center gap-0.5">
                  <span className={`text-[10px] ${textDim}`}>$</span>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => setOrderProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: e.target.value } : p))}
                    className={`w-16 border rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-brand-orange/50 ${inputBg}`}
                  />
                </div>
              )}
              {!product.locked && (
                <button
                  onClick={() => setOrderProducts(prev => prev.filter(p => p.id !== product.id))}
                  className={`${textDim} hover:text-red-400`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex gap-1 mt-1">
              {TERM_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setOrderProducts(prev => prev.map(p => p.id === product.id ? { ...p, terms: opt.key } : p))}
                  className={`flex-1 px-1 py-0.5 rounded text-[10px] font-medium transition-all ${
                    product.terms === opt.key
                      ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange border'
                      : `bg-white/5 border ${isDark ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-400'} hover:bg-white/10`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Add product dropdown */}
        {availableAddons.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const item = PRODUCT_CATALOG.find(p => p.id === e.target.value);
              if (item) setOrderProducts(prev => [...prev, { id: item.id, name: item.name, price: item.defaultPrice, terms: 'full', locked: false }]);
            }}
            className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-orange/50 ${inputBg} cursor-pointer`}
          >
            <option value="">+ Add Product</option>
            {availableAddons.map(p => (
              <option key={p.id} value={p.id}>{p.name} — ${p.defaultPrice.toLocaleString()}</option>
            ))}
          </select>
        )}

        {/* Totals */}
        <div className={`flex items-center justify-between pt-1 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <span className={`text-xs font-semibold ${text}`}>Total: ${totalSale.toLocaleString()}</span>
          <span className="text-xs font-semibold text-brand-orange">First: ${totalFirst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    );
  }

  // ── Determine which inline content to show for current slide ──────────────
  const showDiscovery = currentSlide && currentSlide.id === 5;
  const showCalculator = currentSlide && ((typeof currentSlide.id === 'number' && currentSlide.id >= 13 && currentSlide.id <= 21) || currentSlide.id === '21b');
  const showPricing = currentSlide && (currentSlide.id === 23 || currentSlide.id === 24 || currentSlide.id === 38);
  const showIndustryIntro = currentSlide && currentSlide.id === 2;
  const showIndustryDeductions = currentSlide && (typeof currentSlide.id === 'number' && currentSlide.id >= 8 && currentSlide.id <= 12);
  const showIndustryStructure = currentSlide && (typeof currentSlide.id === 'number' && currentSlide.id >= 18 && currentSlide.id <= 20);

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className={`h-screen w-screen flex flex-col ${bg} overflow-hidden`}>

      {/* ─── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center h-12 px-4 ${barBg} border-b shrink-0 gap-3`}>
        {/* Logo + Rep Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-lg">{'\uD83D\uDD25'}</span>
            <span className={`${brandLabel} font-black text-lg leading-none`}>1-800-</span>
            <span className="text-brand-orange font-black text-lg leading-none">CLOSER</span>
          </div>
          <span className={`text-[10px] ${textDim} border-l ${isDark ? 'border-white/10' : 'border-gray-200'} pl-2.5`}>{repName}</span>
        </div>

        {/* Lead Info Card */}
        <div className={`px-3 py-1.5 rounded-lg border ${cardBg} shrink-0`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${text}`}>{lead.firstName} {lead.lastName}</span>
            <span className={textDim}>|</span>
            <span className={`text-xs font-medium ${textMuted}`}>{lead.businessName}</span>
          </div>
          <p className={`text-[10px] ${textDim}`}>
            {lead.entityType} · {lead.state} · {lead.leadSource} · {lead.annualIncome}
          </p>
        </div>

        {/* Call timer + buttons */}
        <div className="flex items-center gap-2 ml-auto mr-auto">
          {!isCallActive ? (
            <button
              onClick={startCall}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors"
            >
              <Phone size={12} />
              Start Call
            </button>
          ) : (
            <button
              onClick={endCall}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              <PhoneOff size={12} />
              End Call
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className={textDim} />
            <CallTimer />
          </div>
        </div>

        {/* Savings pill */}
        {showSavingsBanner && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold shrink-0">
            Savings: {fmtCurrency(computedSavings.annualSavings)}/yr
          </span>
        )}

        {/* Slide counter */}
        <span className={`text-xs ${textDim} font-mono shrink-0`}>
          {currentSlideIndex + 1} / {visibleSlides.length}
        </span>

        {/* Open Viewer */}
        <button
          onClick={() => window.open('/viewer', '_blank')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'} text-xs transition-colors shrink-0`}
        >
          <ExternalLink size={11} />
          Open Viewer
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Settings Gear -> Slide Manager */}
        <button
          onClick={() => setShowSlideManager(true)}
          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
          title="Slide Manager"
        >
          <Settings size={14} />
        </button>

        {/* Back Link */}
        <button
          onClick={() => setShowBackConfirm(true)}
          className={`flex items-center gap-1 text-xs transition-colors shrink-0 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ArrowLeft size={12} />
          Back
        </button>

        {/* Observer indicator removed — manager observation is invisible to rep */}
      </div>

      {/* ─── MAIN CONTENT — split layout ─────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT PANEL (~38%) ──────────────────────────────────────────── */}
        <div className={`flex flex-col ${bg}`} style={{ width: '38%' }}>

          {/* Sticky AI Coach Card */}
          <div className={`shrink-0 p-3 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <div className={`rounded-xl border p-3 ${isDark ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
              {/* Coach header */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Bot size={12} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-blue-400/70' : 'text-blue-600/70'}`}>AI Coach</span>
                {coachLoading && <Loader2 size={10} className="text-blue-400 animate-spin ml-auto" />}
              </div>

              {/* Auto tip */}
              {coachTip && !coachResponse && (
                <p className={`text-xs leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {coachTip}
                </p>
              )}

              {/* AI Response */}
              {coachResponse && (
                <div
                  className={`text-xs leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-700'} whitespace-pre-wrap`}
                  dangerouslySetInnerHTML={{
                    __html: coachResponse
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              )}

              {coachLoading && !coachResponse && (
                <div className={`flex items-center gap-2 text-xs ${textDim}`}>
                  <Loader2 size={12} className="animate-spin" />
                  Thinking...
                </div>
              )}

              {/* Objection buttons — toggleable */}
              <div className="mt-2">
                <button
                  onClick={() => setObjectionsExpanded(!objectionsExpanded)}
                  className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                >
                  Objections {objectionsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                {objectionsExpanded && (
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    {OBJECTION_BUTTONS.map(obj => (
                      <button
                        key={obj}
                        onClick={() => handleObjection(obj)}
                        disabled={coachLoading}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition-all text-left leading-tight disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom question input */}
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskCoach(); } }}
                  placeholder="Ask the coach..."
                  disabled={coachLoading}
                  className={`flex-1 text-[11px] border rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50 disabled:opacity-40 ${inputBg} placeholder:opacity-30`}
                />
                <button
                  onClick={handleAskCoach}
                  disabled={coachLoading || !customQuestion.trim()}
                  className="flex items-center justify-center px-2 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-500/80 text-white text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  {coachLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Scrolling Script Area */}
          <div
            ref={scriptAreaRef}
            className="flex-1 overflow-y-auto presenter-scroll"
          >
            <div className="p-4 space-y-4" ref={slideNoteRef}>
              {currentSlide ? (
                <>
                  {/* Category tag */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded">
                    {currentSlide.category}
                  </span>

                  {/* Title */}
                  <h2 className={`text-xl font-bold ${text} leading-tight`}>{currentSlide.title}</h2>

                  {/* Required / Optional badge */}
                  <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${currentSlide.required ? 'bg-green-500/15 text-green-400' : (isDark ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400')}`}>
                    {currentSlide.required ? 'Required' : 'Optional'}
                  </span>

                  {/* Speaker notes */}
                  <div className="notes-text space-y-1 mt-4">
                    {renderNotes(currentSlide.notes)}
                  </div>

                  {/* Industry intro callout — after slide 2 */}
                  {showIndustryIntro && renderIndustryCallout('intro')}

                  {/* Industry deductions callout — slides 8-12 */}
                  {showIndustryDeductions && renderIndustryCallout('deductions')}

                  {/* Industry structure callout — slides 18-20 */}
                  {showIndustryStructure && renderIndustryCallout('structure')}

                  {/* Inline discovery — slide 5 */}
                  {showDiscovery && renderInlineDiscovery()}

                  {/* Inline calculator — slides 13-21 and 21b */}
                  {showCalculator && renderInlineCalculator()}

                  {/* Pricing input — slides 24 and 38 */}
                  {showPricing && renderPricingInput()}
                </>
              ) : (
                <p className={`${textDim} text-sm`}>No slide selected.</p>
              )}
            </div>
          </div>

          {/* Quick Notes — collapsible at bottom */}
          <div className={`shrink-0 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={() => setNotesCollapsed(!notesCollapsed)}
              className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${isDark ? 'text-white/60 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-1.5">
                <StickyNote size={12} />
                Notes
              </span>
              {notesCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {!notesCollapsed && (
              <div className="px-4 pb-3">
                <textarea
                  value={sessionData.quickNotes}
                  onChange={(e) => setSessionData(prev => ({ ...prev, quickNotes: e.target.value }))}
                  placeholder="Jot notes during the call..."
                  className={`w-full h-20 border rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-brand-orange/50 placeholder:opacity-20 ${inputBg}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (~62%) ─────────────────────────────────────────── */}
        <div className={`flex flex-col ${bg} border-l ${isDark ? 'border-white/5' : 'border-gray-200'}`} style={{ width: '62%' }}>

          {/* Slide Preview — 16:9 container */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative group">
            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={20} />
            </button>

            {/* 16:9 aspect ratio wrapper */}
            <div className="w-full max-h-full" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <AnimatePresence mode="wait">
                  {currentSlide && (
                    <SlideRenderer
                      key={currentSlide.id}
                      slide={currentSlide}
                      leadData={lead}
                      computedSavings={computedSavings}
                      pricing={pricing}
                      calculator={calculator}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className={`shrink-0 border-t ${isDark ? 'border-white/5' : 'border-gray-200'} px-3 py-2`}>
            <div
              ref={thumbnailStripRef}
              className="flex gap-2 overflow-x-auto thumb-strip pb-1"
            >
              {visibleSlides.map((s, idx) => {
                const isActive = idx === currentSlideIndex;
                const isVirtual = typeof s.id === 'string';
                const thumbSrc = isVirtual ? null : `/slides/slide-${String(s.id).padStart(2, '0')}.png`;
                return (
                  <button
                    key={s.id}
                    onClick={() => goToSlide(idx)}
                    className={`shrink-0 w-24 h-14 rounded-lg border overflow-hidden transition-all ${isActive ? 'thumb-active border-brand-orange ring-1 ring-brand-orange/40' : (isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300')}`}
                  >
                    {thumbSrc ? (
                      <img src={thumbSrc} alt={s.title} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center text-[10px] ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400'}`}>
                        <span className="font-bold">{s.id}</span>
                        <span className="truncate w-full px-1 text-center leading-tight">{s.title.length > 12 ? s.title.slice(0, 12) + '...' : s.title}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROGRESS BAR ────────────────────────────────────────────────── */}
      <div className={`h-1 w-full shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
        <div
          className="h-full bg-brand-orange transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── SLIDE MANAGER MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSlideManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
            onClick={() => setShowSlideManager(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`${panelBg} rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col`}
            >
              {/* Modal header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <h2 className={`font-bold ${text}`}>Slide Manager</h2>
                <button
                  onClick={() => setShowSlideManager(false)}
                  className={`p-1 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="flex-1 overflow-y-auto presenter-scroll p-4 space-y-2">
                {groupByCategory(slides).map(group => {
                  const isCollapsed = collapsedCategories[group.category];
                  return (
                    <div key={group.category}>
                      {/* Category header */}
                      <button
                        onClick={() => toggleCategory(group.category)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <span>{group.category} ({group.slides.length})</span>
                        <ChevronRight size={12} className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      </button>

                      {/* Slide rows */}
                      {!isCollapsed && (
                        <div className="space-y-0.5 mb-2">
                          {group.slides.map(s => {
                            const isVisible = s.required || slideVisibility[s.id] !== false;
                            const isActive = currentSlide && currentSlide.id === s.id;

                            return (
                              <div
                                key={s.id}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${isActive ? 'bg-brand-orange/15 border border-brand-orange/30' : isVisible ? (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50') : 'opacity-40'}`}
                                onClick={() => {
                                  if (isVisible) {
                                    const idx = visibleSlides.findIndex(vs => vs.id === s.id);
                                    if (idx !== -1) goToSlide(idx);
                                    setShowSlideManager(false);
                                  }
                                }}
                              >
                                {/* Eye toggle */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!s.required) toggleSlideVisibility(s.id);
                                  }}
                                  disabled={s.required}
                                  className={`shrink-0 ${s.required ? (isDark ? 'text-white/20' : 'text-gray-300') + ' cursor-not-allowed' : isVisible ? (isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-700') : (isDark ? 'text-white/20 hover:text-white/50' : 'text-gray-300 hover:text-gray-500')}`}
                                >
                                  {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>

                                {/* Slide number */}
                                <span className={`w-5 text-right shrink-0 ${isDark ? 'text-white/30' : 'text-gray-300'}`}>{s.id}</span>

                                {/* Title */}
                                <span className={`flex-1 truncate ${isActive ? 'text-brand-orange font-semibold' : (isDark ? 'text-white/70' : 'text-gray-600')}`}>
                                  {s.title}
                                </span>

                                {/* Optional badge */}
                                {!s.required && (
                                  <span className={`text-[9px] uppercase px-1 py-0.5 rounded ${isDark ? 'text-white/30 bg-white/5' : 'text-gray-400 bg-gray-100'}`}>opt</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BACK CONFIRMATION DIALOG ────────────────────────────────────── */}
      <AnimatePresence>
        {showBackConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
            onClick={() => setShowBackConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-6 rounded-xl ${panelBg} max-w-sm shadow-2xl`}
            >
              <h3 className={`font-bold ${text} mb-2`}>End Session?</h3>
              <p className={`text-sm ${textMuted} mb-4`}>End current session and return to launch screen?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackConfirm(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { resetSession(); setLead(null); navigate('/home'); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-400 transition-colors"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FLOATING OVERLAYS ───────────────────────────────────────────── */}

      {/* ─── DISPOSITION MODAL (replaces old outcome selector) ────────── */}
      <DispositionModal
        show={showOutcomeSelector}
        leadData={lead}
        callDuration={callDuration}
        pricing={pricing}
        computedSavings={computedSavings}
        onSubmit={handleDispositionSubmit}
      />

      {/* ─── POST-CALL SCORECARD ─────────────────────────────────────── */}
      <PostCallScorecard
        show={showScorecard}
        sessionData={scorecardData}
        onDone={handleScorecardDone}
      />

      {/* ─── SESSION SAVE STATUS ───────────────────────────────────────── */}
      <AnimatePresence>
        {sessionSaveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg ${
              sessionSaveStatus === 'saving' ? 'bg-white/10 text-white/60' :
              sessionSaveStatus === 'saved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {sessionSaveStatus === 'saving' && 'Saving session...'}
            {sessionSaveStatus === 'saved' && '✓ Session saved'}
            {sessionSaveStatus === 'error' && 'Session save failed — data kept locally'}
          </motion.div>
        )}
      </AnimatePresence>

      <WhisperToast />
      {showSummary && <SessionSummary />}
    </div>
  );
}
