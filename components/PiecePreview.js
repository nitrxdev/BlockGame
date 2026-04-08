'use client';

import React, { useRef } from 'react';

// Optional palette of colors
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6A4C93', '#FF8C42', '#2E86AB'];

export default function PiecePreview({ piece, dragging, selected, onDragStart }) {
  const pieceRef = useRef(null);

  // Compute width and height based on the actual shape
  const rows = Math.max(...piece.shape.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.shape.map(([, c]) => c)) + 1;

  const containerStyle = {
    display: 'grid',
    gridTemplateRows: `repeat(${rows}, 30px)`,
    gridTemplateColumns: `repeat(${cols}, 30px)`,
    gap: '2px',
    cursor: 'grab',
    touchAction: 'none',
    border: selected ? '2px solid orange' : '2px solid transparent',
    opacity: dragging ? 0.6 : 1,
  };

  // Handle both mouse and touch start
  const handleStart = e => {
    e.preventDefault();
    let clientX, clientY;
    if (e.type === 'touchstart') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = pieceRef.current.getBoundingClientRect();

    // Find which cell was clicked/touched (offset within the piece)
    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;
    const offsetCol = Math.floor((clientX - rect.left) / cellWidth);
    const offsetRow = Math.floor((clientY - rect.top) / cellHeight);

    onDragStart(piece, offsetRow, offsetCol);
  };

  return (
    <div
      ref={pieceRef}
      style={containerStyle}
      draggable={false} // we handle drag manually
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const filled = piece.shape.some(([sr, sc]) => sr === r && sc === c);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: filled ? piece.color : 'transparent',
                borderRadius: '3px',
              }}
            />
          );
        })
      )}
    </div>
  );
}