
import React from 'react';
import { HiX, HiPrinter } from 'react-icons/hi';

const ModalVistaPrevia = ({ pdfUrl, onClose }) => {
    if (!pdfUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <HiPrinter size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Vista Previa de Impresión</h2>
                            <p className="text-sm text-gray-500">Revise el documento antes de imprimir</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500"
                    >
                        <HiX size={24} />
                    </button>
                </div>

                {/* Content (PDF Iframe) */}
                <div className="flex-1 bg-gray-100 relative">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-none"
                        title="Vista Previa de PDF"
                    />
                </div>

                {/* Footer (Optional actions) */}
                {/* El propio visor de PDF de Chrome ya trae botón de imprimir, 
            pero podríamos poner uno externo si quisiéramos. */}
            </div>
        </div>
    );
};

export default ModalVistaPrevia;
