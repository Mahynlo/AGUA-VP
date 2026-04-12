/**
 * Calculadora de tarifas con desglose por tramo.
 * Replica la misma logica usada en backend (tarifaUtils.js).
 */

export const calcularTarifaConDesglose = (consumo_m3, rangos) => {
  if (!rangos || rangos.length === 0) {
    throw new Error("La tarifa no tiene rangos definidos");
  }

  if (consumo_m3 == null || Number.isNaN(Number(consumo_m3))) {
    throw new Error("El consumo es invalido");
  }

  const consumoNumero = Number(consumo_m3);
  if (consumoNumero < 0) {
    throw new Error("El consumo no puede ser negativo");
  }

  const consumoEntero = Math.floor(consumoNumero);
  const rangosOrdenados = [...rangos].sort(
    (a, b) => Number(a.consumo_min) - Number(b.consumo_min)
  );

  let total = 0;
  let rangoFinalEncontrado = false;
  const detalle = [];

  for (const rango of rangosOrdenados) {
    const consumo_min = Number(rango.consumo_min);
    const consumo_max = rango.consumo_max != null ? Number(rango.consumo_max) : Infinity;
    const precio_por_m3 = Number(rango.precio_por_m3);
    const esPrimerRango = consumo_min === 0;

    if (consumoEntero > consumo_max) {
      if (esPrimerRango) {
        total += precio_por_m3;
        detalle.push({
          consumo_min,
          consumo_max: Number.isFinite(consumo_max) ? consumo_max : null,
          tipo: "base_fija",
          metros: null,
          precio_por_m3,
          subtotal: Number(precio_por_m3.toFixed(2)),
        });
      } else {
        const metros_en_rango = consumo_max - consumo_min + 1;
        const subtotal = metros_en_rango * precio_por_m3;
        total += subtotal;
        detalle.push({
          consumo_min,
          consumo_max: Number.isFinite(consumo_max) ? consumo_max : null,
          tipo: "tramo_completo",
          metros: metros_en_rango,
          precio_por_m3,
          subtotal: Number(subtotal.toFixed(2)),
        });
      }
    } else if (consumoEntero >= consumo_min) {
      if (esPrimerRango) {
        total += precio_por_m3;
        detalle.push({
          consumo_min,
          consumo_max: Number.isFinite(consumo_max) ? consumo_max : null,
          tipo: "base_fija",
          metros: null,
          precio_por_m3,
          subtotal: Number(precio_por_m3.toFixed(2)),
        });
      } else {
        const metros_consumidos = consumoEntero - consumo_min + 1;
        const subtotal = metros_consumidos * precio_por_m3;
        total += subtotal;
        detalle.push({
          consumo_min,
          consumo_max: Number.isFinite(consumo_max) ? consumo_max : null,
          tipo: "tramo_parcial",
          metros: metros_consumidos,
          precio_por_m3,
          subtotal: Number(subtotal.toFixed(2)),
        });
      }

      rangoFinalEncontrado = true;
      break;
    }
  }

  if (!rangoFinalEncontrado && rangosOrdenados.length > 0) {
    const ultimoRango = rangosOrdenados[rangosOrdenados.length - 1];
    const ultimo_max = ultimoRango.consumo_max != null ? Number(ultimoRango.consumo_max) : null;
    const ultimo_precio = Number(ultimoRango.precio_por_m3);

    if (ultimo_max !== null) {
      const excedente = consumoEntero - ultimo_max;
      const subtotal = excedente * ultimo_precio;
      total += subtotal;
      detalle.push({
        consumo_min: ultimo_max + 1,
        consumo_max: null,
        tipo: "excedente",
        metros: excedente,
        precio_por_m3: ultimo_precio,
        subtotal: Number(subtotal.toFixed(2)),
      });
    }
  }

  return {
    consumo_ingresado: consumoNumero,
    consumo_facturable: consumoEntero,
    total: Number(total.toFixed(2)),
    detalle,
  };
};
