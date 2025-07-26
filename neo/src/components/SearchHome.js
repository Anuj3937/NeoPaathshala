import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SearchHome = ({ onSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN'); // Default to English (India)

  const baseSearchQueryRef = useRef('');

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'mr-IN', name: 'Marathi (India)' },
    { code: 'bn-IN', name: 'Bengali (India)' },
    { code: 'gu-IN', name: 'Gujarati (India)' },
    { code: 'kn-IN', name: 'Kannada (India)' },
    { code: 'ml-IN', name: 'Malayalam (India)' },
    { code: 'pa-IN', name: 'Punjabi (India)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'te-IN', name: 'Telugu (India)' },
    { code: 'ur-IN', name: 'Urdu (India)' },
  ];

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
    finalTranscript
  } = useSpeechRecognition();

  useEffect(() => {
    if (listening) {
      const currentCombinedText = baseSearchQueryRef.current + (transcript ? (baseSearchQueryRef.current ? ' ' : '') + transcript : '');
      setSearchQuery(currentCombinedText);
    } else {
      const finalCombinedText = baseSearchQueryRef.current + (finalTranscript ? (baseSearchQueryRef.current ? ' ' : '') + finalTranscript : '');
      setSearchQuery(finalCombinedText);
      baseSearchQueryRef.current = finalCombinedText;
      resetTranscript();
    }
  }, [transcript, finalTranscript, listening]);

  const handleSearchQueryChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    if (!listening) {
      baseSearchQueryRef.current = e.target.value;
    }
  }, [listening]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  };

  const handleVoiceClick = () => {
    if (!browserSupportsSpeechRecognition) {
      setError("Browser doesn't support speech recognition.");
      return;
    }
    if (!isMicrophoneAvailable) {
      setError("Microphone is not available. Please check your microphone settings.");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      baseSearchQueryRef.current = searchQuery;
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false, language: selectedLanguage });
    }
  };

  const handleSendClick = () => {
    if (!searchQuery.trim()) {
      setError("Search query cannot be empty.");
      return;
    }
    setLoading(true);
    setError(null);
    // Pass selectedLanguage as a parameter to onSubmit
    onSubmit(searchQuery, selectedLanguage);
    setSearchQuery('');
    baseSearchQueryRef.current = '';
    resetTranscript();
  };

  const styles = {
    mainContent: {
      flex: 1,
      marginTop: "10%",
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
      maxWidth: '896px',
      // Removed marginBottom as language select is now inside
    },
    searchInner: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      // width:'100%',
    },
    searchInputWrapper: { // New wrapper for input and select
      flex: 1,
      display: 'flex',
      backgroundColor: '#7a808bff',
      borderRadius: '25px',
      overflow: 'hidden',
      gap:'5px',
      padding:'4px',
      width:'fit-content',
      // border:'1px solid black' // Ensures inner elements don't spill
    },
    searchInput: {
      flex: 1, // Take up remaining space
      backgroundColor: 'transparent', // Make it transparent to show wrapper's background
      color: 'lime',
      border: 'none',
      padding: '16px 24px',
      fontSize: '18px',
      outline: 'none',
    },
    
    voiceButton: {
      padding: '16px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: listening ? '#ef4444' : '#22c55e'
    },
    sendButton: {
      backgroundColor: '#22c55e',
      padding: '16px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    languageSelect: {
      // Inline styles for select to match input look
      backgroundColor: 'transparent', // Match input background
      color: 'white',
      border: 'none',
      outline: 'none',
      padding: '16px 12px 16px 0px', // Adjust padding for intuitive spacing
      fontSize: '16px',
      borderRadius: '0 50px 50px 0', // Rounded on the right side only
      cursor: 'pointer',
      // Style for the dropdown arrow, might need specific browser hacks or a custom dropdown component for full control
      // For now, relies on browser default but tries to blend
    },
    languageOption: {
        color: '#333', // Options should be readable in dropdown
        backgroundColor: '#9ca3af', // Match input background for consistency when selected
    }
  };

  return (
    <div style={styles.mainContent}>
      <h1 style={styles.welcomeText}>
        Welcome !<br></br> How can we help ?
      </h1>

      <div style={styles.searchContainer}>
        <div style={styles.searchInner}>
          {/* Combined Input and Language Select Wrapper */}
          <div style={styles.searchInputWrapper}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              onKeyPress={handleKeyPress}
              style={styles.searchInput}
            />
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={styles.languageSelect}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} style={styles.languageOption}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleVoiceClick}
            style={{
              ...styles.voiceButton,
              animation: listening ? 'pulse 2s infinite' : 'none'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = listening ? '#dc2626' : '#16a34a'}
            onMouseOut={(e) => e.target.style.backgroundColor = listening ? '#ef4444' : '#22c55e'}
            disabled={!browserSupportsSpeechRecognition || !isMicrophoneAvailable}
          >
            <Mic size={24} color="white" />
          </button>

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
      {!browserSupportsSpeechRecognition && (
        <p style={{ color: "#f87171", marginTop: "10px" }}>
          Speech recognition is not supported by your browser. Please try Chrome or Edge.
        </p>
      )}
      {!isMicrophoneAvailable && browserSupportsSpeechRecognition && (
        <p style={{ color: "#f87171", marginTop: "10px" }}>
          Microphone is not available. Please enable it in your browser settings.
        </p>
      )}
    </div>
  );
};

export default SearchHome;