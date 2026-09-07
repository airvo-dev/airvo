# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog.
The project follows Semantic Versioning.

## Unreleased

### Added

### Changed

### Fixed

### Security

### Docs

## 0.9.8 - 2026-09-07

### Changed
- Standardized documentation defaults to localhost:8765 across root and dashboard README guides.
- Quick Start now includes a health-check verification step for first-run success.

### Docs
- Updated release badges and onboarding copy to reflect the latest stable release.

## 0.9.7 - 2026-09-06

### Added
- OSS governance baseline files: support policy, CODEOWNERS, issue templates, and release-notes automation workflow.
- Versioned contributor onboarding and DX 30-minute checklist under airvo/docs.

### Changed
- CONTRIBUTING and PR template expanded with SLA, triage, novice path, risk/rollback, and changelog expectations.
- Public documentation links consolidated in README for contributor discoverability.

### Fixed
- Mermaid architecture diagram labels adjusted for GitHub renderer compatibility.

### Security
- Official security reporting channels clarified, including private advisory flow and project email.

### Docs
- Version markers synchronized across README and HELP guide for release consistency.

## 0.9.6 - 2026-09-05

### Added
- External observability baseline with Prometheus metrics endpoint and optional OTLP tracing.
- Critical flow E2E tests for admin token gate, SSE request_id contract, and ops alerts shape.
- Reproducible load tooling and SLO checks suitable for CI gating.
- Security and release governance workflows including SBOM artifact generation.

### Changed
- Contributor and architecture documentation were updated for the current modular API and operations model.

### Fixed
- Compare history persistence location moved to stable user-local path strategy.
