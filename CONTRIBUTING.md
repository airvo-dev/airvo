# Contributing to Airvo

Thanks for contributing to Airvo.

This guide defines the minimum architecture and quality checks required before merging.

## Quick Start (External Contributors)

Use this section if you are contributing for the first time.

1. Fork and clone
- Fork the repository in GitHub.
- Clone your fork locally.
- Add upstream remote to keep your fork in sync.

```bash
git clone <your-fork-url>
cd airvo
git remote add upstream <upstream-url>
git fetch upstream
```

2. Create and activate Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e .
```

3. Install frontend dependencies

```powershell
cd dashboard
npm install
cd ..
```

4. Run baseline validation

```powershell
pytest -q
cd dashboard
npm run build
cd ..
```

5. Run the server locally

```powershell
python _start_server.py
```

## Branch Workflow

Create one branch per change and keep it focused.

1. Sync your local main

```bash
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main
```

2. Create your branch

```bash
git checkout -b feat/<short-description>
```

3. Commit with clear scope

```bash
git add -A
git commit -m "feat(area): short summary"
```

4. Push and open PR to `main`

```bash
git push -u origin feat/<short-description>
```

## Pull Request Flow

Before requesting review:

1. Rebase your branch on latest `upstream/main`.
2. Re-run `pytest -q`.
3. Re-run `npm run build` in `dashboard` if frontend changed.
4. Update docs when architecture, operations, or contributor steps changed.
5. Fill PR template with what changed, why, and how it was validated.

## Contributor SLA and Triage Policy

Maintainers target the following response times:

- New issue triage: within 3 business days.
- New pull request first review: within 5 business days.
- Follow-up maintainer response after contributor updates: within 3 business days.

Triage labels used by maintainers:

- `type:bug`, `type:feature`, `type:docs`, `type:refactor`, `type:security`
- `priority:P0`, `priority:P1`, `priority:P2`, `priority:P3`
- `status:needs-info`, `status:blocked`, `status:ready-for-review`
- `good first issue`, `help wanted`

If no maintainer response arrives inside SLA, mention a maintainer and include the PR or issue link in one comment.

## Version Support Policy

Airvo follows semantic versioning and supports:

- Latest minor of current major: full support (fixes and improvements).
- Previous minor of current major: critical bug fixes when feasible.
- Older minors/majors: best effort only, no guaranteed patches.

Security fixes may be backported at maintainer discretion depending on impact and complexity.

## Novice Contributor Path

If this is your first OSS contribution, use this path:

1. Pick an issue labeled `good first issue` or `type:docs`.
2. Comment "I want to work on this" before starting.
3. Keep scope small: one behavior change per PR.
4. Include before/after notes and exact validation commands.
5. Ask for review explicitly when checks pass.

## Non-Negotiables

- Do not commit secrets, keys, tokens, or private credentials.
- Do not mix unrelated refactors with a behavior fix.
- Add or update tests for behavior and contract changes.
- Update docs when user-visible behavior or contributor workflow changes.
- Keep commit messages scoped and meaningful (`feat(area): ...`, `fix(area): ...`).

Primary references for implementation details:

- airvo/docs/ARCHITECTURE.md
- airvo/docs/DEVELOPER_GUIDE.md
- airvo/docs/CONTRIBUTOR_ONBOARDING.md
- airvo/docs/DX_30MIN_CHECKLIST.md
- _local_docs/ARCHITECTURE.md
- _local_docs/DEVELOPER_GUIDE.md
- _local_docs/RUNBOOK.md

Governance references:

- SUPPORT.md
- SECURITY.md
- CHANGELOG.md

Note: `_local_docs/*` may be local/internal in some setups. Keep critical setup and contributor workflow steps documented in this file.

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
- [ ] `dashboard` build passes locally if frontend files changed.
- [ ] Security workflow expectations are met (dependency review, static scan, secret scan).
- [ ] Release-impacting changes keep semantic version discipline (`vX.Y.Z` tag matches `pyproject.toml`).
- [ ] Documentation is updated when architecture, operations, or contributor flow changes.
- [ ] Changelog entry is added under `Unreleased` in `CHANGELOG.md` for user-visible changes.

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

7. Contributor Experience
- New behavior is documented in guides that contributors actually use.
- Setup, run, and validation steps remain explicit and reproducible.

## Where to put architecture changes

- Endpoint-level behavior: `airvo/api/endpoints/`
- Cross-cutting helpers (errors/observability): `airvo/api/common/`
- Shared persistence abstraction: `airvo/storage/`
- Contract tests: `tests/test_architecture_baseline.py`

## CLA

By contributing, you agree to the CLA in `CLA.md`.
