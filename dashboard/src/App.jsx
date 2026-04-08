import { useState, useEffect, useCallback, useRef } from "react";
import hljs from "highlight.js/lib/core";
import _hljsPY   from "highlight.js/lib/languages/python";
import _hljsJS   from "highlight.js/lib/languages/javascript";
import _hljsTS   from "highlight.js/lib/languages/typescript";
import _hljsJAVA from "highlight.js/lib/languages/java";
import _hljsCPP  from "highlight.js/lib/languages/cpp";
import _hljsCS   from "highlight.js/lib/languages/csharp";
import _hljsGO   from "highlight.js/lib/languages/go";
import _hljsRUST from "highlight.js/lib/languages/rust";
import _hljsSH   from "highlight.js/lib/languages/bash";
import _hljsJSON from "highlight.js/lib/languages/json";
import _hljsXML  from "highlight.js/lib/languages/xml";
import _hljsCSS  from "highlight.js/lib/languages/css";
import _hljsSQL  from "highlight.js/lib/languages/sql";
import _hljsYAML from "highlight.js/lib/languages/yaml";
import _hljsKT   from "highlight.js/lib/languages/kotlin";
import _hljsRB   from "highlight.js/lib/languages/ruby";
[["python",_hljsPY],["py",_hljsPY],["javascript",_hljsJS],["js",_hljsJS],["jsx",_hljsJS],
 ["typescript",_hljsTS],["ts",_hljsTS],["tsx",_hljsTS],["java",_hljsJAVA],
 ["cpp",_hljsCPP],["c",_hljsCPP],["csharp",_hljsCS],["cs",_hljsCS],
 ["go",_hljsGO],["rust",_hljsRUST],["rs",_hljsRUST],
 ["bash",_hljsSH],["sh",_hljsSH],["shell",_hljsSH],
 ["json",_hljsJSON],["xml",_hljsXML],["html",_hljsXML],
 ["css",_hljsCSS],["sql",_hljsSQL],["yaml",_hljsYAML],["yml",_hljsYAML],
 ["kotlin",_hljsKT],["kt",_hljsKT],["ruby",_hljsRB],["rb",_hljsRB],
].forEach(([alias, lang]) => { if (!hljs.getLanguage(alias)) hljs.registerLanguage(alias, lang); });

const API = import.meta.env.DEV ? "" : "";

const LANGUAGES = [
  { code: "en", label: "EN", flag: "🇺🇸", name: "English"   },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español"   },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français"  },
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch"   },
  { code: "zh", label: "ZH", flag: "🇨🇳", name: "中文"       },
  { code: "ja", label: "JA", flag: "🇯🇵", name: "日本語"     },
  { code: "pt", label: "PT", flag: "🇧🇷", name: "Português" },
];

const I18N = {
  en: {
    nav_models:"Models", nav_status:"Status", nav_config:"Configuration",
    nav_add:"Add Model", nav_help:"Help", nav_active:"ACTIVE", nav_none:"none",
    connecting:"connecting...", offline:"server offline",
    models_title:"Models", models_sub:"Activate models and configure their API keys",
    suggestions_title:"Suggestions", suggestions_sub:"Add an API key to start using these models",
    stat_total:"Total", stat_active:"Active", stat_free:"Free", stat_with_key:"With Key",
    stat_models:"models", stat_parallel:"in parallel", stat_no_cost:"no cost", stat_configured:"configured",
    loading_models:"Loading models...",
    active:"active", inactive:"inactive", free_badge:"FREE", paid_badge:"PAID",
    save_key:"Save", hide_key:"hide", show_key:"show", change_key:"change", delete_btn:"delete",
    key_placeholder:"API key...",
    status_title:"Status", status_sub:"Server status and active models", server_label:"Server",
    status_online:"● Online", status_offline_msg:"Cannot connect to server.",
    status_offline_hint:"Make sure Airvo is running with",
    field_version:"Version", field_active:"Active models", field_total:"Total models",
    field_config:"Config file", field_endpoint:"Chat endpoint",
    hw_label:"System Resources", hw_sub:"RAM, GPU and Ollama models in memory",
    hw_ram:"RAM", hw_used:"used", hw_free:"free",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"Models in memory", hw_ollama_none:"No models loaded",
    hw_pressure_ok:"Memory OK", hw_pressure_warning:"Memory pressure", hw_pressure_critical:"Memory critical",
    hw_unload_btn:"Unload", hw_unload_confirm:"Unload this model from memory?",
    hw_unload_done:"Model unloaded ✓", hw_unload_error:"Failed to unload",
    hw_no_psutil:"psutil not installed", hw_no_psutil_hint:"Run: pip install airvo[hardware]",
    hw_suggestions:"Suggestions", hw_loading:"Loading hardware info...",
    hw_refresh:"Refresh",
    hw_cpu:"CPU", hw_cpu_cores:"cores", hw_cpu_usage:"usage",
    hw_processes:"Top memory consumers", hw_proc_sub:"Processes using the most RAM",
    hw_proc_show:"Show processes", hw_proc_hide:"Hide",
    disc_label:"Discover Models", disc_sub:"Browse compatible models based on your hardware",
    disc_local_tab:"Local (Ollama)", disc_cloud_tab:"Cloud (OpenRouter)",
    disc_fits:"Fits RAM", disc_too_large:"Needs more RAM", disc_installed:"Installed",
    disc_pull_cmd:"Pull command", disc_add_btn:"Add to Airvo", disc_added:"Model added ✓",
    disc_add_error:"Failed to add", disc_loading:"Loading models...",
    disc_ollama_offline:"Ollama is offline", disc_free_badge:"Free",
    disc_context:"context", disc_no_results:"No models found", disc_ram_required:"RAM required",
    disc_already_added:"Already added", disc_open_section:"Discover",
    disc_local_explain:"Local models run 100% on your computer via Ollama — no API key, no internet, no cost. Completely private.",
    disc_local_how:"① Copy the pull command below → run it in your terminal to download the model.  ② Click '+ Add to Airvo' to register it in Airvo.",
    disc_fits_detail:"Fits in your available RAM — will load and run smoothly",
    disc_too_large_detail:"Needs more RAM than currently available — may be very slow or fail to load",
    disc_cloud_explain:"Cloud models run on OpenRouter's servers — powerful, no local GPU needed. Requires a free OpenRouter API key.",
    disc_cloud_how:"① Click '+ Add to Airvo'.  ② Go to the Models page and set your OpenRouter API key.  ③ Activate the model and you're done.",
    continue_label:"Continue.dev Config", continue_hint:"Add this to your continue.dev config.yaml:",
    copy_config:"Copy config", copied:"Copied ✓",
    config_title:"Configuration", config_sub:"Mode, temperature, memory and preferences",
    mode_label:"Multi-Model Mode", active_models_label:"Active Models",
    no_active_models:"No active models. Activate at least one in Models.",
    mode_parallel:"Parallel", mode_parallel_desc:"All models respond, you see all answers",
    mode_race:"Race", mode_race_desc:"Fastest model wins",
    mode_vote:"Vote", mode_vote_desc:"Consensus between models",
    mode_review:"Review", mode_review_desc:"One generates, another critiques", mode_set:"Mode",
    tool_call_badge:"Agent/Plan mode",
    tool_call_badge_tip:"Last request used a single model because your IDE sent tool calls (Agent or Plan mode). Multi-model only works in Chat mode.",
    mode_note_tools:"⚡ Last request used Agent/Plan mode — only 1 model responded. This is expected: tool calls require a single-model conversation. Switch to Chat mode in your IDE to get multi-model responses.",
    last_req_multi:"multi-model ✓", last_req_single:"single model",
    temp_label:"Temperature",
    temp_hint_low:"0.0 — deterministic, precise. Best for code and refactoring.",
    temp_hint_mid:"0.5 — balanced. Good for most tasks.",
    temp_hint_high:"1.0 — creative, varied. Best for brainstorming and docs.",
    temp_saved:"Temperature saved",
    maxtokens_label:"Max Tokens",
    maxtokens_saved:"Max tokens saved",
    maxhistory_label:"Chat History Limit",
    maxhistory_sub:"Max messages kept per request. Lower = fewer tokens sent to the model.",
    maxhistory_saved:"History limit saved",
    memory_label:"Project Context",
    memory_sub:"Write once, injected into every request. Helps Airvo understand your stack without repeating yourself.",
    memory_enable:"Enable project context",
    memory_placeholder:"Example:\nI work with FastAPI and Python 3.12.\nAlways use async/await and type hints.\nThis is an e-commerce REST API.\nDeploy target is Railway with Docker.\nDo not suggest Redux, we use Zustand.",
    memory_chars:"chars",
    memory_max:"max",
    memory_saved:"Project context saved ✓",
    memory_too_long:"Context too long — trim it down",
    memory_tokens_warning:"⚠ Context is large — consider trimming",
    rag_label:"Smart Memory (RAG)",
    rag_sub:"Semantic search of your codebase — relevant code injected into every request automatically. Embeddings run 100% locally.",
    rag_enable:"Enable Smart Memory",
    rag_warning_title:"One-time setup required",
    rag_warning_body:"Smart Memory downloads a local AI embedding model (~90 MB) on first use. Your code never leaves your computer.",
    rag_warning_confirm:"Enable anyway",
    rag_path_label:"Project Path",
    rag_path_placeholder:"/path/to/your/project",
    rag_index_btn:"Index Now",
    rag_indexing:"Indexing…",
    rag_status_files:"files indexed",
    rag_status_chunks:"chunks",
    rag_status_size:"MB index",
    rag_status_last:"Last indexed",
    rag_status_never:"never",
    rag_clear_btn:"Clear Index",
    rag_clear_confirm:"Delete the entire RAG index? This cannot be undone.",
    rag_clear_done:"Index cleared",
    rag_index_done:"Indexing complete ✓",
    rag_index_error:"Indexing failed",
    rag_not_available:"RAG dependencies not installed",
    rag_install_hint:"Run: pip install airvo[rag]",
    rag_advanced:"Advanced settings",
    rag_max_mb:"Max index size (MB)",
    rag_max_kb:"Max file size (KB)",
    rag_top_k:"Results per request",
    rag_max_inject_chars:"Max context injected (chars)",
    stats_label:"Usage Stats",
    stats_requests:"requests",
    stats_tokens:"tokens",
    stats_reset:"Reset stats",
    stats_reset_confirm:"Reset all usage stats?",
    stats_reset_done:"Stats reset",
    stats_empty:"No usage data yet. Start coding!",
    stats_tab_title:"Usage Analytics", stats_tab_sub:"Token usage, estimated cost, quality ranking and latency per model",
    stats_section_tokens:"Tokens by Model", stats_section_cost:"Estimated Cost", stats_section_quality:"Quality Ranking",
    stats_section_latency:"Avg Latency", stats_section_daily:"Daily Activity — Last 7 Days",
    stats_copies:"copies", stats_free:"Free", stats_local:"Local",
    stats_latency_avg:"avg", stats_latency_unit:"s",
    stats_cost_note:"* Estimates based on typical API pricing. Actual costs may vary.",
    stats_quality_note:"Based on how many times you copied a model's response",
    stats_no_history:"No daily data yet",
    stats_total_tokens:"Total tokens", stats_total_requests:"Total requests",
    add_title:"Add Model", add_sub:"Any model compatible with LiteLLM — any provider, any API",
    new_model:"New Model",
    field_id:"Model ID", field_name:"Display Name", field_provider:"Provider",
    field_apikey:"API Key", field_baseurl:"Base URL", field_notes:"Notes",
    check_active:"Activate immediately", add_btn:"Add Model",
    tip_id_title:"What is the Model ID?",
    tip_id_body:"Unique identifier in format provider/model-name. This is what LiteLLM uses to route your request to the right API.",
    tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3\nlmstudio/local\ndeepseek/deepseek-chat\nmistral/mistral-large-latest",
    tip_name_title:"What is the Display Name?",
    tip_name_body:"A friendly name shown in the dashboard and sidebar.",
    tip_name_examples:"Llama 3.3 70B\nGPT-4o\nClaude Sonnet\nMy Local Model",
    tip_provider_title:"What is the Provider?",
    tip_provider_body:"The company or system that hosts the model.",
    tip_provider_examples:"groq · openai · anthropic\nollama · lmstudio · deepseek\nmistral · cohere · gemini\ntogetherai · fireworks · openrouter",
    tip_apikey_title:"Where do I get the API Key?",
    tip_apikey_body:"A secret token that authenticates your requests. Leave empty for local models.",
    tip_apikey_examples:"Groq → console.groq.com (free)\nOpenAI → platform.openai.com\nAnthropic → console.anthropic.com\nDeepSeek → platform.deepseek.com\nOllama / LM Studio → leave empty",
    tip_baseurl_title:"What is the Base URL?",
    tip_baseurl_body:"The server address for requests. Only needed for local models.",
    tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234\nCloud models → leave empty (auto)",
    tip_notes_title:"Notes (optional)",
    tip_notes_body:"A personal reminder — context limit, cost, quality notes.",
    tip_notes_examples:"Free tier · 128k context\nBest for code generation\nSlow but very accurate",
    tip_active_title:"What does 'Activate immediately' mean?",
    tip_active_body:"If checked, the model goes live right away. If unchecked, it's saved but inactive.",
    tip_active_examples:"✓ Checked → model is ON\n✗ Unchecked → model is saved but OFF",
    help_title:"Help", help_sub:"Everything you need to add and use any model in Airvo",
    help_what_title:"What is Airvo?",
    help_what_body:"Airvo is a local AI server that connects your editor (VS Code + continue.dev) to any AI model — simultaneously. You bring your own API keys, Airvo handles the rest.",
    help_adding_title:"Adding Models — Field by Field",
    help_field_id_title:"Model ID",
    help_field_id_desc:"The unique key that identifies both the provider and the model. Format is always provider/model-name.",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\ngroq/llama-3.1-8b-instant\nopenai/gpt-4o\nopenai/gpt-4o-mini\nanthropic/claude-sonnet-4-5\nollama/llama3\nollama/codellama\nlmstudio/local\ndeepseek/deepseek-chat\nmistral/mistral-large-latest\ngemini/gemini-1.5-pro",
    help_field_name_title:"Display Name",
    help_field_name_desc:"A friendly label shown in the dashboard.",
    help_field_provider_title:"Provider",
    help_field_provider_desc:"The service hosting the model.",
    help_field_apikey_title:"API Key",
    help_field_apikey_desc:"Your secret authentication token. Get it from each provider's dashboard. Leave empty for local models.",
    help_field_apikey_links:"console.groq.com → Groq (free tier available)\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic\nplatform.deepseek.com → DeepSeek\naistudio.google.com → Gemini",
    help_field_baseurl_title:"Base URL",
    help_field_baseurl_desc:"The server address for requests. Leave empty for cloud providers.",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"Multi-Model Modes",
    help_mode_parallel:"Parallel — All active models respond to every message. You see all answers side by side.",
    help_mode_race:"Race — All models receive the message simultaneously. The first one to finish wins.",
    help_mode_vote:"Vote — Models generate responses and the consensus answer is shown.",
    help_mode_review:"Review — One model generates a response, another critiques it.",
    help_faq_title:"FAQ",
    help_faq_1_q:"Do I need all fields to add a model?",
    help_faq_1_a:"No. Only Model ID, Name and Provider are required.",
    help_faq_2_q:"Can I use any model, even ones not listed?",
    help_faq_2_a:"Yes — any model supported by LiteLLM works with Airvo.",
    help_faq_3_q:"Where is my API key stored?",
    help_faq_3_a:"Locally in ~/.airvo/models.json. It never leaves your computer.",
    help_faq_4_q:"How do I use a local model with Ollama?",
    help_faq_4_a:"Install Ollama, pull a model (ollama pull llama3), add it with ID: ollama/llama3, Provider: ollama, Base URL: http://localhost:11434.",
    help_faq_5_q:"What is Project Context?",
    help_faq_5_a:"A static note injected into every request so Airvo knows your stack, preferences and constraints. Write it once in Configuration → Project Context.",
    help_faq_6_q:"Does Project Context consume extra tokens?",
    help_faq_6_a:"Yes — a small fixed amount per request (~650 tokens max). It's optional and opt-in. Disable it anytime in Configuration.",
    help_faq_7_q:"What is Smart Memory (RAG)?",
    help_faq_7_a:"Smart Memory indexes your codebase locally using AI embeddings. Before each request, Airvo automatically finds the most relevant files and injects them into the prompt — no copy-pasting needed.",
    help_faq_8_q:"Does Smart Memory send my code to the cloud?",
    help_faq_8_a:"Never. The embedding model (all-MiniLM-L6-v2) runs 100% on your machine. Your code never leaves your computer. The index is stored in ~/.airvo/rag/.",
    help_rag_title:"Smart Memory (RAG)",
    help_rag_what_title:"What it does",
    help_rag_what_body:"Smart Memory scans your project, splits files into chunks, generates vector embeddings locally, and stores them in a ChromaDB database on your machine. When you send a message, Airvo embeds your query and retrieves the most semantically similar code chunks — then injects them into the AI's context automatically.",
    help_rag_setup_title:"How to enable it",
    help_rag_setup_steps:"1. Go to Configuration → Smart Memory (RAG)\n2. Toggle \"Enable Smart Memory\" ON (one-time 90 MB model download)\n3. Enter the path to your project folder\n4. Click \"Index Now\" and wait for indexing to complete\n5. The 🧠 RAG badge appears in the header when active",
    help_rag_privacy_title:"Privacy & performance",
    help_rag_privacy_body:"Everything runs locally — embeddings, index, and retrieval. No data is sent to any server. Indexing is fast for most projects. Large monorepos may take a few minutes on first run.",
    help_hw_title:"Memory Manager",
    help_hw_body:"Real-time RAM and GPU usage in the Status page. Shows which Ollama models are loaded in memory, warns when RAM is under pressure (>75% WARNING, >90% CRITICAL), and lets you unload models with one click — no terminal needed.",
    help_hw_tip_title:"When to use it",
    help_hw_tip_body:"If Ollama is slow or unresponsive, check Status — you may have multiple large models loaded simultaneously. Unload unused ones to free RAM.",
    help_disc_title:"Model Discovery",
    help_disc_body:"In the Models page, expand '🔭 Discover Models'. Local tab shows a curated Ollama catalog filtered by what fits in your RAM — green badge means it fits, red means you need more RAM. Cloud tab shows OpenRouter models with free ones highlighted.",
    help_disc_tip_title:"Quick add",
    help_disc_tip_body:"Click '+ Add to Airvo' on any discovered model. For Ollama models, copy the pull command shown and run it in your terminal first.",
    help_history_title:"Chat History Limit",
    help_history_body:"Airvo keeps only the last N messages of your conversation per request (default 10). Lower this if you hit token limits with free API tiers — Groq free tier allows 6k–12k tokens per minute. The full chat history stays in your editor; only what's sent to the model is trimmed.",
    help_agent_title:"Agent/Plan Mode & Model Selection",
    help_agent_what_title:"What is Agent/Plan mode?",
    help_agent_what_body:"continue.dev has 3 modes: Chat (💬), Agent (⚡), and Plan (📋). In Agent and Plan, your IDE sends tool definitions alongside your message — tools to read files, write code, run terminal commands, etc.",
    help_agent_why_title:"Why only one model responds in Agent/Plan?",
    help_agent_why_body:"Tool calling is a multi-turn stateful conversation: the model requests a tool, the IDE runs it and returns the result, the model requests another tool, and so on. This back-and-forth requires a single model to maintain context. Running multiple models in parallel would mean multiple conflicting file edits.",
    help_agent_select_title:"Choosing which model handles Agent/Plan",
    help_agent_select_body:"In Configuration → Agent/Plan Model, pick any of your active models. If set to Auto, Airvo uses the first active model in your list. Choose your most capable model here — it will do all the agentic work.",
    help_agent_tip_title:"Tip",
    help_agent_tip_body:"Use Chat mode to compare responses from all your models. Use Agent/Plan mode when you need the AI to actually edit files and run commands — that always uses one model.",
    agent_model_label:"Agent/Plan Model",
    agent_model_sub:"Model used for Agent and Plan mode in your IDE. These modes use tool calls and require a single model.",
    agent_model_saved:"Agent model saved ✓",
    agent_model_auto:"Auto (first active model)",
    help_trouble_title:"Troubleshooting",
    help_trouble_1_q:"Rate limit error / tokens too large from Groq or other provider",
    help_trouble_1_a:"Go to Configuration → Chat History Limit and set it to 4 or 6 messages. If Smart Memory (RAG) is enabled, also lower 'Max context injected' to 1000–2000 characters. Free Groq tier: 6k–12k tokens/min.",
    help_trouble_2_q:"Cannot connect to server / dashboard shows server offline",
    help_trouble_2_a:"Make sure Airvo is running: open a terminal and run 'airvo start'. Verify the port in your .env file (default 8765) matches what's in your IDE extension settings.",
    help_trouble_3_q:"A model shows an error / red icon",
    help_trouble_3_a:"Check the API key for that model in the Models page. For Ollama models, make sure Ollama is running ('ollama serve') and the model is downloaded ('ollama pull modelname').",
    help_trouble_4_q:"Smart Memory (RAG) is not finding my code / retrieval seems off",
    help_trouble_4_a:"Go to Configuration → Smart Memory → click 'Index Now'. Confirm the path points to your project root. After adding new files, re-index. Setting Top K to 1–2 is enough for most projects.",
    help_trouble_5_q:"Model Discovery shows no Ollama models as installed",
    help_trouble_5_a:"Ollama may not be running. Start it with 'ollama serve'. The catalog always loads — the Installed badge just requires Ollama to respond on localhost:11434.",
    help_compare_title:"Compare Tab — Feature Guide",
    help_compare_intro:"The Compare tab is the most powerful feature in Airvo. It lets you run the same prompt against all your active models simultaneously, in real time, and analyse the results with visual tools not found in any other AI client.",
    help_compare_streaming_title:"⊞ Real-time parallel streaming",
    help_compare_streaming_body:"When you type a prompt and click Compare (or press Ctrl+Enter), all active models start generating at exactly the same time. You see each model's tokens appearing live, side by side. The ⚡ Fastest and 📝 Most tokens badges are awarded automatically when each stream finishes.",
    help_compare_diff_title:"▨ Diff modes — Word & Sentence",
    help_compare_diff_body:"Word diff highlights every word that appears in one model's response but not in the others — uniqueness at a glance. Sentence diff compares whole sentences: a sentence is highlighted if no other model said roughly the same thing. Both modes are computed in the browser, no backend call needed.",
    help_compare_pin_title:"📌 Pin as reference",
    help_compare_pin_body:"Click the 📌 button on any card to set that model as the baseline. In diff mode, all other models are compared against the pinned one — ideal when you want GPT-4o as the gold standard and you want to see exactly where a free model diverges.",
    help_compare_similarity_title:"Similarity score (Jaccard)",
    help_compare_similarity_body:"At the bottom of the Performance bar you'll see pairwise similarity percentages between models. It uses Jaccard similarity on the word sets of each response. Green ≥ 60% means the models largely agree. Red < 35% means they gave fundamentally different answers — that's where it's most interesting.",
    help_compare_templates_title:"💾 Prompt templates",
    help_compare_templates_body:"Click Save next to the textarea to store the current prompt. Saved templates appear as clickable chips above the input — click one to fill the textarea instantly. Up to 10 templates are stored locally in your browser. Use this for repeated benchmarks like 'Write unit tests for:' or 'Explain like I\'m 5'.",
    help_compare_temps_title:"🌡 Per-model temperature",
    help_compare_temps_body:"Click the 🌡 button to expand individual temperature sliders for each active model. This lets you compare the same model at different creativity levels, or test one model at 0.0 (deterministic) against another at 0.9 (creative) in the same run. Values with * mean the model uses the global temperature from Configuration.",
    help_compare_history_title:"History & Re-run",
    help_compare_history_body:"Airvo keeps the last 10 comparisons in ~/.airvo/compare_history.json — they survive server restarts. Navigate with the ← → arrows in the toolbar. Click 🔁 Re-run on any past entry to re-send that exact prompt through all currently active models. Use 🗑 Clear history to wipe everything.",
    help_compare_export_title:"📄 Export to Markdown",
    help_compare_export_body:"Exports the full comparison as a .md file including the prompt, each model's full response, response time, token count, and the exact model ID (provider/version). Useful for documenting benchmarks or sharing results with your team.",
    help_compare_sort_title:"Sort & Focus",
    help_compare_sort_body:"Sort cards by ⚡ Speed (fastest first) or 📝 Tokens (most tokens first). Use ⛶ Focus to expand a single card to full width for easier reading. Click again to return to the grid.",
    help_stats_title:"Stats — Usage Analytics",
    help_stats_intro:"The Stats tab tracks your actual usage across all models — tokens consumed, estimated API cost, response quality (based on what you copy), and latency trends. All data is stored locally in ~/.airvo/stats.json.",
    help_stats_tokens_title:"📊 Tokens by Model",
    help_stats_tokens_body:"Horizontal bars showing total tokens generated per model since stats were last reset. Useful for understanding which models you rely on most.",
    help_stats_cost_title:"💰 Estimated Cost",
    help_stats_cost_body:"Estimated API spend per model based on typical pricing (e.g. OpenAI ~$5/1M tokens, Anthropic ~$9/1M). Local models (Ollama, LM Studio) always show Free. These are estimates — check your provider dashboard for exact billing.",
    help_stats_quality_title:"⭐ Quality Ranking",
    help_stats_quality_body:"Models ranked by how many times you clicked Copy on their responses. This is an implicit quality signal — if you copy a model's answer, it was useful. 🥇🥈🥉 medals go to the top 3.",
    help_stats_latency_title:"⚡ Avg Latency",
    help_stats_latency_body:"Average response time per model across all recorded requests. Green = fastest relative to others, yellow = moderate, red = slowest. Useful for choosing the right model when speed matters.",
    help_stats_daily_title:"📅 Daily Activity",
    help_stats_daily_body:"Sparkline bars showing token usage per day over the last 7 days. Helps you spot patterns — e.g. which models you use more on heavy coding days.",
    config_context_memory_section:"Context & Memory",
    toast_activated:"Model activated", toast_deactivated:"Model deactivated",
    toast_key_saved:"API key saved ✓", toast_key_error:"Enter a valid API key",
    toast_deleted:"Model deleted", toast_added:"Model added ✓",
    toast_error_toggle:"Error updating model", toast_error_key:"Error saving key",
    toast_error_delete:"Error deleting model", toast_error_add:"Error adding model",
    confirm_delete:"Delete this model?",
    toast_limit:"Airvo supports up to 3 active models. Deactivate one to activate another.",
    stat_v1_limit:"max 3 active",
    auto_detected:"Auto-detected",
    auto_local_hint:"Local model — no API cost",
    auto_cloud_hint:"Cloud model — API usage billed by provider",
    nav_compare:"Compare", nav_stats:"Stats", nav_bench:"Benchmarks",
    bench_title:"Benchmarks", bench_sub:"Standardized prompts to measure and compare your models",
    bench_suite_speed:"Speed Test", bench_suite_coding:"Coding", bench_suite_reasoning:"Reasoning", bench_suite_creative:"Creativity",
    bench_run:"Run Benchmark", bench_running:"Running",
    bench_no_active:"Need at least 2 active models to run benchmarks.",
    bench_no_results:"No benchmark run yet — select a suite and click Run Benchmark.",
    bench_leaderboard:"Overall Leaderboard", bench_results:"Results per Prompt",
    bench_clear:"Clear History", bench_history_title:"Run History",
    compare_title:"Response Comparison",
    compare_sub:"Last multi-model responses side by side — copy and pick the best",
    compare_empty:"No multi-model responses yet",
    compare_empty_hint:"Use Parallel, Vote or Review mode with 2+ active models, then send a message from your IDE",
    compare_refresh:"Refresh",
    compare_mode:"Mode",
    compare_prompt:"Prompt",
    compare_copy:"Copy",
    compare_copied:"Copied ✓",
    compare_tokens:"tokens",
    compare_error_badge:"Error",
    compare_at:"Last updated",
    compare_auto:"Auto",
    compare_elapsed:"s",
    compare_history_label:"History",
    compare_of:"of",
    compare_export:"Export MD",
    compare_export_done:"Exported ✓",
    compare_fastest:"Fastest",
    compare_most_tokens:"Most",
    compare_expand:"Focus",
    compare_collapse:"Show all",
    compare_copy_prompt:"Copy prompt",
    compare_stats:"Performance",
    compare_time:"Time",
    compare_tok_s:"tok/s",
    compare_ask:"Ask models",
    compare_send:"⊞ Compare",
    compare_sending:"Running…",
    compare_send_placeholder:"Type a prompt to compare all active models… (Ctrl+Enter)",
    compare_sort_default:"Default",
    compare_sort_speed:"⚡ Speed",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"Need 2+ active models to compare",
    compare_diff:"Diff",
    compare_diff_tip:"Highlight words unique to each model",
    compare_streaming:"Streaming…",
    compare_stream_done:"Done",
    compare_rerun:"🔁 Re-run",
    compare_clear:"🗑 Clear history",
    compare_clear_confirm:"Clear all compare history? This cannot be undone.",
    compare_cleared:"History cleared",
    compare_template_save:"💾 Save",
    compare_template_saved:"Template saved ✓",
    compare_templates:"Saved prompts",
    compare_similarity:"Similarity",
    compare_diff_word:"Word",
    compare_diff_sentence:"Sentence",
    compare_temps:"Per-model temp",
    compare_temp_reset:"Reset",
    compare_pin:"Pin as reference",
    compare_unpin:"Unpin",
    compare_pinned:"Reference",
  },
  es: {
    nav_models:"Modelos", nav_status:"Estado", nav_config:"Configuración",
    nav_add:"Agregar Modelo", nav_help:"Ayuda", nav_active:"ACTIVOS", nav_none:"ninguno",
    connecting:"conectando...", offline:"servidor offline",
    models_title:"Modelos", models_sub:"Activá modelos y configurá sus API keys",
    suggestions_title:"Sugerencias", suggestions_sub:"Agregá una API key para empezar a usar estos modelos",
    stat_total:"Total", stat_active:"Activos", stat_free:"Gratuitos", stat_with_key:"Con Key",
    stat_models:"modelos", stat_parallel:"en paralelo", stat_no_cost:"sin costo", stat_configured:"configurados",
    loading_models:"Cargando modelos...",
    active:"activo", inactive:"inactivo", free_badge:"GRATIS", paid_badge:"PAGO",
    save_key:"Guardar", hide_key:"ocultar", show_key:"ver", change_key:"cambiar", delete_btn:"eliminar",
    key_placeholder:"API key...",
    status_title:"Estado", status_sub:"Estado del servidor y modelos activos", server_label:"Servidor",
    status_online:"● Online", status_offline_msg:"No se puede conectar al servidor.",
    status_offline_hint:"Asegurate de que Airvo esté corriendo con",
    field_version:"Versión", field_active:"Modelos activos", field_total:"Total modelos",
    field_config:"Archivo de config", field_endpoint:"Endpoint de chat",
    hw_label:"Recursos del Sistema", hw_sub:"RAM, GPU y modelos Ollama en memoria",
    hw_ram:"RAM", hw_used:"usada", hw_free:"libre",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"Modelos en memoria", hw_ollama_none:"No hay modelos cargados",
    hw_pressure_ok:"Memoria OK", hw_pressure_warning:"Presión de memoria", hw_pressure_critical:"Memoria crítica",
    hw_unload_btn:"Descargar", hw_unload_confirm:"¿Descargar este modelo de la memoria?",
    hw_unload_done:"Modelo descargado ✓", hw_unload_error:"Error al descargar",
    hw_no_psutil:"psutil no instalado", hw_no_psutil_hint:"Ejecutar: pip install airvo[hardware]",
    hw_suggestions:"Sugerencias", hw_loading:"Cargando info de hardware...",
    hw_refresh:"Actualizar",
    hw_cpu:"CPU", hw_cpu_cores:"n\u00facleos", hw_cpu_usage:"uso",
    hw_processes:"Principales consumidores de memoria", hw_proc_sub:"Procesos que m\u00e1s RAM consumen",
    hw_proc_show:"Ver procesos", hw_proc_hide:"Ocultar",
    disc_label:"Descubrir Modelos", disc_sub:"Explorá modelos compatibles según tu hardware",
    disc_local_tab:"Local (Ollama)", disc_cloud_tab:"Nube (OpenRouter)",
    disc_fits:"Entra en RAM", disc_too_large:"Necesita más RAM", disc_installed:"Instalado",
    disc_pull_cmd:"Comando de descarga", disc_add_btn:"Agregar a Airvo", disc_added:"Modelo agregado ✓",
    disc_add_error:"Error al agregar", disc_loading:"Cargando modelos...",
    disc_ollama_offline:"Ollama no disponible", disc_free_badge:"Gratis",
    disc_context:"contexto", disc_no_results:"No se encontraron modelos", disc_ram_required:"RAM requerida",
    disc_already_added:"Ya agregado", disc_open_section:"Descubrir",
    disc_local_explain:"Los modelos locales corren 100% en tu computadora via Ollama — sin API key, sin internet, sin costo. Completamente privado.",
    disc_local_how:"① Copiá el pull command de abajo → ejecutalo en tu terminal para descargar el modelo.  ② Hacé click en '+ Agregar a Airvo' para registrarlo.",
    disc_fits_detail:"Entra en tu RAM disponible — cargará y correrá sin problemas",
    disc_too_large_detail:"Necesita más RAM de la disponible — puede ser muy lento o fallar al cargar",
    disc_cloud_explain:"Los modelos cloud corren en los servidores de OpenRouter — potentes, sin GPU local. Requiere una API key gratuita de OpenRouter.",
    disc_cloud_how:"① Hacé click en '+ Agregar a Airvo'.  ② Andá a la página Modelos y configurá tu API key de OpenRouter.  ③ Activá el modelo.",
    continue_label:"Config de Continue.dev", continue_hint:"Pegá esto en tu config.yaml:",
    copy_config:"Copiar config", copied:"Copiado ✓",
    config_title:"Configuración", config_sub:"Modo, temperatura, memoria y preferencias",
    mode_label:"Modo Multi-Modelo", active_models_label:"Modelos Activos",
    no_active_models:"No hay modelos activos. Activá al menos uno en Modelos.",
    mode_parallel:"Paralelo", mode_parallel_desc:"Todos responden, ves todas las respuestas",
    mode_race:"Carrera", mode_race_desc:"El más rápido gana",
    mode_vote:"Votación", mode_vote_desc:"Consenso entre modelos",
    mode_review:"Revisión", mode_review_desc:"Uno genera, otro critica", mode_set:"Modo",
    tool_call_badge:"Modo Agent/Plan",
    tool_call_badge_tip:"La última request usó un solo modelo porque tu IDE envió tool calls (modo Agent o Plan). El modo multi-modelo solo funciona en modo Chat.",
    mode_note_tools:"⚡ Último request usó modo Agent/Plan — solo respondió 1 modelo. Esto es normal: los tool calls requieren conversación con un modelo. Cambiá a modo Chat en tu IDE para respuestas multi-modelo.",
    last_req_multi:"multi-modelo ✓", last_req_single:"modelo único",
    temp_label:"Temperatura",
    temp_hint_low:"0.0 — determinístico, preciso. Ideal para código.",
    temp_hint_mid:"0.5 — equilibrado. Funciona para la mayoría de tareas.",
    temp_hint_high:"1.0 — creativo, variado. Ideal para brainstorming.",
    temp_saved:"Temperatura guardada",
    maxtokens_label:"Máximo de Tokens",
    maxtokens_saved:"Máximo de tokens guardado",
    maxhistory_label:"Límite de Historial",
    maxhistory_sub:"Máx. mensajes por request. Más bajo = menos tokens enviados al modelo.",
    maxhistory_saved:"Límite guardado",
    memory_label:"Contexto del Proyecto",
    memory_sub:"Escribilo una vez, se inyecta en cada request. Ayuda a Airvo a entender tu stack sin repetirlo.",
    memory_enable:"Activar contexto del proyecto",
    memory_placeholder:"Ejemplo:\nTrabajo con FastAPI y Python 3.12.\nSiempre uso async/await y type hints.\nEs una API REST de e-commerce.\nDeploy en Railway con Docker.\nNo uses Redux, usamos Zustand.",
    memory_chars:"chars",
    memory_max:"máx",
    memory_saved:"Contexto guardado ✓",
    memory_too_long:"Contexto muy largo — reducilo",
    memory_tokens_warning:"⚠ Contexto grande — considerá reducirlo",
    rag_label:"Memoria Inteligente (RAG)",
    rag_sub:"Búsqueda semántica de tu código — fragmentos relevantes inyectados automáticamente. Funciona 100% local.",
    rag_enable:"Activar Memoria Inteligente",
    rag_warning_title:"Configuración única requerida",
    rag_warning_body:"Memoria Inteligente descarga un modelo de embeddings local (~90 MB) la primera vez. Tu código nunca sale de tu computadora.",
    rag_warning_confirm:"Activar de todas formas",
    rag_path_label:"Ruta del Proyecto",
    rag_path_placeholder:"/ruta/a/tu/proyecto",
    rag_index_btn:"Indexar Ahora",
    rag_indexing:"Indexando…",
    rag_status_files:"archivos indexados",
    rag_status_chunks:"fragmentos",
    rag_status_size:"MB índice",
    rag_status_last:"Último indexado",
    rag_status_never:"nunca",
    rag_clear_btn:"Limpiar Índice",
    rag_clear_confirm:"¿Eliminar el índice RAG completo? Esta acción no se puede deshacer.",
    rag_clear_done:"Índice limpiado",
    rag_index_done:"Indexación completa ✓",
    rag_index_error:"Error al indexar",
    rag_not_available:"Dependencias RAG no instaladas",
    rag_install_hint:"Ejecutar: pip install airvo[rag]",
    rag_advanced:"Configuración avanzada",
    rag_max_mb:"Tamaño máximo del índice (MB)",
    rag_max_kb:"Tamaño máximo por archivo (KB)",
    rag_top_k:"Resultados por solicitud",
    rag_max_inject_chars:"Máx. contexto inyectado (chars)",
    stats_label:"Estadísticas de Uso",
    stats_requests:"requests",
    stats_tokens:"tokens",
    stats_reset:"Resetear estadísticas",
    stats_reset_confirm:"¿Resetear todas las estadísticas?",
    stats_reset_done:"Estadísticas reseteadas",
    stats_empty:"Sin datos aún. ¡Empezá a programar!",
    stats_tab_title:"Analytics de Uso", stats_tab_sub:"Tokens usados, costo estimado, ranking de calidad y latencia por modelo",
    stats_section_tokens:"Tokens por Modelo", stats_section_cost:"Costo Estimado", stats_section_quality:"Ranking de Calidad",
    stats_section_latency:"Latencia Promedio", stats_section_daily:"Actividad Diaria — Últimos 7 Días",
    stats_copies:"copias", stats_free:"Gratis", stats_local:"Local",
    stats_latency_avg:"prom", stats_latency_unit:"s",
    stats_cost_note:"* Estimaciones basadas en precios típicos de API. El costo real puede variar.",
    stats_quality_note:"Basado en cuántas veces copiaste la respuesta de cada modelo",
    stats_no_history:"Sin datos diarios aún",
    stats_total_tokens:"Total de tokens", stats_total_requests:"Total de requests",
    add_title:"Agregar Modelo", add_sub:"Cualquier modelo compatible con LiteLLM",
    new_model:"Nuevo Modelo",
    field_id:"ID del Modelo", field_name:"Nombre", field_provider:"Proveedor",
    field_apikey:"API Key", field_baseurl:"Base URL", field_notes:"Notas",
    check_active:"Activar inmediatamente", add_btn:"Agregar Modelo",
    tip_id_title:"¿Qué es el ID del Modelo?", tip_id_body:"Identificador único con formato proveedor/nombre-modelo.", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"¿Qué es el Nombre?", tip_name_body:"Etiqueta amigable para el dashboard.", tip_name_examples:"Llama 3.3 70B\nGPT-4o\nMi Modelo Local",
    tip_provider_title:"¿Qué es el Proveedor?", tip_provider_body:"La empresa que aloja el modelo.", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"¿Dónde consigo la API Key?", tip_apikey_body:"Token secreto para autenticar. Dejalo vacío para modelos locales.", tip_apikey_examples:"Groq → console.groq.com (gratis)\nOpenAI → platform.openai.com\nOllama → dejar vacío",
    tip_baseurl_title:"¿Qué es la Base URL?", tip_baseurl_body:"Dirección del servidor. Solo para modelos locales.", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"Notas (opcional)", tip_notes_body:"Recordatorio personal.", tip_notes_examples:"Tier gratuito · 128k contexto\nMejor para código",
    tip_active_title:"¿Qué hace 'Activar inmediatamente'?", tip_active_body:"Marcado = modelo ON desde ya. Sin marcar = guardado pero inactivo.", tip_active_examples:"✓ Marcado → modelo ON\n✗ Sin marcar → guardado pero OFF",
    help_title:"Ayuda", help_sub:"Todo lo que necesitás para usar Airvo",
    help_what_title:"¿Qué es Airvo?", help_what_body:"Airvo es un servidor de IA local que conecta tu editor a cualquier modelo de IA simultáneamente.",
    help_adding_title:"Agregar Modelos — Campo a Campo",
    help_field_id_title:"ID del Modelo", help_field_id_desc:"Clave única: proveedor/nombre-modelo.",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\ngroq/llama-3.1-8b-instant\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"Nombre", help_field_name_desc:"Etiqueta amigable en el dashboard.",
    help_field_provider_title:"Proveedor", help_field_provider_desc:"El servicio que aloja el modelo.",
    help_field_apikey_title:"API Key", help_field_apikey_desc:"Token de autenticación. Dejalo vacío para modelos locales.",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"Base URL", help_field_baseurl_desc:"Solo para modelos locales.",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"Modos Multi-Modelo",
    help_mode_parallel:"Paralelo — Todos los modelos responden. Ves todas las respuestas.",
    help_mode_race:"Carrera — Gana el primero en responder.",
    help_mode_vote:"Votación — Se muestra el consenso.",
    help_mode_review:"Revisión — Uno genera, otro critica.",
    help_faq_title:"Preguntas Frecuentes",
    help_faq_1_q:"¿Necesito completar todos los campos?", help_faq_1_a:"No. Solo ID, Nombre y Proveedor son obligatorios.",
    help_faq_2_q:"¿Puedo usar cualquier modelo?", help_faq_2_a:"Sí — si LiteLLM lo soporta, Airvo lo soporta.",
    help_faq_3_q:"¿Dónde se guarda mi API key?", help_faq_3_a:"En ~/.airvo/models.json. Nunca sale de tu computadora.",
    help_faq_4_q:"¿Cómo uso Ollama?", help_faq_4_a:"Instalá Ollama, bajá un modelo, agregalo con ID: ollama/llama3, Base URL: http://localhost:11434.",
    help_faq_5_q:"¿Qué es el Contexto del Proyecto?", help_faq_5_a:"Una nota que se inyecta en cada request para que Airvo conozca tu stack sin que lo repitas.",
    help_faq_6_q:"¿El contexto consume tokens extra?", help_faq_6_a:"Sí, un pequeño monto fijo por request (~650 tokens máx). Es opcional y opt-in.",
    help_faq_7_q:"¿Qué es la Memoria Inteligente (RAG)?",
    help_faq_7_a:"La Memoria Inteligente indexa tu código localmente usando embeddings de IA. Antes de cada request, Airvo encuentra automáticamente los archivos más relevantes y los inyecta en el prompt.",
    help_faq_8_q:"¿Mi código se envía a la nube?",
    help_faq_8_a:"Nunca. El modelo de embeddings corre 100% en tu máquina. El índice se guarda en ~/.airvo/rag/ y tu código nunca sale de tu computadora.",
    help_rag_title:"Memoria Inteligente (RAG)",
    help_rag_what_title:"Qué hace",
    help_rag_what_body:"Memoria Inteligente escanea tu proyecto, divide archivos en fragmentos, genera embeddings vectoriales localmente y los guarda en ChromaDB. Cuando enviás un mensaje, Airvo busca los fragmentos más relevantes y los inyecta automáticamente en el contexto.",
    help_rag_setup_title:"Cómo activarla",
    help_rag_setup_steps:"1. Ir a Configuración → Memoria Inteligente\n2. Activar \"Activar Memoria Inteligente\" (descarga única de ~90 MB)\n3. Ingresar la ruta de tu proyecto\n4. Hacer clic en \"Indexar Ahora\" y esperar\n5. El badge 🧠 RAG aparece en el header cuando está activo",
    help_rag_privacy_title:"Privacidad y rendimiento",
    help_rag_privacy_body:"Todo corre localmente — embeddings, índice y búsqueda. No se envía ningún dato. La indexación es rápida para la mayoría de proyectos.",
    help_hw_title:"Gestor de Memoria",
    help_hw_body:"Uso de RAM y GPU en tiempo real en la página Estado. Muestra qué modelos de Ollama están cargados en memoria, avisa cuando la RAM está bajo presión (>75% AVISO, >90% CRÍTICO) y permite descargar modelos con un click — sin terminal.",
    help_hw_tip_title:"Cuándo usarlo",
    help_hw_tip_body:"Si Ollama está lento o no responde, revisá Estado — puede haber varios modelos grandes cargados simultáneamente. Descargá los que no usés para liberar RAM.",
    help_disc_title:"Descubrimiento de Modelos",
    help_disc_body:"En la página Modelos, expandí '🔭 Descubrir Modelos'. La pestaña Local muestra un catálogo de Ollama filtrado por lo que cabe en tu RAM — verde significa que entra, rojo que necesitás más RAM. La pestaña Cloud muestra modelos de OpenRouter con los gratuitos destacados.",
    help_disc_tip_title:"Agregar rápido",
    help_disc_tip_body:"Hacé click en '+ Agregar a Airvo' en cualquier modelo descubierto. Para modelos Ollama, copiá el comando pull que aparece y ejecutalo en tu terminal primero.",
    help_history_title:"Límite de Historial de Chat",
    help_history_body:"Airvo envía solo los últimos N mensajes de tu conversación por request (por defecto 10). Bajalo si superás los límites de tokens con APIs gratuitas — Groq gratuito permite 6k–12k tokens por minuto. El historial completo queda en tu editor; solo se recorta lo que se envía al modelo.",
    help_agent_title:"Modo Agente/Plan y Selección de Modelo",
    help_agent_what_title:"¿Qué es el modo Agente/Plan?",
    help_agent_what_body:"continue.dev tiene 3 modos: Chat (💬), Agente (⚡) y Plan (📋). En Agente y Plan, tu IDE envía definiciones de herramientas junto con tu mensaje — herramientas para leer archivos, escribir código, ejecutar comandos, etc.",
    help_agent_why_title:"¿Por qué solo un modelo responde en Agente/Plan?",
    help_agent_why_body:"Las llamadas a herramientas son una conversación multi-turno con estado: el modelo solicita una herramienta, el IDE la ejecuta y devuelve el resultado, el modelo solicita otra, y así. Este ida y vuelta requiere un único modelo para mantener el contexto. Varios modelos en paralelo implicarían ediciones de archivos conflictivas.",
    help_agent_select_title:"Elegir qué modelo maneja Agente/Plan",
    help_agent_select_body:"En Configuración → Modelo Agente/Plan, elegí cualquier modelo activo. Si está en Auto, Airvo usa el primer modelo activo de tu lista. Elegí tu modelo más capaz — es el que hará todo el trabajo agéntico.",
    help_agent_tip_title:"Consejo",
    help_agent_tip_body:"Usá el modo Chat para comparar respuestas de todos tus modelos. Usá Agente/Plan cuando necesitás que la IA edite archivos y ejecute comandos — ese siempre usa un solo modelo.",
    agent_model_label:"Modelo Agente/Plan",
    agent_model_sub:"Modelo usado para los modos Agente y Plan en tu IDE. Estos modos usan llamadas a herramientas y requieren un único modelo.",
    agent_model_saved:"Modelo agente guardado ✓",
    agent_model_auto:"Auto (primer modelo activo)",
    help_trouble_title:"Solución de Problemas",
    help_trouble_1_q:"Error de límite de velocidad / tokens demasiado grandes de Groq u otro proveedor",
    help_trouble_1_a:"Andá a Configuración → Límite de Historial y ponelo en 4 o 6 mensajes. Si Smart Memory (RAG) está activado, bajá también el límite de contexto RAG a 1000–2000 caracteres.",
    help_trouble_2_q:"No se puede conectar al servidor / el dashboard muestra servidor offline",
    help_trouble_2_a:"Asegurate de que Airvo esté corriendo: abrí una terminal y ejecutá 'airvo start'. Verificá que el puerto en tu .env (por defecto 8765) coincida con la configuración de la extensión.",
    help_trouble_3_q:"Un modelo muestra error / ícono rojo",
    help_trouble_3_a:"Revisá la API key de ese modelo en la página Modelos. Para modelos Ollama, asegurate de que Ollama esté corriendo ('ollama serve') y el modelo esté descargado ('ollama pull nombre').",
    help_trouble_4_q:"Smart Memory (RAG) no encuentra mi código / la búsqueda falla",
    help_trouble_4_a:"Andá a Configuración → Smart Memory → hacé click en 'Indexar Ahora'. Confirmá que la ruta apunta a la raíz de tu proyecto. Luego de agregar archivos, reindexá. Top K en 1–2 es suficiente para la mayoría.",
    help_trouble_5_q:"Descubrimiento de Modelos no muestra modelos Ollama como instalados",
    help_trouble_5_a:"Ollama puede no estar corriendo. Inicialo con 'ollama serve'. El catálogo siempre carga — la insignia Instalado requiere que Ollama responda en localhost:11434.",
    help_compare_title:"Tab Compare — Guía de funciones",
    help_compare_intro:"El tab Compare es la función más poderosa de Airvo. Te permite enviar el mismo prompt a todos tus modelos activos al mismo tiempo, en tiempo real, y analizar los resultados con herramientas visuales que no existen en ningún otro cliente de IA.",
    help_compare_streaming_title:"⊞ Streaming paralelo en tiempo real",
    help_compare_streaming_body:"Cuando escribís un prompt y hacés click en Comparar (o presionás Ctrl+Enter), todos los modelos activos empiezan a generar al mismo tiempo. Ves los tokens de cada modelo aparecer en vivo, uno al lado del otro. Las badges ⚡ Más rápido y 📝 Más tokens se asignan automáticamente cuando termina cada stream.",
    help_compare_diff_title:"▨ Modos diff — Palabras y Frases",
    help_compare_diff_body:"El diff de palabras resalta cada palabra que aparece en la respuesta de un modelo pero no en los demás. El diff de frases compara oraciones completas. Ambos modos se calculan en el navegador, sin llamadas al servidor.",
    help_compare_pin_title:"📌 Anclar como referencia",
    help_compare_pin_body:"Hacé click en 📌 en cualquier card para fijar ese modelo como baseline. En modo diff, todos los demás se comparan contra el anclado — ideal para usar GPT-4o como estándar y ver exactamente dónde diverge un modelo gratuito.",
    help_compare_similarity_title:"Similarity score (Jaccard)",
    help_compare_similarity_body:"Al final de la barra de Performance verás porcentajes de similitud entre pares de modelos. Usa similitud Jaccard sobre el conjunto de palabras de cada respuesta. Verde ≥ 60% significa que los modelos coinciden. Rojo < 35% significa respuestas fundamentalmente distintas.",
    help_compare_templates_title:"💾 Prompt templates",
    help_compare_templates_body:"Hacé click en Guardar junto al textarea para almacenar el prompt actual. Los templates guardados aparecen como chips clickeables sobre el input. Hasta 10 templates se guardan en el navegador. Útil para benchmarks repetidos.",
    help_compare_temps_title:"🌡 Temperatura por modelo",
    help_compare_temps_body:"Hacé click en 🌡 para expandir sliders individuales de temperatura para cada modelo activo. Podés comparar el mismo modelo a distintos niveles de creatividad en la misma corrida. Los valores con * usan la temperatura global de Configuración.",
    help_compare_history_title:"Historial y Re-run",
    help_compare_history_body:"Airvo guarda las últimas 10 comparaciones en ~/.airvo/compare_history.json — sobreviven reinicios del servidor. Navegá con las flechas ← →. Hacé click en 🔁 Re-run para reenviar ese prompt exacto. Usá 🗑 Borrar historial para limpiar todo.",
    help_compare_export_title:"📄 Exportar a Markdown",
    help_compare_export_body:"Exporta la comparación completa como .md incluyendo el prompt, la respuesta de cada modelo, tiempo de respuesta, cantidad de tokens y el ID exacto del modelo (proveedor/versión).",
    help_compare_sort_title:"Ordenar y Focus",
    help_compare_sort_body:"Ordená las cards por ⚡ Velocidad o 📝 Tokens. Usá ⛶ Focus para expandir una sola card al ancho completo para leer con más comodidad.",
    help_stats_title:"Stats — Análisis de Uso",
    help_stats_intro:"La pestaña Stats registra tu uso real en todos los modelos — tokens consumidos, costo estimado de API, calidad de respuesta (basado en lo que copiás) y tendencias de latencia. Todos los datos se guardan localmente en ~/.airvo/stats.json.",
    help_stats_tokens_title:"📊 Tokens por Modelo",
    help_stats_tokens_body:"Barras horizontales que muestran los tokens totales generados por modelo desde el último reset. Útil para entender en qué modelos te apoyás más.",
    help_stats_cost_title:"💰 Costo Estimado",
    help_stats_cost_body:"Gasto estimado de API por modelo basado en precios típicos (ej. OpenAI ~$5/1M tokens, Anthropic ~$9/1M). Los modelos locales (Ollama, LM Studio) siempre muestran Gratis. Son estimaciones — consultá tu dashboard del proveedor para facturación exacta.",
    help_stats_quality_title:"⭐ Ranking de Calidad",
    help_stats_quality_body:"Modelos rankeados por cuántas veces hiciste clic en Copiar en sus respuestas. Es una señal implícita de calidad — si copiás la respuesta de un modelo, fue útil. Las medallas 🥇🥈🥉 van al top 3.",
    help_stats_latency_title:"⚡ Latencia Promedio",
    help_stats_latency_body:"Tiempo de respuesta promedio por modelo en todas las solicitudes registradas. Verde = más rápido relativo a los demás, amarillo = moderado, rojo = más lento. Útil para elegir el modelo correcto cuando la velocidad importa.",
    help_stats_daily_title:"📅 Actividad Diaria",
    help_stats_daily_body:"Barras sparkline que muestran el uso de tokens por día en los últimos 7 días. Ayuda a detectar patrones — ej. qué modelos usás más en días de mucho código.",
    config_context_memory_section:"Contexto & Memoria",
    toast_activated:"Modelo activado", toast_deactivated:"Modelo desactivado",
    toast_key_saved:"API key guardada ✓", toast_key_error:"Ingresá una API key válida",
    toast_deleted:"Modelo eliminado", toast_added:"Modelo agregado ✓",
    toast_error_toggle:"Error al actualizar", toast_error_key:"Error al guardar key",
    toast_error_delete:"Error al eliminar", toast_error_add:"Error al agregar modelo",
    confirm_delete:"¿Eliminar este modelo?",
    toast_limit:"Airvo soporta hasta 3 modelos activos. Desactivá uno para activar otro.",
    stat_v1_limit:"máx 3 activos",
    auto_detected:"Detectado automáticamente",
    auto_local_hint:"Modelo local — sin costo de API",
    auto_cloud_hint:"Modelo cloud — uso facturado por el proveedor",
    nav_compare:"Comparar", nav_stats:"Stats", nav_bench:"Benchmarks",
    bench_title:"Benchmarks", bench_sub:"Prompts estandarizados para medir y comparar tus modelos",
    bench_suite_speed:"Test de Velocidad", bench_suite_coding:"Programación", bench_suite_reasoning:"Razonamiento", bench_suite_creative:"Creatividad",
    bench_run:"Ejecutar Benchmark", bench_running:"Ejecutando",
    bench_no_active:"Se necesitan al menos 2 modelos activos para ejecutar benchmarks.",
    bench_no_results:"Aún no hay resultados — seleccioná un suite y hacé clic en Ejecutar Benchmark.",
    bench_leaderboard:"Ranking General", bench_results:"Resultados por Prompt",
    bench_clear:"Limpiar Historial", bench_history_title:"Historial de Ejecuciones",
    compare_title:"Comparación de Respuestas",
    compare_sub:"Últimas respuestas multi-modelo lado a lado — copiá y elegí la mejor",
    compare_empty:"Sin respuestas multi-modelo todavía",
    compare_empty_hint:"Usá modo Paralelo, Voto o Revisión con 2+ modelos activos, luego enviá un mensaje desde tu IDE",
    compare_refresh:"Actualizar",
    compare_mode:"Modo",
    compare_prompt:"Prompt",
    compare_copy:"Copiar",
    compare_copied:"Copiado ✓",
    compare_tokens:"tokens",
    compare_error_badge:"Error",
    compare_at:"Última actualización",
    compare_auto:"Auto",
    compare_elapsed:"s",
    compare_history_label:"Historial",
    compare_of:"de",
    compare_export:"Exportar MD",
    compare_export_done:"Exportado ✓",
    compare_fastest:"Más rápido",
    compare_most_tokens:"Más tokens",
    compare_expand:"Foco",
    compare_collapse:"Ver todos",
    compare_copy_prompt:"Copiar prompt",
    compare_stats:"Rendimiento",
    compare_time:"Tiempo",
    compare_tok_s:"tok/s",
    compare_ask:"Preguntar a los modelos",
    compare_send:"⊞ Comparar",
    compare_sending:"Ejecutando…",
    compare_send_placeholder:"Escribí un prompt para comparar todos los modelos activos… (Ctrl+Enter)",
    compare_sort_default:"Predeterminado",
    compare_sort_speed:"⚡ Velocidad",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"Necesitás 2+ modelos activos para comparar",
    compare_diff:"Diff",
    compare_diff_tip:"Resaltar palabras únicas de cada modelo",
    compare_streaming:"Streaming…",
    compare_stream_done:"Listo",
    compare_rerun:"🔁 Repetir",
    compare_clear:"🗑 Borrar historial",
    compare_clear_confirm:"¿Borrar todo el historial? Esta acción no se puede deshacer.",
    compare_cleared:"Historial borrado",
    compare_template_save:"💾 Guardar",
    compare_template_saved:"Plantilla guardada ✓",
    compare_templates:"Prompts guardados",
    compare_similarity:"Similitud",
    compare_diff_word:"Palabras",
    compare_diff_sentence:"Frases",
    compare_temps:"Temp. por modelo",
    compare_temp_reset:"Restablecer",
    compare_pin:"Anclar como referencia",
    compare_unpin:"Desanclar",
    compare_pinned:"Referencia",
  },
  fr: {
    nav_models:"Modèles", nav_status:"Statut", nav_config:"Configuration", nav_add:"Ajouter Modèle", nav_help:"Aide", nav_active:"ACTIFS", nav_none:"aucun",
    connecting:"connexion...", offline:"serveur hors ligne",
    models_title:"Modèles", models_sub:"Activez les modèles et configurez leurs clés API",
    suggestions_title:"Suggestions", suggestions_sub:"Ajoutez une clé API pour utiliser ces modèles",
    stat_total:"Total", stat_active:"Actifs", stat_free:"Gratuits", stat_with_key:"Avec Clé",
    stat_models:"modèles", stat_parallel:"en parallèle", stat_no_cost:"sans coût", stat_configured:"configurés",
    loading_models:"Chargement des modèles...",
    active:"actif", inactive:"inactif", free_badge:"GRATUIT", paid_badge:"PAYANT",
    save_key:"Enregistrer", hide_key:"masquer", show_key:"afficher", change_key:"modifier", delete_btn:"supprimer",
    key_placeholder:"Clé API...",
    status_title:"Statut", status_sub:"État du serveur et modèles actifs", server_label:"Serveur",
    status_online:"● En ligne", status_offline_msg:"Impossible de se connecter au serveur.",
    status_offline_hint:"Assurez-vous qu'Airvo est lancé avec",
    field_version:"Version", field_active:"Modèles actifs", field_total:"Total modèles",
    field_config:"Fichier de config", field_endpoint:"Endpoint de chat",
    hw_label:"Ressources Système", hw_sub:"RAM, GPU et modèles Ollama en mémoire",
    hw_ram:"RAM", hw_used:"utilisée", hw_free:"libre",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"Modèles en mémoire", hw_ollama_none:"Aucun modèle chargé",
    hw_pressure_ok:"Mémoire OK", hw_pressure_warning:"Pression mémoire", hw_pressure_critical:"Mémoire critique",
    hw_unload_btn:"Décharger", hw_unload_confirm:"Décharger ce modèle de la mémoire ?",
    hw_unload_done:"Modèle déchargé ✓", hw_unload_error:"Échec du déchargement",
    hw_no_psutil:"psutil non installé", hw_no_psutil_hint:"Exécuter : pip install airvo[hardware]",
    hw_suggestions:"Suggestions", hw_loading:"Chargement des infos matérielles...",
    hw_refresh:"Actualiser",
    hw_cpu:"CPU", hw_cpu_cores:"cœurs", hw_cpu_usage:"utilisation",
    hw_processes:"Principaux consommateurs de mémoire", hw_proc_sub:"Processus utilisant le plus de RAM",
    hw_proc_show:"Afficher les processus", hw_proc_hide:"Masquer",
    disc_label:"Découvrir des Modèles", disc_sub:"Parcourez les modèles compatibles avec votre matériel",
    disc_local_tab:"Local (Ollama)", disc_cloud_tab:"Cloud (OpenRouter)",
    disc_fits:"Compatible RAM", disc_too_large:"Trop grand pour la RAM", disc_installed:"Installé",
    disc_pull_cmd:"Commande de téléchargement", disc_add_btn:"Ajouter à Airvo", disc_added:"Modèle ajouté ✓",
    disc_add_error:"Échec de l'ajout", disc_loading:"Chargement des modèles...",
    disc_ollama_offline:"Ollama hors ligne", disc_free_badge:"Gratuit",
    disc_context:"contexte", disc_no_results:"Aucun modèle trouvé", disc_ram_required:"RAM requise",
    disc_already_added:"Déjà ajouté", disc_open_section:"Découvrir",
    disc_local_explain:"Les modèles locaux fonctionnent à 100% sur votre ordinateur via Ollama — aucune clé API, pas d'internet, gratuit. Complètement privé.",
    disc_local_how:"① Copiez la commande pull ci-dessous → exécutez-la dans votre terminal pour télécharger le modèle.  ② Cliquez '+ Ajouter à Airvo' pour l'enregistrer.",
    disc_fits_detail:"Tient dans votre RAM disponible — se chargera et fonctionnera sans problème",
    disc_too_large_detail:"Nécessite plus de RAM que disponible — peut être très lent ou ne pas se charger",
    disc_cloud_explain:"Les modèles cloud fonctionnent sur les serveurs d'OpenRouter — puissants, sans GPU local. Nécessite une clé API OpenRouter gratuite.",
    disc_cloud_how:"① Cliquez '+ Ajouter à Airvo'.  ② Allez dans la page Modèles et configurez votre clé OpenRouter.  ③ Activez le modèle.",
    continue_label:"Config Continue.dev", continue_hint:"Ajoutez ceci à votre config.yaml :",
    copy_config:"Copier la config", copied:"Copié ✓",
    config_title:"Configuration", config_sub:"Mode, température, mémoire et préférences",
    mode_label:"Mode Multi-Modèle", active_models_label:"Modèles Actifs",
    no_active_models:"Aucun modèle actif. Activez-en au moins un dans Modèles.",
    mode_parallel:"Parallèle", mode_parallel_desc:"Tous les modèles répondent, vous voyez toutes les réponses",
    mode_race:"Course", mode_race_desc:"Le modèle le plus rapide gagne",
    mode_vote:"Vote", mode_vote_desc:"Consensus entre les modèles",
    mode_review:"Révision", mode_review_desc:"Un génère, un autre critique", mode_set:"Mode",
    tool_call_badge:"Mode Agent/Plan",
    tool_call_badge_tip:"La dernière requête a utilisé un seul modèle car votre IDE a envoyé des tool calls (mode Agent ou Plan). Le multi-modèle ne fonctionne qu'en mode Chat.",
    mode_note_tools:"⚡ Dernière requête en mode Agent/Plan — seulement 1 modèle a répondu. C'est normal : les tool calls nécessitent une conversation mono-modèle. Passez en mode Chat dans votre IDE pour des réponses multi-modèles.",
    last_req_multi:"multi-modèle ✓", last_req_single:"modèle unique",
    temp_label:"Température",
    temp_hint_low:"0.0 — déterministe, précis. Idéal pour le code.",
    temp_hint_mid:"0.5 — équilibré. Convient à la plupart des tâches.",
    temp_hint_high:"1.0 — créatif, varié. Idéal pour le brainstorming.",
    temp_saved:"Température enregistrée",
    maxtokens_label:"Tokens Maximum",
    maxtokens_saved:"Tokens maximum enregistrés",
    maxhistory_label:"Limite d'Historique",
    maxhistory_sub:"Nb max de messages par requête. Plus bas = moins de tokens envoyés.",
    maxhistory_saved:"Limite enregistrée",
    memory_label:"Contexte du Projet",
    memory_sub:"Écrivez une fois, injecté dans chaque requête. Aide Airvo à comprendre votre stack.",
    memory_enable:"Activer le contexte du projet",
    memory_placeholder:"Exemple :\nJ'utilise FastAPI et Python 3.12.\nToujours async/await et annotations de type.\nAPI REST e-commerce.\nDéploiement Railway avec Docker.",
    memory_chars:"caractères", memory_max:"max",
    memory_saved:"Contexte enregistré ✓",
    memory_too_long:"Contexte trop long — réduisez-le",
    memory_tokens_warning:"⚠ Contexte volumineux — envisagez de le réduire",
    rag_label:"Mémoire Intelligente (RAG)",
    rag_sub:"Recherche sémantique dans votre code — les extraits pertinents sont injectés automatiquement. 100% local.",
    rag_enable:"Activer la Mémoire Intelligente",
    rag_warning_title:"Configuration unique requise",
    rag_warning_body:"La Mémoire Intelligente télécharge un modèle d'embeddings local (~90 Mo) au premier démarrage. Votre code ne quitte jamais votre ordinateur.",
    rag_warning_confirm:"Activer quand même",
    rag_path_label:"Chemin du Projet",
    rag_path_placeholder:"/chemin/vers/votre/projet",
    rag_index_btn:"Indexer Maintenant",
    rag_indexing:"Indexation…",
    rag_status_files:"fichiers indexés",
    rag_status_chunks:"fragments",
    rag_status_size:"Mo d'index",
    rag_status_last:"Dernière indexation",
    rag_status_never:"jamais",
    rag_clear_btn:"Effacer l'Index",
    rag_clear_confirm:"Supprimer l'index RAG entier ? Cette action est irréversible.",
    rag_clear_done:"Index effacé",
    rag_index_done:"Indexation terminée ✓",
    rag_index_error:"Échec de l'indexation",
    rag_not_available:"Dépendances RAG non installées",
    rag_install_hint:"Exécuter : pip install airvo[rag]",
    rag_advanced:"Paramètres avancés",
    rag_max_mb:"Taille max de l'index (Mo)",
    rag_max_kb:"Taille max par fichier (Ko)",
    rag_top_k:"Résultats par requête",
    rag_max_inject_chars:"Contexte max injecté (chars)",
    stats_label:"Statistiques d'Utilisation",
    stats_requests:"requêtes", stats_tokens:"tokens",
    stats_reset:"Réinitialiser les stats",
    stats_reset_confirm:"Réinitialiser toutes les statistiques ?",
    stats_reset_done:"Statistiques réinitialisées",
    stats_empty:"Aucune donnée pour l'instant. Commencez à coder !",
    stats_tab_title:"Analytiques d'Utilisation", stats_tab_sub:"Tokens utilisés, coût estimé, classement qualité et latence par modèle",
    stats_section_tokens:"Tokens par Modèle", stats_section_cost:"Coût Estimé", stats_section_quality:"Classement Qualité",
    stats_section_latency:"Latence Moyenne", stats_section_daily:"Activité Quotidienne — 7 Derniers Jours",
    stats_copies:"copies", stats_free:"Gratuit", stats_local:"Local",
    stats_latency_avg:"moy", stats_latency_unit:"s",
    stats_cost_note:"* Estimations basées sur les tarifs API typiques. Les coûts réels peuvent varier.",
    stats_quality_note:"Basé sur le nombre de fois que vous avez copié la réponse",
    stats_no_history:"Pas encore de données quotidiennes",
    stats_total_tokens:"Total tokens", stats_total_requests:"Total requêtes",
    add_title:"Ajouter un Modèle", add_sub:"Tout modèle compatible LiteLLM — n'importe quel fournisseur",
    new_model:"Nouveau Modèle",
    field_id:"ID du Modèle", field_name:"Nom affiché", field_provider:"Fournisseur",
    field_apikey:"Clé API", field_baseurl:"URL de base", field_notes:"Notes",
    check_active:"Activer immédiatement", add_btn:"Ajouter le Modèle",
    tip_id_title:"Qu'est-ce que l'ID du Modèle ?", tip_id_body:"Identifiant unique au format fournisseur/nom-modèle.", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"Qu'est-ce que le Nom affiché ?", tip_name_body:"Étiquette conviviale affichée dans le tableau de bord.", tip_name_examples:"Llama 3.3 70B\nGPT-4o\nMon Modèle Local",
    tip_provider_title:"Qu'est-ce que le Fournisseur ?", tip_provider_body:"La société qui héberge le modèle.", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"Où obtenir la Clé API ?", tip_apikey_body:"Jeton secret d'authentification. Laissez vide pour les modèles locaux.", tip_apikey_examples:"Groq → console.groq.com (gratuit)\nOpenAI → platform.openai.com\nOllama → laisser vide",
    tip_baseurl_title:"Qu'est-ce que l'URL de base ?", tip_baseurl_body:"Adresse du serveur. Uniquement pour les modèles locaux.", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"Notes (optionnel)", tip_notes_body:"Rappel personnel.", tip_notes_examples:"Tier gratuit · 128k contexte\nIdéal pour le code",
    tip_active_title:"Que signifie 'Activer immédiatement' ?", tip_active_body:"Coché = modèle actif immédiatement. Non coché = sauvegardé mais inactif.", tip_active_examples:"✓ Coché → modèle ON\n✗ Non coché → sauvegardé mais OFF",
    help_title:"Aide", help_sub:"Tout ce dont vous avez besoin pour utiliser Airvo",
    help_what_title:"Qu'est-ce qu'Airvo ?", help_what_body:"Airvo est un serveur IA local qui connecte votre éditeur à n'importe quel modèle d'IA simultanément.",
    help_adding_title:"Ajouter des Modèles — Champ par Champ",
    help_field_id_title:"ID du Modèle", help_field_id_desc:"Clé unique : fournisseur/nom-modèle.",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"Nom affiché", help_field_name_desc:"Étiquette conviviale dans le tableau de bord.",
    help_field_provider_title:"Fournisseur", help_field_provider_desc:"Le service qui héberge le modèle.",
    help_field_apikey_title:"Clé API", help_field_apikey_desc:"Jeton d'authentification. Laissez vide pour les modèles locaux.",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"URL de base", help_field_baseurl_desc:"Uniquement pour les modèles locaux.",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"Modes Multi-Modèle",
    help_mode_parallel:"Parallèle — Tous les modèles répondent. Vous voyez toutes les réponses.",
    help_mode_race:"Course — Le premier à répondre gagne.",
    help_mode_vote:"Vote — La réponse consensuelle est affichée.",
    help_mode_review:"Révision — Un génère, un autre critique.",
    help_faq_title:"FAQ",
    help_faq_1_q:"Dois-je remplir tous les champs ?", help_faq_1_a:"Non. Seuls l'ID, le Nom et le Fournisseur sont obligatoires.",
    help_faq_2_q:"Puis-je utiliser n'importe quel modèle ?", help_faq_2_a:"Oui — si LiteLLM le supporte, Airvo le supporte.",
    help_faq_3_q:"Où est stockée ma clé API ?", help_faq_3_a:"Dans ~/.airvo/models.json. Elle ne quitte jamais votre ordinateur.",
    help_faq_4_q:"Comment utiliser Ollama ?", help_faq_4_a:"Installez Ollama, téléchargez un modèle, ajoutez-le avec ID: ollama/llama3, URL de base: http://localhost:11434.",
    help_faq_5_q:"Qu'est-ce que le Contexte du Projet ?", help_faq_5_a:"Une note injectée dans chaque requête pour qu'Airvo connaisse votre stack.",
    help_faq_6_q:"Le contexte consomme-t-il des tokens supplémentaires ?", help_faq_6_a:"Oui, un petit montant fixe par requête (~650 tokens max). C'est optionnel.",
    help_faq_7_q:"Qu'est-ce que la Mémoire Intelligente (RAG) ?",
    help_faq_7_a:"La Mémoire Intelligente indexe votre code localement avec des embeddings IA. Avant chaque requête, Airvo trouve automatiquement les fichiers les plus pertinents et les injecte dans le prompt.",
    help_faq_8_q:"Mon code est-il envoyé dans le cloud ?",
    help_faq_8_a:"Jamais. Le modèle d'embeddings tourne 100% sur votre machine. L'index est stocké dans ~/.airvo/rag/ et votre code ne quitte jamais votre ordinateur.",
    help_rag_title:"Mémoire Intelligente (RAG)",
    help_rag_what_title:"Ce qu'elle fait",
    help_rag_what_body:"La Mémoire Intelligente analyse votre projet, découpe les fichiers en fragments, génère des embeddings vectoriels localement et les stocke dans ChromaDB. À chaque message, Airvo récupère les fragments les plus pertinents et les injecte automatiquement dans le contexte.",
    help_rag_setup_title:"Comment l'activer",
    help_rag_setup_steps:"1. Aller dans Configuration → Mémoire Intelligente\n2. Activer \"Activer la Mémoire Intelligente\" (téléchargement unique ~90 Mo)\n3. Entrer le chemin de votre projet\n4. Cliquer sur \"Indexer Maintenant\" et attendre\n5. Le badge 🧠 RAG apparaît dans l'en-tête quand c'est actif",
    help_rag_privacy_title:"Confidentialité et performance",
    help_rag_privacy_body:"Tout fonctionne localement — embeddings, index et recherche. Aucune donnée n'est envoyée. L'indexation est rapide pour la plupart des projets.",
    help_hw_title:"Gestionnaire de Mémoire",
    help_hw_body:"Utilisation RAM et GPU en temps réel sur la page Statut. Affiche les modèles Ollama chargés en mémoire, avertit quand la RAM est sous pression (>75% AVERTISSEMENT, >90% CRITIQUE) et permet de décharger des modèles en un clic — sans terminal.",
    help_hw_tip_title:"Quand l'utiliser",
    help_hw_tip_body:"Si Ollama est lent ou ne répond pas, vérifiez Statut — plusieurs grands modèles sont peut-être chargés simultanément. Déchargez ceux inutilisés pour libérer de la RAM.",
    help_disc_title:"Découverte de Modèles",
    help_disc_body:"Dans la page Modèles, développez '🔭 Découvrir les Modèles'. L'onglet Local affiche un catalogue Ollama filtré par ce qui tient dans votre RAM — vert signifie que ça rentre, rouge que vous avez besoin de plus de RAM. L'onglet Cloud affiche les modèles OpenRouter avec les gratuits mis en évidence.",
    help_disc_tip_title:"Ajout rapide",
    help_disc_tip_body:"Cliquez sur '+ Ajouter à Airvo' sur n'importe quel modèle découvert. Pour les modèles Ollama, copiez la commande pull affichée et exécutez-la dans votre terminal d'abord.",
    help_history_title:"Limite d'Historique de Chat",
    help_history_body:"Airvo n'envoie que les N derniers messages de votre conversation par requête (défaut 10). Réduisez si vous dépassez les limites de tokens avec les APIs gratuites — Groq gratuit permet 6k–12k tokens/min. L'historique complet reste dans votre éditeur ; seul ce qui est envoyé au modèle est tronqué.",
    help_agent_title:"Mode Agent/Plan et Sélection du Modèle",
    help_agent_what_title:"Qu'est-ce que le mode Agent/Plan ?",
    help_agent_what_body:"continue.dev a 3 modes : Chat (💬), Agent (⚡) et Plan (📋). En mode Agent et Plan, votre IDE envoie des définitions d'outils avec votre message — outils pour lire des fichiers, écrire du code, exécuter des commandes, etc.",
    help_agent_why_title:"Pourquoi un seul modèle répond en Agent/Plan ?",
    help_agent_why_body:"Les appels d'outils forment une conversation multi-tours avec état : le modèle demande un outil, l'IDE l'exécute et renvoie le résultat, le modèle en demande un autre, etc. Cet aller-retour exige un seul modèle pour maintenir le contexte. Plusieurs modèles en parallèle entraîneraient des modifications de fichiers conflictuelles.",
    help_agent_select_title:"Choisir quel modèle gère Agent/Plan",
    help_agent_select_body:"Dans Configuration → Modèle Agent/Plan, choisissez n'importe lequel de vos modèles actifs. En Auto, Airvo utilise le premier modèle actif de votre liste. Choisissez votre modèle le plus capable — il fera tout le travail agentique.",
    help_agent_tip_title:"Conseil",
    help_agent_tip_body:"Utilisez le mode Chat pour comparer les réponses de tous vos modèles. Utilisez Agent/Plan quand vous avez besoin que l'IA édite vraiment des fichiers et exécute des commandes — cela utilise toujours un seul modèle.",
    agent_model_label:"Modèle Agent/Plan",
    agent_model_sub:"Modèle utilisé pour les modes Agent et Plan dans votre IDE. Ces modes utilisent des appels d'outils et nécessitent un seul modèle.",
    agent_model_saved:"Modèle agent sauvegardé ✓",
    agent_model_auto:"Auto (premier modèle actif)",
    help_trouble_title:"Dépannage",
    help_trouble_1_q:"Erreur de limite de débit / tokens trop grands de Groq ou autre fournisseur",
    help_trouble_1_a:"Allez dans Configuration → Limite d'Historique et mettez 4 ou 6 messages. Si Smart Memory (RAG) est activé, réduisez aussi la limite de contexte RAG à 1000–2000 caractères.",
    help_trouble_2_q:"Impossible de se connecter au serveur / le tableau de bord affiche serveur hors ligne",
    help_trouble_2_a:"Assurez-vous qu'Airvo est lancé : ouvrez un terminal et exécutez 'airvo start'. Vérifiez que le port dans votre fichier .env (défaut 8765) correspond aux paramètres de l'extension.",
    help_trouble_3_q:"Un modèle affiche une erreur / icône rouge",
    help_trouble_3_a:"Vérifiez la clé API de ce modèle dans la page Modèles. Pour les modèles Ollama, assurez-vous qu'Ollama est lancé ('ollama serve') et que le modèle est téléchargé ('ollama pull nom').",
    help_trouble_4_q:"Smart Memory (RAG) ne trouve pas mon code / la recherche échoue",
    help_trouble_4_a:"Allez dans Configuration → Smart Memory → cliquez sur 'Indexer Maintenant'. Confirmez que le chemin pointe vers la racine de votre projet. Après avoir ajouté des fichiers, ré-indexez. Top K à 1–2 suffit pour la plupart des projets.",
    help_trouble_5_q:"La Découverte de Modèles ne montre pas les modèles Ollama comme installés",
    help_trouble_5_a:"Ollama n'est peut-être pas lancé. Démarrez-le avec 'ollama serve'. Le catalogue se charge toujours — le badge Installé nécessite qu'Ollama réponde sur localhost:11434.",
    help_compare_title:"Onglet Compare — Guide des fonctionnalités",
    help_compare_intro:"L'onglet Compare est la fonctionnalité la plus puissante d'Airvo. Il vous permet d'envoyer le même prompt à tous vos modèles actifs simultanément, en temps réel, et d'analyser les résultats avec des outils visuels introuvables dans tout autre client IA.",
    help_compare_streaming_title:"⊞ Streaming parallèle en temps réel",
    help_compare_streaming_body:"Quand vous tapez un prompt et cliquez sur Comparer (ou appuyez sur Ctrl+Entrée), tous les modèles actifs commencent à générer en même temps. Vous voyez les tokens de chaque modèle apparaître en direct, côte à côte.",
    help_compare_diff_title:"▨ Modes diff — Mots & Phrases",
    help_compare_diff_body:"Le diff de mots surligne chaque mot présent dans la réponse d'un modèle mais pas dans les autres. Le diff de phrases compare des phrases entières. Les deux modes sont calculés dans le navigateur, sans appel serveur.",
    help_compare_pin_title:"📌 Épingler comme référence",
    help_compare_pin_body:"Cliquez sur 📌 sur n'importe quelle carte pour définir ce modèle comme référence. En mode diff, tous les autres sont comparés au modèle épinglé.",
    help_compare_similarity_title:"Score de similarité (Jaccard)",
    help_compare_similarity_body:"En bas de la barre Performance, vous verrez des pourcentages de similarité par paire de modèles. Vert ≥ 60% signifie que les modèles sont d'accord. Rouge < 35% indique des réponses fondamentalement différentes.",
    help_compare_templates_title:"💾 Modèles de prompts",
    help_compare_templates_body:"Cliquez sur Sauvegarder à côté de la zone de texte pour mémoriser le prompt actuel. Les modèles sauvegardés apparaissent comme des chips cliquables. Jusqu'à 10 modèles sont stockés localement dans le navigateur.",
    help_compare_temps_title:"🌡 Température par modèle",
    help_compare_temps_body:"Cliquez sur 🌡 pour afficher des curseurs de température individuels pour chaque modèle actif. Les valeurs avec * utilisent la température globale de la Configuration.",
    help_compare_history_title:"Historique & Re-run",
    help_compare_history_body:"Airvo conserve les 10 dernières comparaisons dans ~/.airvo/compare_history.json. Naviguez avec les flèches ← →. Cliquez sur 🔁 Re-run pour renvoyer le même prompt. Utilisez 🗑 Effacer pour tout supprimer.",
    help_compare_export_title:"📄 Exporter en Markdown",
    help_compare_export_body:"Exporte la comparaison complète en .md incluant le prompt, la réponse de chaque modèle, le temps de réponse, le nombre de tokens et l'ID exact du modèle.",
    help_compare_sort_title:"Trier & Focus",
    help_compare_sort_body:"Triez les cartes par ⚡ Vitesse ou 📝 Tokens. Utilisez ⛶ Focus pour agrandir une seule carte.",
    help_stats_title:"Stats — Analyses d'Utilisation",
    help_stats_intro:"L'onglet Stats suit votre utilisation réelle sur tous les modèles — tokens consommés, coût estimé de l'API, qualité des réponses (basée sur ce que vous copiez) et tendances de latence. Toutes les données sont stockées localement dans ~/.airvo/stats.json.",
    help_stats_tokens_title:"📊 Tokens par Modèle",
    help_stats_tokens_body:"Barres horizontales indiquant le total des tokens générés par modèle depuis la dernière réinitialisation. Utile pour comprendre quels modèles vous utilisez le plus.",
    help_stats_cost_title:"💰 Coût Estimé",
    help_stats_cost_body:"Dépenses API estimées par modèle selon les tarifs typiques (ex. OpenAI ~5$/1M tokens, Anthropic ~9$/1M). Les modèles locaux (Ollama, LM Studio) affichent toujours Gratuit. Ce sont des estimations — consultez votre tableau de bord fournisseur pour la facturation exacte.",
    help_stats_quality_title:"⭐ Classement Qualité",
    help_stats_quality_body:"Modèles classés par nombre de clics sur Copier dans leurs réponses. C'est un signal de qualité implicite — si vous copiez la réponse d'un modèle, elle était utile. Les médailles 🥇🥈🥉 vont au top 3.",
    help_stats_latency_title:"⚡ Latence Moyenne",
    help_stats_latency_body:"Temps de réponse moyen par modèle sur toutes les requêtes enregistrées. Vert = le plus rapide, jaune = modéré, rouge = le plus lent. Utile pour choisir le bon modèle quand la vitesse compte.",
    help_stats_daily_title:"📅 Activité Quotidienne",
    help_stats_daily_body:"Barres sparkline montrant l'utilisation des tokens par jour sur les 7 derniers jours. Aide à identifier des tendances — ex. quels modèles vous utilisez le plus lors des journées intenses.",
    config_context_memory_section:"Contexte & Mémoire",
    toast_activated:"Modèle activé", toast_deactivated:"Modèle désactivé",
    toast_key_saved:"Clé API enregistrée ✓", toast_key_error:"Entrez une clé API valide",
    toast_deleted:"Modèle supprimé", toast_added:"Modèle ajouté ✓",
    toast_error_toggle:"Erreur de mise à jour", toast_error_key:"Erreur d'enregistrement",
    toast_error_delete:"Erreur de suppression", toast_error_add:"Erreur d'ajout",
    confirm_delete:"Supprimer ce modèle ?",
    toast_limit:"Airvo supporte jusqu'à 3 modèles actifs. Désactivez-en un pour en activer un autre.",
    stat_v1_limit:"max 3 actifs",
    auto_detected:"Détecté automatiquement",
    auto_local_hint:"Modèle local — sans coût d'API",
    auto_cloud_hint:"Modèle cloud — facturation par le fournisseur",
    nav_compare:"Comparer", nav_stats:"Stats", nav_bench:"Benchmarks",
    bench_title:"Benchmarks", bench_sub:"Prompts standardisés pour mesurer et comparer vos modèles",
    bench_suite_speed:"Test de Vitesse", bench_suite_coding:"Programmation", bench_suite_reasoning:"Raisonnement", bench_suite_creative:"Créativité",
    bench_run:"Lancer le Benchmark", bench_running:"En cours",
    bench_no_active:"Au moins 2 modèles actifs sont nécessaires pour lancer des benchmarks.",
    bench_no_results:"Aucun résultat pour l'instant — sélectionnez une suite et cliquez sur Lancer le Benchmark.",
    bench_leaderboard:"Classement Général", bench_results:"Résultats par Prompt",
    bench_clear:"Effacer l'Historique", bench_history_title:"Historique des Exécutions",
    compare_title:"Comparaison des Réponses",
    compare_sub:"Dernières réponses multi-modèles côte à côte — copiez et choisissez la meilleure",
    compare_empty:"Aucune réponse multi-modèle pour l'instant",
    compare_empty_hint:"Utilisez le mode Parallèle, Vote ou Révision avec 2+ modèles actifs, puis envoyez un message depuis votre IDE",
    compare_refresh:"Actualiser",
    compare_mode:"Mode",
    compare_prompt:"Invite",
    compare_copy:"Copier",
    compare_copied:"Copié ✓",
    compare_tokens:"tokens",
    compare_error_badge:"Erreur",
    compare_at:"Dernière mise à jour",
    compare_auto:"Auto",
    compare_elapsed:"s",
    compare_history_label:"Historique",
    compare_of:"sur",
    compare_export:"Exporter MD",
    compare_export_done:"Exporté ✓",
    compare_fastest:"Le plus rapide",
    compare_most_tokens:"Le plus",
    compare_expand:"Focus",
    compare_collapse:"Voir tout",
    compare_copy_prompt:"Copier le prompt",
    compare_stats:"Performance",
    compare_time:"Temps",
    compare_tok_s:"tok/s",
    compare_ask:"Interroger les modèles",
    compare_send:"⊞ Comparer",
    compare_sending:"En cours…",
    compare_send_placeholder:"Tapez un prompt pour comparer tous les modèles actifs… (Ctrl+Entrée)",
    compare_sort_default:"Défaut",
    compare_sort_speed:"⚡ Vitesse",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"Il faut 2+ modèles actifs pour comparer",
    compare_diff:"Diff",
    compare_diff_tip:"Surligner les mots uniques à chaque modèle",
    compare_streaming:"Streaming…",
    compare_stream_done:"Terminé",
    compare_rerun:"🔁 Relancer",
    compare_clear:"🗑 Effacer l'historique",
    compare_clear_confirm:"Effacer tout l'historique ? Action irréversible.",
    compare_cleared:"Historique effacé",
    compare_template_save:"💾 Sauvegarder",
    compare_template_saved:"Modèle sauvegardé ✓",
    compare_templates:"Prompts sauvegardés",
    compare_similarity:"Similarité",
    compare_diff_word:"Mots",
    compare_diff_sentence:"Phrases",
    compare_temps:"Temp. par modèle",
    compare_temp_reset:"Réinitialiser",
    compare_pin:"Épingler comme référence",
    compare_unpin:"Désépingler",
    compare_pinned:"Référence",
  },
  de: {
    nav_models:"Modelle", nav_status:"Status", nav_config:"Konfiguration", nav_add:"Modell Hinzufügen", nav_help:"Hilfe", nav_active:"AKTIV", nav_none:"keine",
    connecting:"verbinde...", offline:"Server offline",
    models_title:"Modelle", models_sub:"Modelle aktivieren und API-Schlüssel konfigurieren",
    suggestions_title:"Vorschläge", suggestions_sub:"API-Schlüssel hinzufügen, um diese Modelle zu nutzen",
    stat_total:"Gesamt", stat_active:"Aktiv", stat_free:"Kostenlos", stat_with_key:"Mit Schlüssel",
    stat_models:"Modelle", stat_parallel:"parallel", stat_no_cost:"kostenlos", stat_configured:"konfiguriert",
    loading_models:"Modelle werden geladen...",
    active:"aktiv", inactive:"inaktiv", free_badge:"GRATIS", paid_badge:"KOSTENPFLICHTIG",
    save_key:"Speichern", hide_key:"ausblenden", show_key:"anzeigen", change_key:"ändern", delete_btn:"löschen",
    key_placeholder:"API-Schlüssel...",
    status_title:"Status", status_sub:"Serverstatus und aktive Modelle", server_label:"Server",
    status_online:"● Online", status_offline_msg:"Verbindung zum Server nicht möglich.",
    status_offline_hint:"Stellen Sie sicher, dass Airvo läuft mit",
    field_version:"Version", field_active:"Aktive Modelle", field_total:"Modelle gesamt",
    field_config:"Konfigurationsdatei", field_endpoint:"Chat-Endpunkt",
    hw_label:"Systemressourcen", hw_sub:"RAM, GPU und Ollama-Modelle im Speicher",
    hw_ram:"RAM", hw_used:"genutzt", hw_free:"frei",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"Modelle im Speicher", hw_ollama_none:"Keine Modelle geladen",
    hw_pressure_ok:"Speicher OK", hw_pressure_warning:"Speicherdruck", hw_pressure_critical:"Speicher kritisch",
    hw_unload_btn:"Entladen", hw_unload_confirm:"Dieses Modell aus dem Speicher entladen?",
    hw_unload_done:"Modell entladen ✓", hw_unload_error:"Entladen fehlgeschlagen",
    hw_no_psutil:"psutil nicht installiert", hw_no_psutil_hint:"Ausführen: pip install airvo[hardware]",
    hw_suggestions:"Vorschläge", hw_loading:"Hardware-Info wird geladen...",
    hw_refresh:"Aktualisieren",
    hw_cpu:"CPU", hw_cpu_cores:"Kerne", hw_cpu_usage:"Auslastung",
    hw_processes:"Größte Speicherverbraucher", hw_proc_sub:"Prozesse mit dem höchsten RAM-Verbrauch",
    hw_proc_show:"Prozesse anzeigen", hw_proc_hide:"Ausblenden",
    disc_label:"Modelle entdecken", disc_sub:"Kompatible Modelle für Ihre Hardware durchsuchen",
    disc_local_tab:"Lokal (Ollama)", disc_cloud_tab:"Cloud (OpenRouter)",
    disc_fits:"Passt in RAM", disc_too_large:"Benötigt mehr RAM", disc_installed:"Installiert",
    disc_pull_cmd:"Pull-Befehl", disc_add_btn:"Zu Airvo hinzufügen", disc_added:"Modell hinzugefügt ✓",
    disc_add_error:"Hinzufügen fehlgeschlagen", disc_loading:"Lade Modelle...",
    disc_ollama_offline:"Ollama offline", disc_free_badge:"Kostenlos",
    disc_context:"Kontext", disc_no_results:"Keine Modelle gefunden", disc_ram_required:"RAM erforderlich",
    disc_already_added:"Bereits hinzugefügt", disc_open_section:"Entdecken",
    disc_local_explain:"Lokale Modelle laufen 100% auf Ihrem Computer über Ollama — kein API-Schlüssel, kein Internet, kostenlos. Vollständig privat.",
    disc_local_how:"① Pull-Befehl unten kopieren → im Terminal ausführen, um das Modell herunterzuladen.  ② '+ Zu Airvo hinzufügen' klicken, um es zu registrieren.",
    disc_fits_detail:"Passt in Ihren verfügbaren RAM — wird problemlos laden und laufen",
    disc_too_large_detail:"Benötigt mehr RAM als verfügbar — kann sehr langsam sein oder fehlschlagen",
    disc_cloud_explain:"Cloud-Modelle laufen auf OpenRouter-Servern — leistungsstark, keine lokale GPU nötig. Erfordert einen kostenlosen OpenRouter-API-Schlüssel.",
    disc_cloud_how:"① '+ Zu Airvo hinzufügen' klicken.  ② Modelle-Seite öffnen und OpenRouter-API-Schlüssel setzen.  ③ Modell aktivieren.",
    continue_label:"Continue.dev Konfiguration", continue_hint:"Fügen Sie dies zu Ihrer config.yaml hinzu:",
    copy_config:"Konfiguration kopieren", copied:"Kopiert ✓",
    config_title:"Konfiguration", config_sub:"Modus, Temperatur, Speicher und Einstellungen",
    mode_label:"Multi-Modell-Modus", active_models_label:"Aktive Modelle",
    no_active_models:"Keine aktiven Modelle. Aktivieren Sie mindestens eines unter Modelle.",
    mode_parallel:"Parallel", mode_parallel_desc:"Alle Modelle antworten, alle Antworten werden angezeigt",
    mode_race:"Rennen", mode_race_desc:"Das schnellste Modell gewinnt",
    mode_vote:"Abstimmung", mode_vote_desc:"Konsens zwischen den Modellen",
    mode_review:"Überprüfung", mode_review_desc:"Eines generiert, ein anderes kritisiert", mode_set:"Modus",
    tool_call_badge:"Agent/Plan-Modus",
    tool_call_badge_tip:"Die letzte Anfrage verwendete ein Modell, da Ihre IDE Tool Calls gesendet hat (Agent- oder Plan-Modus). Multi-Modell funktioniert nur im Chat-Modus.",
    mode_note_tools:"⚡ Letzte Anfrage im Agent/Plan-Modus — nur 1 Modell hat geantwortet. Das ist normal: Tool Calls erfordern eine Einzelmodell-Konversation. Wechseln Sie im IDE zum Chat-Modus für Multi-Modell-Antworten.",
    last_req_multi:"Multi-Modell ✓", last_req_single:"Einzelmodell",
    temp_label:"Temperatur",
    temp_hint_low:"0.0 — deterministisch, präzise. Ideal für Code.",
    temp_hint_mid:"0.5 — ausgewogen. Gut für die meisten Aufgaben.",
    temp_hint_high:"1.0 — kreativ, abwechslungsreich. Ideal für Brainstorming.",
    temp_saved:"Temperatur gespeichert",
    maxtokens_label:"Maximale Token",
    maxtokens_saved:"Maximale Token gespeichert",
    maxhistory_label:"Verlaufslimit",
    maxhistory_sub:"Max. Nachrichten pro Anfrage. Niedriger = weniger gesendete Token.",
    maxhistory_saved:"Limit gespeichert",
    memory_label:"Projektkontext",
    memory_sub:"Einmal schreiben, in jede Anfrage eingefügt. Hilft Airvo, Ihren Stack zu verstehen.",
    memory_enable:"Projektkontext aktivieren",
    memory_placeholder:"Beispiel:\nIch arbeite mit FastAPI und Python 3.12.\nImmer async/await und Typannotationen.\nREST-API für E-Commerce.\nDeployment auf Railway mit Docker.",
    memory_chars:"Zeichen", memory_max:"max",
    memory_saved:"Kontext gespeichert ✓",
    memory_too_long:"Kontext zu lang — kürzen Sie ihn",
    memory_tokens_warning:"⚠ Kontext ist groß — kürzen empfohlen",
    rag_label:"Smart Memory (RAG)",
    rag_sub:"Semantische Suche in Ihrem Code — relevante Ausschnitte werden automatisch eingefügt. 100% lokal.",
    rag_enable:"Smart Memory aktivieren",
    rag_warning_title:"Einmalige Einrichtung erforderlich",
    rag_warning_body:"Smart Memory lädt beim ersten Start ein lokales Embedding-Modell (~90 MB) herunter. Ihr Code verlässt niemals Ihren Computer.",
    rag_warning_confirm:"Trotzdem aktivieren",
    rag_path_label:"Projektpfad",
    rag_path_placeholder:"/pfad/zu/ihrem/projekt",
    rag_index_btn:"Jetzt indexieren",
    rag_indexing:"Wird indexiert…",
    rag_status_files:"indexierte Dateien",
    rag_status_chunks:"Fragmente",
    rag_status_size:"MB Index",
    rag_status_last:"Zuletzt indexiert",
    rag_status_never:"nie",
    rag_clear_btn:"Index löschen",
    rag_clear_confirm:"Den gesamten RAG-Index löschen? Dies kann nicht rückgängig gemacht werden.",
    rag_clear_done:"Index gelöscht",
    rag_index_done:"Indexierung abgeschlossen ✓",
    rag_index_error:"Indexierung fehlgeschlagen",
    rag_not_available:"RAG-Abhängigkeiten nicht installiert",
    rag_install_hint:"Ausführen: pip install airvo[rag]",
    rag_advanced:"Erweiterte Einstellungen",
    rag_max_mb:"Max. Indexgröße (MB)",
    rag_max_kb:"Max. Dateigröße (KB)",
    rag_top_k:"Ergebnisse pro Anfrage",
    rag_max_inject_chars:"Max. injizierter Kontext (Zeichen)",
    stats_label:"Nutzungsstatistiken",
    stats_requests:"Anfragen", stats_tokens:"Token",
    stats_reset:"Statistiken zurücksetzen",
    stats_reset_confirm:"Alle Nutzungsstatistiken zurücksetzen?",
    stats_reset_done:"Statistiken zurückgesetzt",
    stats_empty:"Noch keine Daten. Fangen Sie an zu programmieren!",
    stats_tab_title:"Nutzungsanalyse", stats_tab_sub:"Token-Nutzung, geschätzte Kosten, Qualitätsranking und Latenz pro Modell",
    stats_section_tokens:"Tokens nach Modell", stats_section_cost:"Geschätzte Kosten", stats_section_quality:"Qualitätsranking",
    stats_section_latency:"Durchschnittliche Latenz", stats_section_daily:"Tägliche Aktivität — Letzte 7 Tage",
    stats_copies:"Kopien", stats_free:"Kostenlos", stats_local:"Lokal",
    stats_latency_avg:"Ø", stats_latency_unit:"s",
    stats_cost_note:"* Schätzungen basieren auf typischen API-Preisen. Tatsächliche Kosten können abweichen.",
    stats_quality_note:"Basiert darauf, wie oft Sie eine Antwort kopiert haben",
    stats_no_history:"Noch keine täglichen Daten",
    stats_total_tokens:"Tokens gesamt", stats_total_requests:"Anfragen gesamt",
    add_title:"Modell Hinzufügen", add_sub:"Jedes LiteLLM-kompatible Modell — jeder Anbieter",
    new_model:"Neues Modell",
    field_id:"Modell-ID", field_name:"Anzeigename", field_provider:"Anbieter",
    field_apikey:"API-Schlüssel", field_baseurl:"Basis-URL", field_notes:"Notizen",
    check_active:"Sofort aktivieren", add_btn:"Modell hinzufügen",
    tip_id_title:"Was ist die Modell-ID?", tip_id_body:"Eindeutiger Bezeichner im Format anbieter/modellname.", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"Was ist der Anzeigename?", tip_name_body:"Benutzerfreundliche Bezeichnung im Dashboard.", tip_name_examples:"Llama 3.3 70B\nGPT-4o\nMein lokales Modell",
    tip_provider_title:"Was ist der Anbieter?", tip_provider_body:"Das Unternehmen, das das Modell bereitstellt.", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"Wo bekomme ich den API-Schlüssel?", tip_apikey_body:"Geheimes Authentifizierungstoken. Für lokale Modelle leer lassen.", tip_apikey_examples:"Groq → console.groq.com (kostenlos)\nOpenAI → platform.openai.com\nOllama → leer lassen",
    tip_baseurl_title:"Was ist die Basis-URL?", tip_baseurl_body:"Serveradresse. Nur für lokale Modelle.", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"Notizen (optional)", tip_notes_body:"Persönliche Erinnerung.", tip_notes_examples:"Kostenloses Tier · 128k Kontext\nAm besten für Code",
    tip_active_title:"Was bedeutet 'Sofort aktivieren'?", tip_active_body:"Aktiviert = Modell sofort eingeschaltet. Deaktiviert = gespeichert aber inaktiv.", tip_active_examples:"✓ Aktiviert → Modell AN\n✗ Deaktiviert → gespeichert aber AUS",
    help_title:"Hilfe", help_sub:"Alles, was Sie zur Nutzung von Airvo benötigen",
    help_what_title:"Was ist Airvo?", help_what_body:"Airvo ist ein lokaler KI-Server, der Ihren Editor gleichzeitig mit beliebigen KI-Modellen verbindet.",
    help_adding_title:"Modelle hinzufügen — Feld für Feld",
    help_field_id_title:"Modell-ID", help_field_id_desc:"Eindeutiger Schlüssel: anbieter/modellname.",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"Anzeigename", help_field_name_desc:"Benutzerfreundliche Bezeichnung im Dashboard.",
    help_field_provider_title:"Anbieter", help_field_provider_desc:"Der Dienst, der das Modell bereitstellt.",
    help_field_apikey_title:"API-Schlüssel", help_field_apikey_desc:"Authentifizierungstoken. Für lokale Modelle leer lassen.",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"Basis-URL", help_field_baseurl_desc:"Nur für lokale Modelle.",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"Multi-Modell-Modi",
    help_mode_parallel:"Parallel — Alle Modelle antworten. Alle Antworten werden angezeigt.",
    help_mode_race:"Rennen — Das erste Modell, das antwortet, gewinnt.",
    help_mode_vote:"Abstimmung — Die Konsensantwort wird angezeigt.",
    help_mode_review:"Überprüfung — Eines generiert, ein anderes kritisiert.",
    help_faq_title:"FAQ",
    help_faq_1_q:"Muss ich alle Felder ausfüllen?", help_faq_1_a:"Nein. Nur ID, Name und Anbieter sind erforderlich.",
    help_faq_2_q:"Kann ich jedes Modell verwenden?", help_faq_2_a:"Ja — wenn LiteLLM es unterstützt, unterstützt Airvo es.",
    help_faq_3_q:"Wo wird mein API-Schlüssel gespeichert?", help_faq_3_a:"In ~/.airvo/models.json. Er verlässt nie Ihren Computer.",
    help_faq_4_q:"Wie verwende ich Ollama?", help_faq_4_a:"Installieren Sie Ollama, laden Sie ein Modell, fügen Sie es mit ID: ollama/llama3, Basis-URL: http://localhost:11434 hinzu.",
    help_faq_5_q:"Was ist der Projektkontext?", help_faq_5_a:"Eine Notiz, die in jede Anfrage eingefügt wird, damit Airvo Ihren Stack kennt.",
    help_faq_6_q:"Verbraucht der Kontext zusätzliche Token?", help_faq_6_a:"Ja, ein kleiner fester Betrag pro Anfrage (~650 Token max). Es ist optional.",
    help_faq_7_q:"Was ist Smart Memory (RAG)?",
    help_faq_7_a:"Smart Memory indiziert Ihren Code lokal mit KI-Embeddings. Vor jeder Anfrage findet Airvo automatisch die relevantesten Dateien und fügt sie in den Prompt ein.",
    help_faq_8_q:"Wird mein Code in die Cloud gesendet?",
    help_faq_8_a:"Niemals. Das Embedding-Modell läuft 100% auf Ihrem Rechner. Der Index wird in ~/.airvo/rag/ gespeichert und Ihr Code verlässt niemals Ihren Computer.",
    help_rag_title:"Smart Memory (RAG)",
    help_rag_what_title:"Was es tut",
    help_rag_what_body:"Smart Memory scannt Ihr Projekt, teilt Dateien in Abschnitte auf, generiert lokal Vektoreinbettungen und speichert sie in ChromaDB. Bei jeder Nachricht findet Airvo die relevantesten Abschnitte und fügt sie automatisch in den Kontext ein.",
    help_rag_setup_title:"So aktivieren Sie es",
    help_rag_setup_steps:"1. Gehen Sie zu Konfiguration → Smart Memory\n2. Aktivieren Sie \"Smart Memory aktivieren\" (einmaliger Download ~90 MB)\n3. Geben Sie den Projektpfad ein\n4. Klicken Sie auf \"Jetzt indexieren\" und warten Sie\n5. Das 🧠 RAG-Badge erscheint im Header, wenn es aktiv ist",
    help_rag_privacy_title:"Datenschutz & Leistung",
    help_rag_privacy_body:"Alles läuft lokal — Embeddings, Index und Suche. Es werden keine Daten gesendet. Die Indexierung ist für die meisten Projekte schnell.",
    help_hw_title:"Speicherverwaltung",
    help_hw_body:"Echtzeit-RAM- und GPU-Auslastung auf der Statusseite. Zeigt welche Ollama-Modelle im Speicher geladen sind, warnt bei RAM-Druck (>75% WARNUNG, >90% KRITISCH) und ermöglicht das Entladen von Modellen mit einem Klick — kein Terminal nötig.",
    help_hw_tip_title:"Wann verwenden",
    help_hw_tip_body:"Wenn Ollama langsam oder nicht reagiert, prüfen Sie Status — möglicherweise sind mehrere große Modelle gleichzeitig geladen. Entladen Sie ungenutzte, um RAM freizugeben.",
    help_disc_title:"Modell-Entdeckung",
    help_disc_body:"Erweitern Sie auf der Modelle-Seite '🔭 Modelle entdecken'. Der Lokal-Tab zeigt einen Ollama-Katalog gefiltert nach dem, was in Ihren RAM passt — grüne Markierung bedeutet es passt, rot bedeutet mehr RAM nötig. Der Cloud-Tab zeigt OpenRouter-Modelle mit hervorgehobenen kostenlosen.",
    help_disc_tip_title:"Schnell hinzufügen",
    help_disc_tip_body:"Klicken Sie auf '+ Zu Airvo hinzufügen' bei einem entdeckten Modell. Für Ollama-Modelle kopieren Sie den angezeigten Pull-Befehl und führen ihn zuerst im Terminal aus.",
    help_history_title:"Chat-Verlauf-Limit",
    help_history_body:"Airvo sendet nur die letzten N Nachrichten Ihrer Unterhaltung pro Anfrage (Standard 10). Reduzieren Sie dies, wenn Sie Token-Limits mit kostenlosen API-Tarifen überschreiten — Groq kostenlos: 6k–12k Token/Min. Der vollständige Verlauf bleibt in Ihrem Editor; nur was an das Modell gesendet wird, wird gekürzt.",
    help_agent_title:"Agent/Plan-Modus und Modellauswahl",
    help_agent_what_title:"Was ist der Agent/Plan-Modus?",
    help_agent_what_body:"continue.dev hat 3 Modi: Chat (💬), Agent (⚡) und Plan (📋). In Agent und Plan sendet Ihre IDE Werkzeugdefinitionen neben Ihrer Nachricht — Werkzeuge zum Lesen von Dateien, Schreiben von Code, Ausführen von Befehlen usw.",
    help_agent_why_title:"Warum antwortet nur ein Modell im Agent/Plan-Modus?",
    help_agent_why_body:"Werkzeugaufrufe sind ein mehrstufiges zustandsbehaftetes Gespräch: das Modell fordert ein Werkzeug an, die IDE führt es aus und gibt das Ergebnis zurück, das Modell fordert ein weiteres an usw. Dieses Hin und Her erfordert ein einzelnes Modell zur Kontexterhaltung. Mehrere parallele Modelle würden widersprüchliche Dateibearbeitungen bedeuten.",
    help_agent_select_title:"Welches Modell den Agent/Plan-Modus behandelt",
    help_agent_select_body:"Unter Konfiguration → Agent/Plan-Modell wählen Sie ein aktives Modell. Bei Auto verwendet Airvo das erste aktive Modell in Ihrer Liste. Wählen Sie Ihr leistungsfähigstes Modell — es erledigt die gesamte agentische Arbeit.",
    help_agent_tip_title:"Tipp",
    help_agent_tip_body:"Verwenden Sie den Chat-Modus, um Antworten aller Modelle zu vergleichen. Verwenden Sie Agent/Plan, wenn die KI tatsächlich Dateien bearbeiten und Befehle ausführen soll — das verwendet immer ein Modell.",
    agent_model_label:"Agent/Plan-Modell",
    agent_model_sub:"Modell für Agent- und Plan-Modus in Ihrer IDE. Diese Modi verwenden Werkzeugaufrufe und benötigen ein einzelnes Modell.",
    agent_model_saved:"Agentenmodell gespeichert ✓",
    agent_model_auto:"Auto (erstes aktives Modell)",
    help_trouble_title:"Fehlerbehebung",
    help_trouble_1_q:"Ratenlimit-Fehler / zu viele Tokens von Groq oder anderem Anbieter",
    help_trouble_1_a:"Gehen Sie zu Konfiguration → Chat-Verlauf-Limit und setzen Sie es auf 4 oder 6 Nachrichten. Wenn Smart Memory (RAG) aktiviert ist, reduzieren Sie auch das RAG-Kontextlimit auf 1000–2000 Zeichen.",
    help_trouble_2_q:"Verbindung zum Server nicht möglich / Dashboard zeigt Server offline",
    help_trouble_2_a:"Stellen Sie sicher, dass Airvo läuft: Terminal öffnen und 'airvo start' ausführen. Prüfen Sie, dass der Port in Ihrer .env-Datei (Standard 8765) mit den Erweiterungs-Einstellungen übereinstimmt.",
    help_trouble_3_q:"Ein Modell zeigt einen Fehler / rotes Symbol",
    help_trouble_3_a:"Prüfen Sie den API-Schlüssel für dieses Modell auf der Modelle-Seite. Für Ollama-Modelle stellen Sie sicher, dass Ollama läuft ('ollama serve') und das Modell heruntergeladen ist ('ollama pull name').",
    help_trouble_4_q:"Smart Memory (RAG) findet meinen Code nicht / Suche schlägt fehl",
    help_trouble_4_a:"Gehen Sie zu Konfiguration → Smart Memory → klicken Sie auf 'Jetzt Indexieren'. Bestätigen Sie, dass der Pfad auf Ihr Projektstamm zeigt. Nach neuen Dateien re-indexieren. Top K auf 1–2 reicht für die meisten Projekte.",
    help_trouble_5_q:"Modell-Entdeckung zeigt keine Ollama-Modelle als installiert",
    help_trouble_5_a:"Ollama läuft möglicherweise nicht. Starten Sie es mit 'ollama serve'. Der Katalog lädt immer — das Installiert-Badge erfordert nur, dass Ollama auf localhost:11434 antwortet.",
    help_compare_title:"Compare-Tab — Funktionsübersicht",
    help_compare_intro:"Der Compare-Tab ist die leistungsstärkste Funktion von Airvo. Er ermöglicht es, denselben Prompt gleichzeitig an alle aktiven Modelle zu senden und die Ergebnisse mit visuellen Werkzeugen zu analysieren.",
    help_compare_streaming_title:"⊞ Echtzeit-Parallel-Streaming",
    help_compare_streaming_body:"Wenn Sie einen Prompt eingeben und auf Vergleichen klicken (oder Strg+Eingabe drücken), beginnen alle aktiven Modelle gleichzeitig zu generieren. Sie sehen die Tokens jedes Modells live nebeneinander.",
    help_compare_diff_title:"▨ Diff-Modi — Wörter & Sätze",
    help_compare_diff_body:"Wort-Diff hebt jedes Wort hervor, das in einer Modellantwort vorkommt, aber nicht in den anderen. Satz-Diff vergleicht ganze Sätze. Beide Modi werden im Browser berechnet.",
    help_compare_pin_title:"📌 Als Referenz anheften",
    help_compare_pin_body:"Klicken Sie auf 📌 auf einer Karte, um dieses Modell als Baseline festzulegen. Im Diff-Modus werden alle anderen mit dem angehefteten Modell verglichen.",
    help_compare_similarity_title:"Ähnlichkeitswert (Jaccard)",
    help_compare_similarity_body:"Am Ende der Performance-Leiste sehen Sie paarweise Ähnlichkeitsprozentsätze. Grün ≥ 60% bedeutet Übereinstimmung. Rot < 35% bedeutet grundlegend unterschiedliche Antworten.",
    help_compare_templates_title:"💾 Prompt-Vorlagen",
    help_compare_templates_body:"Klicken Sie auf Speichern neben dem Textfeld, um den aktuellen Prompt zu speichern. Gespeicherte Vorlagen erscheinen als anklickbare Chips. Bis zu 10 Vorlagen werden lokal im Browser gespeichert.",
    help_compare_temps_title:"🌡 Temperatur pro Modell",
    help_compare_temps_body:"Klicken Sie auf 🌡, um individuelle Temperatur-Schieberegler für jedes aktive Modell einzublenden. Werte mit * verwenden die globale Temperatur aus der Konfiguration.",
    help_compare_history_title:"Verlauf & Wiederholen",
    help_compare_history_body:"Airvo speichert die letzten 10 Vergleiche in ~/.airvo/compare_history.json. Navigieren Sie mit ← →. Klicken Sie auf 🔁 Wiederholen, um denselben Prompt erneut zu senden.",
    help_compare_export_title:"📄 Als Markdown exportieren",
    help_compare_export_body:"Exportiert den vollständigen Vergleich als .md-Datei inkl. Prompt, Antworten, Antwortzeit, Token-Anzahl und exakter Modell-ID.",
    help_compare_sort_title:"Sortieren & Focus",
    help_compare_sort_body:"Karten nach ⚡ Geschwindigkeit oder 📝 Tokens sortieren. ⛶ Focus vergrößert eine einzelne Karte.",
    help_stats_title:"Stats — Nutzungsanalyse",
    help_stats_intro:"Die Stats-Registerkarte verfolgt Ihre tatsächliche Nutzung über alle Modelle — verbrauchte Tokens, geschätzte API-Kosten, Antwortqualität (basierend auf dem, was Sie kopieren) und Latenztrends. Alle Daten werden lokal in ~/.airvo/stats.json gespeichert.",
    help_stats_tokens_title:"📊 Tokens pro Modell",
    help_stats_tokens_body:"Horizontale Balken, die die seit dem letzten Reset erzeugten Tokens pro Modell anzeigen. Nützlich, um zu verstehen, welche Modelle Sie am meisten nutzen.",
    help_stats_cost_title:"💰 Geschätzte Kosten",
    help_stats_cost_body:"Geschätzte API-Ausgaben pro Modell basierend auf typischen Preisen (z.B. OpenAI ~5$/1M Tokens, Anthropic ~9$/1M). Lokale Modelle (Ollama, LM Studio) zeigen immer Kostenlos. Dies sind Schätzungen — prüfen Sie Ihr Anbieter-Dashboard für genaue Abrechnung.",
    help_stats_quality_title:"⭐ Qualitätsranking",
    help_stats_quality_body:"Modelle nach Anzahl der Klicks auf Kopieren bei ihren Antworten bewertet. Dies ist ein implizites Qualitätssignal — wenn Sie die Antwort eines Modells kopieren, war sie nützlich. Die Medaillen 🥇🥈🥉 gehen an die Top 3.",
    help_stats_latency_title:"⚡ Durchschn. Latenz",
    help_stats_latency_body:"Durchschnittliche Antwortzeit pro Modell über alle aufgezeichneten Anfragen. Grün = am schnellsten, gelb = moderat, rot = am langsamsten. Nützlich, wenn Geschwindigkeit entscheidend ist.",
    help_stats_daily_title:"📅 Tägliche Aktivität",
    help_stats_daily_body:"Sparkline-Balken, die die Token-Nutzung pro Tag über die letzten 7 Tage zeigen. Hilft Muster zu erkennen — z.B. welche Modelle Sie an intensiven Coding-Tagen mehr nutzen.",
    config_context_memory_section:"Kontext & Speicher",
    toast_activated:"Modell aktiviert", toast_deactivated:"Modell deaktiviert",
    toast_key_saved:"API-Schlüssel gespeichert ✓", toast_key_error:"Geben Sie einen gültigen API-Schlüssel ein",
    toast_deleted:"Modell gelöscht", toast_added:"Modell hinzugefügt ✓",
    toast_error_toggle:"Fehler beim Aktualisieren", toast_error_key:"Fehler beim Speichern",
    toast_error_delete:"Fehler beim Löschen", toast_error_add:"Fehler beim Hinzufügen",
    confirm_delete:"Dieses Modell löschen?",
    toast_limit:"Airvo unterstützt bis zu 3 aktive Modelle. Deaktivieren Sie eines, um ein anderes zu aktivieren.",
    stat_v1_limit:"max 3 aktiv",
    auto_detected:"Automatisch erkannt",
    auto_local_hint:"Lokales Modell — keine API-Kosten",
    auto_cloud_hint:"Cloud-Modell — Abrechnung durch den Anbieter",
    nav_compare:"Vergleich", nav_stats:"Stats", nav_bench:"Benchmarks",
    bench_title:"Benchmarks", bench_sub:"Standardisierte Prompts zum Messen und Vergleichen Ihrer Modelle",
    bench_suite_speed:"Geschwindigkeitstest", bench_suite_coding:"Programmierung", bench_suite_reasoning:"Schlussfolgerung", bench_suite_creative:"Kreativität",
    bench_run:"Benchmark starten", bench_running:"Läuft",
    bench_no_active:"Mindestens 2 aktive Modelle sind erforderlich um Benchmarks auszuführen.",
    bench_no_results:"Noch keine Ergebnisse — Suite auswählen und Benchmark starten klicken.",
    bench_leaderboard:"Gesamtrangliste", bench_results:"Ergebnisse pro Prompt",
    bench_clear:"Verlauf löschen", bench_history_title:"Ausführungsverlauf",
    compare_title:"Antwort-Vergleich",
    compare_sub:"Letzte Multi-Modell-Antworten nebeneinander — kopieren und die beste wählen",
    compare_empty:"Noch keine Multi-Modell-Antworten",
    compare_empty_hint:"Nutze Parallel-, Abstimmungs- oder Überprüfungsmodus mit 2+ aktiven Modellen, dann sende eine Nachricht aus deiner IDE",
    compare_refresh:"Aktualisieren",
    compare_mode:"Modus",
    compare_prompt:"Prompt",
    compare_copy:"Kopieren",
    compare_copied:"Kopiert ✓",
    compare_tokens:"Token",
    compare_error_badge:"Fehler",
    compare_at:"Zuletzt aktualisiert",
    compare_auto:"Auto",
    compare_elapsed:"s",
    compare_history_label:"Verlauf",
    compare_of:"von",
    compare_export:"MD exportieren",
    compare_export_done:"Exportiert ✓",
    compare_fastest:"Schnellste",
    compare_most_tokens:"Meiste",
    compare_expand:"Fokus",
    compare_collapse:"Alle anzeigen",
    compare_copy_prompt:"Prompt kopieren",
    compare_stats:"Leistung",
    compare_time:"Zeit",
    compare_tok_s:"Tok/s",
    compare_ask:"Modelle befragen",
    compare_send:"⊞ Vergleichen",
    compare_sending:"Läuft…",
    compare_send_placeholder:"Prompt eingeben, um alle aktiven Modelle zu vergleichen… (Strg+Enter)",
    compare_sort_default:"Standard",
    compare_sort_speed:"⚡ Geschwindigkeit",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"Mindestens 2 aktive Modelle erforderlich",
    compare_diff:"Diff",
    compare_diff_tip:"Einzigartige Wörter je Modell hervorheben",
    compare_streaming:"Streaming…",
    compare_stream_done:"Fertig",
    compare_rerun:"🔁 Wiederholen",
    compare_clear:"🗑 Verlauf löschen",
    compare_clear_confirm:"Gesamten Verlauf löschen? Dies kann nicht rückgängig gemacht werden.",
    compare_cleared:"Verlauf gelöscht",
    compare_template_save:"💾 Speichern",
    compare_template_saved:"Vorlage gespeichert ✓",
    compare_templates:"Gespeicherte Prompts",
    compare_similarity:"Ähnlichkeit",
    compare_diff_word:"Wörter",
    compare_diff_sentence:"Sätze",
    compare_temps:"Temp. je Modell",
    compare_temp_reset:"Zurücksetzen",
    compare_pin:"Als Referenz anheften",
    compare_unpin:"Lösen",
    compare_pinned:"Referenz",
  },
  zh: {
    nav_models:"模型", nav_status:"状态", nav_config:"配置", nav_add:"添加模型", nav_help:"帮助", nav_active:"已激活", nav_none:"无",
    connecting:"连接中...", offline:"服务器离线",
    models_title:"模型", models_sub:"激活模型并配置其 API 密钥",
    suggestions_title:"建议", suggestions_sub:"添加 API 密钥以开始使用这些模型",
    stat_total:"总计", stat_active:"已激活", stat_free:"免费", stat_with_key:"已配置密钥",
    stat_models:"个模型", stat_parallel:"并行运行", stat_no_cost:"无费用", stat_configured:"已配置",
    loading_models:"正在加载模型...",
    active:"已激活", inactive:"未激活", free_badge:"免费", paid_badge:"付费",
    save_key:"保存", hide_key:"隐藏", show_key:"显示", change_key:"修改", delete_btn:"删除",
    key_placeholder:"API 密钥...",
    status_title:"状态", status_sub:"服务器状态和活跃模型", server_label:"服务器",
    status_online:"● 在线", status_offline_msg:"无法连接到服务器。",
    status_offline_hint:"请确保 Airvo 正在运行，使用命令",
    field_version:"版本", field_active:"活跃模型", field_total:"模型总数",
    field_config:"配置文件", field_endpoint:"聊天端点",
    hw_label:"系统资源", hw_sub:"RAM、GPU 和内存中的 Ollama 模型",
    hw_ram:"内存", hw_used:"已用", hw_free:"空闲",
    hw_gpu:"GPU", hw_vram:"显存",
    hw_ollama_models:"内存中的模型", hw_ollama_none:"无已加载模型",
    hw_pressure_ok:"内存正常", hw_pressure_warning:"内存压力", hw_pressure_critical:"内存严重不足",
    hw_unload_btn:"卸载", hw_unload_confirm:"从内存中卸载此模型？",
    hw_unload_done:"模型已卸载 ✓", hw_unload_error:"卸载失败",
    hw_no_psutil:"psutil 未安装", hw_no_psutil_hint:"运行：pip install airvo[hardware]",
    hw_suggestions:"建议", hw_loading:"正在加载硬件信息...",
    hw_refresh:"刷新",
    hw_cpu:"处理器", hw_cpu_cores:"核心", hw_cpu_usage:"使用率",
    hw_processes:"内存占用排行", hw_proc_sub:"占用最多 RAM 的进程",
    hw_proc_show:"查看进程", hw_proc_hide:"隐藏",
    disc_label:"发现模型", disc_sub:"根据您的硬件浏览兼容模型",
    disc_local_tab:"本地 (Ollama)", disc_cloud_tab:"云端 (OpenRouter)",
    disc_fits:"内存足够", disc_too_large:"需要更多内存", disc_installed:"已安装",
    disc_pull_cmd:"拉取命令", disc_add_btn:"添加到 Airvo", disc_added:"模型已添加 ✓",
    disc_add_error:"添加失败", disc_loading:"正在加载模型...",
    disc_ollama_offline:"Ollama 离线", disc_free_badge:"免费",
    disc_context:"上下文", disc_no_results:"未找到模型", disc_ram_required:"所需内存",
    disc_already_added:"已添加", disc_open_section:"发现",
    disc_local_explain:"本地模型通过 Ollama 在您的电脑上 100% 本地运行——无需 API 密钥、无需联网、完全免费，完全私密。",
    disc_local_how:"① 复制下方的拉取命令 → 在终端运行以下载模型。  ② 点击「+ 添加到 Airvo」注册模型。",
    disc_fits_detail:"适合您的可用 RAM — 可以流畅加载和运行",
    disc_too_large_detail:"需要比可用 RAM 更多的内存 — 可能非常慢或无法加载",
    disc_cloud_explain:"云端模型在 OpenRouter 服务器上运行——功能强大，无需本地 GPU。需要免费的 OpenRouter API 密钥。",
    disc_cloud_how:"① 点击「+ 添加到 Airvo」。  ② 前往模型页面设置 OpenRouter API 密钥。  ③ 激活模型即可。",
    continue_label:"Continue.dev 配置", continue_hint:"将以下内容添加到您的 config.yaml：",
    copy_config:"复制配置", copied:"已复制 ✓",
    config_title:"配置", config_sub:"模式、温度、记忆和偏好设置",
    mode_label:"多模型模式", active_models_label:"活跃模型",
    no_active_models:"没有活跃模型。请在模型页面至少激活一个。",
    mode_parallel:"并行", mode_parallel_desc:"所有模型同时响应，查看所有答案",
    mode_race:"竞速", mode_race_desc:"最快的模型获胜",
    mode_vote:"投票", mode_vote_desc:"模型之间达成共识",
    mode_review:"审阅", mode_review_desc:"一个生成，另一个批评", mode_set:"模式",
    tool_call_badge:"Agent/Plan 模式",
    tool_call_badge_tip:"最后一次请求使用了单个模型，因为您的 IDE 发送了工具调用（Agent 或 Plan 模式）。多模型仅在 Chat 模式下工作。",
    mode_note_tools:"⚡ 最后一次请求使用了 Agent/Plan 模式 — 只有 1 个模型响应。这是正常的：工具调用需要单模型对话。在 IDE 中切换到 Chat 模式以获得多模型响应。",
    last_req_multi:"多模型 ✓", last_req_single:"单模型",
    temp_label:"温度",
    temp_hint_low:"0.0 — 确定性，精确。适合代码。",
    temp_hint_mid:"0.5 — 平衡。适合大多数任务。",
    temp_hint_high:"1.0 — 创意，多样。适合头脑风暴。",
    temp_saved:"温度已保存",
    maxtokens_label:"最大 Token 数",
    maxtokens_saved:"最大 Token 数已保存",
    maxhistory_label:"历史记录限制",
    maxhistory_sub:"每次请求保留的最大消息数。越小发送的 token 越少。",
    maxhistory_saved:"限制已保存",
    memory_label:"项目上下文",
    memory_sub:"写一次，注入每个请求。帮助 Airvo 了解您的技术栈。",
    memory_enable:"启用项目上下文",
    memory_placeholder:"示例：\n我使用 FastAPI 和 Python 3.12。\n始终使用 async/await 和类型注解。\n这是一个电商 REST API。\n部署到 Railway with Docker。",
    memory_chars:"字符", memory_max:"最大",
    memory_saved:"上下文已保存 ✓",
    memory_too_long:"上下文太长 — 请精简",
    memory_tokens_warning:"⚠ 上下文较大 — 建议精简",
    rag_label:"智能记忆 (RAG)",
    rag_sub:"对代码库进行语义搜索 — 相关代码片段自动注入每次请求。完全本地运行。",
    rag_enable:"启用智能记忆",
    rag_warning_title:"需要一次性设置",
    rag_warning_body:"智能记忆在首次使用时会下载一个本地嵌入模型（约 90 MB）。您的代码永远不会离开您的计算机。",
    rag_warning_confirm:"仍然启用",
    rag_path_label:"项目路径",
    rag_path_placeholder:"/您的/项目/路径",
    rag_index_btn:"立即索引",
    rag_indexing:"索引中…",
    rag_status_files:"已索引文件",
    rag_status_chunks:"片段",
    rag_status_size:"MB 索引",
    rag_status_last:"最后索引时间",
    rag_status_never:"从未",
    rag_clear_btn:"清除索引",
    rag_clear_confirm:"删除整个 RAG 索引？此操作无法撤销。",
    rag_clear_done:"索引已清除",
    rag_index_done:"索引完成 ✓",
    rag_index_error:"索引失败",
    rag_not_available:"RAG 依赖项未安装",
    rag_install_hint:"运行：pip install airvo[rag]",
    rag_advanced:"高级设置",
    rag_max_mb:"最大索引大小（MB）",
    rag_max_kb:"最大文件大小（KB）",
    rag_top_k:"每次请求的结果数",
    rag_max_inject_chars:"最大注入上下文（字符）",
    stats_label:"使用统计",
    stats_requests:"请求数", stats_tokens:"Token 数",
    stats_reset:"重置统计",
    stats_reset_confirm:"重置所有使用统计？",
    stats_reset_done:"统计已重置",
    stats_empty:"暂无数据。开始编程吧！",
    stats_tab_title:"使用分析", stats_tab_sub:"每个模型的令牌使用量、预估成本、质量排名和延迟",
    stats_section_tokens:"按模型统计令牌", stats_section_cost:"预估成本", stats_section_quality:"质量排名",
    stats_section_latency:"平均延迟", stats_section_daily:"每日活动 — 最近7天",
    stats_copies:"复制次数", stats_free:"免费", stats_local:"本地",
    stats_latency_avg:"均", stats_latency_unit:"秒",
    stats_cost_note:"* 基于典型API定价的估算，实际费用可能有所不同。",
    stats_quality_note:"基于复制该模型回复的次数",
    stats_no_history:"暂无每日数据",
    stats_total_tokens:"总令牌数", stats_total_requests:"总请求数",
    add_title:"添加模型", add_sub:"任何 LiteLLM 兼容模型 — 任何提供商",
    new_model:"新模型",
    field_id:"模型 ID", field_name:"显示名称", field_provider:"提供商",
    field_apikey:"API 密钥", field_baseurl:"基础 URL", field_notes:"备注",
    check_active:"立即激活", add_btn:"添加模型",
    tip_id_title:"什么是模型 ID？", tip_id_body:"唯一标识符，格式为 提供商/模型名称。", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"什么是显示名称？", tip_name_body:"仪表板中显示的友好名称。", tip_name_examples:"Llama 3.3 70B\nGPT-4o\n我的本地模型",
    tip_provider_title:"什么是提供商？", tip_provider_body:"托管模型的公司或系统。", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"在哪里获取 API 密钥？", tip_apikey_body:"密钥认证令牌。本地模型请留空。", tip_apikey_examples:"Groq → console.groq.com（免费）\nOpenAI → platform.openai.com\nOllama → 留空",
    tip_baseurl_title:"什么是基础 URL？", tip_baseurl_body:"服务器地址。仅适用于本地模型。", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"备注（可选）", tip_notes_body:"个人提醒。", tip_notes_examples:"免费套餐 · 128k 上下文\n最适合代码生成",
    tip_active_title:"'立即激活'是什么意思？", tip_active_body:"勾选 = 模型立即启用。不勾选 = 保存但不激活。", tip_active_examples:"✓ 勾选 → 模型开启\n✗ 不勾选 → 已保存但关闭",
    help_title:"帮助", help_sub:"使用 Airvo 所需的一切信息",
    help_what_title:"Airvo 是什么？", help_what_body:"Airvo 是一个本地 AI 服务器，可同时将您的编辑器连接到任意 AI 模型。",
    help_adding_title:"添加模型 — 逐字段说明",
    help_field_id_title:"模型 ID", help_field_id_desc:"唯一标识符：提供商/模型名称。",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"显示名称", help_field_name_desc:"仪表板中的友好名称。",
    help_field_provider_title:"提供商", help_field_provider_desc:"托管模型的服务。",
    help_field_apikey_title:"API 密钥", help_field_apikey_desc:"认证令牌。本地模型请留空。",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"基础 URL", help_field_baseurl_desc:"仅适用于本地模型。",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"多模型模式",
    help_mode_parallel:"并行 — 所有模型同时响应，查看所有答案。",
    help_mode_race:"竞速 — 最先完成的模型获胜。",
    help_mode_vote:"投票 — 显示共识答案。",
    help_mode_review:"审阅 — 一个生成，另一个批评。",
    help_faq_title:"常见问题",
    help_faq_1_q:"我需要填写所有字段吗？", help_faq_1_a:"不需要。只有模型 ID、名称和提供商是必填项。",
    help_faq_2_q:"我可以使用任何模型吗？", help_faq_2_a:"是的 — 只要 LiteLLM 支持，Airvo 就支持。",
    help_faq_3_q:"我的 API 密钥存储在哪里？", help_faq_3_a:"存储在 ~/.airvo/models.json 中，永远不会离开您的电脑。",
    help_faq_4_q:"如何使用 Ollama？", help_faq_4_a:"安装 Ollama，下载模型，使用 ID: ollama/llama3，基础 URL: http://localhost:11434 添加。",
    help_faq_5_q:"什么是项目上下文？", help_faq_5_a:"注入每个请求的说明，让 Airvo 了解您的技术栈。",
    help_faq_6_q:"上下文会消耗额外的 Token 吗？", help_faq_6_a:"是的，每次请求消耗少量固定 Token（最多约 650）。这是可选功能。",
    help_faq_7_q:"什么是智能记忆 (RAG)？",
    help_faq_7_a:"智能记忆使用本地 AI 嵌入索引您的代码库。在每次请求前，Airvo 自动找到最相关的文件并注入到提示中。",
    help_faq_8_q:"我的代码会被发送到云端吗？",
    help_faq_8_a:"绝不会。嵌入模型 100% 在您的机器上运行。索引存储在 ~/.airvo/rag/ 中，您的代码永远不会离开您的电脑。",
    help_rag_title:"智能记忆 (RAG)",
    help_rag_what_title:"它的功能",
    help_rag_what_body:"智能记忆扫描您的项目，将文件拆分为块，在本地生成向量嵌入，并存储在 ChromaDB 中。每次发送消息时，Airvo 检索最相关的代码块并自动注入到 AI 上下文中。",
    help_rag_setup_title:"如何启用",
    help_rag_setup_steps:"1. 前往配置 → 智能记忆\n2. 开启 \"启用智能记忆\"（一次性下载约 90 MB）\n3. 输入项目路径\n4. 点击 \"立即索引\" 并等待\n5. 激活后，标题栏将显示 🧠 RAG 徽章",
    help_rag_privacy_title:"隐私与性能",
    help_rag_privacy_body:"一切在本地运行——嵌入、索引和检索。不发送任何数据。大多数项目的索引速度很快。",
    help_hw_title:"内存管理器",
    help_hw_body:"在状态页面实时查看 RAM 和 GPU 使用情况。显示哪些 Ollama 模型已加载到内存中，当 RAM 压力过大时发出警告（>75% 警告，>90% 严重），并支持一键卸载模型——无需终端。",
    help_hw_tip_title:"何时使用",
    help_hw_tip_body:"如果 Ollama 运行缓慢或无响应，请查看状态页面——可能同时加载了多个大型模型。卸载未使用的模型以释放 RAM。",
    help_disc_title:"模型发现",
    help_disc_body:"在模型页面，展开「🔭 发现模型」。本地标签显示按 RAM 容量过滤的 Ollama 目录——绿色标记表示适合，红色表示需要更多 RAM。云端标签显示 OpenRouter 模型，免费模型会被突出显示。",
    help_disc_tip_title:"快速添加",
    help_disc_tip_body:"点击任何已发现模型上的「+ 添加到 Airvo」。对于 Ollama 模型，复制显示的拉取命令并先在终端中运行。",
    help_history_title:"聊天历史限制",
    help_history_body:"Airvo 每次请求只发送最后 N 条对话消息（默认 10 条）。如果您在免费 API 层级上遇到 token 限制，请降低此值——Groq 免费层级每分钟允许 6k–12k tokens。完整历史保留在编辑器中；只有发送给模型的内容会被截断。",
    help_agent_title:"Agent/Plan 模式与模型选择",
    help_agent_what_title:"什么是 Agent/Plan 模式？",
    help_agent_what_body:"continue.dev 有 3 种模式：Chat（💬）、Agent（⚡）和 Plan（📋）。在 Agent 和 Plan 模式下，您的 IDE 会随消息发送工具定义——用于读取文件、编写代码、运行终端命令等的工具。",
    help_agent_why_title:"为什么 Agent/Plan 模式下只有一个模型响应？",
    help_agent_why_body:"工具调用是一个多轮有状态的对话：模型请求一个工具，IDE 运行它并返回结果，模型再请求另一个工具，如此往复。这种来回需要单个模型来维护上下文。并行运行多个模型意味着多个冲突的文件编辑。",
    help_agent_select_title:"选择哪个模型处理 Agent/Plan",
    help_agent_select_body:"在配置 → Agent/Plan 模型中，选择任意活跃模型。设为自动时，Airvo 使用列表中的第一个活跃模型。在此选择您最强大的模型——它将完成所有智能体工作。",
    help_agent_tip_title:"提示",
    help_agent_tip_body:"使用 Chat 模式比较所有模型的响应。当您需要 AI 实际编辑文件和运行命令时，请使用 Agent/Plan 模式——该模式始终使用一个模型。",
    agent_model_label:"Agent/Plan 模型",
    agent_model_sub:"用于 IDE 中 Agent 和 Plan 模式的模型。这些模式使用工具调用，需要单个模型。",
    agent_model_saved:"Agent 模型已保存 ✓",
    agent_model_auto:"自动（第一个活跃模型）",
    help_trouble_title:"故障排除",
    help_trouble_1_q:"Groq 或其他提供商出现速率限制错误 / tokens 过多",
    help_trouble_1_a:"前往配置 → 聊天历史限制，将其设置为 4 或 6 条消息。如果启用了智能记忆（RAG），还需将 RAG 上下文限制降低到 1000–2000 字符。",
    help_trouble_2_q:"无法连接到服务器 / 仪表板显示服务器离线",
    help_trouble_2_a:"确保 Airvo 正在运行：打开终端并运行 'airvo start'。验证 .env 文件中的端口（默认 8765）与扩展设置一致。",
    help_trouble_3_q:"模型显示错误 / 红色图标",
    help_trouble_3_a:"在模型页面检查该模型的 API 密钥。对于 Ollama 模型，确保 Ollama 正在运行（'ollama serve'）且模型已下载（'ollama pull 名称'）。",
    help_trouble_4_q:"智能记忆（RAG）找不到我的代码 / 检索效果不佳",
    help_trouble_4_a:"前往配置 → 智能记忆 → 点击「立即索引」。确认路径指向项目根目录。添加新文件后请重新索引。对大多数项目，Top K 设为 1–2 就足够了。",
    help_trouble_5_q:"模型发现未显示 Ollama 模型为已安装",
    help_trouble_5_a:"Ollama 可能未运行。使用 'ollama serve' 启动它。目录始终加载——已安装标记仅需要 Ollama 在 localhost:11434 上响应。",
    help_compare_title:"Compare 标签 — 功能指南",
    help_compare_intro:"Compare 标签是 Airvo 最强大的功能。它允许你同时向所有活跃模型发送相同的提示词，实时查看结果，并使用其他 AI 客户端没有的可视化工具分析差异。",
    help_compare_streaming_title:"⊞ 实时并行流式输出",
    help_compare_streaming_body:"输入提示词并点击比较（或按 Ctrl+Enter）后，所有活跃模型同时开始生成。你可以看到每个模型的 token 实时并排出现。",
    help_compare_diff_title:"▨ Diff 模式 — 词语与句子",
    help_compare_diff_body:"词语 diff 高亮每个只出现在某个模型回答中的词。句子 diff 比较完整句子。两种模式均在浏览器中计算，无需服务器调用。",
    help_compare_pin_title:"📌 设为参考基准",
    help_compare_pin_body:"点击任意卡片上的 📌 将该模型设为基准。在 diff 模式下，所有其他模型都与该基准进行比较。",
    help_compare_similarity_title:"相似度分数（Jaccard）",
    help_compare_similarity_body:"在性能栏底部可看到模型对之间的相似度百分比。绿色 ≥ 60% 表示模型基本一致，红色 < 35% 表示回答根本不同。",
    help_compare_templates_title:"💾 提示词模板",
    help_compare_templates_body:"点击文本框旁的保存按钮保存当前提示词。最多 10 个模板存储在浏览器本地，点击即可填充。",
    help_compare_temps_title:"🌡 每模型温度",
    help_compare_temps_body:"点击 🌡 展开每个活跃模型的独立温度滑块。带 * 的值使用配置中的全局温度。",
    help_compare_history_title:"历史记录与重新运行",
    help_compare_history_body:"Airvo 将最近 10 次比较保存在 ~/.airvo/compare_history.json 中，服务器重启后仍保留。用 ← → 导航，点击 🔁 重新运行以重发相同提示词。",
    help_compare_export_title:"📄 导出为 Markdown",
    help_compare_export_body:"将完整比较导出为 .md 文件，包括提示词、每个模型的回答、响应时间、token 数量和精确模型 ID。",
    help_compare_sort_title:"排序与专注模式",
    help_compare_sort_body:"按 ⚡ 速度或 📝 Token 数量排序卡片。⛶ 专注模式将单张卡片扩展至全宽。",
    help_stats_title:"统计 — 使用分析",
    help_stats_intro:"统计标签页追踪所有模型的实际使用情况——消耗的 token、估算的 API 费用、回答质量（基于您的复制行为）和延迟趋势。所有数据本地存储在 ~/.airvo/stats.json 中。",
    help_stats_tokens_title:"📊 各模型 Token 用量",
    help_stats_tokens_body:"水平条形图显示自上次重置以来每个模型生成的总 token 数。有助于了解您最依赖哪些模型。",
    help_stats_cost_title:"💰 估算费用",
    help_stats_cost_body:"基于典型定价估算每个模型的 API 支出（如 OpenAI ~$5/1M tokens，Anthropic ~$9/1M）。本地模型（Ollama、LM Studio）始终显示免费。这些是估算值——请查看您的服务商控制台了解确切账单。",
    help_stats_quality_title:"⭐ 质量排名",
    help_stats_quality_body:"按您点击复制该模型回答的次数对模型进行排名。这是隐式质量信号——如果您复制了某个模型的答案，说明它有用。🥇🥈🥉 奖牌授予前三名。",
    help_stats_latency_title:"⚡ 平均延迟",
    help_stats_latency_body:"所有记录请求中每个模型的平均响应时间。绿色 = 相对最快，黄色 = 中等，红色 = 最慢。在速度重要时选择合适模型时很有用。",
    help_stats_daily_title:"📅 每日活动",
    help_stats_daily_body:"迷你条形图显示过去 7 天每天的 token 使用情况。帮助发现规律——例如在高强度编码日您更多使用哪些模型。",
    config_context_memory_section:"上下文与内存",
    toast_activated:"模型已激活", toast_deactivated:"模型已停用",
    toast_key_saved:"API 密钥已保存 ✓", toast_key_error:"请输入有效的 API 密钥",
    toast_deleted:"模型已删除", toast_added:"模型已添加 ✓",
    toast_error_toggle:"更新时出错", toast_error_key:"保存密钥时出错",
    toast_error_delete:"删除时出错", toast_error_add:"添加模型时出错",
    confirm_delete:"删除此模型？",
    toast_limit:"Airvo 最多支持 3 个活跃模型。停用一个以激活另一个。",
    stat_v1_limit:"最多 3 个活跃",
    auto_detected:"自动检测",
    auto_local_hint:"本地模型 — 无 API 费用",
    auto_cloud_hint:"云端模型 — 由提供商计费",
    nav_compare:"对比", nav_stats:"统计", nav_bench:"基准测试",
    bench_title:"基准测试", bench_sub:"标准化提示词，用于测量和比较您的模型",
    bench_suite_speed:"速度测试", bench_suite_coding:"编程", bench_suite_reasoning:"推理", bench_suite_creative:"创意",
    bench_run:"运行基准测试", bench_running:"运行中",
    bench_no_active:"需要至少 2 个活跃模型才能运行基准测试。",
    bench_no_results:"尚无结果 — 选择测试套件并点击运行基准测试。",
    bench_leaderboard:"总体排行榜", bench_results:"各提示词结果",
    bench_clear:"清除历史", bench_history_title:"运行历史",
    compare_title:"响应对比",
    compare_sub:"最新多模型响应并排显示 — 复制并选择最佳答案",
    compare_empty:"暂无多模型响应",
    compare_empty_hint:"使用并行、投票或审阅模式，激浂2个以上模型，然后从 IDE 发送消息",
    compare_refresh:"刷新",
    compare_mode:"模式",
    compare_prompt:"提示词",
    compare_copy:"复制",
    compare_copied:"已复制 ✓",
    compare_tokens:"令牌",
    compare_error_badge:"错误",
    compare_at:"最后更新",
    compare_auto:"自动",
    compare_elapsed:"s",
    compare_history_label:"历史",
    compare_of:"/",
    compare_export:"导出 MD",
    compare_export_done:"已导出 ✓",
    compare_fastest:"最快",
    compare_most_tokens:"最多",
    compare_expand:"专注",
    compare_collapse:"显示全部",
    compare_copy_prompt:"复制提示",
    compare_stats:"性能",
    compare_time:"时间",
    compare_tok_s:"tok/s",
    compare_ask:"向模型提问",
    compare_send:"⊞ 比较",
    compare_sending:"运行中…",
    compare_send_placeholder:"输入提示词以比较所有活跃模型… (Ctrl+Enter)",
    compare_sort_default:"默认",
    compare_sort_speed:"⚡ 速度",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"需要 2+ 个活跃模型才能比较",
    compare_diff:"Diff",
    compare_diff_tip:"高亮每个模型独有的词语",
    compare_streaming:"流式输出…",
    compare_stream_done:"完成",
    compare_rerun:"🔁 重新运行",
    compare_clear:"🗑 清除历史",
    compare_clear_confirm:"清除所有比较历史？此操作无法撤销。",
    compare_cleared:"历史已清除",
    compare_template_save:"💾 保存",
    compare_template_saved:"模板已保存 ✓",
    compare_templates:"已保存的提示词",
    compare_similarity:"相似度",
    compare_diff_word:"词语",
    compare_diff_sentence:"句子",
    compare_temps:"每模型温度",
    compare_temp_reset:"重置",
    compare_pin:"设为参考",
    compare_unpin:"取消固定",
    compare_pinned:"参考",
  },
  ja: {
    nav_models:"モデル", nav_status:"ステータス", nav_config:"設定", nav_add:"モデルを追加", nav_help:"ヘルプ", nav_active:"アクティブ", nav_none:"なし",
    connecting:"接続中...", offline:"サーバーオフライン",
    models_title:"モデル", models_sub:"モデルを有効にしてAPIキーを設定する",
    suggestions_title:"提案", suggestions_sub:"APIキーを追加してこれらのモデルを使い始めましょう",
    stat_total:"合計", stat_active:"アクティブ", stat_free:"無料", stat_with_key:"キー設定済み",
    stat_models:"モデル", stat_parallel:"並列実行", stat_no_cost:"コストなし", stat_configured:"設定済み",
    loading_models:"モデルを読み込み中...",
    active:"アクティブ", inactive:"非アクティブ", free_badge:"無料", paid_badge:"有料",
    save_key:"保存", hide_key:"非表示", show_key:"表示", change_key:"変更", delete_btn:"削除",
    key_placeholder:"APIキー...",
    status_title:"ステータス", status_sub:"サーバー状態とアクティブモデル", server_label:"サーバー",
    status_online:"● オンライン", status_offline_msg:"サーバーに接続できません。",
    status_offline_hint:"Airvoが起動していることを確認してください",
    field_version:"バージョン", field_active:"アクティブモデル", field_total:"モデル総数",
    field_config:"設定ファイル", field_endpoint:"チャットエンドポイント",
    hw_label:"システムリソース", hw_sub:"RAM、GPUおよびメモリ内のOllamaモデル",
    hw_ram:"RAM", hw_used:"使用中", hw_free:"空き",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"メモリ内のモデル", hw_ollama_none:"モデルなし",
    hw_pressure_ok:"メモリ正常", hw_pressure_warning:"メモリ圧迫", hw_pressure_critical:"メモリ危機的",
    hw_unload_btn:"アンロード", hw_unload_confirm:"このモデルをメモリからアンロードしますか？",
    hw_unload_done:"モデルをアンロードしました ✓", hw_unload_error:"アンロード失敗",
    hw_no_psutil:"psutilが未インストール", hw_no_psutil_hint:"実行: pip install airvo[hardware]",
    hw_suggestions:"提案", hw_loading:"ハードウェア情報を読み込み中...",
    hw_refresh:"更新",
    hw_cpu:"CPU", hw_cpu_cores:"コア", hw_cpu_usage:"使用率",
    hw_processes:"メモリ消費トップ", hw_proc_sub:"最もRAMを使用しているプロセス",
    hw_proc_show:"プロセスを表示", hw_proc_hide:"非表示",
    disc_label:"モデルを発見", disc_sub:"ハードウェアに合ったモデルを検索",
    disc_local_tab:"ローカル (Ollama)", disc_cloud_tab:"クラウド (OpenRouter)",
    disc_fits:"RAMに入る", disc_too_large:"RAM不足", disc_installed:"インストール済み",
    disc_pull_cmd:"プルコマンド", disc_add_btn:"Airvoに追加", disc_added:"モデルを追加しました ✓",
    disc_add_error:"追加失敗", disc_loading:"モデルを読み追み中...",
    disc_ollama_offline:"Ollamaオフライン", disc_free_badge:"無料",
    disc_context:"コンテキスト", disc_no_results:"モデルが見つかりません", disc_ram_required:"必要なRAM",
    disc_already_added:"追加済み", disc_open_section:"発見",
    disc_local_explain:"ローカルモデルは Ollama を介してコンピューター上で 100% 実行されます — API キー不要、インターネット不要、無料。完全プライベート。",
    disc_local_how:"① 下の pull コマンドをコピー → ターミナルで実行してモデルをダウンロード。  ② 「+ Airvo に追加」をクリックして登録。",
    disc_fits_detail:"利用可能な RAM に収まります — スムーズに読み込んで実行できます",
    disc_too_large_detail:"利用可能な RAM より多くが必要 — 非常に遅いか読み込みに失敗する可能性があります",
    disc_cloud_explain:"クラウドモデルは OpenRouter のサーバーで実行されます — 高性能、ローカル GPU 不要。無料の OpenRouter API キーが必要です。",
    disc_cloud_how:"① 「+ Airvo に追加」をクリック。  ② モデルページで OpenRouter API キーを設定。  ③ モデルを有効化。",
    continue_label:"Continue.dev設定", continue_hint:"これをconfig.yamlに追加してください：",
    copy_config:"設定をコピー", copied:"コピー済み ✓",
    config_title:"設定", config_sub:"モード、温度、メモリ、設定",
    mode_label:"マルチモデルモード", active_models_label:"アクティブモデル",
    no_active_models:"アクティブなモデルがありません。モデルページで少なくとも1つ有効にしてください。",
    mode_parallel:"並列", mode_parallel_desc:"すべてのモデルが回答、すべての答えを表示",
    mode_race:"レース", mode_race_desc:"最も速いモデルが勝つ",
    mode_vote:"投票", mode_vote_desc:"モデル間のコンセンサス",
    mode_review:"レビュー", mode_review_desc:"1つが生成し、もう1つが批評", mode_set:"モード",
    tool_call_badge:"Agent/Planモード",
    tool_call_badge_tip:"IDEがツールコールを送信したため（AgentまたはPlanモード）、最後のリクエストは単一モデルを使用しました。マルチモデルはChatモードでのみ動作します。",
    mode_note_tools:"⚡ 最後のリクエストはAgent/Planモードを使用 — 1つのモデルのみが応答しました。これは正常です：ツールコールは単一モデルの会話が必要です。マルチモデル応答にはIDEでChatモードに切り替えてください。",
    last_req_multi:"マルチモデル ✓", last_req_single:"シングルモデル",
    temp_label:"温度",
    temp_hint_low:"0.0 — 決定論的、正確。コードに最適。",
    temp_hint_mid:"0.5 — バランス良好。ほとんどのタスクに適用。",
    temp_hint_high:"1.0 — 創造的、多様。ブレインストーミングに最適。",
    temp_saved:"温度を保存しました",
    maxtokens_label:"最大トークン数",
    maxtokens_saved:"最大トークン数を保存しました",
    maxhistory_label:"履歴制限",
    maxhistory_sub:"リクエストごとの最大メッセージ数。小さいほど送信トークンが少なくなります。",
    maxhistory_saved:"制限を保存しました",
    memory_label:"プロジェクトコンテキスト",
    memory_sub:"一度書くと、すべてのリクエストに注入されます。Airvoがあなたのスタックを理解するのに役立ちます。",
    memory_enable:"プロジェクトコンテキストを有効にする",
    memory_placeholder:"例：\nFastAPIとPython 3.12を使用しています。\n常にasync/awaitと型アノテーションを使用。\nEコマースREST API。\nRailwayにDockerでデプロイ。",
    memory_chars:"文字", memory_max:"最大",
    memory_saved:"コンテキストを保存しました ✓",
    memory_too_long:"コンテキストが長すぎます — 短くしてください",
    memory_tokens_warning:"⚠ コンテキストが大きい — 削減を検討してください",
    rag_label:"スマートメモリ (RAG)",
    rag_sub:"コードベースのセマンティック検索 — 関連するコードが自動的にリクエストに挿入されます。完全ローカル動作。",
    rag_enable:"スマートメモリを有効にする",
    rag_warning_title:"初回セットアップが必要です",
    rag_warning_body:"スマートメモリは初回使用時にローカル埋め込みモデル（約90 MB）をダウンロードします。コードがコンピュータの外に出ることはありません。",
    rag_warning_confirm:"それでも有効にする",
    rag_path_label:"プロジェクトパス",
    rag_path_placeholder:"/your/project/path",
    rag_index_btn:"今すぐインデックス",
    rag_indexing:"インデックス中…",
    rag_status_files:"インデックス済みファイル",
    rag_status_chunks:"チャンク",
    rag_status_size:"MB インデックス",
    rag_status_last:"最終インデックス",
    rag_status_never:"なし",
    rag_clear_btn:"インデックスを削除",
    rag_clear_confirm:"RAGインデックス全体を削除しますか？この操作は元に戻せません。",
    rag_clear_done:"インデックスを削除しました",
    rag_index_done:"インデックス完了 ✓",
    rag_index_error:"インデックス失敗",
    rag_not_available:"RAG依存関係がインストールされていません",
    rag_install_hint:"実行：pip install airvo[rag]",
    rag_advanced:"詳細設定",
    rag_max_mb:"最大インデックスサイズ (MB)",
    rag_max_kb:"最大ファイルサイズ (KB)",
    rag_top_k:"リクエストごとの結果数",
    rag_max_inject_chars:"最大注入コンテキスト（文字）",
    stats_label:"使用統計",
    stats_requests:"リクエスト", stats_tokens:"トークン",
    stats_reset:"統計をリセット",
    stats_reset_confirm:"すべての使用統計をリセットしますか？",
    stats_reset_done:"統計をリセットしました",
    stats_empty:"データがまだありません。コーディングを始めましょう！",
    stats_tab_title:"使用状況分析", stats_tab_sub:"モデルごとのトークン使用量、推定コスト、品質ランキング、レイテンシ",
    stats_section_tokens:"モデル別トークン", stats_section_cost:"推定コスト", stats_section_quality:"品質ランキング",
    stats_section_latency:"平均レイテンシ", stats_section_daily:"日別アクティビティ — 過去7日間",
    stats_copies:"コピー数", stats_free:"無料", stats_local:"ローカル",
    stats_latency_avg:"平均", stats_latency_unit:"秒",
    stats_cost_note:"* 一般的なAPI料金に基づく推定です。実際のコストは異なる場合があります。",
    stats_quality_note:"モデルの回答をコピーした回数に基づく",
    stats_no_history:"日別データがまだありません",
    stats_total_tokens:"合計トークン", stats_total_requests:"合計リクエスト",
    add_title:"モデルを追加", add_sub:"LiteLLM互換のモデル — あらゆるプロバイダー",
    new_model:"新しいモデル",
    field_id:"モデルID", field_name:"表示名", field_provider:"プロバイダー",
    field_apikey:"APIキー", field_baseurl:"ベースURL", field_notes:"メモ",
    check_active:"すぐに有効化", add_btn:"モデルを追加",
    tip_id_title:"モデルIDとは？", tip_id_body:"プロバイダー/モデル名の形式の一意の識別子。", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"表示名とは？", tip_name_body:"ダッシュボードに表示されるわかりやすい名前。", tip_name_examples:"Llama 3.3 70B\nGPT-4o\n私のローカルモデル",
    tip_provider_title:"プロバイダーとは？", tip_provider_body:"モデルをホストする会社またはシステム。", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"APIキーはどこで取得しますか？", tip_apikey_body:"認証トークン。ローカルモデルは空白のままにしてください。", tip_apikey_examples:"Groq → console.groq.com（無料）\nOpenAI → platform.openai.com\nOllama → 空白のまま",
    tip_baseurl_title:"ベースURLとは？", tip_baseurl_body:"サーバーアドレス。ローカルモデルのみ必要。", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"メモ（任意）", tip_notes_body:"個人的なリマインダー。", tip_notes_examples:"無料プラン · 128kコンテキスト\nコード生成に最適",
    tip_active_title:"'すぐに有効化'とは？", tip_active_body:"チェック = すぐにモデルON。チェックなし = 保存されるが非アクティブ。", tip_active_examples:"✓ チェック → モデルON\n✗ チェックなし → 保存済みだがOFF",
    help_title:"ヘルプ", help_sub:"Airvoを使用するために必要なすべての情報",
    help_what_title:"Airvoとは？", help_what_body:"Airvoは、エディターを任意のAIモデルに同時に接続するローカルAIサーバーです。",
    help_adding_title:"モデルの追加 — フィールドごとの説明",
    help_field_id_title:"モデルID", help_field_id_desc:"一意のキー：プロバイダー/モデル名。",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"表示名", help_field_name_desc:"ダッシュボードのわかりやすい名前。",
    help_field_provider_title:"プロバイダー", help_field_provider_desc:"モデルをホストするサービス。",
    help_field_apikey_title:"APIキー", help_field_apikey_desc:"認証トークン。ローカルモデルは空白のまま。",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"ベースURL", help_field_baseurl_desc:"ローカルモデルのみ必要。",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"マルチモデルモード",
    help_mode_parallel:"並列 — すべてのモデルが回答。すべての答えを表示。",
    help_mode_race:"レース — 最初に回答したモデルが勝つ。",
    help_mode_vote:"投票 — コンセンサス回答を表示。",
    help_mode_review:"レビュー — 1つが生成し、もう1つが批評。",
    help_faq_title:"よくある質問",
    help_faq_1_q:"すべてのフィールドに入力する必要がありますか？", help_faq_1_a:"いいえ。必須はモデルID、名前、プロバイダーのみです。",
    help_faq_2_q:"どんなモデルでも使えますか？", help_faq_2_a:"はい — LiteLLMがサポートしていれば、Airvoもサポートします。",
    help_faq_3_q:"APIキーはどこに保存されますか？", help_faq_3_a:"~/.airvo/models.jsonに保存されます。コンピューターから外に出ることはありません。",
    help_faq_4_q:"Ollamaはどのように使いますか？", help_faq_4_a:"Ollamaをインストールし、モデルをダウンロードして、ID: ollama/llama3、ベースURL: http://localhost:11434で追加してください。",
    help_faq_5_q:"プロジェクトコンテキストとは？", help_faq_5_a:"毎回のリクエストに注入されるメモで、Airvoがあなたのスタックを理解するのに役立ちます。",
    help_faq_6_q:"コンテキストは追加のトークンを消費しますか？", help_faq_6_a:"はい、リクエストごとに少量の固定トークン（最大約650）を消費します。オプション機能です。",
    help_faq_7_q:"スマートメモリ (RAG) とは何ですか？",
    help_faq_7_a:"スマートメモリはローカルAIエンベディングを使ってコードベースをインデックス化します。各リクエストの前に、Airvoが最も関連性の高いファイルを自動的に見つけてプロンプトに注入します。",
    help_faq_8_q:"コードはクラウドに送信されますか？",
    help_faq_8_a:"絶対に送信されません。エンベディングモデルは100%あなたのマシン上で動作します。インデックスは ~/.airvo/rag/ に保存され、コードがコンピュータの外に出ることはありません。",
    help_rag_title:"スマートメモリ (RAG)",
    help_rag_what_title:"機能の説明",
    help_rag_what_body:"スマートメモリはプロジェクトをスキャンし、ファイルをチャンクに分割し、ローカルでベクターエンベディングを生成してChromaDBに保存します。メッセージを送信するたびに、Airvoが最も関連性の高いコードチャンクを取得し、AIのコンテキストに自動的に注入します。",
    help_rag_setup_title:"有効化の手順",
    help_rag_setup_steps:"1. 設定 → スマートメモリに移動\n2. \"スマートメモリを有効にする\" をONにする（初回のみ約90MBダウンロード）\n3. プロジェクトのパスを入力\n4. \"今すぐインデックス\" をクリックして待機\n5. アクティブになるとヘッダーに 🧠 RAG バッジが表示されます",
    help_rag_privacy_title:"プライバシーとパフォーマンス",
    help_rag_privacy_body:"エンベディング、インデックス、検索のすべてがローカルで実行されます。データは送信されません。ほとんどのプロジェクトでインデックス化は高速です。",
    help_hw_title:"メモリマネージャー",
    help_hw_body:"ステータスページでRAMとGPUの使用状況をリアルタイムで確認できます。Ollamaモデルのメモリ読み込み状況を表示し、RAM負荷が高い場合（>75% 警告、>90% 危険）に警告し、ターミナル不要でワンクリックでモデルをアンロードできます。",
    help_hw_tip_title:"使用タイミング",
    help_hw_tip_body:"Ollamaが遅い、または応答しない場合はステータスを確認してください — 複数の大きなモデルが同時に読み込まれている可能性があります。未使用のものをアンロードしてRAMを解放してください。",
    help_disc_title:"モデル検出",
    help_disc_body:"モデルページで「🔭 モデルを探す」を展開します。ローカルタブはRAMに収まるものでフィルタされたOllamaカタログを表示します — 緑バッジは適合、赤は追加RAMが必要。クラウドタブは無料モデルをハイライトしたOpenRouterモデルを表示します。",
    help_disc_tip_title:"クイック追加",
    help_disc_tip_body:"発見されたモデルの「+ Airvoに追加」をクリックします。Ollamaモデルの場合、表示されたpullコマンドをコピーしてターミナルで先に実行してください。",
    help_history_title:"チャット履歴制限",
    help_history_body:"Airvoはリクエストごとに最後のNメッセージのみを送信します（デフォルト10）。無料APIティアでトークン制限に達した場合は減らしてください — Groq無料ティアは1分あたり6k〜12kトークン。完全な履歴はエディターに残ります；モデルに送信されるものだけがトリミングされます。",
    help_agent_title:"エージェント/プランモードとモデル選択",
    help_agent_what_title:"エージェント/プランモードとは？",
    help_agent_what_body:"continue.devには3つのモードがあります：Chat（💬）、Agent（⚡）、Plan（📋）。AgentとPlanでは、IDEがメッセージと一緒にツール定義を送信します——ファイルの読み取り、コード作成、ターミナルコマンド実行などのツールです。",
    help_agent_why_title:"なぜAgent/Planモードでは1つのモデルしか応答しないのですか？",
    help_agent_why_body:"ツール呼び出しはマルチターンのステートフルな会話です：モデルがツールをリクエストし、IDEがそれを実行して結果を返し、モデルが別のツールをリクエストし、といった具合に続きます。このやり取りにはコンテキストを維持するために単一モデルが必要です。複数のモデルを並行実行すると、矛盾するファイル編集が発生します。",
    help_agent_select_title:"Agent/Planを処理するモデルの選択",
    help_agent_select_body:"設定 → Agent/Planモデルで、アクティブなモデルを選択してください。Autoに設定すると、Airvoはリストの最初のアクティブモデルを使用します。最も高性能なモデルを選択してください——それがすべてのエージェント作業を行います。",
    help_agent_tip_title:"ヒント",
    help_agent_tip_body:"すべてのモデルの応答を比較するにはChatモードを使用してください。AIに実際にファイルを編集してコマンドを実行させる場合はAgent/Planモードを使用してください——常に1つのモデルを使用します。",
    agent_model_label:"Agent/Planモデル",
    agent_model_sub:"IDEのAgentおよびPlanモードに使用されるモデル。これらのモードはツール呼び出しを使用し、単一モデルが必要です。",
    agent_model_saved:"エージェントモデルを保存しました ✓",
    agent_model_auto:"自動（最初のアクティブモデル）",
    help_trouble_title:"トラブルシューティング",
    help_trouble_1_q:"Groqまたは他のプロバイダーからのレート制限エラー / トークンが多すぎる",
    help_trouble_1_a:"設定 → チャット履歴制限 に移動して4または6メッセージに設定してください。スマートメモリ（RAG）が有効な場合はRAGコンテキスト上限も1000〜2000文字に下げてください。",
    help_trouble_2_q:"サーバーに接続できない / ダッシュボードがサーバーオフラインを表示",
    help_trouble_2_a:"Airvoが実行中か確認してください：ターミナルを開いて 'airvo start' を実行。.envファイルのポート（デフォルト8765）が拡張機能の設定と一致しているか確認してください。",
    help_trouble_3_q:"モデルがエラー / 赤いアイコンを表示する",
    help_trouble_3_a:"モデルページでそのモデルのAPIキーを確認してください。Ollamaモデルの場合、Ollamaが実行中（'ollama serve'）でモデルがダウンロード済み（'ollama pull 名前'）か確認してください。",
    help_trouble_4_q:"スマートメモリ（RAG）がコードを見つけない / 検索がうまくいかない",
    help_trouble_4_a:"設定 → スマートメモリ → 「今すぐインデックス」をクリック。パスがプロジェクトルートを指しているか確認。新しいファイル追加後は再インデックスしてください。Top K 1〜2がほとんどのプロジェクトで十分です。",
    help_trouble_5_q:"モデル検出がOllamaモデルをインストール済みとして表示しない",
    help_trouble_5_a:"Ollamaが実行されていない可能性があります。'ollama serve' で起動してください。カタログは常に読み込まれます — インストール済みバッジはOllamaがlocalhost:11434で応答することのみを必要とします。",
    help_compare_title:"Compareタブ — 機能ガイド",
    help_compare_intro:"CompareタブはAirvoの最も強力な機能です。すべてのアクティブモデルに同じプロンプトを同時に送信し、リアルタイムで結果を視覚的に分析できます。",
    help_compare_streaming_title:"⊞ リアルタイム並列ストリーミング",
    help_compare_streaming_body:"プロンプトを入力して比較をクリック（またはCtrl+Enter）すると、すべてのアクティブモデルが同時に生成を開始します。各モデルのトークンがリアルタイムで並んで表示されます。",
    help_compare_diff_title:"▨ Diffモード — 単語と文",
    help_compare_diff_body:"単語Diffは、あるモデルの回答にのみ出現する単語を強調表示します。文Diffは文全体を比較します。どちらもブラウザ内で計算され、サーバー呼び出し不要です。",
    help_compare_pin_title:"📌 参照としてピン",
    help_compare_pin_body:"任意のカードの📌をクリックしてそのモデルをベースラインに設定します。Diffモードでは、他のすべてのモデルがピンされたモデルと比較されます。",
    help_compare_similarity_title:"類似度スコア（Jaccard）",
    help_compare_similarity_body:"パフォーマンスバーの下部にモデルペア間の類似度パーセントが表示されます。緑≥60%はモデルがほぼ一致、赤<35%は根本的に異なる回答を意味します。",
    help_compare_templates_title:"💾 プロンプトテンプレート",
    help_compare_templates_body:"テキストエリア横の保存ボタンで現在のプロンプトを保存。最大10件のテンプレートがブラウザにローカル保存され、クリックで入力できます。",
    help_compare_temps_title:"🌡 モデル別温度",
    help_compare_temps_body:"🌡をクリックして各アクティブモデルの個別温度スライダーを表示します。*付きの値は設定のグローバル温度を使用します。",
    help_compare_history_title:"履歴と再実行",
    help_compare_history_body:"Airvoは最新10件の比較を~/.airvo/compare_history.jsonに保存します（再起動後も残ります）。← →で移動、🔁再実行で同じプロンプトを再送信できます。",
    help_compare_export_title:"📄 Markdownにエクスポート",
    help_compare_export_body:"プロンプト、各モデルの回答、応答時間、トークン数、正確なモデルIDを含む完全な比較を.mdファイルとしてエクスポートします。",
    help_compare_sort_title:"並び替えとフォーカス",
    help_compare_sort_body:"⚡速度または📝トークン数でカードを並び替え。⛶フォーカスで1枚のカードを全幅に拡大できます。",
    help_stats_title:"Stats — 使用状況アナリティクス",
    help_stats_intro:"Statsタブは全モデルの実際の使用状況を追跡します——消費トークン、推定APIコスト、回答品質（コピーした内容に基づく）、レイテンシの傾向。すべてのデータは~/.airvo/stats.jsonにローカル保存されます。",
    help_stats_tokens_title:"📊 モデル別トークン",
    help_stats_tokens_body:"統計をリセットしてからモデルごとに生成された総トークン数を示す横棒グラフ。どのモデルを最も多く使っているかを把握するのに役立ちます。",
    help_stats_cost_title:"💰 推定コスト",
    help_stats_cost_body:"一般的な料金に基づくモデルごとの推定API支出（例：OpenAI ~$5/1Mトークン、Anthropic ~$9/1M）。ローカルモデル（Ollama、LM Studio）は常に無料と表示。これらは推定値です——正確な請求はプロバイダーのダッシュボードを確認してください。",
    help_stats_quality_title:"⭐ 品質ランキング",
    help_stats_quality_body:"回答に対してコピーをクリックした回数でモデルをランキング。これは暗黙的な品質シグナルです——モデルの回答をコピーしたなら、それは有用だったということ。🥇🥈🥉はトップ3に授与されます。",
    help_stats_latency_title:"⚡ 平均レイテンシ",
    help_stats_latency_body:"記録された全リクエストのモデルごとの平均応答時間。緑 = 他より最速、黄 = 中程度、赤 = 最遅。速度が重要な場面で適切なモデルを選ぶのに役立ちます。",
    help_stats_daily_title:"📅 日別アクティビティ",
    help_stats_daily_body:"過去7日間の日ごとのトークン使用量を示すスパークライン棒グラフ。傾向を発見するのに役立ちます——例えばコーディング集中日にどのモデルをより多く使うかなど。",
    config_context_memory_section:"コンテキスト & メモリ",
    toast_activated:"モデルを有効化しました", toast_deactivated:"モデルを無効化しました",
    toast_key_saved:"APIキーを保存しました ✓", toast_key_error:"有効なAPIキーを入力してください",
    toast_deleted:"モデルを削除しました", toast_added:"モデルを追加しました ✓",
    toast_error_toggle:"更新エラー", toast_error_key:"保存エラー",
    toast_error_delete:"削除エラー", toast_error_add:"モデル追加エラー",
    confirm_delete:"このモデルを削除しますか？",
    toast_limit:"Airvoは最大3つのアクティブモデルをサポートします。別のモデルを有効化するには1つ無効化してください。",
    stat_v1_limit:"最大3つアクティブ",
    auto_detected:"自動検出",
    auto_local_hint:"ローカルモデル — APIコストなし",
    auto_cloud_hint:"クラウドモデル — プロバイダーによる課金",
    nav_compare:"比較", nav_stats:"統計", nav_bench:"ベンチマーク",
    bench_title:"ベンチマーク", bench_sub:"モデルを測定・比較するための標準化されたプロンプト",
    bench_suite_speed:"スピードテスト", bench_suite_coding:"コーディング", bench_suite_reasoning:"推論", bench_suite_creative:"創造性",
    bench_run:"ベンチマーク実行", bench_running:"実行中",
    bench_no_active:"ベンチマークには少なくとも2つのアクティブモデルが必要です。",
    bench_no_results:"まだ結果がありません — スイートを選択してベンチマーク実行をクリックしてください。",
    bench_leaderboard:"総合リーダーボード", bench_results:"プロンプト別結果",
    bench_clear:"履歴をクリア", bench_history_title:"実行履歴",
    compare_title:"レスポンス比較",
    compare_sub:"最新のマルチモデルレスポンスを並べて表示 — コピーして最良を選択",
    compare_empty:"マルチモデルレスポンスはまだありません",
    compare_empty_hint:"2つ以上のモデルを有効にしてParallel/Vote/Reviewモードを使用し、IDEからメッセージを送信してください",
    compare_refresh:"更新",
    compare_mode:"モード",
    compare_prompt:"プロンプト",
    compare_copy:"コピー",
    compare_copied:"コピー済み ✓",
    compare_tokens:"トークン",
    compare_error_badge:"エラー",
    compare_at:"最終更新",
    compare_auto:"自動",
    compare_elapsed:"s",
    compare_history_label:"履歴",
    compare_of:"/",
    compare_export:"MD エクスポート",
    compare_export_done:"エクスポート済み ✓",
    compare_fastest:"最速",
    compare_most_tokens:"最多",
    compare_expand:"フォーカス",
    compare_collapse:"全て表示",
    compare_copy_prompt:"プロンプトをコピー",
    compare_stats:"パフォーマンス",
    compare_time:"時間",
    compare_tok_s:"tok/s",
    compare_ask:"モデルに質問",
    compare_send:"⊞ 比較",
    compare_sending:"実行中…",
    compare_send_placeholder:"全アクティブモデルを比較するプロンプトを入力… (Ctrl+Enter)",
    compare_sort_default:"デフォルト",
    compare_sort_speed:"⚡ 速度",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"比較には2つ以上のアクティブモデルが必要です",
    compare_diff:"Diff",
    compare_diff_tip:"各モデルに固有の言葉をハイライト",
    compare_streaming:"ストリーミング中…",
    compare_stream_done:"完了",
    compare_rerun:"🔁 再実行",
    compare_clear:"🗑 履歴をクリア",
    compare_clear_confirm:"全ての比較履歴をクリアしますか？この操作は元に戻せません。",
    compare_cleared:"履歴をクリアしました",
    compare_template_save:"💾 保存",
    compare_template_saved:"テンプレート保存 ✓",
    compare_templates:"保存済みプロンプト",
    compare_similarity:"類似度",
    compare_diff_word:"単語",
    compare_diff_sentence:"文",
    compare_temps:"モデル別温度",
    compare_temp_reset:"リセット",
    compare_pin:"参照としてピン",
    compare_unpin:"ピン解除",
    compare_pinned:"参照",
  },
  pt: {
    nav_models:"Modelos", nav_status:"Status", nav_config:"Configuração", nav_add:"Adicionar Modelo", nav_help:"Ajuda", nav_active:"ATIVOS", nav_none:"nenhum",
    connecting:"conectando...", offline:"servidor offline",
    models_title:"Modelos", models_sub:"Ative modelos e configure suas chaves de API",
    suggestions_title:"Sugestões", suggestions_sub:"Adicione uma chave de API para começar a usar esses modelos",
    stat_total:"Total", stat_active:"Ativos", stat_free:"Gratuitos", stat_with_key:"Com Chave",
    stat_models:"modelos", stat_parallel:"em paralelo", stat_no_cost:"sem custo", stat_configured:"configurados",
    loading_models:"Carregando modelos...",
    active:"ativo", inactive:"inativo", free_badge:"GRÁTIS", paid_badge:"PAGO",
    save_key:"Salvar", hide_key:"ocultar", show_key:"exibir", change_key:"alterar", delete_btn:"excluir",
    key_placeholder:"Chave API...",
    status_title:"Status", status_sub:"Estado do servidor e modelos ativos", server_label:"Servidor",
    status_online:"● Online", status_offline_msg:"Não foi possível conectar ao servidor.",
    status_offline_hint:"Certifique-se de que o Airvo está rodando com",
    field_version:"Versão", field_active:"Modelos ativos", field_total:"Total de modelos",
    field_config:"Arquivo de configuração", field_endpoint:"Endpoint de chat",
    hw_label:"Recursos do Sistema", hw_sub:"RAM, GPU e modelos Ollama na memória",
    hw_ram:"RAM", hw_used:"usada", hw_free:"livre",
    hw_gpu:"GPU", hw_vram:"VRAM",
    hw_ollama_models:"Modelos na memória", hw_ollama_none:"Nenhum modelo carregado",
    hw_pressure_ok:"Memória OK", hw_pressure_warning:"Pressão de memória", hw_pressure_critical:"Memória crítica",
    hw_unload_btn:"Descarregar", hw_unload_confirm:"Descarregar este modelo da memória?",
    hw_unload_done:"Modelo descarregado ✓", hw_unload_error:"Falha ao descarregar",
    hw_no_psutil:"psutil não instalado", hw_no_psutil_hint:"Execute: pip install airvo[hardware]",
    hw_suggestions:"Sugestões", hw_loading:"Carregando informações de hardware...",
    hw_refresh:"Atualizar",
    hw_cpu:"CPU", hw_cpu_cores:"núcleos", hw_cpu_usage:"uso",
    hw_processes:"Maiores consumidores de memória", hw_proc_sub:"Processos que mais consomem RAM",
    hw_proc_show:"Ver processos", hw_proc_hide:"Ocultar",
    disc_label:"Descobrir Modelos", disc_sub:"Explore modelos compatíveis com seu hardware",
    disc_local_tab:"Local (Ollama)", disc_cloud_tab:"Nuvem (OpenRouter)",
    disc_fits:"Cabe na RAM", disc_too_large:"Precisa de mais RAM", disc_installed:"Instalado",
    disc_pull_cmd:"Comando de download", disc_add_btn:"Adicionar ao Airvo", disc_added:"Modelo adicionado ✓",
    disc_add_error:"Falha ao adicionar", disc_loading:"Carregando modelos...",
    disc_ollama_offline:"Ollama offline", disc_free_badge:"Grátis",
    disc_context:"contexto", disc_no_results:"Nenhum modelo encontrado", disc_ram_required:"RAM necessária",
    disc_already_added:"Já adicionado", disc_open_section:"Descobrir",
    disc_local_explain:"Modelos locais rodam 100% no seu computador via Ollama — sem chave API, sem internet, sem custo. Completamente privado.",
    disc_local_how:"① Copie o pull command abaixo → execute no terminal para baixar o modelo.  ② Clique em '+ Adicionar ao Airvo' para registrá-lo.",
    disc_fits_detail:"Cabe na sua RAM disponível — vai carregar e rodar sem problemas",
    disc_too_large_detail:"Precisa de mais RAM do que disponível — pode ser muito lento ou falhar ao carregar",
    disc_cloud_explain:"Modelos cloud rodam nos servidores do OpenRouter — poderosos, sem GPU local. Requer uma chave API gratuita do OpenRouter.",
    disc_cloud_how:"① Clique em '+ Adicionar ao Airvo'.  ② Vá em Modelos e configure sua chave OpenRouter.  ③ Ative o modelo.",
    continue_label:"Configuração Continue.dev", continue_hint:"Adicione isto ao seu config.yaml:",
    copy_config:"Copiar configuração", copied:"Copiado ✓",
    config_title:"Configuração", config_sub:"Modo, temperatura, memória e preferências",
    mode_label:"Modo Multi-Modelo", active_models_label:"Modelos Ativos",
    no_active_models:"Nenhum modelo ativo. Ative pelo menos um em Modelos.",
    mode_parallel:"Paralelo", mode_parallel_desc:"Todos os modelos respondem, você vê todas as respostas",
    mode_race:"Corrida", mode_race_desc:"O modelo mais rápido vence",
    mode_vote:"Votação", mode_vote_desc:"Consenso entre os modelos",
    mode_review:"Revisão", mode_review_desc:"Um gera, outro critica", mode_set:"Modo",
    tool_call_badge:"Modo Agent/Plan",
    tool_call_badge_tip:"O último request usou um único modelo porque seu IDE enviou tool calls (modo Agent ou Plan). Multi-modelo só funciona no modo Chat.",
    mode_note_tools:"⚡ Último request usou modo Agent/Plan — apenas 1 modelo respondeu. Isso é esperado: tool calls exigem conversa com um único modelo. Mude para modo Chat no IDE para respostas multi-modelo.",
    last_req_multi:"multi-modelo ✓", last_req_single:"modelo único",
    temp_label:"Temperatura",
    temp_hint_low:"0.0 — determinístico, preciso. Ideal para código.",
    temp_hint_mid:"0.5 — equilibrado. Bom para a maioria das tarefas.",
    temp_hint_high:"1.0 — criativo, variado. Ideal para brainstorming.",
    temp_saved:"Temperatura salva",
    maxtokens_label:"Máximo de Tokens",
    maxtokens_saved:"Máximo de tokens salvo",
    maxhistory_label:"Limite do Histórico",
    maxhistory_sub:"Máx. mensagens por requisição. Menor = menos tokens enviados ao modelo.",
    maxhistory_saved:"Limite salvo",
    memory_label:"Contexto do Projeto",
    memory_sub:"Escreva uma vez, injetado em cada requisição. Ajuda o Airvo a entender seu stack.",
    memory_enable:"Ativar contexto do projeto",
    memory_placeholder:"Exemplo:\nUso FastAPI e Python 3.12.\nSempre async/await e type hints.\nAPI REST de e-commerce.\nDeploy no Railway com Docker.",
    memory_chars:"caracteres", memory_max:"máx",
    memory_saved:"Contexto salvo ✓",
    memory_too_long:"Contexto muito longo — reduza-o",
    memory_tokens_warning:"⚠ Contexto grande — considere reduzir",
    rag_label:"Memória Inteligente (RAG)",
    rag_sub:"Busca semântica no seu código — trechos relevantes injetados automaticamente em cada solicitação. 100% local.",
    rag_enable:"Ativar Memória Inteligente",
    rag_warning_title:"Configuração única necessária",
    rag_warning_body:"A Memória Inteligente baixa um modelo de embeddings local (~90 MB) na primeira vez. Seu código nunca sai do seu computador.",
    rag_warning_confirm:"Ativar mesmo assim",
    rag_path_label:"Caminho do Projeto",
    rag_path_placeholder:"/caminho/para/seu/projeto",
    rag_index_btn:"Indexar Agora",
    rag_indexing:"Indexando…",
    rag_status_files:"arquivos indexados",
    rag_status_chunks:"fragmentos",
    rag_status_size:"MB de índice",
    rag_status_last:"Última indexação",
    rag_status_never:"nunca",
    rag_clear_btn:"Limpar Índice",
    rag_clear_confirm:"Excluir o índice RAG inteiro? Esta ação não pode ser desfeita.",
    rag_clear_done:"Índice limpo",
    rag_index_done:"Indexação concluída ✓",
    rag_index_error:"Falha na indexação",
    rag_not_available:"Dependências RAG não instaladas",
    rag_install_hint:"Execute: pip install airvo[rag]",
    rag_advanced:"Configurações avançadas",
    rag_max_mb:"Tamanho máximo do índice (MB)",
    rag_max_kb:"Tamanho máximo por arquivo (KB)",
    rag_top_k:"Resultados por solicitação",
    rag_max_inject_chars:"Máx. contexto injetado (chars)",
    stats_label:"Estatísticas de Uso",
    stats_requests:"requisições", stats_tokens:"tokens",
    stats_reset:"Resetar estatísticas",
    stats_reset_confirm:"Resetar todas as estatísticas de uso?",
    stats_reset_done:"Estatísticas resetadas",
    stats_empty:"Sem dados ainda. Comece a programar!",
    stats_tab_title:"Análise de Uso", stats_tab_sub:"Tokens usados, custo estimado, ranking de qualidade e latência por modelo",
    stats_section_tokens:"Tokens por Modelo", stats_section_cost:"Custo Estimado", stats_section_quality:"Ranking de Qualidade",
    stats_section_latency:"Latência Média", stats_section_daily:"Atividade Diária — Últimos 7 Dias",
    stats_copies:"cópias", stats_free:"Grátis", stats_local:"Local",
    stats_latency_avg:"méd", stats_latency_unit:"s",
    stats_cost_note:"* Estimativas baseadas em preços típicos de API. Os custos reais podem variar.",
    stats_quality_note:"Baseado em quantas vezes você copiou a resposta do modelo",
    stats_no_history:"Sem dados diários ainda",
    stats_total_tokens:"Total de tokens", stats_total_requests:"Total de requisições",
    add_title:"Adicionar Modelo", add_sub:"Qualquer modelo compatível com LiteLLM — qualquer provedor",
    new_model:"Novo Modelo",
    field_id:"ID do Modelo", field_name:"Nome de Exibição", field_provider:"Provedor",
    field_apikey:"Chave API", field_baseurl:"URL Base", field_notes:"Notas",
    check_active:"Ativar imediatamente", add_btn:"Adicionar Modelo",
    tip_id_title:"O que é o ID do Modelo?", tip_id_body:"Identificador único no formato provedor/nome-modelo.", tip_id_examples:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nanthropic/claude-sonnet-4-5\nollama/llama3",
    tip_name_title:"O que é o Nome de Exibição?", tip_name_body:"Nome amigável exibido no painel.", tip_name_examples:"Llama 3.3 70B\nGPT-4o\nMeu Modelo Local",
    tip_provider_title:"O que é o Provedor?", tip_provider_body:"A empresa ou sistema que hospeda o modelo.", tip_provider_examples:"groq · openai · anthropic · ollama · lmstudio",
    tip_apikey_title:"Onde obter a Chave API?", tip_apikey_body:"Token secreto de autenticação. Deixe vazio para modelos locais.", tip_apikey_examples:"Groq → console.groq.com (grátis)\nOpenAI → platform.openai.com\nOllama → deixar vazio",
    tip_baseurl_title:"O que é a URL Base?", tip_baseurl_body:"Endereço do servidor. Apenas para modelos locais.", tip_baseurl_examples:"Ollama → http://localhost:11434\nLM Studio → http://localhost:1234",
    tip_notes_title:"Notas (opcional)", tip_notes_body:"Lembrete pessoal.", tip_notes_examples:"Plano gratuito · 128k contexto\nMelhor para geração de código",
    tip_active_title:"O que significa 'Ativar imediatamente'?", tip_active_body:"Marcado = modelo ativo imediatamente. Desmarcado = salvo mas inativo.", tip_active_examples:"✓ Marcado → modelo ON\n✗ Desmarcado → salvo mas OFF",
    help_title:"Ajuda", help_sub:"Tudo que você precisa para usar o Airvo",
    help_what_title:"O que é o Airvo?", help_what_body:"Airvo é um servidor de IA local que conecta seu editor a qualquer modelo de IA simultaneamente.",
    help_adding_title:"Adicionando Modelos — Campo a Campo",
    help_field_id_title:"ID do Modelo", help_field_id_desc:"Chave única: provedor/nome-modelo.",
    help_field_id_ex:"groq/llama-3.3-70b-versatile\nopenai/gpt-4o\nollama/llama3\nlmstudio/local",
    help_field_name_title:"Nome de Exibição", help_field_name_desc:"Nome amigável no painel.",
    help_field_provider_title:"Provedor", help_field_provider_desc:"O serviço que hospeda o modelo.",
    help_field_apikey_title:"Chave API", help_field_apikey_desc:"Token de autenticação. Deixe vazio para modelos locais.",
    help_field_apikey_links:"console.groq.com → Groq\nplatform.openai.com → OpenAI\nconsole.anthropic.com → Anthropic",
    help_field_baseurl_title:"URL Base", help_field_baseurl_desc:"Apenas para modelos locais.",
    help_field_baseurl_ex:"http://localhost:11434 → Ollama\nhttp://localhost:1234 → LM Studio",
    help_modes_title:"Modos Multi-Modelo",
    help_mode_parallel:"Paralelo — Todos os modelos respondem. Você vê todas as respostas.",
    help_mode_race:"Corrida — O primeiro a responder vence.",
    help_mode_vote:"Votação — A resposta consensual é exibida.",
    help_mode_review:"Revisão — Um gera, outro critica.",
    help_faq_title:"Perguntas Frequentes",
    help_faq_1_q:"Preciso preencher todos os campos?", help_faq_1_a:"Não. Apenas ID, Nome e Provedor são obrigatórios.",
    help_faq_2_q:"Posso usar qualquer modelo?", help_faq_2_a:"Sim — se o LiteLLM suporta, o Airvo suporta.",
    help_faq_3_q:"Onde minha chave API é armazenada?", help_faq_3_a:"Em ~/.airvo/models.json. Nunca sai do seu computador.",
    help_faq_4_q:"Como uso o Ollama?", help_faq_4_a:"Instale o Ollama, baixe um modelo, adicione com ID: ollama/llama3, URL Base: http://localhost:11434.",
    help_faq_5_q:"O que é o Contexto do Projeto?", help_faq_5_a:"Uma nota injetada em cada requisição para que o Airvo conheça seu stack.",
    help_faq_6_q:"O contexto consome tokens extras?", help_faq_6_a:"Sim, um pequeno valor fixo por requisição (~650 tokens máx). É opcional.",
    help_faq_7_q:"O que é a Memória Inteligente (RAG)?",
    help_faq_7_a:"A Memória Inteligente indexa seu código localmente usando embeddings de IA. Antes de cada requisição, o Airvo encontra automaticamente os arquivos mais relevantes e os injeta no prompt.",
    help_faq_8_q:"Meu código é enviado para a nuvem?",
    help_faq_8_a:"Nunca. O modelo de embeddings roda 100% na sua máquina. O índice é armazenado em ~/.airvo/rag/ e seu código nunca sai do seu computador.",
    help_rag_title:"Memória Inteligente (RAG)",
    help_rag_what_title:"O que ela faz",
    help_rag_what_body:"A Memória Inteligente escaneia seu projeto, divide arquivos em fragmentos, gera embeddings vetoriais localmente e os armazena no ChromaDB. A cada mensagem, o Airvo recupera os fragmentos mais relevantes e os injeta automaticamente no contexto.",
    help_rag_setup_title:"Como ativar",
    help_rag_setup_steps:"1. Vá para Configuração → Memória Inteligente\n2. Ative \"Ativar Memória Inteligente\" (download único de ~90 MB)\n3. Insira o caminho do seu projeto\n4. Clique em \"Indexar Agora\" e aguarde\n5. O badge 🧠 RAG aparece no cabeçalho quando ativo",
    help_rag_privacy_title:"Privacidade e desempenho",
    help_rag_privacy_body:"Tudo roda localmente — embeddings, índice e busca. Nenhum dado é enviado. A indexação é rápida para a maioria dos projetos.",
    help_hw_title:"Gerenciador de Memória",
    help_hw_body:"Uso de RAM e GPU em tempo real na página Status. Mostra quais modelos Ollama estão carregados na memória, avisa quando a RAM está sob pressão (>75% AVISO, >90% CRÍTICO) e permite descarregar modelos com um clique — sem terminal.",
    help_hw_tip_title:"Quando usar",
    help_hw_tip_body:"Se o Ollama estiver lento ou sem resposta, verifique Status — pode haver vários modelos grandes carregados simultaneamente. Descarregue os não utilizados para liberar RAM.",
    help_disc_title:"Descoberta de Modelos",
    help_disc_body:"Na página Modelos, expanda '🔭 Descobrir Modelos'. A aba Local mostra um catálogo Ollama filtrado pelo que cabe na sua RAM — badge verde significa que cabe, vermelho que precisa de mais RAM. A aba Cloud mostra modelos OpenRouter com os gratuitos em destaque.",
    help_disc_tip_title:"Adição rápida",
    help_disc_tip_body:"Clique em '+ Adicionar ao Airvo' em qualquer modelo descoberto. Para modelos Ollama, copie o comando pull exibido e execute-o no terminal primeiro.",
    help_history_title:"Limite de Histórico de Chat",
    help_history_body:"O Airvo envia apenas as últimas N mensagens da sua conversa por requisição (padrão 10). Diminua se atingir limites de tokens com APIs gratuitas — Groq gratuito permite 6k–12k tokens/min. O histórico completo fica no editor; apenas o que é enviado ao modelo é cortado.",
    help_agent_title:"Modo Agente/Plan e Seleção de Modelo",
    help_agent_what_title:"O que é o modo Agente/Plan?",
    help_agent_what_body:"O continue.dev tem 3 modos: Chat (💬), Agente (⚡) e Plan (📋). Em Agente e Plan, seu IDE envia definições de ferramentas junto com sua mensagem — ferramentas para ler arquivos, escrever código, executar comandos, etc.",
    help_agent_why_title:"Por que apenas um modelo responde no modo Agente/Plan?",
    help_agent_why_body:"As chamadas de ferramentas são uma conversa multi-turno com estado: o modelo solicita uma ferramenta, o IDE a executa e retorna o resultado, o modelo solicita outra, e assim por diante. Esse vai e vem exige um único modelo para manter o contexto. Rodar múltiplos modelos em paralelo causaria edições conflitantes nos arquivos.",
    help_agent_select_title:"Escolhendo qual modelo trata o Agente/Plan",
    help_agent_select_body:"Em Configuração → Modelo Agente/Plan, escolha qualquer modelo ativo. Se definido como Auto, o Airvo usa o primeiro modelo ativo da sua lista. Escolha seu modelo mais capaz — ele fará todo o trabalho agêntico.",
    help_agent_tip_title:"Dica",
    help_agent_tip_body:"Use o modo Chat para comparar respostas de todos os seus modelos. Use Agente/Plan quando precisar que a IA edite arquivos e execute comandos — isso sempre usa um modelo.",
    agent_model_label:"Modelo Agente/Plan",
    agent_model_sub:"Modelo usado para os modos Agente e Plan no seu IDE. Esses modos usam chamadas de ferramentas e requerem um único modelo.",
    agent_model_saved:"Modelo agente salvo ✓",
    agent_model_auto:"Auto (primeiro modelo ativo)",
    help_trouble_title:"Solução de Problemas",
    help_trouble_1_q:"Erro de limite de taxa / tokens demais do Groq ou outro provedor",
    help_trouble_1_a:"Vá em Configuração → Limite de Histórico e defina para 4 ou 6 mensagens. Se o Smart Memory (RAG) estiver ativo, reduza também o limite de contexto RAG para 1000–2000 caracteres.",
    help_trouble_2_q:"Não consegue conectar ao servidor / dashboard mostra servidor offline",
    help_trouble_2_a:"Certifique-se de que o Airvo está rodando: abra um terminal e execute 'airvo start'. Verifique se a porta no seu .env (padrão 8765) corresponde às configurações da extensão.",
    help_trouble_3_q:"Um modelo mostra erro / ícone vermelho",
    help_trouble_3_a:"Verifique a chave API desse modelo na página Modelos. Para modelos Ollama, certifique-se de que o Ollama está rodando ('ollama serve') e o modelo está baixado ('ollama pull nome').",
    help_trouble_4_q:"Smart Memory (RAG) não encontra meu código / busca falha",
    help_trouble_4_a:"Vá em Configuração → Smart Memory → clique em 'Indexar Agora'. Confirme que o caminho aponta para a raiz do projeto. Após adicionar arquivos, re-indexe. Top K em 1–2 é suficiente para a maioria dos projetos.",
    help_trouble_5_q:"Descoberta de Modelos não mostra modelos Ollama como instalados",
    help_trouble_5_a:"O Ollama pode não estar rodando. Inicie com 'ollama serve'. O catálogo sempre carrega — o badge Instalado apenas requer que o Ollama responda em localhost:11434.",
    help_compare_title:"Aba Compare — Guia de Funcionalidades",
    help_compare_intro:"A aba Compare é o recurso mais poderoso do Airvo. Ela permite enviar o mesmo prompt para todos os modelos ativos simultaneamente, em tempo real, e analisar os resultados com ferramentas visuais que não existem em nenhum outro cliente de IA.",
    help_compare_streaming_title:"⊞ Streaming paralelo em tempo real",
    help_compare_streaming_body:"Ao digitar um prompt e clicar em Comparar (ou pressionar Ctrl+Enter), todos os modelos ativos começam a gerar ao mesmo tempo. Você vê os tokens de cada modelo aparecendo ao vivo, lado a lado.",
    help_compare_diff_title:"▨ Modos diff — Palavras e Frases",
    help_compare_diff_body:"O diff de palavras destaca cada palavra que aparece na resposta de um modelo mas não nos outros. O diff de frases compara sentenças inteiras. Ambos são calculados no navegador, sem chamadas ao servidor.",
    help_compare_pin_title:"📌 Fixar como referência",
    help_compare_pin_body:"Clique em 📌 em qualquer card para definir aquele modelo como baseline. No modo diff, todos os outros são comparados com o modelo fixado.",
    help_compare_similarity_title:"Score de similaridade (Jaccard)",
    help_compare_similarity_body:"No final da barra de Performance você verá porcentagens de similaridade entre pares de modelos. Verde ≥ 60% significa que os modelos concordam. Vermelho < 35% indica respostas fundamentalmente diferentes.",
    help_compare_templates_title:"💾 Templates de prompt",
    help_compare_templates_body:"Clique em Salvar ao lado do textarea para guardar o prompt atual. Até 10 templates são armazenados localmente no navegador e aparecem como chips clicáveis.",
    help_compare_temps_title:"🌡 Temperatura por modelo",
    help_compare_temps_body:"Clique em 🌡 para expandir sliders individuais de temperatura para cada modelo ativo. Valores com * usam a temperatura global da Configuração.",
    help_compare_history_title:"Histórico e Re-run",
    help_compare_history_body:"O Airvo salva as últimas 10 comparações em ~/.airvo/compare_history.json — sobrevivem a reinicializações. Navegue com ← →. Clique em 🔁 Re-run para reenviar o mesmo prompt. Use 🗑 Limpar para apagar tudo.",
    help_compare_export_title:"📄 Exportar para Markdown",
    help_compare_export_body:"Exporta a comparação completa como .md incluindo o prompt, resposta de cada modelo, tempo de resposta, contagem de tokens e ID exato do modelo.",
    help_compare_sort_title:"Ordenar e Foco",
    help_compare_sort_body:"Ordene os cards por ⚡ Velocidade ou 📝 Tokens. Use ⛶ Foco para expandir um único card para largura total.",
    help_stats_title:"Stats — Análise de Uso",
    help_stats_intro:"A aba Stats rastreia seu uso real em todos os modelos — tokens consumidos, custo estimado de API, qualidade das respostas (baseado no que você copia) e tendências de latência. Todos os dados são armazenados localmente em ~/.airvo/stats.json.",
    help_stats_tokens_title:"📊 Tokens por Modelo",
    help_stats_tokens_body:"Barras horizontais mostrando o total de tokens gerados por modelo desde o último reset. Útil para entender em quais modelos você mais se apoia.",
    help_stats_cost_title:"💰 Custo Estimado",
    help_stats_cost_body:"Gasto estimado de API por modelo com base em preços típicos (ex. OpenAI ~$5/1M tokens, Anthropic ~$9/1M). Modelos locais (Ollama, LM Studio) sempre mostram Grátis. São estimativas — consulte o painel do seu provedor para faturamento exato.",
    help_stats_quality_title:"⭐ Ranking de Qualidade",
    help_stats_quality_body:"Modelos classificados por quantas vezes você clicou em Copiar nas respostas deles. Este é um sinal implícito de qualidade — se você copia a resposta de um modelo, ela foi útil. As medalhas 🥇🥈🥉 vão para o top 3.",
    help_stats_latency_title:"⚡ Latência Média",
    help_stats_latency_body:"Tempo médio de resposta por modelo em todas as requisições registradas. Verde = mais rápido em relação aos outros, amarelo = moderado, vermelho = mais lento. Útil para escolher o modelo certo quando a velocidade importa.",
    help_stats_daily_title:"📅 Atividade Diária",
    help_stats_daily_body:"Barras sparkline mostrando o uso de tokens por dia nos últimos 7 dias. Ajuda a identificar padrões — ex. quais modelos você usa mais em dias intensos de programação.",
    config_context_memory_section:"Contexto & Memória",
    toast_activated:"Modelo ativado", toast_deactivated:"Modelo desativado",
    toast_key_saved:"Chave API salva ✓", toast_key_error:"Insira uma chave API válida",
    toast_deleted:"Modelo excluído", toast_added:"Modelo adicionado ✓",
    toast_error_toggle:"Erro ao atualizar", toast_error_key:"Erro ao salvar chave",
    toast_error_delete:"Erro ao excluir", toast_error_add:"Erro ao adicionar modelo",
    confirm_delete:"Excluir este modelo?",
    toast_limit:"O Airvo suporta até 3 modelos ativos. Desative um para ativar outro.",
    stat_v1_limit:"máx 3 ativos",
    auto_detected:"Detectado automaticamente",
    auto_local_hint:"Modelo local — sem custo de API",
    auto_cloud_hint:"Modelo cloud — faturamento pelo provedor",
    nav_compare:"Comparar", nav_stats:"Stats", nav_bench:"Benchmarks",
    bench_title:"Benchmarks", bench_sub:"Prompts padronizados para medir e comparar seus modelos",
    bench_suite_speed:"Teste de Velocidade", bench_suite_coding:"Programação", bench_suite_reasoning:"Raciocínio", bench_suite_creative:"Criatividade",
    bench_run:"Executar Benchmark", bench_running:"Executando",
    bench_no_active:"São necessários pelo menos 2 modelos ativos para executar benchmarks.",
    bench_no_results:"Nenhum resultado ainda — selecione uma suite e clique em Executar Benchmark.",
    bench_leaderboard:"Ranking Geral", bench_results:"Resultados por Prompt",
    bench_clear:"Limpar Histórico", bench_history_title:"Histórico de Execuções",
    compare_title:"Comparação de Respostas",
    compare_sub:"Últimas respostas multi-modelo lado a lado — copie e escolha a melhor",
    compare_empty:"Sem respostas multi-modelo ainda",
    compare_empty_hint:"Use o modo Paralelo, Votação ou Revisão com 2+ modelos ativos, depois envie uma mensagem do seu IDE",
    compare_refresh:"Atualizar",
    compare_mode:"Modo",
    compare_prompt:"Prompt",
    compare_copy:"Copiar",
    compare_copied:"Copiado ✓",
    compare_tokens:"tokens",
    compare_error_badge:"Erro",
    compare_at:"Última atualização",
    compare_auto:"Auto",
    compare_elapsed:"s",
    compare_history_label:"Histórico",
    compare_of:"de",
    compare_export:"Exportar MD",
    compare_export_done:"Exportado ✓",
    compare_fastest:"Mais rápido",
    compare_most_tokens:"Mais tokens",
    compare_expand:"Foco",
    compare_collapse:"Ver todos",
    compare_copy_prompt:"Copiar prompt",
    compare_stats:"Desempenho",
    compare_time:"Tempo",
    compare_tok_s:"tok/s",
    compare_ask:"Perguntar aos modelos",
    compare_send:"⊞ Comparar",
    compare_sending:"Executando…",
    compare_send_placeholder:"Digite um prompt para comparar todos os modelos ativos… (Ctrl+Enter)",
    compare_sort_default:"Padrão",
    compare_sort_speed:"⚡ Velocidade",
    compare_sort_tokens:"📝 Tokens",
    compare_run_error:"Precisa de 2+ modelos ativos para comparar",
    compare_diff:"Diff",
    compare_diff_tip:"Destacar palavras únicas de cada modelo",
    compare_streaming:"Streaming…",
    compare_stream_done:"Concluído",
    compare_rerun:"🔁 Reexecutar",
    compare_clear:"🗑 Limpar histórico",
    compare_clear_confirm:"Limpar todo o histórico? Esta ação não pode ser desfeita.",
    compare_cleared:"Histórico limpo",
    compare_template_save:"💾 Salvar",
    compare_template_saved:"Template salvo ✓",
    compare_templates:"Prompts salvos",
    compare_similarity:"Similaridade",
    compare_diff_word:"Palavra",
    compare_diff_sentence:"Frase",
    compare_temps:"Temp. por modelo",
    compare_temp_reset:"Redefinir",
    compare_pin:"Fixar como referência",
    compare_unpin:"Desafixar",
    compare_pinned:"Referência",
  },
};

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

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return { toasts, add };
}

function useLanguage() {
  const [lang, setLangState] = useState(() => localStorage.getItem("airvo_lang") || "en");
  const setLang = useCallback((code) => { localStorage.setItem("airvo_lang", code); setLangState(code); }, []);
  const t = useCallback((key) => I18N[lang]?.[key] ?? I18N["en"][key] ?? key, [lang]);
  return { lang, setLang, t };
}

function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  return (
    <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
      <div className="lang-trigger" onClick={() => setOpen(!open)}>
        <span style={{ fontSize:15 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span className={`lang-arrow ${open?"open":""}`}>▾</span>
      </div>
      {open && (
        <div className="lang-menu">
          {LANGUAGES.map(l => (
            <button key={l.code} className={`lang-option ${lang===l.code?"selected":""}`}
              onClick={() => { setLang(l.code); setOpen(false); }}>
              <span style={{ fontSize:15 }}>{l.flag}</span>
              <span>{l.name}</span>
              {lang === l.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function parseBlocks(text) {
  if (!text) return [];
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type:"text", content:text.slice(lastIndex, match.index) });
    parts.push({ type:"code", lang:(match[1]||"").toLowerCase(), content:match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length)
    parts.push({ type:"text", content:text.slice(lastIndex) });
  return parts.length ? parts : [{ type:"text", content:text }];
}

function highlightCode(code, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try { return hljs.highlight(code, { language: lang }).value; } catch {}
  }
  try { return hljs.highlightAuto(code).value; } catch {}
  return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

function CodeBlock({ block, t }) {
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
        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>
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
  const [ragStatus, setRagStatus]       = useState(null);
  const [ragIndexing, setRagIndexing]   = useState(false);
  const [ragAdvanced, setRagAdvanced]   = useState(false);
  const [showRagWarning, setShowRagWarning] = useState(false);
  const [hwStatus,  setHwStatus]  = useState(null);
  const [hwLoading, setHwLoading] = useState(false);
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

  const fetchProcesses = useCallback(async () => {
    setHwProcLoading(true);
    try {
      const res = await fetch(`${API}/api/hardware/processes`);
      if (res.ok) setHwProcesses(await res.json());
    } catch {}
    finally { setHwProcLoading(false); }
  }, []);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchRagStatus(); }, [fetchRagStatus]);
  useEffect(() => { if (page === "status") fetchHardware(); }, [page, fetchHardware]);
  useEffect(() => { if (page === "compare") fetchCompare(); }, [page, fetchCompare]);
  useEffect(() => { if (page === "stats") fetchStats(); }, [page, fetchStats]);
  useEffect(() => {
    try { localStorage.setItem("airvo_compare_prompt", comparePrompt); } catch {}
  }, [comparePrompt]);
  useEffect(() => {
    if (page !== "compare" || !compareAutoRefresh) return;
    const interval = setInterval(() => fetchCompare(true), 3000);
    return () => clearInterval(interval);
  }, [page, compareAutoRefresh, fetchCompare]);
  useEffect(() => { if (discOpen) fetchDiscovery(); }, [discOpen, fetchDiscovery]);

  const MAX_ACTIVE = 3;

  async function unloadOllamaModel(modelName) {
    if (!confirm(t("hw_unload_confirm"))) return;
    try {
      const res = await fetch(`${API}/api/hardware/unload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelName }),
      });
      if (res.ok) { toast(t("hw_unload_done"), "success"); fetchHardware(); }
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
              { id:"compare", icon:"⊞", label:t("nav_compare") },
              { id:"stats",   icon:"📊", label:t("nav_stats")  },
              { id:"bench",   icon:"🏆", label:t("nav_bench")  },
              { id:"config",  icon:"⊙", label:t("nav_config")  },
              { id:"add",     icon:"+", label:t("nav_add")     },
              { id:"help",    icon:"?", label:t("nav_help")    },
            ].map(n => (
              <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={() => setPage(n.id)}>
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
          {page === "models" && <>
            <h1 className="page-title">{t("models_title")}</h1>
            <p className="page-sub">{t("models_sub")}</p>
            {(() => {
              const configured  = models.filter(m => m.active || m.api_key);
              const suggestions = models.filter(m => !m.active && !m.api_key);
              return <>
            <div className="stats-row">
              {[
                { label:t("stat_total"),    val:configured.length,                       sub:t("stat_models"),     cls:"accent" },
                { label:t("stat_active"),   val:active.length, max:MAX_ACTIVE,          sub:t("stat_parallel"),   cls:"green", showBar:true },
                { label:t("stat_free"),     val:configured.filter(m=>inferIsFree(m.provider,m.base_url)).length, sub:t("stat_no_cost"), cls:"yellow" },
                { label:t("stat_with_key"), val:configured.filter(m=>m.api_key).length,  sub:t("stat_configured"), cls:"pink" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className={`stat-value ${s.cls}`}>
                    {s.showBar ? `${s.val} / ${s.max}` : s.val}
                  </div>
                  {s.showBar && (
                    <div style={{ margin:"8px 0 4px", height:4, background:"var(--bg3)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(s.val/s.max)*100}%`, background:"var(--green)", borderRadius:2, transition:"width 0.3s ease", boxShadow: s.val >= s.max ? "0 0 8px var(--green)" : "none" }} />
                    </div>
                  )}
                  <div className="stat-sub">{s.showBar ? t("stat_v1_limit") : s.sub}</div>
                </div>
              ))}
            </div>
            {loading
              ? <div className="empty">{t("loading_models")}</div>
              : <>
                  <div className="models-grid">
                    {configured.map(m => (
                      <ModelCard key={m.id} model={m} t={t} stats={stats[m.id]}
                        onToggle={() => toggleModel(m.id, m.active)}
                        onSaveKey={key => saveKey(m.id, key)}
                        onDelete={() => deleteModel(m.id)}
                      />
                    ))}
                  </div>
                  {suggestions.length > 0 && (
                    <div style={{ marginTop:28 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontFamily:"var(--mono)", fontSize:14, fontWeight:700, color:"var(--text2)" }}>💡 {t("suggestions_title")}</span>
                      </div>
                      <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:14 }}>{t("suggestions_sub")}</p>
                      <div className="models-grid" style={{ opacity:0.7 }}>
                        {suggestions.map(m => (
                          <ModelCard key={m.id} model={m} t={t} stats={stats[m.id]}
                            onToggle={() => toggleModel(m.id, m.active)}
                            onSaveKey={key => saveKey(m.id, key)}
                            onDelete={() => deleteModel(m.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
            }
              </>; })()}

            {/* ── DISCOVER MODELS SECTION ── */}
            <div style={{ marginTop:28 }}>
              <button className="btn btn-ghost" style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:13 }}
                onClick={() => setDiscOpen(p => !p)}>
                <span style={{ fontSize:16 }}>{discOpen ? "▾" : "▸"}</span>
                🔭 {t("disc_label")}
                {discOpen && discLoading && <span style={{ fontSize:11, color:"var(--text2)", marginLeft:6 }}>{t("disc_loading")}</span>}
              </button>

              {discOpen && (
                <div className="card" style={{ marginTop:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div>
                      <div className="card-title" style={{ marginBottom:4 }}>{t("disc_label")}</div>
                      <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("disc_sub")}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={fetchDiscovery} disabled={discLoading}>
                      {discLoading ? "…" : "⟳"}
                    </button>
                  </div>

                  {/* Tabs */}
                  <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                    {[["local", t("disc_local_tab")], ["cloud", t("disc_cloud_tab")]].map(([id, label]) => (
                      <button key={id} className={`btn btn-sm ${discTab === id ? "btn-primary" : "btn-ghost"}`}
                        style={{ fontFamily:"var(--mono)", fontSize:12 }}
                        onClick={() => setDiscTab(id)}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* LOCAL TAB — Ollama catalog */}
                  {discTab === "local" && (<>
                    {discLoading && !discOllama && <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("disc_loading")}</p>}
                    {discOllama && (<>
                      <div style={{ padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, marginBottom:12, fontFamily:"var(--mono)", fontSize:11, lineHeight:1.8 }}>
                        <div style={{ fontWeight:600, marginBottom:4, color:"var(--text)" }}>💻 {t("disc_local_explain")}</div>
                        <div style={{ color:"var(--accent)" }}>📋 {t("disc_local_how")}</div>
                      </div>
                      <div style={{ display:"grid", gap:10 }}>
                        {(discOllama.catalog || []).map(m => {
                          const sizeStr = m.size_gb >= 1 ? `${m.size_gb.toFixed(1)} GB` : `${Math.round(m.size_gb * 1024)} MB`;
                          return (
                            <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 14px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)", opacity: m.fits_ram ? 1 : 0.55 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:4, alignItems:"center" }}>
                                  <span style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:700 }}>{m.name}</span>
                                  {m.installed && <span style={{ fontSize:10, fontFamily:"var(--mono)", background:"#003a10", border:"1px solid var(--green)", color:"var(--green)", borderRadius:4, padding:"1px 6px" }}>✓ {t("disc_installed")}</span>}
                                  {m.fits_ram ? (
                                    <span title={t("disc_fits_detail")} style={{ fontSize:10, fontFamily:"var(--mono)", background:"#001a00", border:"1px solid #2a6a2a", color:"#4ade80", borderRadius:4, padding:"1px 6px", cursor:"help" }}>{t("disc_fits")}</span>
                                  ) : (
                                    <span title={t("disc_too_large_detail")} style={{ fontSize:10, fontFamily:"var(--mono)", background:"#1a0000", border:"1px solid #6a1a1a", color:"var(--red)", borderRadius:4, padding:"1px 6px", cursor:"help" }}>{t("disc_too_large")}</span>
                                  )}
                                  {(m.tags || []).map(tag => (
                                    <span key={tag} style={{ fontSize:10, fontFamily:"var(--mono)", color:"var(--text2)", borderRadius:4, padding:"1px 6px", border:"1px solid var(--border)" }}>{tag}</span>
                                  ))}
                                </div>
                                <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                                  {sizeStr} — {t("disc_pull_cmd")}: <span style={{ color:"var(--accent)" }}>ollama pull {m.id}</span>
                                </div>
                              </div>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize:11, marginLeft:12, whiteSpace:"nowrap", flexShrink:0 }}
                                onClick={() => quickAddModel({ id: m.id, name: m.name, provider: "ollama" })}>
                                + {t("disc_add_btn")}
                              </button>
                            </div>
                          );
                        })}
                        {!discOllama?.catalog?.length && <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("disc_no_results")}</p>}
                      </div>
                    </>)}
                  </>)}

                  {/* CLOUD TAB — OpenRouter */}
                  {discTab === "cloud" && (<>
                    {discLoading && !discOpenRouter && <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("disc_loading")}</p>}
                    {discOpenRouter && (<>
                      <div style={{ padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, marginBottom:12, fontFamily:"var(--mono)", fontSize:11, lineHeight:1.8 }}>
                        <div style={{ fontWeight:600, marginBottom:4, color:"var(--text)" }}>☁️ {t("disc_cloud_explain")}</div>
                        <div style={{ color:"var(--accent)" }}>📋 {t("disc_cloud_how")}</div>
                      </div>
                      <div style={{ display:"grid", gap:10 }}>
                        {(discOpenRouter || []).map(m => (
                          <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 14px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)" }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:4, alignItems:"center" }}>
                                <span style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:700 }}>{m.name}</span>
                                {m.is_free && <span style={{ fontSize:10, fontFamily:"var(--mono)", background:"#003a10", border:"1px solid var(--green)", color:"var(--green)", borderRadius:4, padding:"1px 6px" }}>{t("disc_free_badge")}</span>}
                              </div>
                              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                                {m.context_length > 0 && <span>{(m.context_length/1000).toFixed(0)}k {t("disc_context")} · </span>}
                                {m.is_free ? "Free" : `$${(m.prompt_cost * 1000000).toFixed(2)}/M tokens`}
                              </div>
                              {m.description && <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:380 }}>{m.description}</div>}
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize:11, marginLeft:12, whiteSpace:"nowrap", flexShrink:0 }}
                              onClick={() => quickAddModel({ id: m.id, name: m.name, provider: "openrouter" })}>
                              + {t("disc_add_btn")}
                            </button>
                          </div>
                        ))}
                        {!discOpenRouter?.length && <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("disc_no_results")}</p>}
                      </div>
                    </>)}
                  </>)}
                </div>
              )}
            </div>
          </>}

          {/* ── STATUS PAGE ── */}
          {page === "status" && <>
            <h1 className="page-title">{t("status_title")}</h1>
            <p className="page-sub">{t("status_sub")}</p>
            <div style={{ display:"grid", gap:20 }}>
              <div className="card">
                <div className="card-title">{t("server_label")}</div>
                {health
                  ? <div style={{ display:"grid", gap:12 }}>
                      {[
                        ["Status", <span style={{color:"var(--green)"}}>{t("status_online")}</span>],
                        [t("field_version"),  health.version],
                        [t("field_active"),   health.active_models?.join(", ")||t("nav_none")],
                        [t("field_total"),    health.total_models],
                        [t("field_config"),   health.config_file],
                        [t("field_endpoint"), "http://localhost:5000/v1/chat/completions"],
                      ].map(([label,val]) => (
                        <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)", paddingBottom:10 }}>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{label}</span>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  : <div style={{ color:"var(--red)", fontFamily:"var(--mono)", fontSize:13, lineHeight:1.8 }}>
                      ✗ {t("status_offline_msg")}<br/>
                      <span style={{ color:"var(--text2)" }}>{t("status_offline_hint")} <strong>airvo start</strong></span>
                    </div>
                }
              </div>

              {/* ── HARDWARE CARD ── */}
              <div className="card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>{t("hw_label")}</div>
                  <button className="btn btn-ghost btn-sm" onClick={fetchHardware} disabled={hwLoading} style={{ fontSize:11 }}>
                    {hwLoading ? "…" : t("hw_refresh")}
                  </button>
                </div>
                {hwLoading && !hwStatus && (
                  <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("hw_loading")}</p>
                )}
                {hwStatus && (<>
                  {/* psutil warning */}
                  {!hwStatus.psutil_available && (
                    <div style={{ background:"#1a1000", border:"1px solid #a06000", borderRadius:8, padding:"10px 14px", marginBottom:14, fontFamily:"var(--mono)", fontSize:12 }}>
                      ⚠️ {t("hw_no_psutil")} — <span style={{ color:"var(--text2)" }}>{t("hw_no_psutil_hint")}</span>
                    </div>
                  )}

                  {/* RAM */}
                  {hwStatus.psutil_available && (() => {
                    const pct  = hwStatus.ram?.percent ?? 0;
                    const bar  = pct >= 90 ? "var(--red)" : pct >= 75 ? "#f59e0b" : "var(--green)";
                    const used = ((hwStatus.ram?.used_mb ?? 0) / 1024).toFixed(1);
                    const total= ((hwStatus.ram?.total_mb ?? 0) / 1024).toFixed(1);
                    const free = ((hwStatus.ram?.free_mb  ?? 0) / 1024).toFixed(1);
                    return (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("hw_ram")}</span>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                            {used} GB {t("hw_used")} / {total} GB &nbsp;
                            <span style={{ color:"var(--text2)" }}>({free} GB {t("hw_free")})</span>
                          </span>
                        </div>
                        <div style={{ background:"var(--bg3)", borderRadius:6, height:10, overflow:"hidden", border:"1px solid var(--border)" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:bar, borderRadius:6, transition:"width .4s" }}/>
                        </div>
                        <div style={{ textAlign:"right", fontFamily:"var(--mono)", fontSize:11, color:bar, marginTop:4 }}>
                          {pct.toFixed(1)}% — {hwStatus.ram?.pressure === "ok" ? t("hw_pressure_ok") : hwStatus.ram?.pressure === "warning" ? t("hw_pressure_warning") : t("hw_pressure_critical")}
                        </div>
                      </div>
                    );
                  })()}

                  {/* CPU */}
                  {hwStatus.psutil_available && hwStatus.cpu && (() => {
                    const cp  = hwStatus.cpu.usage_percent ?? 0;
                    const bar = cp >= 90 ? "var(--red)" : cp >= 75 ? "#f59e0b" : "var(--accent)";
                    return (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>
                            {t("hw_cpu")}
                            <span style={{ marginLeft:8, color:"var(--text2)", fontWeight:400 }}>
                              {hwStatus.cpu.name}
                            </span>
                          </span>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                            {hwStatus.cpu.logical_cores} {t("hw_cpu_cores")}
                            &nbsp;&nbsp;
                            <span style={{ color: bar }}>{cp.toFixed(1)}% {t("hw_cpu_usage")}</span>
                          </span>
                        </div>
                        <div style={{ background:"var(--bg3)", borderRadius:6, height:10, overflow:"hidden", border:"1px solid var(--border)" }}>
                          <div style={{ width:`${cp}%`, height:"100%", background:bar, borderRadius:6, transition:"width .4s" }}/>
                        </div>
                      </div>
                    );
                  })()}

                  {/* GPUs */}
                  {(hwStatus.gpus ?? []).map((gpu, i) => {
                    const vp  = gpu.vram_percent ?? 0;
                    const bar = vp >= 90 ? "var(--red)" : vp >= 75 ? "#f59e0b" : "var(--green)";
                    return (
                      <div key={i} style={{ marginBottom:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>{t("hw_gpu")}: {gpu.name}</span>
                          <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                            {t("hw_vram")}: {(gpu.vram_used_mb/1024).toFixed(1)} / {(gpu.vram_total_mb/1024).toFixed(1)} GB
                          </span>
                        </div>
                        <div style={{ background:"var(--bg3)", borderRadius:6, height:10, overflow:"hidden", border:"1px solid var(--border)" }}>
                          <div style={{ width:`${vp}%`, height:"100%", background:bar, borderRadius:6, transition:"width .4s" }}/>
                        </div>
                      </div>
                    );
                  })}

                  {/* Ollama loaded models */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:8 }}>
                      {t("hw_ollama_models")}
                      {hwStatus.ollama?.running === false && <span style={{ marginLeft:8, color:"var(--red)", fontSize:11 }}>(Ollama offline)</span>}
                    </div>
                    {(hwStatus.ollama?.loaded_models ?? []).length === 0
                      ? <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"#555" }}>{t("hw_ollama_none")}</p>
                      : (hwStatus.ollama.loaded_models.map(m => (
                          <div key={m.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"var(--bg3)", borderRadius:6, marginBottom:6, border:"1px solid var(--border)" }}>
                            <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>{m.name}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{(m.size_mb/1024).toFixed(2)} GB</span>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"3px 10px", color:"var(--accent2)", borderColor:"var(--accent2)" }}
                                onClick={() => unloadOllamaModel(m.name)}>
                                {t("hw_unload_btn")}
                              </button>
                            </div>
                          </div>
                        )))
                    }
                  </div>

                  {/* Suggestions */}
                  {(hwStatus.suggestions ?? []).length > 0 && (
                    <div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:8 }}>{t("hw_suggestions")}</div>
                      {hwStatus.suggestions.map((s, i) => {
                        const bg  = s.action === "critical" || s.action === "unload" ? "#1a0010" : s.action === "warning" ? "#1a1000" : "#001a1a";
                        const bdr = s.action === "critical" || s.action === "unload" ? "#a00060" : s.action === "warning" ? "#a06000" : "#007070";
                        return (
                          <div key={i} style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:8, padding:"9px 13px", marginBottom:6, fontFamily:"var(--mono)", fontSize:12, lineHeight:1.5 }}>
                            {s.action === "unload" && "⚠️ "}
                            {s.action === "warning" && "🟡 "}
                            {s.action === "info" && "ℹ️ "}
                            {s.reason}
                            {s.action === "unload" && s.model && (
                              <button className="btn btn-ghost btn-sm" style={{ marginLeft:12, fontSize:11, color:"var(--accent2)", borderColor:"var(--accent2)" }}
                                onClick={() => unloadOllamaModel(s.model)}>
                                {t("hw_unload_btn")} {s.model.split(":")[0]}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Top memory consumers */}
                  {hwStatus.psutil_available && (
                    <div style={{ marginTop:14 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontFamily:"var(--mono)", fontSize:11, display:"flex", alignItems:"center", gap:6 }}
                        onClick={() => {
                          if (!hwProcOpen) fetchProcesses();
                          setHwProcOpen(p => !p);
                        }}>
                        <span style={{ fontSize:13 }}>{hwProcOpen ? "▾" : "▸"}</span>
                        📊 {t("hw_processes")}
                        {hwProcLoading && <span style={{ color:"var(--text2)" }}>…</span>}
                      </button>

                      {hwProcOpen && (
                        <div style={{ marginTop:10 }}>
                          <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:8 }}>{t("hw_proc_sub")}</p>
                          {hwProcLoading && !hwProcesses && (
                            <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>…</p>
                          )}
                          {(hwProcesses?.processes ?? []).map((proc, i) => {
                            const pct = proc.memory_percent ?? 0;
                            const bar = pct >= 15 ? "var(--red)" : pct >= 7 ? "#f59e0b" : "var(--accent)";
                            const memStr = proc.memory_mb >= 1024
                              ? `${(proc.memory_mb / 1024).toFixed(1)} GB`
                              : `${proc.memory_mb.toFixed(0)} MB`;
                            const FRIENDLY = {
                              "code.exe":                           "VS Code",
                              "code - insiders.exe":                "VS Code Insiders",
                              "devenv.exe":                         "Visual Studio",
                              "servicehub.datawarehousehost.exe":   "Visual Studio (ServiceHub)",
                              "servicehub.host.dotnet.x64.exe":     "Visual Studio (ServiceHub)",
                              "servicehub.indexingservice.exe":     "Visual Studio (Indexer)",
                              "servicehub.settingshost.exe":        "Visual Studio (Settings)",
                              "msedge.exe":                         "Microsoft Edge",
                              "chrome.exe":                         "Google Chrome",
                              "firefox.exe":                        "Firefox",
                              "safari.exe":                         "Safari",
                              "brave.exe":                          "Brave",
                              "slack.exe":                          "Slack",
                              "discord.exe":                        "Discord",
                              "teams.exe":                          "Microsoft Teams",
                              "outlook.exe":                        "Outlook",
                              "winword.exe":                        "Microsoft Word",
                              "excel.exe":                          "Microsoft Excel",
                              "powerpnt.exe":                       "Microsoft PowerPoint",
                              "explorer.exe":                       "Windows Explorer",
                              "taskhostw.exe":                      "Windows Task Host",
                              "svchost.exe":                        "Windows Service Host",
                              "memcompression":                     "Windows Memory Compression (system)",
                              "registry":                           "Windows Registry (system)",
                              "system":                             "Windows System (kernel)",
                              "smss.exe":                           "Windows Session Manager",
                              "csrss.exe":                          "Windows Client/Server Runtime",
                              "lsass.exe":                          "Windows Security (LSASS)",
                              "wininit.exe":                        "Windows Initialization",
                              "python.exe":                         "Python",
                              "python3.exe":                        "Python 3",
                              "pythonw.exe":                        "Python (windowed)",
                              "node.exe":                           "Node.js",
                              "ollama.exe":                         "Ollama",
                              "ollama_llama_server.exe":            "Ollama (model runner)",
                              "docker desktop.exe":                 "Docker Desktop",
                              "dockerd.exe":                        "Docker Daemon",
                              "wslhost.exe":                        "WSL",
                              "wsl.exe":                            "WSL",
                              "cursor.exe":                         "Cursor",
                              "windsurf.exe":                       "Windsurf",
                              "figma.exe":                          "Figma",
                              "zoom.exe":                           "Zoom",
                              "spotify.exe":                        "Spotify",
                              "postman.exe":                        "Postman",
                              "gitkraken.exe":                      "GitKraken",
                              "github desktop.exe":                 "GitHub Desktop",
                            };
                            const friendly = FRIENDLY[proc.name.toLowerCase()];
                            const displayName = friendly
                              ? <><span style={{ color:"var(--text)" }}>{friendly}</span><span style={{ color:"var(--text2)", marginLeft:5, fontSize:10 }}>({proc.name})</span></>
                              : proc.name;
                            return (
                              <div key={proc.pid} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", background:"var(--bg3)", borderRadius:6, marginBottom:5, border:"1px solid var(--border)" }}>
                                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", width:20, textAlign:"right", flexShrink:0 }}>{i+1}</span>
                                <span style={{ fontFamily:"var(--mono)", fontSize:12, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayName}</span>
                                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:bar, flexShrink:0 }}>{memStr}</span>
                                <div style={{ width:60, background:"var(--bg)", borderRadius:4, height:6, overflow:"hidden", flexShrink:0 }}>
                                  <div style={{ width:`${Math.min(pct * 4, 100)}%`, height:"100%", background:bar, borderRadius:4 }}/>
                                </div>
                              </div>
                            );
                          })}
                          {!hwProcLoading && hwProcesses && hwProcesses.processes.length === 0 && (
                            <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>—</p>
                          )}
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:11, marginTop:6 }}
                            onClick={fetchProcesses} disabled={hwProcLoading}>
                            {hwProcLoading ? "…" : t("hw_refresh")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>)}
              </div>

              <div className="card">
                <div className="card-title">{t("continue_label")}</div>
                <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", marginBottom:12 }}>{t("continue_hint")}</p>
                <pre style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, padding:16, fontFamily:"var(--mono)", fontSize:12, color:"var(--accent)", overflow:"auto" }}>{continueYaml}</pre>
                <div style={{ marginTop:12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(continueYaml); toast(t("copied"), "success"); }}>
                    {t("copy_config")}
                  </button>
                </div>
              </div>
            </div>
          </>}

          {/* ── COMPARE PAGE ── */}
          {page === "compare" && (() => {
            const viewData = compareHistory[compareHistIdx] ?? compareData;

            function exportMarkdown() {
              if (!viewData) return;
              const lines = [
                `# Airvo Response Comparison`, ``,
                `**Mode:** ${viewData.mode}  `,
                `**Date:** ${new Date(viewData.timestamp * 1000).toLocaleString()}`,
                ``, `## Prompt`, ``,
                `> ${viewData.prompt.replace(/\n/g, "\n> ")}`, ``,
              ];
              viewData.results.forEach((r, i) => {
                lines.push(`## ${i + 1}. ${r.name}`); lines.push(``);
                const meta = [`Model: \`${r.model}\``];
                if (r.elapsed_s) meta.push(`${r.elapsed_s}s`);
                if (r.tokens)    meta.push(`${r.tokens} tokens`);
                if (meta.length) lines.push(`*${meta.join(" · ")}*`);
                lines.push(``);
                if (r.error) { lines.push(`> ✗ Error: ${r.error}`); }
                else { lines.push(r.content || ""); }
                lines.push(``); lines.push(`---`); lines.push(``);
              });
              const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `airvo-compare-${Date.now()}.md`;
              a.click();
              setCompareExportDone(true);
              setTimeout(() => setCompareExportDone(false), 2500);
            }

            const _validTime = viewData ? viewData.results.filter(r => !r.error && r.elapsed_s != null) : [];
            const fastestIdx = _validTime.length > 1
              ? viewData.results.indexOf(_validTime.reduce((a, b) => a.elapsed_s < b.elapsed_s ? a : b)) : -1;
            const _validTok = viewData ? viewData.results.filter(r => !r.error && r.tokens > 0) : [];
            const mostTokensIdx = _validTok.length > 1
              ? viewData.results.indexOf(_validTok.reduce((a, b) => a.tokens > b.tokens ? a : b)) : -1;
            const _sortedResults = viewData ? [...viewData.results].sort((a, b) => {
              if (compareSortBy === "speed")  return (a.elapsed_s ?? 9999) - (b.elapsed_s ?? 9999);
              if (compareSortBy === "tokens") return (b.tokens ?? 0) - (a.tokens ?? 0);
              return 0;
            }) : [];

            return <>
              <h1 className="page-title">{t("compare_title")}</h1>
              <p className="page-sub">{t("compare_sub")}</p>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                {compareHistory.length > 1 ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button className="btn btn-ghost btn-sm"
                      title={t("compare_history_label") + " ←"}
                      onClick={() => { setCompareHistIdx(i => Math.min(i + 1, compareHistory.length - 1)); setCompareExpandIdx(null); }}
                      disabled={compareHistIdx >= compareHistory.length - 1}>←</button>
                    <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>
                      {t("compare_history_label")} {compareHistIdx + 1} {t("compare_of")} {compareHistory.length}
                    </span>
                    <button className="btn btn-ghost btn-sm"
                      title={t("compare_history_label") + " →"}
                      onClick={() => { setCompareHistIdx(i => Math.max(i - 1, 0)); setCompareExpandIdx(null); }}
                      disabled={compareHistIdx === 0}>→</button>
                  </div>
                ) : <div />}

                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {viewData && viewData.results.length > 1 && (
                    <div style={{ display:"flex", gap:3, background:"var(--bg3)", borderRadius:6, padding:3, border:"1px solid var(--border)" }}>
                      {[["default","—","compare_sort_default"],["speed","⚡","compare_sort_speed"],["tokens","📝","compare_sort_tokens"]].map(([id, icon, key]) => (
                        <button key={id}
                          className={`btn btn-sm ${compareSortBy===id?"btn-primary":"btn-ghost"}`}
                          onClick={() => setCompareSortBy(id)}
                          style={{ fontFamily:"var(--mono)", fontSize:11, padding:"2px 8px", lineHeight:1.3 }}
                          title={t(key)}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  )}
                  {viewData && viewData.results.filter(r=>!r.error).length > 1 && (
                    <div style={{ display:"flex", gap:3, background:"var(--bg3)", borderRadius:6, padding:3, border:"1px solid var(--border)" }}>
                      <button
                        className={`btn btn-sm ${!compareDiffMode ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setCompareDiffMode(false)}
                        style={{ fontFamily:"var(--mono)", fontSize:11, padding:"2px 8px", lineHeight:1.3 }}
                        title="No diff">
                        ▭
                      </button>
                      <button
                        className={`btn btn-sm ${compareDiffMode && compareDiffLevel==="word" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => { setCompareDiffMode(true); setCompareDiffLevel("word"); }}
                        style={{ fontFamily:"var(--mono)", fontSize:11, padding:"2px 8px", lineHeight:1.3 }}
                        title={t("compare_diff_tip") + " — " + t("compare_diff_word")}>
                        ▨ {t("compare_diff_word")}
                      </button>
                      <button
                        className={`btn btn-sm ${compareDiffMode && compareDiffLevel==="sentence" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => { setCompareDiffMode(true); setCompareDiffLevel("sentence"); }}
                        style={{ fontFamily:"var(--mono)", fontSize:11, padding:"2px 8px", lineHeight:1.3 }}
                        title={t("compare_diff_sentence") + ": " + "Highlights sentences unique to each model"}>
                        ≡ {t("compare_diff_sentence")}
                      </button>
                    </div>
                  )}
                  {compareHistory.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={clearCompareHistory}
                      title={t("compare_clear_confirm")}
                      style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                      {t("compare_clear")}
                    </button>
                  )}
                  {viewData && (
                    <button className="btn btn-ghost btn-sm" onClick={exportMarkdown}
                      title="Export full comparison as .md file (includes model ID, time, tokens)"
                      style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                      📄 {compareExportDone ? t("compare_export_done") : t("compare_export")}
                    </button>
                  )}
                  <button className={`btn btn-sm ${compareAutoRefresh ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setCompareAutoRefresh(p => !p)}
                    title="Auto-refresh: polls for new comparisons every 3 seconds from your IDE"
                    style={{ fontFamily:"var(--mono)", fontSize:12 }}>
                    {compareAutoRefresh ? "⏹ " : "⏸ "}{t("compare_auto")}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => fetchCompare(false)} disabled={compareLoading}
                    title="Refresh comparison data now">
                    {compareLoading ? "…" : "⟳"} {t("compare_refresh")}
                  </button>
                </div>
              </div>

              {/* Ask models panel */}
              <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>
                    {t("compare_ask")}
                  </div>
                  <button className={`btn btn-sm ${compareShowTemps ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setCompareShowTemps(p => !p)}
                    style={{ fontFamily:"var(--mono)", fontSize:10, padding:"2px 8px" }}
                    title={"Set individual temperature per model. * = uses global temperature from Configuration"}>
                    🌡 {t("compare_temps")}
                  </button>
                </div>
                {/* Prompt templates */}
                {compareTemplates.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", display:"flex", alignItems:"center", marginRight:2 }}>
                      {t("compare_templates")}:
                    </span>
                    {compareTemplates.map((tpl, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
                        <button
                          style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", border:"none", background:"none", cursor:"pointer", padding:"2px 8px", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                          onClick={() => setComparePrompt(tpl)} title={tpl}>
                          {tpl.length > 28 ? tpl.slice(0, 28) + "…" : tpl}
                        </button>
                        <button
                          style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", border:"none", borderLeft:"1px solid var(--border)", background:"none", cursor:"pointer", padding:"2px 6px", opacity:0.6, flexShrink:0 }}
                          onClick={() => deleteTemplate(tpl)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <textarea
                      className="form-input"
                      style={{ width:"100%", resize:"vertical", minHeight:56, maxHeight:160, fontFamily:"var(--mono)", fontSize:12, lineHeight:1.6, paddingRight: comparePrompt ? 28 : undefined }}
                      placeholder={t("compare_send_placeholder")}
                      value={comparePrompt}
                      onChange={e => setComparePrompt(e.target.value)}
                      onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") streamCompare(); }}
                      disabled={compareRunning}
                    />
                    {comparePrompt && !compareRunning && (
                      <button
                        onClick={() => setComparePrompt("")}
                        title="Clear prompt"
                        style={{ position:"absolute", top:6, right:6, background:"none", border:"none",
                                 color:"var(--text2)", cursor:"pointer", fontSize:14, lineHeight:1,
                                 padding:"2px 4px", borderRadius:4, opacity:0.6 }}
                      >✕</button>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => streamCompare()}
                      disabled={compareRunning || !comparePrompt.trim()}
                      style={{ fontFamily:"var(--mono)", fontSize:12, padding:"8px 16px" }}>
                      {compareRunning ? t("compare_sending") : t("compare_send")}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => saveTemplate()}
                      disabled={!comparePrompt.trim()}
                      style={{ fontFamily:"var(--mono)", fontSize:10, padding:"4px 8px" }}
                      title={"Save this prompt as a template chip — click any chip to reuse it instantly"}>
                      {t("compare_template_save")}
                    </button>
                  </div>
                </div>
                {/* Per-model temperature panel */}
                {compareShowTemps && models.filter(m => m.active).length > 0 && (
                  <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:10 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                      🌡 {t("compare_temps")}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:8 }}>
                      {models.filter(m => m.active).map(m => {
                        const temp = compareModelTemps[m.id] ?? null;
                        const globalTemp = prefs?.temperature ?? 0.7;
                        return (
                          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:6, padding:"6px 10px" }}>
                            <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={m.name}>
                              {m.name.split("/").pop()}
                            </span>
                            <span style={{ fontFamily:"var(--mono)", fontSize:11, color: temp !== null ? "var(--accent)" : "var(--text2)", minWidth:26, textAlign:"right" }}>
                              {temp !== null ? temp.toFixed(1) : `${globalTemp.toFixed(1)}*`}
                            </span>
                            <input type="range" min="0" max="1" step="0.1"
                              value={temp ?? globalTemp}
                              onChange={e => setCompareModelTemps(p => ({ ...p, [m.id]: parseFloat(e.target.value) }))}
                              style={{ width:72 }}
                            />
                            {temp !== null && (
                              <button
                                style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", border:"none", background:"none", cursor:"pointer", padding:"0 2px", opacity:0.7 }}
                                onClick={() => setCompareModelTemps(p => { const n = { ...p }; delete n[m.id]; return n; })}
                                title={t("compare_temp_reset")}>↺</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", marginTop:6, opacity:0.6 }}>* {t("compare_temp_reset")} (global)</div>
                  </div>
                )}
              </div>

              {/* Live streaming grid */}
              {compareRunning && compareStreamSlots.length > 0 && (
                <div style={{ display:"grid", gap:20 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ animation:"blink 1s step-start infinite", display:"inline-block" }}>◉</span>
                    {t("compare_streaming")}
                  </div>
                  <div className="compare-grid" style={{
                    gridTemplateColumns: compareStreamSlots.length === 1 ? "1fr"
                      : compareStreamSlots.length === 2 ? "1fr 1fr"
                      : "repeat(3, 1fr)"
                  }}>
                    {compareStreamSlots.map((slot, i) => (
                      <CompareCard key={i} result={slot} index={i} t={t}
                        isFastest={false} isMostTokens={false}
                        isExpanded={false} onExpand={() => {}}
                        streaming={true}
                        onCopy={() => slot.model && recordCopy(slot.model)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {compareRunning ? null : compareLoading ? (
                <div className="empty">{t("hw_loading")}</div>
              ) : !viewData ? (
                <div className="card" style={{ textAlign:"center", padding:"56px 24px" }}>
                  <div style={{ fontSize:40, marginBottom:16, opacity:0.3 }}>⊞</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:14, color:"var(--text2)", marginBottom:10, fontWeight:700 }}>
                    {t("compare_empty")}
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", opacity:0.7, maxWidth:500, margin:"0 auto", lineHeight:1.9 }}>
                    {t("compare_empty_hint")}
                  </div>
                </div>
              ) : (
                <div style={{ display:"grid", gap:20 }}>
                  {/* Metadata row */}
                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ background:"#1a1a2a", border:"1px solid var(--border)", borderRadius:6, padding:"4px 12px", fontFamily:"var(--mono)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"var(--accent)" }}>
                      {t("compare_mode")}: {viewData.mode}
                    </span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                      {t("compare_at")}: {new Date(viewData.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                      {viewData.results.length} {viewData.results.length === 1 ? "model" : "models"}
                    </span>
                    {viewData.prompt && !compareRunning && (
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => streamCompare(viewData.prompt)}
                        title={"Re-send this exact prompt through all currently active models: " + viewData.prompt.slice(0, 60) + (viewData.prompt.length > 60 ? "…" : "")}
                        style={{ fontFamily:"var(--mono)", fontSize:11, marginLeft:"auto" }}>
                        {t("compare_rerun")}
                      </button>
                    )}
                  </div>

                  {/* Prompt preview */}
                  {viewData.prompt && (
                    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 18px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>{t("compare_prompt")}</div>
                        <button className="btn btn-ghost btn-sm" style={{ fontFamily:"var(--mono)", fontSize:10, padding:"1px 7px" }}
                          onClick={() => { navigator.clipboard.writeText(viewData.prompt); toast(t("copied"), "success"); }}>
                          {t("compare_copy_prompt")}
                        </button>
                      </div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--text)", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word", maxHeight:72, overflow:"hidden", WebkitMaskImage:"linear-gradient(to bottom, black 50%, transparent 100%)" }}>
                        {viewData.prompt}
                      </div>
                    </div>
                  )}

                  {/* Response cards grid */}
                  {(() => {
                    const validResults = viewData.results.filter(r => !r.error);
                    const _diffTokens = compareDiffMode && validResults.length > 1
                      ? (compareDiffLevel === "sentence"
                          ? computeSentenceDiff(viewData.results, comparePinnedIdx)
                          : computeWordDiff(viewData.results, comparePinnedIdx))
                      : null;
                    return (
                      <div className="compare-grid" style={{
                        gridTemplateColumns: compareExpandIdx !== null ? "1fr"
                          : viewData.results.length === 1 ? "1fr"
                          : viewData.results.length === 2 ? "1fr 1fr"
                          : "repeat(3, 1fr)"
                      }}>
                        {(compareExpandIdx !== null
                          ? [{ r: viewData.results[compareExpandIdx], origIdx: compareExpandIdx }]
                          : _sortedResults.map(r => ({ r, origIdx: viewData.results.indexOf(r) }))
                        ).map(({ r: result, origIdx: realIdx }) => (
                          <CompareCard key={realIdx} result={result} index={realIdx} t={t}
                            isFastest={fastestIdx === realIdx}
                            isMostTokens={mostTokensIdx === realIdx}
                            isExpanded={compareExpandIdx === realIdx}
                            onExpand={() => setCompareExpandIdx(compareExpandIdx === realIdx ? null : realIdx)}
                            diffTokens={_diffTokens && !result.error ? _diffTokens[realIdx] : null}
                            isPinned={comparePinnedIdx === realIdx}
                            onPin={validResults.length > 1 ? () => setComparePinnedIdx(comparePinnedIdx === realIdx ? null : realIdx) : null}
                            onCopy={() => result.model && recordCopy(result.model)}
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Stats performance bar */}
                  {viewData.results.filter(r => !r.error).length > 1 && (() => {
                    const valid = viewData.results.filter(r => !r.error);
                    const maxTime = Math.max(...valid.map(r => r.elapsed_s ?? 0));
                    const maxTok  = Math.max(...valid.map(r => r.tokens ?? 0));
                    if (maxTime === 0 && maxTok === 0) return null;
                    return (
                      <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 18px" }}>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                          {t("compare_stats")}
                        </div>
                        {valid.map(r => {
                          const ri = viewData.results.indexOf(r);
                          const col = COMPARE_COLORS[ri % COMPARE_COLORS.length];
                          const tp = maxTime > 0 ? ((r.elapsed_s ?? 0) / maxTime) * 100 : 0;
                          const kp = maxTok  > 0 ? ((r.tokens  ?? 0) / maxTok)  * 100 : 0;
                          return (
                            <div key={ri} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                                <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, color:col }}>{r.name}</span>
                                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                                  {r.elapsed_s != null ? `${r.elapsed_s}s` : "—"} · {r.tokens > 0 ? `${r.tokens} tok` : "—"}
                                </span>
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                                {maxTime > 0 && (
                                  <div>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", marginBottom:3 }}>⚡ {t("compare_time")}</div>
                                    <div style={{ background:"var(--bg)", borderRadius:4, height:5, overflow:"hidden" }}>
                                      <div style={{ width:`${tp}%`, height:"100%", background:col, borderRadius:4, transition:"width .4s" }}/>
                                    </div>
                                  </div>
                                )}
                                {maxTok > 0 && (
                                  <div>
                                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", marginBottom:3 }}>📝 {t("compare_tokens")}</div>
                                    <div style={{ background:"var(--bg)", borderRadius:4, height:5, overflow:"hidden" }}>
                                      <div style={{ width:`${kp}%`, height:"100%", background:col, opacity:0.6, borderRadius:4, transition:"width .4s" }}/>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Jaccard similarity */}
                        {(() => {
                          const validContent = valid.filter(r => r.content);
                          if (validContent.length < 2) return null;
                          const pairs = computeJaccard(validContent);
                          if (pairs.length === 0) return null;
                          return (
                            <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:10 }}>
                              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                                {t("compare_similarity")}
                              </div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                                {pairs.map((p, i) => (
                                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:6, padding:"4px 10px" }}>
                                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)" }}>{p.a} ↔ {p.b}</span>
                                    <span style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color: p.score >= 60 ? "var(--green)" : p.score >= 35 ? "var(--yellow)" : "var(--red)" }}>
                                      {p.score}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>;
          })()}

          {/* ── CONFIG PAGE ── */}
          {page === "config" && prefs && <>
            <h1 className="page-title">{t("config_title")}</h1>
            <p className="page-sub">{t("config_sub")}</p>
            <div style={{ display:"grid", gap:20 }}>

              {/* Multi-Model Mode */}
              <div className="card">
                <div className="card-title">{t("mode_label")}</div>
                {health?.last_request?.type === "tool_call" && (
                  <div style={{ padding:"10px 14px", background:"#1a1200", border:"1px solid var(--yellow)", borderRadius:8, marginBottom:14, fontFamily:"var(--mono)", fontSize:11, color:"var(--yellow)", lineHeight:1.7 }}>
                    {t("mode_note_tools")}
                  </div>
                )}
                <div className="mode-grid">
                  {[
                    { id:"parallel", title:t("mode_parallel"), desc:t("mode_parallel_desc"), soon:false },
                    { id:"race",     title:t("mode_race"),     desc:t("mode_race_desc"),     soon:false },
                    { id:"vote",     title:t("mode_vote"),     desc:t("mode_vote_desc"),     soon:false },
                    { id:"review",   title:t("mode_review"),   desc:t("mode_review_desc"),   soon:false },
                    ].map(m => (
                      <div key={m.id}
                        className={`mode-card ${prefs.mode===m.id&&!m.soon?"selected":""}`}
                        onClick={() => { if (m.soon) return; updatePrefs({ mode: m.id }); toast(`${t("mode_set")}: ${m.title}`, "info"); }}
                        style={m.soon ? { opacity:0.45, cursor:"not-allowed" } : {}}>
                        <div className="mode-card-title">
                          {m.title}
                          {m.soon && <span style={{ marginLeft:8, fontSize:10, fontFamily:"var(--mono)", color:"var(--accent)", background:"#1a1a2a", border:"1px solid var(--accent)", borderRadius:4, padding:"1px 6px", verticalAlign:"middle" }}>🔒 SOON</span>}
                        </div>
                        <div className="mode-card-desc">
                          {m.desc}
                          {m.soon && <div style={{ marginTop:8, fontSize:11, color:"var(--yellow)", fontFamily:"var(--mono)" }}>Coming Soon in v0.2</div>}
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              {/* Agent/Plan Model */}
              <div className="card">
                <div className="card-title">⚡ {t("agent_model_label")}</div>
                <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)", margin:"0 0 14px 0", lineHeight:1.6 }}>{t("agent_model_sub")}</p>
                <select className="form-input" style={{ width:"100%" }}
                  value={prefs.agent_model ?? ""}
                  onChange={e => { updatePrefs({ agent_model: e.target.value }); toast(t("agent_model_saved"), "success"); }}>
                  <option value="">{t("agent_model_auto")}</option>
                  {(health?.active_models ?? []).map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              {/* Temperature */}
              <div className="card">
                <div className="card-title">{t("temp_label")}</div>
                <div className="slider-wrap">
                  <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
                    <span className="slider-value">{(prefs.temperature ?? 0.7).toFixed(1)}</span>
                    <span className="slider-hint">{getTempHint(prefs.temperature ?? 0.7, t)}</span>
                  </div>
                  <input type="range" className="slider" min="0" max="1" step="0.1"
                    value={prefs.temperature ?? 0.7}
                    onChange={e => setPrefs(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    onMouseUp={e => { updatePrefs({ temperature: parseFloat(e.target.value) }); toast(t("temp_saved"), "success"); }}
                    onTouchEnd={e => { updatePrefs({ temperature: parseFloat(e.target.value) }); toast(t("temp_saved"), "success"); }}
                  />
                  <div className="slider-labels">
                    <span>0.0</span><span>0.5</span><span>1.0</span>
                  </div>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="card">
                <div className="card-title">{t("maxtokens_label")}</div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <input type="number" className="form-input" style={{ width:140 }}
                    value={prefs.max_tokens ?? 4096} min={256} max={32000} step={256}
                    onChange={e => setPrefs(p => ({ ...p, max_tokens: parseInt(e.target.value) }))}
                    onBlur={e => { updatePrefs({ max_tokens: parseInt(e.target.value) }); toast(t("maxtokens_saved"), "success"); }}
                  />
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>tokens</span>
                </div>
              </div>

              {/* Chat History Limit */}
              <div className="card">
                <div className="card-title">{t("maxhistory_label")}</div>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:14, lineHeight:1.7 }}>
                  {t("maxhistory_sub")}
                </p>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <input type="number" className="form-input" style={{ width:140 }}
                    value={prefs.max_history_messages ?? 10} min={2} max={50} step={2}
                    onChange={e => setPrefs(p => ({ ...p, max_history_messages: parseInt(e.target.value) }))}
                    onBlur={e => { updatePrefs({ max_history_messages: parseInt(e.target.value) }); toast(t("maxhistory_saved"), "success"); }}
                  />
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
                    messages &nbsp;<span style={{ color: (prefs.max_history_messages ?? 10) <= 6 ? "var(--green)" : (prefs.max_history_messages ?? 10) <= 14 ? "var(--yellow)" : "var(--red)" }}>●</span>
                  </span>
                </div>
              </div>

              {/* ── Context & Memory section ── */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
                  🧠 {t("config_context_memory_section")}
                </span>
                <div style={{ flex:1, height:1, background:"var(--border)" }} />
              </div>

              {/* Project Context / Memory */}
              <div className="card">
                <div className="card-title">{t("memory_label")}</div>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:14, lineHeight:1.7 }}>
                  {t("memory_sub")}
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                    <input type="checkbox"
                      checked={prefs.memory_enabled ?? false}
                      onChange={e => updatePrefs({ memory_enabled: e.target.checked })}
                    />
                    {t("memory_enable")}
                  </label>
                </div>
                {(prefs.memory_enabled) && <>
                  <textarea
                    className={`form-textarea ${(prefs.memory_text||"").length > MEMORY_MAX_CHARS ? "over-limit" : ""}`}
                    placeholder={t("memory_placeholder")}
                    value={prefs.memory_text || ""}
                    onChange={e => setPrefs(p => ({ ...p, memory_text: e.target.value }))}
                    onBlur={e => {
                      const text = e.target.value;
                      if (text.length > MEMORY_MAX_CHARS) { toast(t("memory_too_long"), "error"); return; }
                      updatePrefs({ memory_text: text });
                      toast(t("memory_saved"), "success");
                    }}
                  />
                  <div style={{ marginTop:8 }}>
                    {(() => {
                      const len = (prefs.memory_text||"").length;
                      const cls = len > MEMORY_MAX_CHARS ? "over" : len > MEMORY_MAX_CHARS * 0.8 ? "warn" : "ok";
                      return (
                        <div className={`memory-counter ${cls}`}>
                          <span>{len} {t("memory_chars")}</span>
                          <span>{MEMORY_MAX_CHARS} {t("memory_max")}</span>
                        </div>
                      );
                    })()}
                  </div>
                </>}
              </div>

              {/* Smart Memory / RAG */}
              <div className="card">
                <div className="card-title">🧠 {t("rag_label")}</div>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", marginBottom:14, lineHeight:1.7 }}>
                  {t("rag_sub")}
                </p>

                {/* Not-available banner */}
                {ragStatus && !ragStatus.available && (
                  <div style={{ padding:"12px 14px", background:"#1a1200", border:"1px solid #4a3a00", borderRadius:8, marginBottom:14, fontFamily:"var(--mono)", fontSize:11, color:"var(--yellow)" }}>
                    ⚠ {t("rag_not_available")} — <code>{t("rag_install_hint")}</code>
                  </div>
                )}

                {/* Enable toggle */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                    <input type="checkbox"
                      checked={prefs?.rag_enabled ?? false}
                      onChange={e => {
                        if (e.target.checked && !(prefs?.rag_enabled)) {
                          setShowRagWarning(true);
                        } else {
                          updatePrefs({ rag_enabled: e.target.checked });
                        }
                      }}
                    />
                    {t("rag_enable")}
                  </label>
                </div>

                {(prefs?.rag_enabled) && <>
                  {/* Path + Index button */}
                  <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"flex-end" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{t("rag_path_label")}</div>
                      <input type="text" className="form-input" style={{ width:"100%" }}
                        placeholder={t("rag_path_placeholder")}
                        value={prefs?.rag_path || ""}
                        onChange={e => setPrefs(p => ({ ...p, rag_path: e.target.value }))}
                        onBlur={e => updatePrefs({ rag_path: e.target.value.trim() })}
                      />
                    </div>
                    <button className="btn btn-primary" style={{ flexShrink:0 }}
                      disabled={ragIndexing || !prefs?.rag_path?.trim()}
                      onClick={triggerRagIndex}>
                      {ragIndexing ? t("rag_indexing") : t("rag_index_btn")}
                    </button>
                  </div>

                  {/* Index stats */}
                  {ragStatus && ragStatus.chunks_total > 0 && (
                    <div style={{ display:"flex", gap:20, marginBottom:14, padding:"10px 14px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)", fontFamily:"var(--mono)", fontSize:11 }}>
                      <div><span style={{ color:"var(--accent)", fontWeight:700 }}>{ragStatus.files_indexed}</span> <span style={{ color:"var(--text2)" }}>{t("rag_status_files")}</span></div>
                      <div><span style={{ color:"var(--accent)", fontWeight:700 }}>{ragStatus.chunks_total.toLocaleString()}</span> <span style={{ color:"var(--text2)" }}>{t("rag_status_chunks")}</span></div>
                      <div><span style={{ color:"var(--accent)", fontWeight:700 }}>{ragStatus.index_size_mb}</span> <span style={{ color:"var(--text2)" }}>{t("rag_status_size")}</span></div>
                      {ragStatus.last_indexed && (
                        <div style={{ marginLeft:"auto" }}>
                          <span style={{ color:"var(--text2)" }}>{t("rag_status_last")}: </span>
                          <span style={{ color:"var(--text)" }}>{new Date(ragStatus.last_indexed).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Advanced toggle */}
                  <div style={{ marginBottom:10 }}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setRagAdvanced(v => !v)}>
                      {ragAdvanced ? "▾" : "▸"} {t("rag_advanced")}
                    </button>
                  </div>

                  {ragAdvanced && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14, padding:"14px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{t("rag_max_mb")}</div>
                        <input type="number" className="form-input" style={{ width:"100%" }}
                          value={prefs?.rag_max_index_mb ?? 200} min={10} max={2000} step={50}
                          onChange={e => setPrefs(p => ({ ...p, rag_max_index_mb: parseInt(e.target.value) }))}
                          onBlur={e => updatePrefs({ rag_max_index_mb: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{t("rag_max_kb")}</div>
                        <input type="number" className="form-input" style={{ width:"100%" }}
                          value={prefs?.rag_max_file_kb ?? 500} min={10} max={5000} step={50}
                          onChange={e => setPrefs(p => ({ ...p, rag_max_file_kb: parseInt(e.target.value) }))}
                          onBlur={e => updatePrefs({ rag_max_file_kb: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{t("rag_top_k")}</div>
                        <input type="number" className="form-input" style={{ width:"100%" }}
                          value={prefs?.rag_top_k ?? 5} min={1} max={20} step={1}
                          onChange={e => setPrefs(p => ({ ...p, rag_top_k: parseInt(e.target.value) }))}
                          onBlur={e => updatePrefs({ rag_top_k: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{t("rag_max_inject_chars")}</div>
                        <input type="number" className="form-input" style={{ width:"100%" }}
                          value={prefs?.rag_max_inject_chars ?? 3000} min={500} max={20000} step={500}
                          onChange={e => setPrefs(p => ({ ...p, rag_max_inject_chars: parseInt(e.target.value) }))}
                          onBlur={e => updatePrefs({ rag_max_inject_chars: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Clear index */}
                  {ragStatus && ragStatus.chunks_total > 0 && (
                    <div style={{ marginTop:4 }}>
                      <button className="btn btn-danger btn-sm" onClick={clearRagIndex}>{t("rag_clear_btn")}</button>
                    </div>
                  )}
                </>}
              </div>

              {/* Usage Stats */}
              <div className="card">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div className="card-title" style={{ marginBottom:0 }}>{t("stats_label")}</div>
                  <button className="btn btn-ghost btn-sm" onClick={resetStats}>{t("stats_reset")}</button>
                </div>
                {Object.keys(stats).length === 0
                  ? <div className="empty" style={{ padding:24 }}>{t("stats_empty")}</div>
                  : <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th style={{ textAlign:"right" }}>{t("stats_requests")}</th>
                          <th style={{ textAlign:"right" }}>{t("stats_tokens")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats).map(([id, s]) => {
                          const model = models.find(m => m.id === id);
                          return (
                            <tr key={id}>
                              <td>
                                <div>{model?.name || id}</div>
                                <div style={{ fontSize:10, color:"var(--text2)", fontFamily:"var(--mono)" }}>{id}</div>
                              </td>
                              <td className="num">{s.requests.toLocaleString()}</td>
                              <td className="num">{s.tokens.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                }
              </div>

              {/* Active Models */}
              <div className="card">
                <div className="card-title">{t("active_models_label")}</div>
                {active.length === 0
                  ? <div className="empty" style={{ padding:24 }}>{t("no_active_models")}</div>
                  : active.map(m => (
                    <div key={m.id} className="active-model-item">
                      <div>
                        <div className="active-model-name">{m.name}</div>
                        <div className="active-model-id">{m.id}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <span className={`free-badge ${inferIsFree(m.provider,m.base_url)?"free":"paid"}`}>
                          {inferIsFree(m.provider,m.base_url)?t("free_badge"):t("paid_badge")}
                        </span>
                        <span className={`provider-badge ${getProviderClass(m.provider)}`}>{m.provider}</span>
                      </div>
                    </div>
                  ))
                }
              </div>

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
            <StatsPage
              t={t}
              statsData={statsData}
              models={models}
              onReset={async () => {
                await fetch(`${API}/api/stats`, { method:"DELETE" });
                setStatsData({});
              }}
            />
          )}

          {/* ── BENCH PAGE ── */}
          {page === "bench" && (
            <BenchmarkPage
              t={t}
              activeModels={active}
            />
          )}

          {/* ── HELP PAGE ── */}
          {page === "help" && <HelpPage t={t} setPage={setPage} />}

        </main>
      </div>

      <div className="toast-container">
        {toasts.map(x => <div key={x.id} className={`toast ${x.type}`}>{x.msg}</div>)}
      </div>

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

function ModelCard({ model, t, stats, onToggle, onSaveKey, onDelete }) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey]   = useState(false);
  const isFree   = inferIsFree(model.provider, model.base_url);
  const needsKey = !isFree;

  return (
    <div className={`model-card ${model.active?"active":""}`}>
      <div className="model-header">
        <div>
          <div className="model-name">{model.name}</div>
          <div className="model-id">{model.id}</div>
        </div>
        <span className={`provider-badge ${getProviderClass(model.provider)}`}>{model.provider}</span>
      </div>
      {model.notes && <div className="model-notes">{model.notes}</div>}
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
    { id:"co1", label:"FizzBuzz",   text:"Write a Python FizzBuzz for 1 to 20. Return only the code, no explanation." },
    { id:"co2", label:"Palindrome", text:"Write a Python function is_palindrome(s) returning True or False. Code only." },
    { id:"co3", label:"Fibonacci",  text:"Write a Python function fib(n) returning the nth Fibonacci number. Code only." },
  ]},
  reasoning: { icon:"🧠", key:"reasoning", prompts:[
    { id:"re1", label:"Syllogism", text:"All bloops are razzles. All razzles are lazzles. Are all bloops lazzles? Answer Yes or No and explain in one sentence." },
    { id:"re2", label:"Math",      text:"Calculate: (17 × 23) + (456 / 8). Show your working." },
    { id:"re3", label:"Sequence",  text:"What comes next: 2, 4, 8, 16, 32, ___? Give the answer and explain in one sentence." },
  ]},
  creative:  { icon:"🎨", key:"creative",  prompts:[
    { id:"cr1", label:"Haiku",    text:"Write a haiku about artificial intelligence." },
    { id:"cr2", label:"Metaphor", text:"Explain neural networks using a cooking metaphor in exactly 2 sentences." },
    { id:"cr3", label:"Story",    text:"Write a 2-sentence story about a robot discovering music." },
  ]},
};

function BenchmarkPage({ t, activeModels }) {
  const [suite,    setSuite]    = useState("speed");
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState({ n:0, total:0, label:"" });
  const [results,  setResults]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("airvo_bench_results") || "null"); } catch { return null; }
  });
  const [history,  setHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("airvo_bench_history") || "[]"); } catch { return []; }
  });

  async function runBenchmark() {
    if (activeModels.length < 2 || running) return;
    setRunning(true);
    const s = BENCH_SUITES[suite];
    const runResults = [];
    for (let i = 0; i < s.prompts.length; i++) {
      const p = s.prompts[i];
      setProgress({ n: i + 1, total: s.prompts.length, label: p.label });
      try {
        const resp = await fetch(`${API}/api/compare/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p.text, max_tokens: 512, temperature: 0.3 }),
        });
        const data = await resp.json();
        runResults.push({ prompt: p, modelResults: data.data?.results || [] });
      } catch (e) {
        runResults.push({ prompt: p, modelResults: [], error: String(e) });
      }
    }
    const run = { id: Date.now(), suite, timestamp: Date.now(), results: runResults };
    setResults(run);
    const newHist = [run, ...history].slice(0, 5);
    setHistory(newHist);
    localStorage.setItem("airvo_bench_results", JSON.stringify(run));
    localStorage.setItem("airvo_bench_history", JSON.stringify(newHist));
    setRunning(false);
    setProgress({ n:0, total:0, label:"" });
  }

  function clearHistory() {
    setHistory([]); setResults(null);
    localStorage.removeItem("airvo_bench_results");
    localStorage.removeItem("airvo_bench_history");
  }

  function computeLeaderboard(run) {
    if (!run) return [];
    const scores = {};
    for (const { modelResults } of run.results) {
      if (!modelResults?.length) continue;
      const valid  = modelResults.filter(r => !r.error && r.elapsed_s);
      const sorted = [...valid].sort((a, b) => (a.elapsed_s||99) - (b.elapsed_s||99));
      sorted.forEach((r, rank) => {
        if (!scores[r.model]) scores[r.model] = { name:r.name||r.model, pts:0, totE:0, totT:0, totTS:0, n:0 };
        scores[r.model].pts   += sorted.length - rank;
        scores[r.model].totE  += r.elapsed_s || 0;
        scores[r.model].totT  += r.tokens    || 0;
        scores[r.model].totTS += r.elapsed_s > 0 ? (r.tokens / r.elapsed_s) : 0;
        scores[r.model].n     += 1;
      });
    }
    return Object.entries(scores)
      .map(([id, s]) => ({
        id, name:s.name, pts:s.pts,
        avgE:  s.n ? (s.totE  / s.n).toFixed(2) : "—",
        avgT:  s.n ? Math.round(s.totT  / s.n)  : 0,
        avgTS: s.n ? Math.round(s.totTS / s.n)  : 0,
      }))
      .sort((a, b) => b.pts - a.pts);
  }

  const leaderboard = computeLeaderboard(results?.suite === suite ? results : null);
  const medals      = ["🥇","🥈","🥉"];
  const suiteDef    = BENCH_SUITES[suite];

  return (
    <div>
      <h1 className="page-title">{t("bench_title")}</h1>
      <p className="page-sub">{t("bench_sub")}</p>

      {/* Suite selector */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {Object.values(BENCH_SUITES).map(s => (
          <button key={s.key} disabled={running}
            className={`btn ${suite === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSuite(s.key)}>
            {s.icon} {t(`bench_suite_${s.key}`)}
          </button>
        ))}
      </div>

      {/* Prompts preview */}
      <div style={{ marginBottom:20, background:"var(--bg2)", borderRadius:12, border:"1px solid var(--border)", padding:"12px 16px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>
          {suiteDef.icon} {t(`bench_suite_${suite}`)} · {suiteDef.prompts.length} prompts
        </div>
        {suiteDef.prompts.map((p, i) => (
          <div key={p.id} style={{ display:"flex", gap:10, alignItems:"baseline", padding:"5px 0", borderBottom: i < suiteDef.prompts.length-1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", minWidth:16 }}>{i+1}.</span>
            <span style={{ fontWeight:700, fontSize:12, color:"var(--accent)", minWidth:82 }}>{p.label}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)", lineHeight:1.5 }}>{p.text}</span>
          </div>
        ))}
      </div>

      {/* Run controls */}
      {activeModels.length < 2 ? (
        <div style={{ padding:12, background:"rgba(255,80,80,0.08)", border:"1px solid var(--red)", borderRadius:8, color:"var(--red)", fontFamily:"var(--mono)", fontSize:12, marginBottom:20 }}>
          ⚠ {t("bench_no_active")}
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <button className="btn btn-primary" onClick={runBenchmark} disabled={running} style={{ minWidth:180 }}>
            {running
              ? `⏳ ${t("bench_running")} ${progress.n}/${progress.total}: ${progress.label}`
              : `▶ ${t("bench_run")}`}
          </button>
          {running && (
            <div style={{ flex:1, maxWidth:300, height:6, background:"var(--bg3)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(progress.n/progress.total)*100}%`, background:"var(--accent)", transition:"width 0.5s", borderRadius:3 }} />
            </div>
          )}
        </div>
      )}

      {/* Results for current suite */}
      {results?.suite === suite && (
        <>
          {/* Leaderboard */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--text1)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
              🏆 {t("bench_leaderboard")}
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {leaderboard.map((m, i) => (
                <div key={m.id} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 20px", minWidth:170, position:"relative" }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{medals[i] || `#${i+1}`}</div>
                  <div style={{ fontWeight:700, fontSize:13, color:"var(--text1)", marginBottom:6 }}>{m.name}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--green)" }}>⚡ {m.avgE}s</span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)" }}>📝 {m.avgT} tok</span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--yellow)" }}>🚀 {m.avgTS} t/s</span>
                  </div>
                  <span style={{ position:"absolute", top:10, right:12, fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{m.pts}pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-prompt table */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--text1)", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
              📋 {t("bench_results")}
            </div>
            {results.results.map(({ prompt, modelResults, error }) => (
              <div key={prompt.id} style={{ marginBottom:12, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
                <div style={{ padding:"8px 14px", background:"var(--bg3)", borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontWeight:700, color:"var(--accent)", fontSize:12 }}>{prompt.label}</span>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>{prompt.text.length > 70 ? prompt.text.slice(0,70)+"…" : prompt.text}</span>
                </div>
                {error
                  ? <div style={{ padding:10, color:"var(--red)", fontFamily:"var(--mono)", fontSize:12 }}>⚠ {error}</div>
                  : <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid var(--border)" }}>
                          <th style={{ textAlign:"left",  padding:"7px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", fontWeight:600 }}>Model</th>
                          <th style={{ textAlign:"right", padding:"7px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", fontWeight:600 }}>Elapsed</th>
                          <th style={{ textAlign:"right", padding:"7px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", fontWeight:600 }}>Tokens</th>
                          <th style={{ textAlign:"right", padding:"7px 14px", fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", fontWeight:600 }}>Tok/s</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...modelResults].sort((a,b) => (a.elapsed_s||99)-(b.elapsed_s||99)).map((r, ri) => {
                          const ts = r.elapsed_s > 0 ? Math.round(r.tokens / r.elapsed_s) : 0;
                          return (
                            <tr key={r.model} style={{ borderBottom: ri < modelResults.length-1 ? "1px solid var(--border)" : "none" }}>
                              <td style={{ padding:"7px 14px", fontSize:12 }}>
                                {ri === 0 && !r.error && <span style={{ marginRight:5 }}>⚡</span>}
                                <span style={{ fontWeight:600, color:"var(--text1)" }}>{r.name || r.model}</span>
                                {r.error && <span style={{ color:"var(--red)", marginLeft:8, fontSize:11 }}>⚠</span>}
                              </td>
                              <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color: ri===0&&!r.error ? "var(--green)" : "var(--text2)" }}>
                                {r.elapsed_s ? `${r.elapsed_s}s` : "—"}
                              </td>
                              <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>
                                {r.tokens || "—"}
                              </td>
                              <td style={{ textAlign:"right", padding:"7px 14px", fontFamily:"var(--mono)", fontSize:12, color:"var(--text2)" }}>
                                {ts || "—"}
                              </td>
                            </tr>
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

      {/* No results yet */}
      {(!results || results.suite !== suite) && !running && (
        <div style={{ padding:32, textAlign:"center", color:"var(--text2)", fontFamily:"var(--mono)", fontSize:12 }}>
          {t("bench_no_results")}
        </div>
      )}

      {/* History footer */}
      {history.length > 0 && (
        <div style={{ marginTop:8, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text2)" }}>
            {t("bench_history_title")}: {history.length} run{history.length !== 1 ? "s" : ""} · {new Date(history[0].timestamp).toLocaleDateString()}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={clearHistory}>{t("bench_clear")}</button>
        </div>
      )}
    </div>
  );
}

// ── Model price table ($/1M tokens, simplified average) ──────────────────
const MODEL_PRICES = {
  openai: 5, anthropic: 9, groq: 0, ollama: 0, lmstudio: 0,
  together: 0.2, cerebras: 0.1, openrouter: 1, mistral: 0.5,
  deepseek: 0.1, gemini: 0.35, cohere: 0.5, fireworks: 0.5, novita: 0.5,
};

function StatsPage({ t, statsData, models, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone,    setResetDone]    = useState(false);

  const getProvider = (id) => (id || "").split("/")[0].toLowerCase();
  const getPrice    = (id) => MODEL_PRICES[getProvider(id)] ?? 1;
  const getCost     = (id, tokens) => (tokens / 1_000_000) * getPrice(id);
  const isLocal     = (id) => ["ollama","lmstudio"].includes(getProvider(id));
  const isFree      = (id) => getPrice(id) === 0;
  const fmtCost     = (c) => c < 0.001 ? (isFree ? "" : "<$0.001") : `$${c.toFixed(4)}`;
  const fmtTokens   = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

  const entries = Object.entries(statsData);

  // last 7 calendar days
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toISOString().split("T")[0];
  });
  const dayLabel = (iso) => { const d = new Date(iso); return ["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()]; };

  if (entries.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:12 }}>
        <div style={{ fontSize:32 }}>📊</div>
        <div style={{ color:"var(--text2)", fontSize:14 }}>{t("stats_empty")}</div>
      </div>
    );
  }

  const maxTokens  = Math.max(...entries.map(([,s]) => s.tokens || 0), 1);
  const maxCopies  = Math.max(...entries.map(([,s]) => s.copies || 0), 1);
  const totalTokens = entries.reduce((a,[,s]) => a + (s.tokens||0), 0);
  const totalCost   = entries.reduce((a,[id,s]) => a + getCost(id, s.tokens||0), 0);
  const totalReqs   = entries.reduce((a,[,s]) => a + (s.requests||0), 0);

  const byTokens  = [...entries].sort((a,b) => (b[1].tokens||0)  - (a[1].tokens||0));
  const byQuality = [...entries].sort((a,b) => (b[1].copies||0)  - (a[1].copies||0));
  const byLatency = [...entries].filter(([,s]) => (s.latency||[]).length > 0)
                                .sort((a,b) => {
                                  const avg = (arr) => arr.reduce((s,v)=>s+v,0)/arr.length;
                                  return avg(a[1].latency) - avg(b[1].latency);
                                });

  const maxDayTokens = Math.max(...entries.flatMap(([,s]) =>
    last7.map(d => s.daily?.[d]?.tokens || 0)
  ), 1);

  const sectionStyle = { marginBottom: 28 };
  const sectionHead  = { fontFamily:"var(--mono)", fontSize:11, fontWeight:700, letterSpacing:"0.08em",
                          color:"var(--text2)", textTransform:"uppercase", marginBottom:14 };
  const rowStyle     = { display:"flex", alignItems:"center", gap:10, marginBottom:10 };
  const nameStyle    = { minWidth:130, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis",
                          whiteSpace:"nowrap", fontSize:12, color:"var(--text)", fontFamily:"var(--mono)" };
  const barTrack     = { flex:1, height:10, borderRadius:5, background:"rgba(255,255,255,0.06)", overflow:"hidden" };
  const numStyle     = { minWidth:54, textAlign:"right", fontSize:12, fontFamily:"var(--mono)", color:"var(--text2)" };

  const modelName = (id) => models.find(m=>m.id===id)?.name || id.split("/")[1] || id;

  return (
    <div style={{ maxWidth:780 }}>
      <h1 className="page-title">{t("stats_tab_title")}</h1>
      <p className="page-sub">{t("stats_tab_sub")}</p>

      {/* ── Summary chips ── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:28 }}>
        {[
          { label: t("stats_total_tokens"), value: fmtTokens(totalTokens), color:"var(--accent)" },
          { label: t("stats_total_requests"), value: totalReqs.toLocaleString(), color:"var(--green)" },
          { label: t("stats_section_cost"),
            value: totalCost < 0.001 ? (totalCost === 0 ? t("stats_free") : "<$0.001") : `$${totalCost.toFixed(4)}`,
            color:"var(--yellow)" },
        ].map(c => (
          <div key={c.label} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8,
                                      padding:"10px 16px", display:"flex", flexDirection:"column", gap:2 }}>
            <div style={{ fontSize:10, color:"var(--text2)", fontFamily:"var(--mono)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{c.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:c.color, fontFamily:"var(--mono)" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tokens by model ── */}
      <div style={sectionStyle}>
        <div style={sectionHead}>📊 {t("stats_section_tokens")}</div>
        {byTokens.map(([id, s]) => (
          <div key={id} style={rowStyle}>
            <div style={nameStyle} title={id}>{modelName(id)}</div>
            <div style={barTrack}>
              <div style={{ height:"100%", borderRadius:5, background:"var(--accent)",
                            width:`${Math.max(2,Math.round(((s.tokens||0)/maxTokens)*100))}%`,
                            transition:"width 0.4s ease" }} />
            </div>
            <div style={numStyle}>{fmtTokens(s.tokens||0)}</div>
          </div>
        ))}
      </div>

      {/* ── Estimated cost ── */}
      <div style={sectionStyle}>
        <div style={sectionHead}>💰 {t("stats_section_cost")}</div>
        {byTokens.map(([id, s]) => {
          const cost = getCost(id, s.tokens||0);
          const free = isFree(id);
          const local = isLocal(id);
          return (
            <div key={id} style={rowStyle}>
              <div style={nameStyle} title={id}>{modelName(id)}</div>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:6 }}>
                {free
                  ? <span style={{ fontSize:11, padding:"2px 7px", borderRadius:4,
                                   background:"rgba(0,200,100,0.12)", color:"var(--green)",
                                   fontFamily:"var(--mono)", fontWeight:700 }}>
                      {local ? t("stats_local") : t("stats_free")}
                    </span>
                  : <>
                      <div style={barTrack}>
                        <div style={{ height:"100%", borderRadius:5, background:"var(--yellow)",
                                      width:`${Math.max(2,Math.round((cost/Math.max(totalCost,0.0001))*100))}%`,
                                      transition:"width 0.4s ease" }} />
                      </div>
                      <div style={{ minWidth:70, textAlign:"right", fontSize:12, fontFamily:"var(--mono)", color:"var(--yellow)" }}>
                        {fmtCost(cost)}
                      </div>
                    </>
                }
              </div>
            </div>
          );
        })}
        <div style={{ fontSize:10, color:"var(--text2)", marginTop:6, fontFamily:"var(--mono)" }}>{t("stats_cost_note")}</div>
      </div>

      {/* ── Quality ranking ── */}
      <div style={sectionStyle}>
        <div style={sectionHead}>⭐ {t("stats_section_quality")}</div>
        <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>{t("stats_quality_note")}</div>
        {byQuality.map(([id, s], i) => {
          const copies = s.copies || 0;
          return (
            <div key={id} style={rowStyle}>
              <div style={{ minWidth:22, fontSize:12, color:"var(--text2)", fontFamily:"var(--mono)" }}>
                {i === 0 && copies > 0 ? "🥇" : i === 1 && copies > 0 ? "🥈" : i === 2 && copies > 0 ? "🥉" : `${i+1}.`}
              </div>
              <div style={{...nameStyle, minWidth:110, maxWidth:110}} title={id}>{modelName(id)}</div>
              <div style={barTrack}>
                <div style={{ height:"100%", borderRadius:5,
                              background: i === 0 && copies > 0 ? "var(--yellow)" : "rgba(255,255,255,0.15)",
                              width:`${copies > 0 ? Math.max(4,Math.round((copies/maxCopies)*100)) : 1}%`,
                              transition:"width 0.4s ease" }} />
              </div>
              <div style={numStyle}>{copies} {t("stats_copies")}</div>
            </div>
          );
        })}
      </div>

      {/* ── Avg latency ── */}
      {byLatency.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHead}>⚡ {t("stats_section_latency")}</div>
          {byLatency.map(([id, s]) => {
            const avg = s.latency.reduce((a,v)=>a+v,0)/s.latency.length;
            const minLat = byLatency[0] ? byLatency[0][1].latency.reduce((a,v)=>a+v,0)/byLatency[0][1].latency.length : 1;
            const maxLat = Math.max(...byLatency.map(([,x]) => x.latency.reduce((a,v)=>a+v,0)/x.latency.length), 1);
            const pct = Math.max(4, Math.round((avg / maxLat) * 100));
            const color = avg <= minLat * 1.5 ? "var(--green)" : avg <= minLat * 3 ? "var(--yellow)" : "var(--red)";
            return (
              <div key={id} style={rowStyle}>
                <div style={nameStyle} title={id}>{modelName(id)}</div>
                <div style={barTrack}>
                  <div style={{ height:"100%", borderRadius:5, background:color, width:`${pct}%`, transition:"width 0.4s ease" }} />
                </div>
                <div style={{ minWidth:70, textAlign:"right", fontSize:12, fontFamily:"var(--mono)", color }}>
                  {avg.toFixed(2)}{t("stats_latency_unit")} {t("stats_latency_avg")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Daily sparklines ── */}
      <div style={sectionStyle}>
        <div style={sectionHead}>📅 {t("stats_section_daily")}</div>
        {byTokens.map(([id, s]) => {
          const hasDailyData = last7.some(d => (s.daily?.[d]?.tokens || 0) > 0);
          return (
            <div key={id} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"var(--text)", fontFamily:"var(--mono)", marginBottom:5 }}>{modelName(id)}</div>
              {!hasDailyData
                ? <div style={{ fontSize:11, color:"var(--text2)", fontFamily:"var(--mono)", paddingLeft:2 }}>{t("stats_no_history")}</div>
                : <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:36 }}>
                    {last7.map(d => {
                      const tok = s.daily?.[d]?.tokens || 0;
                      const h = maxDayTokens > 0 ? Math.max(3, Math.round((tok / maxDayTokens) * 32)) : 3;
                      return (
                        <div key={d} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                          <div title={`${d}: ${tok.toLocaleString()} tokens`}
                               style={{ width:22, height:`${h}px`, borderRadius:"3px 3px 0 0",
                                        background: tok > 0 ? "var(--accent)" : "rgba(255,255,255,0.07)",
                                        transition:"height 0.3s ease", cursor:"default" }} />
                          <div style={{ fontSize:9, color:"var(--text2)", fontFamily:"var(--mono)" }}>{dayLabel(d)}</div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          );
        })}
      </div>

      {/* ── Reset button ── */}
      <div style={{ marginTop:8, paddingTop:20, borderTop:"1px solid var(--border)" }}>
        {!confirmReset
          ? <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>🗑 {t("stats_reset")}</button>
          : <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, color:"var(--text2)" }}>{t("stats_reset_confirm")}</span>
              <button className="btn btn-sm" style={{ background:"var(--red)", color:"#fff", border:"none" }}
                      onClick={async () => { await onReset(); setConfirmReset(false); setResetDone(true); setTimeout(()=>setResetDone(false),2500); }}>
                ✓ {t("stats_reset")}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>✕</button>
            </div>
        }
        {resetDone && <div style={{ fontSize:12, color:"var(--green)", marginTop:8, fontFamily:"var(--mono)" }}>✓ {t("stats_reset_done")}</div>}
      </div>
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
        {[1,2,3,4,5,6,7,8].map(n => (
          <div key={n} className="faq-item">
            <div className="faq-q">Q: {t(`help_faq_${n}_q`)}</div>
            <div className="faq-a">{t(`help_faq_${n}_a`)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
