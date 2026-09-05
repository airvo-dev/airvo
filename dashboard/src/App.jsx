import { useState, useEffect, useCallback, useRef, Fragment, Suspense } from "react";
import CodeBlock from "./components/CodeBlock";
import LangDropdown from "./components/LangDropdown";
import { useLanguage } from "./hooks/useLanguage";
import { useToast } from "./hooks/useToast";
import {
  ChatPage,
  ComparePage,
  ConfigPage,
  ModelsPage,
  StatsPage,
  StatusPage,
  preloadPage,
} from "./pages/lazyPages";
import { parseBlocks } from "./utils/markdown";

const API = import.meta.env.DEV ? "" : "";



const MEMORY_MAX_CHARS = 2500;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#0a0a0f; --bg2:#111118; --bg3:#1a1a24; --border:#2a2a3a;
    --accent:#7c6dfa; --accent2:#fa6d8f; --green:#4ade80;
    --yellow:#fbbf24; --red:#f87171; --text:#e8e8f0; --text2:#8888aa;
    --mono:'Space Mono',monospace; --sans:'Syne',sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--sans); min-height:100vh; }
  .dashboard { display:grid; grid-template-columns:230px 1fr; grid-template-rows:60px 1fr; min-height:100vh; }
  .header { grid-column:1/-1; display:flex; align-items:center; justify-content:space-between; padding:0 28px; background:var(--bg2); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .logo { display:flex; align-items:center; gap:10px; font-weight:800; font-size:20px; letter-spacing:-0.5px; }
  .logo-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 12px var(--accent); animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
  .header-right { display:flex; align-items:center; gap:16px; }
  .header-status { display:flex; align-items:center; gap:8px; font-family:var(--mono); font-size:12px; color:var(--text2); }
  .status-dot { width:7px; height:7px; border-radius:50%; }
  .status-dot.ok{background:var(--green);box-shadow:0 0 8px var(--green);} .status-dot.err{background:var(--red);} .status-dot.loading{background:var(--yellow);animation:pulse 1s infinite;}
  .lang-trigger { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:8px; background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:var(--mono); font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; user-select:none; }
  .lang-trigger:hover { border-color:#3a3a5a; }
  .lang-arrow { color:var(--text2); font-size:10px; transition:transform .2s; }
  .lang-arrow.open { transform:rotate(180deg); }
  .lang-menu { position:absolute; top:calc(100% + 8px); right:0; background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; min-width:160px; z-index:200; box-shadow:0 8px 32px rgba(0,0,0,.5); animation:dropIn .15s ease; }
  @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .lang-option { display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; background:transparent; border:none; cursor:pointer; color:var(--text2); font-family:var(--mono); font-size:12px; font-weight:700; text-align:left; transition:all .1s; }
  .lang-option:hover{background:var(--bg3);color:var(--text);} .lang-option.selected{background:var(--bg3);color:var(--accent);}
  .lang-check { margin-left:auto; color:var(--accent); }
  .sidebar { background:var(--bg2); border-right:1px solid var(--border); padding:24px 0; display:flex; flex-direction:column; gap:4px; }
  .nav-section { padding:0 16px; margin-bottom:8px; }
  .nav-label { font-family:var(--mono); font-size:10px; letter-spacing:2px; color:var(--text2); text-transform:uppercase; padding:0 8px; margin-bottom:6px; }
  .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; color:var(--text2); transition:all .15s; border:1px solid transparent; }
  .nav-item:hover{background:var(--bg3);color:var(--text);} .nav-item.active{background:var(--bg3);color:var(--accent);border-color:var(--border);}
  .nav-icon { font-size:16px; width:20px; text-align:center; }
  .nav-badge { margin-left:auto; background:var(--accent); color:white; font-size:10px; font-family:var(--mono); padding:1px 6px; border-radius:10px; font-weight:700; }
  .main { padding:32px; overflow-y:auto; }
  .page-title { font-size:28px; font-weight:800; letter-spacing:-1px; margin-bottom:6px; }
  .page-sub { color:var(--text2); font-size:14px; margin-bottom:32px; font-family:var(--mono); }
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .stat-label { font-family:var(--mono); font-size:11px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .stat-value { font-size:32px; font-weight:800; letter-spacing:-1px; line-height:1; }
  .stat-value.accent{color:var(--accent)} .stat-value.green{color:var(--green)} .stat-value.yellow{color:var(--yellow)} .stat-value.pink{color:var(--accent2)}
  .stat-sub { font-family:var(--mono); font-size:11px; color:var(--text2); margin-top:6px; }
  .models-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  .model-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:20px; transition:all .2s; position:relative; overflow:hidden; }
  .model-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--border); transition:background .2s; }
  .model-card.active::before{background:var(--accent);} .model-card.active{border-color:#3a3a5a;}
  .model-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
  .model-name { font-size:15px; font-weight:700; margin-bottom:3px; }
  .model-id { font-family:var(--mono); font-size:11px; color:var(--text2); }
  .model-notes { font-size:12px; color:var(--text2); margin-bottom:14px; font-family:var(--mono); }
  .model-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .model-stats { display:flex; gap:12px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); }
  .model-stat-item { font-family:var(--mono); font-size:10px; color:var(--text2); }
  .model-stat-item span { color:var(--accent); font-weight:700; }
  .provider-badge { font-family:var(--mono); font-size:10px; padding:3px 8px; border-radius:6px; font-weight:700; text-transform:uppercase; flex-shrink:0; }
  .provider-groq{background:#1a2a1a;color:#4ade80;border:1px solid #2a4a2a;} .provider-openai{background:#1a2a1a;color:#74c69d;border:1px solid #2a4a2a;} .provider-anthropic{background:#2a1a1a;color:#fa8072;border:1px solid #4a2a2a;} .provider-ollama{background:#1a1a2a;color:#7c6dfa;border:1px solid #2a2a4a;} .provider-lmstudio{background:#2a2a1a;color:#fbbf24;border:1px solid #4a4a2a;} .provider-default{background:var(--bg3);color:var(--text2);border:1px solid var(--border);}
  .free-badge { font-family:var(--mono); font-size:10px; padding:2px 7px; border-radius:4px; font-weight:700; }
  .free-badge.free{background:#1a2a1a;color:var(--green);border:1px solid #2a4a2a;} .free-badge.paid{background:#2a2a1a;color:var(--yellow);border:1px solid #4a4a2a;}
  .toggle { position:relative; width:44px; height:24px; flex-shrink:0; }
  .toggle input { opacity:0; width:0; height:0; }
  .toggle-track { position:absolute; inset:0; background:var(--bg3); border:1px solid var(--border); border-radius:12px; cursor:pointer; transition:all .2s; }
  .toggle-track::after { content:''; position:absolute; left:3px; top:50%; transform:translateY(-50%); width:16px; height:16px; background:var(--text2); border-radius:50%; transition:all .2s; }
  .toggle input:checked + .toggle-track{background:#2a2a4a;border-color:var(--accent);} .toggle input:checked + .toggle-track::after{left:calc(100% - 19px);background:var(--accent);box-shadow:0 0 8px var(--accent);}
  .key-row { display:flex; gap:8px; margin-top:12px; }
  .key-input { flex:1; background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:8px 12px; color:var(--text); font-family:var(--mono); font-size:12px; outline:none; transition:border-color .15s; }
  .key-input:focus{border-color:var(--accent);} .key-input::placeholder{color:var(--text2);}
  .btn { padding:8px 16px; border-radius:8px; font-family:var(--sans); font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; white-space:nowrap; }
  .btn-primary{background:var(--accent);color:white;} .btn-primary:hover{background:#9080ff;box-shadow:0 0 16px rgba(124,109,250,.4);}
  .btn-ghost{background:var(--bg3);color:var(--text2);border:1px solid var(--border);} .btn-ghost:hover{color:var(--text);border-color:#3a3a5a;}
  .btn-danger{background:#2a1a1a;color:var(--red);border:1px solid #4a2a2a;} .btn-danger:hover{background:#3a2020;}
  .btn-sm { padding:5px 10px; font-size:12px; }
  .card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:24px; }
  .card-title { font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--text2); margin-bottom:16px; font-family:var(--mono); }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .form-group { display:flex; flex-direction:column; gap:6px; }
  .form-group.full { grid-column:1/-1; }
  .form-label-row { display:flex; align-items:center; gap:6px; }
  .form-label { font-family:var(--mono); font-size:11px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; }
  .form-input { background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--text); font-family:var(--mono); font-size:13px; outline:none; transition:border-color .15s; }
  .form-input:focus{border-color:var(--accent);} .form-input::placeholder{color:var(--text2);}
  .form-textarea { background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:12px 14px; color:var(--text); font-family:var(--mono); font-size:12px; outline:none; transition:border-color .15s; resize:vertical; min-height:140px; line-height:1.7; }
  .form-textarea:focus{border-color:var(--accent);} .form-textarea::placeholder{color:var(--text2);}
  .form-textarea.over-limit{border-color:var(--red);}
  .tooltip-wrap { position:relative; display:inline-flex; align-items:center; }
  .tooltip-icon { width:16px; height:16px; border-radius:50%; background:var(--bg3); border:1px solid var(--border); color:var(--text2); font-size:10px; font-family:var(--mono); font-weight:700; cursor:help; display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
  .tooltip-icon:hover{border-color:var(--accent);color:var(--accent);}
  .tooltip-box { position:absolute; left:24px; top:50%; transform:translateY(-50%); background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:14px 16px; min-width:280px; max-width:340px; z-index:300; box-shadow:0 8px 32px rgba(0,0,0,.6); animation:dropIn .15s ease; pointer-events:none; }
  .tooltip-box.flip{left:auto;right:24px;}
  .tooltip-title { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .tooltip-body { font-size:12px; color:var(--text2); line-height:1.6; margin-bottom:10px; }
  .tooltip-examples { background:var(--bg3); border-radius:6px; padding:10px 12px; }
  .tooltip-examples-label { font-family:var(--mono); font-size:10px; color:var(--text2); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .tooltip-example-line { font-family:var(--mono); font-size:11px; color:var(--green); line-height:1.8; }
  .mode-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
  .mode-card { padding:14px; border:1px solid var(--border); border-radius:10px; cursor:pointer; transition:all .15s; background:var(--bg3); }
  .mode-card:hover{border-color:#3a3a5a;} .mode-card.selected{border-color:var(--accent);background:#1a1a2a;}
  .mode-card-title { font-size:13px; font-weight:700; margin-bottom:4px; }
  .mode-card-desc { font-size:11px; color:var(--text2); font-family:var(--mono); }
  .active-model-item { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); }
  .active-model-item:last-child{border-bottom:none;}
  .active-model-name { font-size:13px; font-weight:600; }
  .active-model-id { font-family:var(--mono); font-size:11px; color:var(--text2); }
  .slider-wrap { display:flex; flex-direction:column; gap:10px; }
  .slider { -webkit-appearance:none; width:100%; height:4px; border-radius:2px; background:var(--bg3); border:1px solid var(--border); outline:none; cursor:pointer; }
  .slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--accent); cursor:pointer; box-shadow:0 0 8px rgba(124,109,250,.4); }
  .slider::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--accent); cursor:pointer; border:none; }
  .slider-labels { display:flex; justify-content:space-between; font-family:var(--mono); font-size:10px; color:var(--text2); }
  .slider-value { font-family:var(--mono); font-size:20px; font-weight:700; color:var(--accent); }
  .slider-hint { font-family:var(--mono); font-size:11px; color:var(--text2); }
  .memory-counter { font-family:var(--mono); font-size:11px; display:flex; justify-content:space-between; }
  .memory-counter.ok{color:var(--text2);} .memory-counter.warn{color:var(--yellow);} .memory-counter.over{color:var(--red);}
  .stats-table { width:100%; border-collapse:collapse; }
  .stats-table th { font-family:var(--mono); font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text2); text-align:left; padding:8px 0; border-bottom:1px solid var(--border); }
  .stats-table td { font-family:var(--mono); font-size:12px; padding:10px 0; border-bottom:1px solid var(--border); color:var(--text2); }
  .stats-table td:first-child { color:var(--text); font-weight:700; }
  .stats-table td.num { color:var(--accent); font-weight:700; text-align:right; }
  .stats-table tr:last-child td { border-bottom:none; }
  .help-section { margin-bottom:32px; }
  .help-section-title { font-size:16px; font-weight:800; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .help-section-icon { font-size:18px; }
  .help-field-block { margin-bottom:20px; padding:16px; background:var(--bg3); border-radius:10px; border:1px solid var(--border); }
  .help-field-title { font-family:var(--mono); font-size:12px; font-weight:700; color:var(--accent); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px; }
  .help-field-desc { font-size:13px; color:var(--text2); line-height:1.7; margin-bottom:10px; }
  .help-code-block { background:var(--bg2); border:1px solid var(--border); border-radius:6px; padding:10px 14px; font-family:var(--mono); font-size:11px; color:var(--green); line-height:1.9; }
  .help-mode-item { padding:12px 16px; background:var(--bg3); border-radius:8px; border:1px solid var(--border); margin-bottom:8px; font-size:13px; color:var(--text2); line-height:1.6; }
  .help-mode-item strong{color:var(--text);font-weight:700;}
  .faq-item { margin-bottom:16px; padding:16px; background:var(--bg3); border-radius:10px; border:1px solid var(--border); }
  .faq-q { font-size:13px; font-weight:700; margin-bottom:8px; color:var(--text); }
  .faq-a { font-size:13px; color:var(--text2); line-height:1.7; font-family:var(--mono); }
  .help-intro { background:var(--bg3); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:28px; font-size:14px; color:var(--text2); line-height:1.8; }
  .help-intro strong{color:var(--accent);}
  .divider { border:none; border-top:1px solid var(--border); margin:16px 0; }
  .empty { text-align:center; padding:48px; color:var(--text2); font-family:var(--mono); font-size:13px; }
  .toast-container { position:fixed; bottom:24px; right:24px; display:flex; flex-direction:column; gap:8px; z-index:1000; }
  .toast { padding:12px 18px; border-radius:10px; font-family:var(--mono); font-size:13px; border:1px solid; animation:slideIn .2s ease; }
  @keyframes slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
  .toast.success{background:#0a1a0a;color:var(--green);border-color:#2a4a2a;} .toast.error{background:#1a0a0a;color:var(--red);border-color:#4a2a2a;} .toast.info{background:#0a0a1a;color:var(--accent);border-color:#2a2a4a;} .toast.warning{background:#1a1500;color:var(--yellow);border-color:#4a3a00;}
  .compare-grid { display:grid; gap:16px; }
  .compare-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; min-height:200px; }
  .compare-card-header { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .compare-card-body { padding:16px 18px; flex:1; overflow-y:auto; max-height:440px; }
  .compare-card-footer { padding:10px 18px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .compare-pre { font-family:var(--mono); font-size:12px; color:var(--text); white-space:pre-wrap; word-break:break-word; line-height:1.7; margin:0; }
  .compare-badge { font-family:var(--mono); font-size:10px; padding:2px 8px; border-radius:4px; font-weight:700; flex-shrink:0; }
  .compare-code-block { position:relative; margin:10px 0; border-radius:8px; overflow:hidden; background:#0d0d16; border:1px solid #2a2a3a; }
  .compare-code-block pre { margin:0; padding:12px 16px 12px; overflow-x:auto; font-family:var(--mono); font-size:12px; line-height:1.7; color:var(--text); }
  .compare-code-header { display:flex; align-items:center; justify-content:space-between; padding:6px 12px; border-bottom:1px solid #2a2a3a; background:#0a0a12; }
  .compare-code-copy { background:transparent; border:1px solid #2a2a3a; border-radius:4px; color:var(--text2); font-family:var(--mono); font-size:10px; padding:2px 8px; cursor:pointer; transition:all .15s; }
  .compare-code-copy:hover { border-color:var(--accent); color:var(--accent); }
  .compare-expand-btn { background:transparent; border:1px solid var(--border); border-radius:4px; color:var(--text2); font-family:var(--mono); font-size:12px; padding:2px 7px; cursor:pointer; transition:all .15s; line-height:1; flex-shrink:0; }
  .compare-expand-btn:hover { border-color:var(--accent); color:var(--accent); }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .compare-cursor::after { content:"|"; display:inline-block; margin-left:2px; animation:blink 1s step-start infinite; color:var(--accent); }
  .diff-unique { border-radius:2px; padding:0 2px; }
  .hljs-keyword,.hljs-operator,.hljs-selector-tag,.hljs-built_in { color:#7c6dfa; font-weight:700; }
  .hljs-string,.hljs-attr,.hljs-attribute { color:#4ade80; }
  .hljs-comment,.hljs-quote { color:#8888aa; font-style:italic; }
  .hljs-number,.hljs-literal { color:#fbbf24; }
  .hljs-type,.hljs-class .hljs-title,.hljs-title.class_ { color:#74c69d; }
  .hljs-function .hljs-title,.hljs-title.function_ { color:#fa6d8f; }
  .hljs-variable,.hljs-params { color:#e8e8f0; }
  .hljs-name,.hljs-selector-id,.hljs-selector-class { color:#7c6dfa; }
  .hljs-meta { color:#8888aa; }
  .hljs-addition { background:#0a2a0a; color:#4ade80; }
  .hljs-deletion { background:#2a0a0a; color:#f87171; }
  .hljs-emphasis { font-style:italic; }
  .hljs-strong { font-weight:700; }

  /* ── Chat Page ── */
  .chat-layout { display:flex; height:calc(100vh - 60px); overflow:hidden; margin:-32px; }
  .chat-sidebar { width:260px; min-width:220px; max-width:300px; background:var(--bg2); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width .2s,min-width .2s; overflow:hidden; }
  .chat-sidebar-hidden { width:0; min-width:0; }
  .chat-sidebar-header { display:flex; gap:6px; padding:12px; border-bottom:1px solid var(--border); }
  .chat-conv-list { flex:1; overflow-y:auto; padding:8px 0; }
  .chat-conv-item { padding:10px 14px; cursor:pointer; border-bottom:1px solid transparent; position:relative; transition:background .12s; }
  .chat-conv-item:hover { background:var(--bg3); }
  .chat-conv-item.active { background:var(--bg3); border-left:3px solid var(--accent); }
  .chat-conv-title { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }
  .chat-conv-meta { font-family:var(--mono); font-size:10px; color:var(--text2); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:190px; }
  .chat-conv-actions { position:absolute; right:8px; top:50%; transform:translateY(-50%); display:none; gap:4px; }
  .chat-conv-item:hover .chat-conv-actions { display:flex; }
  .chat-conv-btn { background:transparent; border:1px solid var(--border); border-radius:4px; color:var(--text2); font-size:11px; padding:2px 6px; cursor:pointer; transition:all .1s; }
  .chat-conv-btn:hover { border-color:var(--accent); color:var(--accent); }
  .chat-conv-btn-del:hover { border-color:var(--red); color:var(--red); }
  .chat-rename-input { width:100%; font-size:12px; background:var(--bg); border:1px solid var(--accent); border-radius:4px; color:var(--text); padding:3px 6px; font-family:var(--mono); outline:none; }

  .chat-main { flex:1; display:flex; flex-direction:column; min-width:0; background:var(--bg); }
  .chat-toolbar { display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid var(--border); background:var(--bg2); min-height:48px; flex-shrink:0; }
  .chat-messages { flex:1; overflow-y:auto; padding:24px 20px; display:flex; flex-direction:column; gap:16px; }
  .chat-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; height:100%; min-height:300px; color:var(--text2); }

  .chat-bubble { max-width:780px; width:100%; display:flex; flex-direction:column; gap:6px; position:relative; }
  .chat-bubble-user { align-self:flex-end; align-items:flex-end; }
  .chat-bubble-ai { align-self:flex-start; align-items:flex-start; }
  .chat-bubble-role { font-family:var(--mono); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--text2); }
  .chat-bubble-user .chat-bubble-role { color:var(--accent); }
  .chat-bubble-content { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:12px 16px; font-size:14px; line-height:1.7; max-width:100%; }
  .chat-bubble-user .chat-bubble-content { background:var(--accent); color:#fff; border-color:var(--accent); }
  .chat-cursor { display:inline-block; animation:blink 1s step-start infinite; color:var(--accent); }
  .chat-copy-btn { background:transparent; border:1px solid var(--border); border-radius:6px; color:var(--text2); font-size:12px; padding:2px 8px; cursor:pointer; transition:all .1s; align-self:flex-end; }
  .chat-copy-btn:hover { border-color:var(--accent); color:var(--accent); }
  .chat-token-meta { font-family:var(--mono); font-size:10px; color:var(--text2); opacity:0.7; }

  .chat-input-area { padding:12px 16px 16px; border-top:1px solid var(--border); background:var(--bg2); flex-shrink:0; }
  .chat-input-row { display:flex; gap:8px; align-items:flex-end; }
  .chat-textarea { flex:1; background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:10px 14px; color:var(--text); font-family:var(--sans); font-size:14px; resize:none; outline:none; min-height:42px; max-height:200px; transition:border .15s; overflow-y:auto; }
  .chat-textarea:focus { border-color:var(--accent); }
  .chat-textarea:disabled { opacity:0.5; }
  .chat-send-btn { border-radius:10px; padding:10px 16px; font-size:18px; line-height:1; height:42px; flex-shrink:0; }
  .chat-mic-btn { border-radius:10px; padding:8px 12px; font-size:16px; height:42px; flex-shrink:0; transition:all .15s; }
  .chat-mic-active { border-color:var(--red) !important; color:var(--red) !important; animation:pulse 1s infinite; }
  .chat-thinking { display:flex; align-items:center; gap:5px; padding:14px 16px !important; }
  .chat-thinking-dot { width:7px; height:7px; border-radius:50%; background:var(--text2); display:inline-block; animation:chatBounce 1.2s ease-in-out infinite; }
  .chat-thinking-dot:nth-child(1) { animation-delay:0s; }
  .chat-thinking-dot:nth-child(2) { animation-delay:.2s; }
  .chat-thinking-dot:nth-child(3) { animation-delay:.4s; }
  @keyframes chatBounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
`;

function getProviderClass(p) {
  const map = { groq:"groq", openai:"openai", anthropic:"anthropic", ollama:"ollama", lmstudio:"lmstudio" };
  return `provider-${map[p] || "default"}`;
}

function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return key.slice(0,6) + "••••••••" + key.slice(-4);
}

function inferIsFree(provider, baseUrl) {
  const localProviders = ["ollama", "lmstudio"];
  if (localProviders.includes((provider || "").toLowerCase())) return true;
  if (baseUrl && baseUrl.trim()) return true;
  return false;
}

function getTempHint(val, t) {
  if (val <= 0.2) return t("temp_hint_low");
  if (val >= 0.8) return t("temp_hint_high");
  return t("temp_hint_mid");
}

const COMPARE_COLORS = ["var(--accent)", "var(--accent2)", "var(--green)", "var(--yellow)"];

/** Word-level diff: for each text returns [{token, unique}] where unique=true means the word
 *  does NOT appear in any other response — i.e. it's distinctive to this model. */
function computeWordDiff(results, pinnedIdx = null) {
  const texts = results.map(r => r.content || "");
  if (pinnedIdx !== null && pinnedIdx >= 0 && pinnedIdx < texts.length && texts[pinnedIdx]) {
    const pinnedWords = new Set((texts[pinnedIdx].toLowerCase().match(/\b[a-z]{3,}\b/g) || []));
    return texts.map((txt, i) => {
      if (i === pinnedIdx) return txt.split(/(\s+)/).map(token => ({ token, unique: false }));
      return txt.split(/(\s+)/).map(token => {
        const word = token.toLowerCase().replace(/[^a-z]/g, "");
        return { token, unique: word.length >= 3 && !pinnedWords.has(word) };
      });
    });
  }
  const bags = texts.map(txt => {
    const s = new Set();
    (txt.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).forEach(w => s.add(w));
    return s;
  });
  return texts.map((txt, i) => {
    const others = new Set();
    bags.forEach((b, j) => { if (j !== i) b.forEach(w => others.add(w)); });
    return txt.split(/(\s+)/).map(token => {
      const word = token.toLowerCase().replace(/[^a-z]/g, "");
      return { token, unique: word.length >= 3 && !others.has(word) };
    });
  });
}

function computeSentenceDiff(results, pinnedIdx = null) {
  const texts = results.map(r => r.content || "");
  const splitSents = txt => (txt.match(/[^.!?\n]+[.!?\n]?/g) || [txt]).map(s => s.trim()).filter(Boolean);
  const norm = s => s.toLowerCase().replace(/\s+/g, " ");
  if (pinnedIdx !== null && pinnedIdx >= 0 && pinnedIdx < texts.length) {
    const refSet = new Set(splitSents(texts[pinnedIdx]).map(norm));
    return texts.map((txt, i) => {
      if (i === pinnedIdx) return splitSents(txt).map(s => ({ token: s + " ", unique: false }));
      return splitSents(txt).map(s => ({ token: s + " ", unique: !refSet.has(norm(s)) }));
    });
  }
  const bags = texts.map(txt => new Set(splitSents(txt).map(norm)));
  return texts.map((txt, i) => {
    const others = new Set();
    bags.forEach((b, j) => { if (j !== i) b.forEach(s => others.add(s)); });
    return splitSents(txt).map(s => ({ token: s + " ", unique: !others.has(norm(s)) }));
  });
}

function computeJaccard(results) {
  const bags = results.map(r => {
    const s = new Set();
    ((r.content || "").toLowerCase().match(/\b[a-z]{3,}\b/g) || []).forEach(w => s.add(w));
    return s;
  });
  const pairs = [];
  for (let i = 0; i < bags.length; i++) {
    for (let j = i + 1; j < bags.length; j++) {
      const inter = [...bags[i]].filter(w => bags[j].has(w)).length;
      const union = new Set([...bags[i], ...bags[j]]).size;
      pairs.push({ a: results[i].name, b: results[j].name, score: union > 0 ? Math.round((inter / union) * 100) : 0 });
    }
  }
  return pairs;
}

function CompareCard({ result, index, t, isFastest, isMostTokens, isExpanded, onExpand, streaming, diffTokens, isPinned, onPin, onCopy }) {
  const [copied, setCopied] = useState(false);
  const color = COMPARE_COLORS[index % COMPARE_COLORS.length];

  function handleCopy() {
    if (!result.content) return;
    navigator.clipboard.writeText(result.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    });
  }

  // Render body: diff mode > streaming > normal
  function renderBody() {
    if (streaming && !result.done) {
      return (
        <pre className={`compare-pre compare-cursor`}>
          {result.content || ""}
        </pre>
      );
    }
    if (diffTokens) {
      return (
        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text)", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {diffTokens.map((t, i) =>
            t.unique
              ? <mark key={i} className="diff-unique" style={{ background:`color-mix(in srgb, ${color} 22%, transparent)`, color:"inherit" }}>{t.token}</mark>
              : <span key={i}>{t.token}</span>
          )}
        </div>
      );
    }
    if (result.error) {
      return <div style={{ color:"var(--red)", fontFamily:"var(--mono)", fontSize:12, lineHeight:1.7 }}>✗ {result.error}</div>;
    }
    return parseBlocks(result.content || "").map((block, i) =>
      block.type === "code"
        ? <CodeBlock key={i} block={block} t={t} />
        : <pre key={i} className="compare-pre">{block.content}</pre>
    );
  }

  return (
    <div className="compare-card" style={{ borderTop:`3px solid ${color}` }}>
      <div className="compare-card-header">
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:2 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>{result.name}</span>
            {isPinned && (
              <span className="compare-badge" style={{ background:"#1a0a1a", color:"#c084fc", border:"1px solid #4a2a5a" }}>📌 {t("compare_pinned")}</span>
            )}
            {isFastest && (
              <span className="compare-badge" style={{ background:"#001a0a", color:"var(--green)", border:"1px solid #2a5a2a" }}>⚡ {t("compare_fastest")}</span>
            )}
            {isMostTokens && (
              <span className="compare-badge" style={{ background:"#1a1500", color:"var(--yellow)", border:"1px solid #5a4a0a" }}>📝 {t("compare_most_tokens")}</span>
            )}
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {result.model}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {result.error ? (
            <span className="compare-badge" title={result.error} style={{ background:"#2a1a1a", color:"var(--red)", border:"1px solid #4a2a2a" }}>
              {t("compare_error_badge")}
            </span>
          ) : (
            <>
              {result.elapsed_s != null && (
                <span className="compare-badge" title={`Response time: ${result.elapsed_s}s — how long this model took to generate the full response`} style={{ background:"#0a1a0a", color:"var(--green)", border:"1px solid #2a4a2a" }}>
                  ⚡ {result.elapsed_s}{t("compare_elapsed")}
                </span>
              )}
              {result.tokens > 0 && (
                <span className="compare-badge" title={`${result.tokens} output tokens generated by this model`} style={{ background:"var(--bg3)", color:"var(--text2)", border:"1px solid var(--border)" }}>
                  {result.tokens} {t("compare_tokens")}
                </span>
              )}
              {result.tokens > 0 && result.elapsed_s > 0 && (
                <span className="compare-badge" title={`${(result.tokens / result.elapsed_s).toFixed(0)} tokens per second — generation speed. Higher = faster model`} style={{ background:"#0a0a1a", color:"var(--accent)", border:"1px solid #2a2a4a" }}>
                  {(result.tokens / result.elapsed_s).toFixed(0)} {t("compare_tok_s")}
                </span>
              )}
            </>
          )}
          <button className="compare-expand-btn" onClick={onExpand}
            title={isExpanded ? t("compare_collapse") : t("compare_expand")}>
            {isExpanded ? "⊡" : "⛶"}
          </button>
          {onPin && (
            <button className="compare-expand-btn" onClick={onPin}
              title={isPinned ? t("compare_unpin") : t("compare_pin")}
              style={{ color: isPinned ? "#c084fc" : undefined }}>
              📌
            </button>
          )}
        </div>
      </div>
      <div className="compare-card-body">
        {renderBody()}
      </div>
      <div className="compare-card-footer">
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
          {streaming && !result.done
            ? <span style={{ color:"var(--accent)" }}>{t("compare_streaming")}</span>
            : result.tokens > 0 ? `${result.tokens} ${t("compare_tokens")}` : ""
          }
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          disabled={!result.content || copied || (streaming && !result.done)}
          style={{ fontFamily:"var(--mono)", fontSize:12 }}
        >
          {copied ? t("compare_copied") : t("compare_copy")}
        </button>
      </div>
    </div>
  );
}

function Tooltip({ title, body, examples, flip = false }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="tooltip-wrap" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <div className="tooltip-icon">?</div>
      {visible && (
        <div className={`tooltip-box ${flip ? "flip" : ""}`}>
          <div className="tooltip-title">{title}</div>
          <div className="tooltip-body">{body}</div>
          {examples && (
            <div className="tooltip-examples">
              <div className="tooltip-examples-label">Examples</div>
              {examples.split("\n").map((ex, i) => (
                <div key={i} className="tooltip-example-line">▸ {ex}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AirvoDashboard() {
  const [page, setPage]        = useState("models");
  const [models, setModels]    = useState([]);
  const [health, setHealth]    = useState(null);
  const [loading, setLoading]  = useState(true);
  const [prefs, setPrefs]      = useState(null);
  const [stats, setStats]      = useState({});
  const [providerHealth, setProviderHealth] = useState({}); // model_id -> {ok, latency_ms, error}
  const [pinging, setPinging]  = useState(false);
  const [ragStatus, setRagStatus]       = useState(null);
  const [ragIndexing, setRagIndexing]   = useState(false);
  const [ragAdvanced, setRagAdvanced]   = useState(false);
  const [showRagWarning, setShowRagWarning] = useState(false);
  const [showBenchModal, setShowBenchModal] = useState(false);
  const [benchModalModel, setBenchModalModel] = useState("");
  const [hwStatus,  setHwStatus]  = useState(null);
  const [hwLoading, setHwLoading] = useState(false);
  const [fitModels, setFitModels] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [opsStats, setOpsStats] = useState(null);
  const [opsAlerts, setOpsAlerts] = useState(null);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsResetting, setOpsResetting] = useState(false);
  const [hwProcesses,    setHwProcesses]    = useState(null);
  const [hwProcLoading,  setHwProcLoading]  = useState(false);
  const [hwProcOpen,     setHwProcOpen]     = useState(false);
  const [compareData,    setCompareData]    = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareAutoRefresh, setCompareAutoRefresh] = useState(false);
  const [compareHistory, setCompareHistory] = useState([]);
  const [compareHistIdx, setCompareHistIdx] = useState(0);
  const [compareExportDone, setCompareExportDone] = useState(false);
  const [compareExpandIdx, setCompareExpandIdx] = useState(null);
  const [compareSortBy,    setCompareSortBy]    = useState("default");
  const [comparePrompt,    setComparePrompt]    = useState(() => {
    try { return localStorage.getItem("airvo_compare_prompt") || ""; } catch { return ""; }
  });
  const [compareRunning,   setCompareRunning]   = useState(false);
  const [compareStreamSlots, setCompareStreamSlots] = useState([]);
  const [compareDiffMode,  setCompareDiffMode]  = useState(false);
  const compareLastId = useRef(null);
  const [comparePinnedIdx,  setComparePinnedIdx]  = useState(null);
  const [compareDiffLevel,  setCompareDiffLevel]  = useState("word");   // "word" | "sentence"
  const [compareModelTemps, setCompareModelTemps] = useState({});        // {modelId: 0.0-1.0}
  const [compareShowTemps,  setCompareShowTemps]  = useState(false);
  const [compareTemplates,  setCompareTemplates]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("airvo_compare_templates") || "[]"); } catch { return []; }
  });
  const [statsData,   setStatsData]   = useState({});
  const [statsResetting, setStatsResetting] = useState(false);
  const [discOpen,  setDiscOpen]  = useState(false);
  const [discTab,   setDiscTab]   = useState("local");   // "local" | "cloud"
  const [discOllama,    setDiscOllama]    = useState(null);
  const [discOpenRouter,setDiscOpenRouter]= useState(null);
  const [discLoading,   setDiscLoading]   = useState(false);
  // ── v0.8 state ────────────────────────────────────────────────────────────
  const [budgetInfo,     setBudgetInfo]     = useState(null);
  const [cacheStats,     setCacheStats]     = useState(null);
  const [reqHistory,     setReqHistory]     = useState([]);
  const [historySearch,  setHistorySearch]  = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replayLoading,  setReplayLoading]  = useState(null);   // entry id being replayed
  const { toasts, add: toast } = useToast();
  const { lang, setLang, t }   = useLanguage();

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, hRes, pRes, sRes] = await Promise.all([
        fetch(`${API}/api/models`),
        fetch(`${API}/api/health`),
        fetch(`${API}/api/prefs`),
        fetch(`${API}/api/stats`),
      ]);
      setModels((await mRes.json()).models || []);
      setHealth(await hRes.json());
      setPrefs(await pRes.json());
      setStats((await sRes.json()).stats || {});
    } catch { setHealth(null); }
    finally  { setLoading(false); }
  }, []);

  const fetchRagStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/rag/status`);
      if (res.ok) setRagStatus(await res.json());
    } catch {}
  }, []);

  const fetchHardware = useCallback(async () => {
    setHwLoading(true);
    try {
      const res = await fetch(`${API}/api/hardware/status`);
      if (res.ok) setHwStatus(await res.json());
    } catch {}
    finally { setHwLoading(false); }
  }, []);

  const fetchFitModels = useCallback(async () => {
    setFitLoading(true);
    try {
      const res = await fetch(`${API}/api/hardware/fit-models`);
      if (res.ok) setFitModels(await res.json());
    } catch {}
    finally { setFitLoading(false); }
  }, []);

  const fetchProcesses = useCallback(async () => {
    setHwProcLoading(true);
    try {
      const res = await fetch(`${API}/api/hardware/processes`);
      if (res.ok) setHwProcesses(await res.json());
    } catch {}
    finally { setHwProcLoading(false); }
  }, []);

  const fetchOpsData = useCallback(async () => {
    setOpsLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${API}/api/stats/ops`),
        fetch(`${API}/api/stats/ops/alerts`),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setOpsStats(data.ops || null);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setOpsAlerts(data.slo || null);
      }
    } catch {}
    finally { setOpsLoading(false); }
  }, []);

  const resetOpsData = useCallback(async () => {
    setOpsResetting(true);
    try {
      const res = await fetch(`${API}/api/stats/ops`, { method: "DELETE" });
      if (res.ok) {
        await fetchOpsData();
        toast(t("ops_reset_done"), "info");
      }
    } catch {}
    finally { setOpsResetting(false); }
  }, [fetchOpsData, t, toast]);

  const fetchCompare = useCallback(async (silent = false) => {
    if (!silent) setCompareLoading(true);
    try {
      const [latestRes, histRes] = await Promise.all([
        fetch(`${API}/api/compare/latest`),
        fetch(`${API}/api/compare/history`),
      ]);
      if (latestRes.ok) {
        const data = await latestRes.json();
        const newData = data.data || null;
        const newId = newData?.id ?? null;
        if (newId !== compareLastId.current) {
          compareLastId.current = newId;
          setCompareData(newData);
          setCompareHistIdx(0);
        }
      }
      if (histRes.ok) {
        const h = await histRes.json();
        setCompareHistory(h.history || []);
      }
    } catch {}
    finally { if (!silent) setCompareLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data.stats || {});
      }
    } catch {}
  }, []);

  async function recordCopy(modelId) {
    try { await fetch(`${API}/api/stats/copy`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ model_id: modelId }) }); }
    catch {}
  }

  async function streamCompare(overridePrompt) {
    const prompt = (overridePrompt !== undefined ? overridePrompt : comparePrompt).trim();
    if (!prompt) return;
    const hadOverride = overridePrompt !== undefined;
    if (hadOverride) setComparePrompt(overridePrompt);
    const active = models.filter(m => m.active);
    if (active.length < 2) { toast(t("compare_run_error"), "error"); return; }
    setCompareRunning(true);
    setCompareDiffMode(false);
    setComparePinnedIdx(null);
    // Pre-fill slots so cards appear immediately
    setCompareStreamSlots(active.map(m => ({
      name: m.name, model: m.id, content: "", done: false, error: null, tokens: 0, elapsed_s: null,
    })));
    try {
      const body = { prompt };
      if (Object.keys(compareModelTemps).length > 0) body.model_temperatures = compareModelTemps;
      const res = await fetch(`${API}/api/compare/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.detail || t("compare_run_error"), "error");
        setCompareStreamSlots([]);
        return;
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
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
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "delta") {
              setCompareStreamSlots(prev => {
                const next = [...prev];
                if (next[ev.model_idx]) next[ev.model_idx] = { ...next[ev.model_idx], content: next[ev.model_idx].content + ev.delta };
                return next;
              });
            } else if (ev.type === "done" || ev.type === "error") {
              setCompareStreamSlots(prev => {
                const next = [...prev];
                if (next[ev.model_idx]) next[ev.model_idx] = {
                  ...next[ev.model_idx],
                  content: ev.content ?? next[ev.model_idx].content,
                  done: true, error: ev.error ?? null,
                  tokens: ev.tokens ?? 0, elapsed_s: ev.elapsed_s ?? null,
                };
                return next;
              });
            } else if (ev.type === "complete") {
              // Keep the prompt so the user can save it as a template or re-use it
              await fetchCompare(false);
              setCompareStreamSlots([]);
            }
          } catch {}
        }
      }
    } catch { toast(t("compare_run_error"), "error"); setCompareStreamSlots([]); }
    finally { setCompareRunning(false); }
  }

  // keep old runCompare as fallback (unused but safe)
  async function runCompare() { return streamCompare(); }

  async function clearCompareHistory() {
    if (!confirm(t("compare_clear_confirm"))) return;
    try {
      await fetch(`${API}/api/compare/history`, { method: "DELETE" });
      setCompareData(null);
      setCompareHistory([]);
      setCompareHistIdx(0);
      compareLastId.current = null;
      toast(t("compare_cleared"), "success");
    } catch { toast(t("compare_run_error"), "error"); }
  }

  function saveTemplate(promptText) {
    const txt = (promptText || comparePrompt).trim();
    if (!txt) return;
    const newList = [txt, ...compareTemplates.filter(x => x !== txt)].slice(0, 10);
    setCompareTemplates(newList);
    localStorage.setItem("airvo_compare_templates", JSON.stringify(newList));
    toast(t("compare_template_saved"), "success");
  }

  function deleteTemplate(tpl) {
    const newList = compareTemplates.filter(x => x !== tpl);
    setCompareTemplates(newList);
    localStorage.setItem("airvo_compare_templates", JSON.stringify(newList));
  }

  const fetchDiscovery = useCallback(async () => {
    setDiscLoading(true);
    try {
      const [oRes, crRes] = await Promise.all([
        fetch(`${API}/api/discovery/ollama`),
        fetch(`${API}/api/discovery/openrouter`),
      ]);
      if (oRes.ok)  setDiscOllama(await oRes.json());
      if (crRes.ok) setDiscOpenRouter((await crRes.json()).models || []);
    } catch {}
    finally { setDiscLoading(false); }
  }, []);

  // ── v0.8 fetch helpers ────────────────────────────────────────────────────
  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/budget`);
      if (res.ok) setBudgetInfo(await res.json());
    } catch {}
  }, []);

  const fetchCacheStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/cache/stats`);
      if (res.ok) setCacheStats(await res.json());
    } catch {}
  }, []);

  const fetchReqHistory = useCallback(async (search = "") => {
    setHistoryLoading(true);
    try {
      const url = search
        ? `${API}/api/history?search=${encodeURIComponent(search)}`
        : `${API}/api/history`;
      const res = await fetch(url);
      if (res.ok) setReqHistory((await res.json()).entries || []);
    } catch {}
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchRagStatus(); }, [fetchRagStatus]);
  useEffect(() => {
    if (page === "status") {
      fetchHardware();
      fetchFitModels();
      fetchOpsData();
    }
  }, [page, fetchHardware, fetchFitModels, fetchOpsData]);
  useEffect(() => { if (page === "compare") fetchCompare(); }, [page, fetchCompare]);
  useEffect(() => { if (page === "stats") fetchStats(); }, [page, fetchStats]);
  useEffect(() => { if (page === "config") { fetchBudget(); fetchCacheStats(); } }, [page, fetchBudget, fetchCacheStats]);
  useEffect(() => {
    const preloadLikelyPages = () => {
      preloadPage("chat");
      preloadPage("models");
      preloadPage("compare");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadLikelyPages, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(preloadLikelyPages, 500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => { if (page === "history") fetchReqHistory(historySearch); }, [page]); // eslint-disable-line
  useEffect(() => {
    try { localStorage.setItem("airvo_compare_prompt", comparePrompt); } catch {}
  }, [comparePrompt]);
  useEffect(() => {
    if (page !== "compare" || !compareAutoRefresh) return;
    const interval = setInterval(() => fetchCompare(true), 3000);
    return () => clearInterval(interval);
  }, [page, compareAutoRefresh, fetchCompare]);
  useEffect(() => { if (discOpen) fetchDiscovery(); }, [discOpen, fetchDiscovery]);

  const MAX_ACTIVE = 5;

  async function unloadOllamaModel(modelName) {
    if (!confirm(t("hw_unload_confirm"))) return;
    try {
      const res = await fetch(`${API}/api/hardware/unload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelName }),
      });
      if (res.ok) {
        toast(t("hw_unload_done"), "success");
        fetchHardware();
        fetchFitModels();
      }
      else toast(t("hw_unload_error"), "error");
    } catch { toast(t("hw_unload_error"), "error"); }
  }

  async function quickAddModel(entry) {
    try {
      const res = await fetch(`${API}/api/discovery/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, name: entry.name, provider: entry.provider }),
      });
      if (res.ok) {
        const data = await res.json();
        toast(data.already_existed ? t("disc_already_added") : t("disc_added"), "success");
        fetchAll();
      } else {
        toast(t("disc_add_error"), "error");
      }
    } catch { toast(t("disc_add_error"), "error"); }
  }

  async function toggleModel(id, current) {
    const active = models.filter(m => m.active);
    if (!current && active.length >= MAX_ACTIVE) {
      toast(t("toast_limit"), "warning");
      return;
    }
    try {
      await fetch(`${API}/api/models/${encodeURIComponent(id)}/toggle?active=${!current}`, { method:"PATCH" });
      setModels(prev => prev.map(m => m.id===id ? { ...m, active:!current } : m));
      toast(t(!current?"toast_activated":"toast_deactivated"), !current?"success":"info");
      if (!current && active.length >= 1) {
        setBenchModalModel(models.find(m => m.id===id)?.name || id);
        setShowBenchModal(true);
      }
    } catch { toast(t("toast_error_toggle"), "error"); }
  }

  async function saveKey(id, key) {
    if (!key.trim()) return toast(t("toast_key_error"), "error");
    try {
      await fetch(`${API}/api/models/${encodeURIComponent(id)}`, {
        method:"PATCH", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ api_key: key.trim() }),
      });
      setModels(prev => prev.map(m => m.id===id ? { ...m, api_key:key.trim() } : m));
      toast(t("toast_key_saved"), "success");
    } catch { toast(t("toast_error_key"), "error"); }
  }

  async function saveNotes(id, notes) {
    try {
      await fetch(`${API}/api/models/${encodeURIComponent(id)}`, {
        method:"PATCH", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ notes }),
      });
      setModels(prev => prev.map(m => m.id===id ? { ...m, notes } : m));
      toast(t("model_note_save"), "success");
    } catch { toast(t("toast_error_key"), "error"); }
  }

  async function deleteModel(id) {
    if (!confirm(t("confirm_delete"))) return;
    try {
      await fetch(`${API}/api/models/${encodeURIComponent(id)}`, { method:"DELETE" });
      setModels(prev => prev.filter(m => m.id!==id));
      toast(t("toast_deleted"), "info");
    } catch { toast(t("toast_error_delete"), "error"); }
  }

  async function addModel(data) {
    try {
      await fetch(`${API}/api/models`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(data),
      });
      toast(t("toast_added"), "success");
      fetchAll();
    } catch { toast(t("toast_error_add"), "error"); }
  }

  async function updatePrefs(updates) {
    try {
      await fetch(`${API}/api/prefs`, {
        method:"PATCH", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(updates),
      });
      setPrefs(prev => ({ ...prev, ...updates }));
    } catch {}
  }

  async function resetStats() {
    if (!confirm(t("stats_reset_confirm"))) return;
    await fetch(`${API}/api/stats`, { method:"DELETE" });
    setStats({});
    toast(t("stats_reset_done"), "info");
  }

  async function triggerRagIndex() {
    const path = (prefs?.rag_path || "").trim();
    if (!path) { toast(t("rag_path_label") + ": required", "error"); return; }
    setRagIndexing(true);
    try {
      const res = await fetch(`${API}/api/rag/index`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          path,
          max_index_mb: prefs?.rag_max_index_mb,
          max_file_kb:  prefs?.rag_max_file_kb,
          extensions:   prefs?.rag_extensions,
          exclude_dirs: prefs?.rag_exclude_dirs,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.detail || t("rag_index_error"), "error"); return; }
      toast(t("rag_index_done"), "success");
      await fetchRagStatus();
    } catch { toast(t("rag_index_error"), "error"); }
    finally { setRagIndexing(false); }
  }

  async function clearRagIndex() {
    if (!confirm(t("rag_clear_confirm"))) return;
    await fetch(`${API}/api/rag/reset`, { method:"DELETE" });
    toast(t("rag_clear_done"), "info");
    await fetchRagStatus();
  }

  const active       = models.filter(m => m.active);
  const continueYaml = `models:\n  - name: Airvo\n    provider: openai\n    model: airvo-auto\n    apiBase: http://localhost:5000/v1\n    apiKey: local\n    roles:\n      - chat\n      - edit\n      - apply`;

  return (
    <>
      <style>{css}</style>
      <div className="dashboard">

        <header className="header">
          <div className="logo">
            <div className="logo-dot" />
            Airvo
          </div>
          <div className="header-right">
            <LangDropdown lang={lang} setLang={setLang} />
            {prefs?.rag_enabled && ragStatus?.available && ragStatus?.chunks_total > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:6, background:"#1a1a2a", border:"1px solid var(--accent)", fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", fontWeight:700 }}>
                🧠 RAG
              </div>
            )}
            {health?.last_request?.type === "tool_call" && (
              <div title={t("tool_call_badge_tip")}
                onClick={() => setPage("config")}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:6, background:"#1a1200", border:"1px solid var(--yellow)", fontFamily:"var(--mono)", fontSize:11, color:"var(--yellow)", fontWeight:700, cursor:"pointer" }}>
                ⚡ {t("tool_call_badge")}
              </div>
            )}
            {health?.last_request?.type === "multi" && (
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:6, background:"#001a00", border:"1px solid var(--green)", fontFamily:"var(--mono)", fontSize:11, color:"var(--green)", fontWeight:700 }}>
                ⊙ {t("last_req_multi")}
              </div>
            )}
            <div className="header-status">
              <div className={`status-dot ${loading?"loading":health?"ok":"err"}`} />
              {loading ? t("connecting") : health ? `v${health.version} · localhost:5000` : t("offline")}
            </div>
          </div>
        </header>

        <aside className="sidebar">
          <div className="nav-section">
            {[
              { id:"models",  icon:"◈", label:t("nav_models"), badge:models.length||null },
              { id:"status",  icon:"◎", label:t("nav_status")  },
              { id:"chat",    icon:"🤖", label:t("nav_chat")    },
              { id:"compare", icon:"⊞", label:t("nav_compare") },
              { id:"stats",   icon:"📊", label:t("nav_stats")  },
              { id:"bench",   icon:"🏆", label:t("nav_bench")  },
              { id:"history", icon:"🕓", label:t("nav_history") },
              { id:"config",  icon:"⊙", label:t("nav_config")  },
              { id:"add",     icon:"+", label:t("nav_add")     },
              { id:"help",    icon:"?", label:t("nav_help")    },
            ].map(n => (
              <div
                key={n.id}
                className={`nav-item ${page===n.id?"active":""}`}
                onClick={() => setPage(n.id)}
                onMouseEnter={() => preloadPage(n.id)}
              >
                <span className="nav-icon">{n.icon}</span>
                {n.label}
                {n.badge && <span className="nav-badge">{n.badge}</span>}
              </div>
            ))}
          </div>
          <div className="nav-section" style={{ marginTop:"auto" }}>
            <div className="nav-label">{t("nav_active")}</div>
            {active.length === 0
              ? <div style={{ padding:"8px 12px", fontSize:12, color:"var(--text2)", fontFamily:"var(--mono)" }}>{t("nav_none")}</div>
              : active.map(m => (
                <div key={m.id} style={{ padding:"6px 12px", fontSize:12, color:"var(--accent)", fontFamily:"var(--mono)" }}>
                  ▸ {m.name}
                </div>
              ))
            }
          </div>
        </aside>

        <main className="main">

          {/* ── MODELS PAGE ── */}
          {page === "models" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <ModelsPage
                t={t}
                models={models}
                active={active}
                MAX_ACTIVE={MAX_ACTIVE}
                inferIsFree={inferIsFree}
                loading={loading}
                pinging={pinging}
                setPinging={setPinging}
                API={API}
                setProviderHealth={setProviderHealth}
                providerHealth={providerHealth}
                stats={stats}
                ModelCard={ModelCard}
                toggleModel={toggleModel}
                saveKey={saveKey}
                deleteModel={deleteModel}
                saveNotes={saveNotes}
                discOpen={discOpen}
                setDiscOpen={setDiscOpen}
                discLoading={discLoading}
                fetchDiscovery={fetchDiscovery}
                discTab={discTab}
                setDiscTab={setDiscTab}
                discOllama={discOllama}
                discOpenRouter={discOpenRouter}
                quickAddModel={quickAddModel}
              />
            </Suspense>
          )}

          {/* ── STATUS PAGE ── */}
          {page === "status" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <StatusPage
                t={t}
                health={health}
                hwLoading={hwLoading}
                fetchHardware={fetchHardware}
                fetchFitModels={fetchFitModels}
                hwStatus={hwStatus}
                opsStats={opsStats}
                opsAlerts={opsAlerts}
                opsLoading={opsLoading}
                fetchOpsData={fetchOpsData}
                resetOpsData={resetOpsData}
                opsResetting={opsResetting}
                unloadOllamaModel={unloadOllamaModel}
                fitLoading={fitLoading}
                fitModels={fitModels}
                quickAddModel={quickAddModel}
                hwProcOpen={hwProcOpen}
                setHwProcOpen={setHwProcOpen}
                fetchProcesses={fetchProcesses}
                hwProcLoading={hwProcLoading}
                hwProcesses={hwProcesses}
                continueYaml={continueYaml}
                toast={toast}
              />
            </Suspense>
          )}

          {/* ── COMPARE PAGE ── */}
          {page === "compare" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <ComparePage
                t={t}
                compareHistory={compareHistory}
                compareHistIdx={compareHistIdx}
                setCompareHistIdx={setCompareHistIdx}
                compareData={compareData}
                compareSortBy={compareSortBy}
                setCompareSortBy={setCompareSortBy}
                compareDiffMode={compareDiffMode}
                setCompareDiffMode={setCompareDiffMode}
                compareDiffLevel={compareDiffLevel}
                setCompareDiffLevel={setCompareDiffLevel}
                comparePinnedIdx={comparePinnedIdx}
                setComparePinnedIdx={setComparePinnedIdx}
                compareAutoRefresh={compareAutoRefresh}
                setCompareAutoRefresh={setCompareAutoRefresh}
                clearCompareHistory={clearCompareHistory}
                compareExportDone={compareExportDone}
                setCompareExportDone={setCompareExportDone}
                fetchCompare={fetchCompare}
                compareLoading={compareLoading}
                compareTemplates={compareTemplates}
                setComparePrompt={setComparePrompt}
                deleteTemplate={deleteTemplate}
                comparePrompt={comparePrompt}
                compareShowTemps={compareShowTemps}
                setCompareShowTemps={setCompareShowTemps}
                models={models}
                compareModelTemps={compareModelTemps}
                setCompareModelTemps={setCompareModelTemps}
                prefs={prefs}
                saveTemplate={saveTemplate}
                streamCompare={streamCompare}
                compareRunning={compareRunning}
                compareStreamSlots={compareStreamSlots}
                recordCopy={recordCopy}
                toast={toast}
                compareExpandIdx={compareExpandIdx}
                setCompareExpandIdx={setCompareExpandIdx}
                CompareCard={CompareCard}
                computeSentenceDiff={computeSentenceDiff}
                computeWordDiff={computeWordDiff}
                computeJaccard={computeJaccard}
                COMPARE_COLORS={COMPARE_COLORS}
              />
            </Suspense>
          )}

          {/* ── CONFIG PAGE ── */}
          {page === "config" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <ConfigPage
                t={t}
                prefs={prefs}
                health={health}
                updatePrefs={updatePrefs}
                toast={toast}
                setPrefs={setPrefs}
                getTempHint={getTempHint}
                MEMORY_MAX_CHARS={MEMORY_MAX_CHARS}
                ragStatus={ragStatus}
                setShowRagWarning={setShowRagWarning}
                ragIndexing={ragIndexing}
                triggerRagIndex={triggerRagIndex}
                ragAdvanced={ragAdvanced}
                setRagAdvanced={setRagAdvanced}
                clearRagIndex={clearRagIndex}
                resetStats={resetStats}
                stats={stats}
                models={models}
                active={active}
                inferIsFree={inferIsFree}
                getProviderClass={getProviderClass}
                FreeRoutePanel={FreeRoutePanel}
                fetchAll={fetchAll}
                budgetInfo={budgetInfo}
                cacheStats={cacheStats}
                fetchCacheStats={fetchCacheStats}
                API={API}
                setPage={setPage}
              />
            </Suspense>
          )}

          {/* ── HISTORY PAGE ── */}
          {page === "history" && <>
            <h1 className="page-title">{t("history_title")}</h1>
            <p className="page-sub">{t("history_sub")}</p>
            <div style={{ display:"grid", gap:20 }}>

              {/* Search + controls */}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <input type="text" className="form-input" style={{ flex:1 }}
                  placeholder={t("history_search_ph")}
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") fetchReqHistory(historySearch); }}
                />
                <button className="btn btn-primary" onClick={() => fetchReqHistory(historySearch)}>
                  🔍 Search
                </button>
                <button className="btn btn-ghost" onClick={() => { setHistorySearch(""); fetchReqHistory(""); }}>
                  Reset
                </button>
                <button className="btn btn-danger btn-sm" style={{ marginLeft:"auto" }}
                  onClick={async () => {
                    if (!confirm(t("history_clear_confirm"))) return;
                    await fetch(`${API}/api/history`, { method:"DELETE" });
                    setReqHistory([]);
                    toast(t("history_clear") + " ✓", "success");
                  }}
                >{t("history_clear")}</button>
              </div>

              {/* Table */}
              {historyLoading
                ? <div className="empty" style={{ padding:32 }}>Loading…</div>
                : reqHistory.length === 0
                  ? <div className="empty" style={{ padding:32 }}>{t("history_empty")}</div>
                  : <div className="card" style={{ padding:0, overflow:"hidden" }}>
                      <table className="stats-table" style={{ width:"100%", tableLayout:"fixed" }}>
                        <thead>
                          <tr>
                            <th style={{ width:"16%" }}>{t("history_date")}</th>
                            <th style={{ width:"14%" }}>{t("history_model_col")}</th>
                            <th style={{ width:"36%" }}>{t("history_prompt_col")}</th>
                            <th style={{ width:"9%", textAlign:"right" }}>{t("history_tokens_col")}</th>
                            <th style={{ width:"9%", textAlign:"right" }}>{t("history_cost_col")}</th>
                            <th style={{ width:"10%", textAlign:"center" }}>{t("history_conf_col")}</th>
                            <th style={{ width:"6%", textAlign:"center" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {reqHistory.map(entry => {
                            const lastUser = [...(entry.messages || [])].reverse().find(m => m.role === "user");
                            const prompt   = lastUser?.content || "";
                            const confLabel = entry.confidence_label || "";
                            const confColor = confLabel === "high" ? "var(--green)" : confLabel === "medium" ? "var(--yellow)" : confLabel === "low" ? "#f97316" : confLabel === "very_low" ? "var(--red)" : "var(--text2)";
                            return (
                              <tr key={entry.id}>
                                <td style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>
                                  {new Date(entry.timestamp * 1000).toLocaleString()}
                                </td>
                                <td style={{ fontFamily:"var(--mono)", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {entry.model_id}
                                  {entry.cached && <span style={{ marginLeft:4, fontSize:9, color:"var(--accent)", background:"#0a1a2a", border:"1px solid #1a3a5a", borderRadius:4, padding:"1px 5px" }}>⚡ cached</span>}
                                </td>
                                <td style={{ fontFamily:"var(--mono)", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--text2)" }}
                                  title={prompt}>
                                  {prompt.slice(0, 120)}
                                </td>
                                <td className="num" style={{ fontSize:10 }}>{entry.tokens ?? 0}</td>
                                <td className="num" style={{ fontSize:10 }}>{entry.cost_usd > 0 ? `$${entry.cost_usd.toFixed(5)}` : "free"}</td>
                                <td style={{ textAlign:"center" }}>
                                  {confLabel && (
                                    <span style={{ fontFamily:"var(--mono)", fontSize:9, color:confColor, background:"#0a0a0a", border:`1px solid ${confColor}`, borderRadius:4, padding:"1px 5px" }}>
                                      {confLabel}
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign:"center" }}>
                                  <button className="btn btn-ghost btn-sm"
                                    style={{ fontSize:10, padding:"2px 8px" }}
                                    disabled={replayLoading === entry.id}
                                    onClick={async () => {
                                      setReplayLoading(entry.id);
                                      try {
                                        const res = await fetch(`${API}/api/history/${entry.id}/replay`, { method:"POST" });
                                        if (res.ok) {
                                          const data = await res.json();
                                          toast(t("history_replay_done"), "success");
                                          // Navigate to history to refresh
                                          fetchReqHistory(historySearch);
                                        } else {
                                          toast("Replay failed", "error");
                                        }
                                      } catch { toast("Replay failed", "error"); }
                                      finally { setReplayLoading(null); }
                                    }}
                                  >
                                    {replayLoading === entry.id ? t("history_replaying") : t("history_replay")}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
              }
            </div>
          </>}

          {/* ── ADD MODEL PAGE ── */}
          {page === "add" && <>
            <h1 className="page-title">{t("add_title")}</h1>
            <p className="page-sub">{t("add_sub")}</p>
            <AddModelForm onAdd={addModel} t={t} />
          </>}

          {/* ── STATS PAGE ── */}
          {page === "stats" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <StatsPage
                t={t}
                statsData={statsData}
                models={models}
                onReset={async () => {
                  await fetch(`${API}/api/stats`, { method:"DELETE" });
                  setStatsData({});
                }}
              />
            </Suspense>
          )}

          {/* ── BENCH PAGE ── */}
          {page === "bench" && (
            <BenchmarkPage
              t={t}
              activeModels={active}
            />
          )}

          {/* ── CHAT PAGE ── */}
          {page === "chat" && (
            <Suspense fallback={<div className="empty">{t("hw_loading")}</div>}>
              <ChatPage
                t={t}
                activeModels={active}
              />
            </Suspense>
          )}

          {/* ── HELP PAGE ── */}
          {page === "help" && <HelpPage t={t} setPage={setPage} />}

        </main>
      </div>

      <div className="toast-container">
        {toasts.map(x => <div key={x.id} className={`toast ${x.type}`}>{x.msg}</div>)}
      </div>

      {/* Benchmark-on-activate modal */}
      {showBenchModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }}>
          <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, padding:32, maxWidth:400, width:"90%", boxShadow:"0 16px 64px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏆</div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>{t("bench_modal_title")}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--accent)", marginBottom:8 }}>{benchModalModel}</div>
            <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", lineHeight:1.8, marginBottom:24 }}>
              {t("bench_modal_body")}
            </p>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => {
                setShowBenchModal(false);
                setPage("bench");
              }}>{t("bench_modal_go")}</button>
              <button className="btn btn-ghost" onClick={() => setShowBenchModal(false)}>{t("bench_modal_skip")}</button>
            </div>
          </div>
        </div>
      )}

      {/* RAG first-enable warning modal */}
      {showRagWarning && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }}>
          <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, padding:32, maxWidth:420, width:"90%", boxShadow:"0 16px 64px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize:32, marginBottom:16 }}>🧠</div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:12 }}>{t("rag_warning_title")}</div>
            <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", lineHeight:1.8, marginBottom:24 }}>
              {t("rag_warning_body")}
            </p>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => {
                updatePrefs({ rag_enabled: true });
                setShowRagWarning(false);
              }}>{t("rag_warning_confirm")}</button>
              <button className="btn btn-ghost" onClick={() => setShowRagWarning(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModelCard({ model, t, stats, health, onToggle, onSaveKey, onDelete, onSaveNotes }) {
  const [keyInput,  setKeyInput]  = useState("");
  const [showKey,   setShowKey]   = useState(false);
  const [testState, setTestState] = useState(null); // null | "testing" | {ok, latency_ms, error}
  const [showNote,  setShowNote]  = useState(false);
  const [noteInput, setNoteInput] = useState(model.notes || "");
  const isFree   = inferIsFree(model.provider, model.base_url);
  const needsKey = !isFree;

  async function handleTest() {
    setTestState("testing");
    try {
      const res = await fetch(`${API}/api/model-test`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model_id: model.id }),
      });
      setTestState(await res.json());
    } catch { setTestState({ ok:false, error:"Network error" }); }
  }

  return (
    <div className={`model-card ${model.active?"active":""}`}>
      <div className="model-header">
        <div>
          <div className="model-name">{model.name}</div>
          <div className="model-id">{model.id}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <span className={`provider-badge ${getProviderClass(model.provider)}`}>{model.provider}</span>
          {health && (
            <span style={{
              fontFamily:"var(--mono)", fontSize:10, fontWeight:600,
              color: health.ok ? "var(--green)" : "var(--red)",
              background: health.ok ? "rgba(80,200,120,.12)" : "rgba(220,80,80,.12)",
              border: `1px solid ${health.ok ? "var(--green)" : "var(--red)"}`,
              borderRadius:4, padding:"2px 6px", lineHeight:1.4,
            }}>
              {health.ok ? `✅ ${health.latency_ms}ms` : "❌ timeout"}
            </span>
          )}
        </div>
      </div>

      {/* Notes: inline edit */}
      {showNote
        ? <div style={{ margin:"8px 0", display:"flex", flexDirection:"column", gap:6 }}>
            <textarea className="key-input" rows={3}
              placeholder={t("model_note_ph")}
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              style={{ resize:"vertical", fontFamily:"var(--mono)", fontSize:11, minHeight:56, width:"100%", boxSizing:"border-box" }}
            />
            <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setShowNote(false); setNoteInput(model.notes||""); }}>✕</button>
              <button className="btn btn-primary btn-sm"
                onClick={() => { onSaveNotes?.(noteInput.trim()); setShowNote(false); }}>
                {t("model_note_save")}
              </button>
            </div>
          </div>
        : <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, margin:"6px 0 2px" }}>
            {model.notes
              ? <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", lineHeight:1.5, flex:1 }}>{model.notes}</div>
              : <div style={{ flex:1 }} />
            }
            <button className="btn btn-ghost btn-sm"
              onClick={() => setShowNote(true)}
              style={{ opacity:0.6, fontSize:10, flexShrink:0 }}>
              ✎ {t("model_note_edit")}
            </button>
          </div>
      }

      <div className="model-footer">
        <span className={`free-badge ${isFree?"free":"paid"}`}>{isFree?t("free_badge"):t("paid_badge")}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
            {model.active ? t("active") : t("inactive")}
          </span>
          <label className="toggle">
            <input type="checkbox" checked={model.active} onChange={onToggle} />
            <span className="toggle-track" />
          </label>
        </div>
      </div>

      {/* Usage stats inline */}
      {stats && (stats.requests > 0 || stats.tokens > 0) && (
        <div className="model-stats">
          <div className="model-stat-item">
            <span>{stats.requests.toLocaleString()}</span> req
          </div>
          <div className="model-stat-item">
            <span>{stats.tokens.toLocaleString()}</span> tokens
          </div>
        </div>
      )}

      {needsKey && <>
        <hr className="divider" />
        {model.api_key
          ? <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--green)" }}>
                ✓ {showKey ? model.api_key : maskKey(model.api_key)}
              </span>
              <div style={{ display:"flex", gap:6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowKey(!showKey)}>
                  {showKey ? t("hide_key") : t("show_key")}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setKeyInput("")}>
                  {t("change_key")}
                </button>
              </div>
            </div>
          : <div className="key-row">
              <input className="key-input" type="password"
                placeholder={t("key_placeholder")} value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && onSaveKey(keyInput)}
              />
              <button className="btn btn-primary btn-sm" onClick={() => onSaveKey(keyInput)}>
                {t("save_key")}
              </button>
            </div>
        }
        {/* Test connection button — only when key is set */}
        {model.api_key && (
          <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <button className="btn btn-ghost btn-sm"
              onClick={handleTest}
              disabled={testState === "testing"}
              style={{ fontFamily:"var(--mono)", fontSize:11 }}>
              {testState === "testing" ? t("model_test_testing") : `🔌 ${t("model_test_btn")}`}
            </button>
            {testState && testState !== "testing" && (
              <span style={{ fontFamily:"var(--mono)", fontSize:11,
                color: testState.ok ? "var(--green)" : "var(--red)" }}>
                {testState.ok
                  ? `✓ ${testState.latency_ms}ms`
                  : `✗ ${(testState.error || "Failed").slice(0, 70)}`}
              </span>
            )}
          </div>
        )}
      </>}
      <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>{t("delete_btn")}</button>
      </div>
    </div>
  );
}

// ── Benchmark suite definitions ──────────────────────────────────────────
const BENCH_SUITES = {
  speed:     { icon:"⚡", key:"speed",     prompts:[
    { id:"sp1", label:"Hello",  text:"Say hello in one sentence." },
    { id:"sp2", label:"Count",  text:"Count from 1 to 10, one number per line." },
    { id:"sp3", label:"Colors", text:"List exactly 5 colors, one per line." },
  ]},
  coding:    { icon:"💻", key:"coding",    prompts:[
    { id:"co1", label:"FizzBuzz",   text:"Write a Python FizzBuzz for 1 to 20. Return only the code, no explanation.",
      check: (r) => r.includes("FizzBuzz") && r.includes("Fizz") && r.includes("Buzz") },
    { id:"co2", label:"Palindrome", text:"Write a Python function is_palindrome(s) returning True or False. Code only.",
      check: (r) => r.includes("is_palindrome") && (r.includes("True") || r.includes("true")) },
    { id:"co3", label:"Fibonacci",  text:"Write a Python function fib(n) returning the nth Fibonacci number. Code only.",
      check: (r) => r.includes("fib") && r.includes("return") },
  ]},
  reasoning: { icon:"🧠", key:"reasoning", prompts:[
    { id:"re1", label:"Syllogism", text:"All bloops are razzles. All razzles are lazzles. Are all bloops lazzles? Answer Yes or No and explain in one sentence.",
      check: (r) => /\byes\b/i.test(r) },
    { id:"re2", label:"Math",      text:"Calculate: (17 × 23) + (456 / 8). Show your working.",
      check: (r) => r.includes("448") },
    { id:"re3", label:"Sequence",  text:"What comes next: 2, 4, 8, 16, 32, ___? Give the answer and explain in one sentence.",
      check: (r) => r.includes("64") },
  ]},
  creative:  { icon:"🎨", key:"creative",  prompts:[
    { id:"cr1", label:"Haiku",    text:"Write a haiku about artificial intelligence." },
    { id:"cr2", label:"Metaphor", text:"Explain neural networks using a cooking metaphor in exactly 2 sentences." },
    { id:"cr3", label:"Story",    text:"Write a 2-sentence story about a robot discovering music." },
  ]},
};

function tryLS(key, def) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? def; } catch { return def; } }
function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ── Free Route Panel ──────────────────────────────────────────────────────────
function FreeRoutePanel({ t, toast, onModelsChanged }) {
  const [apiKey,    setApiKey]    = useState("");
  const [mode,      setMode]      = useState("add");
  const [loading,   setLoading]   = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [testing,   setTesting]   = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // null | "ok" | "error"
  const [status,    setStatus]    = useState(null);  // free-route status from server

  // Load current status on mount
  useState(() => {
    fetch("/api/free-route/status").then(r => r.json()).then(s => {
      if (s.enabled) setStatus(s);
    }).catch(() => {});
  });

  async function testKey() {
    if (!apiKey.trim()) return;
    setTesting(true);
    try {
      const r = await fetch("/api/free-route/test-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim(), mode }),
      });
      const d = await r.json();
      setKeyStatus(d.ok ? "ok" : "error");
    } catch { setKeyStatus("error"); }
    setTesting(false);
  }

  async function setup() {
    if (!apiKey.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/free-route/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim(), mode }),
      });
      const d = await r.json();
      if (!r.ok) { toast(d.detail || "Setup failed", "error"); return; }
      toast(`✅ Free Route active — ${d.active_model_ids?.length || 0} ${t("free_route_active_count")}`, "success");
      const newStatus = await fetch("/api/free-route/status").then(r2 => r2.json());
      setStatus(newStatus.enabled ? newStatus : null);
      onModelsChanged?.();
    } catch (e) { toast(String(e), "error"); }
    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/free-route/refresh", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { toast(d.detail || "Refresh failed", "error"); return; }
      toast(`✅ ${d.active_model_ids?.length || 0} ${t("free_route_active_count")}`, "success");
      const newStatus = await fetch("/api/free-route/status").then(r2 => r2.json());
      setStatus(newStatus.enabled ? newStatus : null);
      onModelsChanged?.();
    } catch (e) { toast(String(e), "error"); }
    setRefreshing(false);
  }

  async function remove() {
    if (!confirm("Remove Free Route and its models?")) return;
    await fetch("/api/free-route", { method: "DELETE" });
    setStatus(null);
    toast("Free Route removed", "info");
    onModelsChanged?.();
  }

  return (
    <div className="card">
      <div className="card-title">{t("free_route_label")}</div>
      <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:14, lineHeight:1.7 }}>
        {t("free_route_sub")}
      </p>
      <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:14 }}>
        {t("free_route_get_key")} <a href="https://openrouter.ai" target="_blank" rel="noreferrer" style={{ color:"var(--accent)" }}>openrouter.ai</a>
      </p>

      {/* API Key input */}
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <input
          className="input-field"
          style={{ flex:1, fontFamily:"var(--mono)", fontSize:12 }}
          type="password"
          placeholder={t("free_route_key_ph")}
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setKeyStatus(null); }}
        />
        <button className="btn btn-ghost btn-sm" onClick={testKey} disabled={testing || !apiKey.trim()}>
          {testing ? "…" : t("free_route_test")}
        </button>
      </div>
      {keyStatus === "ok"    && <p style={{ color:"var(--green)", fontFamily:"var(--mono)", fontSize:11, marginBottom:8 }}>{t("free_route_key_ok")}</p>}
      {keyStatus === "error" && <p style={{ color:"var(--red)",   fontFamily:"var(--mono)", fontSize:11, marginBottom:8 }}>{t("free_route_key_error")}</p>}

      {/* Mode radio */}
      <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:6 }}>{t("free_route_mode_label")}</p>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
        {[["add", t("free_route_mode_add")], ["replace", t("free_route_mode_replace")]].map(([val, label]) => (
          <label key={val} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13 }}>
            <input type="radio" name="fr_mode" value={val} checked={mode === val} onChange={() => setMode(val)} />
            {label}
          </label>
        ))}
      </div>

      {/* Setup button */}
      <button className="btn btn-primary" onClick={setup} disabled={loading || !apiKey.trim()} style={{ marginBottom:16 }}>
        {loading ? t("free_route_setting_up") : t("free_route_setup")}
      </button>

      {/* Status after setup */}
      {status?.enabled && (
        <div style={{ padding:"12px 16px", background:"#0a1a0f", border:"1px solid var(--green)", borderRadius:8, marginTop:4 }}>
          <p style={{ color:"var(--green)", fontFamily:"var(--mono)", fontSize:12, marginBottom:8 }}>
            {t("free_route_status_ok")} · {status.active_model_ids?.length || 0} {t("free_route_active_count")} · {status.total_free_found || 0} {t("free_route_found")}
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={refreshing}>
              {refreshing ? t("free_route_refreshing") : t("free_route_refresh")}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={remove} style={{ color:"var(--red)" }}>
              {t("free_route_remove")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BENCH_COLORS = ["#7c3aed","#2563eb","#16a34a","#d97706","#dc2626","#db2777","#0891b2","#64748b"];

function BenchmarkPage({ t, activeModels }) {
  const [suite,         setSuite]        = useState("speed");
  const [running,       setRunning]      = useState(false);
  const [progress,      setProgress]     = useState({ n:0, total:0, label:"" });
  const [results,       setResults]      = useState(() => tryLS("airvo_bench_results", null));
  const [history,       setHistory]      = useState(() => tryLS("airvo_bench_history", []));
  const [viewMode,      setViewMode]     = useState("bars");
  const [compareMode,   setCompareMode]  = useState(false);
  const [cmpIdxA,       setCmpIdxA]      = useState(0);
  const [cmpIdxB,       setCmpIdxB]      = useState(1);
  const [customPrompts, setCustomPrompts] = useState({});
  const [activeSuiteName, setActiveSuiteName] = useState("");
  const [suitesLoaded, setSuitesLoaded] = useState(false);

  // Load custom suites from backend on mount
  useEffect(() => {
    fetch(`${API}/api/bench/suites`)
      .then(r => r.json())
      .then(data => {
        // migrate old localStorage data if backend is empty
        const legacy = tryLS("airvo_bench_custom", null);
        const lsNew  = tryLS("airvo_bench_custom_suites", null);
        if (Object.keys(data).length === 0 && (lsNew || legacy)) {
          const migrated = lsNew || (Array.isArray(legacy) && legacy.length ? { "My Suite": legacy } : {});
          setCustomPrompts(migrated);
          setActiveSuiteName(Object.keys(migrated)[0] || "");
          // push migration to backend
          fetch(`${API}/api/bench/suites`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(migrated) }).catch(()=>{});
          localStorage.removeItem("airvo_bench_custom");
          localStorage.removeItem("airvo_bench_custom_suites");
        } else {
          setCustomPrompts(data);
          setActiveSuiteName(Object.keys(data)[0] || "");
        }
      })
      .catch(() => {
        // fallback to localStorage if server unreachable
        const legacy = tryLS("airvo_bench_custom", null);
        const lsNew  = tryLS("airvo_bench_custom_suites", null);
        const data   = lsNew || (Array.isArray(legacy) && legacy.length ? { "My Suite": legacy } : {});
        setCustomPrompts(data);
        setActiveSuiteName(Object.keys(data)[0] || "");
      })
      .finally(() => setSuitesLoaded(true));
  }, []);
  const [newSuiteName,  setNewSuiteName]  = useState("");
  const [showNewSuite,  setShowNewSuite]  = useState(false);
  const [runNote,       setRunNote]       = useState("");
  const [addLabel,      setAddLabel]     = useState("");
  const [addText,       setAddText]      = useState("");
  const [showAddForm,   setShowAddForm]  = useState(false);
  const [copied,        setCopied]       = useState(false);
  const [previewKey,    setPreviewKey]   = useState(null);

  const activeCustomPrompts = (activeSuiteName && customPrompts[activeSuiteName]) || [];
  const suiteDef = suite === "custom"
    ? { icon:"✏️", key:"custom", prompts: activeCustomPrompts }
    : BENCH_SUITES[suite];

  async function runBenchmark() {
    if (activeModels.length < 2 || running || !suiteDef?.prompts?.length) return;
    setRunning(true);
    const prompts = suiteDef.prompts;
    const runResults = [];
    for (let i = 0; i < prompts.length; i++) {
      const p = prompts[i];
      setProgress({ n: i + 1, total: prompts.length, label: p.label });
      try {
        const resp = await fetch(`${API}/api/compare/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p.text, max_tokens: 512, temperature: suite === "creative" ? 0.8 : 0.1 }),
        });
        const data = await resp.json();
        runResults.push({ prompt: p, modelResults: data.data?.results || [] });
      } catch (e) {
        runResults.push({ prompt: p, modelResults: [], error: String(e) });
      }
    }
    const run = { id: Date.now(), suite, suiteName: suite === "custom" ? activeSuiteName : suite, timestamp: Date.now(), note: runNote.trim() || null, results: runResults };
    setResults(run);
    const newHist = [run, ...history].slice(0, 20);
    setHistory(newHist);
    saveLS("airvo_bench_results", run);
    saveLS("airvo_bench_history", newHist);
    setRunning(false);
    setProgress({ n:0, total:0, label:"" });
  }

  function clearHistory() {
    setHistory([]); setResults(null);
    localStorage.removeItem("airvo_bench_results");
    localStorage.removeItem("airvo_bench_history");
  }

  function saveCustomSuites(next) {
    setCustomPrompts(next);
    fetch(`${API}/api/bench/suites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => saveLS("airvo_bench_custom_suites", next)); // fallback
  }

  function addCustomSuite() {
    const name = newSuiteName.trim();
    if (!name) return;
    const next = { ...customPrompts, [name]: customPrompts[name] || [] };
    saveCustomSuites(next);
    setActiveSuiteName(name);
    setNewSuiteName(""); setShowNewSuite(false);
  }

  function deleteCustomSuite() {
    if (!activeSuiteName) return;
    const next = { ...customPrompts };
    delete next[activeSuiteName];
    saveCustomSuites(next);
    setActiveSuiteName(Object.keys(next)[0] || "");
  }

  function addCustomPrompt() {
    if (!addLabel.trim() || !addText.trim() || !activeSuiteName) return;
    const p = { id:`cu${Date.now()}`, label:addLabel.trim(), text:addText.trim() };
    const next = { ...customPrompts, [activeSuiteName]: [...(customPrompts[activeSuiteName]||[]), p] };
    saveCustomSuites(next);
    setAddLabel(""); setAddText(""); setShowAddForm(false);
  }

  function deleteCustomPrompt(id) {
    if (!activeSuiteName) return;
    const next = { ...customPrompts, [activeSuiteName]: (customPrompts[activeSuiteName]||[]).filter(p => p.id !== id) };
    saveCustomSuites(next);
  }

  // ── Weighted leaderboard: speed 40% + tokens 30% + consistency 30% ──
  function computeLeaderboard(run) {
    if (!run?.results?.length) return [];
    const allModels = new Set();
    run.results.forEach(({ modelResults }) => (modelResults||[]).forEach(r => allModels.add(r.model)));
    const sc = {};
    allModels.forEach(id => {
      const nr = run.results[0]?.modelResults?.find(r => r.model === id);
      sc[id] = { name:nr?.name||id, totE:0, totT:0, totTS:0, n:0, errors:0, speedPts:0, tokenPts:0, correct:0, checkable:0 };
    });
    const nP = run.results.length;
    // get the suite's prompt list for check functions
    const suitePrompts = BENCH_SUITES[run.suite]?.prompts || [];
    for (let pi = 0; pi < run.results.length; pi++) {
      const { modelResults } = run.results[pi];
      const prompt = suitePrompts[pi];
      if (!modelResults?.length) continue;
      modelResults.forEach(r => { if (r.error && sc[r.model]) sc[r.model].errors++; });
      // accuracy check
      if (prompt?.check) {
        modelResults.forEach(r => {
          if (!r.error && sc[r.model]) {
            sc[r.model].checkable++;
            try { if (prompt.check(r.content || "")) sc[r.model].correct++; } catch {}
          }
        });
      }
      const valid   = modelResults.filter(r => !r.error && r.elapsed_s);
      const sortedE = [...valid].sort((a,b) => a.elapsed_s - b.elapsed_s);
      const sortedT = [...valid].sort((a,b) => (b.tokens||0) - (a.tokens||0));
      sortedE.forEach((r, rank) => {
        sc[r.model].speedPts += valid.length - rank;
        sc[r.model].totE     += r.elapsed_s;
        sc[r.model].totTS    += r.tokens / r.elapsed_s;
        sc[r.model].n        += 1;
      });
      sortedT.forEach((r, rank) => {
        sc[r.model].tokenPts += valid.length - rank;
        sc[r.model].totT     += r.tokens || 0;
      });
    }
    const maxPts = nP * allModels.size || 1;
    return Object.entries(sc).map(([id, s]) => {
      const consistency = s.n > 0 ? 1 - (s.errors / nP) : 0;
      const accPct      = s.checkable > 0 ? s.correct / s.checkable : null;
      const accW        = accPct !== null ? accPct * 0.25 : 0;
      const accBase     = accPct !== null ? 0.25 : 0;
      const denom       = 0.35 + 0.20 + 0.20 + accBase || 1;
      const score = Math.round(
        (((s.speedPts/maxPts)*0.35 + (s.tokenPts/maxPts)*0.20 + consistency*0.20 + accW) / denom) * 100
      );
      return {
        id, name:s.name, score, errors:s.errors,
        avgE:  s.n ? (s.totE/s.n).toFixed(2) : "—",
        avgT:  s.n ? Math.round(s.totT/s.n)  : 0,
        avgTS: s.n ? Math.round(s.totTS/s.n) : 0,
        accuracy: accPct !== null ? `${s.correct}/${s.checkable}` : null,
        accPct,
      };
    }).sort((a,b) => b.score - a.score);
  }

  // ── Sparklines: last N runs of same suite → avgE per model ──
  function modelSparkline(modelId) {
    return history.filter(h => h.suite === suite).slice(0,7).reverse().map(run => {
      const vals = [];
      for (const { modelResults } of run.results) {
        const r = (modelResults||[]).find(r => r.model === modelId);
        if (r && !r.error && r.elapsed_s) vals.push(r.elapsed_s);
      }
      return vals.length ? vals.reduce((a,b) => a+b,0)/vals.length : null;
    });
  }

  // ── Export helpers ──
  function exportMD() {
    if (!results) return;
    const lb = computeLeaderboard(results);
    let md = `# Airvo Benchmark — ${suite} (${new Date(results.timestamp).toLocaleString()})\n\n`;
    md += `## 🏆 Leaderboard\n\n| Rank | Model | Score | Avg ⚡ | Avg Tok | Avg Tok/s | Errors |\n|------|-------|-------|--------|---------|-----------|--------|\n`;
    lb.forEach((m,i) => { md += `| ${["🥇","🥈","🥉"][i]||`#${i+1}`} | ${m.name} | ${m.score} | ${m.avgE}s | ${m.avgT} | ${m.avgTS} | ${m.errors} |\n`; });
    md += `\n## 📋 Results per Prompt\n\n`;
    results.results.forEach(({ prompt, modelResults, error }) => {
      md += `### ${prompt.label}\n> ${prompt.text}\n\n`;
      if (error) { md += `⚠ ${error}\n\n`; return; }
      md += `| Model | Elapsed | Tokens | Tok/s |\n|-------|---------|--------|-------|\n`;
      [...modelResults].sort((a,b)=>(a.elapsed_s||99)-(b.elapsed_s||99)).forEach(r => {
        const ts = r.elapsed_s > 0 ? Math.round(r.tokens/r.elapsed_s) : "—";
        md += `| ${r.name||r.model} | ${r.elapsed_s ? r.elapsed_s+"s":"—"} | ${r.tokens||"—"} | ${ts} |\n`;
      });
      md += "\n";
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type:"text/markdown" }));
    a.download = `airvo-bench-${suite}-${Date.now()}.md`; a.click();
  }

  function exportCSV() {
    if (!results) return;
    let csv = "Prompt,Model,Elapsed (s),Tokens,Tok/s,Error\n";
    results.results.forEach(({ prompt, modelResults, error }) => {
      if (error) { csv += `"${prompt.label}",,,,,"${error}"\n`; return; }
      [...modelResults].sort((a,b)=>(a.elapsed_s||99)-(b.elapsed_s||99)).forEach(r => {
        const ts = r.elapsed_s > 0 ? Math.round(r.tokens/r.elapsed_s) : "";
        csv += `"${prompt.label}","${r.name||r.model}",${r.elapsed_s||""},${r.tokens||""},${ts},"${r.error||""}"\n`;
      });
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = `airvo-bench-${suite}-${Date.now()}.csv`; a.click();
  }

  function copyJSON() {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  // ── Run comparison helpers ──
  const sameSuiteHistory = history.filter(h => h.suite === suite);
  function getAvgE(run, modelId) {
    let total=0, n=0;
    for (const { modelResults } of run.results) {
      const r = (modelResults||[]).find(r => r.model === modelId);
      if (r && !r.error && r.elapsed_s) { total += r.elapsed_s; n++; }
    }
    return n ? total/n : null;
  }
  const runA = sameSuiteHistory[cmpIdxA];
  const runB = sameSuiteHistory[cmpIdxB];
  const allCmpModels = runA && runB
    ? [...new Set([
        ...runA.results.flatMap(r => (r.modelResults||[]).map(m => m.model)),
        ...runB.results.flatMap(r => (r.modelResults||[]).map(m => m.model)),
      ])]
    : [];

  const leaderboard = computeLeaderboard(results?.suite === suite ? results : null);
  const medals      = ["🥇","🥈","🥉"];
  const maxAvgE     = leaderboard.length ? Math.max(...leaderboard.map(m => parseFloat(m.avgE)||0), 0.01) : 1;
  const maxAvgTS    = leaderboard.length ? Math.max(...leaderboard.map(m => m.avgTS||0), 1) : 1;
  const selectStyle = { background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--text1)", borderRadius:6, padding:"4px 8px", fontSize:12, fontFamily:"var(--mono)" };

  return (
    <div>
      <h1 className="page-title">{t("bench_title")}</h1>
      <p className="page-sub">{t("bench_sub")}</p>

      {/* Suite selector */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {[...Object.values(BENCH_SUITES), { icon:"✏️", key:"custom" }].map(s => (
          <button key={s.key} disabled={running}
            className={`btn ${suite === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSuite(s.key)}>
            {s.icon} {t(`bench_suite_${s.key}`)}
          </button>
        ))}
      </div>

      {/* Prompts preview / custom editor */}
      <div style={{ marginBottom:20, background:"var(--bg2)", borderRadius:12, border:"1px solid var(--border)", padding:"12px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>
            {suiteDef.icon} {t(`bench_suite_${suite}`)} · {suiteDef.prompts.length} prompts
          </div>
          {suite === "custom" && (
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              {Object.keys(customPrompts).length > 0 && (
                <select value={activeSuiteName} onChange={e => setActiveSuiteName(e.target.value)}
                  style={{ background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text1)", borderRadius:6, padding:"3px 8px", fontSize:12, fontFamily:"var(--mono)", cursor:"pointer" }}>
                  {Object.keys(customPrompts).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              {!showNewSuite
                ? <button className="btn btn-ghost btn-sm" onClick={() => setShowNewSuite(true)}>＋ {t("bench_suite_new")}</button>
                : <span style={{ display:"flex", gap:6 }}>
                    <input className="key-input" placeholder={t("bench_suite_name_ph")} value={newSuiteName} onChange={e => setNewSuiteName(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && addCustomSuite()}
                      style={{ fontFamily:"var(--mono)", fontSize:12, width:140 }} />
                    <button className="btn btn-primary btn-sm" onClick={addCustomSuite}>✓</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewSuite(false); setNewSuiteName(""); }}>✕</button>
                  </span>
              }
              {activeSuiteName && Object.keys(customPrompts).length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={deleteCustomSuite} title={t("bench_suite_delete")}>🗑</button>
              )}
              {activeSuiteName && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(!showAddForm)}>+ {t("bench_custom_add")}</button>
              )}
            </div>
          )}
        </div>

        {suite === "custom" && showAddForm && (
          <div style={{ padding:12, background:"var(--bg3)", borderRadius:8, marginBottom:12, display:"flex", flexDirection:"column", gap:8 }}>
            <input className="key-input" placeholder={t("bench_custom_label")} value={addLabel}
              onChange={e => setAddLabel(e.target.value)}
              style={{ fontFamily:"var(--mono)", fontSize:12 }} />
            <textarea placeholder={t("bench_custom_text")} value={addText}
              onChange={e => setAddText(e.target.value)}
              style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:6, padding:"8px 10px", color:"var(--text1)", fontFamily:"var(--mono)", fontSize:12, resize:"vertical", minHeight:60 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-primary btn-sm" onClick={addCustomPrompt}>+ {t("bench_custom_add")}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
          </div>
        )}

        {suite === "custom" && !activeSuiteName
          ? <div style={{ color:"var(--text2)", fontFamily:"var(--mono)", fontSize:12, padding:"8px 0" }}>
              {t("bench_suite_new")} → create your first suite
            </div>
          : suiteDef.prompts.length === 0
            ? <div style={{ color:"var(--text2)", fontFamily:"var(--mono)", fontSize:12, padding:"8px 0" }}>{t("bench_custom_empty")}</div>
            : suiteDef.prompts.map((p, i) => (
            <div key={p.id} style={{ display:"flex", gap:10, alignItems:"baseline", padding:"5px 0", borderBottom: i < suiteDef.prompts.length-1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", minWidth:16 }}>{i+1}.</span>
              <span style={{ fontWeight:700, fontSize:12, color:"var(--accent)", minWidth:82 }}>{p.label}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", flex:1, lineHeight:1.5 }}>{p.text}</span>
              {suite === "custom" && (
                <button className="btn btn-danger btn-sm" style={{ padding:"2px 7px", flexShrink:0 }}
                  onClick={() => deleteCustomPrompt(p.id)}>✕</button>
              )}
            </div>
          ))
        }
      </div>

      {/* Run controls */}
      {activeModels.length < 2 ? (
        <div style={{ padding:12, background:"rgba(255,80,80,0.08)", border:"1px solid var(--red)", borderRadius:8, color:"var(--red)", fontFamily:"var(--mono)", fontSize:12, marginBottom:20 }}>
          ⚠ {t("bench_no_active")}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", whiteSpace:"nowrap" }}>📝 {t("bench_run_note")}:</span>
            <input className="key-input" placeholder={t("bench_run_note_ph")} value={runNote}
              onChange={e => setRunNote(e.target.value)} disabled={running}
              style={{ fontFamily:"var(--mono)", fontSize:11, flex:1, maxWidth:420, opacity: running ? 0.5 : 1 }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <button className="btn btn-primary" onClick={runBenchmark}
              disabled={running || (suite === "custom" && activeCustomPrompts.length === 0)}
              style={{ minWidth:185 }}>
              {running
                ? `⏳ ${t("bench_running")} ${progress.n}/${progress.total}: ${progress.label}`
                : `▶ ${t("bench_run")}`}
            </button>
            {running && (
              <div style={{ flex:1, maxWidth:260, height:6, background:"var(--bg3)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(progress.n/progress.total)*100}%`, background:"var(--accent)", transition:"width 0.5s", borderRadius:3 }} />
              </div>
            )}
            {results?.suite === suite && !running && (
              <div style={{ display:"flex", gap:6, marginLeft:"auto", flexWrap:"wrap" }}>
                <button className="btn btn-ghost btn-sm" title={t("bench_view_bars")}
                  style={{ background: viewMode==="bars"?"var(--bg3)":undefined }}
                  onClick={() => setViewMode("bars")}>📊</button>
                <button className="btn btn-ghost btn-sm" title={t("bench_view_table")}
                  style={{ background: viewMode==="table"?"var(--bg3)":undefined }}
                  onClick={() => setViewMode("table")}>☰</button>
                <button className="btn btn-ghost btn-sm" onClick={exportMD} title={t("bench_export_md")}>📄 .md</button>
                <button className="btn btn-ghost btn-sm" onClick={exportCSV} title={t("bench_export_csv")}>📊 .csv</button>
                <button className="btn btn-ghost btn-sm" onClick={copyJSON}>{copied ? "✓" : "{}"} JSON</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results?.suite === suite && (
        <>
          {/* Leaderboard header + compare toggle */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--text1)", textTransform:"uppercase", letterSpacing:1 }}>
                🏆 {t("bench_leaderboard")}
              </div>
              {results.note && (
                <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", marginTop:3 }}>📝 {results.note}</div>
              )}
            </div>
            {sameSuiteHistory.length >= 2 && (
              <button className="btn btn-ghost btn-sm"
                style={{ background: compareMode ? "var(--bg3)" : undefined }}
                onClick={() => setCompareMode(!compareMode)}>
                🔁 {t("bench_compare_runs")}
              </button>
            )}
          </div>

          {/* Bar view */}
          {viewMode === "bars" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
              {leaderboard.map((m, i) => {
                const spark    = modelSparkline(m.id);
                const sparkMax = Math.max(...spark.filter(Boolean), 0.01);
                return (
                  <div key={m.id} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{medals[i] || `#${i+1}`}</span>
                      <span style={{ fontWeight:700, fontSize:13, color:"var(--text1)", flex:1 }}>{m.name}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:800, color:"var(--accent)" }}>{m.score}pts</span>
                      {m.errors > 0 && <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--red)" }}>⚠ {m.errors} err</span>}
                    </div>
                    {/* Elapsed bar */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", width:28 }}>⚡</span>
                      <div style={{ flex:1, height:8, background:"var(--bg3)", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min((parseFloat(m.avgE)||0)/maxAvgE*100,100)}%`, background:"var(--green)", borderRadius:4 }} />
                      </div>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--green)", width:44, textAlign:"right" }}>{m.avgE}s</span>
                    </div>
                    {/* Tok/s bar */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: spark.some(Boolean) ? 8 : 0 }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", width:28 }}>🚀</span>
                      <div style={{ flex:1, height:8, background:"var(--bg3)", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min((m.avgTS||0)/maxAvgTS*100,100)}%`, background:"var(--accent)", borderRadius:4 }} />
                      </div>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", width:44, textAlign:"right" }}>{m.avgTS} t/s</span>
                    </div>
                    {/* Accuracy badge */}
                    {m.accuracy && (
                      <div style={{ marginTop:5, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", width:28 }}>🎯</span>
                        <span style={{ fontFamily:"var(--mono)", fontSize:11,
                          color: m.accPct >= 0.7 ? "var(--green)" : m.accPct >= 0.4 ? "var(--yellow)" : "var(--red)"
                        }}>{m.accuracy} {t("bench_accuracy").toLowerCase()}</span>
                      </div>
                    )}
                    {/* Sparkline */}
                    {spark.some(Boolean) && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", width:28 }}>📈</span>
                        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:20 }} title="Avg elapsed — last runs">
                          {spark.map((v, si) => v !== null
                            ? <div key={si} title={`${v.toFixed(2)}s`}
                                style={{ width:6, height:`${Math.round((v/sparkMax)*20)}px`, minHeight:2, background:"var(--yellow)", borderRadius:1, opacity:0.6+si/spark.length*0.4 }} />
                            : <div key={si} style={{ width:6, height:2, background:"var(--bg3)", borderRadius:1 }} />
                          )}
                        </div>
                        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>trend</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table view */
            <table style={{ width:"100%", borderCollapse:"collapse", background:"var(--bg2)", borderRadius:10, overflow:"hidden", marginBottom:24 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid var(--border)" }}>
                  {["#","Model",t("bench_score"),"Avg ⚡","Avg 📝","Avg 🚀","⚠ Err",
                    ...(BENCH_SUITES[suite]?.prompts?.some(p => p.check) ? [t("bench_accuracy")] : [])
                  ].map((h,hi) => (
                    <th key={hi} style={{ textAlign: hi<2?"left":"right", padding:"8px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < leaderboard.length-1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding:"8px 14px", fontSize:16 }}>{medals[i]||`#${i+1}`}</td>
                    <td style={{ padding:"8px 14px", fontSize:12, fontWeight:600, color:"var(--text1)" }}>{m.name}</td>
                    <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12, fontWeight:800, color:"var(--accent)" }}>{m.score}</td>
                    <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--green)" }}>{m.avgE}s</td>
                    <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{m.avgT}</td>
                    <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--yellow)" }}>{m.avgTS}</td>
                    <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12, color:m.errors>0?"var(--red)":"var(--text2)" }}>{m.errors||"—"}</td>
                    {BENCH_SUITES[suite]?.prompts?.some(p => p.check) && (
                      <td style={{ textAlign:"right", padding:"8px 14px", fontFamily:"var(--mono)", fontSize:12,
                        color: m.accuracy ? (m.accPct >= 0.7 ? "var(--green)" : m.accPct >= 0.4 ? "var(--yellow)" : "var(--red)") : "var(--text2)"
                      }}>
                        {m.accuracy ?? "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Radar Chart */}
          {leaderboard.length >= 2 && (() => {
            const cx = 140, cy = 130, R = 90;
            const angles = [-Math.PI/2, 0, Math.PI/2, Math.PI];
            const axisLabels = [
              { x:140, y:22,  text:"⚡ Speed",  desc:"Faster avg response = higher score. Best model in this run = 100%." },
              { x:264, y:134, text:"🚀 Tok/s",  desc:"More tokens per second = higher score. Best model in this run = 100%." },
              { x:140, y:253, text:"🎯 Acc.",   desc:"Correct answers on checkable prompts (Coding/Reasoning). No validators = treated as 100%." },
              { x:16,  y:134, text:"✅ Cons.",  desc:"Consistency = 1 − (errors / prompts). 100% means zero failed calls." },
            ];
            const axisNames = ["Speed","Tok/s","Accuracy","Consistency"];
            const nP    = results?.results?.length || 1;
            const gridP = (r) => angles.map(a => `${cx+R*r*Math.cos(a)},${cy+R*r*Math.sin(a)}`).join(" ");
            return (
              <div style={{ marginBottom:24, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:800, fontSize:12, color:"var(--text1)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>
                  🕸 {t("bench_radar")}
                </div>
                <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:12, lineHeight:1.6 }}>
                  {t("bench_radar_desc")}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:24, alignItems:"center", justifyContent:"center" }}>
                  <svg width="280" height="268" viewBox="0 0 280 268" style={{ overflow:"visible" }}>
                    {[0.25,0.5,0.75,1].map(r => (
                      <polygon key={r} points={gridP(r)} fill="none" stroke="var(--border)" strokeWidth={r===1?"1.5":"1"} opacity={r===1?1:0.5} />
                    ))}
                    {angles.map((a,i) => (
                      <line key={i} x1={cx} y1={cy} x2={cx+R*Math.cos(a)} y2={cy+R*Math.sin(a)} stroke="var(--border)" strokeWidth="1" />
                    ))}
                    {[0.25,0.5,0.75].map(r => (
                      <text key={r} x={cx+4} y={cy-R*r-2} fontSize="8" fill="var(--text2)" fontFamily="var(--mono)" opacity="0.7">{Math.round(r*100)}%</text>
                    ))}
                    {axisLabels.map((l,i) => (
                      <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="10" fill="var(--text2)" fontFamily="var(--mono)" style={{ cursor:"help" }}>
                        <title>{l.desc}</title>
                        {l.text}
                      </text>
                    ))}
                    {leaderboard.map((m, mi) => {
                      const sv   = Math.max(0, 1 - (parseFloat(m.avgE)||0) / maxAvgE);
                      const tv   = Math.max(0, Math.min(1, (m.avgTS||0) / maxAvgTS));
                      const av   = m.accPct ?? 1;
                      const cv   = Math.max(0, 1 - (m.errors||0) / nP);
                      const col  = BENCH_COLORS[mi % BENCH_COLORS.length];
                      const vals = [sv,tv,av,cv];
                      const pts  = vals.map((v,i) => `${cx+v*R*Math.cos(angles[i])},${cy+v*R*Math.sin(angles[i])}`).join(" ");
                      return (
                        <g key={m.id}>
                          <polygon points={pts} fill={col+"28"} stroke={col} strokeWidth="2" opacity="0.9">
                            <title>{m.name} — Overall score: {m.score}pts</title>
                          </polygon>
                          {vals.map((v,ai) => (
                            <circle key={ai} cx={cx+v*R*Math.cos(angles[ai])} cy={cy+v*R*Math.sin(angles[ai])} r="4" fill={col} style={{ cursor:"crosshair" }}>
                              <title>{m.name} — {axisNames[ai]}: {Math.round(v*100)}%</title>
                            </circle>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {leaderboard.map((m, mi) => (
                      <div key={m.id} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <div style={{ width:14, height:14, borderRadius:4, background:BENCH_COLORS[mi % BENCH_COLORS.length], flexShrink:0, marginTop:1 }} />
                        <div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text1)", fontWeight:700 }}>{m.name}</div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", marginTop:2 }}>
                            {m.score}pts · ⚡{m.avgE}s · 🚀{m.avgTS}t/s{m.accuracy ? ` · 🎯${m.accuracy}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid var(--border)", fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", lineHeight:1.7 }}>
                      <div>⚡ Speed — avg response time</div>
                      <div>🚀 Tok/s — generation speed</div>
                      <div>🎯 Acc. — prompt accuracy</div>
                      <div>✅ Cons. — error-free rate</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Score History Line Chart */}
          {sameSuiteHistory.length >= 3 && (() => {
            const chartRuns = [...sameSuiteHistory].reverse().slice(-8);
            const modelIds  = leaderboard.map(m => m.id);
            const runScores = chartRuns.map(run => {
              const lb = computeLeaderboard(run);
              const s  = {};
              lb.forEach(m => { s[m.id] = m.score; });
              return s;
            });
            const W=360, H=130, pL=30, pR=10, pT=10, pB=28;
            const iW = W-pL-pR, iH = H-pT-pB;
            const xStep = chartRuns.length > 1 ? iW/(chartRuns.length-1) : iW;
            const yS = (v) => pT + iH - (v/100)*iH;
            return (
              <div style={{ marginBottom:24, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:800, fontSize:12, color:"var(--text1)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>
                  📈 {t("bench_score_history")}
                </div>
                <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:12, lineHeight:1.6 }}>
                  {t("bench_history_desc")}
                </div>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
                  {[0,25,50,75,100].map(v => (
                    <g key={v}>
                      <line x1={pL} y1={yS(v)} x2={pL+iW} y2={yS(v)} stroke="var(--border)" strokeWidth="1" />
                      <text x={pL-4} y={yS(v)+3} textAnchor="end" fontSize="8" fill="var(--text2)" fontFamily="var(--mono)">{v}</text>
                    </g>
                  ))}
                  {chartRuns.map((run,i) => (
                    <text key={run.id} x={pL+i*xStep} y={H-4} textAnchor="middle" fontSize="8" fill="var(--text2)" fontFamily="var(--mono)" style={{ cursor: run.note ? "help" : "default" }}>
                      <title>{new Date(run.timestamp).toLocaleDateString()}{run.note ? ` — ${run.note}` : ""}</title>
                      {new Date(run.timestamp).toLocaleDateString(undefined,{month:"numeric",day:"numeric"})}
                    </text>
                  ))}
                  {modelIds.map((mid,mi) => {
                    const mName = leaderboard.find(x => x.id === mid)?.name || mid;
                    const pts = chartRuns.map((_,i) => {
                      const s = runScores[i][mid];
                      return s !== undefined ? `${pL+i*xStep},${yS(s)}` : null;
                    }).filter(Boolean);
                    if (pts.length < 2) return null;
                    const col = BENCH_COLORS[mi % BENCH_COLORS.length];
                    return (
                      <g key={mid}>
                        <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round">
                          <title>{mName}</title>
                        </polyline>
                        {chartRuns.map((run,i) => {
                          const s = runScores[i][mid];
                          return s !== undefined ? (
                            <circle key={i} cx={pL+i*xStep} cy={yS(s)} r="4" fill={col} style={{ cursor:"crosshair" }}>
                              <title>{mName} — {new Date(run.timestamp).toLocaleDateString()}: {s}pts{run.note ? ` · 📝 ${run.note}` : ""}</title>
                            </circle>
                          ) : null;
                        })}
                      </g>
                    );
                  })}
                </svg>
                {/* Legend */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                  {leaderboard.map((m, mi) => (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <svg width="22" height="10" viewBox="0 0 22 10">
                        <line x1="0" y1="5" x2="22" y2="5" stroke={BENCH_COLORS[mi % BENCH_COLORS.length]} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="11" cy="5" r="3" fill={BENCH_COLORS[mi % BENCH_COLORS.length]} />
                      </svg>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text1)", fontWeight:600 }}>{m.name}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>{m.score}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Run A vs B comparison */}
          {compareMode && sameSuiteHistory.length >= 2 && (
            <div style={{ marginBottom:24, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:16 }}>
              <div style={{ fontWeight:800, fontSize:12, color:"var(--text1)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
                🔁 {t("bench_compare_runs")}
              </div>
              <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{t("bench_run_a")}:</span>
                  <select value={cmpIdxA} onChange={e => setCmpIdxA(+e.target.value)} style={selectStyle}>
                    {sameSuiteHistory.map((h,i) => <option key={h.id} value={i}>{new Date(h.timestamp).toLocaleString()}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{t("bench_run_b")}:</span>
                  <select value={cmpIdxB} onChange={e => setCmpIdxB(+e.target.value)} style={selectStyle}>
                    {sameSuiteHistory.map((h,i) => <option key={h.id} value={i}>{new Date(h.timestamp).toLocaleString()}</option>)}
                  </select>
                </div>
              </div>
              {runA && runB && (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--border)" }}>
                      {["Model","Run A ⚡","Run B ⚡","Δ elapsed"].map((h,hi) => (
                        <th key={hi} style={{ textAlign:hi===0?"left":"right", padding:"7px 10px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allCmpModels.map((mid, mi) => {
                      const eA   = getAvgE(runA, mid);
                      const eB   = getAvgE(runB, mid);
                      const diff = eA !== null && eB !== null ? eB - eA : null;
                      const nameR = runA.results[0]?.modelResults?.find(r=>r.model===mid) || runB.results[0]?.modelResults?.find(r=>r.model===mid);
                      return (
                        <tr key={mid} style={{ borderBottom: mi<allCmpModels.length-1?"1px solid var(--border)":"none" }}>
                          <td style={{ padding:"7px 10px", fontSize:12, fontWeight:600, color:"var(--text1)" }}>{nameR?.name||mid}</td>
                          <td style={{ textAlign:"right", padding:"7px 10px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{eA!==null?`${eA.toFixed(2)}s`:"—"}</td>
                          <td style={{ textAlign:"right", padding:"7px 10px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{eB!==null?`${eB.toFixed(2)}s`:"—"}</td>
                          <td style={{ textAlign:"right", padding:"7px 10px", fontFamily:"var(--mono)", fontSize:12, fontWeight:700,
                            color: diff===null?"var(--text2)":diff<0?"var(--green)":diff>0?"var(--red)":"var(--text2)" }}>
                            {diff!==null?`${diff>0?"+":""}${diff.toFixed(2)}s`:"—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Per-prompt detail */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--text1)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
              📋 {t("bench_results")}
            </div>
            {results.results.map(({ prompt, modelResults, error }) => (
              <div key={prompt.id} style={{ marginBottom:12, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
                <div style={{ padding:"8px 14px", background:"var(--bg3)", borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontWeight:700, color:"var(--accent)", fontSize:12 }}>{prompt.label}</span>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{prompt.text.length>70?prompt.text.slice(0,70)+"…":prompt.text}</span>
                </div>
                {error
                  ? <div style={{ padding:10, color:"var(--red)", fontFamily:"var(--mono)", fontSize:12 }}>⚠ {error}</div>
                  : <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid var(--border)" }}>
                          {["Model","Elapsed","Tokens","Tok/s", prompt.check ? t("bench_accuracy") : null].filter(Boolean).map((h,hi) => (
                            <th key={hi} style={{ textAlign:hi===0?"left":"right", padding:"7px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", fontWeight:600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...modelResults].sort((a,b)=>(a.elapsed_s||99)-(b.elapsed_s||99)).map((r,ri) => {
                          const ts   = r.elapsed_s>0 ? Math.round(r.tokens/r.elapsed_s) : 0;
                          const pKey = `${prompt.id}::${r.model}`;
                          const open = previewKey === pKey;
                          let accBadge = null;
                          if (prompt.check && !r.error) {
                            let pass = false;
                            try { pass = prompt.check(r.content || ""); } catch {}
                            accBadge = pass
                              ? <span style={{ color:"var(--green)", fontWeight:700 }}>✓</span>
                              : <span style={{ color:"var(--red)",   fontWeight:700 }}>✗</span>;
                          }
                          return (
                            <Fragment key={r.model}>
                              <tr
                                onClick={() => !r.error && setPreviewKey(prev => prev === pKey ? null : pKey)}
                                style={{ borderBottom: (!open && ri<modelResults.length-1) ? "1px solid var(--border)" : "none",
                                  cursor: r.error ? "default" : "pointer",
                                  background: open ? "rgba(255,255,255,0.03)" : undefined }}
                              >
                                <td style={{ padding:"7px 14px", fontSize:12 }}>
                                  {ri===0&&!r.error && <span style={{ marginRight:5 }}>⚡</span>}
                                  <span style={{ fontWeight:600, color:"var(--text1)" }}>{r.name||r.model}</span>
                                  {r.error && <span style={{ color:"var(--red)", marginLeft:8, fontSize:11 }}>⚠ {r.error.slice(0,50)}</span>}
                                  {!r.error && <span style={{ marginLeft:8, fontSize:10, color:"var(--text2)", opacity:0.5 }}>{open?"▲":"▼"}</span>}
                                </td>
                                <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color:ri===0&&!r.error?"var(--green)":"var(--text2)" }}>{r.elapsed_s?`${r.elapsed_s}s`:"—"}</td>
                                <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{r.tokens||"—"}</td>
                                <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{ts||"—"}</td>
                                {prompt.check && <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:13 }}>{r.error ? <span style={{ color:"var(--text2)" }}>—</span> : accBadge}</td>}
                              </tr>
                              {open && !r.error && (
                                <tr style={{ borderBottom: ri<modelResults.length-1 ? "1px solid var(--border)" : "none" }}>
                                  <td colSpan={prompt.check ? 5 : 4} style={{ padding:"0 14px 12px 14px" }}>
                                    <pre style={{ margin:0, padding:"10px 14px", background:"var(--bg3)", borderRadius:8, fontFamily:"var(--mono)", fontSize:11, color:"var(--text1)", whiteSpace:"pre-wrap", wordBreak:"break-word", maxHeight:220, overflow:"auto", lineHeight:1.65 }}>
                                      {r.content || "(empty response)"}
                                    </pre>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                }
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {(!results || results.suite !== suite) && !running && (
        <div style={{ padding:32, textAlign:"center", color:"var(--text2)", fontFamily:"var(--mono)", fontSize:12 }}>
          {t("bench_no_results")}
        </div>
      )}

      {/* History footer */}
      {history.length > 0 && (
        <div style={{ marginTop:8, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
              {t("bench_history_title")}: {history.length} run{history.length!==1?"s":""} · {new Date(history[0].timestamp).toLocaleDateString()}
            </span>
            {history[0].note && (
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", marginLeft:10 }}>📝 {history[0].note}</span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearHistory}>{t("bench_clear")}</button>
        </div>
      )}
    </div>
  );
}

function AddModelForm({ onAdd, t }) {
  const empty = { id:"", name:"", provider:"", api_key:"", base_url:"", notes:"", active:false };
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  function handleSubmit() {
    if (!form.id.trim() || !form.name.trim() || !form.provider.trim()) return;
    const free = inferIsFree(form.provider, form.base_url);
    onAdd({ ...form, free, api_key:form.api_key||null, base_url:form.base_url||null });
    setForm(empty);
  }

  return (
    <div className="card">
      <div className="card-title">{t("new_model")}</div>
      <div className="form-grid">
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_id")} *</span>
            <Tooltip title={t("tip_id_title")} body={t("tip_id_body")} examples={t("tip_id_examples")} />
          </div>
          <input className="form-input" placeholder="groq/llama-3.3-70b-versatile"
            value={form.id} onChange={e => set("id", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_name")} *</span>
            <Tooltip title={t("tip_name_title")} body={t("tip_name_body")} examples={t("tip_name_examples")} flip />
          </div>
          <input className="form-input" placeholder="Llama 3.3 70B"
            value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_provider")} *</span>
            <Tooltip title={t("tip_provider_title")} body={t("tip_provider_body")} examples={t("tip_provider_examples")} />
          </div>
          <input className="form-input" placeholder="groq"
            value={form.provider} onChange={e => set("provider", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_apikey")}</span>
            <Tooltip title={t("tip_apikey_title")} body={t("tip_apikey_body")} examples={t("tip_apikey_examples")} flip />
          </div>
          <input className="form-input" type="password" placeholder="sk-..."
            value={form.api_key} onChange={e => set("api_key", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_baseurl")}</span>
            <Tooltip title={t("tip_baseurl_title")} body={t("tip_baseurl_body")} examples={t("tip_baseurl_examples")} />
          </div>
          <input className="form-input" placeholder="http://localhost:11434"
            value={form.base_url} onChange={e => set("base_url", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="form-label-row">
            <span className="form-label">{t("field_notes")}</span>
            <Tooltip title={t("tip_notes_title")} body={t("tip_notes_body")} examples={t("tip_notes_examples")} flip />
          </div>
          <input className="form-input" placeholder="Free tier · 128k context"
            value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
        <div className="form-group full" style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{t("auto_detected")}:</span>
            <span className={`free-badge ${inferIsFree(form.provider, form.base_url) ? "free" : "paid"}`}>
              {inferIsFree(form.provider, form.base_url) ? t("free_badge") : t("paid_badge")}
            </span>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
              {inferIsFree(form.provider, form.base_url) ? t("auto_local_hint") : t("auto_cloud_hint")}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13 }}>
              <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} />
              {t("check_active")}
            </label>
            <Tooltip title={t("tip_active_title")} body={t("tip_active_body")} examples={t("tip_active_examples")} flip />
          </div>
        </div>
        <div className="form-group full">
          <button className="btn btn-primary" onClick={handleSubmit}>{t("add_btn")}</button>
        </div>
      </div>
    </div>
  );
}

function HelpPage({ t, setPage }) {
  return (
    <>
      <h1 className="page-title">{t("help_title")}</h1>
      <p className="page-sub">{t("help_sub")}</p>
      <div className="help-intro">
        <strong>Airvo</strong> — {t("help_what_body")}
      </div>
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">+</span>
          {t("help_adding_title")}
        </div>
        {[
          { title:t("help_field_id_title"),      desc:t("help_field_id_desc"),      ex:t("help_field_id_ex") },
          { title:t("help_field_name_title"),     desc:t("help_field_name_desc"),     ex:null },
          { title:t("help_field_provider_title"), desc:t("help_field_provider_desc"), ex:"groq · openai · anthropic · ollama · lmstudio · deepseek · mistral · cohere · gemini · togetherai · fireworks · openrouter" },
          { title:t("help_field_apikey_title"),   desc:t("help_field_apikey_desc"),   ex:t("help_field_apikey_links") },
          { title:t("help_field_baseurl_title"),  desc:t("help_field_baseurl_desc"),  ex:t("help_field_baseurl_ex") },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc">{f.desc}</div>
            {f.ex && (
              <div className="help-code-block">
                {f.ex.split("\n").map((line, i) => <div key={i}>▸ {line}</div>)}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("add")}>+ {t("nav_add")}</button>
        </div>
      </div>

      {/* Model Card Features */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">◈</span>
          {t("help_models_cards_title")}
        </div>
        {[
          { title:t("help_models_test_title"),  desc:t("help_models_test_body")  },
          { title:t("help_models_notes_title"), desc:t("help_models_notes_body") },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc">{f.desc}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("models")}>◈ {t("nav_models")}</button>
        </div>
      </div>

      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">⊙</span>
          {t("help_modes_title")}
        </div>
        {[
          { key:t("help_mode_parallel"), soon:false },
          { key:t("help_mode_race"),     soon:false },
          { key:t("help_mode_vote"),     soon:false },
          { key:t("help_mode_review"),   soon:false },
        ].map((m, i) => {
          const [label, ...rest] = m.key.split(" — ");
          return (
            <div key={i} className="help-mode-item" style={m.soon ? { opacity:0.5 } : {}}>
              <strong>{label}</strong>
              {m.soon && <span style={{ marginLeft:8, fontSize:10, fontFamily:"var(--mono)", color:"var(--accent)", background:"#1a1a2a", border:"1px solid var(--accent)", borderRadius:4, padding:"1px 6px" }}>COMING SOON</span>}
              {" — "}{rest.join(" — ")}
            </div>
          );
        })}
      </div>
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🧠</span>
          {t("help_rag_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_rag_what_title")}</div>
          <div className="help-field-desc">{t("help_rag_what_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_rag_setup_title")}</div>
          <div className="help-code-block">
            {t("help_rag_setup_steps").split("\n").map((step, i) => (
              <div key={i}>{step}</div>
            ))}
          </div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_rag_privacy_title")}</div>
          <div className="help-field-desc">{t("help_rag_privacy_body")}</div>
        </div>
      </div>

      {/* Memory Manager */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🖥️</span>
          {t("help_hw_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc">{t("help_hw_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_hw_tip_title")}</div>
          <div className="help-field-desc">{t("help_hw_tip_body")}</div>
        </div>
      </div>

      {/* Model Discovery */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🔭</span>
          {t("help_disc_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc">{t("help_disc_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_disc_tip_title")}</div>
          <div className="help-field-desc">{t("help_disc_tip_body")}</div>
        </div>
      </div>

      {/* Chat History Limit */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">💬</span>
          {t("help_history_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc">{t("help_history_body")}</div>
        </div>
      </div>

      {/* Agent/Plan Mode & Model Selection */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">⚡</span>
          {t("help_agent_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_agent_what_title")}</div>
          <div className="help-field-desc">{t("help_agent_what_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_agent_why_title")}</div>
          <div className="help-field-desc">{t("help_agent_why_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">{t("help_agent_select_title")}</div>
          <div className="help-field-desc">{t("help_agent_select_body")}</div>
        </div>
        <div className="help-field-block">
          <div className="help-field-title">💡 {t("help_agent_tip_title")}</div>
          <div className="help-field-desc">{t("help_agent_tip_body")}</div>
        </div>
      </div>

      {/* Compare tab */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">⊞</span>
          {t("help_compare_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t("help_compare_intro")}</div>
        </div>
        {[
          { icon:"⊞", tk:"streaming"  },
          { icon:"▨", tk:"diff"       },
          { icon:"📌", tk:"pin"        },
          { icon:"📊", tk:"similarity" },
          { icon:"💾", tk:"templates"  },
          { icon:"🌡", tk:"temps"      },
          { icon:"←→", tk:"history"    },
          { icon:"📄", tk:"export"     },
          { icon:"↓📄", tk:"sort"       },
        ].map(({ icon, tk }) => (
          <div key={tk} className="help-field-block">
            <div className="help-field-title">{icon} {t(`help_compare_${tk}_title`)}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t(`help_compare_${tk}_body`)}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("compare")}>⊞ {t("nav_compare")}</button>
        </div>
      </div>

      {/* Stats tab */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">📊</span>
          {t("help_stats_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t("help_stats_intro")}</div>
        </div>
        {[
          { icon:"📊", tk:"tokens"  },
          { icon:"💰", tk:"cost"    },
          { icon:"⭐", tk:"quality" },
          { icon:"⚡", tk:"latency" },
          { icon:"📅", tk:"daily"   },
        ].map(({ icon, tk }) => (
          <div key={tk} className="help-field-block">
            <div className="help-field-title">{icon} {t(`help_stats_${tk}_title`)}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t(`help_stats_${tk}_body`)}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("stats")}>📊 {t("nav_stats")}</button>
        </div>
      </div>

      {/* Benchmarks tab */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🏆</span>
          {t("help_bench_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t("help_bench_intro")}</div>
        </div>
        {[
          { title:t("help_bench_suites_title"),      body:t("help_bench_suites_body"),      isCode:true },
          { title:t("help_bench_custom_title"),      body:t("help_bench_custom_body"),      isCode:false },
          { title:t("help_bench_leaderboard_title"), body:t("help_bench_leaderboard_body"), isCode:false },
          { title:t("help_bench_charts_title"),      body:t("help_bench_charts_body"),      isCode:false },
          { title:t("help_bench_annotation_title"),  body:t("help_bench_annotation_body"),  isCode:false },
          { title:t("help_bench_export_title"),      body:t("help_bench_export_body"),      isCode:false },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            {f.isCode
              ? <div className="help-code-block">{f.body.split("\n").map((l,i) => <div key={i}>▸ {l}</div>)}</div>
              : <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
            }
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("bench")}>🏆 {t("nav_bench")}</button>
        </div>
      </div>

      {/* ── v0.8 Features ── */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">✦</span>
          {t("help_v8_title")}
        </div>
        <div className="help-field-block">
          <div className="help-field-desc" style={{ lineHeight:1.8 }}>{t("help_v8_intro")}</div>
        </div>
      </div>

      {/* Privacy Mode */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🔒</span>
          {t("help_privacy_title")}
        </div>
        {[
          { title:t("help_privacy_what_title"),  body:t("help_privacy_what_body")  },
          { title:t("help_privacy_how_title"),   body:t("help_privacy_how_body")   },
          { title:t("help_privacy_tip_title"),   body:t("help_privacy_tip_body")   },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("config")}>⊙ {t("nav_config")}</button>
        </div>
      </div>

      {/* Cost Consciousness */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">💰</span>
          {t("help_cost_title")}
        </div>
        {[
          { title:t("help_cost_what_title"),    body:t("help_cost_what_body")    },
          { title:t("help_cost_savings_title"), body:t("help_cost_savings_body") },
          { title:t("help_cost_budget_title"),  body:t("help_cost_budget_body")  },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("stats")}>📊 {t("nav_stats")}</button>
        </div>
      </div>

      {/* Prompt Cache */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">⚡</span>
          {t("help_cache_title")}
        </div>
        {[
          { title:t("help_cache_what_title"),   body:t("help_cache_what_body"),   isCode:false },
          { title:t("help_cache_rules_title"),  body:t("help_cache_rules_body"),  isCode:false },
          { title:t("help_cache_config_title"), body:t("help_cache_config_body"), isCode:false },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("config")}>⊙ {t("nav_config")}</button>
        </div>
      </div>

      {/* Request History & Replay */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🕓</span>
          {t("help_history_req_title")}
        </div>
        {[
          { title:t("help_history_req_what_title"),   body:t("help_history_req_what_body")   },
          { title:t("help_history_req_replay_title"), body:t("help_history_req_replay_body") },
          { title:t("help_history_req_search_title"), body:t("help_history_req_search_body") },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("history")}>🕓 {t("nav_history")}</button>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🎯</span>
          {t("help_confidence_title")}
        </div>
        {[
          { title:t("help_confidence_what_title"),  body:t("help_confidence_what_body"),  isCode:false },
          { title:t("help_confidence_scale_title"), body:t("help_confidence_scale_body"), isCode:true  },
          { title:t("help_confidence_badge_title"), body:t("help_confidence_badge_body"), isCode:false },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            {f.isCode
              ? <div className="help-code-block">{f.body.split("\n").map((l,i) => <div key={i}>{l}</div>)}</div>
              : <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
            }
          </div>
        ))}
        <div style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={() => setPage("chat")}>🤖 {t("nav_chat")}</button>
        </div>
      </div>

      {/* Context Window Optimizer */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🧠</span>
          {t("help_context_title")}
        </div>
        {[
          { title:t("help_context_what_title"), body:t("help_context_what_body") },
          { title:t("help_context_how_title"),  body:t("help_context_how_body")  },
          { title:t("help_context_tip_title"),  body:t("help_context_tip_body")  },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
      </div>

      {/* v0.9: MCP Server & Quality Tracker */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🚀</span>
          {t("help_v9_title")}
        </div>
        {[
          { title:t("help_v9_mcp_title"),     body:t("help_v9_mcp_body")     },
          { title:t("help_v9_rating_title"),  body:t("help_v9_rating_body")  },
          { title:t("help_v9_models_title"),  body:t("help_v9_models_body")  },
        ].map(f => (
          <div key={f.title} className="help-field-block">
            <div className="help-field-title">{f.title}</div>
            <div className="help-field-desc" style={{ lineHeight:1.8 }}>{f.body}</div>
          </div>
        ))}
      </div>

      {/* Troubleshooting */}
      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">🔧</span>
          {t("help_trouble_title")}
        </div>
        {[1,2,3,4,5].map(n => (
          <div key={n} className="faq-item">
            <div className="faq-q">⚠ {t(`help_trouble_${n}_q`)}</div>
            <div className="faq-a">{t(`help_trouble_${n}_a`)}</div>
          </div>
        ))}
      </div>

      <div className="help-section">
        <div className="help-section-title">
          <span className="help-section-icon">?</span>
          {t("help_faq_title")}
        </div>
        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => (
          <div key={n} className="faq-item">
            <div className="faq-q">Q: {t(`help_faq_${n}_q`)}</div>
            <div className="faq-a">{t(`help_faq_${n}_a`)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

