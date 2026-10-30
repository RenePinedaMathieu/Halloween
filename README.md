# Halloween · Juegos

- `index.html` → lo que abren todos en el celular (eligen su nombre, ven su equipo, los puntajes y el juego en vivo).
- `host.html` → tu panel (con PIN): controlas qué juego aparece, Spotify, trivia, disfraz, beerpong, caballos y puntajes.
- `supabase.sql` → tablas, permisos, tiempo real y los 36 jugadores.

## 1. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor → pega `supabase.sql` completo → Run.
3. Project Settings → API: copia la **Project URL** y la **anon public key**.
4. Para cambiar nombres o equipos, edita la tabla `players` (Table Editor).

## 2. Spotify (necesita Premium)
1. developer.spotify.com/dashboard → Create app → marca **Web API**.
2. Redirect URI: `https://fiestahalloweern.vercel.app/host.html` (exacto, con `/host.html`).
3. Copia el **Client ID**.
4. En el modo de desarrollo, agrega tu correo de Spotify en *User Management*.

## 3. Configuración
Edita el bloque de arriba de `shared.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SPOTIFY_CLIENT_ID` y `HOST_PIN` (clave del panel, hoy 1234) y `TRIVIA_HOST` (quien hace las preguntas y no vota; hoy Rene).
También puedes cambiar `SONG_POINTS`, `TRIVIA_POINTS`, `TRIVIA_GRACE`, `ANSWER_SECONDS` y `RESUME_SECONDS` (cuánto se muestra el error antes de que la canción siga).

## 4. Vercel
1. Sube el contenido de la carpeta a un repo de GitHub e impórtalo en Vercel (Framework: Other, sin build).
2. Cada vez que cambias un archivo en GitHub, Vercel se actualiza solo.

## Cómo se juega

**Canción:** pon "Canción" en los celulares y deja Spotify sonando en el parlante.
"Siguiente canción y abrir" pasa la canción y abre el buzzer de todos. Cuando alguien aprieta, Spotify se pausa y **solo esa persona** tiene 10 s para escribir.
Su respuesta aparece en tu panel junto al nombre real de la canción: tú tocas **✓ Correcta** o **✗ Incorrecta**.
Si es correcta, suma el punto. Si es incorrecta o no alcanza, su equipo queda bloqueado en esa canción y la música sigue sola a los 3 s para los demás. Si fallan los 4 equipos, se revela la canción.
Si te equivocas, usa "Corregir".

**Agregar canciones:** en el panel, busca por nombre o artista y toca "+ Cola". Suena después de la actual. "Siguiente canción" del juego también avanza la cola, así que arma la cola pensando en el juego.

**Trivia (estilo Kahoot):** escribe la pregunta y las alternativas, marca la correcta con el círculo, elige el tiempo (y si vale doble) y lánzala.
Cada persona responde en su celular, una sola vez: acertar vale de 1000 (al instante) a 500 (al último segundo); fallar o no responder, 0.
Cuando se acaba el tiempo (más 2 s de gracia) se revela sola, o antes con "Revelar ahora". Los celulares muestran si acertaste, tus puntos y la tabla de equipos y jugadores.
El puntaje del equipo es el **promedio por jugador**: la suma del equipo dividida por cuántos de ellos han respondido alguna pregunta, así no gana el equipo con más gente.
En la tabla general entra solo como "Trivia (automático)": promedio / 1000, o sea un equipo perfecto suma 1 punto por pregunta (`TRIVIA_POINTS` en `shared.js`).
Si marcaste mal la correcta, abre "¿Marcaste mal la correcta?" y toca la que era: todo se recalcula.
La correcta queda guardada solo en el aparato que lanzó la pregunta; si revelas desde otro, te pide tocarla.

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
