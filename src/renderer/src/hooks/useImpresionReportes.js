import { useState } from 'react';
import { construirURLReporte } from '../utils/reporteUtils';

export const useImpresionReportes = (datos, tipoReporte) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const validarDatos = () => {
        if (!datos || datos.length === 0) {
            // Puedes usar tu sistema de notificaciones aquí
            console.warn("No hay datos para imprimir");
            return false;
        }
        return true;
    };

    // Función para Imprimir (Directo a impresora o diálogo de sistema)
    const handleImprimir = () => {
        if (!validarDatos()) return;

        setIsPrinting(true);
        const url = construirURLReporte(datos, tipoReporte, false);

        if (!url) {
            setIsPrinting(false);
            return;
        }

        console.log(`🖨️ Imprimiendo ${tipoReporte} (${datos.length} registros)...`);

        if (window.api && window.api.printComponent) {
            window.api.printComponent(url, (res) => {
                console.log("Resultado impresión:", res);
                setIsPrinting(false);
            });
        } else {
            console.error("API de Electron no disponible");
            setIsPrinting(false);
        }
    };

    // Función para Vista Previa
    const handleVistaPrevia = () => {
        if (!validarDatos()) return;

        const url = construirURLReporte(datos, tipoReporte, true);
        if (!url) return;

        console.log(`👀 Vista previa ${tipoReporte}...`);

        if (window.api && window.api.previewComponent) {
            window.api.previewComponent(url, (res) => {
                console.log("Resultado preview:", res);
            });
        } else {
            // Fallback para desarrollo web (abre en nueva pestaña)
            window.open(url, '_blank', 'width=1000,height=800');
        }
    };

    return {
        handleImprimir,
        handleVistaPrevia,
        isPrinting
    };
};