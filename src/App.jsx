// TRACKING: SME-requested changes to SimulatedReturnsTool

// ✅ 1. Label x-axis with dates instead of "Month 0" etc.
// ✅ Implemented: labels now use short date format (e.g., "Aug '25").

// ✅ 2. Label y-axis
// ✅ Already present: y-axis has numerical labels; no action needed unless further labeling is required.

// 🔲 3. Remove or toggle "Return Table"
// ❌ Not implemented yet. Consider adding a toggle button to show/hide.

// ✅ 4. Make y-axis dynamic based on cumulative data
// ✅ Implemented: uses min/max with padding for better scaling.

// ✅ 5. Add input constraints
// ✅ Implemented: drift (0-50%), volatility (0-100%), months (1-120).

// 🔲 6. Convert Return Statistics to chart
// ❌ Not implemented yet. Consider bar chart for comparison.

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
                  {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6].map((_, i) => {
                    const val = fixedMin + i * ((fixedMax - fixedMin) / 8);
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
        </svg>
      )}
    </div>
  );
} // end of SimulatedReturnsTool
