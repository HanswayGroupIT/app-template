# Security

Security baseline for Go APIs. Follow the target project's existing auth middleware; do not invent a parallel system without being asked.

## JWT / bearer auth

- Validate `Authorization` (Bearer) in middleware before business routes.
- On failure: missing / expired / invalid token → HTTP **401** with shared auth error codes.
- Put authenticated actor id on request context (and/or framework context) for handlers/services.
- Protect `/api/*` (or the project's API prefix). Docs/swagger may stay public if already configured that way.

## Authorization

- Authentication ≠ authorization.
- If the project does not enforce route-level permissions yet, do not assume client-side permission checks are enough for sensitive operations.
- When adding privileged operations, follow nearby service-level checks; ask before introducing a new global permission middleware.

## SQL injection

- Always bind parameters in the data layer.
- Dynamic `WHERE` = constant fragments + bound args — never format user strings into predicates.
- Prefer named/struct-driven writes with bound fields.

## Password hashing

- Prefer external IdP / issued JWT when that is the project model.
- If local passwords are required: use a proven KDF (bcrypt/argon2), never store plaintext, never commit secrets.
- Do not add password tables casually into an API that previously only consumed tokens.

## Secret management

- Load secrets from environment / config loader (local `.env*` for development only).
- Typical: `JWT_SECRET`, `DB_*`, object-storage keys, integration base URLs/tokens.
- **Never** commit real secrets or production env files.
- Do not log Authorization headers or full tokens.

## Other

- Do not widen CORS without review.
- Use authenticated actor for `created_by` / `updated_by`.
- File uploads: validate size/type/path via existing storage helpers; avoid trusting client-supplied paths.
