import { useState, useEffect, useCallback, useRef } from "react";
import CodeBlock from "../components/CodeBlock";
import { parseBlocks, renderMarkdownText } from "../utils/markdown";

export default function ChatPage({
  t,
  activeModels,
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [activeModelName, setActiveModelName] = useState("");
  const [routeCategory, setRouteCategory] = useState(null);
  const [fallbackNote, setFallbackNote] = useState(null);
  const [ratings, setRatings] = useState({});
  const [lastCost, setLastCost] = useState(null);
  const [lastConfidence, setLastConfidence] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const recognRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // server offline
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  function openConversation(conv) {
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
    setStreamContent("");
  }

  function newConversation() {
    setActiveConvId(null);
    setMessages([]);
    setStreamContent("");
    setInput("");
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStreaming(true);
    setStreamContent("");

    try {
      const body = {
        message: text,
        conversation_id: activeConvId || undefined,
        model_id: selectedModel || undefined,
      };
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let evt;
          try {
            evt = JSON.parse(raw);
          } catch {
            continue;
          }

          if (evt.type === "delta") {
            full += evt.content;
            setStreamContent(full);
          } else if (evt.type === "airvo_cost") {
            setLastCost(evt);
          } else if (evt.type === "airvo_confidence") {
            setLastConfidence(evt);
          } else if (evt.type === "fallback") {
            setFallbackNote({ from: evt.from, to: evt.to });
            setTimeout(() => setFallbackNote(null), 5000);
          } else if (evt.type === "done") {
            const pendingCost = lastCost;
            const pendingConf = lastConfidence;
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: full,
                tokens: evt.tokens || 0,
                elapsed_s: evt.elapsed_s || 0,
                cost: pendingCost,
                confidence: pendingConf,
                model_id: evt.model_id || "",
                model_name: evt.model_name || "",
                prompt: text,
              },
            ]);
            setStreamContent("");
            setActiveConvId(evt.conv_id);
            if (evt.model_name) setActiveModelName(evt.model_name);
            if (evt.route_category) {
              const CATS = {
                code: { icon: "💻", color: "#4a9eff" },
                debug: { icon: "🐛", color: "#ff6b6b" },
                math: { icon: "🔢", color: "#ffd93d" },
                creative: { icon: "🎨", color: "#c084fc" },
                explain: { icon: "📖", color: "#6bcb77" },
                general: { icon: "💬", color: "#94a3b8" },
              };
              setRouteCategory({
                label: evt.route_category,
                ...(CATS[evt.route_category] || CATS.general),
              });
            }
            const res2 = await fetch("/api/chat/history");
            const data2 = await res2.json();
            setConversations(data2.conversations || []);
          } else if (evt.type === "error") {
            setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${evt.error}` }]);
            setStreamContent("");
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠ Connection error: ${err.message}` },
      ]);
      setStreamContent("");
    } finally {
      setStreaming(false);
    }
  }

  async function regenerate() {
    if (streaming) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          copy.splice(i, 1);
          break;
        }
      }
      return copy;
    });

    setStreaming(true);
    setStreamContent("");
    try {
      const body = {
        message: lastUser.content,
        conversation_id: activeConvId || undefined,
        model_id: selectedModel || undefined,
      };
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let evt;
          try {
            evt = JSON.parse(raw);
          } catch {
            continue;
          }

          if (evt.type === "delta") {
            full += evt.content;
            setStreamContent(full);
          } else if (evt.type === "airvo_cost") {
            setLastCost(evt);
          } else if (evt.type === "airvo_confidence") {
            setLastConfidence(evt);
          } else if (evt.type === "fallback") {
            setFallbackNote({ from: evt.from, to: evt.to });
            setTimeout(() => setFallbackNote(null), 5000);
          } else if (evt.type === "done") {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: full,
                tokens: evt.tokens || 0,
                elapsed_s: evt.elapsed_s || 0,
                cost: lastCost,
                confidence: lastConfidence,
                model_id: evt.model_id || "",
                model_name: evt.model_name || "",
                prompt: lastUser.content,
              },
            ]);
            setStreamContent("");
            setActiveConvId(evt.conv_id);
            if (evt.model_name) setActiveModelName(evt.model_name);
            const res2 = await fetch("/api/chat/history");
            const data2 = await res2.json();
            setConversations(data2.conversations || []);
          } else if (evt.type === "error") {
            setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${evt.error}` }]);
            setStreamContent("");
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠ Connection error: ${err.message}` },
      ]);
      setStreamContent("");
    } finally {
      setStreaming(false);
    }
  }

  async function rateMessage(msgIndex, rating) {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== "assistant" || !msg.model_id) return;

    setRatings((prev) => ({ ...prev, [msgIndex]: rating }));
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: msg.model_id,
          model_name: msg.model_name || "",
          prompt: msg.prompt || "",
          rating,
        }),
      });
    } catch {
      // silent fail
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function deleteConv(e, convId) {
    e.stopPropagation();
    await fetch(`/api/chat/history/${encodeURIComponent(convId)}`, { method: "DELETE" });
    if (activeConvId === convId) newConversation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));
  }

  async function saveRename(convId) {
    if (!renameVal.trim()) {
      setRenaming(null);
      return;
    }
    await fetch(`/api/chat/history/${encodeURIComponent(convId)}/title`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameVal.trim() }),
    });
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: renameVal.trim() } : c)));
    setRenaming(null);
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = navigator.language || "en-US";
    recognRef.current = recog;

    recog.onresult = (ev) => {
      const transcript = Array.from(ev.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(() => transcript);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recog.start();
    setListening(true);
  }

  function copyMsg(content) {
    navigator.clipboard.writeText(content).catch(() => {});
  }

  function renderBubble(msg, isStreaming, key) {
    const isUser = msg.role === "user";
    const blocks = parseBlocks(msg.content || "");
    const myRating = ratings[key];

    return (
      <div key={key} className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        <div className="chat-bubble-role">{isUser ? "You" : "AI"}</div>
        <div className="chat-bubble-content">
          {blocks.map((b, i) =>
            b.type === "code"
              ? <CodeBlock key={i} block={b} t={t} />
              : <div key={i}>{renderMarkdownText(b.content, `${key}-${i}`)}</div>
          )}
          {isStreaming && <span className="chat-cursor">▌</span>}
        </div>
        {!isUser && !isStreaming && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="chat-copy-btn" onClick={() => copyMsg(msg.content)} title="Copy">⎘</button>
            {key === messages.length - 1 && !streaming && (
              <button className="chat-copy-btn" onClick={regenerate} title={t("chat_regenerate")} style={{ fontSize: 14 }}>↺</button>
            )}
            {msg.model_id && (
              <>
                <button className="chat-copy-btn" onClick={() => rateMessage(key, "up")} title="Good response" style={{ fontSize: 13, color: myRating === "up" ? "var(--green)" : undefined, opacity: myRating === "down" ? 0.35 : 1 }}>👍</button>
                <button className="chat-copy-btn" onClick={() => rateMessage(key, "down")} title="Bad response" style={{ fontSize: 13, color: myRating === "down" ? "var(--red)" : undefined, opacity: myRating === "up" ? 0.35 : 1 }}>👎</button>
              </>
            )}
            {msg.tokens > 0 && (
              <span className="chat-token-meta">
                {msg.tokens} tokens · {msg.elapsed_s ? msg.elapsed_s.toFixed(1) + "s" : ""}
                {msg.cost && msg.cost.cost_usd > 0 && (
                  <span style={{ marginLeft: 8, color: "var(--yellow)", fontSize: 10, fontFamily: "var(--mono)" }} title="Estimated cost for this response">
                    💰 {msg.cost.cost_fmt}
                  </span>
                )}
                {msg.cost && msg.cost.cost_usd === 0 && (
                  <span style={{ marginLeft: 8, color: "var(--green)", fontSize: 10, fontFamily: "var(--mono)" }} title="Free response">
                    ✦ free
                  </span>
                )}
                {msg.confidence && (() => {
                  const lbl = msg.confidence.label || "";
                  const score = msg.confidence.score ?? 0;
                  const col = lbl === "high" ? "var(--green)" : lbl === "medium" ? "var(--yellow)" : lbl === "low" ? "#f97316" : "var(--red)";
                  return (
                    <span style={{ marginLeft: 8, color: col, fontSize: 10, fontFamily: "var(--mono)" }} title={`Confidence score: ${score}/100`}>
                      ◈ {score}
                    </span>
                  );
                })()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const hasMic = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="chat-layout">
      {fallbackNote && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--accent)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 8,
            fontSize: 13,
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(0,0,0,.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ⚡ Fallback: <b>{fallbackNote.from}</b> → <b>{fallbackNote.to}</b>
        </div>
      )}

      <div className={`chat-sidebar ${showHistory ? "" : "chat-sidebar-hidden"}`}>
        <div className="chat-sidebar-header">
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={newConversation}>
            + New Chat
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: "6px 10px" }} onClick={() => setShowHistory((h) => !h)} title="Toggle history">☰</button>
        </div>

        <div className="chat-conv-list">
          {conversations.length === 0 && (
            <div style={{ padding: "16px 12px", fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>
              No conversations yet
            </div>
          )}

          {conversations.map((conv) => (
            <div key={conv.id} className={`chat-conv-item ${activeConvId === conv.id ? "active" : ""}`} onClick={() => openConversation(conv)}>
              {renaming === conv.id ? (
                <input
                  className="chat-rename-input"
                  value={renameVal}
                  autoFocus
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={() => saveRename(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(conv.id);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="chat-conv-title">{conv.title}</div>
                  <div className="chat-conv-meta">
                    {conv.model_name || conv.model} · {new Date((conv.updated_at || conv.created_at) * 1000).toLocaleDateString()}
                  </div>
                  <div className="chat-conv-actions">
                    <button className="chat-conv-btn" title="Rename" onClick={(e) => { e.stopPropagation(); setRenaming(conv.id); setRenameVal(conv.title); }}>✎</button>
                    <button className="chat-conv-btn chat-conv-btn-del" title="Delete" onClick={(e) => deleteConv(e, conv.id)}>✕</button>
                  </div>
                </>
              )}
            </div>
          ))}

          {conversations.length > 0 && (
            <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", color: "var(--danger,#e05c5c)", fontSize: 11, fontFamily: "var(--mono)" }}
                onClick={async () => {
                  if (!window.confirm(t("chat_clear_confirm"))) return;
                  await fetch("/api/chat/history", { method: "DELETE" });
                  setConversations([]);
                  setActiveModelName("");
                  newConversation();
                }}
              >
                🗑 {t("chat_clear_all")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-toolbar">
          {!showHistory && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(true)} title="Show history">☰</button>
          )}
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", flex: 1, paddingLeft: 8 }}>
            {activeConvId ? conversations.find((c) => c.id === activeConvId)?.title || "Chat" : "New conversation"}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px" }}>
            🤖 {activeModelName || (activeModels && activeModels[0]?.name) || "Airvo Assistant"}
          </div>
          {routeCategory && (
            <div title={`Smart Router: ${routeCategory.label}`} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#fff", background: routeCategory.color + "33", border: `1px solid ${routeCategory.color}`, borderRadius: 6, padding: "4px 8px", cursor: "default" }}>
              {routeCategory.icon} {routeCategory.label}
            </div>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 && !streaming && (
            <div className="chat-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Airvo Assistant</div>
              {activeModels && activeModels.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--danger,#e05c5c)", fontFamily: "var(--mono)", maxWidth: 380, textAlign: "center", lineHeight: 1.9, background: "var(--bg2)", border: "1px solid var(--danger,#e05c5c)", borderRadius: 8, padding: "12px 16px" }}>
                  ⚠️ {t("assistant_no_model")} <strong>{t("assistant_no_model_link")}</strong> {t("assistant_no_model2")}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)", maxWidth: 380, textAlign: "center", lineHeight: 1.9 }}>
                    Ask me anything about Airvo - how to add models, configure RAG,
                    use Compare, troubleshoot errors, or understand any feature.
                  </div>
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380 }}>
                    {[t("assistant_q1"), t("assistant_q2"), t("assistant_q3"), t("assistant_q4")].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        style={{
                          background: "var(--bg2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "8px 14px",
                          color: "var(--text2)",
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all .15s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {messages.map((msg, i) => renderBubble(msg, false, i))}

          {streaming && streamContent && renderBubble({ role: "assistant", content: streamContent }, true, "stream")}

          {streaming && !streamContent && (
            <div className="chat-bubble chat-bubble-ai">
              <div className="chat-bubble-role">AI</div>
              <div className="chat-bubble-content chat-thinking">
                <span className="chat-thinking-dot" />
                <span className="chat-thinking-dot" />
                <span className="chat-thinking-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form className="chat-input-area" onSubmit={sendMessage}>
          <div className="chat-input-row">
            {hasMic && (
              <button
                type="button"
                className={`btn btn-ghost chat-mic-btn ${listening ? "chat-mic-active" : ""}`}
                onClick={toggleMic}
                title={listening ? "Stop recording" : "Voice input"}
              >
                {listening ? "⏹" : "🎤"}
              </button>
            )}
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Ask about Airvo... (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={streaming}
            />
            <button type="submit" className="btn btn-primary chat-send-btn" disabled={!input.trim() || streaming}>
              {streaming ? "..." : "↑"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
