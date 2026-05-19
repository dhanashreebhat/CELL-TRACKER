# Decision Log

## Decision 1: Use a separate events table

Options considered:

1. Store only the current state in the cell table.
2. Store the current state plus a separate immutable event table.

Chosen option: option 2.

Reason: the project requires a complete history of changes. A separate event table allows the system to preserve previous changes instead of overwriting them.

## Decision 2: Keep current state on the cells table

Options considered:

1. Derive current state from the latest event each time.
2. Store the current state directly on the cell record.

Chosen option: option 2.

Reason: dashboard counts and list filtering are simpler and faster when the current state is directly available. The event table still preserves the complete history.

## Decision 3: Process CSV imports row by row

Options considered:

1. Reject the whole file if one row fails.
2. Process valid rows and return errors for invalid rows.

Chosen option: option 2.

Reason: row-level feedback is more useful to users and matches the assignment requirement for granular validation errors.

## Decision 4: Exclude authentication from the MVP

Options considered:

1. Build login and user management.
2. Use a simple created_by field for traceability.

Chosen option: option 2.

Reason: the two-day MVP should focus on the core assessment areas: schema design, REST API, CSV import, dashboard, filtering, and audit timeline.
