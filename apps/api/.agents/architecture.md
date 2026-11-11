# Architecture

Target stack for these docs: **HTTP framework + sqlx (or equivalent) + SQL database**. Layers use concrete types with **manual dependency injection** unless the project already differs.

## Folder structure (typical)

```
api/
├── cmd/                     # bootstrap, DI wiring, migrate CLI
├── api/ or routes/          # route table + handler registry
├── configs/                 # env, DB, storage, JWT, integrations
├── migrations/              # .up.sql / .down.sql pairs
├── docs/                    # OpenAPI / swag (optional)
├── internal/
│   ├── handler/             # HTTP adapters
│   ├── service/             # business logic
│   │   └── {domain}/        # optional: multi-table domain orchestration
│   ├── repository/          # SQL access
│   ├── model/               # entities, simple requests, list filters
│   ├── dto/                 # multi-entity / complex request DTOs
│   ├── middleware/          # auth, errors, request logging, CORS
│   ├── helper/              # path/query/actor helpers
│   ├── audit/               # row-level audit (optional)
│   ├── storage/             # object storage (optional)
│   └── integration/         # external HTTP clients (optional)
└── pkg/                     # apperr, response, jwtutil, migrationutil, …
```

Adapt names to the project; keep the **roles** the same.

## Layers

```
Handler → Service → Repository → Database
                ↘ integration / storage / shared services
```

| Layer | Responsibility |
|-------|----------------|
| **Handler** | Bind request, path/query helpers, call service, success envelope or attach error |
| **Service** | Validation beyond binding, transactions, orchestration, map domain errors |
| **Repository** | SQL only (query/exec with bound parameters) |

Handlers must not run SQL. Repositories must not call other services or write HTTP responses.

## Dependency flow

- Dependencies point **inward**: handler → service → repo.
- Bootstrap constructs repos → services → handlers, then mounts the router.
- External clients are injected only into services that need them.

## Dependency injection

Manual constructor injection:

```go
repo := repository.New{Resource}Repo(db)
svc := service.New{Resource}Service(repo)
h := handler.New{Resource}Handler(svc)
```

Do not add a DI framework unless the project already uses one. Wire new features in bootstrap and the router.

## Transaction pattern

- Start transactions in the **service** layer.
- Pass the transaction handle into repo write methods.
- Idiom:

```go
tx, err := s.repo.BeginTx(ctx)
if err != nil {
	return err
}
defer func() {
	if err != nil {
		_ = tx.Rollback()
	}
}()
// ... repo calls with tx ...
err = tx.Commit()
```

### Domain subpackages

For multi-table creates/updates of one aggregate, a `service/{domain}` subpackage may own the outer transaction while sibling services accept `tx`. Prefer extending that domain package over duplicating orchestration in unrelated flat services. Use a small interface at the boundary if importing the parent `service` package would create a cycle.

## Shared numbering / sequences

If the project uses document or business numbering, keep a single service collaborator (e.g. document sequence service) injected into services that need it — not a separate architectural tier and not called from handlers for business numbering.

## Cross-cutting

| Concern | Typical location |
|---------|------------------|
| Auth (JWT / session) | middleware on `/api/*` |
| Errors | error middleware + shared app-error package |
| Request logging | middleware → log store or stdout |
| Row audit | audit package called from repos where used |
| Soft delete | `is_inactive` (see database-conventions) |
