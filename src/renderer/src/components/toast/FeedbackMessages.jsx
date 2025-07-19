// components/toast/FeedbackMessages.jsx
import { useFeedback } from "../../context/FeedbackContext";
import {
  ChecksuccessIcon as DefaultChecksuccessIcon,
  ErrorSuccessIcon as DefaultErrorSuccessIcon,
  CloseSuccessIcon as DefaultCloseSuccessIcon,
} from "../../IconsApp/IconsAppSystem";

const positionStyles = {
  "top-center": "top-10 left-1/2 -translate-x-1/2",
  "top-right": "top-10 right-5",
  "top-left": "top-10 left-5",
  "bottom-center": "bottom-10 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-10 right-5",
  "bottom-left": "bottom-10 left-5",
};

const FeedbackMessages = ({
  IconChecksuccess,
  IconErrorSuccess,
  IconCloseSuccess,
  position = "top-center",
}) => {
  const {
    text,
    type,
    source,
    clearMessage,
  } = useFeedback();

  const CheckIcon = IconChecksuccess || DefaultChecksuccessIcon;
  const ErrorIcon = IconErrorSuccess || DefaultErrorSuccessIcon;
  const CloseIcon = IconCloseSuccess || DefaultCloseSuccessIcon;

  const baseClasses = "absolute z-50";
  const positionClass = positionStyles[position] || positionStyles["top-center"];

  if (!text) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className={`${baseClasses} ${positionClass}`}>
      <div className={`relative max-w-md px-6 py-4 text-base rounded-lg shadow-lg animate-fade-in flex items-start gap-4
        ${isSuccess ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300"}
      `}>
        {isSuccess && <CheckIcon className="w-8 h-8" />}
        {isError && <ErrorIcon className="w-8 h-8" />}

        <div className="flex-1">
          {source && (
            <div className="font-bold text-lg opacity-80 mb-1">
              {source}
            </div>
          )}
          <div>{text}</div>
          <div className="text-xs mt-1 opacity-70 italic capitalize">
            {type}
          </div>
        </div>

        <button
          onClick={clearMessage}
          className="text-xl leading-none font-bold focus:outline-none hover:text-gray-600 dark:hover:text-gray-300"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackMessages;






