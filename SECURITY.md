# Security Policy

We value the safety of people using TheFeed. If you discover a vulnerability or think data may be at risk, please let the maintainers know.

## How to report

- Preferred: open a GitHub issue with a clear description and repro steps (mark it as "Security").
- If the issue involves sensitive data or an exploit, email **zenchantlive@gmail.com** instead of posting details publicly.

## What to expect

- We will acknowledge new reports within 5 business days.
- We will coordinate on remediation and share updates in the issue or via email.
- Please avoid posting proofs of concept that expose real user data; use redacted examples.

## Scope

- Application code in this repository, including API routes, authentication, and data persistence.
- Infrastructure secrets should never be committed. If you find a credential leak, rotate it immediately and notify the maintainers.

Thank you for helping keep the community safe.
