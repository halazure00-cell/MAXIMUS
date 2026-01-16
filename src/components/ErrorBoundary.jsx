import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ui-background text-ui-text flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-ui-xl border border-ui-border bg-ui-surface p-6">
            <div className="text-lg font-bold mb-2">Aplikasi mengalami gangguan</div>
            <div className="text-sm text-ui-muted mb-4">
              Coba muat ulang. Jika sering terjadi, biasanya karena konfigurasi atau data yang belum siap.
            </div>
            <button
              className="w-full py-3 rounded-ui-lg bg-ui-primary text-ui-background font-bold"
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
