"use client";

import { useState } from "react";

export default function HomeScreen() {
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitles, setSubtitles] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSubtitles = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setError("");
    setSubtitles("");

    try {
      const res = await fetch(`/api/getSubtitles?videoUrl=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();

      if (data.error) setError(data.error);
      else setSubtitles(data.subtitles);
    } catch (err) {
      setError("Error fetching subtitles.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!subtitles) return;
    await navigator.clipboard.writeText(subtitles);
    alert("✅ Subtitles copied to clipboard!");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎬 YouTube Subtitle Extractor</h1>

      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Paste YouTube link..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={styles.input}
        />
        <button onClick={fetchSubtitles} style={styles.button}>
          Get Subtitles
        </button>
      </div>

      {loading && <p>Loading subtitles...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {subtitles && (
        <div style={styles.outputContainer}>
          <button onClick={copyToClipboard} style={styles.copyButton}>
            Copy Subtitles
          </button>
          <p style={styles.subtitles}>{subtitles}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "sans-serif",
    textAlign: "center",
    padding: "40px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  input: {
    width: "80%",
    maxWidth: "500px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  outputContainer: {
    marginTop: "30px",
    textAlign: "left",
    maxWidth: "700px",
    margin: "auto",
    background: "#f8f8f8",
    padding: "20px",
    borderRadius: "10px",
  },
  copyButton: {
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "15px",
  },
  subtitles: {
    whiteSpace: "pre-wrap",
    fontSize: "16px",
    lineHeight: "1.6",
  },
};
