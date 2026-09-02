import { useEffect, useRef } from 'react';
import { useApp } from './AppContext';

export function Logo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      SC
    </span>
  );
}

export function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <p>⚠ {message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed'
};

export function Badge({ status, count }) {
  if (typeof count === 'number') {
    if (count <= 0) return null;
    return <span className="badge badge-count">{count > 99 ? '99+' : count}</span>;
  }
  return <span className={`badge badge-status badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function Toast() {
  const { toast, clearToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.kind}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

export function Modal({ title, isOpen, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
