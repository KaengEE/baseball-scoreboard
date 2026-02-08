import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { doc, updateDoc, onSnapshot, collection } from "firebase/firestore";
import Players from './Players';
import Count from './Count';
import './Admin.css';

function Admin() {
  const [game, setGame] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  // 단일 기록(prevGameData) 대신 배열(historyStack)을 사용하여 여러 번 되돌리기 구현
  const [historyStack, setHistoryStack] = useState([]);

  useEffect(() => {
    // 1. 경기 상황 실시간 구독
    const unsubGame = onSnapshot(doc(db, "baseball", "current"), (snapshot) => {
      if (snapshot.exists()) setGame(snapshot.data());
    });

    // 2. 모든 팀 데이터 실시간 구독 (순서 변경 시 화면 즉시 반영을 위해 필수)
    const unsubTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsArray = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setAllTeams(teamsArray);
    });

    return () => {
      unsubGame();
      unsubTeams();
    };
  }, []);

  // 공통 업데이트 함수 (History Stack 기록 포함)
  const updateDB = async (newData) => {
    // 업데이트 전 현재 상태를 스택에 저장 (최근 10개 기록 유지)
    setHistoryStack(prev => {
      const newStack = [...prev, game];
      return newStack.slice(-10); // 최대 10개까지만 보관
    });

    await updateDoc(doc(db, "baseball", "current"), newData);
  };

  const resetGame = async () => {
    if (window.confirm("경기를 초기화하시겠습니까? 모든 점수와 카운트가 0이 됩니다.")) {
      await updateDoc(doc(db, "baseball", "current"), {
        awayScore: 0, 
        homeScore: 0,
        balls: 0, 
        strikes: 0, 
        outs: 0,
        inning: 1, 
        isTop: true,
        bases: [false, false, false],
        pitcherName: "", 
        batterName: ""
      });
      setHistoryStack([]); // 초기화 시 기록도 비움
    }
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return alert("되돌릴 기록이 없습니다.");

    // 스택에서 마지막 데이터 꺼내기
    const lastState = historyStack[historyStack.length - 1];
    
    // DB 업데이트
    await updateDoc(doc(db, "baseball", "current"), lastState);
    
    // 사용한 기록은 스택에서 제거
    setHistoryStack(prev => prev.slice(0, -1));
  };

  if (!game || allTeams.length === 0) return <div className="loading">데이터 로딩 중...</div>;

  return (
    <div className="admin-container">
      <div className="header">
        <h2>⚾ 경기 관리자 모드</h2>
        <div className="header-btns">
          <button onClick={handleUndo} className="undo-btn">↩ 되돌리기 ({historyStack.length})</button>
          <button onClick={resetGame} className="reset-btn">경기 초기화</button>
        </div>
      </div>

      {/* 실시간 카운트 및 이닝 관리 */}
      <Count 
        game={game} 
        updateDB={updateDB} 
        handleUndo={handleUndo} 
      />

      {/* 주자 수동 조작 섹션 */}
      <section className="control-section">
        <h5 style={{marginBottom: '10px', color: '#666'}}>🏃 주자 상황 (클릭하여 켜고 끄기)</h5>
        <div className="base-row">
          {game.bases.map((isOn, i) => (
            <button 
              key={i} 
              className={`base-btn ${isOn ? 'active' : ''}`} 
              onClick={() => {
                let b = [...game.bases]; 
                b[i] = !b[i]; 
                updateDB({ bases: b });
              }}
            >
              {i + 1}루 {isOn ? '●' : '○'}
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* 선수 명단 및 타순 관리 (DND 적용된 컴포넌트) */}
      <Players 
        game={game}
        allTeams={allTeams}  
        updateDB={updateDB}
      />
    </div>
  );
}

export default Admin;