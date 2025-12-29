'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoom(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Ensure profile exists (for users created before trigger was set up)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: user.user_metadata?.username || user.email || 'Anonymous'
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      return { error: 'Could not create user profile' }
    }
  }

  const gameType = formData.get('gameType') as string

  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        game_type: gameType,
        player_1_id: user.id,
        status: 'waiting'
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating room:', error)
    return { error: error.message }
  }

  // Initialize game state
  const initialBoardState = gameType === 'tictactoe' 
    ? Array(9).fill(null) 
    : gameType === 'chess' 
      ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Initial FEN
      : {} // Logic for other games later

  await supabase
    .from('game_states')
    .insert([
      {
        room_id: data.id,
        board_state: initialBoardState,
        current_turn: user.id
      }
    ])

  revalidatePath('/')
  redirect(`/room/${data.id}`)
}
