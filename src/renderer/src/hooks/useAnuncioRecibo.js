import { useState, useEffect } from 'react';

const useAnuncioRecibo = () => {
  const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
  
  const [anuncio, setAnuncio] = useState(MENSAJE_POR_DEFECTO);

  useEffect(() => {
    // Cargar anuncio guardado al montar el componente
    const anuncioGuardado = localStorage.getItem('anuncio_recibo');
    if (anuncioGuardado) {
      setAnuncio(anuncioGuardado);
    }
  }, []);

  const actualizarAnuncio = (nuevoAnuncio) => {
    setAnuncio(nuevoAnuncio);
  };

  const resetearAnuncio = () => {
    localStorage.removeItem('anuncio_recibo');
    setAnuncio(MENSAJE_POR_DEFECTO);
  };

  return {
    anuncio,
    actualizarAnuncio,
    resetearAnuncio,
    MENSAJE_POR_DEFECTO
  };
};

export default useAnuncioRecibo;
