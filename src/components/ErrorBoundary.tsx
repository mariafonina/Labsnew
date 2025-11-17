import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Можно отправить ошибку в сервис мониторинга
    if (process.env.NODE_ENV === 'production') {
      // Отправка ошибки в лог-сервис
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.toString(),
            errorInfo: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        }).catch(() => {
          // Игнорируем ошибки отправки логов
        });
      } catch (e) {
        // Игнорируем ошибки
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Произошла ошибка</h1>
                <p className="text-gray-600 mt-1">
                  Приложение столкнулось с неожиданной ошибкой
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h2 className="font-semibold text-red-900 mb-2">Детали ошибки:</h2>
                <pre className="text-sm text-red-800 overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="bg-pink-500 hover:bg-pink-600">
                Вернуться на главную
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Перезагрузить страницу
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

