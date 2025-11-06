"use client";
import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import "./styles/HomeScreen.css";

// QuizGenerator Component
export default function QuizGenerator() {
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
      // Get transcript
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

      // Generate quiz with specific instructions
      const quizRes = await fetch("/api/generateQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: transcriptData.transcript, 
          count,
          instructions: "Generate multiple choice questions (MCQs) only. For each question, provide 4 options (A, B, C, D) and clearly mark the correct answer with '✓' or highlight it. Format should be clean and easy to read. and dont say like here are 5 questions, here you go anything extra just give the questions directly. in this format: Question 1: ... Option 1: A. ... B. ... C. ... D. ... Correct Answer: A ✓,... , for eg: 1. What is computer. a) an electronic device b) a creature c) a bird d) an animal ans:a this much is enought and neatly allign=ment also, and give one delimeter in that which is $$& is befor staring a question and &$$ on ending question like $$&1.what is ...a)...b)...c)...d)...ans:a&$$ got it"
        }),
      });

      const quizData = await quizRes.json();
      if (!quizRes.ok || quizData.error) {
        setError(quizData.error || "Failed to generate quiz.");
      } else {
        setQuiz(quizData.quiz);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">📹 Video Quiz Generator</h1>
          <p className="header-subtitle">
            Send a video link and generate an instant quiz
          </p>
        </header>

        <div className="card">
          <div className="input-section">
            <label className="input-label">YouTube Video URL</label>
            <div className="input-wrapper">
              <Play className="input-icon" size={20} />
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="controls-row">
              <div className="count-wrapper">
                <label className="input-label">Questions</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="count-input"
                />
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={loading}
                className="generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="loading-spinner" size={20} />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {quiz && (
            <div className="quiz-output">
              <div className="quiz-header">
                <CheckCircle2 size={28} />
                <h3 className="quiz-title">Your Quiz</h3>
              </div>
              <div className="quiz-box">
                <pre className="quiz-content">{quiz}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}