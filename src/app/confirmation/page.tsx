"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmationPage() {
  const router = useRouter();
  const [finalAnswers, setFinalAnswers] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const storedAnswers = sessionStorage.getItem("finalAnswers");
    if (!storedAnswers) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(storedAnswers);
      setFinalAnswers(parsed);
    } catch (error) {
      console.error("Error parsing final answers:", error);
      router.push("/");
    }
  }, [router]);

  const handleBackToHome = () => {
    sessionStorage.removeItem("validationResult");
    sessionStorage.removeItem("finalAnswers");
    router.push("/");
  };

  if (!finalAnswers) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-grey-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
              <svg
                className="h-10 w-10 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-grey-900 mb-4">
              Plan Sent Successfully!
            </h1>

            {/* Message */}
            <p className="text-grey-600 mb-8">
              Your architectural plan has been sent for review. You will receive a confirmation email shortly.
            </p>

            {/* Back to Home Button */}
            <button
              type="button"
              onClick={handleBackToHome}
              className="btn btn-primary"
            >
              Submit Another Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
