function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      parts.push(<strong key={m.index}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      parts.push(<em key={m.index}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      parts.push(
        <code key={m.index} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--mono)", fontSize: "0.88em" }}>
          {m[4]}
        </code>
      );
    } else if (m[5] !== undefined) {
      parts.push(<a key={m.index} href={m[6]} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{m[5]}</a>);
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

export function renderMarkdownText(text, keyPrefix) {
  const lines = text.split("\n");
  const out = [];
  let listBuf = [];
  let i = 0;

  function flushList() {
    if (!listBuf.length) return;
    out.push(
      <ul key={`${keyPrefix}-ul-${i}`} style={{ margin: "6px 0 6px 0", paddingLeft: 20, listStyle: "disc" }}>
        {listBuf.map((item, j) => <li key={j} style={{ lineHeight: 1.7 }}>{renderInline(item)}</li>)}
      </ul>
    );
    listBuf = [];
  }

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    const li = line.match(/^[-*+]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
    const hr = line.match(/^---+$/);

    if (h1 || h2 || h3) {
      flushList();
      const txt = (h1 || h2 || h3)[1];
      const sz = h1 ? 17 : h2 ? 15 : 13;
      out.push(<div key={`${keyPrefix}-h-${i}`} style={{ fontWeight: 700, fontSize: sz, marginTop: 10, marginBottom: 3, color: "var(--text)" }}>{renderInline(txt)}</div>);
    } else if (li) {
      listBuf.push(li[1]);
    } else if (hr) {
      flushList();
      out.push(<hr key={`${keyPrefix}-hr-${i}`} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />);
    } else if (line.trim() === "") {
      flushList();
      out.push(<div key={`${keyPrefix}-br-${i}`} style={{ height: 6 }} />);
    } else {
      flushList();
      out.push(<p key={`${keyPrefix}-p-${i}`} style={{ margin: "3px 0", lineHeight: 1.75 }}>{renderInline(line)}</p>);
    }
    i++;
  }
  flushList();
  return out;
}

export function parseBlocks(text) {
  if (!text) return [];
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: (match[1] || "").toLowerCase(), content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", content: text }];
}
