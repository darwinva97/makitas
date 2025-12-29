import { createClient } from "@/utils/supabase/server";
import { CreateRoomForm } from "@/components/create-room-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from('rooms')
    .select(`
      *,
      player_1:profiles!player_1_id(username),
      player_2:profiles!player_2_id(username)
    `)
    .order('created_at', { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Lobby de Juegos
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Únete a una partida o crea tu propia sala.
          </p>
        </div>

        {user && (
          <CreateRoomForm />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room) => (
          <Card key={room.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="capitalize">{room.game_type.replace('tictactoe', 'Tic Tac Toe')}</CardTitle>
                <Badge variant={room.status === 'waiting' ? 'secondary' : 'default'}>
                  {room.status === 'waiting' ? 'Esperando' : 'En juego'}
                </Badge>
              </div>
              <CardDescription>
                Creada por {room.player_1?.username || 'Anónimo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-sm space-y-2">
                <p>
                  <strong>Jugador 1:</strong> {room.player_1?.username}
                </p>
                <p>
                  <strong>Jugador 2:</strong> {room.player_2?.username || <span className="italic text-muted-foreground">Esperando oponente...</span>}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={room.status === 'waiting' ? 'default' : 'outline'}>
                <Link href={`/room/${room.id}`}>
                  {room.status === 'waiting' ? 'Unirse' : 'Observar'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {rooms?.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No hay salas activas en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}