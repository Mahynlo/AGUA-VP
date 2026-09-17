import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import defaultLogo from '../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png';

const LOGO_KEY = 'app_custom_logo';
const LOGIN_IMAGES_KEY = 'app_login_images';

const LogoContext = createContext();

export const LogoProvider = ({ children }) => {
  const [customLogo, setCustomLogoState] = useState(() =>
    localStorage.getItem(LOGO_KEY) || null
  );

  const [customLoginImages, setCustomLoginImagesState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOGIN_IMAGES_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Si hay logo personalizado lo usa, si no usa el logo por defecto del bundle
  const logoSrc = customLogo || defaultLogo;

  const setCustomLogo = useCallback((base64DataUrl) => {
    localStorage.setItem(LOGO_KEY, base64DataUrl);
    setCustomLogoState(base64DataUrl);
  }, []);

  const clearCustomLogo = useCallback(() => {
    localStorage.removeItem(LOGO_KEY);
    setCustomLogoState(null);
  }, []);

  const addLoginImages = useCallback((base64Array) => {
    setCustomLoginImagesState((prev) => {
      const existing = prev || [];
      const updated = [...existing, ...base64Array];
      try {
        localStorage.setItem(LOGIN_IMAGES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Error al persistir imágenes de login:", err);
      }
      return updated;
    });
  }, []);

  const removeLoginImage = useCallback((index) => {
    setCustomLoginImagesState((prev) => {
      const updated = (prev || []).filter((_, i) => i !== index);
      if (updated.length === 0) {
        localStorage.removeItem(LOGIN_IMAGES_KEY);
        return null;
      } else {
        localStorage.setItem(LOGIN_IMAGES_KEY, JSON.stringify(updated));
        return updated;
      }
    });
  }, []);

  const clearLoginImages = useCallback(() => {
    localStorage.removeItem(LOGIN_IMAGES_KEY);
    setCustomLoginImagesState(null);
  }, []);

  const value = useMemo(() => ({
    logoSrc,
    hasCustomLogo: !!customLogo,
    setCustomLogo,
    clearCustomLogo,
    loginImages: customLoginImages,
    hasCustomLoginImages: !!customLoginImages,
    addLoginImages,
    removeLoginImage,
    clearLoginImages,
  }), [
    logoSrc,
    customLogo,
    setCustomLogo,
    clearCustomLogo,
    customLoginImages,
    addLoginImages,
    removeLoginImage,
    clearLoginImages
  ]);

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};

export const useAppLogo = () => useContext(LogoContext);
