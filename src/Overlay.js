import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { doc, onSnapshot, collection } from "firebase/firestore";
import './Overlay.css';

function Overlay() {
  const [game, setGame] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, "baseball", "current"), (snapshot) => {
      if (snapshot.exists()) setGame(snapshot.data());
    });

    const unsubTeams = onSnapshot(collection(db, "teams"), (querySnapshot) => {
      const teamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTeams(teamsData);
    });

    return () => { unsubGame(); unsubTeams(); };
  }, []);

  if (!game) return <div className="loading">경기 데이터를 불러오는 중...</div>;

  const awayTeamData = allTeams.find(t => t.id === game.awayId);
  const homeTeamData = allTeams.find(t => t.id === game.homeId);

  // 표 형식 라인업 렌더링 함수
  const renderLineupTable = (teamData, isRightSide) => {
    const currentPitcher = teamData?.players?.find(p => p.isPitcher);
    const otherPlayers = teamData?.players?.filter(p => !p.isPitcher) || [];

    return (
      <div className={`lineup-side ${isRightSide ? 'right' : 'left'}`}>
        {/* 1. 타자/대기 명단 테이블 */}
        <table className="lineup-table">
          <tbody>
            {[...Array(9)].map((_, index) => {
              const playerObj = otherPlayers[index];
              const isBatter = playerObj?.isBatter;

              // 각 셀 정의
              const roleCell = (
                <td className="col-role" key="role">
                  {isBatter && (
                    <div className="batter-icon-wrapper">
                      <svg viewBox="0 0 24 24" className="batter-icon-svg">
                        <circle cx="12" cy="12" r="8" fill="#f1c40f" />
                      </svg>
                    </div>
                  )}
                </td>
              );
              const numCell = (
                <td className="col-num" key="num">
                  {playerObj ? `${index + 1}.` : ""}
                </td>
              );
              const nameCell = (
                <td className="col-name" key="name">
                  {playerObj?.name || ""}
                </td>
              );

              // 좌우 반전에 따른 순서 결정
              // 왼쪽(Away): [아이콘] [번호] [이름]
              // 오른쪽(Home): [이름] [번호] [아이콘]
              const content = isRightSide 
                ? [numCell,nameCell, roleCell] 
                : [roleCell, numCell, nameCell];

              return (
                <tr key={playerObj?.id || `empty-${index}`} className={isBatter ? "current-batter-row" : ""}>
                  {content}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 2. 하단 투수 고정 섹션 (테이블 분리) */}
        <div className={`pitcher-fixed-section ${isRightSide ? 'right' : 'left'}`}>
          {isRightSide ? (
            <>
              <div className="p-label">P. {currentPitcher?.name || ""}</div>
            </>
          ) : (
            <>
              <div className="p-label">P. {currentPitcher?.name || ""}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overlay-wrapper">
      <div className="overlay-canvas">
        <div className="main-header-scoreboard">
          {/* 1. 원정 팀 로고 영역 */}
          <div className="away-team-zone">
            <div className="home-name-display">
              {game.awayLogo && <img src={game.awayLogo} alt="away-logo" />}
            </div>
          </div>

          {/* 2. 중앙 정보 영역 (점수, 이닝, 공지) */}
          <div className="center-info-zone">
            {/* 점수 가로 정렬 Row */}
            <div className="score-row">
              <div className="score-big">{game.awayScore}</div>
                  {/* 이닝 정보 */}
            <div className="inning-text">
              {game.inning}회 {game.isTop ? '초' : '말'}
            </div>
              <div className="score-big">{game.homeScore}</div>
            </div>
            
            {/* 공지사항 배너 */}
            <div className="notice-banner">
              <p>{game.notice}</p>
            </div>
          </div>

          {/* 3. 홈 팀 이름 영역 */}
          <div className="home-team-zone">
            <div className="home-name-display">{game.awayLogo && <img src={game.homeLogo} alt="away-logo" />}</div>
          </div>
        </div>
        {/* 하단 게임 진행 정보 섹션 */}
        <div className="game-play-area">
          {renderLineupTable(awayTeamData, false)}

          <div className="field-center-wrap">
            <div className="diamond-main">
              <div className={`base b2 ${game.bases[1] ? 'active' : ''}`}></div>
              <div className={`base b3 ${game.bases[2] ? 'active' : ''}`}></div>
              <div className={`base b1 ${game.bases[0] ? 'active' : ''}`}></div>

              <div className="bso-box-vertical">
              <div className="bso-line">
                <span className="bso-label">B</span>
                {[...Array(3)].map((_, i) => <div key={i} className={`dot ball ${game.balls > i ? 'active' : ''}`}></div>)}
              </div>
              <div className="bso-line">
                <span className="bso-label">S</span>
                {[...Array(2)].map((_, i) => <div key={i} className={`dot strike ${game.strikes > i ? 'active' : ''}`}></div>)}
              </div>
              <div className="bso-line">
                <span className="bso-label">O</span>
                {[...Array(2)].map((_, i) => <div key={i} className={`dot out ${game.outs > i ? 'active' : ''}`}></div>)}
              </div>
            </div>
            </div>
          </div>

          {renderLineupTable(homeTeamData, true)}
        </div>
      </div>
    </div>
  );
}

export default Overlay;