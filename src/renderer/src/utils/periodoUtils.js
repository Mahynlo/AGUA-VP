export const obtenerPeriodoActual = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
};

export const formatearPeriodo = (periodo, locale = "es-MX") => {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo || "";

  const [anioRaw, mesRaw] = periodo.split("-");
  const anio = Number(anioRaw);
  const mes = Number(mesRaw);

  if (!anio || !mes || mes < 1 || mes > 12) return periodo;

  const fecha = new Date(anio, mes - 1, 1);
  const etiqueta = fecha.toLocaleDateString(locale, { month: "long", year: "numeric" });
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
};

export const generarCatalogoPeriodos = ({ startYear = 2020, endPeriod } = {}) => {
  const periodoFinal = endPeriod || obtenerPeriodoActual();

  if (!/^\d{4}-\d{2}$/.test(periodoFinal)) {
    return [];
  }

  const [endYearRaw, endMonthRaw] = periodoFinal.split("-");
  const endYear = Number(endYearRaw);
  const endMonth = Number(endMonthRaw);

  if (!endYear || !endMonth) {
    return [];
  }

  const anioInicio = Math.min(startYear, endYear);
  const catalogo = [];

  for (let anio = endYear; anio >= anioInicio; anio--) {
    const mesInicial = anio === endYear ? endMonth : 12;

    for (let mes = mesInicial; mes >= 1; mes--) {
      const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
      catalogo.push({
        value: periodo,
        label: formatearPeriodo(periodo),
        year: String(anio),
      });
    }
  }

  return catalogo;
};
