import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';

const SearchHome = ({ onSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  };

  const handleVoiceClick = () => setIsListening(!isListening);
  
  const handleSendClick = () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    onSubmit(searchQuery);
  };

  const styles = {
    mainContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      minHeight: 'calc(100vh - 80px)', 
      textAlign: 'center'
    },
    welcomeContainer: {
      marginBottom: '48px'
    },
    welcomeTitle: {
      fontSize: '56px',
      fontWeight: '700',
      color: 'var(--text-primary)',
      marginBottom: '16px',
      lineHeight: '1.2'
    },
    welcomeSubtitle: {
      fontSize: '22px', // Increased font size for slogan
      color: 'var(--text-secondary)',
      maxWidth: '600px',
      margin: '0 auto',
      fontWeight: '500' // Added font weight
    },
    searchContainer: {
      backgroundColor: 'var(--background-light)',
      padding: '8px',
      borderRadius: '50px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      width: '100%',
      maxWidth: '700px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    searchInput: {
      flex: 1,
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: 'none',
      padding: '12px 24px',
      fontSize: '18px',
      outline: 'none'
    },
    iconButton: {
      padding: '12px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
      backgroundColor: 'var(--background-light)',
    },
    sendButton: {
      backgroundColor: 'var(--accent-blue)',
      padding: '12px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <div style={styles.mainContent}>
      <div style={styles.welcomeContainer}>
        <h1 style={styles.welcomeTitle}>
          Your AI-Powered Teaching Co-Pilot
        </h1>
        <p style={styles.welcomeSubtitle}>
          From Prompt to Podium. Effortless Lessons, Inspired Learning.
        </p>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Generate a lesson plan for photosynthesis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          style={styles.searchInput}
        />
        <button
          onClick={handleVoiceClick}
          style={{...styles.iconButton, color: isListening ? 'var(--accent-red)' : 'var(--text-secondary)'}}
        >
          <Mic size={24} />
        </button>
        <button
          onClick={handleSendClick}
          style={styles.sendButton}
        >
          <Send size={24} color="white" />
        </button>
      </div>
      
      {/* Updated Loading Animation */}
      {loading && <div className="loader" style={{ marginTop: '30px' }}></div>}
      
      {error && <p style={{ color: "var(--accent-red)", marginTop: "20px" }}>{error}</p>}
    </div>
  );
};

export default SearchHome;