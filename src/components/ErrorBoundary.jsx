import React from "react";
import { Copy, RefreshCw, MessageCircle } from "lucide-react";
import { classifyError, getDiagnosticsSnapshot, buildBugReportMessage, openWhatsAppReport } from "../lib/diagnostics";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false,
      errorClassified: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI crash:", error, errorInfo);
    
    // Classify the error
    const classified = classifyError(error);
    
    this.setState({ 
      errorInfo,
      errorClassified: classified,
    });
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
      // Fallback: try to select text in a textarea
      alert('Gagal menyalin. Coba screenshot layar ini.');
    });
  };

  copyDiagnostics = async () => {
    try {
      const { error, errorClassified } = this.state;
      
      const snapshot = await getDiagnosticsSnapshot({
        route: window.location.pathname,
        syncState: {},
        settingsSummary: {},
      });
      
      // Add error details to snapshot
      snapshot.crashError = {
        message: error?.message,
        code: errorClassified?.code,
        type: errorClassified?.type,
        stack: error?.stack?.substring(0, 500), // Truncate
      };
      
      const jsonText = JSON.stringify(snapshot, null, 2);
      
      await navigator.clipboard.writeText(jsonText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy diagnostics:', err);
      alert('Gagal menyalin diagnostics. Coba screenshot layar ini.');
    }
  };

  sendWhatsAppReport = async () => {
    try {
      const { error, errorClassified } = this.state;
      
      const snapshot = await getDiagnosticsSnapshot({
        route: window.location.pathname,
        syncState: {},
        settingsSummary: {},
      });
      
      // Add error details
      snapshot.crashError = {
        message: error?.message,
        code: errorClassified?.code,
        type: errorClassified?.type,
        messageShort: errorClassified?.messageShort,
      };
      
      const message = buildBugReportMessage(snapshot);
      openWhatsAppReport(message);
    } catch (err) {
      console.error('Failed to send WhatsApp report:', err);
      alert('Gagal membuka WhatsApp. Coba salin diagnostics manual.');
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorClassified } = this.state;
      const isDev = import.meta.env.MODE === 'development';
      
      return (
        <div className="min-h-screen bg-ui-background text-ui-text flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-ui-xl border border-ui-border bg-ui-surface p-6 shadow-ui-lg">
            <div className="text-lg font-bold mb-2 text-ui-danger">Aplikasi mengalami gangguan</div>
            
            {errorClassified && (
              <div className="mb-3 p-2 bg-ui-warning/10 rounded-ui-lg border border-ui-warning/30">
                <div className="text-xs font-semibold text-ui-warning mb-1">Kode Error: {errorClassified.code}</div>
                <div className="text-xs text-ui-muted">{errorClassified.messageShort}</div>
              </div>
            )}
            
            <div className="text-sm text-ui-muted mb-4">
              Coba muat ulang. Jika sering terjadi, laporkan via WhatsApp atau salin diagnostics.
            </div>
            
            {isDev && error && (
              <div className="mb-4 p-3 bg-ui-surface-muted rounded-ui-lg text-xs font-mono text-ui-text overflow-auto max-h-32">
                <div className="font-bold mb-1 text-ui-danger">Error (Dev Mode):</div>
                <div className="text-ui-danger">{error.message || 'Unknown error'}</div>
                {error.stack && (
                  <div className="mt-2 text-ui-muted text-[10px]">{error.stack.substring(0, 300)}</div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                className="w-full py-3 rounded-ui-lg bg-ui-primary text-ui-background font-bold flex items-center justify-center gap-2 hover:bg-ui-primary/90 press-effect"
                onClick={() => {
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

              <div className="flex gap-2">
                <button
                  className={`flex-1 px-3 py-3 rounded-ui-lg border font-semibold flex items-center justify-center gap-2 press-effect ${
                    this.state.copied 
                      ? 'bg-ui-success/10 border-ui-success text-ui-success' 
                      : 'bg-ui-surface border-ui-border text-ui-text hover:bg-ui-surface-muted'
                  }`}
                  onClick={this.copyDiagnostics}
                  title="Copy diagnostics untuk debugging"
                >
                  <Copy size={16} />
                  {this.state.copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  className="flex-1 px-3 py-3 rounded-ui-lg bg-ui-success/10 border border-ui-success text-ui-success font-semibold flex items-center justify-center gap-2 hover:bg-ui-success/20 press-effect"
                  onClick={this.sendWhatsAppReport}
                  title="Laporkan bug via WhatsApp"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
