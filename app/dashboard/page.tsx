"use client";

import { useState, useEffect, useCallback } from "react";
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

const DEFAULT_WATCHLIST = ["AAPL"];

function SignalCard({ p }: { p: Prediction }) {
  const isBuy  = p.signal === "BUY";
  const isSell = p.signal === "SELL";
  const accent = isBuy ? "#00d97e" : isSell ? "#ff4d6d" : "#f5a623";
  const dimBg  = isBuy ? "#00d97e18" : isSell ? "#ff4d6d18" : "#f5a62318";

  return (
    <div
      style={{
        background: "#111118",
        border: `1px solid ${accent}44`,
        borderRadius: 12,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>{p.ticker}</p>
          <p style={{ color: "#6b6b80", fontSize: 12, marginTop: 2 }}>{p.as_of}</p>
        </div>
        <span
          style={{
            background: dimBg,
            color: accent,
            padding: "4px 12px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          {p.signal}
        </span>
      </div>

      {/* Price + return */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#1a1a24", borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ color: "#6b6b80", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>PRICE</p>
          <p style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 600 }}>
            ${p.current_price.toFixed(2)}
          </p>
        </div>
        <div style={{ background: "#1a1a24", borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ color: "#6b6b80", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
            {p.horizon_days}D RETURN
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 600,
              color: p.expected_return_pct >= 0 ? "#00d97e" : "#ff4d6d",
            }}
          >
            {p.expected_return_pct >= 0 ? "+" : ""}{p.expected_return_pct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Direction */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#6b6b80", fontSize: 10, letterSpacing: "0.08em", marginBottom: 3 }}>DIRECTION</p>
          <p style={{ fontFamily: "monospace", fontSize: 13 }}>
            {p.direction} · {(p.direction_prob * 100).toFixed(0)}%
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#6b6b80", fontSize: 10, letterSpacing: "0.08em", marginBottom: 3 }}>CONFIDENCE</p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              color:
                p.confidence === "HIGH" ? "#00d97e" :
                p.confidence === "MEDIUM" ? "#f5a623" : "#6b6b80",
            }}
          >
            {p.confidence}
          </p>
        </div>
      </div>

      {/* Probability bars */}
      <div>
        <p style={{ color: "#6b6b80", fontSize: 10, letterSpacing: "0.08em", marginBottom: 8 }}>
          SIGNAL PROBABILITY
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {(["BUY", "HOLD", "SELL"] as const).map((s) => {
            const pct = p.signal_probs[s];
            const c = s === "BUY" ? "#00d97e" : s === "SELL" ? "#ff4d6d" : "#f5a623";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6b80", width: 32 }}>{s}</p>
                <div style={{ flex: 1, background: "#1a1a24", borderRadius: 2, height: 4 }}>
                  <div
                    style={{
                      width: `${pct * 100}%`,
                      height: "100%",
                      background: c,
                      borderRadius: 2,
                      opacity: p.signal === s ? 1 : 0.3,
                    }}
                  />
                </div>
                <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6b80", width: 32, textAlign: "right" }}>
                  {(pct * 100).toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111118",
        border: "1px solid #2a2a38",
        borderRadius: 12,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {[80, 60, 100, 40].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 24 : 14,
            width: `${w}%`,
            background: "#1a1a24",
            borderRadius: 4,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrediction = useCallback(async (ticker: string) => {
    setLoading((l) => ({ ...l, [ticker]: true }));
    setErrors((e) => ({ ...e, [ticker]: "" }));
    try {
      const res = await fetch(`${API}/predict/${ticker}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed");
      }
      const data: Prediction = await res.json();
      setPredictions((p) => ({ ...p, [ticker]: data }));
    } catch (e: unknown) {
      setErrors((err) => ({
        ...err,
        [ticker]: e instanceof Error ? e.message : "Error",
      }));
    } finally {
      setLoading((l) => ({ ...l, [ticker]: false }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(watchlist.map(fetchPrediction));
    setRefreshing(false);
  }, [watchlist, fetchPrediction]);

  useEffect(() => {
    watchlist.forEach(fetchPrediction);
  }, []);

  const addTicker = () => {
    const t = input.trim().toUpperCase();
    if (!t || watchlist.includes(t)) return;
    setWatchlist((w) => [...w, t]);
    setInput("");
    fetchPrediction(t);
  };

  const removeTicker = (t: string) => {
    setWatchlist((w) => w.filter((x) => x !== t));
    setPredictions((p) => { const n = { ...p }; delete n[t]; return n; });
  };

  const buyCount  = Object.values(predictions).filter((p) => p.signal === "BUY").length;
  const sellCount = Object.values(predictions).filter((p) => p.signal === "SELL").length;
  const holdCount = Object.values(predictions).filter((p) => p.signal === "HOLD").length;

  return (
    <div style={{ minHeight: "100vh", background: "#09090f" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid #2a2a38",
          position: "sticky",
          top: 0,
          background: "#09090f",
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#e8e8f0" }}>
            alph<span style={{ color: "#00d97e" }}>ora</span>
          </span>
        </Link>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTicker()}
            placeholder="Add ticker — MSFT · INFY.NS"
            style={{
              background: "#111118",
              border: "1px solid #2a2a38",
              borderRadius: 6,
              padding: "8px 14px",
              color: "#e8e8f0",
              fontSize: 13,
              width: 240,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={addTicker}
            style={{
              background: "#00d97e",
              color: "#09090f",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Add
          </button>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            style={{
              background: "transparent",
              border: "1px solid #2a2a38",
              color: refreshing ? "#6b6b80" : "#e8e8f0",
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: 13,
              cursor: refreshing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px" }}>
        {/* Summary bar */}
        {Object.keys(predictions).length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 32,
              padding: "16px 24px",
              background: "#111118",
              border: "1px solid #2a2a38",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <p style={{ color: "#6b6b80", fontSize: 12, letterSpacing: "0.08em", marginRight: 8 }}>
              WATCHLIST SUMMARY
            </p>
            <span style={{ color: "#00d97e", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
              {buyCount} BUY
            </span>
            <span style={{ color: "#6b6b80" }}>·</span>
            <span style={{ color: "#f5a623", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
              {holdCount} HOLD
            </span>
            <span style={{ color: "#6b6b80" }}>·</span>
            <span style={{ color: "#ff4d6d", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
              {sellCount} SELL
            </span>
            <span style={{ marginLeft: "auto", color: "#6b6b80", fontSize: 12 }}>
              5-day horizon · ⚠ Not financial advice
            </span>
          </div>
        )}

        {/* Signal cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {watchlist.map((ticker) => (
            <div key={ticker} style={{ position: "relative" }}>
              {/* Remove button */}
              <button
                onClick={() => removeTicker(ticker)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  background: "transparent",
                  border: "none",
                  color: "#6b6b80",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
                title="Remove"
              >
                ×
              </button>

              {loading[ticker] ? (
                <SkeletonCard />
              ) : errors[ticker] ? (
                <div
                  style={{
                    background: "#111118",
                    border: "1px solid #ff4d6d33",
                    borderRadius: 12,
                    padding: "24px",
                    color: "#6b6b80",
                    fontSize: 14,
                  }}
                >
                  <p style={{ fontFamily: "monospace", fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>
                    {ticker}
                  </p>
                  <p style={{ color: "#ff4d6d", fontSize: 13 }}>
                    {errors[ticker].includes("No trained") || errors[ticker].includes("404")
                      ? "No model trained yet. Run: python run.py train " + ticker
                      : errors[ticker]}
                  </p>
                </div>
              ) : predictions[ticker] ? (
                <SignalCard p={predictions[ticker]} />
              ) : null}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {watchlist.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6b6b80" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📈</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#e8e8f0", marginBottom: 8 }}>
              Your watchlist is empty
            </p>
            <p style={{ fontSize: 14 }}>Add a ticker above to see signals — try AAPL or TCS.NS</p>
          </div>
        )}
      </main>
    </div>
  );
}