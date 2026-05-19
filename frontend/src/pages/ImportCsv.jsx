import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

function ImportCsv() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadCsv(event) {
    event.preventDefault();

    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await api.post("/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
    } catch (err) {
      setResult(null);

      setError(err.response?.data?.error || "CSV import failed");
    } finally {
      setLoading(false);
    }
  }

  function getErrorSeverity(errorMessage) {
    const error = String(errorMessage || "").toLowerCase();

    if (error.includes("required") || error.includes("missing")) {
      return "severity-red";
    }

    if (
      error.includes("format") ||
      error.includes("date") ||
      error.includes("voltage") ||
      error.includes("capacity") ||
      error.includes("chemistry")
    ) {
      return "severity-orange";
    }

    if (error.includes("duplicate") || error.includes("already exists")) {
      return "severity-yellow";
    }

    return "severity-red";
  }
  return (
    <section>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>CSV Import</h1>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="alert error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="panel import-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <form className="form-row" onSubmit={uploadCsv}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.03 } : {}}
            whileTap={!loading ? { scale: 0.96 } : {}}
          >
            {loading ? "Importing..." : "Import CSV"}
          </motion.button>
        </form>

        {file && (
          <motion.p
            className="selected-file"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Selected file: <strong>{file.name}</strong>
          </motion.p>
        )}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            className="panel import-result-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Import Result</h2>

            <div className="import-summary-grid">
              <motion.div className="summary-card" whileHover={{ y: -4 }}>
                <p>Total Rows</p>
                <h2>{result.totalRows}</h2>
              </motion.div>

              <motion.div
                className="summary-card success-card"
                whileHover={{ y: -4 }}
              >
                <p>Imported</p>
                <h2>{result.imported}</h2>
              </motion.div>

              <motion.div
                className="summary-card update-card"
                whileHover={{ y: -4 }}
              >
                <p>Updated</p>
                <h2>{result.updated || 0}</h2>
              </motion.div>

              <motion.div
                className="summary-card error-card"
                whileHover={{ y: -4 }}
              >
                <p>Failed</p>
                <h2>{result.failed}</h2>
              </motion.div>
            </div>

            <h3>Validation Errors</h3>

            {result.errors.length === 0 ? (
              <motion.div
                className="alert success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No validation errors.
              </motion.div>
            ) : (
              <motion.div
                className="table-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>CSV Row</th>
                      <th>Serial Number</th>
                      <th>Error</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.errors.map((row, index) => (
                      <motion.tr
                        key={`${row.row}-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <td>{row.row}</td>

                        <td>{row.serialNumber || "-"}</td>

                        <td>
                          <span
                            className={`error-badge ${getErrorSeverity(
                              Array.isArray(row.error)
                                ? row.error.join(", ")
                                : row.error,
                            )}`}
                          >
                            {Array.isArray(row.error)
                              ? row.error.join(", ")
                              : row.error}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ImportCsv;
