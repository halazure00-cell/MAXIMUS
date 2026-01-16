import React from "react";
import { Copy, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI crash:", error, errorInfo);
    this.setState({ errorInfo });
  }

  copyErrorInfo = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
Route: ${window.location.pathname}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Online: ${navigator.onLine}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch((err) => {
      console.error('Failed to copy error info:', err);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ui-background text-ui-text flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-ui-xl border border-ui-border bg-ui-surface p-6 shadow-ui-lg">
            <div className="text-lg font-bold mb-2 text-ui-danger">Aplikasi mengalami gangguan</div>
            <div className="text-sm text-ui-muted mb-4">
              Coba muat ulang. Jika sering terjadi, biasanya karena konfigurasi atau data yang belum siap.
            </div>
            
            {this.state.error && (
              <div className="mb-4 p-3 bg-ui-surface-muted rounded-ui-lg text-xs font-mono text-ui-text overflow-auto max-h-32">
                <div className="font-bold mb-1">Error:</div>
                <div className="text-ui-danger">{this.state.error.message || 'Unknown error'}</div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 py-3 rounded-ui-lg bg-ui-primary text-ui-background font-bold flex items-center justify-center gap-2 hover:bg-ui-primary/90 press-effect"
                onClick={() => {
                  // Try to navigate home first, fallback to full reload
                  try {
                    window.history.pushState({}, '', '/');
                    window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }}
              >
                <RefreshCw size={16} />
                Muat Ulang
              </button>

              <button
                className={`px-4 py-3 rounded-ui-lg border font-semibold flex items-center justify-center gap-2 press-effect ${
                  this.state.copied 
                    ? 'bg-ui-success/10 border-ui-success text-ui-success' 
                    : 'bg-ui-surface border-ui-border text-ui-text hover:bg-ui-surface-muted'
                }`}
                onClick={this.copyErrorInfo}
                title="Copy error info for debugging"
              >
                <Copy size={16} />
                {this.state.copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
