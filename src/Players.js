import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Players.css';

/*
1.볼, 스크라이크, 아웃 카운트 잘못 눌렀을 때 되돌리기 버튼 추가하기(취소버튼)

2.선수 표시는 순서대로
1~9 가 있고
순서가 변경될 수 있어서 드래그 형식으로
순서 이동 가능하게 해야함

3. overlay 화면에 선수 리스트 보여주기(실시간)

4.선수 리스트에서 타자, 투수 선택버튼 추가하기

5. overlay 화면 디자인

*/


// --- 1. 개별 선수 셀 컴포넌트 ---
function SortablePlayerRow({ id, player, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`player-cell ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      <div className="cell-index">{index + 1}</div>
      <div className="cell-content"><span className="player-name-text">{player}</span></div>
      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(player)} className="cell-delete-btn">×</button>
    </div>
  );
}

// ★ public/logos 폴더에 있는 파일명 리스트 (확장자 포함) ★
const publicLogos = [
  "kia.png", "samsung.png", "lg.png", "doosan.png", "lotte.png", 
  "ssg.png", "kt.png", "hanwha.png", "kiwoom.png", "nc.png"
];

// --- 2. 메인 Players 컴포넌트 ---
function Players({ game, allTeams, updateDB }) {
  const [teamInputs, setTeamInputs] = useState({ awayName: "", homeName: "" });
  const [newPlayerInputs, setNewPlayerInputs] = useState({ away: "", home: "" });
  const [localLogos, setLocalLogos] = useState([]); // 파일 추가로 등록한 로고들

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }));

  useEffect(() => {
    if (game) {
      setTeamInputs({
        awayName: game.awayName || "",
        homeName: game.homeName || ""
      });
    }

    const savedLogos = localStorage.getItem('baseball_local_logos');
    if (savedLogos) {
      setLocalLogos(JSON.parse(savedLogos));
    }
  }, [game]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const newLogo = { id: Date.now(), url: base64String, name: file.name };
      const updatedList = [...localLogos, newLogo];
      setLocalLogos(updatedList);
      localStorage.setItem('baseball_local_logos', JSON.stringify(updatedList));
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const handleDeleteLocalLogo = (e, logoId) => {
    e.stopPropagation();
    if (!window.confirm("보관함에서 삭제할까요?")) return;
    const updatedList = localLogos.filter(l => l.id !== logoId);
    setLocalLogos(updatedList);
    localStorage.setItem('baseball_local_logos', JSON.stringify(updatedList));
  };

  const handleDragEnd = async (event, team) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = team.players.indexOf(active.id);
      const newIndex = team.players.indexOf(over.id);
      const newOrder = arrayMove(team.players, oldIndex, newIndex);
      await updateDoc(doc(db, "teams", team.id), { players: newOrder });
    }
  };

  const handleAddPlayer = async (teamId, type) => {
    const name = newPlayerInputs[type];
    if (!name) return;
    await updateDoc(doc(db, "teams", teamId), { players: arrayUnion(name) });
    setNewPlayerInputs(prev => ({ ...prev, [type]: "" }));
  };

  const handleRemovePlayer = async (teamId, playerName) => {
    if (!window.confirm(`${playerName} 선수를 삭제할까요?`)) return;
    const team = allTeams.find(t => t.id === teamId);
    const newOrder = team.players.filter(p => p !== playerName);
    await updateDoc(doc(db, "teams", teamId), { players: newOrder });
  };

  const renderTeamBox = (team, type) => {
    const logoKey = `${type}Logo`;
    const nameKey = `${type}Name`;

    return (
      <div className="team-manage-box">
        <div className="team-info-inputs">
          <div className="name-apply-group">
            <input 
              type="text" 
              placeholder="팀 이름" 
              value={teamInputs[nameKey]} 
              onChange={(e) => setTeamInputs({...teamInputs, [nameKey]: e.target.value})}
            />
            <button onClick={() => updateDB({ [nameKey]: teamInputs[nameKey] })}>이름 적용</button>
          </div>
          
          <div className="logo-library-section">
            <h6>📂 로고 리스트 (Public)</h6>
            <div className="logo-grid">
              {publicLogos.map((fileName) => {
                const url = `/logos/${fileName}`;
                return (
                  <div 
                    key={fileName} 
                    className={`logo-item ${game[logoKey] === url ? 'selected' : ''}`}
                    onClick={() => updateDB({ [logoKey]: url })}
                  >
                    <img src={url} alt={fileName} />
                  </div>
                );
              })}
            </div>
            <div className="logo-grid">
              {localLogos.map((logo) => (
                <div 
                  key={logo.id} 
                  className={`logo-item ${game[logoKey] === logo.url ? 'selected' : ''}`}
                  onClick={() => updateDB({ [logoKey]: logo.url })}
                >
                  <img src={logo.url} alt="logo" />
                  <button className="logo-del-mini" onClick={(e) => handleDeleteLocalLogo(e, logo.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="team-header-mini">
          {game[logoKey] && <img src={game[logoKey]} alt="logo" className="mini-logo" />}
          <h5>{game[nameKey] || "팀명 미설정"}</h5>
        </div>

        {team && (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, team)}>
              <SortableContext items={team.players || []} strategy={verticalListSortingStrategy}>
                <div className="player-table-container">
                  {team.players?.map((player, index) => (
                    <SortablePlayerRow 
                      key={player} 
                      id={player} 
                      player={player} 
                      index={index} 
                      onRemove={(name) => handleRemovePlayer(team.id, name)} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="add-player-form">
              <input 
                type="text" 
                placeholder="선수 추가" 
                value={newPlayerInputs[type]} 
                onChange={(e) => setNewPlayerInputs(prev => ({ ...prev, [type]: e.target.value }))} 
              />
              <button onClick={() => handleAddPlayer(team.id, type)}>추가</button>
            </div>
          </>
        )}
      </div>
    );
  };

  const awayTeam = allTeams.find(t => t.id === game.awayId);
  const homeTeam = allTeams.find(t => t.id === game.homeId);

  return (
    <section className="entry-management-section">
      <div className="management-grid">
        {renderTeamBox(awayTeam, 'away')}
        {renderTeamBox(homeTeam, 'home')}
      </div>
    </section>
  );
}

export default Players;