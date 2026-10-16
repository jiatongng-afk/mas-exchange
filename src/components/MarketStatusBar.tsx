import React, { useState, useEffect } from 'react';
import { Clock, Calendar, HelpCircle, Layers } from 'lucide-react';
import { MarketMetadata, QuotationMode } from '../types/exchangeRate';

interface MarketStatusBarProps {
  metadata: MarketMetadata;
  quotationMode: QuotationMode;
  onChangeQuotationMode: (mode: QuotationMode) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
}

export const MarketStatusBar: React.FC<MarketStatusBarProps> = ({
  metadata,
  quotationMode,
  onChangeQuotationMode,
  selectedDate,
  onSelectDate,
  availableDates,
}) => {
  const [sgtTime, setSgtTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-SG', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
        setSgtTime(formatted);
      } catch {
        setSgtTime(new Date().toTimeString().slice(0, 8));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Metadata Strip: Unboxed text with subtle separators */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Official EOD Fixing:</span>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 border-b border-slate-300 hover:border-slate-600 focus:outline-none cursor-pointer py-0.5"
                title="Select official reference date"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d} (EOD 17:00 SGT)
                  </option>
                ))}
              </select>
            </div>

            <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>SGT Clock:</span>
              <span className="font-mono tabular-nums text-slate-800 font-medium">
                {sgtTime || '17:00:00'} SGT
              </span>
            </div>

            <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>

            <span className="text-slate-500">
              Monetary Authority of Singapore (MAS) Market Close
            </span>
          </div>

          {/* Right: Quotation Mode Segmented Control */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Quotation Basis:</span>
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => onChangeQuotationMode('mas')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  quotationMode === 'mas'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Monetary Authority of Singapore standard (per 1 or per 100 units)"
              >
                MAS Standard (1 / 100)
              </button>
              <button
                type="button"
                onClick={() => onChangeQuotationMode('unit')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  quotationMode === 'unit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Direct conversion: 1 Foreign Unit = X Singapore Dollars"
              >
                1 Unit = SGD
              </button>
              <button
                type="button"
                onClick={() => onChangeQuotationMode('inverse')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  quotationMode === 'inverse'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Purchasing power: 1 Singapore Dollar = X Foreign Units"
              >
                1 SGD = Foreign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
