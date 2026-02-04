import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SimplifiedSierraROICalculator from './SierraROIApp';
import SierraRoadmapCEO from './SierraRoadmap';

function Nav() {
  return (
    <nav style={{
      background: '#1a1a2e',
      padding: '10px 24px',
      display: 'flex',
      gap: 24,
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
    }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginRight: 16 }}>Sierra Tools</span>
      <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>ROI Calculator</Link>
      <Link to="/roadmap" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Product Roadmap</Link>
    </nav>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<SimplifiedSierraROICalculator />} />
        <Route path="/roadmap" element={<SierraRoadmapCEO />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
