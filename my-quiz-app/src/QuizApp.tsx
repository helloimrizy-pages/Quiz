import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Clock,
  BookOpen,
  ArrowRight,
  Home,
} from "lucide-react";

declare global {
  interface Window {
    fs: {
      readFile: (
        path: string,
        options: { encoding: string }
      ) => Promise<string>;
    };
  }
}

interface Question {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  quiz: string;
  topic: string;
  questions: Question[];
}

interface QuizData {
  course: string;
  description: string;
  quizzes: Quiz[];
}

interface UserAnswer {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

const QuizApp: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "quiz" | "results">(
    "home"
  );
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const response = await fetch("/data.json");
        if (!response.ok) {
          throw new Error("Failed to fetch data.json");
        }
        const parsedData: QuizData = await response.json();
        setQuizData(parsedData);
      } catch (error) {
        console.error("Error loading quiz data:", error);
        const fallbackData: QuizData = {
          course: "Software Technology - Programming Technology",
          description:
            "Complete quiz collection from Week 2-12 and additional topics",
          quizzes: [
            {
              quiz: "Demo Quiz",
              topic: "Sample Questions",
              questions: [
                {
                  questionNumber: 1,
                  questionText:
                    "What is the primary purpose of object-oriented programming?",
                  options: [
                    "Code reusability",
                    "Faster execution",
                    "Smaller file size",
                    "Better graphics",
                  ],
                  correctAnswer: "Code reusability",
                },
              ],
            },
          ],
        };
        setQuizData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, []);

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setShowResult(false);
    setStartTime(new Date());
    setEndTime(null);
    setCurrentView("quiz");
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedQuiz || selectedAnswer === "") return;

    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const newAnswer: UserAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer("");
        setShowResult(false);
      } else {
        setEndTime(new Date());
        setCurrentView("results");
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentView("home");
    setSelectedQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setShowResult(false);
    setStartTime(null);
    setEndTime(null);
  };

  const calculateResults = () => {
    const correctAnswers = userAnswers.filter(
      (answer) => answer.isCorrect
    ).length;
    const totalQuestions = userAnswers.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const duration =
      startTime && endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : 0;

    return { correctAnswers, totalQuestions, percentage, duration };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load quiz data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {currentView === "home" && (
        <HomeView quizData={quizData} onStartQuiz={startQuiz} />
      )}

      {currentView === "quiz" && selectedQuiz && (
        <QuizView
          quiz={selectedQuiz}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          userAnswers={userAnswers}
          onAnswerSelect={handleAnswerSelect}
          onSubmitAnswer={submitAnswer}
          onGoHome={resetQuiz}
        />
      )}

      {currentView === "results" && (
        <ResultsView
          results={calculateResults()}
          quiz={selectedQuiz!}
          userAnswers={userAnswers}
          onRestart={() => startQuiz(selectedQuiz!)}
          onGoHome={resetQuiz}
        />
      )}
    </div>
  );
};

const HomeView: React.FC<{
  quizData: QuizData;
  onStartQuiz: (quiz: Quiz) => void;
}> = ({ quizData, onStartQuiz }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-6">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {quizData.course}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {quizData.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizData.quizzes.map((quiz, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {quiz.quiz}
                </span>
                <span className="text-sm text-gray-500">
                  {quiz.questions.length} questions
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {quiz.topic}
              </h3>

              <div className="flex items-center text-sm text-gray-600 mb-6">
                <Clock className="h-4 w-4 mr-1" />
                <span>~{Math.ceil(quiz.questions.length * 1.5)} min</span>
              </div>

              <button
                onClick={() => onStartQuiz(quiz)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center group"
              >
                Start Quiz
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {quizData.quizzes.length}
            </div>
            <div className="text-gray-600">Total Quizzes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {quizData.quizzes.reduce(
                (total, quiz) => total + quiz.questions.length,
                0
              )}
            </div>
            <div className="text-gray-600">Total Questions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {Math.ceil(
                quizData.quizzes.reduce(
                  (total, quiz) => total + quiz.questions.length,
                  0
                ) * 1.5
              )}
            </div>
            <div className="text-gray-600">Minutes of Content</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizView: React.FC<{
  quiz: Quiz;
  currentQuestionIndex: number;
  selectedAnswer: string;
  showResult: boolean;
  userAnswers: UserAnswer[];
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  onGoHome: () => void;
}> = ({
  quiz,
  currentQuestionIndex,
  selectedAnswer,
  showResult,
  onAnswerSelect,
  onSubmitAnswer,
  onGoHome,
}) => {
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onGoHome}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </button>
          <span className="text-sm font-medium text-gray-600">
            {quiz.quiz} • {quiz.topic}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">
          {currentQuestion.questionText}
        </h2>

        <div className="space-y-4 mb-8">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrong = showResult && isSelected && !isCorrect;
            const shouldHighlight = showResult && isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showResult && onAnswerSelect(option)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  showResult
                    ? shouldHighlight
                      ? "border-green-500 bg-green-50 text-green-800"
                      : isWrong
                      ? "border-red-500 bg-red-50 text-red-800"
                      : "border-gray-200 bg-gray-50"
                    : isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showResult && (
                    <>
                      {shouldHighlight && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {isWrong && <XCircle className="h-5 w-5 text-red-600" />}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!showResult && (
          <button
            onClick={onSubmitAnswer}
            disabled={selectedAnswer === ""}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
          >
            Submit Answer
          </button>
        )}

        {showResult && (
          <div
            className={`text-center p-4 rounded-lg ${
              selectedAnswer === currentQuestion.correctAnswer
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center justify-center mb-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 mr-2" />
              )}
              <span className="font-semibold">
                {selectedAnswer === currentQuestion.correctAnswer
                  ? "Correct!"
                  : "Incorrect"}
              </span>
            </div>
            {selectedAnswer !== currentQuestion.correctAnswer && (
              <p className="text-sm">
                The correct answer is:{" "}
                <strong>{currentQuestion.correctAnswer}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultsView: React.FC<{
  results: {
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
    duration: number;
  };
  quiz: Quiz;
  userAnswers: UserAnswer[];
  onRestart: () => void;
  onGoHome: () => void;
}> = ({ results, quiz, userAnswers, onRestart, onGoHome }) => {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBg = (percentage: number) => {
    if (percentage >= 90) return "bg-green-50 border-green-200";
    if (percentage >= 80) return "bg-blue-50 border-blue-200";
    if (percentage >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quiz Completed!
        </h1>
        <p className="text-gray-600">
          {quiz.quiz} • {quiz.topic}
        </p>
      </div>

      <div
        className={`bg-white rounded-xl shadow-lg border-2 p-8 mb-8 ${getGradeBg(
          results.percentage
        )}`}
      >
        <div className="text-center">
          <div
            className={`text-6xl font-bold mb-4 ${getGradeColor(
              results.percentage
            )}`}
          >
            {results.percentage}%
          </div>
          <div className="text-xl text-gray-700 mb-6">
            {results.correctAnswers} out of {results.totalQuestions} questions
            correct
          </div>
          <div className="flex justify-center items-center text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              Completed in {Math.floor(results.duration / 60)}m{" "}
              {results.duration % 60}s
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Question Review
        </h3>
        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswers.find(
              (ans) => ans.questionIndex === index
            );
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1 mr-4">
                    {index + 1}. {question.questionText}
                  </h4>
                  {userAnswer?.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="mb-1">
                    <span className="font-medium">Your answer:</span>{" "}
                    <span
                      className={
                        userAnswer?.isCorrect
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {userAnswer?.selectedAnswer}
                    </span>
                  </div>
                  {!userAnswer?.isCorrect && (
                    <div>
                      <span className="font-medium">Correct answer:</span>{" "}
                      <span className="text-green-600">
                        {question.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Quiz
        </button>
        <button
          onClick={onGoHome}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default QuizApp;
