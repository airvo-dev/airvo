## Summary

Describe what changed and why.

## Scope

- [ ] Single focused change
- [ ] Multiple related changes (explain relationship in Summary)

## Type of Change

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Tests

## Risk and Rollback

- Risk level: Low / Medium / High
- Rollback plan (required for Medium/High risk):

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
- [ ] `dashboard` build passes if frontend changed.
- [ ] Changelog entry was added in `CHANGELOG.md` under `Unreleased` for user-visible changes.

## Validation

- [ ] I ran tests locally.
- [ ] I validated impacted endpoints manually when needed.

Validation commands and key outputs:

```text
Paste commands and short results here.
```

## Release Notes Input

For tag/release relevant PRs, provide 1-3 bullets suitable for release notes:

- 
- 
- 

## CLA

- [ ] I have read and signed the CLA process in `CLA.md`.
