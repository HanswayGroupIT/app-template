# API Guidelines

REST and HTTP conventions for Go APIs using a shared response envelope and app-error codes. Adapt path prefixes to the project; keep behavior consistent within a project.

## REST conventions

| Pattern | Shape |
|---------|-------|
| Collection | `GET/POST /api/{resources}` |
| Update (body id) | `PUT /api/{resources}` with `id` in JSON — when the project already does this |
| Get by id | `GET /api/{resources}/:id` |
| Soft inactive | `PATCH /api/{resources}/:id/inactive` (or project equivalent) |
| Dropdown options | `GET /api/{resources}/options` |
| Nested under parent | `GET /api/{parents}/:id/{children}` |
| Sibling resource | `PUT /api/{parents}/{children}/:id` |

Prefer plural kebab-case path segments. Match neighboring routes when adding endpoints.

Common methods: **GET** list/detail, **POST** create, **PUT** update, **PATCH** status/inactive, **DELETE** only where the project already uses hard delete.

## Request format

- JSON → bind into a request struct.
- Multipart (uploads) → bind with form tags when needed.
- Path / query IDs via shared helpers.
- Actor id from auth helper / context for `created_by` / `updated_by`.

Simple CRUD shapes live in `model`. Multi-entity flows use `dto`.

On bind failure, return an invalid-JSON / invalid-param app error through the handler error path (do not write a custom error body in the handler).

## Response format

Single envelope:

```json
{
  "success": true,
  "code": 0,
  "message": "…",
  "data": {},
  "meta": {},
  "summary": {}
}
```

| Helper (typical) | Use |
|------------------|-----|
| Success | Single payload (HTTP 200, app `code: 0`) |
| SuccessWithMeta | Paginated lists |
| SuccessWithSummary | Lists with aggregates |
| Error | Error middleware only |

Create responses often return `{ "id": … }` or include a short message.

## HTTP status codes

| Situation | HTTP |
|-----------|------|
| Success | **200** (including many creates, unless the project standardizes on 201) |
| Validation / invalid JSON / business rule | **400** |
| Missing / invalid / expired token | **401** |
| Forbidden | **403** |
| Not found | **404** |
| Duplicate key / conflict | **409** |
| Unhandled / internal | **500** |

Body `code` is the **application** error number, not necessarily equal to the HTTP status.

## Pagination

- Query: `page`, `limit` (apply defaults, e.g. page **1**, limit **10**).
- Meta: current page, total rows, total pages.
- Handler: parse → service `List` → success-with-meta response.

## Filtering

- Common query params: `search`, `is_inactive`, plus domain filters.
- Default lists return **active** rows unless the filter says otherwise.
- Repositories build `WHERE` from fixed fragments + bound placeholders — never interpolate user input into SQL.

## Validation

1. Binding tags on request structs (`required`, etc.).
2. Framework bind for structural validation.
3. Service-level checks for business rules (required ids, status transitions, empty slices).
4. Return shared invalid-param / missing-field / business-rule codes.

Do not add a separate validation framework unless requested or already used in the project.
