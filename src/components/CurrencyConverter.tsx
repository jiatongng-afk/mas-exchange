import React, { useState } from 'react';
import { ArrowLeftRight, Copy, Check, Info, TrendingUp, Sparkles } from 'lucide-react';
import { CurrencyQuote } from '../types/exchangeRate';

interface CurrencyConverterProps {
  quotes: CurrencyQuote[];
  selectedCurrencyCode: string;
  onSelectCurrencyCode: (code: string) => void;
  selectedDate: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  quotes,
  selectedCurrencyCode,
  onSelectCurrencyCode,
  selectedDate,
}) => {
  const [direction, setDirection] = useState<'foreign_to_sgd' | 'sgd_to_foreign'>('foreign_to_sgd');
  const [amountStr, setAmountStr] = useState<string>('1000');
  const [copied, setCopied] = useState<boolean>(false);

  const currentQuote = quotes.find((q) => q.code === selectedCurrencyCode) || quotes[0];

  const amount = parseFloat(amountStr) || 0;

  // Conversion logic based on official MAS unit (1 or 100)
  // quote.rate is SGD per quote.masUnit
  // Therefore: 1 foreign unit = (quote.rate / quote.masUnit) SGD
  const sgdPerForeignUnit = currentQuote.rate / currentQuote.masUnit;
  const foreignUnitsPerSgd = sgdPerForeignUnit > 0 ? 1 / sgdPerForeignUnit : 0;

  let convertedAmount = 0;
  let formulaText = '';

  if (direction === 'foreign_to_sgd') {
    convertedAmount = amount * sgdPerForeignUnit;
    formulaText = currentQuote.masUnit === 100
      ? `(${amount.toLocaleString()} ${currentQuote.code} / 100) × ${currentQuote.rate.toFixed(4)} SGD`
      : `${amount.toLocaleString()} ${currentQuote.code} × ${currentQuote.rate.toFixed(4)} SGD`;
  } else {
    convertedAmount = amount * foreignUnitsPerSgd;
    formulaText = `${amount.toLocaleString()} SGD × ${(foreignUnitsPerSgd).toFixed(4)} ${currentQuote.code}`;
  }

  const handleCopyResult = async () => {
    const textToCopy = `${amount.toLocaleString()} ${direction === 'foreign_to_sgd' ? currentQuote.code : 'SGD'} = ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${direction === 'foreign_to_sgd' ? 'SGD' : currentQuote.code}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreset = (val: number) => {
    setAmountStr(val.toString());
  };

  const toggleDirection = () => {
    setDirection((prev) => (prev === 'foreign_to_sgd' ? 'sgd_to_foreign' : 'foreign_to_sgd'));
  };

  // Compare rate with 30 days ago
  const oldestPoint = currentQuote.history[0]?.rate || currentQuote.rate;
  const rateDiff30d = ((currentQuote.rate - oldestPoint) / oldestPoint) * 100;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            SGD Foreign Exchange Calculator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time computation powered by MAS official end-of-day fixing ({selectedDate})
          </p>
        </div>

        <button
          type="button"
          onClick={toggleDirection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>
            {direction === 'foreign_to_sgd' ? 'Switch to SGD → Foreign' : 'Switch to Foreign → SGD'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Source Currency Input */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            {direction === 'foreign_to_sgd' ? 'You Send / Convert' : 'Amount in Singapore Dollars (SGD)'}
          </label>
          <div className="flex items-center gap-2">
            {direction === 'foreign_to_sgd' ? (
              <div className="relative shrink-0">
                <select
                  value={selectedCurrencyCode}
                  onChange={(e) => onSelectCurrencyCode(e.target.value)}
                  className="appearance-none bg-white font-bold text-slate-900 text-sm py-2.5 pl-3 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-xs"
                >
                  {quotes.map((q) => (
                    <option key={q.code} value={q.code}>
                      {q.flag} {q.code} - {q.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  ▼
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white font-bold text-slate-900 text-sm py-2.5 px-3 rounded-md border border-slate-300 shadow-xs shrink-0">
                <span>🇸🇬</span>
                <span>SGD</span>
              </div>
            )}

            <input
              type="number"
              step="any"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full text-right font-mono tabular-nums text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
              placeholder="0.00"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60 overflow-x-auto text-xs">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Presets:</span>
            {[100, 500, 1000, 5000, 10000].map((presetVal) => (
              <button
                key={presetVal}
                type="button"
                onClick={() => handlePreset(presetVal)}
                className="px-2 py-0.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded text-[11px] font-mono tabular-nums hover:border-slate-400 transition-colors shrink-0"
              >
                {presetVal.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Target Currency Converted Output */}
        <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {direction === 'foreign_to_sgd' ? 'Total in Singapore Dollars' : `Total in ${currentQuote.name}`}
              </span>
              <button
                type="button"
                onClick={handleCopyResult}
                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                title="Copy converted value"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-sm font-medium text-slate-400">
                {direction === 'foreign_to_sgd' ? '🇸🇬 SGD' : `${currentQuote.flag} ${currentQuote.code}`}
              </span>
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {convertedAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 font-mono flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">MAS Official Quote:</span>
              <span className="font-bold text-white">
                {currentQuote.masUnit} {currentQuote.code} = {currentQuote.rate.toFixed(4)} SGD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reciprocal Power:</span>
              <span>
                1 SGD = {foreignUnitsPerSgd.toFixed(4)} {currentQuote.code}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Notice & Historical Spread */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="font-semibold text-slate-900">
              Calculation Breakdown ({formulaText})
            </div>
            <p>
              Rates are derived from the Monetary Authority of Singapore (MAS) official End-of-Day market fixing.
              {currentQuote.masUnit === 100
                ? ` By Singapore market standard, ${currentQuote.name} is quoted per 100 currency units.`
                : ` By Singapore market standard, ${currentQuote.name} is quoted per 1 currency unit.`}
            </p>
            <div className="pt-1 flex items-center gap-3 text-slate-500 text-[11px]">
              <span>30-Day Rate Trend:</span>
              <span
                className={`font-semibold font-mono tabular-nums ${
                  rateDiff30d >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {rateDiff30d >= 0 ? '+' : ''}
                {rateDiff30d.toFixed(2)}% vs 30 days ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
