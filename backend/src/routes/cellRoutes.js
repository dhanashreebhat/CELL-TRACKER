const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../db");

const {
  validateCsvRow,
  validateManualCell,
} = require("../utils/csvValidation");

const upload = multer({ dest: "uploads/" });

const VALID_STATES = [
  "RECEIVED",
  "INCOMING_QC",
  "STORAGE",
  "UNDER_TEST",
  "PASSED",
  "FAILED",
  "DISPOSED",
];

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT current_state, COUNT(*) AS count
      FROM cells
      GROUP BY current_state
    `);

    const stats = VALID_STATES.map((state) => {
      const found = rows.find((row) => row.current_state === state);

      return {
        current_state: state,
        count: found ? Number(found.count) : 0,
      };
    });

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard statistics." });
  }
});

router.post("/", async (req, res) => {
  try {
    const validation = validateManualCell(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error.error,
      });
    }

    const {
      serialNumber,
      manufacturer,
      chemistry,
      capacityMah,
      voltageNominal,
      batchNumber,
      receivedDate,
    } = validation.data;

    const createdBy = req.body.createdBy;

    if (!createdBy || !createdBy.trim()) {
      return res.status(400).json({
        error: "Created by is required.",
      });
    }
    const capacityMahValue = Number(capacityMah);
    const voltageV = Number(voltageNominal);

    const [existing] = await db.query(
      "SELECT id FROM cells WHERE serial_number = ?",
      [serialNumber],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "A cell with this serial number already exists.",
      });
    }

    const [insertResult] = await db.query(
      `
      INSERT INTO cells
      (
        serial_number,
        manufacturer,
        chemistry,
        batch_number,
        capacity_mah,
        voltage_v,
        received_date,
        current_state
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        serialNumber,
        manufacturer,
        chemistry,
        batchNumber,
        capacityMahValue,
        voltageV,
        receivedDate,
        "RECEIVED",
      ],
    );

    await db.query(
      `
      INSERT INTO cell_events
      (
        cell_id,
        event_type,
        previous_state,
        new_state,
        notes,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        insertResult.insertId,
        "CREATED",
        null,
        "RECEIVED",
        `Cell created manually. Manufacturer: ${manufacturer}, Capacity: ${capacityMahValue}mAh, Voltage: ${voltageV}V, Received: ${receivedDate}`,
        createdBy,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Cell created successfully.",
      id: insertResult.insertId,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "A cell with this serial number already exists.",
      });
    }

    res.status(500).json({
      error: "Unexpected server error. Check backend terminal logs.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const state = req.query.state;
    const search = req.query.search;

    let query = "SELECT * FROM cells";
    const values = [];

    if (state && search) {
      query += " WHERE current_state = ? AND serial_number LIKE ?";
      values.push(state, `%${search}%`);
    } else if (state) {
      query += " WHERE current_state = ?";
      values.push(state);
    } else if (search) {
      query += " WHERE serial_number LIKE ?";
      values.push(`%${search}%`);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cells." });
  }
});

router.get("/:id/timeline", async (req, res) => {
  try {
    const cellId = req.params.id;

    const [events] = await db.query(
      `
      SELECT *
      FROM cell_events
      WHERE cell_id = ?
      ORDER BY created_at DESC
      `,
      [cellId],
    );

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cell timeline." });
  }
});

router.post("/:id/state", async (req, res) => {
  try {
    const cellId = req.params.id;
    const { newState, notes, createdBy } = req.body;

    if (!VALID_STATES.includes(newState)) {
      return res.status(400).json({ error: "Invalid lifecycle state." });
    }

    const [cells] = await db.query("SELECT * FROM cells WHERE id = ?", [
      cellId,
    ]);

    if (cells.length === 0) {
      return res.status(404).json({ error: "Cell not found." });
    }

    const cell = cells[0];

    await db.query(
      `
      UPDATE cells
      SET current_state = ?
      WHERE id = ?
      `,
      [newState, cellId],
    );

    await db.query(
      `
      INSERT INTO cell_events
      (cell_id, event_type, previous_state, new_state, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        cellId,
        "STATE_CHANGE",
        cell.current_state,
        newState,
        notes || "",
        createdBy || "system",
      ],
    );

    res.json({
      success: true,
      message: "Cell state updated successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update cell state." });
  }
});

router.post("/import", upload.single("file"), async (req, res) => {
  const rows = [];
  const errors = [];

  let imported = 0;
  let updated = 0;

  const seenInFile = new Set();

  if (!req.file) {
    return res.status(400).json({ error: "Please upload a CSV file." });
  }

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      for (let i = 0; i < rows.length; i++) {
        const csvRowNumber = i + 2;
        const validation = validateCsvRow(rows[i], csvRowNumber, seenInFile);

        if (!validation.valid) {
          errors.push(validation.error);
          continue;
        }

        const {
          serialNumber,
          manufacturer,
          chemistry,
          capacityMah,
          voltageNominal,
          batchNumber,
          receivedDate,
          notes,
        } = validation.data;

        const capacityMahValue = Number(capacityMah);
        const voltageV = Number(voltageNominal);

        try {
          const [existing] = await db.query(
            "SELECT * FROM cells WHERE serial_number = ?",
            [serialNumber],
          );

          if (existing.length > 0) {
            const existingCell = existing[0];

            await db.query(
              `
              UPDATE cells
              SET manufacturer = ?,
                  chemistry = ?,
                  batch_number = ?,
                  capacity_mah = ?,
                  voltage_v = ?,
                  received_date = ?
              WHERE id = ?
              `,
              [
                manufacturer,
                chemistry,
                batchNumber,
                capacityMahValue,
                voltageV,
                receivedDate,
                existingCell.id,
              ],
            );

            await db.query(
              `
              INSERT INTO cell_events
              (cell_id, event_type, previous_state, new_state, notes, created_by)
              VALUES (?, ?, ?, ?, ?, ?)
              `,
              [
                existingCell.id,
                "CSV_UPDATE",
                existingCell.current_state,
                existingCell.current_state,
                notes ||
                  `CSV updated record. Manufacturer: ${manufacturer}, Capacity: ${capacityMahValue}mAh, Voltage: ${voltageV}V, Received: ${receivedDate}`,
                "system",
              ],
            );

            updated++;
            continue;
          }

          const [insertResult] = await db.query(
            `
            INSERT INTO cells
            (
              serial_number,
              manufacturer,
              chemistry,
              batch_number,
              capacity_mah,
              voltage_v,
              received_date,
              current_state
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              serialNumber,
              manufacturer,
              chemistry,
              batchNumber,
              capacityMahValue,
              voltageV,
              receivedDate,
              "RECEIVED",
            ],
          );

          await db.query(
            `
            INSERT INTO cell_events
            (cell_id, event_type, previous_state, new_state, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              insertResult.insertId,
              "CSV_IMPORT",
              null,
              "RECEIVED",
              notes ||
                `Imported from CSV. Manufacturer: ${manufacturer}, Capacity: ${capacityMahValue}mAh, Voltage: ${voltageV}V, Received: ${receivedDate}`,
              "system",
            ],
          );

          imported++;
        } catch (err) {
          console.error(err);

          errors.push({
            row: csvRowNumber,
            serialNumber,
            error: "Unexpected database error occurred.",
          });
        }
      }

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        totalRows: rows.length,
        imported,
        updated,
        failed: errors.length,
        errors,
      });
    })
    .on("error", (err) => {
      console.error(err);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: "Failed to parse CSV file." });
    });
});

router.post("/:id/dispose", async (req, res) => {
  try {
    const cellId = req.params.id;

    const [cells] = await db.query("SELECT * FROM cells WHERE id = ?", [
      cellId,
    ]);

    if (cells.length === 0) {
      return res.status(404).json({ error: "Cell not found." });
    }

    const previousState = cells[0].current_state;

    await db.query(
      `
      UPDATE cells
      SET current_state = 'DISPOSED'
      WHERE id = ?
      `,
      [cellId],
    );

    await db.query(
      `
      INSERT INTO cell_events
      (cell_id, event_type, previous_state, new_state, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        cellId,
        "DISPOSED",
        previousState,
        "DISPOSED",
        "Cell disposed",
        "system",
      ],
    );

    res.json({
      success: true,
      message: "Cell disposed successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to dispose cell." });
  }
});

module.exports = router;
