import { useState, useEffect, useCallback } from 'react';

const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
const MAX_CARACTERES = 200;

const useAnuncioRecibo = () => {
  const [anuncio, setAnuncio] = useState(() => {
    return localStorage.getItem('anuncio_recibo') || MENSAJE_POR_DEFECTO;
  });

  const cargarAnuncio = useCallback(() => {
    const guardado = localStorage.getItem('anuncio_recibo');
    setAnuncio(guardado || MENSAJE_POR_DEFECTO);
  }, []);

  useEffect(() => {
    cargarAnuncio();

    const handleCustomEvent = (e) => {
      if (e?.detail) {
        setAnuncio(e.detail);
      } else {
        cargarAnuncio();
      }
    };

    const handleStorageEvent = (e) => {
      if (e.key === 'anuncio_recibo') {
        cargarAnuncio();
      }
    };

    window.addEventListener('anuncio_recibo_changed', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('anuncio_recibo_changed', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [cargarAnuncio]);

  const actualizarAnuncio = (nuevoAnuncio) => {
    const anuncioFinal = (nuevoAnuncio || '').slice(0, MAX_CARACTERES);
    localStorage.setItem('anuncio_recibo', anuncioFinal);
    setAnuncio(anuncioFinal);
    window.dispatchEvent(new CustomEvent('anuncio_recibo_changed', { detail: anuncioFinal }));
  };

  const resetearAnuncio = () => {
    localStorage.removeItem('anuncio_recibo');
    setAnuncio(MENSAJE_POR_DEFECTO);
    window.dispatchEvent(new CustomEvent('anuncio_recibo_changed', { detail: MENSAJE_POR_DEFECTO }));
  };

  return {
    anuncio,
    actualizarAnuncio,
    resetearAnuncio,
    MENSAJE_POR_DEFECTO,
    MAX_CARACTERES
  };
};

export default useAnuncioRecibo;

