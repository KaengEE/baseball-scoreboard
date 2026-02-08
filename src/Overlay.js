import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import './Overlay.css';

function Overlay() {
  const [game, setGame] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "baseball", "current"), (snapshot) => {
      if (snapshot.exists()) setGame(snapshot.data());
    });

    const fetchTeams = async () => {
      const querySnapshot = await getDocs(collection(db, "teams"));
      setAllTeams(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchTeams();
    return () => unsub();
  }, []);

  if (!game || allTeams.length === 0) return <div className="loading">Loading...</div>;

  const awayTeam = allTeams.find(t => t.id === game.awayId);
  const homeTeam = allTeams.find(t => t.id === game.homeId);

  return (
    /* 1400x1080 고정 컨테이너 */
    <div className="overlay-canvas">
      <div className="broadcast-container">
        
        {/* 1. 왼쪽: 홈팀 라인업 */}
        <div className="lineup-side left">
          <div className="lineup-header">{game.homeName || "HOME"}</div>
          <div className="player-list">
            {homeTeam?.players?.slice(0, 9).map((player, index) => (
              <div key={index} className={`player-row ${game.batterName === player ? 'at-bat' : ''}`}>
                <span className="order-num">{index + 1}</span>
                <span className="player-name">{player}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 중앙: 스코어보드 섹션 */}
        <div className="center-section">
          <div className="scoreboard-wrapper" style={{ backgroundColor: game.bgColor }}>
            <div className="team-scores">
              <div className="score-row">
                <span className="team-label">AWAY</span>
                <span className="team-name-text">{game.awayName}</span>
                <span className="score-num">{game.awayScore}</span>
              </div>
              <div className="score-row">
                <span className="team-label">HOME</span>
                <span className="team-name-text">{game.homeName}</span>
                <span className="score-num">{game.homeScore}</span>
              </div>
            </div>

            <div className="diamond-container">
              <div className={`base b2 ${game.bases[1] ? 'active' : ''}`}></div>
              <div className={`base b3 ${game.bases[2] ? 'active' : ''}`}></div>
              <div className={`base b1 ${game.bases[0] ? 'active' : ''}`}></div>
              <div className="inning-info">{game.inning}{game.isTop ? '▲' : '▼'}</div>
            </div>

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
          <div className="lineup-header">{game.awayName || "AWAY"}</div>
          <div className="player-list">
            {awayTeam?.players?.slice(0, 9).map((player, index) => (
              <div key={index} className={`player-row ${game.batterName === player ? 'at-bat' : ''}`}>
                <span className="order-num">{index + 1}</span>
                <span className="player-name">{player}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Overlay;