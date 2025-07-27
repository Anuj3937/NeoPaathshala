import React from 'react';
import { Home, FolderOpen, Calendar, Power, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";

const NavBar = ({ theme, toggleTheme, paathshalaWord, onTitleClick, onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => location.pathname === path;
  
  const getPopButtonStyles = (path, activeColor, shadowColor) => ({
    padding: "10px 18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: isActive(path) ? activeColor : "var(--background-light)",
    border: `1px solid ${isActive(path) ? activeColor : "var(--border-color)"}`,
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: `0 3px ${isActive(path) ? shadowColor : "var(--shadow-gray)"}`,
    transition: "transform 0.1s ease, box-shadow 0.1s ease, background-color 0.3s, border-color 0.3s",
    transform: "translateY(0)",
  });
  
  const handleMouseDown = (e, path, shadowColor) => {
      e.currentTarget.style.transform = "translateY(2px)";
      // Corrected: Template literal for boxShadow
      e.currentTarget.style.boxShadow = `0 1px ${isActive(path) ? shadowColor : "var(--shadow-gray)"}`;
  };

  const handleMouseUp = (e, path, shadowColor) => {
      e.currentTarget.style.transform = "translateY(0)";
      // Corrected: Template literal for boxShadow
      e.currentTarget.style.boxShadow = `0 3px ${isActive(path) ? shadowColor : "var(--shadow-gray)"}`;
  };

  const navStyle = {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "var(--background-dark)",
    borderBottom: "1px solid var(--border-color)",
    transition: 'background-color 0.3s, border-color 0.3s',
  };

  return (
    <nav style={navStyle}>
      {/* NeoPaathshala Title with Dynamic Word and Click Handler */}
      <div 
        style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          color: 'var(--text-primary)', 
          marginRight: '32px',
          cursor: 'pointer' // Indicate it's clickable
        }}
        onClick={onTitleClick} // Add the click handler
      >
        Neo{paathshalaWord}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => navigate("/")} 
          style={getPopButtonStyles("/", "var(--accent-blue)", "var(--shadow-blue)")}
          onMouseDown={(e) => handleMouseDown(e, "/", "var(--shadow-blue)")}
          onMouseUp={(e) => handleMouseUp(e, "/", "var(--shadow-blue)")}
        >
          <Home size={20} /> Home
        </button>
        <button 
          onClick={() => navigate("/weekly-calendar")} 
          style={getPopButtonStyles("/weekly-calendar", "var(--accent-green)", "var(--shadow-green)")}
          onMouseDown={(e) => handleMouseDown(e, "/weekly-calendar", "var(--shadow-green)")}
          onMouseUp={(e) => handleMouseUp(e, "/weekly-calendar", "var(--shadow-green)")}
        >
          <Calendar size={20} /> Weekly Calendar
        </button>
        <button 
          onClick={() => navigate("/resources")} 
          style={getPopButtonStyles("/resources", "var(--accent-purple)", "var(--shadow-purple)")}
          onMouseDown={(e) => handleMouseDown(e, "/resources", "var(--shadow-purple)")}
          onMouseUp={(e) => handleMouseUp(e, "/resources", "var(--shadow-purple)")}
        >
          <FolderOpen size={20} /> Resources
        </button>
      </div>
      
      <div style={{ flex: 1 }} /> {/* This div pushes content to the right */}

      {/* User Info (Optional - only show if `user` prop is provided) */}
      {user && (
        <div style={{ color: 'var(--text-secondary)', marginRight: '20px' }}>
          Welcome, {user.name || user.email || 'User'} !
        </div>
      )}

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        style={{...getPopButtonStyles("theme", "var(--accent-yellow)", "var(--shadow-yellow)"), padding: '10px'}}
        onMouseDown={(e) => handleMouseDown(e, "theme", "var(--shadow-yellow)")}
        onMouseUp={(e) => handleMouseUp(e, "theme", "var(--shadow-yellow)")}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div style={{width: '12px'}}></div> {/* Spacer */}

      {/* Logout Button */}
      <button 
        onClick={onLogout} // Use the onLogout prop
        style={getPopButtonStyles("logout", "var(--accent-red)", "var(--shadow-red)")}
        onMouseDown={(e) => handleMouseDown(e, "logout", "var(--shadow-red)")}
        onMouseUp={(e) => handleMouseUp(e, "logout", "var(--shadow-red)")}
      >
        <Power size={20} /> Logout
      </button>
    </nav>
  );
};

export default NavBar;