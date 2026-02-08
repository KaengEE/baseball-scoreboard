import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import './Overlay.css';

function Overlay() {
  const [game, setGame] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    // 1. 경기 데이터 실시간 구독 (팀 이름, 점수, 로고 포함)
    const unsub = onSnapshot(doc(db, "baseball", "current"), (snapshot) => {
      if (snapshot.exists()) setGame(snapshot.data());
    });

    // 2. 전체 팀 데이터 (선수 명단 확인용)
    const fetchTeams = async () => {
      const querySnapshot = await getDocs(collection(db, "teams"));
      setAllTeams(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchTeams();
    return () => unsub();
  }, []);

  if (!game || allTeams.length === 0) return <div className="loading">Loading...</div>;

  // 선수 명단을 가져오기 위한 팀 객체 찾기
  const awayTeamData = allTeams.find(t => t.id === game.awayId);
  const homeTeamData = allTeams.find(t => t.id === game.homeId);

  return (
    <div className="overlay-canvas">
      <div className="broadcast-container">
        
        {/* 1. 왼쪽: 홈팀 라인업 */}
        <div className="lineup-side left">
          <div className="lineup-header">
            {/* 저장된 로고가 있으면 표시 */}
            {game.homeLogo && <img src={game.homeLogo} className="overlay-mini-logo" alt="L" />}
            {game.homeName || "HOME"}
          </div>
          <div className="player-list">
            {homeTeamData?.players?.slice(0, 9).map((player, index) => (
              <div key={index} className={`player-row ${game.batterName === player ? 'at-bat' : ''}`}>
                <span className="order-num">{index + 1}</span>
                <span className="player-name">{player}</span>
                {/* 현재 타자 표시 아이콘 */}
                {game.batterName === player && <span className="at-bat-indicator">◀</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 2. 중앙: 스코어보드 섹션 */}
        <div className="center-section">
          <div className="scoreboard-wrapper" style={{ backgroundColor: game.bgColor || '#333' }}>
            <div className="team-scores">
              {/* 원정팀 점수 로우 */}
              <div className="score-row">
                <div className="team-info-box">
                  {game.awayLogo && <img src={game.awayLogo} className="score-logo" alt="" />}
                  <span className="team-name-text">{game.awayName || "AWAY"}</span>
                </div>
                <span className="score-num">{game.awayScore}</span>
              </div>
              
              {/* 홈팀 점수 로우 */}
              <div className="score-row">
                <div className="team-info-box">
                  {game.homeLogo && <img src={game.homeLogo} className="score-logo" alt="" />}
                  <span className="team-name-text">{game.homeName || "HOME"}</span>
                </div>
                <span className="score-num">{game.homeScore}</span>
              </div>
            </div>

            {/* 다이아몬드 (주자 상황) */}
            <div className="diamond-container">
              <div className={`base b2 ${game.bases[1] ? 'active' : ''}`}></div>
              <div className={`base b3 ${game.bases[2] ? 'active' : ''}`}></div>
              <div className={`base b1 ${game.bases[0] ? 'active' : ''}`}></div>
              <div className="inning-info">{game.inning}{game.isTop ? '▲' : '▼'}</div>
            </div>

            {/* BSO 카운트 */}
            <div className="bso-container">
              <div className="count-row">
                <span className="label">B</span>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`dot ball ${game.balls > i ? 'active' : ''}`}></div>
                ))}
              </div>
              <div className="count-row">
                <span className="label">S</span>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className={`dot strike ${game.strikes > i ? 'active' : ''}`}></div>
                ))}
              </div>
              <div className="count-row">
                <span className="label">O</span>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className={`dot out ${game.outs > i ? 'active' : ''}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 오른쪽: 원정팀 라인업 */}
        <div className="lineup-side right">
          <div className="lineup-header">
            {game.awayName || "AWAY"}
          </div>
          <div className="player-list">
            {awayTeamData?.players?.slice(0, 9).map((player, index) => (
              <div key={index} className={`player-row ${game.batterName === player ? 'at-bat' : ''}`}>
                <span className="order-num">{index + 1}</span>
                <span className="player-name">{player}</span>
                {game.batterName === player && <span className="at-bat-indicator">▶</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Overlay;