# Security Policy

## Supported Versions

Security updates are provided for the latest stable minor line only.

| Version | Supported |
|---|---|
| latest | yes |
| older | no |

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

1. Create a private security advisory in GitHub Security tab.
2. Include reproduction steps and affected endpoints/files.
3. If applicable, include logs with sensitive data removed.

We aim to acknowledge reports within 72 hours.

## Security Baseline

Airvo enforces the following baseline:

- Dependency review in pull requests.
- Static analysis (CodeQL + Bandit).
- Dependency vulnerability audit (pip-audit).
- Secret scanning (Gitleaks).
- Release version/tag governance checks.
- SBOM generation for release artifacts.

## Secrets Handling

- Never commit API keys or tokens.
- Use environment variables for runtime secrets.
- Keep local secrets in user scope (`~/.airvo/`) and outside git.
