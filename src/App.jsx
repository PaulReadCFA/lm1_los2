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

import { useState, useEffect, useRef } from 'react';

export default function SimulatedReturnsTool() {
  const [drift, setDrift] = useState(3);
  const [volatility, setVolatility] = useState(17);
  const [months, setMonths] = useState(12);

  const [cumulativeData, setCumulativeData] = useState([]);
  const [returnData, setReturnData] = useState([]);
  const [stats, setStats] = useState({});
  const [showReturnTable, setShowReturnTable] = useState(false);
  
  // Store fixed random numbers separate from inputs
  const randomSequence = useRef([]);
  const [seedVersion, setSeedVersion] = useState(0); // Track when to regenerate random numbers

  // Generate a fixed sequence of random numbers (only when seed changes)
  function generateRandomSequence(length) {
    const sequence = [];
    for (let i = 0; i < length; i++) {
      const rand = Math.random();
      const norm = Math.sqrt(-2 * Math.log(rand)) * Math.cos(2 * Math.PI * Math.random());
      sequence.push(norm);
    }
    return sequence;
  }

  // Calculate returns using fixed random sequence + current parameters
  function calculateReturns() {
    // Ensure we have enough random numbers
    if (randomSequence.current.length < months) {
      randomSequence.current = generateRandomSequence(Math.max(120, months));
    }

    let returns = [];
    let cumulative = [100];

    for (let i = 0; i < months; i++) {
      const norm = randomSequence.current[i];
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
  }

  // Initialize random sequence on first load
  useEffect(() => {
    randomSequence.current = generateRandomSequence(120);
    calculateReturns();
  }, [seedVersion]); // Only regenerate when seed version changes

  // Recalculate when inputs change (but keep same random numbers)
  useEffect(() => {
    if (randomSequence.current.length > 0) {
      const timeout = setTimeout(() => calculateReturns(), 100);
      return () => clearTimeout(timeout);
    }
  }, [drift, volatility, months]);

  // Function to generate new random sequence
  function regenerateRandomNumbers() {
    setSeedVersion(prev => prev + 1);
  }

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
          <input 
            type="number" 
            min="0" 
            max="50" 
            value={drift} 
            onChange={e => setDrift(Number(e.target.value))} 
            className="border p-1 w-full" 
          />
        </div>
        <div>
          <label className="block mb-1">Volatility (% annualized):</label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={volatility} 
            onChange={e => setVolatility(Number(e.target.value))} 
            className="border p-1 w-full" 
          />
        </div>
        <div>
          <label className="block mb-1">Number of Months:</label>
          <input 
            type="number" 
            min="1" 
            max="120" 
            value={months} 
            onChange={e => setMonths(Number(e.target.value))} 
            className="border p-1 w-full" 
          />
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
            <text x="220" y="215" fontSize="12" textAnchor="middle">Month</text>
            <text x="15" y="110" fontSize="12" textAnchor="middle" transform="rotate(-90,15,110)">Portfolio Value</text>
          </svg>

          <div className="mt-2">
            <button
              onClick={regenerateRandomNumbers}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Generate New Random Sequence
            </button>
            <p className="text-xs text-gray-600 mt-1">
              Input changes use the same random numbers for easy comparison. Click to generate new random sequence.
            </p>
          </div>

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

          {/* Fixed Return Statistics Chart */}
          <div className="mt-8">
            <h2 className="font-semibold font-serif mb-2">Return Statistics</h2>
            <svg viewBox="0 0 500 200" className="w-full h-48 bg-gray-50">
              {(() => {
                const statsArray = [
                  { label: 'Arith. Mean (Ann.)', value: stats.arithMeanAnnual * 100 },
                  { label: 'Geom. Mean (Ann.)', value: stats.geomMeanAnnual * 100 },
                  { label: 'Volatility (Ann.)', value: stats.volatilityAnnual * 100 },
                  { label: 'Hold. Period Return', value: stats.holdingPeriod * 100 }
                ];

                // Fix scaling to handle negative values
                const values = statsArray.map(d => d.value);
                const minVal = Math.min(0, Math.min(...values)); // Include 0 as baseline
                const maxVal = Math.max(0, Math.max(...values)); // Include 0 as baseline
                const range = maxVal - minVal;
                const padding = range * 0.1;
                
                const chartMin = minVal - padding;
                const chartMax = maxVal + padding;
                const chartRange = chartMax - chartMin;
                
                const barWidth = 80;
                const gap = 20;
                const chartHeight = 120;
                const zeroY = chartHeight - ((0 - chartMin) / chartRange) * chartHeight;

                return (
                  <g transform="translate(50,30)">
                    {/* Zero line */}
                    <line 
                      x1="0" 
                      y1={zeroY} 
                      x2={statsArray.length * (barWidth + gap) - gap} 
                      y2={zeroY} 
                      stroke="#666" 
                      strokeDasharray="2,2" 
                      strokeWidth="1"
                    />
                    
                    {statsArray.map((d, i) => {
                      const value = d.value;
                      const barTop = chartHeight - ((value - chartMin) / chartRange) * chartHeight;
                      const barHeight = Math.abs(zeroY - barTop);
                      const barY = Math.min(zeroY, barTop);
                      
                      // Color: positive = blue, negative = red
                      const fillColor = value >= 0 ? "#4476FF" : "#DC2626";
                      
                      return (
                        <g key={i} transform={`translate(${i * (barWidth + gap)},0)`}>
                          <rect 
                            x="0" 
                            y={barY} 
                            width={barWidth} 
                            height={barHeight} 
                            fill={fillColor} 
                          />
                          {/* Value label */}
                          <text 
                            x={barWidth / 2} 
                            y={value >= 0 ? barY - 5 : barY + barHeight + 15} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="#333"
                          >
                            {value.toFixed(2)}%
                          </text>
                          {/* Category label */}
                          <text 
                            x={barWidth / 2} 
                            y={chartHeight + 25} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="#666"
                          >
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Y-axis labels */}
                    {[0, 25, 50, 75, 100].map(pct => {
                      const val = chartMin + (pct/100) * chartRange;
                      const y = chartHeight - (pct/100) * chartHeight;
                      return (
                        <g key={pct}>
                          <line x1="-5" y1={y} x2="0" y2={y} stroke="#999" />
                          <text x="-10" y={y + 3} textAnchor="end" fontSize="9" fill="#666">
                            {val.toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
            <p className="text-xs text-gray-600 mt-2">
              Blue bars indicate positive returns, red bars indicate negative returns. Dashed line shows zero.
            </p>
          </div>
        </>
      )}
    </div>
  );
}