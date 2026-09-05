## Summary

Describe what changed and why.

## Type of Change

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Tests

## Architecture and Contract Checklist (Required)

- [ ] Domain boundaries are preserved (endpoints/services/common).
- [ ] No business logic was added to composition-only files.
- [ ] Local JSON persistence uses the shared store abstraction.
- [ ] HTTP error envelope remains stable (`detail`, `error`, `request_id`).
- [ ] SSE error events include (`type`, `error`, `error_meta`, `request_id`).
- [ ] Structured logs include business event + request correlation.
- [ ] No sensitive secrets are logged.
- [ ] Contract tests were added/updated if shape changed.
- [ ] `pytest -q` passes.

## Validation

- [ ] I ran tests locally.
- [ ] I validated impacted endpoints manually when needed.

## CLA

- [ ] I have read and signed the CLA process in `CLA.md`.
