import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, ArrowLeftRight } from 'lucide-react';
import { CurrencyQuote, RateHistoryPoint } from '../types/exchangeRate';

interface HistoricalChartProps {
  quotes: CurrencyQuote[];
  selectedCurrencyCode: string;
  onSelectCurrencyCode: (code: string) => void;
  selectedDate: string;
}

type Timeframe = '7D' | '14D' | '30D';

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  quotes,
  selectedCurrencyCode,
  onSelectCurrencyCode,
  selectedDate,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [invertRate, setInvertRate] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currentQuote = quotes.find((q) => q.code === selectedCurrencyCode) || quotes[0];

  // Slice history points according to timeframe
  const historyPoints = useMemo(() => {
    const raw = currentQuote.history;
    const sliceCount = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : 30;
    const sliced = raw.slice(-sliceCount);

    if (!invertRate) {
      return sliced;
    }

    // Inverted: 1 SGD = X foreign currency units
    return sliced.map((pt) => {
      const perUnit = pt.rate / currentQuote.masUnit;
      const invRate = perUnit > 0 ? 1 / perUnit : 0;
      const invHigh = pt.low > 0 ? 1 / (pt.low / currentQuote.masUnit) : 0;
      const invLow = pt.high > 0 ? 1 / (pt.high / currentQuote.masUnit) : 0;
      return {
        date: pt.date,
        rate: Number(invRate.toFixed(4)),
        high: Number(invHigh.toFixed(4)),
        low: Number(invLow.toFixed(4)),
      };
    });
  }, [currentQuote, timeframe, invertRate]);

  // Derived statistics
  const rates = historyPoints.map((p) => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const avgRate = rates.reduce((a, b) => a + b, 0) / (rates.length || 1);
  const firstRate = rates[0] || 0;
  const lastRate = rates[rates.length - 1] || 0;
  const netChange = lastRate - firstRate;
  const netChangePct = firstRate > 0 ? (netChange / firstRate) * 100 : 0;
  const isPeriodUp = netChangePct >= 0;

  // Min/Max with dates
  const minPoint = historyPoints.find((p) => p.rate === minRate) || historyPoints[0];
  const maxPoint = historyPoints.find((p) => p.rate === maxRate) || historyPoints[historyPoints.length - 1];

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 50;
  const paddingY = 30;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;
  const range = maxRate - minRate || 0.0001;

  // Compute points coordinates
  const coordinates = useMemo(() => {
    return historyPoints.map((pt, i) => {
      const x = paddingX + (i / (historyPoints.length - 1 || 1)) * chartW;
      const y = paddingY + chartH - ((pt.rate - minRate) / range) * chartH;
      return { x, y, ...pt };
    });
  }, [historyPoints, minRate, range, chartW, chartH, paddingX, paddingY]);

  const pathD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return coordinates.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [coordinates]);

  const areaD = useMemo(() => {
    if (coordinates.length === 0) return '';
    const bottomY = paddingY + chartH;
    const startX = coordinates[0].x;
    const endX = coordinates[coordinates.length - 1].x;
    return `${pathD} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [pathD, coordinates, paddingY, chartH]);

  const activeHover = hoverIndex !== null && coordinates[hoverIndex] ? coordinates[hoverIndex] : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs max-w-5xl mx-auto">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none">{currentQuote.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {currentQuote.code} / SGD Historical Trend
              </h2>
              <span className="text-xs text-slate-500 font-medium">· {currentQuote.name}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official MAS End-of-Day Market Reference · Series {currentQuote.masSeriesId}
            </p>
          </div>
        </div>

        {/* Currency Selector & Invert Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <select
            value={selectedCurrencyCode}
            onChange={(e) => onSelectCurrencyCode(e.target.value)}
            className="bg-white text-xs font-semibold text-slate-900 border border-slate-300 rounded-md py-1.5 pl-2.5 pr-7 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-xs"
          >
            {quotes.map((q) => (
              <option key={q.code} value={q.code}>
                {q.flag} {q.code} ({q.masUnit} unit{q.masUnit > 1 ? 's' : ''})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setInvertRate(!invertRate)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              invertRate
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle between MAS quote and 1 SGD buying power"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>{invertRate ? '1 SGD = Foreign' : 'MAS Official Unit'}</span>
          </button>

          {/* Timeframe Selector */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {(['7D', '14D', '30D'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Value Display & Active Crosshair Badge */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {activeHover ? activeHover.rate.toFixed(4) : lastRate.toFixed(4)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {invertRate
              ? `${currentQuote.code} per 1 SGD`
              : `SGD per ${currentQuote.masUnit} ${currentQuote.code}`}
          </span>
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${
              isPeriodUp ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPeriodUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>
              {isPeriodUp ? '+' : ''}
              {netChangePct.toFixed(2)}% over {timeframe}
            </span>
          </div>
        </div>

        {activeHover ? (
          <div className="text-xs text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Date: <strong>{activeHover.date}</strong> · High: {activeHover.high.toFixed(4)} · Low: {activeHover.low.toFixed(4)}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Hover along the chart to inspect daily fixing
          </div>
        )}
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative border border-slate-200 rounded-lg bg-slate-50/50 p-2 overflow-hidden mb-6">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            let closestIdx = 0;
            let closestDist = Infinity;
            coordinates.forEach((pt, idx) => {
              const dist = Math.abs(pt.x - mouseX);
              if (dist < closestDist) {
                closestDist = dist;
                closestIdx = idx;
              }
            });
            setHoverIndex(closestIdx);
          }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + chartH * ratio;
            const val = maxRate - ratio * range;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#0F172A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair */}
          {activeHover && (
            <g>
              <line
                x1={activeHover.x}
                y1={paddingY}
                x2={activeHover.x}
                y2={paddingY + chartH}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeHover.x}
                cy={activeHover.y}
                r="4.5"
                fill="#0F172A"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis dates */}
          {coordinates.map((pt, i) => {
            // Show every 5th or 6th date label
            const step = timeframe === '7D' ? 1 : timeframe === '14D' ? 2 : 5;
            if (i % step !== 0 && i !== coordinates.length - 1) return null;
            return (
              <text
                key={pt.date}
                x={pt.x}
                y={svgHeight - 8}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {pt.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Statistical Rigor Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {timeframe} Period High
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-1">
            {maxRate.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Recorded: {maxPoint.date}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {timeframe} Period Low
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-1">
            {minRate.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Recorded: {minPoint.date}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {timeframe} Average
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-1">
            {avgRate.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Arithmetic Mean Fixing
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Trading Spread (High - Low)
          </div>
          <div className="font-mono tabular-nums text-base font-bold text-slate-900 mt-1">
            {(maxRate - minRate).toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Range: {(((maxRate - minRate) / minRate) * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};
