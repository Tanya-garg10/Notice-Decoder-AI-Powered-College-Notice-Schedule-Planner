import React, { useEffect } from 'react';
import { useNotice } from '../context/NoticeContext';
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  GraduationCap,
  Landmark,
  X,
} from 'lucide-react';

type PricingDialog = 'premium' | 'institutional' | null;

const availableFeatures = [
  'Basic notice analysis',
  'Structured event extraction',
  'Schedule conflict detection',
  'Review and edit events',
  'Calendar (.ics) export',
  'Basic notice history',
];

const comparisonRows = [
  { feature: 'Notice analysis', today: 'Available today', future: 'Higher limits proposed' },
  { feature: 'Conflict detection', today: 'Available today', future: 'Included' },
  { feature: 'Calendar export', today: 'Available today', future: 'Included' },
  { feature: 'Notice history', today: 'Basic history available', future: 'Extended history proposed' },
  { feature: 'Advanced planning', today: 'What-If simulation available', future: 'Premium packaging proposed' },
  { feature: 'Notice change comparison', today: 'Available today', future: 'Premium packaging proposed' },
  { feature: 'Institutional access', today: 'Not available', future: 'Potential future offering' },
];

const planFeatures = [
  'Everything in Free',
  'Higher notice analysis limits',
  'Extended notice history',
  'Advanced schedule planning',
  'What-If conflict simulation',
  'Notice change comparison',
];

export const PricingView: React.FC = () => {
  const { setActiveTab } = useNotice();
  const [dialog, setDialog] = React.useState<PricingDialog>(null);

  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-[#1F2637] bg-gradient-to-br from-[#121620] via-[#101722] to-[#0E121A] px-6 py-10 text-center shadow-2xl sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#D7FF64]/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-12 h-64 w-64 rounded-full bg-[#63E6FF]/[0.07] blur-3xl" />
        <div className="relative mx-auto max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2A3449] bg-[#181D29] px-3 py-1.5 text-[10px] font-mono-code font-bold uppercase tracking-[0.18em] text-[#63E6FF]">
            <CreditCard className="h-3.5 w-3.5" />
            Plans for clearer academic schedules
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Simple Plans. <span className="text-[#D7FF64]">Smarter</span>
            <br className="hidden sm:block" /> Academic Planning.
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#A5ACBA] sm:text-base">
            Choose the plan that fits your academic workflow.
          </p>
        </div>
      </section>

      <section aria-label="Pricing plans" className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        <article className="flex flex-col rounded-2xl border border-[#2A3449] bg-[#121620] p-5 shadow-xl transition-colors hover:border-[#D7FF64]/50 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono-code font-bold uppercase tracking-[0.16em] text-[#D7FF64]">Free</span>
              <span className="rounded-md border border-[#2A3449] bg-[#0B0D12] px-2 py-1 text-[10px] font-mono-code text-[#9299A8]">CURRENT PLAN</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white">₹0</span>
              <span className="text-xs text-[#9299A8]">free to use</span>
            </div>
            <p className="min-h-10 text-xs leading-relaxed text-[#9299A8]">The essential toolkit for turning notices into a schedule you can act on.</p>
          </div>
          <ul className="my-6 flex-1 space-y-3 border-t border-[#1F2637] pt-5">
            {availableFeatures.map(feature => (
              <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#D7FF64]" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setActiveTab('analyze')}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D7FF64] px-4 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] shadow-[0_0_15px_rgba(215,255,100,0.18)] transition-all hover:bg-[#c8f54c] hover:shadow-[0_0_22px_rgba(215,255,100,0.3)] focus:outline-none focus:ring-2 focus:ring-[#D7FF64] focus:ring-offset-2 focus:ring-offset-[#121620]"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
        </article>

        <article className="relative flex flex-col rounded-2xl border border-[#63E6FF]/50 bg-gradient-to-b from-[#111C27] to-[#121620] p-5 shadow-[0_0_28px_rgba(99,230,255,0.08)] transition-all hover:border-[#63E6FF]/80 sm:p-6">
          <span className="absolute right-4 top-4 rounded-md border border-[#63E6FF]/30 bg-[#63E6FF]/10 px-2 py-1 text-[10px] font-mono-code font-bold uppercase tracking-wider text-[#63E6FF]">Proposed Premium</span>
          <div className="space-y-4 pt-8 sm:pt-6">
            <span className="text-xs font-mono-code font-bold uppercase tracking-[0.16em] text-[#63E6FF]">Student Plus</span>
            <div className="flex min-h-10 items-baseline gap-2">
              <span className="font-display text-xl font-bold text-white">Pricing coming soon</span>
            </div>
            <p className="min-h-10 text-xs leading-relaxed text-[#9299A8]">A possible future plan for students who need more room to plan.</p>
          </div>
          <ul className="my-6 flex-1 space-y-3 border-t border-[#1F2637] pt-5">
            {planFeatures.map(feature => (
              <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#63E6FF]" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setDialog('premium')}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#63E6FF]/50 bg-[#63E6FF]/10 px-4 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-[#8DEEFF] transition-colors hover:bg-[#63E6FF]/20 focus:outline-none focus:ring-2 focus:ring-[#63E6FF] focus:ring-offset-2 focus:ring-offset-[#121620]"
          >
            Upgrade Plan <ArrowRight className="h-4 w-4" />
          </button>
        </article>

        <article className="flex flex-col rounded-2xl border border-[#2A3449] bg-[#121620] p-5 shadow-xl transition-colors hover:border-[#9299A8]/50 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono-code font-bold uppercase tracking-[0.16em] text-slate-200">Institutional</span>
              <Landmark aria-hidden="true" className="h-5 w-5 text-[#9299A8]" />
            </div>
            <div className="flex min-h-10 items-baseline gap-2">
              <span className="font-display text-xl font-bold text-white">For Colleges</span>
            </div>
            <p className="min-h-10 text-xs leading-relaxed text-[#9299A8]">A potential future offering for departments exploring shared notice workflows.</p>
          </div>
          <ul className="my-6 flex-1 space-y-3 border-t border-[#1F2637] pt-5">
            {[
              'Potential department-wide access',
              'Centralized academic notice workflows',
              'Institution-level usage overview',
              'Potential administrative features',
              'Custom deployment and support options',
            ].map(feature => (
              <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9299A8]" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setDialog('institutional')}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2A3449] bg-[#181D29] px-4 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-[#9299A8]/60 hover:bg-[#202738] focus:outline-none focus:ring-2 focus:ring-[#9299A8] focus:ring-offset-2 focus:ring-offset-[#121620]"
          >
            Contact Us <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Compare what’s available</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#9299A8]">Current features are clearly separated from ideas being considered for future plans.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#1F2637] bg-[#121620] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <caption className="sr-only">Current Notice Decoder features and proposed future plan features</caption>
              <thead>
                <tr className="border-b border-[#2A3449] bg-[#181D29] text-[10px] font-mono-code uppercase tracking-wider text-[#9299A8]">
                  <th scope="col" className="px-4 py-4 sm:px-6">Feature</th>
                  <th scope="col" className="px-4 py-4 sm:px-6">Available today</th>
                  <th scope="col" className="px-4 py-4 sm:px-6">Potential future plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2637]">
                {comparisonRows.map(row => (
                  <tr key={row.feature} className="transition-colors hover:bg-[#181D29]/60">
                    <th scope="row" className="px-4 py-4 font-semibold text-slate-200 sm:px-6">{row.feature}</th>
                    <td className="px-4 py-4 text-[#D7FF64] sm:px-6">{row.today}</td>
                    <td className="px-4 py-4 text-[#A5ACBA] sm:px-6">{row.future}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#1F2637] px-4 py-3 text-[11px] leading-relaxed text-[#9299A8] sm:px-6">
            Student Plus and institutional plans are proposals, not active subscriptions. Current features are not gated by a paid plan.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 rounded-2xl border border-[#1F2637] bg-gradient-to-br from-[#121620] to-[#0E121A] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#63E6FF]">
              <GraduationCap aria-hidden="true" className="h-5 w-5" />
              <h2 className="font-display text-lg font-bold text-white">A thoughtful path to sustainability</h2>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#9299A8]">
              Notice Decoder is exploring ways to keep core planning tools accessible while supporting future development.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl border border-[#1F2637] bg-[#0B0D12]/70 p-3">
              <p className="font-semibold text-[#D7FF64]">Freemium for students</p>
              <p className="mt-1 leading-relaxed text-[#9299A8]">Core notice and schedule tools for individuals.</p>
            </div>
            <div className="rounded-xl border border-[#1F2637] bg-[#0B0D12]/70 p-3">
              <p className="font-semibold text-[#63E6FF]">Potential premium</p>
              <p className="mt-1 leading-relaxed text-[#9299A8]">Possible subscriptions for advanced productivity features.</p>
            </div>
            <div className="rounded-xl border border-[#1F2637] bg-[#0B0D12]/70 p-3">
              <p className="font-semibold text-slate-200">Institutional licensing</p>
              <p className="mt-1 leading-relaxed text-[#9299A8]">Potential licensing for colleges and departments.</p>
            </div>
          </div>
          <p className="flex items-center gap-2 text-[11px] font-mono-code text-[#9299A8]">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-[#FFC86B]" />
            Premium pricing and institutional plans are under validation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('analyze')}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2A3449] bg-[#181D29] px-4 py-3 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-[#D7FF64]/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D7FF64] focus:ring-offset-2 focus:ring-offset-[#121620]"
        >
          Try Notice Analysis <ArrowRight className="h-4 w-4 text-[#D7FF64]" />
        </button>
      </section>

      {dialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-dialog-title"
            className="w-full max-w-md rounded-2xl border border-[#2A3449] bg-[#121620] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono-code font-bold uppercase tracking-[0.16em] text-[#63E6FF]">
                  {dialog === 'premium' ? 'Student Plus' : 'Institutional'}
                </p>
                <h2 id="pricing-dialog-title" className="mt-2 font-display text-xl font-bold text-white">
                  {dialog === 'premium' ? 'Premium plans coming soon' : 'Institutional enquiries coming soon'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-[#9299A8] transition-colors hover:bg-[#202738] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#63E6FF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#A5ACBA]">
              {dialog === 'premium'
                ? 'Student Plus is a proposed plan. Pricing and availability are still being validated, so upgrades and payments are not available yet. Existing planning tools remain available in the current app.'
                : 'Institutional plans are still being explored. There is no enquiry form or contact channel available yet, and no institutional service is currently offered.'}
            </p>
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="mt-6 min-h-10 w-full rounded-xl bg-[#181D29] px-4 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-[#202738] focus:outline-none focus:ring-2 focus:ring-[#63E6FF]"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
