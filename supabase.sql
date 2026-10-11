-- Halloween app: pegar completo en Supabase > SQL Editor > Run
-- Ojo: las políticas dejan leer/escribir a cualquiera con el link (anon key).
-- Está bien para una fiesta, no para datos sensibles.

create table if not exists players (
  name text primary key,
  team int not null check (team between 1 and 4)
);

-- Una sola fila (id = 1) con el juego que se ve en vivo en los celulares
create table if not exists live_state (
  id int primary key default 1 check (id = 1),
  game text not null default 'none',   -- none | cancion | trivia | disfraz | beerpong | caballos
  phase text not null default 'idle',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into live_state (id) values (1) on conflict do nothing;

create table if not exists scores (
  id bigserial primary key,
  team int not null check (team between 1 and 4),
  game text not null,                  -- beerpong | trivia | cancion | disfraz | caballos | extra
  points numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- Adivina la canción
create table if not exists buzzes (
  id bigserial primary key,
  round int not null,
  attempt int not null default 1,
  player text not null,
  team int not null,
  created_at timestamptz not null default now()
);
create table if not exists song_answers (
  id bigserial primary key,
  round int not null,
  attempt int not null default 1,
  player text not null,
  team int not null,
  answer text not null,
  verdict text,                        -- null (revisando) | ok | no
  reason text,
  created_at timestamptz not null default now()
);

-- Trivia
create table if not exists trivia_votes (
  question_id bigint not null,
  player text not null,
  team int not null,
  option int not null,
  updated_at timestamptz not null default now(),
  primary key (question_id, player)
);

-- Mejor disfraz
create table if not exists costume_noms (
  player text primary key,
  team int not null,
  candidate text not null,
  updated_at timestamptz not null default now()
);
create table if not exists costume_ranks (
  player text not null,
  team int not null,
  category text not null,              -- dificultad | calidad | referencia
  ranking int[] not null,              -- equipos de mejor a peor
  primary key (player, category)
);

-- Constancia de beerpong y carrera de caballos
create table if not exists matches (
  id bigserial primary key,
  game text not null,                  -- beerpong | caballos
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Acceso abierto con la anon key
do $$
declare t text;
begin
  foreach t in array array['players','live_state','scores','buzzes','song_answers','trivia_votes','costume_noms','costume_ranks','matches']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists fiesta on %I', t);
    execute format('create policy fiesta on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- Tiempo real
alter publication supabase_realtime add table live_state, scores, buzzes, song_answers, trivia_votes, costume_noms, costume_ranks, matches;

-- Equipos
insert into players (name, team) values
 ('Rene',1),('Domi',1),('Nicole',1),('Nacho',1),('Sofi S',1),('Coti',1),('Nico Cárcamo',1),('Ignacia',1),('Oscar',1),('Josemi',1),
 ('Fran',2),('Denisse',2),('Victor',2),('Cami',2),('Parranda',2),('Juanpi',2),('Vale',2),('Fox',2),('Cata',2),
 ('Cote',3),('Cach',3),('Caro',3),('Flo',3),('Marianne3',3),('Marianne4',3),('Cucho',3),('Chona',3),('Alela',3),
 ('Contin',4),('Ame',4),('Lucas',4),('Coni',4),('Marianne1',4),('Marianne2',4),('Nico',4),('Rodrigo Orpis',4)
on conflict (name) do update set team = excluded.team;

-- Para reiniciar todo antes de la fiesta (descomentar y correr):
-- truncate scores, buzzes, song_answers, trivia_votes, costume_noms, costume_ranks, matches;
-- update live_state set game='none', phase='idle', data='{}' where id=1;
