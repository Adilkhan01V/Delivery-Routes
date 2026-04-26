import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Toast = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color="#10b981" />;
      case 'error': return <XCircle size={20} color="#ef4444" />;
      case 'warning': return <AlertCircle size={20} color="#f59e0b" />;
      default: return null;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {getIcon(toast.type)}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
