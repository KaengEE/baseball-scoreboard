import React, { useState, useEffect } from "react";
import "./count.css";

function Count({ game, updateDB, handleUndo }) {
  // 1. 기존 카운트 상태
  const [tempCounts, setTempCounts] = useState({
    balls: 0,
    strikes: 0,
    outs: 0,
    inning: 1,
    isTop: true,
    awayScore: 0,
    homeScore: 0,
  });

  // 2. 팀 로고 관리를 위한 로컬 상태 추가
  const logoFiles = [
    { name: "기아", path: process.env.PUBLIC_URL + "/logos/kia.png" },
    { name: "기아2", path: process.env.PUBLIC_URL + "/logos/kia2.png" },
    { name: "롯데", path: process.env.PUBLIC_URL + "/logos/lotte.png" },
    { name: "삼성", path: process.env.PUBLIC_URL + "/logos/samsung.png" },
    { name: "두산", path: process.env.PUBLIC_URL + "/logos/doosan.png" },
    { name: "LG", path: process.env.PUBLIC_URL + "/logos/lg.png" },
    { name: "SSG", path: process.env.PUBLIC_URL + "/logos/ssg.png" },
    { name: "NC", path: process.env.PUBLIC_URL + "/logos/nc.png" },
    { name: "키움", path: process.env.PUBLIC_URL + "/logos/kiwoom.png" },
    { name: "KT", path: process.env.PUBLIC_URL + "/logos/kt.png" },
    { name: "한화", path: process.env.PUBLIC_URL + "/logos/hanhwa.png" },
  ];

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
        homeScore: game.homeScore || 0,
      });
    }
  }, [game]);

  if (!game) return null;

  // 실시간 조절 및 카운트 로직
  const handleLiveAdjust = (type, delta) => {
    const currentVal = game[type] || 0;
    const newVal = currentVal + delta;
    if ((type === "awayScore" || type === "homeScore") && newVal < 0) return;
    if (type === "inning" && newVal < 1) return;
    if (type === "balls" && (newVal < 0 || newVal > 3)) return;
    if (type === "strikes" && (newVal < 0 || newVal > 2)) return;
    if (type === "outs" && (newVal < 0 || newVal > 2)) return;
    updateDB({ [type]: newVal });
  };

  const handleLiveToggleTop = () => updateDB({ isTop: !game.isTop });

  const handleBall = () => {
    if (game.balls >= 3) {
      // 4 balls
      let newBases = [...game.bases];

      if (!newBases[0]) {
        // 1. 주자 없을 때 4볼 -> 1루만 채움
        newBases[0] = true;
      } else if (newBases[0] && !newBases[1]) {
        // 2. 1루에만 주자 있을 때 -> 1루, 2루 채움
        newBases[1] = true;
      } else if (newBases[0] && newBases[1] && !newBases[2]) {
        // 3. 1, 2루에 주자 있을 때 -> 1, 2, 3루 모두 채움
        newBases[2] = true;
      } else if (newBases[0] && newBases[1] && newBases[2]) {
        // 4. 만루일 때 4볼 -> 밀어내기 득점
        if (game.isTop) {
          updateDB({
            awayScore: game.awayScore + 1,
            balls: 0,
            strikes: 0,
          });
        } else {
          updateDB({
            homeScore: game.homeScore + 1,
            balls: 0,
            strikes: 0,
          });
        }
        return;
      }
      // 상태 업데이트 (카운트 초기화 및 베이스 변경)
      updateDB({ balls: 0, strikes: 0, bases: newBases });
    } else {
      updateDB({ balls: game.balls + 1 });
    }
    console.log(game.balls);
  };

  const handleStrike = () => {
    if (game.strikes >= 2) handleOut();
    else updateDB({ strikes: game.strikes + 1 });
  };

  const handleOut = () => {
    if (game.outs >= 2) {
      const isFinishingBottom = !game.isTop;
      updateDB({
        balls: 0,
        strikes: 0,
        outs: 0,
        bases: [false, false, false],
        isTop: !game.isTop,
        inning: isFinishingBottom ? game.inning + 1 : game.inning,
      });
    } else {
      updateDB({ outs: game.outs + 1, balls: 0, strikes: 0 });
    }
  };

  // 로고 선택
  const selectLogo = (type, path) => {
    const fieldName = type === "away" ? "awayLogo" : "homeLogo";
    updateDB({ [fieldName]: path });
  };

  const adjustTemp = (type, delta) => {
    setTempCounts((prev) => {
      let newVal = prev[type] + delta;
      if (newVal < 0) return prev;
      if (type === "balls" && newVal > 3) return prev;
      if (type === "strikes" && newVal > 2) return prev;
      if (type === "outs" && newVal > 2) return prev;
      if (type === "inning" && newVal < 1) return prev;
      return { ...prev, [type]: newVal };
    });
  };

  // 팝업삭제요청
  // const handleApplyAll = () => {
  //   updateDB(tempCounts);
  //   alert("모든 수정 내용이 적용되었습니다.");
  // };

  return (
    <>
      <section className="control-section">
        {/* 점수 및 이닝 */}
        <div className="status-display">
          <h4>
            {game.awayScore} : {game.homeScore} | {game.inning} 회{" "}
            {game.isTop ? "초" : "말"}
          </h4>
        </div>

        {/* 실시간 점수/이닝 조절*/}
        <div
          className="score-quick-buttons"
          style={{ display: "flex", gap: "15px", marginBottom: "20px" }}
        >
          <div
            className="manual-adjust-box"
            style={{
              flex: 1,
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
            }}
          >
            <button
              onClick={() => handleLiveAdjust("awayScore", -1)}
              className="btn-step"
            >
              -
            </button>
            <div className="display-num">{game.awayScore}</div>
            <button
              onClick={() => handleLiveAdjust("awayScore", 1)}
              className="btn-step"
            >
              +
            </button>
          </div>
          <div
            className="manual-adjust-box"
            style={{
              flex: 1,
              backgroundColor: "#d1ecf1",
              border: "1px solid #bee5eb",
            }}
          >
            <button
              onClick={() => handleLiveAdjust("homeScore", -1)}
              className="btn-step"
            >
              -
            </button>
            <div className="display-num">{game.homeScore}</div>
            <button
              onClick={() => handleLiveAdjust("homeScore", 1)}
              className="btn-step"
            >
              +
            </button>
          </div>
        </div>

        <div
          className="inning-adjust-row"
          style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
        >
          <div className="manual-adjust-box" style={{ flex: 2 }}>
            <button
              onClick={() => handleLiveAdjust("inning", -1)}
              className="btn-step"
            >
              -
            </button>
            <div className="display-num">{game.inning}회</div>
            <button
              onClick={() => handleLiveAdjust("inning", 1)}
              className="btn-step"
            >
              +
            </button>
          </div>
          <button
            onClick={handleLiveToggleTop}
            className={`btn-isTop ${game.isTop ? "top" : "bottom"}`}
            style={{
              flex: 1,
              height: "60px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {game.isTop ? `초 (원정 공격)` : `말 (홈 공격)`}
          </button>
        </div>

        <div className="count-buttons" style={{ marginBottom: "25px" }}>
          <button onClick={handleBall} className="btn-ball">
            BALL: {game.balls}
          </button>
          <button onClick={handleStrike} className="btn-strike">
            STRIKE: {game.strikes}
          </button>
          <button onClick={handleOut} className="btn-out">
            OUT: {game.outs}
          </button>
        </div>

        <hr className="divider" />
        <div className="manual-section">
          <h5 className="section-title">⚙️ 일괄 수정 (적용하기 클릭 필수)</h5>
          <div className="count-control-grid">
            {["balls", "strikes", "outs"].map((type) => (
              <div key={type} className="count-group">
                <div className="manual-adjust-box">
                  <button
                    onClick={() => adjustTemp(type, -1)}
                    className="btn-step"
                  >
                    -
                  </button>
                  <div className="display-num">
                    {type === "balls" ? "B" : type === "strikes" ? "S" : "O"}:{" "}
                    {tempCounts[type]}
                  </div>
                  <button
                    onClick={() => adjustTemp(type, 1)}
                    className="btn-step"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* onClick={handleApplyAll} 삭제*/}
          <button className="btn-apply-all">적용하기</button>
        </div>
      </section>

      <hr className="divider" />
      {/* 로고 선택 섹션 (3x3 리스트) */}
      <div className="logo-selection-admin">
        <div
          className="logo-selection-container"
          style={{ display: "flex", gap: "20px" }}
        >
          {["away", "home"].map((type) => (
            <div key={type} className="logo-picker-box" style={{ flex: 1 }}>
              <p
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                {type === "away" ? "왼쪽 로고" : "오른쪽 로고"}
              </p>
              <div
                className="logo-grid-3x3"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "5px",
                }}
              >
                {logoFiles.map((logo) => (
                  <button
                    key={`${type}-${logo.name}`}
                    className={`logo-item ${game[`${type}Logo`] === logo.path ? "selected" : ""}`}
                    onClick={() => selectLogo(type, logo.path)}
                    style={{
                      padding: "5px",
                      border:
                        game[`${type}Logo`] === logo.path
                          ? "2px solid #007bff"
                          : "1px solid #ddd",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor:
                        game[`${type}Logo`] === logo.path ? "#e7f1ff" : "#fff",
                    }}
                  >
                    <img
                      src={logo.path}
                      alt={logo.name}
                      style={{
                        width: "30px",
                        height: "30px",
                        objectFit: "contain",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Count;
