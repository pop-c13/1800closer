const slides = [
  {
    id: 1,
    title: "Hello / Welcome",
    subtitle: null,
    category: "Welcome",
    layout: "hero",
    required: true,
    bgGradient: "from-brand-orange to-orange-600",
    bigText: "Welcome!",
    notes:
      "Hi [LEAD_FIRST_NAME], I'm [REP_NAME] with 1-800Accountant. Thanks for joining today! Before we begin, I want to let you know this call may be recorded for quality purposes. Is that okay? Great! Are you the sole owner of [BUSINESS_NAME], or is there a spouse or partner who should be included?\n\n" +
      "Lead Source Variants:\n\n" +
      "LegalZoom: \"I see you came through LegalZoom \u2014 smart move getting things set up properly.\"\n\n" +
      "Tax Hotline: \"I see you called into our tax hotline \u2014 sounds like you have some questions we can help with.\"\n\n" +
      "BTP: \"I see you're part of our Business Tax Prep program \u2014 let's make sure you're getting the most out of that.\""
  },
  {
    id: 2,
    title: "America's Leading Virtual Accounting Firm",
    subtitle: null,
    category: "Trust",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Since 2010",
        "Largest in the US",
        "All 50 states",
        "CPAs & EAs with 17 years avg experience"
      ]
    },
    rightContent: {
      type: "logos",
      items: ["Entrepreneur", "Forbes", "NYT", "WSJ"]
    },
    notes:
      "So [LEAD_FIRST_NAME], let me tell you a little about who we are. 1-800Accountant has been around since 2010. We're the largest virtual accounting firm in the country, serving clients in all 50 states. Our team is made up of licensed CPAs and Enrolled Agents with an average of 17 years of experience. We've been featured in Entrepreneur, Forbes, The New York Times, and The Wall Street Journal. You're in great hands."
  },
  {
    id: 3,
    title: "Trustpilot",
    subtitle: null,
    category: "Trust",
    layout: "stats",
    required: true,
    stats: [
      { value: "4.6", label: "Star Rating" },
      { value: "10K+", label: "Reviews" },
      { value: "92%", label: "Customer Satisfaction" }
    ],
    notes:
      "And don't just take my word for it \u2014 we have over 10,000 reviews on Trustpilot with a 4.6-star rating. That's a 92% customer satisfaction rate. Our clients love us because we deliver real results."
  },
  {
    id: 4,
    title: "100K+ Business Owners",
    subtitle: null,
    category: "Trust",
    layout: "stats",
    required: true,
    stats: [
      { value: "100K+", label: "Clients Served" },
      { value: "~40%", label: "Partner Savings" },
      { value: "#1", label: "Virtual Accounting Firm" }
    ],
    notes:
      "Over 100,000 business owners have trusted us to handle their taxes and accounting. Smart move going through [LEAD_SOURCE] \u2014 because of that partnership, you qualify for about 40% off what you'd normally pay for these services. My job today is to make sure we maximize that value for [BUSINESS_NAME]."
  },
  {
    id: 5,
    title: "Business Discovery",
    subtitle: null,
    category: "Discovery",
    layout: "split",
    required: true,
    hasDiscovery: true,
    leftContent: {
      heading: "Three Pillars of Business Setup",
      bullets: [
        "Register your business properly",
        "Set up proper accounting",
        "Open a business bank account"
      ]
    },
    rightContent: {
      type: "discovery"
    },
    notes:
      "Now [LEAD_FIRST_NAME], before I show you everything we can do for you, I need to learn a bit about your situation. Every business has three pillars they need to get right from the start: registering properly, setting up proper accounting, and opening a business bank account.\n\nUse the discovery form below to capture answers as you go."
  },
  {
    id: 6,
    title: "Your LLC and Personal Taxes",
    subtitle: null,
    category: "Tax Education",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Your LLC is a 'pass-through' entity",
        "Business income flows to YOUR personal tax return",
        "Business and personal taxes are connected",
        "This is actually a good thing \u2014 here's why..."
      ]
    },
    rightContent: {
      type: "icon",
      icon: "FileText"
    },
    notes:
      "Great, thanks for sharing all of that, [LEAD_FIRST_NAME]. Now let me explain something important about how your LLC works.\n\n" +
      "Your LLC is what's called a pass-through entity. That means the business income literally passes through to your personal tax return. Your business and personal taxes are directly connected.\n\n" +
      "Now, that might sound complicated, but it's actually a really good thing \u2014 because it means we can use strategies on the business side to save you money on the personal side. Let me show you what I mean..."
  },
  {
    id: 7,
    title: "Flow-Through Entity",
    subtitle: null,
    category: "Tax Education",
    layout: "flow",
    required: true,
    steps: [
      { title: "Business Revenue", description: "$90,000", color: "bg-brand-orange" },
      { title: "W-2 Income", description: "$80,000", color: "bg-brand-blue" },
      { title: "Business Loss", description: "-$10,000", color: "bg-red-500" },
      { title: "Taxable Income", description: "$70,000", color: "bg-green-500" }
    ],
    notes:
      "Here's a simple example. Let's say your business brings in $90,000, but you also have a W-2 job paying $80,000. Now let's say your business had $10,000 in legitimate losses \u2014 startup costs, expenses, things like that.\n\n" +
      "Because your LLC is a pass-through entity, that $10,000 business loss can offset your W-2 income. So instead of being taxed on $80,000, you're taxed on $70,000. That's called a paper loss strategy, and it's 100% legal when done correctly.\n\n" +
      "(If applicable) This is especially powerful in your first year or two of business."
  },
  {
    id: 8,
    title: "Deductions",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Reduce your taxable income",
        "The IRS requires proper documentation",
        "Most business owners miss deductions they're entitled to",
        "We make sure you capture every dollar"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Receipt"
    },
    notes:
      "[LEAD_FIRST_NAME], one of the biggest advantages of having a business is being able to take deductions. Deductions reduce your taxable income, which means you pay less in taxes.\n\n" +
      "But here's the thing \u2014 the IRS requires proper documentation for every deduction. Most business owners either miss deductions they're entitled to, or they take deductions they can't properly support.\n\n" +
      "Have you been tracking your business expenses? That's okay \u2014 that's exactly what we're here for. Let me show you some of the deductions you may qualify for..."
  },
  {
    id: 9,
    title: "Startup & Organizational Costs",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Up to $5,000 in startup costs \u2014 Year 1",
        "Up to $5,000 in organizational costs \u2014 Year 1",
        "Website, marketing, education, supplies",
        "These are deductions most new owners miss"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Rocket"
    },
    notes:
      "First up \u2014 startup and organizational costs. In your first year of business, you can deduct up to $5,000 in startup costs AND up to $5,000 in organizational costs. That's potentially $10,000 right off the bat.\n\n" +
      "This includes things like your website, marketing, business education, supplies \u2014 all the money you've already spent getting [BUSINESS_NAME] off the ground. A lot of new business owners don't realize they can write this off. We make sure you don't miss a penny."
  },
  {
    id: 10,
    title: "Loan Agreement",
    subtitle: null,
    category: "Deductions",
    layout: "list",
    required: false,
    items: [
      "Lend money to your business from personal funds",
      "Charge your business interest on the loan",
      "Write off the interest as a business expense",
      "Avoid double taxation on money moving between accounts",
      "Must be properly documented with a formal loan agreement"
    ],
    notes:
      "Now here's a strategy most people don't know about. If you've put personal money into your business \u2014 and it sounds like you have \u2014 we can set up a formal loan agreement between you and [BUSINESS_NAME].\n\n" +
      "You can actually charge your business interest on that loan, and the interest becomes a tax-deductible business expense. Plus, it helps you avoid double taxation when you're moving money between your personal and business accounts.\n\n" +
      "The key is proper documentation. We set up the formal agreement so everything is IRS-compliant."
  },
  {
    id: 11,
    title: "Vehicle Deductions",
    subtitle: null,
    category: "Deductions",
    layout: "comparison",
    required: true,
    columns: [
      {
        title: "Actual Expense Method",
        items: [
          "Gas & oil",
          "Insurance",
          "Repairs & maintenance",
          "Depreciation",
          "Lease payments",
          "Business % of total use"
        ]
      },
      {
        title: "Standard Mileage",
        items: [
          "$0.725 per mile (2025)",
          "Simple tracking",
          "Locked in for life of vehicle",
          "Great for newer vehicles",
          "Use our mobile app to track"
        ]
      }
    ],
    notes:
      "[LEAD_FIRST_NAME], do you use a vehicle for business at all? Even driving to meet clients, going to the bank, picking up supplies \u2014 that all counts.\n\n" +
      "There are two methods for vehicle deductions. The Actual Expense Method, where you deduct gas, insurance, repairs, depreciation \u2014 the business percentage of your total vehicle costs. Or the Standard Mileage Rate \u2014 which is 72.5 cents per mile for 2025.\n\n" +
      "Here's the important thing: whichever method you choose for a vehicle, you're generally locked in for the life of that vehicle. So we want to make sure we pick the right one. Our mobile app makes it super easy to track your mileage automatically."
  },
  {
    id: 12,
    title: "Many Possible Deductions",
    subtitle: null,
    category: "Deductions",
    layout: "list",
    required: true,
    items: [
      "Advertising & Marketing",
      "Bank Fees",
      "Business Insurance",
      "Business Meals (50%)",
      "Cell Phone (business %)",
      "Client Gifts (up to $25)",
      "Cloud Storage & Software",
      "Continuing Education",
      "Contract Labor",
      "Depreciation",
      "Equipment & Supplies",
      "Health Insurance Premiums",
      "Home Office",
      "Interest on Business Loans",
      "Internet (business %)",
      "Legal & Professional Fees",
      "Licenses & Permits",
      "Mileage / Vehicle Expenses",
      "Office Rent",
      "Office Supplies",
      "Parking & Tolls",
      "Payroll Expenses",
      "Postage & Shipping",
      "Professional Development",
      "Professional Memberships",
      "Repairs & Maintenance",
      "Retirement Contributions",
      "Shipping & Delivery",
      "Software Subscriptions",
      "Startup Costs",
      "Taxes & Licenses",
      "Tools & Equipment",
      "Trade Publications",
      "Travel Expenses",
      "Uniforms & Work Clothing",
      "Utilities (business %)",
      "Website Hosting & Domain"
    ],
    notes:
      "And [LEAD_FIRST_NAME], this is just a snapshot of the many deductions available to business owners. From advertising to website hosting \u2014 there are dozens of potential write-offs.\n\n" +
      "The challenge is knowing which ones apply to you, how to document them properly, and making sure you don't miss any. That's where our team of experienced CPAs and Enrolled Agents really shines. We go through your entire situation to make sure we're capturing every legitimate deduction."
  },
  {
    id: 13,
    title: "Home Office Deduction",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "Simplified method: $5/sq ft, up to 300 sq ft",
        "Maximum deduction: $1,500/year",
        "Must be used regularly and exclusively for business",
        "Applies to homeowners AND renters",
        "Can also deduct portion of utilities, insurance, repairs"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Home"
    },
    notes:
      "Do you work from home at all, [LEAD_FIRST_NAME]? If you have a dedicated space \u2014 even a corner of a room \u2014 that you use regularly and exclusively for business, you can take the home office deduction.\n\n" +
      "The simplified method is $5 per square foot, up to 300 square feet. That's up to $1,500 a year just for having a home office. And this works whether you own or rent.\n\n" +
      "You can also potentially deduct a portion of your utilities, internet, and even home insurance. We'll figure out which method saves you the most."
  },
  {
    id: 14,
    title: "Health Insurance Premiums",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "100% deductible for self-employed",
        "Covers you, your spouse, and dependents",
        "Average savings: $400+/month",
        "Includes medical, dental, vision, and long-term care",
        "One of the most valuable deductions for business owners"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Heart"
    },
    notes:
      "[LEAD_FIRST_NAME], are you paying for your own health insurance? As a self-employed business owner, you can deduct 100% of your health insurance premiums. That covers you, your spouse, and your dependents.\n\n" +
      "We're talking medical, dental, vision, even long-term care. The average self-employed person pays over $400 a month \u2014 that's nearly $5,000 a year you could be writing off. This is one of the most valuable deductions available, and a lot of people miss it."
  },
  {
    id: 15,
    title: "Section 199A \u2014 QBI Deduction",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "Qualified Business Income Deduction",
        "Deduct up to 20% of your business income",
        "Available to pass-through entities (LLCs, S-Corps)",
        "Subject to income thresholds",
        "Our team ensures you maximize this deduction"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "TrendingUp"
    },
    notes:
      "Here's one a lot of business owners don't know about \u2014 the Section 199A deduction, also called the Qualified Business Income deduction or QBI.\n\n" +
      "This allows you to deduct up to 20% of your qualified business income right off the top. So if [BUSINESS_NAME] earns $100,000, you could potentially deduct $20,000 before anything else.\n\n" +
      "There are income thresholds and rules, which is why having a knowledgeable CPA is so important. Our team makes sure you're taking full advantage of this."
  },
  {
    id: 16,
    title: "Retirement Contributions",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "SEP IRA: Up to 25% of net earnings (max ~$69K)",
        "Solo 401(k): Employee + employer contributions",
        "SIMPLE IRA: For businesses with employees",
        "Contributions are tax-deductible",
        "Build wealth while reducing your tax bill"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "PiggyBank"
    },
    notes:
      "[LEAD_FIRST_NAME], are you contributing to any retirement accounts? As a business owner, you have access to retirement plans that most W-2 employees can only dream of.\n\n" +
      "A SEP IRA lets you contribute up to 25% of your net earnings \u2014 potentially over $60,000 a year. A Solo 401(k) lets you make both employee and employer contributions. And every dollar you contribute is tax-deductible.\n\n" +
      "You're literally building wealth while reducing your tax bill. It's one of the smartest moves you can make."
  },
  {
    id: 17,
    title: "Education & Training",
    subtitle: null,
    category: "Deductions",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "Courses and certifications",
        "Seminars and conferences",
        "Books and publications",
        "Online training platforms",
        "Must be related to your current business"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "GraduationCap"
    },
    notes:
      "Are you investing in any training or education for your business? Courses, certifications, conferences, books \u2014 all of that can be deductible as long as it's related to [BUSINESS_NAME].\n\n" +
      "The key is that it needs to maintain or improve skills for your current business. Our team will help you determine exactly what qualifies."
  },
  {
    id: 18,
    title: "Business Structure",
    subtitle: null,
    category: "Entity Structure",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Your entity structure determines how you're taxed",
        "The right structure can save you thousands",
        "Most new LLCs are taxed the worst way possible",
        "We're going to fix that for you"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Building2"
    },
    notes:
      "Alright [LEAD_FIRST_NAME], now let's talk about something that could save you the most money \u2014 your business structure.\n\n" +
      "Your entity structure determines how the IRS taxes you. And here's the thing \u2014 most new LLCs are automatically taxed as sole proprietorships, which is the worst possible setup from a tax perspective.\n\n" +
      "Let me ask you \u2014 what's your biggest concern when it comes to taxes?\n(pause for answer)\n\n" +
      "Great, let me show you exactly why your current structure might be costing you, and what we can do about it."
  },
  {
    id: 19,
    title: "Entity Classification Election",
    subtitle: null,
    category: "Entity Structure",
    layout: "split",
    required: true,
    bigNumber: "75",
    leftContent: {
      bullets: [
        "75-day window from formation to elect S-Corp status",
        "IRS auto-classifies you as a sole proprietorship",
        "S-Corp election can save thousands in self-employment tax",
        "Miss the window = wait until next tax year",
        "We handle the entire election process"
      ]
    },
    rightContent: {
      type: "bigNumber",
      value: "75",
      label: "Days"
    },
    notes:
      "[LEAD_FIRST_NAME], this is critical. From the date your LLC was formed \u2014 [FORMATION_DATE] \u2014 you have a 75-day window to make what's called an Entity Classification Election.\n\n" +
      "If you don't make this election within 75 days, the IRS automatically classifies your LLC as a sole proprietorship. That means you pay the maximum self-employment tax on every dollar.\n\n" +
      "But if we elect S-Corp status within that window, we can save you thousands. Miss the deadline, and you typically have to wait until the next tax year.\n\n" +
      "This is one of the biggest reasons to act now, not later."
  },
  {
    id: 20,
    title: "Self-Employment Tax (FICA)",
    subtitle: null,
    category: "Entity Structure",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "15.3% self-employment tax on ALL net income",
        "12.4% Social Security + 2.9% Medicare",
        "This is ON TOP of federal, state, and local income taxes",
        "Without proper structure, you pay this on every dollar",
        "S-Corp election can dramatically reduce this"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "AlertTriangle"
    },
    notes:
      "Here's the painful part, [LEAD_FIRST_NAME]. Without the right structure, you're paying 15.3% in self-employment tax on ALL of your net business income. That's 12.4% for Social Security and 2.9% for Medicare.\n\n" +
      "And this is on TOP of your regular federal and state income taxes. So if you make $100,000 in your business, you're paying over $15,000 just in self-employment tax alone. That's before your income taxes even kick in.\n\n" +
      "But with the right entity election... let me show you the difference."
  },
  {
    id: 21,
    title: "More Money in Your Pocket",
    subtitle: null,
    category: "Entity Structure",
    layout: "savings",
    required: true,
    dynamic: true,
    notes:
      "Look at this, [LEAD_FIRST_NAME]. On the left \u2014 without the entity election \u2014 you're paying the full 15.3% self-employment tax on everything. That's a big number.\n\n" +
      "On the right \u2014 with the proper S-Corp election \u2014 we set a reasonable salary and you only pay self-employment tax on that salary, not on the entire amount.\n\n" +
      "The difference? That's money back in your pocket every single year. And it compounds \u2014 we're talking about real, significant savings that add up over the life of your business.\n\n" +
      "This is exactly what our team sets up for you."
  },
  {
    id: 22,
    title: "Planning for Success",
    subtitle: null,
    category: "Pricing",
    layout: "hero",
    required: true,
    bgGradient: "from-brand-blue to-blue-600",
    bigText: "Your Investment",
    notes:
      "[LEAD_FIRST_NAME], so far we've covered your deductions, your entity structure, and the potential savings. Now let me show you exactly what's included when you partner with us, and how much it would normally cost to get all of this done."
  },
  {
    id: 23,
    title: "Traditional Accounting Costs",
    subtitle: null,
    category: "Pricing",
    layout: "data",
    required: true,
    rows: [
      { label: "Tax Consultations", value: "$200\u2013$400/hr" },
      { label: "Bookkeeping Setup", value: "$1,200/yr" },
      { label: "Tax Return Preparation", value: "$1,500/yr" },
      { label: "Entity Election & Compliance", value: "$1,000+" },
      { label: "Ongoing Advisory", value: "$300\u2013$800/hr" },
      { label: "TOTAL (Traditional CPA)", value: "$7,000\u2013$9,000/yr" }
    ],
    notes:
      "If you went to a traditional CPA firm and got all of these services individually, here's what you'd be looking at. Tax consultations alone run $200 to $400 per hour. Bookkeeping setup, tax return prep, entity election, ongoing advisory \u2014 when you add it all up, you're looking at $7,000 to $9,000 a year.\n\n" +
      "And that's if you can even find a CPA who's available \u2014 most firms are overwhelmed and have waitlists. Now let me show you what you get with us..."
  },
  {
    id: 24,
    title: "1-800Accountant",
    subtitle: null,
    category: "Pricing",
    layout: "data",
    required: true,
    showPrice: true,
    rows: [
      { label: "Tax Advisory & Planning", value: "Included" },
      { label: "Tax Return Preparation", value: "Included" },
      { label: "Bookkeeping Software", value: "Included" },
      { label: "Entity Classification Election", value: "Included" },
      { label: "Quarterly Estimated Taxes", value: "Included" },
      { label: "Dedicated Team of Experts", value: "Included" },
      { label: "Year-Round Support", value: "Included" }
    ],
    notes:
      "With 1-800Accountant, you get ALL of this \u2014 tax advisory, tax prep, bookkeeping software, entity election, quarterly estimates, a dedicated team, year-round support \u2014 everything bundled together.\n\n" +
      "And because you came through [LEAD_SOURCE], your partner price is [PRICE] per year. That's roughly 40% less than what traditional firms charge.\n\n" +
      "Let that sink in \u2014 comprehensive tax and accounting services, with experienced CPAs and EAs, for a fraction of what you'd pay elsewhere."
  },
  {
    id: 25,
    title: "Prior Year Tax Analysis",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Prior Year Tax Analysis",
    mockContent: "Dashboard showing past tax returns with identified missed deductions and amendment opportunities",
    notes:
      "Now let me show you exactly what you get from Day 1. First \u2014 we do a Prior Year Tax Analysis. Our team reviews your previous tax returns to identify any deductions you may have missed. If we find savings, we can file an amendment and potentially get you money back. [LEAD_FIRST_NAME], this alone has saved some clients thousands of dollars."
  },
  {
    id: 26,
    title: "Tax Plan",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Custom Tax Plan",
    mockContent: "Personalized tax strategy document with projected savings, quarterly milestones, and action items",
    notes:
      "Next, we build your custom Tax Plan. This is a personalized strategy for [BUSINESS_NAME] that outlines exactly how we'll minimize your tax burden this year. It includes projected savings, quarterly milestones, and specific action items. This is your roadmap to keeping more of what you earn."
  },
  {
    id: 27,
    title: "Engagement Plan",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Engagement Plan",
    mockContent: "Timeline view showing onboarding steps, key dates, filing deadlines, and meeting schedule",
    notes:
      "Your Engagement Plan maps out our entire working relationship. Key dates, filing deadlines, when we'll meet, what we need from you and when. No surprises, no missed deadlines. Everything is laid out clearly so you always know what's happening."
  },
  {
    id: 28,
    title: "Business Plan",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Business Plan",
    mockContent: "Professional business plan with financial projections, growth strategy, and market analysis",
    notes:
      "We also put together a Business Plan for [BUSINESS_NAME]. This includes financial projections, growth strategy insights, and practical recommendations based on your industry and goals. Whether you need it for a loan, investors, or just your own planning \u2014 this is a valuable document to have."
  },
  {
    id: 29,
    title: "Progress Reports",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Progress Reports",
    mockContent: "Quarterly report showing P&L, tax projection updates, savings realized, and upcoming tasks",
    notes:
      "Throughout the year, you'll receive Progress Reports \u2014 quarterly updates showing your profit and loss, updated tax projections, savings realized so far, and what's coming up next. You'll never be left wondering where you stand financially."
  },
  {
    id: 30,
    title: "Year-Round Access",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Year-Round Portal Access",
    mockContent: "Portal home screen showing secure document vault, team messaging, and appointment scheduling",
    notes:
      "[LEAD_FIRST_NAME], and all of this lives in your secure client portal. You have year-round access to your documents, your team, and all your deliverables. You can message your team, schedule appointments, upload documents \u2014 everything in one place. This isn't seasonal tax prep. We're with you all year long."
  },
  {
    id: 31,
    title: "Communication Center",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Communication Center",
    mockContent: "Messaging interface with team chat, file sharing, and notification center",
    notes:
      "Our Communication Center makes it easy to stay in touch with your team. You can send messages, share files, and get notifications whenever something needs your attention. No more playing phone tag with your accountant."
  },
  {
    id: 32,
    title: "ClientBooks Software",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "ClientBooks",
    mockContent: "Bookkeeping dashboard showing income, expenses, categorized transactions, and bank connections",
    notes:
      "You also get access to ClientBooks, our bookkeeping software. It connects to your bank accounts and credit cards, automatically categorizes transactions, and keeps your books organized. You can see your income, expenses, and financial health at a glance. And your accounting team has access too, so we're always on the same page."
  },
  {
    id: 33,
    title: "Invoicing",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Invoicing",
    mockContent: "Invoice creation screen with professional templates, payment tracking, and client management",
    notes:
      "Need to send invoices? We've got you covered. Create professional invoices, track payments, manage clients \u2014 all built right into the platform. No need for separate invoicing software."
  },
  {
    id: 34,
    title: "Mobile App",
    subtitle: null,
    category: "Deliverables",
    layout: "portal",
    required: true,
    feature: "Mobile App",
    mockContent: "Mobile app screenshots showing mileage tracking, receipt scanner, and messaging",
    notes:
      "And everything is available on our mobile app. Track mileage automatically, scan receipts on the go, message your team \u2014 all from your phone. It makes staying on top of your business finances effortless."
  },
  {
    id: 35,
    title: "Mobile App Features",
    subtitle: null,
    category: "Deliverables",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "Track mileage automatically with GPS",
        "Message your team instantly",
        "Scan and store receipts",
        "View your financial dashboard",
        "Available on iOS and Android"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Smartphone"
    },
    notes:
      "[LEAD_FIRST_NAME], the mobile app is a game-changer. Track your mileage automatically \u2014 just start driving and the app logs it. Scan receipts right from your phone. Message your team anytime. Check your financial dashboard. It's all right there in your pocket, available on both iPhone and Android."
  },
  {
    id: 36,
    title: "Your Team of Experts",
    subtitle: null,
    category: "Deliverables",
    layout: "team",
    required: true,
    members: [
      { role: "Business Advisor", title: "Your main point of contact \u2014 guides strategy and answers questions" },
      { role: "Tax Analyst", title: "Prepares your returns and identifies every deduction" },
      { role: "Accountant", title: "Manages your books and financial reporting" },
      { role: "Payroll Specialist", title: "Add-on: Handles payroll processing and compliance" },
      { role: "Bookkeeper", title: "Add-on: Full-service bookkeeping and reconciliation" }
    ],
    notes:
      "When you join, you get a dedicated team \u2014 not just one person, a whole team. Your Business Advisor is your main point of contact for strategy and questions. Your Tax Analyst prepares your returns and finds every deduction. Your Accountant manages your books.\n\n" +
      "And if you need it, we can add a Payroll Specialist and a full-service Bookkeeper. You'll have an entire accounting department, without the overhead."
  },
  {
    id: 37,
    title: "100% Tax Deductible!",
    subtitle: null,
    category: "Pricing",
    layout: "hero",
    required: true,
    bgGradient: "from-green-500 to-emerald-600",
    bigText: "100% Tax Deductible",
    notes:
      "[LEAD_FIRST_NAME], and here's the cherry on top \u2014 your entire investment with us is 100% tax deductible. That's right \u2014 you can write off the entire amount as a business expense. So when you factor in the deduction, the savings from your entity election, and all the other deductions we'll find \u2014 this practically pays for itself. And remember, with your partner pricing, you're already saving about 40% compared to traditional firms."
  },
  {
    id: 38,
    title: "Complete Tax & Business Advisory Bundle",
    subtitle: null,
    category: "Close",
    layout: "bundle",
    required: true,
    columns: [
      {
        title: "Tax Preparation",
        items: [
          "Federal & State Returns",
          "Prior Year Review",
          "Amendment Filing",
          "Quarterly Estimates"
        ],
        price: "Included"
      },
      {
        title: "Advisory Services",
        items: [
          "Entity Election",
          "Tax Planning",
          "Business Advisory",
          "Year-Round Support"
        ],
        price: "Included"
      },
      {
        title: "Software & Tools",
        items: [
          "ClientBooks",
          "Invoicing",
          "Mobile App",
          "Document Vault"
        ],
        price: "Included"
      }
    ],
    notes:
      "[LEAD_FIRST_NAME], let me bring it all together. You're getting tax preparation, advisory services, and all our software and tools \u2014 everything we've talked about today \u2014 bundled together at your partner price.\n\n" +
      "So here's what I'd like to do. Let me confirm a few details:\n" +
      "- Best phone number? (confirm)\n" +
      "- Best email address? (confirm)\n" +
      "- And the address for [BUSINESS_NAME]? (confirm)\n\n" +
      "Great. The investment is [PRICE], and remember \u2014 100% tax deductible. Would you like to get started today with a card on file?\n\n" +
      "(If full payment): Perfect, and we do accept Visa, Mastercard, American Express, and Discover.\n" +
      "(If payment plan): No problem \u2014 we can break that into monthly payments to make it easy."
  },
  {
    id: 39,
    title: "Congratulations!",
    subtitle: null,
    category: "Close",
    layout: "hero",
    required: true,
    bgGradient: "from-brand-orange to-yellow-500",
    bigText: "Welcome Aboard!",
    notes:
      "Congratulations, [LEAD_FIRST_NAME]! Welcome to the 1-800Accountant family. You've made a really smart decision for [BUSINESS_NAME].\n\n" +
      "Here's what happens next \u2014 within the next 24 hours, you'll receive three emails: a welcome email with your portal login, an appointment confirmation for your first strategy meeting with your team, and your invoice.\n\n" +
      "Take a deep breath \u2014 you're in great hands now. Your first meeting will be with your Business Advisor, and they'll start building your tax plan right away."
  },
  {
    id: 40,
    title: "Let's Get Started Today",
    subtitle: null,
    category: "Close",
    layout: "flow",
    required: true,
    steps: [
      { title: "Upload Documents", description: "Tax returns, formation docs, ID", color: "bg-brand-orange" },
      { title: "Meet Your Team", description: "First strategy call within 5 days", color: "bg-brand-blue" },
      { title: "Get Your Tax Plan", description: "Custom plan within 2 weeks", color: "bg-green-500" }
    ],
    notes:
      "Here's your onboarding roadmap. Step 1: Upload your documents through the portal \u2014 things like prior tax returns, formation documents, and ID. Step 2: You'll meet your team \u2014 your first strategy call will be within 5 business days. Step 3: Within about two weeks, you'll have your custom tax plan ready.\n\n" +
      "It's a simple, smooth process. We guide you every step of the way."
  },
  {
    id: 41,
    title: "Thank You",
    subtitle: null,
    category: "Close",
    layout: "hero",
    required: true,
    bgGradient: "from-gray-700 to-gray-900",
    bigText: "Thank You!",
    notes:
      "[LEAD_FIRST_NAME], thank you so much for your time today. I really enjoyed learning about [BUSINESS_NAME] and I'm excited for what's ahead.\n\n" +
      "You'll be receiving a quick survey after this call \u2014 I'd really appreciate your feedback, it helps me get better at what I do.\n\n" +
      "If you have any questions before your first meeting, don't hesitate to reach out. Welcome aboard, and congratulations again!"
  },
  {
    id: 42,
    title: "Bookkeeping Services",
    subtitle: null,
    category: "Bookkeeping Add-On",
    layout: "section",
    required: false,
    dividerText: "BOOKKEEPING ADD-ON",
    notes:
      "Now [LEAD_FIRST_NAME], I want to tell you about our bookkeeping add-on. This is for business owners who want us to handle everything \u2014 not just the tax side, but your day-to-day books as well."
  },
  {
    id: 43,
    title: "Full-Service Bookkeeping",
    subtitle: null,
    category: "Bookkeeping Add-On",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "Dedicated bookkeeper assigned to your account",
        "Monthly reconciliation of all accounts",
        "Categorization of all transactions",
        "Financial statements prepared monthly",
        "QuickBooks or Xero integration"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "BookOpen"
    },
    notes:
      "With our full-service bookkeeping, you get a dedicated bookkeeper assigned to [BUSINESS_NAME]. They'll reconcile all your accounts monthly, categorize every transaction, and prepare your financial statements. It integrates with QuickBooks and Xero, so if you're already using those platforms, we work right alongside them."
  },
  {
    id: 44,
    title: "What We Do vs. What You Get",
    subtitle: null,
    category: "Bookkeeping Add-On",
    layout: "comparison",
    required: false,
    columns: [
      {
        title: "What We Handle",
        items: [
          "Bank & credit card reconciliation",
          "Transaction categorization",
          "Accounts payable & receivable",
          "Monthly financial statements",
          "Year-end preparation"
        ]
      },
      {
        title: "What You Get",
        items: [
          "Clean, accurate books",
          "Real-time financial visibility",
          "Tax-ready records at year-end",
          "Peace of mind",
          "More time to focus on your business"
        ]
      }
    ],
    notes:
      "Here's the breakdown. On the left \u2014 everything we handle behind the scenes. On the right \u2014 what that means for you. Clean books, real-time visibility into your finances, tax-ready records, peace of mind, and most importantly \u2014 more time to focus on running [BUSINESS_NAME]. No more shoebox of receipts or spreadsheets."
  },
  {
    id: 45,
    title: "Our Partners",
    subtitle: null,
    category: "Bookkeeping Add-On",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "QuickBooks Online integration",
        "Xero integration",
        "Automatic bank feeds",
        "Real-time sync with your accounts",
        "Your bookkeeper manages it all"
      ]
    },
    rightContent: {
      type: "logos",
      items: ["QuickBooks", "Xero"]
    },
    notes:
      "We integrate with the industry leaders \u2014 QuickBooks Online and Xero. Automatic bank feeds, real-time sync, and your dedicated bookkeeper manages everything. You don't have to learn the software \u2014 we handle it for you."
  },
  {
    id: 46,
    title: "Payroll Services",
    subtitle: null,
    category: "Payroll Add-On",
    layout: "section",
    required: false,
    dividerText: "PAYROLL ADD-ON",
    notes:
      "Let me also tell you about our payroll services, [LEAD_FIRST_NAME]. This is especially important if you're going with the S-Corp election, because you'll need to run payroll for yourself."
  },
  {
    id: 47,
    title: "Fair & Reasonable Salary",
    subtitle: null,
    category: "Payroll Add-On",
    layout: "split",
    required: true,
    leftContent: {
      bullets: [
        "S-Corp owners must pay themselves a 'reasonable salary'",
        "This is how you split income to save on SE tax",
        "Salary portion: subject to payroll taxes",
        "Distribution portion: NOT subject to SE tax",
        "We determine the optimal split for maximum savings"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Scale"
    },
    notes:
      "When you elect S-Corp status, the IRS requires you to pay yourself a fair and reasonable salary. This is actually the key to the whole strategy. Your salary is subject to payroll taxes, but everything above that can be taken as a distribution \u2014 which is NOT subject to self-employment tax.\n\n" +
      "We determine the optimal split between salary and distributions to maximize your savings while keeping everything IRS-compliant."
  },
  {
    id: 48,
    title: "Payroll Setup Steps",
    subtitle: null,
    category: "Payroll Add-On",
    layout: "flow",
    required: false,
    steps: [
      { title: "Entity Election", description: "File S-Corp election with IRS", color: "bg-brand-orange" },
      { title: "Set Salary", description: "Determine reasonable compensation", color: "bg-brand-blue" },
      { title: "Run Payroll", description: "Automated processing & tax filings", color: "bg-green-500" }
    ],
    notes:
      "The process is straightforward. Step 1: We file your S-Corp election. Step 2: We determine your reasonable salary based on your industry, role, and revenue. Step 3: We handle the payroll processing \u2014 automated paycheck runs, tax withholdings, and all the quarterly filings. You don't have to worry about any of it."
  },
  {
    id: 49,
    title: "Payroll Service Includes",
    subtitle: null,
    category: "Payroll Add-On",
    layout: "list",
    required: false,
    items: [
      "Payroll processing (monthly or bi-weekly)",
      "Federal & state tax withholdings",
      "W-2 preparation",
      "Quarterly payroll tax filings (Form 941)",
      "State unemployment filings",
      "Direct deposit setup",
      "Year-end payroll reporting",
      "Workers' comp compliance assistance"
    ],
    notes:
      "Here's everything included in our payroll service. Processing on your schedule \u2014 monthly or bi-weekly. All federal and state tax withholdings calculated and filed. W-2s prepared at year-end. Quarterly 941 filings. State unemployment filings. Direct deposit. Year-end reporting. And even workers' comp compliance assistance.\n\n" +
      "We handle the entire payroll process so you can focus on growing [BUSINESS_NAME]."
  },
  {
    id: 50,
    title: "Nonprofit Expert Accounting",
    subtitle: null,
    category: "Special",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "501(c)(3) compliance & reporting",
        "Form 990 preparation",
        "Grant management accounting",
        "Board financial reporting",
        "Donor tracking & acknowledgment",
        "Specialized nonprofit tax strategies"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "Heart"
    },
    notes:
      "[LEAD_FIRST_NAME], we also specialize in nonprofit accounting. If [BUSINESS_NAME] is a nonprofit or you're considering that path, we handle everything from 501(c)(3) compliance to Form 990 preparation, grant accounting, board reporting, and donor tracking. Our nonprofit specialists understand the unique requirements and ensure you stay compliant while maximizing your mission's impact."
  },
  {
    id: 51,
    title: "Likelihood of an Audit",
    subtitle: null,
    category: "Special",
    layout: "stats",
    required: false,
    stats: [
      { value: "2x", label: "More likely if self-prepared" },
      { value: "$7K\u2013$65K", label: "Average audit penalties" },
      { value: "100%", label: "Audit support included" }
    ],
    notes:
      "[LEAD_FIRST_NAME], here's something important to consider. Business owners who prepare their own taxes are twice as likely to be audited. And if the IRS does come knocking, the average penalties range from $7,000 to $65,000.\n\n" +
      "When you work with us, audit support is included. If you ever get audited, our team handles everything \u2014 the communication, the documentation, the representation. That peace of mind alone is worth the investment."
  },
  {
    id: 52,
    title: "DIY Doesn't Mean Free",
    subtitle: null,
    category: "Special",
    layout: "split",
    required: false,
    leftContent: {
      bullets: [
        "TurboTax/DIY software: $150\u2013$300+",
        "Your time: 20+ hours per year",
        "Missed deductions: $2,000\u2013$10,000+",
        "Wrong entity structure: $5,000\u2013$15,000+ in excess SE tax",
        "Audit risk without professional support",
        "The 'free' option is actually the most expensive"
      ]
    },
    rightContent: {
      type: "icon",
      icon: "AlertTriangle"
    },
    notes:
      "[LEAD_FIRST_NAME], I know some people think about using TurboTax or doing it themselves. But let me break down the real cost.\n\n" +
      "The software itself is $150 to $300+. You'll spend 20+ hours doing your taxes instead of running your business. And here's the big one \u2014 the average DIY filer misses $2,000 to $10,000 in legitimate deductions. The wrong entity structure can cost you $5,000 to $15,000 or more in unnecessary self-employment taxes.\n\n" +
      "When you add it all up, the 'do it yourself' option is actually the most expensive choice. That's why over 100,000 business owners trust us instead."
  }
];

export default slides;
