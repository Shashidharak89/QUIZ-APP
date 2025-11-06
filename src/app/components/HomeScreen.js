"use client";
import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import "./styles/HomeScreen.css";

export default function QuizGenerator() {
  const [videoUrl, setVideoUrl] = useState("");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState("");
  const [parsedQuiz, setParsedQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQuiz = async () => {
    setError("");
    setQuiz("");
    setParsedQuiz([]);

    if (!videoUrl.trim()) {
      setError("Please enter a YouTube link.");
      return;
    }

    setLoading(true);
    try {
      // 1. Get transcript
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

      // 2. Generate quiz
      const quizRes = await fetch("/api/generateQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptData.transcript,
          count,
          instructions:
            "Generate multiple choice questions (MCQs) only. Each in format $$&1. question a)...b)...c)...d)...ans:x&$$",
        }),
      });

      const quizData = await quizRes.json();
      if (!quizRes.ok || quizData.error) {
        setError(quizData.error || "Failed to generate quiz.");
      } else {
        setQuiz(quizData.quiz);
        const parsed = parseQuizString(quizData.quiz);
        setParsedQuiz(parsed);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper to parse quiz string
  const parseQuizString = (quizStr) => {
    const questionBlocks = quizStr
      .split("$$&")
      .filter((block) => block.trim() && block.includes("&$$"))
      .map((block) => block.split("&$$")[0].trim());

    return questionBlocks.map((qText) => {
      const [questionLine, ...rest] = qText.split("\n").filter(Boolean);
      const options = rest.filter((line) => /^[a-d]\)/i.test(line.trim()));
      const answerLine = rest.find((line) => line.toLowerCase().startsWith("ans:"));
      const correct = answerLine ? answerLine.split(":")[1].trim().toLowerCase() : "";

      return {
        question: questionLine.replace(/^\d+\./, "").trim(),
        options,
        correct,
        selected: null,
        isCorrect: null,
      };
    });
  };

  // ✅ Handle user selecting an answer
  const handleSelect = (qIndex, optionLetter) => {
    setParsedQuiz((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              selected: optionLetter,
              isCorrect: q.correct === optionLetter.toLowerCase(),
            }
          : q
      )
    );
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">🎥 Video Quiz Generator</h1>
          <p className="header-subtitle">
            Generate interactive quizzes directly from YouTube videos
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
                  <>Generate Quiz</>
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

          {/* ✅ Interactive Quiz */}
          {parsedQuiz.length > 0 && (
            <div className="quiz-section">
              <div className="quiz-header">
                <CheckCircle2 size={28} />
                <h3 className="quiz-title">Your Quiz</h3>
              </div>

              {parsedQuiz.map((q, index) => (
                <div key={index} className="quiz-question">
                  <p className="question-text">
                    {index + 1}. {q.question}
                  </p>
                  <div className="options-list">
                    {q.options.map((opt, i) => {
                      const letter = opt.trim()[0].toLowerCase();
                      const isSelected = q.selected === letter;
                      const isCorrect = q.isCorrect && isSelected;
                      const isWrong = !q.isCorrect && isSelected;

                      return (
                        <button
                          key={i}
                          className={`option-btn ${
                            isCorrect
                              ? "correct"
                              : isWrong
                              ? "wrong"
                              : isSelected
                              ? "selected"
                              : ""
                          }`}
                          disabled={q.selected !== null}
                          onClick={() => handleSelect(index, letter)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {q.selected && (
                    <p
                      className={`feedback ${
                        q.isCorrect ? "text-green" : "text-red"
                      }`}
                    >
                      {q.isCorrect ? "✅ Correct!" : "❌ Wrong! (Answer: " + q.correct.toUpperCase() + ")"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
