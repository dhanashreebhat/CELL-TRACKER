import React from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { motion } from "framer-motion";

import Dashboard from "./pages/Dashboard.jsx";
import CellList from "./pages/CellList.jsx";
import Timeline from "./pages/Timeline.jsx";
import ImportCsv from "./pages/ImportCsv.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <motion.nav
          className="navbar"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Link to="/" className="brand">
            {/* <span className="brand-mark">BMW</span> */}
            <span>Cell Tracker</span>
          </Link>

          <div className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/cells"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Cells
            </NavLink>

            <NavLink
              to="/import"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              CSV Import
            </NavLink>
          </div>
        </motion.nav>

        <motion.main
          className="container"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cells" element={<CellList />} />
            <Route path="/cells/:id/timeline" element={<Timeline />} />
            <Route path="/import" element={<ImportCsv />} />
          </Routes>
        </motion.main>
      </div>
    </BrowserRouter>
  );
}

export default App;
