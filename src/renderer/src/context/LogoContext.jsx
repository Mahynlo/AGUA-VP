import { createContext, useContext, useState } from 'react';
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

  const setCustomLogo = (base64DataUrl) => {
    localStorage.setItem(LOGO_KEY, base64DataUrl);
    setCustomLogoState(base64DataUrl);
  };

  const clearCustomLogo = () => {
    localStorage.removeItem(LOGO_KEY);
    setCustomLogoState(null);
  };

  const addLoginImages = (base64Array) => {
    const existing = customLoginImages || [];
    const updated = [...existing, ...base64Array];
    localStorage.setItem(LOGIN_IMAGES_KEY, JSON.stringify(updated));
    setCustomLoginImagesState(updated);
  };

  const removeLoginImage = (index) => {
    const updated = (customLoginImages || []).filter((_, i) => i !== index);
    if (updated.length === 0) {
      localStorage.removeItem(LOGIN_IMAGES_KEY);
      setCustomLoginImagesState(null);
    } else {
      localStorage.setItem(LOGIN_IMAGES_KEY, JSON.stringify(updated));
      setCustomLoginImagesState(updated);
    }
  };

  const clearLoginImages = () => {
    localStorage.removeItem(LOGIN_IMAGES_KEY);
    setCustomLoginImagesState(null);
  };

  return (
    <LogoContext.Provider value={{
      logoSrc, hasCustomLogo: !!customLogo, setCustomLogo, clearCustomLogo,
      loginImages: customLoginImages, hasCustomLoginImages: !!customLoginImages,
      addLoginImages, removeLoginImage, clearLoginImages,
    }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useAppLogo = () => useContext(LogoContext);
