import { useEffect } from "react";
import {
  ChecksuccessIcon as DefaultChecksuccessIcon,
  ErrorSuccessIcon as DefaultErrorSuccessIcon,
  CloseSuccessIcon as DefaultCloseSuccessIcon,
} from "../../IconsApp/IconsAppSystem";

const FeedbackMessages = ({
  success,
  error,
  setSuccess,
  setError,
  IconChecksuccess,
  IconErrorSuccess,
  IconCloseSuccess,
  time,
}) => {
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, time || 10000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Usa los íconos proporcionados o los de respaldo
  const CheckIcon = IconChecksuccess || DefaultChecksuccessIcon;
  const ErrorIcon = IconErrorSuccess || DefaultErrorSuccessIcon;
  const CloseIcon = IconCloseSuccess || DefaultCloseSuccessIcon;

  return (
    <>
      {success && (
        <div className="absolute top-40 left-1/2 z-50 -translate-x-1/2">
          <div className="relative max-w-md px-6 py-4 text-xl rounded-lg shadow-lg animate-fade-in flex items-start gap-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckIcon className="w-8 h-8 text-green-700 dark:text-green-300" />
            <span className="flex-1">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="text-xl leading-none font-bold focus:outline-none hover:text-gray-600 dark:hover:text-gray-300"
            >
              <CloseIcon className="w-8 h-8" />
            </button>

          </div>
        </div>
      )}


      {error && (
        <div className="absolute top-20 right-5 z-50">
          <div className="relative max-w-sm px-4 py-3 text-xl rounded-lg shadow-lg animate-fade-in flex items-start gap-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            <ErrorIcon className="w-8 h-8 text-red-700 dark:text-red-300" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xl leading-none font-bold focus:outline-none hover:text-gray-600 dark:hover:text-gray-300"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackMessages;



