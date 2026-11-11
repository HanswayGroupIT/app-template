# Coding Standards

Reusable Go API standards. Prefer matching the target project's nearby code when conventions already exist; otherwise follow this document.

## Naming

| Kind | Convention | Pattern |
|------|------------|---------|
| Packages | lowercase, singular flat names | `handler`, `service`, `repository`, `model`, `dto` |
| Files | `snake_case` + role suffix | `{resource}_handler.go`, `{resource}_service.go`, `{resource}_repo.go` |
| Types | PascalCase + role | `{Resource}Handler`, `{Resource}Service`, `{Resource}Repo` |
| Constructors | `NewXxx` | `New{Resource}Service(...)` |
| Handler methods | verb + resource | `List`, `Create`, `Update`, `GetByID`, `Inactive`, `ListOptions` |
| JSON / DB tags | snake_case | `is_inactive`, `created_by`, `{parent}_id` |
| Routes | kebab-case, usually plural | `/api/{resources}` |

Keep struct field names PascalCase with both `db` and `json` tags when the type is persisted or returned.

## Error handling

- Use a shared app-error package (e.g. `pkg/apperr`), not bare `errors.New` or ad-hoc HTTP writes in handlers.
- Prefer constructors for: custom message, fixed code message, wrap with cause, map DB errors.
- Handlers: attach the error to the framework context and return — let error middleware write the JSON body.
- Services: map “no rows” to a not-found app error when appropriate.
- Do not swallow errors silently; return them up the stack.
- Prefer wrapping (`%w` / cause fields) so logs keep the root cause.

### ReturnIfError and CommitOrRollback

Use a **named** `err` return. `helper.ReturnIfError(err)` panics on error so the function stops; `CommitOrRollback` / `RecoverErr` convert that panic back into `err`.

```go
func (s *Service) Update(ctx context.Context, req dto.UpdateRequest, updatedBy string) (err error) {
	defer helper.RecoverErr(&err)

	existing, err := s.Repo.GetByID(ctx, req.ID)
	helper.ReturnIfError(err)

	tx, err := s.Repo.BeginTx(ctx)
	helper.ReturnIfError(err)
	defer helper.CommitOrRollback(tx, &err)

	existing.Field = req.Field
	existing.UpdatedBy = &updatedBy

	err = s.Repo.Update(ctx, tx, existing)
	helper.ReturnIfError(err)

	return nil
}
```

- `RecoverErr` must be the first defer so errors before `BeginTx` still return to the handler.
- `CommitOrRollback` rolls back on panic or `err != nil`, otherwise commits.
- Do not write `if err != nil { return err }` in methods that follow this pattern; use `helper.ReturnIfError(err)`.
- `return nil` is reached only on success and does not clear a recovered error.

## Context

- Every exported service/repo method that touches I/O takes `ctx context.Context` as the first argument.
- Handlers pass the request context into services.
- Actor identity comes from auth middleware (context value and/or helper) and is used for `created_by` / `updated_by`.

## Logging

- Prefer the project's existing logger / access-log middleware.
- Log wrapped causes for app errors in the error middleware.
- Do not introduce a new logging stack unless asked.

## Format

- Always run `gofmt` (and `goimports` when available) before finishing.
- Imports: stdlib → third-party → module-internal packages.
- No unused imports or variables.

## Function / interface size

- Prefer small handlers (bind → call service → respond).
- Business rules live in services; SQL lives in repositories.
- Hydrate nested JSON relation fields (`service_data`, `activity_data`, and other `*_data`) in the **service** after the list/get query. Repositories return row data only — do not `shared.Preload` those fields in the repo.
- Do **not** introduce interfaces for repos/services by default — prefer concrete types and manual DI unless the project already uses interfaces.
- Keep functions focused; extract helpers when a block is reused or obscures the main path.
- Avoid drive-by refactors of unrelated large functions.

## Nested relation data (`*_data`)

Repositories return table rows. Nested API fields such as `service_data` and `activity_data` are attached in the **service**.

Do **not** hydrate those fields in the repository (no `shared.Preload` onto the parent list in repo methods).

After the query, collect unique related IDs, batch-fetch with `GetByIDs`, then assign onto each parent row:

```go
list, err := s.Repository.List...(ctx, ...)
if err != nil {
	return nil, err
}
if err := s.attachServiceReferences(ctx, list); err != nil {
	return nil, err
}
if err := s.attachActivityReferences(ctx, list); err != nil {
	return nil, err
}
return list, nil
```

## Packages to respect

- Put new business logic under `internal/service` (or an existing domain file), not new top-level packages.
- Shared cross-cutting helpers (numbering, audit, storage clients) live as service collaborators or `pkg/` utilities — not as extra architectural tiers.
- Domain subpackages under `service/` are allowed for multi-table orchestration of one aggregate; extend them rather than inventing a parallel structure.
