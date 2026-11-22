import { useCallback, useRef, useState } from 'react';

/** Verrou anti-double-clic sur une soumission critique (checkout, troc, publication). */
export function useSubmitLock() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async (fn) => {
    if (locked.current) return undefined;
    locked.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      locked.current = false;
      setPending(false);
    }
  }, []);

  return { run, pending };
}
