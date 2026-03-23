import { useState } from 'react';
import './App.css';
import whiteHorse from './assets/whiteHorse.png';
import blackHorse from './assets/blackHorse.png';

// 타입 정의
type Player = 'PLAYER_1' | 'PLAYER_2';
type TileType = 'DESERT' | 'GRASSLAND' | 'OASIS';
interface HorseInfo { owner: Player; position: string; }

function App() {

  // --- [상태 관리] ---
  const [horses, setHorses] = useState<HorseInfo[]>(initHorses());
  const [currentTurn, setCurrentTurn] = useState<Player>('PLAYER_1');
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  // --- [로직 1: 초기 배치] ---
  function initHorses(): HorseInfo[] {
    const list: HorseInfo[] = [];
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        const pos = toCoord(r, c);
        // P1 배치 (대각선)
        if ((r === 0 && c <= 2) || (r <= 2 && c === 0)) list.push({ owner: 'PLAYER_1', position: pos });
        if ((r === 10 && c >= 8) || (r >= 8 && c === 10)) list.push({ owner: 'PLAYER_1', position: pos });
        // P2 배치
        if ((r === 0 && c >= 8) || (r <= 2 && c === 10)) list.push({ owner: 'PLAYER_2', position: pos });
        if ((r === 10 && c <= 2) || (r >= 8 && c === 0)) list.push({ owner: 'PLAYER_2', position: pos });
      }
    }
    return list;
  }

  // --- [로직 2: 이동 검증 (심판)] ---
  const isValidMove = (from: string, to: string): boolean => {
    const [fr, fc] = fromCoord(from);
    const [tr, tc] = fromCoord(to);
    
    // 1. 슬라이드 검증
    const isSlide = (fr === tr || fc === tc);
    if (isSlide) {
      let dr = Math.sign(tr - fr);
      let dc = Math.sign(tc - fc);
      let cr = fr, cc = fc;
      while (true) {
        let nr = cr + dr, nc = cc + dc;
        if (nr < 0 || nr >= 11 || nc < 0 || nc >= 11) break; // 벽
        if (horses.find(h => h.position === toCoord(nr, nc))) break; // 다른 말
        cr = nr; cc = nc;
      }
      if (cr === tr && cc === tc) return true;
    }

    // 2. L자 검증 (사막 전용)
    const dr = Math.abs(fr - tr);
    const dc = Math.abs(fc - tc);
    const isL = (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
    if (isL) {
      const isTargetDesert = (Math.abs(tr - 5) + Math.abs(tc - 5)) > 2;
      const isTargetEmpty = !horses.find(h => h.position === toCoord(tr, tc));
      if (isTargetDesert && isTargetEmpty) return true;
    }

    return false;
  };

  // --- [로직 3: 클릭 핸들러] ---
  const handleTileClick = (r: number, c: number) => {
    const clickedPos = toCoord(r, c);
    if (!selectedPos) {
      const horse = horses.find(h => h.position === clickedPos);
      if (horse && horse.owner === currentTurn) setSelectedPos(clickedPos);
    } else {
      if (isValidMove(selectedPos, clickedPos)) {
        // 이동 실행
        const newHorses = horses.map(h => h.position === selectedPos ? { ...h, position: clickedPos } : h);
        setHorses(newHorses);

        // 승리 체크
        if (r === 5 && c === 5) {
          alert(`${currentTurn} 승리! 라운드를 종료합니다.`);
          setScores(prev => currentTurn === 'PLAYER_1' ? { ...prev, p1: prev.p1 + 1 } : { ...prev, p2: prev.p2 + 1 });
          setHorses(initHorses()); // 리셋
        }
        setCurrentTurn(currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1');
      } else {
        alert("잘못된 이동입니다.");
      }
      setSelectedPos(null);
    }
  };

  // 유틸리티
  function toCoord(r: number, c: number) { return String.fromCharCode(97 + r) + (c + 1); }
  function fromCoord(pos: string): [number, number] { 
    return [pos.charCodeAt(0) - 97, parseInt(pos.substring(1)) - 1]; 
  }
  const getTileType = (r: number, c: number): TileType => {
    const dist = Math.abs(r - 5) + Math.abs(c - 5);
    if (r === 5 && c === 5) return 'OASIS';
    return dist <= 2 ? 'GRASSLAND' : 'DESERT';
  };

  return (
    <div className="game-container">
      <div className="ui-panel">
        <h2>{currentTurn === 'PLAYER_1' ? "WHITE" : "BLACK"} TURN</h2>
        <p>Score - P1: {scores.p1} | P2: {scores.p2}</p>
      </div>


      <div className={`ui-panel ${currentTurn === 'PLAYER_1' ? 'white-turn' : 'black-turn'}`}>
        <h2 className="turn-display">
          {currentTurn === 'PLAYER_1' ? "WHITE" : "BLACK"} TURN
        </h2>
        <p className="score-display">Score - P1: {scores.p1} | P2: {scores.p2}</p>
        
        {/* 💡 새로 추가된 규칙 박스 */}
        <div className="rule-box">
          📖 마우스를 올려 규칙 보기
          <div className="rule-tooltip">
            <strong>말 달리자 규칙</strong>
            <ul>
              <li><strong>목표:</strong> 정중앙 오아시스(파란색)에 먼저 도착!</li>
              <li><strong>슬라이드:</strong> 상하좌우 직선으로 벽이나 다른 말에 부딪힐 때까지 멈출 수 없음.</li>
              <li><strong>L자 이동:</strong> 체스 나이트처럼 이동 (단, 초원은 L자 이동으로 도착할 수 없음).</li>
            </ul>
          </div>
        </div>
      </div>


      <div className="board">
        {Array.from({ length: 11 }).map((_, r) =>
          Array.from({ length: 11 }).map((_, c) => {
            const pos = toCoord(r, c);
            const horse = horses.find(h => h.position === pos);
            return (
              <div key={pos} className={`tile ${getTileType(r, c).toLowerCase()} ${selectedPos === pos ? 'selected' : ''}`}
                   onClick={() => handleTileClick(r, c)}>
                {horse && <img src={horse.owner === 'PLAYER_1' ? whiteHorse : blackHorse} className="horse-img" alt="horse" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;