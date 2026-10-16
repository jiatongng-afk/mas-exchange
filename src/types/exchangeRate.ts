export type CurrencyCategory = 'All' | 'ASEAN' | 'G10' | 'Asia-Pacific' | 'Other';

export type QuotationMode = 'mas' | 'unit' | 'inverse';

export interface RateHistoryPoint {
  date: string; // YYYY-MM-DD
  rate: number; // in official MAS unit
  high: number;
  low: number;
}

export interface CurrencyQuote {
  code: string;
  name: string;
  country: string;
  flag: string;
  masUnit: 1 | 100;
  rate: number; // In SGD for masUnit
  prevRate: number;
  changeAbs: number;
  changePct: number;
  dayLow: number;
  dayHigh: number;
  category: CurrencyCategory;
  masSeriesId: string;
  history: RateHistoryPoint[];
}

export interface MasApiConfig {
  apiKey: string;
  endpointUrl: string;
  isCustomEndpoint: boolean;
  useLiveApi: boolean;
  status: 'reference_mode' | 'connected' | 'testing' | 'error';
  lastTested?: string;
  errorMessage?: string;
  statusCode?: number;
}

export interface MarketMetadata {
  officialDate: string; // e.g. "15 October 2026"
  officialDateISO: string; // "2026-10-15"
  eodPublishTime: string; // "17:00 SGT"
  isHolidayOrWeekend: boolean;
  baseCurrency: 'SGD';
  source: string; // "Monetary Authority of Singapore (MAS) Financial Database"
  totalCurrencies: number;
}
