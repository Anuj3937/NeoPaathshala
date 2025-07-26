import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchHome from './components/SearchHome';
import ContentGenerator from './components/ContentGenerator';
import WeeklyPlanner from './components/WeeklyPlanner';
import SavedResourcesDisplay from './components/Resources';

function App() {
  const [responseData, setResponseData] = useState(null);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  
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
      <div style={{ backgroundColor: 'var(--background-darker)', minHeight: '100vh' }}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route
            path="/"
            element={
              !responseData ? (
                <SearchHome onSubmit={handleQuerySubmit} />
              ) : (
                <ContentGenerator
                  data={responseData}
                  onBack={() => setResponseData(null)}
                  // 🌟 ADD THIS LINE: Pass setResponseData as a prop
                  setResponseData={setResponseData}
                />
              )
            }
          />
          <Route path="/weekly-calendar" element={<WeeklyPlanner />} />
          <Route path="/resources" element={<SavedResourcesDisplay/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;