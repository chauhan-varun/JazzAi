import { useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

const toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

export function useToast() {
  const [, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, type = 'info' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, title, description, type };
    
    toasts.push(newToast);
    listeners.forEach(listener => listener([...toasts]));

    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        listeners.forEach(listener => listener([...toasts]));
      }
    }, 3000);
  };

  return { toast };
}

