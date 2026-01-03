import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Chip,
  Card,
  CardBody
} from "@nextui-org/react";
import {
  HiSearch,
  HiX,
  HiQuestionMarkCircle,
  HiDocument
} from "react-icons/hi";
import { HighlightText } from "./HighlightText";

const SearchModal = React.memo(({ 
  isOpen, 
  onOpenChange, 
  modalSearchTerm, 
  setModalSearchTerm,
  searching,
  searchResults,
  sectionIcons,
  handleSelectResult
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "p-0",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <HiSearch className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Buscar en la Documentación</h2>
              </div>
            </ModalHeader>
            
            <ModalBody>
              {/* Campo de búsqueda */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                <Input
                  autoFocus
                  placeholder="Escribe para buscar en títulos, contenido, descripciones y etiquetas..."
                  value={modalSearchTerm}
                  onValueChange={setModalSearchTerm}
                  startContent={
                    searching ? (
                      <Spinner size="sm" className="w-4 h-4" />
                    ) : (
                      <HiSearch className="text-gray-400 w-5 h-5" />
                    )
                  }
                  endContent={
                    modalSearchTerm && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setModalSearchTerm("")}
                      >
                        <HiX className="w-4 h-4" />
                      </Button>
                    )
                  }
                  size="lg"
                  variant="bordered"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "h-12"
                  }}
                />
                
                {/* Contador de resultados */}
                {modalSearchTerm && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searching ? (
                        <span className="flex items-center gap-2">
                          <Spinner size="sm" />
                          Buscando...
                        </span>
                      ) : searchResults.length > 0 ? (
                        <span className="flex items-center gap-2">
                          <Chip size="sm" color="success" variant="flat">
                            {searchResults.length}
                          </Chip>
                          resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">
                          No se encontraron resultados
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Resultados */}
              <div className="p-4">
                {!modalSearchTerm ? (
                  /* Estado inicial - sin búsqueda */
                  <div className="text-center py-12">
                    <HiSearch className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Busca en toda la documentación
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Escribe cualquier término y encontraremos todas las coincidencias en títulos, 
                      contenidos, descripciones y etiquetas.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <Chip size="sm" variant="flat">💡 Ejemplos:</Chip>
                      <Chip 
                        size="sm" 
                        variant="bordered" 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setModalSearchTerm("tarifa")}
                      >
                        tarifa
                      </Chip>
                      <Chip 
                        size="sm" 
                        variant="bordered"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setModalSearchTerm("medidor")}
                      >
                        medidor
                      </Chip>
                      <Chip 
                        size="sm" 
                        variant="bordered"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setModalSearchTerm("pago")}
                      >
                        pago
                      </Chip>
                    </div>
                  </div>
                ) : searchResults.length === 0 && !searching ? (
                  /* Sin resultados */
                  <div className="text-center py-12">
                    <HiQuestionMarkCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      No hay documentos que contengan "<strong>{modalSearchTerm}</strong>". 
                      Intenta con otros términos.
                    </p>
                  </div>
                ) : (
                  /* Lista de resultados */
                  <div className="space-y-3">
                    {searchResults.map((result, index) => {
                      const sectionConfig = sectionIcons[result.sectionKey];
                      
                      return (
                        <Card 
                          key={`${result.sectionKey}-${result.fileName}-${index}`}
                          isPressable
                          onPress={() => handleSelectResult(result.sectionKey, result.fileName)}
                          className="hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <CardBody className="p-4">
                            {/* Header del resultado */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`p-2 rounded-lg bg-${sectionConfig?.color}-100 dark:bg-${sectionConfig?.color}-900/20`}>
                                {sectionConfig?.icon || <HiDocument className="w-5 h-5" />}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* Título del documento */}
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                  <HighlightText 
                                    text={result.metadata?.titulo || result.fileName.replace('.md', '')}
                                    highlight={modalSearchTerm}
                                  />
                                </h4>
                                
                                {/* Breadcrumb de sección */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">{sectionConfig?.title || result.sectionKey}</span>
                                  <span>•</span>
                                  <Chip size="sm" variant="flat" color={sectionConfig?.color || "default"}>
                                    Relevancia: {result.score}
                                  </Chip>
                                </div>
                              </div>
                            </div>

                            {/* Extractos de coincidencias */}
                            {result.matches && result.matches.length > 0 && (
                              <div className="space-y-2 pl-11">
                                {result.matches.slice(0, 4).map((match, idx) => (
                                  <div 
                                    key={idx}
                                    className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-3 border-yellow-400"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex-shrink-0">
                                        {match.type === 'titulo' && '📌 Título'}
                                        {match.type === 'descripcion' && '📝 Descripción'}
                                        {match.type === 'tags' && '🏷️ Etiqueta'}
                                        {match.type === 'contenido' && '📄 Contenido'}
                                      </span>
                                      <p className="text-gray-700 dark:text-gray-300 flex-1 line-clamp-2">
                                        <HighlightText text={match.text} highlight={modalSearchTerm} />
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                
                                {result.matches.length > 4 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                                    + {result.matches.length - 4} coincidencia{result.matches.length - 4 !== 1 ? 's' : ''} más
                                  </p>
                                )}
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ModalBody>
            
            <ModalFooter className="border-t border-gray-200 dark:border-gray-700">
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});

SearchModal.displayName = 'SearchModal';

export default SearchModal;
