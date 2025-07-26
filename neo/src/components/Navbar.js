import React from 'react';
import { Home, FolderOpen, Calendar, Globe, Power } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";

const NavBar = ({ serverDown }) => {
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
    color: isActive(path) ? "#000" : "#374151",
    cursor: "pointer",
  });

  // Style for the "SERVER DOWN" error message
  const errorStyle = {
    backgroundColor: 'red',
    color: 'black',
    fontWeight: 'bold',
    padding: '16px',
    textAlign: 'center',
    flex: 1, // Let it fill the available space
  };

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

      {/* Conditionally render the error message */}
      {serverDown ? (
        <div style={errorStyle}>SERVER DOWN</div>
      ) : (
        <div style={{ flex: 1 }} /> // This empty div keeps the layout consistent
      )}

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