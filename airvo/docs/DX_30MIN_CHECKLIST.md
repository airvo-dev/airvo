# 30-Minute Contributor DX Checklist

Purpose: measure onboarding friction using a repeatable protocol.

## Test Profile

Run this test as a first-time contributor on a clean machine profile.

Record:
- OS and shell
- Python version
- Node and npm versions
- Start time
- End time

## Success Criteria

Within 30 minutes, contributor can:

1. Install dependencies.
2. Run test suite.
3. Build dashboard.
4. Start local server.
5. Create branch and prepare PR with template checklist.

## Procedure

1. Clone repository and enter project folder.
2. Execute setup commands from CONTRIBUTING.md.
3. Execute validation commands from CONTRIBUTING.md.
4. Start server and hit health route.
5. Create feature branch.
6. Make a tiny docs edit and run checks again.
7. Prepare PR body using template.

## Timing Table

| Step | Start | End | Duration (min) | Result | Notes |
|---|---:|---:|---:|---|---|
| Setup Python env |  |  |  | Pass/Fail |  |
| Install frontend deps |  |  |  | Pass/Fail |  |
| Run pytest -q |  |  |  | Pass/Fail |  |
| Build dashboard |  |  |  | Pass/Fail |  |
| Start server |  |  |  | Pass/Fail |  |
| Create branch + commit |  |  |  | Pass/Fail |  |
| Prepare PR checklist |  |  |  | Pass/Fail |  |

## Friction Log

Capture every blocker with severity and fix proposal.

| Severity | Step | Problem | Proposed fix | Owner |
|---|---|---|---|---|
| P1/P2/P3 |  |  |  |  |

## Exit Rules

- Pass: all critical steps complete in 30 minutes or less.
- Conditional pass: complete in 45 minutes with only docs-related friction.
- Fail: cannot run tests/build/server or cannot open a standards-compliant PR.

## Improvement Loop

After each run:

1. Open issues for each friction item.
2. Prioritize by highest repeated severity.
3. Update CONTRIBUTING.md and this checklist.
4. Re-run the protocol with a new first-time contributor.
