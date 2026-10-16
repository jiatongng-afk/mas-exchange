import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MarketStatusBar } from './components/MarketStatusBar';
import { KeyTickers } from './components/KeyTickers';
import { RateTable } from './components/RateTable';
import { CurrencyConverter } from './components/CurrencyConverter';
import { HistoricalChart } from './components/HistoricalChart';
import { CrossRatesMatrix } from './components/CrossRatesMatrix';
import { MasApiModal } from './components/MasApiModal';
import { CurrencyQuote, MasApiConfig, QuotationMode } from './types/exchangeRate';
import { INITIAL_CURRENCY_RATES, OFFICIAL_MARKET_METADATA } from './data/mockRates';
import { loadMasConfig, saveMasConfig } from './services/masApiClient';

export default function App() {
  const [quotes, setQuotes] = useState<CurrencyQuote[]>(INITIAL_CURRENCY_RATES);
  const [activeTab, setActiveTab] = useState<'rates' | 'converter' | 'analytics' | 'cross-matrix'>('rates');
  const [quotationMode, setQuotationMode] = useState<QuotationMode>('mas');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [apiConfig, setApiConfig] = useState<MasApiConfig>(loadMasConfig());

  // Date management: Available dates from historical data
  const availableDates = [
    '2026-10-15',
    '2026-10-14',
    '2026-10-13',
    '2026-10-10',
    '2026-10-09',
  ];
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-15');

  // When date changes, adjust rates slightly to simulate historical EOD fixing for that date
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (newDate === '2026-10-15') {
      setQuotes(INITIAL_CURRENCY_RATES);
    } else {
      // Find matching index in history
      const updated = INITIAL_CURRENCY_RATES.map((quote) => {
        const histMatch = quote.history.find((h) => h.date === newDate);
        if (histMatch) {
          const prevMatch = quote.history.find(
            (h, idx) => quote.history[idx + 1]?.date === newDate
          );
          const pRate = prevMatch ? prevMatch.rate : histMatch.rate * 0.998;
          const diff = histMatch.rate - pRate;
          return {
            ...quote,
            rate: histMatch.rate,
            prevRate: pRate,
            changeAbs: diff,
            changePct: (diff / pRate) * 100,
            dayLow: histMatch.low,
            dayHigh: histMatch.high,
          };
        }
        return quote;
      });
      setQuotes(updated);
    }
  };

  const handleSaveApiConfig = (newConfig: MasApiConfig) => {
    setApiConfig(newConfig);
    saveMasConfig(newConfig);
  };

  const handleSelectCurrencyForChart = (code: string) => {
    setSelectedCurrencyCode(code);
    setActiveTab('analytics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenConverterWithPair = (code: string) => {
    setSelectedCurrencyCode(code);
    setActiveTab('converter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        apiConfig={apiConfig}
      />

      {/* Official MAS Market Status & Mode Bar */}
      <MarketStatusBar
        metadata={OFFICIAL_MARKET_METADATA}
        quotationMode={quotationMode}
        onChangeQuotationMode={setQuotationMode}
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        availableDates={availableDates}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Tickers Strip always visible at top for high-density overview */}
        <KeyTickers
          quotes={quotes}
          quotationMode={quotationMode}
          onSelectCurrency={handleSelectCurrencyForChart}
        />

        {/* View Switcher Container */}
        {activeTab === 'rates' && (
          <RateTable
            quotes={quotes}
            quotationMode={quotationMode}
            selectedDate={selectedDate}
            onSelectCurrency={handleSelectCurrencyForChart}
            onOpenConverterWithPair={handleOpenConverterWithPair}
          />
        )}

        {activeTab === 'converter' && (
          <CurrencyConverter
            quotes={quotes}
            selectedCurrencyCode={selectedCurrencyCode}
            onSelectCurrencyCode={setSelectedCurrencyCode}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'analytics' && (
          <HistoricalChart
            quotes={quotes}
            selectedCurrencyCode={selectedCurrencyCode}
            onSelectCurrencyCode={setSelectedCurrencyCode}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'cross-matrix' && (
          <CrossRatesMatrix quotes={quotes} selectedDate={selectedDate} />
        )}
      </main>

      {/* MAS API Key Configuration Modal */}
      <MasApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />

      {/* Quiet, Professional Financial Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <span>Singapore Monetary Authority (MAS) End-of-Day Exchange Rate Monitor</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Official rates quoted in Singapore Dollars (SGD) per foreign currency unit (1 or 100 units). Table I.17 Financial Statistics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
            <button
              onClick={() => setActiveTab('rates')}
              className="hover:text-slate-900 transition-colors"
            >
              Rate Sheet
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={() => setActiveTab('converter')}
              className="hover:text-slate-900 transition-colors"
            >
              Calculator
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={() => setActiveTab('analytics')}
              className="hover:text-slate-900 transition-colors"
            >
              Trends
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-slate-900 font-medium hover:underline"
            >
              MAS API Setup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
