'use client'

import { useActionState } from 'react'
import { createRoom } from '@/app/actions'
import { Button } from '@/components/ui/button'

const initialState = {
  error: '',
}

export function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(createRoom, initialState)

  return (
    <form action={formAction} className="flex gap-2 items-start">
      <div className="flex flex-col gap-1">
        <select 
          name="gameType" 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="tictactoe">Tic Tac Toe</option>
          <option value="chess">Ajedrez</option>
          <option value="checkers">Damas</option>
        </select>
        {state?.error && (
            <span className="text-xs text-red-500 font-medium">{state.error}</span>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear Sala'}
      </Button>
    </form>
  )
}
