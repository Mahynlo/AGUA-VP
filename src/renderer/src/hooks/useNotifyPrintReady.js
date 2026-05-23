import { useEffect } from 'react';

/**
 * Notifica al proceso principal que el componente de impresión terminó de
 * renderizar sus datos y gráficas.
 *
 * @param {boolean} isReady  - Condición que indica que los datos ya están cargados.
 * @param {number}  chartDelay - Milisegundos extra para que las gráficas terminen de pintar (default 800ms).
 */
export function useNotifyPrintReady(isReady, chartDelay = 800) {
    useEffect(() => {
        if (!isReady) return;

        let raf;
        let timer;

        raf = requestAnimationFrame(() => {
            timer = setTimeout(() => {
                window.api?.notifyPrintReady?.();
            }, chartDelay);
        });

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [isReady]);
}
