// src/App.js (REMPLACE complètement ton App.js actuel)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage';
import SkinCareApp from './components/SkinCareApp';

function App() {
  return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/skincare" element={<SkinCareApp />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;