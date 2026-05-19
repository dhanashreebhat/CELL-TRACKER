import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import api from "../api";

const states = [
  "RECEIVED",
  "INCOMING_QC",
  "STORAGE",
  "UNDER_TEST",
  "PASSED",
  "FAILED",
  "DISPOSED",
];

function CellList() {
  const [cells, setCells] = useState([]);
  const [stateFilter, setStateFilter] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    serialNumber: "",
    manufacturer: "",
    chemistry: "",
    batchNumber: "",
    capacityMah: "",
    voltageNominal: "",
    receivedDate: "",
    createdBy: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCells() {
    try {
      // Load/filter cells
      const url = stateFilter ? `/?state=${stateFilter}` : "/";
      const response = await api.get(url);

      setCells(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load cells");
    }
  }

  useEffect(() => {
    loadCells();
  }, [stateFilter]);

  async function createCell(event) {
    event.preventDefault();
    // Create new cell
    try {
      await api.post("/", form);

      setMessage("Cell created successfully.");
      setError("");
      setTimeout(() => {
        setMessage("");
      }, 3000);

      setForm({
        serialNumber: "",
        manufacturer: "",
        chemistry: "",
        batchNumber: "",
        capacityMah: "",
        voltageNominal: "",
        receivedDate: "",
        createdBy: "",
      });

      loadCells();
    } catch (err) {
      setMessage("");
      setError(err.response?.data?.error || "Unable to create cell");
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  }

  function downloadCsv() {
    if (cells.length === 0) return;

    const headers = [
      "serial_number",
      "current_state",
      "chemistry",
      "batch_number",
      "capacity_mah",
      "voltage_v",
      "updated_at",
    ];

    const rows = cells.map((cell) => [
      cell.serial_number,
      cell.current_state,
      cell.chemistry,
      cell.batch_number,
      cell.capacity_mah,
      cell.voltage_v,
      new Date(cell.updated_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "cells_export.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  const filteredCells = cells.filter((cell) =>
    cell.serial_number?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Cell List</h1>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            className="alert success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div
            className="alert error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="panel create-cell-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="panel-header">
          <div>
            <h2>Create Cell</h2>
          </div>
        </div>

        <form className="form-row" onSubmit={createCell}>
          <input
            className="input-celllist"
            placeholder="Serial number"
            value={form.serialNumber}
            onChange={(e) =>
              setForm({
                ...form,
                serialNumber: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            placeholder="Manufacturer"
            value={form.manufacturer}
            onChange={(e) =>
              setForm({
                ...form,
                manufacturer: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            placeholder="Chemistry e.g. NMC"
            value={form.chemistry}
            onChange={(e) =>
              setForm({
                ...form,
                chemistry: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            placeholder="Batch number"
            value={form.batchNumber}
            onChange={(e) =>
              setForm({
                ...form,
                batchNumber: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            type="number"
            placeholder="Capacity mAh"
            value={form.capacityMah}
            onChange={(e) =>
              setForm({
                ...form,
                capacityMah: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            type="number"
            step="0.01"
            placeholder="Voltage V"
            value={form.voltageNominal}
            onChange={(e) =>
              setForm({
                ...form,
                voltageNominal: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            type="date"
            required
            value={form.receivedDate}
            onChange={(e) =>
              setForm({
                ...form,
                receivedDate: e.target.value,
              })
            }
          />

          <input
            className="input-celllist"
            placeholder="Created by"
            required
            value={form.createdBy}
            onChange={(e) =>
              setForm({
                ...form,
                createdBy: e.target.value,
              })
            }
          />

          <motion.button whileTap={{ scale: 0.96 }} type="submit">
            Create
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        className="toolbar modern-toolbar"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <label>
          Filter by state
          <select
            className={`filter-by ${stateFilter ? "has-value" : ""}`}
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All states</option>

            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <input
          className="input-celllist"
          type="text"
          placeholder="Search serial number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-right">
          <motion.p
            className="cell-count"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{
              scale: 1.05,
            }}
          >
            Total Cells: <strong>{filteredCells.length}</strong>
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={downloadCsv}
          >
            Download CSV
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="panel table-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>State</th>
              <th>Chemistry</th>
              <th>Batch</th>
              <th>Capacity mAh</th>
              <th>Voltage V</th>
              <th>Updated</th>
              <th>Timeline</th>
            </tr>
          </thead>

          <tbody>
            {cells.length === 0 ? (
              <tr>
                <td colSpan="8">No cells found.</td>
              </tr>
            ) : (
              cells
                .filter((cell) =>
                  cell.serial_number
                    ?.toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((cell, index) => (
                  <motion.tr
                    key={cell.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="serial-cell">
                      {" "}
                      {cell.serial_number?.toUpperCase()}{" "}
                    </td>

                    <td>
                      <span
                        className={`badge ${cell.current_state.toLowerCase()}`}
                      >
                        {cell.current_state}
                      </span>
                    </td>

                    <td>{cell.chemistry || "-"}</td>

                    <td>
                      {cell.batch_number
                        ? cell.batch_number.toUpperCase()
                        : "-"}
                    </td>

                    <td>{cell.capacity_mah || "-"}</td>

                    <td>{cell.voltage_v || "-"}</td>

                    <td>
                      {cell.updated_at
                        ? new Date(cell.updated_at).toLocaleString()
                        : "-"}
                    </td>

                    <td>
                      <Link
                        className="table-link"
                        to={`/cells/${cell.id}/timeline`}
                      >
                        Timeline
                      </Link>
                    </td>
                  </motion.tr>
                ))
            )}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}

export default CellList;
