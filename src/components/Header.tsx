import React from 'react';
import { KeyRound, ShieldCheck, Database } from 'lucide-react';
import { MasApiConfig } from '../types/exchangeRate';

interface HeaderProps {
  activeTab: 'rates' | 'converter' | 'analytics' | 'cross-matrix';
  onSelectTab: (tab: 'rates' | 'converter' | 'analytics' | 'cross-matrix') => void;
  onOpenApiModal: () => void;
  apiConfig: MasApiConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenApiModal,
  apiConfig,
}) => {
  const isApiConnected = apiConfig.status === 'connected';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              MAS
            </div>
            <a
              href="#rates"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('rates');
              }}
              className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-slate-800"
            >
              Singapore Exchange Rate Monitor
            </a>
          </div>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('rates')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                activeTab === 'rates'
                  ? 'text-slate-950 border-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              End-of-Day Rates
            </button>
            <button
              onClick={() => onSelectTab('converter')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                activeTab === 'converter'
                  ? 'text-slate-950 border-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              SGD Converter
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                activeTab === 'analytics'
                  ? 'text-slate-950 border-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Historical Trends
            </button>
            <button
              onClick={() => onSelectTab('cross-matrix')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                activeTab === 'cross-matrix'
                  ? 'text-slate-950 border-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Cross Rates
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenApiModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              title="Configure MAS API Key"
            >
              {isApiConnected ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>MAS API: Connected</span>
                </>
              ) : apiConfig.apiKey ? (
                <>
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>MAS Key Configured</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>MAS API Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center gap-4 py-2.5 overflow-x-auto border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('rates')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded ${
              activeTab === 'rates' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            End-of-Day Rates
          </button>
          <button
            onClick={() => onSelectTab('converter')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded ${
              activeTab === 'converter' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            SGD Converter
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded ${
              activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Historical Trends
          </button>
          <button
            onClick={() => onSelectTab('cross-matrix')}
            className={`whitespace-nowrap shrink-0 px-2 py-1 rounded ${
              activeTab === 'cross-matrix' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Cross Rates
          </button>
        </div>
      </div>
    </header>
  );
};
