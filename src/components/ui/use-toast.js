import { useState, useEffect, useCallback } from 'react';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 3000;

let count = 0;
const genId = () => `toast-${++count}`;

let listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'DISMISS_TOAST':
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t
        ),
      };
    case 'REMOVE_TOAST':
      return { toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

export function toast({ title, description, variant = 'default', duration = TOAST_REMOVE_DELAY }) {
  const id = genId();
  dispatch({ type: 'ADD_TOAST', toast: { id, title, description, variant, open: true, duration } });
  setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), duration);
  setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId: id }), duration + 300);
  return id;
}

export function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id) => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
  };
}
