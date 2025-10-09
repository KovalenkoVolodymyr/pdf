"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import LoadingOverlay from "@/components/LoadingOverlay";
import { QUESTIONS, type UserAnswers, type Answer } from "@/types/questions";

export default function Home() {
  const router = useRouter();
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (questionIndex: number, answer: Answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
      setPdfFile(null);
    }
  };

  const isFormValid = () => {
    return (
      QUESTIONS.every((_, index) => answers[index] !== undefined) &&
      pdfFile !== null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Please answer all questions and upload a PDF file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile!);
      formData.append("userAnswers", JSON.stringify(answers));

      const response = await fetch("/api/validate", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 429 || result.errorType === "quota_exceeded") {
          toast.error(
            "Service quota exceeded! Please contact support.",
            {
              duration: 8000,
              style: {
                background: "#FEE2E2",
                color: "#991B1B",
                maxWidth: "500px",
              },
            }
          );
          setError(
            "Service quota exceeded. Please try again later or contact support."
          );
        } else {
          toast.error(result.error || "Failed to validate answers", {
            duration: 5000,
          });
          setError(result.error || "Failed to validate answers");
        }
        return;
      }

      // Save results to sessionStorage and navigate to results page
      sessionStorage.setItem("validationResult", JSON.stringify(result));

      // Redirect first, then hide loader after a delay
      router.push("/results");
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage, { duration: 5000 });
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <LoadingOverlay isLoading={isLoading} message="Analyzing your architectural plan..." />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Architectural Plan Validation
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Questions */}
            <div className="space-y-4">
              {QUESTIONS.map((question, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${
                    answers[index] !== undefined
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {index + 1}. {question}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value="yes"
                        checked={answers[index] === "yes"}
                        onChange={() => handleAnswerChange(index, "yes")}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        required
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value="no"
                        checked={answers[index] === "no"}
                        onChange={() => handleAnswerChange(index, "no")}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        required
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* PDF Upload */}
            <div className={`border rounded-lg p-4 transition-colors ${
              pdfFile
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200"
            }`}>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Architectural Plan (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border file:border-blue-200
                  file:text-sm file:font-semibold
                  file:bg-white file:text-blue-700
                  hover:file:bg-blue-50
                  cursor-pointer"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-md
                font-semibold text-sm hover:bg-blue-600 cursor-pointer
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {isLoading ? "Uploading..." : "Upload Architectural Plan"}
            </button>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
