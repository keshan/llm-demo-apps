# Temperature Scaling & Logit Filtering Demo

A modern, interactive React app for visualizing and experimenting with language model logit filtering strategies: **Temperature Scaling**, **Min-P Filtering**, **Top-K Filtering**, **Top-P (Nucleus) Filtering**, and a **Filter Pipeline** dashboard.

## 🚀 Features

- **Temperature Scaling Dashboard:**
  - Adjust temperature and see its effect on token probabilities.
- **Min-P Filtering Dashboard:**
  - Dynamically filter out low-probability tokens based on a minimum probability threshold.
- **Top-K Filtering Dashboard:**
  - Keep only the top K tokens by logit value, discard the rest.
- **Top-P (Nucleus) Filtering Dashboard:**
  - Keep the smallest set of tokens whose cumulative probability exceeds a threshold P.
- **Filter Pipeline Dashboard:**
  - Adjust all filters and see how their order and values affect the final output.
  - Shows both sampled (stochastic) and greedy (argmax) completions.
  - Visualizes the effect of each filter stage.
- **Modern UI:**
  - Consistent, responsive design using Tailwind CSS and Lucide icons.
  - SVG favicon relevant to AI/filtering.

## 🧠 Educational Value
- Teaches the impact of each filtering strategy and the importance of correct filter order in language model decoding.
- Interactive controls for hands-on experimentation.

## 🛠️ Tech Stack
- **React** (functional components)
- **Tailwind CSS** for styling
- **Recharts** for visualization
- **Lucide React** for icons

## ⚡ Usage

```
npm install
npm start
```
- Open [http://localhost:3000](http://localhost:3000) to explore the dashboards.

### Build & Deploy
```
npm run build
npm run deploy
```

## 📂 Project Structure
- `src/`
  - `App.js` – Main app and navigation
  - `MinPDashboard.js`, `TopKDashboard.js`, `TopPDashboard.js`, `FilterPipelineDashboard.js` – Dashboards
  - `minp-utils.js`, `topk-utils.js`, `topp-utils.js`, `sample-utils.js` – Filtering and sampling logic
- `public/`
  - `favicon.svg`, `index.html`

## ✨ Customization
- Easily extend with new dashboards or filter logic.
- Swap out the favicon or update the UI theme in `tailwind.config.js`.

## License
MIT
