-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  rating JSONB DEFAULT '{"chess": 1200, "checkers": 1200, "tictactoe": 1000}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Rooms table
CREATE TYPE game_type AS ENUM ('chess', 'checkers', 'tictactoe');
CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'finished');

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type game_type NOT NULL,
  status room_status DEFAULT 'waiting',
  player_1_id UUID REFERENCES public.profiles(id) NOT NULL,
  player_2_id UUID REFERENCES public.profiles(id),
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone" 
ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" 
ON public.rooms FOR INSERT WITH CHECK (auth.uid() = player_1_id);

CREATE POLICY "Players can update their own rooms" 
ON public.rooms FOR UPDATE USING (
  auth.uid() = player_1_id OR auth.uid() = player_2_id
);

-- 3. Game States table
CREATE TABLE IF NOT EXISTS public.game_states (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE PRIMARY KEY,
  board_state JSONB NOT NULL,
  current_turn UUID REFERENCES public.profiles(id),
  moves_history JSONB DEFAULT '[]'::jsonb,
  last_move_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game states are viewable by everyone" 
ON public.game_states FOR SELECT USING (true);

CREATE POLICY "Only players can update game state" 
ON public.game_states FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = game_states.room_id 
    AND (rooms.player_1_id = auth.uid() OR rooms.player_2_id = auth.uid())
  )
);

CREATE POLICY "System can insert game state"
ON public.game_states FOR INSERT WITH CHECK (true);
