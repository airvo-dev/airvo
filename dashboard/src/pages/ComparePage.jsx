export default function ComparePage({
  t,
  compareHistory,
  compareHistIdx,
  setCompareHistIdx,
  compareData,
  compareSortBy,
  setCompareSortBy,
  compareDiffMode,
  setCompareDiffMode,
  compareDiffLevel,
  setCompareDiffLevel,
  comparePinnedIdx,
  setComparePinnedIdx,
  compareAutoRefresh,
  setCompareAutoRefresh,
  clearCompareHistory,
  compareExportDone,
  setCompareExportDone,
  fetchCompare,
  compareLoading,
  compareTemplates,
  setComparePrompt,
  deleteTemplate,
  comparePrompt,
  compareShowTemps,
  setCompareShowTemps,
  models,
  compareModelTemps,
  setCompareModelTemps,
  prefs,
  saveTemplate,
  streamCompare,
  compareRunning,
  compareStreamSlots,
  recordCopy,
  toast,
  compareExpandIdx,
  setCompareExpandIdx,
  CompareCard,
  computeSentenceDiff,
  computeWordDiff,
  computeJaccard,
  COMPARE_COLORS,
}) {
  const viewData = compareHistory[compareHistIdx] ?? compareData;

  function exportMarkdown() {
    if (!viewData) return;
    const lines = [
      "# Airvo Response Comparison",
      "",
      `**Mode:** ${viewData.mode}  `,
      `**Date:** ${new Date(viewData.timestamp * 1000).toLocaleString()}`,
      "",
      "## Prompt",
      "",
      `> ${viewData.prompt.replace(/\n/g, "\n> ")}`,
      "",
    ];
    viewData.results.forEach((r, i) => {
      lines.push(`## ${i + 1}. ${r.name}`);
      lines.push("");
      const meta = [`Model: \`${r.model}\``];
      if (r.elapsed_s) meta.push(`${r.elapsed_s}s`);
      if (r.tokens) meta.push(`${r.tokens} tokens`);
      if (meta.length) lines.push(`*${meta.join(" · ")}*`);
      lines.push("");
      if (r.error) {
        lines.push(`> ✗ Error: ${r.error}`);
      } else {
        lines.push(r.content || "");
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `airvo-compare-${Date.now()}.md`;
    a.click();
    setCompareExportDone(true);
    setTimeout(() => setCompareExportDone(false), 2500);
  }

  const validTime = viewData ? viewData.results.filter((r) => !r.error && r.elapsed_s != null) : [];
  const fastestIdx = validTime.length > 1
    ? viewData.results.indexOf(validTime.reduce((a, b) => (a.elapsed_s < b.elapsed_s ? a : b)))
    : -1;
  const validTok = viewData ? viewData.results.filter((r) => !r.error && r.tokens > 0) : [];
  const mostTokensIdx = validTok.length > 1
    ? viewData.results.indexOf(validTok.reduce((a, b) => (a.tokens > b.tokens ? a : b)))
    : -1;

  const sortedResults = viewData
    ? [...viewData.results].sort((a, b) => {
      if (compareSortBy === "speed") return (a.elapsed_s ?? 9999) - (b.elapsed_s ?? 9999);
      if (compareSortBy === "tokens") return (b.tokens ?? 0) - (a.tokens ?? 0);
      return 0;
    })
    : [];

  return (
    <>
      <h1 className="page-title">{t("compare_title")}</h1>
      <p className="page-sub">{t("compare_sub")}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        {compareHistory.length > 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" title={`${t("compare_history_label")} ←`} onClick={() => { setCompareHistIdx((i) => Math.min(i + 1, compareHistory.length - 1)); setCompareExpandIdx(null); }} disabled={compareHistIdx >= compareHistory.length - 1}>←</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>
              {t("compare_history_label")} {compareHistIdx + 1} {t("compare_of")} {compareHistory.length}
            </span>
            <button className="btn btn-ghost btn-sm" title={`${t("compare_history_label")} →`} onClick={() => { setCompareHistIdx((i) => Math.max(i - 1, 0)); setCompareExpandIdx(null); }} disabled={compareHistIdx === 0}>→</button>
          </div>
        ) : <div />}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {viewData && viewData.results.length > 1 && (
            <div style={{ display: "flex", gap: 3, background: "var(--bg3)", borderRadius: 6, padding: 3, border: "1px solid var(--border)" }}>
              {[["default", "-", "compare_sort_default"], ["speed", "⚡", "compare_sort_speed"], ["tokens", "📝", "compare_sort_tokens"]].map(([id, icon, key]) => (
                <button key={id} className={`btn btn-sm ${compareSortBy === id ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareSortBy(id)} style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "2px 8px", lineHeight: 1.3 }} title={t(key)}>
                  {icon}
                </button>
              ))}
            </div>
          )}
          {viewData && viewData.results.filter((r) => !r.error).length > 1 && (
            <div style={{ display: "flex", gap: 3, background: "var(--bg3)", borderRadius: 6, padding: 3, border: "1px solid var(--border)" }}>
              <button className={`btn btn-sm ${!compareDiffMode ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareDiffMode(false)} style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "2px 8px", lineHeight: 1.3 }} title="No diff">▭</button>
              <button className={`btn btn-sm ${compareDiffMode && compareDiffLevel === "word" ? "btn-primary" : "btn-ghost"}`} onClick={() => { setCompareDiffMode(true); setCompareDiffLevel("word"); }} style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "2px 8px", lineHeight: 1.3 }} title={`${t("compare_diff_tip")} - ${t("compare_diff_word")}`}>▨ {t("compare_diff_word")}</button>
              <button className={`btn btn-sm ${compareDiffMode && compareDiffLevel === "sentence" ? "btn-primary" : "btn-ghost"}`} onClick={() => { setCompareDiffMode(true); setCompareDiffLevel("sentence"); }} style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "2px 8px", lineHeight: 1.3 }} title={`${t("compare_diff_sentence")}: Highlights sentences unique to each model`}>≡ {t("compare_diff_sentence")}</button>
            </div>
          )}
          {compareHistory.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCompareHistory} title={t("compare_clear_confirm")} style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
              {t("compare_clear")}
            </button>
          )}
          {viewData && (
            <button className="btn btn-ghost btn-sm" onClick={exportMarkdown} title="Export full comparison as .md file (includes model ID, time, tokens)" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
              📄 {compareExportDone ? t("compare_export_done") : t("compare_export")}
            </button>
          )}
          <button className={`btn btn-sm ${compareAutoRefresh ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareAutoRefresh((prev) => !prev)} title="Auto-refresh: polls for new comparisons every 3 seconds from your IDE" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
            {compareAutoRefresh ? "⏹ " : "⏸ "}{t("compare_auto")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchCompare(false)} disabled={compareLoading} title="Refresh comparison data now">
            {compareLoading ? "…" : "⟳"} {t("compare_refresh")}
          </button>
        </div>
      </div>

      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>{t("compare_ask")}</div>
          <button className={`btn btn-sm ${compareShowTemps ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareShowTemps((prev) => !prev)} style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px" }} title="Set individual temperature per model. * = uses global temperature from Configuration">
            🌡 {t("compare_temps")}
          </button>
        </div>

        {compareTemplates.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", display: "flex", alignItems: "center", marginRight: 2 }}>{t("compare_templates")}:</span>
            {compareTemplates.map((tpl, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <button style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", border: "none", background: "none", cursor: "pointer", padding: "2px 8px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={() => setComparePrompt(tpl)} title={tpl}>
                  {tpl.length > 28 ? `${tpl.slice(0, 28)}…` : tpl}
                </button>
                <button style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", border: "none", borderLeft: "1px solid var(--border)", background: "none", cursor: "pointer", padding: "2px 6px", opacity: 0.6, flexShrink: 0 }} onClick={() => deleteTemplate(tpl)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea className="form-input" style={{ width: "100%", resize: "vertical", minHeight: 56, maxHeight: 160, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.6, paddingRight: comparePrompt ? 28 : undefined }} placeholder={t("compare_send_placeholder")} value={comparePrompt} onChange={(e) => setComparePrompt(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") streamCompare(); }} disabled={compareRunning} />
            {comparePrompt && !compareRunning && (
              <button onClick={() => setComparePrompt("")} title="Clear prompt" style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "2px 4px", borderRadius: 4, opacity: 0.6 }}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={() => streamCompare()} disabled={compareRunning || !comparePrompt.trim()} style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "8px 16px" }}>
              {compareRunning ? t("compare_sending") : t("compare_send")}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => saveTemplate()} disabled={!comparePrompt.trim()} style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "4px 8px" }} title="Save this prompt as a template chip - click any chip to reuse it instantly">
              {t("compare_template_save")}
            </button>
          </div>
        </div>

        {compareShowTemps && models.filter((m) => m.active).length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🌡 {t("compare_temps")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {models.filter((m) => m.active).map((m) => {
                const temp = compareModelTemps[m.id] ?? null;
                const globalTemp = prefs?.temperature ?? 0.7;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.name}>{m.name.split("/").pop()}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: temp !== null ? "var(--accent)" : "var(--text2)", minWidth: 26, textAlign: "right" }}>{temp !== null ? temp.toFixed(1) : `${globalTemp.toFixed(1)}*`}</span>
                    <input type="range" min="0" max="1" step="0.1" value={temp ?? globalTemp} onChange={(e) => setCompareModelTemps((prev) => ({ ...prev, [m.id]: parseFloat(e.target.value) }))} style={{ width: 72 }} />
                    {temp !== null && (
                      <button style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", border: "none", background: "none", cursor: "pointer", padding: "0 2px", opacity: 0.7 }} onClick={() => setCompareModelTemps((prev) => { const next = { ...prev }; delete next[m.id]; return next; })} title={t("compare_temp_reset")}>↺</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", marginTop: 6, opacity: 0.6 }}>* {t("compare_temp_reset")} (global)</div>
          </div>
        )}
      </div>

      {compareRunning && compareStreamSlots.length > 0 && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ animation: "blink 1s step-start infinite", display: "inline-block" }}>◉</span>
            {t("compare_streaming")}
          </div>
          <div className="compare-grid" style={{ gridTemplateColumns: compareStreamSlots.length === 1 ? "1fr" : compareStreamSlots.length === 2 ? "1fr 1fr" : "repeat(3, 1fr)" }}>
            {compareStreamSlots.map((slot, i) => (
              <CompareCard key={i} result={slot} index={i} t={t} isFastest={false} isMostTokens={false} isExpanded={false} onExpand={() => {}} streaming={true} onCopy={() => slot.model && recordCopy(slot.model)} />
            ))}
          </div>
        </div>
      )}

      {compareRunning ? null : compareLoading ? (
        <div className="empty">{t("hw_loading")}</div>
      ) : !viewData ? (
        <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⊞</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text2)", marginBottom: 10, fontWeight: 700 }}>{t("compare_empty")}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", opacity: 0.7, maxWidth: 500, margin: "0 auto", lineHeight: 1.9 }}>{t("compare_empty_hint")}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ background: "#1a1a2a", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent)" }}>{t("compare_mode")}: {viewData.mode}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{t("compare_at")}: {new Date(viewData.timestamp * 1000).toLocaleTimeString()}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{viewData.results.length} {viewData.results.length === 1 ? "model" : "models"}</span>
            {viewData.prompt && !compareRunning && (
              <button className="btn btn-ghost btn-sm" onClick={() => streamCompare(viewData.prompt)} title={`Re-send this exact prompt through all currently active models: ${viewData.prompt.slice(0, 60)}${viewData.prompt.length > 60 ? "…" : ""}`} style={{ fontFamily: "var(--mono)", fontSize: 11, marginLeft: "auto" }}>
                {t("compare_rerun")}
              </button>
            )}
          </div>

          {viewData.prompt && (
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>{t("compare_prompt")}</div>
                <button className="btn btn-ghost btn-sm" style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "1px 7px" }} onClick={() => { navigator.clipboard.writeText(viewData.prompt); toast(t("copied"), "success"); }}>{t("compare_copy_prompt")}</button>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 72, overflow: "hidden", WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}>{viewData.prompt}</div>
            </div>
          )}

          {(() => {
            const validResults = viewData.results.filter((r) => !r.error);
            const diffTokens = compareDiffMode && validResults.length > 1
              ? (compareDiffLevel === "sentence" ? computeSentenceDiff(viewData.results, comparePinnedIdx) : computeWordDiff(viewData.results, comparePinnedIdx))
              : null;
            return (
              <div className="compare-grid" style={{ gridTemplateColumns: compareExpandIdx !== null ? "1fr" : viewData.results.length === 1 ? "1fr" : viewData.results.length === 2 ? "1fr 1fr" : "repeat(3, 1fr)" }}>
                {(compareExpandIdx !== null ? [{ r: viewData.results[compareExpandIdx], origIdx: compareExpandIdx }] : sortedResults.map((r) => ({ r, origIdx: viewData.results.indexOf(r) }))).map(({ r: result, origIdx: realIdx }) => (
                  <CompareCard
                    key={realIdx}
                    result={result}
                    index={realIdx}
                    t={t}
                    isFastest={fastestIdx === realIdx}
                    isMostTokens={mostTokensIdx === realIdx}
                    isExpanded={compareExpandIdx === realIdx}
                    onExpand={() => setCompareExpandIdx(compareExpandIdx === realIdx ? null : realIdx)}
                    diffTokens={diffTokens && !result.error ? diffTokens[realIdx] : null}
                    isPinned={comparePinnedIdx === realIdx}
                    onPin={validResults.length > 1 ? () => setComparePinnedIdx(comparePinnedIdx === realIdx ? null : realIdx) : null}
                    onCopy={() => result.model && recordCopy(result.model)}
                  />
                ))}
              </div>
            );
          })()}

          {viewData.results.filter((r) => !r.error).length > 1 && (() => {
            const valid = viewData.results.filter((r) => !r.error);
            const maxTime = Math.max(...valid.map((r) => r.elapsed_s ?? 0));
            const maxTok = Math.max(...valid.map((r) => r.tokens ?? 0));
            if (maxTime === 0 && maxTok === 0) return null;
            return (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{t("compare_stats")}</div>
                {valid.map((r) => {
                  const ri = viewData.results.indexOf(r);
                  const col = COMPARE_COLORS[ri % COMPARE_COLORS.length];
                  const tp = maxTime > 0 ? ((r.elapsed_s ?? 0) / maxTime) * 100 : 0;
                  const kp = maxTok > 0 ? ((r.tokens ?? 0) / maxTok) * 100 : 0;
                  return (
                    <div key={ri} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: col }}>{r.name}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{r.elapsed_s != null ? `${r.elapsed_s}s` : "—"} · {r.tokens > 0 ? `${r.tokens} tok` : "—"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {maxTime > 0 && (
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>⚡ {t("compare_time")}</div>
                            <div style={{ background: "var(--bg)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                              <div style={{ width: `${tp}%`, height: "100%", background: col, borderRadius: 4, transition: "width .4s" }} />
                            </div>
                          </div>
                        )}
                        {maxTok > 0 && (
                          <div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>📝 {t("compare_tokens")}</div>
                            <div style={{ background: "var(--bg)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                              <div style={{ width: `${kp}%`, height: "100%", background: col, opacity: 0.6, borderRadius: 4, transition: "width .4s" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(() => {
                  const validContent = valid.filter((r) => r.content);
                  if (validContent.length < 2) return null;
                  const pairs = computeJaccard(validContent);
                  if (pairs.length === 0) return null;
                  return (
                    <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{t("compare_similarity")}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {pairs.map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{p.a} ↔ {p.b}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: p.score >= 60 ? "var(--green)" : p.score >= 35 ? "var(--yellow)" : "var(--red)" }}>{p.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
