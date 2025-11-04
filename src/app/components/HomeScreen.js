"use client";
import { useState } from "react";

export default function HomeScreen() {
  const [videoUrl, setVideoUrl] = useState("");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQuiz = async () => {
    setError("");
    setQuiz("");
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube link.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Get transcript from your backend
      const transcriptRes = await fetch("/api/getSubtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const transcriptData = await transcriptRes.json();

      if (!transcriptRes.ok || transcriptData.error) {
        setError(transcriptData.error || "Failed to get transcript.");
        setLoading(false);
        return;
      }

      // 2️⃣ Send transcript to Gemini to generate quiz
      const quizRes = await fetch("/api/generateQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptData.transcript, count }),
      });

      const quizData = await quizRes.json();

      if (!quizRes.ok || quizData.error) {
        setError(quizData.error || "Failed to generate quiz.");
      } else {
        setQuiz(quizData.quiz);
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎯 YouTube Transcript Quiz Generator</h1>

      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Paste YouTube link..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          min="1"
          max="10"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          style={styles.numberInput}
        />
        <button onClick={handleGenerateQuiz} disabled={loading} style={styles.button}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {quiz && (
        <div style={styles.output}>
          <h3>🧩 Generated Quiz</h3>
          <pre style={styles.quiz}>{quiz}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "system-ui, sans-serif",
    padding: "40px 16px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  input: {
    width: "60%",
    maxWidth: "400px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  numberInput: {
    width: "80px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  output: {
    marginTop: "30px",
    maxWidth: "700px",
    margin: "auto",
    background: "#f8f8f8",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "left",
  },
  quiz: {
    whiteSpace: "pre-wrap",
    fontSize: "16px",
    lineHeight: "1.6",
  },
};
