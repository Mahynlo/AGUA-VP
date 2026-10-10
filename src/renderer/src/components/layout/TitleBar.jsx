
export function CustomTitleBar() {
  const handleMinimize = () => {
    window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI.maximize();
  };

  const handleClose = () => {
    window.electronAPI.close();
  };

  return (
    <div className="flex items-center justify-between bg-teal-700 text-white h-10 px-3 shadow drag">
      {/* Icono y título */}
      <div className="flex items-center space-x-2">
        <img
          src="/path/to/icon.png"
          alt="App Icon"
          className="w-5 h-5"
        />
        <span className="text-sm font-medium">
          AGUA VP - Consumo de Agua
        </span>
      </div>

      {/* Botones de control */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleMinimize}
          className="hover:bg-teal-600 p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /></svg>
        </button>
        <button
          onClick={handleMaximize}
          className="hover:bg-teal-600 p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-square"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /></svg>
        </button>
        <button
          onClick={handleClose}
          className="hover:bg-red-600 p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

