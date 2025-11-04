export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { transcript, count } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: "Missing transcript" }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key missing" }), { status: 500 });
    }

    const prompt = `
      Based on the following transcript, create ${count || 5} multiple-choice quiz questions.
      Each question must have 4 options and clearly mark the correct one.
      Transcript:
      ${transcript}
    `;

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await resp.json();

    const quizText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No quiz generated.";
    return new Response(JSON.stringify({ quiz: quizText }), { status: 200 });
  } catch (err) {
    console.error("Gemini error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
