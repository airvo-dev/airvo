# Airvo Developer Guide (Versioned)

Version: 0.9.7
Audience: contributors and maintainers

## Prerequisites

- Python 3.11+
- Node.js 20+
- Git

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e .
cd dashboard
npm install
cd ..
```

## Run and Validate

Run backend:

```powershell
python _start_server.py
```

Run tests:

```powershell
pytest -q
```

Build dashboard:

```powershell
cd dashboard
npm run build
cd ..
```

## Add a Backend Change

1. Add behavior in airvo/api/endpoints/.
2. Put shared helpers in airvo/api/common/ or airvo/api/services/.
3. Keep airvo/api/routes.py composition-only.
4. Use JsonFileStore for persisted JSON data.
5. Preserve HTTP and SSE error contracts.

## Add a Frontend Change

1. Add page behavior in dashboard/src/pages/.
2. Add reusable UI in dashboard/src/components/.
3. Add i18n entries for en and es at minimum.
4. Rebuild dashboard and verify no regressions.

## Before Opening a PR

- Rebase branch on latest main.
- Run pytest -q.
- Run dashboard build if frontend changed.
- Add changelog entry in CHANGELOG.md under Unreleased for user-visible changes.
- Complete PR template including risk and rollback fields.

## Governance References

- Contribution process: CONTRIBUTING.md
- Support SLA and triage: SUPPORT.md
- Security reporting: SECURITY.md
- Release history: CHANGELOG.md
- Release validation workflow: .github/workflows/release-governance.yml
