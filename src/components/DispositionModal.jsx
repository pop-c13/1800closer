import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, MessageSquare, Plus, X, DollarSign, ArrowRight, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

export const PRODUCT_CATALOG = [
  { id: 'core', name: 'Core Accounting Package', defaultPrice: 2949 },
  { id: 'btp', name: 'Business Tax Preparation', defaultPrice: 999 },
  { id: 'ptp', name: 'Personal Tax Preparation', defaultPrice: 429 },
  { id: 'tax_advisory', name: 'Tax Advisory', defaultPrice: 2499 },
  { id: 'payroll', name: 'Payroll', defaultPrice: 1221 },
  { id: 'bookkeeping', name: 'Bookkeeping', defaultPrice: 2599 },
  { id: 'audit_biz', name: 'Audit Defense - Business', defaultPrice: 295 },
  { id: 'audit_personal', name: 'Audit Defense - Personal', defaultPrice: 155 },
  { id: 'form_1023', name: 'Form 1023', defaultPrice: 2049 },
  { id: 'qet', name: 'Quarterly Estimated Taxes', defaultPrice: 625 },
  { id: 'sales_use', name: 'Sales & Use Tax', defaultPrice: 1899 },
  { id: 'two_year', name: 'Two-Year Review', defaultPrice: 399 },
  { id: 'bk_advisory', name: 'Bookkeeping Advisory', defaultPrice: 599 },
];

function getFirstPayment(price, terms) {
  const p = parseFloat(price) || 0;
  if (terms === '2-pay') return Math.ceil((p / 2) * 100) / 100;
  if (terms === '3-pay') return Math.ceil((p / 3) * 100) / 100;
  if (terms === '4-pay') return Math.ceil((p / 4) * 100) / 100;
  return p;
}

function termsLabel(terms) {
  if (terms === '2-pay') return '2-Pay';
  if (terms === '3-pay') return '3-Pay';
  if (terms === '4-pay') return '4-Pay';
  return 'Full Pay';
}

function PaymentTermButtons({ price, selected, onChange, compact }) {
  const options = [
    { key: 'full', label: 'Full' },
    { key: '2-pay', label: '2-Pay' },
    { key: '3-pay', label: '3-Pay' },
    { key: '4-pay', label: '4-Pay' },
  ];

  return (
    <div className={`flex gap-1.5 ${compact ? 'mt-1' : 'mt-2'}`}>
      {options.map((opt) => {
        const amount = getFirstPayment(price, opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex-1 rounded-lg text-xs font-medium transition-all ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'} ${
              selected === opt.key
                ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange border'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            <div>{opt.label}</div>
            {!compact && (
              <div className="text-[10px] mt-0.5">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function DispositionModal({ show, leadData, callDuration, pricing, computedSavings, onSubmit }) {
  const { orderProducts, setOrderProducts, orderPaymentMethod, setOrderPaymentMethod } = useApp();
  const [disposition, setDisposition] = useState(null);

  // Follow-up fields
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpTemp, setFollowUpTemp] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Not interested fields
  const [niReason, setNiReason] = useState('');
  const [niNotes, setNiNotes] = useState('');

  // Sale fields
  const [progressMeeting, setProgressMeeting] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Available products (not yet in order)
  const availableAddons = useMemo(() => {
    const usedIds = orderProducts.map(p => p.id);
    return PRODUCT_CATALOG.filter(p => !usedIds.includes(p.id));
  }, [orderProducts]);

  const addProduct = (catalogId) => {
    if (catalogId === '__alacarte__') {
      setOrderProducts(prev => [...prev, { id: `alc_${Date.now()}`, name: '', price: '', terms: 'full', isAlaCarte: true }]);
      return;
    }
    const item = PRODUCT_CATALOG.find(p => p.id === catalogId);
    if (!item) return;
    setOrderProducts(prev => [...prev, { id: item.id, name: item.name, price: item.defaultPrice, terms: 'full' }]);
  };

  const removeProduct = (id) => {
    setOrderProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id, field, value) => {
    setOrderProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Totals
  const totalSale = useMemo(() => {
    return orderProducts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  }, [orderProducts]);

  const firstPayment = useMemo(() => {
    return orderProducts.reduce((sum, p) => sum + getFirstPayment(p.price, p.terms), 0);
  }, [orderProducts]);

  // Validation
  const isValid = useMemo(() => {
    if (!disposition) return false;
    if (disposition === 'closed') {
      return orderProducts.length > 0 && orderProducts.every(p => p.terms && parseFloat(p.price) > 0);
    }
    if (disposition === 'follow-up') {
      return followUpDate && followUpReason.trim() && followUpTemp;
    }
    if (disposition === 'no-sale') {
      return !!niReason;
    }
    return false;
  }, [disposition, orderProducts, followUpDate, followUpReason, followUpTemp, niReason]);

  const handleSubmit = () => {
    if (!isValid) return;

    const data = {
      disposition,
      ...(disposition === 'closed' ? {
        products: orderProducts.map(p => ({
          name: p.name,
          price: parseFloat(p.price),
          terms: p.terms,
          perPayment: getFirstPayment(p.price, p.terms),
        })),
        totalSale,
        firstPaymentAmount: firstPayment,
        paymentMethod: orderPaymentMethod,
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
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Products Sold</h3>

                {/* Product rows */}
                {orderProducts.map((product) => (
                  <div key={product.id} className="p-3 rounded-xl border border-brand-orange/30 bg-brand-orange/5">
                    <div className="flex items-center gap-3">
                      <Check size={14} className="text-brand-orange shrink-0" />
                      {product.isAlaCarte ? (
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          placeholder="Product name"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white outline-none focus:border-brand-orange/40 placeholder-white/20"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white flex-1">{product.name}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-white/30 text-sm">$</span>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                          placeholder="0"
                          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right outline-none focus:border-brand-orange/40"
                        />
                      </div>
                      <button onClick={() => removeProduct(product.id)} className="p-1 text-white/30 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                    <PaymentTermButtons
                      price={product.price}
                      selected={product.terms}
                      onChange={(terms) => updateProduct(product.id, 'terms', terms)}
                    />
                  </div>
                ))}

                {/* Add Product dropdown */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) addProduct(e.target.value); }}
                    className="w-full appearance-none bg-[#1e1e2a] border border-dashed border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-orange/40 cursor-pointer hover:bg-[#252535] transition-colors"
                  >
                    <option value="">+ Add Product</option>
                    {availableAddons.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.defaultPrice.toLocaleString()}
                      </option>
                    ))}
                    <option value="__alacarte__">— À La Carte (custom item)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>

                {/* Order Summary */}
                {orderProducts.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Order Summary</h4>
                    <div className="space-y-1.5">
                      {orderProducts.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-white/70">{p.name}</span>
                          <span className="text-white font-medium">
                            ${parseFloat(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-white/30 text-xs ml-1">({termsLabel(p.terms)})</span>
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
                    value={orderPaymentMethod}
                    onChange={(e) => setOrderPaymentMethod(e.target.value)}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-orange/40"
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
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-orange/40"
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
