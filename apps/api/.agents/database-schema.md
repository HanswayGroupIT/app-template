# Database Schema

This file is a **per-project inventory**. Keep conventions in `database-conventions.md`; put concrete tables here (or regenerate from `migrations/`).

## How to maintain

1. Source of truth: `migrations/*.up.sql` (+ later ALTER migrations).
2. After meaningful schema changes, update this file (or regenerate a summary from migrations).
3. Group tables by domain; list PK/FKs, soft-delete, and notable ALTERs.
4. Do not duplicate long CREATE scripts — link migration filenames instead.

## Migration naming

```
YYYYMMDDHHMMSS_description.up.sql
YYYYMMDDHHMMSS_description.down.sql
```

## Template

```markdown
## {Domain name}

### `{table_name}`
- **Purpose:** …
- **Keys:** `id`, …
- **FKs:** → `{parent_table}`
- **Notes / alters:** `{migration_file}`
```

## Domains (fill per project)

### References / master data
#### `cost_allocation_references`
- **Purpose:** cost allocation master with optional employee access list
- **Keys:** `id`
- **Notes:** nested `cost_allocation_reference_employees`; soft-delete via `is_inactive`. Migrations: `20260804102000_cost_allocation_references`, `20260804102100_cost_allocation_reference_employees`

_Add tables…_

### Core transactional aggregates
#### `multi_port_project_vessels`
- **Purpose:** vessel row under a multi-port project area
- **Keys:** `id`
- **FKs:** → `multi_port_project_areas`, `vessels`
- **Notes / alters:** `current_location`, `tracking` via `20260925100652_multi_port_project_vessels_current_location_tracking`

#### `vessel_project_charge_crews` / `multi_port_project_charge_crews`
- **Purpose:** crew names attached to a project charge
- **Keys:** `id`
- **Notes / alters:** `crew_name` is `TEXT` via `20261110100000_vessel_project_charge_crews_crew_name_text` and `20261110100100_multi_port_project_charge_crews_crew_name_text`. `idx_crew_name` is a 191-character prefix index.

#### `vessel_project_costs` / `multi_port_project_costs`
- **Purpose:** vendor cost rows created when an activity is assigned to a vendor
- **Keys:** `id`
- **FKs:** → `vessels` (`vessel_id`, nullable). Main row uses the project vessel; a towing row uses `vessel_project_towing.vessel_id` or `multi_port_project_towings.vessel_id`
- **Notes / alters:** `20261102135000_project_costs_vessel_id`

#### `multi_port_project_towings`
- **Purpose:** towing vessel rows for a multi-port project vessel (mirrors `vessel_project_towing`)
- **Keys:** `id`
- **FKs:** → `multi_port_project_vessels`, `customers`, `vessels`, `agency_references` (`agency_id` nullable)
- **Notes:** parent key is `multi_port_project_vessel_id` (not `vessel_project_id`). Migration: `20260925100653_multi_port_project_towings`

_Add tables…_

### Billing / documents / sequences
_Add tables…_

### Project finance
#### `project_revenues`
- **Purpose:** revenue rows linked to a project charge (polymorphic via `project_source`)
- **Keys:** `id`
- **FKs:** → `customer_invoice_details` (`customer_invoice_detail_id`, nullable)
- **Notes:** `project_source` = `vessel_projects` | `general_projects`; `project_charge_id` maps to `vessel_project_charges.id` or `general_project_charges.id`. Migration: `20260803160000_project_revenues`

#### `project_expenses`
- **Purpose:** expense rows linked to a project service (polymorphic via `project_source`)
- **Keys:** `id`
- **Notes:** `project_charge_id` maps to `vessel_project_charges.id` or `general_project_charges.id`; `project_service_id` maps to `vessel_project_services.id` or `general_project_services.id`. Create-only. Migration: `20260803160100_project_expenses`

### Audit / logs
_Add tables…_

## Relationship sketch

```
{master}
   │
   ▼
{headers} ──► {details}
   │
   ▼
{downstream docs / integrations}
```

## Notable ALTER migrations

| Migration | Impact |
|-----------|--------|
| `20261102135000_project_costs_vessel_id` | `vessel_id` on `vessel_project_costs` and `multi_port_project_costs`, FK → `vessels` |
| `20261102210000_drop_vendor_bill_detail_charge_fk` | Drop misplaced `fk_vessel_project_charge` (`vendor_bill_details.vendor_bill_header_id` → `vessel_project_charges`). `vessel_project_charge_id` stays NULL |
| `20261102211500_vendor_bill_header_type` | `vendor_bill_headers.type`: `payable` lists `*_project_costs`; `purchase invoice` lists Vendor `*_project_services` |
| `20261105133000_special_arrangement_allocation_qty_price` | `qty` and `unit_price` on `special_arrangement_allocations`; project service rows use those values |
