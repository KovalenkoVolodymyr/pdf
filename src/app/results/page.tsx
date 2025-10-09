"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { QUESTIONS, type ValidationResult, type Answer } from "@/types/questions";

type QuestionStatus = "mismatch" | "confirmed" | "changed" | "match";

interface QuestionState {
  currentAnswer: Answer;
  status: QuestionStatus;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});

  useEffect(() => {
    const storedResult = sessionStorage.getItem("validationResult");
    if (!storedResult) {
      router.push("/");
      return;
    }

    try {
      const parsedResult = JSON.parse(storedResult);
      setResult(parsedResult);

      // Initialize question states
      const initialStates: Record<number, QuestionState> = {};
      QUESTIONS.forEach((_, index) => {
        const userAnswer = parsedResult.userAnswers[index];
        const aiAnswer = parsedResult.aiAnswers[index]?.answer;
        const isMatch = userAnswer === aiAnswer;

        initialStates[index] = {
          currentAnswer: userAnswer,
          status: isMatch ? "match" : "mismatch"
        };
      });
      setQuestionStates(initialStates);
    } catch (error) {
      console.error("Error parsing validation result:", error);
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleStartOver = () => {
    sessionStorage.removeItem("validationResult");
    router.push("/");
  };

  const handleConfirmAnswer = (questionIndex: number) => {
    setQuestionStates(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        status: "confirmed"
      }
    }));
  };

  const handleChangeAnswer = (questionIndex: number, newAnswer: Answer) => {
    setQuestionStates(prev => ({
      ...prev,
      [questionIndex]: {
        currentAnswer: newAnswer,
        status: "changed"
      }
    }));
  };

  const handleSubmitPlan = () => {
    // Save final answers to sessionStorage
    sessionStorage.setItem("finalAnswers", JSON.stringify(questionStates));

    // Redirect to confirmation page
    router.push("/confirmation");
  };

  // Check if all mismatches are resolved
  const hasUnresolvedMismatches = Object.values(questionStates).some(
    state => state.status === "mismatch"
  );

  const canSubmit = !hasUnresolvedMismatches;

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Validation Results
            </h1>
            <button
              onClick={handleStartOver}
              className="bg-gray-600 text-white py-2 px-4 rounded-md
                font-semibold text-sm hover:bg-gray-700 cursor-pointer
                transition-colors duration-200"
            >
              Start Over
            </button>
          </div>

          <div className="space-y-6">
            {QUESTIONS.map((question, index) => {
              const state = questionStates[index];
              const aiAnswer = result.aiAnswers[index];
              const originalAnswer = result.userAnswers[index];
              const isMatch = originalAnswer === aiAnswer?.answer;
              const hasValidSuggestion = aiAnswer?.answer === "yes" || aiAnswer?.answer === "no";

              if (!state) return null;

              const getBorderColor = () => {
                switch (state.status) {
                  case "match":
                    return "border-gray-200";
                  case "mismatch":
                    return "border-yellow-300";
                  case "confirmed":
                    return "border-blue-200";
                  case "changed":
                    return "border-blue-200";
                  default:
                    return "border-gray-200";
                }
              };

              const getStatusBadge = () => {
                switch (state.status) {
                  case "mismatch":
                    return (
                      <span className="ml-2 flex-shrink-0 text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                        Mismatch
                      </span>
                    );
                  case "confirmed":
                    return (
                      <span className="ml-2 flex-shrink-0 text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded">
                        Confirmed
                      </span>
                    );
                  case "changed":
                    return (
                      <span className="ml-2 flex-shrink-0 text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded">
                        Updated
                      </span>
                    );
                  default:
                    return null;
                }
              };

              return (
                <div key={index} className={`border rounded-lg overflow-hidden ${getBorderColor()}`}>
                  {/* Question Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {index + 1}. {question}
                      </p>
                      {getStatusBadge()}
                    </div>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Left: Your Answer */}
                    <div className={`p-4 ${
                      state.status === "mismatch"
                        ? "bg-yellow-50"
                        : state.status === "confirmed" || state.status === "changed"
                        ? "bg-blue-50"
                        : "bg-white"
                    }`}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Your Answer
                      </h3>
                      <div className="mb-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            state.currentAnswer === "yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {state.currentAnswer?.toUpperCase()}
                        </span>

                        {state.status === "changed" && (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            (was: {originalAnswer?.toUpperCase()})
                          </span>
                        )}
                      </div>

                      {state.status === "mismatch" && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleConfirmAnswer(index)}
                            className="flex-1 bg-green-100 text-green-800 py-2 px-3 rounded-md
                              text-xs font-semibold hover:bg-green-200 border border-green-300
                              cursor-pointer transition-colors duration-200"
                          >
                            Keep My Answer
                          </button>
                          <button
                            onClick={() => handleChangeAnswer(
                              index,
                              hasValidSuggestion
                                ? aiAnswer.answer
                                : (state.currentAnswer === "yes" ? "no" : "yes")
                            )}
                            className="flex-1 bg-blue-100 text-blue-800 py-2 px-3 rounded-md
                              text-xs font-semibold hover:bg-blue-200 border border-blue-300
                              cursor-pointer transition-colors duration-200"
                          >
                            {hasValidSuggestion
                              ? "Use Suggested"
                              : `Change to ${state.currentAnswer === "yes" ? "No" : "Yes"}`
                            }
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Automated Analysis */}
                    <div className={`p-4 ${
                      isMatch
                        ? "bg-white"
                        : state.status === "mismatch"
                        ? "bg-red-50"
                        : "bg-white"
                    }`}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Automated Analysis
                      </h3>
                      <div className="mb-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            aiAnswer?.answer === "yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {aiAnswer?.answer?.toUpperCase() || "N/A"}
                        </span>
                      </div>
                      {aiAnswer?.reasoning && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 italic">
                            <span className="font-semibold not-italic">
                              Reasoning:
                            </span>{" "}
                            {aiAnswer.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col items-center gap-4">
              {hasUnresolvedMismatches && (
                <p className="text-sm text-yellow-700 bg-yellow-50 px-4 py-2 rounded-md border border-yellow-200">
                  Please review all questions with mismatches before submitting
                </p>
              )}
              <button
                onClick={handleSubmitPlan}
                disabled={!canSubmit}
                className={`px-8 py-3 rounded-md font-semibold text-sm transition-colors duration-200 border ${
                  canSubmit
                    ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
                }`}
              >
                Send Plan
              </button>
            </div>
          </div>

        </div>
      </div>
      </div>
    </>
  );
}
