import { useState } from "react";
import { Button, Divider } from "@nextui-org/react";
import { HiCollection, HiPhotograph, HiPlusCircle, HiTrash, HiUpload } from "react-icons/hi";
import { useAppLogo } from "../../context/LogoContext";

export default function PanelPersonalizacion() {
  const {
    logoSrc,
    hasCustomLogo,
    setCustomLogo,
    clearCustomLogo,
    loginImages,
    hasCustomLoginImages,
    addLoginImages,
    removeLoginImage,
    clearLoginImages
  } = useAppLogo();
  
  const [savingLogo, setSavingLogo] = useState(false);
  const [addingLoginImages, setAddingLoginImages] = useState(false);

  const handleSelectLogo = async () => {
    setSavingLogo(true);
    try {
      const result = await window.api.selectLogo();
      if (result?.success) setCustomLogo(result.data);
    } catch (err) {
      console.error("Error seleccionando logo:", err);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleAddLoginImages = async () => {
    setAddingLoginImages(true);
    try {
      const result = await window.api.selectLoginImages();
      if (result?.success) addLoginImages(result.data);
    } catch (err) {
      console.error("Error seleccionando imágenes:", err);
    } finally {
      setAddingLoginImages(false);
    }
  };

  return (
    /* Token 1: Contenedor Raíz (con max-w para paneles de configuración) */
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0 animate-in fade-in duration-500 flex flex-col gap-8">
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER GLOBAL                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl shrink-0">
          <HiPhotograph className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1">
          {/* Token 3: Textos Principales */}
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
            Personalización de la App
          </h2>
          <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Identidad visual y carrusel del login
          </p>
        </div>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: IDENTIDAD VISUAL (Logo)                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        
        {/* Cabecera de Sección restaurada con su ícono */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
            <HiPhotograph className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              Identidad Visual
            </h3>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              Logo que aparece en el login, barra de navegación, recibos e informes impresos.
            </p>
          </div>
        </div>

        {/* Tarjeta interior limpia (Token 5 adaptado) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200">
          <div className="shrink-0 w-32 h-32 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src={logoSrc}
              alt="Logo actual"
              className="w-full h-full object-contain p-4"
            />
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                {hasCustomLogo ? "Logo personalizado activo" : "Logo predeterminado de la aplicación"}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Formatos soportados: PNG, JPG, WEBP. Recomendado: fondo transparente.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-1">
              {/* Token 4: Botón Primario */}
              <Button
                onPress={handleSelectLogo}
                isLoading={savingLogo}
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm h-11"
                startContent={!savingLogo && <HiUpload className="text-lg" />}
              >
                {savingLogo ? "Cargando..." : "Seleccionar imagen"}
              </Button>

              {hasCustomLogo && (
                <Button
                  onPress={clearCustomLogo}
                  variant="flat"
                  className="font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl px-6 h-11"
                  startContent={<HiTrash className="text-lg" />}
                >
                  Restaurar predeterminado
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: IMÁGENES DEL LOGIN (Carrusel)                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        
        {/* Cabecera de Sección restaurada con su ícono */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <HiCollection className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              Imágenes del Login
            </h3>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              Carrusel de fondo en la pantalla de inicio de sesión. Si no hay imágenes personalizadas, se usan las predeterminadas.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200">
          
          {loginImages && loginImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {loginImages.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 aspect-video bg-white dark:bg-zinc-900 shadow-sm">
                  <img src={src} alt={`Login ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  
                  <button
                    onClick={() => removeLoginImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                    title="Eliminar imagen"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-md text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state limpio (SaaS) */
            <div className="border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3">
                <HiCollection className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-1">Sin imágenes personalizadas</p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Se mostrarán las 3 imágenes predeterminadas de la aplicación.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {/* Token 4: Botón Primario */}
            <Button
              onPress={handleAddLoginImages}
              isLoading={addingLoginImages}
              className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-6 shadow-sm h-11"
              startContent={!addingLoginImages && <HiPlusCircle className="text-lg" />}
            >
              {addingLoginImages ? "Cargando..." : "Agregar imágenes"}
            </Button>

            {hasCustomLoginImages && (
              <Button
                onPress={clearLoginImages}
                variant="flat"
                className="font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl px-6 h-11"
                startContent={<HiTrash className="text-lg" />}
              >
                Restaurar predeterminadas
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
