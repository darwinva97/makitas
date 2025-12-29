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
    console.log('Attempting to join room as player 2:', { 
      roomId: room.id, 
      userId: user.id,
      roomStatus: room.status,
      player1: room.player_1_id
    });
    
    const { data: updateData, error: joinError } = await supabase
      .from('rooms')
      .update({ 
        player_2_id: user.id,
        status: 'playing' 
      })
      .eq('id', room.id)
      .select();
    
    console.log('Join room result:', { updateData, joinError });
    
    if (!joinError && updateData && updateData.length > 0) {
      // Update the room object locally instead of redirecting
      room.player_2_id = user.id;
      room.player_2 = { id: user.id, username: user.user_metadata?.username || user.email || 'Jugador 2' };
      room.status = 'playing';
    }
  }

  const { data: gameState } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', room.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <GameBoard 
          room={room} 
          initialGameState={gameState} 
          userId={user?.id} 
        />
      </div>
    </div>
  );
}
