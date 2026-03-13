import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, MessageSquare, Plus, X, DollarSign, ArrowRight } from 'lucide-react';

const NOT_INTERESTED_REASONS = [
  'Mistake',
  'Personal Only',
  'Out of Scope',
  "Doesn't Want Consultation",
  'Going Local',
  'No Money',
  'Has Accountant',
  'No Revenue',
  'Bad Reviews',
  'Language Barrier',
];

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Amex', 'Discover'];

function PaymentTerms({ label, price, selected, onChange }) {
  const options = [
    { key: 'full', label: 'Full Pay', amount: price },
    { key: '2-pay', label: '2-Pay', amount: price / 2 },
    { key: '3-pay', label: '3-Pay', amount: Math.ceil((price / 3) * 100) / 100 },
    { key: '4-pay', label: '4-Pay', amount: Math.ceil((price / 4) * 100) / 100 },
  ];

  return (
    <div className="mt-2">
      <p className="text-white/50 text-xs mb-1.5">{label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selected === opt.key
                ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange border'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            <div>{opt.label}</div>
            <div className="text-[10px] mt-0.5">${opt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DispositionModal({ show, leadData, callDuration, pricing, computedSavings, onSubmit }) {
  const [disposition, setDisposition] = useState(null); // 'closed' | 'follow-up' | 'no-sale'

  // Sale fields
  const [products, setProducts] = useState([
    { name: 'Core Accounting Package', price: 2949, terms: '', checked: true },
    { name: 'Bookkeeping Full Service', price: '', terms: '', checked: false },
    { name: 'Payroll', price: '', terms: '', checked: false },
  ]);
  const [alaCarteItems, setAlaCarteItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Visa');
  const [progressMeeting, setProgressMeeting] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Follow-up fields
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpTemp, setFollowUpTemp] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Not interested fields
  const [niReason, setNiReason] = useState('');
  const [niNotes, setNiNotes] = useState('');

  // Products calculation
  const activeProducts = useMemo(() => {
    const checked = products.filter(p => p.checked && p.price > 0);
    const alaCarte = alaCarteItems.filter(a => a.name && a.price > 0);
    return [...checked, ...alaCarte];
  }, [products, alaCarteItems]);

  const totalSale = useMemo(() => {
    return activeProducts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  }, [activeProducts]);

  const firstPayment = useMemo(() => {
    return activeProducts.reduce((sum, p) => {
      const price = parseFloat(p.price) || 0;
      if (p.terms === '2-pay') return sum + price / 2;
      if (p.terms === '3-pay') return sum + Math.ceil((price / 3) * 100) / 100;
      if (p.terms === '4-pay') return sum + Math.ceil((price / 4) * 100) / 100;
      return sum + price; // full pay or no terms yet
    }, 0);
  }, [activeProducts]);

  const updateProduct = (index, field, value) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addAlaCarteItem = () => {
    setAlaCarteItems(prev => [...prev, { name: '', price: '', terms: '', checked: true }]);
  };

  const updateAlaCarte = (index, field, value) => {
    setAlaCarteItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeAlaCarte = (index) => {
    setAlaCarteItems(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const isValid = useMemo(() => {
    if (!disposition) return false;
    if (disposition === 'closed') {
      return activeProducts.length > 0 && activeProducts.every(p => p.terms);
    }
    if (disposition === 'follow-up') {
      return followUpDate && followUpReason.trim() && followUpTemp;
    }
    if (disposition === 'no-sale') {
      return !!niReason;
    }
    return false;
  }, [disposition, activeProducts, followUpDate, followUpReason, followUpTemp, niReason]);

  const handleSubmit = () => {
    if (!isValid) return;

    const data = {
      disposition,
      ...(disposition === 'closed' ? {
        products: activeProducts.map(p => ({
          name: p.name,
          price: parseFloat(p.price),
          terms: p.terms,
          perPayment: p.terms === '2-pay' ? parseFloat(p.price) / 2
            : p.terms === '3-pay' ? Math.ceil((parseFloat(p.price) / 3) * 100) / 100
            : p.terms === '4-pay' ? Math.ceil((parseFloat(p.price) / 4) * 100) / 100
            : parseFloat(p.price),
        })),
        totalSale,
        firstPaymentAmount: firstPayment,
        paymentMethod,
        progressMeeting,
        notes: saleNotes,
      } : {}),
      ...(disposition === 'follow-up' ? {
        followUpDate,
        followUpReason,
        followUpTemp,
        notes: followUpNotes,
      } : {}),
      ...(disposition === 'no-sale' ? {
        reason: niReason,
        notes: niNotes,
      } : {}),
    };

    onSubmit(data);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      // No onClick to close — mandatory
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a22] shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Call Complete — Disposition Required</h2>
          <p className="text-white/50 text-sm mt-1">
            {leadData?.firstName} {leadData?.lastName} — {leadData?.businessName}
          </p>
          <p className="text-white/30 text-xs mt-1">Duration: {formatDuration(callDuration)}</p>
        </div>

        {/* Disposition buttons */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'closed', label: 'SALE', icon: '\u2705', color: 'green' },
              { key: 'follow-up', label: 'FOLLOW UP', icon: '\uD83D\uDD04', color: 'yellow' },
              { key: 'no-sale', label: 'NOT INTERESTED', icon: '\u274C', color: 'red' },
            ].map(({ key, label, icon, color }) => (
              <button
                key={key}
                onClick={() => setDisposition(key)}
                className={`p-4 rounded-xl border-2 text-center transition-all active:scale-95 ${
                  disposition === key
                    ? color === 'green' ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : color === 'yellow' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                      : 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm font-bold">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Conditional sub-forms */}
        <div className="px-6 py-4 min-h-[200px]">
          <AnimatePresence mode="wait">
            {/* ── SALE FORM ── */}
            {disposition === 'closed' && (
              <motion.div
                key="sale"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* FUTURE: When Chrome extension audio capture is active, auto-populate
                    products and pricing from the call audio using AI transcription.
                    The rep would just confirm what the AI detected instead of entering manually.
                    For now, manual entry is required. */}
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Products Sold</h3>

                {/* Core products */}
                {products.map((product, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${product.checked ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.checked}
                        onChange={(e) => updateProduct(i, 'checked', e.target.checked)}
                        className="w-4 h-4 rounded accent-brand-orange"
                      />
                      <span className={`text-sm font-medium ${product.checked ? 'text-white' : 'text-white/40'}`}>
                        {product.name}
                      </span>
                      {i === 0 ? (
                        <span className="ml-auto text-sm font-bold text-brand-orange">${product.price.toLocaleString()}</span>
                      ) : (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-white/30 text-sm">$</span>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(i, 'price', e.target.value)}
                            placeholder="0"
                            disabled={!product.checked}
                            className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right outline-none focus:border-brand-orange/40 disabled:opacity-30"
                          />
                        </div>
                      )}
                    </label>
                    {product.checked && (parseFloat(product.price) > 0 || i === 0) && (
                      <PaymentTerms
                        label={`Payment terms for ${product.name}:`}
                        price={parseFloat(product.price) || 0}
                        selected={product.terms}
                        onChange={(terms) => updateProduct(i, 'terms', terms)}
                      />
                    )}
                  </div>
                ))}

                {/* À la carte items */}
                {alaCarteItems.map((item, i) => (
                  <div key={`alc-${i}`} className={`p-3 rounded-xl border ${item.price ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateAlaCarte(i, 'name', e.target.value)}
                        placeholder="Product name"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-orange/40 placeholder-white/20"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-white/30 text-sm">$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateAlaCarte(i, 'price', e.target.value)}
                          placeholder="0"
                          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-brand-orange/40"
                        />
                      </div>
                      <button onClick={() => removeAlaCarte(i)} className="p-1 text-white/30 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                    {item.name && parseFloat(item.price) > 0 && (
                      <PaymentTerms
                        label={`Payment terms for ${item.name}:`}
                        price={parseFloat(item.price) || 0}
                        selected={item.terms}
                        onChange={(terms) => updateAlaCarte(i, 'terms', terms)}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={addAlaCarteItem}
                  className="flex items-center gap-1.5 text-brand-orange/70 hover:text-brand-orange text-xs font-medium"
                >
                  <Plus size={14} /> Add Another Item
                </button>

                {/* Order summary */}
                {activeProducts.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Order Summary</h4>
                    <div className="space-y-1.5">
                      {activeProducts.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-white/70">{p.name}</span>
                          <span className="text-white font-medium">
                            ${parseFloat(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            {p.terms && p.terms !== 'full' && (
                              <span className="text-white/30 text-xs ml-1">
                                ({p.terms})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-white/10 my-3" />
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-white/90">Total Sale</span>
                      <span className="text-green-400">${totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-white/50">First Payment Due</span>
                      <span className="text-brand-orange font-semibold">${firstPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div>
                  <label className="text-xs text-white/50 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-orange/40"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Progress meeting */}
                <div>
                  <label className="text-xs text-white/50 block mb-1">First Progress Meeting</label>
                  <input
                    type="text"
                    value={progressMeeting}
                    onChange={(e) => setProgressMeeting(e.target.value)}
                    placeholder="e.g., Friday 3/14 at 2pm EST"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-brand-orange/40"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-white/50 block mb-1">Notes (optional)</label>
                  <textarea
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    rows={2}
                    placeholder="Any additional notes..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-brand-orange/40 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* ── FOLLOW UP FORM ── */}
            {disposition === 'follow-up' && (
              <motion.div
                key="followup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-white/50 block mb-1">Follow Up Date *</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-orange/40"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">What needs to happen before they close? *</label>
                  <textarea
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    rows={3}
                    placeholder="Spouse needs to agree, waiting on business license, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-brand-orange/40 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-2">Temperature *</label>
                  <div className="flex gap-2">
                    {['Hot', 'Warm', 'Cold'].map((temp) => (
                      <button
                        key={temp}
                        onClick={() => setFollowUpTemp(temp)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          followUpTemp === temp
                            ? temp === 'Hot' ? 'bg-red-500/20 border-red-500/40 text-red-400 border'
                              : temp === 'Warm' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 border'
                              : 'bg-blue-500/20 border-blue-500/40 text-blue-400 border'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {temp === 'Hot' ? '\uD83D\uDD25' : temp === 'Warm' ? '\u2600\uFE0F' : '\u2744\uFE0F'} {temp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Notes (optional)</label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional context..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-brand-orange/40 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* ── NOT INTERESTED FORM ── */}
            {disposition === 'no-sale' && (
              <motion.div
                key="nosale"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
                  Select Reason <span className="text-red-400">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {NOT_INTERESTED_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setNiReason(reason)}
                      className={`p-3 rounded-xl text-sm text-left transition-all ${
                        niReason === reason
                          ? 'bg-red-500/15 border-red-500/40 text-red-300 border'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Notes (optional)</label>
                  <textarea
                    value={niNotes}
                    onChange={(e) => setNiNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional context..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-brand-orange/40 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* No disposition selected */}
            {!disposition && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-white/20"
              >
                <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a disposition above to continue</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit button */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            Submit Disposition <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
