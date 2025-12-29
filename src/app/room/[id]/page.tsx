import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import GameBoard from "./game-board";

export default async function RoomPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      *,
      player_1:profiles!player_1_id(username, id),
      player_2:profiles!player_2_id(username, id)
    `)
    .eq('id', params.id)
    .single();

  if (error || !room) {
    notFound();
  }

  // If room is waiting and user is not player 1, join as player 2
  if (user && room.status === 'waiting' && room.player_1_id !== user.id && !room.player_2_id) {
    await supabase
      .from('rooms')
      .update({ 
        player_2_id: user.id,
        status: 'playing' 
      })
      .eq('id', room.id);
    
    // Refresh room data
    return redirect(`/room/${room.id}`);
  }

  const { data: gameState } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', room.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold capitalize">{room.game_type.replace('tictactoe', 'Tic Tac Toe')}</h1>
            <p className="text-muted-foreground">Sala: {room.id}</p>
          </div>
          <div className="flex gap-4">
            <div className={`p-4 rounded-lg border ${gameState?.current_turn === room.player_1_id ? 'border-primary bg-primary/10' : 'bg-card'}`}>
              <p className="text-xs font-medium uppercase text-muted-foreground">Jugador 1 (X)</p>
              <p className="font-bold">{room.player_1?.username}</p>
            </div>
            <div className={`p-4 rounded-lg border ${gameState?.current_turn === room.player_2_id ? 'border-primary bg-primary/10' : 'bg-card'}`}>
              <p className="text-xs font-medium uppercase text-muted-foreground">Jugador 2 (O)</p>
              <p className="font-bold">{room.player_2?.username || 'Esperando...'}</p>
            </div>
          </div>
        </div>

        <GameBoard 
          room={room} 
          initialGameState={gameState} 
          userId={user?.id} 
        />
      </div>
    </div>
  );
}
