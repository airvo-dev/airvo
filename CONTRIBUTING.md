# Contributing to Airvo

Thanks for contributing to Airvo.

This guide defines the minimum architecture and quality checks required before merging.

## Pull Request Checklist

Use the PR template and confirm all items:

- [ ] Backend changes preserve domain boundaries (endpoints/services/storage).
- [ ] No business logic is added to composition-only files.
- [ ] Local persistence uses the shared JSON store abstraction.
- [ ] HTTP errors follow the standard envelope with request_id.
- [ ] SSE error events include request_id and keep error compatibility fields.
- [ ] Structured business logs are emitted for critical flows.
- [ ] Sensitive values are not logged.
- [ ] Tests cover changed behavior and contract shape.
- [ ] `pytest -q` passes locally.
- [ ] Security workflow expectations are met (dependency review, static scan, secret scan).
- [ ] Release-impacting changes keep semantic version discipline (`vX.Y.Z` tag matches `pyproject.toml`).

## Architecture Definition of Done (Current Baseline)

A change is architecture-safe when all of the following are true:

1. Modularity
- Routing is composed from domain routers.
- Cross-cutting logic lives in services/common modules.

2. Persistence
- JSON state reads/writes go through the shared store layer.
- Writes are atomic and tolerant to malformed files.

3. Error Contracts
- HTTP errors keep a stable envelope including `detail`, `error`, and `request_id`.
- SSE errors include `type: error`, `error`, `error_meta`, and `request_id`.

4. Observability
- Request correlation is preserved with `X-Request-ID` and request_id fields.
- Critical business outcomes emit structured log events.

5. Validation
- Contract tests are updated when error/log/event shapes change.
- Full test suite remains green.

6. Security and Supply Chain
- New dependencies are justified and reviewed for risk.
- No secrets are committed to the repository.
- Release artifacts remain reproducible and SBOM-compatible.

## Where to put architecture changes

- Endpoint-level behavior: `airvo/api/endpoints/`
- Cross-cutting helpers (errors/observability): `airvo/api/common/`
- Shared persistence abstraction: `airvo/storage/`
- Contract tests: `tests/test_architecture_baseline.py`

## CLA

By contributing, you agree to the CLA in `CLA.md`.
