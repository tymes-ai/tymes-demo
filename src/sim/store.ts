import {useSyncExternalStore} from 'react';
import {type DemoState, initialState, stampLog} from './engine';

const KEY = 'tymes-demo-v3';

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // Private mode or a broken value: start clean.
  }
  return initialState();
}

let state = load();
const listeners = new Set<() => void>();

function publish(next: DemoState): void {
  stampLog(next);
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // The demo still works for this tab without saving.
  }
  listeners.forEach(listener => listener());
}

/** Run a change on a copy of the state, then publish it. */
export function update(change: (draft: DemoState) => void): void {
  const draft = structuredClone(state);
  change(draft);
  publish(draft);
}

export function replace(next: DemoState): void {
  publish(next);
}

export function reset(): void {
  publish(initialState());
}

export function getState(): DemoState {
  return state;
}

export function useDemo(): DemoState {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
