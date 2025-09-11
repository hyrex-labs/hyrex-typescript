# Security Policy

This security policy is modeled on the Next.js project’s approach and adapted for the Hyrex TypeScript SDK.

## Supported Versions

We generally address security issues on the latest stable release line of the Hyrex TypeScript SDK. When feasible, we may backport critical fixes to the previous minor release. If you are on an older version, please upgrade to receive security patches.

## Reporting a Vulnerability

Please report security vulnerabilities privately and responsibly. Do not open a public GitHub issue for security reports.

Preferred reporting channels:

- Use GitHub Security Advisories: open the repository’s “Security” tab and select “Report a vulnerability”.
- Or email the maintainers at: [REPLACE_WITH_SECURITY_CONTACT_EMAIL]

Include as much detail as possible to help us triage quickly:

- Affected versions and environment (Node.js version, OS)
- Impact and severity (e.g., CVSS score if available)
- Steps to reproduce and a minimal proof‑of‑concept
- Any relevant logs, stack traces, or configurations

We will make a best effort to acknowledge your report within 3 business days, keep you informed of our progress, and release a fix or mitigation as quickly as possible. We will credit you for the discovery in release notes unless you prefer to remain anonymous.

## Scope

In scope for this policy:

- Runtime agents and libraries in this repository (CLI, Worker/Executor, Admin, Cron Scheduler)
- Dispatcher implementations contained in this repo (e.g., Postgres/Platform adapters)

Out of scope (report via the appropriate channels instead):

- Hyrex Cloud Platform service vulnerabilities (outside this SDK)
- Third‑party dependencies not maintained by this project
- Documentation sites, examples, or personal forks not distributed as part of the SDK

## Public Disclosure

Please do not publicly disclose the vulnerability until we have released a fix and coordinated a disclosure timeline with you. Premature disclosure may increase risk for users who have not yet upgraded.

## Responsible Conduct

All interactions in the context of security reporting are covered by our community guidelines and Code of Conduct. See `CODE_OF_CONDUCT.md` for expected behavior.

