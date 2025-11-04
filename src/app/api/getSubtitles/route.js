export const runtime = "nodejs"; // ensure Node environment

/**
 * Robust extractor for YouTube video id from many URL formats.
 */
function extractVideoId(url) {
  if (!url || typeof url !== "string") return null;
  // remove surrounding whitespace
  const u = url.trim();

  // If user passed only ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u;

  // Try URL parsing
  try {
    // Normalize possible missing protocol
    const possible = u.startsWith("http") ? u : "https://" + u;
    const parsed = new URL(possible);

    // youtu.be short links
    if (parsed.hostname.includes("youtu.be")) {
      // path begins with /VIDEOID
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // youtube.com watch?v=...
    if (parsed.hostname.includes("youtube.com")) {
      // try v param
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      // /embed/ID or /shorts/ID
      const parts = parsed.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && /^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
    }
  } catch (e) {
    // fallback to regex extraction
  }

  // final regex fallback to find 11-char id anywhere
  const m = u.match(/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Try to extract transcript-like content from the scraped text.
 * This is best-effort — returns either found transcript or the full scrape text as fallback.
 */
function extractTranscriptFromScrape(scrapeText) {
  if (!scrapeText) return null;

  // Many scraped pages will contain a block like "Transcript" followed by lines.
  // We'll attempt several heuristics.

  // 1) Look for "Transcript" heading and take following chunk
  const idx = scrapeText.toLowerCase().indexOf("transcript");
  if (idx !== -1) {
    // take up to 20000 chars after the word "transcript"
    const after = scrapeText.slice(idx + 10, idx + 100000);
    // Heuristic: transcripts often contain many short lines; trim leading junk
    const cleaned = after.replace(/\s{2,}/g, " ").trim();
    // If cleaned seems long enough, return it
    if (cleaned.length > 50) return cleaned;
  }

  // 2) If there are many timestamp-like tokens (e.g., "0:00", "00:05"), keep lines around them
  const tsMatches = scrapeText.match(/(?:\b[0-9]{1,2}:[0-9]{2}\b)/g);
  if (tsMatches && tsMatches.length >= 3) {
    // Return the whole scrape (often includes timestamps interleaved)
    return scrapeText;
  }

  // 3) Fallback: return full scrape (trimmed)
  return scrapeText.trim();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const videoUrl = body?.videoUrl ?? body?.url ?? null;

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing videoUrl in request body." }), {
        status: 400,
      });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL or ID." }), { status: 400 });
    }

    // Use the public, no-auth scraping endpoint (best-effort)
    // r.jina.ai returns a plain-text rendering of the page at the provided URL.
    const target = `https://r.jina.ai/http://www.youtube.com/watch?v=${videoId}`;

    const resp = await fetch(target, {
      method: "GET",
      headers: {
        // Some endpoints may behave better with a user-agent
        "User-Agent": "Mozilla/5.0 (TranscriptFetcher)",
        Accept: "text/plain, */*",
      },
      // 15s timeout-ish handled by platform if needed
    });

    if (!resp.ok) {
      // If scrape fails, return that upstream status
      const txt = await resp.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Scrape failed", status: resp.status, body: txt.slice(0, 200) }), {
        status: 502,
      });
    }

    const scrapedText = await resp.text();

    // Best-effort transcript extraction
    const transcript = extractTranscriptFromScrape(scrapedText);

    if (!transcript || transcript.length < 20) {
      // Not great result — return something useful for debugging
      return new Response(JSON.stringify({
        error: "No usable transcript found.",
        debug: { videoId, scrapedPreview: scrapedText.slice(0, 800) }
      }), { status: 404 });
    }

    return new Response(JSON.stringify({ subtitles: transcript }), { status: 200 });
  } catch (err) {
    console.error("getSubtitles POST error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
    });
  }
}
