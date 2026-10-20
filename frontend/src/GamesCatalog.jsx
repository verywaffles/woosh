import { useEffect, useRef, useState } from "react";
import "./GamesCatalog.css";

const games = [
  { id: "beans", name: "Someone Stole My Beans", type: "Arcade", detail: "The original Woosh arcade game." },
  { id: "2048", name: "2048", type: "Puzzle", detail: "Combine tiles, chase a high score." },
  { id: "memory", name: "Memory Match", type: "Puzzle", detail: "Train your memory in fewer moves." },
  { id: "tic", name: "Tic-Tac-Toe", type: "Classic", detail: "Challenge a friend or the computer." },
  { id: "racing", name: "Turbo Racing", type: "Racing", detail: "Dodge traffic and survive the highway." },
  { id: "basketball", name: "Hoop Shot", type: "Sports", detail: "Master your release timing." },
  { id: "soccer", name: "Penalty Shootout", type: "Sports", detail: "Pick your corner and beat the keeper." },
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
  let gained = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === values[i + 1]) {
      merged.push(values[i] * 2);
      gained += values[i] * 2;
      i += 1;
    } else merged.push(values[i]);
  }
  while (merged.length < 4) merged.push(0);
  return { line: merged, gained };
}

function move2048(board, direction) {
  const next = [...board];
  let gained = 0;
  for (let n = 0; n < 4; n += 1) {
    const indexes = direction === "left" || direction === "right"
      ? [0, 1, 2, 3].map((c) => n * 4 + c)
      : [0, 1, 2, 3].map((r) => r * 4 + n);
    const reverse = direction === "right" || direction === "down";
    const original = indexes.map((i) => board[i]);
    const result = slide(reverse ? [...original].reverse() : original);
    gained += result.gained;
    (reverse ? [...result.line].reverse() : result.line).forEach((v, i) => { next[indexes[i]] = v; });
  }
  if (next.every((v, i) => v === board[i])) return { board, gained: 0, changed: false };
  const empty = next.map((v, i) => v === 0 ? i : -1).filter((i) => i >= 0);
  if (empty.length) next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  return { board: next, gained, changed: true };
}

function Puzzle2048() {
  const [board, setBoard] = useState(initial2048);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("woosh2048Best") || 0));
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [over, setOver] = useState(false);
  const hasMoves = (values) => values.some((v) => !v) || values.some((v, i) =>
    (i % 4 < 3 && values[i] === values[i + 1]) || (i < 12 && values[i] === values[i + 4]));
  const move = (direction) => {
    if (over || (won && !keepPlaying)) return;
    const result = move2048(board, direction);
    if (!result.changed) return;
    setBoard(result.board);
    const nextScore = score + result.gained;
    setScore(nextScore);
    if (nextScore > best) { setBest(nextScore); localStorage.setItem("woosh2048Best", String(nextScore)); }
    if (!won && result.board.includes(2048)) setWon(true);
    setOver(!hasMoves(result.board));
  };
  useEffect(() => {
    const onKey = (event) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
      const direction = map[event.key];
      if (direction && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const reset = () => { setBoard(initial2048()); setScore(0); setWon(false); setKeepPlaying(false); setOver(false); };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">PUZZLE · CLASSIC</p><h2>2048</h2></div><div className="score-pair"><span><small>SCORE</small><strong>{score}</strong></span><span><small>BEST</small><strong>{best}</strong></span></div></div>
    <p className="arcade-help">Use the arrow keys or controls to slide. Equal tiles merge once per move.</p>
    <div className="board-2048" role="grid" aria-label="2048 board">{board.map((v, i) => <div key={i} role="gridcell" className={`tile-2048 tile-${v || "empty"}`}>{v || ""}</div>)}</div>
    {won && !keepPlaying && <div className="game-banner"><strong>2048 reached!</strong><span>You did it. Keep going or start a fresh run.</span><button onClick={() => setKeepPlaying(true)}>Keep playing</button></div>}
    {over && <div className="game-banner"><strong>No moves left</strong><span>Final score: {score}</span></div>}
    <div className="game-controls"><div><button onClick={() => move("up")}>↑</button></div><div><button onClick={() => move("left")}>←</button><button onClick={() => move("down")}>↓</button><button onClick={() => move("right")}>→</button></div><button className="arcade-secondary" onClick={reset}>New game</button></div>
  </div>;
}

function shuffleCards() {
  const deck = ["W", "O", "S", "H", "!", "★", "W", "O", "S", "H", "!", "★"];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function MemoryMatch() {
  const [deck, setDeck] = useState(shuffleCards);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const complete = matched.length === deck.length;
  useEffect(() => {
    if (complete) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [complete, deck]);
  const pick = (i) => {
    if (locked || flipped.includes(i) || matched.includes(i) || complete) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((value) => value + 1);
      if (deck[next[0]] === deck[next[1]]) {
        setMatched((old) => [...old, ...next]);
        setFlipped([]);
      } else {
        setLocked(true);
        window.setTimeout(() => { setFlipped([]); setLocked(false); }, 750);
      }
    }
  };
  const reset = () => { setDeck(shuffleCards()); setFlipped([]); setMatched([]); setLocked(false); setMoves(0); setSeconds(0); };
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">PUZZLE · MEMORY</p><h2>Memory Match</h2></div><div className="score-pair"><span><small>MOVES</small><strong>{moves}</strong></span><span><small>TIME</small><strong>{time}</strong></span></div></div>
    <p className="arcade-help">Find all six pairs. Fewer moves is better.</p>
    <div className="memory-board">{deck.map((v, i) => {
      const visible = flipped.includes(i) || matched.includes(i);
      return <button key={i} className={`memory-card ${visible ? "revealed" : ""} ${matched.includes(i) ? "matched" : ""}`} onClick={() => pick(i)} aria-label={visible ? v : "Reveal card"} disabled={locked && !flipped.includes(i)}>{visible ? <span>{v}</span> : <span className="memory-card-mark">W</span>}</button>;
    })}</div>
    {complete && <div className="game-banner"><strong>Board cleared</strong><span>{moves} moves · {time}. Nice memory.</span></div>}
    <button className="arcade-secondary" onClick={reset}>Shuffle and restart</button>
  </div>;
}

function TicTacToe() {
  const [squares, setSquares] = useState(Array(9).fill(""));
  const [xTurn, setXTurn] = useState(true);
  const [mode, setMode] = useState("computer");
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const winner = lines.map((line) => line.every((i) => squares[i] && squares[i] === squares[line[0]]) ? squares[line[0]] : null).find(Boolean);
  const draw = !winner && squares.every(Boolean);
  const terminal = Boolean(winner || draw);
  const computerMove = (board) => {
    const winningMove = (mark) => lines.map((line) => {
      const empty = line.filter((i) => !board[i]);
      return empty.length === 1 && line.filter((i) => board[i] === mark).length === 2 ? empty[0] : null;
    }).find((i) => i !== null);
    let pick = winningMove("O");
    if (pick === undefined) pick = winningMove("X");
    if (pick === undefined && !board[4]) pick = 4;
    if (pick === undefined) {
      const corners = [0, 2, 6, 8].filter((i) => !board[i]);
      if (corners.length) pick = corners[Math.floor(Math.random() * corners.length)];
    }
    if (pick === undefined) {
      const empty = board.map((v, i) => !v ? i : -1).filter((i) => i >= 0);
      pick = empty[Math.floor(Math.random() * empty.length)];
    }
    return pick;
  };
  const play = (i) => {
    if (squares[i] || terminal || (mode === "computer" && !xTurn)) return;
    const next = [...squares];
    next[i] = xTurn ? "X" : "O";
    setSquares(next);
    setXTurn(!xTurn);
    const nextWinner = lines.some((line) => line.every((index) => next[index] && next[index] === next[line[0]]));
    if (mode === "computer" && xTurn && !nextWinner && next.some((v) => !v)) {
      window.setTimeout(() => {
        setSquares((current) => {
          if (lines.some((line) => line.every((index) => current[index] && current[index] === current[line[0]])) || current.every(Boolean)) return current;
          const board = [...current];
          const moveIndex = computerMove(board);
          if (moveIndex !== undefined) board[moveIndex] = "O";
          return board;
        });
        setXTurn(true);
      }, 320);
    }
  };
  const status = winner ? `${winner} wins the round` : draw ? "It's a draw" : mode === "computer" ? (xTurn ? "Your turn · X" : "Computer thinking…") : `Turn: ${xTurn ? "X" : "O"}`;
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">CLASSIC · STRATEGY</p><h2>Tic-Tac-Toe</h2></div><span className="arcade-score">{terminal ? (winner ? "Winner" : "Draw") : mode === "computer" ? "VS CPU" : "2 PLAYERS"}</span></div>
    <div className="game-mode-switch"><button className={mode === "computer" ? "active" : ""} onClick={() => { setMode("computer"); setSquares(Array(9).fill("")); setXTurn(true); }}>Vs computer</button><button className={mode === "local" ? "active" : ""} onClick={() => { setMode("local"); setSquares(Array(9).fill("")); setXTurn(true); }}>Two players</button></div>
    <p className="arcade-help">{status}</p>
    <div className="tic-board">{squares.map((v, i) => <button key={i} className={v ? `mark-${v.toLowerCase()}` : ""} onClick={() => play(i)} disabled={Boolean(v) || terminal || (mode === "computer" && !xTurn)} aria-label={`Square ${i + 1}: ${v || "empty"}`}>{v}</button>)}</div>
    {terminal && <div className="game-banner"><strong>{winner ? `${winner} takes it.` : "Well played."}</strong><span>Ready for another round?</span></div>}
    <button className="arcade-secondary" onClick={() => { setSquares(Array(9).fill("")); setXTurn(true); }}>New round</button>
  </div>;
}

const makeTraffic = () => ({ id: Math.random().toString(36).slice(2), lane: Math.floor(Math.random() * 3), row: 0, kind: Math.random() < 0.25 ? "truck" : "car" });

function RacingGame() {
  const [race, setRace] = useState({ lane: 1, distance: 0, traffic: [makeTraffic()], status: "ready", best: Number(localStorage.getItem("wooshRacingBest") || 0) });
  const reset = () => setRace({ lane: 1, distance: 0, traffic: [makeTraffic()], status: "running", best: Number(localStorage.getItem("wooshRacingBest") || 0) });
  const steer = (direction) => setRace((current) => current.status !== "running" ? current : { ...current, lane: Math.max(0, Math.min(2, current.lane + direction)) });
  useEffect(() => {
    if (race.status !== "running") return undefined;
    const tick = window.setInterval(() => {
      setRace((current) => {
        if (current.status !== "running") return current;
        const distance = current.distance + 1;
        let traffic = current.traffic.map((car) => ({ ...car, row: car.row + 1 })).filter((car) => car.row < 8);
        if (distance % 2 === 0 && Math.random() < 0.82) {
          const fresh = makeTraffic();
          if (!traffic.some((car) => car.row < 2 && car.lane === fresh.lane)) traffic = [...traffic, fresh];
        }
        const crashed = traffic.some((car) => car.row >= 7 && car.lane === current.lane);
        const won = distance >= 35;
        const status = crashed ? "crashed" : won ? "won" : "running";
        const best = Math.max(current.best, distance);
        if (best > current.best) localStorage.setItem("wooshRacingBest", String(best));
        return { ...current, distance, traffic, status, best };
      });
    }, 520);
    return () => window.clearInterval(tick);
  }, [race.status]);
  useEffect(() => {
    const onKey = (event) => {
      if (["ArrowLeft", "ArrowRight"].includes(event.key) && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        steer(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return <div className="arcade-game arcade-racing">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">RACING · REFLEX</p><h2>Turbo Racing</h2></div><div className="score-pair"><span><small>DISTANCE</small><strong>{race.distance} km</strong></span><span><small>BEST</small><strong>{race.best} km</strong></span></div></div>
    <p className="arcade-help">Dodge traffic for 35 km. Use ← → or the steering buttons.</p>
    <div className="race-scene" aria-label="Three-lane highway">
      <div className="race-skyline"><span /><span /><span /><span /><span /></div>
      <div className="race-road">{[0, 1, 2].map((lane) => <div className="race-lane" key={lane}><div className="lane-dashes" />{race.traffic.filter((car) => car.lane === lane).map((car) => <div key={car.id} className={`traffic-car ${car.kind}`} style={{ top: `${Math.min(car.row, 7) * 12.5}%` }}><span /></div>)}{race.lane === lane && <div className="player-car"><span /><i /></div>}</div>)}</div>
      <div className="race-dashboard"><span>HIGHWAY 08</span><span>{race.status === "running" ? "ENGINE ON" : race.status === "crashed" ? "COLLISION" : race.status === "won" ? "FINISH" : "READY"}</span></div>
    </div>
    {race.status !== "running" && <div className="game-banner"><strong>{race.status === "crashed" ? "Collision!" : race.status === "won" ? "Finish line crossed!" : "Ready to race?"}</strong><span>{race.status === "crashed" ? `You reached ${race.distance} km. Try changing lanes earlier.` : race.status === "won" ? "You made it through traffic." : "Start the engine and see how far you can get."}</span></div>}
    <div className="steering-controls"><button onClick={() => steer(-1)} disabled={race.status !== "running"} aria-label="Steer left">←</button>{race.status !== "running" ? <button className="sports-primary" onClick={reset}>{race.status === "ready" ? "Start race" : "Race again"}</button> : <span>STEER</span>}<button onClick={() => steer(1)} disabled={race.status !== "running"} aria-label="Steer right">→</button></div>
  </div>;
}

function BasketballGame() {
  const [shots, setShots] = useState(0);
  const [score, setScore] = useState(0);
  const [meter, setMeter] = useState(8);
  const [message, setMessage] = useState("Stop the meter near the green zone.");
  const direction = useRef(1);
  const [lastShot, setLastShot] = useState(null);
  useEffect(() => {
    if (shots >= 10) return undefined;
    const timer = window.setInterval(() => setMeter((value) => {
      let next = value + direction.current * 2.2;
      if (next >= 100) { next = 100; direction.current = -1; }
      if (next <= 0) { next = 0; direction.current = 1; }
      return next;
    }), 28);
    return () => window.clearInterval(timer);
  }, [shots]);
  const shoot = () => {
    if (shots >= 10) return;
    const accuracy = Math.abs(meter - 70);
    const made = accuracy <= 12;
    const points = made ? (accuracy <= 4 ? 3 : 2) : 0;
    setShots((value) => value + 1);
    setScore((value) => value + points);
    setLastShot({ made, points, accuracy });
    setMessage(made ? (points === 3 ? "Perfect release — three points!" : "Clean shot — two points!") : accuracy < 25 ? "Just off the rim. Close one." : "Air ball. Watch the meter.");
  };
  const reset = () => { setShots(0); setScore(0); setMeter(8); direction.current = 1; setMessage("Stop the meter near the green zone."); setLastShot(null); };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">BASKETBALL · TIMING</p><h2>Hoop Shot</h2></div><div className="score-pair"><span><small>SCORE</small><strong>{score}</strong></span><span><small>SHOT</small><strong>{Math.min(shots + 1, 10)}/10</strong></span></div></div>
    <div className="basketball-scene"><div className="court-lines" /><div className="hoop-backboard" /><div className="hoop-rim" /><div className="hoop-net" /><div className={`basketball-ball ${lastShot ? (lastShot.made ? "made" : "missed") : ""}`} key={shots}> </div><div className="court-label">WOOSH ARENA</div></div>
    <p className="arcade-help">{shots >= 10 ? `Final: ${score} points from 10 shots.` : message}</p>
    <div className="shot-meter"><div className="shot-meter-track"><span className="shot-zone" /><span className="shot-pointer" style={{ left: `${meter}%` }} /></div><div className="shot-meter-labels"><span>EARLY</span><span>PERFECT RELEASE</span><span>LATE</span></div></div>
    {shots < 10 ? <button className="sports-primary" onClick={shoot}>Shoot · stop the meter</button> : <div className="game-banner"><strong>{score >= 20 ? "Great shooting." : score >= 12 ? "Solid performance." : "Keep practicing."}</strong><span>Maximum possible score: 30 points.</span></div>}
    {shots >= 10 && <button className="arcade-secondary" onClick={reset}>Play again</button>}
  </div>;
}

function SoccerGame() {
  const [attempt, setAttempt] = useState(0);
  const [goals, setGoals] = useState(0);
  const [direction, setDirection] = useState("center");
  const [power, setPower] = useState(30);
  const [message, setMessage] = useState("Pick a corner, set your power, then shoot.");
  const [lastShot, setLastShot] = useState(null);
  const powerDirection = useRef(1);
  useEffect(() => {
    if (attempt >= 5) return undefined;
    const timer = window.setInterval(() => setPower((value) => {
      let next = value + powerDirection.current * 2;
      if (next >= 100) { next = 100; powerDirection.current = -1; }
      if (next <= 0) { next = 0; powerDirection.current = 1; }
      return next;
    }), 32);
    return () => window.clearInterval(timer);
  }, [attempt]);
  const shoot = () => {
    if (attempt >= 5) return;
    const keeper = ["left", "center", "right"][Math.floor(Math.random() * 3)];
    const accuracy = Math.abs(power - 68);
    const onTarget = accuracy < 31;
    const scored = onTarget && direction !== keeper;
    setAttempt((value) => value + 1);
    if (scored) setGoals((value) => value + 1);
    setLastShot({ direction, keeper, scored, power });
    setMessage(!onTarget ? "Over the bar! Control your power." : scored ? "GOAL! The keeper went the other way." : "Saved! The keeper read your shot.");
  };
  const reset = () => { setAttempt(0); setGoals(0); setDirection("center"); setPower(30); powerDirection.current = 1; setMessage("Pick a corner, set your power, then shoot."); setLastShot(null); };
  return <div className="arcade-game">
    <div className="arcade-game-heading"><div><p className="arcade-eyebrow">SOCCER · SHOOTOUT</p><h2>Penalty Shootout</h2></div><div className="score-pair"><span><small>GOALS</small><strong>{goals}</strong></span><span><small>KICK</small><strong>{Math.min(attempt + 1, 5)}/5</strong></span></div></div>
    <p className="arcade-help">Choose where to aim. Release the power meter near 68% for an on-target shot.</p>
    <div className="soccer-scene"><div className="stadium-lights"><i /><i /><i /><i /><i /></div><div className="soccer-crowd" /><div className="soccer-goal-frame"><div className="goal-net" />{lastShot && <div className={`keeper keeper-${lastShot.keeper}`}><span /><i /><b /></div>}{lastShot && <div className={`soccer-ball-in-net ${lastShot.scored ? "goal" : "saved"}`} style={{ left: lastShot.direction === "left" ? "22%" : lastShot.direction === "right" ? "78%" : "50%" }} />}</div><div className="penalty-spot" /><div className="pitch-stripe" /></div>
    <div className="shot-directions" aria-label="Aim direction">{["left", "center", "right"].map((item) => <button key={item} className={direction === item ? "active" : ""} onClick={() => setDirection(item)} disabled={attempt >= 5}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    <div className="shot-meter"><div className="shot-meter-track power-track"><span className="shot-zone" /><span className="shot-pointer" style={{ left: `${power}%` }} /></div><div className="shot-meter-labels"><span>SOFT</span><span>IDEAL POWER</span><span>TOO HARD</span></div></div>
    <p className="arcade-help">{attempt >= 5 ? `Shootout complete: ${goals} of 5 scored.` : message}</p>
    {attempt < 5 ? <button className="sports-primary" onClick={shoot}>Take penalty</button> : <><div className="game-banner"><strong>{goals >= 4 ? "Clinical finishing." : goals >= 3 ? "A strong shootout." : "Back to training."}</strong><span>Five kicks. Every shot counts.</span></div><button className="arcade-secondary" onClick={reset}>Play again</button></>}
  </div>;
}

export default function GamesCatalog() {
  const [selected, setSelected] = useState("beans");
  const game = games.find((item) => item.id === selected) || games[0];
  return <section className="minigames-page arcade-catalog">
    <div className="minigames-header"><div><p className="minigames-eyebrow">WOOSH ARCADE</p><h1>Games</h1><p className="minigames-description">A little competition. A lot more polish. Pick a game and jump in.</p></div><span className="arcade-live-label"><i /> 7 GAMES</span></div>
    <div className="arcade-game-picker" aria-label="Choose a game">{games.map((item, index) => <button key={item.id} className={`arcade-game-option ${selected === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}><span className="game-option-top"><span className="arcade-game-category">{item.type}</span><span className="game-option-number">{String(index + 1).padStart(2, "0")}</span></span><strong>{item.name}</strong><span>{item.detail}</span><span className="game-option-launch">{selected === item.id ? "NOW PLAYING" : "PLAY GAME"} <b>↗</b></span></button>)}</div>
    <div className="minigames-game-shell arcade-stage"><div className="minigames-game-topbar"><span className="minigames-game-dot" aria-hidden="true" /><span className="game-stage-name">{game.name}</span><span className="game-stage-status">ARCADE MODE</span>{selected === "beans" && <a href="https://someone-stole-my-beans.web.app/" target="_blank" rel="noopener noreferrer">Open separately ↗</a>}</div>
      {selected === "beans" ? <iframe className="minigames-iframe" src="https://someone-stole-my-beans.web.app/" title="Someone Stole My Beans game" loading="lazy" allow="fullscreen; gamepad" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="arcade-play-area">{selected === "2048" ? <Puzzle2048 /> : selected === "memory" ? <MemoryMatch /> : selected === "tic" ? <TicTacToe /> : selected === "racing" ? <RacingGame /> : selected === "basketball" ? <BasketballGame /> : <SoccerGame />}</div>}
    </div>
    <p className="minigames-note">Progress and scores stay local to this browser for now. Use the arrow keys in 2048 and Turbo Racing. More skill, less random clicking.</p>
  </section>;
}
