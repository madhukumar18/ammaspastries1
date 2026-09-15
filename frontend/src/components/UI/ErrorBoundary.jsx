import React from 'react';
import { RefreshCw, AlertCircle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <span className="text-3xl">🍰</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-chocolate">
                Fresh Cake in the Oven
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Something took a moment to load while icing this page. A quick refresh will get you right back to our fresh baked goods!
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="text-left bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-800 font-mono overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 text-chocolate border border-amber-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
