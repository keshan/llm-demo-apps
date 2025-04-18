import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sliders, Rocket, Download, Camera } from 'lucide-react';
import MinPDashboard from './MinPDashboard';
import TopKDashboard from './TopKDashboard';

// Note: In a real implementation, you would need to install these libraries:
// npm install html2canvas gif.js --save

export default function App() {
  const [dashboard, setDashboard] = useState('temperature');

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <header className="bg-white shadow sticky top-0 z-10 w-full">
        <nav className="flex gap-2 p-4 w-full">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${dashboard === 'temperature' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setDashboard('temperature')}
            aria-current={dashboard === 'temperature' ? 'page' : undefined}
          >
            Temperature Scaling
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${dashboard === 'minp' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setDashboard('minp')}
            aria-current={dashboard === 'minp' ? 'page' : undefined}
          >
            Min-P Filtering
          </button>
        <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${dashboard === 'topk' ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setDashboard('topk')}
            aria-current={dashboard === 'topk' ? 'page' : undefined}
          >
            Top-K Filtering
          </button>
        </nav>
      </header>
      <main className="w-full py-8 px-4">
        {dashboard === 'temperature' && <TemperatureScalingDemo />}
        {dashboard === 'minp' && <MinPDashboard />}
        {dashboard === 'topk' && <TopKDashboard />}
      </main>
    </div>
  );
}

function TemperatureScalingDemo() {
  // Use the provided rocket example
  const context = "The rocket lifted off towards the";
  const tokens = ["moon", "stars", "sky", "station", "launchpad"];
  const baseLogits = [3.5, 3.1, 2.9, 2.0, -0.5];
  
  const [temperature, setTemperature] = useState(0.0001);
  const [animationActive, setAnimationActive] = useState(false);
  const [data, setData] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [showLogits, setShowLogits] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  
  // Calculate scaled logits based on temperature
  const calculateScaledData = (temp) => {
    if (temp === 0) temp = 0.0001; // Prevent division by zero
    
    // Apply temperature scaling
    const scaledLogits = baseLogits.map(logit => logit / temp);
    
    // Convert to probabilities using softmax
    const maxLogit = Math.max(...scaledLogits);
    const expLogits = scaledLogits.map(logit => Math.exp(logit - maxLogit));
    const sumExpLogits = expLogits.reduce((a, b) => a + b, 0);
    const probabilities = expLogits.map(expLogit => expLogit / sumExpLogits);
    
    return tokens.map((token, i) => ({
      token,
      probability: probabilities[i],
      baseLogit: baseLogits[i],
      scaledLogit: scaledLogits[i],
      percentage: (probabilities[i] * 100).toFixed(1) + '%'
    }));
  };

  // Initialize data
  useEffect(() => {
    setData(calculateScaledData(temperature));
  }, []);

  // Auto animation effect
  useEffect(() => {
    let animationInterval;
    if (animationActive && !isRecording) {
      let direction = 1;
      let currentTemp = temperature;
      
      animationInterval = setInterval(() => {
        // Bounce between 0.1 and 3.0
        if (currentTemp >= 3.0) direction = -1;
        if (currentTemp <= 0.1) direction = 1;
        
        currentTemp = parseFloat((currentTemp + direction * 0.1 * speed).toFixed(1));
        if (currentTemp < 0.1) currentTemp = 0.1;
        
        setTemperature(currentTemp);
        setData(calculateScaledData(currentTemp));
      }, 500 / speed);
    }
    
    return () => clearInterval(animationInterval);
  }, [animationActive, speed, isRecording]);

  // Handle manual temperature change
  const handleTemperatureChange = (e) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    setData(calculateScaledData(newTemp));
  };
  
  // Handle bar click to select a token
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedToken(data.activePayload[0].payload.token);
    }
  };

  // Create a sample sentence with the selected token
  const getSampleSentence = () => {
    if (!selectedToken) return `${context} ...`;
    return `${context} ${selectedToken}...`;
  };

  // Function to load external scripts
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Take a screenshot of the component
  const takeScreenshot = async () => {
    try {
      // Load html2canvas dynamically
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      
      if (!window.html2canvas) {
        alert("Failed to load html2canvas library. Please install it with: npm install html2canvas");
        return;
      }
      
      const container = containerRef.current;
      
      if (!container) return;
      
      const canvas = await window.html2canvas(container, {
        backgroundColor: '#f9fafb',
        scale: 2, // Higher quality
        logging: false
      });
      
      // Convert canvas to an image and download it
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `temperature-scaling-${temperature.toFixed(1)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Failed to take screenshot. Make sure html2canvas is installed.");
    }
  };

  // Record a GIF of the animation
  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      // Load required libraries
      await Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js')
      ]);
      
      if (!window.html2canvas || !window.GIF) {
        alert("Failed to load required libraries. Please install them with: npm install html2canvas gif.js");
        return;
      }
      
      setIsRecording(true);
      setRecordingProgress(0);
      
      // First stop any ongoing animation
      setAnimationActive(false);
      
      // Wait for animation to stop
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create a new GIF
      const gif = new window.GIF({
        workers: 2,
        quality: 10,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
      });
      
      // Set initial temperature
      let currentTemp = 0.1;
      const totalFrames = 30; // Record 30 frames
      
      // Create a controlled animation for recording
      for (let i = 0; i < totalFrames; i++) {
        // Adjust temperature from 0.1 to 3.0 and back
        if (i < totalFrames / 2) {
          currentTemp = 0.1 + (i / (totalFrames / 2)) * 2.9;
        } else {
          currentTemp = 3.0 - ((i - totalFrames / 2) / (totalFrames / 2)) * 2.9;
        }
        
        currentTemp = parseFloat(currentTemp.toFixed(1));
        setTemperature(currentTemp);
        setData(calculateScaledData(currentTemp));
        
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture frame with html2canvas
        const canvas = await window.html2canvas(containerRef.current, {
          backgroundColor: '#f9fafb',
          scale: 1,
          logging: false
        });
        
        // Add the frame to the GIF
        gif.addFrame(canvas, { copy: true, delay: 200 });
        
        // Update progress
        setRecordingProgress(((i + 1) / totalFrames) * 100);
      }
      
      // Render the GIF
      gif.on('finished', function(blob) {
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'temperature-scaling-animation.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        setIsRecording(false);
      });
      
      gif.render();
      
    } catch (error) {
      console.error("GIF recording failed:", error);
      alert("Failed to record GIF. Make sure gif.js and html2canvas are installed.");
      setIsRecording(false);
    }
  };

  // Alternative method: For GitHub Pages where you may not be able to use external libraries,
  // here's a function to create a series of images at different temperatures
  const captureImageSeries = async () => {
    alert("This function would capture a series of static images at different temperature values " +
          "that you could use to create a GIF using an external tool.");
  };

  return (
    <div ref={containerRef} className="p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Rocket className="text-blue-500" />
        <h1 className="text-2xl font-bold text-center">Temperature Scaling: Language Model Demo</h1>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <p className="font-mono text-lg border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
          {getSampleSentence()}
        </p>
        {selectedToken && (
          <p className="mt-2 text-sm text-gray-600">
            Click on different bars to see how the sentence would continue with different tokens.
          </p>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium">Temperature: {temperature.toFixed(1)}</label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showLogits}
                onChange={() => setShowLogits(!showLogits)}
                className="mr-2"
              />
              <span>Show Logits</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm">Speed:</label>
              <select 
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="border rounded p-1 text-sm"
                disabled={isRecording}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            className="w-full"
            disabled={isRecording}
          />
          <button
            onClick={() => setAnimationActive(!animationActive)}
            className={`flex items-center gap-1 px-3 py-1 rounded ${
              animationActive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
            disabled={isRecording}
          >
            <Sliders size={16} />
            {animationActive ? 'Stop' : 'Animate'}
          </button>
          
          {/* <button
            onClick={takeScreenshot}
            title="Take Screenshot"
            className="flex items-center gap-1 px-3 py-1 rounded bg-green-500 text-white"
            disabled={isRecording}
          >
            <Camera size={16} />
            PNG
          </button> */}
          
          {/* <button
            onClick={startRecording}
            title="Record GIF Animation"
            className={`flex items-center gap-1 px-3 py-1 rounded ${
              isRecording ? 'bg-gray-400' : 'bg-purple-500 text-white'
            }`}
            disabled={isRecording}
          >
            <Download size={16} />
            {isRecording ? `Recording ${recordingProgress.toFixed(0)}%` : 'GIF'}
          </button> */}
        </div>
        
        {isRecording && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${recordingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-1 text-gray-600">Recording in progress...</p>
          </div>
        )}
      </div>
      
      <div ref={chartRef} className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Token Probabilities</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="token" />
              <YAxis
                domain={[0, showLogits ? 'auto' : 1]}
                tickFormatter={(tick) => showLogits ? tick.toFixed(1) : tick.toFixed(2)}
                label={{ 
                  value: showLogits ? 'Logit Value' : 'Probability', 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  showLogits ? value.toFixed(2) : value.toFixed(4),
                  name === "probability" ? "Probability" : "Scaled Logit"
                ]}
                labelFormatter={(label) => `Token: "${label}"`}
              />
              <Legend />
              <Bar
                dataKey={showLogits ? "scaledLogit" : "probability"}
                name={showLogits ? "Scaled Logit" : "Probability"}
                fill="#8884d8"
                activeBar={{ stroke: 'rgb(0, 99, 245)', strokeWidth: 2 }}
                isAnimationActive={!isRecording}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Effect of Temperature</h2>
          <div className="overflow-auto max-h-72">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Token</th>
                  <th className="px-4 py-2 text-left">Original Logit</th>
                  <th className="px-4 py-2 text-left">Scaled Logit</th>
                  <th className="px-4 py-2 text-left">Probability</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.token} 
                    className={`${selectedToken === item.token ? 'bg-blue-100' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setSelectedToken(item.token)}
                  >
                    <td className="px-4 py-2 border-t">{item.token}</td>
                    <td className="px-4 py-2 border-t">{item.baseLogit.toFixed(2)}</td>
                    <td className="px-4 py-2 border-t">{item.scaledLogit.toFixed(2)}</td>
                    <td className="px-4 py-2 border-t">{item.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Understanding Temperature Scaling</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg bg-blue-50">
            <h3 className="font-bold mb-1">High Temperature (T &gt; 1.0)</h3>
            <p>Flattens probability distribution, giving less likely words like "launchpad" a better chance. Increases creativity and randomness.</p>
          </div>
          <div className="p-3 border rounded-lg bg-gray-50">
            <h3 className="font-bold mb-1">Normal Temperature (T = 1.0)</h3>
            <p>Uses the original model distribution without modification. Balances predictability and variability.</p>
          </div>
          <div className="p-3 border rounded-lg bg-red-50">
            <h3 className="font-bold mb-1">Low Temperature (T &lt; 1.0)</h3>
            <p>Makes distribution peakier, focusing heavily on high-probability tokens like "moon". Produces more predictable text.</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold mb-1">The Math:</h3>
          <p>
            1. For each token, divide its logit by the temperature value<br />
            2. Apply softmax function to convert scaled logits to probabilities<br />
            3. Sample from this adjusted probability distribution
          </p>
        </div>
      </div>
      
    </div>
  );
}