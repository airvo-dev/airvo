import { useEffect, useState } from "react";
import { LANGUAGES } from "../i18n";

export default function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((item) => item.code === lang) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <div className="lang-trigger" onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 15 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span className={`lang-arrow ${open ? "open" : ""}`}>▾</span>
      </div>
      {open && (
        <div className="lang-menu">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              className={`lang-option ${lang === item.code ? "selected" : ""}`}
              onClick={() => {
                setLang(item.code);
                setOpen(false);
              }}
            >
              <span style={{ fontSize: 15 }}>{item.flag}</span>
              <span>{item.name}</span>
              {lang === item.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
