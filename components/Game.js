'use client';

import { useEffect, useState } from 'react';
import PiecePreview from './PiecePreview';

const GRID_SIZE = 8;

const SHAPES = [
  { shape: [[0, 0]], weight: 1 }, // 1x1
  { shape: [[0, 0],[0, 1],[1, 0],[1, 1]], weight: 5 }, // 2x2
  { shape: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], weight: 4 }, // 3x3
  { shape: [[0,0],[1,0],[1,1]], weight: 2 }, // L 2x2
  { shape: [[0,1],[1,0],[1,1]], weight: 2 }, // mirrored L 2x2
  { shape: [[0,0],[1,0],[2,0],[2,1]], weight: 4 }, // L 3x2
  { shape: [[0,1],[1,1],[2,1],[2,0]], weight: 4 }, // mirrored L 3x2
  { shape: [[0,0],[0,1],[0,2],[0,3]], weight: 4 }, // 4 horizontal
  { shape: [[0,0],[1,0],[2,0],[3,0]], weight: 4 }, // 4 vertical
  { shape: [[0,0],[0,1],[0,2],[0,3],[0,4]], weight: 3 }, // 5 horizontal
  { shape: [[0,0],[1,0],[2,0],[3,0],[4,0]], weight: 3 }, // 5 vertical
  { shape: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], weight: 4 }, // 3w 2h
  { shape: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], weight: 4 }, // 2w 3h
  { shape: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]], weight: 2 }, // 3 diag
  { shape: [[0,0],[1,1],[2,2]], weight: 1 }, // 2 diag
  { shape: [[0,0],[1,1]], weight: 2 }, // 2w 1h
  { shape: [[0,0],[1,0]], weight: 2 }, // 1w 2h
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6A4C93', '#FF8C42', '#2E86AB'];

function createGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
}

function randomPiece() {
  const totalWeight = SHAPES.reduce((sum, s) => sum + s.weight, 0);
  let rnd = Math.random() * totalWeight;
  for (const s of SHAPES) {
    if (rnd < s.weight) {
      return { id: `${Date.now()}-${Math.random()}`, shape: s.shape, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    }
    rnd -= s.weight;
  }
  const s = SHAPES[0];
  return { id: `${Date.now()}-${Math.random()}`, shape: s.shape, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
}

export default function Game() {
  const [grid, setGrid] = useState(createGrid());
  const [pieces, setPieces] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [dragOffset, setDragOffset] = useState([0, 0]);
  const [dragPos, setDragPos] = useState([0, 0]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem('block-blast-high-score') || 0));
    setPieces([randomPiece(), randomPiece(), randomPiece()]);
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('block-blast-high-score', String(score));
    }
  }, [score, highScore]);

  function canPlace(piece, row, col, board = grid) {
    return piece.shape.every(([r, c]) => {
      const gr = row + r;
      const gc = col + c;
      return gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE && !board[gr][gc];
    });
  }

  function placePiece(piece, row, col) {
    const nextGrid = grid.map(r => [...r]);
    piece.shape.forEach(([r, c]) => nextGrid[row + r][col + c] = piece.color);

    const rowsToClear = [];
    const colsToClear = [];

    for (let r = 0; r < GRID_SIZE; r++) if (nextGrid[r].every(Boolean)) rowsToClear.push(r);
    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) if (!nextGrid[r][c]) full = false;
      if (full) colsToClear.push(c);
    }

    rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) nextGrid[r][c] = false; });
    colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) nextGrid[r][c] = false; });

    const points = piece.shape.length + (rowsToClear.length + colsToClear.length) * 10;
    setGrid(nextGrid);
    setScore(prev => prev + points);
    setPieces(prev => {
      const remaining = prev.filter(p => p.id !== piece.id);
      if (!remaining.length) return [randomPiece(), randomPiece(), randomPiece()];
      return remaining;
    });
  }

  function resetGame() {
    setGrid(createGrid());
    setScore(0);
    setPieces([randomPiece(), randomPiece(), randomPiece()]);
    setDraggingPiece(null);
    setDragPos([0, 0]);
  }

  function rerollPieces() {
    setPieces([randomPiece(), randomPiece(), randomPiece()]);
    setDraggingPiece(null);
    setDragPos([0, 0]);
  }

  function anyMoveAvailable(board, currentPieces) {
    for (const piece of currentPieces)
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (canPlace(piece, r, c, board)) return true;
    return false;
  }

  useEffect(() => {
    if (pieces.length > 0 && !anyMoveAvailable(grid, pieces)) {
      setTimeout(() => {
        alert('Game Over');
        resetGame();
      }, 100);
    }
  }, [grid, pieces]);

  // Drag start
  const handleDragStart = (piece, offsetRow, offsetCol) => {
    setDraggingPiece(piece);
    setDragOffset([offsetRow, offsetCol]);
  };

  // Update drag position
const handleMouseMove = e => {
  if (!draggingPiece) return;

  const gridRect = document.querySelector('.grid').getBoundingClientRect();
  const cellSize = gridRect.width / GRID_SIZE;

  const col = Math.floor((e.clientX - gridRect.left) / cellSize) - dragOffset[1];
  const row = Math.floor((e.clientY - gridRect.top) / cellSize) - dragOffset[0];

  setDragPos([row, col]);
};

const handleTouchMove = e => {
  if (!draggingPiece) return;
  const t = e.touches[0];

  const gridRect = document.querySelector('.grid').getBoundingClientRect();
  const cellSize = gridRect.width / GRID_SIZE;

  // Offset the piece a little above/right of the finger
  const offsetX = 20;
  const offsetY = 40;
  const adjustedX = t.clientX - offsetX;
  const adjustedY = t.clientY - offsetY;

  const col = Math.floor((adjustedX - gridRect.left) / cellSize) - dragOffset[1];
  const row = Math.floor((adjustedY - gridRect.top) / cellSize) - dragOffset[0];

  setDragPos([row, col]);
};

  const handleDrop = () => {
    const [row, col] = dragPos;
    if (draggingPiece && canPlace(draggingPiece, row, col)) {
      placePiece(draggingPiece, row, col);
    }
    setDraggingPiece(null);
    setDragPos([0, 0]);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleDrop);
    window.addEventListener('touchend', handleDrop);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleDrop);
      window.removeEventListener('touchend', handleDrop);
    };
  }, [draggingPiece, dragPos, dragOffset]);

  return (
    <div className="game-container">
      <div className="score-section">
        <div className="high-score">High Score: {highScore}</div>
        <div className="score">Score: {score}</div>
      </div>

      <div className="grid">
  {grid.map((row, r) =>
    row.map((cell, c) => {
      let highlight = false;
      let highlightColor = 'lightgreen'; // default valid

      if (draggingPiece) {
        const [rowOffset, colOffset] = dragPos;
        highlight = draggingPiece.shape.some(([sr, sc]) => sr + rowOffset === r && sc + colOffset === c);

        // Check if the piece can be placed at current drag position
        const validPlacement = canPlace(draggingPiece, rowOffset, colOffset);
        if (!validPlacement && highlight) {
          highlightColor = 'tomato'; // red shadow if invalid
        } else if (highlight) {
          highlightColor = 'lightgreen'; // green if valid
        }
      }

      return (
        <div
          key={`${r}-${c}`}
          className={`grid-cell ${cell ? 'filled' : ''}`}
          style={{ backgroundColor: cell || (highlight ? highlightColor : 'lightgray') }}
          data-cell={`${r}-${c}`}
        />
      );
    })
  )}
</div>

      <div className="pieces-row">
        {pieces.map(piece => (
          <PiecePreview
            key={piece.id}
            piece={piece}
            dragging={draggingPiece?.id === piece.id}
            selected={draggingPiece?.id === piece.id}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      <div className="controls">
        <button onClick={resetGame}>New Game</button>
        <button onClick={rerollPieces}>Re-roll Pieces</button>
      </div>
    </div>
  );
}