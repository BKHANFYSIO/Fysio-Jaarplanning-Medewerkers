import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isFirebaseError = this.state.error?.message?.includes('Firebase') || 
                             this.state.error?.message?.includes('IndexedDB') ||
                             this.state.error?.message?.includes('Remote Config');

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Er is een fout opgetreden</h1>
            
            {isFirebaseError ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Er is een probleem met de browser opslag. Dit kan gebeuren door:
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-4">
                  <li>• Browser privacy instellingen</li>
                  <li>• Ad blockers of privacy extensies</li>
                  <li>• Incognito/private browsing mode</li>
                  <li>• Browser beperkingen</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  Probeer een van de volgende oplossingen:
                </p>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'Er is een onbekende fout opgetreden'}
              </p>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Probeer opnieuw
              </button>
              
              {isFirebaseError && (
                <button 
                  onClick={() => {
                    // Clear localStorage and reload
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }} 
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Wis browser opslag en herlaad
                </button>
              )}
              
              <button 
                onClick={() => window.location.href = '/admin'} 
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Ga naar Admin
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
