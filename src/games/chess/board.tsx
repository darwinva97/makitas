'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { ChessGame, ChessGameState, INITIAL_FEN } from './logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ChessBoardProps {
  initialFen?: string;
  onMove?: (gameState: ChessGameState) => void;
  orientation?: 'white' | 'black';
  disabled?: boolean;
}

export default function ChessBoardComponent({
  initialFen = INITIAL_FEN,
  onMove,
  orientation = 'white',
  disabled = false,
}: ChessBoardProps) {
  const [game, setGame] = useState(new ChessGame(initialFen));
  const [fen, setFen] = useState(initialFen);
  
  // Sync internal state if prop changes (e.g. from realtime update)
  useEffect(() => {
    if (initialFen !== fen) {
      setGame(new ChessGame(initialFen));
      setFen(initialFen);
    }
  }, [initialFen]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    if (disabled) return false;

    // We need to create a new instance or clone to mutate state correctly for next move validation
    // However, our ChessGame wrapper handles mutation internally, we just need to get the result
    
    // NOTE: In a real react app, we might want to avoid mutating the 'game' object directly in state
    // but for chess.js it's common to keep one instance.
    // Let's create a temp instance to validate
    const tempGame = new ChessGame(game.getState().fen);
    const newState = tempGame.makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity for now
    });

    if (newState) {
      setGame(tempGame);
      setFen(newState.fen);
      if (onMove) onMove(newState);
      return true;
    }
    return false;
  }, [game, disabled, onMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-[500px] aspect-square">
        <Chessboard 
          position={fen} 
          onPieceDrop={onDrop}
          boardOrientation={orientation}
          arePiecesDraggable={!disabled}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </div>
  );
}
