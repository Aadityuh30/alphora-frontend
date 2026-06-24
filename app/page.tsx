"use client";

import { useState } from "react";
import Link from "next/link";

const API = "https://YOUR-RENDER-URL.onrender.com";

type Prediction = {
  ticker: string;
  as_of: string;
  current_price: number;
  direction: string;
  direction_prob: number;
  signal: string;
  signal_probs: { BUY: number; HOLD: number; SELL: number };
  expected_return_pct: number;
  horizon_days: number;
  confidence: string;
};

function SignalBadge({ signal }: { signal: string }) {
  const cls =
    signal === "BUY"
      ? "signal-buy"
      : signal === "SELL"
      ? "signal-sell"
      : "signal-hold";
  return (
    <span
      className={`mono ${cls}`}
      style={{
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.08em",
      }}
    >
      {signal}
    </span>
  );
}

function LiveDemo() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/predict/${ticker.trim().toUpperCase()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Prediction failed");
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const glowClass = result
    ? result.signal === "BUY"
      ? "glow-buy"
      : result.signal === "SELL"
      ? "glow-sell"
      : "glow-hold"
    : "";

  return (
    <div
      style={{
        background: "#111118",
        border: "1px solid #2a2a38",
        borderRadius: 12,
        padding: "28px 32px",
        maxWidth: 480,
        width: "100%",
      }}
    >
      <p style={{ color: "#6b6b80", fontSize: 12, letterSpacing: "0.1em", marginBottom: 16 }}>
        LIVE SIGNAL DEMO
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="AAPL · TCS.NS · RELIANCE.NS"
          style={{
            flex: 1,
            background: "#1a1a24",
            border: "1px solid #2a2a38",
            borderRadius: 6,
            padding: "10px 14px",
            color: "#e8e8f0",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? "#1a1a24" : "#00d97e",
            color: loading ? "#6b6b80" : "#09090f",
            border: "none",
            borderRadius: 6,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            fontFamily: "inherit",
          }}
        >
          {loading ? "..." : "Run"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#ff4d6d", fontSize: 13, marginTop: 12 }}>
          {error.includes("404") || error.includes("No trained")
            ? "No model trained for this ticker yet."
            : error}
        </p>
      )}

      {result && (
        <div
          className={glowClass}
          style={{
            marginTop: 20,
            background: "#1a1a24",
            borderRadius: 8,
            padding: "20px 24px",
            transition: "box-shadow 0.3s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{result.ticker}</p>
              <p style={{ color: "#6b6b80", fontSize: 12, marginTop: 2 }}>as of {result.as_of}</p>
            </div>
            <SignalBadge signal={result.signal} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
            <div>
              <p style={{ color: "#6b6b80", fontSize: 11, letterSpacing: "0.08em" }}>PRICE</p>
              <p className="mono" style={{ fontSize: 18, marginTop: 2 }}>
                ${result.current_price.toFixed(2)}
              </p>
            </div>
            <div>
              <p style={{ color: "#6b6b80", fontSize: 11, letterSpacing: "0.08em" }}>EXP. RETURN</p>
              <p
                className="mono"
                style={{
                  fontSize: 18,
                  marginTop: 2,
                  color: result.expected_return_pct >= 0 ? "#00d97e" : "#ff4d6d",
                }}
              >
                {result.expected_return_pct >= 0 ? "+" : ""}
                {result.expected_return_pct.toFixed(2)}%
              </p>
            </div>
            <div>
              <p style={{ color: "#6b6b80", fontSize: 11, letterSpacing: "0.08em" }}>DIRECTION</p>
              <p className="mono" style={{ fontSize: 14, marginTop: 2 }}>
                {result.direction} · {(result.direction_prob * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p style={{ color: "#6b6b80", fontSize: 11, letterSpacing: "0.08em" }}>CONFIDENCE</p>
              <p className="mono" style={{ fontSize: 14, marginTop: 2 }}>{result.confidence}</p>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #2a2a38" }}>
            <p style={{ color: "#6b6b80", fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>
              SIGNAL PROBABILITY
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["BUY", "HOLD", "SELL"] as const).map((s) => (
                <div key={s} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: 3,
                      background:
                        s === "BUY" ? "#00d97e" : s === "SELL" ? "#ff4d6d" : "#f5a623",
                      borderRadius: 2,
                      opacity: result.signal === s ? 1 : 0.25,
                      marginBottom: 4,
                      width: `${result.signal_probs[s] * 100}%`,
                      minWidth: "10%",
                    }}
                  />
                  <p className="mono" style={{ fontSize: 11, color: "#6b6b80" }}>
                    {s} {(result.signal_probs[s] * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: "#6b6b80", fontSize: 10, marginTop: 14 }}>
            ⚠ Not financial advice · {result.horizon_days}-day horizon
          </p>
        </div>
      )}
    </div>
  );
}

const FEATURES = [
  { label: "29 technical indicators", desc: "RSI, MACD, Bollinger Bands, ATR, OBV and more — computed fresh on every signal." },
  { label: "NSE + US markets", desc: "Full coverage of Indian and American equities in one dashboard." },
  { label: "3 signal types", desc: "Direction (up/down), Buy/Hold/Sell classification, and expected % return." },
  { label: "Walk-forward validation", desc: "Models are backtested with time-series safe CV — no future leakage." },
  { label: "Confidence scoring", desc: "Every signal comes with a confidence level so you know when the model is uncertain." },
  { label: "Versioned model registry", desc: "Every model is tracked and versioned. Roll back anytime." },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#09090f" }}>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
          borderBottom: "1px solid #2a2a38",
          position: "sticky",
          top: 0,
          background: "#09090f",
          zIndex: 50,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
          alph<span style={{ color: "#00d97e" }}>ora</span>
        </span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#features" style={{ color: "#6b6b80", fontSize: 14, textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ color: "#6b6b80", fontSize: 14, textDecoration: "none" }}>Pricing</a>
          <Link
            href="/dashboard"
            style={{
              background: "#00d97e",
              color: "#09090f",
              padding: "8px 18px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: "100px 48px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              color: "#00d97e",
              fontSize: 12,
              letterSpacing: "0.15em",
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            ML-POWERED STOCK SIGNALS
          </p>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 24,
            }}
          >
            Stop guessing.
            <br />
            <span style={{ color: "#00d97e" }}>Start knowing.</span>
          </h1>
          <p style={{ color: "#6b6b80", fontSize: 18, lineHeight: 1.7, marginBottom: 36 }}>
            Alphora runs XGBoost models trained on 5 years of market data to generate
            Buy, Hold, and Sell signals for NSE and US stocks — updated daily.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard"
              style={{
                background: "#00d97e",
                color: "#09090f",
                padding: "13px 28px",
                borderRadius: 7,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Open dashboard
            </Link>
            <a
              href="#demo"
              style={{
                border: "1px solid #2a2a38",
                color: "#e8e8f0",
                padding: "13px 28px",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Try live demo ↓
            </a>
          </div>
        </div>

        {/* Live demo widget in hero */}
        <div id="demo">
          <LiveDemo />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          padding: "80px 48px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: "1px solid #2a2a38",
        }}
      >
        <p style={{ color: "#6b6b80", fontSize: 12, letterSpacing: "0.1em", marginBottom: 12 }}>
          UNDER THE HOOD
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 48 }}>
          How Alphora works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {FEATURES.map((f) => (
            <div
              key={f.label}
              style={{
                background: "#111118",
                border: "1px solid #2a2a38",
                borderRadius: 10,
                padding: "24px 28px",
              }}
            >
              <p style={{ color: "#00d97e", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                {f.label}
              </p>
              <p style={{ color: "#6b6b80", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        style={{
          padding: "80px 48px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: "1px solid #2a2a38",
        }}
      >
        <p style={{ color: "#6b6b80", fontSize: 12, letterSpacing: "0.1em", marginBottom: 12 }}>
          PRICING
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 48 }}>
          Simple, transparent
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {/* Free */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #2a2a38",
              borderRadius: 12,
              padding: "32px",
            }}
          >
            <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 12 }}>FREE</p>
            <p style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>₹0</p>
            <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 28 }}>forever</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["5 stocks", "NSE + US", "Daily signals", "7-day delay"].map((f) => (
                <li key={f} style={{ color: "#6b6b80", fontSize: 14, display: "flex", gap: 8 }}>
                  <span style={{ color: "#2a2a38" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              style={{
                display: "block",
                marginTop: 28,
                border: "1px solid #2a2a38",
                color: "#e8e8f0",
                padding: "11px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #00d97e",
              borderRadius: 12,
              padding: "32px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#00d97e",
                color: "#09090f",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: 20,
                letterSpacing: "0.08em",
              }}
            >
              MOST POPULAR
            </span>
            <p style={{ color: "#00d97e", fontSize: 13, marginBottom: 12 }}>PRO</p>
            <p style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>₹499</p>
            <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 28 }}>per month</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["Unlimited stocks", "NSE + US markets", "Real-time signals", "Confidence scores", "Email alerts", "Portfolio tracker"].map((f) => (
                <li key={f} style={{ color: "#e8e8f0", fontSize: 14, display: "flex", gap: 8 }}>
                  <span style={{ color: "#00d97e" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              style={{
                display: "block",
                width: "100%",
                marginTop: 28,
                background: "#00d97e",
                color: "#09090f",
                border: "none",
                padding: "12px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Subscribe — ₹499/mo
            </button>
          </div>

          {/* Enterprise */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #2a2a38",
              borderRadius: 12,
              padding: "32px",
            }}
          >
            <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 12 }}>ENTERPRISE</p>
            <p style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>Custom</p>
            <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 28 }}>for teams</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["Everything in Pro", "API access", "Custom tickers", "Dedicated support", "SLA guarantee", "White-label option"].map((f) => (
                <li key={f} style={{ color: "#6b6b80", fontSize: 14, display: "flex", gap: 8 }}>
                  <span style={{ color: "#2a2a38" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              style={{
                display: "block",
                width: "100%",
                marginTop: 28,
                border: "1px solid #2a2a38",
                background: "transparent",
                color: "#e8e8f0",
                padding: "11px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Contact us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #2a2a38",
          padding: "32px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#6b6b80",
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 800, color: "#e8e8f0" }}>
          alph<span style={{ color: "#00d97e" }}>ora</span>
        </span>
        <span>⚠ Not financial advice. Past model performance does not guarantee future returns.</span>
      </footer>
    </div>
  );
}