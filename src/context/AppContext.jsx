import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createSessionBroadcaster, createPresenceTracker } from '../lib/realtimeSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { saveSession } from '../lib/sessionDB';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

// Virtual savings slide injected between slide 21 and 22
export const SAVINGS_SLIDE = {
  id: '21b',
  title: 'Your Personalized Tax Savings',
  subtitle: null,
  category: 'Entity Structure',
  layout: 'personalizedSavings',
  required: true,
  dynamic: true,
  notes: "[LEAD_FIRST_NAME], let me show you exactly what this means for [BUSINESS_NAME].\n\nBased on what you've told me — earning about $[INCOME_AMOUNT] through your business — here's the math.\n\nWithout proper structuring, the IRS takes $[NO_ELECTION] in self-employment tax alone.\n\nBut when we set up your entity classification correctly, we bring that down to $[WITH_ELECTION].\n\nThat's $[ANNUAL_SAVINGS] back in your pocket. Every. Single. Year.\n\nAnd that's BEFORE we even factor in all the deductions we talked about — home office, vehicle, startup costs.\n\nThe total savings could be significantly higher.\n\nNow let me show you what your investment looks like to make all of this happen...",
};

export function AppProvider({ children }) {
  // Auth user (set on login page)
  const [authUser, setAuthUser] = useState(null);

  // Session config
  const [role, setRole] = useState('rep');
  const [repName, setRepName] = useState('Jake Morrison');
  const [repId, setRepId] = useState('rep_jake');

  // Theme (dark/light) — presenter panel only
  const [theme, setTheme] = useState('dark');
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  // Lead data
  const [lead, setLead] = useState(null);
  const [discoveryAnswers, setDiscoveryAnswers] = useState({
    firstBusiness: '',
    feeling: '',
    motivation: '',
    formationConfirmed: false,
    fullOrPartTime: '',
    startupCosts: '',
    fundingSource: '',
    futureInvestment: '',
    profitStatus: '',
    lastYearTax: '',
  });

  // Deck config
  const [deckType, setDeckType] = useState('llc');
  const [slideVisibility, setSlideVisibility] = useState({});

  // Presentation state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [callOutcome, setCallOutcome] = useState(null); // 'closed' | 'follow-up' | 'no-sale' | null
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [sessionSaveStatus, setSessionSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  // Savings banner visibility — only show after personalized savings slide
  const [showSavingsBanner, setShowSavingsBanner] = useState(false);

  // Calculator state
  const [calculator, setCalculator] = useState({
    incomeRange: '$50k–$100k',
    incomeAmount: 75000,
    employees: 'Just me',
    taxRate: 25,
    hasSpouse: false,
    spouseIncome: 0,
  });

  // Pricing state — product-based order
  const [pricing, setPricing] = useState({
    annualPrice: '',
    paymentType: 'Full',
    cardType: 'Visa',
  });

  // Order builder state (shared between presenter panel and disposition)
  const [orderProducts, setOrderProducts] = useState([
    { id: 'core', name: 'Core Accounting Package', price: 2949, terms: 'full' },
  ]);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Visa');

  // Computed savings
  const computeSavings = useCallback(() => {
    const income = calculator.incomeAmount;
    const taxRate = calculator.taxRate;
    const noElection = income * 0.153;
    const salary = income * 0.5;
    const withElection = salary * 0.153;
    const savings = (noElection - withElection) * (taxRate / 25);
    return {
      noElection: Math.round(noElection),
      withElection: Math.round(withElection),
      annualSavings: Math.round(savings),
      salary: Math.round(salary),
    };
  }, [calculator.incomeAmount, calculator.taxRate]);

  const [computedSavings, setComputedSavings] = useState(() => ({
    noElection: 0,
    withElection: 0,
    annualSavings: 0,
    salary: 0,
  }));

  useEffect(() => {
    setComputedSavings(computeSavings());
  }, [computeSavings]);

  // Session tracking
  const [sessionData, setSessionData] = useState({
    slidesShown: [],
    slidesSkipped: [],
    slideTimings: {},
    objectionsClicked: [],
    coachTips: [],
    whisperMessages: [],
    quickNotes: '',
  });

  // Whisper toasts
  const [whisperToasts, setWhisperToasts] = useState([]);

  // Observer state
  const [observer, setObserver] = useState(null);

  // Supabase real-time state
  const [sessionId, setSessionId] = useState(null);
  const broadcasterRef = useRef(null);
  const presenceRef = useRef(null);
  const presenceIntervalRef = useRef(null);

  // Slide timing tracking
  const slideTimerRef = useRef(null);
  const currentSlideStartRef = useRef(Date.now());

  // Call timer
  useEffect(() => {
    let interval;
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  // BroadcastChannel
  const channelRef = useRef(null);
  const addWhisperRef = useRef(null);

  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('sales-presenter-sync');
      channelRef.current.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'WHISPER' && payload && addWhisperRef.current) {
          addWhisperRef.current(payload.message, payload.managerName);
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  const broadcastState = useCallback((type, payload) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type, payload });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Calculate pacing status for presence
  const calculatePacing = useCallback(() => {
    if (!visibleSlides.length) return 'on_pace';
    const slideProgress = currentSlideIndex / visibleSlides.length;
    const timeProgress = callDuration / 1800;
    if (slideProgress < 0.5 && callDuration > 1200) return 'critical';
    if (slideProgress < timeProgress * 0.7) return 'behind';
    return 'on_pace';
  }, [currentSlideIndex, visibleSlides.length, callDuration]);

  // Build the full state payload for Supabase broadcast
  const buildBroadcastPayload = useCallback(() => {
    const currentSlide = visibleSlides[currentSlideIndex];
    const filledDiscovery = Object.values(discoveryAnswers).filter(v => v && v !== '').length;
    return {
      sessionId,
      slideIndex: currentSlideIndex,
      slideData: currentSlide,
      slideTitle: currentSlide?.title || '',
      totalSlides: visibleSlides.length,
      leadData: lead,
      taxCalc: calculator,
      computedSavings,
      pricing,
      slideVisibility,
      showSavingsBanner,
      callDuration,
      discoveryProgress: `${filledDiscovery}/9`,
      objectionsCount: sessionData.objectionsClicked.length,
      pacingStatus: calculatePacing(),
    };
  }, [sessionId, currentSlideIndex, visibleSlides, lead, calculator, computedSavings, pricing, slideVisibility, showSavingsBanner, callDuration, discoveryAnswers, sessionData.objectionsClicked.length, calculatePacing]);

  // Navigate slides
  const goToSlide = useCallback((index) => {
    if (index < 0 || index >= visibleSlides.length) return;

    // Track time on previous slide
    const now = Date.now();
    const timeOnSlide = Math.floor((now - currentSlideStartRef.current) / 1000);
    const prevSlide = visibleSlides[currentSlideIndex];
    if (prevSlide) {
      setSessionData(prev => ({
        ...prev,
        slideTimings: {
          ...prev.slideTimings,
          [prevSlide.id]: (prev.slideTimings[prevSlide.id] || 0) + timeOnSlide,
        },
        slidesShown: prev.slidesShown.includes(prevSlide.id)
          ? prev.slidesShown
          : [...prev.slidesShown, prevSlide.id],
      }));
    }

    currentSlideStartRef.current = now;
    setCurrentSlideIndex(index);

    // Check if we've passed the personalized savings slide — enable banner
    const targetSlide = visibleSlides[index];
    if (targetSlide) {
      const savingsSlideIdx = visibleSlides.findIndex(s => s.id === '21b');
      if (savingsSlideIdx !== -1 && index > savingsSlideIdx) {
        setShowSavingsBanner(true);
      }
      // Hide banner on final thank you slide
      if (targetSlide.id === 41) {
        setShowSavingsBanner(false);
      }

      broadcastState('SLIDE_CHANGE', {
        slideIndex: index,
        slideData: targetSlide,
        leadData: lead,
        taxCalc: calculator,
        computedSavings,
        pricing,
        showSavingsBanner: savingsSlideIdx !== -1 && index > savingsSlideIdx && targetSlide.id !== 41,
      });

      // Also broadcast via Supabase for remote managers
      if (broadcasterRef.current) {
        broadcasterRef.current.broadcastState(buildBroadcastPayload());
      }
    }
  }, [visibleSlides, currentSlideIndex, lead, calculator, computedSavings, pricing, broadcastState, buildBroadcastPayload]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  // Reset all session state for a fresh pitch
  const resetSession = useCallback(() => {
    setIsCallActive(false);
    setCallStartTime(null);
    setCallDuration(0);
    setCurrentSlideIndex(0);
    setDiscoveryAnswers({
      firstBusiness: '',
      feeling: '',
      motivation: '',
      formationConfirmed: false,
      fullOrPartTime: '',
      startupCosts: '',
      fundingSource: '',
      futureInvestment: '',
      profitStatus: '',
      lastYearTax: '',
    });
    setCalculator(prev => ({
      ...prev,
      incomeRange: '$50k–$100k',
      incomeAmount: 75000,
      employees: 'Just me',
      taxRate: 25,
      hasSpouse: false,
      spouseIncome: 0,
    }));
    setPricing({ annualPrice: '', paymentType: 'Full', cardType: 'Visa' });
    setOrderProducts([
      { id: 'core', name: 'Core Accounting Package', price: 2949, terms: 'full' },
    ]);
    setOrderPaymentMethod('Visa');
    setSessionData({
      slidesShown: [],
      slidesSkipped: [],
      slideTimings: {},
      objectionsClicked: [],
      coachTips: [],
      whisperMessages: [],
      quickNotes: '',
    });
    setShowSavingsBanner(false);
    setCallOutcome(null);
    setShowOutcomeSelector(false);
    setShowSummary(false);
    setWhisperToasts([]);
    setSessionId(null);
  }, []);

  // Start/end call
  const startCall = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setIsCallActive(true);
    setCallStartTime(Date.now());
    setCallDuration(0);
    setShowSavingsBanner(false);
    setSessionData({
      slidesShown: [],
      slidesSkipped: [],
      slideTimings: {},
      objectionsClicked: [],
      coachTips: [],
      whisperMessages: [],
      quickNotes: '',
    });

    // Initialize Supabase broadcaster
    if (isSupabaseConfigured()) {
      const broadcaster = createSessionBroadcaster(newSessionId);
      broadcasterRef.current = broadcaster;

      // Listen for whispers from manager via Supabase
      if (broadcaster) {
        broadcaster.onWhisper((payload) => {
          if (addWhisperRef.current) {
            addWhisperRef.current(payload.message, payload.from || 'Manager');
          }
        });
      }
    }
  }, []);

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setShowOutcomeSelector(true); // Show outcome selector first

    // Cleanup Supabase channels
    if (broadcasterRef.current) {
      broadcasterRef.current.unsubscribe();
      broadcasterRef.current = null;
    }
    if (presenceRef.current) {
      presenceRef.current.unsubscribe();
      presenceRef.current = null;
    }
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
  }, []);

  const confirmOutcome = useCallback(async (outcome, dispositionData = {}) => {
    setCallOutcome(outcome);
    setShowOutcomeSelector(false);
    setShowSummary(true);
    setSessionSaveStatus('saving');

    // Build session record
    const sessionRecord = {
      session_id: sessionId || crypto.randomUUID(),
      rep_id: repId,
      rep_name: repName,
      lead_first_name: lead?.firstName || '',
      lead_last_name: lead?.lastName || '',
      business_name: lead?.businessName || '',
      lead_source: lead?.leadSource || '',
      entity_type: lead?.entityType || '',
      industry: lead?.industry || '',
      state: lead?.state || '',
      revenue_range: lead?.annualIncome || '',
      started_at: callStartTime ? new Date(callStartTime).toISOString() : new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: callDuration,
      over_time: callDuration > 1800,
      total_slides: visibleSlides.length,
      slides_presented: sessionData.slidesShown.length,
      slides_skipped: visibleSlides
        .filter(s => !sessionData.slidesShown.includes(s.id))
        .map(s => s.id),
      slide_times: sessionData.slideTimings,
      discovery_answers: discoveryAnswers,
      tax_calc_inputs: { incomeAmount: calculator.incomeAmount, taxRate: calculator.taxRate, hasSpouse: calculator.hasSpouse, spouseIncome: calculator.spouseIncome },
      computed_savings: computedSavings.annualSavings,
      price_quoted: dispositionData.totalSale || pricing.annualPrice || null,
      payment_type: pricing.paymentType || null,
      card_type: orderPaymentMethod || pricing.cardType || null,
      objections_handled: sessionData.objectionsClicked,
      call_notes: sessionData.quickNotes || '',
      outcome,
      deck_type: deckType,
      ai_coach_tips_count: sessionData.coachTips?.length || 0,
      whispers_received: sessionData.whisperMessages?.length || 0,
      // New disposition fields
      products: dispositionData.products || null,
      total_sale: dispositionData.totalSale || null,
      first_payment_amount: dispositionData.firstPaymentAmount || null,
      payment_method_detail: dispositionData.paymentMethod || null,
      progress_meeting: dispositionData.progressMeeting || null,
      follow_up_date: dispositionData.followUpDate || null,
      follow_up_reason: dispositionData.followUpReason || null,
      follow_up_temp: dispositionData.followUpTemp || null,
      not_interested_reason: dispositionData.reason || null,
      disposition_notes: dispositionData.notes || null,
    };

    const result = await saveSession(sessionRecord);
    if (result) {
      setSessionSaveStatus('saved');
    } else {
      setSessionSaveStatus('error');
    }

    // Clear save status after 3 seconds
    setTimeout(() => setSessionSaveStatus(null), 3000);
    setSessionId(null);
  }, [sessionId, repId, repName, lead, callStartTime, callDuration, visibleSlides, sessionData, discoveryAnswers, calculator, computedSavings, pricing, deckType]);

  // Whisper
  const addWhisper = useCallback((message, managerName) => {
    const id = Date.now();
    setWhisperToasts(prev => {
      const next = [...prev, { id, message, managerName, timestamp: new Date() }];
      if (next.length > 3) next.shift();
      return next;
    });
    setSessionData(prev => ({
      ...prev,
      whisperMessages: [...prev.whisperMessages, { message, managerName, timestamp: new Date() }],
    }));
    setTimeout(() => {
      setWhisperToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  }, []);
  addWhisperRef.current = addWhisper;

  const dismissWhisper = useCallback((id) => {
    setWhisperToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Track objection
  const trackObjection = useCallback((objection) => {
    setSessionData(prev => ({
      ...prev,
      objectionsClicked: [...prev.objectionsClicked, { text: objection, timestamp: new Date(), slideId: visibleSlides[currentSlideIndex]?.id }],
    }));
  }, [visibleSlides, currentSlideIndex]);

  // Broadcast full state
  const broadcastFullState = useCallback(() => {
    broadcastState('FULL_STATE', {
      currentSlide: visibleSlides[currentSlideIndex],
      slideIndex: currentSlideIndex,
      leadData: lead,
      taxCalc: calculator,
      computedSavings,
      pricing,
      slideVisibility,
      showSavingsBanner,
    });
  }, [visibleSlides, currentSlideIndex, lead, calculator, computedSavings, pricing, slideVisibility, showSavingsBanner, broadcastState]);

  // Broadcast on data changes
  useEffect(() => {
    if (lead) broadcastFullState();
  }, [lead, calculator, computedSavings, pricing, showSavingsBanner]);

  // Supabase presence tracking — update every 10 seconds while call is active
  useEffect(() => {
    if (!isCallActive || !sessionId || !isSupabaseConfigured()) return;

    // Initialize presence tracker
    if (!presenceRef.current && repId && repName) {
      const tracker = createPresenceTracker(repId, repName, {
        sessionId,
        leadName: lead ? `${lead.firstName} ${lead.lastName}` : '',
        businessName: lead?.businessName || '',
        state: lead?.state || '',
        leadSource: lead?.leadSource || '',
        currentSlide: currentSlideIndex,
        totalSlides: visibleSlides.length,
        callDuration: 0,
        computedSavings: computedSavings.annualSavings,
        objectionsCount: 0,
        pacingStatus: 'on_pace',
      });
      presenceRef.current = tracker;
    }

    // Update presence every 10 seconds
    presenceIntervalRef.current = setInterval(() => {
      if (presenceRef.current) {
        const filledDiscovery = Object.values(discoveryAnswers).filter(v => v && v !== '').length;
        presenceRef.current.updatePresence({
          sessionId,
          leadName: lead ? `${lead.firstName} ${lead.lastName}` : '',
          businessName: lead?.businessName || '',
          state: lead?.state || '',
          leadSource: lead?.leadSource || '',
          currentSlide: currentSlideIndex,
          slideTitle: visibleSlides[currentSlideIndex]?.title || '',
          totalSlides: visibleSlides.length,
          callDuration,
          computedSavings: computedSavings.annualSavings,
          objectionsCount: sessionData.objectionsClicked.length,
          discoveryProgress: `${filledDiscovery}/9`,
          pacingStatus: calculatePacing(),
        });
      }
    }, 10000);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, [isCallActive, sessionId]);

  // Update lead with calculator sync
  const updateLead = useCallback((updates) => {
    setLead(prev => {
      const next = { ...prev, ...updates };
      if (updates.incomeAmount !== undefined) {
        setCalculator(c => ({ ...c, incomeAmount: updates.incomeAmount }));
      }
      if (updates.hasSpouse !== undefined) {
        setCalculator(c => ({ ...c, hasSpouse: updates.hasSpouse }));
      }
      if (updates.spouseW2Income !== undefined) {
        setCalculator(c => ({ ...c, spouseIncome: updates.spouseW2Income }));
      }
      return next;
    });
  }, []);

  const value = {
    sessionId,
    authUser, setAuthUser,
    role, setRole,
    repName, setRepName,
    repId, setRepId,
    theme, setTheme, toggleTheme,
    lead, setLead, updateLead,
    discoveryAnswers, setDiscoveryAnswers,
    deckType, setDeckType,
    slideVisibility, setSlideVisibility,
    currentSlideIndex, setCurrentSlideIndex,
    visibleSlides, setVisibleSlides,
    isCallActive, callStartTime, callDuration,
    resetSession, startCall, endCall,
    showSummary, setShowSummary,
    callOutcome, setCallOutcome,
    showOutcomeSelector, setShowOutcomeSelector,
    sessionSaveStatus,
    confirmOutcome,
    showSavingsBanner, setShowSavingsBanner,
    calculator, setCalculator,
    pricing, setPricing,
    orderProducts, setOrderProducts,
    orderPaymentMethod, setOrderPaymentMethod,
    computedSavings,
    sessionData, setSessionData,
    whisperToasts, addWhisper, dismissWhisper,
    observer, setObserver,
    goToSlide, nextSlide, prevSlide,
    trackObjection,
    broadcastState, broadcastFullState,
    channelRef,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
