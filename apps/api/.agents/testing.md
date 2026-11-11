# Testing

Testing guidance for Go APIs that use concrete repos/services and limited existing tests. Match the target project's `*_test.go` style when present.

## Principles

- Prefer tests that lock behavior you are changing.
- Do not invent a heavy mock framework if the project does not use one.
- Keep handlers thin so logic is testable in services or pure helpers.

## Unit tests

- Best fit: pure functions in `pkg/` and small helpers (parsers, formatters, diff/merge).
- File name: `*_test.go` beside the code (or external test package when testing only the public API).
- Use stdlib `testing`; table-driven tests are encouraged.
- Run: `go test ./...` from the module root / `api/` as appropriate.

## Integration tests

- Optional unless the project already has them.
- Gate DB tests behind build tags or an explicit DSN env.
- Prefer a disposable migrated database over mocking every SQL call for critical paths.
- Introduce testcontainers / shared harnesses only when asked.

## Mocking

- Default DI uses concrete pointers — no interfaces required for mocks.
- Do **not** mass-introduce interfaces solely for testing.
- If isolation is needed: extract a small interface at the boundary you own, or test pure helpers.

## Coverage target

- No assumed global coverage gate unless the project CI enforces one.
- For new pure logic: happy path + important error/edge cases.
- Prioritize money, status transitions, and numbering/idempotency when those areas change.
- Do not block delivery on vanity coverage percentages.

## What to test when changing code

| Change | Prefer |
|--------|--------|
| `pkg/` util / formatter | Unit test |
| Status / validation rules | Helper or service-focused tests |
| SQL / migrations | Manual or integration; verify up/down |
| Handlers | Optional; keep thin |

When unsure, copy the nearest existing test file's style.
