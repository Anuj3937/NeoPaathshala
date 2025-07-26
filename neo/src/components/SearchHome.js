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
    setLoading(true);
    setError(null);  
    onSubmit(searchQuery);}
  const styles = {
    mainContent: {
      flex: 1,
      marginTop:"10%",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 32px'
    },
    welcomeText: {
      fontSize: '96px',
      fontWeight: 'bold',
      color: '#86efac',
      marginBottom: '64px',
      fontStyle: 'italic',
      letterSpacing: '2px',
      textAlign: 'center'
    },
    searchContainer: {
      backgroundColor: '#d1d5db',
      padding: '16px',
      borderRadius: '50px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '896px'
    },
    searchInner: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    searchInput: {
      flex: 1,
      backgroundColor: '#9ca3af',
      color: 'white',
      border: 'none',
      padding: '16px 24px',
      borderRadius: '50px',
      fontSize: '18px',
      outline: 'none'
    },
    voiceButton: {
      padding: '16px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: isListening ? '#ef4444' : '#22c55e'
    },
    sendButton: {
      backgroundColor: '#22c55e',
      padding: '16px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
  }
  return (
    <div style={styles.mainContent}>
{/* Welcome Text */}
        <h1 style={styles.welcomeText}>
          Welcome !
        </h1>
        
        {/* Search Bar Container */}
        <div style={styles.searchContainer}>
          <div style={styles.searchInner}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="How can i help ?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                ...styles.searchInput,
                '::placeholder': { color: '#d1d5db' }
              }}
            />
            
            {/* Voice Button */}
            <button
              onClick={handleVoiceClick}
              style={{
                ...styles.voiceButton,
                animation: isListening ? 'pulse 2s infinite' : 'none'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = isListening ? '#dc2626' : '#16a34a'}
              onMouseOut={(e) => e.target.style.backgroundColor = isListening ? '#ef4444' : '#22c55e'}
            >
              <Mic size={24} color="white" />
            </button>
            
            {/* Send Button */}
            <button
              onClick={handleSendClick}
              style={styles.sendButton}
              onMouseOver={(e) => e.target.style.backgroundColor = '#16a34a'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#22c55e'}
            >
              <Send size={24} color="white" />
            </button>
          </div>
        </div>
        {loading && <p style={{ color: "#facc15", marginTop: "20px" }}>Loading...</p>}
        {error && <p style={{ color: "#f87171", marginTop: "20px" }}>{error}</p>}
    </div>
  );
};

export default SearchHome;