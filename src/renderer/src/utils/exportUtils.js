/**
 * Exporta datos a CSV o Excel usando el diálogo nativo de Electron.
 * Para xlsx: los datos se envían crudos al proceso principal donde ExcelJS genera el archivo.
 * Para csv: se genera el string aquí en el renderer (sin dependencias externas).
 *
 * @param {Array|Object} data - Array de objetos (hoja única) u objeto { sheetName: Array } (multi-hoja)
 * @param {string} filename - Nombre del archivo sin extensión
 * @param {string} format - 'csv' o 'xlsx'
 * @returns {Promise<boolean>} true si se guardó, false si se canceló o falló
 */
export const exportData = async (data, filename, format = 'csv') => {
    if (!data || (Array.isArray(data) && !data.length) || (typeof data === 'object' && !Array.isArray(data) && !Object.keys(data).length)) {
        console.warn("No hay datos para exportar");
        return false;
    }

    const isMultiSheet = !Array.isArray(data) && typeof data === 'object';
    let contentToSend;

    if (format === 'xlsx') {
        // Enviar datos crudos al proceso principal — ExcelJS genera el archivo allá
        contentToSend = data;
    } else {
        // CSV puro en el renderer, sin dependencias externas
        let combinedData = [];

        if (isMultiSheet) {
            Object.keys(data).forEach(key => {
                combinedData.push({ [Object.keys(data[key][0] || {})[0] || 'Seccion']: `--- ${key.toUpperCase()} ---` });
                combinedData = combinedData.concat(data[key]);
                combinedData.push({});
            });
        } else {
            combinedData = data;
        }

        const allKeys = Array.from(new Set(combinedData.flatMap(Object.keys)));
        contentToSend = [
            allKeys.join(","),
            ...combinedData.map(row =>
                allKeys.map(header => {
                    let value = row[header];
                    if (value === null || value === undefined) {
                        value = "";
                    } else {
                        value = String(value).replace(/"/g, '""');
                    }
                    if (/[",\n]/.test(value)) value = `"${value}"`;
                    return value;
                }).join(",")
            )
        ].join("\n");
    }

    try {
        const result = await window.api.saveFile({
            data: contentToSend,
            fileName: filename,
            format,
        });
        return result.success;
    } catch (error) {
        console.error("Error al guardar archivo:", error);
        return false;
    }
};

export const exportToCSV = (data, filename) => exportData(data, filename, 'csv');
