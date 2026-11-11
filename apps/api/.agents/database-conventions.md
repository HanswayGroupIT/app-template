# Database Conventions

SQL conventions for projects using versioned migrations and a repository layer. Default engine notes assume MySQL/MariaDB/InnoDB; adapt types if the project uses another dialect.

## Table naming

- Plural `snake_case` for entities.
- Junction / map tables: descriptive plural names.
- Lookup / master data: clear domain names or a consistent `*_references` suffix if the project uses it.

## Columns

| Concern | Pattern |
|---------|---------|
| PK | `id` bigint (or project equivalent) auto-increment / identity |
| Public id | optional opaque `hash_id` (or UUID) when the project uses it |
| Soft delete | `is_inactive` tinyint/boolean default `0` |
| Audit | `created_by`, `updated_by`, `created_at`, `updated_at` |
| Money | fixed-precision decimals; optional `base_*` for reporting currency |
| Slugs | `slug` varchar, unique when required |
| Status | small integer with constants in `model` |

## Foreign keys

- Prefer real FK constraints when adding relations.
- Name indexes/FKs consistently with the table you alter (`fk_*`, `idx_*`, or existing project style).
- Nullable FKs when the domain allows unassigned rows.
- Denormalized parent ids on child rows are acceptable when already established — backfill in the same migration.

## Migrations

- Pair every change:

```
YYYYMMDDHHMMSS_description.up.sql
YYYYMMDDHHMMSS_description.down.sql
```

- Generate with the project CLI when available.
- **Never** edit an already-applied migration; add a new ALTER migration.
- Up: additive DDL / backfill. Down: reverse FK → index → column / drop carefully.
- Keep down migrations accurate enough to reverse the up change.

## Soft delete

- Prefer `UPDATE … SET is_inactive = 1` over hard `DELETE`.
- List queries default to `is_inactive = 0`.
- Cascading soft-delete belongs in the service/repo that owns the aggregate.
- Hard delete only where existing APIs already do so.

## Indexes

- Index FK columns used in joins/filters.
- Unique indexes on business keys (`slug`, document numbers, sequence types) when required.
- Name indexes clearly: `idx_<table>_<column>` or follow existing names on that table.

## Query guidelines

- Bound parameters only (`?`, named `:field`, `IN` helpers) — **never** concatenate user input into SQL.
- `fmt.Sprintf` only for fixed clause shapes (`WHERE %s`), with values still bound.
- Prefer named exec from structs for inserts/updates.
- Keep SQL in repositories; services orchestrate.
- For zero-valued optional FKs on nullable columns, coerce `0` to SQL `NULL` (e.g. `NULLIF(:col, 0)`) when `0` would violate FK.

## Document / business sequences

If used: counters in a sequences table; application code goes through a shared service collaborator — not handlers, and not ad-hoc max+1 in random repos.
