import { useState } from "react";
import "./GamesCatalog.css";

const games = [
  { id: "beans", name: "Someone Stole My Beans", type: "Arcade", detail: "The original Woosh arcade game." },
  { id: "2048", name: "2048", type: "Puzzle", detail: "Merge matching tiles to reach 2048." },
  { id: "memory", name: "Memory Match", type: "Puzzle", detail: "Find all six matching pairs." },
  { id: "tic", name: "Tic-Tac-Toe", type: "Classic", detail: "Get three in a row with a friend." },
  { id: "racing", name: "Turbo Racing", type: "Racing", detail: "Dodge traffic and survive the track." },
  { id: "basketball", name: "Hoop Shot", type: "Sports", detail: "Take shots and build your score." },
  { id: "soccer", name: "Penalty Shootout", type: "Sports", detail: "Pick a corner and beat the keeper." },
];

function initial2048() {
  const board = Array(16).fill(0);
  for (let n = 0; n < 2; n += 1) {
    const empty = board.map((v, i) => v === 0 ? i : -1).filter((i) => i >= 0);
    board[empty[Math.floor(Math.random() * empty.length)]] = 2;
  }
  return board;
}

function slide(line) {
  const values = line.filter(Boolean);
  const merged = [];
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === values[i + 1]) { merged.push(values[i] * 2); i += 1; }
    else merged.push(values[i]);
  }
  while (merged.length < 4) merged.push(0);
  return merged;
}

function move2048(board, direction) {
  const next = [...board];
  for (let n = 0; n < 4; n += 1) {
    const indexes = direction === "left" || direction === "right"
      ? [0,1,2,3].map(c => n * 4 + c)
      : [0,1,2,3].map(r => r * 4 + n);
    const reverse = direction === "right" || direction === "down";
    const line = indexes.map(i => board[i]);
    const result = slide(reverse ? [...line].reverse() : line);
    (reverse ? result.reverse() : result).forEach((v, i) => { next[indexes[i]] = v; });
  }
  if (next.every((v, i) => v === board[i])) return board;
  const empty = next.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
  if (empty.length) next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function Puzzle2048() {
  const [board, setBoard] = useState(initial2048);
  const [turns, setTurns] = useState(0);
  const move = (direction) => setBoard((old) => {
    const next = move2048(old, direction);
    if (next !== old) setTurns((n) => n + 1);
    return next;
  });
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">PUZZLE</p><h2>2048</h2></div><span className="arcade-score">Moves {turns}</span></div>
    <p className="arcade-help">Slide the tiles and combine matching numbers.</p>
    <div className="board-2048" role="grid" aria-label="2048 board">{board.map((v, i) => <div key={i} role="gridcell" className={`tile-2048 tile-${v || "empty"}`}>{v || ""}</div>)}</div>
    <div className="game-controls"><button onClick={() => move("up")}>↑ Up</button><div><button onClick={() => move("left")}>← Left</button><button onClick={() => move("down")}>↓ Down</button><button onClick={() => move("right")}>Right →</button></div><button className="arcade-secondary" onClick={() => { setBoard(initial2048()); setTurns(0); }}>New game</button></div>
  </div>;
}

function MemoryMatch() {
  const shuffle = () => ["W","O","O","S","H","!","W","O","O","S","H","!"].sort(() => Math.random() - 0.5);
  const [deck, setDeck] = useState(shuffle);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [locked, setLocked] = useState(false);
  const pick = (i) => {
    if (locked || flipped.includes(i) || matched.includes(i)) return;
    const next = [...flipped, i]; setFlipped(next);
    if (next.length === 2) {
      if (deck[next[0]] === deck[next[1]]) { setMatched(old => [...old, ...next]); setFlipped([]); }
      else { setLocked(true); setTimeout(() => { setFlipped([]); setLocked(false); }, 650); }
    }
  };
  const reset = () => { setDeck(shuffle()); setFlipped([]); setMatched([]); setLocked(false); };
  return <div className="arcade-game"><div className="arcade-game-heading"><div><p className="arcade-eyebrow">PUZZLE</p><h2>Memory Match</h2></div><span className="arcade-score">{matched.length / 2} / 6 pairs</span></div>
    <p className="arcade-help">Flip cards to uncover matching symbols.</p><div className="memory-board">{deck.map((v, i) => <button key={i} className={`memory-card ${flipped.includes(i) || matched.includes(i) ? "revealed" : ""} ${matched.includes(i) ? "matched" : ""}`} onClick={() => pick(i)} aria-label={flipped.includes(i) || matched.includes(i) ? v : "Reveal card"}>{flipped.includes(i) || matched.includes(i) ? v : "?"}</button>)}</div>
    {matched.length === 12 && <p className="arcade-win">All pairs found. Nice!</p>}<button className="arcade-secondary" onClick={reset}>Shuffle and restart</button>
  </div>;
}

function TicTacToe() {
  const [squares, setSquares] = useState(Array(9).fill(""));
  const [xTurn, setXTurn] = useState(true);
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const winner = lines.map(line => line.every(i => squares[i] && squares[i] === squares[line[0]]) ? squares[line[0]] : null).find(Boolean);
  const play = (i) => { if (squares[i] || winner) return; const next = [...squares]; next[i] = xTurn ? "X" : "O"; setSquares(next); setXTurn(!xTurn); };
  return <div className="arcade-game"><div className="arcade-game-heading"><div><p className="arcade-eyebrow">CLASSIC</p><h2>Tic-Tac-Toe</h2></div><span className="arcade-score">{winner ? `${winner} wins` : squares.every(Boolean) ? "Draw" : `Turn: ${xTurn ? "X" : "O"}`}</span></div>
    <p className="arcade-help">Two players, one device. Take turns.</p><div className="tic-board">{squares.map((v, i) => <button key={i} onClick={() => play(i)} aria-label={`Square ${i + 1}: ${v || "empty"}`}>{v}</button>)}</div><button className="arcade-secondary" onClick={() => { setSquares(Array(9).fill("")); setXTurn(true); }}>New round</button>
  </div>;
}


function RacingGame() {
  const [lane, setLane] = useState(1);
  const [distance, setDistance] = useState(0);
  const [traffic, setTraffic] = useState([0, 2]);
  const [crashed, setCrashed] = useState(false);
  const move = (nextLane) => {
    if (crashed) return;
    const nextDistance = distance + 1;
    const nextTraffic = traffic.map((v) => (v + 1) % 3);
    setDistance(nextDistance);
    setLane(nextLane);
    setTraffic(nextTraffic);
    if (nextTraffic.includes(nextLane)) setCrashed(true);
  };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">RACING</p><h2>Turbo Racing</h2></div><span className="arcade-score">Distance {distance}</span></div>
    <p className="arcade-help">Switch lanes to avoid traffic. Reach 20 distance to win.</p>
    <div className="race-track">{[0,1,2].map((trackLane) => <div className="race-lane" key={trackLane}><span>{lane === trackLane ? "🚗" : ""}</span><span>{traffic.includes(trackLane) ? "🚧" : ""}</span></div>)}</div>
    {crashed ? <p className="arcade-win">Crash! Try another run.</p> : distance >= 20 ? <p className="arcade-win">Finish line! You won!</p> : <div className="game-controls"><div><button onClick={() => move(Math.max(0,lane-1))}>← Left</button><button onClick={() => move(Math.min(2,lane+1))}>Right →</button></div></div>}
    <button className="arcade-secondary" onClick={() => {setLane(1);setDistance(0);setTraffic([0,2]);setCrashed(false);}}>Restart race</button>
  </div>;
}

function BasketballGame() {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [message, setMessage] = useState("Take 10 shots!");
  const shoot = () => {
    if (shots >= 10) return;
    const made = Math.random() < 0.65;
    setShots((n) => n + 1);
    if (made) setScore((n) => n + 2);
    setMessage(made ? "Swish! +2 points" : "Missed it — next shot!");
  };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">BASKETBALL</p><h2>Hoop Shot</h2></div><span className="arcade-score">{score} points</span></div>
    <div className="sports-court basketball-court"><span className="basketball-hoop">◎</span><span className="basketball-ball">●</span></div>
    <p className="arcade-help">{message} Shots left: {10-shots}</p>
    {shots < 10 ? <button className="sports-primary" onClick={shoot}>Shoot ball</button> : <p className="arcade-win">Final score: {score} points out of 20.</p>}
    <button className="arcade-secondary" onClick={() => {setScore(0);setShots(0);setMessage("Take 10 shots!");}}>Play again</button>
  </div>;
}

function SoccerGame() {
  const [attempt, setAttempt] = useState(0);
  const [goals, setGoals] = useState(0);
  const [message, setMessage] = useState("Choose a corner to shoot.");
  const shoot = (direction) => {
    if (attempt >= 5) return;
    const saved = ["left","center","right"][Math.floor(Math.random()*3)];
    const scored = direction !== saved;
    setAttempt((n) => n + 1);
    if (scored) setGoals((n) => n + 1);
    setMessage(scored ? "GOAL! You beat the keeper." : "Saved by the keeper!");
  };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">SOCCER</p><h2>Penalty Shootout</h2></div><span className="arcade-score">{goals}/5 goals</span></div>
    <div className="sports-court soccer-goal"><span>🥅</span><span>⚽</span></div>
    <p className="arcade-help">{message} Kicks left: {5-attempt}</p>
    {attempt < 5 ? <div className="game-controls"><div>{["left","center","right"].map((d) => <button key={d} onClick={() => shoot(d)}>{d[0].toUpperCase()+d.slice(1)}</button>)}</div></div> : <p className="arcade-win">Shootout complete: {goals} goals!</p>}
    <button className="arcade-secondary" onClick={() => {setAttempt(0);setGoals(0);setMessage("Choose a corner to shoot.");}}>Play again</button>
  </div>;
}

export default function GamesCatalog() {
  const [selected, setSelected] = useState("beans");
  const game = games.find(g => g.id === selected) || games[0];
  return <section className="minigames-page arcade-catalog">
    <div className="minigames-header"><div><p className="minigames-eyebrow">WOOSH ARCADE</p><h1>Games</h1><p className="minigames-description">Pick a game and play without leaving Woosh.</p></div></div>
    <div className="arcade-game-picker" aria-label="Choose a game">{games.map(g => <button key={g.id} className={`arcade-game-option ${selected === g.id ? "selected" : ""}`} onClick={() => setSelected(g.id)} aria-pressed={selected === g.id}><span className="arcade-game-category">{g.type}</span><strong>{g.name}</strong><span>{g.detail}</span></button>)}</div>
    <div className="minigames-game-shell arcade-stage"><div className="minigames-game-topbar"><span className="minigames-game-dot" aria-hidden="true" /><span>{game.name}</span>{selected === "beans" && <a href="https://someone-stole-my-beans.web.app/" target="_blank" rel="noopener noreferrer">Open separately ↗</a>}</div>
      {selected === "beans" ? <iframe className="minigames-iframe" src="https://someone-stole-my-beans.web.app/" title="Someone Stole My Beans game" loading="lazy" allow="fullscreen; gamepad" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="arcade-play-area">{selected === "2048" ? <Puzzle2048 /> : selected === "memory" ? <MemoryMatch /> : selected === "tic" ? <TicTacToe /> : selected === "racing" ? <RacingGame /> : selected === "basketball" ? <BasketballGame /> : <SoccerGame /> }</div>}
    </div>
    <p className="minigames-note">2048, Memory Match, Tic-Tac-Toe, Turbo Racing, Hoop Shot, and Penalty Shootout run directly inside Woosh. If the Beans game cannot load in its frame, open it separately.</p>
  </section>;
}
