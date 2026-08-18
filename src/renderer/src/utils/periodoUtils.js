export const obtenerPeriodoActual = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
};

export const sumarMesPeriodo = (periodo, n = 1) => {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo || "";
  const [anioRaw, mesRaw] = periodo.split("-");
  let anio = Number(anioRaw);
  let mes = Number(mesRaw) + n;

  while (mes > 12) {
    mes -= 12;
    anio += 1;
  }
  while (mes < 1) {
    mes += 12;
    anio -= 1;
  }

  return `${anio}-${String(mes).padStart(2, "0")}`;
};

export const restarMesPeriodo = (periodo, n = 1) => {
  return sumarMesPeriodo(periodo, -n);
};

export const compararPeriodos = (p1, p2) => {
  if (!p1 && !p2) return 0;
  if (!p1) return -1;
  if (!p2) return 1;
  return p1.localeCompare(p2);
};

export const formatearPeriodo = (periodo, locale = "es-MX") => {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo || "";

  const [anioRaw, mesRaw] = periodo.split("-");
  const anio = Number(anioRaw);
  const mes = Number(mesRaw);

  if (!anio || !mes || mes < 1 || mes > 12) return periodo;

  const fecha = new Date(anio, mes - 1, 1);
  const mesNombre = fecha.toLocaleDateString(locale, { month: "long" });
  const mesCapitalizado = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
  return `${mesCapitalizado} ${anio}`;
};

export const generarCatalogoPeriodos = ({ startYear = 2020, endPeriod, futureMonths = 0 } = {}) => {
  // Limita al mes actual del calendario (o endPeriod si se especifica) sin meses futuros extras
  const baseActual = endPeriod || obtenerPeriodoActual();
  const periodoFinal = futureMonths > 0 ? sumarMesPeriodo(baseActual, futureMonths) : baseActual;

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
