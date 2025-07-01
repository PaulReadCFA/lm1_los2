import { useState } from 'react';

// Main component for simulating portfolio returns
export default function SimulatedReturnsTool() {
  // State variables for user inputs
  const [drift, setDrift] = useState(3); // Expected annual return in %
  const [volatility, setVolatility] = useState(17); // Annual volatility in %
  const [months, setMonths] = useState(12); // Number of months to simulate

  // State variables for computed data and visualization
  const [cumulativeData, setCumulativeData] = useState([]); // Portfolio value over time
  const [returnData, setReturnData] = useState([]); // Monthly return values
  const [stats, setStats] = useState({}); // Summary statistics
  const [chartKey, setChartKey] = useState(0); // Forces chart redraw

  // Function to run the simulation
  function simulateReturns() {
    let returns = [];        // Array of monthly returns
    let cumulative = [100];  // Starting portfolio value at 100

    // Generate random returns month by month
    for (let i = 0; i < months; i++) {
      // Generate standard normal value using Box-Muller
      const rand = Math.random();
      const norm = Math.sqrt(-2 * Math.log(rand)) * Math.cos(2 * Math.PI * rand);

      // Convert annual drift/volatility to monthly return
      const monthlyReturn = (drift / 12) / 100 + (volatility / 100) * norm / Math.sqrt(12);

      returns.push(monthlyReturn); // Store return
      cumulative.push(cumulative[i] * (1 + monthlyReturn)); // Update cumulative value
    }

    // Calculate statistics
    const arithMean = returns.reduce((a, b) => a + b, 0) / months;

    const geomMean = Math.pow(cumulative[months] / 100, 1 / months) - 1;

    const volatilityAnnual = Math.sqrt(
      returns.map(r => Math.pow(r - arithMean, 2)).reduce((a, b) => a + b, 0) / months
    ) * Math.sqrt(12);

    const holdingPeriod = cumulative[months] / 100 - 1;

    // Store computed data in state
    setCumulativeData(cumulative);
    setReturnData([0, ...returns.map(r => r * 100)]); // Convert to percentage
    setStats({
      arithMean,
      geomMean,
      arithMeanAnnual: arithMean * 12,
      geomMeanAnnual: Math.pow(1 + geomMean, 12) - 1,
      volatilityAnnual,
      holdingPeriod
    });
    setChartKey(prev => prev + 1); // Refresh chart
  }

  // Create labels for each month
  const labels = Array.from({ length: months + 1 }, (_, i) => `Month ${i}`);

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans text-black">
      <h1 className="text-xl font-bold font-serif mb-4">Simulated Portfolio Returns</h1>

      {/* Input controls */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block mb-1">Drift (% annualized):</label>
          <input
            type="number"
            value={drift}
            onChange={e => setDrift(Number(e.target.value))}
            className="border p-1 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Volatility (% annualized):</label>
          <input
            type="number"
            value={volatility}
            onChange={e => setVolatility(Number(e.target.value))}
            className="border p-1 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Number of Months:</label>
          <input
            type="number"
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            className="border p-1 w-full"
          />
        </div>
      </div>

      {/* Button to trigger the simulation */}
      <button
        onClick={simulateReturns}
        className="bg-[#06005A] text-white px-4 py-2 rounded"
      >
        Recalculate
      </button>

      {/* Show results if data has been generated */}
      {cumulativeData.length > 0 && (
        <>
          {/* Chart of cumulative value */}
          <div className="mt-6">
            <h2 className="font-semibold font-serif">Cumulative Portfolio Value</h2>
            <svg viewBox="0 0 420 220" className="w-full h-56 bg-gray-50">
              <g transform="translate(40,10)">
                {(() => {
                  const w = 360;
                  const h = 180;
                  const fixedMin = 0;
                  const fixedMax = 180;
                  const yScale = val => h - ((val - fixedMin) / (fixedMax - fixedMin)) * h;
                  const xScale = i => (i / (cumulativeData.length - 1)) * w;

                  return (
                    <>
                      {/* Draw the polyline for portfolio values */}
                      <polyline
                        fill="none"
                        stroke="#4476FF"
                        strokeWidth="2"
                        points={cumulativeData.map((d, i) => `${xScale(i)},${yScale(d)}`).join(' ')}
                      />
                      {/* Draw horizontal grid lines and labels */}
                      {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((val, i) => {
                        const y = yScale(val);
                        return (
                          <g key={i}>
                            <line x1="0" y1={y} x2={w} y2={y} stroke="#ccc" strokeDasharray="2 2" />
                            <text x="-5" y={y + 4} textAnchor="end" fontSize="10">{val}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            </svg>
          </div>

          {/* Table of returns and cumulative values */}
          <div className="mt-6">
            <h2 className="font-semibold font-serif">Returns Table</h2>
            <table className="table-auto border w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 w-20 font-mono text-right">Month</th>
                  {labels.map((_, i) => (
                    <th key={i} className="border px-2 py-1 w-20 font-mono text-right">{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 font-mono text-right font-semibold">Portfolio Return (%)</td>
                  {returnData.map((val, i) => (
                    <td key={i} className="border px-2 py-1 font-mono text-right">{val.toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-2 py-1 font-mono text-right font-semibold">Cumulative Value</td>
                  {cumulativeData.map((val, i) => (
                    <td key={i} className="border px-2 py-1 font-mono text-right">{val.toFixed(2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table of summary statistics */}
          <div className="mt-6">
            <h2 className="font-semibold font-serif">Return Statistics</h2>
            <table className="table-auto border w-full text-sm mt-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Measure</th>
                  <th className="border px-2 py-1 text-right">Value (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border px-2 py-1">Arithmetic Mean (Monthly)</td><td className="border px-2 py-1 text-right">{(stats.arithMean * 100).toFixed(2)}</td></tr>
                <tr><td className="border px-2 py-1">Arithmetic Mean (Annualized)</td><td className="border px-2 py-1 text-right">{(stats.arithMeanAnnual * 100).toFixed(2)}</td></tr>
                <tr><td className="border px-2 py-1">Geometric Mean (Monthly)</td><td className="border px-2 py-1 text-right">{(stats.geomMean * 100).toFixed(2)}</td></tr>
                <tr><td className="border px-2 py-1">Geometric Mean (Annualized)</td><td className="border px-2 py-1 text-right">{(stats.geomMeanAnnual * 100).toFixed(2)}</td></tr>
                <tr><td className="border px-2 py-1">Holding Period Return</td><td className="border px-2 py-1 text-right">{(stats.holdingPeriod * 100).toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
