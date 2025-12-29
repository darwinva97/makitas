# Makas - Plataforma de Juegos Multijugador en Tiempo Real

## Descripción General
Makas es una plataforma web para jugar juegos de mesa clásicos (Ajedrez, Damas, Tic-Tac-Toe) en tiempo real. La aplicación permite a los usuarios crear salas, unirse a partidas y observar juegos en curso. La visualización es pública, pero la interacción requiere autenticación.

## Stack Tecnológico

### Frontend & Application Framework
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** shadcn/ui (basado en Radix UI)
- **Gestor de Paquetes:** pnpm

### Backend & Servicios (BaaS - Supabase)
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth (Email/Password, OAuth con Google/GitHub)
- **Tiempo Real:** Supabase Realtime (para actualizaciones de juegos y lobby)
- **Seguridad:** Row Level Security (RLS) en PostgreSQL

### Despliegue
- **Plataforma:** [Vercel](https://vercel.com/)
- **CI/CD:** Integración automática de Vercel con Git

## Arquitectura y Diseño

### Estructura de Rutas (Next.js App Router)
- `/`: Landing page / Lobby principal (lista de salas activas).
- `/auth/login`: Página de inicio de sesión.
- `/auth/register`: Página de registro.
- `/room/[id]`: Sala de juego específica.
  - Renderiza el tablero del juego correspondiente (Ajedrez, Damas, etc.).
  - Muestra chat (opcional) y lista de espectadores.
- `/profile`: Perfil del usuario e historial de partidas.

### Modelo de Datos (Esquema Supabase)

#### 1. `profiles` (Extensión de `auth.users`)
- `id`: UUID (FK a auth.users)
- `username`: Text (unique)
- `avatar_url`: Text
- `rating`: JSONB (elo por juego: `{ chess: 1200, tictactoe: 1000 }`)
- `created_at`: Timestamp

#### 2. `rooms`
- `id`: UUID
- `game_type`: Enum ('chess', 'checkers', 'tictactoe')
- `status`: Enum ('waiting', 'playing', 'finished')
- `player_1_id`: UUID (FK a profiles)
- `player_2_id`: UUID (FK a profiles, nullable)
- `winner_id`: UUID (FK a profiles, nullable)
- `created_at`: Timestamp

#### 3. `game_states`
- `room_id`: UUID (FK a rooms)
- `board_state`: JSONB (representación del tablero actual, ej: FEN para ajedrez)
- `current_turn`: UUID (FK a profiles)
- `moves_history`: JSONB (array de movimientos)
- `last_move_at`: Timestamp

### Lógica de Tiempo Real
- **Lobby:** Suscripción a cambios en la tabla `rooms` para mostrar nuevas salas o cambios de estado en tiempo real.
- **Partida:** Suscripción a `game_states` filtrado por `room_id`.
  - Cuando un jugador hace un movimiento, se actualiza la base de datos.
  - Supabase emite el evento `UPDATE` a todos los clientes conectados a esa sala.

### Seguridad (RLS Policies)
- **Lectura (SELECT):** Pública para `rooms`, `profiles` y `game_states`. Todo el mundo puede ver las partidas.
- **Escritura (INSERT/UPDATE):**
  - Solo usuarios autenticados pueden crear salas (`INSERT` en `rooms`).
  - Solo los jugadores participantes (`player_1_id` o `player_2_id`) pueden actualizar el estado del juego (`UPDATE` en `game_states`) y solo si es su turno.

## Plan de Implementación

1. **Configuración Inicial**
   - Setup de proyecto Next.js 16 + Tailwind + Shadcn UI.
   - Configuración de cliente Supabase (`@supabase/ssr`).

2. **Autenticación**
   - Implementar flujo de Login/Register.
   - Middleware para protección de rutas y gestión de sesiones.

3. **Core - Lobby**
   - Crear tabla `rooms` y componentes de listado.
   - Implementar creación de salas.

4. **Core - Motor de Juegos**
   - Implementar lógica de Tic-Tac-Toe (MVP inicial).
   - Componentes de tablero interactivo.
   - Sincronización de estado vía Supabase Realtime.

5. **Expansión de Juegos**
   - Implementar Ajedrez (usando librerías como `chess.js` y `react-chessboard`).
   - Implementar Damas.

6. **Refinamiento UI/UX**
   - Mejorar feedback visual de turnos, victorias y empates.
   - Diseño responsive.

7. **Despliegue**
   - Configurar variables de entorno en Vercel.
   - Deploy a producción.
