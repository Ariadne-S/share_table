import { useCallback, useEffect, useMemo, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- generic must accept arbitrary function signatures */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const fnRef = useRef(fn);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  });

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debounced = useMemo(() => {
    const run = (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void fnRef.current(...args);
      }, delay);
    };
    run.cancel = cancel;
    return run as DebouncedFunction<T>;
  }, [delay, cancel]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return debounced;
}
