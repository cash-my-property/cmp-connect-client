import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: 'var(--cmp-bg)',
            color: 'var(--cmp-text)'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              background: 'var(--cmp-surface)',
              border: '1px solid var(--cmp-border)',
              boxShadow: 'var(--cmp-shadow-md)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(179,38,30,0.1)',
                color: 'var(--cmp-danger)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px'
              }}
            >
              <AlertCircle size={24} />
            </div>

            <h2 style={{ fontSize: '20px', margin: '0 0 8px', fontWeight: 700 }}>
              Something went wrong loading this view
            </h2>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>

            {this.state.errorInfo && (
              <details
                style={{
                  textAlign: 'start',
                  background: 'var(--cmp-surface-sunken)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  color: 'var(--cmp-text-faint)',
                  overflowX: 'auto',
                  maxHeight: '160px'
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Stack Details</summary>
                <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="row" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={this.handleReload}
                style={{ gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>Reload view</span>
              </button>
              <a
                href="/"
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', textDecoration: 'none' }}
              >
                <Home size={14} />
                <span>Back to Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
