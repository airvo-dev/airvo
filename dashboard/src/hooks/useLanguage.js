import { useCallback, useState } from "react";
import { createTranslator } from "../i18n";

export function useLanguage() {
  const [lang, setLangState] = useState(() => localStorage.getItem("airvo_lang") || "en");

  const setLang = useCallback((code) => {
    localStorage.setItem("airvo_lang", code);
    setLangState(code);
  }, []);

  const t = useCallback(createTranslator(lang), [lang]);

  return { lang, setLang, t };
}
