import React, { useState, useEffect } from 'react';
import { Modal, Button, Label } from 'flowbite-react';

const ModalAnuncioRecibo = ({ isOpen, onClose, onSave }) => {
  const [anuncio, setAnuncio] = useState('');
  const [caracteresRestantes, setCaracteresRestantes] = useState(150);
  
  const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
  const MAX_CARACTERES = 150; // Incrementado para permitir mensajes más largos

  useEffect(() => {
    if (isOpen) {
      // Cargar anuncio guardado o usar el por defecto
      const anuncioGuardado = localStorage.getItem('anuncio_recibo');
      const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
      setAnuncio(mensajeInicial);
      setCaracteresRestantes(MAX_CARACTERES - mensajeInicial.length);
    }
  }, [isOpen]);

  const handleAnuncioChange = (e) => {
    const nuevoTexto = e.target.value;
    console.log('Cambiando texto a:', nuevoTexto, 'Longitud:', nuevoTexto.length);
    if (nuevoTexto.length <= MAX_CARACTERES) {
      setAnuncio(nuevoTexto);
      setCaracteresRestantes(MAX_CARACTERES - nuevoTexto.length);
    }
  };

  const handleGuardar = () => {
    const anuncioFinal = anuncio.trim() || MENSAJE_POR_DEFECTO;
    localStorage.setItem('anuncio_recibo', anuncioFinal);
    onSave(anuncioFinal);
    onClose();
  };

  const handleRestaurarDefecto = () => {
    setAnuncio(MENSAJE_POR_DEFECTO);
    setCaracteresRestantes(MAX_CARACTERES - MENSAJE_POR_DEFECTO.length);
  };

  const handleCancelar = () => {
    // Restaurar al valor guardado
    const anuncioGuardado = localStorage.getItem('anuncio_recibo');
    const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
    setAnuncio(mensajeInicial);
    setCaracteresRestantes(MAX_CARACTERES - mensajeInicial.length);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={handleCancelar} size="lg">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <span className="text-xl">📢</span>
          Configurar Anuncio de Recibos
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label htmlFor="anuncio" value="Mensaje para el apartado de información" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Este mensaje aparecerá en la sección de "Información" de todos los recibos impresos.
            </p>
          </div>
          
          <div className="relative">
            <textarea
              id="anuncio"
              value={anuncio}
              onChange={handleAnuncioChange}
              rows={4}
              placeholder="Escriba aquí el mensaje que aparecerá en los recibos..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-none"
              maxLength={MAX_CARACTERES}
            />
            <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded ${
              caracteresRestantes < 20 
                ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' 
                : caracteresRestantes < 50
                ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
                : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {caracteresRestantes} caracteres restantes
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Vista previa:
            </h4>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border text-sm text-gray-700 dark:text-gray-300">
              {anuncio || "Sin mensaje configurado"}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              💡 Consejos:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Mantenga el mensaje breve y claro</li>
              <li>• Incluya información útil como números de contacto</li>
              <li>• Evite caracteres especiales que puedan causar problemas en la impresión</li>
            </ul>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <Button color="gray" onClick={handleRestaurarDefecto}>
            Restaurar mensaje por defecto
          </Button>
          <div className="flex gap-2">
            <Button color="gray" onClick={handleCancelar}>
              Cancelar
            </Button>
            <Button 
              color="blue" 
              onClick={handleGuardar}
              disabled={!anuncio.trim()}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

