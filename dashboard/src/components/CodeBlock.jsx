import { useState } from "react";
import { highlightCode } from "../utils/highlight";

export default function CodeBlock({ block, t }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(block.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="compare-code-block">
      <div className="compare-code-header">
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>
          {block.lang || "code"}
        </span>
        <button className="compare-code-copy" onClick={handleCopy}>
          {copied ? t("compare_copied") : t("compare_copy")}
        </button>
      </div>
      <pre dangerouslySetInnerHTML={{ __html: highlightCode(block.content, block.lang) }} />
    </div>
  );
}
