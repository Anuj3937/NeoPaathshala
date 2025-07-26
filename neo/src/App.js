import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchHome from './components/SearchHome';
import ContentGenerator from './components/ContentGenerator';
import WeeklyPlanner from './components/WeeklyPlanner';
import SavedResourcesDisplay from './components/Resources';

function App() {
  const [responseData, setResponseData] = useState(null);
  const [serverDown, setServerDown] = useState(false);

  const handleQuerySubmit = async (query) => {
    try {
      const res = await fetch("http://localhost:8000/parse_and_map/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      if (!res.ok) {
        // This will be caught by the catch block
        throw new Error('Server not responding');
      }
      const data = await res.json();
      setResponseData(data);
      setServerDown(false); // Server is up, so ensure message is hidden
    } catch (error) {
      console.error("Error submitting query:", error);
      setServerDown(true); // Server is down, show the message
    }
  };

  // This effect runs once on component mount to check server status periodically
  useEffect(() => {
    const healthCheck = async () => {
      try {
        // Assuming your FastAPI has a root endpoint for health checks
        const res = await fetch("http://localhost:8000/");
        if (!res.ok) {
          throw new Error('Server not responding');
        }
        // If the fetch is successful, the server is up
        setServerDown(false);
      } catch (error) {
        // If the fetch fails, the server is down
        console.error("Health check failed:", error);
        setServerDown(true);
      }
    };

    healthCheck(); // Run an initial check when the app loads
    const interval = setInterval(healthCheck, 30000); // Check every 30 seconds

    // Cleanup function to clear the interval when the component is unmounted
    return () => clearInterval(interval);
  }, []);


  return (
    <Router>
      <div style={{ backgroundColor: '#4b5563', minHeight: '100vh' }}>
        {/* Pass the server status to the Navbar */}
        <Navbar serverDown={serverDown} />
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