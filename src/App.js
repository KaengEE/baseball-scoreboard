import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './Admin';
import Overlay from './Overlay';
import './App.css';
import PasswordProtect from './PasswordProtect';

function App() {
  return (
    <PasswordProtect>
      <Router basename={process.env.PUBLIC_URL}> 
        <div className="App">
          <Routes>
            <Route path="/overlay" element={<Overlay />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={
              <div className="dashboard-container">
                <div className="monitor-section">
                  <h3 className="section-label">LIVE MONITOR</h3>
                  <Overlay />
                </div>
                <div className="control-section">
                  <h3 className="section-label">CONTROLLER</h3>
                  <Admin />
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </PasswordProtect>
  );
}
export default App;