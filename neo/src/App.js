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
  
  const handleQuerySubmit = async (query) => {
    const res = await fetch("http://localhost:8000/parse_and_map/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: query }),
    });
    const data = await res.json();
    setResponseData(data);
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
                <ContentGenerator data={responseData} onBack={() => setResponseData(null)} />
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