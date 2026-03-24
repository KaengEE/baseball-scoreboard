import React, { useState, useEffect } from "react";
import { db } from "./firebase-config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import "./Players.css";

// --- 1. 개별 선수 셀 컴포넌트 ---
function SortablePlayerRow({
  id,
  playerObj,
  index,
  onRemove,
  onRoleChange,
  isCurrentPitcher,
  isCurrentBatter,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 라디오버튼 추가요청(책갈피)
  // 1. 로컬 스토리지에서 상태 불러오기 (1시간 유효성 체크)
  const [isBookmarked, setIsBookmarked] = useState(() => {
    const saved = localStorage.getItem(`bookmark_${id}`);
    if (!saved) return false;

    const { value, expiry } = JSON.parse(saved);
    if (new Date().getTime() > expiry) {
      localStorage.removeItem(`bookmark_${id}`);
      return false;
    }
    return value;
  });

  // 2. 체크박스 변경 핸들러 (1시간 유지 설정)
  const handleBookmarkChange = () => {
    const newValue = !isBookmarked;
    setIsBookmarked(newValue);

    if (newValue) {
      const now = new Date();
      const item = {
        value: true,
        expiry: now.getTime() + 60 * 60 * 1000, // 현재 시간 + 1시간
      };
      localStorage.setItem(`bookmark_${id}`, JSON.stringify(item));
    } else {
      localStorage.removeItem(`bookmark_${id}`);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  if (!playerObj) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`player-cell ${isDragging ? "dragging" : ""} ${isBookmarked ? "bookmarked" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="cell-index">{index + 1}</div>
      <div className="cell-content">
        <span
          className={`player-name-text ${isCurrentPitcher ? "active-p" : ""} ${isCurrentBatter ? "active-b" : ""}`}
        >
          {playerObj.name}
        </span>

        {/* ver1. 라디오 */}
        {/* <div
          className="role-radio-group"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <label
            className={`radio-label ${isCurrentPitcher ? "selected" : ""}`}
          >
            <input
              type="radio"
              name={`pitcher-group-${id}`}
              checked={!!isCurrentPitcher}
              onClick={() => onRoleChange("pitcher", id)}
              onChange={() => {}} // 에러 방지
            />{" "}
            투수
          </label>
          <label className={`radio-label ${isCurrentBatter ? "selected" : ""}`}>
            <input
              type="radio"
              name={`batter-group-${id}`}
              checked={!!isCurrentBatter}
              onClick={() => onRoleChange("batter", id)}
              onChange={() => {}}
            />{" "}
            타자
          </label>
        </div> */}
        {/* ver2. 버튼 */}
        <div
          className="role-button-group"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* 책갈피 버튼 */}
          <div
            className="bookmark-wrapper"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <label className="bookmark-label">
              <input
                type="checkbox"
                className="bookmark-check"
                checked={isBookmarked}
                onChange={handleBookmarkChange}
              />
            </label>
          </div>
          {/* 기능 버튼 */}
          <button
            type="button"
            className={`role-btn ${isCurrentPitcher ? "active-p" : ""}`}
            onClick={() => onRoleChange("pitcher", id)}
          >
            투수
          </button>
          <button
            type="button"
            className={`role-btn ${isCurrentBatter ? "active-b" : ""}`}
            onClick={() => onRoleChange("batter", id)}
          >
            타자
          </button>
        </div>
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(id)}
        className="cell-delete-btn"
      >
        ×
      </button>
    </div>
  );
}

// --- 2. 메인 Players 컴포넌트 ---
function Players({ game, allTeams, updateDB }) {
  const [teamInputs, setTeamInputs] = useState({ awayName: "", homeName: "" });
  const [newPlayerInputs, setNewPlayerInputs] = useState({
    away: "",
    home: "",
  });
  const [localLogos, setLocalLogos] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useEffect(() => {
    if (game) {
      setTeamInputs({
        awayName: game.awayName || "",
        homeName: game.homeName || "",
      });
    }
    const savedLogos = localStorage.getItem("baseball_local_logos");
    if (savedLogos) setLocalLogos(JSON.parse(savedLogos));
  }, [game]);

  // 역할 변경: 클릭 시 해당 역할 부여, 이미 그 역할이면 대기 상태로 토글
  const handleRoleChange = async (teamId, roleType, playerId) => {
    const team = allTeams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedPlayers = team.players.map((p) => {
      if (roleType === "pitcher") {
        // 이미 투수인 선수를 다시 클릭하면 대기(false), 아니면 투수(true)
        const isAlreadyPitcher = p.id === playerId && p.isPitcher;
        return {
          ...p,
          isPitcher: p.id === playerId ? !isAlreadyPitcher : false,
          isBatter: p.id === playerId ? false : p.isBatter,
        };
      } else if (roleType === "batter") {
        // 이미 타자인 선수를 다시 클릭하면 대기(false), 아니면 타자(true)
        const isAlreadyBatter = p.id === playerId && p.isBatter;
        return {
          ...p,
          isBatter: p.id === playerId ? !isAlreadyBatter : false,
          isPitcher: p.id === playerId ? false : p.isPitcher,
        };
      }
      return p;
    });

    await updateDoc(doc(db, "teams", teamId), { players: updatedPlayers });
  };

  const handleDragEnd = async (event, team) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = team.players.findIndex((p) => p.id === active.id);
      const newIndex = team.players.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(team.players, oldIndex, newIndex);
      await updateDoc(doc(db, "teams", team.id), { players: newOrder });
    }
  };

  const handleAddPlayer = async (teamId, type) => {
    const name = newPlayerInputs[type]?.trim();
    if (!name) return;

    const newPlayer = {
      id: String(Date.now()),
      name: name,
      isBatter: false,
      isPitcher: false,
      teamId: teamId,
    };

    await updateDoc(doc(db, "teams", teamId), {
      players: arrayUnion(newPlayer),
    });
    setNewPlayerInputs((prev) => ({ ...prev, [type]: "" }));
  };

  const handleRemovePlayer = async (teamId, playerId) => {
    // if (!window.confirm("선수를 삭제할까요?")) return;
    const team = allTeams.find((t) => t.id === teamId);
    if (!team) return;
    const newOrder = team.players.filter((p) => p.id !== playerId);
    await updateDoc(doc(db, "teams", teamId), { players: newOrder });
  };

  const renderTeamBox = (team, type) => {
    // 엔터키 키 입력
    const hanleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleAddPlayer(team.id, type);
      }
    };
    return (
      <div className="team-manage-box">
        {team && (
          <>
            <div className={`team-label ${type}`}>
              {type === "away" ? "왼쪽" : "오른쪽"}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, team)}
            >
              <SortableContext
                items={team.players?.map((p) => p.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="player-table-container">
                  {team.players?.map((player, index) => (
                    <SortablePlayerRow
                      key={player.id}
                      id={player.id}
                      playerObj={player}
                      index={index}
                      isCurrentPitcher={player.isPitcher}
                      isCurrentBatter={player.isBatter}
                      onRemove={(pid) => handleRemovePlayer(team.id, pid)}
                      onRoleChange={(role, pid) =>
                        handleRoleChange(team.id, role, pid)
                      }
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
                onChange={(e) =>
                  setNewPlayerInputs((prev) => ({
                    ...prev,
                    [type]: e.target.value,
                  }))
                }
                onKeyDown={hanleKeyDown}
              />
              <button onClick={() => handleAddPlayer(team.id, type)}>
                추가
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const awayTeam = allTeams.find((t) => t.id === game.awayId);
  const homeTeam = allTeams.find((t) => t.id === game.homeId);

  return (
    <section className="entry-management-section">
      <div className="management-grid">
        {renderTeamBox(awayTeam, "away")}
        {renderTeamBox(homeTeam, "home")}
      </div>
    </section>
  );
}

export default Players;
