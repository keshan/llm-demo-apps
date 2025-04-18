import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { minPLogits, softmax } from './minp-utils';
import { Rocket } from 'lucide-react';

/**
 * Min-P Dashboard: Visualizes Min-P filtering on logits.
 * @returns {JSX.Element}
 */
export default function MinPDashboard() {
  // Example context and tokens (same as temperature scaling for consistency)
  const context = "The rocket lifted off towards the";
  const tokens = ["moon", "stars", "sky", "station", "launchpad"];
  const baseLogits = [3.5, 3.1, 2.9, 2.0, -0.5];

  // UI state
  const [temperature, setTemperature] = useState(0.8);
  const [minP, setMinP] = useState(0.1);
  const [selectedToken, setSelectedToken] = useState(null);

  // Compute scaled logits
  const scaledLogits = baseLogits.map(l => l / temperature);
  // Apply Min-P filtering
  const filteredLogits = minPLogits(scaledLogits, minP);
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
          <h1 className="text-2xl font-bold text-center">Min-P Filtering: Language Model Demo</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="font-mono text-lg border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
            {context}
          </p>
        </div>
        <p className="mb-4 text-gray-700">
          Min-P filtering dynamically removes low-probability tokens based on the peak probability in the current distribution.
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
            <label className="block font-semibold mb-2">Min-P (p)</label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={minP}
              onChange={e => setMinP(Number(e.target.value))}
              className="w-full accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.01</span><span>0.5</span>
            </div>
            <div className="mt-2 text-sm">{minP.toFixed(2)}</div>
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
              <Bar dataKey="filteredProbability" name="Filtered Probability" fill="#22c55e" />
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
                    className={`${selectedToken === item.token ? 'bg-green-100' : 'hover:bg-gray-50'} cursor-pointer`}
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
          <h2 className="text-lg font-semibold mb-2">How Min-P Filtering Works</h2>
          <ol className="list-decimal ml-6 text-gray-700">
            <li>Calculate the probability of each token using softmax on the (temperature-scaled) logits.</li>
            <li>Find the maximum probability (<b>max_prob</b>).</li>
            <li>Set a threshold: <b>min_threshold = max_prob × min_p</b>.</li>
            <li>Discard (set logit to -∞) any token whose probability is less than <b>min_threshold</b>, unless it's one of the tokens with <b>max_prob</b>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
