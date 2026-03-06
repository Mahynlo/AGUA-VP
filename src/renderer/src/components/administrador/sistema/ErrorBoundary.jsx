/**
 * ErrorBoundary — Captura errores de React y muestra fallback
 * en lugar de crashear toda la página en blanco.
 */

import { Component } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
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
        <Card className="m-4 border border-danger">
          <CardBody className="space-y-3">
            <h3 className="text-lg font-bold text-danger">
              Error en el componente
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {this.state.error?.message || "Error desconocido"}
            </p>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40">
              {this.state.errorInfo?.componentStack || "Sin stack trace"}
            </pre>
            <Button
              size="sm"
              color="primary"
              onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Reintentar
            </Button>
          </CardBody>
        </Card>
      );
    }
    return this.props.children;
  }
}
