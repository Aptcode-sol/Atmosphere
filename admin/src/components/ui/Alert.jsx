import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import './Alert.css';

const Alert = ({
    type = 'info', // 'success', 'error', 'warning', 'info'
    title,
    message,
    isOpen,
    onClose,
    autoClose = true,
    duration = 4000,
    actions = null // Optional: [{ label: 'OK', onClick: fn }, { label: 'Cancel', onClick: fn, variant: 'secondary' }]
}) => {
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        setVisible(isOpen);
        if (isOpen && autoClose && !actions) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, duration, actions]);

    const handleClose = () => {
        setVisible(false);
        if (onClose) onClose();
    };

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={24} />;
            case 'error':
                return <XCircle size={24} />;
            case 'warning':
                return <AlertTriangle size={24} />;
            default:
                return <Info size={24} />;
        }
    };

    return (
        <div className="alert-overlay" onClick={handleClose}>
            <div className={`alert-modal alert-${type}`} onClick={(e) => e.stopPropagation()}>
                <button className="alert-close" onClick={handleClose}>
                    <X size={18} />
                </button>
                <div className="alert-icon">
                    {getIcon()}
                </div>
                {title && <h3 className="alert-title">{title}</h3>}
                {message && <p className="alert-message">{message}</p>}
                {actions && (
                    <div className="alert-actions">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                className={`alert-btn ${action.variant === 'secondary' ? 'alert-btn-secondary' : 'alert-btn-primary'}`}
                                onClick={() => {
                                    if (action.onClick) action.onClick();
                                    handleClose();
                                }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Hook for easier usage
export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        actions: null,
    });

    const showAlert = (options) => {
        setAlertState({
            isOpen: true,
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            actions: options.actions || null,
        });
    };

    const hideAlert = () => {
        setAlertState({ ...alertState, isOpen: false });
    };

    const success = (title, message) => showAlert({ type: 'success', title, message });
    const error = (title, message) => showAlert({ type: 'error', title, message });
    const warning = (title, message) => showAlert({ type: 'warning', title, message });
    const info = (title, message) => showAlert({ type: 'info', title, message });
    const confirm = (title, message, onConfirm) => showAlert({
        type: 'warning',
        title,
        message,
        actions: [
            { label: 'Cancel', variant: 'secondary' },
            { label: 'Confirm', onClick: onConfirm },
        ],
    });

    return {
        alertState,
        showAlert,
        hideAlert,
        success,
        error,
        warning,
        info,
        confirm,
    };
};

export default Alert;
