import React, { useState } from 'react';
import { CurrencyQuote } from '../types/exchangeRate';

interface CrossRatesMatrixProps {
  quotes: CurrencyQuote[];
  selectedDate: string;
}

export const CrossRatesMatrix: React.FC<CrossRatesMatrixProps> = ({ quotes, selectedDate }) => {
  // Key regional and global currencies for the cross matrix
  const matrixCurrencies = ['SGD', 'USD', 'MYR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD'];

  const [activeCell, setActiveCell] = useState<{ from: string; to: string; rate: number } | null>(null);

  // Helper to get SGD per 1 unit of currency
  const getSgdPerUnit = (code: string): number => {
    if (code === 'SGD') return 1.0;
    const q = quotes.find((quote) => quote.code === code);
    if (!q) return 1.0;
    return q.rate / q.masUnit;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs max-w-5xl mx-auto">
      <div className="pb-4 border-b border-slate-200 mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Cross Currency Rates Matrix
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Computed cross-exchange valuations derived from official MAS End-of-Day fixing ({selectedDate})
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-2.5 px-3 text-left font-semibold text-slate-600">
                1 Unit of ↓ / In →
              </th>
              {matrixCurrencies.map((colCode) => (
                <th
                  key={colCode}
                  className="py-2.5 px-3 text-right font-bold text-slate-800 font-mono"
                >
                  {colCode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
            {matrixCurrencies.map((rowCode) => {
              const rowSgdVal = getSgdPerUnit(rowCode);

              return (
                <tr key={rowCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 bg-slate-50/50">
                    {rowCode}
                  </td>
                  {matrixCurrencies.map((colCode) => {
                    const colSgdVal = getSgdPerUnit(colCode);
                    const rate = colSgdVal > 0 ? rowSgdVal / colSgdVal : 0;
                    const isSelf = rowCode === colCode;
                    const precision = rate < 0.1 ? 6 : rate > 100 ? 2 : 4;

                    return (
                      <td
                        key={colCode}
                        onMouseEnter={() =>
                          setActiveCell({ from: rowCode, to: colCode, rate })
                        }
                        className={`py-2.5 px-3 text-right cursor-default transition-colors ${
                          isSelf
                            ? 'text-slate-300 bg-slate-100/50'
                            : 'text-slate-800 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        {isSelf ? '1.0000' : rate.toFixed(precision)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Cell Info Notice */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
        {activeCell && activeCell.from !== activeCell.to ? (
          <div>
            Cross Rate Formula: <strong>1 {activeCell.from}</strong> ={' '}
            <strong className="text-slate-900 font-mono">
              {activeCell.rate.toFixed(activeCell.rate < 0.1 ? 6 : activeCell.rate > 100 ? 2 : 4)}{' '}
              {activeCell.to}
            </strong>{' '}
            (via MAS official SGD benchmark rate)
          </div>
        ) : (
          <div className="text-slate-500">
            Hover over any rate cell in the matrix to view the exact cross currency calculation formula.
          </div>
        )}
        <div className="text-[11px] text-slate-400 font-mono">
          Bridge: Singapore Dollar (SGD)
        </div>
      </div>
    </div>
  );
};
