import { useState, useEffect } from 'react';
import frasesData from '../assets/frases_equivalencia_de_consumo.json';

const useEquivalenciaConsumo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [frasesDisponibles, setFrasesDisponibles] = useState([]);

  useEffect(() => {
    try {
      setFrasesDisponibles(frasesData.consumo_agua_frases || []);
    } catch (err) {
      console.error('Error al cargar frases de equivalencia:', err);
      setError('Error al cargar las frases de equivalencia');
    }
  }, []);

  // Función para encontrar la frase más cercana según el consumo
  const obtenerFraseEquivalencia = (consumo) => {
    try {
      // Validar que el consumo sea un número válido
      const consumoNumero = parseFloat(consumo);
      if (isNaN(consumoNumero) || consumoNumero < 0) {
        return "Consumo no válido";
      }

      // Caso especial: consumo 0
      if (consumoNumero === 0) {
        return "No hay consumo registrado en este período";
      }

      // Caso especial: consumo muy bajo (menor a 5)
      if (consumoNumero < 5) {
        // Usar las frases del nivel 5 m³
        const nivel5 = frasesDisponibles.find(item => item.m3 === 5);
        if (nivel5 && nivel5.frases.length > 0) {
          const fraseAleatoria = nivel5.frases[Math.floor(Math.random() * nivel5.frases.length)];
          return `Con ${consumoNumero} m³: ${fraseAleatoria.replace('5', consumoNumero.toString())}`;
        }
        return `Consumo muy bajo: ${consumoNumero} m³`;
      }

      // Encontrar el nivel más cercano
      let nivelMasCercano = null;
      let menorDiferencia = Infinity;

      frasesDisponibles.forEach(item => {
        const diferencia = Math.abs(item.m3 - consumoNumero);
        if (diferencia < menorDiferencia) {
          menorDiferencia = diferencia;
          nivelMasCercano = item;
        }
      });

      // Si no se encuentra un nivel cercano, usar el más alto disponible
      if (!nivelMasCercano) {
        const nivelMasAlto = frasesDisponibles[frasesDisponibles.length - 1];
        if (nivelMasAlto && nivelMasAlto.frases.length > 0) {
          const fraseAleatoria = nivelMasAlto.frases[Math.floor(Math.random() * nivelMasAlto.frases.length)];
          return `Consumo alto (${consumoNumero} m³): ${fraseAleatoria}`;
        }
        return `Consumo alto: ${consumoNumero} m³`;
      }

      // Seleccionar una frase aleatoria del nivel más cercano
      if (nivelMasCercano.frases.length > 0) {
        const fraseAleatoria = nivelMasCercano.frases[Math.floor(Math.random() * nivelMasCercano.frases.length)];
        
        // Si el consumo coincide exactamente, usar la frase tal como está
        if (consumoNumero === nivelMasCercano.m3) {
          return fraseAleatoria;
        }
        
        // Si no coincide exactamente, personalizar la frase
        return `Con ${consumoNumero} m³ (similar a ${nivelMasCercano.m3} m³): ${fraseAleatoria}`;
      }

      return `Consumo: ${consumoNumero} m³`;

    } catch (err) {
      console.error('Error al obtener frase de equivalencia:', err);
      return "Error al calcular equivalencia";
    }
  };

  // Función para obtener todas las frases disponibles (para el modal)
  const obtenerTodasLasFrases = () => {
    const frasesAplanadas = [];
    
    // Si no hay datos, retornar vacío
    if (!frasesDisponibles || frasesDisponibles.length === 0) {
      return [];
    }

    // Ordenar por m3 para asegurar rangos correctos
    const sortedData = [...frasesDisponibles].sort((a, b) => a.m3 - b.m3);

    sortedData.forEach((item, index) => {
      // Determinar el rango anterior
      const rangoMin = index === 0 ? 0 : sortedData[index - 1].m3;
      const rangoMax = item.m3;
      
      // Agregar cada frase de este nivel
      if (item.frases && Array.isArray(item.frases)) {
        item.frases.forEach(frase => {
          frasesAplanadas.push({
            rango_min: rangoMin,
            rango_max: rangoMax,
            categoria: "Consumo de Agua", 
            frase: frase,
            m3: item.m3 // Mantener la referencia original por si acaso
          });
        });
      }
    });

    return frasesAplanadas;
  };

  // Función para probar diferentes consumos (con loading state para el modal)
  const probarEquivalencia = (consumo) => {
    setLoading(true);
    setError(null);
    
    try {
      const resultado = obtenerFraseEquivalencia(consumo);
      return resultado;
    } catch (err) {
      console.error('Error al probar equivalencia:', err);
      setError('Error al probar la equivalencia');
      return "Error al calcular equivalencia";
    } finally {
      setTimeout(() => setLoading(false), 100); // Pequeño delay para mostrar loading
    }
  };

  return {
    obtenerFraseEquivalencia,
    obtenerTodasLasFrases,
    probarEquivalencia,
    frasesDisponibles,
    loading,
    error
  };
};

export default useEquivalenciaConsumo;
