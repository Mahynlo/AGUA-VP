
export function stringToUTCDate(fechaInput) {
  if (fechaInput instanceof Date) {
    // Ya es un Date, lo retornamos directamente

    //se asume es que de tipo UTC
    //const fecha = new Date(fechaInput + 'Z')
    return fechaInput;
  }

  if (typeof fechaInput !== "string") {
    // No es string ni Date, inválido
    return null;
  }

  // Reemplazamos espacio por "T" y agregamos 'Z' para UTC
  const isoString = fechaInput.replace(" ", "T") + "Z";

  const fecha = new Date(isoString);

  return isNaN(fecha.getTime()) ? null : fecha;
}


export function formatUTCtoHermosillo(fechaInput) {
  const fechaUtc = stringToUTCDate(fechaInput);
  if (!fechaUtc) return "Fecha inválida";

  return fechaUtc.toLocaleString("es-MX", {
    timeZone: "America/Hermosillo",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatUTCtoHermosilloSoloFecha(fechaInput) {
  const fechaUtc = stringToUTCDate(fechaInput);
  if (!fechaUtc) return "Fecha inválida";

  return fechaUtc.toLocaleDateString("es-MX", {
    timeZone: "America/Hermosillo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


export function formatUTCtoHermosilloHora(fechaInput) {
  const fechaUtc = stringToUTCDate(fechaInput);
  if (!fechaUtc) return "Fecha inválida";

  return fechaUtc.toLocaleTimeString("es-MX", {
    timeZone: "America/Hermosillo", // Asegura la zona horaria correcta
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatoFirstDay(fechaStr) {
  if (!fechaStr) return "";

  // Crear objeto Date interpretando la fecha como local (sin zona)
  const fecha = new Date(fechaStr + "T00:00:00");

  if (isNaN(fecha.getTime())) return "Fecha inválida";

  return fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Hermosillo",
  });
}


