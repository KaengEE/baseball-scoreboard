import React, { useState, useEffect } from 'react';

function Count({ game, updateDB, handleUndo }) {
  // 수동 수정 섹션을 위한 로컬 상태 (필요 시 유지)
  const [tempCounts, setTempCounts] = useState({ 
    balls: 0, strikes: 0, outs: 0, inning: 1, isTop: true, awayScore: 0, homeScore: 0 
  });

  // DB 데이터 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (game) {
      setTempCounts({
        balls: game.balls,
        strikes: game.strikes,
        outs: game.outs,
        inning: game.inning,
        isTop: game.isTop,
        awayScore: game.awayScore || 0,
        homeScore: game.homeScore || 0
      });
    }
  }, [game]);

  if (!game) return null;

  // --- 1. 실시간 로직 (DB 즉시 반영) ---

  // 점수 및 이닝 실시간 조절 함수
  const handleLiveAdjust = (type, delta) => {
    const currentVal = game[type] || 0;
    const newVal = currentVal + delta;

    // 제한 로직 (점수/이닝 0 또는 1 미만 방지)
    if ((type === 'awayScore' || type === 'homeScore') && newVal < 0) return;
    if (type === 'inning' && newVal < 1) return;
    if (type === 'balls' && (newVal < 0 || newVal > 3)) return;
    if (type === 'strikes' && (newVal < 0 || newVal > 2)) return;
    if (type === 'outs' && (newVal < 0 || newVal > 2)) return;

    updateDB({ [type]: newVal });
  };

  // 초/말 실시간 토글
  const handleLiveToggleTop = () => {
    updateDB({ isTop: !game.isTop });
  };

  const handleBall = () => {
    if (game.balls >= 3) {
      let newBases = [...game.bases];
      newBases[0] = true;
      updateDB({ balls: 0, strikes: 0, bases: newBases });
    } else {
      updateDB({ balls: game.balls + 1 });
    }
  };

  const handleStrike = () => {
    if (game.strikes >= 2) {
      handleOut();
    } else {
      updateDB({ strikes: game.strikes + 1 });
    }
  };

  const handleOut = () => {
    if (game.outs >= 2) {
      const isFinishingBottom = !game.isTop;
      updateDB({
        balls: 0, strikes: 0, outs: 0,
        bases: [false, false, false],
        isTop: !game.isTop,
        inning: isFinishingBottom ? game.inning + 1 : game.inning
      });
    } else {
      updateDB({ outs: game.outs + 1, balls: 0, strikes: 0 });
    }
  };

  // --- 2. 정밀 수정 반영 로직 (하단 섹션용) ---
  const adjustTemp = (type, delta) => {
    setTempCounts(prev => {
      let newVal = prev[type] + delta;
      if (type === 'inning' && newVal < 1) return prev;
      if ((type === 'awayScore' || type === 'homeScore') && newVal < 0) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const handleApplyAll = () => {
    updateDB(tempCounts);
    alert("모든 수정 내용이 적용되었습니다.");
  };

  return (
    <section className="control-section">
      {/* 현재 상태 헤더 */}
      <div className="status-display">
        <h4>
          {game.inning}회 {game.isTop ? '초' : '말'} | {game.awayName || "원정"} {game.awayScore} : {game.homeScore} {game.homeName || "홈"}
        </h4>
      </div>

      {/* 실시간 점수 조절 (즉시 반영) */}
      <div className="score-quick-buttons" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div className="manual-adjust-box" style={{ flex: 1, backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
          <span className="label">{game.awayName || "AWAY"}</span>
          <button onClick={() => handleLiveAdjust('awayScore', -1)} className="btn-step">-</button>
          <div className="display-num">{game.awayScore}</div>
          <button onClick={() => handleLiveAdjust('awayScore', 1)} className="btn-step">+</button>
        </div>

        <div className="manual-adjust-box" style={{ flex: 1, backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
          <span className="label">{game.homeName || "HOME"}</span>
          <button onClick={() => handleLiveAdjust('homeScore', -1)} className="btn-step">-</button>
          <div className="display-num">{game.homeScore}</div>
          <button onClick={() => handleLiveAdjust('homeScore', 1)} className="btn-step">+</button>
        </div>
      </div>

      {/* 이닝 실시간 조절 */}
      <div className="inning-adjust-row" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div className="manual-adjust-box" style={{ flex: 2 }}>
          <button onClick={() => handleLiveAdjust('inning', -1)} className="btn-step">-</button>
          <div className="display-num">{game.inning}회</div>
          <button onClick={() => handleLiveAdjust('inning', 1)} className="btn-step">+</button>
        </div>
        <button 
          onClick={handleLiveToggleTop} 
          className={`btn-isTop ${game.isTop ? 'top' : 'bottom'}`}
          style={{ flex: 1, height: '60px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {game.isTop ? `초 (${game.awayName || "원정"} 공격)` : `말 (${game.homeName || "홈"} 공격)`}
        </button>
      </div>
      
      {/* 실시간 카운트 버튼 */}
      <div className="count-buttons" style={{ marginBottom: '25px' }}>
        <button onClick={handleBall} className="btn-ball">BALL: {game.balls}</button>
        <button onClick={handleStrike} className="btn-strike">STRIKE: {game.strikes}</button>
        <button onClick={handleOut} className="btn-out">OUT: {game.outs}</button>
      </div>

      <hr className="divider" />

      {/* 하단 정밀 수정 섹션 (선택 사항) */}
      <div className="manual-section">
        <h5 className="section-title">⚙️ 하단 일괄 수정 (필요 시 사용)</h5>
        <div className="count-control-grid">
          {['balls', 'strikes', 'outs'].map((type) => (
            <div key={type} className="count-group">
              <div className="manual-adjust-box">
                <button onClick={() => adjustTemp(type, -1)} className="btn-step">-</button>
                <div className="display-num">
                  {type === 'balls' ? 'B' : type === 'strikes' ? 'S' : 'O'}: {tempCounts[type]}
                </div>
                <button onClick={() => adjustTemp(type, 1)} className="btn-step">+</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleApplyAll} className="btn-apply-all">
          정밀 수정 내용 한 번에 반영하기
        </button>
      </div>
    </section>
  );
}

export default Count;