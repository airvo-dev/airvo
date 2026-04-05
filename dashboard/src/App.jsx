import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:5000";

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
    continue_label:"Continue.dev Config", continue_hint:"Add this to your continue.dev config.yaml:",
    copy_config:"Copy config", copied:"Copied ✓",
    config_title:"Configuration", config_sub:"Mode, temperature, memory and preferences",
    mode_label:"Multi-Model Mode", active_models_label:"Active Models",
    no_active_models:"No active models. Activate at least one in Models.",
    mode_parallel:"Parallel", mode_parallel_desc:"All models respond, you see all answers",
    mode_race:"Race", mode_race_desc:"Fastest model wins",
    mode_vote:"Vote", mode_vote_desc:"Consensus between models",
    mode_review:"Review", mode_review_desc:"One generates, another critiques", mode_set:"Mode",
    temp_label:"Temperature",
    temp_hint_low:"0.0 — deterministic, precise. Best for code and refactoring.",
    temp_hint_mid:"0.5 — balanced. Good for most tasks.",
    temp_hint_high:"1.0 — creative, varied. Best for brainstorming and docs.",
    temp_saved:"Temperature saved",
    maxtokens_label:"Max Tokens",
    maxtokens_saved:"Max tokens saved",
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
    stats_label:"Usage Stats",
    stats_requests:"requests",
    stats_tokens:"tokens",
    stats_reset:"Reset stats",
    stats_reset_confirm:"Reset all usage stats?",
    stats_reset_done:"Stats reset",
    stats_empty:"No usage data yet. Start coding!",
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
  },
  es: {
    nav_models:"Modelos", nav_status:"Estado", nav_config:"Configuración",
    nav_add:"Agregar Modelo", nav_help:"Ayuda", nav_active:"ACTIVOS", nav_none:"ninguno",
    connecting:"conectando...", offline:"servidor offline",
    models_title:"Modelos", models_sub:"Activá modelos y configurá sus API keys",
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
    continue_label:"Config de Continue.dev", continue_hint:"Pegá esto en tu config.yaml:",
    copy_config:"Copiar config", copied:"Copiado ✓",
    config_title:"Configuración", config_sub:"Modo, temperatura, memoria y preferencias",
    mode_label:"Modo Multi-Modelo", active_models_label:"Modelos Activos",
    no_active_models:"No hay modelos activos. Activá al menos uno en Modelos.",
    mode_parallel:"Paralelo", mode_parallel_desc:"Todos responden, ves todas las respuestas",
    mode_race:"Carrera", mode_race_desc:"El más rápido gana",
    mode_vote:"Votación", mode_vote_desc:"Consenso entre modelos",
    mode_review:"Revisión", mode_review_desc:"Uno genera, otro critica", mode_set:"Modo",
    temp_label:"Temperatura",
    temp_hint_low:"0.0 — determinístico, preciso. Ideal para código.",
    temp_hint_mid:"0.5 — equilibrado. Funciona para la mayoría de tareas.",
    temp_hint_high:"1.0 — creativo, variado. Ideal para brainstorming.",
    temp_saved:"Temperatura guardada",
    maxtokens_label:"Máximo de Tokens",
    maxtokens_saved:"Máximo de tokens guardado",
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
    stats_label:"Estadísticas de Uso",
    stats_requests:"requests",
    stats_tokens:"tokens",
    stats_reset:"Resetear estadísticas",
    stats_reset_confirm:"¿Resetear todas las estadísticas?",
    stats_reset_done:"Estadísticas reseteadas",
    stats_empty:"Sin datos aún. ¡Empezá a programar!",
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
  },
  fr: {
    nav_models:"Modèles", nav_status:"Statut", nav_config:"Configuration", nav_add:"Ajouter Modèle", nav_help:"Aide", nav_active:"ACTIFS", nav_none:"aucun",
    connecting:"connexion...", offline:"serveur hors ligne",
    models_title:"Modèles", models_sub:"Activez les modèles et configurez leurs clés API",
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
    continue_label:"Config Continue.dev", continue_hint:"Ajoutez ceci à votre config.yaml :",
    copy_config:"Copier la config", copied:"Copié ✓",
    config_title:"Configuration", config_sub:"Mode, température, mémoire et préférences",
    mode_label:"Mode Multi-Modèle", active_models_label:"Modèles Actifs",
    no_active_models:"Aucun modèle actif. Activez-en au moins un dans Modèles.",
    mode_parallel:"Parallèle", mode_parallel_desc:"Tous les modèles répondent, vous voyez toutes les réponses",
    mode_race:"Course", mode_race_desc:"Le modèle le plus rapide gagne",
    mode_vote:"Vote", mode_vote_desc:"Consensus entre les modèles",
    mode_review:"Révision", mode_review_desc:"Un génère, un autre critique", mode_set:"Mode",
    temp_label:"Température",
    temp_hint_low:"0.0 — déterministe, précis. Idéal pour le code.",
    temp_hint_mid:"0.5 — équilibré. Convient à la plupart des tâches.",
    temp_hint_high:"1.0 — créatif, varié. Idéal pour le brainstorming.",
    temp_saved:"Température enregistrée",
    maxtokens_label:"Tokens Maximum",
    maxtokens_saved:"Tokens maximum enregistrés",
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
    stats_label:"Statistiques d'Utilisation",
    stats_requests:"requêtes", stats_tokens:"tokens",
    stats_reset:"Réinitialiser les stats",
    stats_reset_confirm:"Réinitialiser toutes les statistiques ?",
    stats_reset_done:"Statistiques réinitialisées",
    stats_empty:"Aucune donnée pour l'instant. Commencez à coder !",
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
  },
  de: {
    nav_models:"Modelle", nav_status:"Status", nav_config:"Konfiguration", nav_add:"Modell Hinzufügen", nav_help:"Hilfe", nav_active:"AKTIV", nav_none:"keine",
    connecting:"verbinde...", offline:"Server offline",
    models_title:"Modelle", models_sub:"Modelle aktivieren und API-Schlüssel konfigurieren",
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
    continue_label:"Continue.dev Konfiguration", continue_hint:"Fügen Sie dies zu Ihrer config.yaml hinzu:",
    copy_config:"Konfiguration kopieren", copied:"Kopiert ✓",
    config_title:"Konfiguration", config_sub:"Modus, Temperatur, Speicher und Einstellungen",
    mode_label:"Multi-Modell-Modus", active_models_label:"Aktive Modelle",
    no_active_models:"Keine aktiven Modelle. Aktivieren Sie mindestens eines unter Modelle.",
    mode_parallel:"Parallel", mode_parallel_desc:"Alle Modelle antworten, alle Antworten werden angezeigt",
    mode_race:"Rennen", mode_race_desc:"Das schnellste Modell gewinnt",
    mode_vote:"Abstimmung", mode_vote_desc:"Konsens zwischen den Modellen",
    mode_review:"Überprüfung", mode_review_desc:"Eines generiert, ein anderes kritisiert", mode_set:"Modus",
    temp_label:"Temperatur",
    temp_hint_low:"0.0 — deterministisch, präzise. Ideal für Code.",
    temp_hint_mid:"0.5 — ausgewogen. Gut für die meisten Aufgaben.",
    temp_hint_high:"1.0 — kreativ, abwechslungsreich. Ideal für Brainstorming.",
    temp_saved:"Temperatur gespeichert",
    maxtokens_label:"Maximale Token",
    maxtokens_saved:"Maximale Token gespeichert",
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
    stats_label:"Nutzungsstatistiken",
    stats_requests:"Anfragen", stats_tokens:"Token",
    stats_reset:"Statistiken zurücksetzen",
    stats_reset_confirm:"Alle Nutzungsstatistiken zurücksetzen?",
    stats_reset_done:"Statistiken zurückgesetzt",
    stats_empty:"Noch keine Daten. Fangen Sie an zu programmieren!",
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
  },
  zh: {
    nav_models:"模型", nav_status:"状态", nav_config:"配置", nav_add:"添加模型", nav_help:"帮助", nav_active:"已激活", nav_none:"无",
    connecting:"连接中...", offline:"服务器离线",
    models_title:"模型", models_sub:"激活模型并配置其 API 密钥",
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
    continue_label:"Continue.dev 配置", continue_hint:"将以下内容添加到您的 config.yaml：",
    copy_config:"复制配置", copied:"已复制 ✓",
    config_title:"配置", config_sub:"模式、温度、记忆和偏好设置",
    mode_label:"多模型模式", active_models_label:"活跃模型",
    no_active_models:"没有活跃模型。请在模型页面至少激活一个。",
    mode_parallel:"并行", mode_parallel_desc:"所有模型同时响应，查看所有答案",
    mode_race:"竞速", mode_race_desc:"最快的模型获胜",
    mode_vote:"投票", mode_vote_desc:"模型之间达成共识",
    mode_review:"审阅", mode_review_desc:"一个生成，另一个批评", mode_set:"模式",
    temp_label:"温度",
    temp_hint_low:"0.0 — 确定性，精确。适合代码。",
    temp_hint_mid:"0.5 — 平衡。适合大多数任务。",
    temp_hint_high:"1.0 — 创意，多样。适合头脑风暴。",
    temp_saved:"温度已保存",
    maxtokens_label:"最大 Token 数",
    maxtokens_saved:"最大 Token 数已保存",
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
    stats_label:"使用统计",
    stats_requests:"请求数", stats_tokens:"Token 数",
    stats_reset:"重置统计",
    stats_reset_confirm:"重置所有使用统计？",
    stats_reset_done:"统计已重置",
    stats_empty:"暂无数据。开始编程吧！",
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
  },
  ja: {
    nav_models:"モデル", nav_status:"ステータス", nav_config:"設定", nav_add:"モデルを追加", nav_help:"ヘルプ", nav_active:"アクティブ", nav_none:"なし",
    connecting:"接続中...", offline:"サーバーオフライン",
    models_title:"モデル", models_sub:"モデルを有効にしてAPIキーを設定する",
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
    continue_label:"Continue.dev設定", continue_hint:"これをconfig.yamlに追加してください：",
    copy_config:"設定をコピー", copied:"コピー済み ✓",
    config_title:"設定", config_sub:"モード、温度、メモリ、設定",
    mode_label:"マルチモデルモード", active_models_label:"アクティブモデル",
    no_active_models:"アクティブなモデルがありません。モデルページで少なくとも1つ有効にしてください。",
    mode_parallel:"並列", mode_parallel_desc:"すべてのモデルが回答、すべての答えを表示",
    mode_race:"レース", mode_race_desc:"最も速いモデルが勝つ",
    mode_vote:"投票", mode_vote_desc:"モデル間のコンセンサス",
    mode_review:"レビュー", mode_review_desc:"1つが生成し、もう1つが批評", mode_set:"モード",
    temp_label:"温度",
    temp_hint_low:"0.0 — 決定論的、正確。コードに最適。",
    temp_hint_mid:"0.5 — バランス良好。ほとんどのタスクに適用。",
    temp_hint_high:"1.0 — 創造的、多様。ブレインストーミングに最適。",
    temp_saved:"温度を保存しました",
    maxtokens_label:"最大トークン数",
    maxtokens_saved:"最大トークン数を保存しました",
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
    stats_label:"使用統計",
    stats_requests:"リクエスト", stats_tokens:"トークン",
    stats_reset:"統計をリセット",
    stats_reset_confirm:"すべての使用統計をリセットしますか？",
    stats_reset_done:"統計をリセットしました",
    stats_empty:"データがまだありません。コーディングを始めましょう！",
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
  },
  pt: {
    nav_models:"Modelos", nav_status:"Status", nav_config:"Configuração", nav_add:"Adicionar Modelo", nav_help:"Ajuda", nav_active:"ATIVOS", nav_none:"nenhum",
    connecting:"conectando...", offline:"servidor offline",
    models_title:"Modelos", models_sub:"Ative modelos e configure suas chaves de API",
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
    continue_label:"Configuração Continue.dev", continue_hint:"Adicione isto ao seu config.yaml:",
    copy_config:"Copiar configuração", copied:"Copiado ✓",
    config_title:"Configuração", config_sub:"Modo, temperatura, memória e preferências",
    mode_label:"Modo Multi-Modelo", active_models_label:"Modelos Ativos",
    no_active_models:"Nenhum modelo ativo. Ative pelo menos um em Modelos.",
    mode_parallel:"Paralelo", mode_parallel_desc:"Todos os modelos respondem, você vê todas as respostas",
    mode_race:"Corrida", mode_race_desc:"O modelo mais rápido vence",
    mode_vote:"Votação", mode_vote_desc:"Consenso entre os modelos",
    mode_review:"Revisão", mode_review_desc:"Um gera, outro critica", mode_set:"Modo",
    temp_label:"Temperatura",
    temp_hint_low:"0.0 — determinístico, preciso. Ideal para código.",
    temp_hint_mid:"0.5 — equilibrado. Bom para a maioria das tarefas.",
    temp_hint_high:"1.0 — criativo, variado. Ideal para brainstorming.",
    temp_saved:"Temperatura salva",
    maxtokens_label:"Máximo de Tokens",
    maxtokens_saved:"Máximo de tokens salvo",
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
    stats_label:"Estatísticas de Uso",
    stats_requests:"requisições", stats_tokens:"tokens",
    stats_reset:"Resetar estatísticas",
    stats_reset_confirm:"Resetar todas as estatísticas de uso?",
    stats_reset_done:"Estatísticas resetadas",
    stats_empty:"Sem dados ainda. Comece a programar!",
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

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchRagStatus(); }, [fetchRagStatus]);

  const MAX_ACTIVE = 3;

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
            <div className="header-status">
              <div className={`status-dot ${loading?"loading":health?"ok":"err"}`} />
              {loading ? t("connecting") : health ? `v${health.version} · localhost:5000` : t("offline")}
            </div>
          </div>
        </header>

        <aside className="sidebar">
          <div className="nav-section">
            {[
              { id:"models", icon:"◈", label:t("nav_models"), badge:models.length||null },
              { id:"status", icon:"◎", label:t("nav_status") },
              { id:"config", icon:"⊙", label:t("nav_config") },
              { id:"add",    icon:"+", label:t("nav_add")    },
              { id:"help",   icon:"?", label:t("nav_help")   },
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
            <div className="stats-row">
              {[
                { label:t("stat_total"),    val:models.length,                       sub:t("stat_models"),     cls:"accent" },
                { label:t("stat_active"),   val:active.length, max:MAX_ACTIVE,          sub:t("stat_parallel"),   cls:"green", showBar:true },
                { label:t("stat_free"),     val:models.filter(m=>inferIsFree(m.provider,m.base_url)).length, sub:t("stat_no_cost"), cls:"yellow" },
                { label:t("stat_with_key"), val:models.filter(m=>m.api_key).length,  sub:t("stat_configured"), cls:"pink" },
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
              : <div className="models-grid">
                  {models.map(m => (
                    <ModelCard key={m.id} model={m} t={t} stats={stats[m.id]}
                      onToggle={() => toggleModel(m.id, m.active)}
                      onSaveKey={key => saveKey(m.id, key)}
                      onDelete={() => deleteModel(m.id)}
                    />
                  ))}
                </div>
            }
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

          {/* ── CONFIG PAGE ── */}
          {page === "config" && prefs && <>
            <h1 className="page-title">{t("config_title")}</h1>
            <p className="page-sub">{t("config_sub")}</p>
            <div style={{ display:"grid", gap:20 }}>

              {/* Multi-Model Mode */}
              <div className="card">
                <div className="card-title">{t("mode_label")}</div>
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
