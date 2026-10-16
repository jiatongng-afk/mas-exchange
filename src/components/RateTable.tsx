import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Copy,
  Printer,
  TrendingUp,
  Calculator,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Check,
} from 'lucide-react';
import { CurrencyCategory, CurrencyQuote, QuotationMode } from '../types/exchangeRate';
import { formatQuotedRate } from '../services/masApiClient';

interface RateTableProps {
  quotes: CurrencyQuote[];
  quotationMode: QuotationMode;
  selectedDate: string;
  onSelectCurrency: (code: string) => void;
  onOpenConverterWithPair: (code: string) => void;
}

type SortField = 'code' | 'name' | 'rate' | 'changePct';
type SortOrder = 'asc' | 'desc';

export const RateTable: React.FC<RateTableProps> = ({
  quotes,
  quotationMode,
  selectedDate,
  onSelectCurrency,
  onOpenConverterWithPair,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CurrencyCategory>('All');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const categories: CurrencyCategory[] = ['All', 'ASEAN', 'G10', 'Asia-Pacific', 'Other'];

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesCategory = activeCategory === 'All' || q.category === activeCategory;
      const qLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        qLower === '' ||
        q.code.toLowerCase().includes(qLower) ||
        q.name.toLowerCase().includes(qLower) ||
        q.country.toLowerCase().includes(qLower);
      return matchesCategory && matchesSearch;
    });
  }, [quotes, activeCategory, searchQuery]);

  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'rate') {
        comparison = a.rate - b.rate;
      } else if (sortField === 'changePct') {
        comparison = a.changePct - b.changePct;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotes, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'Currency Code',
      'Currency Name',
      'Country',
      'MAS Unit',
      'EOD Rate (SGD)',
      'Previous Close (SGD)',
      'Change (SGD)',
      'Change (%)',
      'Day Low',
      'Day High',
      'MAS Series ID',
      'Reference Date',
    ];

    const rows = quotes.map((q) => [
      q.code,
      `"${q.name}"`,
      `"${q.country}"`,
      q.masUnit,
      q.rate.toFixed(4),
      q.prevRate.toFixed(4),
      q.changeAbs.toFixed(4),
      q.changePct.toFixed(2),
      q.dayLow.toFixed(4),
      q.dayHigh.toFixed(4),
      q.masSeriesId,
      selectedDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAS_Exchange_Rates_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy table TSV for spreadsheets
  const handleCopyTable = async () => {
    const headerLine = 'Code\tName\tUnit\tRate(SGD)\tChange(%)\tDay Low\tDay High';
    const lines = sortedQuotes.map(
      (q) =>
        `${q.code}\t${q.name}\t${q.masUnit}\t${q.rate.toFixed(4)}\t${q.changePct.toFixed(2)}%\t${q.dayLow.toFixed(4)}\t${q.dayHigh.toFixed(4)}`
    );
    const fullText = [headerLine, ...lines].join('\n');

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => {
            const count =
              cat === 'All' ? quotes.length : quotes.filter((q) => q.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat} <span className="opacity-70 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency, code, country..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={handleCopyTable}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Copy table to clipboard for Excel or Sheets"
          >
            {copiedNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Download CSV rate sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap hidden sm:inline-flex"
            title="Print rate sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-2.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('code')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                >
                  <span>Currency</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3">MAS Unit</th>
              <th className="py-2.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('rate')}
                  className="inline-flex items-center gap-1 ml-auto hover:text-slate-900 transition-colors"
                >
                  <span>EOD Rate (SGD)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('changePct')}
                  className="inline-flex items-center gap-1 ml-auto hover:text-slate-900 transition-colors"
                >
                  <span>24h Change</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-4 text-right hidden md:table-cell">Prev Close</th>
              <th className="py-2.5 px-4 text-right hidden lg:table-cell">Day Range (Low - High)</th>
              <th className="py-2.5 px-4 text-center hidden sm:table-cell">30D Trend</th>
              <th className="py-2.5 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sortedQuotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <p className="font-medium text-slate-700 mb-1">No matching currencies found</p>
                  <p className="text-xs text-slate-400">
                    Try searching for another currency code like USD, MYR, EUR, or JPY.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Reset filters
                  </button>
                </td>
              </tr>
            ) : (
              sortedQuotes.map((quote) => {
                const { displayRate, unitLabel } = formatQuotedRate(quote, quotationMode);
                const isUp = quote.changePct > 0;
                const isDown = quote.changePct < 0;

                // Mini sparkline calculation
                const historyRates = quote.history.map((h) => h.rate);
                const minRate = Math.min(...historyRates);
                const maxRate = Math.max(...historyRates);
                const range = maxRate - minRate || 1;
                const svgPoints = quote.history
                  .map((h, i) => {
                    const x = (i / (quote.history.length - 1)) * 60;
                    const y = 18 - ((h.rate - minRate) / range) * 14;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');

                return (
                  <tr
                    key={quote.code}
                    className="hover:bg-slate-50/80 transition-colors group h-11"
                  >
                    {/* Currency Name & Code */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base select-none shrink-0">{quote.flag}</span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{quote.code}</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              · {quote.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {quote.masSeriesId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* MAS Unit */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-600 font-medium text-[11px]">
                        {quote.masUnit} unit{quote.masUnit > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Primary Rate */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                        {displayRate}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{unitLabel}</div>
                    </td>

                    {/* Change */}
                    <td className="py-2.5 px-4 text-right">
                      <div
                        className={`inline-flex items-center justify-end gap-0.5 font-mono tabular-nums font-semibold ${
                          isUp
                            ? 'text-emerald-700'
                            : isDown
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {isUp && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
                        {isDown && <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
                        {!isUp && !isDown && <Minus className="w-3.5 h-3.5 shrink-0" />}
                        <span>
                          {isUp ? '+' : ''}
                          {quote.changePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {quote.changeAbs > 0 ? '+' : ''}
                        {quote.changeAbs.toFixed(4)}
                      </div>
                    </td>

                    {/* Prev Close */}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 hidden md:table-cell">
                      {quote.prevRate.toFixed(4)}
                    </td>

                    {/* Day Range */}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 hidden lg:table-cell">
                      <span className="text-slate-500">{quote.dayLow.toFixed(4)}</span>
                      <span className="mx-1 text-slate-300">—</span>
                      <span className="text-slate-700">{quote.dayHigh.toFixed(4)}</span>
                    </td>

                    {/* 30D Sparkline */}
                    <td className="py-2.5 px-4 text-center hidden sm:table-cell">
                      <div className="inline-block w-[60px] h-[20px]">
                        <svg
                          viewBox="0 0 60 20"
                          className="w-full h-full overflow-visible"
                          aria-label={`30-day trend for ${quote.code}`}
                        >
                          <polyline
                            fill="none"
                            stroke={isUp ? '#059669' : isDown ? '#e11d48' : '#64748b'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={svgPoints}
                          />
                        </svg>
                      </div>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenConverterWithPair(quote.code)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title={`Convert SGD with ${quote.code}`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectCurrency(quote.code)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title={`View historical chart for ${quote.code}`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
        <div>
          Showing <span className="font-medium text-slate-700">{sortedQuotes.length}</span> of{' '}
          <span className="font-medium text-slate-700">{quotes.length}</span> published currencies
        </div>
        <div className="flex items-center gap-3">
          <span>Base Currency: <strong className="text-slate-700">Singapore Dollar (SGD)</strong></span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>MAS Table I.17</span>
        </div>
      </div>
    </div>
  );
};
