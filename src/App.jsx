import { useState } from 'react';

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
    const volatilityAnnual = Math.sqrt(returns.map(r => Math.pow(r - arithMean, 2)).reduce((a, b) => a + b, 0) / months) * Math.sqrt(12);
    const holdingPeriod = cumulative[months] / 100 - 1;

    setCumulativeData(cumulative);
    setReturnData([0, ...returns.map(r => r * 100)]);
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

  const labels = Array.from({ length: months + 1 }, (_, i) => `Month ${i}`);

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans text-black">
      <h1 className="text-xl font-bold font-serif mb-4">Simulated Portfolio Returns</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block mb-1">Drift (% annualized):</label>
          <input type="number" value={drift} onChange={e => setDrift(Number(e.target.value))} className="border p-1 w-full" />
        </div>
        <div>
          <label className="block mb-1">Volatility (% annualized):</label>
          <input type="number" value={volatility} onChange={e => setVolatility(Number(e.target.value))} className="border p-1 w-full" />
        </div>
        <div>
          <label className="block mb-1">Number of Months:</label>
          <input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} className="border p-1 w-full" />
        </div>
      </div>
      <button onClick={simulateReturns} className="bg-[#06005A] text-white px-4 py-2 rounded">Recalculate</button>

      {cumulativeData.length > 0 && (
        <>
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
                      <polyline
                        fill="none"
                        stroke="#4476FF"
                        strokeWidth="2"
                        points={cumulativeData.map((d, i) => `${xScale(i)},${yScale(d)}`).join(' ')}
                      />
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

          <div className="mt-6">
            <h2 className="font-semibold font-serif">Returns Table</h2>
            <table className="table-auto border w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 w-20 font-mono text-right">Month</th>
                  {labels.map((_, i) => <th key={i} className="border px-2 py-1 w-20 font-mono text-right">{i}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 w-20 font-mono text-right font-semibold">Portfolio Return (%)</td>
                  {returnData.map((val, i) => <td key={i} className="border px-2 py-1 w-20 font-mono text-right">{val.toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td className="border px-2 py-1 w-20 font-mono text-right font-semibold">Cumulative Value</td>
                  {cumulativeData.map((val, i) => <td key={i} className="border px-2 py-1 w-20 font-mono text-right">{val.toFixed(2)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

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
