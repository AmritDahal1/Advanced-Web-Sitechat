import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic async data-loading hook.
 * Wraps any async function with standard loading / error / data state,
 * and exposes a `refetch` function so components can re-trigger the load
 * (e.g. after a mutation) without duplicating boilerplate.
 */
export function useFetch(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const requestId = useRef(0);

  const run = useCallback(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    asyncFn()
      .then((result) => {
        if (isMounted.current && currentRequest === requestId.current) setData(result);
      })
      .catch((err) => {
        if (isMounted.current && currentRequest === requestId.current) {
          setError(err.message || 'Something went wrong.');
        }
      })
      .finally(() => {
        if (isMounted.current && currentRequest === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    run();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}
