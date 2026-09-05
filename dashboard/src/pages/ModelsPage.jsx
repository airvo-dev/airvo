export default function ModelsPage({
  t,
  models,
  active,
  MAX_ACTIVE,
  inferIsFree,
  loading,
  pinging,
  setPinging,
  API,
  setProviderHealth,
  providerHealth,
  stats,
  ModelCard,
  toggleModel,
  saveKey,
  deleteModel,
  saveNotes,
  discOpen,
  setDiscOpen,
  discLoading,
  fetchDiscovery,
  discTab,
  setDiscTab,
  discOllama,
  discOpenRouter,
  quickAddModel,
}) {
  const configured = models.filter((m) => m.active || m.api_key);
  const suggestions = models.filter((m) => !m.active && !m.api_key);

  return (
    <>
      <h1 className="page-title">{t("models_title")}</h1>
      <p className="page-sub">{t("models_sub")}</p>

      <div className="stats-row">
        {[
          { label: t("stat_total"), val: configured.length, sub: t("stat_models"), cls: "accent" },
          { label: t("stat_active"), val: active.length, max: MAX_ACTIVE, sub: t("stat_parallel"), cls: "green", showBar: true },
          { label: t("stat_free"), val: configured.filter((m) => inferIsFree(m.provider, m.base_url)).length, sub: t("stat_no_cost"), cls: "yellow" },
          { label: t("stat_with_key"), val: configured.filter((m) => m.api_key).length, sub: t("stat_configured"), cls: "pink" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls}`}>
              {s.showBar ? `${s.val} / ${s.max}` : s.val}
            </div>
            {s.showBar && (
              <div style={{ margin: "8px 0 4px", height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(s.val / s.max) * 100}%`,
                    background: "var(--green)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                    boxShadow: s.val >= s.max ? "0 0 8px var(--green)" : "none",
                  }}
                />
              </div>
            )}
            <div className="stat-sub">{s.showBar ? t("stat_v1_limit") : s.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty">{t("loading_models")}</div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, gap: 8, alignItems: "center" }}>
            {pinging && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>Pinging...</span>}
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontFamily: "var(--mono)", fontSize: 11 }}
              disabled={pinging}
              onClick={async () => {
                setPinging(true);
                try {
                  const r = await fetch(`${API}/api/health/providers`);
                  const d = await r.json();
                  const map = {};
                  for (const item of d.results || []) {
                    map[item.model_id] = item;
                  }
                  setProviderHealth(map);
                } catch {
                  // offline
                }
                setPinging(false);
              }}
            >
              🏓 Ping All
            </button>
          </div>

          <div className="models-grid">
            {configured.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                t={t}
                stats={stats[m.id]}
                health={providerHealth[m.id]}
                onToggle={() => toggleModel(m.id, m.active)}
                onSaveKey={(key) => saveKey(m.id, key)}
                onDelete={() => deleteModel(m.id)}
                onSaveNotes={(notes) => saveNotes(m.id, notes)}
              />
            ))}
          </div>

          {suggestions.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: "var(--text2)" }}>💡 {t("suggestions_title")}</span>
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>{t("suggestions_sub")}</p>
              <div className="models-grid" style={{ opacity: 0.7 }}>
                {suggestions.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    t={t}
                    stats={stats[m.id]}
                    onToggle={() => toggleModel(m.id, m.active)}
                    onSaveKey={(key) => saveKey(m.id, key)}
                    onDelete={() => deleteModel(m.id)}
                    onSaveNotes={(notes) => saveNotes(m.id, notes)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <button
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 13 }}
          onClick={() => setDiscOpen((p) => !p)}
        >
          <span style={{ fontSize: 16 }}>{discOpen ? "▾" : "▸"}</span>
          🔭 {t("disc_label")}
          {discOpen && discLoading && <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>{t("disc_loading")}</span>}
        </button>

        {discOpen && (
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>{t("disc_label")}</div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("disc_sub")}</p>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={fetchDiscovery} disabled={discLoading}>
                {discLoading ? "..." : "⟳"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[["local", t("disc_local_tab")], ["cloud", t("disc_cloud_tab")]].map(([id, label]) => (
                <button
                  key={id}
                  className={`btn btn-sm ${discTab === id ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontFamily: "var(--mono)", fontSize: 12 }}
                  onClick={() => setDiscTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {discTab === "local" && (
              <>
                {discLoading && !discOllama && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("disc_loading")}</p>}
                {discOllama && (
                  <>
                    <div style={{ padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12, fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>💻 {t("disc_local_explain")}</div>
                      <div style={{ color: "var(--accent)" }}>📋 {t("disc_local_how")}</div>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {(discOllama.catalog || []).map((m) => {
                        const sizeStr = m.size_gb >= 1 ? `${m.size_gb.toFixed(1)} GB` : `${Math.round(m.size_gb * 1024)} MB`;
                        return (
                          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)", opacity: m.fits_ram ? 1 : 0.55 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4, alignItems: "center" }}>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                                {m.installed && <span style={{ fontSize: 10, fontFamily: "var(--mono)", background: "#003a10", border: "1px solid var(--green)", color: "var(--green)", borderRadius: 4, padding: "1px 6px" }}>✓ {t("disc_installed")}</span>}
                                {m.fits_ram ? (
                                  <span title={t("disc_fits_detail")} style={{ fontSize: 10, fontFamily: "var(--mono)", background: "#001a00", border: "1px solid #2a6a2a", color: "#4ade80", borderRadius: 4, padding: "1px 6px", cursor: "help" }}>{t("disc_fits")}</span>
                                ) : (
                                  <span title={t("disc_too_large_detail")} style={{ fontSize: 10, fontFamily: "var(--mono)", background: "#1a0000", border: "1px solid #6a1a1a", color: "var(--red)", borderRadius: 4, padding: "1px 6px", cursor: "help" }}>{t("disc_too_large")}</span>
                                )}
                                {(m.tags || []).map((tag) => (
                                  <span key={tag} style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text2)", borderRadius: 4, padding: "1px 6px", border: "1px solid var(--border)" }}>{tag}</span>
                                ))}
                              </div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
                                {sizeStr} - {t("disc_pull_cmd")}: <span style={{ color: "var(--accent)" }}>ollama pull {m.id}</span>
                              </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginLeft: 12, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => quickAddModel({ id: m.id, name: m.name, provider: "ollama" })}>
                              + {t("disc_add_btn")}
                            </button>
                          </div>
                        );
                      })}
                      {!discOllama?.catalog?.length && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("disc_no_results")}</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {discTab === "cloud" && (
              <>
                {discLoading && !discOpenRouter && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("disc_loading")}</p>}
                {discOpenRouter && (
                  <>
                    <div style={{ padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12, fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>☁️ {t("disc_cloud_explain")}</div>
                      <div style={{ color: "var(--accent)" }}>📋 {t("disc_cloud_how")}</div>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {(discOpenRouter || []).map((m) => (
                        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4, alignItems: "center" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                              {m.is_free && <span style={{ fontSize: 10, fontFamily: "var(--mono)", background: "#003a10", border: "1px solid var(--green)", color: "var(--green)", borderRadius: 4, padding: "1px 6px" }}>{t("disc_free_badge")}</span>}
                            </div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
                              {m.context_length > 0 && <span>{(m.context_length / 1000).toFixed(0)}k {t("disc_context")} · </span>}
                              {m.is_free ? "Free" : `$${(m.prompt_cost * 1000000).toFixed(2)}/M tokens`}
                            </div>
                            {m.description && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>{m.description}</div>}
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginLeft: 12, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => quickAddModel({ id: m.id, name: m.name, provider: "openrouter" })}>
                            + {t("disc_add_btn")}
                          </button>
                        </div>
                      ))}
                      {!discOpenRouter?.length && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("disc_no_results")}</p>}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
