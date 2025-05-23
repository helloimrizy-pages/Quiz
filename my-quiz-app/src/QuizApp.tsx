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
  ChevronLeft,
  ChevronRight,
  Flag,
  Shuffle,
  Settings,
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
  image?: string;
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
  isCorrect?: boolean;
}

interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  restartOnIncorrect: boolean;
}

const createAllQuestionsQuiz = (quizData: QuizData): Quiz => {
  const allQuestions: Question[] = [];
  let questionCounter = 1;

  quizData.quizzes.forEach((quiz) => {
    quiz.questions.forEach((question) => {
      allQuestions.push({
        ...question,
        questionNumber: questionCounter++,
      });
    });
  });

  return {
    quiz: "Master Challenge",
    topic: "All Topics Combined",
    questions: allQuestions,
  };
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuizApp: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentView, setCurrentView] = useState<
    "home" | "settings" | "quiz" | "results"
  >("home");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [processedQuiz, setProcessedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setQuizSubmitted] = useState(false);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    shuffleQuestions: false,
    shuffleAnswers: false,
    restartOnIncorrect: false,
  });

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
        try {
          if (window.fs) {
            const fileContent = await window.fs.readFile("data.json", {
              encoding: "utf8",
            });
            const parsedData: QuizData = JSON.parse(fileContent);
            setQuizData(parsedData);
          } else {
            throw new Error("window.fs not available");
          }
        } catch (fsError) {
          console.error("Error loading from window.fs:", fsError);
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
                  {
                    questionNumber: 2,
                    questionText:
                      "Which programming language is primarily used for web development?",
                    options: ["Python", "JavaScript", "C++", "Assembly"],
                    correctAnswer: "JavaScript",
                  },
                  {
                    questionNumber: 3,
                    questionText: "What does HTML stand for?",
                    options: [
                      "Hypertext Markup Language",
                      "High-level Text Management Language",
                      "Home Tool Markup Language",
                      "Hyperlink and Text Markup Language",
                    ],
                    correctAnswer: "Hypertext Markup Language",
                    image:
                      "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
                  },
                ],
              },
            ],
          };
          setQuizData(fallbackData);
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, []);

  const selectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView("settings");
  };

  const processQuizWithSettings = (
    quiz: Quiz,
    settings: QuizSettings
  ): Quiz => {
    let processedQuestions = [...quiz.questions];

    if (settings.shuffleQuestions) {
      processedQuestions = shuffleArray(processedQuestions);
      processedQuestions = processedQuestions.map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
    }

    if (settings.shuffleAnswers) {
      processedQuestions = processedQuestions.map((question) => {
        const shuffledOptions = shuffleArray(question.options);
        return {
          ...question,
          options: shuffledOptions,
        };
      });
    }

    return {
      ...quiz,
      questions: processedQuestions,
    };
  };

  const startQuiz = () => {
    if (!selectedQuiz) return;

    const quizToUse = processQuizWithSettings(selectedQuiz, quizSettings);
    setProcessedQuiz(quizToUse);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setStartTime(new Date());
    setEndTime(null);
    setQuizSubmitted(false);
    setCurrentView("quiz");
  };

  const handleAnswerSelect = (answer: string) => {
    if (!processedQuiz) return;

    const existingAnswerIndex = userAnswers.findIndex(
      (ans) => ans.questionIndex === currentQuestionIndex
    );

    if (existingAnswerIndex !== -1) {
      const updatedAnswers = [...userAnswers];
      updatedAnswers[existingAnswerIndex] = {
        questionIndex: currentQuestionIndex,
        selectedAnswer: answer,
      };
      setUserAnswers(updatedAnswers);
    } else {
      setUserAnswers([
        ...userAnswers,
        {
          questionIndex: currentQuestionIndex,
          selectedAnswer: answer,
        },
      ]);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (!processedQuiz) return;

    if (index >= 0 && index < processedQuiz.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const submitQuiz = () => {
    if (!processedQuiz) return;

    const answersWithResults = userAnswers.map((answer) => ({
      ...answer,
      isCorrect:
        answer.selectedAnswer ===
        processedQuiz.questions[answer.questionIndex].correctAnswer,
    }));

    setUserAnswers(answersWithResults);
    setEndTime(new Date());
    setQuizSubmitted(true);
    setCurrentView("results");
  };

  const resetQuiz = () => {
    setCurrentView("home");
    setSelectedQuiz(null);
    setProcessedQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setStartTime(null);
    setEndTime(null);
    setQuizSubmitted(false);
  };

  const restartQuiz = () => {
    if (selectedQuiz) {
      const quizToUse = processQuizWithSettings(selectedQuiz, quizSettings);
      setProcessedQuiz(quizToUse);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setStartTime(new Date());
      setEndTime(null);
      setQuizSubmitted(false);
      setCurrentView("quiz");
    }
  };

  const calculateResults = () => {
    if (!processedQuiz) {
      return {
        correctAnswers: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
        percentage: 0,
        duration: 0,
      };
    }

    const correctAnswers = userAnswers.filter(
      (answer) => answer.isCorrect
    ).length;
    const totalQuestions = processedQuiz.questions.length;
    const answeredQuestions = userAnswers.length;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    const duration =
      startTime && endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : 0;

    return {
      correctAnswers,
      totalQuestions,
      answeredQuestions,
      percentage,
      duration,
    };
  };

  const getCurrentAnswer = () => {
    return (
      userAnswers.find((ans) => ans.questionIndex === currentQuestionIndex)
        ?.selectedAnswer || ""
    );
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
        <HomeView quizData={quizData} onSelectQuiz={selectQuiz} />
      )}

      {currentView === "settings" && selectedQuiz && (
        <SettingsView
          quiz={selectedQuiz}
          settings={quizSettings}
          onUpdateSettings={setQuizSettings}
          onStartQuiz={startQuiz}
          onGoBack={resetQuiz}
        />
      )}

      {currentView === "quiz" && processedQuiz && (
        <QuizView
          quiz={processedQuiz}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          currentAnswer={getCurrentAnswer()}
          onAnswerSelect={handleAnswerSelect}
          onNavigateToQuestion={navigateToQuestion}
          onSubmitQuiz={submitQuiz}
          onGoHome={resetQuiz}
          settings={quizSettings}
          onRestart={restartQuiz}
        />
      )}

      {currentView === "results" && processedQuiz && (
        <ResultsView
          results={calculateResults()}
          quiz={processedQuiz}
          userAnswers={userAnswers}
          onRestart={restartQuiz}
          onGoHome={resetQuiz}
        />
      )}
    </div>
  );
};

const HomeView: React.FC<{
  quizData: QuizData;
  onSelectQuiz: (quiz: Quiz) => void;
}> = ({ quizData, onSelectQuiz }) => {
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

      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2 text-left">
                Master Challenge
              </h3>
              <p className="text-purple-100 mb-4">
                Take on all{" "}
                {quizData.quizzes.reduce(
                  (total, quiz) => total + quiz.questions.length,
                  0
                )}{" "}
                questions from every quiz in one comprehensive test
              </p>
              <div className="flex items-center text-sm text-purple-100">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  ~
                  {Math.ceil(
                    quizData.quizzes.reduce(
                      (total, quiz) => total + quiz.questions.length,
                      0
                    ) * 1.5
                  )}{" "}
                  min
                </span>
              </div>
            </div>
            <button
              onClick={() => onSelectQuiz(createAllQuestionsQuiz(quizData))}
              className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center group flex-shrink-0 ml-4"
            >
              Select Master Quiz
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
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
                onClick={() => onSelectQuiz(quiz)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center group"
              >
                Select Quiz
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

const SettingsView: React.FC<{
  quiz: Quiz;
  settings: QuizSettings;
  onUpdateSettings: (settings: QuizSettings) => void;
  onStartQuiz: () => void;
  onGoBack: () => void;
}> = ({ quiz, settings, onUpdateSettings, onStartQuiz, onGoBack }) => {
  const toggleSetting = (setting: keyof QuizSettings) => {
    onUpdateSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <span className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Quiz Settings
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.quiz}</h2>
          <p className="text-gray-600 text-lg">
            {quiz.topic} • {quiz.questions.length} questions
          </p>
        </div>

        <div className="space-y-6 mb-10">
          <div className="p-6 border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <Shuffle className="h-5 w-5 mr-2 text-indigo-600" />
                  Shuffle Questions
                </h3>
                <p className="text-gray-600">
                  Randomize the order of questions each time you take the quiz
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.shuffleQuestions}
                  onChange={() => toggleSetting("shuffleQuestions")}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="p-6 border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <Shuffle className="h-5 w-5 mr-2 text-indigo-600" />
                  Shuffle Answer Choices
                </h3>
                <p className="text-gray-600">
                  Randomize the order of answer options for each question
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.shuffleAnswers}
                  onChange={() => toggleSetting("shuffleAnswers")}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="p-6 border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-600" />
                  Challenge Mode
                </h3>
                <p className="text-gray-600">
                  Quiz will restart from the beginning if you answer a question
                  incorrectly
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.restartOnIncorrect}
                  onChange={() => toggleSetting("restartOnIncorrect")}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onStartQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-8 rounded-lg transition-colors duration-200 flex items-center text-lg"
          >
            Start Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizView: React.FC<{
  quiz: Quiz;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  currentAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onNavigateToQuestion: (index: number) => void;
  onSubmitQuiz: () => void;
  onGoHome: () => void;
  settings: QuizSettings;
  onRestart: () => void;
}> = ({
  quiz,
  currentQuestionIndex,
  userAnswers,
  currentAnswer,
  onAnswerSelect,
  onNavigateToQuestion,
  onSubmitQuiz,
  onGoHome,
  settings,
  onRestart,
}) => {
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = userAnswers.length;
  const canGoBack = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < quiz.questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    if (
      settings.restartOnIncorrect &&
      answer !== currentQuestion.correctAnswer
    ) {
      alert("Incorrect answer! Quiz will restart.");
      onRestart();
      return;
    }

    onAnswerSelect(answer);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            <span>
              {answeredCount} of {quiz.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Questions
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {quiz.questions.map((_, index) => {
                const isAnswered = userAnswers.some(
                  (ans) => ans.questionIndex === index
                );
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={index}
                    onClick={() => onNavigateToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isAnswered
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-600 rounded mr-2"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                <span>Not answered</span>
              </div>
            </div>

            <button
              onClick={onSubmitQuiz}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <Flag className="h-4 w-4 mr-2" />
              Submit Quiz
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentQuestion.questionText}
            </h2>

            {currentQuestion.image && (
              <div className="mb-6">
                <img
                  src={currentQuestion.image}
                  alt="Question illustration"
                  className="rounded-lg max-w-full max-h-80 mx-auto"
                />
              </div>
            )}

            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === option;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => onNavigateToQuestion(currentQuestionIndex - 1)}
                disabled={!canGoBack}
                className="flex items-center px-6 py-3 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-900 transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <div className="text-sm text-gray-500">
                {currentAnswer ? "Answer selected" : "Select an answer"}
              </div>

              <button
                onClick={() => onNavigateToQuestion(currentQuestionIndex + 1)}
                disabled={!canGoNext}
                className="flex items-center px-6 py-3 text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-indigo-700 transition-colors duration-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsView: React.FC<{
  results: {
    correctAnswers: number;
    totalQuestions: number;
    answeredQuestions: number;
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
          <div className="text-xl text-gray-700 mb-2">
            {results.correctAnswers} out of {results.totalQuestions} questions
            correct
          </div>
          <div className="text-gray-600 mb-6">
            {results.answeredQuestions} of {results.totalQuestions} questions
            answered
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
        <div className="space-y-6">
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswers.find(
              (ans) => ans.questionIndex === index
            );

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex-1 mr-4">
                    {index + 1}. {question.questionText}
                  </h4>
                  {userAnswer ? (
                    userAnswer.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )
                  ) : (
                    <div className="h-5 w-5 bg-gray-300 rounded-full flex-shrink-0"></div>
                  )}
                </div>

                {question.image && (
                  <div className="mb-4">
                    <img
                      src={question.image}
                      alt={`Question ${index + 1} illustration`}
                      className="rounded-lg max-w-full max-h-60 mx-auto shadow-sm"
                    />
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  {userAnswer ? (
                    <>
                      <div className="mb-1">
                        <span className="font-medium">Your answer:</span>{" "}
                        <span
                          className={
                            userAnswer.isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {userAnswer.selectedAnswer}
                        </span>
                      </div>
                      {!userAnswer.isCorrect && (
                        <div>
                          <span className="font-medium">Correct answer:</span>{" "}
                          <span className="text-green-600">
                            {question.correctAnswer}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 italic">
                      Question not answered
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
