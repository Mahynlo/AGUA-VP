/**
 * Utilidad de Precarga Proactiva para @embedpdf y PDFium WebAssembly
 * Permite que el visor de documentos PDF abra de forma instantánea sin tiempos de espera.
 */
let isPreloading = false;
let isPreloaded = false;

export const preloadPdfViewer = () => {
  if (isPreloaded || isPreloading || typeof window === 'undefined') return;
  isPreloading = true;

  const doPreload = () => {
    import('@embedpdf/react-pdf-viewer')
      .then(() => {
        isPreloaded = true;
        isPreloading = false;
      })
      .catch((err) => {
        isPreloading = false;
        console.warn('Aviso de precarga @embedpdf:', err);
      });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(doPreload, { timeout: 3000 });
  } else {
    setTimeout(doPreload, 1200);
  }
};
