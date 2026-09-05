import { LANGUAGES } from "./languages";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import zh from "./zh.json";
import ja from "./ja.json";
import pt from "./pt.json";
const TRANSLATIONS = {
  "en": en,
  "es": es,
  "fr": fr,
  "de": de,
  "zh": zh,
  "ja": ja,
  "pt": pt
};

export { LANGUAGES };

export function createTranslator(lang) {
  return function t(key) {
    return TRANSLATIONS?.[lang]?.[key] ?? TRANSLATIONS?.en?.[key] ?? key;
  };
}
