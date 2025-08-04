import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Custom hook to replace window.alert() with a nicer UI dialog
 * Returns an object with showAlert function and AlertComponent to render
 */
export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    isConfirm: false,
    onConfirm: null,
  });

  const showAlert = (message, title = 'Alert', type = 'info') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      isConfirm: false,
      onConfirm: null,
    });
  };

  const showConfirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setAlertConfig({
        isOpen: true,
        title,
        message,
        type: 'warning',
        isConfirm: true,
        onConfirm: resolve,
      });
    });
  };

  const hideAlert = () => {
    setAlertConfig(prevConfig => ({
      ...prevConfig,
      isOpen: false,
    }));
  };

  const handleConfirm = (result) => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm(result);
    }
    hideAlert();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const AlertComponent = () => (
    <AlertDialog open={alertConfig.isOpen} onOpenChange={hideAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>{getIcon(alertConfig.type)}</span>
            {alertConfig.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alertConfig.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertConfig.isConfirm ? (
            <>
              <AlertDialogCancel onClick={() => handleConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleConfirm(true)}>
                Confirm
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={hideAlert}>
              OK
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    showAlert,
    showConfirm,
    AlertComponent,
  };
};

/**
 * Convenience functions for different alert types
 */
export const useAlertTypes = () => {
  const { showAlert, showConfirm, AlertComponent } = useAlert();

  return {
    showInfo: (message, title = 'Information') => showAlert(message, title, 'info'),
    showSuccess: (message, title = 'Success') => showAlert(message, title, 'success'),
    showWarning: (message, title = 'Warning') => showAlert(message, title, 'warning'),
    showError: (message, title = 'Error') => showAlert(message, title, 'error'),
    showConfirm,
    AlertComponent,
  };
};