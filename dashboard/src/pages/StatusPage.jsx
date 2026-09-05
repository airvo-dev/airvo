export default function StatusPage({
  t,
  health,
  hwLoading,
  fetchHardware,
  fetchFitModels,
  hwStatus,
  opsStats,
  opsAlerts,
  opsLoading,
  fetchOpsData,
  resetOpsData,
  opsResetting,
  unloadOllamaModel,
  fitLoading,
  fitModels,
  quickAddModel,
  hwProcOpen,
  setHwProcOpen,
  fetchProcesses,
  hwProcLoading,
  hwProcesses,
  continueYaml,
  toast,
}) {
  return (
    <>
      <h1 className="page-title">{t("status_title")}</h1>
      <p className="page-sub">{t("status_sub")}</p>
      <div style={{ display: "grid", gap: 20 }}>
        <div className="card">
          <div className="card-title">{t("server_label")}</div>
          {health ? (
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["Status", <span style={{ color: "var(--green)" }}>{t("status_online")}</span>],
                [t("field_version"), health.version],
                [t("field_active"), health.active_models?.join(", ") || t("nav_none")],
                [t("field_total"), health.total_models],
                [t("field_config"), health.config_file],
                [t("field_endpoint"), "http://localhost:5000/v1/chat/completions"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--red)", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.8 }}>
              ✗ {t("status_offline_msg")}
              <br />
              <span style={{ color: "var(--text2)" }}>
                {t("status_offline_hint")} <strong>airvo start</strong>
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>{t("hw_label")}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { fetchHardware(); fetchFitModels(); }} disabled={hwLoading} style={{ fontSize: 11 }}>
              {hwLoading ? "…" : t("hw_refresh")}
            </button>
          </div>
          {hwLoading && !hwStatus && (
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("hw_loading")}</p>
          )}
          {hwStatus && (
            <>
              {!hwStatus.psutil_available && (
                <div style={{ background: "#1a1000", border: "1px solid #a06000", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontFamily: "var(--mono)", fontSize: 12 }}>
                  ⚠️ {t("hw_no_psutil")} - <span style={{ color: "var(--text2)" }}>{t("hw_no_psutil_hint")}</span>
                </div>
              )}

              {hwStatus.psutil_available && (() => {
                const pct = hwStatus.ram?.percent ?? 0;
                const bar = pct >= 90 ? "var(--red)" : pct >= 75 ? "#f59e0b" : "var(--green)";
                const used = ((hwStatus.ram?.used_mb ?? 0) / 1024).toFixed(1);
                const total = ((hwStatus.ram?.total_mb ?? 0) / 1024).toFixed(1);
                const free = ((hwStatus.ram?.free_mb ?? 0) / 1024).toFixed(1);
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("hw_ram")}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                        {used} GB {t("hw_used")} / {total} GB <span style={{ color: "var(--text2)" }}>({free} GB {t("hw_free")})</span>
                      </span>
                    </div>
                    <div style={{ background: "var(--bg3)", borderRadius: 6, height: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: bar, borderRadius: 6, transition: "width .4s" }} />
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: bar, marginTop: 4 }}>
                      {pct.toFixed(1)}% - {hwStatus.ram?.pressure === "ok" ? t("hw_pressure_ok") : hwStatus.ram?.pressure === "warning" ? t("hw_pressure_warning") : t("hw_pressure_critical")}
                    </div>
                  </div>
                );
              })()}

              {hwStatus.psutil_available && hwStatus.cpu && (() => {
                const cp = hwStatus.cpu.usage_percent ?? 0;
                const bar = cp >= 90 ? "var(--red)" : cp >= 75 ? "#f59e0b" : "var(--accent)";
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>
                        {t("hw_cpu")}
                        <span style={{ marginLeft: 8, color: "var(--text2)", fontWeight: 400 }}>{hwStatus.cpu.name}</span>
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                        {hwStatus.cpu.logical_cores} {t("hw_cpu_cores")} <span style={{ color: bar }}>{cp.toFixed(1)}% {t("hw_cpu_usage")}</span>
                      </span>
                    </div>
                    <div style={{ background: "var(--bg3)", borderRadius: 6, height: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ width: `${cp}%`, height: "100%", background: bar, borderRadius: 6, transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })()}

              {(hwStatus.gpus ?? []).map((gpu, i) => {
                const vp = gpu.vram_percent ?? 0;
                const bar = vp >= 90 ? "var(--red)" : vp >= 75 ? "#f59e0b" : "var(--green)";
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("hw_gpu")}: {gpu.name}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                        {t("hw_vram")}: {(gpu.vram_used_mb / 1024).toFixed(1)} / {(gpu.vram_total_mb / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div style={{ background: "var(--bg3)", borderRadius: 6, height: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ width: `${vp}%`, height: "100%", background: bar, borderRadius: 6, transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                  {t("hw_ollama_models")}
                  {hwStatus.ollama?.running === false && <span style={{ marginLeft: 8, color: "var(--red)", fontSize: 11 }}>(Ollama offline)</span>}
                </div>
                {(hwStatus.ollama?.loaded_models ?? []).length === 0 ? (
                  <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#555" }}>{t("hw_ollama_none")}</p>
                ) : (
                  hwStatus.ollama.loaded_models.map((m) => (
                    <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg3)", borderRadius: 6, marginBottom: 6, border: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{m.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{(m.size_mb / 1024).toFixed(2)} GB</span>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: "3px 10px", color: "var(--accent2)", borderColor: "var(--accent2)" }} onClick={() => unloadOllamaModel(m.name)}>
                          {t("hw_unload_btn")}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginBottom: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 2 }}>{t("fit_title")}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#6b7280" }}>{t("fit_sub")}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={fetchFitModels} disabled={fitLoading} style={{ fontSize: 11 }}>
                    {fitLoading ? "…" : t("fit_refresh")}
                  </button>
                </div>

                {fitLoading && !fitModels && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("fit_loading")}</p>}

                {fitModels && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 10 }}>
                      <div style={{ background: "#001a00", border: "1px solid #2a6a2a", borderRadius: 6, padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "#4ade80", textAlign: "center" }}>{fitModels.summary?.fits ?? 0} {t("fit_summary_fits")}</div>
                      <div style={{ background: "#1a1200", border: "1px solid #8a6400", borderRadius: 6, padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "#fbbf24", textAlign: "center" }}>{fitModels.summary?.tight ?? 0} {t("fit_summary_tight")}</div>
                      <div style={{ background: "#1a0000", border: "1px solid #6a1a1a", borderRadius: 6, padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "#f87171", textAlign: "center" }}>{fitModels.summary?.too_large ?? 0} {t("fit_summary_too_large")}</div>
                      <div style={{ background: "#00131a", border: "1px solid #155e75", borderRadius: 6, padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 11, color: "#67e8f9", textAlign: "center" }}>{fitModels.summary?.installed ?? 0} {t("fit_summary_installed")}</div>
                    </div>

                    <div style={{ display: "grid", gap: 6, maxHeight: 260, overflow: "auto", paddingRight: 2 }}>
                      {(fitModels.models || []).map((m) => {
                        const badge = m.fit === "fits"
                          ? { label: t("fit_badge_fits"), bg: "#001a00", bd: "#2a6a2a", fg: "#4ade80" }
                          : m.fit === "tight"
                            ? { label: t("fit_badge_tight"), bg: "#1a1200", bd: "#8a6400", fg: "#fbbf24" }
                            : { label: t("fit_badge_too_large"), bg: "#1a0000", bd: "#6a1a1a", fg: "#f87171" };
                        return (
                          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", opacity: m.fit === "too_large" ? 0.7 : 1 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700 }}>{m.name}</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 10, borderRadius: 4, padding: "1px 6px", background: badge.bg, border: `1px solid ${badge.bd}`, color: badge.fg }}>{badge.label}</span>
                                {m.installed && <span style={{ fontFamily: "var(--mono)", fontSize: 10, borderRadius: 4, padding: "1px 6px", background: "#003a10", border: "1px solid var(--green)", color: "var(--green)" }}>✓ {t("disc_installed")}</span>}
                              </div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <span>{m.size_gb?.toFixed?.(1) ?? m.size_gb} GB</span>
                                {m.runs_on && <span>{t("fit_runs_on")} {m.runs_on === "gpu" ? t("fit_runs_gpu") : t("fit_runs_cpu")}</span>}
                              </div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#7dd3fc", marginTop: 3 }}>{t("fit_pull_cmd")}: {m.ollama_pull}</div>
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginLeft: 10, whiteSpace: "nowrap" }} onClick={() => quickAddModel({ id: m.id, name: m.name, provider: "ollama" })}>
                              + {t("disc_add_btn")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {(hwStatus.suggestions ?? []).length > 0 && (
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>{t("hw_suggestions")}</div>
                  {hwStatus.suggestions.map((s, i) => {
                    const bg = s.action === "critical" || s.action === "unload" ? "#1a0010" : s.action === "warning" ? "#1a1000" : "#001a1a";
                    const bdr = s.action === "critical" || s.action === "unload" ? "#a00060" : s.action === "warning" ? "#a06000" : "#007070";
                    return (
                      <div key={i} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: 8, padding: "9px 13px", marginBottom: 6, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.5 }}>
                        {s.action === "unload" && "⚠️ "}
                        {s.action === "warning" && "🟡 "}
                        {s.action === "info" && "ℹ️ "}
                        {s.reason}
                        {s.action === "unload" && s.model && (
                          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12, fontSize: 11, color: "var(--accent2)", borderColor: "var(--accent2)" }} onClick={() => unloadOllamaModel(s.model)}>
                            {t("hw_unload_btn")} {s.model.split(":")[0]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {hwStatus.psutil_available && (
                <div style={{ marginTop: 14 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontFamily: "var(--mono)", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }} onClick={() => {
                    if (!hwProcOpen) fetchProcesses();
                    setHwProcOpen((prev) => !prev);
                  }}>
                    <span style={{ fontSize: 13 }}>{hwProcOpen ? "▾" : "▸"}</span>
                    📊 {t("hw_processes")}
                    {hwProcLoading && <span style={{ color: "var(--text2)" }}>…</span>}
                  </button>

                  {hwProcOpen && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>{t("hw_proc_sub")}</p>
                      {hwProcLoading && !hwProcesses && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>…</p>}
                      {(hwProcesses?.processes ?? []).map((proc, i) => {
                        const pct = proc.memory_percent ?? 0;
                        const bar = pct >= 15 ? "var(--red)" : pct >= 7 ? "#f59e0b" : "var(--accent)";
                        const memStr = proc.memory_mb >= 1024 ? `${(proc.memory_mb / 1024).toFixed(1)} GB` : `${proc.memory_mb.toFixed(0)} MB`;
                        const FRIENDLY = {
                          "code.exe": "VS Code",
                          "code - insiders.exe": "VS Code Insiders",
                          "devenv.exe": "Visual Studio",
                          "servicehub.datawarehousehost.exe": "Visual Studio (ServiceHub)",
                          "servicehub.host.dotnet.x64.exe": "Visual Studio (ServiceHub)",
                          "servicehub.indexingservice.exe": "Visual Studio (Indexer)",
                          "servicehub.settingshost.exe": "Visual Studio (Settings)",
                          "msedge.exe": "Microsoft Edge",
                          "chrome.exe": "Google Chrome",
                          "firefox.exe": "Firefox",
                          "safari.exe": "Safari",
                          "brave.exe": "Brave",
                          "slack.exe": "Slack",
                          "discord.exe": "Discord",
                          "teams.exe": "Microsoft Teams",
                          "outlook.exe": "Outlook",
                          "winword.exe": "Microsoft Word",
                          "excel.exe": "Microsoft Excel",
                          "powerpnt.exe": "Microsoft PowerPoint",
                          "explorer.exe": "Windows Explorer",
                          "taskhostw.exe": "Windows Task Host",
                          "svchost.exe": "Windows Service Host",
                          "memcompression": "Windows Memory Compression (system)",
                          "registry": "Windows Registry (system)",
                          "system": "Windows System (kernel)",
                          "smss.exe": "Windows Session Manager",
                          "csrss.exe": "Windows Client/Server Runtime",
                          "lsass.exe": "Windows Security (LSASS)",
                          "wininit.exe": "Windows Initialization",
                          "python.exe": "Python",
                          "python3.exe": "Python 3",
                          "pythonw.exe": "Python (windowed)",
                          "node.exe": "Node.js",
                          "ollama.exe": "Ollama",
                          "ollama_llama_server.exe": "Ollama (model runner)",
                          "docker desktop.exe": "Docker Desktop",
                          "dockerd.exe": "Docker Daemon",
                          "wslhost.exe": "WSL",
                          "wsl.exe": "WSL",
                          "cursor.exe": "Cursor",
                          "windsurf.exe": "Windsurf",
                          "figma.exe": "Figma",
                          "zoom.exe": "Zoom",
                          "spotify.exe": "Spotify",
                          "postman.exe": "Postman",
                          "gitkraken.exe": "GitKraken",
                          "github desktop.exe": "GitHub Desktop",
                        };
                        const friendly = FRIENDLY[proc.name.toLowerCase()];
                        const displayName = friendly ? <><span style={{ color: "var(--text)" }}>{friendly}</span><span style={{ color: "var(--text2)", marginLeft: 5, fontSize: 10 }}>({proc.name})</span></> : proc.name;
                        return (
                          <div key={proc.pid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "var(--bg3)", borderRadius: 6, marginBottom: 5, border: "1px solid var(--border)" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", width: 20, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: bar, flexShrink: 0 }}>{memStr}</span>
                            <div style={{ width: 60, background: "var(--bg)", borderRadius: 4, height: 6, overflow: "hidden", flexShrink: 0 }}>
                              <div style={{ width: `${Math.min(pct * 4, 100)}%`, height: "100%", background: bar, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                      {!hwProcLoading && hwProcesses && hwProcesses.processes.length === 0 && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>-</p>}
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginTop: 6 }} onClick={fetchProcesses} disabled={hwProcLoading}>
                        {hwProcLoading ? "…" : t("hw_refresh")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 2 }}>{t("ops_title")}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{t("ops_sub")}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={fetchOpsData}
                disabled={opsLoading}
                style={{ fontSize: 11 }}
              >
                {opsLoading ? "…" : t("ops_refresh")}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={resetOpsData}
                disabled={opsResetting}
                style={{ fontSize: 11, color: "var(--yellow)", borderColor: "#8a6400" }}
              >
                {opsResetting ? "…" : t("ops_reset")}
              </button>
            </div>
          </div>

          {opsAlerts && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${opsAlerts.ok ? "#2a6a2a" : "#8a6400"}`,
                background: opsAlerts.ok ? "#001a00" : "#1a1200",
                color: opsAlerts.ok ? "var(--green)" : "var(--yellow)",
              }}>
                {opsAlerts.ok ? "● OK" : "⚠ WARN"}
                <span style={{ color: "var(--text2)", fontWeight: 400 }}>({opsAlerts.alerts?.length || 0})</span>
              </div>
              {!!(opsAlerts.alerts?.length) && (
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  {opsAlerts.alerts.slice(0, 5).map((a, idx) => (
                    <div key={`${a.endpoint}-${a.kind}-${idx}`} style={{
                      background: "#1a1200",
                      border: "1px solid #8a6400",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "#fbbf24",
                      lineHeight: 1.5,
                    }}>
                      {a.kind} · {a.endpoint}
                      <div style={{ color: "var(--text2)" }}>{a.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {opsStats ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{t("ops_total_requests")}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--accent)", fontWeight: 700 }}>{opsStats.totals?.requests ?? 0}</div>
                </div>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{t("ops_total_errors")}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--red)", fontWeight: 700 }}>{opsStats.totals?.errors ?? 0}</div>
                </div>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{t("ops_error_rate")}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--yellow)", fontWeight: 700 }}>{((opsStats.totals?.error_rate ?? 0) * 100).toFixed(2)}%</div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="stats-table" style={{ minWidth: 780 }}>
                  <thead>
                    <tr>
                      <th>{t("ops_endpoint")}</th>
                      <th style={{ textAlign: "right" }}>{t("ops_req")}</th>
                      <th style={{ textAlign: "right" }}>{t("ops_err")}</th>
                      <th style={{ textAlign: "right" }}>{t("ops_p50")}</th>
                      <th style={{ textAlign: "right" }}>{t("ops_p95")}</th>
                      <th style={{ textAlign: "right" }}>{t("ops_p99")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(opsStats.endpoints || {})
                      .sort((a, b) => (b[1]?.requests || 0) - (a[1]?.requests || 0))
                      .slice(0, 12)
                      .map(([key, item]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td className="num">{item.requests ?? 0}</td>
                          <td className="num" style={{ color: (item.errors ?? 0) > 0 ? "var(--red)" : "var(--green)" }}>{item.errors ?? 0}</td>
                          <td className="num">{item.latency_ms?.p50 ?? 0} ms</td>
                          <td className="num">{item.latency_ms?.p95 ?? 0} ms</td>
                          <td className="num">{item.latency_ms?.p99 ?? 0} ms</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{t("ops_loading")}</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">{t("continue_label")}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>{t("continue_hint")}</p>
          <pre style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", overflow: "auto" }}>{continueYaml}</pre>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(continueYaml); toast(t("copied"), "success"); }}>
              {t("copy_config")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
