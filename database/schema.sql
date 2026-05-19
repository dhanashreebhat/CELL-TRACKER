CREATE DATABASE bmw_cells;

USE bmw_cells;

CREATE TABLE cells (
    id INT AUTO_INCREMENT PRIMARY KEY,

    serial_number VARCHAR(100) UNIQUE NOT NULL,

    manufacturer VARCHAR(100) NOT NULL,

    current_state ENUM(
        'RECEIVED',
        'INCOMING_QC',
        'STORAGE',
        'UNDER_TEST',
        'PASSED',
        'FAILED',
        'DISPOSED'
    ) NOT NULL DEFAULT 'RECEIVED',

    chemistry VARCHAR(50) NOT NULL,

    batch_number VARCHAR(50) NOT NULL,

   capacity_mah INT NOT NULL,

voltage_v DECIMAL(10,2) NOT NULL,

    received_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE cell_events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cell_id INT NOT NULL,

    event_type VARCHAR(50) NOT NULL,

    previous_state VARCHAR(50),

    new_state VARCHAR(50),

    notes TEXT,

    created_by VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cell_events_cell
        FOREIGN KEY (cell_id)
        REFERENCES cells(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_cells_current_state
ON cells(current_state);

CREATE INDEX idx_cell_events_cell_created_at
ON cell_events(cell_id, created_at);