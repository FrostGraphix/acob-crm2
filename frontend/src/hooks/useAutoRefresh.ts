import { useEffect, useRef } from 'react';

/**
 * useAutoRefresh — triggers a callback at a regular interval.
 * Default: 5 minutes (300 000 ms).
 *
 * Usage:
 *   useAutoRefresh(fetchData);            // 5-minute default
 *   useAutoRefresh(fetchData, 60_000);    // every 1 minute
 *
 * The callback is NOT called on mount — only on subsequent intervals.
 * The interval resets whenever `callback` changes.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 5 * 60 * 1000) {
    const savedCallback = useRef(callback);

    // Keep latest callback in ref
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        const id = setInterval(() => savedCallback.current(), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
}
