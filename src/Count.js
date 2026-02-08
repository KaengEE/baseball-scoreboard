import React, { useState, useEffect } from 'react';

function Count({ game, updateDB, handleUndo }) {
  const [tempCounts, setTempCounts] = useState({ 
    balls: 0, 
    strikes: 0, 
    outs: 0,
    inning: 1,
    isTop: true 
  });

  useEffect(() => {
    if (game) {
      setTempCounts({
        balls: game.balls,
        strikes: game.strikes,
        outs: game.outs,
        inning: game.inning,
        isTop: game.isTop
      });
    }
  }, [game]);

  if (!game) return null;

  // --- 1. 실시간 로직 복구 ---
  
  const handleBall = () => {
    if (game.balls >= 3) {
      // 4볼 시 1루 주자 점등 및 카운트 초기화
      let newBases = [...game.bases];
      newBases[0] = true;
      updateDB({
        balls: 0,
        strikes: 0,
        bases: newBases
      });
    } else {
      updateDB({ balls: game.balls + 1 });
    }
  };

  const handleStrike = () => {
    if (game.strikes >= 2) {
      handleOut(); // 3스트라이크 시 아웃 로직 실행
    } else {
      updateDB({ strikes: game.strikes + 1 });
    }
  };

  const handleOut = () => {
    if (game.outs >= 2) {
      // 3아웃 시 이닝 교대 및 베이스 초기화
      const isFinishingBottom = !game.isTop;
      updateDB({
        balls: 0,
        strikes: 0,
        outs: 0,
        bases: [false, false, false],
        isTop: !game.isTop,
        inning: isFinishingBottom ? game.inning + 1 : game.inning
      });
    } else {
      // 일반 아웃 시 카운트만 초기화
      updateDB({ 
        outs: game.outs + 1,
        balls: 0,
        strikes: 0 
      });
    }
  };

  // --- 2. 수동 조절 로직 ---
  const adjustValue = (type, delta) => {
    setTempCounts(prev => {
      let newVal = prev[type] + delta;
      if (type === 'balls' && (newVal < 0 || newVal > 3)) return prev;
      if (type === 'strikes' && (newVal < 0 || newVal > 2)) return prev;
      if (type === 'outs' && (newVal < 0 || newVal > 2)) return prev;
      if (type === 'inning' && newVal < 1) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  const toggleIsTop = () => {
    setTempCounts(prev => ({ ...prev, isTop: !prev.isTop }));
  };

  const handleApply = () => {
    updateDB({
      balls: tempCounts.balls,
      strikes: tempCounts.strikes,
      outs: tempCounts.outs,
      inning: tempCounts.inning,
      isTop: tempCounts.isTop
    });
    alert("이닝 및 카운트 수정 사항이 Overlay에 적용되었습니다.");
  };

  return (
    <section className="control-section">
      <div className="status-display">
        <h4>현재 상황: {game.inning}회 {game.isTop ? '초' : '말'}</h4>
      </div>
      
      {/* 1. 실시간 버튼 구역 (즉시 반영) */}
      <div className="count-buttons" style={{ marginBottom: '30px' }}>
        <button onClick={handleBall} className="btn-ball">BALL: {game.balls}</button>
        <button onClick={handleStrike} className="btn-strike">STRIKE: {game.strikes}</button>
        <button onClick={handleOut} className="btn-out">OUT: {game.outs}</button>
        {/* <button onClick={handleUndo} className="btn-undo">↩ 실행 취소</button> */}
      </div>

      <hr style={{ border: '1px dashed #ccc', margin: '20px 0' }} />

      {/* 2. 수동 수정 섹션 */}
      <div className="manual-section">
        <h5 style={{ marginBottom: '15px', color: '#666' }}>⚙️ 경기 상황 정밀 수정</h5>
        
        <div className="inning-adjust-row" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div className="manual-adjust-box" style={{ flex: 2 }}>
            <button onClick={() => adjustValue('inning', -1)} className="btn-step">-</button>
            <div className="display-num">{tempCounts.inning}회</div>
            <button onClick={() => adjustValue('inning', 1)} className="btn-step">+</button>
          </div>
          <button 
            onClick={toggleIsTop} 
            className={`btn-isTop ${tempCounts.isTop ? 'top' : 'bottom'}`}
            style={{ flex: 1, height: '60px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {tempCounts.isTop ? '초 (Away공격)' : '말 (Home공격)'}
          </button>
        </div>

        <div className="count-control-grid">
          {['balls', 'strikes', 'outs'].map((type) => (
            <div key={type} className="count-group">
              <div className="manual-adjust-box">
                <button onClick={() => adjustValue(type, -1)} className="btn-step">-</button>
                <div className="display-num">
                  {type === 'balls' ? 'B' : type === 'strikes' ? 'S' : 'O'}: {tempCounts[type]}
                </div>
                <button onClick={() => adjustValue(type, 1)} className="btn-step">+</button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleApply} className="btn-apply-all">
          수정 내용 반영하기 (이닝 포함)
        </button>
      </div>
    </section>
  );
}

export default Count;