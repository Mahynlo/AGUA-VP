import { useEffect } from 'react';

/**
 * Notifica al proceso principal que el componente de impresión terminó de
 * renderizar sus datos y gráficas.
 *
 * @param {boolean} isReady  - Condición que indica que los datos ya están cargados.
 * @param {number}  chartDelay - Milisegundos extra para que las gráficas y DOM terminen de pintar (default 200ms).
 */
export function useNotifyPrintReady(isReady, chartDelay = 200) {
    useEffect(() => {
        if (!isReady) return;

        let raf;
        let timer;

        raf = requestAnimationFrame(() => {
            timer = setTimeout(() => {
                console.log('⚡ [useNotifyPrintReady] Señal de impresión lista enviada');
                window.api?.notifyPrintReady?.();
            }, chartDelay);
        });

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [isReady, chartDelay]);
}
