# Cell Inventory & Traceability Tracker

A full-stack web application for tracking battery cells through their lifecycle while maintaining an immutable audit history of changes.

## Purpose

The system supports battery test lab operations where physical cells are received, quality checked, stored, tested, passed or failed, and eventually disposed. Each state transition is recorded as a timeline event so that the history of each cell can be reconstructed.

## Stack

- React + Vite
- Node.js + Express
- MySQL
- Framer Motion
- Recharts
- csv-parser + multer

## Lifecycle States

```
RECEIVED → INCOMING_QC → STORAGE → UNDER_TEST → PASSED / FAILED → DISPOSED
```

## Main Features

- Manually create individual battery cell records
- View all cells in a searchable and filterable cell list
- Filter cells by lifecycle state
- Dashboard showing counts by current lifecycle state
- Lifecycle distribution chart using Recharts
- Per-cell vertical audit timeline
- Append-only audit events for lifecycle traceability
- Update lifecycle states with audit history preservation
- CSV bulk import for creating and updating cells
- Row-level CSV validation errors
- Download/export the current cell list as CSV
- - View all battery cells in a searchable and state-filterable table with real-time cell counts

## Setup

### 1. Create the database

Open MySQL and run:

```sql
SOURCE database/schema.sql;
```

Alternatively, copy the contents of `database/schema.sql` into your MySQL client.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Edit `.env` with your MySQL username and password.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint                  | Purpose                                 |
| ------ | ------------------------- | --------------------------------------- |
| POST   | `/api/cells`              | Create a cell                           |
| GET    | `/api/cells`              | List cells                              |
| GET    | `/api/cells?state=PASSED` | Filter cells by state                   |
| POST   | `/api/cells/:id/state`    | Update lifecycle state and append audit |
| GET    | `/api/cells/:id/timeline` | Get cell audit history                  |
| GET    | `/api/dashboard/stats`    | Loads dashboard statistics              |
| POST   | `/api/import`             | Upload CSV for bulk create/update       |

### Current state and history are separated

The `cells` table stores the current lifecycle state for efficient dashboard and filtering queries. The `cell_events` table stores the chronological event history.

### Timeline events are append-only

Instead of overwriting previous changes, every state change creates a new event. This supports traceability because users can see who changed what, when, and why.

### CSV import gives row-level feedback

The import endpoint validates each row separately. Valid rows are processed even when other rows fail. This avoids generic failure messages and makes the import process more useful for users.

### schema diagram

## Schema Diagram

```text
┌──────────────────────────────────────────────┐
│                   cells                      │
├──────────────────────────────────────────────┤
│ id                  PK                       │
│ serial_number       UNIQUE, NOT NULL         │
│ manufacturer        NOT NULL                 │
│ current_state       ENUM                     │
│ chemistry           NOT NULL                 │
│ batch_number        NOT NULL                 │
│ capacity_mah        NOT NULL                 │
│ voltage_v           NOT NULL                 │
│ received_date       NOT NULL                 │
│ created_at          TIMESTAMP                │
│ updated_at          TIMESTAMP                │
└──────────────────────┬───────────────────────┘
                       │
                       │ 1 → many
                       ▼
┌──────────────────────────────────────────────┐
│                cell_events                   │
├──────────────────────────────────────────────┤
│ id                  PK                       │
│ cell_id             FK                       │
│ event_type          NOT NULL                 │
│ previous_state                               │
│ new_state                                    │
│ notes                                        │
│ created_by          NOT NULL                 │
│ created_at          TIMESTAMP                │
└──────────────────────────────────────────────┘
```

### DEMO VIDEO

https://drive.google.com/drive/folders/1r-eOWUTQ8a6ks4CBO3uAuCWZrMK7XQCx?usp=sharing
