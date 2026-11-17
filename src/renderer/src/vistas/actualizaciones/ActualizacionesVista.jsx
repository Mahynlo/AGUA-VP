import { useNavigate, Link } from "react-router-dom";
import { HiArrowLeft, HiRefresh, HiLockClosed } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import PanelActualizaciones from "../../components/actualizaciones/PanelActualizaciones";

/**
 * Centro de Actualizaciones. Se puede abrir con sesión (desde la barra superior) o sin ella (desde el
 * login), por eso el marco cambia: con sesión deja espacio a la barra lateral como los demás módulos.
 */
export default function ActualizacionesVista() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const loggedIn = isAuthenticated();

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(loggedIn ? "/home" : "/");
    }
  };

  return (
    <div
      className={`mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-black/20 scroll-smooth ${
        loggedIn ? "sm:ml-24" : ""
      }`}
    >
      <div
        className={`w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-6 ${
          loggedIn ? "" : "max-w-6xl mx-auto"
        }`}
      >
        {/* ── ENCABEZADO ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={handleVolver}
              title={loggedIn ? "Volver" : "Volver al inicio de sesión"}
              aria-label={loggedIn ? "Volver" : "Volver al inicio de sesión"}
              className="p-2.5 rounded-xl shrink-0 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
            >
              <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="p-3 rounded-xl shrink-0 flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HiRefresh className="w-7 h-7" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Centro de Actualizaciones
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-snug">
                Consulta las novedades, descarga versiones nuevas y mantén Agua-VP al día.
              </p>
            </div>
          </div>

          {!loggedIn && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:inline-flex items-center px-2 h-6 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
                Sin iniciar sesión
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
              >
                <HiLockClosed className="w-4 h-4" />
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>

        {/* ── CONTENIDO ── */}
        <PanelActualizaciones />

        {!loggedIn && (
          <p className="pt-4 border-t border-slate-200 dark:border-zinc-800 text-center text-xs font-medium text-slate-400 dark:text-zinc-500">
            Sistema de Agua Potable · Villa Pesqueira
          </p>
        )}
      </div>
    </div>
  );
}
