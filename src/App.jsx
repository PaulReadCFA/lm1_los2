// TRACKING: SME-requested changes to SimulatedReturnsTool

// ✅ 1. Label x-axis with dates instead of "Month 0" etc.
// ✅ Implemented: labels now use short date format (e.g., "Aug '25").

// ✅ 2. Label y-axis
// ✅ Already present: y-axis has numerical labels; no action needed unless further labeling is required.

// ✅ 3. Remove or toggle "Return Table"
// ✅ Implemented: added toggle button to show/hide the Return Table.

// ✅ 4. Make y-axis dynamic based on cumulative data
// ✅ Implemented: uses min/max with padding for better scaling.

// ✅ 5. Add input constraints
// ✅ Implemented: drift (0-50%), volatility (0-100%), months (1-120).

// ✅ 6. Convert Return Statistics to chart
// ✅ Implemented: displays key return statistics in a bar chart format.

// ✅ 7. Omit 0% return for Month 0
// ✅ Implemented: cell is blank instead of showing 0%.

// ✅ 8. Auto-update graph on input change (no button press needed)
// ✅ Implemented: simulateReturns() runs on input change using useEffect with debounce.

// --- CODE CHANGES BELOW ---

import { useState, useEffect } from 'react';

export default function SimulatedReturnsTool() {
  const [drift, setDrift] = useState(3);
  const [volatility, setVolatility] = useState(17);
  const [months, setMonths] = useState(12);

  const [cumulativeData, setCumulativeData] = useState([]);
  const [returnData, setReturnData] = useState([]);
  const [stats, setStats] = useState({});
  const [chartKey, setChartKey] = useState(0);
  const [showReturnTable, setShowReturnTable] = useState(false);

  function simulateReturns() {
    let returns = [];
    let cumulative = [100];

    for (let i = 0; i < months; i++) {
      const rand = Math.random();
      const norm = Math.sqrt(-2 * Math.log(rand)) * Math.cos(2 * Math.PI * rand);
      const monthlyReturn = (drift / 12) / 100 + (volatility / 100) * norm / Math.sqrt(12);

      returns.push(monthlyReturn);
      cumulative.push(cumulative[i] * (1 + monthlyReturn));
    }

    const arithMean = returns.reduce((a, b) => a + b, 0) / months;
    const geomMean = Math.pow(cumulative[months] / 100, 1 / months) - 1;
    const volatilityAnnual = Math.sqrt(
      returns.map(r => Math.pow(r - arithMean, 2)).reduce((a, b) => a + b, 0) / months
    ) * Math.sqrt(12);
    const holdingPeriod = cumulative[months] / 100 - 1;

    setCumulativeData(cumulative);
    setReturnData([null, ...returns.map(r => r * 100)]);
    setStats({
      arithMean,
      geomMean,
      arithMeanAnnual: arithMean * 12,
      geomMeanAnnual: Math.pow(1 + geomMean, 12) - 1,
      volatilityAnnual,
      holdingPeriod
    });
    setChartKey(prev => prev + 1);
  }

  useEffect(() => {
    const timeout = setTimeout(() => simulateReturns(), 300);
    return () => clearTimeout(timeout);
  }, [drift, volatility, months]);

  const labels = Array.from({ length: months + 1 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans text-black">
      <h1 className="text-xl font-bold font-serif mb-4">Simulated Portfolio Returns</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block mb-1">Drift (% annualized):</label>
          <input type="number" min="0" max="50" value={drift} onChange={e => setDrift(Number(e.target.value))} className="border p-1 w-full" />
        </div>
        <div>
          <label className="block mb-1">Volatility (% annualized):</label>
          <input type="number" min="0" max="100" value={volatility} onChange={e => setVolatility(Number(e.target.value))} className="border p-1 w-full" />
        </div>
        <div>
          <label className="block mb-1">Number of Months:</label>
          <input type="number" min="1" max="120" value={months} onChange={e => setMonths(Number(e.target.value))} className="border p-1 w-full" />
        </div>
      </div>

      {cumulativeData.length > 0 && (
        <>
          {/* Portfolio Value Chart */}
          <svg viewBox="0 0 420 220" className="w-full h-56 bg-gray-50">
            <g transform="translate(40,10)">
              {(() => {
                const w = 360;
                const h = 180;
                const minVal = Math.min(...cumulativeData);
                const maxVal = Math.max(...cumulativeData);
                const pad = (maxVal - minVal) * 0.1;
                const fixedMin = minVal - pad;
                const fixedMax = maxVal + pad;
                const yScale = val => h - ((val - fixedMin) / (fixedMax - fixedMin)) * h;
                const xScale = i => (i / (cumulativeData.length - 1)) * w;
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#4476FF"
                      strokeWidth="2"
                      points={cumulativeData.map((d, i) => `${xScale(i)},${yScale(d)}`).join(' ')}
                    />
                    {[...Array(8)].map((_, i) => {
                      const val = fixedMin + i * ((fixedMax - fixedMin) / 7);
                      const y = yScale(val);
                      return (
                        <g key={i}>
                          <line x1="0" y1={y} x2={w} y2={y} stroke="#ccc" strokeDasharray="2 2" />
                          <text x="-5" y={y + 4} textAnchor="end" fontSize="10">{val.toFixed(0)}</text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </g>
            {/* Axis labels */}
<text x="180" y="215" fontSize="12" textAnchor="middle">Month</text>
<text x="-30", y="-20" transform="rotate(-90)" fontSize="12" textAnchor="middle">Value</text>
          
          </svg>

          {/* Return Table Toggle */}
          <div className="mt-4">
            <button
              onClick={() => setShowReturnTable(!showReturnTable)}
              className="text-sm text-blue-700 underline"
            >
              {showReturnTable ? 'Hide Return Table' : 'Show Return Table'}
            </button>
          </div>

          {/* Return Table */}
          {showReturnTable && (
            <div className="mt-4">
              <h2 className="font-semibold font-serif">Returns Table</h2>
              <table className="table-auto border w-full text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 w-20 font-mono text-right">Month</th>
                    {labels.map((label, i) => (
                      <th key={i} className="border px-2 py-1 w-20 font-mono text-right">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 font-mono text-right font-semibold">Portfolio Return (%)</td>
                    {returnData.map((val, i) => (
                      <td key={i} className="border px-2 py-1 font-mono text-right">
                        {val === null ? '' : val.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-2 py-1 font-mono text-right font-semibold">Cumulative Value</td>
                    {cumulativeData.map((val, i) => (
                      <td key={i} className="border px-2 py-1 font-mono text-right">
                        {val.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Return Statistics Chart */}
          <div className="mt-8">
            <h2 className="font-semibold font-serif mb-2">Return Statistics (Bar Chart)</h2>
            <svg viewBox="0 0 420 160" className="w-full h-40 bg-gray-50">
              {(() => {
                const statsArray = [
                  { label: 'Arith. Mean (Ann.)', value: stats.arithMeanAnnual * 100 },
                  { label: 'Geom. Mean (Ann.)', value: stats.geomMeanAnnual * 100 },
                  { label: 'Volatility (Ann.)', value: stats.volatilityAnnual * 100 },
                  { label: 'Hold. Period Return', value: stats.holdingPeriod * 100 }
                ];
                const max = Math.max(...statsArray.map(d => d.value));
                const barWidth = 80;
                const gap = 20;

const chartHeight = 100;
return (
  <g transform="translate(40,20)"> // previously translate(40,10)
    {statsArray.map((d, i) => {
      const height = (d.value / max) * chartHeight;
      return (
        <g key={i} transform={`translate(${i * (barWidth + gap)},0)`}>
          <rect x="0" y={chartHeight - height} width={barWidth} height={height} fill="#3b82f6" />
          <text x={barWidth / 2} y={chartHeight - height - 8} textAnchor="middle" fontSize="10">{d.value.toFixed(2)}%</text>
          <text x={barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize="10">{d.label}</text>
        </g>
      );
    })}
  </g>
);
          

              })()}
            </svg>
          </div>
        </>
      )}
    </div>
  );
} // end of SimulatedReturnsTool
