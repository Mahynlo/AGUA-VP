import { useNavigate, Link } from "react-router-dom";
import { HiArrowLeft, HiRefresh, HiShieldCheck, HiLockClosed } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import PanelActualizaciones from "../administrador/sistema/PanelActualizaciones";

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
      className={`h-[calc(100vh-4rem)] mt-16 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950 overflow-y-auto transition-all scroll-smooth relative ${
        loggedIn ? "sm:ml-24" : "flex flex-col items-center justify-start"
      }`}
    >
      {/* Fondo ambiental sutil para vista no autenticada */}
      {!loggedIn && (
        <>
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      <div className={`w-full ${loggedIn ? "" : "max-w-5xl"} bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 lg:p-10 flex flex-col gap-8 mb-12 animate-in fade-in duration-300 relative z-10`}>
        
        {/* ── HEADER DE LA PÁGINA ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <button
              type="button"
              onClick={handleVolver}
              className="p-3 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl transition-all shrink-0 shadow-sm hover:scale-105 active:scale-95 group border border-slate-200/80 dark:border-zinc-800"
              title={loggedIn ? "Volver" : "Volver al Login"}
            >
              <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
                <HiRefresh className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                    Centro de Actualizaciones
                  </h1>
                  {!loggedIn && (
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                      Acceso Público
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Consulta novedades, descarga nuevas versiones y mantén Agua VP al día
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-emerald-500/20 shadow-sm">
              <HiShieldCheck className="w-4 h-4 shrink-0" />
              <span>Actualización Segura</span>
            </div>

            {!loggedIn && (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <HiLockClosed className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── CONTENIDO PRINCIPAL: PANEL DE ACTUALIZACIONES ── */}
        <PanelActualizaciones />

        {/* ── FOOTER INSTITUCIONAL PARA ACCESO PÚBLICO ── */}
        {!loggedIn && (
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
              Sistema de Agua Potable • Villa Pesqueira • Servicio de Mantenimiento y Actualizaciones
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}
