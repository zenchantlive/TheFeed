# Security Policy

## Reporting a Vulnerability

We take the security of TheFeed seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email: **security@thefeed.org** (or DM the maintainers directly)

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution**: Depends on severity (critical: ASAP, high: 2 weeks, medium: 1 month)

## Security Considerations

### For Users

1. **API Keys**: Never commit your `.env` file. Use `.env.example` as a template.
2. **OAuth Credentials**: Protect your Google OAuth client secret.
3. **Database**: Use connection pooling and SSL (`sslmode=require`) for Supabase.

### For Contributors

1. **No Secrets in Code**: Never hardcode API keys, tokens, or passwords.
2. **Environment Variables**: All sensitive data must go through environment variables.
3. **Input Validation**: Always validate and sanitize user input.
4. **SQL Injection**: Use Drizzle ORM's parameterized queries (never raw SQL with user input).
5. **XSS Prevention**: Use React's built-in escaping; avoid `dangerouslySetInnerHTML`.

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Known Security Measures

- **Authentication**: Better Auth with secure session management
- **OAuth**: Server-side token exchange (no client-side secrets)
- **Database**: Row-Level Security (RLS) on Supabase
- **HTTPS**: Enforced on Vercel production deployment
- **CORS**: Configured for trusted origins only

## Bug Bounty

We don't currently have a formal bug bounty program. However, we deeply appreciate security researchers and will:
- Credit you in our security acknowledgments (with permission)
- Consider swag or donations for significant findings
