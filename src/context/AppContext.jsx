import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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

  // Pricing state
  const [pricing, setPricing] = useState({
    annualPrice: '',
    paymentType: 'Full',
    cardType: 'Visa',
  });

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
    }
  }, [visibleSlides, currentSlideIndex, lead, calculator, computedSavings, pricing, broadcastState]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  // Start/end call
  const startCall = useCallback(() => {
    setIsCallActive(true);
    setCallStartTime(Date.now());
    setCallDuration(0);
    setSessionData({
      slidesShown: [],
      slidesSkipped: [],
      slideTimings: {},
      objectionsClicked: [],
      coachTips: [],
      whisperMessages: [],
      quickNotes: '',
    });
  }, []);

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setShowSummary(true);
  }, []);

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
    startCall, endCall,
    showSummary, setShowSummary,
    showSavingsBanner, setShowSavingsBanner,
    calculator, setCalculator,
    pricing, setPricing,
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
