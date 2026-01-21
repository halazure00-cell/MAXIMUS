# GitHub Security Setup Guide

This document outlines the required GitHub repository settings to enable security automation for MAXIMUS.

## Required GitHub UI Settings

The following security features must be enabled in the GitHub repository settings. These cannot be configured via code and must be set manually.

### 1. Dependabot Alerts & Security Updates

**Location**: Repository Settings → Security & analysis → Dependabot

- ✅ **Dependabot alerts**: Enable to receive notifications about vulnerable dependencies
- ✅ **Dependabot security updates**: Enable to automatically create PRs for security vulnerabilities
- ✅ The `dependabot.yml` configuration file handles grouped updates and scheduling

**Steps**:
1. Go to repository Settings
2. Click "Security & analysis" in the left sidebar
3. Enable "Dependabot alerts" (if not already enabled)
4. Enable "Dependabot security updates"

### 2. Code Scanning Alerts

**Location**: Repository Settings → Security & analysis → Code scanning

- ✅ **Code scanning**: Automatically enabled when CodeQL workflow runs
- The `.github/workflows/codeql.yml` workflow handles scanning

**Steps**:
1. The CodeQL workflow will automatically register code scanning alerts
2. View alerts under the "Security" tab → "Code scanning"
3. No manual setup required beyond the workflow file

### 3. Secret Scanning & Push Protection

**Location**: Repository Settings → Security & analysis → Secret scanning

- ✅ **Secret scanning**: Enable to detect committed secrets
- ✅ **Push protection**: Enable to prevent secrets from being pushed (recommended)

**Steps**:
1. Go to repository Settings
2. Click "Security & analysis"
3. Enable "Secret scanning"
4. Enable "Push protection for secret scanning"

> ⚠️ **Note**: Secret scanning and push protection may require GitHub Advanced Security for private repositories. These features are free for public repositories.

## Environment Variable Security Rules

### ✅ Safe for Client-Side (Can Be Committed to `.env.example`)

These variables are designed to be public and are safe to expose in client-side code:

- `VITE_SUPABASE_URL` - Public Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon/public key (row-level security protected)

### ❌ NEVER Commit These (Server-Side Only)

These must **never** be committed to the repository or exposed to clients:

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access, bypasses RLS
- Private API keys
- Authentication tokens
- Database passwords
- OAuth secrets
- Any credentials with write/admin access

## Verifying `.env` is Ignored

The repository already has `.env` files properly ignored. Verify with:

```bash
cat .gitignore | grep -E "^\.env"
```

Expected output:
```
.env
.env.*
```

This ensures:
- `.env` is ignored (local development secrets)
- `.env.*` pattern is ignored (e.g., `.env.local`, `.env.production`)
- `.env.example` is NOT ignored (safe template with no real secrets)

## Incident Response: What to Do If a Secret Is Committed

If you accidentally commit a secret to the repository:

### Immediate Actions

1. **Rotate/Invalidate the Secret Immediately**
   - For Supabase: Generate a new service role key in Supabase dashboard
   - For API keys: Regenerate in the respective service dashboard
   - For tokens: Revoke and create new ones

2. **Remove from Git History** (if needed)
   ```bash
   # WARNING: This rewrites history. Coordinate with team first.
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (requires force-push permissions)
   git push origin --force --all
   ```
   
   Or use tools like `git-filter-repo` or `BFG Repo-Cleaner` for larger cleanups.

3. **Update GitHub Secrets**
   - Go to repository Settings → Secrets and variables → Actions
   - Update any GitHub Actions secrets with the new credentials

4. **Notify the Team**
   - Inform all team members of the incident
   - Update deployment environments with new secrets

### Prevention

- Always use `.env.example` as a template (no real values)
- Review commits before pushing (`git diff --staged`)
- Enable push protection (see above)
- Use pre-commit hooks to scan for secrets (optional)

## Reviewing Security Alerts

### Dependabot Alerts

1. Navigate to the "Security" tab → "Dependabot"
2. Review each alert for:
   - Severity level (Critical, High, Medium, Low)
   - Affected package and version
   - Available patch version
3. Either:
   - Accept the automated security update PR
   - Manually update the dependency
   - Dismiss if not applicable (with justification)

### Code Scanning Alerts

1. Navigate to the "Security" tab → "Code scanning"
2. Review CodeQL findings:
   - Click on each alert for details
   - Review the code path and potential impact
   - Fix legitimate issues in the code
   - Dismiss false positives (with justification)

### Secret Scanning Alerts

1. Navigate to the "Security" tab → "Secret scanning"
2. For each detected secret:
   - Verify if it's a real secret (not a test value)
   - If real: Follow incident response steps above
   - If false positive: Dismiss with reason

## Weekly Security Checklist

- [ ] Review new Dependabot PRs (runs Mondays at 03:00 UTC)
- [ ] Check for CodeQL scan results (runs Mondays at 04:00 UTC)
- [ ] Review any new security alerts in the Security tab
- [ ] Ensure no pending security updates are overdue

## Additional Resources

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning)
- [GitHub Secret Scanning Documentation](https://docs.github.com/en/code-security/secret-scanning)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)

## Support

For questions or issues with security setup:
- Open a GitHub issue with the "security" label
- Review [SECURITY.md](../SECURITY.md) for vulnerability reporting
