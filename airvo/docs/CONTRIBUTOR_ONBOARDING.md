# Contributor Onboarding

This guide is versioned in the repository and intended for first-time contributors.

## 30-Minute Success Goal

A new contributor should be able to:

1. Clone and run tests.
2. Build dashboard assets.
3. Launch Airvo locally.
4. Create branch and open a valid PR.

If any step fails, open a docs issue with the failing step and environment details.

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

## Validate

```powershell
pytest -q
cd dashboard
npm run build
cd ..
```

## Run

```powershell
python _start_server.py
```

## Branch and PR

```bash
git checkout main
git fetch upstream
git rebase upstream/main
git checkout -b feat/<short-description>
```

Before PR:
- Re-run tests and build.
- Add changelog entry in CHANGELOG.md under Unreleased when user-visible.
- Complete PR template, including risk and rollback notes.

## Where to Change Code

- API endpoints: airvo/api/endpoints/
- Cross-cutting helpers: airvo/api/common/
- Service orchestration: airvo/api/services/
- Persistent JSON state: airvo/storage/
- Dashboard: dashboard/src/
- Tests: tests/

## Troubleshooting

- Import errors after setup: re-check virtual environment activation and run pip install -e . again.
- Dashboard build failures: run npm install in dashboard and retry npm run build.
- Contract failures: verify request_id and error envelope fields for HTTP and SSE paths.
