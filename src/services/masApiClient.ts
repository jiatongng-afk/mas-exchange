import { CurrencyQuote, MasApiConfig } from '../types/exchangeRate';
import { INITIAL_CURRENCY_RATES } from '../data/mockRates';

const STORAGE_KEY = 'mas_fx_api_config_v1';

export const DEFAULT_MAS_ENDPOINT = 'https://eservices.mas.gov.sg/api/action/datastore/search.json';
export const DEFAULT_MAS_RESOURCE_ID = '95932927-c4bc-4753-accc-99e70509253e'; // MAS End-of-Day Exchange Rates table I.17

export function loadMasConfig(): MasApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiKey: parsed.apiKey || '',
        endpointUrl: parsed.endpointUrl || DEFAULT_MAS_ENDPOINT,
        isCustomEndpoint: Boolean(parsed.isCustomEndpoint),
        useLiveApi: Boolean(parsed.useLiveApi),
        status: parsed.apiKey ? (parsed.status || 'reference_mode') : 'reference_mode',
        lastTested: parsed.lastTested,
        errorMessage: parsed.errorMessage,
        statusCode: parsed.statusCode,
      };
    }
  } catch (e) {
    console.error('Error reading saved MAS config:', e);
  }

  return {
    apiKey: '',
    endpointUrl: DEFAULT_MAS_ENDPOINT,
    isCustomEndpoint: false,
    useLiveApi: false,
    status: 'reference_mode',
  };
}

export function saveMasConfig(config: MasApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error writing MAS config:', e);
  }
}

/**
 * Tests connection to the MAS API with the provided key.
 */
export async function testMasApiConnection(apiKey: string, endpointUrl: string = DEFAULT_MAS_ENDPOINT): Promise<{
  success: boolean;
  message: string;
  statusCode?: number;
  sampleCount?: number;
}> {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      message: 'Please enter a valid MAS API key.',
    };
  }

  try {
    const url = new URL(endpointUrl);
    url.searchParams.set('resource_id', DEFAULT_MAS_RESOURCE_ID);
    url.searchParams.set('limit', '5');

    // Add apiKey both as header and query parameter to accommodate different MAS gateway versions
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'user-key': apiKey.trim(),
      'x-api-key': apiKey.trim(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const records = data?.result?.records || [];
      return {
        success: true,
        statusCode: response.status,
        message: `Successfully connected to MAS API gateway (${records.length} sample records retrieved).`,
        sampleCount: records.length,
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        message: `MAS API returned HTTP ${response.status}: ${response.statusText || 'Authentication failed. Please verify your API key.'}`,
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out while reaching MAS API gateway (6000ms). Falling back to reference dataset.',
      };
    }
    // Often in sandboxes or client-side browsers without CORS proxy, MAS API direct calls may have CORS restrictions.
    // We clearly report this helpful context.
    return {
      success: false,
      message: `Network or CORS notice: ${error.message || 'Unable to establish direct browser connection'}. When deploying, route through server or verify CORS in your MAS API console.`,
    };
  }
}

/**
 * Normalizes rates based on display mode
 */
export function formatQuotedRate(
  quote: CurrencyQuote,
  mode: 'mas' | 'unit' | 'inverse'
): { displayRate: string; unitLabel: string; calculationText: string } {
  if (mode === 'mas') {
    // Official MAS convention: per 1 or 100 units
    const formatted = quote.masUnit === 100 
      ? quote.rate.toFixed(4)
      : quote.rate.toFixed(4);
    return {
      displayRate: formatted,
      unitLabel: `${quote.masUnit} ${quote.code} = ${formatted} SGD`,
      calculationText: `Official MAS convention (${quote.masUnit} units)`,
    };
  }

  if (mode === 'unit') {
    // 1 Foreign Currency = X SGD
    const ratePerUnit = quote.rate / quote.masUnit;
    const precision = ratePerUnit < 0.01 ? 6 : 4;
    const formatted = ratePerUnit.toFixed(precision);
    return {
      displayRate: formatted,
      unitLabel: `1 ${quote.code} = ${formatted} SGD`,
      calculationText: `Per single foreign unit`,
    };
  }

  // Inverse: 1 SGD = X Foreign Currency
  const ratePerUnit = quote.rate / quote.masUnit;
  const inverseRate = ratePerUnit > 0 ? (1 / ratePerUnit) : 0;
  const precision = inverseRate < 1 ? 4 : 2;
  const formatted = inverseRate.toFixed(precision);
  return {
    displayRate: formatted,
    unitLabel: `1 SGD = ${formatted} ${quote.code}`,
    calculationText: `SGD buying power`,
  };
}

/**
 * Compute cross-rate between any two currencies via SGD bridge
 */
export function calculateCrossRate(
  fromCurrency: CurrencyQuote,
  toCurrency: CurrencyQuote
): { crossRate: number; formula: string } {
  // Convert 1 fromUnit into SGD
  const fromSgdPerUnit = fromCurrency.rate / fromCurrency.masUnit;
  // Convert SGD into toUnit
  const toSgdPerUnit = toCurrency.rate / toCurrency.masUnit;

  if (toSgdPerUnit === 0) return { crossRate: 0, formula: 'N/A' };

  // 1 FromCurrency = (FromSgdPerUnit / ToSgdPerUnit) ToCurrency
  const crossRate = fromSgdPerUnit / toSgdPerUnit;
  return {
    crossRate,
    formula: `1 ${fromCurrency.code} = ${(crossRate).toFixed(4)} ${toCurrency.code}`,
  };
}
