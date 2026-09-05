from __future__ import annotations

import logging
import os
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

_PROM_ENABLED = os.getenv("AIRVO_PROMETHEUS_ENABLED", "1").strip().lower() not in {"0", "false", "no"}
_OTEL_ENABLED = os.getenv("AIRVO_OTEL_ENABLED", "0").strip().lower() in {"1", "true", "yes"}

_http_requests_total = None
_http_request_latency_ms = None
_ops_slo_ok = None
_metrics_generate = None
_metrics_content_type = "text/plain; version=0.0.4"


def _init_prometheus() -> None:
    global _http_requests_total
    global _http_request_latency_ms
    global _ops_slo_ok
    global _metrics_generate
    global _metrics_content_type

    if not _PROM_ENABLED:
        return

    try:
        from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

        _http_requests_total = Counter(
            "airvo_http_requests_total",
            "Total number of HTTP requests processed by Airvo",
            ["method", "path", "status_code"],
        )
        _http_request_latency_ms = Histogram(
            "airvo_http_request_latency_ms",
            "HTTP request latency in milliseconds",
            ["method", "path"],
            buckets=(10, 25, 50, 100, 250, 500, 750, 1000, 1500, 2500, 5000, 10000),
        )
        _ops_slo_ok = Gauge(
            "airvo_ops_slo_ok",
            "Operational SLO status from latest evaluation (1=ok, 0=warn)",
        )
        _metrics_generate = generate_latest
        _metrics_content_type = CONTENT_TYPE_LATEST
    except Exception as exc:
        logger.warning("[Observability] Prometheus disabled: %s", exc)


def _init_otel(app) -> None:
    if not _OTEL_ENABLED:
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        service_name = os.getenv("AIRVO_OTEL_SERVICE_NAME", "airvo-server").strip() or "airvo-server"
        endpoint = os.getenv("AIRVO_OTLP_ENDPOINT", "http://localhost:4317").strip() or "http://localhost:4317"

        resource = Resource.create({"service.name": service_name})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        FastAPIInstrumentor.instrument_app(app)
        logger.info("[Observability] OTLP tracing enabled endpoint=%s service=%s", endpoint, service_name)
    except Exception as exc:
        logger.warning("[Observability] OTLP disabled: %s", exc)


def init_external_observability(app) -> None:
    _init_prometheus()
    _init_otel(app)


def record_http_metrics(*, method: str, path: str, status_code: int, elapsed_ms: float) -> None:
    if _http_requests_total is not None:
        _http_requests_total.labels(method=method.upper(), path=path, status_code=str(int(status_code))).inc()
    if _http_request_latency_ms is not None:
        _http_request_latency_ms.labels(method=method.upper(), path=path).observe(float(elapsed_ms))


def set_ops_slo_state(ok: bool) -> None:
    if _ops_slo_ok is not None:
        _ops_slo_ok.set(1 if ok else 0)


def get_prometheus_metrics_payload() -> Optional[Tuple[bytes, str]]:
    if not _PROM_ENABLED:
        return None
    if _metrics_generate is None:
        return None
    try:
        payload = _metrics_generate()
        return payload, _metrics_content_type
    except Exception as exc:
        logger.warning("[Observability] Failed to export /metrics payload: %s", exc)
        return None
