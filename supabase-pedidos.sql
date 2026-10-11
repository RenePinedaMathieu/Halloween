-- Pedidos de canciones de los invitados
create table if not exists song_requests (
  id bigserial primary key,
  player text not null,
  team int not null,
  query text not null,
  status text not null default 'searching',   -- searching | results | requested | waiting | queued | rejected | error
  results jsonb,
  chosen jsonb,
  created_at timestamptz not null default now()
);
alter table song_requests enable row level security;
drop policy if exists fiesta on song_requests;
create policy fiesta on song_requests for all using (true) with check (true);
alter publication supabase_realtime add table song_requests;
