import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './Admin';
import Overlay from './Overlay';
import './App.css';
import PasswordProtect from './PasswordProtect';

function App() {
  return (
    <PasswordProtect>
    <Router>
      <div className="App">
        <Routes>
          {/* 방송 전용 (OBS 브라우저 소스용) */}
          <Route path="/overlay" element={<Overlay />} />
          
          {/* 관리자 전용 */}
          <Route path="/admin" element={<Admin />} />

          {/* 통합 대시보드 (위: Overlay / 아래: Admin) */}
          <Route path="/" element={
            <div className="dashboard-container">
              <div className="monitor-section">
                <h3 className="section-label">LIVE MONITOR (방송 송출 화면)</h3>
                <Overlay />
              </div>
              <div className="control-section">
                <h3 className="section-label">CONTROLLER (관리자 조작)</h3>
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