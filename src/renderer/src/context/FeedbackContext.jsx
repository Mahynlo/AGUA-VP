import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const FeedbackContext = createContext();

export const FeedbackProvider = ({ children }) => {
  const [message, setMessage] = useState({
    text: null,
    type: null,     // "success" o "error"
    source: null,   // ej. "Registro de Clientes"
  });

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: null, type: null, source: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const setSuccess = useCallback((text, source = null) => {
    setMessage({ text, type: "success", source });
  }, []);

  const setError = useCallback((text, source = null) => {
    setMessage({ text, type: "error", source });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage({ text: null, type: null, source: null });
  }, []);

  const value = useMemo(() => ({
    ...message,
    setSuccess,
    setError,
    clearMessage,
  }), [message, setSuccess, setError, clearMessage]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
