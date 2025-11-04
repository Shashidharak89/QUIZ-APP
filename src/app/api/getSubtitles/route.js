import { YoutubeTranscript } from "youtube-transcript";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get("videoUrl");

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing video URL" }), {
        status: 400,
      });
    }

    // Extract video ID using the library helper
    const videoId = YoutubeTranscript.getVideoID(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
      });
    }

    // Fetch transcript (auto language detection)
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      return new Response(JSON.stringify({ error: "No subtitles found." }), {
        status: 404,
      });
    }

    // Combine into one clean string
    const text = transcript.map((item) => item.text).join(" ");

    return new Response(JSON.stringify({ subtitles: text }), { status: 200 });
  } catch (err) {
    console.error("Error fetching subtitles:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch subtitles" }), {
      status: 500,
    });
  }
}
