import React, { useRef, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les appels asynchrones de manière sûre
 * Évite les mises à jour d'état sur des composants démontés
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  // Cleanup au démontage
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  const safeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      const result = await asyncFn();
      if (isMountedRef.current && onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error) {
      if (isMountedRef.current && onError) {
        onError(error as Error);
      }
      return null;
    }
  }, []);

  return { safeSetState, safeAsync, isMounted: () => isMountedRef.current };
}