import hljs from "highlight.js/lib/core";
import _hljsPY from "highlight.js/lib/languages/python";
import _hljsJS from "highlight.js/lib/languages/javascript";
import _hljsTS from "highlight.js/lib/languages/typescript";
import _hljsJAVA from "highlight.js/lib/languages/java";
import _hljsCPP from "highlight.js/lib/languages/cpp";
import _hljsCS from "highlight.js/lib/languages/csharp";
import _hljsGO from "highlight.js/lib/languages/go";
import _hljsRUST from "highlight.js/lib/languages/rust";
import _hljsSH from "highlight.js/lib/languages/bash";
import _hljsJSON from "highlight.js/lib/languages/json";
import _hljsXML from "highlight.js/lib/languages/xml";
import _hljsCSS from "highlight.js/lib/languages/css";
import _hljsSQL from "highlight.js/lib/languages/sql";
import _hljsYAML from "highlight.js/lib/languages/yaml";
import _hljsKT from "highlight.js/lib/languages/kotlin";
import _hljsRB from "highlight.js/lib/languages/ruby";

[
  ["python", _hljsPY], ["py", _hljsPY], ["javascript", _hljsJS], ["js", _hljsJS], ["jsx", _hljsJS],
  ["typescript", _hljsTS], ["ts", _hljsTS], ["tsx", _hljsTS], ["java", _hljsJAVA],
  ["cpp", _hljsCPP], ["c", _hljsCPP], ["csharp", _hljsCS], ["cs", _hljsCS],
  ["go", _hljsGO], ["rust", _hljsRUST], ["rs", _hljsRUST],
  ["bash", _hljsSH], ["sh", _hljsSH], ["shell", _hljsSH],
  ["json", _hljsJSON], ["xml", _hljsXML], ["html", _hljsXML],
  ["css", _hljsCSS], ["sql", _hljsSQL], ["yaml", _hljsYAML], ["yml", _hljsYAML],
  ["kotlin", _hljsKT], ["kt", _hljsKT], ["ruby", _hljsRB], ["rb", _hljsRB],
].forEach(([alias, lang]) => {
  if (!hljs.getLanguage(alias)) hljs.registerLanguage(alias, lang);
});

export function highlightCode(code, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      // fallback to auto-detect
    }
  }
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
