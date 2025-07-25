import React from 'react';
import { Home, FolderOpen, Calendar, Globe, Power } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const buttonStyle = (path) => ({
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: isActive(path) ? "#4ade80" : "#e0e0e0ff",
    border: "none",
    color: isActive(path) ? "#000" : "#374151", // Optional color shift
    cursor: "pointer",
  });

  return (
    <nav style={{ display: "flex", alignItems: "stretch" }}>
      <button onClick={() => navigate("/")} style={buttonStyle("/")}>
        <Home size={24} /> Home
      </button>
            <button onClick={() => navigate("/weekly-calendar")} style={buttonStyle("/weekly-calendar")}>
        <Calendar size={24} /> Weekly Calendar
      </button>
      <button onClick={() => navigate("/resources")} style={buttonStyle("/resources")}>
        <FolderOpen size={24} /> Resources
      </button>
      <div style={{ flex: 1 }} />

      <button style={buttonStyle("lang")}>
        <Globe size={20} /> English
      </button>
      <button style={buttonStyle("logout")}>
        <Power size={20} /> Logout
      </button>
    </nav>
  );
};

export default NavBar;