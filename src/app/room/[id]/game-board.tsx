'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

import ChessBoardComponent from '@/games/chess/board'

export default function GameBoard({ room: initialRoom, initialGameState, userId }: any) {
  const [gameState, setGameState] = useState(initialGameState)
  const [room, setRoom] = useState(initialRoom)
  const supabase = createClient()

  useEffect(() => {
    console.log('Setting up realtime subscription for room:', room.id)
    
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${room.id}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log('Received game_states change:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setGameState(payload.new)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log('Received rooms change:', payload)
          // When room updates (e.g., player 2 joins), fetch full room data with profiles
          const { data: updatedRoom } = await supabase
            .from('rooms')
            .select(`
              *,
              player_1:profiles!player_1_id(username, id),
              player_2:profiles!player_2_id(username, id)
            `)
            .eq('id', room.id)
            .single()
          
          if (updatedRoom) {
            console.log('Updated room data:', updatedRoom)
            setRoom(updatedRoom)
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        console.log('Subscription status:', status, err || '')
      })

    return () => {
      console.log('Removing channel')
      supabase.removeChannel(channel)
    }
  }, [room.id])

  const board = gameState.board_state
  const isMyTurn = gameState.current_turn === userId
  const isPlayer = room.player_1_id === userId || room.player_2_id === userId

  // Header with player info
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold capitalize">
          {room.game_type === 'tictactoe' ? 'Tic Tac Toe' : room.game_type}
        </h1>
        <p className="text-muted-foreground">Sala: {room.id.slice(0, 8)}...</p>
      </div>
      <div className="flex gap-4">
        <div className={`p-4 rounded-lg border ${gameState?.current_turn === room.player_1_id ? 'border-primary bg-primary/10' : 'bg-card'}`}>
          <p className="text-xs font-medium uppercase text-muted-foreground">Jugador 1 {room.game_type === 'tictactoe' ? '(X)' : '(Blancas)'}</p>
          <p className="font-bold">{room.player_1?.username || 'Cargando...'}</p>
        </div>
        <div className={`p-4 rounded-lg border ${gameState?.current_turn === room.player_2_id ? 'border-primary bg-primary/10' : 'bg-card'}`}>
          <p className="text-xs font-medium uppercase text-muted-foreground">Jugador 2 {room.game_type === 'tictactoe' ? '(O)' : '(Negras)'}</p>
          <p className="font-bold">{room.player_2?.username || 'Esperando...'}</p>
        </div>
      </div>
    </div>
  )

  // --- Tic Tac Toe Logic ---
  const checkWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const handleTicTacToeMove = async (index: number) => {
    if (!isMyTurn || board[index] || room.status !== 'playing') return

    const newBoard = [...board]
    newBoard[index] = userId === room.player_1_id ? 'X' : 'O'
    
    const nextTurn = userId === room.player_1_id ? room.player_2_id : room.player_1_id
    const winnerSymbol = checkWinner(newBoard)
    
    let updates: any = {
      board_state: newBoard,
      current_turn: nextTurn,
    }

    if (winnerSymbol) {
      const winnerId = winnerSymbol === 'X' ? room.player_1_id : room.player_2_id
      await supabase.from('rooms').update({ status: 'finished', winner_id: winnerId }).eq('id', room.id)
      alert(`¡Ganador: ${winnerSymbol}!`)
    } else if (!newBoard.includes(null)) {
      await supabase.from('rooms').update({ status: 'finished' }).eq('id', room.id)
      alert('¡Empate!')
    }

    await supabase
      .from('game_states')
      .update(updates)
      .eq('room_id', room.id)
  }

  // --- Chess Logic ---
  const handleChessMove = async (newChessState: any) => {
      if (room.status !== 'playing') return;

      const nextTurn = gameState.current_turn === room.player_1_id ? room.player_2_id : room.player_1_id;
      
      let updates: any = {
          board_state: newChessState.fen, // Store FEN string as board state
          current_turn: nextTurn,
          // We could append to history here if we wanted
      }

      if (newChessState.isGameOver) {
          let winnerId = null;
          if (newChessState.winner === 'w') winnerId = room.player_1_id;
          else if (newChessState.winner === 'b') winnerId = room.player_2_id;
          
          await supabase.from('rooms').update({ status: 'finished', winner_id: winnerId }).eq('id', room.id);
          alert(winnerId ? '¡Jaque Mate!' : '¡Tablas!');
      }

      const { error } = await supabase
        .from('game_states')
        .update(updates)
        .eq('room_id', room.id)
      
      if (error) console.error("Error updating chess state:", error);
  }


  if (room.game_type === 'chess') {
      // board_state for chess is just the FEN string.
      // If it's empty/initial, use start position.
      const currentFen = typeof gameState.board_state === 'string' ? gameState.board_state : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const orientation = userId === room.player_2_id ? 'black' : 'white';
      
      return (
          <div className="flex flex-col items-center gap-8">
             {renderHeader()}
             <ChessBoardComponent 
                initialFen={currentFen}
                orientation={orientation}
                disabled={!isMyTurn || room.status !== 'playing'}
                onMove={handleChessMove}
             />
             <div className="text-center">
                {!isPlayer ? (
                  <p className="text-muted-foreground">Estás observando la partida.</p>
                ) : room.status === 'finished' ? (
                  <p className="text-xl font-bold">¡Partida finalizada!</p>
                ) : room.status === 'waiting' ? (
                  <p className="text-muted-foreground">Esperando que se una un oponente...</p>
                ) : isMyTurn ? (
                  <p className="text-xl font-bold text-primary animate-pulse">¡Es tu turno!</p>
                ) : (
                  <p className="text-muted-foreground">Esperando el movimiento del oponente...</p>
                )}
             </div>
          </div>
      )
  }

  if (room.game_type !== 'tictactoe') {
    return (
      <>
        {renderHeader()}
        <div className="p-8 text-center border rounded-lg">Juego &quot;{room.game_type}&quot; aún no implementado.</div>
      </>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {renderHeader()}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[300px]">
        {board.map((cell: string, i: number) => (
          <button
            key={i}
            disabled={!isMyTurn || !!cell || room.status !== 'playing'}
            onClick={() => handleTicTacToeMove(i)}
            className="h-24 w-24 bg-card border-2 flex items-center justify-center text-4xl font-bold rounded-lg hover:bg-accent transition-colors disabled:cursor-not-allowed"
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="text-center">
        {!isPlayer ? (
          <p className="text-muted-foreground">Estás observando la partida.</p>
        ) : room.status === 'finished' ? (
          <p className="text-xl font-bold">¡Partida finalizada!</p>
        ) : room.status === 'waiting' ? (
          <p className="text-muted-foreground">Esperando que se una un oponente...</p>
        ) : isMyTurn ? (
          <p className="text-xl font-bold text-primary animate-pulse">¡Es tu turno!</p>
        ) : (
          <p className="text-muted-foreground">Esperando el movimiento del oponente...</p>
        )}
      </div>
    </div>
  )
}
