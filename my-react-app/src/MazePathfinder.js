import React, { useState, useEffect } from 'react';

// Grid size
const ROWS = 20;
const COLS = 20;

// Directions for neighbors
const DIRECTIONS = [
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

// Heuristic for A* (Manhattan)
const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

// Utility sleep for animation timing
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const MazePathfinderGrid = () => {
  // Maze state: 0 = open, 1 = wall
  const [maze, setMaze] = useState(() => generateMaze(ROWS, COLS));
  // Start and end positions
  const [start, setStart] = useState([0, 0]);
  const [end, setEnd] = useState([ROWS - 1, COLS - 1]);
  // Exploration arrays for both algorithms
  const [astarExplored, setAstarExplored] = useState([]);
  const [qlearningExplored, setQlearningExplored] = useState([]);
  // Paths found by algorithms
  const [astarPath, setAstarPath] = useState([]);
  const [qlearningPath, setQlearningPath] = useState([]);
  // Vehicle position for animation
  const [vehiclePos, setVehiclePos] = useState(null);
  // Running flag disables interaction during animation
  const [running, setRunning] = useState(false);
  // Mode: for setting walls or start/end points
  const [mode, setMode] = useState('wall'); // 'wall', 'start', 'end'
  // Animation speed
  const [speed, setSpeed] = useState(50);
  // Dark mode
  const [darkMode, setDarkMode] = useState(true);
  // Status message
  const [status, setStatus] = useState('Ready');
  // Vehicle selection
  const [vehicleIcon, setVehicleIcon] = useState('🚗');

  // Generate maze using recursive backtracking
  function generateMaze(rows, cols) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(1));

    function carve(r, c) {
      grid[r][c] = 0;
      const dirs = [...DIRECTIONS].map(d => d.slice()).sort(() => Math.random() - 0.5);
      for (const [dr, dc] of dirs) {
        const nr = r + dr * 2, nc = c + dc * 2;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[r + dr][c + dc] = 0;
          carve(nr, nc);
        }
      }
    }

    carve(0, 0);
    grid[0][0] = 0;
    grid[rows - 1][cols - 1] = 0;
    return grid;
  }

  // Handler for clicking cells (toggle walls or place start/end)
  const handleCellClick = (r, c) => {
    if (running) return;

    if (mode === 'wall') {
      setMaze((prev) => {
        const newMaze = prev.map(row => row.slice());
        newMaze[r][c] = newMaze[r][c] === 1 ? 0 : 1;
        return newMaze;
      });
    } else if (mode === 'start') {
      if (maze[r][c] === 0) setStart([r, c]);
    } else if (mode === 'end') {
      if (maze[r][c] === 0) setEnd([r, c]);
    }
  };

  // Get neighbors that are valid and open
  const neighbors = ([r, c]) => {
    return DIRECTIONS.map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) =>
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        maze[nr][nc] === 0
      );
  };

  // Run A* pathfinding step-by-step with animation
  const runAStar = async () => {
    if (running) return;
    setRunning(true);
    setAstarExplored([]);
    setAstarPath([]);
    setQlearningExplored([]);
    setQlearningPath([]);
    setVehiclePos(null);
    setStatus('Running A*...');

    const openSet = [{ pos: start, g: 0, f: heuristic(start, end), parent: null }];
    const cameFrom = {};
    const gScore = {};
    gScore[start.toString()] = 0;
    const visitedSet = new Set();

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const cPos = current.pos;
      visitedSet.add(cPos.toString());

      setAstarExplored((prev) => [...prev, cPos]);

      if (cPos[0] === end[0] && cPos[1] === end[1]) {
        // Reconstruct path
        const pathList = [];
        let currKey = cPos.toString();
        while (currKey) {
          const [r, c] = currKey.split(',').map(Number);
          pathList.push([r, c]);
          currKey = cameFrom[currKey];
        }
        pathList.reverse();
        setAstarPath(pathList);
        setStatus(`✅ A* found path! Length: ${pathList.length}`);

        // Animate vehicle along the path
        for (const p of pathList) {
          setVehiclePos(p);
          await sleep(speed);
        }
        setVehiclePos(null);
        setRunning(false);
        return;
      }

      for (const neighbor of neighbors(cPos)) {
        const tentativeG = current.g + 1;
        const neighborKey = neighbor.toString();

        if (!gScore.hasOwnProperty(neighborKey) || tentativeG < gScore[neighborKey]) {
          cameFrom[neighborKey] = cPos.toString();
          gScore[neighborKey] = tentativeG;
          const fScore = tentativeG + heuristic(neighbor, end);
          if (!visitedSet.has(neighborKey)) {
            openSet.push({ pos: neighbor, g: tentativeG, f: fScore, parent: cPos });
          }
        }
      }

      await sleep(speed);
    }
    // No path found
    setStatus('❌ A* found no path');
    setRunning(false);
  };

  // Run Q-Learning with training visualization
  const runQLearning = async () => {
    if (running) return;
    setRunning(true);
    setAstarExplored([]);
    setAstarPath([]);
    setQlearningExplored([]);
    setQlearningPath([]);
    setVehiclePos(null);
    setStatus('Training Q-Learning...');

    const nStates = ROWS * COLS;
    const nActions = 4;
    const qTable = Array.from({ length: nStates }, () => Array(nActions).fill(0));
    const stateToIndex = ([r, c]) => r * COLS + c;
    
    let epsilon = 0.9;
    const episodes = 200;
    const exploredSet = new Set();

    // Training episodes
    for (let ep = 0; ep < episodes; ep++) {
      let state = [...start];
      let steps = 0;
      const maxSteps = ROWS * COLS * 3;

      while ((state[0] !== end[0] || state[1] !== end[1]) && steps < maxSteps) {
        steps++;
        const stIndex = stateToIndex(state);
        let actionIndex;

        // Epsilon-greedy action selection
        if (Math.random() < epsilon) {
          actionIndex = Math.floor(Math.random() * 4);
        } else {
          const maxQ = Math.max(...qTable[stIndex]);
          actionIndex = qTable[stIndex].indexOf(maxQ);
        }

        const [dr, dc] = DIRECTIONS[actionIndex];
        const nr = state[0] + dr, nc = state[1] + dc;
        const nextState = 
          nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && maze[nr][nc] === 0
            ? [nr, nc]
            : state;

        const reward = (nextState[0] === end[0] && nextState[1] === end[1]) ? 100 : -1;

        const oldQ = qTable[stIndex][actionIndex];
        const futureQ = Math.max(...qTable[stateToIndex(nextState)]);
        qTable[stIndex][actionIndex] = oldQ + 0.7 * (reward + 0.95 * futureQ - oldQ);

        state = nextState;
        exploredSet.add(state.toString());
      }

      epsilon = Math.max(0.1, epsilon * 0.98);

      // Update visualization every few episodes
      if (ep % 5 === 0) {
        setQlearningExplored(Array.from(exploredSet).map(s => s.split(',').map(Number)));
        setStatus(`🧠 Q-Learning Episode: ${ep + 1}/${episodes}`);
        await sleep(10);
      }
    }

    // Extract learned path
    let pathQ = [start];
    let currState = [...start];
    const maxPathSteps = ROWS * COLS * 2;

    for (let i = 0; i < maxPathSteps; i++) {
      const stIndex = stateToIndex(currState);
      const maxIndex = qTable[stIndex].indexOf(Math.max(...qTable[stIndex]));
      const [dr, dc] = DIRECTIONS[maxIndex];
      const nr = currState[0] + dr, nc = currState[1] + dc;

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && maze[nr][nc] === 0) {
        currState = [nr, nc];
        if (!pathQ.some(([r, c]) => r === currState[0] && c === currState[1])) {
          pathQ.push(currState);
        }
        if (currState[0] === end[0] && currState[1] === end[1]) break;
      } else {
        break;
      }
    }

    setQlearningPath(pathQ);
    setStatus(`✅ Q-Learning complete! Path length: ${pathQ.length}`);

    // Animate vehicle along the learned path
    for (const p of pathQ) {
      setVehiclePos(p);
      await sleep(speed);
    }
    setVehiclePos(null);
    setRunning(false);
  };

  // Clear paths and exploration
  const clearPaths = () => {
    if (running) return;
    setAstarExplored([]);
    setQlearningExplored([]);
    setAstarPath([]);
    setQlearningPath([]);
    setVehiclePos(null);
    setStatus('Paths cleared');
  };

  // Reset maze to a new random generation
  const resetMaze = () => {
    if (running) return;
    setMaze(generateMaze(ROWS, COLS));
    setStart([0, 0]);
    setEnd([ROWS - 1, COLS - 1]);
    setAstarExplored([]);
    setQlearningExplored([]);
    setAstarPath([]);
    setQlearningPath([]);
    setVehiclePos(null);
    setStatus('New maze generated');
  };

  const theme = darkMode ? {
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    cardBg: 'rgba(30, 41, 59, 0.8)',
    text: '#e2e8f0',
    wall: '#475569',
    open: '#1e293b',
    start: '#10b981',
    end: '#ef4444',
    astarExplored: '#3b82f6',
    astarPath: '#fbbf24',
    qlearningExplored: '#8b5cf6',
    qlearningPath: '#ec4899',
    vehicle: '#f59e0b',
    border: '#334155'
  } : {
    bg: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    text: '#1e293b',
    wall: '#94a3b8',
    open: '#f1f5f9',
    start: '#10b981',
    end: '#ef4444',
    astarExplored: '#60a5fa',
    astarPath: '#fbbf24',
    qlearningExplored: '#a78bfa',
    qlearningPath: '#f472b6',
    vehicle: '#f59e0b',
    border: '#cbd5e1'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      padding: '30px 20px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: theme.text,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 10,
          textShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          🗺️ Maze Pathfinder (A* + Q-Learning)
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: 16,
          opacity: 0.8,
          marginBottom: 25
        }}>
          Visualize pathfinding algorithms with custom vehicle selection
        </p>

        {/* Controls */}
        <div style={{
          background: theme.cardBg,
          backdropFilter: 'blur(10px)',
          padding: 20,
          borderRadius: 16,
          marginBottom: 25,
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setMode('wall')} 
              disabled={running}
              style={buttonStyleFunc(mode === 'wall', running, darkMode)}
            >
              🧱 Toggle Walls
            </button>
            <button 
              onClick={() => setMode('start')} 
              disabled={running}
              style={buttonStyleFunc(mode === 'start', running, darkMode)}
            >
              🟢 Set Start
            </button>
            <button 
              onClick={() => setMode('end')} 
              disabled={running}
              style={buttonStyleFunc(mode === 'end', running, darkMode)}
            >
              🔴 Set End
            </button>
            <div style={{ width: '100%', height: 1, background: theme.border, margin: '5px 0' }} />
            <button 
              onClick={runAStar} 
              disabled={running}
              style={algorithmButtonStyle(running, darkMode, '#3b82f6')}
            >
              🎯 Run A*
            </button>
            <button 
              onClick={runQLearning} 
              disabled={running}
              style={algorithmButtonStyle(running, darkMode, '#8b5cf6')}
            >
              🧠 Run Q-Learning
            </button>
            <button 
              onClick={clearPaths} 
              disabled={running}
              style={secondaryButtonStyle(running, darkMode)}
            >
              🧹 Clear Paths
            </button>
            <button 
              onClick={resetMaze} 
              disabled={running}
              style={secondaryButtonStyle(running, darkMode)}
            >
              🔄 New Maze
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              style={secondaryButtonStyle(false, darkMode)}
            >
              {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          <div style={{ 
            marginTop: 15, 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 15, 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <span>⚡ Speed:</span>
              <input
                type="range"
                min={10}
                max={200}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={running}
                style={{ width: 150 }}
              />
              <span style={{ opacity: 0.7, minWidth: 50 }}>{speed}ms</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <span>🚦 Vehicle:</span>
              <select
                value={vehicleIcon}
                onChange={(e) => setVehicleIcon(e.target.value)}
                disabled={running}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: darkMode ? '#334155' : 'white',
                  color: theme.text,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
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
          </div>
        </div>

        {/* Status */}
        <div style={{
          background: theme.cardBg,
          backdropFilter: 'blur(10px)',
          padding: 15,
          borderRadius: 12,
          marginBottom: 25,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 16,
          boxShadow: darkMode 
            ? '0 4px 16px rgba(0,0,0,0.3)' 
            : '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          Status: {status}
        </div>

        {/* Maze Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 25
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 28px)`,
            gridTemplateRows: `repeat(${ROWS}, 28px)`,
            gap: 2,
            padding: 20,
            background: theme.cardBg,
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            boxShadow: darkMode 
              ? '0 12px 40px rgba(0,0,0,0.5)' 
              : '0 12px 40px rgba(0,0,0,0.15)',
          }}>
            {maze.map((row, r) =>
              row.map((cell, c) => {
                const isStart = start[0] === r && start[1] === c;
                const isEnd = end[0] === r && end[1] === c;
                const isAstarExplored = astarExplored.some(([er, ec]) => er === r && ec === c);
                const isQlearningExplored = qlearningExplored.some(([er, ec]) => er === r && ec === c);
                const isAstarPath = astarPath.some(([pr, pc]) => pr === r && pc === c);
                const isQlearningPath = qlearningPath.some(([pr, pc]) => pr === r && pc === c);
                const isVehicle = vehiclePos && vehiclePos[0] === r && vehiclePos[1] === c;

                let bgColor = cell === 1 ? theme.wall : theme.open;
                let content = '';

                if (isStart) {
                  bgColor = theme.start;
                  content = '🟢';
                } else if (isEnd) {
                  bgColor = theme.end;
                  content = '🔴';
                } else if (isVehicle) {
                  bgColor = theme.vehicle;
                  content = vehicleIcon;
                } else if (isAstarPath) {
                  bgColor = theme.astarPath;
                } else if (isQlearningPath) {
                  bgColor = theme.qlearningPath;
                } else if (isAstarExplored) {
                  bgColor = theme.astarExplored;
                } else if (isQlearningExplored) {
                  bgColor = theme.qlearningExplored;
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: bgColor,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 4,
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      cursor: running ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isVehicle ? 20 : 14,
                      boxShadow: (isAstarPath || isQlearningPath || isVehicle) 
                        ? `0 0 12px ${bgColor}` 
                        : 'none',
                      transform: isVehicle ? 'scale(1.2)' : 'scale(1)',
                      animation: isVehicle ? 'bounce 0.5s ease-in-out' : 'none',
                    }}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          background: theme.cardBg,
          backdropFilter: 'blur(10px)',
          padding: 20,
          borderRadius: 16,
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 15, fontSize: 18 }}>🎨 Legend</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { color: theme.start, label: '🟢 Start Point' },
              { color: theme.end, label: '🔴 End Point' },
              { color: theme.astarExplored, label: 'A* Explored' },
              { color: theme.astarPath, label: 'A* Path' },
              { color: theme.qlearningExplored, label: 'Q-Learning Explored' },
              { color: theme.qlearningPath, label: 'Q-Learning Path' },
              { color: theme.vehicle, label: `${vehicleIcon} Vehicle` },
              { color: theme.wall, label: 'Wall' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: 4,
                  border: `2px solid ${theme.border}`
                }} />
                <span style={{ fontSize: 14 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1.2); }
          50% { transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};

const buttonStyleFunc = (active, disabled, darkMode) => ({
  padding: '10px 18px',
  backgroundColor: active 
    ? (darkMode ? '#3b82f6' : '#2563eb')
    : (darkMode ? '#334155' : '#e2e8f0'),
  color: active ? '#fff' : (darkMode ? '#cbd5e1' : '#475569'),
  border: 'none',
  borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: 14,
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease',
  boxShadow: active 
    ? (darkMode ? '0 4px 16px rgba(59, 130, 246, 0.4)' : '0 4px 16px rgba(37, 99, 235, 0.3)')
    : 'none',
  transform: active ? 'translateY(-2px)' : 'none',
});

const algorithmButtonStyle = (disabled, darkMode, color) => ({
  padding: '12px 24px',
  backgroundColor: color,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 700,
  fontSize: 15,
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease',
  boxShadow: `0 6px 20px ${color}66`,
  transform: disabled ? 'none' : 'translateY(-2px)',
});

const secondaryButtonStyle = (disabled, darkMode) => ({
  padding: '10px 18px',
  backgroundColor: darkMode ? '#475569' : '#cbd5e1',
  color: darkMode ? '#e2e8f0' : '#1e293b',
  border: 'none',
  borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: 14,
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease',
});

export default MazePathfinderGrid;
