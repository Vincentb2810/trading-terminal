import { useState, useEffect } from "react";
import GridLayout, { WidthProvider } from "react-grid-layout/legacy";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "leaflet/dist/leaflet.css";
import "./App.css";

const Grid = WidthProvider(GridLayout);

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"];
const REFRESH_INTERVAL_MS = 10000;
const DISASTER_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const NEWS_SYMBOL = "AAPL";

const STOCK_NAMES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
};

const WIDGET_LABELS = {
  chart: "Chart",
  news: "News",
  watchlist: "Marktübersicht · Watchlist",
  map: "Krisenkarte · Handelsrouten",
};

const WIDGET_CATALOG = [
  { type: "watchlist", label: "Watchlist hinzufügen" },
  { type: "chart", label: "Chart hinzufügen" },
  { type: "news", label: "News hinzufügen" },
  { type: "map", label: "Krisenkarte hinzufügen" },
];

const WIDGET_ICONS = {
  watchlist: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="17" y2="15" />
    </svg>
  ),
  chart: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="3" y1="17" x2="3" y2="9" />
      <line x1="8" y1="17" x2="8" y2="5" />
      <line x1="13" y1="17" x2="13" y2="11" />
      <line x1="17" y1="17" x2="3" y2="17" />
    </svg>
  ),
  news: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="13" x2="10" y2="13" />
    </svg>
  ),
  map: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10 17s6-5.5 6-9.5A6 6 0 0 0 4 7.5C4 11.5 10 17 10 17Z" />
      <circle cx="10" cy="7.5" r="1.8" />
    </svg>
  ),
};

const DEFAULT_WIDGETS = [
  { id: "chart-1", type: "chart" },
  { id: "news-1", type: "news" },
  { id: "watchlist-1", type: "watchlist" },
  { id: "map-1", type: "map" },
];

const DEFAULT_LAYOUT = [
  { i: "chart-1", x: 0, y: 0, w: 8, h: 12 },
  { i: "news-1", x: 8, y: 0, w: 4, h: 12 },
  { i: "watchlist-1", x: 0, y: 12, w: 8, h: 10 },
  { i: "map-1", x: 8, y: 12, w: 4, h: 10 },
];

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

// Handelsrouten-Risiken – statisch, da es dafür keine freie Echtzeit-API mit
// Koordinaten gibt. Nach Bedarf selbst erweitern/aktualisieren.
const TRADE_ROUTE_MARKERS = [
  {
    lat: 30.7,
    lng: 32.34,
    title: "Suezkanal",
    sub: "Blockade-Risiko · 2021 (Ever Given)",
  },
  {
    lat: 12.6,
    lng: 43.4,
    title: "Rotes Meer · Bab-el-Mandeb",
    sub: "Angriffe auf Frachtschiffe",
  },
];

// Geopolitische Risikogebiete – ebenfalls statisch/manuell gepflegt (siehe oben).
// Bewusst leer gelassen: Belegung ist eine redaktionelle Entscheidung, die du
// selbst triffst und regelmäßig aktualisierst, bevor das Repo gezeigt wird.
// Beispiel zum Ausfüllen:
// { lat: 0, lng: 0, title: 'Region', sub: 'Kurzbeschreibung' },
const CONFLICT_MARKERS = [];

// Infrastruktur – kuratierte Beispiele bekannter großer Standorte (Koordinaten
// näherungsweise). Gern erweitern.
const INFRASTRUCTURE_MARKERS = {
  nuclear: [
    {
      lat: 37.427,
      lng: 138.5969,
      title: "Kashiwazaki-Kariwa (Japan)",
      sub: "Größtes Kernkraftwerk der Welt (Kapazität)",
    },
    {
      lat: 44.3256,
      lng: -81.5996,
      title: "Bruce Nuclear (Kanada)",
      sub: "Größtes Kernkraftwerk Nordamerikas",
    },
    {
      lat: 47.5128,
      lng: 34.5853,
      title: "Saporischschja (Ukraine)",
      sub: "Größtes Kernkraftwerk Europas",
    },
    {
      lat: 33.3881,
      lng: -112.8646,
      title: "Palo Verde (USA)",
      sub: "Größtes Kernkraftwerk der USA",
    },
  ],
  oil: [
    {
      lat: 25.4295,
      lng: 49.6033,
      title: "Ghawar-Ölfeld (Saudi-Arabien)",
      sub: "Größtes Ölfeld der Welt",
    },
    {
      lat: 61.2558,
      lng: 1.8508,
      title: "Statfjord-Plattform (Nordsee)",
      sub: "Große Offshore-Förderplattform",
    },
    {
      lat: 70.2553,
      lng: -148.34,
      title: "Prudhoe Bay (Alaska)",
      sub: "Größtes Ölfeld der USA",
    },
  ],
  wind: [
    {
      lat: 53.88,
      lng: 1.79,
      title: "Hornsea (UK)",
      sub: "Größter Offshore-Windpark der Welt",
    },
    {
      lat: 39.0,
      lng: 96.0,
      title: "Gansu-Windpark (China)",
      sub: "Größter Onshore-Windpark der Welt",
    },
    {
      lat: 35.15,
      lng: -118.33,
      title: "Alta Wind Energy Center (USA)",
      sub: "Größter Onshore-Windpark der USA",
    },
  ],
};

const crisisIcon = L.divIcon({
  className: "tt-leaflet-pin",
  html: '<span class="tt-pin-dot"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const disasterIcons = {
  Red: L.divIcon({
    className: "tt-leaflet-pin",
    html: '<span class="tt-pin-dot tt-pin-red"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }),
  Orange: L.divIcon({
    className: "tt-leaflet-pin",
    html: '<span class="tt-pin-dot tt-pin-orange"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }),
  Green: L.divIcon({
    className: "tt-leaflet-pin",
    html: '<span class="tt-pin-dot tt-pin-green"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }),
};

function infraIcon(symbol, className) {
  return L.divIcon({
    className: "tt-leaflet-pin",
    html: `<span class="tt-infra-icon ${className}">${symbol}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const nuclearIcon = infraIcon("☢", "tt-infra-nuclear");
const oilIcon = infraIcon("🛢", "tt-infra-oil");
const windIcon = infraIcon("🌀", "tt-infra-wind");

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map]);
  return null;
}

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
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [quotes, setQuotes] = useState({});
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [news, setNews] = useState([]);
  const [newsError, setNewsError] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [disasterError, setDisasterError] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    disasters: true,
    tradeRoutes: true,
    conflicts: true,
    nuclear: false,
    oil: false,
    wind: false,
  });

  useEffect(() => {
    const hasWatchlist = widgets.some((w) => w.type === "watchlist");
    if (!hasWatchlist) return;

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
  }, [widgets]);

  useEffect(() => {
    const hasNews = widgets.some((w) => w.type === "news");
    if (!hasNews) return;

    fetch(`http://localhost:8080/api/news/${NEWS_SYMBOL}`)
      .then((res) => res.json())
      .then((data) => {
        setNews(data.slice(0, 10));
        setNewsError(null);
      })
      .catch((err) => setNewsError(err.message));
  }, [widgets]);

  useEffect(() => {
    const hasMap = widgets.some((w) => w.type === "map");
    if (!hasMap) return;

    const fetchDisasters = () => {
      fetch("http://localhost:8080/api/disasters")
        .then((res) => res.json())
        .then((data) => {
          setDisasters(data);
          setDisasterError(null);
        })
        .catch((err) => setDisasterError(err.message));
    };

    fetchDisasters();
    const interval = setInterval(fetchDisasters, DISASTER_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [widgets]);

  function addWidget(type) {
    const id = `${type}-${Date.now()}`;
    setWidgets((prev) => [...prev, { id, type }]);
    setLayout((prev) => [...prev, { i: id, x: 0, y: Infinity, w: 4, h: 10 }]);
  }

  function removeWidget(id) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setLayout((prev) => prev.filter((l) => l.i !== id));
  }

  function toggleLayer(key) {
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function renderWidgetContent(type) {
    if (type === "chart") {
      const candlePaths = buildCandlePaths(DEMO_CANDLES);
      const gridlines = "0,42.5 600,42.5 0,85 600,85 0,127.5 600,127.5";
      return (
        <>
          <div className="tt-chart-head">
            <div className="tt-chart-symbol">
              <span className="tt-chart-ticker">AAPL</span>
              <span className="tt-chart-name">Apple Inc.</span>
            </div>
            <div className="tt-chart-price">
              <div className="tt-chart-value">341.66 $</div>
              <div className="positive">▲ 0.69 (0.20%)</div>
            </div>
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
          <p className="tt-placeholder-note">
            Platzhalterdaten – echte Kerzen folgen über Tiingo
          </p>
        </>
      );
    }

    if (type === "news") {
      return (
        <>
          {newsError && <p className="error">Fehler: {newsError}</p>}
          {news.map((item, i) => (
            <div className="tt-news-item" key={i}>
              <div className="tt-news-time">
                {new Date(item.datetime * 1000).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div>
                <span className="tt-news-tag">{item.source}</span>
                <a
                  className="tt-news-headline"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.headline}
                </a>
              </div>
            </div>
          ))}
        </>
      );
    }

    if (type === "watchlist") {
      return (
        <>
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
        </>
      );
    }

    if (type === "map") {
      const center = [21.65, 37.87];
      return (
        <div className="tt-map-wrap">
          <div className="tt-map-layers">
            <button
              className={
                mapLayers.disasters ? "tt-layer-btn active" : "tt-layer-btn"
              }
              onClick={() => toggleLayer("disasters")}
            >
              🌍 Naturkatastrophen
            </button>
            <button
              className={
                mapLayers.tradeRoutes ? "tt-layer-btn active" : "tt-layer-btn"
              }
              onClick={() => toggleLayer("tradeRoutes")}
            >
              🚢 Handelsrouten
            </button>
            <button
              className={
                mapLayers.conflicts ? "tt-layer-btn active" : "tt-layer-btn"
              }
              onClick={() => toggleLayer("conflicts")}
            >
              ⚠️ Konflikte
            </button>
            <button
              className={
                mapLayers.nuclear ? "tt-layer-btn active" : "tt-layer-btn"
              }
              onClick={() => toggleLayer("nuclear")}
            >
              ☢ Atomkraft
            </button>
            <button
              className={mapLayers.oil ? "tt-layer-btn active" : "tt-layer-btn"}
              onClick={() => toggleLayer("oil")}
            >
              🛢 Öl
            </button>
            <button
              className={
                mapLayers.wind ? "tt-layer-btn active" : "tt-layer-btn"
              }
              onClick={() => toggleLayer("wind")}
            >
              🌀 Wind
            </button>
          </div>
          {disasterError && (
            <p className="error tt-map-error">
              Katastrophen-Feed: {disasterError}
            </p>
          )}
          <div className="tt-map-viewport">
            <MapContainer
              center={center}
              zoom={3}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap-Mitwirkende"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizeHandler />

              {mapLayers.disasters &&
                disasters.map((d) => (
                  <Marker
                    key={d.id}
                    position={[d.lat, d.lon]}
                    icon={disasterIcons[d.alertLevel] || disasterIcons.Green}
                  >
                    <Popup>
                      <strong>{d.title}</strong>
                      <br />
                      {d.country} · {d.type} · Alert: {d.alertLevel}
                    </Popup>
                  </Marker>
                ))}

              {mapLayers.tradeRoutes &&
                TRADE_ROUTE_MARKERS.map((marker, i) => (
                  <Marker
                    key={`tr-${i}`}
                    position={[marker.lat, marker.lng]}
                    icon={crisisIcon}
                  >
                    <Popup>
                      <strong>{marker.title}</strong>
                      <br />
                      {marker.sub}
                    </Popup>
                  </Marker>
                ))}

              {mapLayers.conflicts &&
                CONFLICT_MARKERS.map((marker, i) => (
                  <Marker
                    key={`cf-${i}`}
                    position={[marker.lat, marker.lng]}
                    icon={crisisIcon}
                  >
                    <Popup>
                      <strong>{marker.title}</strong>
                      <br />
                      {marker.sub}
                    </Popup>
                  </Marker>
                ))}

              {mapLayers.nuclear &&
                INFRASTRUCTURE_MARKERS.nuclear.map((m, i) => (
                  <Marker
                    key={`nu-${i}`}
                    position={[m.lat, m.lng]}
                    icon={nuclearIcon}
                  >
                    <Popup>
                      <strong>{m.title}</strong>
                      <br />
                      {m.sub}
                    </Popup>
                  </Marker>
                ))}

              {mapLayers.oil &&
                INFRASTRUCTURE_MARKERS.oil.map((m, i) => (
                  <Marker
                    key={`oil-${i}`}
                    position={[m.lat, m.lng]}
                    icon={oilIcon}
                  >
                    <Popup>
                      <strong>{m.title}</strong>
                      <br />
                      {m.sub}
                    </Popup>
                  </Marker>
                ))}

              {mapLayers.wind &&
                INFRASTRUCTURE_MARKERS.wind.map((m, i) => (
                  <Marker
                    key={`wind-${i}`}
                    position={[m.lat, m.lng]}
                    icon={windIcon}
                  >
                    <Popup>
                      <strong>{m.title}</strong>
                      <br />
                      {m.sub}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </div>
      );
    }

    return null;
  }

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

      <div className="tt-layout-row">
        <div className="tt-grid-area">
          <Grid
            layout={layout}
            cols={12}
            rowHeight={30}
            margin={[20, 20]}
            draggableHandle=".tt-widget-header"
            draggableCancel=".tt-widget-remove"
            onLayoutChange={setLayout}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="tt-widget">
                <div className="tt-widget-header">
                  <span>{WIDGET_LABELS[widget.type]}</span>
                  <button
                    className="tt-widget-remove"
                    onClick={() => removeWidget(widget.id)}
                  >
                    ×
                  </button>
                </div>
                <div
                  className={
                    widget.type === "map"
                      ? "tt-widget-body tt-widget-body--map"
                      : "tt-widget-body"
                  }
                >
                  {renderWidgetContent(widget.type)}
                </div>
              </div>
            ))}
          </Grid>
        </div>

        <aside className="tt-sidebar">
          {WIDGET_CATALOG.map((item) => (
            <button
              key={item.type}
              className="tt-add-icon-btn"
              onClick={() => addWidget(item.type)}
              title={item.label}
              aria-label={item.label}
            >
              {WIDGET_ICONS[item.type]}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default App;
