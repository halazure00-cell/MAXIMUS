# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported version:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of MAXIMUS seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Use [GitHub Security Advisories](https://github.com/halazure00-cell/MAXIMUS/security/advisories/new) (preferred method)
   - Navigate to the "Security" tab
   - Click "Report a vulnerability"
   - Fill out the advisory form with details
3. Alternatively, contact the maintainers privately through GitHub Issues with the label "security" (mark as private if possible)

### What to Include

Please provide the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact and affected versions
- Any suggested fixes (if applicable)

### Response Timeline

- **Acknowledgment**: We aim to acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Resolution**: We will work on a fix and aim to release a patch within 30 days for critical vulnerabilities

### Security Updates

Security patches will be released as:
- Patch versions (e.g., 1.1.1) for minor vulnerabilities
- Minor versions (e.g., 1.2.0) for moderate vulnerabilities
- With coordinated disclosure once a fix is available

## Security Best Practices

When contributing to MAXIMUS:
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Follow the guidelines in [docs/GITHUB_SECURITY_SETUP.md](docs/GITHUB_SECURITY_SETUP.md)
- Keep dependencies up to date
- Run security scans locally before pushing

## Scope

This security policy covers:
- The MAXIMUS application code
- GitHub Actions workflows
- Documentation that affects security posture

Out of scope:
- Third-party dependencies (report to upstream maintainers)
- Issues in services we depend on (Supabase, etc.)
