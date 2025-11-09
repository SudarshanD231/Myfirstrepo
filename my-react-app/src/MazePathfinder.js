<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Maze Pathfinder (A* + Q-Learning)</title>
<style>
  :root {
    --wall-color: #475569;
    --open-color: #dbeafe;
    --start-color: #10b981;
    --end-color: #ef4444;
    --astar-explored: #3b82f6;
    --astar-path: #fbbf24;
    --qlearning-explored: #8b5cf6;
    --qlearning-path: #ec4899;
    --car-color: #f59e0b;
    --border-color: #64748b;
    --bg-color: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
  }
  body {
    background: var(--bg-color);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0; padding: 20px;
    color: #1e293b;
    display: flex; flex-direction: column; align-items: center;
  }
  h1 {
    margin-bottom: 10px;
    font-size: 32px;
    text-align: center;
  }
  #controls {
    display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
    justify-content: center;
    align-items: center;
  }
  button {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    background-color: #2563eb;
    color: white;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.5);
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button:hover:not(:disabled) {
    background-color: #3b82f6;
    transform: translateY(-2px);
  }
  button.active {
    background-color: #1e40af;
    box-shadow: 0 6px 14px rgba(30, 64, 175, 0.6);
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  #speedRange, #vehicleSelect {
    padding: 6px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    font-size: 14px;
  }
  #speedRange {
    width: 150px;
  }
  #vehicleSelect {
    cursor: pointer;
    font-size: 16px;
    padding: 8px 12px;
    background-color: white;
  }
  #status {
    margin-bottom: 20px;
    font-weight: 600;
    min-height: 24px;
    font-size: 16px;
    text-align: center;
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    min-width: 300px;
  }
  #mazeContainer {
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  #maze {
    display: grid;
    grid-template-columns: repeat(20, 28px);
    grid-template-rows: repeat(20, 28px);
    gap: 4px;
  }
  .cell {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    box-sizing: border-box;
    background-color: var(--open-color);
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    font-size: 18px;
  }
  .wall {
    background-color: var(--wall-color);
    cursor: pointer;
  }
  .start {
    background-color: var(--start-color);
  }
  .end {
    background-color: var(--end-color);
  }
  .astar-explored {
    background-color: var(--astar-explored);
  }
  .astar-path {
    background-color: var(--astar-path);
    box-shadow: 0 0 10px var(--astar-path);
  }
  .qlearning-explored {
    background-color: var(--qlearning-explored);
  }
  .qlearning-path {
    background-color: var(--qlearning-path);
    box-shadow: 0 0 10px var(--qlearning-path);
  }
  .car {
    background-color: var(--car-color);
    box-shadow: 0 0 12px var(--car-color);
    transform: scale(1.2);
    font-size: 20px;
    animation: bounce 0.5s ease-in-out;
  }
  @keyframes bounce {
    0%, 100% { transform: scale(1.2); }
    50% { transform: scale(1.4); }
  }
  #legend {
    margin-top: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 16px;
    border-radius: 12px;
    max-width: 600px;
  }
  #legend h3 {
    margin-top: 0;
    font-size: 18px;
  }
  .legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .legend-color {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }
</style>
</head>
<body>
<h1>🗺️ Maze Pathfinder (A* + Q-Learning)</h1>

<div id="controls">
  <button id="wallModeBtn" class="active">🧱 Toggle Walls</button>
  <button id="startModeBtn">🟢 Set Start</button>
  <button id="endModeBtn">🔴 Set End</button>
  <button id="runAstarBtn">🎯 Run A*</button>
  <button id="runQLearningBtn">🧠 Run Q-Learning</button>
  <button id="clearPathsBtn">🧹 Clear Paths</button>
  <button id="newMazeBtn">🔄 New Maze</button>
  <button id="toggleThemeBtn">🌙 Dark Mode</button>
  
  <label id="vehicleLabel">
    🚦 Vehicle: 
    <select id="vehicleSelect">
      <option value="🚗">🚗 Car</option>
      <option value="🚲">🚲 Cycle</option>
      <option value="🚚">🚚 Truck</option>
      <option value="🦄">🦄 Unicorn</option>
      <option value="🏍️">🏍️ Bike</option>
      <option value="🚌">🚌 Bus</option>
      <option value="🚁">🚁 Helicopter</option>
      <option value="🛸">🛸 UFO</option>
      <option value="🐎">🐎 Horse</option>
      <option value="🚀">🚀 Rocket</option>
    </select>
  </label>
  
  <label id="speedLabel">
    ⚡ Speed: 
    <input type="range" id="speedRange" min="10" max="200" value="50" />
    <span id="speedValue">50ms</span>
  </label>
</div>

<div id="status">Ready</div>

<div id="mazeContainer">
  <div id="maze"></div>
</div>

<div id="legend">
  <h3>🎨 Legend</h3>
  <div class="legend-grid">
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--start-color);"></div>
      <span>Start Point</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--end-color);"></div>
      <span>End Point</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--astar-explored);"></div>
      <span>A* Explored</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--astar-path);"></div>
      <span>A* Path</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--qlearning-explored);"></div>
      <span>Q-Learning Explored</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--qlearning-path);"></div>
      <span>Q-Learning Path</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--wall-color);"></div>
      <span>Wall</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: var(--car-color);"></div>
      <span>Vehicle</span>
    </div>
  </div>
</div>

<script>
const ROWS = 20;
const COLS = 20;
const DIRECTIONS = [[-1,0],[1,0],[0,-1],[0,1]];

const mazeElement = document.getElementById('maze');
const statusElement = document.getElementById('status');
const wallBtn = document.getElementById('wallModeBtn');
const startBtn = document.getElementById('startModeBtn');
const endBtn = document.getElementById('endModeBtn');
const runAbtn = document.getElementById('runAstarBtn');
const runQbtn = document.getElementById('runQLearningBtn');
const clearPathsBtn = document.getElementById('clearPathsBtn');
const newMazeBtn = document.getElementById('newMazeBtn');
const themeBtn = document.getElementById('toggleThemeBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const vehicleSelect = document.getElementById('vehicleSelect');

let mode = 'wall'; // 'wall' | 'start' | 'end'
let maze = [];
let start = [0, 0];
let end = [ROWS - 1, COLS - 1];
let running = false;
let speed = +speedRange.value;
let darkMode = false;
let vehicleIcon = vehicleSelect.value;

let astarExplored = new Set();
let astarPath = new Set();
let qlearningExplored = new Set();
let qlearningPath = new Set();
let carPos = null;

function createMaze() {
  // Recursive backtracking to carve maze
  maze = Array(ROWS).fill(null).map(() => Array(COLS).fill(1));

  function carve(r, c) {
    maze[r][c] = 0;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + 2 * dr;
      const nc = c + 2 * dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && maze[nr][nc] === 1) {
        maze[r + dr][c + dc] = 0;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
  maze[0][0] = 0;
  maze[ROWS-1][COLS-1] = 0;
}

// Render maze grid
function renderMaze() {
  mazeElement.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (maze[r][c] === 1) cell.classList.add('wall');
      if (r === start[0] && c === start[1]) cell.classList.add('start');
      if (r === end[0] && c === end[1]) cell.classList.add('end');
      const key = r + ',' + c;
      if (astarExplored.has(key)) cell.classList.add('astar-explored');
      if (astarPath.has(key)) cell.classList.add('astar-path');
      if (qlearningExplored.has(key)) cell.classList.add('qlearning-explored');
      if (qlearningPath.has(key)) cell.classList.add('qlearning-path');
      if (carPos && carPos[0] === r && carPos[1] === c) {
        cell.classList.add('car');
        cell.textContent = vehicleIcon; // Use selected vehicle icon
      }
      cell.addEventListener('click', () => {
        if (running) return;
        if (mode === 'wall') {
          maze[r][c] = maze[r][c] === 1 ? 0 : 1;
        } else if (mode === 'start' && maze[r][c] === 0 && !(r === end[0] && c === end[1])) {
          start = [r, c];
        } else if (mode === 'end' && maze[r][c] === 0 && !(r === start[0] && c === start[1])) {
          end = [r, c];
        }
        clearPaths();
        renderMaze();
      });
      mazeElement.appendChild(cell);
    }
  }
}

// Utilities for neighbors and heuristic
function neighbors([r,c]) {
  const result = [];
  for (const [dr, dc] of DIRECTIONS) {
    let nr = r + dr, nc = c + dc;
    if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && maze[nr][nc]===0) result.push([nr,nc]);
  }
  return result;
}

function heuristic([r1,c1],[r2,c2]) {
  return Math.abs(r1-r2) + Math.abs(c1-c2);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// A* Algorithm
async function runAStar() {
  if (running) return;
  running = true;
  statusElement.textContent = 'Running A*...';
  astarExplored.clear();
  astarPath.clear();
  qlearningExplored.clear();
  qlearningPath.clear();
  carPos = null;
  renderMaze();

  let openSet = [{ pos: start, g: 0, f: heuristic(start,end), parent: null }];
  let cameFrom = {};
  let gScore = {};
  gScore[start.toString()] = 0;
  let visited = new Set();

  while (openSet.length > 0) {
    openSet.sort((a,b) => a.f - b.f);
    let current = openSet.shift();
    let cPos = current.pos;
    visited.add(cPos.toString());
    astarExplored.add(cPos.toString());
    renderMaze();
    await sleep(speed);

    if (cPos[0] === end[0] && cPos[1] === end[1]) {
      // Reconstruct path
      let pathList = [];
      let currKey = cPos.toString();
      while (currKey) {
        const [rr,cc] = currKey.split(',').map(Number);
        pathList.push([rr,cc]);
        currKey = cameFrom[currKey];
      }
      pathList.reverse();
      for (const p of pathList) {
        astarPath.add(p.toString());
        carPos = p;
        renderMaze();
        await sleep(speed);
      }
      statusElement.textContent = `✅ A* found path! Length: ${pathList.length}`;
      running = false;
      carPos = null;
      renderMaze();
      return;
    }

    for (const neighbor of neighbors(cPos)) {
      const tG = current.g + 1;
      const neighborKey = neighbor.toString();
      if (!(neighborKey in gScore) || tG < gScore[neighborKey]) {
        cameFrom[neighborKey] = cPos.toString();
        gScore[neighborKey] = tG;
        let f = tG + heuristic(neighbor,end);
        if (!visited.has(neighborKey)) openSet.push({ pos: neighbor, g: tG, f });
      }
    }
  }
  statusElement.textContent = "❌ A* found no path.";
  running = false;
}

// Q-Learning Algorithm
async function runQLearning() {
  if (running) return;
  running = true;
  statusElement.textContent = 'Training Q-Learning...';
  astarExplored.clear();
  astarPath.clear();
  qlearningExplored.clear();
  qlearningPath.clear();
  carPos = null;
  renderMaze();

  const nStates = ROWS * COLS;
  const nActions = 4;
  let qTable = Array.from({ length: nStates }, () => Array(nActions).fill(0));

  const stateToIdx = ([r,c]) => r*COLS + c;

  let epsilon = 0.9;
  const episodes = 200;
  const exploredSet = new Set();

  for (let ep=0; ep<episodes; ep++) {
    let state = [...start];
    let steps = 0;
    let maxSteps = ROWS*COLS*3;

    while ((state[0]!==end[0] || state[1]!==end[1]) && steps < maxSteps) {
      steps++;
      let idx = stateToIdx(state);
      let action;
      if (Math.random() < epsilon) {
        action = Math.floor(Math.random()*4);
      } else {
        const maxQ = Math.max(...qTable[idx]);
        action = qTable[idx].indexOf(maxQ);
      }
      const [dr,dc] = DIRECTIONS[action];
      const nr = state[0]+dr;
      const nc = state[1]+dc;
      const nextState = nr>=0 && nr<ROWS && nc>=0 && nc<COLS && maze[nr][nc]===0 ? [nr,nc] : state;
      const reward = nextState[0]===end[0] && nextState[1]===end[1] ? 100 : -1;

      const oldQ = qTable[idx][action];
      const futureQ = Math.max(...qTable[stateToIdx(nextState)]);
      qTable[idx][action] = oldQ + 0.7*(reward + 0.95*futureQ - oldQ);

      state = nextState;
      exploredSet.add(state.toString());
    }
    epsilon = Math.max(0.1, epsilon*0.98);

    if (ep % 5 === 0) {
      qlearningExplored = new Set(exploredSet);
      statusElement.textContent = `🧠 Q-Learning Episode ${ep + 1} / ${episodes}`;
      renderMaze();
      await sleep(30);
    }
  }

  // Extract learned path
  let path = [start];
  let currState = [...start];
  let maxPath = ROWS*COLS*2;
  for (let i=0; i<maxPath; i++) {
    const idx = stateToIdx(currState);
    const maxAction = qTable[idx].indexOf(Math.max(...qTable[idx]));
    const [dr, dc] = DIRECTIONS[maxAction];
    const nr = currState[0] + dr;
    const nc = currState[1] + dc;
    if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && maze[nr][nc] === 0) {
      currState = [nr, nc];
      if (!path.some(([r,c]) => r===currState[0] && c===currState[1])) path.push(currState);
      if (currState[0] === end[0] && currState[1] === end[1]) break;
    } else {
      break;
    }
  }

  qlearningPath = new Set(path.map(p => p.toString()));
  statusElement.textContent = `✅ Q-Learning complete! Path length: ${path.length}`;
  // Animate car along path
  for (const p of path) {
    carPos = p;
    renderMaze();
    await sleep(speed);
  }
  running = false;
  carPos = null;
  renderMaze();
}

// Clear only path and exploration highlights
function clearPaths() {
  if (running) return;
  astarExplored.clear();
  astarPath.clear();
  qlearningExplored.clear();
  qlearningPath.clear();
  carPos = null;
  statusElement.textContent = 'Paths cleared';
  renderMaze();
}

// Reset maze to new random and clear states
function newMaze() {
  if (running) return;
  createMaze();
  start = [0, 0];
  end = [ROWS-1, COLS-1];
  clearPaths();
  statusElement.textContent = 'New maze created';
  renderMaze();
}

// Toggle dark mode colors
function toggleTheme() {
  darkMode = !darkMode;
  if (darkMode) {
    document.body.style.setProperty('--wall-color', '#475569');
    document.body.style.setProperty('--open-color', '#1e293b');
    document.body.style.setProperty('--start-color', '#10b981');
    document.body.style.setProperty('--end-color', '#ef4444');
    document.body.style.setProperty('--astar-explored', '#3b82f6');
    document.body.style.setProperty('--astar-path', '#fbbf24');
    document.body.style.setProperty('--qlearning-explored', '#8b5cf6');
    document.body.style.setProperty('--qlearning-path', '#ec4899');
    document.body.style.setProperty('--car-color', '#f59e0b');
    document.body.style.setProperty('--border-color', '#64748b');
    document.body.style.setProperty('--bg-color', 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)');
    document.body.style.color = '#e2e8f0';
    themeBtn.textContent = '☀️ Light Mode';
  } else {
    document.body.style.setProperty('--wall-color', '#94a3b8');
    document.body.style.setProperty('--open-color', '#dbeafe');
    document.body.style.setProperty('--start-color', '#10b981');
    document.body.style.setProperty('--end-color', '#ef4444');
    document.body.style.setProperty('--astar-explored', '#60a5fa');
    document.body.style.setProperty('--astar-path', '#fbbf24');
    document.body.style.setProperty('--qlearning-explored', '#a78bfa');
    document.body.style.setProperty('--qlearning-path', '#f472b6');
    document.body.style.setProperty('--car-color', '#f59e0b');
    document.body.style.setProperty('--border-color', '#cbd5e1');
    document.body.style.setProperty('--bg-color', 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)');
    document.body.style.color = '#1e293b';
    themeBtn.textContent = '🌙 Dark Mode';
  }
}

// Event listeners
wallBtn.onclick = () => setModeAndActive('wall');
startBtn.onclick = () => setModeAndActive('start');
endBtn.onclick = () => setModeAndActive('end');
runAbtn.onclick = runAStar;
runQbtn.onclick = runQLearning;
clearPathsBtn.onclick = clearPaths;
newMazeBtn.onclick = newMaze;
themeBtn.onclick = toggleTheme;

speedRange.oninput = e => {
  speed = +e.target.value;
  speedValue.textContent = speed + 'ms';
};

vehicleSelect.onchange = e => {
  vehicleIcon = e.target.value;
  renderMaze(); // Update display if vehicle is currently visible
};

function setModeAndActive(newMode) {
  mode = newMode;
  wallBtn.classList.remove('active');
  startBtn.classList.remove('active');
  endBtn.classList.remove('active');
  if (mode === 'wall') wallBtn.classList.add('active');
  else if (mode === 'start') startBtn.classList.add('active');
  else endBtn.classList.add('active');
}

// Initial setup
createMaze();
renderMaze();
setModeAndActive('wall');
toggleTheme(); // Start dark mode by default

</script>
</body>
</html>
