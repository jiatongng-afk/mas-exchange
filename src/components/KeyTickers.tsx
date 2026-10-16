import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import { CurrencyQuote, QuotationMode } from '../types/exchangeRate';
import { formatQuotedRate } from '../services/masApiClient';

interface KeyTickersProps {
  quotes: CurrencyQuote[];
  quotationMode: QuotationMode;
  onSelectCurrency: (code: string) => void;
}

export const KeyTickers: React.FC<KeyTickersProps> = ({
  quotes,
  quotationMode,
  onSelectCurrency,
}) => {
  // Highlight Singapore's top trading partners: USD, MYR, EUR, JPY, CNY, GBP
  const priorityCodes = ['USD', 'MYR', 'EUR', 'JPY', 'CNY', 'GBP'];
  const tickerQuotes = priorityCodes
    .map((code) => quotes.find((q) => q.code === code))
    .filter((q): q is CurrencyQuote => Boolean(q));

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Major Trading Currencies Against SGD</span>
          <span className="text-xs font-normal text-slate-500">· Official MAS Fixing</span>
        </h2>
        <span className="text-xs text-slate-500">Click any card to inspect historical chart</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tickerQuotes.map((quote) => {
          const { displayRate, unitLabel } = formatQuotedRate(quote, quotationMode);
          const isUp = quote.changePct > 0;
          const isDown = quote.changePct < 0;

          return (
            <button
              key={quote.code}
              type="button"
              onClick={() => onSelectCurrency(quote.code)}
              className="text-left bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-slate-900"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base select-none">{quote.flag}</span>
                  <span className="font-bold text-sm text-slate-900 group-hover:text-rose-700 transition-colors">
                    {quote.code}
                  </span>
                </div>
                <div
                  className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${
                    isUp
                      ? 'text-emerald-700'
                      : isDown
                      ? 'text-rose-700'
                      : 'text-slate-600'
                  }`}
                >
                  {isUp && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                  {isDown && <ArrowDownRight className="w-3 h-3 shrink-0" />}
                  {!isUp && !isDown && <Minus className="w-3 h-3 shrink-0" />}
                  <span className="tabular-nums">
                    {isUp ? '+' : ''}
                    {quote.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Primary Rate */}
              <div className="font-mono tabular-nums text-lg font-bold text-slate-900 mb-1">
                {displayRate}
              </div>

              {/* Sub-label showing quote math */}
              <div className="text-[11px] text-slate-500 truncate" title={unitLabel}>
                {unitLabel}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
