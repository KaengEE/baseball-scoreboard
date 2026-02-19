import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { doc, getDoc } from "firebase/firestore";
import './PasswordProtect.css';

function PasswordProtect({ children }) {
  const [isAuth, setIsAuth] = useState(sessionStorage.getItem("site_auth") === "true");
  const [inputPw, setInputPw] = useState("");
  const [masterPw, setMasterPw] = useState(""); 
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchPassword = async () => {
    try {
      const docRef = doc(db, "setting", "admin");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterPw(data.adminPassword); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchPassword();
}, []);

  const handleLogin = () => {
    // 타입 일치
    if (masterPw !== undefined && String(inputPw) === String(masterPw)) {
      sessionStorage.setItem("site_auth", "true");
      setIsAuth(true);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
      setInputPw("");
    }
  };

  if (isLoading) return <div className="loading">보안 설정을 불러오는 중...</div>;

  if (!isAuth) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <h2>🔐 접근 제한</h2>
          <p>이 사이트를 이용하려면 비밀번호가 필요합니다.</p>
          <input 
            type="password" 
            value={inputPw}
            onChange={(e) => setInputPw(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호 입력"
            autoFocus
          />
          <button onClick={handleLogin}>접속하기</button>
        </div>
      </div>
    );
  }

  return children;
}

export default PasswordProtect;