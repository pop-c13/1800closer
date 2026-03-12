export default function recommendDeck(lead) {
  if (!lead) return { deck: 'llc', label: 'LLC Consultation', reason: 'Standard new LLC consultation' };

  // Nonprofit entity
  if (lead.entityType === 'Nonprofit' || lead.industry?.toLowerCase().includes('nonprofit')) {
    return { deck: 'nonprofit', label: 'Nonprofit', reason: 'Nonprofit entity detected' };
  }

  // BTP lead source
  if (lead.leadSource === 'BTP') {
    return { deck: 'btp', label: 'BTP Only', reason: 'BTP lead — focus on tax prep' };
  }

  // Revenue-based logic
  const highRevenue = ['$100k–$250k', '$250k+'].includes(lead.annualIncome);
  const hasEmployees = lead.employees && lead.employees !== 'Just me';

  if (highRevenue && hasEmployees) {
    return { deck: 'llc_bundle', label: 'LLC + Full Bundle', reason: 'High revenue with employees — full service opportunity' };
  }

  if (highRevenue) {
    return { deck: 'llc_bookkeeping', label: 'LLC + Bookkeeping', reason: 'Revenue over $100K — bookkeeping adds value' };
  }

  if (hasEmployees) {
    return { deck: 'llc_payroll', label: 'LLC + Payroll', reason: 'Has employees — payroll is a natural add-on' };
  }

  // Default
  return { deck: 'llc', label: 'LLC Consultation', reason: 'Standard new LLC consultation' };
}
