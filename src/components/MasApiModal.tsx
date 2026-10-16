import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Server,
} from 'lucide-react';
import { MasApiConfig } from '../types/exchangeRate';
import { DEFAULT_MAS_ENDPOINT, testMasApiConnection } from '../services/masApiClient';

interface MasApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MasApiConfig;
  onSaveConfig: (newConfig: MasApiConfig) => void;
}

export const MasApiModal: React.FC<MasApiModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [endpointUrl, setEndpointUrl] = useState<string>(config.endpointUrl || DEFAULT_MAS_ENDPOINT);
  const [isCustomEndpoint, setIsCustomEndpoint] = useState<boolean>(config.isCustomEndpoint || false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    statusCode?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const targetUrl = isCustomEndpoint ? endpointUrl : DEFAULT_MAS_ENDPOINT;
    const res = await testMasApiConnection(apiKey, targetUrl);

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      onSaveConfig({
        ...config,
        apiKey: apiKey.trim(),
        endpointUrl: targetUrl,
        isCustomEndpoint,
        status: 'connected',
        lastTested: new Date().toISOString(),
        errorMessage: undefined,
      });
    }
  };

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    onSaveConfig({
      ...config,
      apiKey: trimmedKey,
      endpointUrl: isCustomEndpoint ? endpointUrl.trim() : DEFAULT_MAS_ENDPOINT,
      isCustomEndpoint,
      status: trimmedKey ? (testResult?.success ? 'connected' : 'reference_mode') : 'reference_mode',
      lastTested: new Date().toISOString(),
    });
    onClose();
  };

  const handleResetToDefault = () => {
    setApiKey('');
    setEndpointUrl(DEFAULT_MAS_ENDPOINT);
    setIsCustomEndpoint(false);
    setTestResult(null);
    onSaveConfig({
      apiKey: '',
      endpointUrl: DEFAULT_MAS_ENDPOINT,
      isCustomEndpoint: false,
      useLiveApi: false,
      status: 'reference_mode',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-md">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monetary Authority of Singapore (MAS) API Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Manage your MAS Developer Key & End-of-Day Data Source
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Current State Info Banner */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-900">Current Mode:</span>
              <span
                className={`font-semibold font-mono px-2 py-0.5 rounded text-[11px] ${
                  config.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {config.status === 'connected'
                  ? 'Authenticated Live MAS API'
                  : 'MAS Reference Archive (Table I.17)'}
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              The front end is fully operational using official MAS End-of-Day benchmark rates. You can add your official MAS Developer API key below whenever you are ready.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              MAS Developer API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Paste your MAS API key here (e.g. mas_live_...)"
                className="w-full pl-3 pr-20 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs placeholder:text-slate-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Keys are stored securely only in your browser local storage and never transmitted to external 3rd parties.
            </p>
          </div>

          {/* Endpoint Customization Option */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>API Gateway Endpoint</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCustomEndpoint(!isCustomEndpoint)}
                className="text-[11px] text-slate-500 hover:text-slate-900 underline"
              >
                {isCustomEndpoint ? 'Use Standard MAS URL' : 'Use Custom / Proxy Endpoint'}
              </button>
            </div>

            {isCustomEndpoint ? (
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://your-proxy-domain.com/api/mas"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            ) : (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 truncate">
                {DEFAULT_MAS_ENDPOINT}
              </div>
            )}
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {testResult.success ? 'Connection Verified' : 'Connection Notice'}
                  </div>
                  <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* MAS Developer Instructions & Registration link */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>How to obtain an official MAS API Key:</span>
              <a
                href="https://eservices.mas.gov.sg/api"
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 font-medium hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>MAS API Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-500 text-[11px]">
              <li>Create a free developer account at the Monetary Authority of Singapore portal.</li>
              <li>Subscribe to the Financial Market Statistics APIs (Exchange Rates Table I.17).</li>
              <li>Copy your issued Application Key into the field above and click Save.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Reference Archive</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTest}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
