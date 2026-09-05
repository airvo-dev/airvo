import { useState } from "react";

const MODEL_PRICES = {
  openai: 5,
  anthropic: 9,
  groq: 0,
  ollama: 0,
  lmstudio: 0,
  together: 0.2,
  cerebras: 0.1,
  openrouter: 1,
  mistral: 0.5,
  deepseek: 0.1,
  gemini: 0.35,
  cohere: 0.5,
  fireworks: 0.5,
  novita: 0.5,
};

export default function StatsPage({ t, statsData, models, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const getProvider = (id) => (id || "").split("/")[0].toLowerCase();
  const getPrice = (id) => MODEL_PRICES[getProvider(id)] ?? 1;
  const getCost = (id, tokens) => (tokens / 1_000_000) * getPrice(id);
  const isLocal = (id) => ["ollama", "lmstudio"].includes(getProvider(id));
  const isFree = (id) => getPrice(id) === 0;
  const fmtCost = (c) => (c < 0.001 ? (isFree ? "" : "<$0.001") : `$${c.toFixed(4)}`);
  const fmtTokens = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  const entries = Object.entries(statsData);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const dayLabel = (iso) => {
    const d = new Date(iso);
    return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
  };

  if (entries.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
        <div style={{ fontSize: 32 }}>📊</div>
        <div style={{ color: "var(--text2)", fontSize: 14 }}>{t("stats_empty")}</div>
      </div>
    );
  }

  const maxTokens = Math.max(...entries.map(([, s]) => s.tokens || 0), 1);
  const maxCopies = Math.max(...entries.map(([, s]) => s.copies || 0), 1);
  const totalTokens = entries.reduce((a, [, s]) => a + (s.tokens || 0), 0);
  const totalCost = entries.reduce((a, [id, s]) => a + getCost(id, s.tokens || 0), 0);
  const totalReqs = entries.reduce((a, [, s]) => a + (s.requests || 0), 0);

  const byTokens = [...entries].sort((a, b) => (b[1].tokens || 0) - (a[1].tokens || 0));
  const byQuality = [...entries].sort((a, b) => (b[1].copies || 0) - (a[1].copies || 0));
  const byLatency = [...entries]
    .filter(([, s]) => (s.latency || []).length > 0)
    .sort((a, b) => {
      const avg = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;
      return avg(a[1].latency) - avg(b[1].latency);
    });

  const maxDayTokens = Math.max(
    ...entries.flatMap(([, s]) => last7.map((d) => s.daily?.[d]?.tokens || 0)),
    1,
  );

  const sectionStyle = { marginBottom: 28 };
  const sectionHead = {
    fontFamily: "var(--mono)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--text2)",
    textTransform: "uppercase",
    marginBottom: 14,
  };
  const rowStyle = { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 };
  const nameStyle = {
    minWidth: 130,
    maxWidth: 130,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: "var(--text)",
    fontFamily: "var(--mono)",
  };
  const barTrack = {
    flex: 1,
    height: 10,
    borderRadius: 5,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  };
  const numStyle = {
    minWidth: 54,
    textAlign: "right",
    fontSize: 12,
    fontFamily: "var(--mono)",
    color: "var(--text2)",
  };

  const modelName = (id) => models.find((m) => m.id === id)?.name || id.split("/")[1] || id;

  return (
    <div style={{ maxWidth: 780 }}>
      <h1 className="page-title">{t("stats_tab_title")}</h1>
      <p className="page-sub">{t("stats_tab_sub")}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
        {[
          { label: t("stats_total_tokens"), value: fmtTokens(totalTokens), color: "var(--accent)" },
          { label: t("stats_total_requests"), value: totalReqs.toLocaleString(), color: "var(--green)" },
          {
            label: t("stats_section_cost"),
            value: totalCost < 0.001 ? (totalCost === 0 ? t("stats_free") : "<$0.001") : `$${totalCost.toFixed(4)}`,
            color: "var(--yellow)",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: "var(--mono)" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={sectionHead}>📊 {t("stats_section_tokens")}</div>
        {byTokens.map(([id, s]) => (
          <div key={id} style={rowStyle}>
            <div style={nameStyle} title={id}>{modelName(id)}</div>
            <div style={barTrack}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 5,
                  background: "var(--accent)",
                  width: `${Math.max(2, Math.round(((s.tokens || 0) / maxTokens) * 100))}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div style={numStyle}>{fmtTokens(s.tokens || 0)}</div>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={sectionHead}>💰 {t("stats_section_cost")}</div>
        {byTokens.map(([id, s]) => {
          const cost = getCost(id, s.tokens || 0);
          const free = isFree(id);
          const local = isLocal(id);
          return (
            <div key={id} style={rowStyle}>
              <div style={nameStyle} title={id}>{modelName(id)}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                {free ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "rgba(0,200,100,0.12)",
                      color: "var(--green)",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    {local ? t("stats_local") : t("stats_free")}
                  </span>
                ) : (
                  <>
                    <div style={barTrack}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 5,
                          background: "var(--yellow)",
                          width: `${Math.max(2, Math.round((cost / Math.max(totalCost, 0.0001)) * 100))}%`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 70, textAlign: "right", fontSize: 12, fontFamily: "var(--mono)", color: "var(--yellow)" }}>
                      {fmtCost(cost)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 6, fontFamily: "var(--mono)" }}>{t("stats_cost_note")}</div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHead}>⭐ {t("stats_section_quality")}</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>{t("stats_quality_note")}</div>
        {byQuality.map(([id, s], i) => {
          const copies = s.copies || 0;
          return (
            <div key={id} style={rowStyle}>
              <div style={{ minWidth: 22, fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>
                {i === 0 && copies > 0 ? "🥇" : i === 1 && copies > 0 ? "🥈" : i === 2 && copies > 0 ? "🥉" : `${i + 1}.`}
              </div>
              <div style={{ ...nameStyle, minWidth: 110, maxWidth: 110 }} title={id}>{modelName(id)}</div>
              <div style={barTrack}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 5,
                    background: i === 0 && copies > 0 ? "var(--yellow)" : "rgba(255,255,255,0.15)",
                    width: `${copies > 0 ? Math.max(4, Math.round((copies / maxCopies) * 100)) : 1}%`,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={numStyle}>{copies} {t("stats_copies")}</div>
            </div>
          );
        })}
      </div>

      {byLatency.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHead}>⚡ {t("stats_section_latency")}</div>
          {byLatency.map(([id, s]) => {
            const avg = s.latency.reduce((a, v) => a + v, 0) / s.latency.length;
            const minLat = byLatency[0]
              ? byLatency[0][1].latency.reduce((a, v) => a + v, 0) / byLatency[0][1].latency.length
              : 1;
            const maxLat = Math.max(...byLatency.map(([, x]) => x.latency.reduce((a, v) => a + v, 0) / x.latency.length), 1);
            const pct = Math.max(4, Math.round((avg / maxLat) * 100));
            const color = avg <= minLat * 1.5 ? "var(--green)" : avg <= minLat * 3 ? "var(--yellow)" : "var(--red)";
            return (
              <div key={id} style={rowStyle}>
                <div style={nameStyle} title={id}>{modelName(id)}</div>
                <div style={barTrack}>
                  <div style={{ height: "100%", borderRadius: 5, background: color, width: `${pct}%`, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ minWidth: 70, textAlign: "right", fontSize: 12, fontFamily: "var(--mono)", color }}>
                  {avg.toFixed(2)}{t("stats_latency_unit")} {t("stats_latency_avg")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={sectionStyle}>
        <div style={sectionHead}>📅 {t("stats_section_daily")}</div>
        {byTokens.map(([id, s]) => {
          const hasDailyData = last7.some((d) => (s.daily?.[d]?.tokens || 0) > 0);
          return (
            <div key={id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text)", fontFamily: "var(--mono)", marginBottom: 5 }}>{modelName(id)}</div>
              {!hasDailyData ? (
                <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)", paddingLeft: 2 }}>{t("stats_no_history")}</div>
              ) : (
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }}>
                  {last7.map((d) => {
                    const tok = s.daily?.[d]?.tokens || 0;
                    const h = maxDayTokens > 0 ? Math.max(3, Math.round((tok / maxDayTokens) * 32)) : 3;
                    return (
                      <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div
                          title={`${d}: ${tok.toLocaleString()} tokens`}
                          style={{
                            width: 22,
                            height: `${h}px`,
                            borderRadius: "3px 3px 0 0",
                            background: tok > 0 ? "var(--accent)" : "rgba(255,255,255,0.07)",
                            transition: "height 0.3s ease",
                            cursor: "default",
                          }}
                        />
                        <div style={{ fontSize: 9, color: "var(--text2)", fontFamily: "var(--mono)" }}>{dayLabel(d)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        {!confirmReset ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>🗑 {t("stats_reset")}</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{t("stats_reset_confirm")}</span>
            <button
              className="btn btn-sm"
              style={{ background: "var(--red)", color: "#fff", border: "none" }}
              onClick={async () => {
                await onReset();
                setConfirmReset(false);
                setResetDone(true);
                setTimeout(() => setResetDone(false), 2500);
              }}
            >
              ✓ {t("stats_reset")}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>✕</button>
          </div>
        )}
        {resetDone && (
          <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8, fontFamily: "var(--mono)" }}>
            ✓ {t("stats_reset_done")}
          </div>
        )}
      </div>
    </div>
  );
}
