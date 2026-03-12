const industryContent = {
  'Trucking': {
    intro: "We actually work with a lot of owner-operators and trucking companies in [STATE]. The deduction opportunities in transportation are significant.",
    deductions: "For trucking specifically, you'll want to track per diem meals (80% deductible for DOT workers), truck maintenance, fuel costs, licensing fees, ELD devices, and insurance. Many of our trucking clients save $8,000-$15,000 in their first year just from deductions they didn't know about.",
    structure: "Most of our trucking clients see the biggest savings from the S-Corp election because owner-operators tend to have high pass-through income. That 15.3% self-employment tax on $150K is brutal without proper structuring."
  },
  'Construction': {
    intro: "We work with a lot of contractors and construction companies in [STATE]. This industry has some of the best deduction opportunities out there.",
    deductions: "For construction, the big ones are equipment depreciation (Section 179), vehicle/truck deductions, tool expenses, subcontractor payments, job site costs, insurance, and bonding fees. Many of our construction clients write off $20,000+ in their first year.",
    structure: "Contractors typically benefit the most from the S-Corp election because of the high revenue and significant equipment investment."
  },
  'E-commerce': {
    intro: "We work with a lot of e-commerce and online sellers in [STATE]. The tax landscape for online businesses has unique opportunities.",
    deductions: "For e-commerce, you'll want to track inventory costs, shipping supplies, platform fees (Amazon, Shopify, etc.), product photography, home office, software subscriptions, and advertising spend. Sales tax compliance is also something we handle.",
    structure: "E-commerce businesses with strong revenue really benefit from the S-Corp election, especially once you're past $50K in net profit."
  },
  'Real Estate': {
    intro: "We work with a lot of real estate agents and investors in [STATE]. Real estate has some of the most powerful tax strategies available.",
    deductions: "For real estate, the big deductions include vehicle mileage (huge for agents), marketing costs, MLS fees, continuing education, client entertainment, home office, and if you're investing — depreciation is a game-changer.",
    structure: "Real estate professionals have unique tax advantages, including the ability to use real estate losses against other income if you qualify as a real estate professional."
  },
  'Consulting': {
    intro: "We work with a lot of consultants and professional services firms in [STATE]. The beauty of consulting is the overhead is low but the tax exposure can be high.",
    deductions: "For consulting, key deductions include home office, technology and software, professional development, travel to client sites, professional liability insurance, and marketing. If you're working from home, that home office deduction alone can be worth $1,500+.",
    structure: "Consultants are actually the ideal candidate for S-Corp election because your profit margins are high and most of the income would otherwise be subject to self-employment tax."
  },
  'Healthcare': {
    intro: "We work with a lot of healthcare practitioners in [STATE]. Medical professionals have specific tax considerations that most accountants overlook.",
    deductions: "For healthcare, key deductions include medical equipment, continuing education and certifications, malpractice insurance, office supplies, EHR software subscriptions, and professional association dues.",
    structure: "Healthcare professionals often have high income and benefit significantly from the S-Corp election combined with a reasonable salary analysis."
  },
  'Food & Restaurant': {
    intro: "We work with a lot of restaurant and food service businesses in [STATE]. The food industry has unique tax considerations.",
    deductions: "For food businesses, key deductions include inventory and cost of goods, equipment depreciation, food safety certifications, delivery vehicle costs, commercial rent, and tip reporting strategies.",
    structure: "Restaurant owners with consistent revenue benefit from proper entity structuring, especially to manage the self-employment tax burden."
  },
  'Marketing & Advertising': {
    intro: "We work with a lot of marketing and creative agencies in [STATE]. Creative businesses have great deduction opportunities, especially around technology and client services.",
    deductions: "For marketing businesses, key deductions include software subscriptions (Adobe, design tools), home office, client meeting expenses, professional development, hardware (computers, cameras), subcontractor payments, and advertising for your own business.",
    structure: "Marketing and creative professionals benefit strongly from S-Corp election because of high profit margins on service-based revenue."
  },
  'default': {
    intro: "We work with business owners across all industries in [STATE], and we've helped over 100,000 of them save money and stay compliant.",
    deductions: "Based on your industry, there are specific deductions we'll want to make sure you're capturing. Our team will do a full analysis of your business expenses to maximize every write-off available to you.",
    structure: "The entity election is important for all business types, but depending on your specific situation, the savings can be even more significant."
  }
};

export default industryContent;

export function getIndustryContent(industry) {
  if (!industry) return industryContent['default'];
  const lower = industry.toLowerCase();
  for (const [key, value] of Object.entries(industryContent)) {
    if (key === 'default') continue;
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return value;
    }
  }
  // Check some aliases
  if (lower.includes('consult') || lower.includes('it ')) return industryContent['Consulting'];
  if (lower.includes('truck') || lower.includes('transport')) return industryContent['Trucking'];
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cater')) return industryContent['Food & Restaurant'];
  if (lower.includes('real estate') || lower.includes('realt')) return industryContent['Real Estate'];
  if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('online')) return industryContent['E-commerce'];
  if (lower.includes('construct') || lower.includes('contract')) return industryContent['Construction'];
  if (lower.includes('health') || lower.includes('medical') || lower.includes('dental')) return industryContent['Healthcare'];
  if (lower.includes('market') || lower.includes('advertis') || lower.includes('creative') || lower.includes('design')) return industryContent['Marketing & Advertising'];
  return industryContent['default'];
}
