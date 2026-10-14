import { useState, useEffect } from "react";
import "./App.css";

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"];
const REFRESH_INTERVAL_MS = 10000;

const STOCK_NAMES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
};

const DEMO_CANDLES = [
  { o: 336, h: 339, l: 334, c: 338 },
  { o: 338, h: 341, l: 337, c: 336 },
  { o: 336, h: 338, l: 333, c: 337 },
  { o: 337, h: 342, l: 336, c: 341 },
  { o: 341, h: 343, l: 338, c: 339 },
  { o: 339, h: 344, l: 338, c: 343 },
  { o: 343, h: 345, l: 340, c: 341 },
  { o: 341, h: 346, l: 340, c: 345 },
  { o: 345, h: 347, l: 342, c: 343 },
  { o: 343, h: 348, l: 342, c: 347 },
  { o: 347, h: 349, l: 344, c: 345 },
  { o: 345, h: 347, l: 341, c: 342 },
  { o: 342, h: 344, l: 339, c: 343 },
  { o: 343, h: 346, l: 341, c: 344 },
  { o: 344, h: 345, l: 340, c: 341 },
  { o: 341, h: 344, l: 339, c: 343 },
  { o: 343, h: 347, l: 342, c: 346 },
  { o: 346, h: 348.15, l: 343, c: 344 },
  { o: 344, h: 346, l: 340.74, c: 342 },
  { o: 342, h: 344, l: 340, c: 341.66 },
];

const DEMO_NEWS = [
  {
    time: "14:32",
    tag: "AAPL",
    headline:
      "Apple kündigt neues Service-Bundle an, Kurs reagiert leicht positiv",
  },
  {
    time: "14:10",
    tag: "TSLA",
    headline: "Lieferzahlen für Q3 übertreffen Analystenschätzungen",
  },
  {
    time: "13:47",
    tag: "MSFT",
    headline: "Cloud-Sparte wächst zweistellig im Jahresvergleich",
  },
  {
    time: "13:22",
    tag: "MARKT",
    headline: "US-Inflationsdaten kommen leicht unter den Erwartungen rein",
  },
  {
    time: "12:58",
    tag: "NVDA",
    headline: "Neue Chip-Generation für Rechenzentren vorgestellt",
  },
  {
    time: "12:30",
    tag: "AMZN",
    headline: "Logistikausbau in Europa angekündigt",
  },
];

const CRISIS_MARKERS = [
  {
    top: "38%",
    left: "54%",
    title: "Suezkanal",
    sub: "Blockade-Risiko · 2021",
  },
  {
    top: "52%",
    left: "58%",
    title: "Rotes Meer",
    sub: "Angriffe auf Frachtschiffe",
  },
];

function buildCandlePaths(data, w = 600, h = 170, pad = 6) {
  const allValues = data.flatMap((d) => [d.h, d.l]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const innerW = w - pad * 2;
  const slot = innerW / data.length;
  const candleW = Math.max(3, slot * 0.55);
  const y = (v) => pad + (h - pad * 2) * (1 - (v - min) / range);

  let wicksUp = "",
    wicksDown = "",
    bodiesUp = "",
    bodiesDown = "";

  data.forEach((d, i) => {
    const cx = pad + slot * i + slot / 2;
    const isUp = d.c >= d.o;
    const wickSeg = `M ${cx.toFixed(1)} ${y(d.h).toFixed(1)} L ${cx.toFixed(1)} ${y(d.l).toFixed(1)} `;
    const bx = cx - candleW / 2;
    const byTop = y(Math.max(d.o, d.c));
    const byBottom = y(Math.min(d.o, d.c));
    const bh = Math.max(1.5, byBottom - byTop);
    const bodySeg = `M ${bx.toFixed(1)} ${byTop.toFixed(1)} H ${(bx + candleW).toFixed(1)} V ${(byTop + bh).toFixed(1)} H ${bx.toFixed(1)} Z `;
    if (isUp) {
      wicksUp += wickSeg;
      bodiesUp += bodySeg;
    } else {
      wicksDown += wickSeg;
      bodiesDown += bodySeg;
    }
  });

  return { wicksUp, wicksDown, bodiesUp, bodiesDown };
}

function App() {
  const [quotes, setQuotes] = useState({});
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    const fetchAll = () => {
      Promise.all(
        SYMBOLS.map((symbol) =>
          fetch(`http://localhost:8080/api/quote/${symbol}`)
            .then((res) => res.json())
            .then((data) => [symbol, data]),
        ),
      )
        .then((results) => {
          const next = {};
          results.forEach(([symbol, data]) => {
            next[symbol] = data;
          });
          setQuotes(next);
          setError(null);
          setLastFetch(new Date());
        })
        .catch((err) => setError(err.message));
    };

    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const candlePaths = buildCandlePaths(DEMO_CANDLES);
  const gridlines = "0,42.5 600,42.5 0,85 600,85 0,127.5 600,127.5";

  return (
    <div className="page">
      <header className="tt-header">
        <div className="tt-header-left">
          <h1 className="tt-logo">TRADING TERMINAL</h1>
          <nav className="tt-nav">
            <button className="tt-tab active">Übersicht</button>
            <button className="tt-tab">Watchlist</button>
            <button className="tt-tab">Portfolio</button>
            <button className="tt-tab">Einstellungen</button>
          </nav>
        </div>
        <div className="tt-header-right">
          <label className="tt-search">
            <span className="sr-only">Symbol suchen</span>
            <input type="text" placeholder="Symbol suchen…" />
          </label>
          <div className="tt-status">
            <span className="tt-status-dot" />
            Markets Open
          </div>
        </div>
      </header>

      <div className="tt-grid">
        <section className="tt-panel tt-chart-panel">
          <div className="tt-chart-head">
            <div>
              <div
                className="tt-panel-title"
                style={{ border: "none", padding: 0, margin: 0 }}
              >
                Chart
              </div>
              <div className="tt-chart-symbol">
                <span className="tt-chart-ticker">AAPL</span>
                <span className="tt-chart-name">Apple Inc.</span>
              </div>
            </div>
            <div className="tt-chart-price">
              <div className="tt-chart-value">341.66 $</div>
              <div className="positive">▲ 0.69 (0.20%)</div>
            </div>
          </div>

          <div className="tt-timeframes">
            <button className="tt-timeframe">1T</button>
            <button className="tt-timeframe active">1W</button>
            <button className="tt-timeframe">1M</button>
            <button className="tt-timeframe">1J</button>
            <button className="tt-timeframe">5J</button>
          </div>

          <svg
            viewBox="0 0 600 190"
            className="tt-chart-svg"
            preserveAspectRatio="none"
          >
            <polyline
              points={gridlines}
              fill="none"
              stroke="#1c1c1c"
              strokeWidth="1"
            />
            <path
              d={candlePaths.wicksUp}
              stroke="#00c805"
              strokeWidth="1"
              fill="none"
            />
            <path
              d={candlePaths.wicksDown}
              stroke="#ff3b30"
              strokeWidth="1"
              fill="none"
            />
            <path d={candlePaths.bodiesUp} fill="#00c805" stroke="none" />
            <path d={candlePaths.bodiesDown} fill="#ff3b30" stroke="none" />
          </svg>

          <div className="tt-chart-stats">
            <span>H&nbsp;348.15</span>
            <span>L&nbsp;340.74</span>
            <span>O&nbsp;344.68</span>
            <span>VORTAG&nbsp;340.97</span>
          </div>
          <p className="tt-placeholder-note">
            Platzhalterdaten – echte Kerzen folgen über eine zweite API
          </p>
        </section>

        <section className="tt-panel">
          <div className="tt-panel-title">News</div>
          {DEMO_NEWS.map((item, i) => (
            <div className="tt-news-item" key={i}>
              <div className="tt-news-time">{item.time}</div>
              <div>
                <span className="tt-news-tag">{item.tag}</span>
                <span className="tt-news-headline">{item.headline}</span>
              </div>
            </div>
          ))}
          <p className="tt-placeholder-note">
            Platzhalterdaten – echte News folgen
          </p>
        </section>

        <section className="tt-panel">
          <div className="tt-panel-title">Marktübersicht · Watchlist</div>
          {error && <p className="error">Fehler: {error}</p>}
          <table className="tt-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Kurs</th>
                <th>Veränderung</th>
              </tr>
            </thead>
            <tbody>
              {SYMBOLS.map((symbol) => {
                const quote = quotes[symbol];
                if (!quote) return null;
                const change = quote.c - quote.pc;
                const changePercent = (change / quote.pc) * 100;
                const isPositive = change >= 0;
                return (
                  <tr key={symbol}>
                    <td className="tt-symbol-cell">{symbol}</td>
                    <td className="tt-name-cell">{STOCK_NAMES[symbol]}</td>
                    <td>{quote.c.toFixed(2)} $</td>
                    <td className={isPositive ? "positive" : "negative"}>
                      {isPositive ? "▲" : "▼"} {change.toFixed(2)} (
                      {changePercent.toFixed(2)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {lastFetch && (
            <p className="tt-last-update">
              Letztes Update: {lastFetch.toLocaleTimeString("de-DE")}
            </p>
          )}
        </section>

        <section className="tt-panel">
          <div className="tt-panel-title">Krisenkarte · Handelsrouten</div>
          <div className="tt-map">
            {CRISIS_MARKERS.map((marker, i) => (
              <div
                className="tt-pin"
                style={{ top: marker.top, left: marker.left }}
                key={i}
              >
                <div className="tt-pin-dot" />
                <div className="tt-pin-label">
                  {marker.title}
                  <span className="sub">{marker.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
