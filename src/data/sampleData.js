// ============================================================
// 1-800-CLOSER Sales Platform - Sample Data
// ============================================================

// ---------- 1. Sample Leads ----------
export const sampleLeads = [
  {
    id: 'lead_sarah',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    businessName: 'Coastal Creative Co.',
    entityType: 'LLC',
    industry: 'Marketing & Advertising',
    state: 'FL',
    formationDate: '2025-11-15',
    annualIncome: '$50k–$100k',
    incomeAmount: 75000,
    leadSource: 'LegalZoom',
    phone: '(305) 555-0142',
    email: 'sarah.mitchell@email.com',
    address: '2847 Ocean Drive, Miami, FL 33139',
    filingStatus: 'Married Filing Jointly',
    hasSpouse: true,
    spouseName: 'David Mitchell',
    spouseW2Income: 65000,
  },
  {
    id: 'lead_marcus',
    firstName: 'Marcus',
    lastName: 'Thompson',
    businessName: 'Thompson Contracting LLC',
    entityType: 'LLC',
    industry: 'Construction',
    state: 'TX',
    formationDate: '2025-08-22',
    annualIncome: '$100k–$250k',
    incomeAmount: 150000,
    leadSource: 'Tax Hotline',
    phone: '(512) 555-0198',
    email: 'marcus.t@gmail.com',
    address: '1450 Industrial Blvd, Austin, TX 78701',
    filingStatus: 'Single',
    hasSpouse: false,
    spouseName: '',
    spouseW2Income: 0,
  },
  {
    id: 'lead_priya',
    firstName: 'Priya',
    lastName: 'Patel',
    businessName: 'Patel Tech Consulting',
    entityType: 'LLC',
    industry: 'IT Consulting',
    state: 'CA',
    formationDate: '2026-01-10',
    annualIncome: '$250k+',
    incomeAmount: 300000,
    leadSource: 'BTP',
    phone: '(408) 555-0267',
    email: 'priya@patelconsulting.com',
    address: '985 Innovation Way, San Jose, CA 95110',
    filingStatus: 'Married Filing Jointly',
    hasSpouse: true,
    spouseName: 'Raj Patel',
    spouseW2Income: 120000,
  },
];

// ---------- 2. Team Members ----------
export const teamMembers = [
  { id: 'rep_jake', name: 'Jake Morrison', role: 'rep' },
  { id: 'rep_danielle', name: 'Danielle Cruz', role: 'rep' },
  { id: 'rep_chris', name: 'Chris Lee', role: 'rep' },
  { id: 'rep_taylor', name: 'Taylor Rivera', role: 'rep' },
  { id: 'mgr_alex', name: 'Alex Rivera', role: 'manager' },
  { id: 'mgr_sarah', name: 'Sarah Chen', role: 'manager' },
];

// ---------- 3. Mock Active Sessions (Manager Hub) ----------
export const mockActiveSessions = [
  {
    id: 'session_1',
    repId: 'rep_jake',
    repName: 'Jake Morrison',
    status: 'live',
    leadName: 'Sarah Mitchell',
    businessName: 'Coastal Creative Co.',
    state: 'FL',
    leadSource: 'LegalZoom',
    currentSlide: 21,
    totalSlides: 35,
    slideTitle: 'More Money in Your Pocket',
    duration: 1114, // seconds (18:34)
    computedSavings: 5738,
    objectionsHandled: 1,
    objections: ['Need to think about it'],
    discoveryProgress: 7,
    discoveryTotal: 9,
    priceQuoted: null,
  },
  {
    id: 'session_2',
    repId: 'rep_danielle',
    repName: 'Danielle Cruz',
    status: 'live',
    leadName: 'Marcus Thompson',
    businessName: 'Thompson Contracting LLC',
    state: 'TX',
    leadSource: 'Tax Hotline',
    currentSlide: 8,
    totalSlides: 41,
    slideTitle: 'Deductions',
    duration: 542, // 9:02
    computedSavings: 11475,
    objectionsHandled: 0,
    objections: [],
    discoveryProgress: 5,
    discoveryTotal: 9,
    priceQuoted: null,
  },
  {
    id: 'session_3',
    repId: 'rep_chris',
    repName: 'Chris Lee',
    status: 'live',
    leadName: 'Michael Rodriguez',
    businessName: 'Rodriguez Auto Detail',
    state: 'NV',
    leadSource: 'Tax Hotline & BTP',
    currentSlide: 35,
    totalSlides: 41,
    slideTitle: 'Mobile App Features',
    duration: 1823, // 30:23
    computedSavings: 4250,
    objectionsHandled: 2,
    objections: ['Too expensive', 'Already have an accountant'],
    discoveryProgress: 9,
    discoveryTotal: 9,
    priceQuoted: 2499,
  },
  {
    id: 'session_4',
    repId: 'rep_taylor',
    repName: 'Taylor Rivera',
    status: 'idle',
    leadName: 'Jennifer Walsh',
    businessName: 'Walsh Interior Design',
    state: 'NY',
    leadSource: 'LegalZoom',
    currentSlide: 0,
    totalSlides: 35,
    slideTitle: 'Not started',
    duration: 0,
    computedSavings: 0,
    objectionsHandled: 0,
    objections: [],
    discoveryProgress: 0,
    discoveryTotal: 9,
    priceQuoted: null,
  },
];

// ---------- 4. Mock Recent (Completed) Sessions ----------
export const mockRecentSessions = [
  {
    id: 'recent_1',
    repName: 'Jake Morrison',
    leadName: 'Amanda Chen',
    businessName: 'Chen Photography LLC',
    duration: 2045, // 34:05
    priceQuoted: 2499,
    objections: 2,
    outcome: 'closed',
    date: '2026-03-11',
  },
  {
    id: 'recent_2',
    repName: 'Danielle Cruz',
    leadName: 'Robert Kim',
    businessName: 'Kim Digital Marketing',
    duration: 1560, // 26:00
    priceQuoted: 2999,
    objections: 1,
    outcome: 'closed',
    date: '2026-03-11',
  },
  {
    id: 'recent_3',
    repName: 'Chris Lee',
    leadName: 'Diana Flores',
    businessName: 'Flores Catering Co.',
    duration: 2700, // 45:00
    priceQuoted: 3499,
    objections: 3,
    outcome: 'follow-up',
    date: '2026-03-11',
  },
  {
    id: 'recent_4',
    repName: 'Taylor Rivera',
    leadName: 'James O\'Brien',
    businessName: 'O\'Brien Consulting',
    duration: 1200, // 20:00
    priceQuoted: 2199,
    objections: 0,
    outcome: 'closed',
    date: '2026-03-11',
  },
  {
    id: 'recent_5',
    repName: 'Jake Morrison',
    leadName: 'Lisa Park',
    businessName: 'Park Wellness Studio',
    duration: 1800, // 30:00
    priceQuoted: 2999,
    objections: 2,
    outcome: 'no-sale',
    date: '2026-03-10',
  },
  {
    id: 'recent_6',
    repName: 'Danielle Cruz',
    leadName: 'Tom Henderson',
    businessName: 'Henderson Plumbing',
    duration: 2400, // 40:00
    priceQuoted: 2499,
    objections: 1,
    outcome: 'closed',
    date: '2026-03-10',
  },
  {
    id: 'recent_7',
    repName: 'Chris Lee',
    leadName: 'Angela Martinez',
    businessName: 'Martinez Law Office',
    duration: 1680, // 28:00
    priceQuoted: 3499,
    objections: 2,
    outcome: 'follow-up',
    date: '2026-03-10',
  },
  {
    id: 'recent_8',
    repName: 'Taylor Rivera',
    leadName: 'Kevin Wright',
    businessName: 'Wright Electrical Services',
    duration: 2100, // 35:00
    priceQuoted: 2999,
    objections: 1,
    outcome: 'closed',
    date: '2026-03-10',
  },
];

// ---------- 5. Mock Team Performance ----------
export const mockTeamPerformance = [
  { name: 'Jake Morrison', calls: 8, closeRate: 62, avgDuration: 1920, avgSavings: 6240 },
  { name: 'Danielle Cruz', calls: 7, closeRate: 71, avgDuration: 1740, avgSavings: 7100 },
  { name: 'Chris Lee', calls: 6, closeRate: 50, avgDuration: 2100, avgSavings: 5890 },
  { name: 'Taylor Rivera', calls: 9, closeRate: 56, avgDuration: 1680, avgSavings: 5420 },
];

// ---------- 6. Top Objections ----------
export const topObjections = [
  { text: 'Too expensive', percentage: 34 },
  { text: 'Need to think about it', percentage: 22 },
  { text: 'Already have an accountant', percentage: 15 },
  { text: 'Spouse needs to decide', percentage: 12 },
  { text: 'Just started, no revenue', percentage: 9 },
  { text: 'Can do it myself / TurboTax', percentage: 8 },
];

// ---------- 7. Deck Types ----------
export const deckTypes = [
  { id: 'llc', label: 'LLC Consultation', slideRange: [1, 41], description: 'Standard LLC consultation deck' },
  { id: 'llc_bookkeeping', label: 'LLC + Bookkeeping', slideRange: [1, 45], description: 'LLC consultation with bookkeeping add-on' },
  { id: 'llc_payroll', label: 'LLC + Payroll', slideRange: [1, 41, 46, 49], description: 'LLC consultation with payroll add-on' },
  { id: 'llc_bundle', label: 'LLC + Full Bundle', slideRange: [1, 49], description: 'LLC consultation with all add-ons' },
  { id: 'nonprofit', label: 'Nonprofit', slideRange: [1, 41, 50], description: 'Nonprofit-focused consultation' },
  { id: 'btp', label: 'BTP Only', slideRange: [1, 30], description: 'Shortened deck for BTP leads' },
];

// ---------- 8. Today's Schedule (Jake Morrison) ----------
export const todaySchedule = [
  {
    id: 'appt_01',
    time: '9:00 AM',
    status: 'completed',
    lead: {
      firstName: 'Sarah',
      lastName: 'Mitchell',
      businessName: 'Coastal Creative Co.',
      entityType: 'LLC',
      state: 'FL',
      leadSource: 'LegalZoom',
      annualIncome: '$50k–$100k',
      incomeAmount: 75000,
      industry: 'Marketing & Advertising',
      phone: '(305) 555-0142',
      email: 'sarah.mitchell@email.com',
      filingStatus: 'Married Filing Jointly',
      hasSpouse: true,
      spouseW2Income: 65000,
      employees: 'Just me',
    },
    duration: 1680,
    outcome: 'closed',
    priceQuoted: 2499,
  },
  {
    id: 'appt_02',
    time: '9:30 AM',
    status: 'completed',
    lead: {
      firstName: 'Marcus',
      lastName: 'Thompson',
      businessName: 'Thompson Contracting LLC',
      entityType: 'LLC',
      state: 'TX',
      leadSource: 'Tax Hotline',
      annualIncome: '$100k–$250k',
      incomeAmount: 150000,
      industry: 'Construction',
      phone: '(512) 555-0198',
      email: 'marcus.t@gmail.com',
      filingStatus: 'Single',
      hasSpouse: false,
      spouseW2Income: 0,
      employees: '3–5',
    },
    duration: 2160,
    outcome: 'follow-up',
    priceQuoted: 2999,
  },
  {
    id: 'appt_03',
    time: '10:00 AM',
    status: 'next',
    lead: {
      firstName: 'Priya',
      lastName: 'Patel',
      businessName: 'Patel Tech Consulting',
      entityType: 'LLC',
      state: 'CA',
      leadSource: 'BTP',
      annualIncome: '$250k+',
      incomeAmount: 300000,
      industry: 'IT Consulting',
      phone: '(408) 555-0267',
      email: 'priya@patelconsulting.com',
      filingStatus: 'Married Filing Jointly',
      hasSpouse: true,
      spouseW2Income: 120000,
      employees: 'Just me',
    },
    duration: null,
    outcome: null,
    priceQuoted: null,
  },
  {
    id: 'appt_04',
    time: '10:30 AM',
    status: 'upcoming',
    lead: {
      firstName: 'David',
      lastName: 'Chen',
      businessName: "Chen's Auto Repair",
      entityType: 'LLC',
      state: 'WA',
      leadSource: 'LegalZoom',
      annualIncome: '$50k–$100k',
      incomeAmount: 65000,
      industry: 'Automotive',
      phone: '(206) 555-0331',
      email: 'david@chensautorepair.com',
      filingStatus: 'Single',
      hasSpouse: false,
      spouseW2Income: 0,
      employees: 'Just me',
    },
    duration: null,
    outcome: null,
    priceQuoted: null,
  },
  {
    id: 'appt_05',
    time: '11:00 AM',
    status: 'upcoming',
    lead: {
      firstName: 'Maria',
      lastName: 'Santos',
      businessName: 'Santos Cleaning Services',
      entityType: 'LLC',
      state: 'AZ',
      leadSource: 'Tax Hotline',
      annualIncome: '$25k–$50k',
      incomeAmount: 35000,
      industry: 'Cleaning Services',
      phone: '(480) 555-0419',
      email: 'maria@santoscleaning.com',
      filingStatus: 'Single',
      hasSpouse: false,
      spouseW2Income: 0,
      employees: '1–2',
    },
    duration: null,
    outcome: null,
    priceQuoted: null,
  },
  {
    id: 'appt_06',
    time: '11:30 AM',
    status: 'upcoming',
    lead: {
      firstName: 'Tyler',
      lastName: 'Brooks',
      businessName: 'Brooks Trucking LLC',
      entityType: 'LLC',
      state: 'GA',
      leadSource: 'LegalZoom',
      annualIncome: '$100k–$250k',
      incomeAmount: 180000,
      industry: 'Trucking',
      phone: '(770) 555-0587',
      email: 'tyler@brookstrucking.com',
      filingStatus: 'Married Filing Jointly',
      hasSpouse: true,
      spouseW2Income: 42000,
      employees: '3–5',
    },
    duration: null,
    outcome: null,
    priceQuoted: null,
  },
];

// ---------- 9. Rep Pitch History ----------
export const repPitchHistory = {
  rep_jake: [
    { id: 'pitch_j01', date: '2026-03-12', time: '9:00 AM', leadName: 'Sarah Mitchell', businessName: 'Coastal Creative Co.', duration: 1680, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 88 },
    { id: 'pitch_j02', date: '2026-03-12', time: '9:30 AM', leadName: 'Marcus Thompson', businessName: 'Thompson Contracting LLC', duration: 2160, outcome: 'follow-up', priceQuoted: 2999, objectionsHandled: 2, scriptAdherence: 82 },
    { id: 'pitch_j03', date: '2026-03-11', time: '9:00 AM', leadName: 'Amanda Chen', businessName: 'Chen Photography LLC', duration: 2045, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 2, scriptAdherence: 85 },
    { id: 'pitch_j04', date: '2026-03-11', time: '10:00 AM', leadName: 'Kevin Wright', businessName: 'Wright Fitness Studio', duration: 1920, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 1, scriptAdherence: 90 },
    { id: 'pitch_j05', date: '2026-03-10', time: '9:00 AM', leadName: 'Lisa Park', businessName: 'Park Wellness Studio', duration: 1800, outcome: 'no-sale', priceQuoted: 2999, objectionsHandled: 3, scriptAdherence: 78 },
    { id: 'pitch_j06', date: '2026-03-10', time: '10:30 AM', leadName: 'Brian Nguyen', businessName: 'Nguyen Landscaping', duration: 2340, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 2, scriptAdherence: 84 },
    { id: 'pitch_j07', date: '2026-03-09', time: '9:00 AM', leadName: 'Rachel Foster', businessName: 'Foster Design Co.', duration: 1560, outcome: 'closed', priceQuoted: 1999, objectionsHandled: 0, scriptAdherence: 92 },
    { id: 'pitch_j08', date: '2026-03-09', time: '10:00 AM', leadName: 'Derek Collins', businessName: 'Collins Electric', duration: 2520, outcome: 'follow-up', priceQuoted: 3499, objectionsHandled: 4, scriptAdherence: 76 },
    { id: 'pitch_j09', date: '2026-03-06', time: '11:00 AM', leadName: 'Janet Williams', businessName: 'Williams Bookkeeping', duration: 1740, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 1, scriptAdherence: 91 },
    { id: 'pitch_j10', date: '2026-03-05', time: '9:30 AM', leadName: 'Carlos Ruiz', businessName: 'Ruiz Construction', duration: 2100, outcome: 'no-sale', priceQuoted: 2999, objectionsHandled: 3, scriptAdherence: 79 },
  ],
  rep_danielle: [
    { id: 'pitch_d01', date: '2026-03-12', time: '9:00 AM', leadName: 'Robert Kim', businessName: 'Kim Digital Marketing', duration: 1560, outcome: 'closed', priceQuoted: 2999, objectionsHandled: 1, scriptAdherence: 94 },
    { id: 'pitch_d02', date: '2026-03-12', time: '10:00 AM', leadName: 'Stephanie Brown', businessName: 'Brown Event Planning', duration: 1680, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 0, scriptAdherence: 96 },
    { id: 'pitch_d03', date: '2026-03-11', time: '9:00 AM', leadName: 'Tom Henderson', businessName: 'Henderson Plumbing', duration: 2400, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 89 },
    { id: 'pitch_d04', date: '2026-03-11', time: '10:30 AM', leadName: 'Michelle Davis', businessName: 'Davis Pet Grooming', duration: 1440, outcome: 'closed', priceQuoted: 1999, objectionsHandled: 0, scriptAdherence: 95 },
    { id: 'pitch_d05', date: '2026-03-10', time: '9:00 AM', leadName: 'Anthony Garcia', businessName: 'Garcia Roofing', duration: 1980, outcome: 'follow-up', priceQuoted: 3499, objectionsHandled: 2, scriptAdherence: 87 },
    { id: 'pitch_d06', date: '2026-03-10', time: '11:00 AM', leadName: 'Laura Adams', businessName: 'Adams Yoga Studio', duration: 1500, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 1, scriptAdherence: 93 },
    { id: 'pitch_d07', date: '2026-03-09', time: '9:30 AM', leadName: 'Eric Johnson', businessName: 'Johnson HVAC Services', duration: 2280, outcome: 'no-sale', priceQuoted: 2999, objectionsHandled: 3, scriptAdherence: 81 },
    { id: 'pitch_d08', date: '2026-03-08', time: '9:00 AM', leadName: 'Natalie Owens', businessName: 'Owens Interior Design', duration: 1620, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 91 },
    { id: 'pitch_d09', date: '2026-03-06', time: '10:00 AM', leadName: 'Paul Robinson', businessName: 'Robinson Towing', duration: 2100, outcome: 'follow-up', priceQuoted: 2999, objectionsHandled: 2, scriptAdherence: 84 },
    { id: 'pitch_d10', date: '2026-03-05', time: '9:00 AM', leadName: 'Sandra Lee', businessName: 'Lee Nail Salon', duration: 1740, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 1, scriptAdherence: 90 },
  ],
  rep_chris: [
    { id: 'pitch_c01', date: '2026-03-12', time: '9:00 AM', leadName: 'Michael Rodriguez', businessName: 'Rodriguez Auto Detail', duration: 1823, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 2, scriptAdherence: 74 },
    { id: 'pitch_c02', date: '2026-03-12', time: '10:30 AM', leadName: 'Jessica Taylor', businessName: 'Taylor Beauty Bar', duration: 2400, outcome: 'follow-up', priceQuoted: 3499, objectionsHandled: 3, scriptAdherence: 72 },
    { id: 'pitch_c03', date: '2026-03-11', time: '9:00 AM', leadName: 'Diana Flores', businessName: 'Flores Catering Co.', duration: 2700, outcome: 'follow-up', priceQuoted: 3499, objectionsHandled: 3, scriptAdherence: 76 },
    { id: 'pitch_c04', date: '2026-03-11', time: '10:00 AM', leadName: 'Gregory Hall', businessName: 'Hall Painting Services', duration: 2040, outcome: 'closed', priceQuoted: 2999, objectionsHandled: 1, scriptAdherence: 80 },
    { id: 'pitch_c05', date: '2026-03-10', time: '9:00 AM', leadName: 'Angela Martinez', businessName: 'Martinez Law Office', duration: 1680, outcome: 'follow-up', priceQuoted: 3499, objectionsHandled: 2, scriptAdherence: 83 },
    { id: 'pitch_c06', date: '2026-03-10', time: '11:00 AM', leadName: 'Raymond Scott', businessName: 'Scott Welding', duration: 2520, outcome: 'no-sale', priceQuoted: 2999, objectionsHandled: 4, scriptAdherence: 73 },
    { id: 'pitch_c07', date: '2026-03-09', time: '9:30 AM', leadName: 'Christina Baker', businessName: 'Baker Bakery', duration: 1860, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 1, scriptAdherence: 86 },
    { id: 'pitch_c08', date: '2026-03-08', time: '9:00 AM', leadName: 'Wayne Phillips', businessName: 'Phillips Drywall', duration: 2280, outcome: 'closed', priceQuoted: 2999, objectionsHandled: 2, scriptAdherence: 78 },
    { id: 'pitch_c09', date: '2026-03-06', time: '10:00 AM', leadName: 'Hannah Turner', businessName: 'Turner Photography', duration: 2460, outcome: 'no-sale', priceQuoted: 3499, objectionsHandled: 3, scriptAdherence: 75 },
    { id: 'pitch_c10', date: '2026-03-05', time: '9:00 AM', leadName: 'Frank Morgan', businessName: 'Morgan Mechanical', duration: 1980, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 82 },
  ],
  rep_taylor: [
    { id: 'pitch_t01', date: '2026-03-12', time: '9:00 AM', leadName: 'Jennifer Walsh', businessName: 'Walsh Interior Design', duration: 1620, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 94 },
    { id: 'pitch_t02', date: '2026-03-12', time: '9:30 AM', leadName: 'Nathan Cooper', businessName: 'Cooper Lawn Care', duration: 1500, outcome: 'closed', priceQuoted: 1999, objectionsHandled: 0, scriptAdherence: 95 },
    { id: 'pitch_t03', date: '2026-03-11', time: '9:00 AM', leadName: "James O'Brien", businessName: "O'Brien Consulting", duration: 1200, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 0, scriptAdherence: 96 },
    { id: 'pitch_t04', date: '2026-03-11', time: '10:00 AM', leadName: 'Rebecca Stone', businessName: 'Stone Massage Therapy', duration: 1800, outcome: 'no-sale', priceQuoted: 2499, objectionsHandled: 2, scriptAdherence: 92 },
    { id: 'pitch_t05', date: '2026-03-10', time: '9:00 AM', leadName: 'Kevin Wright', businessName: 'Wright Electrical Services', duration: 2100, outcome: 'closed', priceQuoted: 2999, objectionsHandled: 1, scriptAdherence: 93 },
    { id: 'pitch_t06', date: '2026-03-10', time: '10:30 AM', leadName: 'Samantha Reed', businessName: 'Reed Bookkeeping', duration: 1680, outcome: 'follow-up', priceQuoted: 2499, objectionsHandled: 2, scriptAdherence: 90 },
    { id: 'pitch_t07', date: '2026-03-09', time: '9:00 AM', leadName: 'Brandon Hayes', businessName: 'Hayes Courier Service', duration: 1440, outcome: 'closed', priceQuoted: 2199, objectionsHandled: 0, scriptAdherence: 95 },
    { id: 'pitch_t08', date: '2026-03-08', time: '9:30 AM', leadName: 'Olivia Price', businessName: 'Price Tutoring', duration: 1920, outcome: 'no-sale', priceQuoted: 2999, objectionsHandled: 3, scriptAdherence: 88 },
    { id: 'pitch_t09', date: '2026-03-06', time: '10:00 AM', leadName: 'Daniel Ward', businessName: 'Ward Plumbing', duration: 1560, outcome: 'closed', priceQuoted: 2499, objectionsHandled: 1, scriptAdherence: 94 },
    { id: 'pitch_t10', date: '2026-03-05', time: '9:00 AM', leadName: 'Amy Fisher', businessName: 'Fisher Accounting', duration: 1740, outcome: 'follow-up', priceQuoted: 2999, objectionsHandled: 2, scriptAdherence: 91 },
  ],
};

// ---------- 10. Rep Insights ----------
export const repInsights = {
  rep_jake: [
    'Jake tends to spend too long on the deductions section (avg 8 min vs team avg 4 min)',
    'Strong closer — 89% of prospects who reach the pricing slide convert',
    'Frequently skips the Loan Agreement slide — consider coaching on this',
    "Top objection received: 'Too expensive' (6 of last 10 calls)",
    'Average call duration: 34 minutes — consistently runs over the 30-min slot',
  ],
  rep_danielle: [
    'Danielle excels at discovery — averages 8/9 discovery questions answered per call',
    'Fastest to reach pricing slides (avg 14 min) — strong pacing',
    'Close rate drops significantly when call exceeds 30 minutes (71% → 40%)',
    "Handles 'Need to think about it' objection effectively — 80% conversion after rebuttal",
  ],
  rep_chris: [
    'Chris frequently runs over the 30-minute slot (avg 36 min)',
    'Tends to skip the S-Corp election comparison slide — missing key savings pitch',
    'Strong rapport building but needs to transition to pricing earlier',
    "Top objection: 'Already have an accountant' — could use additional rebuttal coaching",
    'Highest average savings quoted on team ($5,890/yr)',
  ],
  rep_taylor: [
    'Taylor has the fastest average call time on the team (28 min) — good pacing',
    'Discovery completion is low (avg 5/9 questions) — consider coaching on thorough qualification',
    'Consistently uses the full deck without skipping slides — 94% adherence',
    'Close rate improves 30% when spouse income is discussed early',
  ],
};

// ============================================================
// EXPANDED MOCK DATA — 170 Reps, 15 Managers, Executives
// ============================================================

// ---------- 11. Executives ----------
export const executives = [
  { id: 'exec_vp', name: 'Ryan Torres', role: 'executive', title: 'VP of Sales' },
  { id: 'exec_cso', name: 'Nicole Park', role: 'executive', title: 'Chief Strategy Officer' },
];

// ---------- 12. Managers (15) ----------
export const managers = [
  { id: 'mgr_01', name: 'Alex Rivera', reps: 12, activeCalls: 3, closedToday: 4, closeRate: 38, revenue: 9974, appointmentsDone: 28, appointmentsTotal: 36 },
  { id: 'mgr_02', name: 'Morgan Chen', reps: 11, activeCalls: 4, closedToday: 3, closeRate: 34, revenue: 7485, appointmentsDone: 24, appointmentsTotal: 33 },
  { id: 'mgr_03', name: 'Jordan Patel', reps: 12, activeCalls: 2, closedToday: 5, closeRate: 41, revenue: 12475, appointmentsDone: 30, appointmentsTotal: 36 },
  { id: 'mgr_04', name: 'Taylor Brooks', reps: 11, activeCalls: 3, closedToday: 2, closeRate: 29, revenue: 4990, appointmentsDone: 22, appointmentsTotal: 33 },
  { id: 'mgr_05', name: 'Casey Williams', reps: 12, activeCalls: 3, closedToday: 4, closeRate: 36, revenue: 9976, appointmentsDone: 26, appointmentsTotal: 36 },
  { id: 'mgr_06', name: 'Reese Nakamura', reps: 11, activeCalls: 2, closedToday: 3, closeRate: 33, revenue: 7491, appointmentsDone: 25, appointmentsTotal: 33 },
  { id: 'mgr_07', name: 'Dakota Singh', reps: 12, activeCalls: 4, closedToday: 1, closeRate: 25, revenue: 2495, appointmentsDone: 20, appointmentsTotal: 36 },
  { id: 'mgr_08', name: 'Avery Thompson', reps: 11, activeCalls: 3, closedToday: 3, closeRate: 35, revenue: 7485, appointmentsDone: 27, appointmentsTotal: 33 },
  { id: 'mgr_09', name: 'Quinn Fischer', reps: 11, activeCalls: 2, closedToday: 2, closeRate: 31, revenue: 4990, appointmentsDone: 23, appointmentsTotal: 33 },
  { id: 'mgr_10', name: 'Skyler Okafor', reps: 12, activeCalls: 3, closedToday: 4, closeRate: 39, revenue: 9976, appointmentsDone: 29, appointmentsTotal: 36 },
  { id: 'mgr_11', name: 'Riley Gomez', reps: 11, activeCalls: 2, closedToday: 2, closeRate: 30, revenue: 4990, appointmentsDone: 21, appointmentsTotal: 33 },
  { id: 'mgr_12', name: 'Jamie Larsen', reps: 12, activeCalls: 3, closedToday: 3, closeRate: 37, revenue: 7479, appointmentsDone: 27, appointmentsTotal: 36 },
  { id: 'mgr_13', name: 'Sam Morales', reps: 11, activeCalls: 3, closedToday: 1, closeRate: 26, revenue: 2493, appointmentsDone: 19, appointmentsTotal: 33 },
  { id: 'mgr_14', name: 'Drew Kapoor', reps: 11, activeCalls: 2, closedToday: 2, closeRate: 32, revenue: 4990, appointmentsDone: 24, appointmentsTotal: 33 },
  { id: 'mgr_15', name: 'Finley Park', reps: 11, activeCalls: 3, closedToday: 3, closeRate: 35, revenue: 7485, appointmentsDone: 26, appointmentsTotal: 33 },
];

// ---------- 13. All 170 Reps ----------
const REP_FIRST_NAMES = [
  'Jake', 'Sarah', 'Chris', 'Danielle', 'Tyler', 'Marcus', 'Priya', 'Noah', 'Olivia', 'Ethan',
  'Sophia', 'Liam', 'Emma', 'Mason', 'Ava', 'Logan', 'Isabella', 'Lucas', 'Mia', 'Aiden',
  'Charlotte', 'James', 'Amelia', 'Benjamin', 'Harper', 'Elijah', 'Evelyn', 'William', 'Abigail', 'Henry',
  'Emily', 'Alexander', 'Ella', 'Sebastian', 'Scarlett', 'Jack', 'Grace', 'Owen', 'Chloe', 'Daniel',
  'Victoria', 'Michael', 'Riley', 'Julian', 'Aria', 'David', 'Luna', 'Leo', 'Zoey', 'Gabriel',
  'Nora', 'Samuel', 'Lily', 'Carter', 'Eleanor', 'Jayden', 'Hannah', 'Wyatt', 'Lillian', 'Matthew',
  'Addison', 'Luke', 'Aubrey', 'Asher', 'Ellie', 'Isaac', 'Stella', 'Levi', 'Natalie', 'Nathan',
  'Zoe', 'Caleb', 'Leah', 'Ryan', 'Hazel', 'Adrian', 'Violet', 'Lincoln', 'Aurora', 'Eli',
  'Savannah', 'Ian', 'Audrey', 'Connor', 'Brooklyn', 'Josiah', 'Bella', 'Cameron', 'Claire', 'Thomas',
  'Skylar', 'Dylan', 'Lucy', 'Landon', 'Paisley', 'Jonathan', 'Anna', 'Cooper', 'Caroline', 'Axel',
  'Genesis', 'Miles', 'Aaliyah', 'Robert', 'Kennedy', 'Jaxon', 'Kinsley', 'Grayson', 'Allison', 'Kai',
  'Maya', 'Hunter', 'Sarah', 'Angel', 'Madelyn', 'Jordan', 'Stella', 'Leo', 'Alice', 'Everett',
  'Hailey', 'Ezra', 'Eva', 'Nolan', 'Emilia', 'Ryder', 'Quinn', 'Antonio', 'Piper', 'Colton',
  'Ruby', 'Parker', 'Serenity', 'Xavier', 'Willow', 'Dominic', 'Jade', 'Carson', 'Peyton', 'Jason',
  'Rylee', 'Austin', 'Ivy', 'Declan', 'Sadie', 'Brooks', 'Maria', 'Easton', 'Valentina', 'Roman',
  'Reagan', 'Weston', 'Naomi', 'Maxwell', 'Sophie', 'Braxton', 'Camila', 'Jace', 'Elena', 'Miles',
  'Mila', 'Tristan', 'Nevaeh', 'Damian', 'Autumn', 'Harrison', 'Ariana', 'Tucker', 'Gianna', 'Hudson',
];

const REP_LAST_NAMES = [
  'Morrison', 'Kim', 'Lee', 'Cruz', 'Brooks', 'Johnson', 'Sharma', 'Williams', 'Davis', 'Garcia',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'White', 'Harris',
  'Thompson', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Hill',
  'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
  'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
  'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox',
  'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly',
  'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry',
  'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales',
  'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham',
  'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis',
  'Harrison', 'Gibson', 'Mcdonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman', 'Wells',
  'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd',
  'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw',
  'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols', 'Grant',
  'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer', 'Gardner',
  'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins',
];

const LEAD_SOURCES = ['LegalZoom', 'BTP', 'Organic', 'Referral', 'ZenBusiness', 'IncFile'];
const CALL_STAGES = ['Discovery', 'Discovery', 'Deductions', 'Deductions', 'Deductions', 'Structure', 'Pricing', 'Pricing', 'Closing'];
const BUSINESS_NAMES_POOL = [
  'Thompson Contracting', "Chen's Auto Repair", 'Patel Tech Solutions', 'Garcia Landscaping',
  'Wilson Photography', 'Lee Consulting Group', 'Johnson Plumbing', 'Davis Fitness Studio',
  'Martinez Construction', 'Anderson Design Co', 'Taylor Real Estate', 'Brown Bakery',
  'Miller Cleaning Services', 'Moore Marketing', 'White Dental Practice', 'Harris Law Firm',
  'Clark Electric', 'Lewis Roofing', 'Walker Painting', 'Hall Tutoring', 'Allen Catering',
  'Young Media Group', 'King Auto Sales', 'Wright Moving Co', 'Hill Accounting',
  'Scott Pet Grooming', 'Green Lawn Care', 'Adams IT Services', 'Baker Food Truck',
  'Nelson Home Staging', 'Carter Pool Service', 'Mitchell Yoga Studio', 'Perez Tile Work',
  'Roberts Insurance', 'Turner Web Design', 'Phillips HVAC', 'Campbell Security',
  'Evans Tree Service', 'Edwards Salon', 'Collins Daycare', 'Stewart Drywall',
  'Sanchez Trucking', 'Morris Event Planning',
];

// Generate 170 reps
export const allReps = Array.from({ length: 170 }, (_, i) => {
  const managerId = managers[i % managers.length].id;
  let status = 'idle';
  if (i < 42) status = 'on_call';
  else if (i < 45) status = 'just_closed';
  else if (i < 50) status = 'break';

  const firstName = REP_FIRST_NAMES[i % REP_FIRST_NAMES.length];
  const lastName = REP_LAST_NAMES[i % REP_LAST_NAMES.length];

  return {
    id: `rep_${String(i + 1).padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    managerId,
    managerName: managers[i % managers.length].name,
    status,
    // For active call reps, add call details
    ...(status === 'on_call' ? {
      leadName: BUSINESS_NAMES_POOL[i % BUSINESS_NAMES_POOL.length],
      currentSlide: Math.floor(5 + Math.random() * 30),
      totalSlides: 35,
      callDuration: Math.floor(300 + Math.random() * 1500),
      stage: CALL_STAGES[Math.floor(Math.random() * CALL_STAGES.length)],
      pacing: i < 5 ? 'critical' : i < 12 ? 'behind' : 'on_pace',
      leadSource: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)],
    } : {}),
    ...(status === 'just_closed' ? {
      lastClose: BUSINESS_NAMES_POOL[Math.floor(Math.random() * BUSINESS_NAMES_POOL.length)],
      closedAmount: Math.floor(2000 + Math.random() * 3000),
      closedAt: new Date(Date.now() - Math.random() * 1800000),
    } : {}),
  };
});

// ---------- 14. Completed Sessions with Scorecard Data (25) ----------
export const completedSessionsWithScorecard = Array.from({ length: 25 }, (_, i) => {
  const outcomes = ['closed', 'closed', 'closed', 'follow-up', 'follow-up', 'no-sale', 'no-sale', 'closed', 'follow-up', 'no-sale'];
  const outcome = outcomes[i % outcomes.length];
  const rep = allReps[i % allReps.length];
  const duration = Math.floor(1200 + Math.random() * 900);
  const slidesPresented = Math.floor(28 + Math.random() * 8);
  const discoveryAnswered = Math.floor(6 + Math.random() * 4);
  const flowScore = Math.floor(68 + Math.random() * 28);
  const objCount = Math.floor(Math.random() * 4);
  const savings = Math.floor(3500 + Math.random() * 5000);
  const price = outcome === 'closed' ? (2949 + Math.floor(Math.random() * 2000)) : (outcome === 'follow-up' ? 2949 : 0);

  return {
    id: `session_${String(i + 1).padStart(3, '0')}`,
    repId: rep.id,
    repName: rep.name,
    leadName: BUSINESS_NAMES_POOL[i % BUSINESS_NAMES_POOL.length],
    businessName: BUSINESS_NAMES_POOL[i % BUSINESS_NAMES_POOL.length],
    leadSource: LEAD_SOURCES[i % LEAD_SOURCES.length],
    date: new Date(Date.now() - i * 3600000 * 3),
    duration,
    outcome,
    totalSlides: 35,
    slidesPresented,
    discoveryAnswered,
    discoveryTotal: 9,
    flowScore,
    objectionsHandled: objCount,
    objectionTypes: ['Too expensive', 'Need to think', 'Have accountant', 'Spouse decides'].slice(0, objCount),
    coachTipsUsed: Math.floor(2 + Math.random() * 5),
    savingsPresented: savings,
    priceQuoted: price,
    roi: price > 0 ? Math.round((savings / price) * 10) / 10 : 0,
    overTime: duration > 1800,
    products: outcome === 'closed' ? [
      { name: 'Core Accounting Package', price: 2949, terms: i % 3 === 0 ? 'full' : '2-pay', perPayment: i % 3 === 0 ? 2949 : 1474.50 },
      ...(Math.random() > 0.5 ? [{ name: 'Bookkeeping Full Service', price: 1800, terms: 'full', perPayment: 1800 }] : []),
    ] : [],
    totalSale: outcome === 'closed' ? price : 0,
    paymentMethod: ['Visa', 'Mastercard', 'Amex', 'Discover'][i % 4],
    notInterestedReason: outcome === 'no-sale' ? ['No Money', 'Has Accountant', 'No Revenue', 'Going Local', 'Personal Only'][i % 5] : null,
    followUpDate: outcome === 'follow-up' ? new Date(Date.now() + (2 + Math.random() * 5) * 86400000).toISOString().split('T')[0] : null,
    followUpTemp: outcome === 'follow-up' ? ['Hot', 'Warm', 'Cold'][i % 3] : null,
    scorecard: {
      pacing: { elapsed: duration, target: 1800, status: duration <= 1800 ? 'on_time' : duration <= 1980 ? 'warning' : 'over_time' },
      flowScore,
      flowChecklist: [
        { label: 'Followed recommended slide path', status: Math.random() > 0.2 ? 'pass' : 'warn' },
        { label: 'Covered all required sections', status: Math.random() > 0.3 ? 'pass' : 'warn' },
        { label: 'Used the tax calculator', status: Math.random() > 0.35 ? 'pass' : 'fail' },
        { label: `Completed discovery (${discoveryAnswered}/9 questions)`, status: discoveryAnswered >= 8 ? 'pass' : 'warn' },
        { label: 'Skipped: Loan Agreement (optional)', status: 'skip' },
      ],
      engagement: {
        discoveryAnswered,
        discoveryTotal: 9,
        objectionsHandled: objCount,
        coachTipsUsed: Math.floor(2 + Math.random() * 5),
        savingsPresented: savings,
        priceQuoted: price,
        roi: price > 0 ? Math.round((savings / price) * 10) / 10 : 0,
      },
      slides: {
        presented: slidesPresented,
        total: 35,
        avgTimePerSlide: Math.round(duration / slidesPresented),
        longest: { slideNum: 5, title: 'Discovery', time: Math.floor(180 + Math.random() * 120) },
        fastest: { slideNum: 3, title: 'Trustpilot', time: Math.floor(12 + Math.random() * 15) },
      },
      aiSummary: outcome === 'closed'
        ? `Strong close. Rep effectively used the calculator to show $${savings.toLocaleString()}/yr in savings, which clearly resonated. Discovery was thorough at ${discoveryAnswered}/9. Consider spending more time on the structure section to reinforce the S-Corp election value.`
        : outcome === 'follow-up'
        ? `Solid consultation but lead needed time. Discovery was good at ${discoveryAnswered}/9. The ${price > 0 ? `$${price.toLocaleString()} quote` : 'pricing'} seemed to cause hesitation. Try addressing price anchoring earlier and emphasize the ROI comparison before revealing the investment.`
        : `Lead was not a fit. ${['Budget was the primary barrier', 'Already has an accountant they\'re satisfied with', 'No business revenue yet to justify the service', 'Prefers a local provider'][i % 4]}. Flow score of ${flowScore}% suggests ${flowScore >= 80 ? 'the rep handled it well despite the outcome' : 'some opportunities to improve engagement before reaching pricing'}.`,
    },
  };
});

// ---------- 15. Live Feed Events ----------
export const liveFeedEvents = [
  { time: '10:14 AM', type: 'close', text: 'Jake Morrison closed Thompson Contracting — $2,949' },
  { time: '10:12 AM', type: 'warning', text: 'Sarah Kim over time (32:15) with Chen\'s Auto' },
  { time: '10:08 AM', type: 'progress', text: 'Danielle Cruz moved to pricing with Patel Tech' },
  { time: '10:05 AM', type: 'new', text: 'New appointment: Tyler Brooks assigned to Chris Lee' },
  { time: '10:01 AM', type: 'insight', text: '3 reps skipped the calculator today' },
  { time: '9:58 AM', type: 'close', text: 'Marcus Johnson closed Garcia Landscaping — $4,749' },
  { time: '9:55 AM', type: 'warning', text: 'Noah Williams over time (31:42) with Wilson Photography' },
  { time: '9:52 AM', type: 'progress', text: 'Priya Sharma entered closing phase with Lee Consulting' },
  { time: '9:48 AM', type: 'close', text: 'Olivia Davis closed Martinez Construction — $2,949' },
  { time: '9:45 AM', type: 'new', text: 'Walk-in: Sophia Rodriguez assigned to Jordan Fischer' },
  { time: '9:41 AM', type: 'progress', text: 'Ethan Garcia reached pricing with Anderson Design' },
  { time: '9:38 AM', type: 'insight', text: 'LegalZoom leads converting at 41% today (above avg)' },
  { time: '9:35 AM', type: 'close', text: 'Liam Martinez closed Taylor Real Estate — $3,749' },
  { time: '9:30 AM', type: 'warning', text: 'Emma Anderson took 4:22 on discovery slide (avg: 2:10)' },
  { time: '9:27 AM', type: 'new', text: 'New appointment: Mason Taylor assigned to Avery Thompson' },
  { time: '9:22 AM', type: 'close', text: 'Ava Thomas closed Brown Bakery — $2,949' },
  { time: '9:18 AM', type: 'progress', text: 'Logan Moore showing calculator to Miller Cleaning Services' },
  { time: '9:15 AM', type: 'insight', text: 'BTP leads closing at 48% this week — highest source' },
  { time: '9:10 AM', type: 'close', text: 'Isabella Jackson closed White Dental Practice — $4,749' },
  { time: '9:05 AM', type: 'new', text: 'Shift start: 42 reps online, 68 appointments scheduled until noon' },
];

// ---------- 16. Revenue Mock Data ----------
export const revenueData = {
  today: { amount: 37485, deals: 15, trend: 8, label: 'vs yesterday' },
  week: { amount: 148920, deals: 62, trend: 3, label: 'vs last week' },
  month: { amount: 547200, deals: 219, trend: 12, target: 740000, label: 'March' },
  quarter: { amount: 1641600, deals: 657, trend: 7, target: 2000000, label: 'Q1' },
};

// ---------- 17. Floor Status ----------
export const floorStatus = {
  repsOnCalls: 42,
  totalReps: 170,
  byStage: {
    Discovery: 12,
    Deductions: 18,
    Structure: 4,
    Pricing: 5,
    Closing: 3,
  },
  dailyPacing: {
    completed: 387,
    total: 1020,
    noShows: 12,
    projected: 1008,
    startHour: 8,
    endHour: 18,
    currentHour: 10.5,
  },
};

// ---------- 18. AI Daily Briefing ----------
export const aiDailyBriefing = "Today's pace is 8% above yesterday with 15 closes by 10:30 AM. The team is converting LegalZoom leads at 41% this week, up from 36% last week \u2014 likely driven by the calculator adoption push. Watch: 4 reps have gone over 30 minutes on 3+ calls this week (Sarah Kim, Noah Williams, Mason Taylor, Logan Moore). Opportunity: BTP leads are closing at 48% but only represent 12% of volume. Increasing BTP allocation by 20% could add ~$18,400/month in revenue.";
