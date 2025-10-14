interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center">
          {/* Animated Spinner */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 border-4 border-blue-400 rounded-full border-t-transparent animate-spin-slow"></div>
          </div>

          {/* Loading Text */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {message || "Analyzing your document..."}
          </h3>

          {/* Progress Steps */}
          <div className="w-full mt-6 space-y-3">
            <LoadingStep
              label="Uploading architectural plan"
              delay="delay-0"
            />
            <LoadingStep
              label="Analyzing document structure"
              delay="delay-1000"
            />
            <LoadingStep
              label="Validating your answers"
              delay="delay-2000"
            />
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            This may take 20-30 seconds. Please don&apos;t close this window.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label, delay }: { label: string; delay: string }) {
  return (
    <div className={`flex items-center space-x-3 animate-pulse ${delay}`}>
      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
