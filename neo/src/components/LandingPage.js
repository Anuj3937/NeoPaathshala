import React from 'react';
import RotatingText from './RotatingText';
import { LogIn, UserPlus } from 'lucide-react';

const LandingPage = ({ paathshalaWord, onTitleClick }) => {
  // This function will redirect the user to the backend login route
  const handleAuthClick = () => {
    // Both Login and Sign Up will now trigger the same Google OAuth flow
    window.location.href = 'http://localhost:8000/login';
  };

  const getPopButtonStyles = (color, shadowColor) => ({
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: color,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow:`0 4px ${shadowColor}`,
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    transform: "translateY(0)",
  });

  const handleMouseDown = (e, shadowColor) => {
    e.currentTarget.style.transform = "translateY(2px)";
    e.currentTarget.style.boxShadow = `0 2px ${shadowColor}`;
  };

  const handleMouseUp = (e, shadowColor) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = `0 4px ${shadowColor}`;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--background-darker)',
      textAlign: 'center',
      padding: '2rem',
    },
    title: {
      fontSize: 'clamp(3rem, 10vw, 6rem)',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
      marginBottom: '1rem',
      cursor: 'pointer',
    },
    rotatingTextContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
      color: 'var(--text-secondary)',
      marginBottom: '3rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    buttonsContainer: {
      display: 'flex',
      gap: '1rem',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title} onClick={onTitleClick}>
        Neo<span>{paathshalaWord}</span>
      </h1>

      <div style={styles.rotatingTextContainer}>
        <span>Supercharge Your Teaching with AI in</span>
        <RotatingText
          texts={['Learning', 'Building', 'Exploring']}
          mainClassName="text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 font-bold"
          staggerFrom="first"
        />
      </div>

      <div style={styles.buttonsContainer}>
        <button
          onClick={handleAuthClick} // Updated onClick handler
          style={getPopButtonStyles('var(--accent-blue)', 'var(--shadow-blue)')}
          onMouseDown={(e) => handleMouseDown(e, 'var(--shadow-blue)')}
          onMouseUp={(e) => handleMouseUp(e, 'var(--shadow-blue)')}
        >
          <LogIn size={20} /> Login
        </button>
        <button
          onClick={handleAuthClick} // Updated onClick handler
          style={getPopButtonStyles('var(--accent-green)', 'var(--shadow-green)')}
          onMouseDown={(e) => handleMouseDown(e, 'var(--shadow-green)')}
          onMouseUp={(e) => handleMouseUp(e, 'var(--shadow-green)')}
        >
          <UserPlus size={20} /> Sign Up
        </button>
      </div>
    </div>
  );
};

export default LandingPage;