export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing video URL" }), { status: 400 });
    }

    const apiKey = process.env.TRANSCRIPT_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Transcript API key missing" }), { status: 500 });
    }

    const url = `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${encodeURIComponent(
      videoUrl
    )}&format=json`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await resp.json();

    if (!resp.ok || !data.transcript) {
      return new Response(JSON.stringify({ error: data.error || "No transcript found" }), {
        status: 404,
      });
    }

    const transcript = Array.isArray(data.transcript)
      ? data.transcript.map((t) => t.text || t).join(" ")
      : data.transcript;

    return new Response(JSON.stringify({ transcript }), { status: 200 });
  } catch (err) {
    console.error("Transcript fetch error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
