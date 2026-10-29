// ====== CONFIGURA ESTO ======
const CONFIG = {
  SUPABASE_URL: "https://gtpamfivoajjavktmpew.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_b-Ka2xJleSBXRBh1ecNoQw_IyAJwfx_",
  SPOTIFY_CLIENT_ID: "360ac0ec33214e52be0cae7e79c11006",
  HOST_PIN: "1234",          // clave del panel del anfitrión
  TRIVIA_HOST: "Rene",       // quien hace las preguntas de trivia (no vota)
  SONG_POINTS: 1,            // puntos por canción adivinada
  ANSWER_SECONDS: 10,
  RESUME_SECONDS: 1,         // segundos entre marcar ✗ y que la música siga
};
// ============================

const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const TEAMS = {
  1: { name: "Equipo 1", color: "#4f86d9" },
  2: { name: "Equipo 2", color: "#7fb04a" },
  3: { name: "Equipo 3", color: "#a57fd0" },
  4: { name: "Equipo 4", color: "#e0544b" },
};
const GAMES = {
  beerpong: "Beerpong", trivia: "Trivia", cancion: "Canción",
  disfraz: "Disfraz", caballos: "Caballos", extra: "Extra",
};
const CATEGORIES = ["dificultad", "calidad", "referencia"];
const CAT_LABEL = { dificultad: "Dificultad", calidad: "Calidad", referencia: "Referencia" };

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const teamChip = (t) => `<span class="chip" style="--c:${TEAMS[t].color}">${t}</span>`;

async function q(promise) {
  const { data, error } = await promise;
  if (error) { console.error(error); toast("Error: " + error.message); throw error; }
  return data;
}

function toast(msg) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

// Escucha cambios en tablas y llama onChange(tabla)
// window.RT_OK dice si la conexión en vivo está funcionando; si no, las páginas revisan cada pocos segundos
window.RT_OK = false;
function listen(tables, onChange) {
  const ch = db.channel("fiesta-" + Math.random().toString(36).slice(2));
  tables.forEach((t) => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, (p) => onChange(t, p)));
  ch.subscribe((status) => { window.RT_OK = status === "SUBSCRIBED"; rtBadge(); });
  rtBadge();
  return ch;
}
function rtBadge() {
  let el = document.getElementById("rt");
  if (!el) { el = document.createElement("div"); el.id = "rt"; document.body.appendChild(el); }
  el.className = window.RT_OK ? "ok" : "off";
  el.textContent = window.RT_OK ? "● en vivo" : "● revisando cada 2 s";
}
// Firma corta para saber si algo cambió sin redibujar de más
const sig = (...xs) => JSON.stringify(xs);

// ---------- Puntajes ----------
function scoreTable(scores) {
  const rows = {};
  for (const t of [1, 2, 3, 4]) rows[t] = { total: 0 };
  for (const s of scores) {
    rows[s.team][s.game] = (rows[s.team][s.game] || 0) + Number(s.points);
    rows[s.team].total += Number(s.points);
  }
  return rows;
}
function renderScoreboard(scores) {
  const rows = scoreTable(scores);
  const order = [1, 2, 3, 4].sort((a, b) => rows[b].total - rows[a].total);
  const fmt = (n) => (n ? (Math.round(n * 10) / 10).toString() : "–");
  return `<div class="scroll"><table class="scores">
    <thead><tr><th>#</th><th>Equipo</th>${Object.values(GAMES).map((g) => `<th>${g}</th>`).join("")}<th>Total</th></tr></thead>
    <tbody>${order.map((t, i) => `<tr><td>${i + 1}</td><td>${teamChip(t)}</td>
      ${Object.keys(GAMES).map((g) => `<td>${fmt(rows[t][g])}</td>`).join("")}
      <td class="total">${fmt(rows[t].total) === "–" ? 0 : fmt(rows[t].total)}</td></tr>`).join("")}</tbody></table></div>`;
}

// ---------- Trivia: respuesta del equipo = la más votada (empate: gana la que tenga el voto más antiguo) ----------
function triviaTally(votes) {
  const res = {};
  for (const t of [1, 2, 3, 4]) {
    const tv = votes.filter((v) => v.team === t);
    const counts = {}, first = {};
    for (const v of tv) {
      counts[v.option] = (counts[v.option] || 0) + 1;
      const ts = new Date(v.updated_at).getTime();
      if (first[v.option] == null || ts < first[v.option]) first[v.option] = ts;
    }
    const opts = Object.keys(counts).map(Number);
    opts.sort((a, b) => counts[b] - counts[a] || first[a] - first[b]);
    res[t] = { counts, total: tv.length, answer: opts.length ? opts[0] : null };
  }
  return res;
}

// ---------- Disfraz ----------
function costumeCandidates(noms) {
  const out = {};
  for (const t of [1, 2, 3, 4]) {
    const tn = noms.filter((n) => n.team === t);
    const counts = {}, first = {};
    for (const n of tn) {
      counts[n.candidate] = (counts[n.candidate] || 0) + 1;
      const ts = new Date(n.updated_at).getTime();
      if (first[n.candidate] == null || ts < first[n.candidate]) first[n.candidate] = ts;
    }
    const c = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || first[a] - first[b]);
    out[t] = { candidate: c[0] || null, counts };
  }
  return out;
}
// Puntaje Borda: 1º = 3, 2º = 2, 3º = 1. Se promedia por cantidad de votantes.
function costumeResults(ranks) {
  const sum = {}, n = {};
  for (const t of [1, 2, 3, 4]) { sum[t] = {}; n[t] = {}; CATEGORIES.forEach((c) => { sum[t][c] = 0; n[t][c] = 0; }); }
  for (const r of ranks) {
    r.ranking.forEach((team, i) => {
      if (!sum[team]) return;
      sum[team][r.category] += 3 - i;
      n[team][r.category] += 1;
    });
  }
  const res = {};
  for (const t of [1, 2, 3, 4]) {
    res[t] = { total: 0 };
    for (const c of CATEGORIES) {
      res[t][c] = n[t][c] ? sum[t][c] / n[t][c] : 0;
      res[t].total += res[t][c];
    }
  }
  return res;
}

// ---------- Comparación aproximada (respaldo si la IA falla) ----------
function normalizeSong(s) {
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\s-\s.*$/, " ")
    .replace(/feat\..*$|ft\..*$/g, " ")
    .replace(/[^a-z0-9ñ ]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function fuzzyMatch(title, answer) {
  const a = normalizeSong(title), b = normalizeSong(answer);
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.length >= 4 && (a.includes(b) && b.length / a.length >= 0.6)) return true;
  const sim = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  return sim >= 0.75;
}
