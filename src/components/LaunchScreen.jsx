import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Users, ChevronRight, Calendar, Plus, Star, Clock, X, Crown } from 'lucide-react';
import { useApp, SAVINGS_SLIDE } from '../context/AppContext';
import { teamMembers, deckTypes, todaySchedule, executives } from '../data/sampleData';
import slides from '../data/slides';
import recommendDeck from '../data/recommendDeck';

const reps = teamMembers.filter(t => t.role === 'rep');

const INCOME_RANGES = ['Under $25k', '$25k\u2013$50k', '$50k\u2013$100k', '$100k\u2013$250k', '$250k+'];

const INCOME_AMOUNT_MAP = {
  'Under $25k': 20000,
  '$25k\u2013$50k': 37500,
  '$50k\u2013$100k': 75000,
  '$100k\u2013$250k': 150000,
  '$250k+': 300000,
};

// ---------------------------------------------------------------------------
// Slide-filtering logic per deck type (PRESERVED)
// ---------------------------------------------------------------------------
function buildVisibleSlides(deckTypeId) {
  const optionalExclusions = {
    llc: [10, 13, 14, 15, 16, 17],
  };

  let filtered;

  switch (deckTypeId) {
    case 'llc':
      filtered = slides.filter(
        s => (s.required || s.id <= 41) && !optionalExclusions.llc.includes(s.id)
      );
      break;

    case 'llc_bookkeeping':
      filtered = slides.filter(s => s.id >= 1 && s.id <= 45);
      break;

    case 'llc_payroll':
      filtered = slides.filter(
        s => (s.id >= 1 && s.id <= 41) || (s.id >= 46 && s.id <= 49)
      );
      break;

    case 'llc_bundle':
      filtered = slides.filter(s => s.id >= 1 && s.id <= 49);
      break;

    case 'nonprofit':
      filtered = slides.filter(
        s => (s.id >= 1 && s.id <= 41) || s.id === 50
      );
      break;

    case 'btp':
      filtered = slides.filter(s => s.id >= 1 && s.id <= 30);
      break;

    default:
      filtered = slides.filter(s => s.required || s.id <= 41);
      break;
  }

  // Sort by id to guarantee order
  filtered.sort((a, b) => a.id - b.id);

  // Inject virtual savings slide after slide 21
  const idx21 = filtered.findIndex(s => s.id === 21);
  if (idx21 !== -1) {
    filtered.splice(idx21 + 1, 0, SAVINGS_SLIDE);
  }

  return filtered;
}

function buildSlideVisibility(visibleSlides) {
  const map = {};
  visibleSlides.forEach(s => {
    map[s.id] = true;
  });
  return map;
}

function inferDeckType(lead) {
  if (!lead) return 'llc';
  if (lead.leadSource === 'BTP') return 'btp';
  return 'llc';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function outcomeLabel(outcome) {
  switch (outcome) {
    case 'closed': return { text: 'Closed', icon: '\u2705' };
    case 'follow-up': return { text: 'Follow-up', icon: '\uD83D\uDD04' };
    case 'no-sale': return { text: 'No sale', icon: '\u274C' };
    default: return { text: outcome || '', icon: '' };
  }
}

function statusIndicator(status) {
  switch (status) {
    case 'next': return '\uD83D\uDFE2';
    case 'completed': return '\u2705';
    default: return '\u2B1C';
  }
}

// ---------------------------------------------------------------------------
// LaunchScreen Component
// ---------------------------------------------------------------------------
export default function LaunchScreen() {
  const navigate = useNavigate();
  const {
    authUser,
    setRole,
    setRepName,
    setRepId,
    setLead,
    setDeckType,
    setVisibleSlides,
    setSlideVisibility,
    setCurrentSlideIndex,
    setCalculator,
    resetSession,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState('rep');
  const [selectedRep, setSelectedRep] = useState(reps[0]);

  // Schedule state: starts from imported todaySchedule, walk-ins get appended
  const [schedule, setSchedule] = useState(() => todaySchedule.map(appt => ({
    ...appt,
    recommendation: recommendDeck(appt.lead),
  })));

  // Which card has the launch modal open
  const [launchingId, setLaunchingId] = useState(null);
  // Deck override per appointment (defaults to AI recommendation)
  const [deckOverrides, setDeckOverrides] = useState({});

  // Walk-in form
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    entityType: 'LLC',
    state: '',
    leadSource: 'LegalZoom',
    annualIncome: '$50k\u2013$100k',
    industry: '',
    employees: 'Just me',
  });

  // Navigate to manager if role is manager
  useEffect(() => {
    if (selectedRole === 'manager') {
      setRole('manager');
      navigate('/manager');
    }
    if (selectedRole === 'executive') {
      setRole('executive');
      navigate('/executive');
    }
  }, [selectedRole]);

  // Count non-completed appointments
  const consultationsRemaining = schedule.filter(a => a.status !== 'completed').length;

  // ------ Launch handler (PRESERVED LOGIC) ------
  const handleLaunch = (appointment) => {
    // Reset ALL state from any previous pitch
    resetSession();

    const chosenDeck = deckOverrides[appointment.id] || appointment.recommendation.deck;
    const leadData = appointment.lead;

    // 1. Set role
    setRole('rep');

    // 2. Set rep
    setRepName(selectedRep.name);
    setRepId(selectedRep.id);

    // 3. Set lead
    setLead(leadData);

    // 4. Set deck type
    setDeckType(chosenDeck);

    // 5-6. Build visible slides and visibility map
    const visible = buildVisibleSlides(chosenDeck);
    setVisibleSlides(visible);
    setSlideVisibility(buildSlideVisibility(visible));

    // 7. Reset slide index
    setCurrentSlideIndex(0);

    // 8. Sync calculator with lead data
    if (leadData) {
      setCalculator(prev => ({
        ...prev,
        incomeRange: leadData.annualIncome || prev.incomeRange,
        incomeAmount: leadData.incomeAmount || prev.incomeAmount,
        hasSpouse: leadData.hasSpouse ?? prev.hasSpouse,
        spouseIncome: leadData.spouseW2Income ?? prev.spouseIncome,
      }));
    }

    // 9. Navigate
    navigate('/present');
  };

  // ------ Walk-in submit ------
  const handleAddWalkIn = () => {
    const incomeAmount = INCOME_AMOUNT_MAP[walkInForm.annualIncome] || 75000;
    const newLead = {
      id: `walkin_${Date.now()}`,
      firstName: walkInForm.firstName || 'Walk-In',
      lastName: walkInForm.lastName || 'Lead',
      businessName: walkInForm.businessName || 'New Business',
      entityType: walkInForm.entityType,
      industry: walkInForm.industry || 'Other',
      state: walkInForm.state || 'N/A',
      formationDate: '',
      annualIncome: walkInForm.annualIncome,
      incomeAmount,
      leadSource: walkInForm.leadSource,
      phone: '',
      email: '',
      address: '',
      filingStatus: 'Single',
      hasSpouse: false,
      spouseName: '',
      spouseW2Income: 0,
      employees: walkInForm.employees,
    };

    const newAppointment = {
      id: `walkin_${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'next',
      lead: newLead,
      duration: null,
      outcome: null,
      priceQuoted: null,
      recommendation: recommendDeck(newLead),
      isWalkIn: true,
    };

    setSchedule(prev => [...prev, newAppointment]);
    setShowWalkIn(false);
    setWalkInForm({
      firstName: '',
      lastName: '',
      businessName: '',
      entityType: 'LLC',
      state: '',
      leadSource: 'LegalZoom',
      annualIncome: '$50k\u2013$100k',
      industry: '',
      employees: 'Just me',
    });
  };

  // ------ Render ------
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f13' }}>
      {/* ============ TOP BAR ============ */}
      <div className="sticky top-0 z-30 border-b border-white/5" style={{ backgroundColor: '#0f0f13' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Left: Wordmark */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight select-none">
            <span className="text-white/60">1-800-</span>
            <span style={{ color: '#F47920' }}>CLOSER</span>
          </h1>

          {/* Right: Role toggle + A logo */}
          <div className="flex items-center gap-3">
            {/* Rep selector */}
            <select
              value={selectedRep.id}
              onChange={e => {
                const rep = reps.find(r => r.id === e.target.value);
                if (rep) setSelectedRep(rep);
              }}
              className="hidden sm:block bg-[#1e1e2a] text-white border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            >
              {reps.map(r => (
                <option key={r.id} value={r.id} className="">
                  {r.name}
                </option>
              ))}
            </select>

            {/* Role toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setSelectedRole('rep')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedRole === 'rep'
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Phone size={13} />
                Rep
              </button>
              <button
                onClick={() => setSelectedRole('manager')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedRole === 'manager'
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Users size={13} />
                Manager
              </button>
              <button
                onClick={() => setSelectedRole('executive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedRole === 'executive'
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Crown size={13} />
                Executive
              </button>
            </div>

            {/* User avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F47920' }}>
                <span className="text-white font-black text-sm leading-none">
                  {(authUser?.name || selectedRep.name).charAt(0)}
                </span>
              </div>
              <span className="hidden sm:block text-white/50 text-xs font-medium">
                {authUser?.name || selectedRep.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">

        {/* Mobile rep selector */}
        <div className="sm:hidden mt-4 mb-2">
          <select
            value={selectedRep.id}
            onChange={e => {
              const rep = reps.find(r => r.id === e.target.value);
              if (rep) setSelectedRep(rep);
            }}
            className="w-full bg-[#1e1e2a] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          >
            {reps.map(r => (
              <option key={r.id} value={r.id} className="">
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* ============ GREETING ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 sm:mt-10 mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {getGreeting()}, {selectedRep.name.split(' ')[0]}.
          </h2>
          <p className="text-white/40 text-sm sm:text-base mt-1">
            You have <span className="text-white/70 font-semibold">{consultationsRemaining}</span> consultation{consultationsRemaining !== 1 ? 's' : ''} remaining today.
          </p>
        </motion.div>

        {/* ============ TODAY'S SCHEDULE ============ */}
        <div className="mb-6 flex items-center gap-2">
          <Calendar size={16} className="text-white/40" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">
            Today&apos;s Schedule
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {schedule.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                index={idx}
                isLaunching={launchingId === appt.id}
                onToggleLaunch={() => setLaunchingId(launchingId === appt.id ? null : appt.id)}
                deckOverride={deckOverrides[appt.id]}
                onDeckChange={(val) => setDeckOverrides(prev => ({ ...prev, [appt.id]: val }))}
                onConfirmLaunch={() => handleLaunch(appt)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ============ WALK-IN SECTION ============ */}
        <div className="mt-6">
          <AnimatePresence>
            {!showWalkIn && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowWalkIn(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-white/40 text-sm font-medium hover:border-white/20 hover:text-white/60 transition-all"
              >
                <Plus size={16} />
                Add Walk-In / Inbound Call
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showWalkIn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-[#18181f] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold text-sm">New Walk-In / Inbound Call</h4>
                    <button onClick={() => setShowWalkIn(false)} className="text-white/30 hover:text-white/60 transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      label="First Name"
                      value={walkInForm.firstName}
                      onChange={v => setWalkInForm(p => ({ ...p, firstName: v }))}
                      placeholder="John"
                    />
                    <FormField
                      label="Last Name"
                      value={walkInForm.lastName}
                      onChange={v => setWalkInForm(p => ({ ...p, lastName: v }))}
                      placeholder="Smith"
                    />
                    <FormField
                      label="Business Name"
                      value={walkInForm.businessName}
                      onChange={v => setWalkInForm(p => ({ ...p, businessName: v }))}
                      placeholder="Smith Consulting LLC"
                    />
                    <FormSelect
                      label="Entity Type"
                      value={walkInForm.entityType}
                      onChange={v => setWalkInForm(p => ({ ...p, entityType: v }))}
                      options={['LLC', 'S-Corp', 'C-Corp', 'Nonprofit']}
                    />
                    <FormField
                      label="State"
                      value={walkInForm.state}
                      onChange={v => setWalkInForm(p => ({ ...p, state: v }))}
                      placeholder="CA"
                    />
                    <FormSelect
                      label="Lead Source"
                      value={walkInForm.leadSource}
                      onChange={v => setWalkInForm(p => ({ ...p, leadSource: v }))}
                      options={['LegalZoom', 'Tax Hotline', 'BTP', 'Other']}
                    />
                    <FormSelect
                      label="Revenue Range"
                      value={walkInForm.annualIncome}
                      onChange={v => setWalkInForm(p => ({ ...p, annualIncome: v }))}
                      options={INCOME_RANGES}
                    />
                    <FormField
                      label="Industry"
                      value={walkInForm.industry}
                      onChange={v => setWalkInForm(p => ({ ...p, industry: v }))}
                      placeholder="Consulting"
                    />
                    <FormSelect
                      label="Employees"
                      value={walkInForm.employees}
                      onChange={v => setWalkInForm(p => ({ ...p, employees: v }))}
                      options={['Just me', '1-2', '3-5', '6+']}
                    />
                  </div>

                  <button
                    onClick={handleAddWalkIn}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ backgroundColor: '#F47920' }}
                  >
                    <Plus size={15} />
                    Add to Schedule
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-white/20 text-xs">
          1-800Accountant &middot; Internal Sales Tool
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment Card
// ---------------------------------------------------------------------------
function AppointmentCard({ appt, index, isLaunching, onToggleLaunch, deckOverride, onDeckChange, onConfirmLaunch }) {
  const rec = appt.recommendation;
  const isCompleted = appt.status === 'completed';
  const isNext = appt.status === 'next';
  const lead = appt.lead;
  const durationOver = appt.duration && appt.duration > 1800;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`bg-[#18181f] rounded-xl border transition-colors ${
        isNext ? 'border-[#F47920]/30' : 'border-white/10'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: time + status + lead info */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Time column */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16 sm:w-20">
            <span className="text-white/80 font-bold text-base sm:text-lg leading-tight">{appt.time}</span>
            <span className="text-lg">{statusIndicator(appt.status)}</span>
          </div>

          {/* Lead details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm sm:text-base truncate">
                {lead.firstName} {lead.lastName}
              </span>
              <span className="text-white/30 text-sm hidden sm:inline">&middot;</span>
              <span className="text-white/50 text-sm truncate hidden sm:inline">
                {lead.businessName}
              </span>
              {appt.isWalkIn && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F47920]/20 text-[#F47920]">
                  Walk-in
                </span>
              )}
            </div>
            <span className="block sm:hidden text-white/50 text-xs truncate mt-0.5">
              {lead.businessName}
            </span>
            <p className="text-white/40 text-xs mt-1 truncate">
              {lead.entityType} &bull; {lead.state} &bull; {lead.leadSource} &bull; {lead.annualIncome}
            </p>

            {/* AI Recommendation badge */}
            <div className="mt-2 flex items-start gap-1.5">
              <Star size={13} className="text-[#F47920] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold" style={{ color: '#F47920' }}>
                  Recommended: {rec.label}
                </span>
                <span className="block text-white/30 text-[11px] leading-tight mt-0.5">
                  {rec.reason}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: action area */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isCompleted && (
              <>
                <div className="flex items-center gap-1.5">
                  {durationOver && <span className="text-sm" title="Over 30 minutes">{'\u26A0\uFE0F'}</span>}
                  <span className="flex items-center gap-1 text-white/40 text-xs">
                    <Clock size={12} />
                    {formatDuration(appt.duration)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    appt.outcome === 'closed'
                      ? 'bg-green-500/15 text-green-400'
                      : appt.outcome === 'follow-up'
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {outcomeLabel(appt.outcome).icon} {outcomeLabel(appt.outcome).text}
                </span>
              </>
            )}

            {isNext && !isLaunching && (
              <button
                onClick={onToggleLaunch}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: '#F47920' }}
              >
                Launch Pitch
                <ChevronRight size={15} />
              </button>
            )}

            {!isCompleted && !isNext && !isLaunching && (
              <button
                onClick={onToggleLaunch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 text-xs font-semibold border border-white/10 hover:border-white/20 hover:text-white/70 transition-all"
              >
                Launch Pitch
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Launch modal / expandable */}
        <AnimatePresence>
          {isLaunching && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-white/40 text-[11px] uppercase tracking-widest mb-1.5">Deck Type</label>
                  <select
                    value={deckOverride || rec.deck}
                    onChange={e => onDeckChange(e.target.value)}
                    className="w-full bg-[#1e1e2a] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  >
                    {deckTypes.map(dt => (
                      <option key={dt.id} value={dt.id} className="">
                        {dt.label}{dt.id === rec.deck ? ' (AI Recommended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={onToggleLaunch}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-white/40 text-sm font-medium border border-white/10 hover:border-white/20 hover:text-white/60 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirmLaunch}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-white text-sm font-bold transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{ backgroundColor: '#F47920' }}
                  >
                    Confirm & Launch
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------
function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-white/40 text-[11px] uppercase tracking-widest mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-white/40 text-[11px] uppercase tracking-widest mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1e1e2a] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="">{opt}</option>
        ))}
      </select>
    </div>
  );
}
