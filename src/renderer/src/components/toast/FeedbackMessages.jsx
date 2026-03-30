// components/toast/FeedbackMessages.jsx
import { useFeedback } from "../../context/FeedbackContext";
import {
  ChecksuccessIcon as DefaultChecksuccessIcon,
  ErrorSuccessIcon as DefaultErrorSuccessIcon,
  CloseSuccessIcon as DefaultCloseSuccessIcon,
} from "../../IconsApp/IconsAppSystem";
// Opcional: Si quieres usar íconos más limpios por defecto, puedes importar estos:
// import { HiCheckCircle, HiExclamationCircle, HiX } from "react-icons/hi";

const positionStyles = {
  "top-center": "top-6 left-1/2 -translate-x-1/2",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
};

const FeedbackMessages = ({
  IconChecksuccess,
  IconErrorSuccess,
  IconCloseSuccess,
  position = "top-right", // Estándar moderno
  // Props opcionales para uso local
  error,
  success,
  setError,
  setSuccess
}) => {
  const context = useFeedback();

  // Determinar si usamos props locales o el contexto global
  const hasLocalState = (error || success) !== undefined;

  const text = hasLocalState ? (error || success) : context.text;
  const type = hasLocalState ? (error ? "error" : "success") : context.type;
  const source = hasLocalState ? null : context.source;

  const clearMessage = hasLocalState ? () => {
    if (setError) setError("");
    if (setSuccess) setSuccess("");
  } : context.clearMessage;

  const CheckIcon = IconChecksuccess || DefaultChecksuccessIcon;
  const ErrorIcon = IconErrorSuccess || DefaultErrorSuccessIcon;
  const CloseIcon = IconCloseSuccess || DefaultCloseSuccessIcon;

  if (!text) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  // Contenedor 'fixed' para garantizar que se sobreponga a todo el sistema
  const baseClasses = "fixed z-[100] transition-all duration-300 pointer-events-none"; 
  const positionClass = positionStyles[position] || positionStyles["top-right"];

  return (
    <div className={`${baseClasses} ${positionClass}`}>
      {/* pointer-events-auto: Permite hacer click en la alerta.
        bg-emerald-600 / bg-red-600: Colores intensos para llamar la atención.
        text-white: Texto blanco para máximo contraste sobre fondo de color.
        Animación: Entrada suave con zoom y slide.
      */}
      <div className={`pointer-events-auto flex items-start gap-4 w-full max-w-md p-4 rounded-2xl shadow-2xl border animate-in fade-in zoom-in-95 slide-in-from-top-5 duration-300
        ${isSuccess 
          ? "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-700 dark:border-emerald-600 shadow-emerald-500/20" 
          : "bg-red-600 dark:bg-red-500 text-white border-red-700 dark:border-red-600 shadow-red-500/20"}
      `}>
        
        {/* Contenedor de Ícono: Fondo blanco sutil para que el ícono resalte */}
        <div className="shrink-0 p-2 rounded-xl bg-white/15 text-white mt-0.5">
          {isSuccess ? <CheckIcon className="w-6 h-6" /> : <ErrorIcon className="w-6 h-6" />}
        </div>

        {/* Textos: Título en negrita y cuerpo con buena legibilidad */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-black tracking-tight leading-none mb-1.5 text-white">
            {source ? source : (isSuccess ? "Operación Exitosa" : "Atención Requerida")}
          </p>
          <p className="text-[13px] font-medium text-emerald-50 dark:text-red-50 leading-snug opacity-95">
            {text}
          </p>
        </div>

        {/* Botón de Cerrar: Blanco con hover sutil */}
        <button
          onClick={clearMessage}
          className="shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Cerrar notificación"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
        
      </div>
    </div>
  );
};

export default FeedbackMessages;






