import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { topPLogits } from './topp-utils';
import { softmax } from './minp-utils';
import { Rocket } from 'lucide-react';

/**
 * Top-P Dashboard: Visualizes Top-P (nucleus) filtering on logits.
 * @returns {JSX.Element}
 */
export default function TopPDashboard() {
  const context = "The rocket lifted off towards the";
  const tokens = ["moon", "stars", "sky", "station", "launchpad"];
  const baseLogits = [3.5, 3.1, 2.9, 2.0, -0.5];

  const [temperature, setTemperature] = useState(0.8);
  const [p, setP] = useState(0.9);
  const [selectedToken, setSelectedToken] = useState(null);

  // Compute scaled logits
  const scaledLogits = baseLogits.map(l => l / temperature);
  // Apply Top-P filtering
  const filteredLogits = topPLogits(scaledLogits, p);
  // Probabilities before and after filtering
  const probs = softmax(scaledLogits);
  const filteredProbs = softmax(filteredLogits);

  // Table/chart data
  const data = tokens.map((token, i) => ({
    token,
    baseLogit: baseLogits[i],
    scaledLogit: scaledLogits[i],
    filteredLogit: filteredLogits[i],
    probability: probs[i],
    filteredProbability: isFinite(filteredLogits[i]) ? filteredProbs[i] : 0,
    percentage: (probs[i] * 100).toFixed(1) + '%',
    filteredPercentage: isFinite(filteredLogits[i]) ? (filteredProbs[i] * 100).toFixed(1) + '%' : '-',
  }));

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="text-blue-500" />
          <h1 className="text-2xl font-bold text-center">Top-P (Nucleus) Filtering: Language Model Demo</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="font-mono text-lg border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
            {context}
          </p>
        </div>
        <p className="mb-4 text-gray-700">
          Top-P (nucleus) filtering keeps the smallest set of tokens whose cumulative probability mass exceeds <b>p</b>. This adapts to sharp or flat distributions.
        </p>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <label className="block font-semibold mb-2">Temperature</label>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.2</span><span>2.0</span>
            </div>
            <div className="mt-2 text-sm">{temperature.toFixed(2)}</div>
          </div>
          <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <label className="block font-semibold mb-2">Top-P (p)</label>
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={p}
              onChange={e => setP(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.01</span><span>1.0</span>
            </div>
            <div className="mt-2 text-sm">{p.toFixed(2)}</div>
          </div>
        </div>
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="token" />
              <YAxis domain={[0, 1]} tickFormatter={tick => tick.toFixed(2)} label={{ value: 'Probability', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : value, name === 'filteredProbability' ? 'Filtered Probability' : 'Probability']}
                labelFormatter={label => `Token: "${label}"`}
              />
              <Legend />
              <Bar dataKey="probability" name="Original Probability" fill="#8884d8" opacity={0.5} />
              <Bar dataKey="filteredProbability" name="Filtered Probability" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Token Table</h2>
          <div className="overflow-auto max-h-72">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Token</th>
                  <th className="px-4 py-2 text-left">Base Logit</th>
                  <th className="px-4 py-2 text-left">Scaled Logit</th>
                  <th className="px-4 py-2 text-left">Filtered Logit</th>
                  <th className="px-4 py-2 text-left">Probability</th>
                  <th className="px-4 py-2 text-left">Filtered Probability</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.token}
                    className={`${selectedToken === item.token ? 'bg-cyan-100' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setSelectedToken(item.token)}
                  >
                    <td className="px-4 py-2 border-t">{item.token}</td>
                    <td className="px-4 py-2 border-t">{item.baseLogit.toFixed(2)}</td>
                    <td className="px-4 py-2 border-t">{item.scaledLogit.toFixed(2)}</td>
                    <td className="px-4 py-2 border-t">{isFinite(item.filteredLogit) ? item.filteredLogit.toFixed(2) : '-∞'}</td>
                    <td className="px-4 py-2 border-t">{item.percentage}</td>
                    <td className="px-4 py-2 border-t">{item.filteredPercentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">How Top-P (Nucleus) Filtering Works</h2>
          <ol className="list-decimal ml-6 text-gray-700">
            <li>Convert logits to probabilities using softmax.</li>
            <li>Sort probabilities descending, compute cumulative sum.</li>
            <li>Include tokens until cumulative sum exceeds <b>p</b> (always include top-1).</li>
            <li>Set all other logits to <b>-∞</b> (discard them).</li>
            <li>Sample from the resulting probability distribution (after softmax).</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
