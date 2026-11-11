# AI Instructions

Instructions for AI agents working in a Go API that follows these `.agents` docs. Follow them unless the user explicitly overrides.

## Do

1. Read neighboring handlers/services/repos and **match existing patterns**.
2. Keep the layering: **Handler → Service → Repository**.
3. Always pass `context.Context` through service and repository methods.
4. Use the shared app-error package + handler error path; use the shared success response helpers.
5. Use the **repository pattern** for SQL (bound parameters). No raw SQL in handlers.
6. Soft-delete with `is_inactive` unless the existing endpoint hard-deletes.
7. Add migrations as new timestamped `.up.sql` / `.down.sql` pairs — never rewrite applied migrations.
8. Wire new dependencies in bootstrap (`cmd`) and the router.
9. Run `gofmt` / keep imports clean.
10. Prefer extending existing `{resource}_*.go` files over creating packages.
11. Domain subpackages under `service/` are for multi-table orchestration of one aggregate — extend them; don’t invent a parallel structure.
12. Shared numbering/audit/storage stay as collaborators, not new layers.

## Don’t

1. **Don’t create new files** unless necessary.
2. Don’t invent new top-level packages or frameworks (no new DI container, logger stack, or ORM) unless asked.
3. Don’t introduce repo/service interfaces by default.
4. **Don’t change public API** (routes, request/response JSON shapes, status codes) unless the user asked.
5. Don’t edit unrelated files or drive-by refactor.
6. Don’t commit secrets or production `.env` values.
7. Don’t put multi-aggregate transactions or business numbering in handlers.
8. Don’t concatenate user input into SQL.
9. Don’t add markdown/docs the user didn’t ask for (except when the task *is* documentation).
10. Don’t hardcode another product’s resource names into these docs or into new code — follow the **current** project.

## Feature checklist

1. Model / DTO fields with `db` + `json` tags  
2. Repository methods (tx-aware writes when needed)  
3. Service validation + transaction  
4. Handler bind + helpers for ids/actor  
5. Route registration  
6. Migration if schema changes  
7. Soft-delete / list filter consistency  
8. Update `database-schema.md` when schema meaningfully changes  

## Errors & responses

- Bind errors → invalid JSON / invalid param codes  
- Not found → map DB no-rows to not-found  
- Success lists → success-with-meta when paginated  

## Reference docs in this folder

| File | Use when |
|------|----------|
| `coding-standards.md` | Naming, errors, context, format |
| `architecture.md` | Layers, DI, transactions, domain packages |
| `api-guidelines.md` | Routes, envelopes, pagination |
| `database-conventions.md` | Migrations, FKs, soft delete, SQL |
| `database-schema.md` | Per-project table inventory (fill from migrations) |
| `security.md` | Auth, SQL safety, secrets |
| `testing.md` | What/how to test |
