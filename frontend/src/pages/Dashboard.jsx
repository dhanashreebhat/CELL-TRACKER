import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import api from "../api";

// timeline-color
const stateMeta = {
  RECEIVED: {
    label: "Received",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "inbox",
  },
  INCOMING_QC: {
    label: "Incoming QC",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "search",
  },
  STORAGE: {
    label: "Storage",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "box",
  },
  UNDER_TEST: {
    label: "Under Test",
    color: "#ea580c",
    bg: "#ffedd5",
    icon: "bolt",
  },
  PASSED: {
    label: "Passed",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: "check",
  },
  FAILED: {
    label: "Failed",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "x",
  },
  DISPOSED: {
    label: "Disposed",
    color: "#64748b",
    bg: "#e2e8f0",
    icon: "archive",
  },
};
// svg
function Icon({ type, color = "#2563eb" }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    battery: (
      <svg {...common}>
        <rect x="3" y="7" width="16" height="10" rx="2" />
        <path d="M21 11v2" />
        <path d="M7 11h4" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.2 2.2 4.8-5.4" />
      </svg>
    ),
    x: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
    ),
    bolt: (
      <svg {...common}>
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
    activity: (
      <svg {...common}>
        <path d="M3 12h4l3-7 4 14 3-7h4" />
      </svg>
    ),
    inbox: (
      <svg {...common}>
        <path d="M4 4h16l-2 10H6L4 4z" />
        <path d="M6 14v4h12v-4" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    box: (
      <svg {...common}>
        <path d="M21 8 12 3 3 8l9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
    archive: (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <path d="M5 8v11h14V8" />
        <path d="M10 12h4" />
      </svg>
    ),
  };

  return icons[type] || icons.battery;
}

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [error, setError] = useState("");

  async function loadStats() {
    // Load dashboard statistics
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load dashboard stats");
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const totalCells = stats.reduce((sum, item) => sum + Number(item.count), 0);

  const activeCells = stats
    .filter((item) => item.current_state !== "DISPOSED")
    .reduce((sum, item) => sum + Number(item.count), 0);

  const passed =
    stats.find((item) => item.current_state === "PASSED")?.count || 0;

  const failed =
    stats.find((item) => item.current_state === "FAILED")?.count || 0;

  const underTest =
    stats.find((item) => item.current_state === "UNDER_TEST")?.count || 0;

  const chartData = stats.map((item) => ({
    state: stateMeta[item.current_state]?.label || item.current_state,
    count: Number(item.count),
    color: stateMeta[item.current_state]?.color || "#2563eb",
  }));

  const kpis = [
    {
      label: "Total Cells",
      value: totalCells,
      icon: "battery",
      color: "#2563eb",
      bg: "#dbeafe",
    },
    {
      label: "Active Cells",
      value: activeCells,
      icon: "activity",
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      label: "Under Test",
      value: underTest,
      icon: "bolt",
      color: "#ea580c",
      bg: "#ffedd5",
    },
    {
      label: "Passed",
      value: passed,
      icon: "check",
      color: "#16a34a",
      bg: "#dcfce7",
    },
    {
      label: "Failed",
      value: failed,
      icon: "x",
      color: "#dc2626",
      bg: "#fee2e2",
    },
  ];

  return (
    <section className="dashboard-page">
      <h1>Dashboard</h1>

      {error && <div className="alert error">{error}</div>}

      <div className="overview-grid">
        {kpis.map((item, index) => (
          <motion.div
            key={item.label}
            className="overview-card premium-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -6, scale: 1.02 }}
          >
            <div
              className="card-icon"
              style={{
                background: item.bg,
              }}
            >
              <Icon type={item.icon} color={item.color} />
            </div>

            <div>
              <p>{item.label}</p>
              <h2>{item.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="state-strip">
        {stats.map((item, index) => {
          const meta = stateMeta[item.current_state];

          return (
            <motion.div
              key={item.current_state}
              className="state-pill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              style={{
                background: meta?.bg || "#e5e7eb",
                color: meta?.color || "#334155",
              }}
            >
              <Icon type={meta?.icon} color={meta?.color} />
              <span className="contri-color">
                {meta?.label || item.current_state}
              </span>
              <strong>{item.count}</strong>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <motion.div
          className="panel chart-panel premium-panel"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="chart-header">
            <h2>Lifecycle Distribution</h2>
          </div>

          <ResponsiveContainer width="100%" height={370}>
            <BarChart
              data={chartData}
              barSize={46}
              isAnimationActive={true}
              animationDuration={1200}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#dbe3f0"
              />

              <XAxis
                dataKey="state"
                tick={{ fill: "#ffffff", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#ffffff", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  boxShadow: "0 14px 35px rgba(15,23,42,0.14)",
                  padding: "12px 16px",
                }}
                labelStyle={{
                  color: "#0f172a",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
                itemStyle={{
                  color: "#334155",
                  fontWeight: 700,
                }}
              />

              <Bar
                dataKey="count"
                radius={[14, 14, 0, 0]}
                animationDuration={900}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}

export default Dashboard;
