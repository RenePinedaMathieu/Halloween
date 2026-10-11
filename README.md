# Halloween · Juegos

- `index.html` → lo que abren todos en el celular (eligen su nombre, ven su equipo, los puntajes y el juego en vivo).
- `host.html` → tu panel (con PIN): controlas qué juego aparece, Spotify, trivia, disfraz, beerpong, caballos y puntajes.
- `api/judge.js` → función de Vercel que usa Claude para decidir si la respuesta de la canción "calza".
- `supabase.sql` → tablas, permisos, tiempo real y los 36 jugadores.

## 1. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor → pega `supabase.sql` completo → Run.
3. Project Settings → API: copia la **Project URL** y la **anon public key**.
4. Para cambiar nombres o equipos, edita la tabla `players` (Table Editor).

## 2. Spotify (necesita Premium)
1. developer.spotify.com/dashboard → Create app → marca **Web API**.
2. Redirect URI: `https://TU-APP.vercel.app/host.html` (exacto, con `/host.html`).
3. Copia el **Client ID**.
4. En el modo de desarrollo, agrega tu correo de Spotify en *User Management*.

## 3. Configuración
Edita el bloque de arriba de `shared.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SPOTIFY_CLIENT_ID` y `HOST_PIN` (clave del panel, hoy 1234) y `TRIVIA_HOST` (quien hace las preguntas y no vota; hoy Rene).
También puedes cambiar `SONG_POINTS`, `ANSWER_SECONDS` y `RESUME_SECONDS` (cuánto se muestra el error antes de que la canción siga).

## 4. Vercel
1. Sube la carpeta a un repo de GitHub e impórtalo en Vercel (Framework: Other, sin build).
2. Settings → Environment Variables: `ANTHROPIC_API_KEY` = tu clave de console.anthropic.com.
3. Deploy. Si la IA falla, el juego usa una comparación aproximada automática como respaldo.

## Cómo se juega

**Canción:** pon "Canción" en los celulares y deja Spotify sonando en el parlante.
"Siguiente canción y abrir" pasa la canción y abre el buzzer de todos. Cuando alguien aprieta, Spotify se pausa y **solo esa persona** tiene 10 s para escribir.
Claude (`api/judge.js`) decide si calza: acepta faltas de ortografía, títulos sin "(feat.)", traducciones obvias y el coro conocido; no acepta solo el artista.
Si acierta, suma el punto. Si falla o no alcanza, su equipo queda bloqueado en esa canción y la música sigue sola a los 3 s para los demás. Si fallan los 4 equipos, se revela la canción.
Si Claude se equivoca, usa "Corregir".

**Trivia:** escribe la pregunta y las alternativas, elige si es para un equipo o para todos y lánzala.
Cada persona vota; la respuesta del equipo es la más votada (en empate gana la que se votó primero).
Cierra la votación, toca la correcta y se suman los puntos solos.

**Mejor disfraz:** 1) nominación: cada uno elige a alguien de su equipo. 2) cierras y queda el más votado por equipo.
3) votación: cada persona ordena los 3 disfraces de los otros equipos en dificultad, calidad y referencia.
4) resultados: 1º = 3 pts, 2º = 2, 3º = 1, promediado y sumado en las 3 categorías. Los puntos de la tabla los sumas tú.

**Beerpong y caballos:** solo registras resultados; los puntos se suman en "Puntajes".

## Reiniciar antes de la fiesta
Corre en el SQL Editor:
```sql
truncate scores, buzzes, song_answers, trivia_votes, costume_noms, costume_ranks, matches;
update live_state set game='none', phase='idle', data='{}' where id=1;
```
En el panel también se guarda el número de canción en el navegador; si quieres partir de 1, cierra sesión del sitio o borra los datos del sitio en el navegador.

**Seguridad:** la anon key y el PIN están en el código del sitio. Sirve para una fiesta, no para nada privado.

**Micrófono (avisos):** en el panel, "Hablar" manda tu voz al parlante conectado a tu celular y pausa Spotify; "Terminar" corta y la música vuelve.
Funciona mejor si hablas lejos del parlante (si no, se acopla con un pitido). Está pensado para hablar, no para cantar: por Bluetooth hay un pequeño retraso.
El navegador pide permiso de micrófono la primera vez, y solo funciona en el sitio publicado (https), no abriendo el archivo directo.
