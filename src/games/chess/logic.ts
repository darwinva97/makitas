import { Chess, Move, Square, validateFen } from 'chess.js';

export interface ChessGameState {
  fen: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  winner: 'w' | 'b' | null;
  history: string[]; // SAN (Standard Algebraic Notation) history
  capturedPieces: { w: string[]; b: string[] };
}

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class ChessGame {
  private game: Chess;

  constructor(fen: string = INITIAL_FEN) {
    this.game = new Chess(fen);
  }

  // Get current game state
  public getState(): ChessGameState {
    return {
      fen: this.game.fen(),
      turn: this.game.turn(),
      isGameOver: this.game.isGameOver(),
      isCheck: this.game.isCheck(),
      isCheckmate: this.game.isCheckmate(),
      isDraw: this.game.isDraw(),
      isStalemate: this.game.isStalemate(),
      winner: this.game.isCheckmate() ? (this.game.turn() === 'w' ? 'b' : 'w') : null,
      history: this.game.history(),
      capturedPieces: this.getCapturedPieces(),
    };
  }

  // Attempt to make a move
  public makeMove(move: string | { from: string; to: string; promotion?: string }): ChessGameState | null {
    try {
      const result = this.game.move(move);
      if (result) {
        return this.getState();
      }
    } catch (e) {
      // Invalid move
      return null;
    }
    return null;
  }

  // Get possible moves for a specific square (helpful for UI highlighting)
  public getMoves(square: string): string[] {
    return this.game.moves({ square: square as Square, verbose: true }).map((m: any) => m.to);
  }

  // Helper to calculate captured pieces (chess.js doesn't provide this directly efficiently)
  private getCapturedPieces(): { w: string[]; b: string[] } {
    const history = this.game.history({ verbose: true });
    const captured: { w: string[]; b: string[] } = { w: [], b: [] };

    for (const move of history) {
      if (move.captured) {
        // If white moved and captured, they captured a black piece
        if (move.color === 'w') {
          captured.w.push(move.captured);
        } else {
          captured.b.push(move.captured);
        }
      }
    }
    return captured;
  }
  
  public validateFen(fen: string): boolean {
      return validateFen(fen).ok;
  }
}
