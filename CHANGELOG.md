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
