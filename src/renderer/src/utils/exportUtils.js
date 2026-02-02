import * as XLSX from 'xlsx';

/**
 * Exporta datos a CSV o Excel
 * @param {Array} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {string} format - 'csv' o 'xlsx'
 */
/**
 * Exporta datos a CSV o Excel usando el diálogo nativo
 * @param {Array} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {string} format - 'csv' o 'xlsx'
 * @returns {Promise<boolean>} - true si se guardó, false si se canceló o falló
 */
export const exportData = async (data, filename, format = 'csv') => {
    if (!data || (Array.isArray(data) && !data.length) || (typeof data === 'object' && !Object.keys(data).length)) {
      console.warn("No hay datos para exportar");
      return false;
    }
  
    let contentToSend;

    // Detectar si es multi-hoja (objeto con arrays) o simple (array único)
    const isMultiSheet = !Array.isArray(data) && typeof data === 'object';

    if (format === 'xlsx') {
        const workbook = XLSX.utils.book_new();
        
        if (isMultiSheet) {
            Object.keys(data).forEach(sheetName => {
                const sheetData = data[sheetName];
                if (Array.isArray(sheetData) && sheetData.length > 0) {
                    const worksheet = XLSX.utils.json_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Max 31 chars
                }
            });
        } else {
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
        }
        
        // Generar buffer en base64 para enviar por IPC
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        contentToSend = wbout;
    } else {
        // Para CSV, si es multi-sheet, concatenamos o solo exportamos la primera hoja relevante
        // Simplificación: Unimos todo con separadores
        let combinedData = [];
        
        if (isMultiSheet) {
             Object.keys(data).forEach(key => {
                 // Agregar encabezado de sección
                 combinedData.push({ [Object.keys(data[key][0] || {})[0] || 'Seccion']: `--- ${key.toUpperCase()} ---` });
                 combinedData = combinedData.concat(data[key]);
                 combinedData.push({}); // Espacio
             });
        } else {
             combinedData = data;
        }

        // Generar CSV string (lógica existente adaptada)
        // Nota: El CSV generado de objetos heterogéneos puede ser extraño, pero funcional
        const allKeys = Array.from(new Set(combinedData.flatMap(Object.keys)));
        
        const csvContent = [
          allKeys.join(","), 
          ...combinedData.map(row => 
            allKeys.map(header => {
              let value = row[header];
              if (value === null || value === undefined) {
                 value = "";
              } else {
                 value = String(value).replace(/"/g, '""'); 
              }
              if (/[",\n]/.test(value)) {
                 value = `"${value}"`;
              }
              return value;
            }).join(",")
          )
        ].join("\n");
        contentToSend = csvContent;
    }

    try {
        // Llamar al API nativo
        const result = await window.api.saveFile({ 
            data: contentToSend, 
            fileName: filename, 
            format: format 
        });
        
        return result.success;
    } catch (error) {
        console.error("Error al guardar archivo:", error);
        return false;
    }
  };

// Mantener compatibilidad con llamadas anteriores
export const exportToCSV = (data, filename) => exportData(data, filename, 'csv');
