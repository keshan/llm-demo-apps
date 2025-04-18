import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { minPLogits } from './minp-utils';
import { topKLogits } from './topk-utils';
import { topPLogits } from './topp-utils';
import { softmax } from './minp-utils';
import { temperatureScale, sampleFromLogits } from './sample-utils';
import { Rocket } from 'lucide-react';

/**
 * FilterPipelineDashboard: Explore the effect and order of Temperature, Min-P, Top-K, and Top-P filters.
 * Shows how filter order and values affect the final output and sampled token.
 */
export default function FilterPipelineDashboard() {
  const context = "The rocket lifted off towards the";
  const tokens = ["moon", "stars", "sky", "station", "launchpad"];
  const baseLogits = [3.5, 3.1, 2.9, 2.0, -0.5];

  // Controls
  const [temperature, setTemperature] = useState(1.0);
  const [minP, setMinP] = useState(0.1);
  const [k, setK] = useState(3);
  const [p, setP] = useState(0.9);
  const [order, setOrder] = useState(['temperature', 'minp', 'topk', 'topp']);
  const [selectedToken, setSelectedToken] = useState(null);

  // Canonical pipeline order: Temperature -> Min-P -> Top-K -> Top-P
  const canonicalOrder = ['temperature', 'minp', 'topk', 'topp'];
  let logitsStages = [{ label: 'Original', logits: baseLogits }];
  let currentLogits = baseLogits;

  // 1. Temperature scaling
  const scaledLogits = temperatureScale(currentLogits, temperature);
  logitsStages.push({ label: 'temperature', logits: scaledLogits });
  let filtered = scaledLogits;
  // 2. Min-P
  if (minP > 0 && minP < 1.0) {
    filtered = minPLogits(filtered, minP);
    logitsStages.push({ label: 'minp', logits: filtered });
  }
  // 3. Top-K
  if (k > 0 && k < tokens.length) {
    filtered = topKLogits(filtered, k);
    logitsStages.push({ label: 'topk', logits: filtered });
  }
  // 4. Top-P
  if (p > 0 && p < 1.0) {
    filtered = topPLogits(filtered, p);
    logitsStages.push({ label: 'topp', logits: filtered });
  }

  // Probabilities at each stage
  const stagesWithProbs = logitsStages.map(({ label, logits }) => {
    const probs = softmax(logits);
    return { label, logits, probs };
  });

  // Final sampling logic (see JAX reference)
  const finalLogits = logitsStages[logitsStages.length - 1].logits;
  const allFilteredInfinite = finalLogits.every(x => x === -Infinity);
  const logitsForSampling = allFilteredInfinite ? scaledLogits : finalLogits;
  // Sampled index (stochastic)
  const sampledIdx = sampleFromLogits(logitsForSampling);
  // Greedy index (argmax)
  let maxIdx = 0;
  for (let i = 1; i < logitsForSampling.length; ++i) {
    if (logitsForSampling[i] > logitsForSampling[maxIdx]) maxIdx = i;
  }
  const sampledToken = tokens[sampledIdx];
  const greedyToken = tokens[maxIdx];

  // Bar chart data for each stage
  const chartData = stagesWithProbs.map(({ label, probs }) =>
    tokens.map((token, i) => ({ stage: label, token, probability: probs[i] }))
  );

  // Helper for reordering filters
  function handleOrderChange(idx, direction) {
    const newOrder = [...order];
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= order.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setOrder(newOrder);
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="text-blue-500" />
          <h1 className="text-2xl font-bold text-center">Filter Pipeline: Order Matters!</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="font-mono text-lg border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
            {context} <span className="text-black font-bold">{sampledToken}</span> <span className="ml-4 text-gray-400 text-sm">(Sampled)</span><br />
            <span className="text-xs text-gray-500">Greedy: {context} <span className="text-black font-bold">{greedyToken}</span></span>
          </p>
        </div>
        <p className="mb-4 text-gray-700">
          <b>Experiment:</b> Adjust the filter values and drag to reorder filters. The order and parameters dramatically affect which token is ultimately selected to complete the text!
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
              min={0.01}
              max={0.5}
              step={0.01}
              value={minP}
              onChange={e => setMinP(Number(e.target.value))}
              className="w-full accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.01</span><span>0.5</span>
            </div>
            <div className="mt-2 text-sm">{minP.toFixed(2)}</div>
          </div>
          <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <label className="block font-semibold mb-2">Top-K (k)</label>
            <input
              type="range"
              min={1}
              max={tokens.length}
              step={1}
              value={k}
              onChange={e => setK(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span><span>{tokens.length}</span>
            </div>
            <div className="mt-2 text-sm">{k}</div>
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
              <label className="block font-semibold mb-2">Filter Order</label>
              <ul className="space-y-2">
                {order.map((step, idx) => (
                  <li key={step} className="flex items-center gap-2">
                    <button
                      className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => handleOrderChange(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >↑</button>
                    <button
                      className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => handleOrderChange(idx, 1)}
                      disabled={idx === order.length - 1}
                      aria-label="Move down"
                    >↓</button>
                    <span className="font-mono text-base">
                      {step === 'temperature' && 'Temperature'}
                      {step === 'minp' && 'Min-P'}
                      {step === 'topk' && 'Top-K'}
                      {step === 'topp' && 'Top-P'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-gray-500">
                Drag or use arrows to reorder. The order changes the outcome!
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tokens.map((token, i) => {
                  const obj = { token };
                  stagesWithProbs.forEach(({ label, probs }) => {
                    obj[label] = probs[i];
                  });
                  return obj;
                })} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="token" />
                  <YAxis domain={[0, 1]} tickFormatter={tick => tick.toFixed(2)} />
                  <Tooltip />
                  <Legend />
                  {stagesWithProbs.map(({ label }, i) => (
                    label !== 'Original' && <Bar key={label} dataKey={label} name={label.charAt(0).toUpperCase() + label.slice(1)} fill={["#8884d8", "#22c55e", "#a21caf", "#06b6d4"][i % 4]} opacity={0.7} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Why Order Matters</h2>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Each filter step (Temperature, Min-P, Top-K, Top-P) can dramatically change which tokens are kept or removed.</li>
            <li>The <b>order</b> you apply these filters in affects the final probability distribution and the sampled token.</li>
            <li>Try different orders and values to see how the final completion changes!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
