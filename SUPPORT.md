# Support Policy

This document defines support channels, maintenance SLA targets, triage policy, and version support for Airvo.

## Scope

- Community support is best effort.
- Security issues follow SECURITY.md and should not be reported publicly first.

## Official Channels

- Issues: https://github.com/airvo-dev/airvo/issues
- Discussions: https://github.com/airvo-dev/airvo/discussions
- Private vulnerability reporting: https://github.com/airvo-dev/airvo/security/advisories/new
- Official email: hello@airvo.dev

## Response SLA Targets

Maintainers target these response windows on business days:

- New issue triage: 3 business days
- New pull request first review: 5 business days
- Follow-up after contributor updates: 3 business days

Targets are goals, not strict guarantees.

## Triage Policy

Maintainers apply labels across type, priority, and status.

Type labels:
- type:bug
- type:feature
- type:docs
- type:refactor
- type:security

Priority labels:
- priority:P0 (production breakage or severe security risk)
- priority:P1 (high impact, no acceptable workaround)
- priority:P2 (normal backlog)
- priority:P3 (nice to have)

Status labels:
- status:needs-info
- status:blocked
- status:ready-for-review

Contributor guidance:
- Include reproducible steps and expected vs actual behavior.
- For PRs, include test evidence and rollback considerations.
- If no response within SLA target, post one polite follow-up on the same thread.

## Version Support

Airvo follows semantic versioning.

- Current major, latest minor: full support (fixes + improvements)
- Current major, previous minor: critical bug fixes when feasible
- Older versions: best effort only

Security backports are handled case by case based on severity and implementation risk.

## Escalation

Use this order:

1. Open issue or PR with complete context.
2. Add follow-up comment if SLA target is exceeded.
3. For security-only escalation, follow SECURITY.md private reporting guidance.
