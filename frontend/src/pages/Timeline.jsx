import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function Timeline() {
  const { id } = useParams();

  const [events, setEvents] = useState([]);
  const [newState, setNewState] = useState("STORAGE");
  const [notes, setNotes] = useState("");
  const [createdBy, setCreatedBy] = useState("demo-user");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTimeline() {
    // Load audit history
    try {
      const response = await api.get(`/${id}/timeline`);
      setEvents(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load timeline");
    }
  }

  useEffect(() => {
    loadTimeline();
  }, [id]);

  async function updateState(event) {
    event.preventDefault();
    // Update lifecycle state
    try {
      await api.post(`/${id}/state`, {
        newState,
        notes,
        createdBy,
      });

      setMessage("Lifecycle state updated successfully.");
      setTimeout(() => {
        setMessage("");
      }, 3000);
      setError("");
      setNotes("");

      loadTimeline();
    } catch (err) {
      setMessage("");
      setError(err.response?.data?.error || "Unable to update state");
    }
  }

  function getEventClass(event) {
    const state = event.new_state || event.event_type;

    if (state === "PASSED") return "timeline-pass";

    if (state === "FAILED") return "timeline-fail";

    if (state === "DISPOSED") return "timeline-disposed";

    if (state === "UNDER_TEST") return "timeline-under-test";

    if (
      event.event_type === "CSV_IMPORT" ||
      event.event_type === "CSV_UPDATE"
    ) {
      return "timeline-import";
    }

    if (event.event_type === "CORRECTION") {
      return "timeline-correction";
    }

    return "timeline-default";
  }

  return (
    <section>
      <Link to="/cells" className="back-link">
        ← Back to cells
      </Link>

      <h1>Cell Timeline</h1>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <h2>Update Lifecycle State</h2>

        <form className="form-row" onSubmit={updateState}>
          <select
            className={`state-select ${newState ? "has-value" : ""}`}
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
          >
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <input
            placeholder="Notes / reason"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <input
            placeholder="Created by"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
          />

          <button type="submit">Append Event</button>
        </form>
      </div>

      <div className="panel">
        <h2>Audit Timeline</h2>

        {events.length === 0 ? (
          <p>No timeline events found for this cell.</p>
        ) : (
          <div className="timeline">
            {events.map((event) => (
              <div
                key={event.id}
                className={`timeline-item ${getEventClass(event)}`}
              >
                <div className="timeline-dot"></div>

                <div className="timeline-content">
                  <div className="timeline-event-badge">{event.event_type}</div>

                  <p>
                    <strong>State change:</strong>{" "}
                    {event.previous_state || "N/A"} → {event.new_state || "N/A"}
                  </p>

                  <p>
                    <strong>Logged by:</strong> {event.created_by || "system"}
                  </p>

                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {event.created_at
                      ? new Date(event.created_at).toLocaleString()
                      : "-"}
                  </p>

                  <p>
                    <strong>Notes:</strong> {event.notes || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Timeline;
