/**
 * ErrorBoundary — Captura errores de React y muestra fallback amigable
 * en lugar de crashear toda la página en blanco.
 */

import { Component } from "react";
import { Button } from "@nextui-org/react";
import { HiExclamationCircle, HiChevronDown, HiChevronUp } from "react-icons/hi";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetail: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl shrink-0 mt-0.5">
              <HiExclamationCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-red-700 dark:text-red-300 leading-tight">
                Este panel no pudo cargarse
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Ocurrió un error interno. Puedes reintentar o contactar al administrador si el problema persiste.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => this.setState({ hasError: false, error: null, errorInfo: null, showDetail: false })}
                >
                  Reintentar
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  className="text-red-500 dark:text-red-400"
                  endContent={this.state.showDetail
                    ? <HiChevronUp className="w-4 h-4" />
                    : <HiChevronDown className="w-4 h-4" />
                  }
                  onPress={() => this.setState((s) => ({ showDetail: !s.showDetail }))}
                >
                  {this.state.showDetail ? "Ocultar detalle" : "Ver detalle técnico"}
                </Button>
              </div>

              {this.state.showDetail && (
                <div className="mt-3 rounded-xl overflow-hidden border border-red-200 dark:border-red-800">
                  <div className="bg-red-100 dark:bg-red-900/40 px-3 py-1.5">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Detalle del error
                    </span>
                  </div>
                  <pre className="text-xs text-red-700 dark:text-red-300 bg-white dark:bg-zinc-900 p-3 overflow-auto max-h-48 leading-relaxed">
                    {this.state.error?.message || "Error desconocido"}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack || ""}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
