// Vercel Function: decide si la respuesta "calza" con la canción.
// Requiere la variable de entorno ANTHROPIC_API_KEY en Vercel.
// El criterio es el mismo que judgePrompt() en shared.js; si cambias uno, cambia el otro.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  const { title, artist, answer } = req.body || {};
  if (!title || !answer) return res.status(400).json({ error: "Falta title o answer" });

  const prompt = judgePrompt(title, artist, answer);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const text = (data.content || []).map((c) => c.text || "").join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return res.status(200).json({ match: !!json.match, reason: String(json.reason || "") });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}

function judgePrompt(title, artist, answer) {
  return `Eres el juez de "adivina la canción" en una fiesta de Halloween en Chile.
Canción que está sonando: "${title}"${artist ? ` de ${artist}` : ""}
Lo que escribió el jugador: "${answer}"

¿Adivinó el NOMBRE de la canción? Sé generoso como un buen amigo, pero no regales puntos:
- SÍ vale: faltas de ortografía, escribirlo como suena, sin tildes, mayúsculas, palabras de relleno, abreviaciones obvias, traducción obvia del título.
- SÍ vale: el título sin "(feat. ...)", "- Remastered", "(Live)", "Remix" y similares; o el título junto con el artista.
- SÍ vale: la parte del coro con que todo el mundo conoce la canción, si identifica claramente ESA canción.
- NO vale: solo el artista, otra canción del mismo artista, una palabra suelta demasiado genérica, o algo que no se parece.
Responde SOLO con JSON: {"match": true o false, "reason": "frase corta en español para mostrar a los jugadores"}`;
}
