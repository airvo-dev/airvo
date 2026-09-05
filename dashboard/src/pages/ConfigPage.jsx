export default function ConfigPage({
  t,
  prefs,
  health,
  updatePrefs,
  toast,
  setPrefs,
  getTempHint,
  MEMORY_MAX_CHARS,
  ragStatus,
  setShowRagWarning,
  ragIndexing,
  triggerRagIndex,
  ragAdvanced,
  setRagAdvanced,
  clearRagIndex,
  resetStats,
  stats,
  models,
  active,
  inferIsFree,
  getProviderClass,
  FreeRoutePanel,
  fetchAll,
  budgetInfo,
  cacheStats,
  fetchCacheStats,
  API,
  setPage,
}) {
  if (!prefs) return null;

  return (
    <>
      <h1 className="page-title">{t("config_title")}</h1>
      <p className="page-sub">{t("config_sub")}</p>
      <div style={{ display: "grid", gap: 20 }}>

        <div className="card">
          <div className="card-title">{t("mode_label")}</div>
          {health?.last_request?.type === "tool_call" && (
            <div style={{ padding: "10px 14px", background: "#1a1200", border: "1px solid var(--yellow)", borderRadius: 8, marginBottom: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)", lineHeight: 1.7 }}>
              {t("mode_note_tools")}
            </div>
          )}
          <div className="mode-grid">
            {[
              { id: "parallel", title: t("mode_parallel"), desc: t("mode_parallel_desc"), soon: false },
              { id: "race", title: t("mode_race"), desc: t("mode_race_desc"), soon: false },
              { id: "vote", title: t("mode_vote"), desc: t("mode_vote_desc"), soon: false },
              { id: "review", title: t("mode_review"), desc: t("mode_review_desc"), soon: false },
            ].map((m) => (
              <div
                key={m.id}
                className={`mode-card ${prefs.mode === m.id && !m.soon ? "selected" : ""}`}
                onClick={() => {
                  if (m.soon) return;
                  updatePrefs({ mode: m.id });
                  toast(`${t("mode_set")}: ${m.title}`, "info");
                }}
                style={m.soon ? { opacity: 0.45, cursor: "not-allowed" } : {}}
              >
                <div className="mode-card-title">
                  {m.title}
                  {m.soon && <span style={{ marginLeft: 8, fontSize: 10, fontFamily: "var(--mono)", color: "var(--accent)", background: "#1a1a2a", border: "1px solid var(--accent)", borderRadius: 4, padding: "1px 6px", verticalAlign: "middle" }}>🔒 SOON</span>}
                </div>
                <div className="mode-card-desc">
                  {m.desc}
                  {m.soon && <div style={{ marginTop: 8, fontSize: 11, color: "var(--yellow)", fontFamily: "var(--mono)" }}>Coming Soon in v0.2</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">⚡ {t("agent_model_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", margin: "0 0 14px 0", lineHeight: 1.6 }}>{t("agent_model_sub")}</p>
          <select
            className="form-input"
            style={{ width: "100%" }}
            value={prefs.agent_model ?? ""}
            onChange={(e) => {
              updatePrefs({ agent_model: e.target.value });
              toast(t("agent_model_saved"), "success");
            }}
          >
            <option value="">{t("agent_model_auto")}</option>
            {(health?.active_models ?? []).map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="card-title">🧠 Smart Router</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", margin: "0 0 14px 0", lineHeight: 1.6 }}>
            Assign a preferred model per prompt category. When no model is assigned, the default active model is used.
          </p>
          {[{ key: "code", icon: "💻", label: "Code" }, { key: "debug", icon: "🐛", label: "Debug" }, { key: "math", icon: "🔢", label: "Math" }, { key: "creative", icon: "🎨", label: "Creative" }, { key: "explain", icon: "📖", label: "Explain" }, { key: "general", icon: "💬", label: "General" }].map((cat) => (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, width: 90, flexShrink: 0 }}>{cat.icon} {cat.label}</span>
              <select
                className="form-input"
                style={{ flex: 1, fontSize: 11 }}
                value={prefs[`router_${cat.key}`] ?? ""}
                onChange={(e) => {
                  updatePrefs({ [`router_${cat.key}`]: e.target.value || null });
                  toast("Smart Router saved ✓", "success");
                }}
              >
                <option value="">Auto</option>
                {(health?.active_models ?? []).map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">{t("temp_label")}</div>
          <div className="slider-wrap">
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span className="slider-value">{(prefs.temperature ?? 0.7).toFixed(1)}</span>
              <span className="slider-hint">{getTempHint(prefs.temperature ?? 0.7, t)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min="0"
              max="1"
              step="0.1"
              value={prefs.temperature ?? 0.7}
              onChange={(e) => setPrefs((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
              onMouseUp={(e) => { updatePrefs({ temperature: parseFloat(e.target.value) }); toast(t("temp_saved"), "success"); }}
              onTouchEnd={(e) => { updatePrefs({ temperature: parseFloat(e.target.value) }); toast(t("temp_saved"), "success"); }}
            />
            <div className="slider-labels">
              <span>0.0</span><span>0.5</span><span>1.0</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">{t("maxtokens_label")}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="number"
              className="form-input"
              style={{ width: 140 }}
              value={prefs.max_tokens ?? 4096}
              min={256}
              max={32000}
              step={256}
              onChange={(e) => setPrefs((p) => ({ ...p, max_tokens: parseInt(e.target.value) }))}
              onBlur={(e) => { updatePrefs({ max_tokens: parseInt(e.target.value) }); toast(t("maxtokens_saved"), "success"); }}
            />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>tokens</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">{t("maxhistory_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>
            {t("maxhistory_sub")}
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="number"
              className="form-input"
              style={{ width: 140 }}
              value={prefs.max_history_messages ?? 10}
              min={2}
              max={50}
              step={2}
              onChange={(e) => setPrefs((p) => ({ ...p, max_history_messages: parseInt(e.target.value) }))}
              onBlur={(e) => { updatePrefs({ max_history_messages: parseInt(e.target.value) }); toast(t("maxhistory_saved"), "success"); }}
            />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
              messages <span style={{ color: (prefs.max_history_messages ?? 10) <= 6 ? "var(--green)" : (prefs.max_history_messages ?? 10) <= 14 ? "var(--yellow)" : "var(--red)" }}>●</span>
            </span>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", marginTop: 10, lineHeight: 1.8 }}>
            <span style={{ color: "var(--green)" }}>2-6</span> · fast, low cost | <span style={{ color: "var(--yellow)" }}>8-14</span> · balanced | <span style={{ color: "var(--red)" }}>16+</span> · deep context, more tokens
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            🧠 {t("config_context_memory_section")}
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <div className="card">
          <div className="card-title">{t("memory_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>
            {t("memory_sub")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={prefs.memory_enabled ?? false}
                onChange={(e) => updatePrefs({ memory_enabled: e.target.checked })}
              />
              {t("memory_enable")}
            </label>
          </div>
          {prefs.memory_enabled && (
            <>
              <textarea
                className={`form-textarea ${(prefs.memory_text || "").length > MEMORY_MAX_CHARS ? "over-limit" : ""}`}
                placeholder={t("memory_placeholder")}
                value={prefs.memory_text || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, memory_text: e.target.value }))}
                onBlur={(e) => {
                  const text = e.target.value;
                  if (text.length > MEMORY_MAX_CHARS) {
                    toast(t("memory_too_long"), "error");
                    return;
                  }
                  updatePrefs({ memory_text: text });
                  toast(t("memory_saved"), "success");
                }}
              />
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const len = (prefs.memory_text || "").length;
                  const cls = len > MEMORY_MAX_CHARS ? "over" : len > MEMORY_MAX_CHARS * 0.8 ? "warn" : "ok";
                  return (
                    <div className={`memory-counter ${cls}`}>
                      <span>{len} {t("memory_chars")}</span>
                      <span>{MEMORY_MAX_CHARS} {t("memory_max")}</span>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">🧠 {t("rag_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>
            {t("rag_sub")}
          </p>

          {ragStatus && !ragStatus.available && (
            <div style={{ padding: "12px 14px", background: "#1a1200", border: "1px solid #4a3a00", borderRadius: 8, marginBottom: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)" }}>
              ⚠ {t("rag_not_available")} - <code>{t("rag_install_hint")}</code>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={prefs?.rag_enabled ?? false}
                onChange={(e) => {
                  if (e.target.checked && !prefs?.rag_enabled) {
                    setShowRagWarning(true);
                  } else {
                    updatePrefs({ rag_enabled: e.target.checked });
                  }
                }}
              />
              {t("rag_enable")}
            </label>
          </div>

          {prefs?.rag_enabled && (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("rag_path_label")}</div>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%" }}
                    placeholder={t("rag_path_placeholder")}
                    value={prefs?.rag_path || ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, rag_path: e.target.value }))}
                    onBlur={(e) => updatePrefs({ rag_path: e.target.value.trim() })}
                  />
                </div>
                <button className="btn btn-primary" style={{ flexShrink: 0 }} disabled={ragIndexing || !prefs?.rag_path?.trim()} onClick={triggerRagIndex}>
                  {ragIndexing ? t("rag_indexing") : t("rag_index_btn")}
                </button>
              </div>

              {ragStatus && ragStatus.chunks_total > 0 && (
                <div style={{ display: "flex", gap: 20, marginBottom: 14, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 11 }}>
                  <div><span style={{ color: "var(--accent)", fontWeight: 700 }}>{ragStatus.files_indexed}</span> <span style={{ color: "var(--text2)" }}>{t("rag_status_files")}</span></div>
                  <div><span style={{ color: "var(--accent)", fontWeight: 700 }}>{ragStatus.chunks_total.toLocaleString()}</span> <span style={{ color: "var(--text2)" }}>{t("rag_status_chunks")}</span></div>
                  <div><span style={{ color: "var(--accent)", fontWeight: 700 }}>{ragStatus.index_size_mb}</span> <span style={{ color: "var(--text2)" }}>{t("rag_status_size")}</span></div>
                  {ragStatus.last_indexed && (
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ color: "var(--text2)" }}>{t("rag_status_last")}: </span>
                      <span style={{ color: "var(--text)" }}>{new Date(ragStatus.last_indexed).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setRagAdvanced((v) => !v)}>
                  {ragAdvanced ? "▾" : "▸"} {t("rag_advanced")}
                </button>
              </div>

              {ragAdvanced && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14, padding: "14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("rag_max_mb")}</div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={prefs?.rag_max_index_mb ?? 200}
                      min={10}
                      max={2000}
                      step={50}
                      onChange={(e) => setPrefs((p) => ({ ...p, rag_max_index_mb: parseInt(e.target.value) }))}
                      onBlur={(e) => updatePrefs({ rag_max_index_mb: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("rag_max_kb")}</div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={prefs?.rag_max_file_kb ?? 500}
                      min={10}
                      max={5000}
                      step={50}
                      onChange={(e) => setPrefs((p) => ({ ...p, rag_max_file_kb: parseInt(e.target.value) }))}
                      onBlur={(e) => updatePrefs({ rag_max_file_kb: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("rag_top_k")}</div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={prefs?.rag_top_k ?? 5}
                      min={1}
                      max={20}
                      step={1}
                      onChange={(e) => setPrefs((p) => ({ ...p, rag_top_k: parseInt(e.target.value) }))}
                      onBlur={(e) => updatePrefs({ rag_top_k: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("rag_max_inject_chars")}</div>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={prefs?.rag_max_inject_chars ?? 3000}
                      min={500}
                      max={20000}
                      step={500}
                      onChange={(e) => setPrefs((p) => ({ ...p, rag_max_inject_chars: parseInt(e.target.value) }))}
                      onBlur={(e) => updatePrefs({ rag_max_inject_chars: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {ragStatus && ragStatus.chunks_total > 0 && (
                <div style={{ marginTop: 4 }}>
                  <button className="btn btn-danger btn-sm" onClick={clearRagIndex}>{t("rag_clear_btn")}</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>{t("stats_label")}</div>
            <button className="btn btn-ghost btn-sm" onClick={resetStats}>{t("stats_reset")}</button>
          </div>
          {Object.keys(stats).length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>{t("stats_empty")}</div>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th style={{ textAlign: "right" }}>{t("stats_requests")}</th>
                  <th style={{ textAlign: "right" }}>{t("stats_tokens")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([id, s]) => {
                  const model = models.find((m) => m.id === id);
                  return (
                    <tr key={id}>
                      <td>
                        <div>{model?.name || id}</div>
                        <div style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--mono)" }}>{id}</div>
                      </td>
                      <td className="num">{s.requests.toLocaleString()}</td>
                      <td className="num">{s.tokens.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">{t("active_models_label")}</div>
          {active.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>{t("no_active_models")}</div>
          ) : (
            active.map((m) => (
              <div key={m.id} className="active-model-item">
                <div>
                  <div className="active-model-name">{m.name}</div>
                  <div className="active-model-id">{m.id}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className={`free-badge ${inferIsFree(m.provider, m.base_url) ? "free" : "paid"}`}>
                    {inferIsFree(m.provider, m.base_url) ? t("free_badge") : t("paid_badge")}
                  </span>
                  <span className={`provider-badge ${getProviderClass(m.provider)}`}>{m.provider}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            🆓 {t("config_free_route_section")}
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <FreeRoutePanel t={t} toast={toast} onModelsChanged={fetchAll} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            🔒 {t("config_v8_section")}
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <div className="card">
          <div className="card-title">🔒 {t("privacy_mode_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>{t("privacy_mode_sub")}</p>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={prefs?.privacy_mode_enabled ?? false}
              onChange={(e) => {
                updatePrefs({ privacy_mode_enabled: e.target.checked });
                toast(e.target.checked ? "🔒 Privacy Mode enabled" : "Privacy Mode disabled", e.target.checked ? "info" : "success");
              }}
            />
            {t("privacy_mode_enable")}
          </label>
          {prefs?.privacy_mode_enabled && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#0a0f1a", border: "1px solid var(--accent)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>
              {t("privacy_mode_on")}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">💰 {t("budget_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>{t("budget_sub")}</p>
          {budgetInfo && (
            <div style={{ display: "flex", gap: 20, marginBottom: 14, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 11 }}>
              <div>
                <span style={{ color: "var(--text2)" }}>{t("budget_cur_month")}: </span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>${(budgetInfo.monthly_usd ?? 0).toFixed(4)}</span>
                {(budgetInfo.budget_usd ?? 0) > 0 && <span style={{ color: "var(--text2)" }}> {t("budget_of")} ${budgetInfo.budget_usd}</span>}
              </div>
              {(budgetInfo.savings_usd ?? 0) > 0 && (
                <div>
                  <span style={{ color: "var(--text2)" }}>{t("budget_savings")}: </span>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>${(budgetInfo.savings_usd ?? 0).toFixed(4)}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("budget_limit_label")}</div>
              <input
                type="number"
                className="form-input"
                style={{ width: "100%" }}
                min={0}
                step={1}
                value={prefs?.cost_budget_usd ?? 0}
                onChange={(e) => setPrefs((p) => ({ ...p, cost_budget_usd: parseFloat(e.target.value) || 0 }))}
                onBlur={(e) => { updatePrefs({ cost_budget_usd: parseFloat(e.target.value) || 0 }); toast(t("budget_save") + " ✓", "success"); }}
              />
            </div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("budget_alert_label")}</div>
              <input
                type="number"
                className="form-input"
                style={{ width: "100%" }}
                min={10}
                max={100}
                step={5}
                value={prefs?.cost_budget_alert_pct ?? 80}
                onChange={(e) => setPrefs((p) => ({ ...p, cost_budget_alert_pct: parseInt(e.target.value) || 80 }))}
                onBlur={(e) => { updatePrefs({ cost_budget_alert_pct: parseInt(e.target.value) || 80 }); toast(t("budget_save") + " ✓", "success"); }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">⚡ {t("cache_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>{t("cache_sub")}</p>
          {cacheStats && (
            <div style={{ display: "flex", gap: 20, marginBottom: 14, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 11 }}>
              <div><span style={{ color: "var(--green)", fontWeight: 700 }}>{cacheStats.hits ?? 0}</span> <span style={{ color: "var(--text2)" }}>{t("cache_hits")}</span></div>
              <div><span style={{ color: "var(--text2)", fontWeight: 700 }}>{cacheStats.misses ?? 0}</span> <span style={{ color: "var(--text2)" }}>{t("cache_misses")}</span></div>
              <div><span style={{ color: "var(--accent)", fontWeight: 700 }}>{cacheStats.entries ?? 0}</span> <span style={{ color: "var(--text2)" }}>{t("cache_entries")}</span></div>
              <div style={{ marginLeft: "auto" }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    await fetch(`${API}/api/cache`, { method: "DELETE" });
                    fetchCacheStats();
                    toast(t("cache_cleared"), "success");
                  }}
                >
                  {t("cache_clear_btn")}
                </button>
              </div>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={prefs?.cache_enabled ?? true}
              onChange={(e) => { updatePrefs({ cache_enabled: e.target.checked }); toast(e.target.checked ? "Cache enabled ✓" : "Cache disabled", "success"); }}
            />
            {t("cache_enable")}
          </label>
          {(prefs?.cache_enabled ?? true) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("cache_ttl")}</div>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: "100%" }}
                  min={60}
                  max={86400}
                  step={60}
                  value={prefs?.cache_ttl_seconds ?? 3600}
                  onChange={(e) => setPrefs((p) => ({ ...p, cache_ttl_seconds: parseInt(e.target.value) || 3600 }))}
                  onBlur={(e) => { updatePrefs({ cache_ttl_seconds: parseInt(e.target.value) || 3600 }); toast("Cache TTL saved ✓", "success"); }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("cache_max_label")}</div>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: "100%" }}
                  min={10}
                  max={5000}
                  step={50}
                  value={prefs?.cache_max_entries ?? 500}
                  onChange={(e) => setPrefs((p) => ({ ...p, cache_max_entries: parseInt(e.target.value) || 500 }))}
                  onBlur={(e) => { updatePrefs({ cache_max_entries: parseInt(e.target.value) || 500 }); toast("Cache limit saved ✓", "success"); }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">🕓 {t("req_hist_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 14, lineHeight: 1.7 }}>{t("req_hist_sub")}</p>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={prefs?.history_enabled ?? true}
              onChange={(e) => { updatePrefs({ history_enabled: e.target.checked }); toast(e.target.checked ? "History enabled ✓" : "History disabled", "success"); }}
            />
            {t("req_hist_enable")}
          </label>
          {(prefs?.history_enabled ?? true) && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>{t("req_hist_max")}</div>
              <input
                type="number"
                className="form-input"
                style={{ width: 120 }}
                min={10}
                max={2000}
                step={50}
                value={prefs?.history_max_entries ?? 200}
                onChange={(e) => setPrefs((p) => ({ ...p, history_max_entries: parseInt(e.target.value) || 200 }))}
                onBlur={(e) => { updatePrefs({ history_max_entries: parseInt(e.target.value) || 200 }); toast("History limit saved ✓", "success"); }}
              />
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPage("history")}>
                🕓 View History →
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
