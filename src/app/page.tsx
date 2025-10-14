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
  const [isDragging, setIsDragging] = useState(false);

  const handleAnswerChange = (questionIndex: number, answer: Answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const validateAndSetFile = (file: File) => {
    if (file.type === "application/pdf") {
      setPdfFile(file);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
      setPdfFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
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
                background: "var(--tint-error-light)",
                color: "var(--tint-error-dark)",
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
      <div className="min-h-screen bg-grey-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-grey-900">
            Architectural Plan Validation AI Demo
          </h1>
          <div className="text-base font-medium text-grey-700">
            Created by Bilberrry for MBP
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {/* Questions */}
            <div className="space-y-4">
              {QUESTIONS.map((question, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${
                    answers[index] !== undefined
                      ? "border-primary-light bg-primary-50"
                      : "border-grey-200"
                  }`}
                >
                  <label className="block text-sm font-medium text-grey-700 mb-3">
                    {index + 1}. {question}
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value="yes"
                        checked={answers[index] === "yes"}
                        onChange={() => handleAnswerChange(index, "yes")}
                        required
                      />
                      <span className="text-sm font-normal text-grey-900 leading-tight">Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value="no"
                        checked={answers[index] === "no"}
                        onChange={() => handleAnswerChange(index, "no")}
                        required
                      />
                      <span className="text-sm font-normal text-grey-900 leading-tight">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-grey-700 mb-3">
                Upload Architectural Plan (PDF)
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  w-full h-32 py-4 bg-grey-50 rounded-lg
                  outline-1 outline-offset-[-1px]
                  inline-flex flex-col justify-center items-center
                  transition-all duration-200
                  ${isDragging
                    ? 'outline-primary bg-primary-50'
                    : pdfFile
                      ? 'outline-primary-dark bg-primary-50'
                      : 'outline-grey-700'
                  }
                `}
              >
                <div className="flex flex-col justify-start items-center gap-6 w-full px-6">
                  <div className={pdfFile ? 'hidden' : 'flex flex-col justify-center items-center gap-2'}>
                    <div className="text-center text-grey-900 text-xs font-normal leading-none">
                      Drag file here or
                    </div>
                    <label className="h-[22px] px-2 py-1 bg-primary rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer hover:bg-primary-light transition-colors">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                      <div className="text-white text-xs font-medium leading-3">
                        Choose File...
                      </div>
                    </label>
                  </div>

                  {!pdfFile ? (
                    <div className="px-2 py-1 bg-grey-1000 rounded inline-flex justify-start items-start gap-2.5">
                      <div className="text-center text-grey-900 text-xs font-normal leading-none">
                        Please select a .pdf file
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 bg-[#E4FAE1] border border-[#04A400] rounded-xl w-full text-base-black text-[14px] leading-[1.2] h-12 px-4">
                      <div>{pdfFile.name}</div>
                      <div>
                        <button type="button" className="flex items-center justify-center h-8 w-8 min-w-8 cursor-pointer" onClick={() => setPdfFile(null)} title="Remove file">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.16 12.6897L7.16 5.51724H5.48L5.48 12.6897H7.16Z" fill="#6E6E6E"/>
                            <path d="M10.52 12.6897L10.52 5.51724H8.84L8.84 12.6897H10.52Z" fill="#6E6E6E"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M11.36 16C12.7518 16 13.88 14.8884 13.88 13.5172V3.86207H15V2.2069H1V3.86207H2.12V13.5172C2.12 14.8884 3.24824 16 4.64 16H11.36ZM4.64 14.3448C4.17608 14.3448 3.8 13.9743 3.8 13.5172V3.86207H12.2V13.5172C12.2 13.9743 11.8239 14.3448 11.36 14.3448H4.64Z" fill="#6E6E6E"/>
                            <path d="M10.52 0H5.48V1.65517H10.52V0Z" fill="#6E6E6E"/>
                          </svg>

                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-light border border-error-light text-error-dark px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className="btn btn-primary"
              >
                <div className="flex items-center justify-center gap-2">
                  <div><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_4092_206)">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.99997 11.7501C8.41419 11.7501 8.74997 11.4143 8.74997 11.0001V3.47741L11.3585 6.08597C11.6514 6.37886 12.1263 6.37886 12.4192 6.08597C12.7121 5.79307 12.7121 5.3182 12.4192 5.02531L8.5303 1.13642C8.23741 0.843525 7.76254 0.843525 7.46964 1.13642L3.58075 5.02531C3.28786 5.3182 3.28786 5.79307 3.58075 6.08597C3.87365 6.37886 4.34852 6.37886 4.64141 6.08597L7.24997 3.47741V11.0001C7.24997 11.4143 7.58576 11.7501 7.99997 11.7501Z" fill="white"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M1 9.5834C1.41421 9.5834 1.75 9.91918 1.75 10.3334V13.4445C1.75 13.6582 1.83487 13.863 1.98594 14.0141C2.13701 14.1652 2.34191 14.2501 2.55556 14.2501H13.4444C13.6581 14.2501 13.863 14.1652 14.0141 14.0141C14.1651 13.863 14.25 13.6582 14.25 13.4445V10.3334C14.25 9.91918 14.5858 9.5834 15 9.5834C15.4142 9.5834 15.75 9.91918 15.75 10.3334V13.4445C15.75 14.056 15.5071 14.6424 15.0747 15.0748C14.6423 15.5072 14.0559 15.7501 13.4444 15.7501H2.55556C1.94408 15.7501 1.35766 15.5072 0.925282 15.0748C0.492906 14.6424 0.25 14.056 0.25 13.4445V10.3334C0.25 9.91918 0.585786 9.5834 1 9.5834Z" fill="white"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_4092_206">
                        <rect width="16" height="16" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                  </div>
                  <div>{isLoading ? "Uploading..." : "Upload Plan"}</div>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
