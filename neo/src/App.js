import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchHome from './components/SearchHome';
import ContentGenerator from './components/ContentGenerator';
import WeeklyPlanner from './components/WeeklyPlanner';
import SavedResourcesDisplay from './components/Resources';
import LandingPage from './components/LandingPage';

function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Optional: Store user data
  const [loading, setLoading] = useState(true); // State to handle initial auth check
  const [responseData, setResponseData] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [serverDown, setServerDown] = useState(false);

  // State for the rotating title word
  const [paathshalaWords] = useState([
    'Paathshala', 'पाठशाला', 'पाठशाळा', 'ಪಾಠಶಾಲಾ', 'પાઠશાળા', 'পাঠশালা'
  ]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Check authentication status when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/me', {
            method: 'GET',
            credentials: 'include', // Important: This sends the session cookie
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logged_in) {
            setIsAuthenticated(true);
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Could not verify authentication status.", error);
      } finally {
        setLoading(false); // Stop loading once the check is complete
      }
    };
    checkAuthStatus();
  }, []);

  // Handler for logging out
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/logout', { credentials: 'include' });
      setIsAuthenticated(false);
      setUser(null);
      // Redirect to the landing page by reloading
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // New handler for changing the title language
  const handleTitleClick = () => {
    setCurrentWordIndex((prevIndex) => (prevIndex + 1) % paathshalaWords.length);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const healthCheck = async () => {
      try {
        const res = await fetch("http://localhost:8000/");
        if (!res.ok) throw new Error('Server not responding');
        setServerDown(false);
      } catch (error) {
        setServerDown(true);
      }
    };
    healthCheck();
    const interval = setInterval(healthCheck, 15000);
    return () => clearInterval(interval);
  }, []);

   const handleQuerySubmit = async (query, selectedLanguage) => {
    try {
      const res = await fetch("http://localhost:8000/parse_and_map/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          selected_language: selectedLanguage // 🌟 SEND selected_language here
        }),
      });

      if (!res.ok) {
        // Handle HTTP errors
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await res.json();
      setResponseData(data);
    } catch (error) {
      console.error("Error submitting query:", error);
      alert(`Failed to get response from server: ${error.message}`);
      // Optionally clear responseData or set an error state
      setResponseData(null);
    }
  };

  return (
    <Router>
      {!isAuthenticated ? (
        <LandingPage 
          paathshalaWord={paathshalaWords[currentWordIndex]}
          onTitleClick={handleTitleClick}
        />
      ) : (
        <div style={{ backgroundColor: 'var(--background-darker)', minHeight: '100vh' }}>
          {serverDown && <div className="offline-banner">Currently Offline</div>}
          <Navbar 
            theme={theme} 
            toggleTheme={toggleTheme} 
            paathshalaWord={paathshalaWords[currentWordIndex]}
            onTitleClick={handleTitleClick}
            onLogout={handleLogout}
            // You can also pass user info to the Navbar
            user={user}
          />
          <Routes>
            <Route
              path="/"
              element={
                !responseData ? (
                  <SearchHome onSubmit={handleQuerySubmit} />
                ) : (
                  <ContentGenerator data={responseData} onBack={() => setResponseData(null)} setResponseData={setResponseData} />
                )
              }
            />
            <Route path="/weekly-calendar" element={<WeeklyPlanner />} />
            <Route path="/resources" element={<SavedResourcesDisplay />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;