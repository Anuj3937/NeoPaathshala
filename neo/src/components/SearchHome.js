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
      outline: 'none',
    },
    voiceButton:{
      backgroundColor:'var(--accent-purple)',
      padding:'12px',
        borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
      // backgroundColor: 'var(--background-light)',
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
        languageSelect: {
      // Inline styles for select to match input look
      backgroundColor: 'var(--background-light)', // Match input background
      color: 'var(--text-primary)',
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
        color:'var(--text-primary)', // Options should be readable in dropdown
        backgroundColor: 'var(--background-light)',
        borderRadius:'20px', // Match input background for consistency when selected
    }
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