import React, { useState } from 'react';
import { Home, FolderOpen, Calendar, Globe, Power, Mic, Send } from 'lucide-react';
import ContentGenerator from "./ContentGenerator";
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceClick = () => {
    setIsListening(!isListening);
    console.log('Voice button clicked');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseData, setResponseData] = useState(null);

  const handleSendClick = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/parse_and_map/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: searchQuery })
      });

      if (!res.ok) throw new Error("Failed to fetch from server");
      const data = await res.json();
      console.log("✅ Backend Response:", data);
      setResponseData(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  };
  const handleBack = () => {
    setResponseData(null);
    setSearchQuery("");
  };
  // Inline styles
  const styles = {
    body:{
      backgroundColor: "#4b5563",
    },
    container: {
      minHeight: '100vh',
      backgroundColor: '#4b5563',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      fontFamily: 'Arial, sans-serif'
    },
    nav: {
      display: 'flex',
      alignItems: 'stretch'
    },
    homeButton: {
      backgroundColor: '#4ade80',
      color: 'black',
      border: 'none',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: '500',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    navButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    rightButton: {
      backgroundColor: '#6b7280',
      color: '#86efac',
      border: 'none',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    spacer: {
      flex: 1
    },
    mainContent: {
      flex: 1,
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
    calendarText: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    calendarLine: {
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.nav}>
        {/* Home Button - Active/Green */}
        <button 
          style={styles.homeButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#16a34a'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4ade80'}
        >
          <Home size={24} />
          Home
        </button>
        
        {/* Resources Button */}
        <button 
          style={styles.navButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#9ca3af'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
        >
          <FolderOpen size={24} />
          Resources
        </button>
        
        {/* Weekly Calendar Button */}
        <button 
          style={styles.navButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#9ca3af'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
        >
          <Calendar size={24} />
          <div style={styles.calendarText}>
            <span style={styles.calendarLine}>Weekly</span>
            <span style={styles.calendarLine}>Calendar</span>
          </div>
        </button>
        
        {/* Spacer */}
        <div style={styles.spacer}></div>
        
        {/* Right Side Buttons */}
        <button 
          style={styles.rightButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#9ca3af'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
        >
          <Globe size={20} />
          English
        </button>
        
        <button 
          style={styles.rightButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#9ca3af'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
        >
          <Power size={20} />
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Welcome Text */}
        <h1 style={styles.welcomeText}>
          Welcome !
        </h1>
        {!responseData ? (
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
        {loading && <p style={{ color: "#facc15", marginTop: "20px" }}>Loading...</p>}
        {error && <p style={{ color: "#f87171", marginTop: "20px" }}>{error}</p>}
        </div>
            ): (
        <ContentGenerator data={responseData} onBack={handleBack} />
      )}

      </div>
    </div>
  );
}

export default App;